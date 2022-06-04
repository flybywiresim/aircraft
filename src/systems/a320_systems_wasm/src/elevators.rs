use std::error::Error;

use systems::shared::to_bool;
use systems_wasm::aspects::{ExecuteOn, MsfsAspectBuilder, ObjectWrite, VariablesToObject};
use systems_wasm::{set_data_on_sim_object, Variable};

use msfs::sim_connect;
use msfs::{sim_connect::SimConnect, sim_connect::SIMCONNECT_OBJECT_ID_USER};

pub(super) fn elevators(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    builder.map(
        ExecuteOn::PreTick,
        Variable::named("ELEVATOR_DEFLECTION_DEMAND"),
        |value| {
            const min_msfs_angle: f64 = 11.5;
            const max_msfs_angle: f64 = 16.;
            const elevator_range: f64 = max_msfs_angle + min_msfs_angle;

            let msfs_angle_demand = if value <= 0. {
                value * min_msfs_angle
            } else {
                value * max_msfs_angle
            };

            let msfs_angle_zero_offset = msfs_angle_demand + min_msfs_angle;

            let final_hyd_demand = msfs_angle_zero_offset / elevator_range;

            final_hyd_demand
        },
        Variable::aspect("HYD_ELEVATOR_DEMAND"),
    );

    builder.map(
        ExecuteOn::PostTick,
        Variable::aspect("HYD_ELEV_LEFT_DEFLECTION"),
        |value| hyd_deflection_to_msfs_deflection(value),
        Variable::named("HYD_ELEVATOR_LEFT_DEFLECTION"),
    );
    builder.map(
        ExecuteOn::PostTick,
        Variable::aspect("HYD_ELEV_RIGHT_DEFLECTION"),
        |value| hyd_deflection_to_msfs_deflection(value),
        Variable::named("HYD_ELEVATOR_RIGHT_DEFLECTION"),
    );

    // ELEVATOR POSITION FEEDBACK TO SIM
    builder.map_many(
        ExecuteOn::PostTick,
        vec![
            Variable::named("HYD_ELEVATOR_LEFT_DEFLECTION"),
            Variable::named("HYD_ELEVATOR_RIGHT_DEFLECTION"),
            Variable::named("ELEVATOR_DEFLECTION_DEMAND"),
            Variable::aircraft("ELEVATOR DEFLECTION PCT", "Percent", 0),
        ],
        |values| {
            let mean_elevator_position = (values[1] + values[0]) / 2.;

            mean_elevator_position
        },
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

fn hyd_deflection_to_msfs_deflection(hyd_deflection: f64) -> f64 {
    const min_msfs_angle: f64 = 11.5;
    const max_msfs_angle: f64 = 16.;
    const elevator_range: f64 = max_msfs_angle + min_msfs_angle;

    let msfs_angle_zero_offset = hyd_deflection * elevator_range;
    let msfs_angle = msfs_angle_zero_offset - min_msfs_angle;

    let final_msfs_angle_output = if msfs_angle <= 0. {
        msfs_angle / min_msfs_angle
    } else {
        msfs_angle / max_msfs_angle
    };

    final_msfs_angle_output
}
