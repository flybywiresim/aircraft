use crate::{
    a320_headers::{
        ap_raw_output, athr_output, base_ecu_bus, base_elac_analog_outputs,
        base_elac_discrete_outputs, base_elac_out_bus, base_fac_analog_outputs, base_fac_bus,
        base_fac_discrete_outputs, base_fmgc_ap_fd_logic_outputs, base_fmgc_athr_outputs,
        base_fmgc_bus_inputs, base_fmgc_bus_outputs, base_fmgc_discrete_inputs,
        base_fmgc_discrete_outputs, base_fmgc_logic_outputs, base_fms_inputs,
        base_sec_analog_outputs, base_sec_discrete_outputs, base_sec_out_bus, AircraftSpecificData,
        BaseData,
    },
    read_bytes,
};
use serde::Serialize;
use std::io::{prelude::*, Error};

pub const INTERFACE_VERSION: u64 = 3200002;

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
    fmgc_1: FmgcData,
    fadec_1: FadecData,
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

#[derive(Serialize, Default)]
struct FmgcData {
    logic: base_fmgc_logic_outputs,
    ap_fd_logic: base_fmgc_ap_fd_logic_outputs,
    ap_fd_outer_loops: ap_raw_output,
    athr: base_fmgc_athr_outputs,
    discrete_outputs: base_fmgc_discrete_outputs,
    bus_outputs: base_fmgc_bus_outputs,
    bus_inputs: base_fmgc_bus_inputs,
    discrete_inputs: base_fmgc_discrete_inputs,
    fms_inputs: base_fms_inputs,
}

#[derive(Serialize, Default)]
struct FadecData {
    bus_outputs: base_ecu_bus,
    outputs: athr_output,
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
        fmgc_1: read_fmgc(reader)?,
        fadec_1: read_fadec(reader)?,
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

fn read_fmgc(reader: &mut impl Read) -> Result<FmgcData, Error> {
    Ok(FmgcData {
        logic: read_bytes::<base_fmgc_logic_outputs>(reader)?,
        ap_fd_logic: read_bytes::<base_fmgc_ap_fd_logic_outputs>(reader)?,
        ap_fd_outer_loops: read_bytes::<ap_raw_output>(reader)?,
        athr: read_bytes::<base_fmgc_athr_outputs>(reader)?,
        discrete_outputs: read_bytes::<base_fmgc_discrete_outputs>(reader)?,
        bus_outputs: read_bytes::<base_fmgc_bus_outputs>(reader)?,
        bus_inputs: read_bytes::<base_fmgc_bus_inputs>(reader)?,
        discrete_inputs: read_bytes::<base_fmgc_discrete_inputs>(reader)?,
        fms_inputs: read_bytes::<base_fms_inputs>(reader)?,
    })
}

fn read_fadec(reader: &mut impl Read) -> Result<FadecData, Error> {
    Ok(FadecData {
        bus_outputs: read_bytes::<base_ecu_bus>(reader)?,
        outputs: read_bytes::<athr_output>(reader)?,
    })
}
