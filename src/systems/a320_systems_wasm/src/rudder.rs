use std::error::Error;
use systems_wasm::aspects::{ExecuteOn, MsfsAspectBuilder};
use systems_wasm::Variable;

pub(super) fn rudder(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    builder.map(
        ExecuteOn::PreTick,
        Variable::aircraft("RUDDER DEFLECTION PCT", "Percent", 0),
        |value| (value / 100. + 1.) / 2.,
        Variable::aspect("HYD_RUDDER_DEMAND"),
    );

    builder.map(
        ExecuteOn::PostTick,
        Variable::aspect("HYD_RUD_DEFLECTION"),
        |value| 100. * (value * 2. - 1.),
        Variable::named("HYD_RUDDER_DEFLECTION"),
    );

    Ok(())
}
