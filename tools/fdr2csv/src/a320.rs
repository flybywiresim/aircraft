use crate::{
    a320_headers::{
        ap_laws_output, ap_sm_output, athr_out, base_elac_analog_outputs,
        base_elac_discrete_outputs, base_elac_out_bus, base_fac_analog_outputs, base_fac_bus,
        base_fac_discrete_outputs, base_sec_analog_outputs, base_sec_discrete_outputs,
        base_sec_out_bus, AircraftSpecificData, BaseData,
    },
    read_bytes,
};
use serde::Serialize;
use std::io::{prelude::*, Error};

pub const INTERFACE_VERSION: u64 = 3200001;

// A single FDR record
#[derive(Serialize, Default)]
pub struct FdrData {
    base: BaseData,
    specific: AircraftSpecificData,
    elac_1: ElacData,
    elac_2: ElacData,
    sec_1: SecData,
    sec_2: SecData,
    sec_3: SecData,
    fac_1: FacData,
    fac_2: FacData,
    ap_sm: ap_sm_output,
    ap_law: ap_laws_output,
    athr: athr_out,
}

#[derive(Serialize, Default)]
struct ElacData {
    bus_outputs: base_elac_out_bus,
    discrete_outputs: base_elac_discrete_outputs,
    analog_outputs: base_elac_analog_outputs,
}

#[derive(Serialize, Default)]
struct SecData {
    bus_outputs: base_sec_out_bus,
    discrete_outputs: base_sec_discrete_outputs,
    analog_outputs: base_sec_analog_outputs,
}

#[derive(Serialize, Default)]
struct FacData {
    bus_outputs: base_fac_bus,
    discrete_outputs: base_fac_discrete_outputs,
    analog_outputs: base_fac_analog_outputs,
}

// These are helper functions to read in a whole FDR record.
pub fn read_record(reader: &mut impl Read) -> Result<FdrData, Error> {
    Ok(FdrData {
        base: read_bytes::<BaseData>(reader)?,
        specific: read_bytes::<AircraftSpecificData>(reader)?,
        elac_1: read_elac(reader)?,
        elac_2: read_elac(reader)?,
        sec_1: read_sec(reader)?,
        sec_2: read_sec(reader)?,
        sec_3: read_sec(reader)?,
        fac_1: read_fac(reader)?,
        fac_2: read_fac(reader)?,
        ap_sm: read_bytes::<ap_sm_output>(reader)?,
        ap_law: read_bytes::<ap_laws_output>(reader)?,
        athr: read_bytes::<athr_out>(reader)?,
    })
}

fn read_elac(reader: &mut impl Read) -> Result<ElacData, Error> {
    Ok(ElacData {
        bus_outputs: read_bytes::<base_elac_out_bus>(reader)?,
        discrete_outputs: read_bytes::<base_elac_discrete_outputs>(reader)?,
        analog_outputs: read_bytes::<base_elac_analog_outputs>(reader)?,
    })
}

fn read_sec(reader: &mut impl Read) -> Result<SecData, Error> {
    Ok(SecData {
        bus_outputs: read_bytes::<base_sec_out_bus>(reader)?,
        discrete_outputs: read_bytes::<base_sec_discrete_outputs>(reader)?,
        analog_outputs: read_bytes::<base_sec_analog_outputs>(reader)?,
    })
}

fn read_fac(reader: &mut impl Read) -> Result<FacData, Error> {
    Ok(FacData {
        bus_outputs: read_bytes::<base_fac_bus>(reader)?,
        discrete_outputs: read_bytes::<base_fac_discrete_outputs>(reader)?,
        analog_outputs: read_bytes::<base_fac_analog_outputs>(reader)?,
    })
}
