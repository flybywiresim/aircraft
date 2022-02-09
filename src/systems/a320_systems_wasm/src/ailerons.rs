use std::error::Error;
use systems_wasm::aspects::{ExecuteOn, MsfsAspectBuilder};
use systems_wasm::Variable;

pub(super) fn ailerons(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    // Inputs from FBW becomes the aileron position demand for hydraulic system
    // MSFS uses [-1;1] ranges, and Left aileron UP is -1 while right aileron UP is 1
    // Systems use [0;1], 1 is UP
    builder.map(
        ExecuteOn::PreTick,
        Variable::named("AILERON_LEFT_DEFLECTION_DEMAND"),
        |value| (-value + 1.) / 2.,
        Variable::aspect("HYD_AILERON_LEFT_DEMAND"),
    );
    builder.map(
        ExecuteOn::PreTick,
        Variable::named("AILERON_RIGHT_DEFLECTION_DEMAND"),
        |value| (value + 1.) / 2.,
        Variable::aspect("HYD_AILERON_RIGHT_DEMAND"),
    );

    // Aileron positions returned by hydraulic system are converted to MSFS format
    // It means we just invert left side direction and do [0;1] -> [-1;1]
    builder.map(
        ExecuteOn::PostTick,
        Variable::aspect("HYD_AIL_LEFT_DEFLECTION"),
        |value| -1. * (value * 2. - 1.),
        Variable::named("HYD_AILERON_LEFT_DEFLECTION"),
    );
    builder.map(
        ExecuteOn::PostTick,
        Variable::aspect("HYD_AIL_RIGHT_DEFLECTION"),
        |value| (value * 2. - 1.),
        Variable::named("HYD_AILERON_RIGHT_DEFLECTION"),
    );

    Ok(())
}
