use std::error::Error;

use msfs::sim_connect;
use msfs::{sim_connect::SimConnect, sim_connect::SIMCONNECT_OBJECT_ID_USER};

use systems_wasm::aspects::{ExecuteOn, MsfsAspectBuilder, ObjectWrite, VariablesToObject};
use systems_wasm::{set_data_on_sim_object, Variable};

pub(super) fn payload(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    for i in 1..=8 {
        builder.copy(
            Variable::aircraft("PAYLOAD STATION WEIGHT", "POUNDS", i),
            Variable::aspect(&format!("PAYLOAD_STATION_{i}_REQ")),
        );

        builder.map_many(
            ExecuteOn::PostTick,
            vec![
                Variable::aspect(&format!("PAYLOAD_STATION_{i}_REQ")),
                //  Variable::named("BOARDING_STARTED_BY_USR"),
                //  Variable::named("FSDT_GSX_BOARDING_STATE"),
            ],
            |values| values[0],
            //|values| values[1] > 0. || values[2] >= 4. && values[2] < 6.,
            Variable::aircraft("PAYLOAD STATION WEIGHT", "POUNDS", i),
        );
    }

    Ok(())
}
