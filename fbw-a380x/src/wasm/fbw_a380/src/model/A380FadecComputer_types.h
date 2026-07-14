#ifndef A380FadecComputer_types_h_
#define A380FadecComputer_types_h_
#include "rtwtypes.h"
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

#ifndef DEFINED_TYPEDEF_FOR_athr_thrust_limit_type_
#define DEFINED_TYPEDEF_FOR_athr_thrust_limit_type_

enum class athr_thrust_limit_type
  : int32_T {
  NONE = 0,
  CLB,
  MCT,
  FLEX,
  TOGA,
  REVERSE
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

#ifndef DEFINED_TYPEDEF_FOR_athr_data_computed_
#define DEFINED_TYPEDEF_FOR_athr_data_computed_

struct athr_data_computed
{
  boolean_T TLA_in_active_range;
  boolean_T is_FLX_active;
  boolean_T ATHR_disabled;
  real_T time_since_touchdown;
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
  base_arinc_429 n1_limit_percent;
  base_arinc_429 n1_maximum_percent;
  base_arinc_429 n1_command_percent;
  base_arinc_429 selected_n2_actual_percent;
  base_arinc_429 selected_n1_actual_percent;
  base_arinc_429 ecu_maintenance_word_6;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_athr_time_
#define DEFINED_TYPEDEF_FOR_athr_time_

struct athr_time
{
  real_T dt;
  real_T simulation_time;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_athr_data_
#define DEFINED_TYPEDEF_FOR_athr_data_

struct athr_data
{
  real_T V_ias_kn;
  real_T V_tas_kn;
  real_T V_mach;
  real_T V_gnd_kn;
  real_T alpha_deg;
  real_T H_ft;
  real_T H_ind_ft;
  real_T H_radio_ft;
  real_T H_dot_fpm;
  boolean_T on_ground;
  real_T flap_handle_index;
  boolean_T is_engine_operative;
  real_T commanded_engine_N1_percent;
  real_T engine_N1_percent;
  real_T engine_N2_percent;
  real_T TAT_degC;
  real_T OAT_degC;
  real_T ISA_degC;
  real_T ambient_density_kg_per_m3;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_athr_input_
#define DEFINED_TYPEDEF_FOR_athr_input_

struct athr_input
{
  boolean_T ATHR_disconnect;
  real_T TLA_deg;
  real_T thrust_limit_REV_percent;
  real_T thrust_limit_IDLE_percent;
  real_T thrust_limit_CLB_percent;
  real_T thrust_limit_MCT_percent;
  real_T thrust_limit_FLEX_percent;
  real_T thrust_limit_TOGA_percent;
  boolean_T is_anti_ice_active;
  boolean_T is_air_conditioning_active;
  boolean_T ATHR_reset_disable;
  boolean_T tracking_mode_on_override;
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

#ifndef DEFINED_TYPEDEF_FOR_athr_in_
#define DEFINED_TYPEDEF_FOR_athr_in_

struct athr_in
{
  athr_time time;
  athr_data data;
  athr_input input;
  base_prim_out_bus prim_1;
  base_prim_out_bus prim_2;
  base_prim_out_bus prim_3;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_athr_output_
#define DEFINED_TYPEDEF_FOR_athr_output_

struct athr_output
{
  real_T sim_throttle_lever_pos;
  real_T sim_thrust_mode;
  real_T N1_TLA_percent;
  boolean_T is_in_reverse;
  athr_thrust_limit_type thrust_limit_type;
  real_T thrust_limit_percent;
  real_T N1_c_percent;
  boolean_T athr_control_active;
  boolean_T memo_thrust_active;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_athr_out_
#define DEFINED_TYPEDEF_FOR_athr_out_

struct athr_out
{
  athr_time time;
  athr_data data;
  athr_data_computed data_computed;
  athr_input input;
  base_prim_out_bus prim_input;
  athr_output output;
  base_eec fadec_bus_output;
};

#endif
#endif

