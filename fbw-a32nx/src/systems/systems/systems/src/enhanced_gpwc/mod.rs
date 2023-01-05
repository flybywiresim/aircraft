use std::vec::Vec;
use crate::{
    shared::AdirsMeasurementOutputs,
    simulation::{InitContext, SimulationElement, SimulationElementVisitor},
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
    adiru_data_valid: bool,
    latitude: Angle,
    longitude: Angle,
    altitude: Length,
    heading: Angle,
    vertical_speed: Velocity,
    terrain_nd_left: Terrain,
    terrain_nd_right: Terrain,
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
            adiru_data_valid: false,
            latitude: Angle::new::<degree>(0.0),
            longitude: Angle::new::<degree>(0.0),
            altitude: Length::new::<foot>(0.0),
            heading: Angle::new::<degree>(0.0),
            vertical_speed: Velocity::new::<foot_per_minute>(0.0),
            terrain_nd_left: Terrain::new(),
            terrain_nd_right: Terrain::new(),
        }
    }

    fn update_position_data(&mut self, adirs_output: &impl AdirsMeasurementOutputs) {
        /*
         * documentation hints:
         *   - EGPWC has direct connection to GPS sensor && ADIRS_1
         *   - uses direct GPS data if ADIRS_1 is unavailable
         * TODO:
         *   - implement logic as soon as GPS sensor is available
         */

        self.adiru_data_valid = adirs_output.is_fully_aligned(1);
        self.latitude = adirs_output.latitude(1);
        self.longitude = adirs_output.longitude(1);
        self.altitude = adirs_output.altitude(1);
        self.heading = adirs_output.heading(1);
        self.vertical_speed = adirs_output.vertical_speed(1);
    }

    pub fn update(&mut self, adirs_output: &impl AdirsMeasurementOutputs) {
        self.update_position_data(adirs_output);

        self.terrain_nd_left.update(
            self.adiru_data_valid,
            self.input_data.terrain_pb_capt_active,
            self.input_data.fcu_capt_range,
            self.input_data.efis_capt_nd_mode,
            self.input_data.nd_terrain_potentiometer_capt,
        );

        self.terrain_nd_right.update(
            self.adiru_data_valid,
            self.input_data.terrain_pb_fo_active,
            self.input_data.fcu_fo_range,
            self.input_data.efis_fo_nd_mode,
            self.input_data.nd_terrain_potentiometer_fo,
        );
    }

    pub fn latitude(&self) -> Angle {
        self.latitude
    }

    pub fn longitude(&self) -> Angle {
        self.longitude
    }

    pub fn altitude(&self) -> Length {
        self.altitude
    }

    pub fn vertical_speed(&self) -> Velocity {
        self.vertical_speed
    }
}

impl SimulationElement for EnhancedGPWC {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.input_data.accept(visitor);
        visitor.visit(self);
    }
}
