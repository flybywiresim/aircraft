use std::error::Error;

use systems::shared::to_bool;
use systems_wasm::aspects::{ExecuteOn, MsfsAspectBuilder, ObjectWrite, VariablesToObject};
use systems_wasm::{set_data_on_sim_object, Variable};

use msfs::sim_connect;
use msfs::{sim_connect::SimConnect, sim_connect::SIMCONNECT_OBJECT_ID_USER};

pub(super) fn ailerons(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    // Inputs from FBW becomes the aileron position demand for hydraulic system
    // MSFS uses [-1;1] ranges, and Left aileron UP is -1 while right aileron UP is 1
    // Systems use [0;1], 1 is UP
    builder.map(
        ExecuteOn::PreTick,
        Variable::named("AILERON_LEFT_DEFLECTION_DEMAND"),
        |value| (-value + 1.) / 2.,
        Variable::aspect("HYD_AILERON_LEFT_DEMAND"),
    );
    builder.map(
        ExecuteOn::PreTick,
        Variable::named("AILERON_RIGHT_DEFLECTION_DEMAND"),
        |value| (value + 1.) / 2.,
        Variable::aspect("HYD_AILERON_RIGHT_DEMAND"),
    );

    // Aileron positions returned by hydraulic system are converted to MSFS format
    // It means we just invert left side direction and do [0;1] -> [-1;1]
    builder.map(
        ExecuteOn::PostTick,
        Variable::aspect("HYD_AIL_LEFT_DEFLECTION"),
        |value| -1. * (value * 2. - 1.),
        Variable::named("HYD_AILERON_LEFT_DEFLECTION"),
    );
    builder.map(
        ExecuteOn::PostTick,
        Variable::aspect("HYD_AIL_RIGHT_DEFLECTION"),
        |value| (value * 2. - 1.),
        Variable::named("HYD_AILERON_RIGHT_DEFLECTION"),
    );

    // AILERON POSITION FEEDBACK TO SIM
    // Here we separate ailerons from spoiler to build a unique roll torque
    // Asymmetry of elevator adds a part in roll torque
    builder.map_many(
        ExecuteOn::PostTick,
        vec![
            Variable::aspect("HYD_AIL_LEFT_DEFLECTION"),
            Variable::aspect("HYD_AIL_RIGHT_DEFLECTION"),
            Variable::aspect("HYD_ELEV_LEFT_DEFLECTION"),
            Variable::aspect("HYD_ELEV_RIGHT_DEFLECTION"),
            Variable::named("HYD_SPOILERS_LEFT_DEFLECTION"),
            Variable::named("HYD_SPOILERS_RIGHT_DEFLECTION"),
        ],
        |values| {
            const SPOILER_ROLL_COEFF: f64 = 0.5;
            const AILERON_ROLL_COEFF: f64 = 0.7;
            const ELEVATOR_ROLL_COEFF: f64 = 0.2;

            let elevator_roll_component = ELEVATOR_ROLL_COEFF * (values[3] - values[2]);
            let aileron_roll_asymetry = AILERON_ROLL_COEFF * (values[1] - values[0]);
            let spoiler_roll_asymetry = SPOILER_ROLL_COEFF * (values[5] - values[4]);

            aileron_roll_asymetry + spoiler_roll_asymetry + elevator_roll_component
        },
        Variable::aspect("HYD_FINAL_AILERON_FEEDBACK"),
    );

    builder.variables_to_object(Box::new(RollSimOutput { ailerons: 0. }));

    Ok(())
}

#[sim_connect::data_definition]
struct RollSimOutput {
    #[name = "AILERON POSITION"]
    #[unit = "Position"]
    ailerons: f64,
}
impl VariablesToObject for RollSimOutput {
    fn variables(&self) -> Vec<Variable> {
        vec![
            Variable::aspect("HYD_FINAL_AILERON_FEEDBACK"),
            Variable::aspect("FLIGHT_CONTROLS_TRACKING_MODE"),
        ]
    }

    fn write(&mut self, values: Vec<f64>) -> ObjectWrite {
        self.ailerons = values[0];

        // Not writing control feedback when in tracking mode
        ObjectWrite::on(!to_bool(values[1]))
    }

    set_data_on_sim_object!();
}
