#ifndef RTW_HEADER_PitchDirectLaw_types_h_
#define RTW_HEADER_PitchDirectLaw_types_h_
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

#ifndef DEFINED_TYPEDEF_FOR_pitch_direct_input_
#define DEFINED_TYPEDEF_FOR_pitch_direct_input_

struct pitch_direct_input
{
  base_time time;
  real_T eta_deg;
  real_T flaps_handle_index;
  real_T delta_eta_pos;
  boolean_T tracking_mode_on;
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

#ifndef DEFINED_TYPEDEF_FOR_pitch_direct_output_
#define DEFINED_TYPEDEF_FOR_pitch_direct_output_

struct pitch_direct_output
{
  pitch_direct_input input;
  base_pitch_output output;
};

#endif
#endif

