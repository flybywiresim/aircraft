use crate::{
    config, model,
    sim_connect::{self, AutopilotInput, SimData, SimInput},
    simvars, MSFSResult,
};
use msfs::sim_connect::{SimConnect, SIMCONNECT_OBJECT_ID_USER};
use std::{pin::Pin, time::Duration};

#[derive(Debug)]
pub(crate) struct Interface<'a> {
    pub(crate) sim: Pin<Box<SimConnect<'a>>>,
    ap_laws: model::AutopilotLaws,
    ap_sm: model::AutopilotStateMachine,
    fbw: model::FlyByWire,
    vars: simvars::SimVars,

    pub(crate) ap_input: AutopilotInput,
    pub(crate) sim_input: SimInput,

    engine_rl: [crate::rl::RateLimiter; 2],

    pub(crate) throttle_config: config::ThrottleConfig,
    pub(crate) model_config: config::ModelConfig,
}

impl<'a> Interface<'a> {
    pub(crate) fn new(sim: Pin<Box<SimConnect<'a>>>) -> Self {
        Interface {
            sim,
            ap_laws: Default::default(),
            ap_sm: Default::default(),
            fbw: Default::default(),
            vars: Default::default(),

            ap_input: Default::default(),
            sim_input: Default::default(),

            engine_rl: [Default::default(), Default::default()],

            throttle_config: Default::default(),
            model_config: Default::default(),
        }
    }

    pub(crate) fn initialize(
        &mut self
    ) {
        self.ap_sm.initialize();
        self.ap_laws.initialize();
        self.fbw.initialize();
    }

    pub(crate) fn update(
        &mut self,
        sample_time: Duration,
        pause_detected: bool,
        sim_data: &SimData,
    ) -> MSFSResult {
        self.update_ap_sm(sample_time, &sim_data)?;
        self.update_ap_laws(sample_time, &sim_data)?;
        self.update_fbw(sample_time, pause_detected, sim_data)?;
        Ok(())
    }

