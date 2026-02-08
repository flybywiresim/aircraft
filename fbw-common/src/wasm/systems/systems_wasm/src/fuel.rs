use crate::{aspects::MsfsAspectBuilder, Variable};
use std::error::Error;

pub(super) fn fuel_pumps(
    pump_indexes: impl IntoIterator<Item = u32>,
) -> impl FnOnce(&mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    move |builder| {
        for pump_index in pump_indexes {
            builder.copy(
                Variable::aircraft("FUELSYSTEM PUMP ACTIVE", "Bool", pump_index as _),
                Variable::aspect(&format!("FUEL_PUMP_{pump_index}_ACTIVE")),
            );
        }
        Ok(())
    }
}
