#pragma once

#include <MSFS/Legacy/gauges.h>
#include <SimConnect.h>

struct SimData {
  double nz_g;
  double Theta_deg;
  double Phi_deg;
  SIMCONNECT_DATA_XYZ bodyRotationVelocity;
  SIMCONNECT_DATA_XYZ bodyRotationAcceleration;
  double bx_m_s2;
  double by_m_s2;
  double bz_m_s2;
  double Psi_magnetic_deg;
  double Psi_true_deg;
  double Psi_magnetic_track_deg;
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
  double V_gnd_kn;
  double H_ft;
  double H_ind_ft;
  double H_radio_ft;
  double H_dot_fpm;
  double CG_percent_MAC;
  double total_weight_kg;
  double gear_animation_pos_0;
  double gear_animation_pos_1;
  double gear_animation_pos_2;
  double spoilers_handle_position;
  double spoilers_left_pos;
  double spoilers_right_pos;
  unsigned long long slew_on;
  unsigned long long autopilot_master_on;
  unsigned long long ap_fd_1_active;
  unsigned long long ap_fd_2_active;
  double ap_V_c_kn;
  double ap_H_c_ft;
  double simulationTime;
  double simulation_rate;
  double ice_structure_percent;
  double linear_cl_alpha_per_deg;
  double alpha_stall_deg;
  double alpha_zero_lift_deg;
  double ambient_density_kg_per_m3;
  double ambient_pressure_mbar;
  double ambient_temperature_celsius;
  double ambient_wind_x_kn;
  double ambient_wind_y_kn;
  double ambient_wind_z_kn;
  double ambient_wind_velocity_kn;
  double ambient_wind_direction_deg;
  double total_air_temperature_celsius;
  double latitude_deg;
  double longitude_deg;
  double throttle_lever_1_pos;
  double throttle_lever_2_pos;
  double engine_1_thrust_lbf;
  double engine_2_thrust_lbf;
  unsigned long long nav_valid;
  double nav_loc_deg;
  double nav_gs_deg;
  unsigned long long nav_dme_valid;
  double nav_dme_nmi;
  unsigned long long nav_loc_valid;
  double nav_loc_error_deg;
  unsigned long long nav_gs_valid;
  double nav_gs_error_deg;
  unsigned long long isAutoThrottleActive;
  double engine_n1_1;
  double engine_n1_2;
  unsigned long long gpsIsFlightPlanActive;
  double gpsWpCrossTrack;
  double gpsWpTrackAngleError;
  double gpsCourseToSteer;
  double commanded_engine_N1_1_percent;
  double commanded_engine_N1_2_percent;
  double engine_N1_1_percent;
  double engine_N1_2_percent;
  double corrected_engine_N1_1_percent;
  double corrected_engine_N1_2_percent;
  double engineEngineOilTemperature_1;
  double engineEngineOilTemperature_2;
  double engineEngineOilPressure_1;
  double engineEngineOilPressure_2;
  unsigned long long engine_combustion_1;
  unsigned long long engine_combustion_2;
  unsigned long long is_mach_mode_active;
  unsigned long long speed_slot_index;
  unsigned long long engineAntiIce_1;
  unsigned long long engineAntiIce_2;
  unsigned long long simOnGround;
  double kohlsmanSetting_1;
  double kohlsmanSetting_2;
  /// @deprecated Should use ADR pressure altitude
  unsigned long long kohlsmanSettingStd_4;
  double cameraState;
  double altitude_m;
  double nav_loc_magvar_deg;
  SIMCONNECT_DATA_LATLONALT nav_loc_pos;
  SIMCONNECT_DATA_LATLONALT nav_gs_pos;
  double brakeLeftPosition;
  double brakeRightPosition;
  double flapsHandleIndex;
  double gearHandlePosition;
  unsigned long long assistanceTakeoffEnabled;
  unsigned long long assistanceLandingEnabled;
  unsigned long long aiAutoTrimActive;
  unsigned long long aiControlsActive;
  double wheelRpmLeft;
  double wheelRpmRight;
  double seaLevelPressure;
};

struct SimInput {
  double inputs[3];
};

struct SimInputRudderTrim {
  bool rudderTrimSwitchLeft;
  bool rudderTrimSwitchRight;
  bool rudderTrimReset;
};

struct SimInputAutopilot {
  double AP_engage;
  double AP_1_push;
  double AP_2_push;
  double AP_disconnect;
  double HDG_push;
  double HDG_pull;
  double ALT_push;
  double ALT_pull;
  double VS_push;
  double VS_pull;
  double LOC_push;
  double APPR_push;
  double EXPED_push;
  double DIR_TO_trigger;
  double mach_mode_activate;
  double spd_mode_activate;
  double preset_spd_activate;
  double baro_left_set;
  double baro_right_set;
  double SPD_MACH_set;
  double HDG_TRK_set;
  double ALT_set;
  double VS_FPA_set;
};

struct SimInputThrottles {
  double ATHR_push;
  double ATHR_disconnect;
  double ATHR_reset_disable;
};

struct SimOutputZetaTrim {
  double zeta_trim_pos;
};

// GENERAL ENG THROTTLE MANAGED MODE:<1|2>
// UNKNOWN  = 0
// REVERSE  = 1
// IDLE     = 2
// AUTO     = 3
// CLIMB    = 4
// FLEX_MCT = 5
// TOGA     = 6
// HOLD     = 7
struct SimOutputThrottles {
  double throttleLeverPosition_1;
  double throttleLeverPosition_2;
  double throttleManagedMode_1;
  double throttleManagedMode_2;
};

struct SimOutputFlaps {
  double flapsHandleIndex;
};

struct SimOutputSpoilers {
  double spoilersHandlePosition;
};

struct SimOutputAltimeter {
  unsigned long long kohlsmanSettingStd;
};
