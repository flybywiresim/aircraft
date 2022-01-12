use std::error::Error;
use systems::shared::to_bool;
use systems_wasm::aspects::{
    EventToVariableMapping, MsfsAspectBuilder, UpdateOn, VariableToEventMapping,
    VariableToEventWriteOn,
};
use systems_wasm::Variable;

pub(super) fn nose_wheel_steering(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    // The rudder pedals should start in a centered position.
    builder.init_variable(Variable::Aspect("RAW_RUDDER_PEDAL_POSITION".into()), 0.5);

    builder.map(
        UpdateOn::PreTick,
        Variable::Named("RUDDER_PEDAL_POSITION".into()),
        |value| ((value + 100.) / 200.),
        Variable::Aspect("RAW_RUDDER_PEDAL_POSITION".into()),
    );

    builder.map_many(
        UpdateOn::PostTick,
        vec![
            Variable::Named("REALISTIC_TILLER_ENABLED".into()),
            Variable::Aspect("RAW_RUDDER_PEDAL_POSITION".into()),
        ],
        |values| {
            let realistic_tiller_enabled = to_bool(values[0]);
            let rudder_pedal_position = values[1];
            if realistic_tiller_enabled {
                // Convert rudder pedal position to [-1;1], -1 is left
                rudder_pedal_position * 2. - 1.
            } else {
                0.
            }
        },
        Variable::Named("RUDDER_PEDAL_POSITION".into()),
    );

    // The tiller handle should start in a centered position.
    builder.init_variable(Variable::Aspect("RAW_TILLER_HANDLE_POSITION".into()), 0.5);

    // Lacking a better event to bind to, we've picked a mixture axis for setting the
    // tiller handle position.
    builder.event_to_variable(
        "AXIS_MIXTURE4_SET",
        EventToVariableMapping::EventData32kPosition,
        Variable::Aspect("RAW_TILLER_HANDLE_POSITION".into()),
        |options| options.mask(),
    )?;

    const TILLER_KEYBOARD_INCREMENTS: f64 = 0.05;
    builder.event_to_variable(
        "STEERING_INC",
        EventToVariableMapping::CurrentValueToValue(|current_value| {
            recenter_when_close_to_center(
                (current_value + TILLER_KEYBOARD_INCREMENTS).min(1.),
                TILLER_KEYBOARD_INCREMENTS,
            )
        }),
        Variable::Aspect("RAW_TILLER_HANDLE_POSITION".into()),
        |options| options.mask(),
    )?;
    builder.event_to_variable(
        "STEERING_DEC",
        EventToVariableMapping::CurrentValueToValue(|current_value| {
            recenter_when_close_to_center(
                (current_value - TILLER_KEYBOARD_INCREMENTS).max(0.),
                TILLER_KEYBOARD_INCREMENTS,
            )
        }),
        Variable::Aspect("RAW_TILLER_HANDLE_POSITION".into()),
        |options| options.mask(),
    )?;

    builder.map_many(
        UpdateOn::PostTick,
        vec![
            Variable::Named("REALISTIC_TILLER_ENABLED".into()),
            Variable::Aspect("RAW_RUDDER_PEDAL_POSITION".into()),
            Variable::Aspect("RAW_TILLER_HANDLE_POSITION".into()),
            Variable::Aspect("TILLER_PEDAL_DISCONNECT".into()),
        ],
        |values| {
            let realistic_tiller_enabled = to_bool(values[0]);
            let rudder_pedal_position = values[1];
            let tiller_handle_position = values[2];
            let tiller_pedal_disconnect = to_bool(values[3]);

            if realistic_tiller_enabled {
                // Convert tiller handle position to [-1;1], -1 is left
                tiller_handle_position * 2. - 1.
            } else {
                if !tiller_pedal_disconnect {
                    // Convert rudder pedal position to [-1;1], -1 is left
                    rudder_pedal_position * 2. - 1.
                } else {
                    0.
                }
            }
        },
        Variable::Named("TILLER_HANDLE_POSITION".into()),
    );

    // Lacking a better event to bind to, we've picked the toggle water rudder event for
    // disconnecting the rudder pedals via the PEDALS DISC button on the tiller.
    builder.event_to_variable(
        "TOGGLE_WATER_RUDDER",
        EventToVariableMapping::Value(1.),
        Variable::Aspect("TILLER_PEDAL_DISCONNECT".into()),
        |options| options.mask().after_tick_set_to(0.),
    )?;

    builder.init_variable(Variable::Aspect("RUDDER_POSITION_RAW".into()), 0.5);

    builder.map(
        UpdateOn::PreTick,
        Variable::Aircraft("RUDDER POSITION".into(), "Position".into(), 0),
        |value| value + 1. / 2.,
        Variable::Aspect("RUDDER_POSITION_RAW".into()),
    );

    builder.map(
        UpdateOn::PostTick,
        Variable::Aspect("NOSE_WHEEL_POSITION_RAW".into()),
        steering_animation_to_msfs_from_steering_angle,
        Variable::Named("NOSE_WHEEL_POSITION".into()),
    );

    builder.map_many(
        UpdateOn::PostTick,
        vec![
            Variable::Aspect("NOSE_WHEEL_POSITION_RAW".into()),
            Variable::Aspect("RUDDER_POSITION_RAW".into()),
        ],
        |values| {
            let nose_wheel_position = values[0];
            let rudder_position = values[1];

            steering_demand_to_msfs_from_steering_angle(nose_wheel_position, rudder_position)
        },
        Variable::Aspect("STEERING_ANGLE".into()),
    );

    builder.variable_to_event(
        Variable::Aspect("STEERING_ANGLE".into()),
        VariableToEventMapping::EventData32kPosition,
        VariableToEventWriteOn::EveryTick,
        "STEERING_SET",
    )?;

    Ok(())
}

fn recenter_when_close_to_center(value: f64, increment: f64) -> f64 {
    if value < 0.5 + increment && value > 0.5 - increment {
        0.5
    } else {
        value
    }
}

const MAX_CONTROLLABLE_STEERING_ANGLE_DEGREES: f64 = 75.;

fn steering_animation_to_msfs_from_steering_angle(nose_wheel_position: f64) -> f64 {
    const STEERING_ANIMATION_TOTAL_RANGE_DEGREES: f64 = 360.;

    ((nose_wheel_position * MAX_CONTROLLABLE_STEERING_ANGLE_DEGREES
        / (STEERING_ANIMATION_TOTAL_RANGE_DEGREES / 2.))
        / 2.)
        + 0.5
}

fn steering_demand_to_msfs_from_steering_angle(
    nose_wheel_position: f64,
    rudder_position: f64,
) -> f64 {
    const MAX_MSFS_STEERING_ANGLE_DEGREES: f64 = 90.;

    // Steering in msfs is the max we want rescaled to the max in msfs
    let steering_ratio_converted = nose_wheel_position * MAX_CONTROLLABLE_STEERING_ANGLE_DEGREES
        / MAX_MSFS_STEERING_ANGLE_DEGREES
        / 2.
        + 0.5;

    // Steering demand is reverted in msfs so we do 1 - angle.
    // Then we hack msfs by adding the rudder value that it will always substract internally
    // This way we end up with actual angle we required
    (1. - steering_ratio_converted) + (rudder_position - 0.5)
}
