use std::error::Error;

use systems_wasm::{
    aspects::{ExecuteOn, MsfsAspectBuilder},
    Variable,
};

pub(super) fn cargo_doors(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    builder.map(
        ExecuteOn::PreTick,
        Variable::aircraft("INTERACTIVE POINT OPEN", "Position", 16),
        |value| if value > 0. { 1. } else { 0. },
        Variable::aspect("FWD_DOOR_CARGO_OPEN_REQ"),
    );

    // For now we open AFT door if we have MSFS requiring AFT OR FWD interactive point opening
    builder.map_many(
        ExecuteOn::PreTick,
        vec![
            Variable::aircraft("INTERACTIVE POINT OPEN", "Position", 16),
            Variable::aircraft("INTERACTIVE POINT OPEN", "Position", 17),
        ],
        |values| {
            if values[0] > 0. || values[1] > 0. {
                1.
            } else {
                0.
            }
        },
        Variable::aspect("AFT_DOOR_CARGO_OPEN_REQ"),
    );

    Ok(())
}
