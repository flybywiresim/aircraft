use uom::si::{
    angle::degree,
    electric_potential::volt,
    f64::{
        Angle, AngularAcceleration, AngularVelocity, ElectricPotential, Frequency, Length,
        Pressure, Ratio, ThermodynamicTemperature, Velocity,
    },
    length::foot,
    ratio::ratio,
    velocity::{foot_per_minute, knot},
};

use crate::{
    electrical::{test::TestElectricitySource, ElectricalBus, Electricity},
    shared::{
        arinc429::{Arinc429Word, SignStatus},
        MachNumber, PotentialOrigin, PowerConsumptionReport,
    },
    simulation::{
        test::{ReadByName, SimulationTestBed, TestBed, WriteByName},
        Aircraft, Read, SimulatorReader, StartState,
    },
};

use super::*;

struct TestRa {
    radio_altitude: Length,
    failed: bool,

    altitude_id: VariableIdentifier,
    terr_height_id: VariableIdentifier,
}
impl RadioAltimeter for TestRa {
    fn radio_altitude(&self) -> Arinc429Word<Length> {
        if self.failed {
            Arinc429Word::new(Length::default(), SignStatus::FailureWarning)
        } else if self.radio_altitude < Length::new::<foot>(-20.) {
            Arinc429Word::new(Length::new::<foot>(-20.), SignStatus::NoComputedData)
        } else if self.radio_altitude > Length::new::<foot>(8192.) {
            Arinc429Word::new(Length::new::<foot>(8192.), SignStatus::NoComputedData)
        } else {
            Arinc429Word::new(self.radio_altitude, SignStatus::NormalOperation)
        }
    }
}
impl TestRa {
    const ALTITUDE_KEY: &str = "TEST_RA_RADIO_ALTITUDE";
    const TERRAIN_HEIGHT_KEY: &str = "TEST_RA_TERRAIN_HEIGHT";

    fn new(context: &mut InitContext, radio_altitude: Length) -> Self {
        Self {
            radio_altitude,
            failed: false,

            altitude_id: context.get_identifier(Self::ALTITUDE_KEY.to_owned()),
            terr_height_id: context.get_identifier(Self::TERRAIN_HEIGHT_KEY.to_owned()),
        }
    }

    fn set_failed(&mut self, failed: bool) {
        self.failed = failed;
    }
}
impl SimulationElement for TestRa {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.radio_altitude = Read::<Length>::read(reader, &self.altitude_id)
            - Read::<Length>::read(reader, &self.terr_height_id);
    }
}

struct TestAdiru {
    computed_airspeed: Velocity,
    altitude: Length,
    vertical_speed: Velocity,
    pitch: Angle,
    adr_ssm: SignStatus,
    ir_ssm: SignStatus,

    altitude_id: VariableIdentifier,
    vertical_speed_id: VariableIdentifier,
    cas_id: VariableIdentifier,
    pitch_id: VariableIdentifier,
}
impl TestAdiru {
    const VERTICAL_SPEED_KEY: &str = "VERTICAL_SPEED";
    const CAS_KEY: &str = "COMPUTED_AIRSPEED";
    const PITCH_ANGLE_KEY: &str = "PITCH_ANGLE";

    fn new(context: &mut InitContext) -> Self {
        Self {
            computed_airspeed: Velocity::default(),
            altitude: Length::default(),
            vertical_speed: Velocity::default(),
            pitch: Angle::default(),
            ir_ssm: SignStatus::NormalOperation,
            adr_ssm: SignStatus::NormalOperation,

            altitude_id: context.get_identifier(TestRa::ALTITUDE_KEY.to_owned()),
            vertical_speed_id: context.get_identifier(Self::VERTICAL_SPEED_KEY.to_owned()),
            cas_id: context.get_identifier(Self::CAS_KEY.to_owned()),
            pitch_id: context.get_identifier(Self::PITCH_ANGLE_KEY.to_owned()),
        }
    }

    fn set_failed_ir(&mut self, failed: bool) {
        self.ir_ssm = if failed {
            SignStatus::FailureWarning
        } else {
            SignStatus::NormalOperation
        };
    }

