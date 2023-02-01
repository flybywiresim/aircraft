use std::error::Error;

use systems::shared::to_bool;
use systems_wasm::aspects::{ExecuteOn, MsfsAspectBuilder, ObjectWrite, VariablesToObject};
use systems_wasm::{set_data_on_sim_object, Variable};

use msfs::sim_connect;
use msfs::{sim_connect::SimConnect, sim_connect::SIMCONNECT_OBJECT_ID_USER};

pub(super) fn elevators(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    const MIN_ACTUAL_DEFLECTION_ANGLE: f64 = 20.;
    const MAX_ACTUAL_DEFLECTION_ANGLE: f64 = 30.;

    builder.map(
        ExecuteOn::PostTick,
        Variable::aspect("HYD_ELEV_LEFT_OUTWARD_DEFLECTION"),
        |value| {
            hyd_deflection_to_msfs_deflection(
                value,
                MIN_ACTUAL_DEFLECTION_ANGLE,
                MAX_ACTUAL_DEFLECTION_ANGLE,
            )
        },
        Variable::named("HYD_ELEVATOR_LEFT_OUTWARD_DEFLECTION"),
    );
    builder.map(
        ExecuteOn::PostTick,
        Variable::aspect("HYD_ELEV_RIGHT_OUTWARD_DEFLECTION"),
        |value| {
            hyd_deflection_to_msfs_deflection(
                value,
                MIN_ACTUAL_DEFLECTION_ANGLE,
                MAX_ACTUAL_DEFLECTION_ANGLE,
            )
        },
        Variable::named("HYD_ELEVATOR_RIGHT_OUTWARD_DEFLECTION"),
    );
    builder.map(
        ExecuteOn::PostTick,
        Variable::aspect("HYD_ELEV_LEFT_INWARD_DEFLECTION"),
        |value| {
            hyd_deflection_to_msfs_deflection(
                value,
                MIN_ACTUAL_DEFLECTION_ANGLE,
                MAX_ACTUAL_DEFLECTION_ANGLE,
            )
        },
        Variable::named("HYD_ELEVATOR_LEFT_INWARD_DEFLECTION"),
    );
    builder.map(
        ExecuteOn::PostTick,
        Variable::aspect("HYD_ELEV_RIGHT_INWARD_DEFLECTION"),
        |value| {
            hyd_deflection_to_msfs_deflection(
                value,
                MIN_ACTUAL_DEFLECTION_ANGLE,
                MAX_ACTUAL_DEFLECTION_ANGLE,
            )
        },
        Variable::named("HYD_ELEVATOR_RIGHT_INWARD_DEFLECTION"),
    );

    // ELEVATOR POSITION FEEDBACK TO SIM
    builder.map_many(
        ExecuteOn::PostTick,
        vec![
            Variable::named("HYD_ELEVATOR_LEFT_OUTWARD_DEFLECTION"),
            Variable::named("HYD_ELEVATOR_LEFT_INWARD_DEFLECTION"),
            Variable::named("HYD_ELEVATOR_RIGHT_OUTWARD_DEFLECTION"),
            Variable::named("HYD_ELEVATOR_RIGHT_INWARD_DEFLECTION"),
        ],
        |values| (values[3] + values[2] + values[1] + values[0]) / 4.,
        Variable::aspect("HYD_FINAL_ELEVATOR_FEEDBACK"),
    );

    builder.variables_to_object(Box::new(PitchSimOutput { elevator: 0. }));

    Ok(())
}

#[sim_connect::data_definition]
struct PitchSimOutput {
    #[name = "ELEVATOR POSITION"]
    #[unit = "Position"]
    elevator: f64,
}
impl VariablesToObject for PitchSimOutput {
    fn variables(&self) -> Vec<Variable> {
        vec![
            Variable::aspect("HYD_FINAL_ELEVATOR_FEEDBACK"),
            Variable::named("FLIGHT_CONTROLS_TRACKING_MODE"),
        ]
    }

    fn write(&mut self, values: Vec<f64>) -> ObjectWrite {
        self.elevator = values[0];

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
