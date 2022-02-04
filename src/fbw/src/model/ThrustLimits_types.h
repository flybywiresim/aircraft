#ifndef RTW_HEADER_ThrustLimits_types_h_
#define RTW_HEADER_ThrustLimits_types_h_
#include "rtwtypes.h"

#ifndef DEFINED_TYPEDEF_FOR_thrust_limits_in_
#define DEFINED_TYPEDEF_FOR_thrust_limits_in_

struct thrust_limits_in
{
  real_T dt;
  real_T simulation_time_s;
  real_T H_ft;
  real_T V_mach;
  real_T TAT_degC;
  real_T OAT_degC;
  real_T ISA_degC;
  boolean_T is_anti_ice_wing_active;
  boolean_T is_anti_ice_engine_1_active;
  boolean_T is_anti_ice_engine_2_active;
  boolean_T is_air_conditioning_1_active;
  boolean_T is_air_conditioning_2_active;
  real_T thrust_limit_IDLE_percent;
  real_T flex_temperature_degC;
  boolean_T use_external_CLB_limit;
  real_T thrust_limit_CLB_percent;
  real_T thrust_limit_type;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_thrust_limits_out_
#define DEFINED_TYPEDEF_FOR_thrust_limits_out_

struct thrust_limits_out
{
  real_T thrust_limit_IDLE_percent;
  real_T thrust_limit_CLB_percent;
  real_T thrust_limit_FLEX_percent;
  real_T thrust_limit_MCT_percent;
  real_T thrust_limit_TOGA_percent;
};

#endif
#endif

