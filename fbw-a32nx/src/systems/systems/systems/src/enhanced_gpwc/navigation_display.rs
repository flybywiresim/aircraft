use crate::simulation::{
    InitContext, Read, SimulationElement, SimulatorReader, SimulatorWriter, VariableIdentifier,
    Write,
};
use std::vec::Vec;
use uom::si::{
    f64::{Length, Ratio},
    length::nautical_mile,
    ratio::percent,
};

pub struct NavigationDisplay {
    range_knob_id: VariableIdentifier,
    range_knob_position: usize,
    range: Length,
    mode_id: VariableIdentifier,
    mode: u8,
    terrain_on_nd_pb_id: VariableIdentifier,
    terrain_on_nd_pb_active: bool,
    terrain_on_nd_active: bool,
    potentiometer_id: VariableIdentifier,
    potentiometer: Ratio,
    // output variables of the display
    egpwc_nd_range_id: VariableIdentifier,
    egpwc_nd_terrain_active_id: VariableIdentifier,
}

impl NavigationDisplay {
    pub fn new(context: &mut InitContext, side: &str) -> Self {
        NavigationDisplay {
            range_knob_id: context.get_identifier(format!("EFIS_{}_ND_RANGE", side)),
            range_knob_position: 0,
            range: Length::new::<nautical_mile>(10.0),
            mode_id: context.get_identifier(format!("EFIS_{}_ND_MODE", side)),
            mode: 0,
            terrain_on_nd_pb_id: context.get_identifier(format!("EFIS_TERR_{}_ACTIVE", side)),
            terrain_on_nd_pb_active: false,
            terrain_on_nd_active: false,
            potentiometer_id: context
                .get_identifier(format!("ND_{}_TERR_ON_ND_POTENTIOMETER", side)),
            potentiometer: Ratio::new::<percent>(100.0),
            egpwc_nd_range_id: context.get_identifier(format!("EGPWC_ND_{}_RANGE", side)),
            egpwc_nd_terrain_active_id: context
                .get_identifier(format!("EGPWC_ND_{}_TERRAIN_ACTIVE", side)),
        }
    }

    pub fn update(&mut self, range_lookup: &[Length], adiru_data_valid: bool) {
        self.range = range_lookup[self.range_knob_position];
        self.terrain_on_nd_active = adiru_data_valid && self.terrain_on_nd_pb_active;
    }
}

impl SimulationElement for NavigationDisplay {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.range_knob_position = reader.read(&self.range_knob_id);
        self.mode = reader.read(&self.mode_id);
        self.terrain_on_nd_pb_active = reader.read(&self.terrain_on_nd_pb_id);
        self.potentiometer = Ratio::new::<percent>(reader.read(&self.potentiometer_id));
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.egpwc_nd_range_id, self.range.get::<nautical_mile>());
        writer.write(&self.egpwc_nd_terrain_active_id, self.terrain_on_nd_active);
    }
}
