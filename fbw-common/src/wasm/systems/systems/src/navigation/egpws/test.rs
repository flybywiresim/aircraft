use uom::si::{
    electric_potential::volt,
    f64::{
        Angle, AngularAcceleration, AngularVelocity, ElectricPotential, Frequency, Length,
        Pressure, Ratio, ThermodynamicTemperature, Velocity,
    },
    length::foot,
};

use crate::{
    electrical::{test::TestElectricitySource, ElectricalBus, Electricity},
    shared::{
        arinc429::{Arinc429Word, SignStatus},
        LgciuGearExtension, MachNumber, PotentialOrigin, PowerConsumptionReport,
    },
    simulation::{
        test::{SimulationTestBed, TestBed},
        Aircraft, StartState,
    },
};

use super::*;

struct TestLgciu {
    extended: bool,
}
impl TestLgciu {
    fn new(extended: bool) -> Self {
        Self { extended }
    }

    fn set_on_ground(&mut self, on_ground: bool) {
        self.extended = on_ground;
    }
}
impl LgciuGearExtension for TestLgciu {
    fn all_down_and_locked(&self) -> bool {
        self.extended
    }
    fn all_up_and_locked(&self) -> bool {
        !self.extended
    }
    fn main_down_and_locked(&self) -> bool {
        self.extended
    }
    fn main_up_and_locked(&self) -> bool {
        !self.extended
    }
    fn nose_down_and_locked(&self) -> bool {
        self.extended
    }
    fn nose_up_and_locked(&self) -> bool {
        !self.extended
    }
    fn left_down_and_locked(&self) -> bool {
        self.extended
    }
}

struct TestRa {
    radio_altitude: Length,
    failed: bool,
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
    fn new(radio_altitude: Length) -> Self {
        Self {
            radio_altitude,
            failed: false,
        }
    }

    fn set_radio_altitude(&mut self, radio_altitude: Length) {
        self.radio_altitude = radio_altitude;
    }

    fn set_failed(&mut self, failed: bool) {
        self.failed = failed;
    }
}

