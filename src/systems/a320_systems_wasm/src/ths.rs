use std::error::Error;

use systems::shared::to_bool;
use systems_wasm::aspects::{
    EventToVariableMapping, ExecuteOn, MsfsAspectBuilder, VariablesToObject,
};
use systems_wasm::{set_data_on_sim_object, Variable};

use msfs::sim_connect;
use msfs::{sim_connect::SimConnect, sim_connect::SIMCONNECT_OBJECT_ID_USER};

pub(super) fn ths(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    builder.event_to_variable(
        "ELEV_TRIM_UP",
        EventToVariableMapping::Value(35.),
        Variable::aspect("THS_MANUAL_CONTROL_SPEED"),
        |options| options.mask().afterwards_reset_to(0.),
    )?;

    builder.event_to_variable(
        "ELEV_TRIM_DN",
        EventToVariableMapping::Value(-35.),
        Variable::aspect("THS_MANUAL_CONTROL_SPEED"),
        |options| options.mask().afterwards_reset_to(0.),
    )?;

    builder.event_to_variable(
        "ELEVATOR_TRIM_SET",
        EventToVariableMapping::EventDataToValue(|event_data| {
            println!(
                "EVENT TRIM SET {:?} converted {:.2}",
                event_data,
                (event_data as f64) / 16383.
            );
            (event_data as f64) / 16383.
        }),
        Variable::named("THS_MAN_POS_SET_16K"),
        |options| options.mask().afterwards_reset_to(-1.),
    )?;

    builder.event_to_variable(
        "AXIS_ELEV_TRIM_SET",
        EventToVariableMapping::EventData32kPosition,
        Variable::named("THS_MAN_POS_SET_32K"),
        |options| options.mask().afterwards_reset_to(-1.),
    )?;

    builder.map_many(
        ExecuteOn::PreTick,
        vec![
            Variable::named("THS_MAN_POS_SET_16K"),
            Variable::named("THS_MAN_POS_SET_32K"),
            Variable::named("HYD_TRIM_WHEEL_PERCENT"),
        ],
        |values| {
            println!(
                "16K {:.2} 32K {:.2} current trim pos{:.2}",
                values[0], values[1], values[2]
            );

            values[1] / 2. + 1.
        },
        Variable::aspect("THS_MANUAL_CONTROL_POSITION"),
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

    fn write(&mut self, values: Vec<f64>) {
        self.elevator_trim = values[0];

        // Not writing control feedback when in tracking mode
        //ObjectWrite::on(!to_bool(values[1]))
    }

    set_data_on_sim_object!();
}
