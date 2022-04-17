use std::error::Error;
use std::time::Duration;
use systems_wasm::aspects::{EventToVariableMapping, EventToVariableOptions, MsfsAspectBuilder};
use systems_wasm::Variable;

pub(super) fn autobrakes(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    let options = |options: EventToVariableOptions| {
        options
            .leading_debounce(Duration::from_millis(250))
            .afterwards_reset_to(-1.)
    };

    builder.event_to_variable(
        "AUTOBRAKE_LO_SET",
        EventToVariableMapping::Value(1.),
        Variable::named("AUTOBRAKES_ARMED_MODE_SET"),
        options,
    )?;
    builder.event_to_variable(
        "AUTOBRAKE_MED_SET",
        EventToVariableMapping::Value(2.),
        Variable::named("AUTOBRAKES_ARMED_MODE_SET"),
        options,
    )?;
    builder.event_to_variable(
        "AUTOBRAKE_HI_SET",
        EventToVariableMapping::Value(3.),
        Variable::named("AUTOBRAKES_ARMED_MODE_SET"),
        options,
    )?;
    builder.event_to_variable(
        "AUTOBRAKE_DISARM",
        EventToVariableMapping::Value(0.),
        Variable::named("AUTOBRAKES_ARMED_MODE_SET"),
        options,
    )?;

    builder.event_to_variable(
        "A32NX.AUTOBRAKE_SET",
        EventToVariableMapping::EventDataToValue(|event_data| event_data as f64),
        Variable::named("AUTOBRAKES_ARMED_MODE_SET"),
        options,
    )?;

    Ok(())
}
