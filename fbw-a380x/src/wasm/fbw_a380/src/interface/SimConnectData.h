#pragma once

#include <MSFS/Legacy/gauges.h>
#include <SimConnect.h>
#include "FuelSystemData.h"

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
  double throttle_lever_3_pos;
  double throttle_lever_4_pos;
  double engine_1_thrust_lbf;
  double engine_2_thrust_lbf;
  double engine_3_thrust_lbf;
  double engine_4_thrust_lbf;
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
  double commanded_engine_N1_3_percent;
  double commanded_engine_N1_4_percent;
  double engine_N1_1_percent;
  double engine_N1_2_percent;
  double engine_N1_3_percent;
  double engine_N1_4_percent;
  double corrected_engine_N1_1_percent;
  double corrected_engine_N1_2_percent;
  double corrected_engine_N1_3_percent;
  double corrected_engine_N1_4_percent;
  unsigned long long engine_combustion_1;
  unsigned long long engine_combustion_2;
  unsigned long long engine_combustion_3;
  unsigned long long engine_combustion_4;
  unsigned long long is_mach_mode_active;
  unsigned long long speed_slot_index;
  unsigned long long engineAntiIce_1;
  unsigned long long engineAntiIce_2;
  unsigned long long engineAntiIce_3;
  unsigned long long engineAntiIce_4;
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
  double wheelRpmLeftBlg;
  double wheelRpmRightBlg;
  double wheelRpmLeftWlg;
  double wheelRpmRightWlg;
  double contact_point_compression_0;
  double contact_point_compression_1;
  double contact_point_compression_2;
  double contact_point_compression_3;
  double contact_point_compression_4;
};

struct SimInput {
  double inputs[3];
};

struct SimInputPitchTrim {
  bool pitchTrimSwitchUp;
  bool pitchTrimSwitchDown;
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
  // FIXME remove VS_push
  double VS_push;
  double VS_pull;
  double LOC_push;
  double APPR_push;
  double EXPED_push;
  double DIR_TO_trigger;
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
  double throttleLeverPosition_3;
  double throttleLeverPosition_4;
  double throttleManagedMode_1;
  double throttleManagedMode_2;
  double throttleManagedMode_3;
  double throttleManagedMode_4;
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

struct ClientDataAutopilotStateMachine {
  unsigned long long enabled_AP1;
  unsigned long long enabled_AP2;
  double lateral_law;
  double lateral_mode;
  double lateral_mode_armed;
  double vertical_law;
  double vertical_mode;
  double vertical_mode_armed;
  double mode_reversion_lateral;
  double mode_reversion_vertical;
  double mode_reversion_vertical_target_fpm;
  double mode_reversion_TRK_FPA;
  double mode_reversion_triple_click;
  double mode_reversion_fma;
  double speed_protection_mode;
  double autothrust_mode;
  double Psi_c_deg;
  double H_c_ft;
  double H_dot_c_fpm;
  double FPA_c_deg;
  double V_c_kn;
  double ALT_soft_mode_active;
  double ALT_cruise_mode_active;
  double EXPED_mode_active;
  double FD_disconnect;
  double FD_connect;
  double nav_e_loc_valid;
  double nav_e_loc_error_deg;
  double nav_e_gs_valid;
  double nav_e_gs_error_deg;
  unsigned long long TCAS_message_disarm;
  unsigned long long TCAS_message_RA_inhibit;
  unsigned long long TCAS_message_TRK_FPA_deselection;
};

struct ClientDataAutopilotLaws {
  unsigned long long enableAutopilot;
  double flightDirectorTheta;
  double autopilotTheta;
  double flightDirectorPhi;
  double autopilotPhi;
  double autopilotBeta;
  double locPhiCommand;
  double nosewheelCommand;
  unsigned long long conditionFlare;
};

struct ClientDataAutothrust {
  double N1_TLA_1_percent;
  double N1_TLA_2_percent;
  double is_in_reverse_1;
  double is_in_reverse_2;
  double thrust_limit_type;
  double thrust_limit_percent;
  double N1_c_1_percent;
  double N1_c_2_percent;
  double status;
  double mode;
  double mode_message;
};

struct ClientDataAutothrustA380 {
  double N1_TLA_3_percent;
  double N1_TLA_4_percent;
  double is_in_reverse_3;
  double is_in_reverse_4;
  double N1_c_3_percent;
  double N1_c_4_percent;
};

struct ClientDataFlyByWireInput {
  double delta_eta_pos;
  double delta_xi_pos;
  double delta_zeta_pos;
};

struct ClientDataFlyByWire {
  double eta_pos;
  double xi_pos;
  double zeta_pos;
  double eta_trim_deg_should_write;
  double eta_trim_deg;
  double zeta_trim_pos_should_write;
  double zeta_trim_pos;
  double alpha_floor_command;
  double protection_ap_disc;
  double v_alpha_prot_kn;
  double v_alpha_max_kn;
  double beta_target_deg;
};

struct ClientDataLocalVariables {
  double flightPhase;
  double V2;
  double V_APP;
  double V_LS;
  double V_MAX;
  double flightPlanAvailable;
  double altitudeConstraint;
  double thrustReductionAltitude;
  double thrustReductionAltitudeGoAround;
  double accelerationAltitude;
  double accelerationAltitudeEngineOut;
  double accelerationAltitudeGoAround;
  double accelerationAltitudeGoAroundEngineOut;
  double cruiseAltitude;
  double directToTrigger;
  double fcuTrkFpaModeActive;
  double fcuSelectedVs;
  double fcuSelectedFpa;
  double fcuSelectedHeading;
  double flightManagementCrossTrackError;
  double flightManagementTrackAngleError;
  double flightManagementPhiCommand;
  double flightManagementPhiLimit;
  unsigned long long flightManagementRequestedVerticalMode;
  double flightManagement_H_c_ft;
  double flightManagement_H_dot_c_fpm;
  unsigned long long flightManagement_rnav_app_selected;
  unsigned long long flightManagement_final_can_engage;
  double is_SPEED_managed;
  double locPhiCommand;
  unsigned long long TCAS_mode_fail;
  unsigned long long TCAS_mode_available;
  double TCAS_advisory_state;
  double TCAS_advisory_target_min_fpm;
  double TCAS_advisory_target_max_fpm;
  unsigned long long conditionFlare;
};

struct ClientDataLocalVariablesAutothrust {
  double ATHR_push;
  double ATHR_disconnect;
  double TLA_1;
  double TLA_2;
  double V_c_kn;
  double V_LS_kn;
  double V_MAX_kn;
  double thrust_limit_REV_percent;
  double thrust_limit_IDLE_percent;
  double thrust_limit_CLB_percent;
  double thrust_limit_MCT_percent;
  double thrust_limit_FLEX_percent;
  double thrust_limit_TOGA_percent;
  double flex_temperature_degC;
  double mode_requested;
  double is_mach_mode_active;
  double alpha_floor_condition;
  double is_approach_mode_active;
  double is_SRS_TO_mode_active;
  double is_SRS_GA_mode_active;
  double is_LAND_mode_active;
  double thrust_reduction_altitude;
  double thrust_reduction_altitude_go_around;
  double flight_phase;
  double is_soft_alt_mode_active;
  double is_TCAS_active;
  double target_TCAS_RA_rate_fpm;
};
