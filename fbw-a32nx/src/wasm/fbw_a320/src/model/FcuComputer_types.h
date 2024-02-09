#ifndef RTW_HEADER_FcuComputer_types_h_
#define RTW_HEADER_FcuComputer_types_h_
#include "rtwtypes.h"

#ifndef DEFINED_TYPEDEF_FOR_efis_range_selection_
#define DEFINED_TYPEDEF_FOR_efis_range_selection_

enum class efis_range_selection
  : int32_T {
  RANGE_10 = 0,
  RANGE_20,
  RANGE_40,
  RANGE_80,
  RANGE_160,
  RANGE_320
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_efis_mode_selection_
#define DEFINED_TYPEDEF_FOR_efis_mode_selection_

enum class efis_mode_selection
  : int32_T {
  ROSE_ILS = 0,
  ROSE_VOR,
  ROSE_NAV,
  ARC,
  PLAN
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_efis_filter_selection_
#define DEFINED_TYPEDEF_FOR_efis_filter_selection_

enum class efis_filter_selection
  : int32_T {
  NONE = 0,
  CSTR,
  WPT,
  VORD,
  NDB,
  ARPT
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_efis_navaid_selection_
#define DEFINED_TYPEDEF_FOR_efis_navaid_selection_

enum class efis_navaid_selection
  : int32_T {
  NONE = 0,
  VOR,
  ADF
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

#ifndef DEFINED_TYPEDEF_FOR_base_fcu_knob_inputs_
#define DEFINED_TYPEDEF_FOR_base_fcu_knob_inputs_

struct base_fcu_knob_inputs
{
  boolean_T pushed;
  boolean_T pulled;
  int8_T turns;
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

#ifndef DEFINED_TYPEDEF_FOR_base_fcu_efis_panel_inputs_
#define DEFINED_TYPEDEF_FOR_base_fcu_efis_panel_inputs_

struct base_fcu_efis_panel_inputs
{
  efis_range_selection efis_range;
  efis_mode_selection efis_mode;
  efis_navaid_selection efis_navaid_1;
  efis_navaid_selection efis_navaid_2;
  boolean_T baro_is_inhg;
  base_fcu_knob_inputs baro_knob;
  boolean_T fd_button_pushed;
  boolean_T ls_button_pushed;
  boolean_T cstr_button_pushed;
  boolean_T wpt_button_pushed;
  boolean_T vord_button_pushed;
  boolean_T ndb_button_pushed;
  boolean_T arpt_button_pushed;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_fcu_afs_panel_inputs_
#define DEFINED_TYPEDEF_FOR_base_fcu_afs_panel_inputs_

struct base_fcu_afs_panel_inputs
{
  boolean_T loc_button_pressed;
  boolean_T exped_button_pressed;
  boolean_T appr_button_pressed;
  boolean_T spd_mach_button_pressed;
  boolean_T trk_fpa_button_pressed;
  boolean_T metric_alt_button_pressed;
  base_fcu_knob_inputs spd_knob;
  base_fcu_knob_inputs hdg_trk_knob;
  base_fcu_knob_inputs alt_knob;
  boolean_T alt_increment_1000;
  base_fcu_knob_inputs vs_fpa_knob;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_fcu_discrete_inputs_
#define DEFINED_TYPEDEF_FOR_base_fcu_discrete_inputs_

struct base_fcu_discrete_inputs
{
  boolean_T ap_1_engaged;
  boolean_T fd_1_engaged;
  boolean_T athr_1_engaged;
  boolean_T ap_2_engaged;
  boolean_T fd_2_engaged;
  boolean_T athr_2_engaged;
  boolean_T lights_test;
  base_fcu_efis_panel_inputs capt_efis_inputs;
  base_fcu_efis_panel_inputs fo_efis_inputs;
  base_fcu_afs_panel_inputs afs_inputs;
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

#ifndef DEFINED_TYPEDEF_FOR_base_fmgc_a_bus_
#define DEFINED_TYPEDEF_FOR_base_fmgc_a_bus_

struct base_fmgc_a_bus
{
  base_arinc_429 pfd_sel_spd_kts;
  base_arinc_429 runway_hdg_memorized_deg;
  base_arinc_429 preset_mach_from_mcdu;
  base_arinc_429 preset_speed_from_mcdu_kts;
  base_arinc_429 roll_fd_command;
  base_arinc_429 pitch_fd_command;
  base_arinc_429 yaw_fd_command;
  base_arinc_429 discrete_word_5;
  base_arinc_429 discrete_word_4;
  base_arinc_429 fm_alt_constraint_ft;
  base_arinc_429 altitude_ft;
  base_arinc_429 mach;
  base_arinc_429 cas_kts;
  base_arinc_429 flx_to_temp_deg_c;
  base_arinc_429 ats_discrete_word;
  base_arinc_429 ats_fma_discrete_word;
  base_arinc_429 discrete_word_3;
  base_arinc_429 discrete_word_1;
  base_arinc_429 discrete_word_2;
  base_arinc_429 discrete_word_6;
  base_arinc_429 synchro_spd_mach_value;
  base_arinc_429 low_target_speed_margin_kts;
  base_arinc_429 high_target_speed_margin_kts;
  base_arinc_429 delta_p_ail_voted_cmd_deg;
  base_arinc_429 delta_p_splr_voted_cmd_deg;
  base_arinc_429 delta_r_voted_cmd_deg;
  base_arinc_429 delta_nosewheel_voted_cmd_deg;
  base_arinc_429 delta_q_voted_cmd_deg;
  base_arinc_429 track_deg;
  base_arinc_429 heading_deg;
  base_arinc_429 fpa_deg;
  base_arinc_429 n1_command_percent;
  base_arinc_429 vertical_speed_ft_min;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_fcu_bus_inputs_
#define DEFINED_TYPEDEF_FOR_base_fcu_bus_inputs_

struct base_fcu_bus_inputs
{
  base_fmgc_a_bus fmgc_1_bus;
  base_fmgc_a_bus fmgc_2_bus;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_fcu_inputs_
#define DEFINED_TYPEDEF_FOR_fcu_inputs_

struct fcu_inputs
{
  base_time time;
  base_sim_data sim_data;
  base_fcu_discrete_inputs discrete_inputs;
  base_fcu_bus_inputs bus_inputs;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_afs_fmgc_data_
#define DEFINED_TYPEDEF_FOR_base_afs_fmgc_data_

struct base_afs_fmgc_data
{
  real32_T v_cas_kts;
  real32_T v_mach;
  real32_T hdg_deg;
  real32_T trk_deg;
  real32_T alt_ft;
  real32_T vs_ft_min;
  real32_T fpa_deg;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_afs_logic_outputs_
#define DEFINED_TYPEDEF_FOR_base_afs_logic_outputs_

struct base_afs_logic_outputs
{
  boolean_T fmgc_1_has_priority;
  base_afs_fmgc_data chosen_fmgc_data;
  boolean_T any_ap_fd_engaged;
  boolean_T trk_fpa_active;
  boolean_T metric_alt_active;
  boolean_T auto_speed_control;
  boolean_T selected_speed_control;
  real32_T spd_mach_display_value;
  boolean_T spd_mach_dashes;
  boolean_T hdg_trk_managed;
  boolean_T hdg_trk_selected;
  real32_T hdg_trk_display_value;
  boolean_T hdg_trk_dashes;
  boolean_T hdg_trk_preset_available;
  real32_T alt_display_value;
  boolean_T lvl_ch_managed;
  boolean_T lvl_ch_vs_fpa;
  real32_T vs_fpa_display_value;
  boolean_T vs_fpa_dashes;
  boolean_T exped_active;
  boolean_T loc_only_active;
  boolean_T appr_active;
  base_fcu_knob_inputs hdg_trk_buttons;
  base_fcu_knob_inputs spd_mach_buttons;
  base_fcu_knob_inputs alt_buttons;
  base_fcu_knob_inputs vs_fpa_buttons;
  boolean_T loc_pushed;
  boolean_T exped_pushed;
  boolean_T appr_pushed;
  boolean_T spd_mach_switching_pushed;
  boolean_T lat_value_changed;
  boolean_T alt_value_changed;
  boolean_T vpath_value_changed;
  boolean_T spd_mach_value_changed;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_fcu_efis_logic_outputs_
#define DEFINED_TYPEDEF_FOR_base_fcu_efis_logic_outputs_

struct base_fcu_efis_logic_outputs
{
  boolean_T fd_on;
  boolean_T ls_on;
  efis_filter_selection efis_filter;
  boolean_T baro_std;
  boolean_T baro_qnh;
  boolean_T baro_qfe;
  real32_T baro_value_hpa;
  real32_T baro_value_inhg;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_fcu_logic_outputs_
#define DEFINED_TYPEDEF_FOR_base_fcu_logic_outputs_

struct base_fcu_logic_outputs
{
  base_afs_logic_outputs afs;
  base_fcu_efis_logic_outputs capt_efis;
  base_fcu_efis_logic_outputs fo_efis;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_fcu_efis_panel_outputs_
#define DEFINED_TYPEDEF_FOR_base_fcu_efis_panel_outputs_

struct base_fcu_efis_panel_outputs
{
  boolean_T fd_light_on;
  boolean_T ls_light_on;
  boolean_T cstr_light_on;
  boolean_T wpt_light_on;
  boolean_T vord_light_on;
  boolean_T ndb_light_on;
  boolean_T arpt_light_on;
  int8_T baro_value_mode;
  real32_T baro_value;
  int8_T baro_mode;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_fcu_afs_panel_outputs_
#define DEFINED_TYPEDEF_FOR_base_fcu_afs_panel_outputs_

struct base_fcu_afs_panel_outputs
{
  boolean_T loc_light_on;
  boolean_T exped_light_on;
  boolean_T appr_light_on;
  boolean_T ap_1_light_on;
  boolean_T ap_2_light_on;
  boolean_T athr_light_on;
  boolean_T trk_fpa_mode;
  boolean_T mach_mode;
  real_T spd_mach_value;
  boolean_T spd_mach_dashes;
  boolean_T spd_mach_managed;
  real_T hdg_trk_value;
  boolean_T hdg_trk_dashes;
  boolean_T hdg_trk_managed;
  real_T alt_value;
  boolean_T lvl_ch_managed;
  real_T vs_fpa_value;
  boolean_T vs_fpa_dashes;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_fcu_discrete_outputs_
#define DEFINED_TYPEDEF_FOR_base_fcu_discrete_outputs_

struct base_fcu_discrete_outputs
{
  base_fcu_efis_panel_outputs capt_efis_outputs;
  base_fcu_efis_panel_outputs fo_efis_outputs;
  base_fcu_afs_panel_outputs afs_outputs;
  boolean_T fcu_healthy;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_fcu_bus_
#define DEFINED_TYPEDEF_FOR_base_fcu_bus_

struct base_fcu_bus
{
  base_arinc_429 selected_hdg_deg;
  base_arinc_429 selected_alt_ft;
  base_arinc_429 selected_spd_kts;
  base_arinc_429 selected_vz_ft_min;
  base_arinc_429 selected_mach;
  base_arinc_429 selected_trk_deg;
  base_arinc_429 selected_fpa_deg;
  base_arinc_429 ats_fma_discrete_word;
  base_arinc_429 fcu_flex_to_temp_deg_c;
  base_arinc_429 ats_discrete_word;
  base_arinc_429 eis_discrete_word_1_left;
  base_arinc_429 eis_discrete_word_1_right;
  base_arinc_429 eis_discrete_word_2_left;
  base_arinc_429 eis_discrete_word_2_right;
  base_arinc_429 baro_setting_left_hpa;
  base_arinc_429 baro_setting_right_hpa;
  base_arinc_429 baro_setting_left_inhg;
  base_arinc_429 baro_setting_right_inhg;
  base_arinc_429 fcu_discrete_word_2;
  base_arinc_429 fcu_discrete_word_1;
  base_arinc_429 n1_cmd_percent;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_fcu_outputs_
#define DEFINED_TYPEDEF_FOR_fcu_outputs_

struct fcu_outputs
{
  fcu_inputs data;
  base_fcu_logic_outputs logic;
  base_fcu_discrete_outputs discrete_outputs;
  base_fcu_bus bus_outputs;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_struct_nm25uKBLHRjCcZyzI1BLUB_
#define DEFINED_TYPEDEF_FOR_struct_nm25uKBLHRjCcZyzI1BLUB_

struct struct_nm25uKBLHRjCcZyzI1BLUB
{
  real_T v_cas_kts;
  real_T v_mach;
  real_T hdg_deg;
  real_T trk_deg;
  real_T alt_ft;
  real_T vs_ft_min;
  real_T fpa_deg;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_struct_XAtn0711Lcc2c5LVlUmASD_
#define DEFINED_TYPEDEF_FOR_struct_XAtn0711Lcc2c5LVlUmASD_

struct struct_XAtn0711Lcc2c5LVlUmASD
{
  boolean_T pushed;
  boolean_T pulled;
  real_T turns;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_struct_IdOX3oqwDJ1PzU9qaOdl1_
#define DEFINED_TYPEDEF_FOR_struct_IdOX3oqwDJ1PzU9qaOdl1_

struct struct_IdOX3oqwDJ1PzU9qaOdl1
{
  boolean_T fmgc_1_has_priority;
  struct_nm25uKBLHRjCcZyzI1BLUB chosen_fmgc_data;
  boolean_T any_ap_fd_engaged;
  boolean_T trk_fpa_active;
  boolean_T metric_alt_active;
  boolean_T auto_speed_control;
  boolean_T selected_speed_control;
  real_T spd_mach_display_value;
  boolean_T spd_mach_dashes;
  boolean_T hdg_trk_managed;
  boolean_T hdg_trk_selected;
  real_T hdg_trk_display_value;
  boolean_T hdg_trk_dashes;
  boolean_T hdg_trk_preset_available;
  real_T alt_display_value;
  boolean_T lvl_ch_managed;
  boolean_T lvl_ch_vs_fpa;
  real_T vs_fpa_display_value;
  boolean_T vs_fpa_dashes;
  boolean_T exped_active;
  boolean_T loc_only_active;
  boolean_T appr_active;
  struct_XAtn0711Lcc2c5LVlUmASD hdg_trk_buttons;
  struct_XAtn0711Lcc2c5LVlUmASD spd_mach_buttons;
  struct_XAtn0711Lcc2c5LVlUmASD alt_buttons;
  struct_XAtn0711Lcc2c5LVlUmASD vs_fpa_buttons;
  boolean_T loc_pushed;
  boolean_T exped_pushed;
  boolean_T appr_pushed;
  boolean_T spd_mach_switching_pushed;
  boolean_T lat_value_changed;
  boolean_T alt_value_changed;
  boolean_T vpath_value_changed;
  boolean_T spd_mach_value_changed;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_struct_bqjSWtmatK4obwyFIPQOyC_
#define DEFINED_TYPEDEF_FOR_struct_bqjSWtmatK4obwyFIPQOyC_

struct struct_bqjSWtmatK4obwyFIPQOyC
{
  boolean_T fd_on;
  boolean_T ls_on;
  efis_filter_selection efis_filter;
  boolean_T baro_std;
  boolean_T baro_qnh;
  boolean_T baro_qfe;
  real_T baro_value_hpa;
  real_T baro_value_inhg;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_struct_1rLxL9ABQnU5BCfHWgsADF_
#define DEFINED_TYPEDEF_FOR_struct_1rLxL9ABQnU5BCfHWgsADF_

struct struct_1rLxL9ABQnU5BCfHWgsADF
{
  struct_IdOX3oqwDJ1PzU9qaOdl1 afs;
  struct_bqjSWtmatK4obwyFIPQOyC capt_efis;
  struct_bqjSWtmatK4obwyFIPQOyC fo_efis;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_struct_2OohiAWrazWy5wDS5iisgF_
#define DEFINED_TYPEDEF_FOR_struct_2OohiAWrazWy5wDS5iisgF_

struct struct_2OohiAWrazWy5wDS5iisgF
{
  real_T SSM;
  real_T Data;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_struct_jKPQGsPwrNwDJirnuGEHpB_
#define DEFINED_TYPEDEF_FOR_struct_jKPQGsPwrNwDJirnuGEHpB_

struct struct_jKPQGsPwrNwDJirnuGEHpB
{
  struct_2OohiAWrazWy5wDS5iisgF selected_hdg_deg;
  struct_2OohiAWrazWy5wDS5iisgF selected_alt_ft;
  struct_2OohiAWrazWy5wDS5iisgF selected_spd_kts;
  struct_2OohiAWrazWy5wDS5iisgF selected_vz_ft_min;
  struct_2OohiAWrazWy5wDS5iisgF selected_mach;
  struct_2OohiAWrazWy5wDS5iisgF selected_trk_deg;
  struct_2OohiAWrazWy5wDS5iisgF selected_fpa_deg;
  struct_2OohiAWrazWy5wDS5iisgF ats_fma_discrete_word;
  struct_2OohiAWrazWy5wDS5iisgF fcu_flex_to_temp_deg_c;
  struct_2OohiAWrazWy5wDS5iisgF ats_discrete_word;
  struct_2OohiAWrazWy5wDS5iisgF eis_discrete_word_1_left;
  struct_2OohiAWrazWy5wDS5iisgF eis_discrete_word_1_right;
  struct_2OohiAWrazWy5wDS5iisgF eis_discrete_word_2_left;
  struct_2OohiAWrazWy5wDS5iisgF eis_discrete_word_2_right;
  struct_2OohiAWrazWy5wDS5iisgF baro_setting_left_hpa;
  struct_2OohiAWrazWy5wDS5iisgF baro_setting_right_hpa;
  struct_2OohiAWrazWy5wDS5iisgF baro_setting_left_inhg;
  struct_2OohiAWrazWy5wDS5iisgF baro_setting_right_inhg;
  struct_2OohiAWrazWy5wDS5iisgF fcu_discrete_word_2;
  struct_2OohiAWrazWy5wDS5iisgF fcu_discrete_word_1;
  struct_2OohiAWrazWy5wDS5iisgF n1_cmd_percent;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_struct_Y6Zb6GuNhPISOIVdelTYXD_
#define DEFINED_TYPEDEF_FOR_struct_Y6Zb6GuNhPISOIVdelTYXD_

struct struct_Y6Zb6GuNhPISOIVdelTYXD
{
  boolean_T fd_light_on;
  boolean_T ls_light_on;
  boolean_T cstr_light_on;
  boolean_T wpt_light_on;
  boolean_T vord_light_on;
  boolean_T ndb_light_on;
  boolean_T arpt_light_on;
  real_T baro_value_mode;
  real_T baro_value;
  real_T baro_mode;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_struct_Ix96w8VELgZuPzNijTBYLB_
#define DEFINED_TYPEDEF_FOR_struct_Ix96w8VELgZuPzNijTBYLB_

struct struct_Ix96w8VELgZuPzNijTBYLB
{
  struct_Y6Zb6GuNhPISOIVdelTYXD capt_efis_outputs;
  struct_Y6Zb6GuNhPISOIVdelTYXD fo_efis_outputs;
  base_fcu_afs_panel_outputs afs_outputs;
  boolean_T fcu_healthy;
};

#endif
#endif

