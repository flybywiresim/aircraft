use std::error::Error;

use systems_wasm::aspects::{MsfsAspectBuilder, ObjectWrite, VariablesToObject};
use systems_wasm::{set_data_on_sim_object, Variable};

use systems::shared::to_bool;

use msfs::sim_connect;
use msfs::{sim_connect::SimConnect, sim_connect::SIMCONNECT_OBJECT_ID_USER};

pub(super) fn trimmable_horizontal_stabilizer(
    builder: &mut MsfsAspectBuilder,
) -> Result<(), Box<dyn Error>> {
    builder.variables_to_object(Box::new(PitchTrimSimOutput { elevator_trim: 0. }));

    Ok(())
}

#[sim_connect::data_definition]
struct PitchTrimSimOutput {
    #[name = "ELEVATOR TRIM POSITION"]
    #[unit = "DEGREE"]
    elevator_trim: f64,
}
impl VariablesToObject for PitchTrimSimOutput {
    fn variables(&self) -> Vec<Variable> {
        vec![
            Variable::aspect("HYD_FINAL_THS_DEFLECTION"),
            Variable::named("FLIGHT_CONTROLS_TRACKING_MODE"),
        ]
    }

    fn write(&mut self, values: Vec<f64>) -> ObjectWrite {
        self.elevator_trim = values[0];

        //Not writing control feedback when in tracking mode
        ObjectWrite::on(!to_bool(values[1]))
    }

    set_data_on_sim_object!();
}