    fn set_failed_adr(&mut self, failed: bool) {
        self.adr_ssm = if failed {
            SignStatus::FailureWarning
        } else {
            SignStatus::NormalOperation
        };
    }
}
impl AirDataReferenceBus for TestAdiru {
    fn standard_altitude(&self) -> Arinc429Word<Length> {
        Arinc429Word::new(self.altitude, self.adr_ssm)
    }
    fn baro_corrected_altitude_1(&self) -> Arinc429Word<Length> {
        Arinc429Word::new(self.altitude, self.adr_ssm)
    }
    fn mach(&self) -> Arinc429Word<MachNumber> {
        Arinc429Word::new(MachNumber::default(), self.adr_ssm)
    }
    fn computed_airspeed(&self) -> Arinc429Word<Velocity> {
        Arinc429Word::new(self.computed_airspeed, self.adr_ssm)
    }
    fn max_allowable_airspeed(&self) -> Arinc429Word<Velocity> {
        Arinc429Word::new(Velocity::default(), self.adr_ssm)
    }
    fn true_airspeed(&self) -> Arinc429Word<Velocity> {
        Arinc429Word::new(self.computed_airspeed, self.adr_ssm)
    }
    fn total_air_temperature(&self) -> Arinc429Word<ThermodynamicTemperature> {
        Arinc429Word::new(ThermodynamicTemperature::default(), self.adr_ssm)
    }
    fn vertical_speed(&self) -> Arinc429Word<Velocity> {
        Arinc429Word::new(self.vertical_speed, self.adr_ssm)
    }
    fn static_air_temperature(&self) -> Arinc429Word<ThermodynamicTemperature> {
        Arinc429Word::new(ThermodynamicTemperature::default(), self.adr_ssm)
    }
    fn baro_corrected_altitude_2(&self) -> Arinc429Word<Length> {
        Arinc429Word::new(self.altitude, self.adr_ssm)
    }
    fn baro_correction_1(&self) -> Arinc429Word<Pressure> {
        Arinc429Word::new(Pressure::default(), self.adr_ssm)
    }
    fn baro_correction_2(&self) -> Arinc429Word<Pressure> {
        Arinc429Word::new(Pressure::default(), self.adr_ssm)
    }
    fn corrected_angle_of_attack(&self) -> Arinc429Word<Angle> {
        Arinc429Word::new(Angle::default(), self.adr_ssm)
    }
}
impl InertialReferenceBus for TestAdiru {
    /// Label 052
    fn pitch_angular_acc(&self) -> Arinc429Word<AngularAcceleration> {
        Arinc429Word::new(AngularAcceleration::default(), self.ir_ssm)
    }
    /// Label 053
    fn roll_angular_acc(&self) -> Arinc429Word<AngularAcceleration> {
        Arinc429Word::new(AngularAcceleration::default(), self.ir_ssm)
    }
    /// Label 053
    fn yaw_angular_acc(&self) -> Arinc429Word<AngularAcceleration> {
        Arinc429Word::new(AngularAcceleration::default(), self.ir_ssm)
    }
    /// Label 310
    fn ppos_latitude(&self) -> Arinc429Word<Angle> {
        Arinc429Word::new(Angle::default(), self.ir_ssm)
    }
    /// Label 311
    fn ppos_longitude(&self) -> Arinc429Word<Angle> {
        Arinc429Word::new(Angle::default(), self.ir_ssm)
    }
    /// Label 312
    fn ground_speed(&self) -> Arinc429Word<Velocity> {
        Arinc429Word::new(Velocity::default(), self.ir_ssm)
    }
    /// Label 313
    fn true_heading(&self) -> Arinc429Word<Angle> {
        Arinc429Word::new(Angle::default(), self.ir_ssm)
    }
    /// Label 314
    fn true_track(&self) -> Arinc429Word<Angle> {
        Arinc429Word::new(Angle::default(), self.ir_ssm)
    }
    /// Label 315
    fn wind_speed(&self) -> Arinc429Word<Velocity> {
        Arinc429Word::new(Velocity::default(), self.ir_ssm)
    }
    /// Label 316
    fn wind_dir_true(&self) -> Arinc429Word<Angle> {
        Arinc429Word::new(Angle::default(), self.ir_ssm)
    }
    /// Label 317
    fn magnetic_track(&self) -> Arinc429Word<Angle> {
        Arinc429Word::new(Angle::default(), self.ir_ssm)
    }
    /// Label 320
    fn magnetic_heading(&self) -> Arinc429Word<Angle> {
        Arinc429Word::new(Angle::default(), self.ir_ssm)
    }
    /// Label 321
    fn drift_angle(&self) -> Arinc429Word<Angle> {
        Arinc429Word::new(Angle::default(), self.ir_ssm)
    }
    /// Label 322
    fn flight_path_angle(&self) -> Arinc429Word<Angle> {
        Arinc429Word::new(Angle::default(), self.ir_ssm)
    }
    /// Label 323
    fn flight_path_accel(&self) -> Arinc429Word<Ratio> {
        Arinc429Word::new(Ratio::default(), self.ir_ssm)
    }
    /// Label 324
    fn pitch_angle(&self) -> Arinc429Word<Angle> {
        Arinc429Word::new(self.pitch, self.ir_ssm)
    }
    /// Label 325
    fn roll_angle(&self) -> Arinc429Word<Angle> {
        Arinc429Word::new(Angle::default(), self.ir_ssm)
    }
    /// Label 326
    fn body_pitch_rate(&self) -> Arinc429Word<AngularVelocity> {
        Arinc429Word::new(AngularVelocity::default(), self.ir_ssm)
    }
    /// Label 327
    fn body_roll_rate(&self) -> Arinc429Word<AngularVelocity> {
        Arinc429Word::new(AngularVelocity::default(), self.ir_ssm)
    }
    /// Label 330
    fn body_yaw_rate(&self) -> Arinc429Word<AngularVelocity> {
        Arinc429Word::new(AngularVelocity::default(), self.ir_ssm)
    }
    /// Label 331
    fn body_long_acc(&self) -> Arinc429Word<Ratio> {
        Arinc429Word::new(Ratio::default(), self.ir_ssm)
    }
    /// Label 332
    fn body_lat_acc(&self) -> Arinc429Word<Ratio> {
        Arinc429Word::new(Ratio::default(), self.ir_ssm)
    }
    /// Label 333
    fn body_normal_acc(&self) -> Arinc429Word<Ratio> {
        Arinc429Word::new(Ratio::default(), self.ir_ssm)
    }
    /// Label 361
    fn inertial_altitude(&self) -> Arinc429Word<Length> {
        Arinc429Word::new(self.altitude, self.ir_ssm)
    }
    /// Label 365
    fn inertial_vertical_speed(&self) -> Arinc429Word<Velocity> {
        Arinc429Word::new(self.vertical_speed, self.ir_ssm)
    }

    /// Label 270
    fn discrete_word_1(&self) -> Arinc429Word<u32> {
        Arinc429Word::new(0u32, self.ir_ssm)
    }
    /// Label 275
    fn discrete_word_2(&self) -> Arinc429Word<u32> {
        Arinc429Word::new(0u32, self.ir_ssm)
    }
    /// Label 276
    fn discrete_word_3(&self) -> Arinc429Word<u32> {
        Arinc429Word::new(0u32, self.ir_ssm)
    }
}
impl SimulationElement for TestAdiru {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.altitude = reader.read(&self.altitude_id);
        self.vertical_speed = reader.read(&self.vertical_speed_id);
        self.computed_airspeed = reader.read(&self.cas_id);
        self.pitch = reader.read(&self.pitch_id);
    }
}

struct TestIls {
    has_glideslope: bool,
    glideslope_deviation: Ratio,
    has_localizer: bool,
    localizer_deviation: Ratio,
    failed: bool,
}
impl TestIls {
    fn new() -> Self {
        Self {
            has_glideslope: false,
            glideslope_deviation: Ratio::default(),
            has_localizer: false,
            localizer_deviation: Ratio::default(),
            failed: false,
        }
    }

    fn set_failed(&mut self, failed: bool) {
        self.failed = failed;
    }

    fn set_gs_deviation(&mut self, deviation: Option<Ratio>) {
        if let Some(dev) = deviation {
            self.has_glideslope = true;
            self.glideslope_deviation = dev;
        } else {
            self.has_glideslope = false;
            self.glideslope_deviation = Ratio::default();
        }
    }

