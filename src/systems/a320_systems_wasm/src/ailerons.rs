use std::error::Error;
use systems::shared::{from_bool, to_bool};
use systems_wasm::aspects::{
    max, EventToVariableMapping, ExecuteOn, MsfsAspectBuilder, VariableToEventMapping,
    VariableToEventWriteOn,
};
use systems_wasm::Variable;

pub(super) fn ailerons(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    // Inputs from FBW becomes the aileron position demand for hydraulic system
    // MSFS uses [-1;1] ranges, and Left aileron UP is -1 while right aileron UP is 1
    // Systems use [0;1], 1 is UP
    builder.map(
        ExecuteOn::PreTick,
        Variable::named("3D_AILERON_LEFT_DEFLECTION"),
        |value| (-value + 1.) / 2.,
        Variable::aspect("HYD_AILERON_LEFT_DEMAND"),
    );
    builder.map(
        ExecuteOn::PreTick,
        Variable::named("3D_AILERON_RIGHT_DEFLECTION"),
        |value| (value + 1.) / 2.,
        Variable::aspect("HYD_AILERON_RIGHT_DEMAND"),
    );

    // Aileron positions returned by hydraulic system are converted to MSFS format
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
