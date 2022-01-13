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
        Variable::Named("PARK_BRAKE_LEVER_POS".into()),
        |options| options.mask(),
    )?;
    builder.event_to_variable(
        "PARKING_BRAKE_SET",
        EventToVariableMapping::EventDataToValue(|event_data| from_bool(event_data == 1)),
        Variable::Named("PARK_BRAKE_LEVER_POS".into()),
        |options| options.mask(),
    )?;

    // Controller inputs for the left and right brakes are captured and translated
    // to a variable so that it can be used by the simulation.
    // After running the simulation, the variable value is written back to the simulator
    // through the event.
    let axis_left_brake_set_event_id = builder.event_to_variable(
        "AXIS_LEFT_BRAKE_SET",
        EventToVariableMapping::EventData32kPosition,
        Variable::Aspect("BRAKES_LEFT_EVENT".into()),
        |options| options.mask(),
    )?;
    builder.variable_to_event_id(
        Variable::Aspect("BRAKE LEFT FORCE FACTOR".into()),
        VariableToEventMapping::EventData32kPosition,
        VariableToEventWriteOn::EveryTick,
        axis_left_brake_set_event_id,
    );
    let axis_right_brake_set_event_id = builder.event_to_variable(
        "AXIS_RIGHT_BRAKE_SET",
        EventToVariableMapping::EventData32kPosition,
        Variable::Aspect("BRAKES_RIGHT_EVENT".into()),
        |options| options.mask(),
    )?;
    builder.variable_to_event_id(
        Variable::Aspect("BRAKE RIGHT FORCE FACTOR".into()),
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
        Variable::Aspect("BRAKES".into()),
        |options| options.mask(),
    )?;
    builder.event_to_variable(
        "BRAKES_LEFT",
        EventToVariableMapping::SmoothPress(KEYBOARD_PRESS_SPEED, KEYBOARD_RELEASE_SPEED),
        Variable::Aspect("BRAKES_LEFT".into()),
        |options| options.mask(),
    )?;
    builder.event_to_variable(
        "BRAKES_RIGHT",
        EventToVariableMapping::SmoothPress(KEYBOARD_PRESS_SPEED, KEYBOARD_RELEASE_SPEED),
        Variable::Aspect("BRAKES_RIGHT".into()),
        |options| options.mask(),
    )?;

    // The maximum braking demand of all controller inputs
    // is calculated and made available as a percentage.
    builder.reduce(
        ExecuteOn::PreTick,
        vec![
            Variable::Aspect("BRAKES".into()),
            Variable::Aspect("BRAKES_LEFT".into()),
            Variable::Aspect("BRAKES_LEFT_EVENT".into()),
        ],
        0.,
        to_percent_max,
        Variable::Named("LEFT_BRAKE_PEDAL_INPUT".into()),
    );
    builder.reduce(
        ExecuteOn::PreTick,
        vec![
            Variable::Aspect("BRAKES".into()),
            Variable::Aspect("BRAKES_RIGHT".into()),
            Variable::Aspect("BRAKES_RIGHT_EVENT".into()),
        ],
        0.,
        to_percent_max,
        Variable::Named("RIGHT_BRAKE_PEDAL_INPUT".into()),
    );

    Ok(())
}

fn to_percent_max(accumulator: f64, item: f64) -> f64 {
    max(accumulator, item * 100.)
}
