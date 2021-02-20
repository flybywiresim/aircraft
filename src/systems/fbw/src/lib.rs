#![allow(clippy::float_cmp)]
#![allow(illegal_floating_point_literal_pattern)]

mod config;
mod interface;
mod model;
mod rl;
mod sim_connect;
mod simvars;

use msfs::sim_connect::SIMCONNECT_OBJECT_ID_USER;
use sim_connect::SimData;

type MSFSResult = Result<(), Box<dyn std::error::Error>>;

#[msfs::gauge(name=fbw)]
async fn fbw(mut gauge: msfs::Gauge) -> MSFSResult {
    let mut interface = interface::Interface::new(gauge.open_simconnect("FBW")?);

    interface.sim.request_data_on_sim_object::<SimData>(
        0,
        SIMCONNECT_OBJECT_ID_USER,
        msfs::sim_connect::Period::SimFrame,
    )?;

    if !interface.model_config.autopilot_state_machine_enabled {
        interface
            .sim
            .request_client_data::<sim_connect::AutopilotStateMachine>(
                0,
                "A32NX_CLIENT_DATA_AUTOPILOT_STATE_MACHINE",
            )?;
    }

    if !interface.model_config.autopilot_laws_enabled {
        interface
            .sim
            .request_client_data::<sim_connect::AutopilotLaws>(
                1,
                "A32NX_CLIENT_DATA_AUTOPILOT_LAWS",
            )?;
    }

    macro_rules! define_events {
        ( $( ( $name:ident, $simvar:expr, $mask:expr ) , )* ) => {
            paste::paste! {
                $(
                    let $name = interface.sim.map_client_event_to_sim_event($simvar, $mask)?;
                )*
            }
        };
    }

    define_events!(
        (
            axis_elevator_set,
            "AXIS_ELEVATOR_SET",
            interface.model_config.fly_by_wire_enabled
        ),
        (
            axis_ailerons_set,
            "AXIS_AILERONS_SET",
            interface.model_config.fly_by_wire_enabled
        ),
        (
            axis_rudder_set,
            "AXIS_RUDDER_SET",
            interface.model_config.fly_by_wire_enabled
        ),
        (
            rudder_set,
            "RUDDER_SET",
            interface.model_config.fly_by_wire_enabled
        ),
        (
            rudder_left,
            "RUDDER_LEFT",
            interface.model_config.fly_by_wire_enabled
        ),
        (
            rudder_axis_plus,
            "RUDDER_AXIS_PLUS",
            interface.model_config.fly_by_wire_enabled
        ),
        (
            rudder_center,
            "RUDDER_CENTER",
            interface.model_config.fly_by_wire_enabled
        ),
        (
            rudder_right,
            "RUDDER_RIGHT",
            interface.model_config.fly_by_wire_enabled
        ),
        (
            rudder_axis_minus,
            "RUDDER_AXIS_MINUS",
            interface.model_config.fly_by_wire_enabled
        ),
        (
            aileron_set,
            "AILERON_SET",
            interface.model_config.fly_by_wire_enabled
        ),
        (
            ailerons_left,
            "AILERONS_LEFT",
            interface.model_config.fly_by_wire_enabled
        ),
        (
            ailerons_right,
            "AILERONS_RIGHT",
            interface.model_config.fly_by_wire_enabled
        ),
        (
            center_ailer_rudder,
            "CENTER_AILER_RUDDER",
            interface.model_config.fly_by_wire_enabled
        ),
        (
            elevator_set,
            "ELEVATOR_SET",
            interface.model_config.fly_by_wire_enabled
        ),
        (
            elevator_down,
            "ELEV_DOWN",
            interface.model_config.fly_by_wire_enabled
        ),
        (
            elevator_up,
            "ELEV_UP",
            interface.model_config.fly_by_wire_enabled
        ),
        (
            ap_master,
            "AP_MASTER",
            interface.model_config.autopilot_state_machine_enabled
        ),
        (ap_off, "AUTOPILOT_OFF", false),
        (fcu_ap1_push, "A32NX.FCU_AP_1_PUSH", false),
        (fcu_ap2_push, "A32NX.FCU_AP_2_PUSH", false),
        (fcu_hdg_push, "A32NX.FCU_HDG_PUSH", false),
        (fcu_hdg_pull, "A32NX.FCU_HDG_PULL", false),
        (fcu_alt_push, "A32NX.FCU_ALT_PUSH", false),
        (fcu_alt_pull, "A32NX.FCU_ALT_PULL", false),
        (fcu_vs_push, "A32NX.FCU_VS_PUSH", false),
        (fcu_vs_pull, "A32NX.FCU_VS_PULL", false),
        (fcu_loc_push, "A32NX.FCU_LOC_PUSH", false),
        (fcu_appr_push, "A32NX.FCU_APPR_PUSH", false),
    );

    interface.initialize();

    let mut t = std::time::Instant::now();
    let mut last_sim_time = 0.0;
    while let Some(event) = gauge.next_event().await {
        if let msfs::MSFSEvent::SimConnect(event) = event {
            match event {
                msfs::sim_connect::SimConnectRecv::SimObjectData(event) => {
                    let dt = t.elapsed();
                    t = std::time::Instant::now();

                    let sim_data = event.into::<SimData>(&interface.sim).unwrap();

                    let pause_detected =
                        sim_data.simulation_time == last_sim_time || sim_data.simulation_time < 0.2;
                    last_sim_time = sim_data.simulation_time;

                    interface.update(dt, pause_detected, sim_data)?;

                    interface.ap_input = sim_connect::AutopilotInput::default();
                }
                msfs::sim_connect::SimConnectRecv::ClientData(event) => match event.id() {
                    0 => {
                        let _data = event
                            .into::<sim_connect::AutopilotStateMachine>(&interface.sim)
                            .unwrap();
                    }
                    1 => {
                        let _data = event
                            .into::<sim_connect::AutopilotLaws>(&interface.sim)
                            .unwrap();
                    }
                    _ => unreachable!(),
                },
                msfs::sim_connect::SimConnectRecv::Event(event) => match event.id() {
                    e if e == axis_elevator_set => {
                        interface.sim_input.elevator = event.data() as std::os::raw::c_long as f64 / 16384.0;
                    }
                    e if e == axis_ailerons_set => {
                        interface.sim_input.ailerons = event.data() as std::os::raw::c_long as f64 / 16384.0;
                    }
                    e if e == axis_rudder_set => {
                        interface.sim_input.rudder = event.data() as std::os::raw::c_long as f64 / 16384.0;
                    }
                    e if e == rudder_set => {
                        interface.sim_input.rudder = event.data() as std::os::raw::c_long as f64 / 16384.0;
                    }
                    e if e == rudder_left => {
                        interface.sim_input.rudder = (interface.sim_input.rudder + 0.02).min(1.0);
                    }
                    e if e == rudder_center => {
                        interface.sim_input.rudder = 0.0;
                    }
                    e if e == rudder_right => {
                        interface.sim_input.rudder = (interface.sim_input.rudder - 0.02).max(-1.0);
                    }
                    e if e == rudder_axis_minus => {
                        interface.sim_input.rudder = 1.0 * event.data() as std::os::raw::c_long as f64 / 16384.0;
                    }
                    e if e == rudder_axis_plus => {
                        interface.sim_input.rudder = -1.0 * event.data() as std::os::raw::c_long as f64 / 16384.0;
                    }
                    e if e == aileron_set => {
                        interface.sim_input.ailerons = event.data() as std::os::raw::c_long as f64 / 16384.0;
                    }
                    e if e == ailerons_left => {
                        interface.sim_input.ailerons =
                            (interface.sim_input.ailerons + 0.02).min(1.0);
                    }
                    e if e == ailerons_right => {
                        interface.sim_input.ailerons =
                            (interface.sim_input.ailerons - 0.02).max(1.0);
                    }
                    e if e == center_ailer_rudder => {
                        interface.sim_input.rudder = 0.0;
                        interface.sim_input.ailerons = 0.0;
                    }
                    e if e == elevator_set => {
                        interface.sim_input.elevator = event.data() as std::os::raw::c_long as f64 / 16384.0;
                    }
                    e if e == elevator_up => {
                        interface.sim_input.ailerons =
                            (interface.sim_input.ailerons - 0.02).max(1.0);
                    }
                    e if e == elevator_down => {
                        interface.sim_input.ailerons =
                            (interface.sim_input.ailerons + 0.02).min(1.0);
                    }
                    e if e == ap_off => {
                        interface.ap_input.ap_disconnect = 1;
                    }
                    e if e == ap_master => {
                        interface.ap_input.ap1_push = 1;
                    }
                    e if e == fcu_ap1_push => {
                        interface.ap_input.ap1_push = 1;
                    }
                    e if e == fcu_ap2_push => {
                        interface.ap_input.ap2_push = 1;
                    }
                    e if e == fcu_hdg_push => {
                        interface.ap_input.hdg_push = 1;
                    }
                    e if e == fcu_hdg_pull => {
                        interface.ap_input.hdg_pull = 1;
                    }
                    e if e == fcu_alt_push => {
                        interface.ap_input.hdg_push = 1;
                    }
                    e if e == fcu_alt_pull => {
                        interface.ap_input.hdg_pull = 1;
                    }
                    e if e == fcu_vs_push => {
                        interface.ap_input.vs_push = 1;
                    }
                    e if e == fcu_vs_pull => {
                        interface.ap_input.vs_pull = 1;
                    }
                    e if e == fcu_loc_push => {
                        interface.ap_input.loc_push = 1;
                    }
                    e if e == fcu_appr_push => {
                        interface.ap_input.appr_push = 1;
                    }
                    _ => unreachable!(),
                },
                _ => {}
            }
        }
    }

    Ok(())
}
