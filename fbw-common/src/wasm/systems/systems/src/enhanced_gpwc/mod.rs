use crate::{
    accept_iterable,
    enhanced_gpwc::navigation_display::NavigationDisplay,
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
    velocity::foot_per_minute,
};

pub mod navigation_display;

pub struct EnhancedGroundProximityWarningComputer {
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
    terronnd_rendering_mode: u8,
    // output variables of the EGPWC
    egpwc_destination_longitude_id: VariableIdentifier,
    egpwc_destination_latitude_id: VariableIdentifier,
    egpwc_present_latitude_id: VariableIdentifier,
    egpwc_present_longitude_id: VariableIdentifier,
    egpwc_present_heading_id: VariableIdentifier,
    egpwc_present_altitude_id: VariableIdentifier,
    egpwc_present_vertical_speed_id: VariableIdentifier,
    egpwc_gear_is_down_id: VariableIdentifier,
    egpwc_terronnd_rendering_mode: VariableIdentifier,
}

impl EnhancedGroundProximityWarningComputer {
    pub fn new(
        context: &mut InitContext,
        powered_by: ElectricalBusType,
        range_lookup: Vec<Length>,
        terronnd_rendering_mode: u8,
    ) -> Self {
        EnhancedGroundProximityWarningComputer {
            powered_by,
            is_powered: false,
            fm1_destination_longitude_ssm_id: context
                .get_identifier("FM1_DEST_LONG_SSM".to_owned()),
            fm1_destination_longitude_id: context.get_identifier("FM1_DEST_LONG".to_owned()),
            fm1_destination_latitude_ssm_id: context.get_identifier("FM1_DEST_LAT_SSM".to_owned()),
            fm1_destination_latitude_id: context.get_identifier("FM1_DEST_LAT".to_owned()),
            destination_longitude: Arinc429Word::new(Angle::default(), SignStatus::FailureWarning),
            destination_latitude: Arinc429Word::new(Angle::default(), SignStatus::FailureWarning),
            latitude: Arinc429Word::new(Angle::default(), SignStatus::FailureWarning),
            longitude: Arinc429Word::new(Angle::default(), SignStatus::FailureWarning),
            altitude: Arinc429Word::new(Length::default(), SignStatus::FailureWarning),
            heading: Arinc429Word::new(Angle::default(), SignStatus::FailureWarning),
            vertical_speed: Arinc429Word::new(Velocity::default(), SignStatus::FailureWarning),
            navigation_display_range_lookup: range_lookup,
            navigation_displays: [
                NavigationDisplay::new(context, "L"),
                NavigationDisplay::new(context, "R"),
            ],
            gear_is_down: true,
            terronnd_rendering_mode,
            egpwc_destination_longitude_id: context.get_identifier("EGPWC_DEST_LONG".to_owned()),
            egpwc_destination_latitude_id: context.get_identifier("EGPWC_DEST_LAT".to_owned()),
            egpwc_present_latitude_id: context.get_identifier("EGPWC_PRESENT_LAT".to_owned()),
            egpwc_present_longitude_id: context.get_identifier("EGPWC_PRESENT_LONG".to_owned()),
            egpwc_present_heading_id: context.get_identifier("EGPWC_PRESENT_HEADING".to_owned()),
            egpwc_present_altitude_id: context.get_identifier("EGPWC_PRESENT_ALTITUDE".to_owned()),
            egpwc_present_vertical_speed_id: context
                .get_identifier("EGPWC_PRESENT_VERTICAL_SPEED".to_owned()),
            egpwc_gear_is_down_id: context.get_identifier("EGPWC_GEAR_IS_DOWN".to_owned()),
            egpwc_terronnd_rendering_mode: context
                .get_identifier("EGPWC_TERRONND_RENDERING_MODE".to_owned()),
        }
    }

