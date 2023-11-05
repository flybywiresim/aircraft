use uom::si::{f64::Mass, mass::kilogram};

use crate::simulation::{
    InitContext, Read, SimulationElement, SimulatorReader, SimulatorWriter, VariableIdentifier,
    Write,
};

pub struct LoadsheetInfo {
    pub operating_empty_weight_kg: f64,
    pub operating_empty_position: (f64, f64, f64), // (x, y, z)
    pub per_pax_weight_kg: f64,
    pub mean_aerodynamic_chord_size: f64, // from SDK developer mode debug
    pub leading_edge_mean_aerodynamic_chord: f64, // from SDK developer mode debug
}

pub struct CenterOfGravityData {
    zero_fuel_weight_center_of_gravity_id: VariableIdentifier,
    gross_weight_center_of_gravity_id: VariableIdentifier,
    take_off_center_of_gravity_id: VariableIdentifier,
    target_zero_fuel_weight_center_of_gravity_id: VariableIdentifier,
    target_gross_weight_center_of_gravity_id: VariableIdentifier,
    target_take_off_center_of_gravity_id: VariableIdentifier,
    zero_fuel_weight_center_of_gravity: f64, // in % MAC
    gross_weight_center_of_gravity: f64,     // in % MAC
    take_off_center_of_gravity: f64,         // in % MAC
    target_zero_fuel_weight_center_of_gravity: f64, // in % MAC
    target_gross_weight_center_of_gravity: f64, // in % MAC
    target_take_off_center_of_gravity: f64,  // in % MAC
}
impl CenterOfGravityData {
    pub fn new(context: &mut InitContext) -> Self {
        CenterOfGravityData {
            zero_fuel_weight_center_of_gravity_id: context
                .get_identifier("AIRFRAME_ZFW_CG_PERCENT_MAC".to_owned()),
            gross_weight_center_of_gravity_id: context
                .get_identifier("AIRFRAME_GW_CG_PERCENT_MAC".to_owned()),
            take_off_center_of_gravity_id: context
                .get_identifier("AIRFRAME_TO_CG_PERCENT_MAC".to_owned()),
            target_zero_fuel_weight_center_of_gravity_id: context
                .get_identifier("AIRFRAME_ZFW_CG_PERCENT_MAC_DESIRED".to_owned()),
            target_gross_weight_center_of_gravity_id: context
                .get_identifier("AIRFRAME_GW_CG_PERCENT_MAC_DESIRED".to_owned()),
            target_take_off_center_of_gravity_id: context
                .get_identifier("AIRFRAME_TO_CG_PERCENT_MAC_DESIRED".to_owned()),
            zero_fuel_weight_center_of_gravity: 0.,
            gross_weight_center_of_gravity: 0.,
            take_off_center_of_gravity: 0.,
            target_zero_fuel_weight_center_of_gravity: 0.,
            target_gross_weight_center_of_gravity: 0.,
            target_take_off_center_of_gravity: 0.,
        }
    }

    pub fn zero_fuel_weight_center_of_gravity(&self) -> f64 {
        self.zero_fuel_weight_center_of_gravity
    }

    pub fn set_zero_fuel_weight_center_of_gravity(
        &mut self,
        zero_fuel_weight_center_of_gravity: f64,
    ) {
        self.zero_fuel_weight_center_of_gravity = zero_fuel_weight_center_of_gravity;
    }

    pub fn gross_weight_center_of_gravity(&self) -> f64 {
        self.gross_weight_center_of_gravity
    }

    pub fn set_gross_weight_center_of_gravity(&mut self, gross_weight_center_of_gravity: f64) {
        self.gross_weight_center_of_gravity = gross_weight_center_of_gravity;
    }

    pub fn take_off_center_of_gravity(&self) -> f64 {
        self.take_off_center_of_gravity
    }

    pub fn set_take_off_center_of_gravity(&mut self, take_off_center_of_gravity: f64) {
        self.take_off_center_of_gravity = take_off_center_of_gravity;
    }

    pub fn target_zero_fuel_weight_center_of_gravity(&self) -> f64 {
        self.target_zero_fuel_weight_center_of_gravity
    }

    pub fn set_target_zero_fuel_weight_center_of_gravity(
        &mut self,
        target_zero_fuel_weight_center_of_gravity: f64,
    ) {
        self.target_zero_fuel_weight_center_of_gravity = target_zero_fuel_weight_center_of_gravity;
    }

    pub fn target_gross_weight_center_of_gravity(&self) -> f64 {
        self.target_gross_weight_center_of_gravity
    }

    pub fn set_target_gross_weight_center_of_gravity(
        &mut self,
        target_gross_weight_center_of_gravity: f64,
    ) {
        self.target_gross_weight_center_of_gravity = target_gross_weight_center_of_gravity;
    }

    pub fn target_take_off_center_of_gravity(&self) -> f64 {
        self.target_take_off_center_of_gravity
    }

    pub fn set_target_take_off_center_of_gravity(
        &mut self,
        target_take_off_center_of_gravity: f64,
    ) {
        self.target_take_off_center_of_gravity = target_take_off_center_of_gravity;
    }

    fn round_cg_value(center_of_gravity: f64) -> f64 {
        (center_of_gravity * 100.).round() / 100.
    }
}

