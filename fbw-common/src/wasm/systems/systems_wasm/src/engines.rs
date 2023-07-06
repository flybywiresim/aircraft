#[cfg(not(target_arch = "wasm32"))]
use crate::msfs::legacy::execute_calculator_code;
#[cfg(target_arch = "wasm32")]
use msfs::legacy::execute_calculator_code;
use systems::shared::to_bool;

use crate::{ExecuteOn, MsfsAspectBuilder, Variable};
use std::error::Error;

pub fn engines(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    for engine_number in 1..=2 {
        builder.on_change(
            ExecuteOn::PostTick,
            vec![
                Variable::named(&format!(
                    "PNEU_ENG_{}_STARTER_CONTAINER_PRESSURE",
                    engine_number
                )),
                Variable::aircraft("BLEED AIR ENGINE", "bool", engine_number),
            ],
            Box::new(move |_, values| {
                let starter_pressure_psi = values[0];
                let is_sim_bleed_air_active = to_bool(values[1]);

                // These values are very arbitrary. Whether crossbleed starts work or not is binary for now,
                // until we have a custom engine model
                if starter_pressure_psi > 30. && !is_sim_bleed_air_active {
                    toggle_sim_engine_bleed_air(engine_number);
                    println!("Opening bleed starter valve")
                } else if starter_pressure_psi < 20. && is_sim_bleed_air_active {
                    toggle_sim_engine_bleed_air(engine_number);
                    println!("Closing bleed starter valve")
                }
            }),
        );
    }

    Ok(())
}

fn toggle_sim_engine_bleed_air(engine_number: usize) {
    execute_calculator_code::<()>(&format!(
        "{} (>K:ENGINE_BLEED_AIR_SOURCE_TOGGLE)",
        engine_number
    ));
}