    fn update_position_data(&mut self, adirs_output: &impl AdirsMeasurementOutputs) {
        // documentation hints:
        //   - EGPWC has direct connection to GPS sensor && ADIRS_1
        //   - uses direct GPS data if ADIRS_1 is unavailable
        // TODO:
        //   - implement logic as soon as GPS sensor is available
        self.latitude = adirs_output.latitude(1);
        self.longitude = adirs_output.longitude(1);
        self.altitude = adirs_output.altitude(1);
        self.heading = adirs_output.true_heading(1);
        self.vertical_speed = adirs_output.vertical_speed(1);
    }

    pub fn update(
        &mut self,
        adirs_output: &impl AdirsMeasurementOutputs,
        lgcius: &impl LgciuGearExtension,
    ) {
        if !self.is_powered {
            self.destination_longitude =
                Arinc429Word::new(Angle::default(), SignStatus::FailureWarning);
            self.destination_latitude =
                Arinc429Word::new(Angle::default(), SignStatus::FailureWarning);
            self.latitude = Arinc429Word::new(Angle::default(), SignStatus::FailureWarning);
            self.longitude = Arinc429Word::new(Angle::default(), SignStatus::FailureWarning);
            self.altitude = Arinc429Word::new(Length::default(), SignStatus::FailureWarning);
            self.heading = Arinc429Word::new(Angle::default(), SignStatus::FailureWarning);
            self.vertical_speed =
                Arinc429Word::new(Velocity::default(), SignStatus::FailureWarning);

            self.gear_is_down = false;
        } else {
            self.update_position_data(adirs_output);
            self.gear_is_down = lgcius.main_down_and_locked();
        }

        self.navigation_displays.iter_mut().for_each(|display| {
            display.update(
                self.is_powered,
                &self.navigation_display_range_lookup,
                adirs_output.is_fully_aligned(1),
            )
        });
    }
}

