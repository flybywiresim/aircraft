use std::error::Error;

use msfs::sim_connect;
use msfs::{sim_connect::SimConnect, sim_connect::SIMCONNECT_OBJECT_ID_USER};

use systems_wasm::aspects::{
    EventToVariableMapping, MsfsAspectBuilder, ObjectWrite, VariablesToObject,
};
use systems_wasm::{set_data_on_sim_object, Variable};

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
        ]
    }

    fn write(&mut self, values: Vec<f64>) -> ObjectWrite {
        const GEAR_POSITION_FOR_FAKE_DOOR_DRAG: f64 = 0.10;

        let gear_deployed = values[0] > 5. || values[1] > 5. || values[2] > 5.;
        let door_opened = values[3] > 10. || values[4] > 10. || values[5] > 10.;

        // If doors are deployed we fake gear going down a bit to get some door drag effect from the sim
        if door_opened && !gear_deployed {
            self.nose_position = (values[3] / 100.).min(GEAR_POSITION_FOR_FAKE_DOOR_DRAG);
            self.left_position = (values[4] / 100.).min(GEAR_POSITION_FOR_FAKE_DOOR_DRAG);
            self.right_position = (values[5] / 100.).min(GEAR_POSITION_FOR_FAKE_DOOR_DRAG);
        } else {
            self.nose_position = values[0] / 100.;
            self.left_position = values[1] / 100.;
            self.right_position = values[2] / 100.;
        }

        self.gear_handle_position = if gear_deployed { 1. } else { 0. };

        ObjectWrite::default()
    }

    set_data_on_sim_object!();
}
