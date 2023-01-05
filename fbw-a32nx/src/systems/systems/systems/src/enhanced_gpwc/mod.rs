use std::vec::Vec;
use crate::{
    enhanced_gpwc::navigation_display::NavigationDisplay,
    landing_gear::LandingGearControlInterfaceUnitSet,
    shared::{
        arinc429::{Arinc429Word, SignStatus},
        AdirsMeasurementOutputs,
        LgciuGearExtension,
    },
    simulation::{InitContext, Read, SimulationElement, SimulationElementVisitor, VariableIdentifier, SimulatorReader},
};
use uom::si::{
    angle::degree,
    f64::{Angle, Length, Velocity},
    length::{foot},
    velocity::foot_per_minute,
};

pub mod navigation_display;

pub struct EnhancedGPWC {
    fm1_destination_longitude_ssm_id: VariableIdentifier,
    fm1_destination_longitude_id: VariableIdentifier,
    fm1_destination_latitude_ssm_id: VariableIdentifier,
    fm1_destination_latitude_id: VariableIdentifier,
    destination_longitude: Arinc429Word<Angle>,
    destination_latitude: Arinc429Word<Angle>,
    adiru_data_valid: bool,
    latitude: Angle,
    longitude: Angle,
    altitude: Length,
    heading: Angle,
    vertical_speed: Velocity,
    navigation_display_range_lookup: Vec<Length>,
    navigation_displays: [NavigationDisplay; 2],
    gear_is_down: bool,
}

impl EnhancedGPWC {
    pub fn new(
        context: &mut InitContext,
        potentiometer_capt: u32,
        potentiometer_fo: u32,
        range_lookup: Vec<Length>,
    ) -> Self {
        EnhancedGPWC {
            fm1_destination_longitude_ssm_id: context.get_identifier("FM1_DEST_LONG_SSM".to_owned()),
            fm1_destination_longitude_id: context.get_identifier("FM1_DEST_LONG".to_owned()),
            fm1_destination_latitude_ssm_id: context.get_identifier("FM1_DEST_LAT_SSM".to_owned()),
            fm1_destination_latitude_id: context.get_identifier("FM1_DEST_LAT".to_owned()),
            destination_longitude: Arinc429Word::new(Angle::new::<degree>(0.0), SignStatus::FailureWarning),
            destination_latitude: Arinc429Word::new(Angle::new::<degree>(0.0), SignStatus::FailureWarning),
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
            gear_is_down: true,
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

    pub fn update(
        &mut self,
        adirs_output: &impl AdirsMeasurementOutputs,
        lgcius: &LandingGearControlInterfaceUnitSet,
    ) {
        self.update_position_data(adirs_output);
        self.gear_is_down = lgcius.lgciu1().main_down_and_locked();

        self.navigation_displays
            .iter_mut()
            .for_each(|display| display.update(&self.navigation_display_range_lookup, self.adiru_data_valid));
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

    pub fn destination_longitude(&self) -> Arinc429Word<Angle> {
        self.destination_longitude
    }

    pub fn destination_latitude(&self) -> Arinc429Word<Angle> {
        self.destination_latitude
    }
}

impl SimulationElement for EnhancedGPWC {
    fn read(&mut self, reader: &mut SimulatorReader) {
        let destination_long: f64 = reader.read(&self.fm1_destination_longitude_id);
        let destination_lat: f64 = reader.read(&self.fm1_destination_latitude_id);
        let destination_long_ssm: u32 = reader.read(&self.fm1_destination_longitude_ssm_id);
        let destination_lat_ssm: u32 = reader.read(&self.fm1_destination_latitude_ssm_id);

        self.destination_longitude = Arinc429Word::new(Angle::new::<degree>(destination_long), SignStatus::from(destination_long_ssm));
        self.destination_latitude = Arinc429Word::new(Angle::new::<degree>(destination_lat), SignStatus::from(destination_lat_ssm));
    }

    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.navigation_displays
            .iter_mut()
            .for_each(|display| display.accept(visitor));
        visitor.visit(self);
    }
}
