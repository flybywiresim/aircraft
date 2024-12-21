#ifndef ElacComputer_types_h_
#define ElacComputer_types_h_
#include "rtwtypes.h"
#ifndef DEFINED_TYPEDEF_FOR_pitch_efcs_law_
#define DEFINED_TYPEDEF_FOR_pitch_efcs_law_

enum class pitch_efcs_law
  : int32_T {
  NormalLaw = 0,
  AlternateLaw1,
  AlternateLaw2,
  DirectLaw,
  None
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

#ifndef DEFINED_TYPEDEF_FOR_lateral_efcs_law_
#define DEFINED_TYPEDEF_FOR_lateral_efcs_law_

enum class lateral_efcs_law
  : int32_T {
  NormalLaw = 0,
  DirectLaw,
  None
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

#ifndef DEFINED_TYPEDEF_FOR_base_elac_discrete_inputs_
#define DEFINED_TYPEDEF_FOR_base_elac_discrete_inputs_

struct base_elac_discrete_inputs
{
  boolean_T ground_spoilers_active_1;
  boolean_T ground_spoilers_active_2;
  boolean_T is_unit_1;
  boolean_T is_unit_2;
  boolean_T opp_axis_pitch_failure;
  boolean_T ap_1_disengaged;
  boolean_T ap_2_disengaged;
  boolean_T opp_left_aileron_lost;
  boolean_T opp_right_aileron_lost;
  boolean_T fac_1_yaw_control_lost;
  boolean_T lgciu_1_nose_gear_pressed;
  boolean_T lgciu_2_nose_gear_pressed;
  boolean_T fac_2_yaw_control_lost;
  boolean_T lgciu_1_right_main_gear_pressed;
  boolean_T lgciu_2_right_main_gear_pressed;
  boolean_T lgciu_1_left_main_gear_pressed;
  boolean_T lgciu_2_left_main_gear_pressed;
  boolean_T ths_motor_fault;
  boolean_T sfcc_1_slats_out;
  boolean_T sfcc_2_slats_out;
  boolean_T l_ail_servo_failed;
  boolean_T l_elev_servo_failed;
  boolean_T r_ail_servo_failed;
  boolean_T r_elev_servo_failed;
  boolean_T ths_override_active;
  boolean_T yellow_low_pressure;
  boolean_T capt_priority_takeover_pressed;
  boolean_T fo_priority_takeover_pressed;
  boolean_T blue_low_pressure;
  boolean_T green_low_pressure;
  boolean_T elac_engaged_from_switch;
  boolean_T normal_powersupply_lost;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_elac_analog_inputs_
#define DEFINED_TYPEDEF_FOR_base_elac_analog_inputs_

struct base_elac_analog_inputs
{
  real_T capt_pitch_stick_pos;
  real_T fo_pitch_stick_pos;
  real_T capt_roll_stick_pos;
  real_T fo_roll_stick_pos;
  real_T left_elevator_pos_deg;
  real_T right_elevator_pos_deg;
  real_T ths_pos_deg;
  real_T left_aileron_pos_deg;
  real_T right_aileron_pos_deg;
  real_T rudder_pedal_pos;
  real_T load_factor_acc_1_g;
  real_T load_factor_acc_2_g;
  real_T blue_hyd_pressure_psi;
  real_T green_hyd_pressure_psi;
  real_T yellow_hyd_pressure_psi;
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

#ifndef DEFINED_TYPEDEF_FOR_base_fcdc_bus_
#define DEFINED_TYPEDEF_FOR_base_fcdc_bus_

struct base_fcdc_bus
{
  base_arinc_429 efcs_status_word_1;
  base_arinc_429 efcs_status_word_2;
  base_arinc_429 efcs_status_word_3;
  base_arinc_429 efcs_status_word_4;
  base_arinc_429 efcs_status_word_5;
  base_arinc_429 capt_roll_command_deg;
  base_arinc_429 fo_roll_command_deg;
  base_arinc_429 rudder_pedal_position_deg;
  base_arinc_429 capt_pitch_command_deg;
  base_arinc_429 fo_pitch_command_deg;
  base_arinc_429 aileron_left_pos_deg;
  base_arinc_429 elevator_left_pos_deg;
  base_arinc_429 aileron_right_pos_deg;
  base_arinc_429 elevator_right_pos_deg;
  base_arinc_429 horiz_stab_trim_pos_deg;
  base_arinc_429 spoiler_1_left_pos_deg;
  base_arinc_429 spoiler_2_left_pos_deg;
  base_arinc_429 spoiler_3_left_pos_deg;
  base_arinc_429 spoiler_4_left_pos_deg;
  base_arinc_429 spoiler_5_left_pos_deg;
  base_arinc_429 spoiler_1_right_pos_deg;
  base_arinc_429 spoiler_2_right_pos_deg;
  base_arinc_429 spoiler_3_right_pos_deg;
  base_arinc_429 spoiler_4_right_pos_deg;
  base_arinc_429 spoiler_5_right_pos_deg;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_sec_out_bus_
#define DEFINED_TYPEDEF_FOR_base_sec_out_bus_

struct base_sec_out_bus
{
  base_arinc_429 left_spoiler_1_position_deg;
  base_arinc_429 right_spoiler_1_position_deg;
  base_arinc_429 left_spoiler_2_position_deg;
  base_arinc_429 right_spoiler_2_position_deg;
  base_arinc_429 left_elevator_position_deg;
  base_arinc_429 right_elevator_position_deg;
  base_arinc_429 ths_position_deg;
  base_arinc_429 left_sidestick_pitch_command_deg;
  base_arinc_429 right_sidestick_pitch_command_deg;
  base_arinc_429 left_sidestick_roll_command_deg;
  base_arinc_429 right_sidestick_roll_command_deg;
  base_arinc_429 speed_brake_lever_command_deg;
  base_arinc_429 speed_brake_command_deg;
  base_arinc_429 thrust_lever_angle_1_deg;
  base_arinc_429 thrust_lever_angle_2_deg;
  base_arinc_429 discrete_status_word_1;
  base_arinc_429 discrete_status_word_2;
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

#ifndef DEFINED_TYPEDEF_FOR_base_elac_bus_inputs_
#define DEFINED_TYPEDEF_FOR_base_elac_bus_inputs_

struct base_elac_bus_inputs
{
  base_adr_bus adr_1_bus;
  base_adr_bus adr_2_bus;
  base_adr_bus adr_3_bus;
  base_ir_bus ir_1_bus;
  base_ir_bus ir_2_bus;
  base_ir_bus ir_3_bus;
  base_fmgc_b_bus fmgc_1_bus;
  base_fmgc_b_bus fmgc_2_bus;
  base_ra_bus ra_1_bus;
  base_ra_bus ra_2_bus;
  base_sfcc_bus sfcc_1_bus;
  base_sfcc_bus sfcc_2_bus;
  base_fcdc_bus fcdc_1_bus;
  base_fcdc_bus fcdc_2_bus;
  base_sec_out_bus sec_1_bus;
  base_sec_out_bus sec_2_bus;
  base_elac_out_bus elac_opp_bus;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_elac_inputs_
#define DEFINED_TYPEDEF_FOR_elac_inputs_

struct elac_inputs
{
  base_time time;
  base_sim_data sim_data;
  base_elac_discrete_inputs discrete_inputs;
  base_elac_analog_inputs analog_inputs;
  base_elac_bus_inputs bus_inputs;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_elac_lateral_law_outputs_
#define DEFINED_TYPEDEF_FOR_base_elac_lateral_law_outputs_

struct base_elac_lateral_law_outputs
{
  real_T left_aileron_command_deg;
  real_T right_aileron_command_deg;
  real_T roll_spoiler_command_deg;
  real_T yaw_damper_command_deg;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_elac_pitch_law_outputs_
#define DEFINED_TYPEDEF_FOR_base_elac_pitch_law_outputs_

struct base_elac_pitch_law_outputs
{
  real_T elevator_command_deg;
  real_T ths_command_deg;
  boolean_T elevator_double_pressurization_active;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_elac_laws_outputs_
#define DEFINED_TYPEDEF_FOR_base_elac_laws_outputs_

struct base_elac_laws_outputs
{
  base_elac_lateral_law_outputs lateral_law_outputs;
  base_elac_pitch_law_outputs pitch_law_outputs;
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

#ifndef DEFINED_TYPEDEF_FOR_base_elac_logic_outputs_
#define DEFINED_TYPEDEF_FOR_base_elac_logic_outputs_

struct base_elac_logic_outputs
{
  boolean_T on_ground;
  boolean_T pitch_law_in_flight;
  boolean_T tracking_mode_on;
  lateral_efcs_law lateral_law_capability;
  lateral_efcs_law active_lateral_law;
  pitch_efcs_law pitch_law_capability;
  pitch_efcs_law active_pitch_law;
  boolean_T abnormal_condition_law_active;
  boolean_T is_engaged_in_pitch;
  boolean_T can_engage_in_pitch;
  boolean_T has_priority_in_pitch;
  boolean_T left_elevator_avail;
  boolean_T right_elevator_avail;
  boolean_T ths_avail;
  boolean_T ths_active_commanded;
  boolean_T ths_ground_setting_active;
  boolean_T is_engaged_in_roll;
  boolean_T can_engage_in_roll;
  boolean_T has_priority_in_roll;
  boolean_T left_aileron_crosscommand_active;
  boolean_T right_aileron_crosscommand_active;
  boolean_T left_aileron_avail;
  boolean_T right_aileron_avail;
  boolean_T aileron_droop_active;
  boolean_T aileron_antidroop_active;
  boolean_T is_yellow_hydraulic_power_avail;
  boolean_T is_blue_hydraulic_power_avail;
  boolean_T is_green_hydraulic_power_avail;
  boolean_T left_sidestick_disabled;
  boolean_T right_sidestick_disabled;
  boolean_T left_sidestick_priority_locked;
  boolean_T right_sidestick_priority_locked;
  real_T total_sidestick_pitch_command;
  real_T total_sidestick_roll_command;
  boolean_T ap_authorised;
  boolean_T ap_1_control;
  boolean_T ap_2_control;
  boolean_T protection_ap_disconnect;
  boolean_T high_alpha_prot_active;
  real_T alpha_prot_deg;
  real_T alpha_max_deg;
  boolean_T high_speed_prot_active;
  real_T high_speed_prot_lo_thresh_kn;
  real_T high_speed_prot_hi_thresh_kn;
  boolean_T double_adr_failure;
  boolean_T triple_adr_failure;
  boolean_T cas_or_mach_disagree;
  boolean_T alpha_disagree;
  boolean_T double_ir_failure;
  boolean_T triple_ir_failure;
  boolean_T ir_failure_not_self_detected;
  base_elac_adr_computation_data adr_computation_data;
  base_elac_ir_computation_data ir_computation_data;
  real_T ra_computation_data_ft;
  boolean_T dual_ra_failure;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_elac_discrete_outputs_
#define DEFINED_TYPEDEF_FOR_base_elac_discrete_outputs_

struct base_elac_discrete_outputs
{
  boolean_T pitch_axis_ok;
  boolean_T left_aileron_ok;
  boolean_T right_aileron_ok;
  boolean_T digital_output_validated;
  boolean_T ap_1_authorised;
  boolean_T ap_2_authorised;
  boolean_T left_aileron_active_mode;
  boolean_T right_aileron_active_mode;
  boolean_T left_elevator_damping_mode;
  boolean_T right_elevator_damping_mode;
  boolean_T ths_active;
  boolean_T batt_power_supply;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_elac_analog_outputs_
#define DEFINED_TYPEDEF_FOR_base_elac_analog_outputs_

struct base_elac_analog_outputs
{
  real_T left_elev_pos_order_deg;
  real_T right_elev_pos_order_deg;
  real_T ths_pos_order;
  real_T left_aileron_pos_order;
  real_T right_aileron_pos_order;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_elac_outputs_
#define DEFINED_TYPEDEF_FOR_elac_outputs_

struct elac_outputs
{
  elac_inputs data;
  base_elac_laws_outputs laws;
  base_elac_logic_outputs logic;
  base_elac_discrete_outputs discrete_outputs;
  base_elac_analog_outputs analog_outputs;
  base_elac_out_bus bus_outputs;
};

#endif
#endif

