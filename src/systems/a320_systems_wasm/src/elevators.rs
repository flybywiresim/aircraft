use std::error::Error;
use systems_wasm::aspects::{ExecuteOn, MsfsAspectBuilder, VariablesToObject};
use systems_wasm::{set_data_on_sim_object, Variable};

use msfs::sim_connect;
use msfs::{sim_connect::SimConnect, sim_connect::SIMCONNECT_OBJECT_ID_USER};

pub(super) fn elevators(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    builder.map(
        ExecuteOn::PreTick,
        Variable::named("ELEVATOR_DEFLECTION_DEMAND"),
        |value| {
            println!(
                "ELEVATOR_DEFLECTION_DEMAND {:.2} hyd_pos_demand {:.2}",
                value,
                (value + 0.72) / 1.72
            );
            (value + 0.72) / 1.72
        },
        Variable::aspect("HYD_ELEVATOR_DEMAND"),
    );

    builder.map(
        ExecuteOn::PostTick,
        Variable::aspect("HYD_ELEV_LEFT_DEFLECTION"),
        |value| value * 1.72 - 0.72,
        Variable::named("HYD_ELEVATOR_LEFT_DEFLECTION"),
    );
    builder.map(
        ExecuteOn::PostTick,
        Variable::aspect("HYD_ELEV_RIGHT_DEFLECTION"),
        |value| value * 1.72 - 0.72,
        Variable::named("HYD_ELEVATOR_RIGHT_DEFLECTION"),
    );

    // ELEVATOR POSITION FEEDBACK TO SIM
    builder.map_many(
        ExecuteOn::PostTick,
        vec![
            Variable::aspect("HYD_ELEV_LEFT_DEFLECTION"),
            Variable::aspect("HYD_ELEV_RIGHT_DEFLECTION"),
            Variable::named("ELEVATOR_DEFLECTION_DEMAND"),
            Variable::aircraft("ELEVATOR DEFLECTION PCT", "Percent", 0),
        ],
        |values| {
            let mean_elevator_position = (values[1] + values[0]) / 2.;

            println!(
                "MSFSdmnd {:.2} FBW elev {:.2} Mean elev {:.2} --> SIM Elev output {:.2}",
                values[3], values[2], mean_elevator_position, mean_elevator_position
            );
            mean_elevator_position
        },
        Variable::aspect("HYD_FINAL_ELEVATOR_FEEDBACK"),
    );

    //Uncomment to write back position to sim
    //builder.variables_to_object(Box::new(PitchSimOutput { elevator: 0. }));

    Ok(())
}

// #[sim_connect::data_definition]
// struct PitchSimOutput {
//     #[name = "ELEVATOR POSITION"]
//     #[unit = "Position"]
//     elevator: f64,
// }
// impl VariablesToObject for PitchSimOutput {
//     fn variables(&self) -> Vec<Variable> {
//         vec![Variable::aspect("HYD_FINAL_ELEVATOR_FEEDBACK")]
//     }

//     fn write(&mut self, values: Vec<f64>) {
//         self.elevator = values[0];
//     }

//     set_data_on_sim_object!();
// }
