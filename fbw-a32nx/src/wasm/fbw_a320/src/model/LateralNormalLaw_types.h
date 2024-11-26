#ifndef LateralNormalLaw_types_h_
#define LateralNormalLaw_types_h_
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

#ifndef DEFINED_TYPEDEF_FOR_lateral_normal_input_
#define DEFINED_TYPEDEF_FOR_lateral_normal_input_

struct lateral_normal_input
{
  base_time time;
  real_T Theta_deg;
  real_T Phi_deg;
  real_T r_deg_s;
  real_T pk_deg_s;
  real_T V_ias_kn;
  real_T V_tas_kn;
  real_T H_radio_ft;
  real_T delta_xi_pos;
  real_T delta_zeta_pos;
  boolean_T on_ground;
  boolean_T tracking_mode_on;
  boolean_T high_aoa_prot_active;
  boolean_T high_speed_prot_active;
  real_T ap_phi_c_deg;
  real_T ap_beta_c_deg;
  boolean_T any_ap_engaged;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_roll_data_computed_
#define DEFINED_TYPEDEF_FOR_base_roll_data_computed_

struct base_roll_data_computed
{
  real_T delta_xi_deg;
  real_T in_flight;
  real_T in_flight_gain;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_base_roll_normal_
#define DEFINED_TYPEDEF_FOR_base_roll_normal_

struct base_roll_normal
{
  real_T pk_c_deg_s;
  real_T Phi_c_deg;
  real_T xi_deg;
  real_T zeta_deg;
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

#ifndef DEFINED_TYPEDEF_FOR_lateral_normal_output_
#define DEFINED_TYPEDEF_FOR_lateral_normal_output_

struct lateral_normal_output
{
  lateral_normal_input input;
  base_roll_data_computed data_computed;
  base_roll_normal law_normal;
  base_roll_output output;
};

#endif
#endif

