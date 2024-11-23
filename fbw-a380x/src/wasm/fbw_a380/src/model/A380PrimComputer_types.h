#ifndef A380PrimComputer_types_h_
#define A380PrimComputer_types_h_
#include "rtwtypes.h"
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

#ifndef DEFINED_TYPEDEF_FOR_base_prim_discrete_inputs_
#define DEFINED_TYPEDEF_FOR_base_prim_discrete_inputs_

struct base_prim_discrete_inputs
{
  boolean_T prim_overhead_button_pressed;
  boolean_T is_unit_1;
  boolean_T is_unit_2;
  boolean_T is_unit_3;
  boolean_T capt_priority_takeover_pressed;
  boolean_T fo_priority_takeover_pressed;
  boolean_T ap_1_pushbutton_pressed;
  boolean_T ap_2_pushbutton_pressed;
  boolean_T fcu_healthy;
  boolean_T athr_pushbutton;
  boolean_T ir_3_on_capt;
  boolean_T ir_3_on_fo;
  boolean_T adr_3_on_capt;
  boolean_T adr_3_on_fo;
  boolean_T rat_deployed;
  boolean_T rat_contactor_closed;
  boolean_T pitch_trim_up_pressed;
  boolean_T pitch_trim_down_pressed;
  boolean_T green_low_pressure;
  boolean_T yellow_low_pressure;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_prim_pitch_surface_positions_
#define DEFINED_TYPEDEF_FOR_base_prim_pitch_surface_positions_

struct base_prim_pitch_surface_positions
{
  real_T left_inboard_elevator_deg;
  real_T right_inboard_elevator_deg;
  real_T left_outboard_elevator_deg;
  real_T right_outboard_elevator_deg;
  real_T ths_deg;
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

#ifndef DEFINED_TYPEDEF_FOR_base_prim_analog_inputs_
#define DEFINED_TYPEDEF_FOR_base_prim_analog_inputs_

struct base_prim_analog_inputs
{
  real_T capt_pitch_stick_pos;
  real_T fo_pitch_stick_pos;
  real_T capt_roll_stick_pos;
  real_T fo_roll_stick_pos;
  real_T speed_brake_lever_pos;
  real_T thr_lever_1_pos;
  real_T thr_lever_2_pos;
  real_T thr_lever_3_pos;
  real_T thr_lever_4_pos;
  real_T elevator_1_pos_deg;
  real_T elevator_2_pos_deg;
  real_T elevator_3_pos_deg;
  real_T ths_pos_deg;
  real_T left_aileron_1_pos_deg;
  real_T left_aileron_2_pos_deg;
  real_T right_aileron_1_pos_deg;
  real_T right_aileron_2_pos_deg;
  real_T left_spoiler_pos_deg;
  real_T right_spoiler_pos_deg;
  real_T rudder_1_pos_deg;
  real_T rudder_2_pos_deg;
  real_T rudder_pedal_pos;
  real_T yellow_hyd_pressure_psi;
  real_T green_hyd_pressure_psi;
  real_T vert_acc_1_g;
  real_T vert_acc_2_g;
  real_T vert_acc_3_g;
  real_T lat_acc_1_g;
  real_T lat_acc_2_g;
  real_T lat_acc_3_g;
  real_T left_body_wheel_speed;
  real_T left_wing_wheel_speed;
  real_T right_body_wheel_speed;
  real_T right_wing_wheel_speed;
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

#ifndef DEFINED_TYPEDEF_FOR_base_prim_bus_inputs_
#define DEFINED_TYPEDEF_FOR_base_prim_bus_inputs_

struct base_prim_bus_inputs
{
  base_adr_bus adr_1_bus;
  base_adr_bus adr_2_bus;
  base_adr_bus adr_3_bus;
  base_ir_bus ir_1_bus;
  base_ir_bus ir_2_bus;
  base_ir_bus ir_3_bus;
  real_T isis_1_bus;
  real_T isis_2_bus;
  real_T rate_gyro_pitch_1_bus;
  real_T rate_gyro_pitch_2_bus;
  real_T rate_gyro_roll_1_bus;
  real_T rate_gyro_roll_2_bus;
  real_T rate_gyro_yaw_1_bus;
  real_T rate_gyro_yaw_2_bus;
  base_ra_bus ra_1_bus;
  base_ra_bus ra_2_bus;
  base_sfcc_bus sfcc_1_bus;
  base_sfcc_bus sfcc_2_bus;
  base_lgciu_bus lgciu_1_bus;
  base_lgciu_bus lgciu_2_bus;
  real_T irdc_1_bus;
  real_T irdc_2_bus;
  real_T irdc_3_bus;
  real_T irdc_4_a_bus;
  real_T irdc_4_b_bus;
  real_T fcu_own_bus;
  real_T fcu_opp_bus;
  base_prim_out_bus prim_x_bus;
  base_prim_out_bus prim_y_bus;
  base_sec_out_bus sec_1_bus;
  base_sec_out_bus sec_2_bus;
  base_sec_out_bus sec_3_bus;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_prim_temporary_ap_input_
#define DEFINED_TYPEDEF_FOR_base_prim_temporary_ap_input_

struct base_prim_temporary_ap_input
{
  boolean_T ap_engaged;
  real_T roll_command;
  real_T pitch_command;
  real_T yaw_command;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_prim_inputs_
#define DEFINED_TYPEDEF_FOR_prim_inputs_

struct prim_inputs
{
  base_time time;
  base_sim_data sim_data;
  base_prim_discrete_inputs discrete_inputs;
  base_prim_analog_inputs analog_inputs;
  base_prim_bus_inputs bus_inputs;
  base_prim_temporary_ap_input temporary_ap_input;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_prim_lateral_surface_positions_
#define DEFINED_TYPEDEF_FOR_base_prim_lateral_surface_positions_

struct base_prim_lateral_surface_positions
{
  real_T left_inboard_aileron_deg;
  real_T right_inboard_aileron_deg;
  real_T left_midboard_aileron_deg;
  real_T right_midboard_aileron_deg;
  real_T left_outboard_aileron_deg;
  real_T right_outboard_aileron_deg;
  real_T left_spoiler_1_deg;
  real_T right_spoiler_1_deg;
  real_T left_spoiler_2_deg;
  real_T right_spoiler_2_deg;
  real_T left_spoiler_3_deg;
  real_T right_spoiler_3_deg;
  real_T left_spoiler_4_deg;
  real_T right_spoiler_4_deg;
  real_T left_spoiler_5_deg;
  real_T right_spoiler_5_deg;
  real_T left_spoiler_6_deg;
  real_T right_spoiler_6_deg;
  real_T left_spoiler_7_deg;
  real_T right_spoiler_7_deg;
  real_T left_spoiler_8_deg;
  real_T right_spoiler_8_deg;
  real_T upper_rudder_deg;
  real_T lower_rudder_deg;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_prim_laws_outputs_
#define DEFINED_TYPEDEF_FOR_base_prim_laws_outputs_

struct base_prim_laws_outputs
{
  base_prim_lateral_surface_positions lateral_law_outputs;
  base_prim_pitch_surface_positions pitch_law_outputs;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_prim_surface_status_
#define DEFINED_TYPEDEF_FOR_base_prim_surface_status_

struct base_prim_surface_status
{
  boolean_T left_inboard_aileron_engaged;
  boolean_T right_inboard_aileron_engaged;
  boolean_T left_midboard_aileron_engaged;
  boolean_T right_midboard_aileron_engaged;
  boolean_T left_outboard_aileron_engaged;
  boolean_T right_outboard_aileron_engaged;
  boolean_T spoiler_pair_1_engaged;
  boolean_T spoiler_pair_2_engaged;
  boolean_T spoiler_pair_3_engaged;
  boolean_T spoiler_pair_4_engaged;
  boolean_T spoiler_pair_5_engaged;
  boolean_T spoiler_pair_6_engaged;
  boolean_T spoiler_pair_7_engaged;
  boolean_T spoiler_pair_8_engaged;
  boolean_T left_inboard_elevator_engaged;
  boolean_T right_inboard_elevator_engaged;
  boolean_T left_outboard_elevator_engaged;
  boolean_T right_outboard_elevator_engaged;
  boolean_T ths_engaged;
  boolean_T upper_rudder_engaged;
  boolean_T lower_rudder_engaged;
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

#ifndef DEFINED_TYPEDEF_FOR_base_prim_logic_outputs_
#define DEFINED_TYPEDEF_FOR_base_prim_logic_outputs_

struct base_prim_logic_outputs
{
  boolean_T on_ground;
  boolean_T tracking_mode_on;
  base_prim_surface_status surface_statuses;
  base_prim_lateral_surface_positions lateral_surface_positions;
  base_prim_pitch_surface_positions pitch_surface_positions;
  a380_lateral_efcs_law lateral_law_capability;
  a380_lateral_efcs_law active_lateral_law;
  a380_pitch_efcs_law pitch_law_capability;
  a380_pitch_efcs_law active_pitch_law;
  boolean_T abnormal_condition_law_active;
  boolean_T is_master_prim;
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
  boolean_T left_spoiler_hydraulic_mode_avail;
  boolean_T left_spoiler_electric_mode_avail;
  boolean_T left_spoiler_hydraulic_mode_engaged;
  boolean_T left_spoiler_electric_mode_engaged;
  boolean_T right_spoiler_hydraulic_mode_avail;
  boolean_T right_spoiler_electric_mode_avail;
  boolean_T right_spoiler_hydraulic_mode_engaged;
  boolean_T right_spoiler_electric_mode_engaged;
  boolean_T rudder_1_hydraulic_mode_avail;
  boolean_T rudder_1_electric_mode_avail;
  boolean_T rudder_1_hydraulic_mode_engaged;
  boolean_T rudder_1_electric_mode_engaged;
  boolean_T rudder_2_hydraulic_mode_avail;
  boolean_T rudder_2_electric_mode_avail;
  boolean_T rudder_2_hydraulic_mode_engaged;
  boolean_T rudder_2_electric_mode_engaged;
  boolean_T aileron_droop_active;
  boolean_T aileron_antidroop_active;
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
  boolean_T speed_brake_inhibited;
  boolean_T ground_spoilers_armed;
  boolean_T ground_spoilers_out;
  boolean_T phased_lift_dumping_active;
  boolean_T spoiler_lift_active;
  boolean_T ap_authorised;
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
  boolean_T all_sfcc_lost;
  real_T flap_handle_index;
  real_T flap_angle_deg;
  real_T slat_angle_deg;
  real_T slat_flap_actual_pos;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_prim_discrete_outputs_
#define DEFINED_TYPEDEF_FOR_base_prim_discrete_outputs_

struct base_prim_discrete_outputs
{
  boolean_T elevator_1_active_mode;
  boolean_T elevator_2_active_mode;
  boolean_T elevator_3_active_mode;
  boolean_T ths_active_mode;
  boolean_T left_aileron_1_active_mode;
  boolean_T left_aileron_2_active_mode;
  boolean_T right_aileron_1_active_mode;
  boolean_T right_aileron_2_active_mode;
  boolean_T left_spoiler_electronic_module_enable;
  boolean_T right_spoiler_electronic_module_enable;
  boolean_T rudder_1_hydraulic_active_mode;
  boolean_T rudder_1_electric_active_mode;
  boolean_T rudder_2_hydraulic_active_mode;
  boolean_T rudder_2_electric_active_mode;
  boolean_T prim_healthy;
  boolean_T fcu_own_select;
  boolean_T fcu_opp_select;
  boolean_T reverser_tertiary_lock;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_prim_analog_outputs_
#define DEFINED_TYPEDEF_FOR_base_prim_analog_outputs_

struct base_prim_analog_outputs
{
  real_T elevator_1_pos_order_deg;
  real_T elevator_2_pos_order_deg;
  real_T elevator_3_pos_order_deg;
  real_T ths_pos_order_deg;
  real_T left_aileron_1_pos_order_deg;
  real_T left_aileron_2_pos_order_deg;
  real_T right_aileron_1_pos_order_deg;
  real_T right_aileron_2_pos_order_deg;
  real_T left_spoiler_pos_order_deg;
  real_T right_spoiler_pos_order_deg;
  real_T rudder_1_pos_order_deg;
  real_T rudder_2_pos_order_deg;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_prim_outputs_
#define DEFINED_TYPEDEF_FOR_prim_outputs_

struct prim_outputs
{
  prim_inputs data;
  base_prim_laws_outputs laws;
  base_prim_logic_outputs logic;
  base_prim_discrete_outputs discrete_outputs;
  base_prim_analog_outputs analog_outputs;
  base_prim_out_bus bus_outputs;
};

#endif
#endif

