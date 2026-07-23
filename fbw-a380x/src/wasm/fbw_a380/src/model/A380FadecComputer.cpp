#include "A380FadecComputer.h"
#include "A380FadecComputer_types.h"
#include "rtwtypes.h"
#include <cmath>

const base_arinc_429 A380FadecComputer_rtZbase_arinc_429{
  0U,
  0.0F
};

void A380FadecComputer::A380FadecComputer_MATLABFunction(const base_arinc_429 *rtu_u, boolean_T *rty_y)
{
  *rty_y = (rtu_u->SSM == static_cast<uint32_T>(SignStatusMatrix::NormalOperation));
}

void A380FadecComputer::A380FadecComputer_MATLABFunction_p(const base_arinc_429 *rtu_u, real32_T rtu_default, real32_T
  *rty_y)
{
  if (rtu_u->SSM == static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) {
    *rty_y = rtu_u->Data;
  } else {
    *rty_y = rtu_default;
  }
}

void A380FadecComputer::A380FadecComputer_TimeSinceCondition(real_T rtu_time, boolean_T rtu_condition, real_T *rty_y,
  rtDW_TimeSinceCondition_A380FadecComputer_T *localDW)
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

void A380FadecComputer::A380FadecComputer_MATLABFunction_g(const base_arinc_429 *rtu_u, real_T rtu_bit, uint32_T *rty_y)
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

void A380FadecComputer::A380FadecComputer_MATLABFunction_l(const boolean_T rtu_u[19], real32_T *rty_y)
{
  uint32_T out;
  out = 0U;
  for (int32_T i{0}; i < 19; i++) {
    out |= static_cast<uint32_T>(rtu_u[i]) << (i + 10);
  }

  *rty_y = static_cast<real32_T>(out);
}

void A380FadecComputer::A380FadecComputer_MATLABFunction_f(boolean_T rtu_u, boolean_T rtu_isRisingEdge, boolean_T *rty_y,
  rtDW_MATLABFunction_A380FadecComputer_m_T *localDW)
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

void A380FadecComputer::A380FadecComputer_MATLABFunction_o(const base_arinc_429 *rtu_u, boolean_T *rty_y)
{
  *rty_y = (rtu_u->SSM != static_cast<uint32_T>(SignStatusMatrix::FailureWarning));
}

