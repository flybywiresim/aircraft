use std::error::Error;

use systems_wasm::aspects::{
    EventToVariableMapping, MsfsAspectBuilder, ObjectWrite, VariablesToObject,
};
use systems_wasm::{set_data_on_sim_object, Variable};

use msfs::sim_connect;
use msfs::{sim_connect::SimConnect, sim_connect::SIMCONNECT_OBJECT_ID_USER};

pub(super) fn trimmable_horizontal_stabilizer(
    builder: &mut MsfsAspectBuilder,
) -> Result<(), Box<dyn Error>> {
    const THS_EVENT_INCREMENTS: f64 = 0.05;
    builder.event_to_variable(
        "ELEV_TRIM_UP",
        EventToVariableMapping::CurrentValueToValue(|current_value| {
            (current_value + THS_EVENT_INCREMENTS).min(45.)
        }),
        Variable::named("DEV_FINAL_THS_ANGLE"),
        |options| options.mask(),
    )?;
    builder.event_to_variable(
        "ELEV_TRIM_DN",
        EventToVariableMapping::CurrentValueToValue(|current_value| {
            (current_value - THS_EVENT_INCREMENTS).max(-45.)
        }),
        Variable::named("DEV_FINAL_THS_ANGLE"),
        |options| options.mask(),
    )?;

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
        vec![Variable::named("DEV_FINAL_THS_ANGLE")]
    }

    fn write(&mut self, values: Vec<f64>) -> ObjectWrite {
        self.elevator_trim = values[0];

        //Not writing control feedback when in tracking mode
        ObjectWrite::ToSim
    }

    set_data_on_sim_object!();
}
