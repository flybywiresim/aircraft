use std::error::Error;
use systems_wasm::aspects::{ExecuteOn, MsfsAspectBuilder};
use systems_wasm::Variable;

pub(super) fn spoilers(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    builder.map_many(
        ExecuteOn::PostTick,
        vec![
            Variable::named("HYD_SPOILER_1_LEFT_DEFLECTION"),
            Variable::named("HYD_SPOILER_2_LEFT_DEFLECTION"),
            Variable::named("HYD_SPOILER_3_LEFT_DEFLECTION"),
            Variable::named("HYD_SPOILER_4_LEFT_DEFLECTION"),
            Variable::named("HYD_SPOILER_5_LEFT_DEFLECTION"),
            Variable::named("HYD_SPOILER_6_LEFT_DEFLECTION"),
            Variable::named("HYD_SPOILER_7_LEFT_DEFLECTION"),
            Variable::named("HYD_SPOILER_8_LEFT_DEFLECTION"),
        ],
        |values| values.iter().sum::<f64>() / (values.len() as f64),
        Variable::named("HYD_SPOILERS_LEFT_DEFLECTION"),
    );

    builder.map_many(
        ExecuteOn::PostTick,
        vec![
            Variable::named("HYD_SPOILER_1_RIGHT_DEFLECTION"),
            Variable::named("HYD_SPOILER_2_RIGHT_DEFLECTION"),
            Variable::named("HYD_SPOILER_3_RIGHT_DEFLECTION"),
            Variable::named("HYD_SPOILER_4_RIGHT_DEFLECTION"),
            Variable::named("HYD_SPOILER_5_RIGHT_DEFLECTION"),
            Variable::named("HYD_SPOILER_6_RIGHT_DEFLECTION"),
            Variable::named("HYD_SPOILER_7_RIGHT_DEFLECTION"),
            Variable::named("HYD_SPOILER_8_RIGHT_DEFLECTION"),
        ],
        |values| values.iter().sum::<f64>() / (values.len() as f64),
        Variable::named("HYD_SPOILERS_RIGHT_DEFLECTION"),
    );

    // FIX ME: Remove this section once spoiler animation is back to linear in the model
    builder.map(
        ExecuteOn::PostTick,
        Variable::named("HYD_SPOILER_1_LEFT_DEFLECTION"),
        unsmooth_spoiler_animation,
        Variable::named("HYD_SPOILER_1_LEFT_DEFLECTION_UNSMOOTH"),
    );
    builder.map(
        ExecuteOn::PostTick,
        Variable::named("HYD_SPOILER_2_LEFT_DEFLECTION"),
        unsmooth_spoiler_animation,
        Variable::named("HYD_SPOILER_2_LEFT_DEFLECTION_UNSMOOTH"),
    );
    builder.map(
        ExecuteOn::PostTick,
        Variable::named("HYD_SPOILER_3_LEFT_DEFLECTION"),
        unsmooth_spoiler_animation,
        Variable::named("HYD_SPOILER_3_LEFT_DEFLECTION_UNSMOOTH"),
    );
    builder.map(
        ExecuteOn::PostTick,
        Variable::named("HYD_SPOILER_4_LEFT_DEFLECTION"),
        unsmooth_spoiler_animation,
        Variable::named("HYD_SPOILER_4_LEFT_DEFLECTION_UNSMOOTH"),
    );
    builder.map(
        ExecuteOn::PostTick,
        Variable::named("HYD_SPOILER_5_LEFT_DEFLECTION"),
        unsmooth_spoiler_animation,
        Variable::named("HYD_SPOILER_5_LEFT_DEFLECTION_UNSMOOTH"),
    );
    builder.map(
        ExecuteOn::PostTick,
        Variable::named("HYD_SPOILER_6_LEFT_DEFLECTION"),
        unsmooth_spoiler_animation,
        Variable::named("HYD_SPOILER_6_LEFT_DEFLECTION_UNSMOOTH"),
    );
    builder.map(
        ExecuteOn::PostTick,
        Variable::named("HYD_SPOILER_7_LEFT_DEFLECTION"),
        unsmooth_spoiler_animation,
        Variable::named("HYD_SPOILER_7_LEFT_DEFLECTION_UNSMOOTH"),
    );
    builder.map(
        ExecuteOn::PostTick,
        Variable::named("HYD_SPOILER_8_LEFT_DEFLECTION"),
        unsmooth_spoiler_animation,
        Variable::named("HYD_SPOILER_8_LEFT_DEFLECTION_UNSMOOTH"),
    );

    builder.map(
        ExecuteOn::PostTick,
        Variable::named("HYD_SPOILER_1_RIGHT_DEFLECTION"),
        unsmooth_spoiler_animation,
        Variable::named("HYD_SPOILER_1_RIGHT_DEFLECTION_UNSMOOTH"),
    );
    builder.map(
        ExecuteOn::PostTick,
        Variable::named("HYD_SPOILER_2_RIGHT_DEFLECTION"),
        unsmooth_spoiler_animation,
        Variable::named("HYD_SPOILER_2_RIGHT_DEFLECTION_UNSMOOTH"),
    );
    builder.map(
        ExecuteOn::PostTick,
        Variable::named("HYD_SPOILER_3_RIGHT_DEFLECTION"),
        unsmooth_spoiler_animation,
        Variable::named("HYD_SPOILER_3_RIGHT_DEFLECTION_UNSMOOTH"),
    );
    builder.map(
        ExecuteOn::PostTick,
        Variable::named("HYD_SPOILER_4_RIGHT_DEFLECTION"),
        unsmooth_spoiler_animation,
        Variable::named("HYD_SPOILER_4_RIGHT_DEFLECTION_UNSMOOTH"),
    );
    builder.map(
        ExecuteOn::PostTick,
        Variable::named("HYD_SPOILER_5_RIGHT_DEFLECTION"),
        unsmooth_spoiler_animation,
        Variable::named("HYD_SPOILER_5_RIGHT_DEFLECTION_UNSMOOTH"),
    );
    builder.map(
        ExecuteOn::PostTick,
        Variable::named("HYD_SPOILER_6_RIGHT_DEFLECTION"),
        unsmooth_spoiler_animation,
        Variable::named("HYD_SPOILER_6_RIGHT_DEFLECTION_UNSMOOTH"),
    );
    builder.map(
        ExecuteOn::PostTick,
        Variable::named("HYD_SPOILER_7_RIGHT_DEFLECTION"),
        unsmooth_spoiler_animation,
        Variable::named("HYD_SPOILER_7_RIGHT_DEFLECTION_UNSMOOTH"),
    );
    builder.map(
        ExecuteOn::PostTick,
        Variable::named("HYD_SPOILER_8_RIGHT_DEFLECTION"),
        unsmooth_spoiler_animation,
        Variable::named("HYD_SPOILER_8_RIGHT_DEFLECTION_UNSMOOTH"),
    );

    Ok(())
}

// TODO This is a quick fix: Remove once spoiler animation is back to fully linear
fn unsmooth_spoiler_animation(raw_value: f64) -> f64 {
    let gain = (1. / (1.7 * (raw_value + 0.2))).clamp(1., 3.);

    raw_value * gain
}
