use msfs::sim_connect::DataXYZ;

#[msfs::sim_connect::data_definition]
#[derive(Debug)]
pub(crate) struct SimData {
    #[name = "G FORCE"]
    #[unit = "GFORCE"]
    pub(crate) nz_g: f64,
    #[name = "PLANE PITCH DEGREES"]
    #[unit = "DEGREE"]
    pub(crate) Theta_deg: f64,
    #[name = "PLANE BANK DEGREES"]
    #[unit = "DEGREE"]
    pub(crate) Phi_deg: f64,
    #[name = "STRUCT BODY ROTATION VELOCITY"]
    #[unit = "STRUCT"]
    pub(crate) body_rotation_velocity: DataXYZ,
    #[name = "STRUCT BODY ROTATION ACCELERATION"]
    #[unit = "STRUCT"]
    pub(crate) body_rotation_acceleration: DataXYZ,
    #[name = "ACCELERATION BODY Z"]
    #[unit = "METER PER SECOND SQUARED"]
    pub(crate) bx_m_s2: f64,
    #[name = "ACCELERATION BODY X"]
    #[unit = "METER PER SECOND SQUARED"]
    pub(crate) by_m_s2: f64,
    #[name = "ACCELERATION BODY Y"]
    #[unit = "METER PER SECOND SQUARED"]
    pub(crate) bz_m_s2: f64,
    #[name = "PLANE HEADING DEGREES MAGNETIC"]
    #[unit = "DEGREES"]
    pub(crate) Psi_magnetic_deg: f64,
    #[name = "PLANE HEADING DEGREES TRUE"]
    #[unit = "DEGREES"]
    pub(crate) Psi_true_deg: f64,
    #[name = "GPS GROUND MAGNETIC TRACK"]
    #[unit = "DEGREES"]
    pub(crate) Psi_magnetic_track_deg: f64,
    #[name = "ELEVATOR POSITION"]
    #[unit = "DEGREE"]
    pub(crate) eta_pos: f64,
    #[name = "ELEVATOR TRIM POSITION"]
    #[unit = "POSITION"]
    pub(crate) eta_trim_deg: f64,
    #[name = "AILERON POSITION"]
    #[unit = "POSITION"]
    pub(crate) xi_pos: f64,
    #[name = "RUDDER POSITION"]
    #[unit = "POSITION"]
    pub(crate) zeta_pos: f64,
    #[name = "RUDDER TRIM PCT"]
    #[unit = "PERCENT OVER 100"]
    pub(crate) zeta_trim_pos: f64,
    #[name = "INCIDENCE ALPHA"]
    #[unit = "DEGREE"]
    pub(crate) alpha_deg: f64,
    #[name = "INCIDENCE BETA"]
    #[unit = "DEGREE"]
    pub(crate) beta_deg: f64,
    #[name = "BETA DOT"]
    #[unit = "DEGREE PER SECOND"]
    pub(crate) beta_dot_deg_s: f64,
    #[name = "AIRSPEED INDICATED"]
    #[unit = "KNOTS"]
    pub(crate) V_ias_kn: f64,
    #[name = "AIRSPEED TRUE"]
    #[unit = "KNOTS"]
    pub(crate) V_tas_kn: f64,
    #[name = "AIRSPEED MACH"]
    #[unit = "KNOTS"]
    pub(crate) V_mach: f64,
    #[name = "GROUND VELOCITY"]
    #[unit = "KNOTS"]
    pub(crate) V_gnd_kn: f64,
    #[name = "PRESSURE ALTITUDE"]
    #[unit = "FEET"]
    pub(crate) H_ft: f64,
    #[name = "INDICATED ALTITUDE"]
    #[unit = "FEET"]
    pub(crate) H_ind_ft: f64,
    #[name = "PLANE ALT ABOVE GROUND MINUS CG"]
    #[unit = "FEET"]
    pub(crate) H_radio_ft: f64,
    #[name = "VELOCITY WORLD Y"]
    #[unit = "FEET PER MINUTE"]
    pub(crate) H_dot_fpm: f64,
    #[name = "GC PERCENT"]
    #[unit = "PERCENT OVER 100"]
    pub(crate) CG_percent_MAC: f64,
    #[name = "TOTAL WEIGHT"]
    #[unit = "KILOGRAMS"]
    pub(crate) total_weight_kg: f64,
    #[name = "GEAR ANIMATION POSITION:0"]
    #[unit = "NUMBER"]
    pub(crate) gear_animation_pos_0: f64,
    #[name = "GEAR ANIMATION POSITION:1"]
    #[unit = "NUMBER"]
    pub(crate) gear_animation_pos_1: f64,
    #[name = "GEAR ANIMATION POSITION:2"]
    #[unit = "NUMBER"]
    pub(crate) gear_animation_pos_2: f64,
    #[name = "FLAPS HANDLE INDEX"]
    #[unit = "NUMBER"]
    pub(crate) flaps_handle_index: f64,
    #[name = "SPOILERS LEFT POSITION"]
    #[unit = "PERCENT OVER 100"]
    pub(crate) spoilers_left_pos: f64,
    #[name = "SPOILERS RIGHT POSITION"]
    #[unit = "PERCENT OVER 100"]
    pub(crate) spoilers_right_pos: f64,
    #[name = "IS SLEW ACTIVE"]
    #[unit = "BOOL"]
    pub(crate) slew_on: bool,
    #[name = "AUTOPILOT MASTER"]
    #[unit = "BOOL"]
    pub(crate) autopilot_master_on: bool,
    #[name = "AUTOPILOT FLIGHT DIRECTOR ACTIVE:1"]
    #[unit = "BOOL"]
    pub(crate) ap_fd_1_active: bool,
    #[name = "AUTOPILOT FLIGHT DIRECTOR ACTIVE:2"]
    #[unit = "BOOL"]
    pub(crate) ap_fd_2_active: bool,
    #[name = "AUTOPILOT AIRSPEED HOLD VAR"]
    #[unit = "KNOTS"]
    pub(crate) ap_V_c_kn: f64,
    #[name = "AUTOPILOT ALTITUDE LOCK VAR:3"]
    #[unit = "FEET"]
    pub(crate) ap_H_c_ft: f64,
    #[name = "SIMULATION TIME"]
    #[unit = "NUMBER"]
    pub(crate) simulation_time: f64,
    #[name = "SIMULATION RATE"]
    #[unit = "NUMBER"]
    pub(crate) simulation_rate: f64,
    #[name = "STRUCTURAL ICE PCT"]
    #[unit = "PERCENT OVER 100"]
    pub(crate) ice_structure_percent: f64,
    #[name = "LINEAR CL ALPHA"]
    #[unit = "PER DEGREE"]
    pub(crate) linear_cl_alpha_per_deg: f64,
    #[name = "STALL ALPHA"]
    #[unit = "DEGREE"]
    pub(crate) alpha_stall_deg: f64,
    #[name = "ZERO LIFT ALPHA"]
    #[unit = "DEGREE"]
    pub(crate) alpha_zero_lift_deg: f64,
    #[name = "AMBIENT DENSITY"]
    #[unit = "KILOGRAM PER CUBIC METER"]
    pub(crate) ambient_density_kg_per_m3: f64,
    #[name = "AMBIENT PRESSURE"]
    #[unit = "MILLIBARS"]
    pub(crate) ambient_pressure_mbar: f64,
    #[name = "AMBIENT TEMPERATURE"]
    #[unit = "CELSIUS"]
    pub(crate) ambient_temperature_celsius: f64,
    #[name = "AMBIENT WIND X"]
    #[unit = "KNOTS"]
    pub(crate) ambient_wind_x_kn: f64,
    #[name = "AMBIENT WIND Y"]
    #[unit = "KNOTS"]
    pub(crate) ambient_wind_y_kn: f64,
    #[name = "AMBIENT WIND Z"]
    #[unit = "KNOTS"]
    pub(crate) ambient_wind_z_kn: f64,
    #[name = "AMBIENT WIND VELOCITY"]
    #[unit = "KNOTS"]
    pub(crate) ambient_wind_velocity_kn: f64,
    #[name = "AMBIENT WIND DIRECTION"]
    #[unit = "DEGREES"]
    pub(crate) ambient_wind_direction_deg: f64,
    #[name = "TOTAL AIR TEMPERATURE"]
    #[unit = "CELSIUS"]
    pub(crate) total_air_temperature_celsius: f64,
    #[name = "PLANE LATITUDE"]
    #[unit = "DEGREES"]
    pub(crate) latitude_deg: f64,
    #[name = "PLANE LONGITUDE"]
    #[unit = "DEGREES"]
    pub(crate) longitude_deg: f64,
    #[name = "GENERAL ENG THROTTLE LEVER POSITION:1"]
    #[unit = "PERCENT"]
    pub(crate) throttle_lever_1_pos: f64,
    #[name = "GENERAL ENG THROTTLE LEVER POSITION:2"]
    #[unit = "PERCENT"]
    pub(crate) throttle_lever_2_pos: f64,
    #[name = "TURB ENG JET THRUST:1"]
    #[unit = "POUNDS"]
    pub(crate) engine_1_thrust_lbf: f64,
    #[name = "TURB ENG JET THRUST:2"]
    #[unit = "POUNDS"]
    pub(crate) engine_2_thrust_lbf: f64,
    #[name = "NAV HAS NAV:3"]
    #[unit = "BOOL"]
    pub(crate) nav_valid: bool,
    #[name = "NAV LOCALIZER:3"]
    #[unit = "DEGREES"]
    pub(crate) nav_loc_deg: f64,
    #[name = "NAV HAS DME:3"]
    #[unit = "BOOL"]
    pub(crate) nav_dme_valid: f64,
    #[name = "NAV DME:3"]
    #[unit = "NAUTICAL MILES"]
    pub(crate) nav_dme_nmi: f64,
    #[name = "NAV HAS LOCALIZER:3"]
    #[unit = "BOOL"]
    pub(crate) nav_loc_valid: bool,
    #[name = "NAV RADIAL ERROR:3"]
    #[unit = "DEGREES"]
    pub(crate) nav_loc_error_deg: f64,
    #[name = "NAV HAS GLIDE SLOPE:3"]
    #[unit = "BOOL"]
    pub(crate) nav_gs_valid: bool,
    #[name = "NAV GLIDE SLOPE ERROR:3"]
    #[unit = "DEGREES"]
    pub(crate) nav_gs_error_deg: f64,
    #[name = "AUTOTHROTTLE ACTIVE"]
    #[unit = "BOOL"]
    pub(crate) is_auto_throttle_active: bool,
    #[name = "TURB ENG CORRECTED N1:1"]
    #[unit = "PERCENT"]
    pub(crate) engine_n1_1: f64,
    #[name = "TURB ENG CORRECTED N1:1"]
    #[unit = "PERCENT"]
    pub(crate) engine_n1_2: f64,
    #[name = "GPS IS ACTIVE FLIGHT PLAN"]
    #[unit = "BOOL"]
    pub(crate) gps_is_flight_plan_active: bool,
    #[name = "GPS WP CROSS TRK"]
    #[unit = "NAUTICAL MILES"]
    pub(crate) gps_wp_cross_track: f64,
    #[name = "GPS WP TRACK ANGLE ERROR"]
    #[unit = "DEGREES"]
    pub(crate) gps_wp_track_angle_error: f64,
}