    fn update_ap_sm(&mut self, sample_time: Duration, sim_data: &SimData) -> MSFSResult {
        if self.model_config.autopilot_state_machine_enabled {
            let mut i = self.ap_sm.input();

            // time
            i.time.dt = sample_time.as_secs_f64();
            i.time.simulation_time = sim_data.simulation_time;

            // data
            i.data.Theta_deg = sim_data.Theta_deg;
            i.data.Phi_deg = sim_data.Phi_deg;
            i.data.q_rad_s = sim_data.body_rotation_velocity.x;
            i.data.r_rad_s = sim_data.body_rotation_velocity.y;
            i.data.p_rad_s = sim_data.body_rotation_velocity.z;
            i.data.V_ias_kn = sim_data.V_ias_kn;
            i.data.V_tas_kn = sim_data.V_tas_kn;
            i.data.V_mach = sim_data.V_mach;
            i.data.V_gnd_kn = sim_data.V_gnd_kn;
            i.data.alpha_deg = sim_data.alpha_deg;
            i.data.H_ft = sim_data.H_ft;
            i.data.H_ind_ft = sim_data.H_ind_ft;
            i.data.H_radio_ft = sim_data.H_radio_ft;
            i.data.H_dot_ft_min = sim_data.H_dot_fpm;
            i.data.Psi_magnetic_deg = sim_data.Psi_magnetic_deg;
            i.data.Psi_magnetic_track_deg = sim_data.Psi_magnetic_track_deg;
            i.data.Psi_true_deg = sim_data.Psi_true_deg;
            i.data.bx_m_s2 = sim_data.bx_m_s2;
            i.data.by_m_s2 = sim_data.by_m_s2;
            i.data.bz_m_s2 = sim_data.bz_m_s2;
            i.data.nav_valid = sim_data.nav_valid as u8;
            i.data.nav_loc_deg = sim_data.nav_loc_deg;
            i.data.nav_dme_valid = sim_data.nav_dme_valid;
            i.data.nav_dme_nmi = sim_data.nav_dme_nmi;
            i.data.nav_loc_valid = sim_data.nav_loc_valid as u8;
            i.data.nav_loc_error_deg = sim_data.nav_loc_error_deg;
            i.data.nav_gs_valid = sim_data.nav_gs_valid as u8;
            i.data.nav_gs_error_deg = sim_data.nav_gs_error_deg;
            i.data.flight_guidance_xtk_nmi = if self.model_config.custom_flight_guidance_enabled {
                self.vars.flight_guidance_cross_track_error.get_value()
            } else {
                sim_data.gps_wp_cross_track
            };
            i.data.flight_guidance_tae_deg = if self.model_config.custom_flight_guidance_enabled {
                self.vars.flight_guidance_track_angle_error.get_value()
            } else {
                sim_data.gps_wp_track_angle_error
            };
            i.data.flight_phase = self.vars.flight_phase.get_value();
            i.data.V2_kn = self.vars.fmgc_v2.get_value();
            i.data.VAPP_kn = self.vars.fmgc_vapp.get_value();
            i.data.VLS_kn = self.vars.fmgc_vls.get_value();
            i.data.is_flight_plan_available = if self.model_config.custom_flight_guidance_enabled {
                self.vars.flight_guidance_available.get_value()
            } else {
                sim_data.gps_is_flight_plan_active
            } as u8;
            i.data.altitude_constraint_ft = self.vars.fmgc_altitude_constraint.get_value();
            i.data.thrust_reduction_altitude = self.vars.fmgc_thrust_reduction_altitude.get_value();
            i.data.thrust_reduction_altitude_go_around = self
                .vars
                .fmgc_thrust_reduction_altitude_go_around
                .get_value();
            i.data.acceleration_altitude = self.vars.fmgc_acceleration_altitude.get_value();
            i.data.acceleration_altitude_engine_out =
                self.vars.fmgc_acceleration_altitude_engine_out.get_value();
            i.data.acceleration_altitude_go_around =
                self.vars.fmgc_acceleration_altitude_goaround.get_value();
            i.data.cruise_altitude = self.vars.fmgc_cruise_altitude.get_value();
            i.data.throttle_lever_1_pos = sim_data.throttle_lever_1_pos;
            i.data.throttle_lever_2_pos = sim_data.throttle_lever_2_pos;
            i.data.gear_strut_compression_1 = sim_data.gear_animation_pos_1;
            i.data.gear_strut_compression_2 = sim_data.gear_animation_pos_2;
            i.data.zeta_pos = sim_data.zeta_pos;
            i.data.flaps_handle_index = sim_data.flaps_handle_index;

            // input
            i.input.FD_active = (sim_data.ap_fd_1_active || sim_data.ap_fd_2_active) as u8;
            i.input.AP_1_push = self.ap_input.ap1_push;
            i.input.AP_2_push = self.ap_input.ap2_push;
            i.input.AP_DISCONNECT_push = self.ap_input.ap_disconnect;
            i.input.HDG_push = self.ap_input.hdg_push;
            i.input.HDG_pull = self.ap_input.hdg_pull;
            i.input.ALT_push = self.ap_input.alt_push;
            i.input.ALT_pull = self.ap_input.alt_pull;
            i.input.VS_push = self.ap_input.vs_push;
            i.input.VS_pull = self.ap_input.vs_pull;
            i.input.LOC_push = self.ap_input.loc_push;
            i.input.APPR_push = self.ap_input.appr_push;
            i.input.V_fcu_kn = sim_data.ap_V_c_kn;
            i.input.H_fcu_ft = sim_data.ap_H_c_ft;
            i.input.H_constraint_ft = self.vars.fmgc_altitude_constraint.get_value();
            i.input.H_dot_fcu_fpm = self.vars.fcu_selected_vs.get_value();
            i.input.FPA_fcu_deg = self.vars.fcu_selected_fpa.get_value();
            i.input.Psi_fcu_deg = self.vars.fcu_selected_heading.get_value();
            i.input.TRK_FPA_mode = self.vars.fcu_trk_fpa_mode_active.get_value();
            i.input.DIR_TO_trigger = 0;

            // step
            self.ap_sm.step();
        } else {
            unimplemented!()
        };

        let output = self.ap_sm.output().output;

        // update autopilot state
        self.vars
            .autopilot_active_any
            .set_value(output.enabled_AP1 == 1.0 || output.enabled_AP2 == 1.0);
        self.vars.autopilot_active_1.set_value(output.enabled_AP1);
        self.vars.autopilot_active_2.set_value(output.enabled_AP2);

        let is_loc_armed = (output.lateral_mode_armed as u8 >> 1) & 0x01 == 0x01;
        let is_loc_engaged = output.lateral_mode >= 30.0 && output.lateral_mode <= 34.0;
        let is_gs_armed = (output.vertical_mode_armed as u8 >> 4) & 0x01 == 0x01;
        let is_gs_engaged = output.vertical_mode >= 30.0 && output.vertical_mode <= 34.0;
        self.vars
            .fcu_loc_mode_active
            .set_value((is_loc_armed || is_loc_engaged) && !(is_gs_armed || is_gs_engaged));
        self.vars
            .fcu_appr_mode_active
            .set_value((is_loc_armed || is_loc_engaged) && (is_gs_armed || is_gs_engaged));

        self.vars
            .fcu_reversion_active
            .set_value(output.mode_reversion);
        self.vars
            .fcu_reversion_trk_fpa_active
            .set_value(output.mode_reversion_TRK_FPA);

        // update autothrust mode
        self.vars.autothrust_mode.set_value(output.autothrust_mode);

        if self.model_config.autothrust_workaround_enabled && sim_data.is_auto_throttle_active {
            match output.autothrust_mode {
                2.0 => {
                    // IDLE
                    for rl in &mut self.engine_rl {
                        rl.iterate(25.0, 3.0, sample_time);
                    }
                    /*
                    sim.set_data_on_sim_object(
                        msfs::sim_connect::SIMCONNECT_OBJECT_ID_USER,
                        &SimOutputEngineOverride {},
                    );
                    */
                }
                3.0 => {
                    // CLB
                    let target = 95.0f64.min(80.0 + ((15.0 / 30000.0) * sim_data.H_ft));
                    for rl in &mut self.engine_rl {
                        rl.iterate(target, 3.0, sample_time);
                    }
                    /*
                    sim.set_data_on_sim_object(
                        msfs::sim_connect::SIMCONNECT_OBJECT_ID_USER,
                        &SimOutputEngineOverride {},
                    );
                    */
                }
                _ => {
                    // NONE or SPEED (in our case -> tracking mode)
                    // TODO: abstract on engine_rl length
                    self.engine_rl[0].reset(sim_data.engine_n1_1);
                    self.engine_rl[1].reset(sim_data.engine_n1_2);
                }
            }
        }

        // update fma variables
        self.vars.fma_lateral_mode.set_value(output.lateral_mode);
        self.vars
            .fma_lateral_armed
            .set_value(output.lateral_mode_armed);
        self.vars.fma_vertial_mode.set_value(output.vertical_mode);
        self.vars
            .fma_vertial_armed
            .set_value(output.vertical_mode_armed);
        self.vars
            .fma_soft_alt_mode_active
            .set_value(output.ALT_soft_mode_active as f64);

        // calculate and set approach capability
        let land_mode_armed_or_active =
            (is_loc_armed || is_loc_engaged) && (is_gs_armed || is_gs_engaged);
        let number_of_autopilots_engaged = output.enabled_AP1 + output.enabled_AP2;
        let auto_thrust_engaged = sim_data.is_auto_throttle_active;
        let radio_altimeter_available = sim_data.H_radio_ft <= 5000.0;
        let mut approach_capability = 0.0;
        if land_mode_armed_or_active {
            approach_capability = 1.0;
            if number_of_autopilots_engaged >= 1.0 {
                approach_capability = 2.0;
                if auto_thrust_engaged && radio_altimeter_available {
                    approach_capability = 3.0;
                    if number_of_autopilots_engaged == 2.0 {
                        approach_capability = 4.0;
                    }
                }
            }
        }
        self.vars
            .fma_approach_capability
            .set_value(approach_capability);

        Ok(())
    }

