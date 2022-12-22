use std::error::Error;

use systems::shared::to_bool;
use systems_wasm::aspects::{ExecuteOn, MsfsAspectBuilder, ObjectWrite, VariablesToObject};
use systems_wasm::{set_data_on_sim_object, Variable};

use msfs::sim_connect;
use msfs::{sim_connect::SimConnect, sim_connect::SIMCONNECT_OBJECT_ID_USER};

pub(super) fn ailerons(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    const MIN_ACTUAL_DEFLECTION_ANGLE: f64 = 20.;
    const MAX_ACTUAL_DEFLECTION_ANGLE: f64 = 30.;

    // Aileron positions returned by hydraulic system are converted to MSFS format
    // It means we just invert left side direction and do [0;1] -> [-1;1]
    builder.map(
        ExecuteOn::PostTick,
        Variable::aspect("HYD_AIL_LEFT_OUTWARD_DEFLECTION"),
        |value| {
            -1. * hyd_deflection_to_msfs_deflection(
                value,
                MIN_ACTUAL_DEFLECTION_ANGLE,
                MAX_ACTUAL_DEFLECTION_ANGLE,
            )
        },
        Variable::named("HYD_AILERON_LEFT_OUTWARD_DEFLECTION"),
    );
    builder.map(
        ExecuteOn::PostTick,
        Variable::aspect("HYD_AIL_RIGHT_OUTWARD_DEFLECTION"),
        |value| {
            hyd_deflection_to_msfs_deflection(
                value,
                MIN_ACTUAL_DEFLECTION_ANGLE,
                MAX_ACTUAL_DEFLECTION_ANGLE,
            )
        },
        Variable::named("HYD_AILERON_RIGHT_OUTWARD_DEFLECTION"),
    );
    builder.map(
        ExecuteOn::PostTick,
        Variable::aspect("HYD_AIL_LEFT_MIDDLE_DEFLECTION"),
        |value| {
            -1. * hyd_deflection_to_msfs_deflection(
                value,
                MIN_ACTUAL_DEFLECTION_ANGLE,
                MAX_ACTUAL_DEFLECTION_ANGLE,
            )
        },
        Variable::named("HYD_AILERON_LEFT_MIDDLE_DEFLECTION"),
    );
    builder.map(
        ExecuteOn::PostTick,
        Variable::aspect("HYD_AIL_RIGHT_MIDDLE_DEFLECTION"),
        |value| {
            hyd_deflection_to_msfs_deflection(
                value,
                MIN_ACTUAL_DEFLECTION_ANGLE,
                MAX_ACTUAL_DEFLECTION_ANGLE,
            )
        },
        Variable::named("HYD_AILERON_RIGHT_MIDDLE_DEFLECTION"),
    );
    builder.map(
        ExecuteOn::PostTick,
        Variable::aspect("HYD_AIL_LEFT_INWARD_DEFLECTION"),
        |value| {
            -1. * hyd_deflection_to_msfs_deflection(
                value,
                MIN_ACTUAL_DEFLECTION_ANGLE,
                MAX_ACTUAL_DEFLECTION_ANGLE,
            )
        },
        Variable::named("HYD_AILERON_LEFT_INWARD_DEFLECTION"),
    );
    builder.map(
        ExecuteOn::PostTick,
        Variable::aspect("HYD_AIL_RIGHT_INWARD_DEFLECTION"),
        |value| {
            hyd_deflection_to_msfs_deflection(
                value,
                MIN_ACTUAL_DEFLECTION_ANGLE,
                MAX_ACTUAL_DEFLECTION_ANGLE,
            )
        },
        Variable::named("HYD_AILERON_RIGHT_INWARD_DEFLECTION"),
    );

    // AILERON POSITION FEEDBACK TO SIM
    // Here we separate ailerons from spoiler to build a unique roll torque
    // Asymmetry of elevator adds a part in roll torque
    builder.map_many(
        ExecuteOn::PostTick,
        vec![
            Variable::aspect("HYD_AIL_LEFT_OUTWARD_DEFLECTION"),
            Variable::aspect("HYD_AIL_LEFT_MIDDLE_DEFLECTION"),
            Variable::aspect("HYD_AIL_LEFT_INWARD_DEFLECTION"),
            Variable::aspect("HYD_AIL_RIGHT_OUTWARD_DEFLECTION"),
            Variable::aspect("HYD_AIL_RIGHT_MIDDLE_DEFLECTION"),
            Variable::aspect("HYD_AIL_RIGHT_INWARD_DEFLECTION"),
            Variable::aspect("HYD_ELEV_LEFT_DEFLECTION"),
            Variable::aspect("HYD_ELEV_RIGHT_DEFLECTION"),
            Variable::named("HYD_SPOILERS_LEFT_DEFLECTION"),
            Variable::named("HYD_SPOILERS_RIGHT_DEFLECTION"),
        ],
        |values| {
            const SPOILER_ROLL_COEFF: f64 = 0.5;
            const AILERON_ROLL_COEFF: f64 = 1.;
            const ELEVATOR_ROLL_COEFF: f64 = 0.2;

            let elevator_roll_component = ELEVATOR_ROLL_COEFF * (values[7] - values[6]);
            let aileron_roll_asymetry = AILERON_ROLL_COEFF
                * ((values[3] + values[4] + values[5]) - (values[0] + values[1] + values[2]))
                / 3.;
            let spoiler_roll_asymetry = SPOILER_ROLL_COEFF * (values[8] - values[9]);

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
            Variable::named("FLIGHT_CONTROLS_TRACKING_MODE"),
        ]
    }

    fn write(&mut self, values: Vec<f64>) -> ObjectWrite {
        self.ailerons = values[0];

        // Not writing control feedback when in tracking mode
        ObjectWrite::on(!to_bool(values[1]))
    }

    set_data_on_sim_object!();
}

fn hyd_deflection_to_msfs_deflection(
    hyd_deflection: f64,
    min_actual_angle: f64,
    max_actual_angle: f64,
) -> f64 {
    let elevator_range = max_actual_angle + min_actual_angle;

    let angle_zero_offset = hyd_deflection * elevator_range;
    let surface_angle = angle_zero_offset - min_actual_angle;

    surface_angle / max_actual_angle
}