#[msfs::sim_connect::data_definition]
pub(crate) struct SimOutputEngineOverride {
    #[name = "TURB ENG CORRECTED N1:1"]
    #[unit = "PERCENT"]
    engine_n1_1: f64,
    #[name = "TURB ENG CORRECTED N1:2"]
    #[unit = "PERCENT"]
    engine_n2_1: f64,
}

#[msfs::sim_connect::client_data_definition]
#[derive(Debug)]
#[repr(C)] // communicating with simulink
pub(crate) struct AutopilotStateMachine {
    pub(crate) enabled_AP1: bool,
    pub(crate) enabled_AP2: bool,
    pub(crate) lateral_law: f64,
    pub(crate) lateral_mode: f64,
    pub(crate) lateral_mode_armed: f64,
    pub(crate) vertical_law: f64,
    pub(crate) vertical_mode: f64,
    pub(crate) vertical_mode_armed: f64,
    pub(crate) mode_reversion: f64,
    pub(crate) mode_reversion_TRK_FPA: f64,
    pub(crate) autothrust_mode: f64,
    pub(crate) Psi_c_deg: f64,
    pub(crate) H_c_ft: f64,
    pub(crate) H_dot_c_fpm: f64,
    pub(crate) FPA_c_deg: f64,
    pub(crate) V_c_kn: f64,
    pub(crate) ALT_soft_mode_active: f64,
}