    fn update_ap_laws(&mut self, sample_time: Duration, sim_data: &SimData) -> MSFSResult {
        if self.model_config.autopilot_laws_enabled {
            let mut i = self.ap_laws.input();

            // time
            i.time.dt = sample_time.as_secs_f64();
            i.time.simulation_time = sim_data.simulation_time;

            // data
            i.data.Theta_deg = sim_data.Theta_deg;
            i.data.Phi_deg = sim_data.Phi_deg;
            i.data.q_rad_s = sim_data.body_rotation_velocity.x;
            i.data.r_rad_s = sim_data.body_rotation_velocity.y;
            i.data.p_rad_s = sim_data.body_rotation_velocity.z;
            i.data.V_ias_kn = sim_data.V_ias_kn;
            i.data.V_tas_kn = sim_data.V_tas_kn;
            i.data.V_mach = sim_data.V_mach;
            i.data.V_gnd_kn = sim_data.V_gnd_kn;
            i.data.alpha_deg = sim_data.alpha_deg;
            i.data.H_ft = sim_data.H_ft;
            i.data.H_ind_ft = sim_data.H_ind_ft;
            i.data.H_radio_ft = sim_data.H_radio_ft;
            i.data.H_dot_ft_min = sim_data.H_dot_fpm;
            i.data.Psi_magnetic_deg = sim_data.Psi_magnetic_deg;
            i.data.Psi_magnetic_track_deg = sim_data.Psi_magnetic_track_deg;
            i.data.Psi_true_deg = sim_data.Psi_true_deg;
            i.data.bx_m_s2 = sim_data.bx_m_s2;
            i.data.by_m_s2 = sim_data.by_m_s2;
            i.data.bz_m_s2 = sim_data.bz_m_s2;
            i.data.nav_valid = sim_data.nav_valid as u8;
            i.data.nav_loc_deg = sim_data.nav_loc_deg;
            i.data.nav_dme_valid = sim_data.nav_dme_valid;
            i.data.nav_dme_nmi = sim_data.nav_dme_nmi;
            i.data.nav_loc_valid = sim_data.nav_loc_valid as u8;
            i.data.nav_loc_error_deg = sim_data.nav_loc_error_deg;
            i.data.nav_gs_valid = sim_data.nav_gs_valid as u8;
            i.data.nav_gs_error_deg = sim_data.nav_gs_error_deg;
            i.data.flight_guidance_xtk_nmi = if self.model_config.custom_flight_guidance_enabled {
                self.vars.flight_guidance_cross_track_error.get_value()
            } else {
                sim_data.gps_wp_cross_track
            };
            i.data.flight_guidance_tae_deg = if self.model_config.custom_flight_guidance_enabled {
                self.vars.flight_guidance_track_angle_error.get_value()
            } else {
                sim_data.gps_wp_track_angle_error
            };
            i.data.flight_phase = self.vars.flight_phase.get_value();
            i.data.V2_kn = self.vars.fmgc_v2.get_value();
            i.data.VAPP_kn = self.vars.fmgc_vapp.get_value();
            i.data.VLS_kn = self.vars.fmgc_vls.get_value();
            i.data.is_flight_plan_available = if self.model_config.custom_flight_guidance_enabled {
                self.vars.flight_guidance_available.get_value()
            } else {
                sim_data.gps_is_flight_plan_active
            } as u8;
            i.data.altitude_constraint_ft = self.vars.fmgc_altitude_constraint.get_value();
            i.data.thrust_reduction_altitude = self.vars.fmgc_thrust_reduction_altitude.get_value();
            i.data.thrust_reduction_altitude_go_around = self
                .vars
                .fmgc_thrust_reduction_altitude_go_around
                .get_value();
            i.data.acceleration_altitude = self.vars.fmgc_acceleration_altitude.get_value();
            i.data.acceleration_altitude_engine_out =
                self.vars.fmgc_acceleration_altitude_engine_out.get_value();
            i.data.acceleration_altitude_go_around =
                self.vars.fmgc_acceleration_altitude_goaround.get_value();
            i.data.throttle_lever_1_pos = sim_data.throttle_lever_1_pos;
            i.data.throttle_lever_2_pos = sim_data.throttle_lever_2_pos;
            i.data.gear_strut_compression_1 = sim_data.gear_animation_pos_1;
            i.data.gear_strut_compression_2 = sim_data.gear_animation_pos_2;
            i.data.zeta_pos = sim_data.zeta_pos;
            i.data.flaps_handle_index = sim_data.flaps_handle_index;

            // input
            i.input = unsafe { std::mem::transmute_copy(self.ap_sm.output()) };

            // step the model
            self.ap_laws.step();
        } else {
            unimplemented!();
        }

        let output = self.ap_laws.output().output;

        let fd_pitch = -1.0 * output.flight_director.Theta_c_deg;
        let fd_bank = -1.0 * output.flight_director.Phi_c_deg;
        let fd_yaw = output.flight_director.Beta_c_deg;
        let maybe_smooth = |current: f64, target: f64| {
            if self.model_config.flight_director_smoothing_enabled {
                let difference = target - current;
                let limit = self.model_config.flight_director_smoothing_limit;
                let difference = if difference >= 0.0 {
                    difference.min(1.0 * limit)
                } else {
                    difference.max(-1.0 * limit)
                };
                current
                    + (difference
                        * 1.0f64.min(
                            sample_time.as_secs_f64()
                                * self.model_config.flight_director_smoothing_factor,
                        ))
            } else {
                current
            }
        };
        self.vars.flight_director_pitch.set_value(maybe_smooth(
            self.vars.flight_director_pitch.get_value(),
            fd_pitch,
        ));
        self.vars.flight_director_bank.set_value(maybe_smooth(
            self.vars.flight_director_bank.get_value(),
            fd_bank,
        ));
        self.vars.flight_director_yaw.set_value(maybe_smooth(
            self.vars.flight_director_yaw.get_value(),
            fd_yaw,
        ));

        Ok(())
    }

