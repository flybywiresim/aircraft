use std::error::Error;
use std::time::Duration;
use systems_wasm::aspects::{
    EventToVariableMapping, EventToVariableOptions, ExecuteOn, MsfsAspectBuilder,
};
use systems_wasm::Variable;

pub(super) fn autobrakes(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    builder.map_many(
        ExecuteOn::PreTick,
        vec![
            Variable::named("OVHD_AUTOBRK_LOW_ON_IS_PRESSED"),
            Variable::named("OVHD_AUTOBRK_MED_ON_IS_PRESSED"),
            Variable::named("OVHD_AUTOBRK_MAX_ON_IS_PRESSED"),
            Variable::named("AUTOBRAKES_SELECTED_MODE"),
        ],
        |values| {
            if values[0] > 0.5 {
                1.
            } else if values[1] > 0.5 {
                2.
            } else if values[2] > 0.5 {
                3.
            } else {
                //No press passing through old value
                values[3]
            }
        },
        Variable::named("AUTOBRAKES_SELECTED_MODE"),
    );

    let options = |options: EventToVariableOptions| {
        options
            .leading_debounce(Duration::from_millis(1500))
            .afterwards_reset_to(0.)
    };

    builder.event_to_variable(
        "AUTOBRAKE_LO_SET",
        EventToVariableMapping::Value(1.),
        Variable::named("AUTOBRAKES_SELECTED_MODE"),
        options,
    )?;
    builder.event_to_variable(
        "AUTOBRAKE_MED_SET",
        EventToVariableMapping::Value(2.),
        Variable::named("AUTOBRAKES_SELECTED_MODE"),
        options,
    )?;
    builder.event_to_variable(
        "AUTOBRAKE_HI_SET",
        EventToVariableMapping::Value(4.),
        Variable::named("OVHD_AUTOBRK_MAX_ON_IS_PRESSED"),
        options,
    )?;
    builder.event_to_variable(
        "A32NX.AUTO_THROTTLE_DISCONNECT",
        EventToVariableMapping::Value(1.),
        Variable::named("AUTOBRAKE_DISARM"),
        |options| options.afterwards_reset_to(0.),
    )?;

    let options_set = |options: EventToVariableOptions| {
        options
            .leading_debounce(Duration::from_millis(125))
            .afterwards_reset_to(-1.)
    };

    builder.event_to_variable(
        "A32NX.AUTOBRAKE_SET",
        EventToVariableMapping::EventDataToValue(|event_data| event_data as f64),
        Variable::named("AUTOBRAKES_SELECTED_MODE"),
        options_set,
    )?;
    builder.event_to_variable(
        "A32NX.AUTOBRAKE_SET_DISARM",
        EventToVariableMapping::Value(0.),
        Variable::named("AUTOBRAKES_SELECTED_MODE"),
        options_set,
    )?;
    builder.event_to_variable(
        "A32NX.AUTOBRAKE_SET_LO",
        EventToVariableMapping::Value(1.),
        Variable::named("AUTOBRAKES_SELECTED_MODE"),
        options_set,
    )?;
    builder.event_to_variable(
        "A32NX.AUTOBRAKE_SET_L1",
        EventToVariableMapping::Value(2.),
        Variable::named("AUTOBRAKES_SELECTED_MODE"),
        options_set,
    )?;
    builder.event_to_variable(
        "A32NX.AUTOBRAKE_SET_L2",
        EventToVariableMapping::Value(3.),
        Variable::named("AUTOBRAKES_SELECTED_MODE"),
        options_set,
    )?;
    builder.event_to_variable(
        "A32NX.AUTOBRAKE_SET_HI",
        EventToVariableMapping::Value(4.),
        Variable::named("AUTOBRAKES_SELECTED_MODE"),
        options_set,
    )?;
    builder.event_to_variable(
        "A32NX.AUTOBRAKE_SET_BTV",
        EventToVariableMapping::Value(5.),
        Variable::named("AUTOBRAKES_SELECTED_MODE"),
        options_set,
    )?;

    Ok(())
}
