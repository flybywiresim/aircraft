#ifndef RTW_HEADER_AutopilotLaws_types_h_
#define RTW_HEADER_AutopilotLaws_types_h_
#include "rtwtypes.h"

#ifndef DEFINED_TYPEDEF_FOR_ap_raw_time_
#define DEFINED_TYPEDEF_FOR_ap_raw_time_

struct ap_raw_time
{
  real_T dt;
  real_T simulation_time;
};

#endif

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
  real_T flaps_handle_index;
  boolean_T is_engine_operative_1;
  boolean_T is_engine_operative_2;
  real_T altimeter_setting_left_mbar;
  real_T altimeter_setting_right_mbar;
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

#ifndef DEFINED_TYPEDEF_FOR_ap_laws_input_
#define DEFINED_TYPEDEF_FOR_ap_laws_input_

struct ap_laws_input
{
  ap_raw_time time;
  ap_raw_data data;
  ap_raw_laws_input input;
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
  real_T flaps_handle_index;
  boolean_T is_engine_operative_1;
  boolean_T is_engine_operative_2;
  boolean_T altimeter_setting_changed;
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

#ifndef DEFINED_TYPEDEF_FOR_ap_raw_output_
#define DEFINED_TYPEDEF_FOR_ap_raw_output_

struct ap_raw_output
{
  real_T ap_on;
  real_T Phi_loc_c;
  real_T Nosewheel_c;
  ap_raw_output_command flight_director;
  ap_raw_output_command autopilot;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_ap_laws_output_
#define DEFINED_TYPEDEF_FOR_ap_laws_output_

struct ap_laws_output
{
  ap_raw_time time;
  ap_data data;
  ap_raw_laws_input input;
  ap_raw_output output;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_ap_output_law_
#define DEFINED_TYPEDEF_FOR_ap_output_law_

struct ap_output_law
{
  real_T flight_director;
  real_T autopilot;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_vertical_mode_
#define DEFINED_TYPEDEF_FOR_vertical_mode_

typedef enum {
  vertical_mode_NONE = 0,
  vertical_mode_ALT = 10,
  vertical_mode_ALT_CPT = 11,
  vertical_mode_OP_CLB = 12,
  vertical_mode_OP_DES = 13,
  vertical_mode_VS = 14,
  vertical_mode_FPA = 15,
  vertical_mode_ALT_CST = 20,
  vertical_mode_ALT_CST_CPT = 21,
  vertical_mode_CLB = 22,
  vertical_mode_DES = 23,
  vertical_mode_FINAL_DES = 24,
  vertical_mode_GS_CPT = 30,
  vertical_mode_GS_TRACK = 31,
  vertical_mode_LAND = 32,
  vertical_mode_FLARE = 33,
  vertical_mode_ROLL_OUT = 34,
  vertical_mode_SRS = 40,
  vertical_mode_SRS_GA = 41,
  vertical_mode_TCAS = 50
} vertical_mode;

#endif
#endif