struct TestAdiru {
    computed_airspeed: Velocity,
    altitude: Length,
    vertical_speed: Velocity,
    pitch: Angle,
}
impl TestAdiru {
    fn new() -> Self {
        Self {
            computed_airspeed: Velocity::default(),
            altitude: Length::default(),
            vertical_speed: Velocity::default(),
            pitch: Angle::default(),
        }
    }
}
impl AirDataReferenceBus for TestAdiru {
    fn standard_altitude(&self) -> Arinc429Word<Length> {
        Arinc429Word::new(self.altitude, SignStatus::NormalOperation)
    }
    fn baro_corrected_altitude_1(&self) -> Arinc429Word<Length> {
        Arinc429Word::new(self.altitude, SignStatus::NormalOperation)
    }
    fn mach(&self) -> Arinc429Word<MachNumber> {
        Arinc429Word::new(MachNumber::default(), SignStatus::NormalOperation)
    }
    fn computed_airspeed(&self) -> Arinc429Word<Velocity> {
        Arinc429Word::new(self.computed_airspeed, SignStatus::NormalOperation)
    }
    fn max_allowable_airspeed(&self) -> Arinc429Word<Velocity> {
        Arinc429Word::new(Velocity::default(), SignStatus::NormalOperation)
    }
    fn true_airspeed(&self) -> Arinc429Word<Velocity> {
        Arinc429Word::new(self.computed_airspeed, SignStatus::NormalOperation)
    }
    fn total_air_temperature(&self) -> Arinc429Word<ThermodynamicTemperature> {
        Arinc429Word::new(
            ThermodynamicTemperature::default(),
            SignStatus::NormalOperation,
        )
    }
    fn vertical_speed(&self) -> Arinc429Word<Velocity> {
        Arinc429Word::new(self.vertical_speed, SignStatus::NormalOperation)
    }
    fn static_air_temperature(&self) -> Arinc429Word<ThermodynamicTemperature> {
        Arinc429Word::new(
            ThermodynamicTemperature::default(),
            SignStatus::NormalOperation,
        )
    }
    fn baro_corrected_altitude_2(&self) -> Arinc429Word<Length> {
        Arinc429Word::new(self.altitude, SignStatus::NormalOperation)
    }
    fn baro_correction_1(&self) -> Arinc429Word<Pressure> {
        Arinc429Word::new(Pressure::default(), SignStatus::NormalOperation)
    }
    fn baro_correction_2(&self) -> Arinc429Word<Pressure> {
        Arinc429Word::new(Pressure::default(), SignStatus::NormalOperation)
    }
    fn corrected_angle_of_attack(&self) -> Arinc429Word<Angle> {
        Arinc429Word::new(Angle::default(), SignStatus::NormalOperation)
    }
}
impl InertialReferenceBus for TestAdiru {
    /// Label 052
    fn pitch_angular_acc(&self) -> Arinc429Word<AngularAcceleration> {
        Arinc429Word::new(AngularAcceleration::default(), SignStatus::NormalOperation)
    }
    /// Label 053
    fn roll_angular_acc(&self) -> Arinc429Word<AngularAcceleration> {
        Arinc429Word::new(AngularAcceleration::default(), SignStatus::NormalOperation)
    }
    /// Label 053
    fn yaw_angular_acc(&self) -> Arinc429Word<AngularAcceleration> {
        Arinc429Word::new(AngularAcceleration::default(), SignStatus::NormalOperation)
    }
    /// Label 310
    fn ppos_latitude(&self) -> Arinc429Word<Angle> {
        Arinc429Word::new(Angle::default(), SignStatus::NormalOperation)
    }
    /// Label 311
    fn ppos_longitude(&self) -> Arinc429Word<Angle> {
        Arinc429Word::new(Angle::default(), SignStatus::NormalOperation)
    }
    /// Label 312
    fn ground_speed(&self) -> Arinc429Word<Velocity> {
        Arinc429Word::new(Velocity::default(), SignStatus::NormalOperation)
    }
    /// Label 313
    fn true_heading(&self) -> Arinc429Word<Angle> {
        Arinc429Word::new(Angle::default(), SignStatus::NormalOperation)
    }
    /// Label 314
    fn true_track(&self) -> Arinc429Word<Angle> {
        Arinc429Word::new(Angle::default(), SignStatus::NormalOperation)
    }
    /// Label 315
    fn wind_speed(&self) -> Arinc429Word<Velocity> {
        Arinc429Word::new(Velocity::default(), SignStatus::NormalOperation)
    }
    /// Label 316
    fn wind_dir_true(&self) -> Arinc429Word<Angle> {
        Arinc429Word::new(Angle::default(), SignStatus::NormalOperation)
    }
    /// Label 317
    fn magnetic_track(&self) -> Arinc429Word<Angle> {
        Arinc429Word::new(Angle::default(), SignStatus::NormalOperation)
    }
    /// Label 320
    fn magnetic_heading(&self) -> Arinc429Word<Angle> {
        Arinc429Word::new(Angle::default(), SignStatus::NormalOperation)
    }
    /// Label 321
    fn drift_angle(&self) -> Arinc429Word<Angle> {
        Arinc429Word::new(Angle::default(), SignStatus::NormalOperation)
    }
    /// Label 322
    fn flight_path_angle(&self) -> Arinc429Word<Angle> {
        Arinc429Word::new(Angle::default(), SignStatus::NormalOperation)
    }
    /// Label 323
    fn flight_path_accel(&self) -> Arinc429Word<Ratio> {
        Arinc429Word::new(Ratio::default(), SignStatus::NormalOperation)
    }
    /// Label 324
    fn pitch_angle(&self) -> Arinc429Word<Angle> {
        Arinc429Word::new(self.pitch, SignStatus::NormalOperation)
    }
    /// Label 325
    fn roll_angle(&self) -> Arinc429Word<Angle> {
        Arinc429Word::new(Angle::default(), SignStatus::NormalOperation)
    }
    /// Label 326
    fn body_pitch_rate(&self) -> Arinc429Word<AngularVelocity> {
        Arinc429Word::new(AngularVelocity::default(), SignStatus::NormalOperation)
    }
    /// Label 327
    fn body_roll_rate(&self) -> Arinc429Word<AngularVelocity> {
        Arinc429Word::new(AngularVelocity::default(), SignStatus::NormalOperation)
    }
    /// Label 330
    fn body_yaw_rate(&self) -> Arinc429Word<AngularVelocity> {
        Arinc429Word::new(AngularVelocity::default(), SignStatus::NormalOperation)
    }
    /// Label 331
    fn body_long_acc(&self) -> Arinc429Word<Ratio> {
        Arinc429Word::new(Ratio::default(), SignStatus::NormalOperation)
    }
    /// Label 332
    fn body_lat_acc(&self) -> Arinc429Word<Ratio> {
        Arinc429Word::new(Ratio::default(), SignStatus::NormalOperation)
    }
    /// Label 333
    fn body_normal_acc(&self) -> Arinc429Word<Ratio> {
        Arinc429Word::new(Ratio::default(), SignStatus::NormalOperation)
    }
    /// Label 361
    fn inertial_altitude(&self) -> Arinc429Word<Length> {
        Arinc429Word::new(self.altitude, SignStatus::NormalOperation)
    }
    /// Label 365
    fn inertial_vertical_speed(&self) -> Arinc429Word<Velocity> {
        Arinc429Word::new(self.vertical_speed, SignStatus::NormalOperation)
    }

