#ifndef Autothrust_types_h_
#define Autothrust_types_h_
#include "rtwtypes.h"
#ifndef DEFINED_TYPEDEF_FOR_athr_mode_
#define DEFINED_TYPEDEF_FOR_athr_mode_

enum class athr_mode
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

#ifndef DEFINED_TYPEDEF_FOR_athr_status_
#define DEFINED_TYPEDEF_FOR_athr_status_

enum class athr_status
  : int32_T {
  DISENGAGED = 0,
  ENGAGED_ARMED,
  ENGAGED_ACTIVE
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_athr_data_
#define DEFINED_TYPEDEF_FOR_athr_data_

struct athr_data
{
  real_T nz_g;
  real_T Theta_deg;
  real_T Phi_deg;
  real_T V_ias_kn;
  real_T V_tas_kn;
  real_T V_mach;
  real_T V_gnd_kn;
  real_T alpha_deg;
  real_T H_ft;
  real_T H_ind_ft;
  real_T H_radio_ft;
  real_T H_dot_fpm;
  real_T ax_m_s2;
  real_T ay_m_s2;
  real_T az_m_s2;
  real_T bx_m_s2;
  real_T by_m_s2;
  real_T bz_m_s2;
  real_T Psi_magnetic_deg;
  real_T Psi_magnetic_track_deg;
  boolean_T on_ground;
  real_T flap_handle_index;
  boolean_T is_engine_operative_1;
  boolean_T is_engine_operative_2;
  boolean_T is_engine_operative_3;
  boolean_T is_engine_operative_4;
  real_T commanded_engine_N1_1_percent;
  real_T commanded_engine_N1_2_percent;
  real_T commanded_engine_N1_3_percent;
  real_T commanded_engine_N1_4_percent;
  real_T engine_N1_1_percent;
  real_T engine_N1_2_percent;
  real_T engine_N1_3_percent;
  real_T engine_N1_4_percent;
  real_T TAT_degC;
  real_T OAT_degC;
  real_T ISA_degC;
  real_T ambient_density_kg_per_m3;
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

#ifndef DEFINED_TYPEDEF_FOR_athr_raw_data_
#define DEFINED_TYPEDEF_FOR_athr_raw_data_

struct athr_raw_data
{
  real_T nz_g;
  real_T Theta_deg;
  real_T Phi_deg;
  real_T V_ias_kn;
  real_T V_tas_kn;
  real_T V_mach;
  real_T V_gnd_kn;
  real_T alpha_deg;
  real_T H_ft;
  real_T H_ind_ft;
  real_T H_radio_ft;
  real_T H_dot_fpm;
  real_T bx_m_s2;
  real_T by_m_s2;
  real_T bz_m_s2;
  real_T Psi_magnetic_deg;
  real_T Psi_magnetic_track_deg;
  real_T gear_strut_compression_1;
  real_T gear_strut_compression_2;
  real_T flap_handle_index;
  boolean_T is_engine_operative_1;
  boolean_T is_engine_operative_2;
  boolean_T is_engine_operative_3;
  boolean_T is_engine_operative_4;
  real_T commanded_engine_N1_1_percent;
  real_T commanded_engine_N1_2_percent;
  real_T commanded_engine_N1_3_percent;
  real_T commanded_engine_N1_4_percent;
  real_T engine_N1_1_percent;
  real_T engine_N1_2_percent;
  real_T engine_N1_3_percent;
  real_T engine_N1_4_percent;
  real_T corrected_engine_N1_1_percent;
  real_T corrected_engine_N1_2_percent;
  real_T corrected_engine_N1_3_percent;
  real_T corrected_engine_N1_4_percent;
  real_T TAT_degC;
  real_T OAT_degC;
  real_T ambient_density_kg_per_m3;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_athr_input_
#define DEFINED_TYPEDEF_FOR_athr_input_

struct athr_input
{
  boolean_T ATHR_push;
  boolean_T ATHR_disconnect;
  real_T TLA_1_deg;
  real_T TLA_2_deg;
  real_T TLA_3_deg;
  real_T TLA_4_deg;
  real_T V_c_kn;
  real_T V_LS_kn;
  real_T V_MAX_kn;
  real_T thrust_limit_REV_percent;
  real_T thrust_limit_IDLE_percent;
  real_T thrust_limit_CLB_percent;
  real_T thrust_limit_MCT_percent;
  real_T thrust_limit_FLEX_percent;
  real_T thrust_limit_TOGA_percent;
  real_T flex_temperature_degC;
  real_T mode_requested;
  boolean_T is_mach_mode_active;
  boolean_T alpha_floor_condition;
  boolean_T is_approach_mode_active;
  boolean_T is_SRS_TO_mode_active;
  boolean_T is_SRS_GA_mode_active;
  boolean_T is_LAND_mode_active;
  real_T thrust_reduction_altitude;
  real_T thrust_reduction_altitude_go_around;
  real_T flight_phase;
  boolean_T is_alt_soft_mode_active;
  boolean_T is_anti_ice_wing_active;
  boolean_T is_anti_ice_engine_1_active;
  boolean_T is_anti_ice_engine_2_active;
  boolean_T is_anti_ice_engine_3_active;
  boolean_T is_anti_ice_engine_4_active;
  boolean_T is_air_conditioning_1_active;
  boolean_T is_air_conditioning_2_active;
  boolean_T FD_active;
  boolean_T ATHR_reset_disable;
  boolean_T is_TCAS_active;
  real_T target_TCAS_RA_rate_fpm;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_athr_in_
#define DEFINED_TYPEDEF_FOR_athr_in_

struct athr_in
{
  athr_time time;
  athr_raw_data data;
  athr_input input;
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

#ifndef DEFINED_TYPEDEF_FOR_athr_mode_message_
#define DEFINED_TYPEDEF_FOR_athr_mode_message_

enum class athr_mode_message
  : int32_T {
  NONE = 0,
  THR_LK,
  LVR_TOGA,
  LVR_CLB,
  LVR_MCT,
  LVR_ASYM
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_athr_data_computed_
#define DEFINED_TYPEDEF_FOR_athr_data_computed_

struct athr_data_computed
{
  boolean_T TLA_in_active_range;
  boolean_T is_FLX_active;
  boolean_T ATHR_push;
  boolean_T ATHR_disabled;
  real_T time_since_touchdown;
  boolean_T alpha_floor_inhibited;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_athr_output_
#define DEFINED_TYPEDEF_FOR_athr_output_

struct athr_output
{
  real_T sim_throttle_lever_1_pos;
  real_T sim_throttle_lever_2_pos;
  real_T sim_throttle_lever_3_pos;
  real_T sim_throttle_lever_4_pos;
  real_T sim_thrust_mode_1;
  real_T sim_thrust_mode_2;
  real_T sim_thrust_mode_3;
  real_T sim_thrust_mode_4;
  real_T N1_TLA_1_percent;
  real_T N1_TLA_2_percent;
  real_T N1_TLA_3_percent;
  real_T N1_TLA_4_percent;
  boolean_T is_in_reverse_1;
  boolean_T is_in_reverse_2;
  boolean_T is_in_reverse_3;
  boolean_T is_in_reverse_4;
  athr_thrust_limit_type thrust_limit_type;
  real_T thrust_limit_percent;
  real_T N1_c_1_percent;
  real_T N1_c_2_percent;
  real_T N1_c_3_percent;
  real_T N1_c_4_percent;
  athr_status status;
  athr_mode mode;
  athr_mode_message mode_message;
  boolean_T thrust_lever_warning_flex;
  boolean_T thrust_lever_warning_toga;
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
  athr_output output;
};

#endif
#endif

