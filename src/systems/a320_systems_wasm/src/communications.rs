use std::error::Error;
use systems::shared::{from_bool, to_bool};
use systems_wasm::aspects::{
    max, EventToVariableMapping, ExecuteOn, MsfsAspectBuilder, VariableToEventMapping,
    VariableToEventWriteOn,
};
use systems_wasm::Variable;

pub(super) fn communications(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    builder.variable_to_event(
        Variable::aspect("PILOT_TRANSMIT"),
        VariableToEventMapping::EventDataRaw,
        VariableToEventWriteOn::EveryTick,
        "PILOT_TRANSMITTER_SET",
    )?;
    builder.variable_to_event(
        Variable::named("COPILOT_TRANSMIT"),
        VariableToEventMapping::EventDataRaw,
        VariableToEventWriteOn::EveryTick,
        "COPILOT_TRANSMITTER_SET",
    )?;
    builder.variable_to_event(
        Variable::aspect("COM1_RECEIVE"),
        VariableToEventMapping::EventDataRaw,
        VariableToEventWriteOn::Change,
        "COM1_RECEIVE_SELECT",
    )?;
    builder.variable_to_event(
        Variable::aspect("COM2_RECEIVE"),
        VariableToEventMapping::EventDataRaw,
        VariableToEventWriteOn::Change,
        "COM2_RECEIVE_SELECT",
    )?;
    builder.variable_to_event(
        Variable::named("VHF1_VOLUME"),
        VariableToEventMapping::EventDataRaw,
        VariableToEventWriteOn::Change,
        "COM1_VOLUME_SET",
    )?;
    builder.variable_to_event(
        Variable::aspect("VHF2_VOLUME"),
        VariableToEventMapping::EventDataRaw,
        VariableToEventWriteOn::Change,
        "COM2_VOLUME_SET",
    )?;
    builder.variable_to_event(
        Variable::aspect("ADF1_VOLUME"),
        VariableToEventMapping::EventDataRaw,
        VariableToEventWriteOn::Change,
        "ADF_VOLUME_SET",
    )?;
    builder.variable_to_event(
        Variable::aspect("ADF2_VOLUME"),
        VariableToEventMapping::EventDataRaw,
        VariableToEventWriteOn::Change,
        "ADF2_VOLUME_SET",
    )?;
    builder.variable_to_event(
        Variable::aspect("VOR1_VOLUME"),
        VariableToEventMapping::EventDataRaw,
        VariableToEventWriteOn::Change,
        "NAV1_VOLUME_SET_EX1",
    )?;
    builder.variable_to_event(
        Variable::aspect("VOR2_VOLUME"),
        VariableToEventMapping::EventDataRaw,
        VariableToEventWriteOn::Change,
        "NAV2_VOLUME_SET_EX1",
    )?;
    builder.variable_to_event(
        Variable::aspect("ILS_VOLUME"),
        VariableToEventMapping::EventDataRaw,
        VariableToEventWriteOn::Change,
        "NAV3_VOLUME_SET_EX1",
    )?;
    builder.variable_to_event(
        Variable::aspect("GLS_VOLUME"),
        VariableToEventMapping::EventDataRaw,
        VariableToEventWriteOn::Change,
        "NAV4_VOLUME_SET_EX1",
    )?;

    builder.variable_to_event(
        Variable::aspect("ADF1_IDENT"),
        VariableToEventMapping::EventDataRaw,
        VariableToEventWriteOn::Change,
        "RADIO_ADF1_IDENT_SET",
    )?;
    builder.variable_to_event(
        Variable::aspect("ADF2_IDENT"),
        VariableToEventMapping::EventDataRaw,
        VariableToEventWriteOn::Change,
        "RADIO_ADF2_IDENT_SET",
    )?;
    builder.variable_to_event(
        Variable::aspect("VOR1_IDENT"),
        VariableToEventMapping::EventDataRaw,
        VariableToEventWriteOn::Change,
        "NAV1_VOLUME_SET_EX1",
    )?;
    builder.variable_to_event(
        Variable::aspect("VOR2_IDENT"),
        VariableToEventMapping::EventDataRaw,
        VariableToEventWriteOn::Change,
        "NAV2_VOLUME_SET_EX1",
    )?;
    builder.variable_to_event(
        Variable::aspect("ILS_IDENT"),
        VariableToEventMapping::EventDataRaw,
        VariableToEventWriteOn::Change,
        "RADIO_DME3_IDENT_SET",
    )?;
    builder.variable_to_event(
        Variable::aspect("GLS_IDENT"),
        VariableToEventMapping::EventDataRaw,
        VariableToEventWriteOn::Change,
        "RADIO_DME4_IDENT_SET",
    )?;

    Ok(())
}

fn to_percent_max(accumulator: f64, item: f64) -> f64 {
    max(accumulator, item * 100.)
}