void A380FadecComputer::step()
{
  const base_arinc_429 *rtb_BusAssignment_o_prim_input_fg_ats_discrete_word;
  base_arinc_429 rtb_BusAssignment_e_prim_input_fg_n1_command_percent;
  real_T N1_begin;
  real_T N1_end;
  real_T rtb_N1c;
  real_T rtb_Sum;
  real_T rtb_Switch;
  real_T rtb_Switch2_idx_1;
  int32_T TLA_begin;
  int32_T TLA_end;
  real32_T rtb_BusAssignment_b_prim_input_fg_discrete_word_7_Data;
  real32_T rtb_aileron_status_word_Data;
  real32_T rtb_ats_fma_discrete_word_Data;
  real32_T rtb_discrete_status_word_1_Data;
  real32_T rtb_discrete_word_1_k_Data;
  real32_T rtb_discrete_word_2_Data;
  real32_T rtb_discrete_word_3_Data;
  real32_T rtb_discrete_word_4_Data;
  real32_T rtb_discrete_word_5_Data;
  real32_T rtb_discrete_word_6_Data;
  real32_T rtb_elevator_1_position_deg_Data;
  real32_T rtb_elevator_2_position_deg_Data;
  real32_T rtb_elevator_3_position_deg_Data;
  real32_T rtb_elevator_status_word_Data;
  real32_T rtb_fctl_law_status_word_Data;
  real32_T rtb_fctl_v_alpha_stall_warn_kn_Data;
  real32_T rtb_fe_discrete_word_1_Data;
  real32_T rtb_flx_to_temp_deg_c_Data;
  real32_T rtb_fm_alt_constraint_ft_Data;
  real32_T rtb_gamma_a_deg_Data;
  real32_T rtb_gamma_t_deg_Data;
  real32_T rtb_high_target_speed_margin_kts_Data;
  real32_T rtb_left_aileron_1_position_deg_Data;
  real32_T rtb_left_aileron_2_position_deg_Data;
  real32_T rtb_left_inboard_aileron_command_deg_Data;
  real32_T rtb_left_inboard_elevator_command_deg_Data;
  real32_T rtb_left_midboard_aileron_command_deg_Data;
  real32_T rtb_left_outboard_aileron_command_deg_Data;
  real32_T rtb_left_outboard_elevator_command_deg_Data;
  real32_T rtb_left_sidestick_pitch_command_deg_Data;
  real32_T rtb_left_sidestick_roll_command_deg_Data;
  real32_T rtb_left_spoiler_1_command_deg_Data;
  real32_T rtb_left_spoiler_2_command_deg_Data;
  real32_T rtb_left_spoiler_3_command_deg_Data;
  real32_T rtb_left_spoiler_4_command_deg_Data;
  real32_T rtb_left_spoiler_5_command_deg_Data;
  real32_T rtb_left_spoiler_6_command_deg_Data;
  real32_T rtb_left_spoiler_7_command_deg_Data;
  real32_T rtb_left_spoiler_8_command_deg_Data;
  real32_T rtb_left_spoiler_position_deg_Data;
  real32_T rtb_low_target_speed_margin_kts_Data;
  real32_T rtb_lower_rudder_command_deg_Data;
  real32_T rtb_n1_command_percent_Data;
  real32_T rtb_nosewheel_cmd_deg_Data;
  real32_T rtb_pfd_short_term_mngd_spd_kts_Data;
  real32_T rtb_pfd_spd_tgt_kts_Data;
  real32_T rtb_pitch_fd_command_1_Data;
  real32_T rtb_pitch_fd_command_2_Data;
  real32_T rtb_preset_mach_from_fms_Data;
  real32_T rtb_preset_speed_from_fms_kts_Data;
  real32_T rtb_radio_height_1_ft_Data;
  real32_T rtb_radio_height_2_ft_Data;
  real32_T rtb_right_aileron_1_position_deg_Data;
  real32_T rtb_right_aileron_2_position_deg_Data;
  real32_T rtb_right_inboard_aileron_command_deg_Data;
  real32_T rtb_right_inboard_elevator_command_deg_Data;
  real32_T rtb_right_midboard_aileron_command_deg_Data;
  real32_T rtb_right_outboard_aileron_command_deg_Data;
  real32_T rtb_right_outboard_elevator_command_deg_Data;
  real32_T rtb_right_sidestick_pitch_command_deg_Data;
  real32_T rtb_right_sidestick_roll_command_deg_Data;
  real32_T rtb_right_spoiler_1_command_deg_Data;
  real32_T rtb_right_spoiler_2_command_deg_Data;
  real32_T rtb_right_spoiler_3_command_deg_Data;
  real32_T rtb_right_spoiler_4_command_deg_Data;
  real32_T rtb_right_spoiler_5_command_deg_Data;
  real32_T rtb_right_spoiler_6_command_deg_Data;
  real32_T rtb_right_spoiler_7_command_deg_Data;
  real32_T rtb_right_spoiler_8_command_deg_Data;
  real32_T rtb_right_spoiler_position_deg_Data;
  real32_T rtb_roll_fd_command_1_Data;
  real32_T rtb_roll_fd_command_2_Data;
  real32_T rtb_rudder_1_position_deg_Data;
  real32_T rtb_rudder_2_position_deg_Data;
  real32_T rtb_rudder_pedal_position_deg_Data;
  real32_T rtb_rudder_status_word_Data;
  real32_T rtb_runway_hdg_memorized_deg_Data;
  real32_T rtb_selected_alt_ft_Data;
  real32_T rtb_selected_fpa_deg_Data;
  real32_T rtb_selected_hdg_deg_Data;
  real32_T rtb_selected_mach_kts_Data;
  real32_T rtb_selected_spd_kts_Data;
  real32_T rtb_selected_trk_deg_Data;
  real32_T rtb_selected_vs_ft_min_Data;
  real32_T rtb_sideslip_target_deg_Data;
  real32_T rtb_speed_trend_kn_Data;
  real32_T rtb_spoiler_status_word_Data;
  real32_T rtb_ths_command_deg_Data;
  real32_T rtb_ths_position_deg_Data;
  real32_T rtb_upper_rudder_command_deg_Data;
  real32_T rtb_v_3_kn_Data;
  real32_T rtb_v_4_kn_Data;
  real32_T rtb_v_alpha_lim_kn_Data;
  real32_T rtb_v_alpha_prot_kn_Data;
  real32_T rtb_v_fe_next_kn_Data;
  real32_T rtb_v_ls_kn_Data;
  real32_T rtb_v_man_kn_Data;
  real32_T rtb_v_max_kn_Data;
  real32_T rtb_v_stall_kn_Data;
  real32_T rtb_y_b;
  real32_T rtb_yaw_fd_command_1_Data;
  real32_T rtb_yaw_fd_command_2_Data;
  uint32_T rtb_BusAssignment_b_prim_input_fg_discrete_word_7_SSM;
  uint32_T rtb_aileron_status_word_SSM;
  uint32_T rtb_ats_fma_discrete_word_SSM;
  uint32_T rtb_discrete_status_word_1_SSM;
  uint32_T rtb_discrete_word_1_k_SSM;
  uint32_T rtb_discrete_word_2_SSM;
  uint32_T rtb_discrete_word_3_SSM;
  uint32_T rtb_discrete_word_4_SSM;
  uint32_T rtb_discrete_word_5_SSM;
  uint32_T rtb_discrete_word_6_SSM;
  uint32_T rtb_elevator_1_position_deg_SSM;
  uint32_T rtb_elevator_2_position_deg_SSM;
  uint32_T rtb_elevator_3_position_deg_SSM;
  uint32_T rtb_elevator_status_word_SSM;
  uint32_T rtb_fctl_law_status_word_SSM;
  uint32_T rtb_fctl_v_alpha_stall_warn_kn_SSM;
  uint32_T rtb_fe_discrete_word_1_SSM;
  uint32_T rtb_flx_to_temp_deg_c_SSM;
  uint32_T rtb_fm_alt_constraint_ft_SSM;
  uint32_T rtb_gamma_a_deg_SSM;
  uint32_T rtb_gamma_t_deg_SSM;
  uint32_T rtb_high_target_speed_margin_kts_SSM;
  uint32_T rtb_left_aileron_1_position_deg_SSM;
  uint32_T rtb_left_aileron_2_position_deg_SSM;
  uint32_T rtb_left_inboard_aileron_command_deg_SSM;
  uint32_T rtb_left_inboard_elevator_command_deg_SSM;
  uint32_T rtb_left_midboard_aileron_command_deg_SSM;
  uint32_T rtb_left_outboard_aileron_command_deg_SSM;
  uint32_T rtb_left_outboard_elevator_command_deg_SSM;
  uint32_T rtb_left_sidestick_pitch_command_deg_SSM;
  uint32_T rtb_left_sidestick_roll_command_deg_SSM;
  uint32_T rtb_left_spoiler_1_command_deg_SSM;
  uint32_T rtb_left_spoiler_2_command_deg_SSM;
  uint32_T rtb_left_spoiler_3_command_deg_SSM;
  uint32_T rtb_left_spoiler_4_command_deg_SSM;
  uint32_T rtb_left_spoiler_5_command_deg_SSM;
  uint32_T rtb_left_spoiler_6_command_deg_SSM;
  uint32_T rtb_left_spoiler_7_command_deg_SSM;
  uint32_T rtb_left_spoiler_8_command_deg_SSM;
  uint32_T rtb_left_spoiler_position_deg_SSM;
  uint32_T rtb_low_target_speed_margin_kts_SSM;
  uint32_T rtb_lower_rudder_command_deg_SSM;
  uint32_T rtb_n1_command_percent_SSM;
  uint32_T rtb_nosewheel_cmd_deg_SSM;
  uint32_T rtb_pfd_short_term_mngd_spd_kts_SSM;
  uint32_T rtb_pfd_spd_tgt_kts_SSM;
  uint32_T rtb_pitch_fd_command_1_SSM;
  uint32_T rtb_pitch_fd_command_2_SSM;
  uint32_T rtb_preset_mach_from_fms_SSM;
  uint32_T rtb_preset_speed_from_fms_kts_SSM;
  uint32_T rtb_radio_height_1_ft_SSM;
  uint32_T rtb_radio_height_2_ft_SSM;
  uint32_T rtb_right_aileron_1_position_deg_SSM;
  uint32_T rtb_right_aileron_2_position_deg_SSM;
  uint32_T rtb_right_inboard_aileron_command_deg_SSM;
  uint32_T rtb_right_inboard_elevator_command_deg_SSM;
  uint32_T rtb_right_midboard_aileron_command_deg_SSM;
  uint32_T rtb_right_outboard_aileron_command_deg_SSM;
  uint32_T rtb_right_outboard_elevator_command_deg_SSM;
  uint32_T rtb_right_sidestick_pitch_command_deg_SSM;
  uint32_T rtb_right_sidestick_roll_command_deg_SSM;
  uint32_T rtb_right_spoiler_1_command_deg_SSM;
  uint32_T rtb_right_spoiler_2_command_deg_SSM;
  uint32_T rtb_right_spoiler_3_command_deg_SSM;
  uint32_T rtb_right_spoiler_4_command_deg_SSM;
  uint32_T rtb_right_spoiler_5_command_deg_SSM;
  uint32_T rtb_right_spoiler_6_command_deg_SSM;
  uint32_T rtb_right_spoiler_7_command_deg_SSM;
  uint32_T rtb_right_spoiler_8_command_deg_SSM;
  uint32_T rtb_right_spoiler_position_deg_SSM;
  uint32_T rtb_roll_fd_command_1_SSM;
  uint32_T rtb_roll_fd_command_2_SSM;
  uint32_T rtb_rudder_1_position_deg_SSM;
  uint32_T rtb_rudder_2_position_deg_SSM;
  uint32_T rtb_rudder_pedal_position_deg_SSM;
  uint32_T rtb_rudder_status_word_SSM;
  uint32_T rtb_runway_hdg_memorized_deg_SSM;
  uint32_T rtb_selected_alt_ft_SSM;
  uint32_T rtb_selected_fpa_deg_SSM;
  uint32_T rtb_selected_hdg_deg_SSM;
  uint32_T rtb_selected_mach_kts_SSM;
  uint32_T rtb_selected_spd_kts_SSM;
  uint32_T rtb_selected_trk_deg_SSM;
  uint32_T rtb_selected_vs_ft_min_SSM;
  uint32_T rtb_sideslip_target_deg_SSM;
  uint32_T rtb_speed_trend_kn_SSM;
  uint32_T rtb_spoiler_status_word_SSM;
  uint32_T rtb_ths_command_deg_SSM;
  uint32_T rtb_ths_position_deg_SSM;
  uint32_T rtb_upper_rudder_command_deg_SSM;
  uint32_T rtb_v_3_kn_SSM;
  uint32_T rtb_v_4_kn_SSM;
  uint32_T rtb_v_alpha_lim_kn_SSM;
  uint32_T rtb_v_alpha_prot_kn_SSM;
  uint32_T rtb_v_fe_next_kn_SSM;
  uint32_T rtb_v_ls_kn_SSM;
  uint32_T rtb_v_man_kn_SSM;
  uint32_T rtb_v_max_kn_SSM;
  uint32_T rtb_v_stall_kn_SSM;
  uint32_T rtb_y_e;
  uint32_T rtb_y_ms;
  uint32_T rtb_y_pv;
  uint32_T rtb_yaw_fd_command_1_SSM;
  uint32_T rtb_yaw_fd_command_2_SSM;
  boolean_T rtb_VectorConcatenate[19];
  boolean_T rtb_AND;
  boolean_T rtb_BusAssignment_e_data_computed_TLA_in_active_range;
  boolean_T rtb_NOT1_f;
  boolean_T rtb_OR2;
  boolean_T rtb_y_mv;
  boolean_T rtb_y_o;
  athr_thrust_limit_type rtb_type;
  A380FadecComputer_MATLABFunction_g(&A380FadecComputer_U.in.prim_1.fctl.fctl_law_status_word,
    A380FadecComputer_P.BitfromLabel6_bit, &rtb_y_e);
  A380FadecComputer_MATLABFunction_o(&A380FadecComputer_U.in.prim_1.fctl.fctl_law_status_word, &rtb_y_mv);
  rtb_OR2 = ((rtb_y_e != 0U) && rtb_y_mv);
  A380FadecComputer_MATLABFunction_g(&A380FadecComputer_U.in.prim_2.fctl.fctl_law_status_word,
    A380FadecComputer_P.BitfromLabel7_bit, &rtb_y_e);
  A380FadecComputer_MATLABFunction_o(&A380FadecComputer_U.in.prim_2.fctl.fctl_law_status_word, &rtb_y_mv);
  if (rtb_OR2) {
    rtb_left_inboard_aileron_command_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.left_inboard_aileron_command_deg.SSM;
    rtb_left_inboard_aileron_command_deg_Data = A380FadecComputer_U.in.prim_1.fctl.left_inboard_aileron_command_deg.Data;
    rtb_right_inboard_aileron_command_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.right_inboard_aileron_command_deg.SSM;
    rtb_right_inboard_aileron_command_deg_Data =
      A380FadecComputer_U.in.prim_1.fctl.right_inboard_aileron_command_deg.Data;
    rtb_left_midboard_aileron_command_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.left_midboard_aileron_command_deg.SSM;
    rtb_left_midboard_aileron_command_deg_Data =
      A380FadecComputer_U.in.prim_1.fctl.left_midboard_aileron_command_deg.Data;
    rtb_right_midboard_aileron_command_deg_SSM =
      A380FadecComputer_U.in.prim_1.fctl.right_midboard_aileron_command_deg.SSM;
    rtb_right_midboard_aileron_command_deg_Data =
      A380FadecComputer_U.in.prim_1.fctl.right_midboard_aileron_command_deg.Data;
    rtb_left_outboard_aileron_command_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.left_outboard_aileron_command_deg.SSM;
    rtb_left_outboard_aileron_command_deg_Data =
      A380FadecComputer_U.in.prim_1.fctl.left_outboard_aileron_command_deg.Data;
    rtb_right_outboard_aileron_command_deg_SSM =
      A380FadecComputer_U.in.prim_1.fctl.right_outboard_aileron_command_deg.SSM;
    rtb_right_outboard_aileron_command_deg_Data =
      A380FadecComputer_U.in.prim_1.fctl.right_outboard_aileron_command_deg.Data;
    rtb_left_spoiler_1_command_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.left_spoiler_1_command_deg.SSM;
    rtb_left_spoiler_1_command_deg_Data = A380FadecComputer_U.in.prim_1.fctl.left_spoiler_1_command_deg.Data;
    rtb_right_spoiler_1_command_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.right_spoiler_1_command_deg.SSM;
    rtb_right_spoiler_1_command_deg_Data = A380FadecComputer_U.in.prim_1.fctl.right_spoiler_1_command_deg.Data;
    rtb_left_spoiler_2_command_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.left_spoiler_2_command_deg.SSM;
    rtb_left_spoiler_2_command_deg_Data = A380FadecComputer_U.in.prim_1.fctl.left_spoiler_2_command_deg.Data;
    rtb_right_spoiler_2_command_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.right_spoiler_2_command_deg.SSM;
    rtb_right_spoiler_2_command_deg_Data = A380FadecComputer_U.in.prim_1.fctl.right_spoiler_2_command_deg.Data;
    rtb_left_spoiler_3_command_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.left_spoiler_3_command_deg.SSM;
    rtb_left_spoiler_3_command_deg_Data = A380FadecComputer_U.in.prim_1.fctl.left_spoiler_3_command_deg.Data;
    rtb_right_spoiler_3_command_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.right_spoiler_3_command_deg.SSM;
    rtb_right_spoiler_3_command_deg_Data = A380FadecComputer_U.in.prim_1.fctl.right_spoiler_3_command_deg.Data;
    rtb_left_spoiler_4_command_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.left_spoiler_4_command_deg.SSM;
    rtb_left_spoiler_4_command_deg_Data = A380FadecComputer_U.in.prim_1.fctl.left_spoiler_4_command_deg.Data;
    rtb_right_spoiler_4_command_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.right_spoiler_4_command_deg.SSM;
    rtb_right_spoiler_4_command_deg_Data = A380FadecComputer_U.in.prim_1.fctl.right_spoiler_4_command_deg.Data;
    rtb_left_spoiler_5_command_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.left_spoiler_5_command_deg.SSM;
    rtb_left_spoiler_5_command_deg_Data = A380FadecComputer_U.in.prim_1.fctl.left_spoiler_5_command_deg.Data;
    rtb_right_spoiler_5_command_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.right_spoiler_5_command_deg.SSM;
    rtb_right_spoiler_5_command_deg_Data = A380FadecComputer_U.in.prim_1.fctl.right_spoiler_5_command_deg.Data;
    rtb_left_spoiler_6_command_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.left_spoiler_6_command_deg.SSM;
    rtb_left_spoiler_6_command_deg_Data = A380FadecComputer_U.in.prim_1.fctl.left_spoiler_6_command_deg.Data;
    rtb_right_spoiler_6_command_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.right_spoiler_6_command_deg.SSM;
    rtb_right_spoiler_6_command_deg_Data = A380FadecComputer_U.in.prim_1.fctl.right_spoiler_6_command_deg.Data;
    rtb_left_spoiler_7_command_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.left_spoiler_7_command_deg.SSM;
    rtb_left_spoiler_7_command_deg_Data = A380FadecComputer_U.in.prim_1.fctl.left_spoiler_7_command_deg.Data;
    rtb_right_spoiler_7_command_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.right_spoiler_7_command_deg.SSM;
    rtb_right_spoiler_7_command_deg_Data = A380FadecComputer_U.in.prim_1.fctl.right_spoiler_7_command_deg.Data;
    rtb_left_spoiler_8_command_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.left_spoiler_8_command_deg.SSM;
    rtb_left_spoiler_8_command_deg_Data = A380FadecComputer_U.in.prim_1.fctl.left_spoiler_8_command_deg.Data;
    rtb_right_spoiler_8_command_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.right_spoiler_8_command_deg.SSM;
    rtb_right_spoiler_8_command_deg_Data = A380FadecComputer_U.in.prim_1.fctl.right_spoiler_8_command_deg.Data;
    rtb_left_inboard_elevator_command_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.left_inboard_elevator_command_deg.SSM;
    rtb_left_inboard_elevator_command_deg_Data =
      A380FadecComputer_U.in.prim_1.fctl.left_inboard_elevator_command_deg.Data;
    rtb_right_inboard_elevator_command_deg_SSM =
      A380FadecComputer_U.in.prim_1.fctl.right_inboard_elevator_command_deg.SSM;
    rtb_right_inboard_elevator_command_deg_Data =
      A380FadecComputer_U.in.prim_1.fctl.right_inboard_elevator_command_deg.Data;
    rtb_left_outboard_elevator_command_deg_SSM =
      A380FadecComputer_U.in.prim_1.fctl.left_outboard_elevator_command_deg.SSM;
    rtb_left_outboard_elevator_command_deg_Data =
      A380FadecComputer_U.in.prim_1.fctl.left_outboard_elevator_command_deg.Data;
    rtb_right_outboard_elevator_command_deg_SSM =
      A380FadecComputer_U.in.prim_1.fctl.right_outboard_elevator_command_deg.SSM;
    rtb_right_outboard_elevator_command_deg_Data =
      A380FadecComputer_U.in.prim_1.fctl.right_outboard_elevator_command_deg.Data;
    rtb_ths_command_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.ths_command_deg.SSM;
    rtb_ths_command_deg_Data = A380FadecComputer_U.in.prim_1.fctl.ths_command_deg.Data;
    rtb_upper_rudder_command_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.upper_rudder_command_deg.SSM;
    rtb_upper_rudder_command_deg_Data = A380FadecComputer_U.in.prim_1.fctl.upper_rudder_command_deg.Data;
    rtb_lower_rudder_command_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.lower_rudder_command_deg.SSM;
    rtb_lower_rudder_command_deg_Data = A380FadecComputer_U.in.prim_1.fctl.lower_rudder_command_deg.Data;
    rtb_left_sidestick_pitch_command_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.left_sidestick_pitch_command_deg.SSM;
    rtb_left_sidestick_pitch_command_deg_Data = A380FadecComputer_U.in.prim_1.fctl.left_sidestick_pitch_command_deg.Data;
    rtb_right_sidestick_pitch_command_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.right_sidestick_pitch_command_deg.SSM;
    rtb_right_sidestick_pitch_command_deg_Data =
      A380FadecComputer_U.in.prim_1.fctl.right_sidestick_pitch_command_deg.Data;
    rtb_left_sidestick_roll_command_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.left_sidestick_roll_command_deg.SSM;
    rtb_left_sidestick_roll_command_deg_Data = A380FadecComputer_U.in.prim_1.fctl.left_sidestick_roll_command_deg.Data;
    rtb_right_sidestick_roll_command_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.right_sidestick_roll_command_deg.SSM;
    rtb_right_sidestick_roll_command_deg_Data = A380FadecComputer_U.in.prim_1.fctl.right_sidestick_roll_command_deg.Data;
    rtb_rudder_pedal_position_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.rudder_pedal_position_deg.SSM;
    rtb_rudder_pedal_position_deg_Data = A380FadecComputer_U.in.prim_1.fctl.rudder_pedal_position_deg.Data;
    rtb_aileron_status_word_SSM = A380FadecComputer_U.in.prim_1.fctl.aileron_status_word.SSM;
    rtb_aileron_status_word_Data = A380FadecComputer_U.in.prim_1.fctl.aileron_status_word.Data;
    rtb_left_aileron_1_position_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.left_aileron_1_position_deg.SSM;
    rtb_left_aileron_1_position_deg_Data = A380FadecComputer_U.in.prim_1.fctl.left_aileron_1_position_deg.Data;
    rtb_left_aileron_2_position_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.left_aileron_2_position_deg.SSM;
    rtb_left_aileron_2_position_deg_Data = A380FadecComputer_U.in.prim_1.fctl.left_aileron_2_position_deg.Data;
    rtb_right_aileron_1_position_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.right_aileron_1_position_deg.SSM;
    rtb_right_aileron_1_position_deg_Data = A380FadecComputer_U.in.prim_1.fctl.right_aileron_1_position_deg.Data;
    rtb_right_aileron_2_position_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.right_aileron_2_position_deg.SSM;
    rtb_right_aileron_2_position_deg_Data = A380FadecComputer_U.in.prim_1.fctl.right_aileron_2_position_deg.Data;
    rtb_spoiler_status_word_SSM = A380FadecComputer_U.in.prim_1.fctl.spoiler_status_word.SSM;
    rtb_spoiler_status_word_Data = A380FadecComputer_U.in.prim_1.fctl.spoiler_status_word.Data;
    rtb_left_spoiler_position_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.left_spoiler_position_deg.SSM;
    rtb_left_spoiler_position_deg_Data = A380FadecComputer_U.in.prim_1.fctl.left_spoiler_position_deg.Data;
    rtb_right_spoiler_position_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.right_spoiler_position_deg.SSM;
    rtb_right_spoiler_position_deg_Data = A380FadecComputer_U.in.prim_1.fctl.right_spoiler_position_deg.Data;
    rtb_elevator_status_word_SSM = A380FadecComputer_U.in.prim_1.fctl.elevator_status_word.SSM;
    rtb_elevator_status_word_Data = A380FadecComputer_U.in.prim_1.fctl.elevator_status_word.Data;
    rtb_elevator_1_position_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.elevator_1_position_deg.SSM;
    rtb_elevator_1_position_deg_Data = A380FadecComputer_U.in.prim_1.fctl.elevator_1_position_deg.Data;
    rtb_elevator_2_position_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.elevator_2_position_deg.SSM;
    rtb_elevator_2_position_deg_Data = A380FadecComputer_U.in.prim_1.fctl.elevator_2_position_deg.Data;
    rtb_elevator_3_position_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.elevator_3_position_deg.SSM;
    rtb_elevator_3_position_deg_Data = A380FadecComputer_U.in.prim_1.fctl.elevator_3_position_deg.Data;
    rtb_ths_position_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.ths_position_deg.SSM;
    rtb_ths_position_deg_Data = A380FadecComputer_U.in.prim_1.fctl.ths_position_deg.Data;
    rtb_rudder_status_word_SSM = A380FadecComputer_U.in.prim_1.fctl.rudder_status_word.SSM;
    rtb_rudder_status_word_Data = A380FadecComputer_U.in.prim_1.fctl.rudder_status_word.Data;
    rtb_rudder_1_position_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.rudder_1_position_deg.SSM;
    rtb_rudder_1_position_deg_Data = A380FadecComputer_U.in.prim_1.fctl.rudder_1_position_deg.Data;
    rtb_rudder_2_position_deg_SSM = A380FadecComputer_U.in.prim_1.fctl.rudder_2_position_deg.SSM;
    rtb_rudder_2_position_deg_Data = A380FadecComputer_U.in.prim_1.fctl.rudder_2_position_deg.Data;
    rtb_radio_height_1_ft_SSM = A380FadecComputer_U.in.prim_1.fctl.radio_height_1_ft.SSM;
    rtb_radio_height_1_ft_Data = A380FadecComputer_U.in.prim_1.fctl.radio_height_1_ft.Data;
    rtb_radio_height_2_ft_SSM = A380FadecComputer_U.in.prim_1.fctl.radio_height_2_ft.SSM;
    rtb_radio_height_2_ft_Data = A380FadecComputer_U.in.prim_1.fctl.radio_height_2_ft.Data;
    rtb_fctl_law_status_word_SSM = A380FadecComputer_U.in.prim_1.fctl.fctl_law_status_word.SSM;
    rtb_fctl_law_status_word_Data = A380FadecComputer_U.in.prim_1.fctl.fctl_law_status_word.Data;
    rtb_discrete_status_word_1_SSM = A380FadecComputer_U.in.prim_1.fctl.discrete_status_word_1.SSM;
    rtb_discrete_status_word_1_Data = A380FadecComputer_U.in.prim_1.fctl.discrete_status_word_1.Data;
    rtb_v_alpha_lim_kn_SSM = A380FadecComputer_U.in.prim_1.fctl.v_alpha_lim_kn.SSM;
    rtb_v_alpha_lim_kn_Data = A380FadecComputer_U.in.prim_1.fctl.v_alpha_lim_kn.Data;
    rtb_v_alpha_prot_kn_SSM = A380FadecComputer_U.in.prim_1.fctl.v_alpha_prot_kn.SSM;
    rtb_v_alpha_prot_kn_Data = A380FadecComputer_U.in.prim_1.fctl.v_alpha_prot_kn.Data;
    rtb_fctl_v_alpha_stall_warn_kn_SSM = A380FadecComputer_U.in.prim_1.fctl.v_alpha_stall_warn_kn.SSM;
    rtb_fctl_v_alpha_stall_warn_kn_Data = A380FadecComputer_U.in.prim_1.fctl.v_alpha_stall_warn_kn.Data;
    rtb_gamma_a_deg_SSM = A380FadecComputer_U.in.prim_1.fe.gamma_a_deg.SSM;
    rtb_gamma_a_deg_Data = A380FadecComputer_U.in.prim_1.fe.gamma_a_deg.Data;
    rtb_gamma_t_deg_SSM = A380FadecComputer_U.in.prim_1.fe.gamma_t_deg.SSM;
    rtb_gamma_t_deg_Data = A380FadecComputer_U.in.prim_1.fe.gamma_t_deg.Data;
    rtb_sideslip_target_deg_SSM = A380FadecComputer_U.in.prim_1.fe.sideslip_target_deg.SSM;
    rtb_sideslip_target_deg_Data = A380FadecComputer_U.in.prim_1.fe.sideslip_target_deg.Data;
    rtb_v_ls_kn_SSM = A380FadecComputer_U.in.prim_1.fe.v_ls_kn.SSM;
    rtb_v_ls_kn_Data = A380FadecComputer_U.in.prim_1.fe.v_ls_kn.Data;
    rtb_v_stall_kn_SSM = A380FadecComputer_U.in.prim_1.fe.v_stall_kn.SSM;
    rtb_v_stall_kn_Data = A380FadecComputer_U.in.prim_1.fe.v_stall_kn.Data;
    rtb_speed_trend_kn_SSM = A380FadecComputer_U.in.prim_1.fe.speed_trend_kn.SSM;
    rtb_speed_trend_kn_Data = A380FadecComputer_U.in.prim_1.fe.speed_trend_kn.Data;
    rtb_v_3_kn_SSM = A380FadecComputer_U.in.prim_1.fe.v_3_kn.SSM;
    rtb_v_3_kn_Data = A380FadecComputer_U.in.prim_1.fe.v_3_kn.Data;
    rtb_v_4_kn_SSM = A380FadecComputer_U.in.prim_1.fe.v_4_kn.SSM;
    rtb_v_4_kn_Data = A380FadecComputer_U.in.prim_1.fe.v_4_kn.Data;
    rtb_v_man_kn_SSM = A380FadecComputer_U.in.prim_1.fe.v_man_kn.SSM;
    rtb_v_man_kn_Data = A380FadecComputer_U.in.prim_1.fe.v_man_kn.Data;
    rtb_v_max_kn_SSM = A380FadecComputer_U.in.prim_1.fe.v_max_kn.SSM;
    rtb_v_max_kn_Data = A380FadecComputer_U.in.prim_1.fe.v_max_kn.Data;
    rtb_v_fe_next_kn_SSM = A380FadecComputer_U.in.prim_1.fe.v_fe_next_kn.SSM;
    rtb_v_fe_next_kn_Data = A380FadecComputer_U.in.prim_1.fe.v_fe_next_kn.Data;
    rtb_fe_discrete_word_1_SSM = A380FadecComputer_U.in.prim_1.fe.discrete_word_1.SSM;
    rtb_fe_discrete_word_1_Data = A380FadecComputer_U.in.prim_1.fe.discrete_word_1.Data;
    rtb_pfd_spd_tgt_kts_SSM = A380FadecComputer_U.in.prim_1.fg.pfd_spd_tgt_kts.SSM;
    rtb_pfd_spd_tgt_kts_Data = A380FadecComputer_U.in.prim_1.fg.pfd_spd_tgt_kts.Data;
    rtb_pfd_short_term_mngd_spd_kts_SSM = A380FadecComputer_U.in.prim_1.fg.pfd_short_term_mngd_spd_kts.SSM;
    rtb_pfd_short_term_mngd_spd_kts_Data = A380FadecComputer_U.in.prim_1.fg.pfd_short_term_mngd_spd_kts.Data;
    rtb_selected_spd_kts_SSM = A380FadecComputer_U.in.prim_1.fg.selected_spd_kts.SSM;
    rtb_selected_spd_kts_Data = A380FadecComputer_U.in.prim_1.fg.selected_spd_kts.Data;
    rtb_selected_mach_kts_SSM = A380FadecComputer_U.in.prim_1.fg.selected_mach_kts.SSM;
    rtb_selected_mach_kts_Data = A380FadecComputer_U.in.prim_1.fg.selected_mach_kts.Data;
    rtb_selected_hdg_deg_SSM = A380FadecComputer_U.in.prim_1.fg.selected_hdg_deg.SSM;
    rtb_selected_hdg_deg_Data = A380FadecComputer_U.in.prim_1.fg.selected_hdg_deg.Data;
    rtb_selected_trk_deg_SSM = A380FadecComputer_U.in.prim_1.fg.selected_trk_deg.SSM;
    rtb_selected_trk_deg_Data = A380FadecComputer_U.in.prim_1.fg.selected_trk_deg.Data;
    rtb_selected_alt_ft_SSM = A380FadecComputer_U.in.prim_1.fg.selected_alt_ft.SSM;
    rtb_selected_alt_ft_Data = A380FadecComputer_U.in.prim_1.fg.selected_alt_ft.Data;
    rtb_selected_vs_ft_min_SSM = A380FadecComputer_U.in.prim_1.fg.selected_vs_ft_min.SSM;
    rtb_selected_vs_ft_min_Data = A380FadecComputer_U.in.prim_1.fg.selected_vs_ft_min.Data;
    rtb_selected_fpa_deg_SSM = A380FadecComputer_U.in.prim_1.fg.selected_fpa_deg.SSM;
    rtb_selected_fpa_deg_Data = A380FadecComputer_U.in.prim_1.fg.selected_fpa_deg.Data;
    rtb_runway_hdg_memorized_deg_SSM = A380FadecComputer_U.in.prim_1.fg.runway_hdg_memorized_deg.SSM;
    rtb_runway_hdg_memorized_deg_Data = A380FadecComputer_U.in.prim_1.fg.runway_hdg_memorized_deg.Data;
    rtb_preset_mach_from_fms_SSM = A380FadecComputer_U.in.prim_1.fg.preset_mach_from_fms.SSM;
    rtb_preset_mach_from_fms_Data = A380FadecComputer_U.in.prim_1.fg.preset_mach_from_fms.Data;
    rtb_preset_speed_from_fms_kts_SSM = A380FadecComputer_U.in.prim_1.fg.preset_speed_from_fms_kts.SSM;
    rtb_preset_speed_from_fms_kts_Data = A380FadecComputer_U.in.prim_1.fg.preset_speed_from_fms_kts.Data;
    rtb_roll_fd_command_1_SSM = A380FadecComputer_U.in.prim_1.fg.roll_fd_command_1.SSM;
    rtb_roll_fd_command_1_Data = A380FadecComputer_U.in.prim_1.fg.roll_fd_command_1.Data;
    rtb_pitch_fd_command_1_SSM = A380FadecComputer_U.in.prim_1.fg.pitch_fd_command_1.SSM;
    rtb_pitch_fd_command_1_Data = A380FadecComputer_U.in.prim_1.fg.pitch_fd_command_1.Data;
    rtb_yaw_fd_command_1_SSM = A380FadecComputer_U.in.prim_1.fg.yaw_fd_command_1.SSM;
    rtb_yaw_fd_command_1_Data = A380FadecComputer_U.in.prim_1.fg.yaw_fd_command_1.Data;
    rtb_roll_fd_command_2_SSM = A380FadecComputer_U.in.prim_1.fg.roll_fd_command_2.SSM;
    rtb_roll_fd_command_2_Data = A380FadecComputer_U.in.prim_1.fg.roll_fd_command_2.Data;
    rtb_pitch_fd_command_2_SSM = A380FadecComputer_U.in.prim_1.fg.pitch_fd_command_2.SSM;
    rtb_pitch_fd_command_2_Data = A380FadecComputer_U.in.prim_1.fg.pitch_fd_command_2.Data;
    rtb_yaw_fd_command_2_SSM = A380FadecComputer_U.in.prim_1.fg.yaw_fd_command_2.SSM;
    rtb_yaw_fd_command_2_Data = A380FadecComputer_U.in.prim_1.fg.yaw_fd_command_2.Data;
    rtb_discrete_word_5_SSM = A380FadecComputer_U.in.prim_1.fg.discrete_word_5.SSM;
    rtb_discrete_word_5_Data = A380FadecComputer_U.in.prim_1.fg.discrete_word_5.Data;
    rtb_discrete_word_4_SSM = A380FadecComputer_U.in.prim_1.fg.discrete_word_4.SSM;
    rtb_discrete_word_4_Data = A380FadecComputer_U.in.prim_1.fg.discrete_word_4.Data;
    rtb_fm_alt_constraint_ft_SSM = A380FadecComputer_U.in.prim_1.fg.fm_alt_constraint_ft.SSM;
    rtb_fm_alt_constraint_ft_Data = A380FadecComputer_U.in.prim_1.fg.fm_alt_constraint_ft.Data;
    rtb_BusAssignment_o_prim_input_fg_ats_discrete_word = &A380FadecComputer_U.in.prim_1.fg.ats_discrete_word;
    rtb_ats_fma_discrete_word_SSM = A380FadecComputer_U.in.prim_1.fg.ats_fma_discrete_word.SSM;
    rtb_ats_fma_discrete_word_Data = A380FadecComputer_U.in.prim_1.fg.ats_fma_discrete_word.Data;
    rtb_discrete_word_3_SSM = A380FadecComputer_U.in.prim_1.fg.discrete_word_3.SSM;
    rtb_discrete_word_3_Data = A380FadecComputer_U.in.prim_1.fg.discrete_word_3.Data;
    rtb_discrete_word_1_k_SSM = A380FadecComputer_U.in.prim_1.fg.discrete_word_1.SSM;
    rtb_discrete_word_1_k_Data = A380FadecComputer_U.in.prim_1.fg.discrete_word_1.Data;
    rtb_discrete_word_2_SSM = A380FadecComputer_U.in.prim_1.fg.discrete_word_2.SSM;
    rtb_discrete_word_2_Data = A380FadecComputer_U.in.prim_1.fg.discrete_word_2.Data;
    rtb_discrete_word_6_SSM = A380FadecComputer_U.in.prim_1.fg.discrete_word_6.SSM;
    rtb_discrete_word_6_Data = A380FadecComputer_U.in.prim_1.fg.discrete_word_6.Data;
    rtb_low_target_speed_margin_kts_SSM = A380FadecComputer_U.in.prim_1.fg.low_target_speed_margin_kts.SSM;
    rtb_low_target_speed_margin_kts_Data = A380FadecComputer_U.in.prim_1.fg.low_target_speed_margin_kts.Data;
    rtb_high_target_speed_margin_kts_SSM = A380FadecComputer_U.in.prim_1.fg.high_target_speed_margin_kts.SSM;
    rtb_high_target_speed_margin_kts_Data = A380FadecComputer_U.in.prim_1.fg.high_target_speed_margin_kts.Data;
    rtb_nosewheel_cmd_deg_SSM = A380FadecComputer_U.in.prim_1.fg.nosewheel_cmd_deg.SSM;
    rtb_nosewheel_cmd_deg_Data = A380FadecComputer_U.in.prim_1.fg.nosewheel_cmd_deg.Data;
    rtb_n1_command_percent_SSM = A380FadecComputer_U.in.prim_1.fg.n1_command_percent.SSM;
    rtb_n1_command_percent_Data = A380FadecComputer_U.in.prim_1.fg.n1_command_percent.Data;
    rtb_flx_to_temp_deg_c_SSM = A380FadecComputer_U.in.prim_1.fg.flx_to_temp_deg_c.SSM;
    rtb_flx_to_temp_deg_c_Data = A380FadecComputer_U.in.prim_1.fg.flx_to_temp_deg_c.Data;
    rtb_BusAssignment_b_prim_input_fg_discrete_word_7_SSM = A380FadecComputer_U.in.prim_1.fg.discrete_word_7.SSM;
    rtb_BusAssignment_b_prim_input_fg_discrete_word_7_Data = A380FadecComputer_U.in.prim_1.fg.discrete_word_7.Data;
  } else if ((rtb_y_e != 0U) && rtb_y_mv) {
    rtb_left_inboard_aileron_command_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.left_inboard_aileron_command_deg.SSM;
    rtb_left_inboard_aileron_command_deg_Data = A380FadecComputer_U.in.prim_2.fctl.left_inboard_aileron_command_deg.Data;
    rtb_right_inboard_aileron_command_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.right_inboard_aileron_command_deg.SSM;
    rtb_right_inboard_aileron_command_deg_Data =
      A380FadecComputer_U.in.prim_2.fctl.right_inboard_aileron_command_deg.Data;
    rtb_left_midboard_aileron_command_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.left_midboard_aileron_command_deg.SSM;
    rtb_left_midboard_aileron_command_deg_Data =
      A380FadecComputer_U.in.prim_2.fctl.left_midboard_aileron_command_deg.Data;
    rtb_right_midboard_aileron_command_deg_SSM =
      A380FadecComputer_U.in.prim_2.fctl.right_midboard_aileron_command_deg.SSM;
    rtb_right_midboard_aileron_command_deg_Data =
      A380FadecComputer_U.in.prim_2.fctl.right_midboard_aileron_command_deg.Data;
    rtb_left_outboard_aileron_command_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.left_outboard_aileron_command_deg.SSM;
    rtb_left_outboard_aileron_command_deg_Data =
      A380FadecComputer_U.in.prim_2.fctl.left_outboard_aileron_command_deg.Data;
    rtb_right_outboard_aileron_command_deg_SSM =
      A380FadecComputer_U.in.prim_2.fctl.right_outboard_aileron_command_deg.SSM;
    rtb_right_outboard_aileron_command_deg_Data =
      A380FadecComputer_U.in.prim_2.fctl.right_outboard_aileron_command_deg.Data;
    rtb_left_spoiler_1_command_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.left_spoiler_1_command_deg.SSM;
    rtb_left_spoiler_1_command_deg_Data = A380FadecComputer_U.in.prim_2.fctl.left_spoiler_1_command_deg.Data;
    rtb_right_spoiler_1_command_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.right_spoiler_1_command_deg.SSM;
    rtb_right_spoiler_1_command_deg_Data = A380FadecComputer_U.in.prim_2.fctl.right_spoiler_1_command_deg.Data;
    rtb_left_spoiler_2_command_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.left_spoiler_2_command_deg.SSM;
    rtb_left_spoiler_2_command_deg_Data = A380FadecComputer_U.in.prim_2.fctl.left_spoiler_2_command_deg.Data;
    rtb_right_spoiler_2_command_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.right_spoiler_2_command_deg.SSM;
    rtb_right_spoiler_2_command_deg_Data = A380FadecComputer_U.in.prim_2.fctl.right_spoiler_2_command_deg.Data;
    rtb_left_spoiler_3_command_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.left_spoiler_3_command_deg.SSM;
    rtb_left_spoiler_3_command_deg_Data = A380FadecComputer_U.in.prim_2.fctl.left_spoiler_3_command_deg.Data;
    rtb_right_spoiler_3_command_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.right_spoiler_3_command_deg.SSM;
    rtb_right_spoiler_3_command_deg_Data = A380FadecComputer_U.in.prim_2.fctl.right_spoiler_3_command_deg.Data;
    rtb_left_spoiler_4_command_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.left_spoiler_4_command_deg.SSM;
    rtb_left_spoiler_4_command_deg_Data = A380FadecComputer_U.in.prim_2.fctl.left_spoiler_4_command_deg.Data;
    rtb_right_spoiler_4_command_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.right_spoiler_4_command_deg.SSM;
    rtb_right_spoiler_4_command_deg_Data = A380FadecComputer_U.in.prim_2.fctl.right_spoiler_4_command_deg.Data;
    rtb_left_spoiler_5_command_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.left_spoiler_5_command_deg.SSM;
    rtb_left_spoiler_5_command_deg_Data = A380FadecComputer_U.in.prim_2.fctl.left_spoiler_5_command_deg.Data;
    rtb_right_spoiler_5_command_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.right_spoiler_5_command_deg.SSM;
    rtb_right_spoiler_5_command_deg_Data = A380FadecComputer_U.in.prim_2.fctl.right_spoiler_5_command_deg.Data;
    rtb_left_spoiler_6_command_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.left_spoiler_6_command_deg.SSM;
    rtb_left_spoiler_6_command_deg_Data = A380FadecComputer_U.in.prim_2.fctl.left_spoiler_6_command_deg.Data;
    rtb_right_spoiler_6_command_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.right_spoiler_6_command_deg.SSM;
    rtb_right_spoiler_6_command_deg_Data = A380FadecComputer_U.in.prim_2.fctl.right_spoiler_6_command_deg.Data;
    rtb_left_spoiler_7_command_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.left_spoiler_7_command_deg.SSM;
    rtb_left_spoiler_7_command_deg_Data = A380FadecComputer_U.in.prim_2.fctl.left_spoiler_7_command_deg.Data;
    rtb_right_spoiler_7_command_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.right_spoiler_7_command_deg.SSM;
    rtb_right_spoiler_7_command_deg_Data = A380FadecComputer_U.in.prim_2.fctl.right_spoiler_7_command_deg.Data;
    rtb_left_spoiler_8_command_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.left_spoiler_8_command_deg.SSM;
    rtb_left_spoiler_8_command_deg_Data = A380FadecComputer_U.in.prim_2.fctl.left_spoiler_8_command_deg.Data;
    rtb_right_spoiler_8_command_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.right_spoiler_8_command_deg.SSM;
    rtb_right_spoiler_8_command_deg_Data = A380FadecComputer_U.in.prim_2.fctl.right_spoiler_8_command_deg.Data;
    rtb_left_inboard_elevator_command_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.left_inboard_elevator_command_deg.SSM;
    rtb_left_inboard_elevator_command_deg_Data =
      A380FadecComputer_U.in.prim_2.fctl.left_inboard_elevator_command_deg.Data;
    rtb_right_inboard_elevator_command_deg_SSM =
      A380FadecComputer_U.in.prim_2.fctl.right_inboard_elevator_command_deg.SSM;
    rtb_right_inboard_elevator_command_deg_Data =
      A380FadecComputer_U.in.prim_2.fctl.right_inboard_elevator_command_deg.Data;
    rtb_left_outboard_elevator_command_deg_SSM =
      A380FadecComputer_U.in.prim_2.fctl.left_outboard_elevator_command_deg.SSM;
    rtb_left_outboard_elevator_command_deg_Data =
      A380FadecComputer_U.in.prim_2.fctl.left_outboard_elevator_command_deg.Data;
    rtb_right_outboard_elevator_command_deg_SSM =
      A380FadecComputer_U.in.prim_2.fctl.right_outboard_elevator_command_deg.SSM;
    rtb_right_outboard_elevator_command_deg_Data =
      A380FadecComputer_U.in.prim_2.fctl.right_outboard_elevator_command_deg.Data;
    rtb_ths_command_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.ths_command_deg.SSM;
    rtb_ths_command_deg_Data = A380FadecComputer_U.in.prim_2.fctl.ths_command_deg.Data;
    rtb_upper_rudder_command_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.upper_rudder_command_deg.SSM;
    rtb_upper_rudder_command_deg_Data = A380FadecComputer_U.in.prim_2.fctl.upper_rudder_command_deg.Data;
    rtb_lower_rudder_command_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.lower_rudder_command_deg.SSM;
    rtb_lower_rudder_command_deg_Data = A380FadecComputer_U.in.prim_2.fctl.lower_rudder_command_deg.Data;
    rtb_left_sidestick_pitch_command_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.left_sidestick_pitch_command_deg.SSM;
    rtb_left_sidestick_pitch_command_deg_Data = A380FadecComputer_U.in.prim_2.fctl.left_sidestick_pitch_command_deg.Data;
    rtb_right_sidestick_pitch_command_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.right_sidestick_pitch_command_deg.SSM;
    rtb_right_sidestick_pitch_command_deg_Data =
      A380FadecComputer_U.in.prim_2.fctl.right_sidestick_pitch_command_deg.Data;
    rtb_left_sidestick_roll_command_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.left_sidestick_roll_command_deg.SSM;
    rtb_left_sidestick_roll_command_deg_Data = A380FadecComputer_U.in.prim_2.fctl.left_sidestick_roll_command_deg.Data;
    rtb_right_sidestick_roll_command_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.right_sidestick_roll_command_deg.SSM;
    rtb_right_sidestick_roll_command_deg_Data = A380FadecComputer_U.in.prim_2.fctl.right_sidestick_roll_command_deg.Data;
    rtb_rudder_pedal_position_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.rudder_pedal_position_deg.SSM;
    rtb_rudder_pedal_position_deg_Data = A380FadecComputer_U.in.prim_2.fctl.rudder_pedal_position_deg.Data;
    rtb_aileron_status_word_SSM = A380FadecComputer_U.in.prim_2.fctl.aileron_status_word.SSM;
    rtb_aileron_status_word_Data = A380FadecComputer_U.in.prim_2.fctl.aileron_status_word.Data;
    rtb_left_aileron_1_position_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.left_aileron_1_position_deg.SSM;
    rtb_left_aileron_1_position_deg_Data = A380FadecComputer_U.in.prim_2.fctl.left_aileron_1_position_deg.Data;
    rtb_left_aileron_2_position_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.left_aileron_2_position_deg.SSM;
    rtb_left_aileron_2_position_deg_Data = A380FadecComputer_U.in.prim_2.fctl.left_aileron_2_position_deg.Data;
    rtb_right_aileron_1_position_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.right_aileron_1_position_deg.SSM;
    rtb_right_aileron_1_position_deg_Data = A380FadecComputer_U.in.prim_2.fctl.right_aileron_1_position_deg.Data;
    rtb_right_aileron_2_position_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.right_aileron_2_position_deg.SSM;
    rtb_right_aileron_2_position_deg_Data = A380FadecComputer_U.in.prim_2.fctl.right_aileron_2_position_deg.Data;
    rtb_spoiler_status_word_SSM = A380FadecComputer_U.in.prim_2.fctl.spoiler_status_word.SSM;
    rtb_spoiler_status_word_Data = A380FadecComputer_U.in.prim_2.fctl.spoiler_status_word.Data;
    rtb_left_spoiler_position_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.left_spoiler_position_deg.SSM;
    rtb_left_spoiler_position_deg_Data = A380FadecComputer_U.in.prim_2.fctl.left_spoiler_position_deg.Data;
    rtb_right_spoiler_position_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.right_spoiler_position_deg.SSM;
    rtb_right_spoiler_position_deg_Data = A380FadecComputer_U.in.prim_2.fctl.right_spoiler_position_deg.Data;
    rtb_elevator_status_word_SSM = A380FadecComputer_U.in.prim_2.fctl.elevator_status_word.SSM;
    rtb_elevator_status_word_Data = A380FadecComputer_U.in.prim_2.fctl.elevator_status_word.Data;
    rtb_elevator_1_position_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.elevator_1_position_deg.SSM;
    rtb_elevator_1_position_deg_Data = A380FadecComputer_U.in.prim_2.fctl.elevator_1_position_deg.Data;
    rtb_elevator_2_position_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.elevator_2_position_deg.SSM;
    rtb_elevator_2_position_deg_Data = A380FadecComputer_U.in.prim_2.fctl.elevator_2_position_deg.Data;
    rtb_elevator_3_position_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.elevator_3_position_deg.SSM;
    rtb_elevator_3_position_deg_Data = A380FadecComputer_U.in.prim_2.fctl.elevator_3_position_deg.Data;
    rtb_ths_position_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.ths_position_deg.SSM;
    rtb_ths_position_deg_Data = A380FadecComputer_U.in.prim_2.fctl.ths_position_deg.Data;
    rtb_rudder_status_word_SSM = A380FadecComputer_U.in.prim_2.fctl.rudder_status_word.SSM;
    rtb_rudder_status_word_Data = A380FadecComputer_U.in.prim_2.fctl.rudder_status_word.Data;
    rtb_rudder_1_position_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.rudder_1_position_deg.SSM;
    rtb_rudder_1_position_deg_Data = A380FadecComputer_U.in.prim_2.fctl.rudder_1_position_deg.Data;
    rtb_rudder_2_position_deg_SSM = A380FadecComputer_U.in.prim_2.fctl.rudder_2_position_deg.SSM;
    rtb_rudder_2_position_deg_Data = A380FadecComputer_U.in.prim_2.fctl.rudder_2_position_deg.Data;
    rtb_radio_height_1_ft_SSM = A380FadecComputer_U.in.prim_2.fctl.radio_height_1_ft.SSM;
    rtb_radio_height_1_ft_Data = A380FadecComputer_U.in.prim_2.fctl.radio_height_1_ft.Data;
    rtb_radio_height_2_ft_SSM = A380FadecComputer_U.in.prim_2.fctl.radio_height_2_ft.SSM;
    rtb_radio_height_2_ft_Data = A380FadecComputer_U.in.prim_2.fctl.radio_height_2_ft.Data;
    rtb_fctl_law_status_word_SSM = A380FadecComputer_U.in.prim_2.fctl.fctl_law_status_word.SSM;
    rtb_fctl_law_status_word_Data = A380FadecComputer_U.in.prim_2.fctl.fctl_law_status_word.Data;
    rtb_discrete_status_word_1_SSM = A380FadecComputer_U.in.prim_2.fctl.discrete_status_word_1.SSM;
    rtb_discrete_status_word_1_Data = A380FadecComputer_U.in.prim_2.fctl.discrete_status_word_1.Data;
    rtb_v_alpha_lim_kn_SSM = A380FadecComputer_U.in.prim_2.fctl.v_alpha_lim_kn.SSM;
    rtb_v_alpha_lim_kn_Data = A380FadecComputer_U.in.prim_2.fctl.v_alpha_lim_kn.Data;
    rtb_v_alpha_prot_kn_SSM = A380FadecComputer_U.in.prim_2.fctl.v_alpha_prot_kn.SSM;
    rtb_v_alpha_prot_kn_Data = A380FadecComputer_U.in.prim_2.fctl.v_alpha_prot_kn.Data;
    rtb_fctl_v_alpha_stall_warn_kn_SSM = A380FadecComputer_U.in.prim_2.fctl.v_alpha_stall_warn_kn.SSM;
    rtb_fctl_v_alpha_stall_warn_kn_Data = A380FadecComputer_U.in.prim_2.fctl.v_alpha_stall_warn_kn.Data;
    rtb_gamma_a_deg_SSM = A380FadecComputer_U.in.prim_2.fe.gamma_a_deg.SSM;
    rtb_gamma_a_deg_Data = A380FadecComputer_U.in.prim_2.fe.gamma_a_deg.Data;
    rtb_gamma_t_deg_SSM = A380FadecComputer_U.in.prim_2.fe.gamma_t_deg.SSM;
    rtb_gamma_t_deg_Data = A380FadecComputer_U.in.prim_2.fe.gamma_t_deg.Data;
    rtb_sideslip_target_deg_SSM = A380FadecComputer_U.in.prim_2.fe.sideslip_target_deg.SSM;
    rtb_sideslip_target_deg_Data = A380FadecComputer_U.in.prim_2.fe.sideslip_target_deg.Data;
    rtb_v_ls_kn_SSM = A380FadecComputer_U.in.prim_2.fe.v_ls_kn.SSM;
    rtb_v_ls_kn_Data = A380FadecComputer_U.in.prim_2.fe.v_ls_kn.Data;
    rtb_v_stall_kn_SSM = A380FadecComputer_U.in.prim_2.fe.v_stall_kn.SSM;
    rtb_v_stall_kn_Data = A380FadecComputer_U.in.prim_2.fe.v_stall_kn.Data;
    rtb_speed_trend_kn_SSM = A380FadecComputer_U.in.prim_2.fe.speed_trend_kn.SSM;
    rtb_speed_trend_kn_Data = A380FadecComputer_U.in.prim_2.fe.speed_trend_kn.Data;
    rtb_v_3_kn_SSM = A380FadecComputer_U.in.prim_2.fe.v_3_kn.SSM;
    rtb_v_3_kn_Data = A380FadecComputer_U.in.prim_2.fe.v_3_kn.Data;
    rtb_v_4_kn_SSM = A380FadecComputer_U.in.prim_2.fe.v_4_kn.SSM;
    rtb_v_4_kn_Data = A380FadecComputer_U.in.prim_2.fe.v_4_kn.Data;
    rtb_v_man_kn_SSM = A380FadecComputer_U.in.prim_2.fe.v_man_kn.SSM;
    rtb_v_man_kn_Data = A380FadecComputer_U.in.prim_2.fe.v_man_kn.Data;
    rtb_v_max_kn_SSM = A380FadecComputer_U.in.prim_2.fe.v_max_kn.SSM;
    rtb_v_max_kn_Data = A380FadecComputer_U.in.prim_2.fe.v_max_kn.Data;
    rtb_v_fe_next_kn_SSM = A380FadecComputer_U.in.prim_2.fe.v_fe_next_kn.SSM;
    rtb_v_fe_next_kn_Data = A380FadecComputer_U.in.prim_2.fe.v_fe_next_kn.Data;
    rtb_fe_discrete_word_1_SSM = A380FadecComputer_U.in.prim_2.fe.discrete_word_1.SSM;
    rtb_fe_discrete_word_1_Data = A380FadecComputer_U.in.prim_2.fe.discrete_word_1.Data;
    rtb_pfd_spd_tgt_kts_SSM = A380FadecComputer_U.in.prim_2.fg.pfd_spd_tgt_kts.SSM;
    rtb_pfd_spd_tgt_kts_Data = A380FadecComputer_U.in.prim_2.fg.pfd_spd_tgt_kts.Data;
    rtb_pfd_short_term_mngd_spd_kts_SSM = A380FadecComputer_U.in.prim_2.fg.pfd_short_term_mngd_spd_kts.SSM;
    rtb_pfd_short_term_mngd_spd_kts_Data = A380FadecComputer_U.in.prim_2.fg.pfd_short_term_mngd_spd_kts.Data;
    rtb_selected_spd_kts_SSM = A380FadecComputer_U.in.prim_2.fg.selected_spd_kts.SSM;
    rtb_selected_spd_kts_Data = A380FadecComputer_U.in.prim_2.fg.selected_spd_kts.Data;
    rtb_selected_mach_kts_SSM = A380FadecComputer_U.in.prim_2.fg.selected_mach_kts.SSM;
    rtb_selected_mach_kts_Data = A380FadecComputer_U.in.prim_2.fg.selected_mach_kts.Data;
    rtb_selected_hdg_deg_SSM = A380FadecComputer_U.in.prim_2.fg.selected_hdg_deg.SSM;
    rtb_selected_hdg_deg_Data = A380FadecComputer_U.in.prim_2.fg.selected_hdg_deg.Data;
    rtb_selected_trk_deg_SSM = A380FadecComputer_U.in.prim_2.fg.selected_trk_deg.SSM;
    rtb_selected_trk_deg_Data = A380FadecComputer_U.in.prim_2.fg.selected_trk_deg.Data;
    rtb_selected_alt_ft_SSM = A380FadecComputer_U.in.prim_2.fg.selected_alt_ft.SSM;
    rtb_selected_alt_ft_Data = A380FadecComputer_U.in.prim_2.fg.selected_alt_ft.Data;
    rtb_selected_vs_ft_min_SSM = A380FadecComputer_U.in.prim_2.fg.selected_vs_ft_min.SSM;
    rtb_selected_vs_ft_min_Data = A380FadecComputer_U.in.prim_2.fg.selected_vs_ft_min.Data;
    rtb_selected_fpa_deg_SSM = A380FadecComputer_U.in.prim_2.fg.selected_fpa_deg.SSM;
    rtb_selected_fpa_deg_Data = A380FadecComputer_U.in.prim_2.fg.selected_fpa_deg.Data;
    rtb_runway_hdg_memorized_deg_SSM = A380FadecComputer_U.in.prim_2.fg.runway_hdg_memorized_deg.SSM;
    rtb_runway_hdg_memorized_deg_Data = A380FadecComputer_U.in.prim_2.fg.runway_hdg_memorized_deg.Data;
    rtb_preset_mach_from_fms_SSM = A380FadecComputer_U.in.prim_2.fg.preset_mach_from_fms.SSM;
    rtb_preset_mach_from_fms_Data = A380FadecComputer_U.in.prim_2.fg.preset_mach_from_fms.Data;
    rtb_preset_speed_from_fms_kts_SSM = A380FadecComputer_U.in.prim_2.fg.preset_speed_from_fms_kts.SSM;
    rtb_preset_speed_from_fms_kts_Data = A380FadecComputer_U.in.prim_2.fg.preset_speed_from_fms_kts.Data;
    rtb_roll_fd_command_1_SSM = A380FadecComputer_U.in.prim_2.fg.roll_fd_command_1.SSM;
    rtb_roll_fd_command_1_Data = A380FadecComputer_U.in.prim_2.fg.roll_fd_command_1.Data;
    rtb_pitch_fd_command_1_SSM = A380FadecComputer_U.in.prim_2.fg.pitch_fd_command_1.SSM;
    rtb_pitch_fd_command_1_Data = A380FadecComputer_U.in.prim_2.fg.pitch_fd_command_1.Data;
    rtb_yaw_fd_command_1_SSM = A380FadecComputer_U.in.prim_2.fg.yaw_fd_command_1.SSM;
    rtb_yaw_fd_command_1_Data = A380FadecComputer_U.in.prim_2.fg.yaw_fd_command_1.Data;
    rtb_roll_fd_command_2_SSM = A380FadecComputer_U.in.prim_2.fg.roll_fd_command_2.SSM;
    rtb_roll_fd_command_2_Data = A380FadecComputer_U.in.prim_2.fg.roll_fd_command_2.Data;
    rtb_pitch_fd_command_2_SSM = A380FadecComputer_U.in.prim_2.fg.pitch_fd_command_2.SSM;
    rtb_pitch_fd_command_2_Data = A380FadecComputer_U.in.prim_2.fg.pitch_fd_command_2.Data;
    rtb_yaw_fd_command_2_SSM = A380FadecComputer_U.in.prim_2.fg.yaw_fd_command_2.SSM;
    rtb_yaw_fd_command_2_Data = A380FadecComputer_U.in.prim_2.fg.yaw_fd_command_2.Data;
    rtb_discrete_word_5_SSM = A380FadecComputer_U.in.prim_2.fg.discrete_word_5.SSM;
    rtb_discrete_word_5_Data = A380FadecComputer_U.in.prim_2.fg.discrete_word_5.Data;
    rtb_discrete_word_4_SSM = A380FadecComputer_U.in.prim_2.fg.discrete_word_4.SSM;
    rtb_discrete_word_4_Data = A380FadecComputer_U.in.prim_2.fg.discrete_word_4.Data;
    rtb_fm_alt_constraint_ft_SSM = A380FadecComputer_U.in.prim_2.fg.fm_alt_constraint_ft.SSM;
    rtb_fm_alt_constraint_ft_Data = A380FadecComputer_U.in.prim_2.fg.fm_alt_constraint_ft.Data;
    rtb_BusAssignment_o_prim_input_fg_ats_discrete_word = &A380FadecComputer_U.in.prim_2.fg.ats_discrete_word;
    rtb_ats_fma_discrete_word_SSM = A380FadecComputer_U.in.prim_2.fg.ats_fma_discrete_word.SSM;
    rtb_ats_fma_discrete_word_Data = A380FadecComputer_U.in.prim_2.fg.ats_fma_discrete_word.Data;
    rtb_discrete_word_3_SSM = A380FadecComputer_U.in.prim_2.fg.discrete_word_3.SSM;
    rtb_discrete_word_3_Data = A380FadecComputer_U.in.prim_2.fg.discrete_word_3.Data;
    rtb_discrete_word_1_k_SSM = A380FadecComputer_U.in.prim_2.fg.discrete_word_1.SSM;
    rtb_discrete_word_1_k_Data = A380FadecComputer_U.in.prim_2.fg.discrete_word_1.Data;
    rtb_discrete_word_2_SSM = A380FadecComputer_U.in.prim_2.fg.discrete_word_2.SSM;
    rtb_discrete_word_2_Data = A380FadecComputer_U.in.prim_2.fg.discrete_word_2.Data;
    rtb_discrete_word_6_SSM = A380FadecComputer_U.in.prim_2.fg.discrete_word_6.SSM;
    rtb_discrete_word_6_Data = A380FadecComputer_U.in.prim_2.fg.discrete_word_6.Data;
    rtb_low_target_speed_margin_kts_SSM = A380FadecComputer_U.in.prim_2.fg.low_target_speed_margin_kts.SSM;
    rtb_low_target_speed_margin_kts_Data = A380FadecComputer_U.in.prim_2.fg.low_target_speed_margin_kts.Data;
    rtb_high_target_speed_margin_kts_SSM = A380FadecComputer_U.in.prim_2.fg.high_target_speed_margin_kts.SSM;
    rtb_high_target_speed_margin_kts_Data = A380FadecComputer_U.in.prim_2.fg.high_target_speed_margin_kts.Data;
    rtb_nosewheel_cmd_deg_SSM = A380FadecComputer_U.in.prim_2.fg.nosewheel_cmd_deg.SSM;
    rtb_nosewheel_cmd_deg_Data = A380FadecComputer_U.in.prim_2.fg.nosewheel_cmd_deg.Data;
    rtb_n1_command_percent_SSM = A380FadecComputer_U.in.prim_2.fg.n1_command_percent.SSM;
    rtb_n1_command_percent_Data = A380FadecComputer_U.in.prim_2.fg.n1_command_percent.Data;
    rtb_flx_to_temp_deg_c_SSM = A380FadecComputer_U.in.prim_2.fg.flx_to_temp_deg_c.SSM;
    rtb_flx_to_temp_deg_c_Data = A380FadecComputer_U.in.prim_2.fg.flx_to_temp_deg_c.Data;
    rtb_BusAssignment_b_prim_input_fg_discrete_word_7_SSM = A380FadecComputer_U.in.prim_2.fg.discrete_word_7.SSM;
    rtb_BusAssignment_b_prim_input_fg_discrete_word_7_Data = A380FadecComputer_U.in.prim_2.fg.discrete_word_7.Data;
  } else {
    rtb_left_inboard_aileron_command_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.left_inboard_aileron_command_deg.SSM;
    rtb_left_inboard_aileron_command_deg_Data = A380FadecComputer_U.in.prim_3.fctl.left_inboard_aileron_command_deg.Data;
    rtb_right_inboard_aileron_command_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.right_inboard_aileron_command_deg.SSM;
    rtb_right_inboard_aileron_command_deg_Data =
      A380FadecComputer_U.in.prim_3.fctl.right_inboard_aileron_command_deg.Data;
    rtb_left_midboard_aileron_command_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.left_midboard_aileron_command_deg.SSM;
    rtb_left_midboard_aileron_command_deg_Data =
      A380FadecComputer_U.in.prim_3.fctl.left_midboard_aileron_command_deg.Data;
    rtb_right_midboard_aileron_command_deg_SSM =
      A380FadecComputer_U.in.prim_3.fctl.right_midboard_aileron_command_deg.SSM;
    rtb_right_midboard_aileron_command_deg_Data =
      A380FadecComputer_U.in.prim_3.fctl.right_midboard_aileron_command_deg.Data;
    rtb_left_outboard_aileron_command_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.left_outboard_aileron_command_deg.SSM;
    rtb_left_outboard_aileron_command_deg_Data =
      A380FadecComputer_U.in.prim_3.fctl.left_outboard_aileron_command_deg.Data;
    rtb_right_outboard_aileron_command_deg_SSM =
      A380FadecComputer_U.in.prim_3.fctl.right_outboard_aileron_command_deg.SSM;
    rtb_right_outboard_aileron_command_deg_Data =
      A380FadecComputer_U.in.prim_3.fctl.right_outboard_aileron_command_deg.Data;
    rtb_left_spoiler_1_command_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.left_spoiler_1_command_deg.SSM;
    rtb_left_spoiler_1_command_deg_Data = A380FadecComputer_U.in.prim_3.fctl.left_spoiler_1_command_deg.Data;
    rtb_right_spoiler_1_command_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.right_spoiler_1_command_deg.SSM;
    rtb_right_spoiler_1_command_deg_Data = A380FadecComputer_U.in.prim_3.fctl.right_spoiler_1_command_deg.Data;
    rtb_left_spoiler_2_command_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.left_spoiler_2_command_deg.SSM;
    rtb_left_spoiler_2_command_deg_Data = A380FadecComputer_U.in.prim_3.fctl.left_spoiler_2_command_deg.Data;
    rtb_right_spoiler_2_command_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.right_spoiler_2_command_deg.SSM;
    rtb_right_spoiler_2_command_deg_Data = A380FadecComputer_U.in.prim_3.fctl.right_spoiler_2_command_deg.Data;
    rtb_left_spoiler_3_command_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.left_spoiler_3_command_deg.SSM;
    rtb_left_spoiler_3_command_deg_Data = A380FadecComputer_U.in.prim_3.fctl.left_spoiler_3_command_deg.Data;
    rtb_right_spoiler_3_command_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.right_spoiler_3_command_deg.SSM;
    rtb_right_spoiler_3_command_deg_Data = A380FadecComputer_U.in.prim_3.fctl.right_spoiler_3_command_deg.Data;
    rtb_left_spoiler_4_command_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.left_spoiler_4_command_deg.SSM;
    rtb_left_spoiler_4_command_deg_Data = A380FadecComputer_U.in.prim_3.fctl.left_spoiler_4_command_deg.Data;
    rtb_right_spoiler_4_command_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.right_spoiler_4_command_deg.SSM;
    rtb_right_spoiler_4_command_deg_Data = A380FadecComputer_U.in.prim_3.fctl.right_spoiler_4_command_deg.Data;
    rtb_left_spoiler_5_command_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.left_spoiler_5_command_deg.SSM;
    rtb_left_spoiler_5_command_deg_Data = A380FadecComputer_U.in.prim_3.fctl.left_spoiler_5_command_deg.Data;
    rtb_right_spoiler_5_command_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.right_spoiler_5_command_deg.SSM;
    rtb_right_spoiler_5_command_deg_Data = A380FadecComputer_U.in.prim_3.fctl.right_spoiler_5_command_deg.Data;
    rtb_left_spoiler_6_command_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.left_spoiler_6_command_deg.SSM;
    rtb_left_spoiler_6_command_deg_Data = A380FadecComputer_U.in.prim_3.fctl.left_spoiler_6_command_deg.Data;
    rtb_right_spoiler_6_command_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.right_spoiler_6_command_deg.SSM;
    rtb_right_spoiler_6_command_deg_Data = A380FadecComputer_U.in.prim_3.fctl.right_spoiler_6_command_deg.Data;
    rtb_left_spoiler_7_command_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.left_spoiler_7_command_deg.SSM;
    rtb_left_spoiler_7_command_deg_Data = A380FadecComputer_U.in.prim_3.fctl.left_spoiler_7_command_deg.Data;
    rtb_right_spoiler_7_command_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.right_spoiler_7_command_deg.SSM;
    rtb_right_spoiler_7_command_deg_Data = A380FadecComputer_U.in.prim_3.fctl.right_spoiler_7_command_deg.Data;
    rtb_left_spoiler_8_command_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.left_spoiler_8_command_deg.SSM;
    rtb_left_spoiler_8_command_deg_Data = A380FadecComputer_U.in.prim_3.fctl.left_spoiler_8_command_deg.Data;
    rtb_right_spoiler_8_command_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.right_spoiler_8_command_deg.SSM;
    rtb_right_spoiler_8_command_deg_Data = A380FadecComputer_U.in.prim_3.fctl.right_spoiler_8_command_deg.Data;
    rtb_left_inboard_elevator_command_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.left_inboard_elevator_command_deg.SSM;
    rtb_left_inboard_elevator_command_deg_Data =
      A380FadecComputer_U.in.prim_3.fctl.left_inboard_elevator_command_deg.Data;
    rtb_right_inboard_elevator_command_deg_SSM =
      A380FadecComputer_U.in.prim_3.fctl.right_inboard_elevator_command_deg.SSM;
    rtb_right_inboard_elevator_command_deg_Data =
      A380FadecComputer_U.in.prim_3.fctl.right_inboard_elevator_command_deg.Data;
    rtb_left_outboard_elevator_command_deg_SSM =
      A380FadecComputer_U.in.prim_3.fctl.left_outboard_elevator_command_deg.SSM;
    rtb_left_outboard_elevator_command_deg_Data =
      A380FadecComputer_U.in.prim_3.fctl.left_outboard_elevator_command_deg.Data;
    rtb_right_outboard_elevator_command_deg_SSM =
      A380FadecComputer_U.in.prim_3.fctl.right_outboard_elevator_command_deg.SSM;
    rtb_right_outboard_elevator_command_deg_Data =
      A380FadecComputer_U.in.prim_3.fctl.right_outboard_elevator_command_deg.Data;
    rtb_ths_command_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.ths_command_deg.SSM;
    rtb_ths_command_deg_Data = A380FadecComputer_U.in.prim_3.fctl.ths_command_deg.Data;
    rtb_upper_rudder_command_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.upper_rudder_command_deg.SSM;
    rtb_upper_rudder_command_deg_Data = A380FadecComputer_U.in.prim_3.fctl.upper_rudder_command_deg.Data;
    rtb_lower_rudder_command_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.lower_rudder_command_deg.SSM;
    rtb_lower_rudder_command_deg_Data = A380FadecComputer_U.in.prim_3.fctl.lower_rudder_command_deg.Data;
    rtb_left_sidestick_pitch_command_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.left_sidestick_pitch_command_deg.SSM;
    rtb_left_sidestick_pitch_command_deg_Data = A380FadecComputer_U.in.prim_3.fctl.left_sidestick_pitch_command_deg.Data;
    rtb_right_sidestick_pitch_command_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.right_sidestick_pitch_command_deg.SSM;
    rtb_right_sidestick_pitch_command_deg_Data =
      A380FadecComputer_U.in.prim_3.fctl.right_sidestick_pitch_command_deg.Data;
    rtb_left_sidestick_roll_command_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.left_sidestick_roll_command_deg.SSM;
    rtb_left_sidestick_roll_command_deg_Data = A380FadecComputer_U.in.prim_3.fctl.left_sidestick_roll_command_deg.Data;
    rtb_right_sidestick_roll_command_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.right_sidestick_roll_command_deg.SSM;
    rtb_right_sidestick_roll_command_deg_Data = A380FadecComputer_U.in.prim_3.fctl.right_sidestick_roll_command_deg.Data;
    rtb_rudder_pedal_position_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.rudder_pedal_position_deg.SSM;
    rtb_rudder_pedal_position_deg_Data = A380FadecComputer_U.in.prim_3.fctl.rudder_pedal_position_deg.Data;
    rtb_aileron_status_word_SSM = A380FadecComputer_U.in.prim_3.fctl.aileron_status_word.SSM;
    rtb_aileron_status_word_Data = A380FadecComputer_U.in.prim_3.fctl.aileron_status_word.Data;
    rtb_left_aileron_1_position_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.left_aileron_1_position_deg.SSM;
    rtb_left_aileron_1_position_deg_Data = A380FadecComputer_U.in.prim_3.fctl.left_aileron_1_position_deg.Data;
    rtb_left_aileron_2_position_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.left_aileron_2_position_deg.SSM;
    rtb_left_aileron_2_position_deg_Data = A380FadecComputer_U.in.prim_3.fctl.left_aileron_2_position_deg.Data;
    rtb_right_aileron_1_position_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.right_aileron_1_position_deg.SSM;
    rtb_right_aileron_1_position_deg_Data = A380FadecComputer_U.in.prim_3.fctl.right_aileron_1_position_deg.Data;
    rtb_right_aileron_2_position_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.right_aileron_2_position_deg.SSM;
    rtb_right_aileron_2_position_deg_Data = A380FadecComputer_U.in.prim_3.fctl.right_aileron_2_position_deg.Data;
    rtb_spoiler_status_word_SSM = A380FadecComputer_U.in.prim_3.fctl.spoiler_status_word.SSM;
    rtb_spoiler_status_word_Data = A380FadecComputer_U.in.prim_3.fctl.spoiler_status_word.Data;
    rtb_left_spoiler_position_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.left_spoiler_position_deg.SSM;
    rtb_left_spoiler_position_deg_Data = A380FadecComputer_U.in.prim_3.fctl.left_spoiler_position_deg.Data;
    rtb_right_spoiler_position_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.right_spoiler_position_deg.SSM;
    rtb_right_spoiler_position_deg_Data = A380FadecComputer_U.in.prim_3.fctl.right_spoiler_position_deg.Data;
    rtb_elevator_status_word_SSM = A380FadecComputer_U.in.prim_3.fctl.elevator_status_word.SSM;
    rtb_elevator_status_word_Data = A380FadecComputer_U.in.prim_3.fctl.elevator_status_word.Data;
    rtb_elevator_1_position_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.elevator_1_position_deg.SSM;
    rtb_elevator_1_position_deg_Data = A380FadecComputer_U.in.prim_3.fctl.elevator_1_position_deg.Data;
    rtb_elevator_2_position_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.elevator_2_position_deg.SSM;
    rtb_elevator_2_position_deg_Data = A380FadecComputer_U.in.prim_3.fctl.elevator_2_position_deg.Data;
    rtb_elevator_3_position_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.elevator_3_position_deg.SSM;
    rtb_elevator_3_position_deg_Data = A380FadecComputer_U.in.prim_3.fctl.elevator_3_position_deg.Data;
    rtb_ths_position_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.ths_position_deg.SSM;
    rtb_ths_position_deg_Data = A380FadecComputer_U.in.prim_3.fctl.ths_position_deg.Data;
    rtb_rudder_status_word_SSM = A380FadecComputer_U.in.prim_3.fctl.rudder_status_word.SSM;
    rtb_rudder_status_word_Data = A380FadecComputer_U.in.prim_3.fctl.rudder_status_word.Data;
    rtb_rudder_1_position_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.rudder_1_position_deg.SSM;
    rtb_rudder_1_position_deg_Data = A380FadecComputer_U.in.prim_3.fctl.rudder_1_position_deg.Data;
    rtb_rudder_2_position_deg_SSM = A380FadecComputer_U.in.prim_3.fctl.rudder_2_position_deg.SSM;
    rtb_rudder_2_position_deg_Data = A380FadecComputer_U.in.prim_3.fctl.rudder_2_position_deg.Data;
    rtb_radio_height_1_ft_SSM = A380FadecComputer_U.in.prim_3.fctl.radio_height_1_ft.SSM;
    rtb_radio_height_1_ft_Data = A380FadecComputer_U.in.prim_3.fctl.radio_height_1_ft.Data;
    rtb_radio_height_2_ft_SSM = A380FadecComputer_U.in.prim_3.fctl.radio_height_2_ft.SSM;
    rtb_radio_height_2_ft_Data = A380FadecComputer_U.in.prim_3.fctl.radio_height_2_ft.Data;
    rtb_fctl_law_status_word_SSM = A380FadecComputer_U.in.prim_3.fctl.fctl_law_status_word.SSM;
    rtb_fctl_law_status_word_Data = A380FadecComputer_U.in.prim_3.fctl.fctl_law_status_word.Data;
    rtb_discrete_status_word_1_SSM = A380FadecComputer_U.in.prim_3.fctl.discrete_status_word_1.SSM;
    rtb_discrete_status_word_1_Data = A380FadecComputer_U.in.prim_3.fctl.discrete_status_word_1.Data;
    rtb_v_alpha_lim_kn_SSM = A380FadecComputer_U.in.prim_3.fctl.v_alpha_lim_kn.SSM;
    rtb_v_alpha_lim_kn_Data = A380FadecComputer_U.in.prim_3.fctl.v_alpha_lim_kn.Data;
    rtb_v_alpha_prot_kn_SSM = A380FadecComputer_U.in.prim_3.fctl.v_alpha_prot_kn.SSM;
    rtb_v_alpha_prot_kn_Data = A380FadecComputer_U.in.prim_3.fctl.v_alpha_prot_kn.Data;
    rtb_fctl_v_alpha_stall_warn_kn_SSM = A380FadecComputer_U.in.prim_3.fctl.v_alpha_stall_warn_kn.SSM;
    rtb_fctl_v_alpha_stall_warn_kn_Data = A380FadecComputer_U.in.prim_3.fctl.v_alpha_stall_warn_kn.Data;
    rtb_gamma_a_deg_SSM = A380FadecComputer_U.in.prim_3.fe.gamma_a_deg.SSM;
    rtb_gamma_a_deg_Data = A380FadecComputer_U.in.prim_3.fe.gamma_a_deg.Data;
    rtb_gamma_t_deg_SSM = A380FadecComputer_U.in.prim_3.fe.gamma_t_deg.SSM;
    rtb_gamma_t_deg_Data = A380FadecComputer_U.in.prim_3.fe.gamma_t_deg.Data;
    rtb_sideslip_target_deg_SSM = A380FadecComputer_U.in.prim_3.fe.sideslip_target_deg.SSM;
    rtb_sideslip_target_deg_Data = A380FadecComputer_U.in.prim_3.fe.sideslip_target_deg.Data;
    rtb_v_ls_kn_SSM = A380FadecComputer_U.in.prim_3.fe.v_ls_kn.SSM;
    rtb_v_ls_kn_Data = A380FadecComputer_U.in.prim_3.fe.v_ls_kn.Data;
    rtb_v_stall_kn_SSM = A380FadecComputer_U.in.prim_3.fe.v_stall_kn.SSM;
    rtb_v_stall_kn_Data = A380FadecComputer_U.in.prim_3.fe.v_stall_kn.Data;
    rtb_speed_trend_kn_SSM = A380FadecComputer_U.in.prim_3.fe.speed_trend_kn.SSM;
    rtb_speed_trend_kn_Data = A380FadecComputer_U.in.prim_3.fe.speed_trend_kn.Data;
    rtb_v_3_kn_SSM = A380FadecComputer_U.in.prim_3.fe.v_3_kn.SSM;
    rtb_v_3_kn_Data = A380FadecComputer_U.in.prim_3.fe.v_3_kn.Data;
    rtb_v_4_kn_SSM = A380FadecComputer_U.in.prim_3.fe.v_4_kn.SSM;
    rtb_v_4_kn_Data = A380FadecComputer_U.in.prim_3.fe.v_4_kn.Data;
    rtb_v_man_kn_SSM = A380FadecComputer_U.in.prim_3.fe.v_man_kn.SSM;
    rtb_v_man_kn_Data = A380FadecComputer_U.in.prim_3.fe.v_man_kn.Data;
    rtb_v_max_kn_SSM = A380FadecComputer_U.in.prim_3.fe.v_max_kn.SSM;
    rtb_v_max_kn_Data = A380FadecComputer_U.in.prim_3.fe.v_max_kn.Data;
    rtb_v_fe_next_kn_SSM = A380FadecComputer_U.in.prim_3.fe.v_fe_next_kn.SSM;
    rtb_v_fe_next_kn_Data = A380FadecComputer_U.in.prim_3.fe.v_fe_next_kn.Data;
    rtb_fe_discrete_word_1_SSM = A380FadecComputer_U.in.prim_3.fe.discrete_word_1.SSM;
    rtb_fe_discrete_word_1_Data = A380FadecComputer_U.in.prim_3.fe.discrete_word_1.Data;
    rtb_pfd_spd_tgt_kts_SSM = A380FadecComputer_U.in.prim_3.fg.pfd_spd_tgt_kts.SSM;
    rtb_pfd_spd_tgt_kts_Data = A380FadecComputer_U.in.prim_3.fg.pfd_spd_tgt_kts.Data;
    rtb_pfd_short_term_mngd_spd_kts_SSM = A380FadecComputer_U.in.prim_3.fg.pfd_short_term_mngd_spd_kts.SSM;
    rtb_pfd_short_term_mngd_spd_kts_Data = A380FadecComputer_U.in.prim_3.fg.pfd_short_term_mngd_spd_kts.Data;
    rtb_selected_spd_kts_SSM = A380FadecComputer_U.in.prim_3.fg.selected_spd_kts.SSM;
    rtb_selected_spd_kts_Data = A380FadecComputer_U.in.prim_3.fg.selected_spd_kts.Data;
    rtb_selected_mach_kts_SSM = A380FadecComputer_U.in.prim_3.fg.selected_mach_kts.SSM;
    rtb_selected_mach_kts_Data = A380FadecComputer_U.in.prim_3.fg.selected_mach_kts.Data;
    rtb_selected_hdg_deg_SSM = A380FadecComputer_U.in.prim_3.fg.selected_hdg_deg.SSM;
    rtb_selected_hdg_deg_Data = A380FadecComputer_U.in.prim_3.fg.selected_hdg_deg.Data;
    rtb_selected_trk_deg_SSM = A380FadecComputer_U.in.prim_3.fg.selected_trk_deg.SSM;
    rtb_selected_trk_deg_Data = A380FadecComputer_U.in.prim_3.fg.selected_trk_deg.Data;
    rtb_selected_alt_ft_SSM = A380FadecComputer_U.in.prim_3.fg.selected_alt_ft.SSM;
    rtb_selected_alt_ft_Data = A380FadecComputer_U.in.prim_3.fg.selected_alt_ft.Data;
    rtb_selected_vs_ft_min_SSM = A380FadecComputer_U.in.prim_3.fg.selected_vs_ft_min.SSM;
    rtb_selected_vs_ft_min_Data = A380FadecComputer_U.in.prim_3.fg.selected_vs_ft_min.Data;
    rtb_selected_fpa_deg_SSM = A380FadecComputer_U.in.prim_3.fg.selected_fpa_deg.SSM;
    rtb_selected_fpa_deg_Data = A380FadecComputer_U.in.prim_3.fg.selected_fpa_deg.Data;
    rtb_runway_hdg_memorized_deg_SSM = A380FadecComputer_U.in.prim_3.fg.runway_hdg_memorized_deg.SSM;
    rtb_runway_hdg_memorized_deg_Data = A380FadecComputer_U.in.prim_3.fg.runway_hdg_memorized_deg.Data;
    rtb_preset_mach_from_fms_SSM = A380FadecComputer_U.in.prim_3.fg.preset_mach_from_fms.SSM;
    rtb_preset_mach_from_fms_Data = A380FadecComputer_U.in.prim_3.fg.preset_mach_from_fms.Data;
    rtb_preset_speed_from_fms_kts_SSM = A380FadecComputer_U.in.prim_3.fg.preset_speed_from_fms_kts.SSM;
    rtb_preset_speed_from_fms_kts_Data = A380FadecComputer_U.in.prim_3.fg.preset_speed_from_fms_kts.Data;
    rtb_roll_fd_command_1_SSM = A380FadecComputer_U.in.prim_3.fg.roll_fd_command_1.SSM;
    rtb_roll_fd_command_1_Data = A380FadecComputer_U.in.prim_3.fg.roll_fd_command_1.Data;
    rtb_pitch_fd_command_1_SSM = A380FadecComputer_U.in.prim_3.fg.pitch_fd_command_1.SSM;
    rtb_pitch_fd_command_1_Data = A380FadecComputer_U.in.prim_3.fg.pitch_fd_command_1.Data;
    rtb_yaw_fd_command_1_SSM = A380FadecComputer_U.in.prim_3.fg.yaw_fd_command_1.SSM;
    rtb_yaw_fd_command_1_Data = A380FadecComputer_U.in.prim_3.fg.yaw_fd_command_1.Data;
    rtb_roll_fd_command_2_SSM = A380FadecComputer_U.in.prim_3.fg.roll_fd_command_2.SSM;
    rtb_roll_fd_command_2_Data = A380FadecComputer_U.in.prim_3.fg.roll_fd_command_2.Data;
    rtb_pitch_fd_command_2_SSM = A380FadecComputer_U.in.prim_3.fg.pitch_fd_command_2.SSM;
    rtb_pitch_fd_command_2_Data = A380FadecComputer_U.in.prim_3.fg.pitch_fd_command_2.Data;
    rtb_yaw_fd_command_2_SSM = A380FadecComputer_U.in.prim_3.fg.yaw_fd_command_2.SSM;
    rtb_yaw_fd_command_2_Data = A380FadecComputer_U.in.prim_3.fg.yaw_fd_command_2.Data;
    rtb_discrete_word_5_SSM = A380FadecComputer_U.in.prim_3.fg.discrete_word_5.SSM;
    rtb_discrete_word_5_Data = A380FadecComputer_U.in.prim_3.fg.discrete_word_5.Data;
    rtb_discrete_word_4_SSM = A380FadecComputer_U.in.prim_3.fg.discrete_word_4.SSM;
    rtb_discrete_word_4_Data = A380FadecComputer_U.in.prim_3.fg.discrete_word_4.Data;
    rtb_fm_alt_constraint_ft_SSM = A380FadecComputer_U.in.prim_3.fg.fm_alt_constraint_ft.SSM;
    rtb_fm_alt_constraint_ft_Data = A380FadecComputer_U.in.prim_3.fg.fm_alt_constraint_ft.Data;
    rtb_BusAssignment_o_prim_input_fg_ats_discrete_word = &A380FadecComputer_U.in.prim_3.fg.ats_discrete_word;
    rtb_ats_fma_discrete_word_SSM = A380FadecComputer_U.in.prim_3.fg.ats_fma_discrete_word.SSM;
    rtb_ats_fma_discrete_word_Data = A380FadecComputer_U.in.prim_3.fg.ats_fma_discrete_word.Data;
    rtb_discrete_word_3_SSM = A380FadecComputer_U.in.prim_3.fg.discrete_word_3.SSM;
    rtb_discrete_word_3_Data = A380FadecComputer_U.in.prim_3.fg.discrete_word_3.Data;
    rtb_discrete_word_1_k_SSM = A380FadecComputer_U.in.prim_3.fg.discrete_word_1.SSM;
    rtb_discrete_word_1_k_Data = A380FadecComputer_U.in.prim_3.fg.discrete_word_1.Data;
    rtb_discrete_word_2_SSM = A380FadecComputer_U.in.prim_3.fg.discrete_word_2.SSM;
    rtb_discrete_word_2_Data = A380FadecComputer_U.in.prim_3.fg.discrete_word_2.Data;
    rtb_discrete_word_6_SSM = A380FadecComputer_U.in.prim_3.fg.discrete_word_6.SSM;
    rtb_discrete_word_6_Data = A380FadecComputer_U.in.prim_3.fg.discrete_word_6.Data;
    rtb_low_target_speed_margin_kts_SSM = A380FadecComputer_U.in.prim_3.fg.low_target_speed_margin_kts.SSM;
    rtb_low_target_speed_margin_kts_Data = A380FadecComputer_U.in.prim_3.fg.low_target_speed_margin_kts.Data;
    rtb_high_target_speed_margin_kts_SSM = A380FadecComputer_U.in.prim_3.fg.high_target_speed_margin_kts.SSM;
    rtb_high_target_speed_margin_kts_Data = A380FadecComputer_U.in.prim_3.fg.high_target_speed_margin_kts.Data;
    rtb_nosewheel_cmd_deg_SSM = A380FadecComputer_U.in.prim_3.fg.nosewheel_cmd_deg.SSM;
    rtb_nosewheel_cmd_deg_Data = A380FadecComputer_U.in.prim_3.fg.nosewheel_cmd_deg.Data;
    rtb_n1_command_percent_SSM = A380FadecComputer_U.in.prim_3.fg.n1_command_percent.SSM;
    rtb_n1_command_percent_Data = A380FadecComputer_U.in.prim_3.fg.n1_command_percent.Data;
    rtb_flx_to_temp_deg_c_SSM = A380FadecComputer_U.in.prim_3.fg.flx_to_temp_deg_c.SSM;
    rtb_flx_to_temp_deg_c_Data = A380FadecComputer_U.in.prim_3.fg.flx_to_temp_deg_c.Data;
    rtb_BusAssignment_b_prim_input_fg_discrete_word_7_SSM = A380FadecComputer_U.in.prim_3.fg.discrete_word_7.SSM;
    rtb_BusAssignment_b_prim_input_fg_discrete_word_7_Data = A380FadecComputer_U.in.prim_3.fg.discrete_word_7.Data;
  }

  A380FadecComputer_TimeSinceCondition(A380FadecComputer_U.in.time.simulation_time,
    A380FadecComputer_U.in.input.ATHR_disconnect, &rtb_Switch, &A380FadecComputer_DWork.sf_TimeSinceCondition);
  A380FadecComputer_DWork.Memory_PreviousInput = A380FadecComputer_P.Logic_table[(((static_cast<uint32_T>(rtb_Switch >=
    A380FadecComputer_P.CompareToConstant_const) << 1) + A380FadecComputer_U.in.input.ATHR_reset_disable) << 1) +
    A380FadecComputer_DWork.Memory_PreviousInput];
  A380FadecComputer_MATLABFunction(&A380FadecComputer_rtZbase_arinc_429, &rtb_NOT1_f);
  A380FadecComputer_MATLABFunction_p(&A380FadecComputer_rtZbase_arinc_429,
    A380FadecComputer_P.A429ValueOrDefault_defaultValue, &rtb_y_b);
  rtb_y_mv = (rtb_NOT1_f && (rtb_y_b > A380FadecComputer_U.in.data.TAT_degC));
  A380FadecComputer_DWork.latch = ((rtb_y_mv && A380FadecComputer_U.in.data.on_ground &&
    (A380FadecComputer_U.in.input.TLA_deg == 35.0)) || A380FadecComputer_DWork.latch);
  A380FadecComputer_DWork.latch = (((!A380FadecComputer_DWork.latch) || ((A380FadecComputer_U.in.input.TLA_deg != 25.0) &&
    (A380FadecComputer_U.in.input.TLA_deg != 45.0))) && A380FadecComputer_DWork.latch);
  rtb_y_mv = ((rtb_y_mv && A380FadecComputer_U.in.data.on_ground) || ((!A380FadecComputer_U.in.data.on_ground) &&
    A380FadecComputer_DWork.latch));
  A380FadecComputer_TimeSinceCondition(A380FadecComputer_U.in.time.simulation_time,
    A380FadecComputer_U.in.data.on_ground, &rtb_Switch, &A380FadecComputer_DWork.sf_TimeSinceCondition1);
  rtb_N1c = A380FadecComputer_U.in.input.TLA_deg;
  if (!A380FadecComputer_U.in.data.on_ground) {
    rtb_N1c = std::fmax(0.0, A380FadecComputer_U.in.input.TLA_deg);
  }

  rtb_OR2 = (rtb_N1c < 0.0);
  if (rtb_N1c >= 0.0) {
    if (rtb_N1c <= 25.0) {
      TLA_begin = 0;
      N1_begin = A380FadecComputer_U.in.input.thrust_limit_IDLE_percent;
      TLA_end = 25;
      N1_end = A380FadecComputer_U.in.input.thrust_limit_CLB_percent;
    } else if (rtb_N1c <= 35.0) {
      TLA_begin = 25;
      N1_begin = A380FadecComputer_U.in.input.thrust_limit_CLB_percent;
      TLA_end = 35;
      if (rtb_y_mv) {
        N1_end = A380FadecComputer_U.in.input.thrust_limit_FLEX_percent;
      } else {
        N1_end = A380FadecComputer_U.in.input.thrust_limit_MCT_percent;
      }
    } else {
      TLA_begin = 35;
      if (rtb_y_mv) {
        N1_begin = A380FadecComputer_U.in.input.thrust_limit_FLEX_percent;
      } else {
        N1_begin = A380FadecComputer_U.in.input.thrust_limit_MCT_percent;
      }

      TLA_end = 45;
      N1_end = A380FadecComputer_U.in.input.thrust_limit_TOGA_percent;
    }
  } else {
    rtb_N1c = std::fmax(std::abs(rtb_N1c), 6.0);
    TLA_begin = 6;
    N1_begin = std::abs(A380FadecComputer_U.in.input.thrust_limit_IDLE_percent + 1.0);
    TLA_end = 20;
    N1_end = std::abs(A380FadecComputer_U.in.input.thrust_limit_REV_percent);
  }

  rtb_N1c = (N1_end - N1_begin) / static_cast<real_T>(TLA_end - TLA_begin) * (rtb_N1c - static_cast<real_T>(TLA_begin))
    + N1_begin;
  A380FadecComputer_MATLABFunction_g(rtb_BusAssignment_o_prim_input_fg_ats_discrete_word,
    A380FadecComputer_P.BitfromLabel_bit, &rtb_y_e);
  N1_begin = A380FadecComputer_U.in.input.TLA_deg;
  if (!A380FadecComputer_U.in.data.on_ground) {
    N1_begin = std::fmax(0.0, A380FadecComputer_U.in.input.TLA_deg);
  }

  if ((!A380FadecComputer_U.in.data.on_ground) || (!A380FadecComputer_U.in.data.is_engine_operative)) {
    if (rtb_y_e != 0U) {
      rtb_type = athr_thrust_limit_type::TOGA;
      N1_begin = A380FadecComputer_U.in.input.thrust_limit_TOGA_percent;
    } else if (N1_begin > 35.0) {
      rtb_type = athr_thrust_limit_type::TOGA;
      N1_begin = A380FadecComputer_U.in.input.thrust_limit_TOGA_percent;
    } else if (N1_begin > 25.0) {
      if (!rtb_y_mv) {
        rtb_type = athr_thrust_limit_type::MCT;
        N1_begin = A380FadecComputer_U.in.input.thrust_limit_MCT_percent;
      } else {
        rtb_type = athr_thrust_limit_type::FLEX;
        N1_begin = A380FadecComputer_U.in.input.thrust_limit_FLEX_percent;
      }
    } else if (N1_begin >= 0.0) {
      rtb_type = athr_thrust_limit_type::CLB;
      N1_begin = A380FadecComputer_U.in.input.thrust_limit_CLB_percent;
    } else if (N1_begin < 0.0) {
      rtb_type = athr_thrust_limit_type::REVERSE;
      N1_begin = A380FadecComputer_U.in.input.thrust_limit_REV_percent;
    } else {
      rtb_type = athr_thrust_limit_type::NONE;
      N1_begin = 0.0;
    }
  } else if (N1_begin >= 0.0) {
    if ((!rtb_y_mv) || (N1_begin > 35.0)) {
      rtb_type = athr_thrust_limit_type::TOGA;
      N1_begin = A380FadecComputer_U.in.input.thrust_limit_TOGA_percent;
    } else {
      rtb_type = athr_thrust_limit_type::FLEX;
      N1_begin = A380FadecComputer_U.in.input.thrust_limit_FLEX_percent;
    }
  } else if (N1_begin < 0.0) {
    rtb_type = athr_thrust_limit_type::REVERSE;
    N1_begin = A380FadecComputer_U.in.input.thrust_limit_REV_percent;
  } else {
    rtb_type = athr_thrust_limit_type::NONE;
    N1_begin = 0.0;
  }

  rtb_BusAssignment_e_data_computed_TLA_in_active_range = (A380FadecComputer_U.in.input.TLA_deg <=
    A380FadecComputer_P.CompareToConstant1_const);
  rtb_BusAssignment_e_prim_input_fg_n1_command_percent.SSM = rtb_n1_command_percent_SSM;
  rtb_BusAssignment_e_prim_input_fg_n1_command_percent.Data = rtb_n1_command_percent_Data;
  A380FadecComputer_MATLABFunction_g(rtb_BusAssignment_o_prim_input_fg_ats_discrete_word,
    A380FadecComputer_P.BitfromLabel4_bit, &rtb_y_ms);
  A380FadecComputer_MATLABFunction_g(rtb_BusAssignment_o_prim_input_fg_ats_discrete_word,
    A380FadecComputer_P.BitfromLabel5_bit, &rtb_y_pv);
  A380FadecComputer_MATLABFunction_g(rtb_BusAssignment_o_prim_input_fg_ats_discrete_word,
    A380FadecComputer_P.BitfromLabel_bit_g, &rtb_y_e);
  A380FadecComputer_MATLABFunction(&rtb_BusAssignment_e_prim_input_fg_n1_command_percent, &rtb_NOT1_f);
  rtb_AND = ((rtb_y_e != 0U) && rtb_NOT1_f);
  A380FadecComputer_MATLABFunction_f(rtb_AND, A380FadecComputer_P.PulseNode_isRisingEdge, &rtb_NOT1_f,
    &A380FadecComputer_DWork.sf_MATLABFunction_f);
  A380FadecComputer_MATLABFunction_g(rtb_BusAssignment_o_prim_input_fg_ats_discrete_word,
    A380FadecComputer_P.BitfromLabel1_bit, &rtb_y_e);
  rtb_y_e = (((A380FadecComputer_U.in.input.ATHR_disconnect || A380FadecComputer_DWork.Memory_PreviousInput || (rtb_y_e ==
    0U)) + (static_cast<uint32_T>(rtb_NOT1_f) << 1)) << 1) + A380FadecComputer_DWork.Memory_PreviousInput_p;
  A380FadecComputer_DWork.Memory_PreviousInput_p = A380FadecComputer_P.Logic_table_n[rtb_y_e];
  A380FadecComputer_MATLABFunction_f(A380FadecComputer_P.Logic_table_n[rtb_y_e + 8U],
    A380FadecComputer_P.PulseNode1_isRisingEdge, &rtb_NOT1_f, &A380FadecComputer_DWork.sf_MATLABFunction_b);
  rtb_y_o = (((A380FadecComputer_U.in.input.TLA_deg > 26.0) || (A380FadecComputer_U.in.input.TLA_deg < 24.0)) &&
             ((A380FadecComputer_U.in.input.TLA_deg > 36.0) || (A380FadecComputer_U.in.input.TLA_deg < 34.0)));
  A380FadecComputer_DWork.Memory_PreviousInput_j = A380FadecComputer_P.Logic_table_h[(((static_cast<uint32_T>(rtb_NOT1_f
    && (!rtb_y_o)) << 1) + (rtb_y_o || A380FadecComputer_DWork.Memory_PreviousInput_p)) << 1) +
    A380FadecComputer_DWork.Memory_PreviousInput_j];
  if (!A380FadecComputer_DWork.pU_not_empty) {
    A380FadecComputer_DWork.pU = A380FadecComputer_U.in.data.engine_N1_percent;
    A380FadecComputer_DWork.pU_not_empty = true;
  }

  if (!A380FadecComputer_DWork.Memory_PreviousInput_j) {
    A380FadecComputer_DWork.pU = A380FadecComputer_U.in.data.engine_N1_percent;
  }

  A380FadecComputer_MATLABFunction_p(&rtb_BusAssignment_e_prim_input_fg_n1_command_percent,
    A380FadecComputer_P.A429ValueOrDefault_defaultValue_a, &rtb_y_b);
  A380FadecComputer_MATLABFunction_g(rtb_BusAssignment_o_prim_input_fg_ats_discrete_word,
    A380FadecComputer_P.BitfromLabel3_bit, &rtb_y_e);
  rtb_NOT1_f = (rtb_BusAssignment_e_data_computed_TLA_in_active_range || (rtb_y_e != 0U));
  A380FadecComputer_MATLABFunction_g(rtb_BusAssignment_o_prim_input_fg_ats_discrete_word,
    A380FadecComputer_P.BitfromLabel2_bit, &rtb_y_e);
  if (rtb_NOT1_f && (rtb_y_e != 0U) && rtb_AND && A380FadecComputer_DWork.Memory_PreviousInput_p) {
    if ((rtb_y_ms != 0U) && (rtb_y_pv != 0U) && (!A380FadecComputer_U.in.data.on_ground)) {
      N1_end = A380FadecComputer_U.in.input.thrust_limit_TOGA_percent;
      rtb_Switch2_idx_1 = rtb_N1c;
    } else {
      N1_end = rtb_N1c;
      rtb_Switch2_idx_1 = A380FadecComputer_U.in.input.thrust_limit_IDLE_percent;
    }

    if (rtb_y_b > N1_end) {
      N1_end = static_cast<real32_T>(N1_end);
    } else if (rtb_y_b < rtb_Switch2_idx_1) {
      N1_end = static_cast<real32_T>(rtb_Switch2_idx_1);
    } else {
      N1_end = rtb_y_b;
    }
  } else if (A380FadecComputer_DWork.Memory_PreviousInput_j) {
    N1_end = A380FadecComputer_DWork.pU;
  } else {
    N1_end = rtb_N1c;
  }

  rtb_Switch2_idx_1 = N1_end;
  if ((A380FadecComputer_U.in.data.V_ias_kn < 60.0) && (N1_end > 62.5) && (N1_end < 73.5)) {
    if (N1_end < 68.0) {
      N1_end = 62.5;
    } else {
      N1_end = 73.5;
    }
  }

  if (A380FadecComputer_U.in.data.V_ias_kn < 35.0) {
    N1_end = std::fmin(N1_end, 76.5);
  }

  rtb_Sum = N1_end - A380FadecComputer_U.in.data.engine_N1_percent;
  if (std::abs(rtb_Sum) > 0.8) {
    A380FadecComputer_DWork.Delay_DSTATE = A380FadecComputer_P.DiscreteTimeIntegratorVariableTs_InitialCondition;
    rtb_Sum = 0.0;
  }

  A380FadecComputer_DWork.Delay_DSTATE += A380FadecComputer_P.Gain_Gain * rtb_Sum *
    A380FadecComputer_P.DiscreteTimeIntegratorVariableTs_Gain * A380FadecComputer_U.in.time.dt;
  if (A380FadecComputer_DWork.Delay_DSTATE > A380FadecComputer_P.DiscreteTimeIntegratorVariableTs_UpperLimit) {
    A380FadecComputer_DWork.Delay_DSTATE = A380FadecComputer_P.DiscreteTimeIntegratorVariableTs_UpperLimit;
  } else if (A380FadecComputer_DWork.Delay_DSTATE < A380FadecComputer_P.DiscreteTimeIntegratorVariableTs_LowerLimit) {
    A380FadecComputer_DWork.Delay_DSTATE = A380FadecComputer_P.DiscreteTimeIntegratorVariableTs_LowerLimit;
  }

  N1_end = (N1_end + A380FadecComputer_DWork.Delay_DSTATE) - A380FadecComputer_U.in.data.commanded_engine_N1_percent;
  if (rtb_OR2) {
    A380FadecComputer_DWork.Delay_DSTATE_n = A380FadecComputer_P.DiscreteTimeIntegratorVariableTs_InitialCondition_p;
  }

  A380FadecComputer_DWork.Delay_DSTATE_n += A380FadecComputer_P.Gain_Gain_d * N1_end *
    A380FadecComputer_P.DiscreteTimeIntegratorVariableTs_Gain_l * A380FadecComputer_U.in.time.dt;
  if (A380FadecComputer_DWork.Delay_DSTATE_n > A380FadecComputer_P.DiscreteTimeIntegratorVariableTs_UpperLimit_l) {
    A380FadecComputer_DWork.Delay_DSTATE_n = A380FadecComputer_P.DiscreteTimeIntegratorVariableTs_UpperLimit_l;
  } else if (A380FadecComputer_DWork.Delay_DSTATE_n < A380FadecComputer_P.DiscreteTimeIntegratorVariableTs_LowerLimit_d)
  {
    A380FadecComputer_DWork.Delay_DSTATE_n = A380FadecComputer_P.DiscreteTimeIntegratorVariableTs_LowerLimit_d;
  }

  rtb_NOT1_f = !rtb_OR2;
  if (rtb_NOT1_f) {
    A380FadecComputer_DWork.Delay_DSTATE_l = A380FadecComputer_P.DiscreteTimeIntegratorVariableTs1_InitialCondition;
  }

  A380FadecComputer_DWork.Delay_DSTATE_l += A380FadecComputer_P.Gain1_Gain * N1_end *
    A380FadecComputer_P.DiscreteTimeIntegratorVariableTs1_Gain * A380FadecComputer_U.in.time.dt;
  if (A380FadecComputer_DWork.Delay_DSTATE_l > A380FadecComputer_P.DiscreteTimeIntegratorVariableTs1_UpperLimit) {
    A380FadecComputer_DWork.Delay_DSTATE_l = A380FadecComputer_P.DiscreteTimeIntegratorVariableTs1_UpperLimit;
  } else if (A380FadecComputer_DWork.Delay_DSTATE_l < A380FadecComputer_P.DiscreteTimeIntegratorVariableTs1_LowerLimit)
  {
    A380FadecComputer_DWork.Delay_DSTATE_l = A380FadecComputer_P.DiscreteTimeIntegratorVariableTs1_LowerLimit;
  }

  A380FadecComputer_MATLABFunction_p(&A380FadecComputer_rtZbase_arinc_429,
    A380FadecComputer_P.A429ValueOrDefault_defaultValue_n, &rtb_y_b);
  rtb_VectorConcatenate[0] = A380FadecComputer_P.Constant_Value;
  rtb_VectorConcatenate[1] = A380FadecComputer_P.Constant_Value;
  rtb_VectorConcatenate[2] = A380FadecComputer_P.Constant_Value;
  rtb_VectorConcatenate[3] = A380FadecComputer_P.Constant_Value;
  rtb_VectorConcatenate[4] = (rtb_type == A380FadecComputer_P.EnumeratedConstant2_Value);
  rtb_VectorConcatenate[5] = A380FadecComputer_P.Constant_Value;
  rtb_VectorConcatenate[6] = A380FadecComputer_P.Constant_Value;
  rtb_VectorConcatenate[7] = A380FadecComputer_P.Constant_Value;
  rtb_VectorConcatenate[8] = A380FadecComputer_DWork.Memory_PreviousInput_p;
  rtb_VectorConcatenate[9] = A380FadecComputer_P.Constant_Value;
  A380FadecComputer_MATLABFunction_g(rtb_BusAssignment_o_prim_input_fg_ats_discrete_word,
    A380FadecComputer_P.BitfromLabel5_bit_h, &rtb_y_e);
  rtb_VectorConcatenate[10] = (rtb_y_e != 0U);
  rtb_VectorConcatenate[11] = (rtb_type == athr_thrust_limit_type::TOGA);
  rtb_VectorConcatenate[12] = (rtb_type == athr_thrust_limit_type::FLEX);
  rtb_VectorConcatenate[13] = (rtb_type == athr_thrust_limit_type::MCT);
  rtb_VectorConcatenate[14] = (rtb_type == athr_thrust_limit_type::CLB);
  rtb_VectorConcatenate[15] = A380FadecComputer_P.Constant_Value;
  rtb_VectorConcatenate[16] = A380FadecComputer_P.Constant_Value;
  rtb_VectorConcatenate[17] = A380FadecComputer_P.Constant_Value;
  rtb_VectorConcatenate[18] = A380FadecComputer_P.Constant_Value;
  A380FadecComputer_MATLABFunction_l(rtb_VectorConcatenate,
    &A380FadecComputer_Y.out.fadec_bus_output.ecu_status_word_3.Data);
  rtb_VectorConcatenate[0] = A380FadecComputer_P.Constant4_Value;
  rtb_VectorConcatenate[1] = A380FadecComputer_P.Constant4_Value;
  rtb_VectorConcatenate[2] = A380FadecComputer_P.Constant4_Value;
  rtb_VectorConcatenate[3] = A380FadecComputer_P.Constant4_Value;
  rtb_VectorConcatenate[4] = A380FadecComputer_P.Constant4_Value;
  rtb_VectorConcatenate[5] = A380FadecComputer_P.Constant4_Value;
  rtb_VectorConcatenate[6] = A380FadecComputer_P.Constant4_Value;
  rtb_VectorConcatenate[7] = A380FadecComputer_U.in.data.is_engine_operative;
  rtb_VectorConcatenate[8] = A380FadecComputer_P.Constant4_Value;
  rtb_VectorConcatenate[9] = A380FadecComputer_P.Constant4_Value;
  rtb_VectorConcatenate[10] = A380FadecComputer_P.Constant4_Value;
  rtb_VectorConcatenate[11] = A380FadecComputer_P.Constant4_Value;
  rtb_VectorConcatenate[12] = A380FadecComputer_P.Constant4_Value;
  rtb_VectorConcatenate[13] = A380FadecComputer_P.Constant4_Value;
  rtb_VectorConcatenate[14] = A380FadecComputer_P.Constant4_Value;
  rtb_VectorConcatenate[15] = A380FadecComputer_P.Constant4_Value;
  rtb_VectorConcatenate[16] = A380FadecComputer_P.Constant4_Value;
  rtb_VectorConcatenate[17] = A380FadecComputer_P.Constant4_Value;
  rtb_VectorConcatenate[18] = A380FadecComputer_P.Constant4_Value;
  A380FadecComputer_MATLABFunction_l(rtb_VectorConcatenate,
    &A380FadecComputer_Y.out.fadec_bus_output.ecu_status_word_4.Data);
  A380FadecComputer_Y.out.fadec_bus_output.ecu_maintenance_word_6.Data = static_cast<real32_T>
    (A380FadecComputer_U.in.data.engine_N1_percent);
  rtb_VectorConcatenate[0] = A380FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[1] = A380FadecComputer_DWork.Memory_PreviousInput_j;
  rtb_VectorConcatenate[2] = A380FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[3] = A380FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[4] = A380FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[5] = A380FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[6] = A380FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[7] = A380FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[8] = A380FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[9] = A380FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[10] = A380FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[11] = A380FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[12] = A380FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[13] = A380FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[14] = A380FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[15] = A380FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[16] = A380FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[17] = A380FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[18] = A380FadecComputer_P.Constant3_Value;
  A380FadecComputer_MATLABFunction_l(rtb_VectorConcatenate,
    &A380FadecComputer_Y.out.fadec_bus_output.ecu_maintenance_word_6.Data);
  A380FadecComputer_Y.out.time = A380FadecComputer_U.in.time;
  A380FadecComputer_Y.out.data = A380FadecComputer_U.in.data;
  A380FadecComputer_Y.out.data_computed.TLA_in_active_range = rtb_BusAssignment_e_data_computed_TLA_in_active_range;
  A380FadecComputer_Y.out.data_computed.is_FLX_active = rtb_y_mv;
  A380FadecComputer_Y.out.data_computed.ATHR_disabled = A380FadecComputer_DWork.Memory_PreviousInput;
  A380FadecComputer_Y.out.data_computed.time_since_touchdown = rtb_Switch;
  A380FadecComputer_Y.out.input = A380FadecComputer_U.in.input;
  A380FadecComputer_Y.out.prim_input.fctl.left_inboard_aileron_command_deg.SSM =
    rtb_left_inboard_aileron_command_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.left_inboard_aileron_command_deg.Data =
    rtb_left_inboard_aileron_command_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.right_inboard_aileron_command_deg.SSM =
    rtb_right_inboard_aileron_command_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.right_inboard_aileron_command_deg.Data =
    rtb_right_inboard_aileron_command_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.left_midboard_aileron_command_deg.SSM =
    rtb_left_midboard_aileron_command_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.left_midboard_aileron_command_deg.Data =
    rtb_left_midboard_aileron_command_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.right_midboard_aileron_command_deg.SSM =
    rtb_right_midboard_aileron_command_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.right_midboard_aileron_command_deg.Data =
    rtb_right_midboard_aileron_command_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.left_outboard_aileron_command_deg.SSM =
    rtb_left_outboard_aileron_command_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.left_outboard_aileron_command_deg.Data =
    rtb_left_outboard_aileron_command_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.right_outboard_aileron_command_deg.SSM =
    rtb_right_outboard_aileron_command_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.right_outboard_aileron_command_deg.Data =
    rtb_right_outboard_aileron_command_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_1_command_deg.SSM = rtb_left_spoiler_1_command_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_1_command_deg.Data = rtb_left_spoiler_1_command_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_1_command_deg.SSM = rtb_right_spoiler_1_command_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_1_command_deg.Data = rtb_right_spoiler_1_command_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_2_command_deg.SSM = rtb_left_spoiler_2_command_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_2_command_deg.Data = rtb_left_spoiler_2_command_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_2_command_deg.SSM = rtb_right_spoiler_2_command_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_2_command_deg.Data = rtb_right_spoiler_2_command_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_3_command_deg.SSM = rtb_left_spoiler_3_command_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_3_command_deg.Data = rtb_left_spoiler_3_command_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_3_command_deg.SSM = rtb_right_spoiler_3_command_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_3_command_deg.Data = rtb_right_spoiler_3_command_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_4_command_deg.SSM = rtb_left_spoiler_4_command_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_4_command_deg.Data = rtb_left_spoiler_4_command_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_4_command_deg.SSM = rtb_right_spoiler_4_command_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_4_command_deg.Data = rtb_right_spoiler_4_command_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_5_command_deg.SSM = rtb_left_spoiler_5_command_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_5_command_deg.Data = rtb_left_spoiler_5_command_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_5_command_deg.SSM = rtb_right_spoiler_5_command_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_5_command_deg.Data = rtb_right_spoiler_5_command_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_6_command_deg.SSM = rtb_left_spoiler_6_command_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_6_command_deg.Data = rtb_left_spoiler_6_command_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_6_command_deg.SSM = rtb_right_spoiler_6_command_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_6_command_deg.Data = rtb_right_spoiler_6_command_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_7_command_deg.SSM = rtb_left_spoiler_7_command_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_7_command_deg.Data = rtb_left_spoiler_7_command_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_7_command_deg.SSM = rtb_right_spoiler_7_command_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_7_command_deg.Data = rtb_right_spoiler_7_command_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_8_command_deg.SSM = rtb_left_spoiler_8_command_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_8_command_deg.Data = rtb_left_spoiler_8_command_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_8_command_deg.SSM = rtb_right_spoiler_8_command_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_8_command_deg.Data = rtb_right_spoiler_8_command_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.left_inboard_elevator_command_deg.SSM =
    rtb_left_inboard_elevator_command_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.left_inboard_elevator_command_deg.Data =
    rtb_left_inboard_elevator_command_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.right_inboard_elevator_command_deg.SSM =
    rtb_right_inboard_elevator_command_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.right_inboard_elevator_command_deg.Data =
    rtb_right_inboard_elevator_command_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.left_outboard_elevator_command_deg.SSM =
    rtb_left_outboard_elevator_command_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.left_outboard_elevator_command_deg.Data =
    rtb_left_outboard_elevator_command_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.right_outboard_elevator_command_deg.SSM =
    rtb_right_outboard_elevator_command_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.right_outboard_elevator_command_deg.Data =
    rtb_right_outboard_elevator_command_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.ths_command_deg.SSM = rtb_ths_command_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.ths_command_deg.Data = rtb_ths_command_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.upper_rudder_command_deg.SSM = rtb_upper_rudder_command_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.upper_rudder_command_deg.Data = rtb_upper_rudder_command_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.lower_rudder_command_deg.SSM = rtb_lower_rudder_command_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.lower_rudder_command_deg.Data = rtb_lower_rudder_command_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.left_sidestick_pitch_command_deg.SSM =
    rtb_left_sidestick_pitch_command_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.left_sidestick_pitch_command_deg.Data =
    rtb_left_sidestick_pitch_command_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.right_sidestick_pitch_command_deg.SSM =
    rtb_right_sidestick_pitch_command_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.right_sidestick_pitch_command_deg.Data =
    rtb_right_sidestick_pitch_command_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.left_sidestick_roll_command_deg.SSM = rtb_left_sidestick_roll_command_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.left_sidestick_roll_command_deg.Data =
    rtb_left_sidestick_roll_command_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.right_sidestick_roll_command_deg.SSM =
    rtb_right_sidestick_roll_command_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.right_sidestick_roll_command_deg.Data =
    rtb_right_sidestick_roll_command_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.rudder_pedal_position_deg.SSM = rtb_rudder_pedal_position_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.rudder_pedal_position_deg.Data = rtb_rudder_pedal_position_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.aileron_status_word.SSM = rtb_aileron_status_word_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.aileron_status_word.Data = rtb_aileron_status_word_Data;
  A380FadecComputer_Y.out.prim_input.fctl.left_aileron_1_position_deg.SSM = rtb_left_aileron_1_position_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.left_aileron_1_position_deg.Data = rtb_left_aileron_1_position_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.left_aileron_2_position_deg.SSM = rtb_left_aileron_2_position_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.left_aileron_2_position_deg.Data = rtb_left_aileron_2_position_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.right_aileron_1_position_deg.SSM = rtb_right_aileron_1_position_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.right_aileron_1_position_deg.Data = rtb_right_aileron_1_position_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.right_aileron_2_position_deg.SSM = rtb_right_aileron_2_position_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.right_aileron_2_position_deg.Data = rtb_right_aileron_2_position_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.spoiler_status_word.SSM = rtb_spoiler_status_word_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.spoiler_status_word.Data = rtb_spoiler_status_word_Data;
  A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_position_deg.SSM = rtb_left_spoiler_position_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_position_deg.Data = rtb_left_spoiler_position_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_position_deg.SSM = rtb_right_spoiler_position_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_position_deg.Data = rtb_right_spoiler_position_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.elevator_status_word.SSM = rtb_elevator_status_word_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.elevator_status_word.Data = rtb_elevator_status_word_Data;
  A380FadecComputer_Y.out.prim_input.fctl.elevator_1_position_deg.SSM = rtb_elevator_1_position_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.elevator_1_position_deg.Data = rtb_elevator_1_position_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.elevator_2_position_deg.SSM = rtb_elevator_2_position_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.elevator_2_position_deg.Data = rtb_elevator_2_position_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.elevator_3_position_deg.SSM = rtb_elevator_3_position_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.elevator_3_position_deg.Data = rtb_elevator_3_position_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.ths_position_deg.SSM = rtb_ths_position_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.ths_position_deg.Data = rtb_ths_position_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.rudder_status_word.SSM = rtb_rudder_status_word_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.rudder_status_word.Data = rtb_rudder_status_word_Data;
  A380FadecComputer_Y.out.prim_input.fctl.rudder_1_position_deg.SSM = rtb_rudder_1_position_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.rudder_1_position_deg.Data = rtb_rudder_1_position_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.rudder_2_position_deg.SSM = rtb_rudder_2_position_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.rudder_2_position_deg.Data = rtb_rudder_2_position_deg_Data;
  A380FadecComputer_Y.out.prim_input.fctl.radio_height_1_ft.SSM = rtb_radio_height_1_ft_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.radio_height_1_ft.Data = rtb_radio_height_1_ft_Data;
  A380FadecComputer_Y.out.prim_input.fctl.radio_height_2_ft.SSM = rtb_radio_height_2_ft_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.radio_height_2_ft.Data = rtb_radio_height_2_ft_Data;
  A380FadecComputer_Y.out.prim_input.fctl.fctl_law_status_word.SSM = rtb_fctl_law_status_word_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.fctl_law_status_word.Data = rtb_fctl_law_status_word_Data;
  A380FadecComputer_Y.out.prim_input.fctl.discrete_status_word_1.SSM = rtb_discrete_status_word_1_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.discrete_status_word_1.Data = rtb_discrete_status_word_1_Data;
  A380FadecComputer_Y.out.prim_input.fctl.v_alpha_lim_kn.SSM = rtb_v_alpha_lim_kn_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.v_alpha_lim_kn.Data = rtb_v_alpha_lim_kn_Data;
  A380FadecComputer_Y.out.prim_input.fctl.v_alpha_prot_kn.SSM = rtb_v_alpha_prot_kn_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.v_alpha_prot_kn.Data = rtb_v_alpha_prot_kn_Data;
  A380FadecComputer_Y.out.prim_input.fctl.v_alpha_stall_warn_kn.SSM = rtb_fctl_v_alpha_stall_warn_kn_SSM;
  A380FadecComputer_Y.out.prim_input.fctl.v_alpha_stall_warn_kn.Data = rtb_fctl_v_alpha_stall_warn_kn_Data;
  A380FadecComputer_Y.out.prim_input.fe.gamma_a_deg.SSM = rtb_gamma_a_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fe.gamma_a_deg.Data = rtb_gamma_a_deg_Data;
  A380FadecComputer_Y.out.prim_input.fe.gamma_t_deg.SSM = rtb_gamma_t_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fe.gamma_t_deg.Data = rtb_gamma_t_deg_Data;
  A380FadecComputer_Y.out.prim_input.fe.sideslip_target_deg.SSM = rtb_sideslip_target_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fe.sideslip_target_deg.Data = rtb_sideslip_target_deg_Data;
  A380FadecComputer_Y.out.prim_input.fe.v_ls_kn.SSM = rtb_v_ls_kn_SSM;
  A380FadecComputer_Y.out.prim_input.fe.v_ls_kn.Data = rtb_v_ls_kn_Data;
  A380FadecComputer_Y.out.prim_input.fe.v_stall_kn.SSM = rtb_v_stall_kn_SSM;
  A380FadecComputer_Y.out.prim_input.fe.v_stall_kn.Data = rtb_v_stall_kn_Data;
  A380FadecComputer_Y.out.prim_input.fe.speed_trend_kn.SSM = rtb_speed_trend_kn_SSM;
  A380FadecComputer_Y.out.prim_input.fe.speed_trend_kn.Data = rtb_speed_trend_kn_Data;
  A380FadecComputer_Y.out.prim_input.fe.v_3_kn.SSM = rtb_v_3_kn_SSM;
  A380FadecComputer_Y.out.prim_input.fe.v_3_kn.Data = rtb_v_3_kn_Data;
  A380FadecComputer_Y.out.prim_input.fe.v_4_kn.SSM = rtb_v_4_kn_SSM;
  A380FadecComputer_Y.out.prim_input.fe.v_4_kn.Data = rtb_v_4_kn_Data;
  A380FadecComputer_Y.out.prim_input.fe.v_man_kn.SSM = rtb_v_man_kn_SSM;
  A380FadecComputer_Y.out.prim_input.fe.v_man_kn.Data = rtb_v_man_kn_Data;
  A380FadecComputer_Y.out.prim_input.fe.v_max_kn.SSM = rtb_v_max_kn_SSM;
  A380FadecComputer_Y.out.prim_input.fe.v_max_kn.Data = rtb_v_max_kn_Data;
  A380FadecComputer_Y.out.prim_input.fe.v_fe_next_kn.SSM = rtb_v_fe_next_kn_SSM;
  A380FadecComputer_Y.out.prim_input.fe.v_fe_next_kn.Data = rtb_v_fe_next_kn_Data;
  A380FadecComputer_Y.out.prim_input.fe.discrete_word_1.SSM = rtb_fe_discrete_word_1_SSM;
  A380FadecComputer_Y.out.prim_input.fe.discrete_word_1.Data = rtb_fe_discrete_word_1_Data;
  A380FadecComputer_Y.out.prim_input.fg.pfd_spd_tgt_kts.SSM = rtb_pfd_spd_tgt_kts_SSM;
  A380FadecComputer_Y.out.prim_input.fg.pfd_spd_tgt_kts.Data = rtb_pfd_spd_tgt_kts_Data;
  A380FadecComputer_Y.out.prim_input.fg.pfd_short_term_mngd_spd_kts.SSM = rtb_pfd_short_term_mngd_spd_kts_SSM;
  A380FadecComputer_Y.out.prim_input.fg.pfd_short_term_mngd_spd_kts.Data = rtb_pfd_short_term_mngd_spd_kts_Data;
  A380FadecComputer_Y.out.prim_input.fg.selected_spd_kts.SSM = rtb_selected_spd_kts_SSM;
  A380FadecComputer_Y.out.prim_input.fg.selected_spd_kts.Data = rtb_selected_spd_kts_Data;
  A380FadecComputer_Y.out.prim_input.fg.selected_mach_kts.SSM = rtb_selected_mach_kts_SSM;
  A380FadecComputer_Y.out.prim_input.fg.selected_mach_kts.Data = rtb_selected_mach_kts_Data;
  A380FadecComputer_Y.out.prim_input.fg.selected_hdg_deg.SSM = rtb_selected_hdg_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fg.selected_hdg_deg.Data = rtb_selected_hdg_deg_Data;
  A380FadecComputer_Y.out.prim_input.fg.selected_trk_deg.SSM = rtb_selected_trk_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fg.selected_trk_deg.Data = rtb_selected_trk_deg_Data;
  A380FadecComputer_Y.out.prim_input.fg.selected_alt_ft.SSM = rtb_selected_alt_ft_SSM;
  A380FadecComputer_Y.out.prim_input.fg.selected_alt_ft.Data = rtb_selected_alt_ft_Data;
  A380FadecComputer_Y.out.prim_input.fg.selected_vs_ft_min.SSM = rtb_selected_vs_ft_min_SSM;
  A380FadecComputer_Y.out.prim_input.fg.selected_vs_ft_min.Data = rtb_selected_vs_ft_min_Data;
  A380FadecComputer_Y.out.prim_input.fg.selected_fpa_deg.SSM = rtb_selected_fpa_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fg.selected_fpa_deg.Data = rtb_selected_fpa_deg_Data;
  A380FadecComputer_Y.out.prim_input.fg.runway_hdg_memorized_deg.SSM = rtb_runway_hdg_memorized_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fg.runway_hdg_memorized_deg.Data = rtb_runway_hdg_memorized_deg_Data;
  A380FadecComputer_Y.out.prim_input.fg.preset_mach_from_fms.SSM = rtb_preset_mach_from_fms_SSM;
  A380FadecComputer_Y.out.prim_input.fg.preset_mach_from_fms.Data = rtb_preset_mach_from_fms_Data;
  A380FadecComputer_Y.out.prim_input.fg.preset_speed_from_fms_kts.SSM = rtb_preset_speed_from_fms_kts_SSM;
  A380FadecComputer_Y.out.prim_input.fg.preset_speed_from_fms_kts.Data = rtb_preset_speed_from_fms_kts_Data;
  A380FadecComputer_Y.out.prim_input.fg.roll_fd_command_1.SSM = rtb_roll_fd_command_1_SSM;
  A380FadecComputer_Y.out.prim_input.fg.roll_fd_command_1.Data = rtb_roll_fd_command_1_Data;
  A380FadecComputer_Y.out.prim_input.fg.pitch_fd_command_1.SSM = rtb_pitch_fd_command_1_SSM;
  A380FadecComputer_Y.out.prim_input.fg.pitch_fd_command_1.Data = rtb_pitch_fd_command_1_Data;
  A380FadecComputer_Y.out.prim_input.fg.yaw_fd_command_1.SSM = rtb_yaw_fd_command_1_SSM;
  A380FadecComputer_Y.out.prim_input.fg.yaw_fd_command_1.Data = rtb_yaw_fd_command_1_Data;
  A380FadecComputer_Y.out.prim_input.fg.roll_fd_command_2.SSM = rtb_roll_fd_command_2_SSM;
  A380FadecComputer_Y.out.prim_input.fg.roll_fd_command_2.Data = rtb_roll_fd_command_2_Data;
  A380FadecComputer_Y.out.prim_input.fg.pitch_fd_command_2.SSM = rtb_pitch_fd_command_2_SSM;
  A380FadecComputer_Y.out.prim_input.fg.pitch_fd_command_2.Data = rtb_pitch_fd_command_2_Data;
  A380FadecComputer_Y.out.prim_input.fg.yaw_fd_command_2.SSM = rtb_yaw_fd_command_2_SSM;
  A380FadecComputer_Y.out.prim_input.fg.yaw_fd_command_2.Data = rtb_yaw_fd_command_2_Data;
  A380FadecComputer_Y.out.prim_input.fg.discrete_word_5.SSM = rtb_discrete_word_5_SSM;
  A380FadecComputer_Y.out.prim_input.fg.discrete_word_5.Data = rtb_discrete_word_5_Data;
  A380FadecComputer_Y.out.prim_input.fg.discrete_word_4.SSM = rtb_discrete_word_4_SSM;
  A380FadecComputer_Y.out.prim_input.fg.discrete_word_4.Data = rtb_discrete_word_4_Data;
  A380FadecComputer_Y.out.prim_input.fg.fm_alt_constraint_ft.SSM = rtb_fm_alt_constraint_ft_SSM;
  A380FadecComputer_Y.out.prim_input.fg.fm_alt_constraint_ft.Data = rtb_fm_alt_constraint_ft_Data;
  A380FadecComputer_Y.out.prim_input.fg.ats_discrete_word = *rtb_BusAssignment_o_prim_input_fg_ats_discrete_word;
  A380FadecComputer_Y.out.prim_input.fg.ats_fma_discrete_word.SSM = rtb_ats_fma_discrete_word_SSM;
  A380FadecComputer_Y.out.prim_input.fg.ats_fma_discrete_word.Data = rtb_ats_fma_discrete_word_Data;
  A380FadecComputer_Y.out.prim_input.fg.discrete_word_3.SSM = rtb_discrete_word_3_SSM;
  A380FadecComputer_Y.out.prim_input.fg.discrete_word_3.Data = rtb_discrete_word_3_Data;
  A380FadecComputer_Y.out.prim_input.fg.discrete_word_1.SSM = rtb_discrete_word_1_k_SSM;
  A380FadecComputer_Y.out.prim_input.fg.discrete_word_1.Data = rtb_discrete_word_1_k_Data;
  A380FadecComputer_Y.out.prim_input.fg.discrete_word_2.SSM = rtb_discrete_word_2_SSM;
  A380FadecComputer_Y.out.prim_input.fg.discrete_word_2.Data = rtb_discrete_word_2_Data;
  A380FadecComputer_Y.out.prim_input.fg.discrete_word_6.SSM = rtb_discrete_word_6_SSM;
  A380FadecComputer_Y.out.prim_input.fg.discrete_word_6.Data = rtb_discrete_word_6_Data;
  A380FadecComputer_Y.out.prim_input.fg.low_target_speed_margin_kts.SSM = rtb_low_target_speed_margin_kts_SSM;
  A380FadecComputer_Y.out.prim_input.fg.low_target_speed_margin_kts.Data = rtb_low_target_speed_margin_kts_Data;
  A380FadecComputer_Y.out.prim_input.fg.high_target_speed_margin_kts.SSM = rtb_high_target_speed_margin_kts_SSM;
  A380FadecComputer_Y.out.prim_input.fg.high_target_speed_margin_kts.Data = rtb_high_target_speed_margin_kts_Data;
  A380FadecComputer_Y.out.prim_input.fg.nosewheel_cmd_deg.SSM = rtb_nosewheel_cmd_deg_SSM;
  A380FadecComputer_Y.out.prim_input.fg.nosewheel_cmd_deg.Data = rtb_nosewheel_cmd_deg_Data;
  A380FadecComputer_Y.out.prim_input.fg.n1_command_percent.SSM = rtb_n1_command_percent_SSM;
  A380FadecComputer_Y.out.prim_input.fg.n1_command_percent.Data = rtb_n1_command_percent_Data;
  A380FadecComputer_Y.out.prim_input.fg.flx_to_temp_deg_c.SSM = rtb_flx_to_temp_deg_c_SSM;
  A380FadecComputer_Y.out.prim_input.fg.flx_to_temp_deg_c.Data = rtb_flx_to_temp_deg_c_Data;
  A380FadecComputer_Y.out.prim_input.fg.discrete_word_7.SSM = rtb_BusAssignment_b_prim_input_fg_discrete_word_7_SSM;
  A380FadecComputer_Y.out.prim_input.fg.discrete_word_7.Data = rtb_BusAssignment_b_prim_input_fg_discrete_word_7_Data;
  if (rtb_NOT1_f) {
    A380FadecComputer_Y.out.output.sim_throttle_lever_pos = A380FadecComputer_DWork.Delay_DSTATE_n;
  } else {
    A380FadecComputer_Y.out.output.sim_throttle_lever_pos = A380FadecComputer_DWork.Delay_DSTATE_l;
  }

  if (A380FadecComputer_U.in.input.TLA_deg < 0.0) {
    A380FadecComputer_Y.out.output.sim_thrust_mode = 1.0;
  } else if (A380FadecComputer_U.in.input.TLA_deg == 0.0) {
    A380FadecComputer_Y.out.output.sim_thrust_mode = 2.0;
  } else if ((A380FadecComputer_U.in.input.TLA_deg > 0.0) && (A380FadecComputer_U.in.input.TLA_deg < 25.0)) {
    A380FadecComputer_Y.out.output.sim_thrust_mode = 3.0;
  } else if ((A380FadecComputer_U.in.input.TLA_deg >= 25.0) && (A380FadecComputer_U.in.input.TLA_deg < 35.0)) {
    A380FadecComputer_Y.out.output.sim_thrust_mode = 4.0;
  } else if ((A380FadecComputer_U.in.input.TLA_deg >= 35.0) && (A380FadecComputer_U.in.input.TLA_deg < 45.0)) {
    A380FadecComputer_Y.out.output.sim_thrust_mode = 5.0;
  } else if (A380FadecComputer_U.in.input.TLA_deg == 45.0) {
    A380FadecComputer_Y.out.output.sim_thrust_mode = 6.0;
  } else {
    A380FadecComputer_Y.out.output.sim_thrust_mode = 0.0;
  }

  A380FadecComputer_Y.out.output.N1_TLA_percent = rtb_N1c;
  A380FadecComputer_Y.out.output.is_in_reverse = rtb_OR2;
  A380FadecComputer_Y.out.output.thrust_limit_type = rtb_type;
  A380FadecComputer_Y.out.output.thrust_limit_percent = N1_begin;
  A380FadecComputer_Y.out.output.N1_c_percent = rtb_Switch2_idx_1;
  A380FadecComputer_Y.out.output.athr_control_active = A380FadecComputer_DWork.Memory_PreviousInput_p;
  A380FadecComputer_Y.out.output.memo_thrust_active = A380FadecComputer_DWork.Memory_PreviousInput_j;
  A380FadecComputer_Y.out.fadec_bus_output.selected_tla_deg.SSM = static_cast<uint32_T>
    (A380FadecComputer_P.EnumeratedConstant1_Value);
  A380FadecComputer_Y.out.fadec_bus_output.selected_tla_deg.Data = static_cast<real32_T>
    (A380FadecComputer_U.in.input.TLA_deg);
  A380FadecComputer_Y.out.fadec_bus_output.n1_ref_percent.SSM = static_cast<uint32_T>
    (A380FadecComputer_P.EnumeratedConstant1_Value);
  A380FadecComputer_Y.out.fadec_bus_output.n1_ref_percent.Data = static_cast<real32_T>(rtb_N1c);
  if (rtb_y_mv) {
    A380FadecComputer_Y.out.fadec_bus_output.selected_flex_temp_deg.SSM = static_cast<uint32_T>
      (A380FadecComputer_P.EnumeratedConstant1_Value);
  } else {
    A380FadecComputer_Y.out.fadec_bus_output.selected_flex_temp_deg.SSM = static_cast<uint32_T>
      (A380FadecComputer_P.EnumeratedConstant_Value);
  }

  A380FadecComputer_Y.out.fadec_bus_output.selected_flex_temp_deg.Data = rtb_y_b;
  A380FadecComputer_Y.out.fadec_bus_output.ecu_status_word_1.SSM = static_cast<uint32_T>
    (A380FadecComputer_P.EnumeratedConstant1_Value);
  A380FadecComputer_Y.out.fadec_bus_output.ecu_status_word_1.Data = A380FadecComputer_P.Constant2_Value_n;
  A380FadecComputer_Y.out.fadec_bus_output.ecu_status_word_2.SSM = static_cast<uint32_T>
    (A380FadecComputer_P.EnumeratedConstant1_Value);
  A380FadecComputer_Y.out.fadec_bus_output.ecu_status_word_2.Data = A380FadecComputer_P.Constant1_Value;
  A380FadecComputer_Y.out.fadec_bus_output.ecu_status_word_3.SSM = static_cast<uint32_T>
    (A380FadecComputer_P.EnumeratedConstant1_Value);
  A380FadecComputer_Y.out.fadec_bus_output.ecu_status_word_4.SSM = static_cast<uint32_T>
    (A380FadecComputer_P.EnumeratedConstant1_Value);
  A380FadecComputer_Y.out.fadec_bus_output.n1_limit_percent.SSM = static_cast<uint32_T>
    (A380FadecComputer_P.EnumeratedConstant1_Value);
  A380FadecComputer_Y.out.fadec_bus_output.n1_limit_percent.Data = static_cast<real32_T>(N1_begin);
  A380FadecComputer_Y.out.fadec_bus_output.n1_maximum_percent.SSM = static_cast<uint32_T>
    (A380FadecComputer_P.EnumeratedConstant1_Value);
  A380FadecComputer_Y.out.fadec_bus_output.n1_maximum_percent.Data = static_cast<real32_T>
    (A380FadecComputer_U.in.input.thrust_limit_TOGA_percent);
  A380FadecComputer_Y.out.fadec_bus_output.n1_command_percent.SSM = static_cast<uint32_T>
    (A380FadecComputer_P.EnumeratedConstant1_Value);
  A380FadecComputer_Y.out.fadec_bus_output.n1_command_percent.Data = static_cast<real32_T>(rtb_Switch2_idx_1);
  A380FadecComputer_Y.out.fadec_bus_output.selected_n2_actual_percent.SSM = static_cast<uint32_T>
    (A380FadecComputer_P.EnumeratedConstant1_Value);
  A380FadecComputer_Y.out.fadec_bus_output.selected_n2_actual_percent.Data = static_cast<real32_T>
    (A380FadecComputer_U.in.data.engine_N2_percent);
  A380FadecComputer_Y.out.fadec_bus_output.selected_n1_actual_percent.SSM = static_cast<uint32_T>
    (A380FadecComputer_P.EnumeratedConstant1_Value);
  A380FadecComputer_Y.out.fadec_bus_output.selected_n1_actual_percent.Data = static_cast<real32_T>
    (A380FadecComputer_U.in.data.engine_N1_percent);
  A380FadecComputer_Y.out.fadec_bus_output.ecu_maintenance_word_6.SSM = static_cast<uint32_T>
    (A380FadecComputer_P.EnumeratedConstant1_Value);
}

void A380FadecComputer::initialize()
{
  A380FadecComputer_DWork.Memory_PreviousInput = A380FadecComputer_P.SRFlipFlop_initial_condition;
  A380FadecComputer_DWork.Memory_PreviousInput_p = A380FadecComputer_P.SRFlipFlop_initial_condition_k;
  A380FadecComputer_DWork.Memory_PreviousInput_j = A380FadecComputer_P.SRFlipFlop1_initial_condition;
  A380FadecComputer_DWork.Delay_DSTATE = A380FadecComputer_P.DiscreteTimeIntegratorVariableTs_InitialCondition;
  A380FadecComputer_DWork.Delay_DSTATE_n = A380FadecComputer_P.DiscreteTimeIntegratorVariableTs_InitialCondition_p;
  A380FadecComputer_DWork.Delay_DSTATE_l = A380FadecComputer_P.DiscreteTimeIntegratorVariableTs1_InitialCondition;
}

void A380FadecComputer::terminate()
{
}

A380FadecComputer::A380FadecComputer():
  A380FadecComputer_U(),
  A380FadecComputer_Y(),
  A380FadecComputer_DWork()
{
}

A380FadecComputer::~A380FadecComputer() = default;
