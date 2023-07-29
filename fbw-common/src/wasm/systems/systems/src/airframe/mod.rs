use crate::simulation::{
    Read, SimulationElement, SimulatorReader, SimulatorWriter, VariableIdentifier, Write,
};

pub struct LoadsheetInfo {
    pub operating_empty_weight_kg: f64,
    pub operating_empty_position: (f64, f64, f64),
    pub per_pax_weight_kg: f64,
    pub mac_size: f64,
    pub lemac_z: f64,
}

pub struct CgMac {
    cg_mac_id: VariableIdentifier,
    cg_mac: f64,
}
impl CgMac {
    pub fn new(cg_mac_id: VariableIdentifier, cg_mac: f64) -> Self {
        CgMac { cg_mac_id, cg_mac }
    }

    pub fn cg_mac(&self) -> f64 {
        self.cg_mac
    }

    pub fn set_cg_mac(&mut self, cg_mac: f64) {
        self.cg_mac = cg_mac;
    }
}
impl SimulationElement for CgMac {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.cg_mac = reader.read(&self.cg_mac_id);
    }
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.cg_mac_id, self.cg_mac);
        //writer.write(&self.cg_mac_id, self.cg_mac);
    }
}
