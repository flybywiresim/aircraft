#ifndef RTW_HEADER_FlyByWire_types_h_
#define RTW_HEADER_FlyByWire_types_h_
#include "rtwtypes.h"
#ifndef DEFINED_TYPEDEF_FOR_base_raw_time_
#define DEFINED_TYPEDEF_FOR_base_raw_time_

typedef struct {
  real_T dt;
} base_raw_time;

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_raw_data_
#define DEFINED_TYPEDEF_FOR_base_raw_data_

typedef struct {
  real_T nz_g;
  real_T Theta_deg;
  real_T Phi_deg;
  real_T q_rad_s;
  real_T r_rad_s;
  real_T p_rad_s;
  real_T q_dot_rad_s2;
  real_T r_dot_rad_s2;
  real_T p_dot_rad_s2;
  real_T eta_pos;
  real_T eta_trim_deg;
  real_T xi_pos;
  real_T zeta_pos;
  real_T zeta_trim_pos;
  real_T alpha_deg;
  real_T beta_deg;
  real_T beta_dot_deg_s;
  real_T V_ias_kn;
  real_T V_tas_kn;
  real_T V_mach;
  real_T H_ft;
  real_T H_ind_ft;
  real_T H_radio_ft;
  real_T CG_percent_MAC;
  real_T gear_animation_pos_0;
  real_T gear_animation_pos_1;
  real_T gear_animation_pos_2;
  real_T flaps_handle_index;
  real_T autopilot_master_on;
  real_T slew_on;
  real_T pause_on;
} base_raw_data;

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_input_
#define DEFINED_TYPEDEF_FOR_base_input_

typedef struct {
  real_T delta_eta_pos;
  real_T delta_xi_pos;
  real_T delta_zeta_pos;
} base_input;

#endif

#ifndef DEFINED_TYPEDEF_FOR_fbw_input_
#define DEFINED_TYPEDEF_FOR_fbw_input_

typedef struct {
  base_raw_time time;
  base_raw_data data;
  base_input input;
} fbw_input;

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_raw_output_
#define DEFINED_TYPEDEF_FOR_base_raw_output_

typedef struct {
  real_T eta_pos;
  real_T eta_trim_deg;
  boolean_T eta_trim_deg_should_write;
  real_T xi_pos;
  real_T zeta_pos;
  real_T zeta_trim_pos;
} base_raw_output;

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_raw_
#define DEFINED_TYPEDEF_FOR_base_raw_

typedef struct {
  base_raw_time time;
  base_raw_data data;
  base_input input;
  base_raw_output output;
} base_raw;

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_time_
#define DEFINED_TYPEDEF_FOR_base_time_

typedef struct {
  real_T dt;
  real_T monotonic_time;
} base_time;

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_data_
#define DEFINED_TYPEDEF_FOR_base_data_

typedef struct {
  real_T nz_g;
  real_T Theta_deg;
  real_T Phi_deg;
  real_T q_deg_s;
  real_T r_deg_s;
  real_T p_deg_s;
  real_T qk_deg_s;
  real_T rk_deg_s;
  real_T pk_deg_s;
  real_T qk_dot_deg_s2;
  real_T rk_dot_deg_s2;
  real_T pk_dot_deg_s2;
  real_T eta_deg;
  real_T eta_trim_deg;
  real_T xi_deg;
  real_T zeta_deg;
  real_T zeta_trim_deg;
  real_T alpha_deg;
  real_T beta_deg;
  real_T beta_dot_deg_s;
  real_T V_ias_kn;
  real_T V_tas_kn;
  real_T V_mach;
  real_T H_ft;
  real_T H_ind_ft;
  real_T H_radio_ft;
  real_T CG_percent_MAC;
  real_T gear_strut_compression_0;
  real_T gear_strut_compression_1;
  real_T gear_strut_compression_2;
  real_T flaps_handle_index;
  real_T autopilot_master_on;
  real_T slew_on;
  real_T pause_on;
} base_data;

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_data_computed_
#define DEFINED_TYPEDEF_FOR_base_data_computed_

typedef struct {
  real_T on_ground;
  real_T tracking_mode_on;
} base_data_computed;

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_sim_
#define DEFINED_TYPEDEF_FOR_base_sim_

typedef struct {
  base_raw raw;
  base_time time;
  base_data data;
  base_data_computed data_computed;
  base_input input;
} base_sim;

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_pitch_data_computed_
#define DEFINED_TYPEDEF_FOR_base_pitch_data_computed_

typedef struct {
  real_T delta_eta_deg;
  real_T in_flight;
  real_T in_flare;
  real_T in_flight_gain;
  real_T nz_limit_up_g;
  real_T nz_limit_lo_g;
  boolean_T eta_trim_deg_should_freeze;
  boolean_T eta_trim_deg_reset;
  real_T eta_trim_deg_reset_deg;
  boolean_T eta_trim_deg_should_write;
  real_T eta_trim_deg_rate_limit_up_deg_s;
  real_T eta_trim_deg_rate_limit_lo_deg_s;
  real_T flare_Theta_deg;
  real_T flare_Theta_c_deg;
  real_T flare_Theta_c_rate_deg_s;
} base_pitch_data_computed;

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_pitch_normal_
#define DEFINED_TYPEDEF_FOR_base_pitch_normal_

typedef struct {
  real_T nz_c_g;
  real_T Cstar_g;
  real_T eta_dot_deg_s;
} base_pitch_normal;

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_pitch_law_output_
#define DEFINED_TYPEDEF_FOR_base_pitch_law_output_

typedef struct {
  real_T eta_dot_deg_s;
} base_pitch_law_output;

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_pitch_integrated_
#define DEFINED_TYPEDEF_FOR_base_pitch_integrated_

typedef struct {
  real_T eta_deg;
} base_pitch_integrated;

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_pitch_output_
#define DEFINED_TYPEDEF_FOR_base_pitch_output_

typedef struct {
  real_T eta_deg;
  real_T eta_trim_deg;
} base_pitch_output;

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_pitch_
#define DEFINED_TYPEDEF_FOR_base_pitch_

typedef struct {
  base_pitch_data_computed data_computed;
  base_pitch_normal law_normal;
  base_pitch_law_output vote;
  base_pitch_integrated integrated;
  base_pitch_output output;
} base_pitch;

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_roll_data_computed_
#define DEFINED_TYPEDEF_FOR_base_roll_data_computed_

typedef struct {
  real_T delta_xi_deg;
  real_T delta_zeta_deg;
  real_T in_flight;
  real_T in_flight_gain;
} base_roll_data_computed;

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_roll_normal_
#define DEFINED_TYPEDEF_FOR_base_roll_normal_

typedef struct {
  real_T pk_c_deg_s;
  real_T Phi_c_deg;
  real_T xi_deg;
  real_T zeta_deg;
} base_roll_normal;

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_roll_output_
#define DEFINED_TYPEDEF_FOR_base_roll_output_

typedef struct {
  real_T xi_deg;
  real_T zeta_deg;
} base_roll_output;

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_roll_
#define DEFINED_TYPEDEF_FOR_base_roll_

typedef struct {
  base_roll_data_computed data_computed;
  base_roll_normal law_normal;
  base_roll_output output;
} base_roll;

#endif

#ifndef DEFINED_TYPEDEF_FOR_fbw_output_
#define DEFINED_TYPEDEF_FOR_fbw_output_

typedef struct {
  base_sim sim;
  base_pitch pitch;
  base_roll roll;
} fbw_output;

#endif

typedef struct Parameters_FlyByWire_T_ Parameters_FlyByWire_T;

#endif

