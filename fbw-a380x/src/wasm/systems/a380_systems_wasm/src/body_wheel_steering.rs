use std::error::Error;

use systems::shared::normalise_angle;
use systems_wasm::aspects::{ExecuteOn, MsfsAspectBuilder};
use systems_wasm::Variable;

pub(super) fn body_wheel_steering(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    builder.map(
        ExecuteOn::PostTick,
        Variable::aspect("LEFT_BODY_STEERING_POSITION_RATIO"),
        |value| -value / 2. + 0.5,
        Variable::named("LEFT_BODY_WHEEL_STEERING_POSITION"),
    );
    builder.map(
        ExecuteOn::PostTick,
        Variable::aspect("RIGHT_BODY_STEERING_POSITION_RATIO"),
        |value| -value / 2. + 0.5,
        Variable::named("RIGHT_BODY_WHEEL_STEERING_POSITION"),
    );

    // Rear steering wheel animations
    // Adds rotational speed to bws wheel based on steering angle
    const REAR_STEERING_RATIO_TO_WHEEL_ANGLE_GAIN: f64 = 40.;
    builder.map_many(
        ExecuteOn::PostTick,
        vec![
            Variable::named("LEFT_BODY_WHEEL_STEERING_POSITION"),
            Variable::aircraft("LEFT WHEEL ROTATION ANGLE", "degree", 0),
        ],
        |values| {
            normalise_angle(values[1] + (values[0] - 0.5) * REAR_STEERING_RATIO_TO_WHEEL_ANGLE_GAIN)
        },
        Variable::named("LEFT_BODY_WHEEL_STEERING_RIGHT_ANIM_ANGLE"),
    );
    builder.map_many(
        ExecuteOn::PostTick,
        vec![
            Variable::named("LEFT_BODY_WHEEL_STEERING_POSITION"),
            Variable::aircraft("LEFT WHEEL ROTATION ANGLE", "degree", 0),
        ],
        |values| {
            normalise_angle(values[1] - (values[0] - 0.5) * REAR_STEERING_RATIO_TO_WHEEL_ANGLE_GAIN)
        },
        Variable::named("LEFT_BODY_WHEEL_STEERING_LEFT_ANIM_ANGLE"),
    );

    // Adds rotational speed to bws wheel based on steering angle
    builder.map_many(
        ExecuteOn::PostTick,
        vec![
            Variable::named("RIGHT_BODY_WHEEL_STEERING_POSITION"),
            Variable::aircraft("RIGHT WHEEL ROTATION ANGLE", "degree", 0),
        ],
        |values| {
            normalise_angle(values[1] + (values[0] - 0.5) * REAR_STEERING_RATIO_TO_WHEEL_ANGLE_GAIN)
        },
        Variable::named("RIGHT_BODY_WHEEL_STEERING_RIGHT_ANIM_ANGLE"),
    );
    builder.map_many(
        ExecuteOn::PostTick,
        vec![
            Variable::named("RIGHT_BODY_WHEEL_STEERING_POSITION"),
            Variable::aircraft("RIGHT WHEEL ROTATION ANGLE", "degree", 0),
        ],
        |values| {
            normalise_angle(values[1] - (values[0] - 0.5) * REAR_STEERING_RATIO_TO_WHEEL_ANGLE_GAIN)
        },
        Variable::named("RIGHT_BODY_WHEEL_STEERING_LEFT_ANIM_ANGLE"),
    );

    Ok(())
}