impl SimulationElement for EnhancedGroundProximityWarningComputer {
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
        writer.write(
            &self.egpwc_destination_longitude_id,
            self.destination_longitude,
        );
        writer.write(
            &self.egpwc_destination_latitude_id,
            self.destination_latitude,
        );
        writer.write(&self.egpwc_present_latitude_id, self.latitude);
        writer.write(&self.egpwc_present_longitude_id, self.longitude);
        writer.write(&self.egpwc_present_heading_id, self.heading);
        writer.write(&self.egpwc_present_altitude_id, self.altitude);
        writer.write_arinc429(
            &self.egpwc_present_vertical_speed_id,
            self.vertical_speed.value().get::<foot_per_minute>(),
            self.vertical_speed.ssm(),
        );
        writer.write(&self.egpwc_gear_is_down_id, self.gear_is_down);
        writer.write(
            &self.egpwc_terronnd_rendering_mode,
            self.terronnd_rendering_mode,
        );
    }

    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.navigation_displays, visitor);
        visitor.visit(self);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        electrical::{test::TestElectricitySource, ElectricalBus, Electricity},
        shared::PotentialOrigin,
        simulation::{
            test::{ReadByName, SimulationTestBed, TestBed, WriteByName},
            Aircraft, InitContext, SimulationElement, SimulationElementVisitor, UpdateContext,
        },
    };
    use ntest::assert_about_eq;
    use uom::si::{
        angle::degree,
        electric_potential::volt,
        f64::*,
        length::{foot, nautical_mile},
        velocity::foot_per_minute,
    };

    struct TestAdirs {
        is_aligned: bool,
        latitude: Arinc429Word<Angle>,
        longitude: Arinc429Word<Angle>,
        heading: Arinc429Word<Angle>,
        vertical_speed: Arinc429Word<Velocity>,
        altitude: Arinc429Word<Length>,
    }
    impl TestAdirs {
        fn new() -> Self {
            Self {
                is_aligned: false,
                latitude: Arinc429Word::new(Angle::default(), SignStatus::FailureWarning),
                longitude: Arinc429Word::new(Angle::default(), SignStatus::FailureWarning),
                heading: Arinc429Word::new(Angle::default(), SignStatus::FailureWarning),
                vertical_speed: Arinc429Word::new(Velocity::default(), SignStatus::FailureWarning),
                altitude: Arinc429Word::new(Length::default(), SignStatus::FailureWarning),
            }
        }

        fn initialize(&mut self) {
            self.is_aligned = true;
            self.latitude =
                Arinc429Word::new(Angle::new::<degree>(20.3), SignStatus::NormalOperation);
            self.longitude =
                Arinc429Word::new(Angle::new::<degree>(30.3), SignStatus::NormalOperation);
            self.heading =
                Arinc429Word::new(Angle::new::<degree>(310.0), SignStatus::NormalOperation);
            self.vertical_speed = Arinc429Word::new(
                Velocity::new::<foot_per_minute>(1300.0),
                SignStatus::NormalOperation,
            );
            self.altitude =
                Arinc429Word::new(Length::new::<foot>(15000.0), SignStatus::NormalOperation);
        }
    }
    impl AdirsMeasurementOutputs for TestAdirs {
        fn is_fully_aligned(&self, _adiru_number: usize) -> bool {
            self.is_aligned
        }

        fn latitude(&self, _adiru_number: usize) -> Arinc429Word<Angle> {
            self.latitude
        }

        fn longitude(&self, _adiru_number: usize) -> Arinc429Word<Angle> {
            self.longitude
        }

        fn heading(&self, _adiru_number: usize) -> Arinc429Word<Angle> {
            self.heading
        }

        fn true_heading(&self, _adiru_number: usize) -> Arinc429Word<Angle> {
            self.heading
        }

        fn vertical_speed(&self, _adiru_number: usize) -> Arinc429Word<Velocity> {
            self.vertical_speed
        }

        fn altitude(&self, _adiru_number: usize) -> Arinc429Word<Length> {
            self.altitude
        }
    }

    struct TestLgciu {
        gear_down: bool,
    }
    impl TestLgciu {
        fn new() -> Self {
            Self { gear_down: false }
        }

        fn set_gear_down(&mut self, is_down: bool) {
            self.gear_down = is_down;
        }
    }

    impl LgciuGearExtension for TestLgciu {
        fn left_gear_down_and_locked(&self) -> bool {
            self.gear_down
        }

        fn right_gear_down_and_locked(&self) -> bool {
            self.gear_down
        }

        fn nose_gear_down_and_locked(&self) -> bool {
            self.gear_down
        }

        fn all_down_and_locked(&self) -> bool {
            self.gear_down
        }

        fn all_up_and_locked(&self) -> bool {
            !self.gear_down
        }

        fn main_down_and_locked(&self) -> bool {
            self.gear_down
        }

        fn main_up_and_locked(&self) -> bool {
            !self.gear_down
        }

        fn nose_down_and_locked(&self) -> bool {
            self.gear_down
        }

        fn nose_up_and_locked(&self) -> bool {
            !self.gear_down
        }
    }

    struct EgpwcTestAircraft {
        adirs: TestAdirs,
        lgciu: TestLgciu,
        egpwc: EnhancedGroundProximityWarningComputer,
        powered_source_dc: TestElectricitySource,
        dc_1_bus: ElectricalBus,
        is_elec_powered: bool,
    }
    impl EgpwcTestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                adirs: TestAdirs::new(),
                lgciu: TestLgciu::new(),
                egpwc: EnhancedGroundProximityWarningComputer::new(
                    context,
                    ElectricalBusType::DirectCurrent(1),
                    vec![
                        Length::new::<nautical_mile>(10.0),
                        Length::new::<nautical_mile>(20.0),
                        Length::new::<nautical_mile>(40.0),
                        Length::new::<nautical_mile>(80.0),
                        Length::new::<nautical_mile>(160.0),
                        Length::new::<nautical_mile>(320.0),
                    ],
                    0,
                ),
                powered_source_dc: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::Battery(2),
                ),
                dc_1_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrent(1)),
                is_elec_powered: false,
            }
        }

        fn update(&mut self) {
            self.egpwc.update(&self.adirs, &self.lgciu);
        }

        fn initialize_adiru(&mut self) {
            self.adirs.initialize();
        }

        fn gear_down(&mut self) {
            self.lgciu.set_gear_down(true);
        }

        fn set_elec_powered(&mut self, is_powered: bool) {
            self.is_elec_powered = is_powered;
        }
    }
    impl Aircraft for EgpwcTestAircraft {
        fn update_before_power_distribution(
            &mut self,
            _: &UpdateContext,
            electricity: &mut Electricity,
        ) {
            self.powered_source_dc
                .power_with_potential(ElectricPotential::new::<volt>(24.));
            electricity.supplied_by(&self.powered_source_dc);

            if self.is_elec_powered {
                electricity.flow(&self.powered_source_dc, &self.dc_1_bus);
            }
        }

        fn update_after_power_distribution(&mut self, _: &UpdateContext) {
            self.update();
        }
    }
    impl SimulationElement for EgpwcTestAircraft {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.egpwc.accept(visitor);
            visitor.visit(self);
        }
    }

    #[test]
    fn not_power_up() {
        let mut test_bed = SimulationTestBed::new(EgpwcTestAircraft::new);

        test_bed.write_by_name("EFIS_L_ND_RANGE", 1);
        test_bed.write_by_name("EFIS_L_ND_MODE", 3);
        test_bed.write_by_name("EFIS_TERR_L_ACTIVE", 1);

        test_bed.write_by_name("EFIS_R_ND_RANGE", 0);
        test_bed.write_by_name("EFIS_R_ND_MODE", 3);
        test_bed.write_by_name("EFIS_TERR_R_ACTIVE", 1);

        test_bed.run();

        let destination_lat: Arinc429Word<Angle> = test_bed.read_arinc429_by_name("EGPWC_DEST_LAT");
        assert!(destination_lat.is_failure_warning());
        let destination_long: Arinc429Word<Angle> =
            test_bed.read_arinc429_by_name("EGPWC_DEST_LONG");
        assert!(destination_long.is_failure_warning());
        let present_lat: Arinc429Word<Angle> = test_bed.read_arinc429_by_name("EGPWC_PRESENT_LAT");
        assert!(present_lat.is_failure_warning());
        let present_long: Arinc429Word<Angle> =
            test_bed.read_arinc429_by_name("EGPWC_PRESENT_LONG");
        assert!(present_long.is_failure_warning());
        let present_heading: Arinc429Word<Angle> =
            test_bed.read_arinc429_by_name("EGPWC_PRESENT_HEADING");
        assert!(present_heading.is_failure_warning());
        let present_altitude: Arinc429Word<Length> =
            test_bed.read_arinc429_by_name("EGPWC_PRESENT_ALTITUDE");
        assert!(present_altitude.is_failure_warning());
        let present_vertical_speed: Arinc429Word<Velocity> =
            test_bed.read_arinc429_by_name("EGPWC_PRESENT_VERTICAL_SPEED");
        assert!(present_vertical_speed.is_failure_warning());
        let gear_down: bool = test_bed.read_by_name("EGPWC_GEAR_IS_DOWN");
        assert!(!gear_down);
        let rendering_mode: u32 = test_bed.read_by_name("EGPWC_TERRONND_RENDERING_MODE");
        assert!(rendering_mode == 0);

        let nd_range_capt: f64 = test_bed.read_by_name("EGPWC_ND_L_RANGE");
        assert_eq!(nd_range_capt, 20.0);
        let nd_terr_activate_capt: bool = test_bed.read_by_name("EGPWC_ND_L_TERRAIN_ACTIVE");
        assert!(!nd_terr_activate_capt);
        let nd_range_fo: f64 = test_bed.read_by_name("EGPWC_ND_R_RANGE");
        assert_eq!(nd_range_fo, 10.0);
        let nd_terr_activate_fo: bool = test_bed.read_by_name("EGPWC_ND_R_TERRAIN_ACTIVE");
        assert!(!nd_terr_activate_fo);
    }

    #[test]
    fn powered_up_no_sensor_data() {
        let mut test_bed = SimulationTestBed::new(EgpwcTestAircraft::new);

        test_bed.write_by_name("FM1_DEST_LONG_SSM", 0);
        test_bed.write_by_name("FM1_DEST_LONG", 25.3);
        test_bed.write_by_name("FM1_DEST_LAT_SSM", 0);
        test_bed.write_by_name("FM1_DEST_LAT", 60.4);

        test_bed.write_by_name("EFIS_L_ND_RANGE", 1);
        test_bed.write_by_name("EFIS_L_ND_MODE", 3);
        test_bed.write_by_name("EFIS_TERR_L_ACTIVE", 1);

        test_bed.write_by_name("EFIS_R_ND_RANGE", 0);
        test_bed.write_by_name("EFIS_R_ND_MODE", 3);
        test_bed.write_by_name("EFIS_TERR_R_ACTIVE", 1);

        test_bed.command(|a| a.set_elec_powered(true));
        test_bed.run();

        let destination_lat: Arinc429Word<Angle> = test_bed.read_arinc429_by_name("EGPWC_DEST_LAT");
        assert!(destination_lat.is_failure_warning());
        let destination_long: Arinc429Word<Angle> =
            test_bed.read_arinc429_by_name("EGPWC_DEST_LONG");
        assert!(destination_long.is_failure_warning());
        let present_lat: Arinc429Word<Angle> = test_bed.read_arinc429_by_name("EGPWC_PRESENT_LAT");
        assert!(present_lat.is_failure_warning());
        let present_long: Arinc429Word<Angle> =
            test_bed.read_arinc429_by_name("EGPWC_PRESENT_LONG");
        assert!(present_long.is_failure_warning());
        let present_heading: Arinc429Word<Angle> =
            test_bed.read_arinc429_by_name("EGPWC_PRESENT_HEADING");
        assert!(present_heading.is_failure_warning());
        let present_altitude: Arinc429Word<Length> =
            test_bed.read_arinc429_by_name("EGPWC_PRESENT_ALTITUDE");
        assert!(present_altitude.is_failure_warning());
        let present_vertical_speed: Arinc429Word<Velocity> =
            test_bed.read_arinc429_by_name("EGPWC_PRESENT_VERTICAL_SPEED");
        assert!(present_vertical_speed.is_failure_warning());
        let gear_down: bool = test_bed.read_by_name("EGPWC_GEAR_IS_DOWN");
        assert!(!gear_down);
        let rendering_mode: u32 = test_bed.read_by_name("EGPWC_TERRONND_RENDERING_MODE");
        assert!(rendering_mode == 0);

        let nd_range_capt: f64 = test_bed.read_by_name("EGPWC_ND_L_RANGE");
        assert_eq!(nd_range_capt, 20.0);
        let nd_terr_activate_capt: bool = test_bed.read_by_name("EGPWC_ND_L_TERRAIN_ACTIVE");
        assert!(!nd_terr_activate_capt);
        let nd_range_fo: f64 = test_bed.read_by_name("EGPWC_ND_R_RANGE");
        assert_eq!(nd_range_fo, 10.0);
        let nd_terr_activate_fo: bool = test_bed.read_by_name("EGPWC_ND_R_TERRAIN_ACTIVE");
        assert!(!nd_terr_activate_fo);
    }

    #[test]
    fn powered_up_no_destination() {
        let mut test_bed = SimulationTestBed::new(EgpwcTestAircraft::new);

        test_bed.write_by_name("FM1_DEST_LONG_SSM", 0);
        test_bed.write_by_name("FM1_DEST_LONG", 25.3);
        test_bed.write_by_name("FM1_DEST_LAT_SSM", 0);
        test_bed.write_by_name("FM1_DEST_LAT", 60.4);

        test_bed.write_by_name("EFIS_L_ND_RANGE", 1);
        test_bed.write_by_name("EFIS_L_ND_MODE", 3);
        test_bed.write_by_name("EFIS_TERR_L_ACTIVE", 1);

        test_bed.write_by_name("EFIS_R_ND_RANGE", 0);
        test_bed.write_by_name("EFIS_R_ND_MODE", 3);
        test_bed.write_by_name("EFIS_TERR_R_ACTIVE", 1);

        test_bed.command(|a| a.set_elec_powered(true));
        test_bed.command(|a| a.gear_down());
        test_bed.command(|a| a.initialize_adiru());
        test_bed.run();

        let destination_lat: Arinc429Word<Angle> = test_bed.read_arinc429_by_name("EGPWC_DEST_LAT");
        assert!(destination_lat.is_failure_warning());
        let destination_long: Arinc429Word<Angle> =
            test_bed.read_arinc429_by_name("EGPWC_DEST_LONG");
        assert!(destination_long.is_failure_warning());
        let present_lat: Arinc429Word<Angle> = test_bed.read_arinc429_by_name("EGPWC_PRESENT_LAT");
        assert!(present_lat.is_normal_operation());
        assert_about_eq!(present_lat.value().get::<degree>(), 20.3);
        let present_long: Arinc429Word<Angle> =
            test_bed.read_arinc429_by_name("EGPWC_PRESENT_LONG");
        assert!(present_long.is_normal_operation());
        assert_about_eq!(present_long.value().get::<degree>(), 30.3);
        let present_heading: Arinc429Word<Angle> =
            test_bed.read_arinc429_by_name("EGPWC_PRESENT_HEADING");
        assert!(present_heading.is_normal_operation());
        assert_about_eq!(present_heading.value().get::<degree>(), 310.0);
        let present_altitude: Arinc429Word<Length> =
            test_bed.read_arinc429_by_name("EGPWC_PRESENT_ALTITUDE");
        assert!(present_altitude.is_normal_operation());
        assert_about_eq!(present_altitude.value().get::<foot>(), 15000.0);
        let present_vertical_speed: Arinc429Word<f64> =
            test_bed.read_arinc429_by_name("EGPWC_PRESENT_VERTICAL_SPEED");
        assert!(present_vertical_speed.is_normal_operation());
        assert_about_eq!(present_vertical_speed.value(), 1300.0, 1e-4);
        let gear_down: bool = test_bed.read_by_name("EGPWC_GEAR_IS_DOWN");
        assert!(gear_down);
        let rendering_mode: u32 = test_bed.read_by_name("EGPWC_TERRONND_RENDERING_MODE");
        assert!(rendering_mode == 0);

        let nd_range_capt: f64 = test_bed.read_by_name("EGPWC_ND_L_RANGE");
        assert_eq!(nd_range_capt, 20.0);
        let nd_terr_activate_capt: bool = test_bed.read_by_name("EGPWC_ND_L_TERRAIN_ACTIVE");
        assert!(nd_terr_activate_capt);
        let nd_range_fo: f64 = test_bed.read_by_name("EGPWC_ND_R_RANGE");
        assert_eq!(nd_range_fo, 10.0);
        let nd_terr_activate_fo: bool = test_bed.read_by_name("EGPWC_ND_R_TERRAIN_ACTIVE");
        assert!(nd_terr_activate_fo);
    }

    #[test]
    fn powered_up_with_destination() {
        let mut test_bed = SimulationTestBed::new(EgpwcTestAircraft::new);

        test_bed.write_by_name("FM1_DEST_LONG_SSM", 3);
        test_bed.write_by_name("FM1_DEST_LONG", 25.3);
        test_bed.write_by_name("FM1_DEST_LAT_SSM", 3);
        test_bed.write_by_name("FM1_DEST_LAT", 60.4);

        test_bed.write_by_name("EFIS_L_ND_RANGE", 1);
        test_bed.write_by_name("EFIS_L_ND_MODE", 3);
        test_bed.write_by_name("EFIS_TERR_L_ACTIVE", 1);

        test_bed.write_by_name("EFIS_R_ND_RANGE", 0);
        test_bed.write_by_name("EFIS_R_ND_MODE", 3);
        test_bed.write_by_name("EFIS_TERR_R_ACTIVE", 0);

        test_bed.command(|a| a.set_elec_powered(true));
        test_bed.command(|a| a.gear_down());
        test_bed.command(|a| a.initialize_adiru());
        test_bed.run();

        let destination_lat: Arinc429Word<Angle> = test_bed.read_arinc429_by_name("EGPWC_DEST_LAT");
        assert!(destination_lat.is_normal_operation());
        assert_about_eq!(destination_lat.value().get::<degree>(), 60.4, 1e-4);
        let destination_long: Arinc429Word<Angle> =
            test_bed.read_arinc429_by_name("EGPWC_DEST_LONG");
        assert!(destination_long.is_normal_operation());
        assert_about_eq!(destination_long.value().get::<degree>(), 25.3);
        let present_lat: Arinc429Word<Angle> = test_bed.read_arinc429_by_name("EGPWC_PRESENT_LAT");
        assert!(present_lat.is_normal_operation());
        assert_about_eq!(present_lat.value().get::<degree>(), 20.3);
        let present_long: Arinc429Word<Angle> =
            test_bed.read_arinc429_by_name("EGPWC_PRESENT_LONG");
        assert!(present_long.is_normal_operation());
        assert_about_eq!(present_long.value().get::<degree>(), 30.3);
        let present_heading: Arinc429Word<Angle> =
            test_bed.read_arinc429_by_name("EGPWC_PRESENT_HEADING");
        assert!(present_heading.is_normal_operation());
        assert_about_eq!(present_heading.value().get::<degree>(), 310.0);
        let present_altitude: Arinc429Word<Length> =
            test_bed.read_arinc429_by_name("EGPWC_PRESENT_ALTITUDE");
        assert!(present_altitude.is_normal_operation());
        assert_about_eq!(present_altitude.value().get::<foot>(), 15000.0);
        let present_vertical_speed: Arinc429Word<f64> =
            test_bed.read_arinc429_by_name("EGPWC_PRESENT_VERTICAL_SPEED");
        assert!(present_vertical_speed.is_normal_operation());
        assert_about_eq!(present_vertical_speed.value(), 1300.0, 1e-4);
        let gear_down: bool = test_bed.read_by_name("EGPWC_GEAR_IS_DOWN");
        assert!(gear_down);
        let rendering_mode: u32 = test_bed.read_by_name("EGPWC_TERRONND_RENDERING_MODE");
        assert!(rendering_mode == 0);

        let nd_range_capt: f64 = test_bed.read_by_name("EGPWC_ND_L_RANGE");
        assert_eq!(nd_range_capt, 20.0);
        let nd_terr_activate_capt: bool = test_bed.read_by_name("EGPWC_ND_L_TERRAIN_ACTIVE");
        assert!(nd_terr_activate_capt);
        let nd_range_fo: f64 = test_bed.read_by_name("EGPWC_ND_R_RANGE");
        assert_eq!(nd_range_fo, 10.0);
        let nd_terr_activate_fo: bool = test_bed.read_by_name("EGPWC_ND_R_TERRAIN_ACTIVE");
        assert!(!nd_terr_activate_fo);
    }
}
