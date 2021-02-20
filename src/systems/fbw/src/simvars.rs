macro_rules! define_struct {
    ( $( ( $name:ident , $var:expr ) , )* ) => {
        #[derive(Debug)]
        pub(crate) struct SimVars {
            $(
                pub(crate) $name: msfs::legacy::NamedVariable,
            )*
        }

        impl Default for SimVars {
            fn default() -> Self {
                SimVars {
                    $(
                        $name: msfs::legacy::NamedVariable::from($var),
                    )*
                }
            }
        }
    }
}

define_struct!(
    (side_stick_position_x, "A32NX_SIDESTICK_POSITION_X"),
    (side_stick_position_y, "A32NX_SIDESTICK_POSITION_Y"),
    (
        side_stick_left_position_x,
        "A32NX_SIDESTICK_LEFT_POSITION_X"
    ),
    (
        side_stick_left_position_y,
        "A32NX_SIDESTICK_LEFT_POSITION_Y"
    ),
    (
        side_stick_right_position_x,
        "A32NX_SIDESTICK_RIGHT_POSITION_X"
    ),
    (
        side_stick_right_position_y,
        "A32NX_SIDESTICK_RIGHT_POSITION_Y"
    ),
    (
        rudder_position_override_on,
        "A32NX_RUDDER_POSITION_OVERRIDE_ON"
    ),
    (rudder_position, "A32NX_RUDDER_POSITION"),
    (
        throttle_position_override_on,
        "A32NX_THROTTLE_POSITION_OVERRIDE_ON"
    ),
    (throttle_position_1, "A32NX_THROTTLE_POSITION_1"),
    (throttle_position_2, "A32NX_THROTTLE_POSITION_2"),
    (fma_lateral_mode, "A32NX_FMA_LATERAL_MODE"),
    (fma_lateral_armed, "A32NX_FMA_LATERAL_ARMED"),
    (fma_vertial_mode, "A32NX_FMA_VERTICAL_MODE"),
    (fma_vertial_armed, "A32NX_FMA_VERTICAL_ARMED"),
    (fma_soft_alt_mode_active, "A32NX_FMA_SOFT_ALT_MODE"),
    (fma_approach_capability, "A32NX_ApproachCapability"),
    (flight_director_bank, "A32NX_FLIGHT_DIRECTOR_BANK"),
    (flight_director_pitch, "A32NX_FLIGHT_DIRECTOR_PITCH"),
    (flight_director_yaw, "A32NX_FLIGHT_DIRECTOR_YAW"),
    (autopilot_active_any, "A32NX_AUTOPILOT_ACTIVE"),
    (autopilot_active_1, "A32NX_AUTOPILOT_1_ACTIVE"),
    (autopilot_active_2, "A32NX_AUTOPILOT_2_ACTIVE"),
    (autothrust_mode, "A32NX_AUTOPILOT_AUTOTHRUST_MODE"),
    (flight_phase, "A32NX_FWC_FLIGHT_PHASE"),
    (fmgc_v2, "AIRLINER_V2_SPEED"),
    (fmgc_vapp, "AIRLINER_VAPP_SPEED"),
    (fmgc_vls, "AIRLINER_VLS_SPEED"),
    (fmgc_altitude_constraint, "A32NX_AP_CSTN_ALT"),
    (fmgc_thrust_reduction_altitude, "A32NX_THR_RED_ALT"),
    (
        fmgc_thrust_reduction_altitude_go_around,
        "AIRLINER_THR_RED_ALT_GOAROUND"
    ),
    (fmgc_acceleration_altitude, "AIRLINER_ACC_ALT"),
    (
        fmgc_acceleration_altitude_engine_out,
        "AIRLINER_ACC_ALT_ENGINEOUT"
    ),
    (
        fmgc_acceleration_altitude_goaround,
        "AIRLINER_ACC_ALT_GOAROUND"
    ),
    (fmgc_cruise_altitude, "AIRLINER_CRUISE_ALTITUDE"),
    (flight_guidance_available, "A32NX_FG_AVAIL"),
    (
        flight_guidance_cross_track_error,
        "A32NX_FG_CROSS_TRACK_ERROR"
    ),
    (
        flight_guidance_track_angle_error,
        "A32NX_FG_TRACK_ANGLE_ERROR"
    ),
    (fcu_trk_fpa_mode_active, "A32NX_TRK_FPA_MODE_ACTIVE"),
    (fcu_selected_fpa, "A32NX_AUTOPILOT_FPA_SELECTED"),
    (fcu_selected_vs, "A32NX_AUTOPILOT_VS_SELECTED"),
    (fcu_selected_heading, "A32NX_AUTOPILOT_HEADING_SELECTED"),
    (fcu_loc_mode_active, "A32NX_FCU_LOC_MODE_ACTIVE"),
    (fcu_appr_mode_active, "A32NX_FCU_APPR_MODE_ACTIVE"),
    (fcu_reversion_active, "A32NX_FCU_MODE_REVERSION_ACTIVE"),
    (
        fcu_reversion_trk_fpa_active,
        "A32NX_FCU_MODE_REVERSION_TRK_FPA_ACTIVE"
    ),
);
