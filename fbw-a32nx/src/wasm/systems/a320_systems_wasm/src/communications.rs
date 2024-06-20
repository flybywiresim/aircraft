use std::error::Error;
use systems_wasm::aspects::{MsfsAspectBuilder, VariableToEventMapping, VariableToEventWriteOn};
use systems_wasm::Variable;

pub(super) fn communications(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    builder.init_variable(Variable::aspect("VHF1_VOLUME"), 80.0);
    builder.init_variable(Variable::aspect("VHF2_VOLUME"), 40.0);

    builder.variable_to_event(
        Variable::aspect("PILOT_TRANSMIT_CHANNEL"),
        VariableToEventMapping::EventDataRaw,
        VariableToEventWriteOn::Change,
        "PILOT_TRANSMITTER_SET",
    )?;
    // EveryTick due to a bug within the SDK
    // Whenever the pilot version is set, the copilot version is too
    // Therefore as workaround, we need to constantly update the copilot version
    builder.variable_to_event(
        Variable::aspect("COPILOT_TRANSMIT_CHANNEL"),
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
    // EveryTick due to an issue with volume initialisation
    // Somestimes, the SDK doesn't seem to take into account our default value
    // therefore the volume remains at 100% until it's changed on the ACP
    // Waiting for an field in .flt files
    builder.variable_to_event(
        Variable::aspect("VHF1_VOLUME"),
        VariableToEventMapping::EventDataRaw,
        VariableToEventWriteOn::EveryTick,
        "COM1_VOLUME_SET",
    )?;
    builder.variable_to_event(
        Variable::aspect("VHF2_VOLUME"),
        VariableToEventMapping::EventDataRaw,
        VariableToEventWriteOn::EveryTick,
        "COM2_VOLUME_SET",
    )?;
    builder.variable_to_event(
        Variable::aspect("VHF3_VOLUME"),
        VariableToEventMapping::EventDataRaw,
        VariableToEventWriteOn::Change,
        "COM3_VOLUME_SET",
    )?;
    builder.variable_to_event(
        Variable::aspect("MARKER_IDENT"),
        VariableToEventMapping::EventDataRaw,
        VariableToEventWriteOn::Change,
        "MARKER_SOUND_TOGGLE",
    )?;
    builder.variable_to_event(
        Variable::aspect("ADF1_IDENT"),
        VariableToEventMapping::EventDataRaw,
        VariableToEventWriteOn::Change,
        "RADIO_ADF_IDENT_SET",
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
        "RADIO_VOR1_IDENT_SET",
    )?;
    builder.variable_to_event(
        Variable::aspect("VOR1_IDENT"),
        VariableToEventMapping::EventDataRaw,
        VariableToEventWriteOn::Change,
        "RADIO_DME1_IDENT_SET",
    )?;
    builder.variable_to_event(
        Variable::aspect("VOR2_IDENT"),
        VariableToEventMapping::EventDataRaw,
        VariableToEventWriteOn::Change,
        "RADIO_VOR2_IDENT_SET",
    )?;
    builder.variable_to_event(
        Variable::aspect("VOR2_IDENT"),
        VariableToEventMapping::EventDataRaw,
        VariableToEventWriteOn::Change,
        "RADIO_DME2_IDENT_SET",
    )?;
    // The next two get data from ILS_IDENT since both MMRs are ILS only (so far)
    builder.variable_to_event(
        Variable::aspect("ILS_IDENT"),
        VariableToEventMapping::EventDataRaw,
        VariableToEventWriteOn::Change,
        "RADIO_VOR3_IDENT_SET",
    )?;
    builder.variable_to_event(
        Variable::aspect("ILS_IDENT"),
        VariableToEventMapping::EventDataRaw,
        VariableToEventWriteOn::Change,
        "RADIO_VOR4_IDENT_SET",
    )?;

    Ok(())
}