#[msfs::sim_connect::client_data_definition]
#[derive(Debug)]
pub(crate) struct AutopilotLaws {
    pub(crate) enable_autopilot: bool,
    pub(crate) fligh_director_theta: f64,
    pub(crate) autopilot_theta: f64,
    pub(crate) flight_director_Phi: f64,
    pub(crate) autopilot_phi: f64,
    pub(crate) autopilot_beta: f64,
}

#[derive(Debug, Default)]
pub(crate) struct AutopilotInput {
    pub(crate) ap1_push: u8,
    pub(crate) ap2_push: u8,
    pub(crate) ap_disconnect: u8,
    pub(crate) hdg_push: u8,
    pub(crate) hdg_pull: u8,
    pub(crate) alt_push: u8,
    pub(crate) alt_pull: u8,
    pub(crate) vs_push: u8,
    pub(crate) vs_pull: u8,
    pub(crate) loc_push: u8,
    pub(crate) appr_push: u8,
}

#[msfs::sim_connect::data_definition]
#[derive(Debug, Default)]
pub(crate) struct SimOutput {
    #[name = "ELEVATOR POSITION"]
    #[unit = "POSITION"]
    pub(crate) elevator: f64,
    #[name = "AILERON POSITION"]
    #[unit = "POSITION"]
    pub(crate) ailerons: f64,
    #[name = "RUDDER POSITION"]
    #[unit = "POSITION"]
    pub(crate) rudder: f64,
}

#[msfs::sim_connect::data_definition]
#[derive(Debug, Default)]
pub(crate) struct SimOutputEtaTrim {
    #[name = "ELEVATOR TRIM POSITION"]
    #[unit = "DEGREE"]
    pub(crate) elevator_trim: f64,
}

#[msfs::sim_connect::data_definition]
#[derive(Debug, Default)]
pub(crate) struct SimOutputZetaTrim {
    #[name = "RUDDER TRIM PCT"]
    #[unit = "PERCENT OVER 100"]
    pub(crate) rudder_trim: f64,
}

#[derive(Debug, Default)]
pub(crate) struct SimInput {
    pub(crate) elevator: f64,
    pub(crate) ailerons: f64,
    pub(crate) rudder: f64,
}
