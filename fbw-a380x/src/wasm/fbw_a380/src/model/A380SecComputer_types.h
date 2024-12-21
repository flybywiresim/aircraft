#ifndef A380SecComputer_types_h_
#define A380SecComputer_types_h_
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

#ifndef DEFINED_TYPEDEF_FOR_base_arinc_429_
#define DEFINED_TYPEDEF_FOR_base_arinc_429_

struct base_arinc_429
{
  uint32_T SSM;
  real32_T Data;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_prim_out_bus_
#define DEFINED_TYPEDEF_FOR_base_prim_out_bus_

struct base_prim_out_bus
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
  base_arinc_429 fctl_law_status_word;
  base_arinc_429 discrete_status_word_1;
  base_arinc_429 fe_status_word;
  base_arinc_429 fg_status_word;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_sec_discrete_inputs_
#define DEFINED_TYPEDEF_FOR_base_sec_discrete_inputs_

struct base_sec_discrete_inputs
{
  boolean_T sec_overhead_button_pressed;
  boolean_T is_unit_1;
  boolean_T is_unit_2;
  boolean_T is_unit_3;
  boolean_T capt_priority_takeover_pressed;
  boolean_T fo_priority_takeover_pressed;
  boolean_T rudder_trim_left_pressed;
  boolean_T rudder_trim_right_pressed;
  boolean_T rudder_trim_reset_pressed;
  boolean_T pitch_trim_up_pressed;
  boolean_T pitch_trim_down_pressed;
  boolean_T rat_deployed;
  boolean_T rat_contactor_closed;
  boolean_T green_low_pressure;
  boolean_T yellow_low_pressure;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_sec_analog_outputs_
#define DEFINED_TYPEDEF_FOR_base_sec_analog_outputs_

struct base_sec_analog_outputs
{
  real_T elevator_1_pos_order_deg;
  real_T elevator_2_pos_order_deg;
  real_T elevator_3_pos_order_deg;
  real_T ths_pos_order_deg;
  real_T left_aileron_1_pos_order_deg;
  real_T left_aileron_2_pos_order_deg;
  real_T right_aileron_1_pos_order_deg;
  real_T right_aileron_2_pos_order_deg;
  real_T left_spoiler_1_pos_order_deg;
  real_T right_spoiler_1_pos_order_deg;
  real_T left_spoiler_2_pos_order_deg;
  real_T right_spoiler_2_pos_order_deg;
  real_T rudder_1_pos_order_deg;
  real_T rudder_2_pos_order_deg;
  real_T rudder_trim_command_deg;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_sec_out_bus_
#define DEFINED_TYPEDEF_FOR_base_sec_out_bus_

struct base_sec_out_bus
{
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
  base_arinc_429 left_spoiler_1_position_deg;
  base_arinc_429 right_spoiler_1_position_deg;
  base_arinc_429 left_spoiler_2_position_deg;
  base_arinc_429 right_spoiler_2_position_deg;
  base_arinc_429 elevator_status_word;
  base_arinc_429 elevator_1_position_deg;
  base_arinc_429 elevator_2_position_deg;
  base_arinc_429 elevator_3_position_deg;
  base_arinc_429 ths_position_deg;
  base_arinc_429 rudder_status_word;
  base_arinc_429 rudder_1_position_deg;
  base_arinc_429 rudder_2_position_deg;
  base_arinc_429 rudder_trim_actual_pos_deg;
  base_arinc_429 fctl_law_status_word;
  base_arinc_429 misc_data_status_word;
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

#ifndef DEFINED_TYPEDEF_FOR_base_sec_analog_inputs_
#define DEFINED_TYPEDEF_FOR_base_sec_analog_inputs_

struct base_sec_analog_inputs
{
  real_T capt_pitch_stick_pos;
  real_T fo_pitch_stick_pos;
  real_T capt_roll_stick_pos;
  real_T fo_roll_stick_pos;
  real_T elevator_1_pos_deg;
  real_T elevator_2_pos_deg;
  real_T elevator_3_pos_deg;
  real_T ths_pos_deg;
  real_T left_aileron_1_pos_deg;
  real_T left_aileron_2_pos_deg;
  real_T right_aileron_1_pos_deg;
  real_T right_aileron_2_pos_deg;
  real_T left_spoiler_1_pos_deg;
  real_T right_spoiler_1_pos_deg;
  real_T left_spoiler_2_pos_deg;
  real_T right_spoiler_2_pos_deg;
  real_T rudder_1_pos_deg;
  real_T rudder_2_pos_deg;
  real_T rudder_pedal_pos_deg;
  real_T rudder_trim_actual_pos_deg;
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

#ifndef DEFINED_TYPEDEF_FOR_base_sec_bus_inputs_
#define DEFINED_TYPEDEF_FOR_base_sec_bus_inputs_

struct base_sec_bus_inputs
{
  base_adr_bus adr_1_bus;
  base_adr_bus adr_2_bus;
  base_ir_bus ir_1_bus;
  base_ir_bus ir_2_bus;
  base_sfcc_bus sfcc_1_bus;
  base_sfcc_bus sfcc_2_bus;
  base_lgciu_bus lgciu_1_bus;
  base_lgciu_bus lgciu_2_bus;
  real_T irdc_5_a_bus;
  real_T irdc_5_b_bus;
  base_prim_out_bus prim_1_bus;
  base_prim_out_bus prim_2_bus;
  base_prim_out_bus prim_3_bus;
  base_sec_out_bus sec_x_bus;
  base_sec_out_bus sec_y_bus;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_sec_inputs_
#define DEFINED_TYPEDEF_FOR_sec_inputs_

struct sec_inputs
{
  base_time time;
  base_sim_data sim_data;
  base_sec_discrete_inputs discrete_inputs;
  base_sec_analog_inputs analog_inputs;
  base_sec_bus_inputs bus_inputs;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_sec_lateral_surface_positions_
#define DEFINED_TYPEDEF_FOR_base_sec_lateral_surface_positions_

struct base_sec_lateral_surface_positions
{
  real_T left_aileron_1_command_deg;
  real_T right_aileron_1_command_deg;
  real_T left_aileron_2_command_deg;
  real_T right_aileron_2_command_deg;
  real_T left_spoiler_1_command_deg;
  real_T right_spoiler_1_command_deg;
  real_T left_spoiler_2_command_deg;
  real_T right_spoiler_2_command_deg;
  real_T rudder_1_command_deg;
  real_T rudder_2_command_deg;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_sec_pitch_surface_positions_
#define DEFINED_TYPEDEF_FOR_base_sec_pitch_surface_positions_

struct base_sec_pitch_surface_positions
{
  real_T elevator_1_command_deg;
  real_T elevator_2_command_deg;
  real_T elevator_3_command_deg;
  real_T ths_command_deg;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_sec_laws_outputs_
#define DEFINED_TYPEDEF_FOR_base_sec_laws_outputs_

struct base_sec_laws_outputs
{
  base_sec_lateral_surface_positions lateral_law_outputs;
  base_sec_pitch_surface_positions pitch_law_outputs;
  real_T rudder_trim_command_deg;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_a380_lateral_efcs_law_
#define DEFINED_TYPEDEF_FOR_a380_lateral_efcs_law_

enum class a380_lateral_efcs_law
  : int32_T {
  NormalLaw = 0,
  DirectLaw,
  None
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_a380_pitch_efcs_law_
#define DEFINED_TYPEDEF_FOR_a380_pitch_efcs_law_

enum class a380_pitch_efcs_law
  : int32_T {
  NormalLaw = 0,
  AlternateLaw1A,
  AlternateLaw1B,
  AlternateLaw1C,
  AlternateLaw2,
  DirectLaw,
  None
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

#ifndef DEFINED_TYPEDEF_FOR_base_sec_logic_outputs_
#define DEFINED_TYPEDEF_FOR_base_sec_logic_outputs_

struct base_sec_logic_outputs
{
  boolean_T on_ground;
  boolean_T tracking_mode_on;
  int8_T master_prim;
  a380_lateral_efcs_law active_lateral_law;
  a380_pitch_efcs_law active_pitch_law;
  boolean_T elevator_1_avail;
  boolean_T elevator_1_engaged;
  boolean_T elevator_2_avail;
  boolean_T elevator_2_engaged;
  boolean_T elevator_3_avail;
  boolean_T elevator_3_engaged;
  boolean_T ths_avail;
  boolean_T ths_engaged;
  boolean_T left_aileron_1_avail;
  boolean_T left_aileron_1_engaged;
  boolean_T left_aileron_2_avail;
  boolean_T left_aileron_2_engaged;
  boolean_T right_aileron_1_avail;
  boolean_T right_aileron_1_engaged;
  boolean_T right_aileron_2_avail;
  boolean_T right_aileron_2_engaged;
  boolean_T left_spoiler_1_hydraulic_mode_avail;
  boolean_T left_spoiler_1_hydraulic_mode_engaged;
  boolean_T right_spoiler_1_hydraulic_mode_avail;
  boolean_T right_spoiler_1_hydraulic_mode_engaged;
  boolean_T left_spoiler_2_hydraulic_mode_avail;
  boolean_T left_spoiler_2_hydraulic_mode_engaged;
  boolean_T right_spoiler_2_hydraulic_mode_avail;
  boolean_T right_spoiler_2_hydraulic_mode_engaged;
  boolean_T rudder_1_hydraulic_mode_avail;
  boolean_T rudder_1_electric_mode_avail;
  boolean_T rudder_1_hydraulic_mode_engaged;
  boolean_T rudder_1_electric_mode_engaged;
  boolean_T rudder_2_hydraulic_mode_avail;
  boolean_T rudder_2_electric_mode_avail;
  boolean_T rudder_2_hydraulic_mode_engaged;
  boolean_T rudder_2_electric_mode_engaged;
  boolean_T rudder_trim_avail;
  boolean_T rudder_trim_engaged;
  boolean_T aileron_droop_active;
  boolean_T ths_automatic_mode_active;
  real_T ths_manual_mode_c_deg_s;
  boolean_T is_yellow_hydraulic_power_avail;
  boolean_T is_green_hydraulic_power_avail;
  boolean_T eha_ebha_elec_mode_inhibited;
  boolean_T left_sidestick_disabled;
  boolean_T right_sidestick_disabled;
  boolean_T left_sidestick_priority_locked;
  boolean_T right_sidestick_priority_locked;
  real_T total_sidestick_pitch_command;
  real_T total_sidestick_roll_command;
  boolean_T phased_lift_dumping_active;
  boolean_T double_adr_failure;
  boolean_T cas_or_mach_disagree;
  boolean_T alpha_disagree;
  boolean_T double_ir_failure;
  boolean_T ir_failure_not_self_detected;
  base_elac_adr_computation_data adr_computation_data;
  base_elac_ir_computation_data ir_computation_data;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_sec_discrete_outputs_
#define DEFINED_TYPEDEF_FOR_base_sec_discrete_outputs_

struct base_sec_discrete_outputs
{
  boolean_T elevator_1_active_mode;
  boolean_T elevator_2_active_mode;
  boolean_T elevator_3_active_mode;
  boolean_T ths_active_mode;
  boolean_T left_aileron_1_active_mode;
  boolean_T left_aileron_2_active_mode;
  boolean_T right_aileron_1_active_mode;
  boolean_T right_aileron_2_active_mode;
  boolean_T rudder_1_hydraulic_active_mode;
  boolean_T rudder_1_electric_active_mode;
  boolean_T rudder_2_hydraulic_active_mode;
  boolean_T rudder_2_electric_active_mode;
  boolean_T rudder_trim_active_mode;
  boolean_T sec_healthy;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_sec_outputs_
#define DEFINED_TYPEDEF_FOR_sec_outputs_

struct sec_outputs
{
  sec_inputs data;
  base_sec_laws_outputs laws;
  base_sec_logic_outputs logic;
  base_sec_discrete_outputs discrete_outputs;
  base_sec_analog_outputs analog_outputs;
  base_sec_out_bus bus_outputs;
};

#endif
#endif

