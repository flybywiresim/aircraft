use std::error::Error;

use msfs::sim_connect;
use msfs::{sim_connect::SimConnect, sim_connect::SIMCONNECT_OBJECT_ID_USER};

use systems_wasm::aspects::{
    EventToVariableMapping, ExecuteOn, MsfsAspectBuilder, VariableToEventMapping,
    VariableToEventWriteOn, VariablesToObject,
};
use systems_wasm::{set_data_on_sim_object, Variable};

pub(super) fn gear(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    // Read gear demand from sim and mask it
    let gear_set_set_event_id = builder.event_to_variable(
        "GEAR_SET",
        EventToVariableMapping::EventData32kPosition,
        Variable::aspect("GEAR_SET_DEMAND"),
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
        Variable::aspect("GEAR_LEVER_POS_DEMAND"),
        |options| options.mask(),
    )?;
    builder.event_to_variable(
        "GEAR_UP",
        EventToVariableMapping::Value(0.),
        Variable::aspect("GEAR_LEVER_POS_DEMAND"),
        |options| options.mask(),
    )?;
    builder.event_to_variable(
        "GEAR_DOWN",
        EventToVariableMapping::Value(1.),
        Variable::aspect("GEAR_LEVER_POS_DEMAND"),
        |options| options.mask(),
    )?;

    builder.map_many(
        ExecuteOn::PreTick,
        vec![
            Variable::aspect("GEAR_LEVER_POS_DEMAND"),
            Variable::aspect("LGCIU_1_GEAR_HANDLE_BAULK_LOCKED"),
            Variable::aspect("LGCIU_2_GEAR_HANDLE_BAULK_LOCKED"),
            Variable::aspect("FINAL_GEAR_HANDLE_POSITION"),
        ],
        |values| {
            let gear_lever_position_demand = values[0];
            let is_gear_locked_down_lgciu1 = values[1] > 0.5;
            let is_gear_locked_down_lgciu2 = values[2] > 0.5;
            let is_gear_previously_up = values[3] < 0.5;

            // println!(
            //     "POS DEMAND {} prev pos is up {} BAULK LOCK1 {} BAULK LOCK2 {}",
            //     gear_lever_position_demand,
            //     is_gear_previously_up,
            //     is_gear_locked_down_lgciu1,
            //     is_gear_locked_down_lgciu2,
            // );

            if gear_lever_position_demand < 0.5
                && ((!is_gear_locked_down_lgciu1 || !is_gear_locked_down_lgciu2)
                    || is_gear_previously_up)
            {
                0.
            } else {
                1.
            }
        },
        Variable::aspect("FINAL_GEAR_HANDLE_POSITION"),
    );

    builder.variable_to_event_id(
        Variable::aspect("FINAL_GEAR_HANDLE_POSITION"),
        VariableToEventMapping::EventDataRaw,
        VariableToEventWriteOn::EveryTick,
        gear_set_set_event_id,
    );

    // MANUAL GRAVITY GEAR EXTENSION
    builder.event_to_variable(
        "GEAR_EMERGENCY_HANDLE_TOGGLE",
        EventToVariableMapping::CurrentValueToValue(|current_value| (current_value + 1.).round()),
        Variable::named("GEAR_EMERGENCY_EXTENSION_TOGGLE_VALUE"),
        |options| options.mask(),
    )?;

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

    fn write(&mut self, values: Vec<f64>) {
        self.nose_position = values[0] / 100.;
        self.left_position = values[1] / 100.;
        self.right_position = values[2] / 100.;
    }

    set_data_on_sim_object!();
}
