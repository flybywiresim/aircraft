use std::error::Error;
use systems::shared::{from_bool, to_bool};
use systems_wasm::aspects::{
    max, EventToVariableMapping, ExecuteOn, MsfsAspectBuilder, VariableToEventMapping,
    VariableToEventWriteOn,
};
use systems_wasm::Variable;

pub(super) fn brakes(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    builder.event_to_variable(
        "PARKING_BRAKES",
        EventToVariableMapping::CurrentValueToValue(|current_value| {
            from_bool(!to_bool(current_value))
        }),
        Variable::named("PARK_BRAKE_LEVER_POS"),
        |options| options.mask(),
    )?;
    builder.event_to_variable(
        "PARKING_BRAKE_SET",
        EventToVariableMapping::EventDataToValue(|event_data| from_bool(event_data == 1)),
        Variable::named("PARK_BRAKE_LEVER_POS"),
        |options| options.mask(),
    )?;

    // Controller inputs for the left and right brakes are captured and translated
    // to a variable so that it can be used by the simulation.
    // After running the simulation, the variable value is written back to the simulator
    // through the event.
    let axis_left_brake_set_event_id = builder.event_to_variable(
        "AXIS_LEFT_BRAKE_SET",
        EventToVariableMapping::EventData32kPosition,
        Variable::aspect("BRAKES_LEFT_EVENT"),
        |options| options.mask(),
    )?;
    builder.variable_to_event_id(
        Variable::aspect("BRAKE LEFT FORCE FACTOR"),
        VariableToEventMapping::EventData32kPosition,
        VariableToEventWriteOn::EveryTick,
        axis_left_brake_set_event_id,
    );
    let axis_right_brake_set_event_id = builder.event_to_variable(
        "AXIS_RIGHT_BRAKE_SET",
        EventToVariableMapping::EventData32kPosition,
        Variable::aspect("BRAKES_RIGHT_EVENT"),
        |options| options.mask(),
    )?;
    builder.variable_to_event_id(
        Variable::aspect("BRAKE RIGHT FORCE FACTOR"),
        VariableToEventMapping::EventData32kPosition,
        VariableToEventWriteOn::EveryTick,
        axis_right_brake_set_event_id,
    );

    // Inputs for both brakes, left brake, and right brake are captured and
    // translated via a smooth press function into a ratio which is written to variables.
    const KEYBOARD_PRESS_SPEED: f64 = 0.6;
    const KEYBOARD_RELEASE_SPEED: f64 = 0.3;
    builder.event_to_variable(
        "BRAKES",
        EventToVariableMapping::SmoothPress(KEYBOARD_PRESS_SPEED, KEYBOARD_RELEASE_SPEED),
        Variable::aspect("BRAKES"),
        |options| options.mask(),
    )?;
    builder.event_to_variable(
        "BRAKES_LEFT",
        EventToVariableMapping::SmoothPress(KEYBOARD_PRESS_SPEED, KEYBOARD_RELEASE_SPEED),
        Variable::aspect("BRAKES_LEFT"),
        |options| options.mask(),
    )?;
    builder.event_to_variable(
        "BRAKES_RIGHT",
        EventToVariableMapping::SmoothPress(KEYBOARD_PRESS_SPEED, KEYBOARD_RELEASE_SPEED),
        Variable::aspect("BRAKES_RIGHT"),
        |options| options.mask(),
    )?;

    // The maximum braking demand of all controller inputs
    // is calculated and made available as a percentage.
    builder.reduce(
        ExecuteOn::PreTick,
        vec![
            Variable::aspect("BRAKES"),
            Variable::aspect("BRAKES_LEFT"),
            Variable::aspect("BRAKES_LEFT_EVENT"),
        ],
        0.,
        to_percent_max,
        Variable::named("LEFT_BRAKE_PEDAL_INPUT"),
    );
    builder.reduce(
        ExecuteOn::PreTick,
        vec![
            Variable::aspect("BRAKES"),
            Variable::aspect("BRAKES_RIGHT"),
            Variable::aspect("BRAKES_RIGHT_EVENT"),
        ],
        0.,
        to_percent_max,
        Variable::named("RIGHT_BRAKE_PEDAL_INPUT"),
    );

    Ok(())
}

fn to_percent_max(accumulator: f64, item: f64) -> f64 {
    max(accumulator, item * 100.)
}
