use std::error::Error;

use systems_wasm::aspects::{
    EventToVariableMapping, ExecuteOn, MsfsAspectBuilder, ObjectWrite, VariablesToObject,
};
use systems_wasm::{set_data_on_sim_object, Variable};

use systems::shared::to_bool;

use msfs::sim_connect;
use msfs::{sim_connect::SimConnect, sim_connect::SIMCONNECT_OBJECT_ID_USER};

pub(super) fn trimmable_horizontal_stabilizer(
    builder: &mut MsfsAspectBuilder,
) -> Result<(), Box<dyn Error>> {
    builder.event_to_variable(
        "ELEV_TRIM_UP",
        EventToVariableMapping::Value(35.),
        Variable::aspect("THS_MANUAL_CONTROL_SPEED_KEY"),
        |options| options.mask().afterwards_reset_to(0.),
    )?;

    builder.event_to_variable(
        "ELEV_TRIM_DN",
        EventToVariableMapping::Value(-35.),
        Variable::aspect("THS_MANUAL_CONTROL_SPEED_KEY"),
        |options| options.mask().afterwards_reset_to(0.),
    )?;

    builder.event_to_variable(
        "ELEVATOR_TRIM_SET",
        EventToVariableMapping::EventDataToValue(|event_data| (event_data as f64) / 16383.),
        Variable::aspect("THS_MAN_POS_SET_16K"),
        |options| options.mask().afterwards_reset_to(-1.),
    )?;

    builder.event_to_variable(
        "AXIS_ELEV_TRIM_SET",
        EventToVariableMapping::EventData32kPosition,
        Variable::aspect("THS_MAN_POS_SET_32K"),
        |options| options.mask().afterwards_reset_to(-1.),
    )?;

    // Sends a trim speed from position error
    builder.map_many(
        ExecuteOn::PreTick,
        vec![
            Variable::aspect("THS_MAN_POS_SET_16K"),
            Variable::aspect("THS_MAN_POS_SET_32K"),
            Variable::named("HYD_TRIM_WHEEL_PERCENT"),
        ],
        |values| {
            if values[0] >= 0. {
                pos_error_to_speed(values[0] - values[2] / 100.)
            } else if values[1] >= 0. {
                pos_error_to_speed(values[1] - values[2] / 100.)
            } else {
                0.
            }
        },
        Variable::aspect("THS_MANUAL_CONTROL_SPEED_AXIS"),
    );

    // Selects final speed to use from keys or axis events
    builder.map_many(
        ExecuteOn::PreTick,
        vec![
            Variable::aspect("THS_MANUAL_CONTROL_SPEED_KEY"),
            Variable::aspect("THS_MANUAL_CONTROL_SPEED_AXIS"),
        ],
        |values| {
            if values[0].abs() > 0. {
                values[0]
            } else {
                values[1]
            }
        },
        Variable::aspect("THS_MANUAL_CONTROL_SPEED"),
    );

    // Sends manual control state when receiveing an event even if position is not moving or when keys event are used
    builder.map_many(
        ExecuteOn::PreTick,
        vec![
            Variable::aspect("THS_MAN_POS_SET_16K"),
            Variable::aspect("THS_MAN_POS_SET_32K"),
            Variable::aspect("THS_MANUAL_CONTROL_SPEED_KEY"),
        ],
        |values| {
            if values[0] >= 0. || values[1] >= 0. || values[2].abs() > 0. {
                1.
            } else {
                0.
            }
        },
        Variable::aspect("THS_MANUAL_CONTROL_ACTIVE"),
    );

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

fn pos_error_to_speed(error: f64) -> f64 {
    (1000. * error).min(45.).max(-45.)
}
