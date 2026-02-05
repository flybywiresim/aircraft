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

    Ok(())
}