    fn update_fbw(
        &mut self,
        sample_time: Duration,
        pause_detected: bool,
        sim_data: &SimData,
    ) -> MSFSResult {
        if self.model_config.fly_by_wire_enabled {
            let mut i = self.fbw.input();

            // time
            i.time.dt = sample_time.as_secs_f64();
            i.time.simulation_time = sim_data.simulation_time;

            // data
            i.data.nz_g = sim_data.nz_g;
            i.data.Theta_deg = sim_data.Theta_deg;
            i.data.Phi_deg = sim_data.Phi_deg;
            i.data.q_rad_s = sim_data.body_rotation_velocity.x;
            i.data.r_rad_s = sim_data.body_rotation_velocity.y;
            i.data.p_rad_s = sim_data.body_rotation_velocity.z;
            i.data.q_dot_rad_s2 = sim_data.body_rotation_acceleration.x;
            i.data.r_dot_rad_s2 = sim_data.body_rotation_acceleration.y;
            i.data.p_dot_rad_s2 = sim_data.body_rotation_acceleration.z;
            i.data.psi_magnetic_deg = sim_data.Psi_magnetic_deg;
            i.data.psi_true_deg = sim_data.Psi_true_deg;
            i.data.eta_pos = sim_data.eta_pos;
            i.data.eta_trim_deg = sim_data.eta_trim_deg;
            i.data.xi_pos = sim_data.xi_pos;
            i.data.zeta_pos = sim_data.zeta_pos;
            i.data.zeta_trim_pos = sim_data.zeta_trim_pos;
            i.data.alpha_deg = sim_data.alpha_deg;
            i.data.beta_deg = sim_data.beta_deg;
            i.data.beta_dot_deg_s = sim_data.beta_dot_deg_s;
            i.data.V_ias_kn = sim_data.V_ias_kn;
            i.data.V_tas_kn = sim_data.V_tas_kn;
            i.data.V_mach = sim_data.V_mach;
            i.data.H_ft = sim_data.H_ft;
            i.data.H_ind_ft = sim_data.H_ind_ft;
            i.data.H_radio_ft = sim_data.H_radio_ft;
            i.data.CG_percent_MAC = sim_data.CG_percent_MAC;
            i.data.total_weight_kg = sim_data.total_weight_kg;
            i.data.gear_animation_pos_0 = sim_data.gear_animation_pos_0;
            i.data.gear_animation_pos_1 = sim_data.gear_animation_pos_1;
            i.data.gear_animation_pos_2 = sim_data.gear_animation_pos_2;
            i.data.flaps_handle_index = sim_data.flaps_handle_index;
            i.data.spoilers_left_pos = sim_data.spoilers_left_pos;
            i.data.spoilers_right_pos = sim_data.spoilers_right_pos;
            i.data.autopilot_master_on = if sim_data.autopilot_master_on {
                1.0
            } else {
                0.0
            };
            i.data.slew_on = if sim_data.slew_on { 1.0 } else { 0.0 };
            i.data.pause_on = if pause_detected { 1.0 } else { 0.0 };
            i.data.autopilot_custom_on = self.ap_laws.output().output.ap_on;
            i.data.autopilot_custom_Theta_c_deg =
                self.ap_laws.output().output.autopilot.Theta_c_deg;
            i.data.autopilot_custom_Phi_c_deg = self.ap_laws.output().output.autopilot.Phi_c_deg;
            i.data.autopilot_custom_Beta_c_deg = self.ap_laws.output().output.autopilot.Beta_c_deg;
            i.data.tracking_mode_on_override = 0.0;
            i.data.simulation_rate = sim_data.simulation_rate;
            i.data.ice_structure_percent = sim_data.ice_structure_percent;
            i.data.linear_cl_alpha_per_deg = sim_data.linear_cl_alpha_per_deg;
            i.data.alpha_stall_deg = sim_data.alpha_stall_deg;
            i.data.alpha_zero_lift_deg = sim_data.alpha_zero_lift_deg;
            i.data.ambient_density_kg_per_m3 = sim_data.ambient_density_kg_per_m3;
            i.data.ambient_pressure_mbar = sim_data.ambient_pressure_mbar;
            i.data.ambient_temperature_celsius = sim_data.ambient_temperature_celsius;
            i.data.ambient_wind_x_kn = sim_data.ambient_wind_x_kn;
            i.data.ambient_wind_y_kn = sim_data.ambient_wind_y_kn;
            i.data.ambient_wind_z_kn = sim_data.ambient_wind_z_kn;
            i.data.ambient_wind_velocity_kn = sim_data.ambient_wind_velocity_kn;
            i.data.ambient_wind_direction_deg = sim_data.ambient_wind_direction_deg;
            i.data.total_air_temperature_celsius = sim_data.total_air_temperature_celsius;
            i.data.latitude_deg = sim_data.latitude_deg;
            i.data.longitude_deg = sim_data.longitude_deg;
            i.data.engine_1_thrust_lbf = sim_data.engine_1_thrust_lbf;
            i.data.engine_2_thrust_lbf = sim_data.engine_2_thrust_lbf;
            i.data.thrust_lever_1_pos = sim_data.throttle_lever_1_pos;
            i.data.thrust_lever_2_pos = sim_data.throttle_lever_2_pos;

            // process sidestick
            // use the values read from input as sidestick left
            let side_stick_left_pos_x = -1.0 * self.sim_input.ailerons;
            let side_stick_left_pos_y = -1.0 * self.sim_input.elevator;
            // read the values from sidestick right
            let side_stick_right_pos_x: f64 = self.vars.side_stick_right_position_x.get_value();
            let side_stick_right_pos_y: f64 = self.vars.side_stick_right_position_y.get_value();
            // add them together and clamp them
            let side_stick_pos_x =
                side_stick_left_pos_x + side_stick_right_pos_x.min(1.0).max(-1.0);
            let side_stick_pos_y =
                side_stick_left_pos_y + side_stick_right_pos_y.min(1.0).max(-1.0);
            // write them as sidestick position
            self.vars
                .side_stick_left_position_x
                .set_value(side_stick_left_pos_x);
            self.vars
                .side_stick_left_position_y
                .set_value(side_stick_left_pos_y);
            self.vars.side_stick_position_x.set_value(side_stick_pos_x);
            self.vars.side_stick_position_y.set_value(side_stick_pos_y);

            // rudder handling
            let rudder_pos_override = self.vars.rudder_position_override_on.get_value();
            let rudder_pos = if rudder_pos_override {
                let p = self.sim_input.rudder;
                self.vars.rudder_position.set_value(p);
                p
            } else {
                self.vars.rudder_position.get_value()
            };

            // inputs
            i.input.delta_eta_pos = -1.0 * side_stick_pos_y;
            i.input.delta_xi_pos = -1.0 * side_stick_pos_x;
            i.input.delta_zeta_pos = rudder_pos;

            // step
            self.fbw.step();

            let o = self.fbw.output();

            if o.sim.data_computed.tracking_mode_on != 1.0 {
                self.sim.set_data_on_sim_object(
                    SIMCONNECT_OBJECT_ID_USER,
                    &sim_connect::SimOutput {
                        elevator: o.output.eta_pos,
                        ailerons: o.output.xi_pos,
                        rudder: o.output.zeta_pos,
                    },
                )?;

                if o.output.eta_trim_deg_should_write == 1 {
                    self.sim.set_data_on_sim_object(
                        SIMCONNECT_OBJECT_ID_USER,
                        &sim_connect::SimOutputEtaTrim {
                            elevator_trim: o.output.eta_trim_deg,
                        },
                    )?;
                }

                if o.output.zeta_trim_pos_should_write == 1 {
                    self.sim.set_data_on_sim_object(
                        SIMCONNECT_OBJECT_ID_USER,
                        &sim_connect::SimOutputZetaTrim {
                            rudder_trim: o.output.zeta_trim_pos,
                        },
                    )?;
                }
            }
        } else {
            unimplemented!();
        }

        Ok(())
    }
}
