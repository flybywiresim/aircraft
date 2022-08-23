use std::error::Error;

use systems::shared::to_bool;
use systems_wasm::aspects::{ExecuteOn, MsfsAspectBuilder, ObjectWrite, VariablesToObject};

use msfs::sim_connect;
use msfs::{sim_connect::SimConnect, sim_connect::SIMCONNECT_OBJECT_ID_USER};
use systems_wasm::{set_data_on_sim_object, Variable};

pub(super) fn rudder(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    builder.map(
        ExecuteOn::PreTick,
        Variable::named("RUDDER_DEFLECTION_DEMAND"),
        |value| (value + 1.) / 2.,
        Variable::aspect("HYD_RUDDER_DEMAND"),
    );

    builder.map(
        ExecuteOn::PostTick,
        Variable::aspect("HYD_RUD_DEFLECTION"),
        |value| 100. * (value * 2. - 1.),
        Variable::named("HYD_RUDDER_DEFLECTION"),
    );

    // AILERON POSITION FEEDBACK TO SIM
    builder.map(
        ExecuteOn::PostTick,
        Variable::aspect("HYD_RUD_DEFLECTION"),
        |value| value * 2. - 1.,
        Variable::aspect("HYD_FINAL_RUDDER_FEEDBACK"),
    );

    builder.variables_to_object(Box::new(YawSimOutput { rudder: 0. }));

    Ok(())
}

#[sim_connect::data_definition]
struct YawSimOutput {
    #[name = "RUDDER POSITION"]
    #[unit = "Position"]
    rudder: f64,
}
impl VariablesToObject for YawSimOutput {
    fn variables(&self) -> Vec<Variable> {
        vec![
            Variable::aspect("HYD_FINAL_RUDDER_FEEDBACK"),
            Variable::named("FLIGHT_CONTROLS_TRACKING_MODE"),
        ]
    }

    fn write(&mut self, values: Vec<f64>) -> ObjectWrite {
        self.rudder = values[0];

        // Not writing control feedback when in tracking mode
        ObjectWrite::on(!to_bool(values[1]))
    }

    set_data_on_sim_object!();
}