impl SimulationElement for CenterOfGravityData {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.zero_fuel_weight_center_of_gravity =
            reader.read(&self.zero_fuel_weight_center_of_gravity_id);
        self.gross_weight_center_of_gravity = reader.read(&self.gross_weight_center_of_gravity_id);
        self.take_off_center_of_gravity = reader.read(&self.take_off_center_of_gravity_id);
        self.target_zero_fuel_weight_center_of_gravity =
            reader.read(&self.target_zero_fuel_weight_center_of_gravity_id);
        self.target_gross_weight_center_of_gravity =
            reader.read(&self.target_gross_weight_center_of_gravity_id);
        self.target_take_off_center_of_gravity =
            reader.read(&self.target_take_off_center_of_gravity_id);
    }
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.zero_fuel_weight_center_of_gravity_id,
            CenterOfGravityData::round_cg_value(self.zero_fuel_weight_center_of_gravity),
        );
        writer.write(
            &self.gross_weight_center_of_gravity_id,
            CenterOfGravityData::round_cg_value(self.gross_weight_center_of_gravity),
        );
        writer.write(
            &self.take_off_center_of_gravity_id,
            CenterOfGravityData::round_cg_value(self.take_off_center_of_gravity),
        );
        writer.write(
            &self.target_zero_fuel_weight_center_of_gravity_id,
            CenterOfGravityData::round_cg_value(self.target_zero_fuel_weight_center_of_gravity),
        );
        writer.write(
            &self.target_gross_weight_center_of_gravity_id,
            CenterOfGravityData::round_cg_value(self.target_gross_weight_center_of_gravity),
        );
        writer.write(
            &self.target_take_off_center_of_gravity_id,
            CenterOfGravityData::round_cg_value(self.target_take_off_center_of_gravity),
        );
    }
}

pub struct WeightData {
    zero_fuel_weight_id: VariableIdentifier,
    gross_weight_id: VariableIdentifier,
    take_off_weight_id: VariableIdentifier,

    target_zero_fuel_weight_id: VariableIdentifier,
    target_gross_weight_id: VariableIdentifier,
    target_take_off_weight_id: VariableIdentifier,

    zero_fuel_weight: Mass,
    gross_weight: Mass,
    take_off_weight: Mass,

    target_zero_fuel_weight: Mass,
    target_gross_weight: Mass,
    target_take_off_weight: Mass,
}
impl WeightData {
    pub fn new(context: &mut InitContext) -> Self {
        WeightData {
            zero_fuel_weight_id: context.get_identifier("AIRFRAME_ZFW".to_owned()),
            gross_weight_id: context.get_identifier("AIRFRAME_GW".to_owned()),
            take_off_weight_id: context.get_identifier("AIRFRAME_TOW".to_owned()),
            target_zero_fuel_weight_id: context.get_identifier("AIRFRAME_ZFW_DESIRED".to_owned()),
            target_gross_weight_id: context.get_identifier("AIRFRAME_GW_DESIRED".to_owned()),
            target_take_off_weight_id: context.get_identifier("AIRFRAME_TOW_DESIRED".to_owned()),
            zero_fuel_weight: Mass::default(),
            gross_weight: Mass::default(),
            take_off_weight: Mass::default(),
            target_zero_fuel_weight: Mass::default(),
            target_gross_weight: Mass::default(),
            target_take_off_weight: Mass::default(),
        }
    }

    pub fn zero_fuel_weight(&self) -> Mass {
        self.zero_fuel_weight
    }

    pub fn set_zero_fuel_weight(&mut self, zero_fuel_weight: Mass) {
        self.zero_fuel_weight = zero_fuel_weight;
    }

    pub fn gross_weight(&self) -> Mass {
        self.gross_weight
    }

    pub fn set_gross_weight(&mut self, gross_weight: Mass) {
        self.gross_weight = gross_weight;
    }

    pub fn take_off_weight(&self) -> Mass {
        self.take_off_weight
    }

    pub fn set_take_off_weight(&mut self, take_off_weight: Mass) {
        self.take_off_weight = take_off_weight;
    }

    pub fn target_zero_fuel_weight(&self) -> Mass {
        self.target_zero_fuel_weight
    }

    pub fn set_target_zero_fuel_weight(&mut self, target_zero_fuel_weight: Mass) {
        self.target_zero_fuel_weight = target_zero_fuel_weight;
    }

    pub fn target_gross_weight(&self) -> Mass {
        self.target_gross_weight
    }

    pub fn set_target_gross_weight(&mut self, target_gross_weight: Mass) {
        self.target_gross_weight = target_gross_weight;
    }

    pub fn target_take_off_weight(&self) -> Mass {
        self.target_take_off_weight
    }

    pub fn set_target_take_off_weight(&mut self, target_take_off_weight: Mass) {
        self.target_take_off_weight = target_take_off_weight;
    }
}
impl SimulationElement for WeightData {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.zero_fuel_weight = reader.read(&self.zero_fuel_weight_id);
        self.gross_weight = reader.read(&self.gross_weight_id);
        self.take_off_weight = reader.read(&self.take_off_weight_id);
        self.target_zero_fuel_weight = reader.read(&self.target_zero_fuel_weight_id);
        self.target_gross_weight = reader.read(&self.target_gross_weight_id);
        self.target_take_off_weight = reader.read(&self.target_take_off_weight_id);
    }
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.zero_fuel_weight_id,
            self.zero_fuel_weight.get::<kilogram>().round(),
        );
        writer.write(
            &self.gross_weight_id,
            self.gross_weight.get::<kilogram>().round(),
        );
        writer.write(
            &self.take_off_weight_id,
            self.take_off_weight.get::<kilogram>().round(),
        );
        writer.write(
            &self.target_zero_fuel_weight_id,
            self.target_zero_fuel_weight.get::<kilogram>().round(),
        );
        writer.write(
            &self.target_gross_weight_id,
            self.target_gross_weight.get::<kilogram>().round(),
        );
        writer.write(
            &self.target_take_off_weight_id,
            self.target_take_off_weight.get::<kilogram>().round(),
        );
    }
}
