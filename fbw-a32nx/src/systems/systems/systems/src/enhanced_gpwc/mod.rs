use crate::{
    enhanced_gpwc::navigation_display::NavigationDisplay,
    landing_gear::LandingGearControlInterfaceUnitSet,
    shared::{
        arinc429::{Arinc429Word, SignStatus},
        AdirsMeasurementOutputs, ElectricalBusType, ElectricalBuses, LgciuGearExtension,
    },
    simulation::{
        InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, VariableIdentifier, Write,
    },
};
use std::vec::Vec;
use uom::si::{
    angle::degree,
    f64::{Angle, Length, Velocity},
    length::foot,
    velocity::foot_per_minute,
};

pub mod navigation_display;

pub struct EnhancedGPWC {
    powered_by: ElectricalBusType,
    is_powered: bool,
    fm1_destination_longitude_ssm_id: VariableIdentifier,
    fm1_destination_longitude_id: VariableIdentifier,
    fm1_destination_latitude_ssm_id: VariableIdentifier,
    fm1_destination_latitude_id: VariableIdentifier,
    destination_longitude: Arinc429Word<Angle>,
    destination_latitude: Arinc429Word<Angle>,
    latitude: Arinc429Word<Angle>,
    longitude: Arinc429Word<Angle>,
    altitude: Arinc429Word<Length>,
    heading: Arinc429Word<Angle>,
    vertical_speed: Arinc429Word<Velocity>,
    navigation_display_range_lookup: Vec<Length>,
    navigation_displays: [NavigationDisplay; 2],
    gear_is_down: bool,
    // output variables of the EGPWC
    egpwc_destination_longitude_id: VariableIdentifier,
    egpwc_destination_latitude_id: VariableIdentifier,
    egpwc_present_latitude_id: VariableIdentifier,
    egpwc_present_longitude_id: VariableIdentifier,
    egpwc_gear_is_down_id: VariableIdentifier,
}

impl EnhancedGPWC {
    pub fn new(
        context: &mut InitContext,
        powered_by: ElectricalBusType,
        range_lookup: Vec<Length>,
    ) -> Self {
        EnhancedGPWC {
            powered_by,
            is_powered: false,
            fm1_destination_longitude_ssm_id: context
                .get_identifier("FM1_DEST_LONG_SSM".to_owned()),
            fm1_destination_longitude_id: context.get_identifier("FM1_DEST_LONG".to_owned()),
            fm1_destination_latitude_ssm_id: context.get_identifier("FM1_DEST_LAT_SSM".to_owned()),
            fm1_destination_latitude_id: context.get_identifier("FM1_DEST_LAT".to_owned()),
            destination_longitude: Arinc429Word::new(
                Angle::new::<degree>(0.0),
                SignStatus::FailureWarning,
            ),
            destination_latitude: Arinc429Word::new(
                Angle::new::<degree>(0.0),
                SignStatus::FailureWarning,
            ),
            latitude: Arinc429Word::new(Angle::new::<degree>(0.0), SignStatus::FailureWarning),
            longitude: Arinc429Word::new(Angle::new::<degree>(0.0), SignStatus::FailureWarning),
            altitude: Arinc429Word::new(Length::new::<foot>(0.0), SignStatus::FailureWarning),
            heading: Arinc429Word::new(Angle::new::<degree>(0.0), SignStatus::FailureWarning),
            vertical_speed: Arinc429Word::new(
                Velocity::new::<foot_per_minute>(0.0),
                SignStatus::FailureWarning,
            ),
            navigation_display_range_lookup: range_lookup,
            navigation_displays: [
                NavigationDisplay::new(context, "L"),
                NavigationDisplay::new(context, "R"),
            ],
            gear_is_down: true,
            egpwc_destination_longitude_id: context.get_identifier("EGPWC_DEST_LAT".to_owned()),
            egpwc_destination_latitude_id: context.get_identifier("EGPWC_DEST_LONG".to_owned()),
            egpwc_present_latitude_id: context.get_identifier("EGPWC_PRESENT_LAT".to_owned()),
            egpwc_present_longitude_id: context.get_identifier("EGPWC_PRESENT_LONG".to_owned()),
            egpwc_gear_is_down_id: context.get_identifier("EGPWC_GEAR_IS_DOWN".to_owned()),
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

        if adirs_output.is_fully_aligned(1) && self.is_powered {
            self.latitude =
                Arinc429Word::new(adirs_output.latitude(1), SignStatus::NormalOperation);
            self.longitude =
                Arinc429Word::new(adirs_output.longitude(1), SignStatus::NormalOperation);
            self.altitude =
                Arinc429Word::new(adirs_output.altitude(1), SignStatus::NormalOperation);
            self.heading = Arinc429Word::new(adirs_output.heading(1), SignStatus::NormalOperation);
            self.vertical_speed =
                Arinc429Word::new(adirs_output.vertical_speed(1), SignStatus::NormalOperation);
        } else {
            self.latitude =
                Arinc429Word::new(Angle::new::<degree>(0.0), SignStatus::FailureWarning);
            self.longitude =
                Arinc429Word::new(Angle::new::<degree>(0.0), SignStatus::FailureWarning);
            self.altitude = Arinc429Word::new(Length::new::<foot>(0.0), SignStatus::FailureWarning);
            self.heading = Arinc429Word::new(Angle::new::<degree>(0.0), SignStatus::FailureWarning);
            self.vertical_speed = Arinc429Word::new(
                Velocity::new::<foot_per_minute>(0.0),
                SignStatus::FailureWarning,
            );
        }
    }

    pub fn update(
        &mut self,
        adirs_output: &impl AdirsMeasurementOutputs,
        lgcius: &LandingGearControlInterfaceUnitSet,
    ) {
        self.update_position_data(adirs_output);
        self.gear_is_down = lgcius.lgciu1().main_down_and_locked();

        self.navigation_displays.iter_mut().for_each(|display| {
            display.update(
                &self.navigation_display_range_lookup,
                adirs_output.is_fully_aligned(1),
            )
        });
    }
}

impl SimulationElement for EnhancedGPWC {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by)
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        let destination_long: f64 = reader.read(&self.fm1_destination_longitude_id);
        let destination_lat: f64 = reader.read(&self.fm1_destination_latitude_id);
        let destination_long_ssm: u32 = reader.read(&self.fm1_destination_longitude_ssm_id);
        let destination_lat_ssm: u32 = reader.read(&self.fm1_destination_latitude_ssm_id);

        self.destination_longitude = Arinc429Word::new(
            Angle::new::<degree>(destination_long),
            SignStatus::from(destination_long_ssm),
        );
        self.destination_latitude = Arinc429Word::new(
            Angle::new::<degree>(destination_lat),
            SignStatus::from(destination_lat_ssm),
        );
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write_arinc429(
            &self.egpwc_destination_longitude_id,
            self.destination_longitude.value().get::<degree>(),
            self.destination_longitude.ssm(),
        );
        writer.write_arinc429(
            &self.egpwc_destination_latitude_id,
            self.destination_latitude.value().get::<degree>(),
            self.destination_latitude.ssm(),
        );
        writer.write_arinc429(
            &self.egpwc_present_latitude_id,
            self.latitude.value().get::<degree>(),
            self.latitude.ssm(),
        );
        writer.write_arinc429(
            &self.egpwc_present_longitude_id,
            self.longitude.value().get::<degree>(),
            self.longitude.ssm(),
        );
        writer.write(&self.egpwc_gear_is_down_id, self.gear_is_down);
    }

    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.navigation_displays
            .iter_mut()
            .for_each(|display| display.accept(visitor));
        visitor.visit(self);
    }
}