    fn set_loc_deviation(&mut self, deviation: Option<Ratio>) {
        if let Some(dev) = deviation {
            self.has_localizer = true;
            self.localizer_deviation = dev;
        } else {
            self.has_localizer = false;
            self.localizer_deviation = Ratio::default();
        }
    }
}
impl InstrumentLandingSystemBus for TestIls {
    fn glideslope_deviation(&self) -> Arinc429Word<Ratio> {
        Arinc429Word::new(
            self.glideslope_deviation,
            if self.failed {
                SignStatus::FailureWarning
            } else if self.has_glideslope {
                SignStatus::NormalOperation
            } else {
                SignStatus::NoComputedData
            },
        )
    }
    fn localizer_deviation(&self) -> Arinc429Word<Ratio> {
        Arinc429Word::new(
            self.localizer_deviation,
            if self.failed {
                SignStatus::FailureWarning
            } else if self.has_localizer {
                SignStatus::NormalOperation
            } else {
                SignStatus::NoComputedData
            },
        )
    }
    fn runway_heading(&self) -> Arinc429Word<Angle> {
        Arinc429Word::new(
            Angle::default(),
            if self.failed {
                SignStatus::FailureWarning
            } else {
                SignStatus::NormalOperation
            },
        )
    }
    fn ils_frequency(&self) -> Arinc429Word<uom::si::f64::Frequency> {
        Arinc429Word::new(Frequency::default(), SignStatus::NormalOperation)
    }
    fn ground_station_ident_1(&self) -> Arinc429Word<u32> {
        Arinc429Word::new(0u32, SignStatus::NormalOperation)
    }
    fn ground_station_ident_2(&self) -> Arinc429Word<u32> {
        Arinc429Word::new(0u32, SignStatus::NormalOperation)
    }
}

struct TestElectricalHarness {
    discrete_inputs: TerrainAwarenessWarningSystemDiscreteInputs,
}
impl TestElectricalHarness {
    pub fn new() -> Self {
        Self {
            discrete_inputs: TerrainAwarenessWarningSystemDiscreteInputs::default(),
        }
    }

    fn set_sys_button_pressed(&mut self, pressed: bool) {
        self.discrete_inputs.gpws_inhibit = pressed;
    }

    fn set_gs_mode_button_pressed(&mut self, pressed: bool) {
        self.discrete_inputs.glideslope_inhibit = pressed;
    }

    fn set_gs_cancel_self_test_pressed(&mut self, pressed: bool) {
        self.discrete_inputs.gs_cancel = pressed;
        self.discrete_inputs.self_test = pressed;
    }

    fn set_landing_flaps_extended(&mut self, extended: bool) {
        self.discrete_inputs.landing_flaps = extended;
    }

    fn set_gear_extended(&mut self, extended: bool) {
        self.discrete_inputs.landing_gear_downlocked = extended;
    }
}
impl EgpwsElectricalHarness for TestElectricalHarness {
    fn discrete_inputs(&self) -> &TerrainAwarenessWarningSystemDiscreteInputs {
        &self.discrete_inputs
    }
}

struct TestAircraft {
    electricity_source: TestElectricitySource,
    ac_1_bus: ElectricalBus,
    ra: TestRa,
    adiru: TestAdiru,
    ils: TestIls,
    egpws_electrical_harness: TestElectricalHarness,
    egpwc: EnhancedGroundProximityWarningComputer,
    is_ac_1_powered: bool,
    power_consumption: Power,
}
impl TestAircraft {
    fn new(context: &mut InitContext) -> Self {
        Self {
            electricity_source: TestElectricitySource::powered(
                context,
                PotentialOrigin::EngineGenerator(1),
            ),
            ac_1_bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(1)),
            ra: TestRa::new(context, Length::new::<foot>(0.0)),
            adiru: TestAdiru::new(context),
            ils: TestIls::new(),
            egpws_electrical_harness: TestElectricalHarness::new(),
            egpwc: EnhancedGroundProximityWarningComputer::new(
                context,
                ElectricalBusType::AlternatingCurrent(1),
            ),
            is_ac_1_powered: false,
            power_consumption: Power::new::<watt>(0.),
        }
    }

    fn set_ac_1_power(&mut self, is_powered: bool) {
        self.is_ac_1_powered = is_powered;
    }
}
impl Aircraft for TestAircraft {
    fn update_before_power_distribution(
        &mut self,
        _: &UpdateContext,
        electricity: &mut Electricity,
    ) {
        self.electricity_source
            .power_with_potential(ElectricPotential::new::<volt>(115.));
        electricity.supplied_by(&self.electricity_source);

        if self.is_ac_1_powered {
            electricity.flow(&self.electricity_source, &self.ac_1_bus);
        }
    }

    fn update_after_power_distribution(&mut self, context: &UpdateContext) {
        self.egpwc.update(
            context,
            &self.egpws_electrical_harness,
            &self.ra,
            &self.ra,
            &self.adiru,
            &self.adiru,
            &self.ils,
        );
    }
}
impl SimulationElement for TestAircraft {
    fn process_power_consumption_report<T: PowerConsumptionReport>(
        &mut self,
        _: &UpdateContext,
        report: &T,
    ) {
        self.power_consumption = report.total_consumption_of(PotentialOrigin::EngineGenerator(1));
    }

    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.adiru.accept(visitor);
        self.ra.accept(visitor);
        self.egpwc.accept(visitor);

        visitor.visit(self);
    }
}

struct EgpwcTestBed {
    test_bed: SimulationTestBed<TestAircraft>,
}
impl EgpwcTestBed {
    fn new() -> Self {
        let mut test_bed = Self {
            test_bed: SimulationTestBed::new_with_start_state(
                StartState::Cruise,
                TestAircraft::new,
            ),
        };
        test_bed = test_bed.on_ground().powered().flaps_extended(false);

        test_bed
    }

    fn and(self) -> Self {
        self
    }

    fn no_power(mut self) -> Self {
        self.command(|a| a.set_ac_1_power(false));
        self
    }

    fn powered(mut self) -> Self {
        self.command(|a| a.set_ac_1_power(true));
        self
    }

    fn on_ground(mut self) -> Self {
        let terr_height = ReadByName::<EgpwcTestBed, Length>::read_by_name(
            &mut self,
            EnhancedGroundProximityWarningComputer::AURAL_OUTPUT_KEY,
        );
        self.altitude_of(terr_height).gear_extended(true)
    }

    fn altitude_of(mut self, height: Length) -> Self {
        self.write_by_name(TestRa::ALTITUDE_KEY, height);
        self
    }

    fn terrain_height_of(mut self, height: Length) -> Self {
        self.write_by_name(TestRa::TERRAIN_HEIGHT_KEY, height);
        self
    }

    fn vertical_speed_of(mut self, vs: Velocity) -> Self {
        self.write_by_name(TestAdiru::VERTICAL_SPEED_KEY, vs);
        self
    }

    fn cas_of(mut self, vs: Velocity) -> Self {
        self.write_by_name(TestAdiru::CAS_KEY, vs);
        self
    }

    fn pitch_of(mut self, pitch: Angle) -> Self {
        self.write_by_name(TestAdiru::PITCH_ANGLE_KEY, pitch);
        self
    }

    fn gs_deviation_of(mut self, deviation: Option<Ratio>) -> Self {
        self.command(|a| a.ils.set_gs_deviation(deviation));
        self
    }

