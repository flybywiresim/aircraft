use std::vec::Vec;
use crate::{
    simulation::{InitContext, SimulationElement, SimulationElementVisitor, SimulatorReader},
    shared::arinc429::{Arinc429Word, SignStatus},
};
use crate::enhanced_gpwc::terrain::Terrain;
use self::input_data::InputData;
use uom::si::{
    angle::degree,
    f64::{Angle, Length, Velocity},
    length::{foot},
    velocity::foot_per_minute,
};

pub mod input_data;
pub mod terrain;

pub struct EnhancedGPWC {
    input_data: InputData,
    pub latitude: Arinc429Word<Angle>,
    pub longitude: Arinc429Word<Angle>,
    pub altitude: Arinc429Word<Length>,
    pub vertical_speed: Arinc429Word<Velocity>,
    pub terrain_nd_left: Terrain,
    pub terrain_nd_right: Terrain,
}

impl EnhancedGPWC {
    pub fn new(
        context: &mut InitContext,
        potentiometer_capt: u32,
        potentiometer_fo: u32,
        range_look_up: Vec<Length>,
    ) -> Self {
        EnhancedGPWC {
            input_data: InputData::new(context, potentiometer_capt, potentiometer_fo, range_look_up),
            latitude: Arinc429Word::new(Angle::new::<degree>(0.0), SignStatus::FailureWarning),
            longitude: Arinc429Word::new(Angle::new::<degree>(0.0), SignStatus::FailureWarning),
            altitude: Arinc429Word::new(Length::new::<foot>(0.0), SignStatus::FailureWarning),
            vertical_speed: Arinc429Word::new(Velocity::new::<foot_per_minute>(0.0), SignStatus::FailureWarning),
            terrain_nd_left: Terrain::new(),
            terrain_nd_right: Terrain::new(),
        }
    }

    fn update_position_data(&mut self) {
        /*
         * documentation hints:
         *   - EGPWC has direct connection to GPS sensor && ADIRS_1
         *   - uses direct GPS data if ADIRS_1 is unavailable
         * TODO:
         *   - implement logic as soon as GPS sensor is available
         */

        self.latitude = self.input_data.adirs_latitude;
        self.longitude = self.input_data.adirs_longitude;
        self.altitude = self.input_data.adirs_altitude;
        self.vertical_speed = self.input_data.adirs_vertical_speed;
    }

    pub fn update(&mut self) {
        self.update_position_data();

        self.terrain_nd_left.update(
            self.latitude,
            self.longitude,
            self.altitude,
            self.vertical_speed,
            self.input_data.terrain_pb_capt_active,
            self.input_data.fcu_capt_range,
            self.input_data.efis_capt_nd_mode,
            self.input_data.nd_terrain_potentiometer_capt,
        );

        self.terrain_nd_right.update(
            self.latitude,
            self.longitude,
            self.altitude,
            self.vertical_speed,
            self.input_data.terrain_pb_fo_active,
            self.input_data.fcu_fo_range,
            self.input_data.efis_fo_nd_mode,
            self.input_data.nd_terrain_potentiometer_fo,
        );
    }
}

impl SimulationElement for EnhancedGPWC {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.input_data.accept(visitor);
        visitor.visit(self);
    }
}
