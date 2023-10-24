#[cfg(not(target_arch = "wasm32"))]
use crate::msfs::legacy::execute_calculator_code;
#[cfg(target_arch = "wasm32")]
use msfs::legacy::execute_calculator_code;
use systems::shared::to_bool;

use crate::{ExecuteOn, MsfsAspectBuilder, Variable};
use std::error::Error;

pub(super) fn engines(
    engine_count: usize,
) -> impl FnOnce(&mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    move |builder: &mut MsfsAspectBuilder| {
        for engine_number in 1..=engine_count {
            let starter_pressurized_variable =
                Variable::named(&format!("PNEU_ENG_{}_STARTER_PRESSURIZED", engine_number));

            builder.init_variable(starter_pressurized_variable.clone(), 0.);
            builder.on_change(
                ExecuteOn::PostTick,
                vec![
                    starter_pressurized_variable,
                    Variable::aircraft("BLEED AIR ENGINE", "bool", engine_number),
                ],
                Box::new(move |_, values| {
                    let sim_engine_start_allowed = to_bool(values[0]);
                    let is_sim_bleed_air_active = to_bool(values[1]);

                    if sim_engine_start_allowed != is_sim_bleed_air_active {
                        toggle_sim_engine_bleed_air(engine_number);
                    }
                }),
            );
        }

        Ok(())
    }
}

fn toggle_sim_engine_bleed_air(engine_number: usize) {
    execute_calculator_code::<()>(&format!(
        "{} (>K:ENGINE_BLEED_AIR_SOURCE_TOGGLE)",
        engine_number
    ));
}