    fn loc_deviation_of(mut self, deviation: Option<Ratio>) -> Self {
        self.command(|a| a.ils.set_loc_deviation(deviation));
        self
    }

    fn gear_extended(mut self, extended: bool) -> Self {
        self.command(|a| a.egpws_electrical_harness.set_gear_extended(extended));
        self
    }

    fn gs_mode_button_pressed(mut self, pressed: bool) -> Self {
        self.command(|a| {
            a.egpws_electrical_harness
                .set_gs_mode_button_pressed(pressed)
        });
        self
    }

    fn gpws_sys_button_pressed(mut self, pressed: bool) -> Self {
        self.command(|a| a.egpws_electrical_harness.set_sys_button_pressed(pressed));
        self
    }

    fn gpws_gs_cancel_self_test_pressed(mut self, pressed: bool) -> Self {
        self.command(|a| {
            a.egpws_electrical_harness
                .set_gs_cancel_self_test_pressed(pressed)
        });
        self
    }

    fn flaps_extended(mut self, extended: bool) -> Self {
        self.command(|a| {
            a.egpws_electrical_harness
                .set_landing_flaps_extended(extended)
        });
        self
    }

    fn set_ra_failure(&mut self, failed: bool) {
        self.command(|a| a.ra.set_failed(failed));
    }

    fn set_ils_failure(&mut self, failed: bool) {
        self.command(|a| a.ils.set_failed(failed));
    }

    fn set_adr_failure(&mut self, failed: bool) {
        self.command(|a| a.adiru.set_failed_adr(failed));
    }

    fn set_ir_failure(&mut self, failed: bool) {
        self.command(|a| a.adiru.set_failed_ir(failed));
    }

    fn get_aural_warning(&mut self) -> u8 {
        ReadByName::<EgpwcTestBed, u8>::read_by_name(
            self,
            EnhancedGroundProximityWarningComputer::AURAL_OUTPUT_KEY,
        )
    }

    fn get_audio_on(&self) -> bool {
        self.query(|ac: &TestAircraft| ac.egpwc.discrete_outputs().audio_on)
    }

    fn is_warning_light_on(&mut self) -> bool {
        self.query(|ac: &TestAircraft| ac.egpwc.discrete_outputs().warning_lamp)
    }

    fn is_alert_light_on(&mut self) -> bool {
        self.query(|ac: &TestAircraft| ac.egpwc.discrete_outputs().alert_lamp)
    }

    fn egpws_sys_fault(&mut self) -> bool {
        self.query(|ac: &TestAircraft| ac.egpwc.discrete_outputs().gpws_inop)
    }

    #[allow(dead_code)]
    fn egpws_terr_fault(&mut self) -> bool {
        self.query(|ac: &TestAircraft| ac.egpwc.discrete_outputs().terrain_inop)
    }

    fn assert_no_warning_active(&mut self) {
        assert!(!self.get_audio_on());
        assert_eq!(self.get_aural_warning(), AuralWarning::None as u8);
        assert!(!self.is_warning_light_on());
        assert!(!self.is_alert_light_on());
    }
}
impl TestBed for EgpwcTestBed {
    type Aircraft = TestAircraft;

    fn test_bed(&self) -> &SimulationTestBed<TestAircraft> {
        &self.test_bed
    }

    fn test_bed_mut(&mut self) -> &mut SimulationTestBed<TestAircraft> {
        &mut self.test_bed
    }
}

fn test_bed() -> EgpwcTestBed {
    EgpwcTestBed::new()
}

fn test_bed_with() -> EgpwcTestBed {
    test_bed()
}

#[test]
fn self_tests_after_power_loss_on_ground_and_emits_no_warnings() {
    let mut test_bed = test_bed_with().on_ground().and().powered();
    test_bed.run_with_delta(Duration::from_millis(1));
    assert!(!test_bed.egpws_sys_fault());
    test_bed.assert_no_warning_active();

    let mut test_bed = test_bed.no_power();
    test_bed.run_with_delta(Duration::from_millis(500));
    assert!(test_bed.egpws_sys_fault());
    let mut test_bed = test_bed.powered();
    test_bed.run_with_delta(Duration::from_millis(1_000));
    assert!(test_bed.egpws_sys_fault());
    test_bed.run_with_delta(Duration::from_millis(20_000));
    assert!(!test_bed.egpws_sys_fault());
    test_bed.assert_no_warning_active();
}

#[test]
fn emits_failure_when_ra_is_failed() {
    let mut test_bed = test_bed_with()
        .altitude_of(Length::new::<foot>(2500.0))
        .and()
        .powered();

    test_bed.run_with_delta(Duration::from_millis(1));

    assert!(!test_bed.egpws_sys_fault());
    test_bed.assert_no_warning_active();

    test_bed.set_ra_failure(true);
    test_bed.run_with_delta(Duration::from_millis(1));
    assert!(test_bed.egpws_sys_fault());
    test_bed.assert_no_warning_active();

    test_bed.set_ra_failure(false);
    test_bed.run_with_delta(Duration::from_millis(1));
    assert!(!test_bed.egpws_sys_fault());
    test_bed.assert_no_warning_active();
}

#[test]
fn emits_failure_when_adr_is_failed() {
    let mut test_bed = test_bed_with()
        .altitude_of(Length::new::<foot>(2500.0))
        .and()
        .powered();

    test_bed.run_with_delta(Duration::from_millis(1));

    assert!(!test_bed.egpws_sys_fault());
    test_bed.assert_no_warning_active();

    test_bed.set_adr_failure(true);
    test_bed.run_with_delta(Duration::from_millis(1));
    assert!(test_bed.egpws_sys_fault());
    test_bed.assert_no_warning_active();

    test_bed.set_adr_failure(false);
    test_bed.run_with_delta(Duration::from_millis(1));
    assert!(!test_bed.egpws_sys_fault());
    test_bed.assert_no_warning_active();
}

#[test]
fn emits_no_sys_failure_when_ir_is_failed() {
    let mut test_bed = test_bed_with()
        .altitude_of(Length::new::<foot>(2500.0))
        .and()
        .powered();

    test_bed.run_with_delta(Duration::from_millis(1));

    assert!(!test_bed.egpws_sys_fault());
    test_bed.assert_no_warning_active();

    test_bed.set_ir_failure(true);
    test_bed.run_with_delta(Duration::from_millis(1));
    assert!(!test_bed.egpws_sys_fault());
    test_bed.assert_no_warning_active();

    test_bed.set_ir_failure(false);
    test_bed.run_with_delta(Duration::from_millis(1));
    assert!(!test_bed.egpws_sys_fault());
    test_bed.assert_no_warning_active();
}

