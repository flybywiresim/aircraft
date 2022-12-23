use std::vec::Vec;
use crate::{
    simulation::{InitContext, Read, SimulationElement, SimulatorReader, VariableIdentifier},
    shared::arinc429::{Arinc429Word, SignStatus},
};
use uom::si::{
    angle::degree,
    f64::{Angle, Length, Velocity, Ratio},
    length::{foot, nautical_mile},
    ratio::{percent},
    velocity::foot_per_minute,
};

pub struct InputData {
    adirs_latitude_id: VariableIdentifier,
    pub adirs_latitude: Arinc429Word<Angle>,
    adirs_longitude_id: VariableIdentifier,
    pub adirs_longitude: Arinc429Word<Angle>,
    adirs_heading_id: VariableIdentifier,
    pub adirs_heading: Arinc429Word<Angle>,
    adirs_altitude_id: VariableIdentifier,
    pub adirs_altitude: Arinc429Word<Length>,
    adirs_vertical_speed_id: VariableIdentifier,
    pub adirs_vertical_speed: Arinc429Word<Velocity>,
    fcu_capt_range_knob_id: VariableIdentifier,
    pub fcu_capt_range: Length,
    fcu_fo_range_knob_id: VariableIdentifier,
    pub fcu_fo_range: Length,
    efis_capt_nd_mode_id: VariableIdentifier,
    pub efis_capt_nd_mode: u8,
    efis_fo_nd_mode_id: VariableIdentifier,
    pub efis_fo_nd_mode: u8,
    terrain_pb_capt_id: VariableIdentifier,
    pub terrain_pb_capt_active: bool,
    terrain_pb_fo_id: VariableIdentifier,
    pub terrain_pb_fo_active: bool,
    nd_terrain_potentiometer_capt_id: VariableIdentifier,
    pub nd_terrain_potentiometer_capt: Ratio,
    nd_terrain_potentiometer_fo_id: VariableIdentifier,
    pub nd_terrain_potentiometer_fo: Ratio,
    range_look_up_table: Vec<Length>,
}

impl InputData {
    pub fn new(
        context: &mut InitContext,
        potentiometer_capt: u32,
        potentiometer_fo: u32,
        range_look_up: Vec<Length>,
    ) -> Self {
        InputData {
            adirs_latitude_id: context.get_identifier("ADIRS_IR_1_LATITUDE".to_owned()),
            adirs_latitude: Arinc429Word::new(Angle::new::<degree>(0.0), SignStatus::FailureWarning),
            adirs_longitude_id: context.get_identifier("ADIRS_IR_1_LONGITUDE".to_owned()),
            adirs_longitude: Arinc429Word::new(Angle::new::<degree>(0.0), SignStatus::FailureWarning),
            adirs_heading_id: context.get_identifier("ADIRS_IR_1_HEADING".to_owned()),
            adirs_heading: Arinc429Word::new(Angle::new::<degree>(0.0), SignStatus::FailureWarning),
            adirs_altitude_id: context.get_identifier("ADIRS_ADR_1_ALTITUDE".to_owned()),
            adirs_altitude: Arinc429Word::new(Length::new::<foot>(0.0), SignStatus::FailureWarning),
            adirs_vertical_speed_id: context.get_identifier("ADIRS_ADR_1_BAROMETRIC_VERTICAL_SPEED".to_owned()),
            adirs_vertical_speed: Arinc429Word::new(Velocity::new::<foot_per_minute>(0.0), SignStatus::FailureWarning),
            fcu_capt_range_knob_id: context.get_identifier("EFIS_L_ND_RANGE".to_owned()),
            fcu_capt_range: Length::new::<nautical_mile>(0.0),
            fcu_fo_range_knob_id: context.get_identifier("EFIS_R_ND_RANGE".to_owned()),
            fcu_fo_range: Length::new::<nautical_mile>(0.0),
            efis_capt_nd_mode_id: context.get_identifier("EFIS_L_ND_MODE".to_owned()),
            efis_capt_nd_mode: 0,
            efis_fo_nd_mode_id: context.get_identifier("EFIS_L_ND_MODE".to_owned()),
            efis_fo_nd_mode: 0,
            terrain_pb_capt_id: context.get_identifier("EFIS_TERR_L_ACTIVE".to_owned()),
            terrain_pb_capt_active: false,
            terrain_pb_fo_id: context.get_identifier("EFIS_TERR_R_ACTIVE".to_owned()),
            terrain_pb_fo_active: false,
            nd_terrain_potentiometer_capt_id: context.get_identifier(format!("LIGHT POTENTIOMETER:{}", potentiometer_capt)),
            nd_terrain_potentiometer_capt: Ratio::new::<percent>(0.0),
            nd_terrain_potentiometer_fo_id: context.get_identifier(format!("LIGHT POTENTIOMETER:{}", potentiometer_fo)),
            nd_terrain_potentiometer_fo: Ratio::new::<percent>(0.0),
            range_look_up_table: range_look_up,
        }
    }
}

impl SimulationElement for InputData {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.adirs_latitude = reader.read_arinc429(&self.adirs_latitude_id);
        self.adirs_longitude = reader.read_arinc429(&self.adirs_longitude_id);
        self.adirs_heading = reader.read_arinc429(&self.adirs_heading_id);
        self.adirs_altitude = reader.read_arinc429(&self.adirs_altitude_id);
        self.adirs_vertical_speed = reader.read_arinc429(&self.adirs_vertical_speed_id);

        let capt_range_knob: usize = reader.read(&self.fcu_capt_range_knob_id);
        self.fcu_capt_range = self.range_look_up_table[capt_range_knob];
        let fo_range_knob: usize = reader.read(&self.fcu_fo_range_knob_id);
        self.fcu_fo_range = self.range_look_up_table[fo_range_knob];
        self.efis_capt_nd_mode = reader.read(&self.efis_capt_nd_mode_id);
        self.efis_fo_nd_mode = reader.read(&self.efis_fo_nd_mode_id);

        self.terrain_pb_capt_active = reader.read(&self.terrain_pb_capt_id);
        self.terrain_pb_fo_active = reader.read(&self.terrain_pb_fo_id);
        self.nd_terrain_potentiometer_capt = Ratio::new::<percent>(reader.read(&self.nd_terrain_potentiometer_capt_id));
        self.nd_terrain_potentiometer_fo = Ratio::new::<percent>(reader.read(&self.nd_terrain_potentiometer_fo_id));
    }
}
