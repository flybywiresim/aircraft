use std::error::Error;

use msfs::sim_connect;
use msfs::{sim_connect::SimConnect, sim_connect::SIMCONNECT_OBJECT_ID_USER};

use systems_wasm::aspects::{
    EventToVariableMapping, ExecuteOn, MsfsAspectBuilder, ObjectWrite, VariableToEventMapping,
    VariableToEventWriteOn, VariablesToObject,
};
use systems_wasm::{set_data_on_sim_object, Variable};

pub(super) fn gear(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    // Read gear demand from all sim sim events and mask them
    let gear_set_set_event_id = builder.event_to_variable(
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

    // Feedback the gear event to the sim
    builder.map_many(
        ExecuteOn::PostTick,
        vec![
            Variable::named("GEAR_CENTER_POSITION"),
            Variable::named("GEAR_LEFT_POSITION"),
            Variable::named("GEAR_RIGHT_POSITION"),
        ],
        |values| {
            // println!(
            //     "Gears C L R {:.2} {:.2} {:.2} FINAL HANDLE MSFS {:?}",
            //     values[0],
            //     values[1],
            //     values[2],
            //     values[0] > 50. || values[1] > 5. || values[2] > 5.
            // );
            if values[0] > 25. || values[1] > 25. || values[2] > 25. {
                1.
            } else {
                0.
            }
        },
        Variable::aspect("SIM_FEEDBACK_FINAL_GEAR_HANDLE"),
    );

    builder.variable_to_event_id(
        Variable::aspect("SIM_FEEDBACK_FINAL_GEAR_HANDLE"),
        VariableToEventMapping::EventDataRaw,
        VariableToEventWriteOn::Change,
        gear_set_set_event_id,
    );

    // GEAR POSITION FEEDBACK TO SIM
    builder.variables_to_object(Box::new(GearPosition {
        nose_position: 1.,
        left_position: 1.,
        right_position: 1.,
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
}

impl VariablesToObject for GearPosition {
    fn variables(&self) -> Vec<Variable> {
        vec![
            Variable::named("GEAR_CENTER_POSITION"),
            Variable::named("GEAR_LEFT_POSITION"),
            Variable::named("GEAR_RIGHT_POSITION"),
        ]
    }

    fn write(&mut self, values: Vec<f64>) -> ObjectWrite {
        self.nose_position = values[0] / 100.;
        self.left_position = values[1] / 100.;
        self.right_position = values[2] / 100.;

        ObjectWrite::default()
    }

    set_data_on_sim_object!();
}
