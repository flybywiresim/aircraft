use crate::{
    a380_headers::{
        base_prim_analog_outputs, base_prim_ap_fd_logic_outputs, base_prim_discrete_outputs,
        base_prim_fctl_logic_outputs, base_prim_fg_laws_outputs, base_prim_fg_logic_output,
        base_prim_flight_envelope_outputs, base_prim_general_logic_outputs, base_prim_laws_outputs,
        base_prim_out_bus, base_sec_analog_outputs, base_sec_discrete_outputs, base_sec_out_bus,
        AircraftSpecificData, BaseData, FuelSystemData,
    },
    read_bytes,
};
use serde::Serialize;
use std::io::{prelude::*, Error};

pub const INTERFACE_VERSION: u64 = 3800008;
pub const INTERFACE_MIN_VERSION: u64 = 3800000;

// A single FDR record
#[derive(Serialize, Default)]
pub struct FdrData {
    base: BaseData,
    specific: AircraftSpecificData,
    prim_1: PrimData,
    prim_2: PrimData,
    prim_3: PrimData,
    master_prim_index: i32,
    master_prim: MasterPrimData,
    sec_1: SecData,
    sec_2: SecData,
    sec_3: SecData,
    fuel: FuelSystemData,
}

#[derive(Serialize, Default)]
struct PrimData {
    bus_outputs: base_prim_out_bus,
    discrete_outputs: base_prim_discrete_outputs,
    analog_outputs: base_prim_analog_outputs,
}

#[derive(Serialize, Default)]
struct MasterPrimData {
    general_logic: base_prim_general_logic_outputs,
    flight_envelope: base_prim_flight_envelope_outputs,
    fg_logic: base_prim_fg_logic_output,
    fg_mode_logic: base_prim_ap_fd_logic_outputs,
    fg_laws: base_prim_fg_laws_outputs,
    fctl_logic: base_prim_fctl_logic_outputs,
    laws: base_prim_laws_outputs,
}

#[derive(Serialize, Default)]
struct SecData {
    bus_outputs: base_sec_out_bus,
    discrete_outputs: base_sec_discrete_outputs,
    analog_outputs: base_sec_analog_outputs,
}

// These are helper functions to read in a whole FDR record.
pub fn read_record(reader: &mut impl Read) -> Result<FdrData, Error> {
    Ok(FdrData {
        base: read_bytes::<BaseData>(reader)?,
        specific: read_bytes::<AircraftSpecificData>(reader)?,
        prim_1: read_prim(reader)?,
        prim_2: read_prim(reader)?,
        prim_3: read_prim(reader)?,
        master_prim_index: read_bytes::<i32>(reader)?,
        master_prim: read_master_prim(reader)?,
        sec_1: read_sec(reader)?,
        sec_2: read_sec(reader)?,
        sec_3: read_sec(reader)?,

        fuel: read_bytes::<FuelSystemData>(reader)?,
    })
}

fn read_prim(reader: &mut impl Read) -> Result<PrimData, Error> {
    Ok(PrimData {
        bus_outputs: read_bytes::<base_prim_out_bus>(reader)?,
        discrete_outputs: read_bytes::<base_prim_discrete_outputs>(reader)?,
        analog_outputs: read_bytes::<base_prim_analog_outputs>(reader)?,
    })
}

fn read_master_prim(reader: &mut impl Read) -> Result<MasterPrimData, Error> {
    Ok(MasterPrimData {
        general_logic: read_bytes::<base_prim_general_logic_outputs>(reader)?,
        flight_envelope: read_bytes::<base_prim_flight_envelope_outputs>(reader)?,
        fg_logic: read_bytes::<base_prim_fg_logic_output>(reader)?,
        fg_mode_logic: read_bytes::<base_prim_ap_fd_logic_outputs>(reader)?,
        fg_laws: read_bytes::<base_prim_fg_laws_outputs>(reader)?,
        fctl_logic: read_bytes::<base_prim_fctl_logic_outputs>(reader)?,
        laws: read_bytes::<base_prim_laws_outputs>(reader)?,
    })
}

fn read_sec(reader: &mut impl Read) -> Result<SecData, Error> {
    Ok(SecData {
        bus_outputs: read_bytes::<base_sec_out_bus>(reader)?,
        discrete_outputs: read_bytes::<base_sec_discrete_outputs>(reader)?,
        analog_outputs: read_bytes::<base_sec_analog_outputs>(reader)?,
    })
}
