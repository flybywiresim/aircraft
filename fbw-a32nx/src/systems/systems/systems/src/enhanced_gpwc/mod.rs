use std::vec::Vec;
use crate::{
    enhanced_gpwc::navigation_display::NavigationDisplay,
    shared::AdirsMeasurementOutputs,
    simulation::{InitContext, SimulationElement, SimulationElementVisitor},
};
// use self::navigation_display::NavigationDisplay;
use uom::si::{
    angle::degree,
    f64::{Angle, Length, Velocity},
    length::{foot},
    velocity::foot_per_minute,
};

pub mod navigation_display;
// pub mod terrain;

pub struct EnhancedGPWC {
    adiru_data_valid: bool,
    latitude: Angle,
    longitude: Angle,
    altitude: Length,
    heading: Angle,
    vertical_speed: Velocity,
    navigation_display_range_lookup: Vec<Length>,
    navigation_displays: [NavigationDisplay; 2],
}

impl EnhancedGPWC {
    pub fn new(
        context: &mut InitContext,
        potentiometer_capt: u32,
        potentiometer_fo: u32,
        range_lookup: Vec<Length>,
    ) -> Self {
        EnhancedGPWC {
            adiru_data_valid: false,
            latitude: Angle::new::<degree>(0.0),
            longitude: Angle::new::<degree>(0.0),
            altitude: Length::new::<foot>(0.0),
            heading: Angle::new::<degree>(0.0),
            vertical_speed: Velocity::new::<foot_per_minute>(0.0),
            navigation_display_range_lookup: range_lookup,
            navigation_displays: [
                NavigationDisplay::new(context, "L", potentiometer_capt),
                NavigationDisplay::new(context, "R", potentiometer_fo),
            ],
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

        self.navigation_displays
            .iter_mut()
            .for_each(|display| display.update(&self.navigation_display_range_lookup));
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
        self.navigation_displays
            .iter_mut()
            .for_each(|display| display.accept(visitor));
        // self.input_data.accept(visitor);
        visitor.visit(self);
    }
}