#[test]
fn emits_no_failure_when_ils_is_failed_in_air() {
    let mut test_bed = test_bed_with()
        .altitude_of(Length::new::<foot>(2500.0))
        .and()
        .powered();

    test_bed.run_with_delta(Duration::from_millis(1));

    test_bed.set_ils_failure(true);
    test_bed.run_with_delta(Duration::from_millis(1));
    assert!(!test_bed.egpws_sys_fault());
    test_bed.assert_no_warning_active();

    test_bed.set_ils_failure(false);
    test_bed.run_with_delta(Duration::from_millis(1));
    assert!(!test_bed.egpws_sys_fault());
    test_bed.assert_no_warning_active();
}

#[test]
fn emits_failure_when_ils_is_failed_on_ground() {
    let mut test_bed = test_bed_with().on_ground().and().powered();

    test_bed.run_with_delta(Duration::from_millis(1));

    test_bed.set_ils_failure(true);
    test_bed.run_with_delta(Duration::from_millis(1));
    assert!(test_bed.egpws_sys_fault());
    test_bed.assert_no_warning_active();

    test_bed.set_ils_failure(false);
    test_bed.run_with_delta(Duration::from_millis(1));
    assert!(!test_bed.egpws_sys_fault());
    test_bed.assert_no_warning_active();
}

#[test]
fn mode_1_test() {
    let mut test_bed = test_bed_with()
        .altitude_of(Length::new::<foot>(1500.0))
        .terrain_height_of(Length::new::<foot>(0.0))
        .vertical_speed_of(Velocity::new::<foot_per_minute>(0.0))
        .cas_of(Velocity::new::<knot>(250.))
        .and()
        .powered();

    test_bed.run_with_delta(Duration::from_millis(1));
    test_bed.assert_no_warning_active();

    // Inside of alert area
    test_bed = test_bed.vertical_speed_of(Velocity::new::<foot_per_minute>(-4000.0));
    test_bed.run_with_delta(Duration::from_millis(1));
    // Confirm time not elapsed
    test_bed.assert_no_warning_active();
    test_bed.run_with_delta(Duration::from_millis(1_000));
    assert!(test_bed.get_audio_on());
    assert_eq!(test_bed.get_aural_warning(), AuralWarning::SinkRate as u8); // Emission pattern depends on audio declutter active
    assert!(test_bed.is_warning_light_on());

    // Inside Warning area
    test_bed = test_bed.vertical_speed_of(Velocity::new::<foot_per_minute>(-5000.0));
    test_bed.run_with_delta(Duration::from_millis(1_700));
    assert!(test_bed.get_audio_on());
    assert_eq!(test_bed.get_aural_warning(), AuralWarning::PullUp as u8);
    assert!(test_bed.is_warning_light_on());

    // Warning immediately ceases with GPWS SYS OFF pressed
    test_bed = test_bed.gpws_sys_button_pressed(true);
    test_bed.run_with_delta(Duration::from_millis(1));
    test_bed.assert_no_warning_active();

    // Warning immediately restarts with GPWS SYS OFF no longer pressed
    test_bed = test_bed.gpws_sys_button_pressed(false);
    test_bed.run_with_delta(Duration::from_millis(1));
    assert!(test_bed.get_audio_on());
    assert_eq!(test_bed.get_aural_warning(), AuralWarning::PullUp as u8);
    assert!(test_bed.is_warning_light_on());

    // Exiting warning area
    test_bed = test_bed.vertical_speed_of(Velocity::new::<foot_per_minute>(-1000.0));
    test_bed.run_with_delta(Duration::from_millis(100));

    // Confirm time not elapsed
    assert!(test_bed.get_audio_on());
    assert_eq!(test_bed.get_aural_warning(), AuralWarning::PullUp as u8);
    assert!(test_bed.is_warning_light_on());

    test_bed.run_with_delta(Duration::from_millis(200));
    test_bed.assert_no_warning_active();
}

#[test]
fn mode_2_a_test() {
    let mut test_bed = test_bed_with()
        .altitude_of(Length::new::<foot>(2500.0))
        .terrain_height_of(Length::new::<foot>(0.0))
        .vertical_speed_of(Velocity::new::<foot_per_minute>(0.0))
        .cas_of(Velocity::new::<knot>(310.0))
        .and()
        .powered();

    // Step 71s, since Mode 4B is active for 60s after takeoff and flight mode is activated 10s after above 30ft RA
    // since pitch angle is not set above for immediate switching to occur.
    test_bed.run_with_delta(Duration::from_millis(1_000));
    test_bed.run_with_delta(Duration::from_millis(70_000));
    test_bed.assert_no_warning_active();

    // Terrain rises
    test_bed = test_bed.terrain_height_of(Length::new::<foot>(1000.0));
    test_bed.run_with_delta(Duration::from_millis(3_000));
    assert!(test_bed.get_audio_on());
    assert_eq!(test_bed.get_aural_warning(), AuralWarning::Terrain as u8); // Emission pattern depends on audio declutter active
    assert!(test_bed.is_warning_light_on());

    // Warning immediately ceases with GPWS SYS OFF pressed
    test_bed = test_bed.gpws_sys_button_pressed(true);
    test_bed.run_with_delta(Duration::from_millis(1));
    test_bed.assert_no_warning_active();

    // Warning immediately restarts with GPWS SYS OFF no longer pressed
    test_bed = test_bed.gpws_sys_button_pressed(false);
    test_bed.run_with_delta(Duration::from_millis(1));
    assert!(test_bed.get_audio_on());
    assert_eq!(test_bed.get_aural_warning(), AuralWarning::Terrain as u8);
    assert!(test_bed.is_warning_light_on());

    test_bed = test_bed.cas_of(Velocity::new::<knot>(230.0));
    test_bed = test_bed.terrain_height_of(Length::new::<foot>(1125.0));
    test_bed.run_with_delta(Duration::from_millis(1_000));

    // Closure rate still 7500 ft/min, now at 1000 ft RA
    test_bed = test_bed.cas_of(Velocity::new::<knot>(230.0));
    test_bed = test_bed.terrain_height_of(Length::new::<foot>(1500.0));
    test_bed.run_with_delta(Duration::from_millis(3_000));
    assert!(test_bed.get_audio_on());
    assert_eq!(test_bed.get_aural_warning(), AuralWarning::Terrain as u8);
    assert!(test_bed.is_warning_light_on());

    // After two emissions of TERRAIN (ca. 2s), it will switch to PULL UP. Now closure rate is 2400 ft/min, at 800 ft RA
    test_bed = test_bed.terrain_height_of(Length::new::<foot>(1700.0));
    test_bed.run_with_delta(Duration::from_millis(5_000));
    assert!(test_bed.get_audio_on());
    assert_eq!(test_bed.get_aural_warning(), AuralWarning::PullUp as u8);
    assert!(test_bed.is_warning_light_on());

    // Exiting warning area due to lowering terrain. Now at 1000ft, since otherwise the Mode 4 warning would trigger.
    test_bed = test_bed.terrain_height_of(Length::new::<foot>(1500.0));
    test_bed.run_with_delta(Duration::from_millis(2_000));
    test_bed.assert_no_warning_active();
}