    /// Label 270
    fn discrete_word_1(&self) -> Arinc429Word<u32> {
        Arinc429Word::new(0u32, SignStatus::NormalOperation)
    }
    /// Label 275
    fn discrete_word_2(&self) -> Arinc429Word<u32> {
        Arinc429Word::new(0u32, SignStatus::NormalOperation)
    }
    /// Label 276
    fn discrete_word_3(&self) -> Arinc429Word<u32> {
        Arinc429Word::new(0u32, SignStatus::NormalOperation)
    }
}

struct TestIls {
    glideslope_deviation: Ratio,
}
impl TestIls {
    fn new() -> Self {
        Self {
            glideslope_deviation: Ratio::default(),
        }
    }
}
impl InstrumentLandingSystemBus for TestIls {
    fn glideslope_deviation(&self) -> Arinc429Word<Ratio> {
        Arinc429Word::new(self.glideslope_deviation, SignStatus::NormalOperation)
    }
    fn localizer_deviation(&self) -> Arinc429Word<Ratio> {
        Arinc429Word::new(Ratio::default(), SignStatus::NormalOperation)
    }
    fn runway_heading(&self) -> Arinc429Word<Angle> {
        Arinc429Word::new(Angle::default(), SignStatus::NormalOperation)
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

struct TestAircraft {
    electricity_source: TestElectricitySource,
    ac_1_bus: ElectricalBus,
    lgciu: TestLgciu,
    ra: TestRa,
    adiru: TestAdiru,
    ils: TestIls,
    egpws_electrical_harness: EgpwsElectricalHarness,
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
            lgciu: TestLgciu::new(false),
            ra: TestRa::new(Length::new::<foot>(0.0)),
            adiru: TestAdiru::new(),
            ils: TestIls::new(),
            egpws_electrical_harness: EgpwsElectricalHarness::new(context),
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

    fn power_consumption(&self) -> Power {
        self.power_consumption
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
        self.egpws_electrical_harness.update(&self.lgciu);
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
        self.egpwc.accept(visitor);
        self.egpws_electrical_harness.accept(visitor);

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
        test_bed = test_bed.above_ground();
        test_bed = test_bed.powered();

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

    fn above_ground(self) -> Self {
        self.height_over_ground(Length::new::<foot>(500.0))
    }

    fn on_ground(self) -> Self {
        self.height_over_ground(Length::new::<foot>(0.0))
    }

    fn height_over_ground(mut self, height: Length) -> Self {
        self.command(|a| a.ra.set_radio_altitude(height));
        self
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
fn measures_zero_on_ground() {
    let mut test_bed = test_bed_with().on_ground();
    test_bed.run_with_delta(Duration::from_millis(1));
}
