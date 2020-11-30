#pragma once

#include <MSFS/Legacy/gauges.h>
#include <SimConnect.h>

struct SimData
{
  double nz_g;
  double Theta_deg;
  double Phi_deg;
  SIMCONNECT_DATA_XYZ bodyRotationVelocity;
  SIMCONNECT_DATA_XYZ bodyRotationAcceleration;
  double eta_pos;
  double eta_trim_deg;
  double xi_pos;
  double zeta_pos;
  double zeta_trim_pos;
  double alpha_deg;
  double beta_deg;
  double beta_dot_deg_s;
  double V_ias_kn;
  double V_tas_kn;
  double V_mach;
  double H_ft;
  double H_ind_ft;
  double H_radio_ft;
  double CG_percent_MAC;
  double geat_animation_pos_0;
  double geat_animation_pos_1;
  double geat_animation_pos_2;
  double flaps_handle_index;
  bool autopilot_master_on;
  bool slew_on;
};

struct SimInput
{
  double inputs[3];
};

struct SimInputThrottles
{
  double throttles[2];
};

struct SimOutput
{
  double eta;
  double xi;
  double zeta;
};

struct SimOutputEtaTrim
{
  double eta_trim_deg;
};

struct SimOutputThrottles
{
  double throttleLeverPosition_1;
  double throttleLeverPosition_2;
};
