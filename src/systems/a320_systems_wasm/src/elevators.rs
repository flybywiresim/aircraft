use std::error::Error;
use systems_wasm::aspects::{ExecuteOn, MsfsAspectBuilder};
use systems_wasm::Variable;

pub(super) fn elevators(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    builder.map(
        ExecuteOn::PreTick,
        Variable::aircraft("ELEVATOR DEFLECTION PCT", "Percent", 0),
        |value| (value / 100. + 0.72) / 1.72,
        Variable::aspect("HYD_ELEVATOR_DEMAND"),
    );

    builder.map(
        ExecuteOn::PostTick,
        Variable::aspect("HYD_ELEV_LEFT_DEFLECTION"),
        |value| value * 1.72 - 0.72,
        Variable::named("HYD_ELEVATOR_LEFT_DEFLECTION"),
    );
    builder.map(
        ExecuteOn::PostTick,
        Variable::aspect("HYD_ELEV_RIGHT_DEFLECTION"),
        |value| value * 1.72 - 0.72,
        Variable::named("HYD_ELEVATOR_RIGHT_DEFLECTION"),
    );

    Ok(())
}
