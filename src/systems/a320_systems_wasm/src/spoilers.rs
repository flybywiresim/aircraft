use std::error::Error;
use systems_wasm::aspects::{ExecuteOn, MsfsAspectBuilder};
use systems_wasm::Variable;

pub(super) fn spoilers(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    builder.map(
        ExecuteOn::PreTick,
        Variable::named("SPOILERS_LEFT_DEFLECTION_DEMAND"),
        |value| value,
        Variable::aspect("HYD_SPOILER_1_LEFT_DEMAND"),
    );
    builder.map(
        ExecuteOn::PreTick,
        Variable::named("SPOILERS_LEFT_DEFLECTION_DEMAND"),
        |value| value,
        Variable::aspect("HYD_SPOILER_2_LEFT_DEMAND"),
    );
    builder.map(
        ExecuteOn::PreTick,
        Variable::named("SPOILERS_LEFT_DEFLECTION_DEMAND"),
        |value| value,
        Variable::aspect("HYD_SPOILER_3_LEFT_DEMAND"),
    );
    builder.map(
        ExecuteOn::PreTick,
        Variable::named("SPOILERS_LEFT_DEFLECTION_DEMAND"),
        |value| value,
        Variable::aspect("HYD_SPOILER_4_LEFT_DEMAND"),
    );
    builder.map(
        ExecuteOn::PreTick,
        Variable::named("SPOILERS_LEFT_DEFLECTION_DEMAND"),
        |value| value,
        Variable::aspect("HYD_SPOILER_5_LEFT_DEMAND"),
    );

    builder.map(
        ExecuteOn::PreTick,
        Variable::named("SPOILERS_RIGHT_DEFLECTION_DEMAND"),
        |value| value,
        Variable::aspect("HYD_SPOILER_1_RIGHT_DEMAND"),
    );
    builder.map(
        ExecuteOn::PreTick,
        Variable::named("SPOILERS_RIGHT_DEFLECTION_DEMAND"),
        |value| value,
        Variable::aspect("HYD_SPOILER_2_RIGHT_DEMAND"),
    );
    builder.map(
        ExecuteOn::PreTick,
        Variable::named("SPOILERS_RIGHT_DEFLECTION_DEMAND"),
        |value| value,
        Variable::aspect("HYD_SPOILER_3_RIGHT_DEMAND"),
    );
    builder.map(
        ExecuteOn::PreTick,
        Variable::named("SPOILERS_RIGHT_DEFLECTION_DEMAND"),
        |value| value,
        Variable::aspect("HYD_SPOILER_4_RIGHT_DEMAND"),
    );
    builder.map(
        ExecuteOn::PreTick,
        Variable::named("SPOILERS_RIGHT_DEFLECTION_DEMAND"),
        |value| value,
        Variable::aspect("HYD_SPOILER_5_RIGHT_DEMAND"),
    );

    builder.map_many(
        ExecuteOn::PostTick,
        vec![
            Variable::aspect("HYD_SPOIL_1_LEFT_DEFLECTION"),
            Variable::aspect("HYD_SPOIL_2_LEFT_DEFLECTION"),
            Variable::aspect("HYD_SPOIL_3_LEFT_DEFLECTION"),
            Variable::aspect("HYD_SPOIL_4_LEFT_DEFLECTION"),
            Variable::aspect("HYD_SPOIL_5_LEFT_DEFLECTION"),
        ],
        |values| values.iter().sum::<f64>() / (values.len() as f64),
        Variable::named("HYD_SPOILERS_LEFT_DEFLECTION"),
    );

    builder.map_many(
        ExecuteOn::PostTick,
        vec![
            Variable::aspect("HYD_SPOIL_1_RIGHT_DEFLECTION"),
            Variable::aspect("HYD_SPOIL_2_RIGHT_DEFLECTION"),
            Variable::aspect("HYD_SPOIL_3_RIGHT_DEFLECTION"),
            Variable::aspect("HYD_SPOIL_4_RIGHT_DEFLECTION"),
            Variable::aspect("HYD_SPOIL_5_RIGHT_DEFLECTION"),
        ],
        |values| values.iter().sum::<f64>() / (values.len() as f64),
        Variable::named("HYD_SPOILERS_RIGHT_DEFLECTION"),
    );

    Ok(())
}
