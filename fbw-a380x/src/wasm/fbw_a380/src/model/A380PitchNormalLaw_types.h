#ifndef A380PitchNormalLaw_types_h_
#define A380PitchNormalLaw_types_h_
#include "rtwtypes.h"
#ifndef DEFINED_TYPEDEF_FOR_base_pitch_data_computed_
#define DEFINED_TYPEDEF_FOR_base_pitch_data_computed_

struct base_pitch_data_computed
{
  real_T eta_trim_deg_limit_lo;
  real_T eta_trim_deg_limit_up;
  real_T delta_eta_deg;
  real_T in_flight;
  real_T in_rotation;
  real_T in_flare;
  real_T in_flight_gain;
  real_T in_rotation_gain;
  real_T in_flare_gain;
  real_T nz_limit_up_g;
  real_T nz_limit_lo_g;
  boolean_T eta_trim_deg_should_freeze;
  boolean_T eta_trim_deg_reset;
  real_T eta_trim_deg_reset_deg;
  boolean_T eta_trim_deg_should_write;
  real_T eta_trim_deg_rate_limit_up_deg_s;
  real_T eta_trim_deg_rate_limit_lo_deg_s;
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

#ifndef DEFINED_TYPEDEF_FOR_pitch_normal_input_
#define DEFINED_TYPEDEF_FOR_pitch_normal_input_

struct pitch_normal_input
{
  base_time time;
  real_T nz_g;
  real_T Theta_deg;
  real_T Phi_deg;
  real_T qk_deg_s;
  real_T qk_dot_deg_s2;
  real_T eta_deg;
  real_T eta_trim_deg;
  real_T alpha_deg;
  real_T V_ias_kn;
  real_T V_tas_kn;
  real_T H_radio_ft;
  real_T CG_percent_MAC;
  real_T total_weight_kg;
  real_T flaps_handle_index;
  real_T spoilers_left_pos;
  real_T spoilers_right_pos;
  real_T thrust_lever_1_pos;
  real_T thrust_lever_2_pos;
  boolean_T tailstrike_protection_on;
  real_T VLS_kn;
  real_T delta_eta_pos;
  boolean_T on_ground;
  boolean_T tracking_mode_on;
  boolean_T high_aoa_prot_active;
  boolean_T high_speed_prot_active;
  real_T alpha_prot;
  real_T alpha_max;
  real_T high_speed_prot_high_kn;
  real_T high_speed_prot_low_kn;
  real_T ap_theta_c_deg;
  boolean_T any_ap_engaged;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_pitch_rotation_
#define DEFINED_TYPEDEF_FOR_base_pitch_rotation_

struct base_pitch_rotation
{
  real_T qk_c_deg_s;
  real_T eta_deg;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_pitch_normal_
#define DEFINED_TYPEDEF_FOR_base_pitch_normal_

struct base_pitch_normal
{
  real_T nz_c_g;
  real_T Cstar_g;
  real_T protection_alpha_c_deg;
  real_T protection_V_c_kn;
  real_T eta_dot_deg_s;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_pitch_flare_
#define DEFINED_TYPEDEF_FOR_base_pitch_flare_

struct base_pitch_flare
{
  real_T eta_deg;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_pitch_law_output_
#define DEFINED_TYPEDEF_FOR_base_pitch_law_output_

struct base_pitch_law_output
{
  real_T eta_dot_deg_s;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_pitch_integrated_
#define DEFINED_TYPEDEF_FOR_base_pitch_integrated_

struct base_pitch_integrated
{
  real_T eta_deg;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_pitch_output_
#define DEFINED_TYPEDEF_FOR_base_pitch_output_

struct base_pitch_output
{
  real_T eta_deg;
  real_T eta_trim_dot_deg_s;
  real_T eta_trim_limit_lo;
  real_T eta_trim_limit_up;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_pitch_normal_output_
#define DEFINED_TYPEDEF_FOR_pitch_normal_output_

struct pitch_normal_output
{
  pitch_normal_input input;
  base_pitch_data_computed data_computed;
  base_pitch_rotation law_rotation;
  base_pitch_normal law_normal;
  base_pitch_flare law_flare;
  base_pitch_law_output vote;
  base_pitch_integrated integrated;
  base_pitch_output output;
};

#endif
#endif

