use std::error::Error;
use std::time::Duration;
use systems_wasm::aspects::{EventToVariableMapping, EventToVariableOptions, MsfsAspectBuilder};
use systems_wasm::Variable;

pub(super) fn autobrakes(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    let options = |options: EventToVariableOptions| {
        options
            .leading_debounce(Duration::from_millis(1500))
            .afterwards_reset_to(0.)
    };

    builder.event_to_variable(
        "AUTOBRAKE_LO_SET",
        EventToVariableMapping::Value(1.),
        Variable::named("OVHD_AUTOBRK_LOW_ON_IS_PRESSED"),
        options,
    )?;
    builder.event_to_variable(
        "AUTOBRAKE_MED_SET",
        EventToVariableMapping::Value(1.),
        Variable::named("OVHD_AUTOBRK_MED_ON_IS_PRESSED"),
        options,
    )?;
    builder.event_to_variable(
        "AUTOBRAKE_HI_SET",
        EventToVariableMapping::Value(1.),
        Variable::named("OVHD_AUTOBRK_MAX_ON_IS_PRESSED"),
        options,
    )?;
    builder.event_to_variable(
        "AUTOBRAKE_DISARM",
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
        Variable::named("AUTOBRAKES_ARMED_MODE_SET"),
        options_set,
    )?;
    builder.event_to_variable(
        "A32NX.AUTOBRAKE_SET_DISARM",
        EventToVariableMapping::Value(0.),
        Variable::named("AUTOBRAKES_ARMED_MODE_SET"),
        options_set,
    )?;
    builder.event_to_variable(
        "A32NX.AUTOBRAKE_SET_LO",
        EventToVariableMapping::Value(1.),
        Variable::named("AUTOBRAKES_ARMED_MODE_SET"),
        options_set,
    )?;
    builder.event_to_variable(
        "A32NX.AUTOBRAKE_SET_MED",
        EventToVariableMapping::Value(2.),
        Variable::named("AUTOBRAKES_ARMED_MODE_SET"),
        options_set,
    )?;
    builder.event_to_variable(
        "A32NX.AUTOBRAKE_SET_MAX",
        EventToVariableMapping::Value(3.),
        Variable::named("AUTOBRAKES_ARMED_MODE_SET"),
        options_set,
    )?;

    let options_buttons = |options: EventToVariableOptions| {
        options
            .leading_debounce(Duration::from_millis(125))
            .afterwards_reset_to(0.)
    };

    builder.event_to_variable(
        "A32NX.AUTOBRAKE_BUTTON_LO",
        EventToVariableMapping::Value(1.),
        Variable::named("OVHD_AUTOBRK_LOW_ON_IS_PRESSED"),
        options_buttons,
    )?;
    builder.event_to_variable(
        "A32NX.AUTOBRAKE_BUTTON_MED",
        EventToVariableMapping::Value(1.),
        Variable::named("OVHD_AUTOBRK_MED_ON_IS_PRESSED"),
        options_buttons,
    )?;
    builder.event_to_variable(
        "A32NX.AUTOBRAKE_BUTTON_MAX",
        EventToVariableMapping::Value(1.),
        Variable::named("OVHD_AUTOBRK_MAX_ON_IS_PRESSED"),
        options_buttons,
    )?;

    Ok(())
}
