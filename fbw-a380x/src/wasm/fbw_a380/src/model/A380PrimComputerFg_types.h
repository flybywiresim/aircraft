#ifndef A380PrimComputerFg_types_h_
#define A380PrimComputerFg_types_h_
#include "rtwtypes.h"
#ifndef DEFINED_TYPEDEF_FOR_fms_flight_phase_
#define DEFINED_TYPEDEF_FOR_fms_flight_phase_

enum class fms_flight_phase
  : int32_T {
  Preflight = 0,
  Takeoff,
  Climb,
  Cruise,
  Descent,
  Approach,
  Goaround,
  Done
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_fmgc_approach_type_
#define DEFINED_TYPEDEF_FOR_fmgc_approach_type_

enum class fmgc_approach_type
  : int32_T {
  None = 0,
  ILS,
  RNAV
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_tcas_submode_
#define DEFINED_TYPEDEF_FOR_tcas_submode_

enum class tcas_submode
  : int32_T {
  VS = 0,
  ALT_ACQ,
  ALT_HOLD
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_fmgc_des_submode_
#define DEFINED_TYPEDEF_FOR_fmgc_des_submode_

enum class fmgc_des_submode
  : int32_T {
  None = 0,
  SPEED_THRUST,
  VPATH_THRUST,
  VPATH_SPEED,
  FPA_SPEED,
  VS_SPEED
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_elac_adr_computation_data_
#define DEFINED_TYPEDEF_FOR_base_elac_adr_computation_data_

struct base_elac_adr_computation_data
{
  real_T V_ias_kn;
  real_T V_tas_kn;
  real_T mach;
  real_T alpha_deg;
  real_T p_s_c_hpa;
  real_T altitude_standard_ft;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_elac_ir_computation_data_
#define DEFINED_TYPEDEF_FOR_base_elac_ir_computation_data_

struct base_elac_ir_computation_data
{
  real_T theta_deg;
  real_T phi_deg;
  real_T q_deg_s;
  real_T r_deg_s;
  real_T n_x_g;
  real_T n_y_g;
  real_T n_z_g;
  real_T theta_dot_deg_s;
  real_T phi_dot_deg_s;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_prim_surface_status_
#define DEFINED_TYPEDEF_FOR_base_prim_surface_status_

struct base_prim_surface_status
{
  boolean_T left_inboard_aileron_engaged;
  boolean_T right_inboard_aileron_engaged;
  boolean_T left_midboard_aileron_engaged;
  boolean_T right_midboard_aileron_engaged;
  boolean_T left_outboard_aileron_engaged;
  boolean_T right_outboard_aileron_engaged;
  boolean_T spoiler_pair_1_engaged;
  boolean_T spoiler_pair_2_engaged;
  boolean_T spoiler_pair_3_engaged;
  boolean_T spoiler_pair_4_engaged;
  boolean_T spoiler_pair_5_engaged;
  boolean_T spoiler_pair_6_engaged;
  boolean_T spoiler_pair_7_engaged;
  boolean_T spoiler_pair_8_engaged;
  boolean_T left_inboard_elevator_engaged;
  boolean_T right_inboard_elevator_engaged;
  boolean_T left_outboard_elevator_engaged;
  boolean_T right_outboard_elevator_engaged;
  boolean_T ths_engaged;
  boolean_T upper_rudder_engaged;
  boolean_T lower_rudder_engaged;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_prim_lateral_surface_positions_
#define DEFINED_TYPEDEF_FOR_base_prim_lateral_surface_positions_

struct base_prim_lateral_surface_positions
{
  real_T left_inboard_aileron_deg;
  real_T right_inboard_aileron_deg;
  real_T left_midboard_aileron_deg;
  real_T right_midboard_aileron_deg;
  real_T left_outboard_aileron_deg;
  real_T right_outboard_aileron_deg;
  real_T left_spoiler_1_deg;
  real_T right_spoiler_1_deg;
  real_T left_spoiler_2_deg;
  real_T right_spoiler_2_deg;
  real_T left_spoiler_3_deg;
  real_T right_spoiler_3_deg;
  real_T left_spoiler_4_deg;
  real_T right_spoiler_4_deg;
  real_T left_spoiler_5_deg;
  real_T right_spoiler_5_deg;
  real_T left_spoiler_6_deg;
  real_T right_spoiler_6_deg;
  real_T left_spoiler_7_deg;
  real_T right_spoiler_7_deg;
  real_T left_spoiler_8_deg;
  real_T right_spoiler_8_deg;
  real_T upper_rudder_deg;
  real_T lower_rudder_deg;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_prim_pitch_surface_positions_
#define DEFINED_TYPEDEF_FOR_base_prim_pitch_surface_positions_

struct base_prim_pitch_surface_positions
{
  real_T left_inboard_elevator_deg;
  real_T right_inboard_elevator_deg;
  real_T left_outboard_elevator_deg;
  real_T right_outboard_elevator_deg;
  real_T ths_deg;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_a380_lateral_efcs_law_
#define DEFINED_TYPEDEF_FOR_a380_lateral_efcs_law_

enum class a380_lateral_efcs_law
  : int32_T {
  NormalLaw = 0,
  DirectLaw,
  None
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_a380_pitch_efcs_law_
#define DEFINED_TYPEDEF_FOR_a380_pitch_efcs_law_

enum class a380_pitch_efcs_law
  : int32_T {
  NormalLaw = 0,
  AlternateLaw1A,
  AlternateLaw1B,
  AlternateLaw1C,
  AlternateLaw2,
  DirectLaw,
  None
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_arinc_429_
#define DEFINED_TYPEDEF_FOR_base_arinc_429_

struct base_arinc_429
{
  uint32_T SSM;
  real32_T Data;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_prim_fctl_out_bus_
#define DEFINED_TYPEDEF_FOR_base_prim_fctl_out_bus_

struct base_prim_fctl_out_bus
{
  base_arinc_429 left_inboard_aileron_command_deg;
  base_arinc_429 right_inboard_aileron_command_deg;
  base_arinc_429 left_midboard_aileron_command_deg;
  base_arinc_429 right_midboard_aileron_command_deg;
  base_arinc_429 left_outboard_aileron_command_deg;
  base_arinc_429 right_outboard_aileron_command_deg;
  base_arinc_429 left_spoiler_1_command_deg;
  base_arinc_429 right_spoiler_1_command_deg;
  base_arinc_429 left_spoiler_2_command_deg;
  base_arinc_429 right_spoiler_2_command_deg;
  base_arinc_429 left_spoiler_3_command_deg;
  base_arinc_429 right_spoiler_3_command_deg;
  base_arinc_429 left_spoiler_4_command_deg;
  base_arinc_429 right_spoiler_4_command_deg;
  base_arinc_429 left_spoiler_5_command_deg;
  base_arinc_429 right_spoiler_5_command_deg;
  base_arinc_429 left_spoiler_6_command_deg;
  base_arinc_429 right_spoiler_6_command_deg;
  base_arinc_429 left_spoiler_7_command_deg;
  base_arinc_429 right_spoiler_7_command_deg;
  base_arinc_429 left_spoiler_8_command_deg;
  base_arinc_429 right_spoiler_8_command_deg;
  base_arinc_429 left_inboard_elevator_command_deg;
  base_arinc_429 right_inboard_elevator_command_deg;
  base_arinc_429 left_outboard_elevator_command_deg;
  base_arinc_429 right_outboard_elevator_command_deg;
  base_arinc_429 ths_command_deg;
  base_arinc_429 upper_rudder_command_deg;
  base_arinc_429 lower_rudder_command_deg;
  base_arinc_429 left_sidestick_pitch_command_deg;
  base_arinc_429 right_sidestick_pitch_command_deg;
  base_arinc_429 left_sidestick_roll_command_deg;
  base_arinc_429 right_sidestick_roll_command_deg;
  base_arinc_429 rudder_pedal_position_deg;
  base_arinc_429 aileron_status_word;
  base_arinc_429 left_aileron_1_position_deg;
  base_arinc_429 left_aileron_2_position_deg;
  base_arinc_429 right_aileron_1_position_deg;
  base_arinc_429 right_aileron_2_position_deg;
  base_arinc_429 spoiler_status_word;
  base_arinc_429 left_spoiler_position_deg;
  base_arinc_429 right_spoiler_position_deg;
  base_arinc_429 elevator_status_word;
  base_arinc_429 elevator_1_position_deg;
  base_arinc_429 elevator_2_position_deg;
  base_arinc_429 elevator_3_position_deg;
  base_arinc_429 ths_position_deg;
  base_arinc_429 rudder_status_word;
  base_arinc_429 rudder_1_position_deg;
  base_arinc_429 rudder_2_position_deg;
  base_arinc_429 radio_height_1_ft;
  base_arinc_429 radio_height_2_ft;
  base_arinc_429 fctl_law_status_word;
  base_arinc_429 discrete_status_word_1;
  base_arinc_429 v_alpha_lim_kn;
  base_arinc_429 v_alpha_prot_kn;
  base_arinc_429 v_alpha_stall_warn_kn;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_prim_fe_out_bus_
#define DEFINED_TYPEDEF_FOR_base_prim_fe_out_bus_

struct base_prim_fe_out_bus
{
  base_arinc_429 gamma_a_deg;
  base_arinc_429 gamma_t_deg;
  base_arinc_429 sideslip_target_deg;
  base_arinc_429 v_ls_kn;
  base_arinc_429 v_stall_kn;
  base_arinc_429 speed_trend_kn;
  base_arinc_429 v_3_kn;
  base_arinc_429 v_4_kn;
  base_arinc_429 v_man_kn;
  base_arinc_429 v_max_kn;
  base_arinc_429 v_fe_next_kn;
  base_arinc_429 discrete_word_1;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_prim_fg_out_bus_
#define DEFINED_TYPEDEF_FOR_base_prim_fg_out_bus_

struct base_prim_fg_out_bus
{
  base_arinc_429 pfd_spd_tgt_kts;
  base_arinc_429 pfd_short_term_mngd_spd_kts;
  base_arinc_429 selected_spd_kts;
  base_arinc_429 selected_mach_kts;
  base_arinc_429 selected_hdg_deg;
  base_arinc_429 selected_trk_deg;
  base_arinc_429 selected_alt_ft;
  base_arinc_429 selected_vs_ft_min;
  base_arinc_429 selected_fpa_deg;
  base_arinc_429 runway_hdg_memorized_deg;
  base_arinc_429 preset_mach_from_fms;
  base_arinc_429 preset_speed_from_fms_kts;
  base_arinc_429 roll_fd_command_1;
  base_arinc_429 pitch_fd_command_1;
  base_arinc_429 yaw_fd_command_1;
  base_arinc_429 roll_fd_command_2;
  base_arinc_429 pitch_fd_command_2;
  base_arinc_429 yaw_fd_command_2;
  base_arinc_429 discrete_word_5;
  base_arinc_429 discrete_word_4;
  base_arinc_429 fm_alt_constraint_ft;
  base_arinc_429 ats_discrete_word;
  base_arinc_429 ats_fma_discrete_word;
  base_arinc_429 discrete_word_3;
  base_arinc_429 discrete_word_1;
  base_arinc_429 discrete_word_2;
  base_arinc_429 discrete_word_6;
  base_arinc_429 low_target_speed_margin_kts;
  base_arinc_429 high_target_speed_margin_kts;
  base_arinc_429 nosewheel_cmd_deg;
  base_arinc_429 n1_command_percent;
  base_arinc_429 flx_to_temp_deg_c;
  base_arinc_429 discrete_word_7;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_prim_fg_adirs_computation_data_
#define DEFINED_TYPEDEF_FOR_base_prim_fg_adirs_computation_data_

struct base_prim_fg_adirs_computation_data
{
  real_T alignment_dummy;
  real32_T heading_deg;
  real32_T track_deg;
  real32_T roll_angle_deg;
  real32_T vertical_speed_ft_min;
  real32_T flight_path_angle_deg;
  real32_T altitude_indicated_ft;
  real32_T static_pressure_hpa;
  real32_T airspeed_computed_kn;
  real32_T mach;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_ils_bus_
#define DEFINED_TYPEDEF_FOR_base_ils_bus_

struct base_ils_bus
{
  base_arinc_429 runway_heading_deg;
  base_arinc_429 ils_frequency_mhz;
  base_arinc_429 localizer_deviation_deg;
  base_arinc_429 glideslope_deviation_deg;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_ap_raw_output_command_
#define DEFINED_TYPEDEF_FOR_ap_raw_output_command_

struct ap_raw_output_command
{
  real_T Theta_c_deg;
  real_T Phi_c_deg;
  real_T Beta_c_deg;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_ap_raw_laws_flare_
#define DEFINED_TYPEDEF_FOR_ap_raw_laws_flare_

struct ap_raw_laws_flare
{
  boolean_T condition_Flare;
  real_T H_dot_radio_fpm;
  real_T H_dot_c_fpm;
  real_T delta_Theta_H_dot_deg;
  real_T delta_Theta_bz_deg;
  real_T delta_Theta_bx_deg;
  real_T delta_Theta_beta_c_deg;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_ap_raw_output_
#define DEFINED_TYPEDEF_FOR_ap_raw_output_

struct ap_raw_output
{
  real_T Phi_loc_c;
  real_T Nosewheel_c;
  ap_raw_output_command flight_director;
  ap_raw_output_command autopilot;
  ap_raw_laws_flare flare_law;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_prim_lateral_modes_
#define DEFINED_TYPEDEF_FOR_base_prim_lateral_modes_

struct base_prim_lateral_modes
{
  real_T alignment_dummy;
  boolean_T rwy_active;
  boolean_T nav_active;
  boolean_T loc_cpt_active;
  boolean_T loc_trk_active;
  boolean_T roll_goaround_active;
  boolean_T hdg_active;
  boolean_T trk_active;
  boolean_T rwy_loc_submode_active;
  boolean_T rwy_trk_submode_active;
  boolean_T land_active;
  boolean_T align_submode_active;
  boolean_T rollout_submode_active;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_prim_longitudinal_modes_
#define DEFINED_TYPEDEF_FOR_base_prim_longitudinal_modes_

struct base_prim_longitudinal_modes
{
  real_T alignment_dummy;
  boolean_T clb_active;
  boolean_T des_active;
  boolean_T op_clb_active;
  boolean_T op_des_active;
  boolean_T pitch_takeoff_active;
  boolean_T pitch_goaround_active;
  boolean_T vs_active;
  boolean_T fpa_active;
  boolean_T alt_acq_active;
  boolean_T alt_hold_active;
  boolean_T alt_hold_vs_submode_active;
  boolean_T gs_capt_active;
  boolean_T gs_trk_active;
  boolean_T app_des_active;
  boolean_T flare_active;
  boolean_T cruise_active;
  boolean_T tcas_active;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_prim_armed_modes_
#define DEFINED_TYPEDEF_FOR_base_prim_armed_modes_

struct base_prim_armed_modes
{
  real_T alignment_dummy;
  boolean_T alt_acq_armed;
  boolean_T alt_acq_arm_possible;
  boolean_T nav_armed;
  boolean_T loc_armed;
  boolean_T rwy_armed;
  boolean_T land_armed;
  boolean_T glide_armed;
  boolean_T app_des_armed;
  boolean_T clb_armed;
  boolean_T des_armed;
  boolean_T op_clb_armed;
  boolean_T tcas_armed;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_lateral_law_
#define DEFINED_TYPEDEF_FOR_lateral_law_

enum class lateral_law
  : int32_T {
  NONE = 0,
  HDG,
  TRACK,
  HPATH,
  LOC_CPT,
  LOC_TRACK,
  ROLL_OUT
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_vertical_law_
#define DEFINED_TYPEDEF_FOR_vertical_law_

enum class vertical_law
  : int32_T {
  NONE = 0,
  ALT_HOLD,
  ALT_ACQ,
  SPD_MACH,
  VS,
  FPA,
  GS,
  FLARE,
  SRS,
  VPATH
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_a380_athr_fma_mode_
#define DEFINED_TYPEDEF_FOR_a380_athr_fma_mode_

enum class a380_athr_fma_mode
  : int32_T {
  NONE = 0,
  MAN_TOGA,
  MAN_GA_SOFT,
  MAN_FLEX,
  MAN_DTO,
  MAN_MCT,
  MAN_THR,
  SPEED,
  MACH,
  THR_MCT,
  THR_CLB,
  THR_LVR,
  THR_IDLE,
  A_FLOOR,
  TOGA_LK,
  THR_DCLB,
  NOISE,
  THR_DES
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_a380_athr_fma_message_
#define DEFINED_TYPEDEF_FOR_a380_athr_fma_message_

enum class a380_athr_fma_message
  : int32_T {
  NONE = 0,
  LVR_TOGA,
  LVR_CLB,
  LVR_MCT,
  LVR_ASYM
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_lgciu_bus_
#define DEFINED_TYPEDEF_FOR_base_lgciu_bus_

struct base_lgciu_bus
{
  base_arinc_429 discrete_word_1;
  base_arinc_429 discrete_word_2;
  base_arinc_429 discrete_word_3;
  base_arinc_429 discrete_word_4;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_ap_raw_time_
#define DEFINED_TYPEDEF_FOR_ap_raw_time_

struct ap_raw_time
{
  real_T dt;
  real_T simulation_time;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_ap_raw_data_
#define DEFINED_TYPEDEF_FOR_ap_raw_data_

struct ap_raw_data
{
  real_T Theta_deg;
  real_T Phi_deg;
  real_T qk_deg_s;
  real_T rk_deg_s;
  real_T pk_deg_s;
  real_T V_ias_kn;
  real_T V_tas_kn;
  real_T V_mach;
  real_T V_gnd_kn;
  real_T alpha_deg;
  real_T beta_deg;
  real_T H_ft;
  real_T H_ind_ft;
  real_T H_radio_ft;
  real_T H_dot_ft_min;
  real_T Psi_magnetic_deg;
  real_T Psi_magnetic_track_deg;
  real_T Psi_true_deg;
  real_T Chi_true_deg;
  real_T bx_m_s2;
  real_T by_m_s2;
  real_T bz_m_s2;
  real_T nav_loc_deg;
  real_T nav_gs_deg;
  real_T nav_dme_nmi;
  real_T nav_loc_magvar_deg;
  real_T nav_loc_error_deg;
  boolean_T nav_gs_valid;
  real_T nav_gs_error_deg;
  real_T fms_xtk_nmi;
  real_T fms_tae_deg;
  real_T fms_phi_deg;
  real_T fms_phi_limit_deg;
  real_T fms_H_c_profile_ft;
  real_T fms_H_dot_c_profile_ft_min;
  real_T VLS_kn;
  real_T VMAX_kn;
  boolean_T on_ground;
  real_T zeta_deg;
  real_T total_weight_kg;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_ap_raw_laws_input_
#define DEFINED_TYPEDEF_FOR_ap_raw_laws_input_

struct ap_raw_laws_input
{
  boolean_T ap_engaged;
  real_T lateral_law;
  real_T vertical_law;
  real_T Psi_c_deg;
  real_T Chi_c_deg;
  real_T H_c_ft;
  real_T H_dot_c_fpm;
  real_T FPA_c_deg;
  real_T V_c_kn;
  boolean_T ALT_soft_mode_active;
  boolean_T TCAS_mode_active;
  boolean_T FINAL_DES_mode_active;
  boolean_T GS_track_mode;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_ap_laws_input_
#define DEFINED_TYPEDEF_FOR_ap_laws_input_

struct ap_laws_input
{
  ap_raw_time time;
  ap_raw_data data;
  ap_raw_laws_input input;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_sec_out_bus_
#define DEFINED_TYPEDEF_FOR_base_sec_out_bus_

struct base_sec_out_bus
{
  base_arinc_429 left_sidestick_pitch_command_deg;
  base_arinc_429 right_sidestick_pitch_command_deg;
  base_arinc_429 left_sidestick_roll_command_deg;
  base_arinc_429 right_sidestick_roll_command_deg;
  base_arinc_429 rudder_pedal_position_deg;
  base_arinc_429 aileron_status_word;
  base_arinc_429 left_aileron_1_position_deg;
  base_arinc_429 left_aileron_2_position_deg;
  base_arinc_429 right_aileron_1_position_deg;
  base_arinc_429 right_aileron_2_position_deg;
  base_arinc_429 spoiler_status_word;
  base_arinc_429 left_spoiler_1_position_deg;
  base_arinc_429 right_spoiler_1_position_deg;
  base_arinc_429 left_spoiler_2_position_deg;
  base_arinc_429 right_spoiler_2_position_deg;
  base_arinc_429 elevator_status_word;
  base_arinc_429 elevator_1_position_deg;
  base_arinc_429 elevator_2_position_deg;
  base_arinc_429 elevator_3_position_deg;
  base_arinc_429 ths_position_deg;
  base_arinc_429 rudder_status_word;
  base_arinc_429 rudder_1_position_deg;
  base_arinc_429 rudder_2_position_deg;
  base_arinc_429 rudder_trim_actual_pos_deg;
  base_arinc_429 fctl_law_status_word;
  base_arinc_429 misc_data_status_word;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_time_
#define DEFINED_TYPEDEF_FOR_base_time_

struct base_time
{
  real_T dt;
  real_T simulation_time;
  real_T monotonic_time;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_sim_data_
#define DEFINED_TYPEDEF_FOR_base_sim_data_

struct base_sim_data
{
  boolean_T slew_on;
  boolean_T pause_on;
  boolean_T tracking_mode_on_override;
  boolean_T tailstrike_protection_on;
  boolean_T computer_running;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_prim_discrete_inputs_
#define DEFINED_TYPEDEF_FOR_base_prim_discrete_inputs_

struct base_prim_discrete_inputs
{
  real_T alignment_dummy;
  boolean_T prim_overhead_button_pressed;
  boolean_T is_unit_1;
  boolean_T is_unit_2;
  boolean_T is_unit_3;
  boolean_T capt_priority_takeover_pressed;
  boolean_T fo_priority_takeover_pressed;
  boolean_T ap_1_pushbutton_pressed;
  boolean_T ap_2_pushbutton_pressed;
  boolean_T fcu_1_healthy;
  boolean_T fcu_2_healthy;
  boolean_T athr_pushbutton;
  boolean_T ir_3_on_capt;
  boolean_T ir_3_on_fo;
  boolean_T adr_3_on_capt;
  boolean_T adr_3_on_fo;
  boolean_T rat_deployed;
  boolean_T rat_contactor_closed;
  boolean_T athr_instinctive_disc;
  boolean_T pitch_trim_up_pressed;
  boolean_T pitch_trim_down_pressed;
  boolean_T green_low_pressure;
  boolean_T yellow_low_pressure;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_prim_analog_inputs_
#define DEFINED_TYPEDEF_FOR_base_prim_analog_inputs_

struct base_prim_analog_inputs
{
  real_T capt_pitch_stick_pos;
  real_T fo_pitch_stick_pos;
  real_T capt_roll_stick_pos;
  real_T fo_roll_stick_pos;
  real_T speed_brake_lever_pos;
  real_T thr_lever_1_pos;
  real_T thr_lever_2_pos;
  real_T thr_lever_3_pos;
  real_T thr_lever_4_pos;
  real_T elevator_1_pos_deg;
  real_T elevator_2_pos_deg;
  real_T elevator_3_pos_deg;
  real_T ths_pos_deg;
  real_T left_aileron_1_pos_deg;
  real_T left_aileron_2_pos_deg;
  real_T right_aileron_1_pos_deg;
  real_T right_aileron_2_pos_deg;
  real_T left_spoiler_pos_deg;
  real_T right_spoiler_pos_deg;
  real_T rudder_1_pos_deg;
  real_T rudder_2_pos_deg;
  real_T rudder_pedal_pos;
  real_T yellow_hyd_pressure_psi;
  real_T green_hyd_pressure_psi;
  real_T vert_acc_1_g;
  real_T vert_acc_2_g;
  real_T vert_acc_3_g;
  real_T lat_acc_1_g;
  real_T lat_acc_2_g;
  real_T lat_acc_3_g;
  real_T left_body_wheel_speed;
  real_T left_wing_wheel_speed;
  real_T right_body_wheel_speed;
  real_T right_wing_wheel_speed;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_adr_bus_
#define DEFINED_TYPEDEF_FOR_base_adr_bus_

struct base_adr_bus
{
  base_arinc_429 altitude_standard_ft;
  base_arinc_429 altitude_corrected_1_ft;
  base_arinc_429 altitude_corrected_2_ft;
  base_arinc_429 mach;
  base_arinc_429 airspeed_computed_kn;
  base_arinc_429 airspeed_true_kn;
  base_arinc_429 vertical_speed_ft_min;
  base_arinc_429 aoa_corrected_deg;
  base_arinc_429 corrected_average_static_pressure;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_ir_bus_
#define DEFINED_TYPEDEF_FOR_base_ir_bus_

struct base_ir_bus
{
  base_arinc_429 discrete_word_1;
  base_arinc_429 latitude_deg;
  base_arinc_429 longitude_deg;
  base_arinc_429 ground_speed_kn;
  base_arinc_429 track_angle_true_deg;
  base_arinc_429 heading_true_deg;
  base_arinc_429 wind_speed_kn;
  base_arinc_429 wind_direction_true_deg;
  base_arinc_429 track_angle_magnetic_deg;
  base_arinc_429 heading_magnetic_deg;
  base_arinc_429 drift_angle_deg;
  base_arinc_429 flight_path_angle_deg;
  base_arinc_429 flight_path_accel_g;
  base_arinc_429 pitch_angle_deg;
  base_arinc_429 roll_angle_deg;
  base_arinc_429 body_pitch_rate_deg_s;
  base_arinc_429 body_roll_rate_deg_s;
  base_arinc_429 body_yaw_rate_deg_s;
  base_arinc_429 body_long_accel_g;
  base_arinc_429 body_lat_accel_g;
  base_arinc_429 body_normal_accel_g;
  base_arinc_429 track_angle_rate_deg_s;
  base_arinc_429 pitch_att_rate_deg_s;
  base_arinc_429 roll_att_rate_deg_s;
  base_arinc_429 inertial_alt_ft;
  base_arinc_429 along_track_horiz_acc_g;
  base_arinc_429 cross_track_horiz_acc_g;
  base_arinc_429 vertical_accel_g;
  base_arinc_429 inertial_vertical_speed_ft_s;
  base_arinc_429 north_south_velocity_kn;
  base_arinc_429 east_west_velocity_kn;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_ra_bus_
#define DEFINED_TYPEDEF_FOR_base_ra_bus_

struct base_ra_bus
{
  base_arinc_429 radio_height_ft;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_sfcc_bus_
#define DEFINED_TYPEDEF_FOR_base_sfcc_bus_

struct base_sfcc_bus
{
  base_arinc_429 slat_flap_component_status_word;
  base_arinc_429 slat_flap_system_status_word;
  base_arinc_429 slat_flap_actual_position_word;
  base_arinc_429 slat_actual_position_deg;
  base_arinc_429 flap_actual_position_deg;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_fcu_bus_
#define DEFINED_TYPEDEF_FOR_base_fcu_bus_

struct base_fcu_bus
{
  base_arinc_429 efis_discrete_word_1;
  base_arinc_429 efis_discrete_word_2;
  base_arinc_429 baro_setting_hpa;
  base_arinc_429 baro_setting_inhg;
  base_arinc_429 afs_discrete_word_1;
  base_arinc_429 afs_discrete_word_2;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_prim_out_bus_
#define DEFINED_TYPEDEF_FOR_base_prim_out_bus_

struct base_prim_out_bus
{
  base_prim_fctl_out_bus fctl;
  base_prim_fe_out_bus fe;
  base_prim_fg_out_bus fg;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_prim_bus_inputs_
#define DEFINED_TYPEDEF_FOR_base_prim_bus_inputs_

struct base_prim_bus_inputs
{
  base_adr_bus adr_1_bus;
  base_adr_bus adr_2_bus;
  base_adr_bus adr_3_bus;
  base_ir_bus ir_1_bus;
  base_ir_bus ir_2_bus;
  base_ir_bus ir_3_bus;
  real_T isis_1_bus;
  real_T isis_2_bus;
  real_T rate_gyro_pitch_1_bus;
  real_T rate_gyro_pitch_2_bus;
  real_T rate_gyro_roll_1_bus;
  real_T rate_gyro_roll_2_bus;
  real_T rate_gyro_yaw_1_bus;
  real_T rate_gyro_yaw_2_bus;
  base_ra_bus ra_1_bus;
  base_ra_bus ra_2_bus;
  base_ils_bus ils_1_bus;
  base_ils_bus ils_2_bus;
  base_sfcc_bus sfcc_1_bus;
  base_sfcc_bus sfcc_2_bus;
  base_lgciu_bus lgciu_1_bus;
  base_lgciu_bus lgciu_2_bus;
  real_T irdc_1_bus;
  real_T irdc_2_bus;
  real_T irdc_3_bus;
  real_T irdc_4_a_bus;
  real_T irdc_4_b_bus;
  base_fcu_bus fcu_1_bus;
  base_fcu_bus fcu_2_bus;
  base_prim_out_bus prim_x_bus;
  base_prim_out_bus prim_y_bus;
  base_sec_out_bus sec_1_bus;
  base_sec_out_bus sec_2_bus;
  base_sec_out_bus sec_3_bus;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_fms_inputs_
#define DEFINED_TYPEDEF_FOR_base_fms_inputs_

struct base_fms_inputs
{
  boolean_T fm_valid;
  fms_flight_phase active_fms_flight_phase;
  fmgc_approach_type selected_approach_type;
  boolean_T backbeam_selected;
  real_T fms_loc_distance;
  real_T fms_unrealistic_gs_angle_deg;
  boolean_T lateral_flight_plan_valid;
  boolean_T nav_capture_condition;
  real_T phi_c_deg;
  real_T xtk_nmi;
  real_T tke_deg;
  real_T phi_limit_deg;
  boolean_T direct_to_nav_engage;
  boolean_T vertical_flight_plan_valid;
  boolean_T final_app_can_engage;
  real_T next_alt_cstr_ft;
  fmgc_des_submode requested_des_submode;
  real_T alt_profile_tgt_ft;
  real_T vs_target_ft_min;
  real_T v_2_kts;
  real_T v_app_kts;
  real_T v_managed_kts;
  real_T v_upper_margin_kts;
  real_T v_lower_margin_kts;
  boolean_T show_speed_margins;
  real_T preset_spd_kts;
  real_T preset_mach;
  boolean_T preset_spd_mach_activate;
  boolean_T fms_spd_mode_activate;
  boolean_T fms_mach_mode_activate;
  real_T flex_temp_deg_c;
  real_T acceleration_alt_ft;
  real_T thrust_reduction_alt_ft;
  real_T cruise_alt_ft;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_fqms_
#define DEFINED_TYPEDEF_FOR_base_fqms_

struct base_fqms
{
  base_arinc_429 gross_weight_kg;
  base_arinc_429 gross_weight_cg_pct;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_eec_
#define DEFINED_TYPEDEF_FOR_base_eec_

struct base_eec
{
  base_arinc_429 selected_tla_deg;
  base_arinc_429 n1_ref_percent;
  base_arinc_429 selected_flex_temp_deg;
  base_arinc_429 ecu_status_word_1;
  base_arinc_429 ecu_status_word_2;
  base_arinc_429 ecu_status_word_3;
  base_arinc_429 ecu_status_word_4;
  base_arinc_429 n1_limit_percent;
  base_arinc_429 n1_maximum_percent;
  base_arinc_429 n1_command_percent;
  base_arinc_429 selected_n2_actual_percent;
  base_arinc_429 selected_n1_actual_percent;
  base_arinc_429 ecu_maintenance_word_6;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_tcas_
#define DEFINED_TYPEDEF_FOR_base_tcas_

struct base_tcas
{
  boolean_T tcas_valid;
  boolean_T ta_ra_mode;
  boolean_T ta_active;
  boolean_T ra_active;
  real_T ra_rate_to_maintain;
  boolean_T ra_corrective;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_prim_adcn_inputs_
#define DEFINED_TYPEDEF_FOR_base_prim_adcn_inputs_

struct base_prim_adcn_inputs
{
  base_fms_inputs fms;
  base_fqms fqms;
  base_eec eec_1;
  base_eec eec_2;
  base_eec eec_3;
  base_eec eec_4;
  base_tcas tcas;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_prim_inputs_
#define DEFINED_TYPEDEF_FOR_prim_inputs_

struct prim_inputs
{
  base_time time;
  base_sim_data sim_data;
  base_prim_discrete_inputs discrete_inputs;
  base_prim_analog_inputs analog_inputs;
  base_prim_bus_inputs bus_inputs;
  base_prim_adcn_inputs adcn_inputs;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_prim_general_logic_outputs_
#define DEFINED_TYPEDEF_FOR_base_prim_general_logic_outputs_

struct base_prim_general_logic_outputs
{
  boolean_T on_ground;
  boolean_T tracking_mode_on;
  boolean_T double_adr_failure;
  boolean_T triple_adr_failure;
  boolean_T cas_or_mach_disagree;
  boolean_T alpha_disagree;
  boolean_T double_ir_failure;
  boolean_T triple_ir_failure;
  boolean_T ir_failure_not_self_detected;
  boolean_T adr_1_rejected;
  boolean_T adr_2_rejected;
  boolean_T adr_3_rejected;
  boolean_T isis_rejected;
  boolean_T ir_1_rejected;
  boolean_T ir_2_rejected;
  boolean_T ir_3_rejected;
  base_elac_adr_computation_data adr_computation_data;
  base_elac_ir_computation_data ir_computation_data;
  real_T ra_computation_data_ft;
  boolean_T two_ra_failure;
  boolean_T all_ra_failure;
  boolean_T ra_a_rejected;
  boolean_T ra_b_rejected;
  boolean_T ra_c_rejected;
  boolean_T all_sfcc_lost;
  real32_T flap_handle_index;
  real32_T flap_angle_deg;
  real32_T slat_angle_deg;
  real32_T slat_flap_actual_pos;
  real32_T flap_surface_angle_deg;
  real32_T slat_surface_angle_deg;
  boolean_T double_lgciu_failure;
  boolean_T slats_locked;
  boolean_T flaps_locked;
  boolean_T landing_gear_down;
  boolean_T engine_out;
  boolean_T engine_running;
  boolean_T is_yellow_hydraulic_power_avail;
  boolean_T is_green_hydraulic_power_avail;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_prim_flight_envelope_outputs_
#define DEFINED_TYPEDEF_FOR_base_prim_flight_envelope_outputs_

struct base_prim_flight_envelope_outputs
{
  real_T beta_target_deg;
  boolean_T beta_target_visible;
  boolean_T alpha_floor_condition;
  real_T computed_gross_weight_kg;
  real_T computed_gross_weight_cg_percent;
  boolean_T gross_weight_lost;
  boolean_T gross_weight_cg_lost;
  boolean_T gross_weight_disagree;
  boolean_T gross_weight_cg_disagree;
  boolean_T speed_scale_lost;
  boolean_T speed_scale_visible;
  real_T v_ls_kn;
  real_T v_stall_kn;
  real_T v_3_kn;
  boolean_T v_3_visible;
  real_T v_4_kn;
  boolean_T v_4_visible;
  real_T v_man_kn;
  boolean_T v_man_visible;
  real_T v_max_kn;
  real_T v_fe_next_kn;
  boolean_T v_fe_next_visible;
  real_T v_c_trend_kn;
  real_T gamma_a_deg;
  real_T gamma_t_deg;
  boolean_T pitch_pitch_warning_active;
  boolean_T low_energy_warning_active;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_prim_laws_outputs_
#define DEFINED_TYPEDEF_FOR_base_prim_laws_outputs_

struct base_prim_laws_outputs
{
  base_prim_lateral_surface_positions lateral_law_outputs;
  base_prim_pitch_surface_positions pitch_law_outputs;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_prim_fctl_logic_outputs_
#define DEFINED_TYPEDEF_FOR_base_prim_fctl_logic_outputs_

struct base_prim_fctl_logic_outputs
{
  base_prim_surface_status surface_statuses;
  base_prim_lateral_surface_positions lateral_surface_positions;
  base_prim_pitch_surface_positions pitch_surface_positions;
  a380_lateral_efcs_law lateral_law_capability;
  a380_lateral_efcs_law active_lateral_law;
  a380_pitch_efcs_law pitch_law_capability;
  a380_pitch_efcs_law active_pitch_law;
  boolean_T abnormal_condition_law_active;
  boolean_T is_master_prim;
  boolean_T elevator_1_avail;
  boolean_T elevator_1_engaged;
  boolean_T elevator_2_avail;
  boolean_T elevator_2_engaged;
  boolean_T elevator_3_avail;
  boolean_T elevator_3_engaged;
  boolean_T ths_avail;
  boolean_T ths_engaged;
  boolean_T left_aileron_1_avail;
  boolean_T left_aileron_1_engaged;
  boolean_T left_aileron_2_avail;
  boolean_T left_aileron_2_engaged;
  boolean_T right_aileron_1_avail;
  boolean_T right_aileron_1_engaged;
  boolean_T right_aileron_2_avail;
  boolean_T right_aileron_2_engaged;
  boolean_T left_spoiler_hydraulic_mode_avail;
  boolean_T left_spoiler_electric_mode_avail;
  boolean_T left_spoiler_hydraulic_mode_engaged;
  boolean_T left_spoiler_electric_mode_engaged;
  boolean_T right_spoiler_hydraulic_mode_avail;
  boolean_T right_spoiler_electric_mode_avail;
  boolean_T right_spoiler_hydraulic_mode_engaged;
  boolean_T right_spoiler_electric_mode_engaged;
  boolean_T rudder_1_hydraulic_mode_avail;
  boolean_T rudder_1_electric_mode_avail;
  boolean_T rudder_1_hydraulic_mode_engaged;
  boolean_T rudder_1_electric_mode_engaged;
  boolean_T rudder_2_hydraulic_mode_avail;
  boolean_T rudder_2_electric_mode_avail;
  boolean_T rudder_2_hydraulic_mode_engaged;
  boolean_T rudder_2_electric_mode_engaged;
  boolean_T aileron_droop_active;
  boolean_T aileron_antidroop_active;
  boolean_T ths_automatic_mode_active;
  real_T ths_manual_mode_c_deg_s;
  boolean_T eha_ebha_elec_mode_inhibited;
  boolean_T left_sidestick_disabled;
  boolean_T right_sidestick_disabled;
  boolean_T left_sidestick_priority_locked;
  boolean_T right_sidestick_priority_locked;
  real_T total_sidestick_pitch_command;
  real_T total_sidestick_roll_command;
  boolean_T speed_brake_inhibited;
  real_T speed_brake_command_deg;
  boolean_T ground_spoilers_armed;
  boolean_T ground_spoilers_out;
  boolean_T phased_lift_dumping_active;
  boolean_T spoiler_lift_active;
  boolean_T ap_authorised;
  boolean_T protection_ap_disconnect;
  boolean_T high_alpha_prot_active;
  real_T alpha_prot_deg;
  real_T alpha_max_deg;
  real_T v_alpha_prot_kn;
  real_T v_alpha_max_kn;
  real_T v_alpha_stall_warn_kn;
  boolean_T high_speed_prot_active;
  real_T high_speed_prot_lo_thresh_kn;
  real_T high_speed_prot_hi_thresh_kn;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_prim_fg_logic_output_
#define DEFINED_TYPEDEF_FOR_base_prim_fg_logic_output_

struct base_prim_fg_logic_output
{
  boolean_T gnd_eng_stop_flt_5s;
  boolean_T ap_fd_common_condition;
  boolean_T ap_fd_1_condition;
  boolean_T ap_fd_2_condition;
  boolean_T fd_1_engaged;
  boolean_T fd_2_engaged;
  boolean_T ap_1_engaged;
  boolean_T ap_2_engaged;
  boolean_T athr_engaged;
  boolean_T fd_1_inop;
  boolean_T fd_2_inop;
  boolean_T ap_1_inop;
  boolean_T ap_2_inop;
  boolean_T athr_inop;
  boolean_T fmgc_opp_priority;
  boolean_T ap_fd_1_on_adr_3;
  boolean_T ap_fd_2_on_adr_3;
  boolean_T ap_fd_1_on_ir_3;
  boolean_T ap_fd_2_on_ir_3;
  base_prim_fg_adirs_computation_data adirs_computation_data;
  boolean_T all_fcu_failure;
  boolean_T fcu_1_chosen;
  boolean_T fcu_2_chosen;
  base_arinc_429 chosen_fcu_discrete_word_1;
  base_arinc_429 chosen_fcu_discrete_word_2;
  boolean_T ils_failure;
  boolean_T both_ils_valid;
  base_ils_bus ils_computation_data;
  boolean_T ils_tune_inhibit;
  real_T rwy_hdg_memo;
  boolean_T tcas_failure;
  boolean_T tcas_mode_available;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_prim_ap_fd_logic_outputs_
#define DEFINED_TYPEDEF_FOR_base_prim_ap_fd_logic_outputs_

struct base_prim_ap_fd_logic_outputs
{
  base_prim_lateral_modes lateral_modes;
  base_prim_longitudinal_modes longitudinal_modes;
  base_prim_armed_modes armed_modes;
  lateral_law active_lateral_law;
  vertical_law active_longitudinal_law;
  boolean_T auto_spd_control_active;
  boolean_T manual_spd_control_active;
  boolean_T mach_control_active;
  boolean_T athr_active;
  boolean_T athr_limited;
  boolean_T alpha_floor_mode_active;
  boolean_T thrust_mode_active;
  boolean_T thrust_target_idle;
  boolean_T speed_mach_mode_active;
  boolean_T retard_mode_active;
  a380_athr_fma_mode athr_fma_mode;
  a380_athr_fma_message athr_fma_message;
  real_T spd_target_kts;
  real_T pfd_spd_target_kts;
  real_T short_term_managed_spd_kts;
  boolean_T short_term_managed_spd_visible;
  boolean_T alt_cstr_applicable;
  real_T alt_sel_or_cstr;
  boolean_T mode_sync_active;
  boolean_T any_ap_fd_engaged;
  boolean_T any_lateral_mode_engaged;
  boolean_T any_longitudinal_mode_engaged;
  boolean_T lateral_mode_reset;
  boolean_T longitudinal_mode_reset;
  boolean_T hdg_trk_preset_available;
  boolean_T alt_soft_mode_active;
  boolean_T fd_auto_disengage;
  boolean_T ap_fd_mode_reversion;
  boolean_T lateral_mode_reversion;
  boolean_T longitudinal_mode_reversion_vs;
  boolean_T longitudinal_mode_reversion_op_clb;
  boolean_T pitch_fd_bars_flashing;
  boolean_T roll_fd_bars_flashing;
  boolean_T loc_bc_selection;
  boolean_T vs_target_not_held;
  real_T tcas_vs_target;
  boolean_T tcas_ra_corrective;
  tcas_submode active_tcas_submode;
  boolean_T tcas_alt_acq_cond;
  boolean_T tcas_alt_hold_cond;
  boolean_T tcas_ra_inhibited;
  boolean_T trk_fpa_deselected;
  boolean_T longi_large_box_tcas;
  boolean_T fcu_alt_abv_acft;
  boolean_T fcu_alt_blw_acft;
  boolean_T land_2_capability;
  boolean_T land_3_fail_passive_capability;
  boolean_T land_3_fail_op_capability;
  boolean_T tla_to_ga_set;
  boolean_T true_active;
  boolean_T trk_fpa_active;
  boolean_T metric_alt_active;
  real32_T selected_spd_mach;
  boolean_T spd_mach_dashes;
  real32_T selected_hdg_trk;
  boolean_T hdg_trk_dashes;
  real32_T selected_alt;
  real32_T selected_vs_fpa;
  boolean_T vs_fpa_dashes;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_prim_fg_laws_outputs_
#define DEFINED_TYPEDEF_FOR_base_prim_fg_laws_outputs_

struct base_prim_fg_laws_outputs
{
  ap_raw_output ap_fd_1;
  ap_raw_output ap_fd_2;
  real_T n_1_c_percent;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_prim_discrete_outputs_
#define DEFINED_TYPEDEF_FOR_base_prim_discrete_outputs_

struct base_prim_discrete_outputs
{
  real_T alignment_dummy;
  boolean_T elevator_1_active_mode;
  boolean_T elevator_2_active_mode;
  boolean_T elevator_3_active_mode;
  boolean_T ths_active_mode;
  boolean_T left_aileron_1_active_mode;
  boolean_T left_aileron_2_active_mode;
  boolean_T right_aileron_1_active_mode;
  boolean_T right_aileron_2_active_mode;
  boolean_T left_spoiler_electronic_module_enable;
  boolean_T right_spoiler_electronic_module_enable;
  boolean_T rudder_1_hydraulic_active_mode;
  boolean_T rudder_1_electric_active_mode;
  boolean_T rudder_2_hydraulic_active_mode;
  boolean_T rudder_2_electric_active_mode;
  boolean_T prim_healthy;
  boolean_T fcu_1_select;
  boolean_T fcu_2_select;
  boolean_T ap_engaged;
  boolean_T reverser_tertiary_lock;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_prim_analog_outputs_
#define DEFINED_TYPEDEF_FOR_base_prim_analog_outputs_

struct base_prim_analog_outputs
{
  real_T elevator_1_pos_order_deg;
  real_T elevator_2_pos_order_deg;
  real_T elevator_3_pos_order_deg;
  real_T ths_pos_order_deg;
  real_T left_aileron_1_pos_order_deg;
  real_T left_aileron_2_pos_order_deg;
  real_T right_aileron_1_pos_order_deg;
  real_T right_aileron_2_pos_order_deg;
  real_T left_spoiler_pos_order_deg;
  real_T right_spoiler_pos_order_deg;
  real_T rudder_1_pos_order_deg;
  real_T rudder_2_pos_order_deg;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_prim_outputs_
#define DEFINED_TYPEDEF_FOR_prim_outputs_

struct prim_outputs
{
  prim_inputs data;
  base_prim_general_logic_outputs general_logic;
  base_prim_flight_envelope_outputs flight_envelope;
  base_prim_laws_outputs laws;
  base_prim_fctl_logic_outputs fctl_logic;
  base_prim_fg_logic_output fg_logic;
  base_prim_ap_fd_logic_outputs fg_mode_logic;
  base_prim_fg_laws_outputs fg_laws;
  base_prim_discrete_outputs discrete_outputs;
  base_prim_analog_outputs analog_outputs;
  base_prim_out_bus bus_outputs;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_SignStatusMatrix_
#define DEFINED_TYPEDEF_FOR_SignStatusMatrix_

enum class SignStatusMatrix
  : int32_T {
  FailureWarning = 0,
  NoComputedData,
  FunctionalTest,
  NormalOperation
};

#endif
#endif