#[test]
fn mode_2_b_test() {
    let mut test_bed = test_bed_with()
        .altitude_of(Length::new::<foot>(2500.0))
        .terrain_height_of(Length::new::<foot>(0.0))
        .vertical_speed_of(Velocity::new::<foot_per_minute>(0.0))
        .cas_of(Velocity::new::<knot>(200.0))
        .flaps_extended(true)
        .gear_extended(true)
        .and()
        .powered();

    test_bed.run_with_delta(Duration::from_millis(1_000));
    test_bed.assert_no_warning_active();

    // Terrain rises, in mode 2B (flaps extended), max. clearance for alert is 789ft
    test_bed = test_bed.terrain_height_of(Length::new::<foot>(1000.0));
    test_bed.run_with_delta(Duration::from_millis(3_000));
    test_bed.assert_no_warning_active();

    test_bed = test_bed.terrain_height_of(Length::new::<foot>(2000.0));
    test_bed.run_with_delta(Duration::from_millis(10_000));
    assert!(test_bed.get_audio_on());
    assert_eq!(test_bed.get_aural_warning(), AuralWarning::Terrain as u8);
    assert!(test_bed.is_warning_light_on());

    // With high V/S, lower warning boundary is shifted up.
    test_bed = test_bed.vertical_speed_of(Velocity::new::<foot_per_minute>(-800.));
    test_bed = test_bed.terrain_height_of(Length::new::<foot>(2100.0));
    test_bed.run_with_delta(Duration::from_millis(2_000));
    test_bed.assert_no_warning_active();

    test_bed = test_bed.vertical_speed_of(Velocity::new::<foot_per_minute>(0.));
    test_bed = test_bed.terrain_height_of(Length::new::<foot>(2200.0));
    test_bed.run_with_delta(Duration::from_millis(2_000));
    assert!(test_bed.get_audio_on());
    assert_eq!(test_bed.get_aural_warning(), AuralWarning::Terrain as u8);
    assert!(test_bed.is_warning_light_on());

    // Exiting warning area due to lowering terrain.
    test_bed = test_bed.terrain_height_of(Length::new::<foot>(1000.0));
    test_bed.run_with_delta(Duration::from_millis(4_000));
    test_bed.assert_no_warning_active();
}

#[test]
fn mode_3_test() {
    let mut test_bed = test_bed_with().on_ground().and().powered();

    test_bed.run_with_delta(Duration::from_millis(1_000));
    test_bed.assert_no_warning_active();

    // Take off
    test_bed = test_bed
        .altitude_of(Length::new::<foot>(100.0))
        .vertical_speed_of(Velocity::new::<foot_per_minute>(100.))
        .gear_extended(false);
    test_bed.run_with_delta(Duration::from_millis(3_000));
    test_bed.assert_no_warning_active();

    test_bed = test_bed
        .altitude_of(Length::new::<foot>(500.0))
        .vertical_speed_of(Velocity::new::<foot_per_minute>(-100.));
    test_bed.run_with_delta(Duration::from_millis(6_000));
    test_bed.assert_no_warning_active();

    test_bed = test_bed
        .altitude_of(Length::new::<foot>(400.0))
        .vertical_speed_of(Velocity::new::<foot_per_minute>(-100.));
    test_bed.run_with_delta(Duration::from_millis(6_000));
    assert!(test_bed.get_audio_on());
    assert_eq!(test_bed.get_aural_warning(), AuralWarning::DontSink as u8);
    assert!(test_bed.is_warning_light_on());

    test_bed = test_bed
        .altitude_of(Length::new::<foot>(420.0))
        .vertical_speed_of(Velocity::new::<foot_per_minute>(100.));
    test_bed.run_with_delta(Duration::from_millis(1_000));
    test_bed.assert_no_warning_active();

    test_bed = test_bed
        .altitude_of(Length::new::<foot>(420.0))
        .vertical_speed_of(Velocity::new::<foot_per_minute>(-100.));
    test_bed.run_with_delta(Duration::from_millis(1_000));
    assert!(test_bed.get_audio_on());
    assert_eq!(test_bed.get_aural_warning(), AuralWarning::DontSink as u8);
    assert!(test_bed.is_warning_light_on());

    test_bed = test_bed.gpws_sys_button_pressed(true);
    test_bed.run_with_delta(Duration::from_millis(1));
    test_bed.assert_no_warning_active();
    test_bed = test_bed.gpws_sys_button_pressed(false);
    test_bed.run_with_delta(Duration::from_millis(1));
    assert!(test_bed.get_audio_on());
    assert_eq!(test_bed.get_aural_warning(), AuralWarning::DontSink as u8);
    assert!(test_bed.is_warning_light_on());
}

#[test]
fn mode_3_disabled_in_approach_mode() {
    let mut test_bed = test_bed_with().on_ground().and().powered();

    test_bed.run_with_delta(Duration::from_millis(1_000));
    test_bed.assert_no_warning_active();

    // Take off
    test_bed = test_bed.altitude_of(Length::new::<foot>(100.0));
    test_bed.run_with_delta(Duration::from_millis(3_000));
    test_bed.assert_no_warning_active();

    test_bed = test_bed.altitude_of(Length::new::<foot>(1000.0));
    test_bed.run_with_delta(Duration::from_millis(20_000));
    test_bed.assert_no_warning_active();

    test_bed = test_bed
        .altitude_of(Length::new::<foot>(600.0))
        .vertical_speed_of(Velocity::new::<foot_per_minute>(-100.));
    test_bed.run_with_delta(Duration::from_millis(10_000));
    test_bed.assert_no_warning_active();
}

