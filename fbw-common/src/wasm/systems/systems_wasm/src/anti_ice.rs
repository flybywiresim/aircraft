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
            vec![
                Variable::named("PNEU_WING_ANTI_ICE_SYSTEM_ON"),
                Variable::named("PNEU_WING_ANTI_ICE_HAS_FAULT"),
                Variable::aircraft("STRUCTURAL DEICE SWITCH", "Bool", 0),
            ],
            Box::new(move |prev_values, new_values| {
                let was_wing_anti_ice_on = to_bool(prev_values[0]) && !to_bool(prev_values[1]);
                let is_wing_anti_ice_on_now = to_bool(new_values[0]) && !to_bool(new_values[1]);
                let is_now_deicing = to_bool(new_values[2]);

                let has_wing_anti_ice_changed = was_wing_anti_ice_on != is_wing_anti_ice_on_now;
                let structural_anti_ice_disagrees = is_now_deicing != is_wing_anti_ice_on_now;

                if has_wing_anti_ice_changed && structural_anti_ice_disagrees {
                    execute_calculator_code::<()>("(>K:TOGGLE_STRUCTURAL_DEICE)");
                }
            }),
        );

        Ok(())
    }
}
