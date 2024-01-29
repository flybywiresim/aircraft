#[cfg(not(target_arch = "wasm32"))]
use crate::msfs::legacy::execute_calculator_code;
#[cfg(target_arch = "wasm32")]
use msfs::legacy::execute_calculator_code;
use systems::shared::to_bool;

use crate::{ExecuteOn, MsfsAspectBuilder, Variable};
use std::error::Error;

pub(super) fn wing_anti_ice() -> impl FnOnce(&mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    move |builder: &mut MsfsAspectBuilder| {
        builder.on_change(
            ExecuteOn::PostTick,
            vec![Variable::named("PNEU_WING_ANTI_ICE_SYSTEM_ON")],
            Box::new(move |prev_values, new_values| {
                let prev_wing_anti_ice_on = to_bool(prev_values[0]);
                let new_wing_anti_ice_on = to_bool(new_values[0]);

                if new_wing_anti_ice_on != prev_wing_anti_ice_on {
                    execute_calculator_code::<()>("(>K:TOGGLE_STRUCTURAL_DEICE)");
                }
            }),
        );

        Ok(())
    }
}
