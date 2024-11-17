#ifndef FacComputer_types_h_
#define FacComputer_types_h_
#include "rtwtypes.h"
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

#ifndef DEFINED_TYPEDEF_FOR_base_fac_analog_outputs_
#define DEFINED_TYPEDEF_FOR_base_fac_analog_outputs_

struct base_fac_analog_outputs
{
  real_T yaw_damper_order_deg;
  real_T rudder_trim_order_deg;
  real_T rudder_travel_limit_order_deg;
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

#ifndef DEFINED_TYPEDEF_FOR_base_fac_discrete_outputs_
#define DEFINED_TYPEDEF_FOR_base_fac_discrete_outputs_

struct base_fac_discrete_outputs
{
  boolean_T fac_healthy;
  boolean_T yaw_damper_engaged;
  boolean_T rudder_trim_engaged;
  boolean_T rudder_travel_lim_engaged;
  boolean_T rudder_travel_lim_emergency_reset;
  boolean_T yaw_damper_avail_for_norm_law;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_fac_analog_inputs_
#define DEFINED_TYPEDEF_FOR_base_fac_analog_inputs_

struct base_fac_analog_inputs
{
  real_T yaw_damper_position_deg;
  real_T rudder_trim_position_deg;
  real_T rudder_travel_lim_position_deg;
  real_T left_spoiler_pos_deg;
  real_T right_spoiler_pos_deg;
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

#ifndef DEFINED_TYPEDEF_FOR_base_fac_discrete_inputs_
#define DEFINED_TYPEDEF_FOR_base_fac_discrete_inputs_

struct base_fac_discrete_inputs
{
  boolean_T ap_own_engaged;
  boolean_T ap_opp_engaged;
  boolean_T yaw_damper_opp_engaged;
  boolean_T rudder_trim_opp_engaged;
  boolean_T rudder_travel_lim_opp_engaged;
  boolean_T elac_1_healthy;
  boolean_T elac_2_healthy;
  boolean_T engine_1_stopped;
  boolean_T engine_2_stopped;
  boolean_T rudder_trim_switch_left;
  boolean_T rudder_trim_switch_right;
  boolean_T rudder_trim_reset_button;
  boolean_T fac_engaged_from_switch;
  boolean_T fac_opp_healthy;
  boolean_T is_unit_1;
  boolean_T rudder_trim_actuator_healthy;
  boolean_T rudder_travel_lim_actuator_healthy;
  boolean_T slats_extended;
  boolean_T nose_gear_pressed;
  boolean_T ir_3_switch;
  boolean_T adr_3_switch;
  boolean_T yaw_damper_has_hyd_press;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_adr_bus_
#define DEFINED_TYPEDEF_FOR_base_adr_bus_

struct base_adr_bus
{
  base_arinc_429 altitude_standard_ft;
  base_arinc_429 altitude_corrected_ft;
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

#ifndef DEFINED_TYPEDEF_FOR_base_elac_out_bus_
#define DEFINED_TYPEDEF_FOR_base_elac_out_bus_

struct base_elac_out_bus
{
  base_arinc_429 left_aileron_position_deg;
  base_arinc_429 right_aileron_position_deg;
  base_arinc_429 left_elevator_position_deg;
  base_arinc_429 right_elevator_position_deg;
  base_arinc_429 ths_position_deg;
  base_arinc_429 left_sidestick_pitch_command_deg;
  base_arinc_429 right_sidestick_pitch_command_deg;
  base_arinc_429 left_sidestick_roll_command_deg;
  base_arinc_429 right_sidestick_roll_command_deg;
  base_arinc_429 rudder_pedal_position_deg;
  base_arinc_429 aileron_command_deg;
  base_arinc_429 roll_spoiler_command_deg;
  base_arinc_429 yaw_damper_command_deg;
  base_arinc_429 elevator_double_pressurization_command_deg;
  base_arinc_429 speedbrake_extension_deg;
  base_arinc_429 discrete_status_word_1;
  base_arinc_429 discrete_status_word_2;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_fac_bus_inputs_
#define DEFINED_TYPEDEF_FOR_base_fac_bus_inputs_

struct base_fac_bus_inputs
{
  base_fac_bus fac_opp_bus;
  base_adr_bus adr_own_bus;
  base_adr_bus adr_opp_bus;
  base_adr_bus adr_3_bus;
  base_ir_bus ir_own_bus;
  base_ir_bus ir_opp_bus;
  base_ir_bus ir_3_bus;
  base_fmgc_b_bus fmgc_own_bus;
  base_fmgc_b_bus fmgc_opp_bus;
  base_sfcc_bus sfcc_own_bus;
  base_lgciu_bus lgciu_own_bus;
  base_elac_out_bus elac_1_bus;
  base_elac_out_bus elac_2_bus;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_fac_inputs_
#define DEFINED_TYPEDEF_FOR_fac_inputs_

struct fac_inputs
{
  base_time time;
  base_sim_data sim_data;
  base_fac_discrete_inputs discrete_inputs;
  base_fac_analog_inputs analog_inputs;
  base_fac_bus_inputs bus_inputs;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_fac_laws_outputs_
#define DEFINED_TYPEDEF_FOR_base_fac_laws_outputs_

struct base_fac_laws_outputs
{
  real_T yaw_damper_command_deg;
  real_T rudder_trim_command_deg;
  real_T rudder_travel_lim_command_deg;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_fac_adr_computation_data_
#define DEFINED_TYPEDEF_FOR_base_fac_adr_computation_data_

struct base_fac_adr_computation_data
{
  real_T V_ias_kn;
  real_T V_tas_kn;
  real_T mach;
  real_T alpha_deg;
  real_T p_s_c_hpa;
  real_T altitude_corrected_ft;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_fac_ir_computation_data_
#define DEFINED_TYPEDEF_FOR_base_fac_ir_computation_data_

struct base_fac_ir_computation_data
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

#ifndef DEFINED_TYPEDEF_FOR_base_fac_logic_outputs_
#define DEFINED_TYPEDEF_FOR_base_fac_logic_outputs_

struct base_fac_logic_outputs
{
  boolean_T lgciu_own_valid;
  boolean_T all_lgciu_lost;
  boolean_T left_main_gear_pressed;
  boolean_T right_main_gear_pressed;
  boolean_T main_gear_out;
  boolean_T sfcc_own_valid;
  boolean_T all_sfcc_lost;
  real32_T flap_handle_index;
  real32_T flap_angle_deg;
  real32_T slat_angle_deg;
  real32_T slat_flap_actual_pos;
  boolean_T on_ground;
  boolean_T tracking_mode_on;
  boolean_T double_self_detected_adr_failure;
  boolean_T double_self_detected_ir_failure;
  boolean_T double_not_self_detected_adr_failure;
  boolean_T double_not_self_detected_ir_failure;
  base_fac_adr_computation_data adr_computation_data;
  base_fac_ir_computation_data ir_computation_data;
  boolean_T yaw_damper_engaged;
  boolean_T yaw_damper_can_engage;
  boolean_T yaw_damper_has_priority;
  boolean_T rudder_trim_engaged;
  boolean_T rudder_trim_can_engage;
  boolean_T rudder_trim_has_priority;
  boolean_T rudder_travel_lim_engaged;
  boolean_T rudder_travel_lim_can_engage;
  boolean_T rudder_travel_lim_has_priority;
  boolean_T speed_scale_lost;
  boolean_T speed_scale_visible;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_fac_flight_envelope_outputs_
#define DEFINED_TYPEDEF_FOR_base_fac_flight_envelope_outputs_

struct base_fac_flight_envelope_outputs
{
  real_T estimated_beta_deg;
  real_T beta_target_deg;
  boolean_T beta_target_visible;
  boolean_T alpha_floor_condition;
  real_T alpha_filtered_deg;
  real_T computed_weight_lbs;
  real_T computed_cg_percent;
  real_T v_alpha_max_kn;
  real_T v_alpha_prot_kn;
  real_T v_stall_warn_kn;
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
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_fac_outputs_
#define DEFINED_TYPEDEF_FOR_fac_outputs_

struct fac_outputs
{
  fac_inputs data;
  base_fac_laws_outputs laws;
  base_fac_logic_outputs logic;
  base_fac_flight_envelope_outputs flight_envelope;
  base_fac_discrete_outputs discrete_outputs;
  base_fac_analog_outputs analog_outputs;
  base_fac_bus bus_outputs;
};

#endif
#endif

