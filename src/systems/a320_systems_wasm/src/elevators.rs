use std::error::Error;

use systems::shared::to_bool;
use systems_wasm::aspects::{ExecuteOn, MsfsAspectBuilder, ObjectWrite, VariablesToObject};
use systems_wasm::{set_data_on_sim_object, Variable};

use msfs::sim_connect;
use msfs::{sim_connect::SimConnect, sim_connect::SIMCONNECT_OBJECT_ID_USER};

pub(super) fn elevators(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    const MIN_MSFS_DEFLECTION_ANGLE: f64 = 11.5;
    const MAX_MSFS_DEFLECTION_ANGLE: f64 = 16.;

    builder.map(
        ExecuteOn::PreTick,
        Variable::named("ELEVATOR_DEFLECTION_DEMAND"),
        |value| {
            msfs_deflection_to_hyd_demand(
                value,
                MIN_MSFS_DEFLECTION_ANGLE,
                MAX_MSFS_DEFLECTION_ANGLE,
            )
        },
        Variable::aspect("HYD_ELEVATOR_DEMAND"),
    );

    builder.map(
        ExecuteOn::PostTick,
        Variable::aspect("HYD_ELEV_LEFT_DEFLECTION"),
        |value| {
            hyd_deflection_to_msfs_deflection(
                value,
                MIN_MSFS_DEFLECTION_ANGLE,
                MAX_MSFS_DEFLECTION_ANGLE,
            )
        },
        Variable::named("HYD_ELEVATOR_LEFT_DEFLECTION"),
    );
    builder.map(
        ExecuteOn::PostTick,
        Variable::aspect("HYD_ELEV_RIGHT_DEFLECTION"),
        |value| {
            hyd_deflection_to_msfs_deflection(
                value,
                MIN_MSFS_DEFLECTION_ANGLE,
                MAX_MSFS_DEFLECTION_ANGLE,
            )
        },
        Variable::named("HYD_ELEVATOR_RIGHT_DEFLECTION"),
    );

    // ELEVATOR POSITION FEEDBACK TO SIM
    builder.map_many(
        ExecuteOn::PostTick,
        vec![
            Variable::named("HYD_ELEVATOR_LEFT_DEFLECTION"),
            Variable::named("HYD_ELEVATOR_RIGHT_DEFLECTION"),
        ],
        |values| (values[1] + values[0]) / 2.,
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
            Variable::aspect("FLIGHT_CONTROLS_TRACKING_MODE"),
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
    min_msfs_angle: f64,
    max_msfs_angle: f64,
) -> f64 {
    let elevator_range: f64 = max_msfs_angle + min_msfs_angle;

    let msfs_angle_zero_offset = hyd_deflection * elevator_range;
    let msfs_angle = msfs_angle_zero_offset - min_msfs_angle;

    if msfs_angle <= 0. {
        msfs_angle / min_msfs_angle
    } else {
        msfs_angle / max_msfs_angle
    }
}

fn msfs_deflection_to_hyd_demand(
    msfs_deflection: f64,
    min_msfs_angle: f64,
    max_msfs_angle: f64,
) -> f64 {
    let elevator_range: f64 = max_msfs_angle + min_msfs_angle;

    let msfs_angle_demand = if msfs_deflection <= 0. {
        msfs_deflection * min_msfs_angle
    } else {
        msfs_deflection * max_msfs_angle
    };

    let msfs_angle_zero_offset = msfs_angle_demand + min_msfs_angle;

    msfs_angle_zero_offset / elevator_range
}