#[test]
fn mode_4_a_test() {
    let mut test_bed = test_bed_with()
        .altitude_of(Length::new::<foot>(1500.0))
        .terrain_height_of(Length::new::<foot>(0.0))
        .vertical_speed_of(Velocity::new::<foot_per_minute>(0.0))
        .cas_of(Velocity::new::<knot>(250.0))
        .flaps_extended(false)
        .gear_extended(false)
        .and()
        .powered();

    test_bed.run_with_delta(Duration::from_millis(1_000));
    test_bed.assert_no_warning_active();

    test_bed = test_bed.altitude_of(Length::new::<foot>(900.0));
    test_bed.run_with_delta(Duration::from_millis(10_000));
    assert!(test_bed.get_audio_on());
    assert_eq!(
        test_bed.get_aural_warning(),
        AuralWarning::TooLowTerrain as u8
    );
    assert!(test_bed.is_warning_light_on());

    test_bed = test_bed.cas_of(Velocity::new::<knot>(180.0));
    test_bed.run_with_delta(Duration::from_millis(5_000));
    test_bed.assert_no_warning_active();

    test_bed = test_bed.altitude_of(Length::new::<foot>(400.0));
    test_bed.run_with_delta(Duration::from_millis(15_000));
    assert!(test_bed.get_audio_on());
    assert_eq!(test_bed.get_aural_warning(), AuralWarning::TooLowGear as u8);
    assert!(test_bed.is_warning_light_on());

    test_bed = test_bed.gpws_sys_button_pressed(true);
    test_bed.run_with_delta(Duration::from_millis(1));
    test_bed.assert_no_warning_active();
    test_bed = test_bed.gpws_sys_button_pressed(false);
    test_bed.run_with_delta(Duration::from_millis(1));
    assert!(test_bed.get_audio_on());
    assert_eq!(test_bed.get_aural_warning(), AuralWarning::TooLowGear as u8);
    assert!(test_bed.is_warning_light_on());
}

#[test]
fn mode_4_b_test() {
    let mut test_bed = test_bed_with()
        .altitude_of(Length::new::<foot>(1500.0))
        .terrain_height_of(Length::new::<foot>(0.0))
        .vertical_speed_of(Velocity::new::<foot_per_minute>(0.0))
        .cas_of(Velocity::new::<knot>(250.0))
        .flaps_extended(false)
        .gear_extended(true)
        .and()
        .powered();

    test_bed.run_with_delta(Duration::from_millis(1_000));
    test_bed.assert_no_warning_active();

    test_bed = test_bed.altitude_of(Length::new::<foot>(400.0));
    test_bed.run_with_delta(Duration::from_millis(30_000));
    assert!(test_bed.get_audio_on());
    assert_eq!(
        test_bed.get_aural_warning(),
        AuralWarning::TooLowTerrain as u8
    );
    assert!(test_bed.is_warning_light_on());

    test_bed = test_bed.cas_of(Velocity::new::<knot>(150.0));
    test_bed.run_with_delta(Duration::from_millis(5_000));
    test_bed.assert_no_warning_active();

    test_bed = test_bed.altitude_of(Length::new::<foot>(246.0));
    test_bed.run_with_delta(Duration::from_millis(15_000));
    // Need a small step size here, otherwise takeoff mode would activate
    test_bed = test_bed.altitude_of(Length::new::<foot>(244.0));
    test_bed.run_with_delta(Duration::from_millis(100));
    assert!(test_bed.get_audio_on());
    assert_eq!(
        test_bed.get_aural_warning(),
        AuralWarning::TooLowFlaps as u8
    );
    assert!(test_bed.is_warning_light_on());

    test_bed = test_bed.gpws_sys_button_pressed(true);
    test_bed.run_with_delta(Duration::from_millis(1));
    test_bed.assert_no_warning_active();
    test_bed = test_bed.gpws_sys_button_pressed(false);
    test_bed.run_with_delta(Duration::from_millis(1));
    assert!(test_bed.get_audio_on());
    assert_eq!(
        test_bed.get_aural_warning(),
        AuralWarning::TooLowFlaps as u8
    );
    assert!(test_bed.is_warning_light_on());

    test_bed = test_bed.flaps_extended(true);
    test_bed.run_with_delta(Duration::from_millis(50));
    test_bed.assert_no_warning_active();

    test_bed = test_bed.flaps_extended(false);
    test_bed.run_with_delta(Duration::from_millis(50));
    assert!(test_bed.get_audio_on());
    assert_eq!(
        test_bed.get_aural_warning(),
        AuralWarning::TooLowFlaps as u8
    );
    assert!(test_bed.is_warning_light_on());
}

#[test]
fn mode_4_b_alternate_test() {
    let mut test_bed = test_bed_with()
        .altitude_of(Length::new::<foot>(1500.0))
        .terrain_height_of(Length::new::<foot>(0.0))
        .vertical_speed_of(Velocity::new::<foot_per_minute>(0.0))
        .cas_of(Velocity::new::<knot>(250.0))
        .flaps_extended(true)
        .gear_extended(false)
        .and()
        .powered();

    test_bed.run_with_delta(Duration::from_millis(1_000));
    test_bed.assert_no_warning_active();

    test_bed = test_bed.altitude_of(Length::new::<foot>(246.0));
    test_bed.run_with_delta(Duration::from_millis(35_000));
    // Need a small step size here, otherwise takeoff mode would activate
    test_bed = test_bed.altitude_of(Length::new::<foot>(244.0));
    test_bed.run_with_delta(Duration::from_millis(100));
    assert!(test_bed.get_audio_on());
    assert_eq!(test_bed.get_aural_warning(), AuralWarning::TooLowGear as u8);
    assert!(test_bed.is_warning_light_on());

    test_bed = test_bed
        .cas_of(Velocity::new::<knot>(150.0))
        .altitude_of(Length::new::<foot>(300.0));
    test_bed.run_with_delta(Duration::from_millis(5_000));
    test_bed.assert_no_warning_active();

    test_bed = test_bed.altitude_of(Length::new::<foot>(246.0));
    test_bed.run_with_delta(Duration::from_millis(15_000));
    // Need a small step size here, otherwise takeoff mode would activate
    test_bed = test_bed.altitude_of(Length::new::<foot>(244.0));
    test_bed.run_with_delta(Duration::from_millis(100));
    assert!(test_bed.get_audio_on());
    assert_eq!(test_bed.get_aural_warning(), AuralWarning::TooLowGear as u8);
    assert!(test_bed.is_warning_light_on());
}

