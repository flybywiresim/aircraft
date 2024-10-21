#ifndef FmgcOuterLoops_types_h_
#define FmgcOuterLoops_types_h_
#include "rtwtypes.h"
#ifndef DEFINED_TYPEDEF_FOR_ap_raw_output_command_
#define DEFINED_TYPEDEF_FOR_ap_raw_output_command_

struct ap_raw_output_command
{
  real_T Theta_c_deg;
  real_T Phi_c_deg;
  real_T Beta_c_deg;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_ap_raw_laws_flare_
#define DEFINED_TYPEDEF_FOR_ap_raw_laws_flare_

struct ap_raw_laws_flare
{
  boolean_T condition_Flare;
  real_T H_dot_radio_fpm;
  real_T H_dot_c_fpm;
  real_T delta_Theta_H_dot_deg;
  real_T delta_Theta_bz_deg;
  real_T delta_Theta_bx_deg;
  real_T delta_Theta_beta_c_deg;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_ap_raw_output_
#define DEFINED_TYPEDEF_FOR_ap_raw_output_

struct ap_raw_output
{
  real_T Phi_loc_c;
  real_T Nosewheel_c;
  ap_raw_output_command flight_director;
  ap_raw_output_command autopilot;
  ap_raw_laws_flare flare_law;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_ap_raw_time_
#define DEFINED_TYPEDEF_FOR_ap_raw_time_

struct ap_raw_time
{
  real_T dt;
  real_T simulation_time;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_ap_raw_data_
#define DEFINED_TYPEDEF_FOR_ap_raw_data_

struct ap_raw_data
{
  real_T Theta_deg;
  real_T Phi_deg;
  real_T qk_deg_s;
  real_T rk_deg_s;
  real_T pk_deg_s;
  real_T V_ias_kn;
  real_T V_tas_kn;
  real_T V_mach;
  real_T V_gnd_kn;
  real_T alpha_deg;
  real_T beta_deg;
  real_T H_ft;
  real_T H_ind_ft;
  real_T H_radio_ft;
  real_T H_dot_ft_min;
  real_T Psi_magnetic_deg;
  real_T Psi_magnetic_track_deg;
  real_T Psi_true_deg;
  real_T Chi_true_deg;
  real_T bx_m_s2;
  real_T by_m_s2;
  real_T bz_m_s2;
  real_T nav_loc_deg;
  real_T nav_gs_deg;
  real_T nav_dme_nmi;
  real_T nav_loc_magvar_deg;
  real_T nav_loc_error_deg;
  boolean_T nav_gs_valid;
  real_T nav_gs_error_deg;
  real_T fms_xtk_nmi;
  real_T fms_tae_deg;
  real_T fms_phi_deg;
  real_T fms_phi_limit_deg;
  real_T fms_H_c_profile_ft;
  real_T fms_H_dot_c_profile_ft_min;
  real_T VLS_kn;
  real_T VMAX_kn;
  boolean_T on_ground;
  real_T zeta_deg;
  real_T total_weight_kg;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_ap_raw_laws_input_
#define DEFINED_TYPEDEF_FOR_ap_raw_laws_input_

struct ap_raw_laws_input
{
  boolean_T ap_engaged;
  real_T lateral_law;
  real_T vertical_law;
  real_T Psi_c_deg;
  real_T Chi_c_deg;
  real_T H_c_ft;
  real_T H_dot_c_fpm;
  real_T FPA_c_deg;
  real_T V_c_kn;
  boolean_T ALT_soft_mode_active;
  boolean_T TCAS_mode_active;
  boolean_T FINAL_DES_mode_active;
  boolean_T GS_track_mode;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_ap_laws_output_
#define DEFINED_TYPEDEF_FOR_ap_laws_output_

struct ap_laws_output
{
  ap_raw_time time;
  ap_raw_data data;
  ap_raw_laws_input input;
  ap_raw_output output;
};

#endif

#ifndef DEFINED_TYPEDEF_FOR_lateral_law_
#define DEFINED_TYPEDEF_FOR_lateral_law_

enum class lateral_law
  : int32_T {
  NONE = 0,
  HDG,
  TRACK,
  HPATH,
  LOC_CPT,
  LOC_TRACK,
  ROLL_OUT
};

#endif
#endif

