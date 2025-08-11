#ifndef AutopilotStateMachine_types_h_
#define AutopilotStateMachine_types_h_
#include "rtwtypes.h"
#ifndef DEFINED_TYPEDEF_FOR_ap_lat_lon_alt_
#define DEFINED_TYPEDEF_FOR_ap_lat_lon_alt_

struct ap_lat_lon_alt
{
  real_T lat;
  real_T lon;
  real_T alt;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_ap_raw_data_
#define DEFINED_TYPEDEF_FOR_ap_raw_data_

struct ap_raw_data
{
  ap_lat_lon_alt aircraft_position;
  real_T Theta_deg;
  real_T Phi_deg;
  real_T q_rad_s;
  real_T r_rad_s;
  real_T p_rad_s;
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
  real_T bx_m_s2;
  real_T by_m_s2;
  real_T bz_m_s2;
  boolean_T nav_valid;
  real_T nav_loc_deg;
  real_T nav_gs_deg;
  real_T nav_dme_valid;
  real_T nav_dme_nmi;
  boolean_T nav_loc_valid;
  real_T nav_loc_magvar_deg;
  real_T nav_loc_error_deg;
  ap_lat_lon_alt nav_loc_position;
  boolean_T nav_gs_valid;
  real_T nav_gs_error_deg;
  ap_lat_lon_alt nav_gs_position;
  real_T flight_guidance_xtk_nmi;
  real_T flight_guidance_tae_deg;
  real_T flight_guidance_phi_deg;
  real_T flight_guidance_phi_limit_deg;
  real_T flight_phase;
  real_T V2_kn;
  real_T VAPP_kn;
  real_T VLS_kn;
  real_T VMAX_kn;
  boolean_T is_flight_plan_available;
  real_T altitude_constraint_ft;
  real_T thrust_reduction_altitude;
  real_T thrust_reduction_altitude_go_around;
  real_T acceleration_altitude;
  real_T acceleration_altitude_engine_out;
  real_T acceleration_altitude_go_around;
  real_T acceleration_altitude_go_around_engine_out;
  real_T cruise_altitude;
  real_T gear_strut_compression_1;
  real_T gear_strut_compression_2;
  real_T zeta_pos;
  real_T throttle_lever_1_pos;
  real_T throttle_lever_2_pos;
  real_T throttle_lever_3_pos;
  real_T throttle_lever_4_pos;
  real_T flaps_handle_index;
  boolean_T is_engine_operative_1;
  boolean_T is_engine_operative_2;
  boolean_T is_engine_operative_3;
  boolean_T is_engine_operative_4;
  real_T altimeter_setting_left_mbar;
  real_T altimeter_setting_right_mbar;
  real_T total_weight_kg;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_ap_data_
#define DEFINED_TYPEDEF_FOR_ap_data_

struct ap_data
{
  ap_lat_lon_alt aircraft_position;
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
  real_T ax_m_s2;
  real_T ay_m_s2;
  real_T az_m_s2;
  real_T bx_m_s2;
  real_T by_m_s2;
  real_T bz_m_s2;
  boolean_T nav_valid;
  real_T nav_loc_deg;
  real_T nav_gs_deg;
  real_T nav_dme_valid;
  real_T nav_dme_nmi;
  boolean_T nav_loc_valid;
  real_T nav_loc_magvar_deg;
  real_T nav_loc_error_deg;
  ap_lat_lon_alt nav_loc_position;
  boolean_T nav_e_loc_valid;
  real_T nav_e_loc_error_deg;
  boolean_T nav_gs_valid;
  real_T nav_gs_error_deg;
  ap_lat_lon_alt nav_gs_position;
  boolean_T nav_e_gs_valid;
  real_T nav_e_gs_error_deg;
  real_T flight_guidance_xtk_nmi;
  real_T flight_guidance_tae_deg;
  real_T flight_guidance_phi_deg;
  real_T flight_guidance_phi_limit_deg;
  real_T flight_phase;
  real_T V2_kn;
  real_T VAPP_kn;
  real_T VLS_kn;
  real_T VMAX_kn;
  boolean_T is_flight_plan_available;
  real_T altitude_constraint_ft;
  real_T thrust_reduction_altitude;
  real_T thrust_reduction_altitude_go_around;
  real_T acceleration_altitude;
  real_T acceleration_altitude_engine_out;
  real_T acceleration_altitude_go_around;
  real_T acceleration_altitude_go_around_engine_out;
  real_T cruise_altitude;
  real_T on_ground;
  real_T zeta_deg;
  real_T throttle_lever_1_pos;
  real_T throttle_lever_2_pos;
  real_T throttle_lever_3_pos;
  real_T throttle_lever_4_pos;
  real_T flaps_handle_index;
  boolean_T is_engine_operative_1;
  boolean_T is_engine_operative_2;
  boolean_T is_engine_operative_3;
  boolean_T is_engine_operative_4;
  boolean_T altimeter_setting_changed;
  real_T total_weight_kg;
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

#ifndef DEFINED_TYPEDEF_FOR_fm_requested_vertical_mode_
#define DEFINED_TYPEDEF_FOR_fm_requested_vertical_mode_

enum class fm_requested_vertical_mode
  : int32_T {
  NONE = 0,
  SPEED_THRUST,
  VPATH_THRUST,
  VPATH_SPEED,
  FPA_SPEED,
  VS_SPEED
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_ap_raw_sm_input_
#define DEFINED_TYPEDEF_FOR_ap_raw_sm_input_

struct ap_raw_sm_input
{
  boolean_T FD_active;
  boolean_T AP_ENGAGE_push;
  boolean_T AP_1_push;
  boolean_T AP_2_push;
  boolean_T AP_DISCONNECT_push;
  boolean_T HDG_push;
  boolean_T HDG_pull;
  boolean_T ALT_push;
  boolean_T ALT_pull;
  boolean_T VS_push;
  boolean_T VS_pull;
  boolean_T LOC_push;
  boolean_T APPR_push;
  boolean_T EXPED_push;
  real_T V_fcu_kn;
  real_T Psi_fcu_deg;
  real_T H_fcu_ft;
  real_T H_constraint_ft;
  real_T H_dot_fcu_fpm;
  real_T FPA_fcu_deg;
  boolean_T TRK_FPA_mode;
  boolean_T DIR_TO_trigger;
  boolean_T is_FLX_active;
  boolean_T Slew_trigger;
  boolean_T MACH_mode;
  boolean_T ATHR_engaged;
  boolean_T is_SPEED_managed;
  boolean_T FDR_event;
  real_T Phi_loc_c;
  fm_requested_vertical_mode FM_requested_vertical_mode;
  real_T FM_H_c_ft;
  real_T FM_H_dot_c_fpm;
  boolean_T FM_rnav_appr_selected;
  boolean_T FM_final_des_can_engage;
  boolean_T TCAS_mode_fail;
  boolean_T TCAS_mode_available;
  real_T TCAS_advisory_state;
  real_T TCAS_advisory_target_min_fpm;
  real_T TCAS_advisory_target_max_fpm;
  boolean_T condition_Flare;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_ap_sm_input_
#define DEFINED_TYPEDEF_FOR_ap_sm_input_

struct ap_sm_input
{
  ap_raw_time time;
  ap_raw_data data;
  ap_raw_sm_input input;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_ap_lateral_armed_
#define DEFINED_TYPEDEF_FOR_ap_lateral_armed_

struct ap_lateral_armed
{
  boolean_T NAV;
  boolean_T LOC;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_ap_lateral_condition_
#define DEFINED_TYPEDEF_FOR_ap_lateral_condition_

struct ap_lateral_condition
{
  boolean_T NAV;
  boolean_T LOC_CPT;
  boolean_T LOC_TRACK;
  boolean_T LAND;
  boolean_T FLARE;
  boolean_T ROLL_OUT;
  boolean_T GA_TRACK;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_ap_sm_data_computed_
#define DEFINED_TYPEDEF_FOR_ap_sm_data_computed_

struct ap_sm_data_computed
{
  real_T time_since_touchdown;
  real_T time_since_lift_off;
  real_T time_since_SRS;
  boolean_T H_fcu_in_selection;
  boolean_T H_constraint_valid;
  boolean_T Psi_fcu_in_selection;
  boolean_T gs_convergent_towards_beam;
  boolean_T V_fcu_in_selection;
  boolean_T ALT_soft_mode;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_lateral_mode_
#define DEFINED_TYPEDEF_FOR_lateral_mode_

enum class lateral_mode
  : int32_T {
  NONE = 0,
  HDG = 10,
  TRACK = 11,
  NAV = 20,
  LOC_CPT = 30,
  LOC_TRACK = 31,
  LAND = 32,
  FLARE = 33,
  ROLL_OUT = 34,
  RWY = 40,
  RWY_TRACK = 41,
  GA_TRACK = 50
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

#ifndef DEFINED_TYPEDEF_FOR_ap_lateral_output_
#define DEFINED_TYPEDEF_FOR_ap_lateral_output_

struct ap_lateral_output
{
  lateral_mode mode;
  boolean_T mode_reversion;
  boolean_T mode_reversion_TRK_FPA;
  lateral_law law;
  real_T Psi_c_deg;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_vertical_mode_
#define DEFINED_TYPEDEF_FOR_vertical_mode_

enum class vertical_mode
  : int32_T {
  NONE = 0,
  ALT = 10,
  ALT_CPT = 11,
  OP_CLB = 12,
  OP_DES = 13,
  VS = 14,
  FPA = 15,
  ALT_CST = 20,
  ALT_CST_CPT = 21,
  CLB = 22,
  DES = 23,
  FINAL_DES = 24,
  GS_CPT = 30,
  GS_TRACK = 31,
  LAND = 32,
  FLARE = 33,
  ROLL_OUT = 34,
  SRS = 40,
  SRS_GA = 41,
  TCAS = 50
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_athr_requested_mode_
#define DEFINED_TYPEDEF_FOR_athr_requested_mode_

enum class athr_requested_mode
  : int32_T {
  NONE = 0,
  SPEED,
  THRUST_IDLE,
  THRUST_CLB,
  RETARD
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

#ifndef DEFINED_TYPEDEF_FOR_tcas_sub_mode_
#define DEFINED_TYPEDEF_FOR_tcas_sub_mode_

enum class tcas_sub_mode
  : int32_T {
  NONE = 0,
  ALT,
  ALT_CPT
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_ap_lateral_
#define DEFINED_TYPEDEF_FOR_ap_lateral_

struct ap_lateral
{
  ap_lateral_armed armed;
  ap_lateral_condition condition;
  ap_lateral_output output;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_ap_vertical_armed_
#define DEFINED_TYPEDEF_FOR_ap_vertical_armed_

struct ap_vertical_armed
{
  boolean_T ALT;
  boolean_T ALT_CST;
  boolean_T CLB;
  boolean_T DES;
  boolean_T FINAL_DES;
  boolean_T GS;
  boolean_T TCAS;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_ap_vertical_condition_
#define DEFINED_TYPEDEF_FOR_ap_vertical_condition_

struct ap_vertical_condition
{
  boolean_T ALT;
  boolean_T ALT_CPT;
  boolean_T ALT_CST;
  boolean_T ALT_CST_CPT;
  boolean_T CLB;
  boolean_T DES;
  boolean_T FINAL_DES;
  boolean_T GS_CPT;
  boolean_T GS_TRACK;
  boolean_T LAND;
  boolean_T FLARE;
  boolean_T ROLL_OUT;
  boolean_T SRS;
  boolean_T SRS_GA;
  boolean_T THR_RED;
  boolean_T H_fcu_active;
  boolean_T TCAS;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_ap_vertical_output_
#define DEFINED_TYPEDEF_FOR_ap_vertical_output_

struct ap_vertical_output
{
  vertical_mode mode;
  athr_requested_mode mode_autothrust;
  boolean_T mode_reversion;
  real_T mode_reversion_target_fpm;
  boolean_T mode_reversion_TRK_FPA;
  vertical_law law;
  real_T H_c_ft;
  real_T H_dot_c_fpm;
  real_T FPA_c_deg;
  real_T V_c_kn;
  boolean_T ALT_soft_mode_active;
  boolean_T ALT_cruise_mode_active;
  boolean_T EXPED_mode_active;
  boolean_T speed_protection_mode;
  boolean_T FD_disconnect;
  boolean_T FD_connect;
  tcas_sub_mode TCAS_sub_mode;
  boolean_T TCAS_sub_mode_compatible;
  boolean_T TCAS_message_disarm;
  boolean_T TCAS_message_RA_inhibit;
  boolean_T TCAS_message_TRK_FPA_deselection;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_ap_vertical_
#define DEFINED_TYPEDEF_FOR_ap_vertical_

struct ap_vertical
{
  ap_vertical_armed armed;
  ap_vertical_condition condition;
  ap_vertical_output output;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_ap_raw_laws_input_
#define DEFINED_TYPEDEF_FOR_ap_raw_laws_input_

struct ap_raw_laws_input
{
  real_T enabled_AP1;
  real_T enabled_AP2;
  real_T lateral_law;
  real_T lateral_mode;
  real_T lateral_mode_armed;
  real_T vertical_law;
  real_T vertical_mode;
  real_T vertical_mode_armed;
  real_T mode_reversion_lateral;
  real_T mode_reversion_vertical;
  real_T mode_reversion_vertical_target_fpm;
  boolean_T mode_reversion_TRK_FPA;
  boolean_T mode_reversion_triple_click;
  boolean_T mode_reversion_fma;
  boolean_T speed_protection_mode;
  real_T autothrust_mode;
  real_T Psi_c_deg;
  real_T H_c_ft;
  real_T H_dot_c_fpm;
  real_T FPA_c_deg;
  real_T V_c_kn;
  boolean_T ALT_soft_mode_active;
  boolean_T ALT_cruise_mode_active;
  boolean_T EXPED_mode_active;
  boolean_T FD_disconnect;
  boolean_T FD_connect;
  boolean_T TCAS_message_disarm;
  boolean_T TCAS_message_RA_inhibit;
  boolean_T TCAS_message_TRK_FPA_deselection;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_ap_sm_output_
#define DEFINED_TYPEDEF_FOR_ap_sm_output_

struct ap_sm_output
{
  ap_raw_time time;
  ap_data data;
  ap_sm_data_computed data_computed;
  ap_raw_sm_input input;
  ap_lateral lateral;
  ap_lateral lateral_previous;
  ap_vertical vertical;
  ap_vertical vertical_previous;
  ap_raw_laws_input output;
};

#endif
#endif

