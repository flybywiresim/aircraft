use std::error::Error;
use std::time::Duration;

use systems_wasm::aspects::{
    EventToVariableMapping, ExecuteOn, MsfsAspectBuilder, ObjectWrite, VariablesToObject,
};
use systems_wasm::{set_data_on_sim_object, Variable};

use systems::shared::to_bool;

use msfs::sim_connect;
use msfs::{sim_connect::SimConnect, sim_connect::SIMCONNECT_OBJECT_ID_USER};

pub(super) fn flight_warning(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    builder.event_to_variable(
        "MASTER_CAUTION_ACKNOWLEDGE",
        EventToVariableMapping::Value(1.),
        Variable::named("FWS_MC_CANCEL_ACKNOWLEDGE"),
        |options| options.afterwards_reset_to(0.),
    )?;

    builder.event_to_variable(
        "MASTER_WARNING_ACKNOWLEDGE",
        EventToVariableMapping::Value(1.),
        Variable::named("FWS_MW_CANCEL_ACKNOWLEDGE"),
        |options| options.afterwards_reset_to(0.),
    )?;

    Ok(())
}
