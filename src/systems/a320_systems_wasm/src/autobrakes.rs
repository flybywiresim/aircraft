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
        Variable::Named("OVHD_AUTOBRK_LOW_ON_IS_PRESSED".into()),
        options,
    )?;
    builder.event_to_variable(
        "AUTOBRAKE_MED_SET",
        EventToVariableMapping::Value(1.),
        Variable::Named("OVHD_AUTOBRK_MED_ON_IS_PRESSED".into()),
        options,
    )?;
    builder.event_to_variable(
        "AUTOBRAKE_HI_SET",
        EventToVariableMapping::Value(1.),
        Variable::Named("OVHD_AUTOBRK_MAX_ON_IS_PRESSED".into()),
        options,
    )?;
    builder.event_to_variable(
        "AUTOBRAKE_DISARM",
        EventToVariableMapping::Value(1.),
        Variable::Named("AUTOBRAKE_DISARM".into()),
        |options| options.afterwards_reset_to(0.),
    )?;

    Ok(())
}
