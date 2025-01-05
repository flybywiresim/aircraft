use std::error::Error;
use std::time::Duration;
use systems_wasm::aspects::{EventToVariableMapping, EventToVariableOptions, MsfsAspectBuilder};
use systems_wasm::Variable;

pub(super) fn autobrakes(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    let option_button_press = |options: EventToVariableOptions| {
        options
            .leading_debounce(Duration::from_millis(1500))
            .afterwards_reset_to(0.)
    };
    let option_knob_event =
        |options: EventToVariableOptions| options.leading_debounce(Duration::from_millis(1500));

    // Mapping msfs 320 bindings to some 380 modes
    // LO -> LO  / MED -> BRK 3 / HI -> RTO
    builder.event_to_variable(
        "AUTOBRAKE_LO_SET",
        EventToVariableMapping::Value(2.),
        Variable::named("AUTOBRAKES_SELECTED_MODE"),
        option_knob_event,
    )?;
    builder.event_to_variable(
        "AUTOBRAKE_MED_SET",
        EventToVariableMapping::Value(4.),
        Variable::named("AUTOBRAKES_SELECTED_MODE"),
        option_knob_event,
    )?;
    builder.event_to_variable(
        "AUTOBRAKE_HI_SET",
        EventToVariableMapping::Value(1.),
        Variable::named("OVHD_AUTOBRK_RTO_ARM_IS_PRESSED"),
        option_button_press,
    )?;
    builder.event_to_variable(
        "A32NX.AUTO_THROTTLE_DISCONNECT",
        EventToVariableMapping::Value(1.),
        Variable::named("AUTOBRAKE_INSTINCTIVE_DISCONNECT"),
        option_button_press,
    )?;

    let options_set =
        |options: EventToVariableOptions| options.leading_debounce(Duration::from_millis(125));

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
        "AUTOBRAKE_DISARM",
        EventToVariableMapping::Value(0.),
        Variable::named("AUTOBRAKES_SELECTED_MODE"),
        options_set,
    )?;
    builder.event_to_variable(
        "A32NX.AUTOBRAKE_SET_BTV",
        EventToVariableMapping::Value(1.),
        Variable::named("AUTOBRAKES_SELECTED_MODE"),
        options_set,
    )?;
    builder.event_to_variable(
        "A32NX.AUTOBRAKE_SET_LO",
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
        "A32NX.AUTOBRAKE_SET_L3",
        EventToVariableMapping::Value(4.),
        Variable::named("AUTOBRAKES_SELECTED_MODE"),
        options_set,
    )?;
    builder.event_to_variable(
        "A32NX.AUTOBRAKE_SET_HI",
        EventToVariableMapping::Value(5.),
        Variable::named("AUTOBRAKES_SELECTED_MODE"),
        options_set,
    )?;

    Ok(())
}
