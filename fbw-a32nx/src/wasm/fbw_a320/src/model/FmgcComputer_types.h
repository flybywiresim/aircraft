#ifndef FmgcComputer_types_h_
#define FmgcComputer_types_h_
#include "rtwtypes.h"
#ifndef DEFINED_TYPEDEF_FOR_fmgc_flight_phase_
#define DEFINED_TYPEDEF_FOR_fmgc_flight_phase_

enum class fmgc_flight_phase
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

#ifndef DEFINED_TYPEDEF_FOR_base_arinc_429_
#define DEFINED_TYPEDEF_FOR_base_arinc_429_

struct base_arinc_429
{
  uint32_T SSM;
  real32_T Data;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_fmgc_b_bus_
#define DEFINED_TYPEDEF_FOR_base_fmgc_b_bus_

struct base_fmgc_b_bus
{
  base_arinc_429 fac_weight_lbs;
  base_arinc_429 fm_weight_lbs;
  base_arinc_429 fac_cg_percent;
  base_arinc_429 fm_cg_percent;
  base_arinc_429 fg_radio_height_ft;
  base_arinc_429 discrete_word_4;
  base_arinc_429 ats_discrete_word;
  base_arinc_429 discrete_word_3;
  base_arinc_429 discrete_word_1;
  base_arinc_429 discrete_word_2;
  base_arinc_429 approach_spd_target_kn;
  base_arinc_429 delta_p_ail_cmd_deg;
  base_arinc_429 delta_p_splr_cmd_deg;
  base_arinc_429 delta_r_cmd_deg;
  base_arinc_429 delta_nose_wheel_cmd_deg;
  base_arinc_429 delta_q_cmd_deg;
  base_arinc_429 n1_left_percent;
  base_arinc_429 n1_right_percent;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_fmgc_discrete_inputs_
#define DEFINED_TYPEDEF_FOR_base_fmgc_discrete_inputs_

struct base_fmgc_discrete_inputs
{
  boolean_T is_unit_1;
  boolean_T athr_opp_engaged;
  boolean_T fcu_athr_button;
  boolean_T athr_instinctive_disc;
  boolean_T fd_opp_engaged;
  boolean_T ap_opp_engaged;
  boolean_T fcu_ap_button;
  boolean_T ap_instinctive_disc;
  boolean_T powersupply_split;
  boolean_T fcu_opp_healthy;
  boolean_T fcu_own_healthy;
  boolean_T fac_opp_healthy;
  boolean_T fac_own_healthy;
  boolean_T fmgc_opp_healthy;
  boolean_T mcdu_opp_fail;
  boolean_T mcdu_own_fail;
  boolean_T nav_control_opp;
  boolean_T nav_control_own;
  boolean_T fwc_opp_valid;
  boolean_T fwc_own_valid;
  boolean_T pfd_opp_valid;
  boolean_T pfd_own_valid;
  boolean_T adc_3_switch;
  boolean_T att_3_switch;
  boolean_T left_wheel_spd_abv_70_kts;
  boolean_T right_wheel_spd_abv_70_kts;
  boolean_T bscu_opp_valid;
  boolean_T bscu_own_valid;
  boolean_T nose_gear_pressed_opp;
  boolean_T nose_gear_pressed_own;
  boolean_T elac_opp_ap_disc;
  boolean_T elac_own_ap_disc;
  boolean_T eng_opp_stop;
  boolean_T eng_own_stop;
  boolean_T tcas_ta_display;
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

#ifndef DEFINED_TYPEDEF_FOR_base_fms_inputs_
#define DEFINED_TYPEDEF_FOR_base_fms_inputs_

struct base_fms_inputs
{
  boolean_T fm_valid;
  fmgc_flight_phase fms_flight_phase;
  fmgc_approach_type selected_approach_type;
  boolean_T backbeam_selected;
  real_T fms_loc_distance;
  real_T fms_unrealistic_gs_angle_deg;
  real_T fms_weight_lbs;
  real_T fms_cg_percent;
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
  real_T acceleration_alt_eo_ft;
  real_T thrust_reduction_alt_ft;
  real_T cruise_alt_ft;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_fac_bus_
#define DEFINED_TYPEDEF_FOR_base_fac_bus_

struct base_fac_bus
{
  base_arinc_429 discrete_word_1;
  base_arinc_429 gamma_a_deg;
  base_arinc_429 gamma_t_deg;
  base_arinc_429 total_weight_lbs;
  base_arinc_429 center_of_gravity_pos_percent;
  base_arinc_429 sideslip_target_deg;
  base_arinc_429 fac_slat_angle_deg;
  base_arinc_429 fac_flap_angle_deg;
  base_arinc_429 discrete_word_2;
  base_arinc_429 rudder_travel_limit_command_deg;
  base_arinc_429 delta_r_yaw_damper_deg;
  base_arinc_429 estimated_sideslip_deg;
  base_arinc_429 v_alpha_lim_kn;
  base_arinc_429 v_ls_kn;
  base_arinc_429 v_stall_kn;
  base_arinc_429 v_alpha_prot_kn;
  base_arinc_429 v_stall_warn_kn;
  base_arinc_429 speed_trend_kn;
  base_arinc_429 v_3_kn;
  base_arinc_429 v_4_kn;
  base_arinc_429 v_man_kn;
  base_arinc_429 v_max_kn;
  base_arinc_429 v_fe_next_kn;
  base_arinc_429 discrete_word_3;
  base_arinc_429 discrete_word_4;
  base_arinc_429 discrete_word_5;
  base_arinc_429 delta_r_rudder_trim_deg;
  base_arinc_429 rudder_trim_pos_deg;
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

#ifndef DEFINED_TYPEDEF_FOR_base_ecu_bus_
#define DEFINED_TYPEDEF_FOR_base_ecu_bus_

struct base_ecu_bus
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

#ifndef DEFINED_TYPEDEF_FOR_base_ra_bus_
#define DEFINED_TYPEDEF_FOR_base_ra_bus_

struct base_ra_bus
{
  base_arinc_429 radio_height_ft;
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

#ifndef DEFINED_TYPEDEF_FOR_base_tcas_bus_
#define DEFINED_TYPEDEF_FOR_base_tcas_bus_

struct base_tcas_bus
{
  base_arinc_429 sensitivity_level;
  base_arinc_429 vertical_resolution_advisory;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_fmgc_bus_inputs_
#define DEFINED_TYPEDEF_FOR_base_fmgc_bus_inputs_

struct base_fmgc_bus_inputs
{
  base_fac_bus fac_opp_bus;
  base_fac_bus fac_own_bus;
  base_adr_bus adr_3_bus;
  base_ir_bus ir_3_bus;
  base_adr_bus adr_opp_bus;
  base_ir_bus ir_opp_bus;
  base_adr_bus adr_own_bus;
  base_ir_bus ir_own_bus;
  base_ecu_bus fadec_opp_bus;
  base_ecu_bus fadec_own_bus;
  base_ra_bus ra_opp_bus;
  base_ra_bus ra_own_bus;
  base_ils_bus ils_opp_bus;
  base_ils_bus ils_own_bus;
  base_fmgc_a_bus fmgc_opp_bus;
  base_fcu_bus fcu_bus;
  base_tcas_bus tcas_bus;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_fmgc_inputs_
#define DEFINED_TYPEDEF_FOR_fmgc_inputs_

struct fmgc_inputs
{
  base_time time;
  base_sim_data sim_data;
  base_fmgc_discrete_inputs discrete_inputs;
  base_fms_inputs fms_inputs;
  base_fmgc_bus_inputs bus_inputs;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_fmgc_logic_outputs_
#define DEFINED_TYPEDEF_FOR_base_fmgc_logic_outputs_

struct base_fmgc_logic_outputs
{
  boolean_T on_ground;
  boolean_T gnd_eng_stop_flt_5s;
  boolean_T one_engine_out;
  boolean_T engine_running;
  boolean_T ap_fd_athr_common_condition;
  boolean_T ap_fd_common_condition;
  boolean_T fd_own_engaged;
  boolean_T ap_own_engaged;
  boolean_T athr_own_engaged;
  boolean_T ap_inop;
  boolean_T athr_inop;
  boolean_T fmgc_opp_priority;
  boolean_T double_adr_failure;
  boolean_T double_ir_failure;
  boolean_T all_adr_valid;
  boolean_T all_ir_valid;
  base_adr_bus adr_computation_data;
  base_ir_bus ir_computation_data;
  base_arinc_429 altitude_indicated_ft;
  base_ra_bus ra_computation_data;
  boolean_T dual_ra_failure;
  boolean_T both_ra_valid;
  boolean_T fac_lg_data_failure;
  boolean_T fac_flap_slat_data_failure;
  int8_T flap_slat_lever_position;
  boolean_T fac_speeds_failure;
  boolean_T fac_weights_failure;
  boolean_T fac_rudder_control_failure;
  boolean_T both_fac_rudder_valid;
  base_fac_bus chosen_fac_bus;
  boolean_T fcu_failure;
  boolean_T ils_failure;
  boolean_T both_ils_valid;
  base_ils_bus ils_computation_data;
  boolean_T ils_tune_inhibit;
  real_T rwy_hdg_memo;
  boolean_T tcas_failure;
  boolean_T tcas_mode_available;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_fmgc_lateral_modes_
#define DEFINED_TYPEDEF_FOR_base_fmgc_lateral_modes_

struct base_fmgc_lateral_modes
{
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

#ifndef DEFINED_TYPEDEF_FOR_base_fmgc_longitudinal_modes_
#define DEFINED_TYPEDEF_FOR_base_fmgc_longitudinal_modes_

struct base_fmgc_longitudinal_modes
{
  boolean_T clb_active;
  boolean_T des_active;
  boolean_T op_clb_active;
  boolean_T op_des_active;
  boolean_T exp_clb_active;
  boolean_T exp_des_active;
  boolean_T pitch_takeoff_active;
  boolean_T pitch_goaround_active;
  boolean_T vs_active;
  boolean_T fpa_active;
  boolean_T alt_acq_active;
  boolean_T alt_hold_active;
  boolean_T fma_dash_display;
  boolean_T gs_capt_active;
  boolean_T gs_trk_active;
  boolean_T final_des_active;
  boolean_T flare_active;
  boolean_T cruise_active;
  boolean_T tcas_active;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_fmgc_armed_modes_
#define DEFINED_TYPEDEF_FOR_base_fmgc_armed_modes_

struct base_fmgc_armed_modes
{
  boolean_T alt_acq_armed;
  boolean_T alt_acq_arm_possible;
  boolean_T nav_armed;
  boolean_T loc_armed;
  boolean_T land_armed;
  boolean_T glide_armed;
  boolean_T final_des_armed;
  boolean_T clb_armed;
  boolean_T des_armed;
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

#ifndef DEFINED_TYPEDEF_FOR_base_fmgc_ap_fd_logic_outputs_
#define DEFINED_TYPEDEF_FOR_base_fmgc_ap_fd_logic_outputs_

struct base_fmgc_ap_fd_logic_outputs
{
  base_fmgc_lateral_modes lateral_modes;
  base_fmgc_longitudinal_modes longitudinal_modes;
  base_fmgc_armed_modes armed_modes;
  lateral_law active_lateral_law;
  vertical_law active_longitudinal_law;
  boolean_T auto_spd_control_active;
  boolean_T manual_spd_control_active;
  boolean_T mach_control_active;
  real_T spd_target_kts;
  real_T pfd_spd_target_kts;
  boolean_T alt_cstr_applicable;
  real_T alt_sel_or_cstr;
  boolean_T fmgc_opp_mode_sync;
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
  boolean_T land_2_capability;
  boolean_T land_3_fail_passive_capability;
  boolean_T land_3_fail_op_capability;
  boolean_T land_2_inop;
  boolean_T land_3_fail_passive_inop;
  boolean_T land_3_fail_op_inop;
  boolean_T land_2_capacity;
  boolean_T land_3_fail_passive_capacity;
  boolean_T land_3_fail_op_capacity;
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

#ifndef DEFINED_TYPEDEF_FOR_athr_fma_mode_
#define DEFINED_TYPEDEF_FOR_athr_fma_mode_

enum class athr_fma_mode
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
  TOGA_LK
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_athr_fma_message_
#define DEFINED_TYPEDEF_FOR_athr_fma_message_

enum class athr_fma_message
  : int32_T {
  NONE = 0,
  LVR_TOGA,
  LVR_CLB,
  LVR_MCT,
  LVR_ASYM
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_fmgc_athr_outputs_
#define DEFINED_TYPEDEF_FOR_base_fmgc_athr_outputs_

struct base_fmgc_athr_outputs
{
  boolean_T athr_active;
  boolean_T athr_limited;
  boolean_T alpha_floor_mode_active;
  boolean_T thrust_mode_active;
  boolean_T thrust_target_idle;
  boolean_T speed_mach_mode_active;
  boolean_T retard_mode_active;
  athr_fma_mode fma_mode;
  athr_fma_message fma_message;
  real_T n1_c_percent;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_fmgc_discrete_outputs_
#define DEFINED_TYPEDEF_FOR_base_fmgc_discrete_outputs_

struct base_fmgc_discrete_outputs
{
  boolean_T athr_own_engaged;
  boolean_T fd_own_engaged;
  boolean_T ap_own_engaged;
  boolean_T fcu_own_fail;
  boolean_T fmgc_healthy;
  boolean_T ils_test_inhibit;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_fmgc_bus_outputs_
#define DEFINED_TYPEDEF_FOR_base_fmgc_bus_outputs_

struct base_fmgc_bus_outputs
{
  base_fmgc_a_bus fmgc_a_bus;
  base_fmgc_b_bus fmgc_b_bus;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_fmgc_outputs_
#define DEFINED_TYPEDEF_FOR_fmgc_outputs_

struct fmgc_outputs
{
  fmgc_inputs data;
  base_fmgc_logic_outputs logic;
  base_fmgc_ap_fd_logic_outputs ap_fd_logic;
  ap_raw_output ap_fd_outer_loops;
  base_fmgc_athr_outputs athr;
  base_fmgc_discrete_outputs discrete_outputs;
  base_fmgc_bus_outputs bus_outputs;
};

#endif
#endif