#[test]
fn mode_4_c_test() {
    let mut test_bed = test_bed_with().on_ground().and().powered();

    test_bed.run_with_delta(Duration::from_millis(1_000));
    test_bed.assert_no_warning_active();

    // Take off
    test_bed = test_bed
        .altitude_of(Length::new::<foot>(30.0))
        .cas_of(Velocity::new::<knot>(150.0))
        .pitch_of(Angle::new::<degree>(10.))
        .gear_extended(false);
    test_bed.run_with_delta(Duration::from_millis(1_000));
    test_bed.assert_no_warning_active();
    test_bed = test_bed.altitude_of(Length::new::<foot>(100.0));
    test_bed.run_with_delta(Duration::from_millis(5_000));

    test_bed = test_bed.altitude_of(Length::new::<foot>(400.0));
    test_bed.run_with_delta(Duration::from_millis(15_000));
    test_bed.assert_no_warning_active();

    test_bed = test_bed.altitude_of(Length::new::<foot>(210.0));
    test_bed.run_with_delta(Duration::from_millis(10_000));
    assert!(test_bed.get_audio_on());
    assert_eq!(
        test_bed.get_aural_warning(),
        AuralWarning::TooLowTerrain as u8
    );
    assert!(test_bed.is_warning_light_on());

    test_bed = test_bed.cas_of(Velocity::new::<knot>(150.0));

    test_bed = test_bed.gpws_sys_button_pressed(true);
    test_bed.run_with_delta(Duration::from_millis(1));
    test_bed.assert_no_warning_active();
    test_bed = test_bed.gpws_sys_button_pressed(false);
    test_bed.run_with_delta(Duration::from_millis(1));
    assert!(test_bed.get_audio_on());
    assert_eq!(
        test_bed.get_aural_warning(),
        AuralWarning::TooLowTerrain as u8
    );
    assert!(test_bed.is_warning_light_on());

    test_bed = test_bed.altitude_of(Length::new::<foot>(400.0));
    test_bed.run_with_delta(Duration::from_millis(15_000));
    test_bed.assert_no_warning_active();
}

#[test]
fn mode_5_test() {
    let mut test_bed = test_bed_with()
        .altitude_of(Length::new::<foot>(900.0))
        .terrain_height_of(Length::new::<foot>(0.0))
        .vertical_speed_of(Velocity::new::<foot_per_minute>(0.0))
        .cas_of(Velocity::new::<knot>(150.0))
        .gs_deviation_of(None)
        .loc_deviation_of(None)
        .gear_extended(true)
        .flaps_extended(true)
        .and()
        .powered();

    test_bed.run_with_delta(Duration::from_millis(1_000));
    test_bed.assert_no_warning_active();

    test_bed = test_bed.loc_deviation_of(Some(Ratio::new::<ratio>(0.3)));
    test_bed = test_bed.gs_deviation_of(Some(Ratio::new::<ratio>(-0.122)));
    test_bed.run_with_delta(Duration::from_millis(1_000));
    test_bed.assert_no_warning_active();

    test_bed = test_bed
        .loc_deviation_of(Some(Ratio::new::<ratio>(0.0)))
        .vertical_speed_of(Velocity::new::<foot_per_minute>(-500.0));
    test_bed.run_with_delta(Duration::from_millis(1_000));
    assert!(test_bed.get_audio_on());
    assert_eq!(
        test_bed.get_aural_warning(),
        AuralWarning::GlideslopeSoft as u8
    );
    assert!(test_bed.is_alert_light_on());

    test_bed = test_bed.gs_deviation_of(Some(Ratio::new::<ratio>(-0.18)));
    test_bed.run_with_delta(Duration::from_millis(1_000));
    assert!(test_bed.get_audio_on());
    assert_eq!(
        test_bed.get_aural_warning(),
        AuralWarning::GlideslopeSoft as u8
    );
    assert!(test_bed.is_alert_light_on());

    test_bed = test_bed.altitude_of(Length::new::<foot>(200.0));
    test_bed.run_with_delta(Duration::from_millis(1_000));
    assert!(test_bed.get_audio_on());
    assert_eq!(
        test_bed.get_aural_warning(),
        AuralWarning::GlideslopeHard as u8
    );
    assert!(test_bed.is_alert_light_on());

    test_bed = test_bed.gs_mode_button_pressed(true);
    test_bed.run_with_delta(Duration::from_millis(1));
    test_bed.assert_no_warning_active();
    test_bed = test_bed.gs_mode_button_pressed(false);
    test_bed.run_with_delta(Duration::from_millis(1));
    assert!(test_bed.get_audio_on());
    assert_eq!(
        test_bed.get_aural_warning(),
        AuralWarning::GlideslopeHard as u8
    );
    assert!(test_bed.is_alert_light_on());
}

#[test]
fn mode_5_gs_inhibit_button_cancels() {
    let mut test_bed = test_bed_with()
        .altitude_of(Length::new::<foot>(900.0))
        .terrain_height_of(Length::new::<foot>(0.0))
        .vertical_speed_of(Velocity::new::<foot_per_minute>(0.0))
        .cas_of(Velocity::new::<knot>(150.0))
        .gs_deviation_of(None)
        .loc_deviation_of(None)
        .gear_extended(true)
        .flaps_extended(true)
        .and()
        .powered();

    test_bed.run_with_delta(Duration::from_millis(1_000));
    test_bed.assert_no_warning_active();

    test_bed = test_bed.loc_deviation_of(Some(Ratio::new::<ratio>(0.3)));
    test_bed = test_bed.gs_deviation_of(Some(Ratio::new::<ratio>(-0.122)));
    test_bed.run_with_delta(Duration::from_millis(1_000));
    test_bed.assert_no_warning_active();

    test_bed = test_bed
        .loc_deviation_of(Some(Ratio::new::<ratio>(0.0)))
        .vertical_speed_of(Velocity::new::<foot_per_minute>(-500.0));
    test_bed = test_bed.gs_deviation_of(Some(Ratio::new::<ratio>(-0.18)));
    test_bed = test_bed.altitude_of(Length::new::<foot>(200.0));
    test_bed.run_with_delta(Duration::from_millis(1_000));
    assert!(test_bed.get_audio_on());
    assert_eq!(
        test_bed.get_aural_warning(),
        AuralWarning::GlideslopeHard as u8
    );
    assert!(test_bed.is_alert_light_on());

    test_bed = test_bed.gpws_gs_cancel_self_test_pressed(true);
    test_bed.run_with_delta(Duration::from_millis(1));
    test_bed = test_bed.gpws_gs_cancel_self_test_pressed(false);
    test_bed.run_with_delta(Duration::from_millis(1));
    test_bed.assert_no_warning_active();

    test_bed = test_bed.altitude_of(Length::new::<foot>(2100.0));
    test_bed.run_with_delta(Duration::from_millis(1));
    test_bed = test_bed.altitude_of(Length::new::<foot>(200.0));
    test_bed.run_with_delta(Duration::from_millis(60_000));
    assert!(test_bed.get_audio_on());
    assert_eq!(
        test_bed.get_aural_warning(),
        AuralWarning::GlideslopeHard as u8
    );
    assert!(test_bed.is_alert_light_on());
}
