#ifndef RTW_HEADER_PitchAlternateLaw_types_h_
#define RTW_HEADER_PitchAlternateLaw_types_h_
#include "rtwtypes.h"

#ifndef DEFINED_TYPEDEF_FOR_base_time_
#define DEFINED_TYPEDEF_FOR_base_time_

struct base_time
{
  real_T dt;
  real_T simulation_time;
  real_T monotonic_time;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_pitch_alternate_input_
#define DEFINED_TYPEDEF_FOR_pitch_alternate_input_

struct pitch_alternate_input
{
  base_time time;
  real_T nz_g;
  real_T Theta_deg;
  real_T Phi_deg;
  real_T qk_deg_s;
  real_T eta_deg;
  real_T eta_trim_deg;
  real_T V_ias_kn;
  real_T mach;
  real_T V_tas_kn;
  real_T CG_percent_MAC;
  real_T total_weight_kg;
  real_T flaps_handle_index;
  real_T spoilers_left_pos;
  real_T spoilers_right_pos;
  real_T delta_eta_pos;
  boolean_T on_ground;
  real_T in_flight;
  boolean_T tracking_mode_on;
  boolean_T stabilities_available;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_pitch_alternate_data_computed_
#define DEFINED_TYPEDEF_FOR_base_pitch_alternate_data_computed_

struct base_pitch_alternate_data_computed
{
  real_T eta_trim_deg_limit_lo;
  real_T eta_trim_deg_limit_up;
  real_T delta_eta_deg;
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

#ifndef DEFINED_TYPEDEF_FOR_pitch_alternate_output_
#define DEFINED_TYPEDEF_FOR_pitch_alternate_output_

struct pitch_alternate_output
{
  pitch_alternate_input input;
  base_pitch_alternate_data_computed data_computed;
  base_pitch_normal law_normal;
  base_pitch_law_output vote;
  base_pitch_integrated integrated;
  base_pitch_output output;
};

#endif
#endif

