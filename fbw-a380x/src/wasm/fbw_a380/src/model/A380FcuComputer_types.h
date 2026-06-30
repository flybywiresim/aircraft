#ifndef A380FcuComputer_types_h_
#define A380FcuComputer_types_h_
#include "rtwtypes.h"
#ifndef DEFINED_TYPEDEF_FOR_a380_efis_mode_selection_
#define DEFINED_TYPEDEF_FOR_a380_efis_mode_selection_

enum class a380_efis_mode_selection
  : int32_T {
  ROSE_ILS = 0,
  ROSE_VOR,
  ROSE_NAV,
  ARC,
  PLAN
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

#ifndef DEFINED_TYPEDEF_FOR_a380_efis_filter_selection_
#define DEFINED_TYPEDEF_FOR_a380_efis_filter_selection_

enum class a380_efis_filter_selection
  : int32_T {
  NONE = 0,
  WPT,
  VORD,
  NDB
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_a380_surv_filter_selection_
#define DEFINED_TYPEDEF_FOR_a380_surv_filter_selection_

enum class a380_surv_filter_selection
  : int32_T {
  NONE = 0,
  TERR,
  WX
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

#ifndef DEFINED_TYPEDEF_FOR_base_fcu_efis_panel_inputs_
#define DEFINED_TYPEDEF_FOR_base_fcu_efis_panel_inputs_

struct base_fcu_efis_panel_inputs
{
  int8_T efis_range_knob_turns;
  int8_T efis_mode_knob_turns;
  boolean_T baro_is_inhg;
  base_fcu_knob_inputs baro_knob;
  boolean_T vv_button_pushed;
  boolean_T ls_button_pushed;
  boolean_T taxi_button_pushed;
  boolean_T cstr_button_pushed;
  boolean_T wpt_button_pushed;
  boolean_T vord_button_pushed;
  boolean_T ndb_button_pushed;
  boolean_T arpt_button_pushed;
  boolean_T navaid_1_button_pushed;
  boolean_T navaid_2_button_pushed;
  boolean_T wx_button_pushed;
  boolean_T terr_button_pushed;
  boolean_T traf_button_pushed;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_fcu_afs_panel_inputs_
#define DEFINED_TYPEDEF_FOR_base_fcu_afs_panel_inputs_

struct base_fcu_afs_panel_inputs
{
  boolean_T fd_button_pressed;
  boolean_T loc_button_pressed;
  boolean_T alt_button_pressed;
  boolean_T appr_button_pressed;
  boolean_T spd_mach_button_pressed;
  boolean_T true_mag_button_pressed;
  boolean_T trk_fpa_button_pressed;
  boolean_T metric_alt_button_pressed;
  base_fcu_knob_inputs spd_knob;
  base_fcu_knob_inputs hdg_trk_knob;
  base_fcu_knob_inputs alt_knob;
  boolean_T alt_increment_1000;
  base_fcu_knob_inputs vs_fpa_knob;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_a380_efis_navaid_selection_
#define DEFINED_TYPEDEF_FOR_a380_efis_navaid_selection_

enum class a380_efis_navaid_selection
  : int32_T {
  NONE = 0,
  ADF,
  VOR
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_a380_efis_panel_range_selection_
#define DEFINED_TYPEDEF_FOR_a380_efis_panel_range_selection_

enum class a380_efis_panel_range_selection
  : int32_T {
  RANGE_ZOOM = 0,
  RANGE_10,
  RANGE_20,
  RANGE_40,
  RANGE_80,
  RANGE_160,
  RANGE_320,
  RANGE_640
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_fcu_efis_panel_outputs_
#define DEFINED_TYPEDEF_FOR_base_fcu_efis_panel_outputs_

struct base_fcu_efis_panel_outputs
{
  boolean_T vv_light_on;
  boolean_T ls_light_on;
  boolean_T taxi_light_on;
  boolean_T cstr_light_on;
  boolean_T wpt_light_on;
  boolean_T vord_light_on;
  boolean_T ndb_light_on;
  boolean_T arpt_light_on;
  boolean_T traf_light_on;
  boolean_T wxr_light_on;
  boolean_T terr_light_on;
  a380_efis_navaid_selection navaid_1_mode;
  a380_efis_navaid_selection navaid_2_mode;
  a380_efis_panel_range_selection efis_range;
  a380_efis_mode_selection efis_mode;
  boolean_T baro_is_inhg;
  boolean_T baro_is_std;
  real32_T baro_value;
  int8_T baro_mode;
  boolean_T baro_preset_visible;
  boolean_T efis_cp_active;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_fcu_afs_panel_outputs_
#define DEFINED_TYPEDEF_FOR_base_fcu_afs_panel_outputs_

struct base_fcu_afs_panel_outputs
{
  boolean_T loc_light_on;
  boolean_T alt_light_on;
  boolean_T appr_light_on;
  boolean_T ap_1_light_on;
  boolean_T ap_2_light_on;
  boolean_T athr_light_on;
  boolean_T fd_light_on;
  boolean_T trk_fpa_mode;
  boolean_T true_mode;
  boolean_T mach_mode;
  real_T spd_mach_value;
  boolean_T spd_mach_dashes;
  real_T hdg_trk_value;
  boolean_T hdg_trk_dashes;
  real_T alt_value;
  real_T vs_fpa_value;
  boolean_T vs_fpa_dashes;
  boolean_T afs_cp_active;
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
  base_arinc_429 discrete_word_7;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_fcu_sim_input_
#define DEFINED_TYPEDEF_FOR_base_fcu_sim_input_

struct base_fcu_sim_input
{
  real32_T baro_setting_hpa;
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

#ifndef DEFINED_TYPEDEF_FOR_base_fcu_discrete_outputs_
#define DEFINED_TYPEDEF_FOR_base_fcu_discrete_outputs_

struct base_fcu_discrete_outputs
{
  base_fcu_efis_panel_outputs efis_outputs;
  base_fcu_afs_panel_outputs afs_outputs;
  boolean_T true_selected;
  boolean_T fcu_healthy;
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

#ifndef DEFINED_TYPEDEF_FOR_base_fcu_discrete_inputs_
#define DEFINED_TYPEDEF_FOR_base_fcu_discrete_inputs_

struct base_fcu_discrete_inputs
{
  boolean_T fcu_switched_off;
  boolean_T efis_backup_activated;
  boolean_T prim_1_healthy;
  boolean_T prim_2_healthy;
  boolean_T prim_3_healthy;
  boolean_T lights_test;
  boolean_T pin_prog_qfe_avail;
  base_fcu_efis_panel_inputs efis_inputs;
  base_fcu_afs_panel_inputs afs_inputs;
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
  base_fcu_sim_input sim_input;
  base_fcu_discrete_inputs discrete_inputs;
  base_fcu_bus_inputs bus_inputs;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_afs_logic_outputs_
#define DEFINED_TYPEDEF_FOR_base_afs_logic_outputs_

struct base_afs_logic_outputs
{
  boolean_T fmgc_1_has_priority;
  boolean_T ap_1_engaged;
  boolean_T ap_2_engaged;
  boolean_T athr_engaged;
  boolean_T fd_engaged;
  boolean_T mach_active;
  boolean_T trk_fpa_active;
  boolean_T true_active;
  boolean_T metric_alt_active;
  real32_T spd_mach_display_value;
  boolean_T spd_mach_dashes;
  real32_T hdg_trk_display_value;
  boolean_T hdg_trk_dashes;
  real32_T alt_display_value;
  real32_T vs_fpa_display_value;
  boolean_T vs_fpa_dashes;
  boolean_T alt_active;
  boolean_T loc_only_active;
  boolean_T appr_active;
  base_fcu_knob_inputs hdg_trk_buttons;
  base_fcu_knob_inputs spd_mach_buttons;
  base_fcu_knob_inputs alt_buttons;
  base_fcu_knob_inputs vs_fpa_buttons;
  boolean_T fd_pushed;
  boolean_T loc_pushed;
  boolean_T alt_pushed;
  boolean_T appr_pushed;
  boolean_T spd_mach_switching_pushed;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_a380_efis_range_selection_
#define DEFINED_TYPEDEF_FOR_a380_efis_range_selection_

enum class a380_efis_range_selection
  : int32_T {
  RANGE_ZOOM_POINT_2 = 0,
  RANGE_ZOOM_POINT_5,
  RANGE_ZOOM_1,
  RANGE_ZOOM_2,
  RANGE_10,
  RANGE_20,
  RANGE_40,
  RANGE_80,
  RANGE_160,
  RANGE_320,
  RANGE_640
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_fcu_efis_logic_outputs_
#define DEFINED_TYPEDEF_FOR_base_fcu_efis_logic_outputs_

struct base_fcu_efis_logic_outputs
{
  boolean_T vv_auto_activate;
  boolean_T vv_auto_deactivate;
  boolean_T ls_auto_activate;
  boolean_T vv_on;
  boolean_T ls_on;
  boolean_T taxi_on;
  a380_efis_filter_selection efis_filter;
  boolean_T cstr_on;
  boolean_T arpt_on;
  a380_efis_navaid_selection navaid_1;
  a380_efis_navaid_selection navaid_2;
  boolean_T traf_on;
  a380_surv_filter_selection surv_filter;
  a380_efis_mode_selection efis_mode;
  a380_efis_range_selection efis_range;
  boolean_T baro_std;
  boolean_T baro_qnh;
  boolean_T baro_qfe;
  real32_T baro_value_hpa;
  real32_T baro_value_inhg;
  boolean_T baro_preset_active;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_fcu_logic_outputs_
#define DEFINED_TYPEDEF_FOR_base_fcu_logic_outputs_

struct base_fcu_logic_outputs
{
  base_afs_logic_outputs afs;
  base_fcu_efis_logic_outputs efis;
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
#endif

