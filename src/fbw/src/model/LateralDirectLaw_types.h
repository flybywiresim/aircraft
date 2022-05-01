#ifndef RTW_HEADER_LateralDirectLaw_types_h_
#define RTW_HEADER_LateralDirectLaw_types_h_
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

#ifndef DEFINED_TYPEDEF_FOR_lateral_direct_input_
#define DEFINED_TYPEDEF_FOR_lateral_direct_input_

struct lateral_direct_input
{
  base_time time;
  real_T delta_xi_pos;
  boolean_T tracking_mode_on;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_roll_output_
#define DEFINED_TYPEDEF_FOR_base_roll_output_

struct base_roll_output
{
  real_T xi_deg;
  real_T zeta_deg;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_lateral_direct_output_
#define DEFINED_TYPEDEF_FOR_lateral_direct_output_

struct lateral_direct_output
{
  lateral_direct_input input;
  base_roll_output output;
};

#endif
#endif

