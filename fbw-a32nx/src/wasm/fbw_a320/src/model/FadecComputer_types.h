#ifndef FadecComputer_types_h_
#define FadecComputer_types_h_
#include "rtwtypes.h"
#ifndef DEFINED_TYPEDEF_FOR_base_arinc_429_
#define DEFINED_TYPEDEF_FOR_base_arinc_429_

struct base_arinc_429
{
  uint32_T SSM;
  real32_T Data;
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

#ifndef DEFINED_TYPEDEF_FOR_athr_in_
#define DEFINED_TYPEDEF_FOR_athr_in_

struct athr_in
{
  athr_time time;
  athr_data data;
  athr_input input;
  base_fcu_bus fcu_input;
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
  base_fcu_bus fcu_input;
  athr_output output;
  base_ecu_bus fadec_bus_output;
};

#endif
#endif

