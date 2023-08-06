use uom::si::{f64::Mass, mass::kilogram};

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
    zfw_cg_mac_id: VariableIdentifier,
    gw_cg_mac_id: VariableIdentifier,
    to_cg_mac_id: VariableIdentifier,
    target_zfw_cg_mac_id: VariableIdentifier,
    target_gw_cg_mac_id: VariableIdentifier,
    target_to_cg_mac_id: VariableIdentifier,
    zfw_cg_mac: f64,
    gw_cg_mac: f64,
    to_cg_mac: f64,
    target_zfw_cg_mac: f64,
    target_gw_cg_mac: f64,
    target_to_cg_mac: f64,
}
impl CgMac {
    pub fn new(
        zfw_cg_mac_id: VariableIdentifier,
        gw_cg_mac_id: VariableIdentifier,
        to_cg_mac_id: VariableIdentifier,
        target_zfw_cg_mac_id: VariableIdentifier,
        target_gw_cg_mac_id: VariableIdentifier,
        target_to_cg_mac_id: VariableIdentifier,
    ) -> Self {
        CgMac {
            zfw_cg_mac_id,
            gw_cg_mac_id,
            to_cg_mac_id,
            target_zfw_cg_mac_id,
            target_gw_cg_mac_id,
            target_to_cg_mac_id,
            zfw_cg_mac: 0.,
            gw_cg_mac: 0.,
            to_cg_mac: 0.,
            target_zfw_cg_mac: 0.,
            target_gw_cg_mac: 0.,
            target_to_cg_mac: 0.,
        }
    }

    pub fn zfw_cg_mac(&self) -> f64 {
        self.zfw_cg_mac
    }

    pub fn set_zfw_cg_mac(&mut self, zfw_cg_mac: f64) {
        self.zfw_cg_mac = zfw_cg_mac;
    }

    pub fn gw_cg_mac(&self) -> f64 {
        self.gw_cg_mac
    }

    pub fn set_gw_cg_mac(&mut self, gw_cg_mac: f64) {
        self.gw_cg_mac = gw_cg_mac;
    }

    pub fn to_cg_mac(&self) -> f64 {
        self.to_cg_mac
    }

    pub fn set_to_cg_mac(&mut self, to_cg_mac: f64) {
        self.to_cg_mac = to_cg_mac;
    }

    pub fn target_zfw_cg_mac(&self) -> f64 {
        self.target_zfw_cg_mac
    }

    pub fn set_target_zfw_cg_mac(&mut self, target_zfw_cg_mac: f64) {
        self.target_zfw_cg_mac = target_zfw_cg_mac;
    }

    pub fn target_gw_cg_mac(&self) -> f64 {
        self.target_gw_cg_mac
    }

    pub fn set_target_gw_cg_mac(&mut self, target_gw_cg_mac: f64) {
        self.target_gw_cg_mac = target_gw_cg_mac;
    }

    pub fn target_to_cg_mac(&self) -> f64 {
        self.target_to_cg_mac
    }

    pub fn set_target_to_cg_mac(&mut self, target_to_cg_mac: f64) {
        self.target_to_cg_mac = target_to_cg_mac;
    }
}
impl SimulationElement for CgMac {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.zfw_cg_mac = reader.read(&self.zfw_cg_mac_id);
        self.gw_cg_mac = reader.read(&self.gw_cg_mac_id);
        self.to_cg_mac = reader.read(&self.to_cg_mac_id);
        self.target_zfw_cg_mac = reader.read(&self.target_zfw_cg_mac_id);
        self.target_gw_cg_mac = reader.read(&self.target_gw_cg_mac_id);
        self.target_to_cg_mac = reader.read(&self.target_to_cg_mac_id);
    }
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.zfw_cg_mac_id, (self.zfw_cg_mac * 100.).round() / 100.);
        writer.write(&self.gw_cg_mac_id, (self.gw_cg_mac * 100.).round() / 100.);
        writer.write(&self.to_cg_mac_id, (self.to_cg_mac * 100.).round() / 100.);
        writer.write(
            &self.target_zfw_cg_mac_id,
            (self.target_zfw_cg_mac * 100.).round() / 100.,
        );
        writer.write(
            &self.target_gw_cg_mac_id,
            (self.target_gw_cg_mac * 100.).round() / 100.,
        );
        writer.write(
            &self.target_to_cg_mac_id,
            (self.target_to_cg_mac * 100.).round() / 100.,
        );
    }
}

pub struct WeightData {
    zfw_id: VariableIdentifier,
    gw_id: VariableIdentifier,
    tow_id: VariableIdentifier,
    target_zfw_id: VariableIdentifier,
    target_gw_id: VariableIdentifier,
    target_tow_id: VariableIdentifier,
    zfw: Mass,
    gw: Mass,
    tow: Mass,
    target_zfw: Mass,
    target_gw: Mass,
    target_tow: Mass,
}
impl WeightData {
    pub fn new(
        zfw_id: VariableIdentifier,
        gw_id: VariableIdentifier,
        tow_id: VariableIdentifier,
        target_zfw_id: VariableIdentifier,
        target_gw_id: VariableIdentifier,
        target_tow_id: VariableIdentifier,
    ) -> Self {
        WeightData {
            zfw_id,
            gw_id,
            tow_id,
            target_zfw_id,
            target_gw_id,
            target_tow_id,
            zfw: Mass::default(),
            gw: Mass::default(),
            tow: Mass::default(),
            target_zfw: Mass::default(),
            target_gw: Mass::default(),
            target_tow: Mass::default(),
        }
    }

    pub fn zfw(&self) -> Mass {
        self.zfw
    }

    pub fn set_zfw(&mut self, zfw: Mass) {
        self.zfw = zfw;
    }

    pub fn gw(&self) -> Mass {
        self.gw
    }

    pub fn set_gw(&mut self, gw: Mass) {
        self.gw = gw;
    }

    pub fn tow(&self) -> Mass {
        self.tow
    }

    pub fn set_tow(&mut self, tow: Mass) {
        self.tow = tow;
    }

    pub fn target_zfw(&self) -> Mass {
        self.target_zfw
    }

    pub fn set_target_zfw(&mut self, target_zfw: Mass) {
        self.target_zfw = target_zfw;
    }

    pub fn target_gw(&self) -> Mass {
        self.target_gw
    }

    pub fn set_target_gw(&mut self, target_gw: Mass) {
        self.target_gw = target_gw;
    }

    pub fn target_tow(&self) -> Mass {
        self.target_tow
    }

    pub fn set_target_tow(&mut self, target_tow: Mass) {
        self.target_tow = target_tow;
    }
}
impl SimulationElement for WeightData {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.zfw = reader.read(&self.zfw_id);
        self.gw = reader.read(&self.gw_id);
        self.tow = reader.read(&self.tow_id);
        self.target_zfw = reader.read(&self.target_zfw_id);
        self.target_gw = reader.read(&self.target_gw_id);
        self.target_tow = reader.read(&self.target_tow_id);
    }
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.zfw_id, self.zfw.get::<kilogram>().round());
        writer.write(&self.gw_id, self.gw.get::<kilogram>().round());
        writer.write(&self.tow_id, self.tow.get::<kilogram>().round());
        writer.write(
            &self.target_zfw_id,
            self.target_zfw.get::<kilogram>().round(),
        );
        writer.write(&self.target_gw_id, self.target_gw.get::<kilogram>().round());
        writer.write(
            &self.target_tow_id,
            self.target_tow.get::<kilogram>().round(),
        );
    }
}
