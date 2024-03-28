use std::error::Error;

use msfs::sim_connect;
use msfs::{sim_connect::SimConnect, sim_connect::SIMCONNECT_OBJECT_ID_USER};

use systems_wasm::aspects::{
    EventToVariableMapping, MsfsAspectBuilder, ObjectWrite, VariablesToObject,
};
use systems_wasm::{set_data_on_sim_object, Variable};

/// Gear status feedback to MSFS
/// Note this is also used to inject plane drag from landing lights/RAT/Sat antenna
pub(super) fn gear(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    // Read gear demand from all sim sim events and mask them
    builder.event_to_variable(
        "GEAR_SET",
        EventToVariableMapping::EventDataRaw,
        Variable::named("GEAR_LEVER_POSITION_REQUEST"),
        |options| options.mask(),
    )?;

    builder.event_to_variable(
        "GEAR_TOGGLE",
        EventToVariableMapping::CurrentValueToValue(
            |current_value| {
                if current_value > 0.5 {
                    0.
                } else {
                    1.
                }
            },
        ),
        Variable::named("GEAR_LEVER_POSITION_REQUEST"),
        |options| options.mask(),
    )?;

    builder.event_to_variable(
        "GEAR_UP",
        EventToVariableMapping::Value(0.),
        Variable::named("GEAR_LEVER_POSITION_REQUEST"),
        |options| options.mask(),
    )?;

    builder.event_to_variable(
        "GEAR_DOWN",
        EventToVariableMapping::Value(1.),
        Variable::named("GEAR_LEVER_POSITION_REQUEST"),
        |options| options.mask(),
    )?;

    // GEAR POSITION FEEDBACK TO SIM
    builder.variables_to_object(Box::new(GearPosition {
        nose_position: 1.,
        left_position: 1.,
        right_position: 1.,
        gear_handle_position: 1.,
    }));

    Ok(())
}

#[sim_connect::data_definition]
struct GearPosition {
    #[name = "GEAR CENTER POSITION"]
    #[unit = "Percent over 100"]
    nose_position: f64,

    #[name = "GEAR LEFT POSITION"]
    #[unit = "Percent over 100"]
    left_position: f64,

    #[name = "GEAR RIGHT POSITION"]
    #[unit = "Percent over 100"]
    right_position: f64,

    #[name = "GEAR HANDLE POSITION"]
    #[unit = "Percent over 100"]
    gear_handle_position: f64,
}

impl VariablesToObject for GearPosition {
    fn variables(&self) -> Vec<Variable> {
        vec![
            Variable::named("GEAR_CENTER_POSITION"),
            Variable::named("GEAR_LEFT_POSITION"),
            Variable::named("GEAR_RIGHT_POSITION"),
            Variable::named("GEAR_DOOR_CENTER_POSITION"),
            Variable::named("GEAR_DOOR_LEFT_POSITION"),
            Variable::named("GEAR_DOOR_RIGHT_POSITION"),
            Variable::named("LANDING_2_POSITION"),
            Variable::named("LANDING_3_POSITION"),
            Variable::named("RAT_STOW_POSITION"),
        ]
    }

    fn write(&mut self, values: Vec<f64>) -> ObjectWrite {
        // Ratio of MSFS gear drag corresponding to door drag
        const FAKE_GEAR_POSITION_FOR_DOOR_DRAG: f64 = 0.1;
        // Ratio of MSFS gear drag corresponding to landing light drag
        const FAKE_GEAR_POSITION_FOR_LANDING_LIGHT_DRAG: f64 = 0.021;
        // Ratio of MSFS gear drag corresponding to RAT deployed
        const FAKE_GEAR_POSITION_FOR_RAT_DRAG: f64 = 0.070;

        let gear_deployed = values[0] > 5. || values[1] > 5. || values[2] > 5.;

        // Nose msfs gear value is gear position + door drag
        let nose_value_after_drag =
            (values[3] / 100.) * FAKE_GEAR_POSITION_FOR_DOOR_DRAG + values[0] / 100.;

        // Left msfs gear value is gear position + left door drag + left landing light drag + RAT drag
        let left_value_after_drag = (values[4] / 100.) * FAKE_GEAR_POSITION_FOR_DOOR_DRAG
            + (values[6] / 100.) * FAKE_GEAR_POSITION_FOR_LANDING_LIGHT_DRAG
            + values[8] * FAKE_GEAR_POSITION_FOR_RAT_DRAG
            + values[1] / 100.;

        // Right msfs gear value is gear position + right door drag + right landing light drag
        let right_value_after_drag = (values[5] / 100.) * FAKE_GEAR_POSITION_FOR_DOOR_DRAG
            + (values[7] / 100.) * FAKE_GEAR_POSITION_FOR_LANDING_LIGHT_DRAG
            + values[2] / 100.;

        self.nose_position = nose_value_after_drag.min(1.).max(0.);
        self.left_position = left_value_after_drag.min(1.).max(0.);
        self.right_position = right_value_after_drag.min(1.).max(0.);

        self.gear_handle_position = if gear_deployed { 1. } else { 0. };

        ObjectWrite::default()
    }

    set_data_on_sim_object!();
}
