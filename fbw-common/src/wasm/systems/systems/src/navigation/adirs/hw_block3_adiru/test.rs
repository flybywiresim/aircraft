use super::{adiru::*, adr_runtime::*, ir_runtime::*, *};
use crate::auto_flight::FlightControlUnitBusOutputs;
use crate::navigation::adirs::{
    hw_block3_adiru::simulator_data::AdrSimulatorData,
    hw_block3_adiru::simulator_data::IrSimulatorData, *,
};
use crate::{
    shared::{
        arinc429::{Arinc429Word, SignStatus},
        MachNumber,
    },
    simulation::{
        test::{SimulationTestBed, TestBed, WriteByName},
        Aircraft, SimulationElementVisitor, SimulatorReader, SimulatorWriter, UpdateContext,
    },
};
use ntest::assert_about_eq;
use rstest::rstest;
use std::time::Duration;
use uom::si::{
    angle::degree,
    angular_velocity::{degree_per_second, radian_per_second},
    length::foot,
    pressure::hectopascal,
    ratio::ratio,
    thermodynamic_temperature::degree_celsius,
    velocity::{foot_per_minute, foot_per_second, knot},
};

#[derive(Default)]
struct TestAdr {
    bus: AirDataReferenceBusOutputs,
}
impl TestAdr {
    fn new() -> Self {
        let mut bus = AirDataReferenceBusOutputs::default();
        bus.true_airspeed.set_ssm(SignStatus::NormalOperation);
        bus.standard_altitude.set_ssm(SignStatus::NormalOperation);

        Self { bus }
    }

    fn set_failed(&mut self, failed: bool) {
        let ssm = if failed {
            SignStatus::FailureWarning
        } else {
            SignStatus::NormalOperation
        };

        self.bus.standard_altitude.set_ssm(ssm);
        self.bus.true_airspeed.set_ssm(ssm);
    }

    fn set_true_airspeed(&mut self, speed: Velocity) {
        self.bus.true_airspeed.set_value(speed);
    }
}
impl AirDataReferenceBusOutput for TestAdr {
    fn bus_outputs(&self) -> &AirDataReferenceBusOutputs {
        &self.bus
    }
}

#[derive(Default)]
struct TestFcu {
    bus: FlightControlUnitBusOutputs,
}
impl TestFcu {
    fn set_failed(&mut self, failed: bool) {
        let ssm = if failed {
            SignStatus::FailureWarning
        } else {
            SignStatus::NormalOperation
        };

        self.bus.baro_correction_1_hpa.set_ssm(ssm);
        self.bus.baro_correction_2_hpa.set_ssm(ssm);
    }

    fn set_baro_correction_1(&mut self, correction: f64) {
        self.bus.baro_correction_1_hpa.set_value(correction);
    }

    fn set_baro_correction_2(&mut self, correction: f64) {
        self.bus.baro_correction_2_hpa.set_value(correction);
    }
}
impl FlightControlUnitBusOutput for TestFcu {
    fn bus_outputs(&self) -> &FlightControlUnitBusOutputs {
        &self.bus
    }
}

struct TestAdiruElectricalHarness {
    ir_discrete_input: IrDiscreteInputs,
    adr_discrete_input: AdrDiscreteInputs,

    // Powersupply
    primary_powered: bool,
    backup_powered: bool,
}
impl TestAdiruElectricalHarness {
    fn new() -> Self {
        let mut ret = Self {
            ir_discrete_input: IrDiscreteInputs::default(),
            adr_discrete_input: AdrDiscreteInputs::default(),

            primary_powered: false,
            backup_powered: false,
        };

        // Start with NAV mode selected per default
        ret.set_mode_selector_knob(ModeSelectorPosition::Navigation);
        // Set Auto DADS select to true, manual DADS select stays false. This is the default
        // config and will only be overriden for baro inertial loop tests.
        ret.set_auto_dads_select(true);

        ret
    }

    fn set_auto_dads_select(&mut self, set: bool) {
        self.ir_discrete_input.auto_dads_select = set;
    }

    fn set_manual_dads_select(&mut self, set: bool) {
        self.ir_discrete_input.manual_dads_select = set;
    }

    fn set_mode_selector_knob(&mut self, position: ModeSelectorPosition) {
        let (discrete_m1, discrete_m2) = position.into();

        self.ir_discrete_input.mode_select_m1 = discrete_m1;
        self.ir_discrete_input.mode_select_m2 = discrete_m2;
        self.adr_discrete_input.mode_select_m1 = discrete_m1;
        self.adr_discrete_input.mode_select_m2 = discrete_m2;
    }

    pub fn set_adr_button_pushed(&mut self, pushed: bool) {
        self.adr_discrete_input.adr_off_command = pushed;
    }

    pub fn set_ir_button_pushed(&mut self, pushed: bool) {
        self.ir_discrete_input.ir_off_command = pushed;
    }

    pub fn set_excess_motion_inhibit(&mut self, inhibit: bool) {
        self.ir_discrete_input.simulator_excess_motion_inhibit = inhibit;
    }

    pub fn set_fast_align(&mut self, fast_align: bool) {
        self.ir_discrete_input.simulator_fast_align_mode_active = fast_align;
    }

    pub fn set_instant_align(&mut self, instant_align: bool) {
        self.ir_discrete_input.simulator_instant_align = instant_align;
    }

    pub fn set_primary_supply(&mut self, supply: bool, adiru: &mut AirDataInertialReferenceUnit) {
        self.primary_powered = supply;
        self.update_adiru_supply(adiru);
    }

    pub fn set_backup_supply(&mut self, supply: bool, adiru: &mut AirDataInertialReferenceUnit) {
        self.backup_powered = supply;
        self.update_adiru_supply(adiru);
    }

    fn update_adiru_supply(&self, adiru: &mut AirDataInertialReferenceUnit) {
        adiru.set_powered(self.primary_powered, self.backup_powered);
    }
}
impl AdiruElectricalHarness for TestAdiruElectricalHarness {
    fn adr_discrete_inputs(&self) -> &AdrDiscreteInputs {
        &self.adr_discrete_input
    }

    fn ir_discrete_inputs(&self) -> &IrDiscreteInputs {
        &self.ir_discrete_input
    }
}

struct TestAircraft {
    test_fcu: TestFcu,
    test_adr_1: TestAdr,
    test_adr_2: TestAdr,
    adiru: AirDataInertialReferenceUnit,
    harness: TestAdiruElectricalHarness,
}
impl TestAircraft {
    fn new(context: &mut InitContext, num: usize) -> Self {
        Self {
            test_fcu: TestFcu::default(),
            test_adr_1: TestAdr::new(),
            test_adr_2: TestAdr::new(),
            adiru: AirDataInertialReferenceUnit::new(context, num),
            harness: TestAdiruElectricalHarness::new(),
        }
    }
}
impl Aircraft for TestAircraft {
    fn update_after_power_distribution(&mut self, context: &UpdateContext) {
        self.adiru.update(
            context,
            &self.harness.adr_discrete_inputs(),
            &self.harness.ir_discrete_inputs(),
            &self.test_fcu,
            &self.test_adr_1,
            &self.test_adr_2,
        );
    }
}
impl SimulationElement for TestAircraft {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.adiru.accept(visitor);

        visitor.visit(self);
    }

    fn read(&mut self, _reader: &mut SimulatorReader) {}

    fn write(&self, _writer: &mut SimulatorWriter) {}
}

struct AdirsTestBed {
    test_bed: SimulationTestBed<TestAircraft>,
}
impl AdirsTestBed {
    fn new(num: usize) -> Self {
        Self {
            test_bed: SimulationTestBed::new(|context| TestAircraft::new(context, num)),
        }
        .ir_mode_selector_set_to(ModeSelectorPosition::Navigation)
        .altimeter_setting_of(Pressure::new::<hectopascal>(1013.25))
    }

    // Setters and Configuration
    fn and(self) -> Self {
        self
    }

    fn then_continue_with(self) -> Self {
        self
    }

    fn latitude_of(mut self, latitude: Angle) -> Self {
        self.write_by_name(IrSimulatorData::LATITUDE, latitude);
        self
    }

    fn longitude_of(mut self, longitude: Angle) -> Self {
        self.write_by_name(IrSimulatorData::LONGITUDE, longitude);
        self
    }

    fn mach_of(mut self, mach: MachNumber) -> Self {
        self.write_by_name(AdrSimulatorData::MACH, mach);
        self
    }

    fn vertical_speed_of(mut self, velocity: Velocity) -> Self {
        self.write_by_name(
            IrSimulatorData::INERTIAL_VERTICAL_SPEED,
            velocity.get::<foot_per_minute>(),
        );
        self
    }

    fn true_airspeed_of(mut self, velocity: Velocity) -> Self {
        self.write_by_name(AdrSimulatorData::TRUE_AIRSPEED, velocity);
        self
    }

    fn total_air_temperature_of(mut self, temperature: ThermodynamicTemperature) -> Self {
        self.write_by_name(AdrSimulatorData::TOTAL_AIR_TEMPERATURE, temperature);
        self
    }

    fn angle_of_attack_of(mut self, angle: Angle) -> Self {
        self.write_by_name(AdrSimulatorData::ANGLE_OF_ATTACK, angle);
        self
    }

    fn pitch_of(mut self, angle: Angle) -> Self {
        self.write_by_name(IrSimulatorData::PITCH, angle);
        self
    }

    fn roll_of(mut self, angle: Angle) -> Self {
        self.write_by_name(IrSimulatorData::ROLL, angle);
        self
    }

    fn body_roll_rate_of(mut self, rate: AngularVelocity) -> Self {
        self.write_by_name(
            IrSimulatorData::BODY_ROTATION_RATE_Z,
            rate.get::<degree_per_second>(),
        );
        self
    }

    fn body_pitch_rate_of(mut self, rate: AngularVelocity) -> Self {
        self.write_by_name(
            IrSimulatorData::BODY_ROTATION_RATE_X,
            rate.get::<degree_per_second>(),
        );
        self
    }

    fn body_yaw_rate_of(mut self, rate: AngularVelocity) -> Self {
        self.write_by_name(
            IrSimulatorData::BODY_ROTATION_RATE_Y,
            rate.get::<degree_per_second>(),
        );
        self
    }

    fn body_lateral_velocity_of(mut self, velocity: Velocity) -> Self {
        self.write_by_name(UpdateContext::LOCAL_LATERAL_SPEED_KEY, velocity);
        self
    }

    fn heading_of(mut self, angle: Angle) -> Self {
        self.write_by_name(IrSimulatorData::HEADING, angle);
        self
    }

    fn true_heading_of(mut self, angle: Angle) -> Self {
        self.write_by_name(IrSimulatorData::TRUE_HEADING, angle);
        self
    }

    fn track_of(mut self, angle: Angle) -> Self {
        self.write_by_name(IrSimulatorData::TRACK, angle);
        self
    }

    fn true_track_of(mut self, angle: Angle) -> Self {
        self.write_by_name(IrSimulatorData::TRUE_TRACK, angle);
        self
    }

    fn ground_speed_of(mut self, velocity: Velocity) -> Self {
        self.write_by_name(IrSimulatorData::GROUND_SPEED, velocity);
        self
    }

    /// caution: sets tas, true heading, gs, true track, and pitch angle
    fn wind_of(self, angle: Angle, velocity: Velocity) -> Self {
        let tas = Velocity::new::<knot>(
            InertialReferenceRuntime::MINIMUM_TRUE_AIRSPEED_FOR_WIND_DETERMINATION_KNOTS + 10.,
        );
        let heading = Angle::new::<degree>(0.);

        let gs = Velocity::new::<knot>(
            ((velocity.get::<knot>() * (angle + Angle::HALF_TURN).sin().get::<ratio>()).powi(2)
                + (tas.get::<knot>()
                    + velocity.get::<knot>() * (angle + Angle::HALF_TURN).cos().get::<ratio>())
                .powi(2))
            .sqrt(),
        );
        let track = (tas / gs).acos();

        self.true_airspeed_of(tas)
            .true_heading_of(heading)
            .ground_speed_of(gs)
            .true_track_of(track)
            .pitch_of(Angle::default())
    }

    fn altimeter_setting_of(mut self, altimeter: Pressure) -> Self {
        self.command(|a| {
            a.test_fcu
                .set_baro_correction_1(altimeter.get::<hectopascal>());
            a.test_fcu
                .set_baro_correction_2(altimeter.get::<hectopascal>());
            a.test_fcu.set_failed(false);
        });
        self
    }

    fn fast_align_set_to(mut self, fast_align: bool) -> Self {
        self.command(|a| a.harness.set_fast_align(fast_align));
        self
    }

    fn perform_instant_align(mut self) -> Self {
        self.command(|a| a.harness.set_instant_align(true));
        self.run();
        self.command(|a| a.harness.set_instant_align(false));
        self
    }

    fn ir_mode_selector_set_to(mut self, position: ModeSelectorPosition) -> Self {
        self.command(|a| a.harness.set_mode_selector_knob(position));
        self
    }

    fn adr_push_button_pushed(mut self, pushed: bool) -> Self {
        self.command(|a| a.harness.set_adr_button_pushed(pushed));
        self
    }

    fn ir_push_button_pushed(mut self, pushed: bool) -> Self {
        self.command(|a| a.harness.set_ir_button_pushed(pushed));
        self
    }

    fn excess_motion_inhibit_set_to(mut self, inhibit: bool) -> Self {
        self.command(|a| a.harness.set_excess_motion_inhibit(inhibit));
        self
    }

    fn mode_selector_off(mut self) -> Self {
        self = self.ir_mode_selector_set_to(ModeSelectorPosition::Off);
        self.run_without_delta();
        // Run for the realign decision time to reach power off state
        self.run_with_delta(
            InertialReferenceRuntime::REALIGN_DECISION_TIME + Duration::from_millis(1),
        );
        self
    }

    fn primary_power_set_to(mut self, powered: bool) -> Self {
        self.command(|a| a.harness.set_primary_supply(powered, &mut a.adiru));
        self
    }

    fn backup_power_set_to(mut self, powered: bool) -> Self {
        self.command(|a| a.harness.set_backup_supply(powered, &mut a.adiru));
        self
    }

    fn adr_failed(mut self, adr_num: usize, failed: bool) -> Self {
        self.command(|a| match adr_num {
            1 => a.test_adr_1.set_failed(failed),
            2 => a.test_adr_2.set_failed(failed),
            num => println!("Invalid external ADR number {num}"),
        });
        self
    }

    fn adr_tas_of(mut self, adr_num: usize, speed: Velocity) -> Self {
        self.command(|a| match adr_num {
            1 => a.test_adr_1.set_true_airspeed(speed),
            2 => a.test_adr_2.set_true_airspeed(speed),
            num => println!("Invalid external ADR number {num}"),
        });
        self
    }

    fn auto_dads_select_set_to(mut self, set: bool) -> Self {
        self.command(|a| {
            a.harness.set_auto_dads_select(set);
        });
        self
    }

    fn manual_dads_select_set_to(mut self, set: bool) -> Self {
        self.command(|a| {
            a.harness.set_manual_dads_select(set);
        });
        self
    }

    // Getters and asserts
    fn get_adr_discrete_outputs(aircraft: &TestAircraft) -> &AdrDiscreteOutputs {
        <AirDataInertialReferenceUnit as AirDataReferenceDiscreteOutput>::discrete_outputs(
            &aircraft.adiru,
        )
    }

    fn get_ir_discrete_outputs(aircraft: &TestAircraft) -> &IrDiscreteOutputs {
        <AirDataInertialReferenceUnit as InertialReferenceDiscreteOutput>::discrete_outputs(
            &aircraft.adiru,
        )
    }

    fn get_adr_bus_outputs(aircraft: &TestAircraft) -> &AirDataReferenceBusOutputs {
        <AirDataInertialReferenceUnit as AirDataReferenceBusOutput>::bus_outputs(&aircraft.adiru)
    }

    fn get_ir_bus_outputs(aircraft: &TestAircraft) -> &InertialReferenceBusOutputs {
        <AirDataInertialReferenceUnit as InertialReferenceBusOutput>::bus_outputs(&aircraft.adiru)
    }

    fn adr_off_light_illuminated(&self) -> bool {
        self.query(|a| Self::get_adr_discrete_outputs(a).adr_off)
    }

    fn ir_off_light_illuminated(&self) -> bool {
        self.query(|a| Self::get_ir_discrete_outputs(a).ir_off)
    }

    #[allow(dead_code)]
    fn adr_fault_light_illuminated(&self) -> bool {
        self.query(|a| Self::get_adr_discrete_outputs(a).adr_fault)
    }

    fn ir_fault_light_illuminated(&self) -> bool {
        self.query(|a| Self::get_ir_discrete_outputs(a).ir_fault)
    }

    fn is_align_discrete_set(&self) -> bool {
        self.query(|a| Self::get_ir_discrete_outputs(a).align)
    }

    fn on_bat_light_illuminated(&self) -> bool {
        self.query(|a| Self::get_ir_discrete_outputs(a).battery_operation)
    }

    fn corrected_average_static_pressure(&self) -> Arinc429Word<Pressure> {
        self.query(|a| Self::get_adr_bus_outputs(a).corrected_average_static_pressure)
    }

    fn baro_correction_1_hpa(&self) -> Arinc429Word<f64> {
        self.query(|a| Self::get_adr_bus_outputs(a).baro_correction_1_hpa)
    }

    fn baro_correction_1_inhg(&self) -> Arinc429Word<f64> {
        self.query(|a| Self::get_adr_bus_outputs(a).baro_correction_1_inhg)
    }

    fn baro_correction_2_hpa(&self) -> Arinc429Word<f64> {
        self.query(|a| Self::get_adr_bus_outputs(a).baro_correction_2_hpa)
    }

    fn baro_correction_2_inhg(&self) -> Arinc429Word<f64> {
        self.query(|a| Self::get_adr_bus_outputs(a).baro_correction_2_inhg)
    }

    /// pressure altitude
    fn altitude(&self) -> Arinc429Word<Length> {
        self.query(|a| Self::get_adr_bus_outputs(a).standard_altitude)
    }

    /// baro corrected altitude for captain's side
    fn baro_corrected_altitude_1(&mut self) -> Arinc429Word<Length> {
        self.query(|a| Self::get_adr_bus_outputs(a).baro_corrected_altitude_1)
    }

    /// baro corrected altitude for fo's side
    fn baro_corrected_altitude_2(&mut self) -> Arinc429Word<Length> {
        self.query(|a| Self::get_adr_bus_outputs(a).baro_corrected_altitude_2)
    }

    fn computed_airspeed(&mut self) -> Arinc429Word<Velocity> {
        self.query(|a| Self::get_adr_bus_outputs(a).computed_airspeed)
    }

    fn max_airspeed(&mut self) -> Arinc429Word<Velocity> {
        self.query(|a| Self::get_adr_bus_outputs(a).max_allowable_airspeed)
    }

    fn mach(&mut self) -> Arinc429Word<Ratio> {
        self.query(|a| Self::get_adr_bus_outputs(a).mach)
    }

    fn barometric_vertical_speed(&mut self) -> Arinc429Word<Velocity> {
        self.query(|a| Self::get_adr_bus_outputs(a).vertical_speed)
    }

    fn true_airspeed(&mut self) -> Arinc429Word<Velocity> {
        self.query(|a| Self::get_adr_bus_outputs(a).true_airspeed)
    }

    fn static_air_temperature(&mut self) -> Arinc429Word<ThermodynamicTemperature> {
        self.query(|a| Self::get_adr_bus_outputs(a).static_air_temperature)
    }

    fn total_air_temperature(&mut self) -> Arinc429Word<ThermodynamicTemperature> {
        self.query(|a| Self::get_adr_bus_outputs(a).total_air_temperature)
    }

    fn angle_of_attack(&mut self) -> Arinc429Word<Angle> {
        self.query(|a| Self::get_adr_bus_outputs(a).corrected_angle_of_attack)
    }

    fn adr_discrete_word_1(&mut self) -> Arinc429Word<u32> {
        self.query(|a| Self::get_adr_bus_outputs(a).discrete_word_1)
    }

    fn pitch(&mut self) -> Arinc429Word<Angle> {
        self.query(|a: &TestAircraft| Self::get_ir_bus_outputs(a).pitch_angle)
    }

    fn roll(&mut self) -> Arinc429Word<Angle> {
        self.query(|a: &TestAircraft| Self::get_ir_bus_outputs(a).roll_angle)
    }

    fn heading(&mut self) -> Arinc429Word<Angle> {
        self.query(|a: &TestAircraft| Self::get_ir_bus_outputs(a).magnetic_heading)
    }

    fn true_heading(&mut self) -> Arinc429Word<Angle> {
        self.query(|a: &TestAircraft| Self::get_ir_bus_outputs(a).true_heading)
    }

    fn track(&mut self) -> Arinc429Word<Angle> {
        self.query(|a: &TestAircraft| Self::get_ir_bus_outputs(a).magnetic_track)
    }

    fn true_track(&mut self) -> Arinc429Word<Angle> {
        self.query(|a: &TestAircraft| Self::get_ir_bus_outputs(a).true_track)
    }

    fn drift_angle(&mut self) -> Arinc429Word<Angle> {
        self.query(|a: &TestAircraft| Self::get_ir_bus_outputs(a).drift_angle)
    }

    fn flight_path_angle(&mut self) -> Arinc429Word<Angle> {
        self.query(|a: &TestAircraft| Self::get_ir_bus_outputs(a).flight_path_angle)
    }

    fn body_pitch_rate(&mut self) -> Arinc429Word<AngularVelocity> {
        self.query(|a: &TestAircraft| Self::get_ir_bus_outputs(a).body_pitch_rate)
    }

    fn body_roll_rate(&mut self) -> Arinc429Word<AngularVelocity> {
        self.query(|a: &TestAircraft| Self::get_ir_bus_outputs(a).body_roll_rate)
    }

    fn body_yaw_rate(&mut self) -> Arinc429Word<AngularVelocity> {
        self.query(|a: &TestAircraft| Self::get_ir_bus_outputs(a).body_yaw_rate)
    }

    fn body_long_acc(&mut self) -> Arinc429Word<Ratio> {
        self.query(|a: &TestAircraft| Self::get_ir_bus_outputs(a).body_long_acc)
    }

    fn body_lat_acc(&mut self) -> Arinc429Word<Ratio> {
        self.query(|a: &TestAircraft| Self::get_ir_bus_outputs(a).body_lat_acc)
    }

    fn body_normal_acc(&mut self) -> Arinc429Word<Ratio> {
        self.query(|a: &TestAircraft| Self::get_ir_bus_outputs(a).body_normal_acc)
    }

    fn pitch_att_rate(&mut self) -> Arinc429Word<AngularVelocity> {
        self.query(|a: &TestAircraft| Self::get_ir_bus_outputs(a).pitch_att_rate)
    }

    fn roll_att_rate(&mut self) -> Arinc429Word<AngularVelocity> {
        self.query(|a: &TestAircraft| Self::get_ir_bus_outputs(a).roll_att_rate)
    }

    fn track_rate(&mut self) -> Arinc429Word<AngularVelocity> {
        self.query(|a: &TestAircraft| Self::get_ir_bus_outputs(a).track_angle_rate)
    }

    fn ground_speed(&mut self) -> Arinc429Word<Velocity> {
        self.query(|a: &TestAircraft| Self::get_ir_bus_outputs(a).ground_speed)
    }

    fn wind_direction(&mut self) -> Arinc429Word<Angle> {
        self.query(|a: &TestAircraft| Self::get_ir_bus_outputs(a).wind_dir_true_bcd)
    }

    fn wind_direction_bnr(&mut self) -> Arinc429Word<Angle> {
        self.query(|a: &TestAircraft| Self::get_ir_bus_outputs(a).wind_dir_true)
    }

    fn wind_speed(&mut self) -> Arinc429Word<Velocity> {
        self.query(|a: &TestAircraft| Self::get_ir_bus_outputs(a).wind_speed_bcd)
    }

    fn wind_speed_bnr(&mut self) -> Arinc429Word<Velocity> {
        self.query(|a: &TestAircraft| Self::get_ir_bus_outputs(a).wind_speed)
    }

    fn inertial_vertical_speed(&mut self) -> Arinc429Word<Velocity> {
        self.query(|a: &TestAircraft| Self::get_ir_bus_outputs(a).inertial_vertical_speed)
    }

    fn longitude(&mut self) -> Arinc429Word<Angle> {
        self.query(|a: &TestAircraft| Self::get_ir_bus_outputs(a).ppos_longitude)
    }

    fn latitude(&mut self) -> Arinc429Word<Angle> {
        self.query(|a: &TestAircraft| Self::get_ir_bus_outputs(a).ppos_latitude)
    }

    fn maint_word(&self) -> Arinc429Word<u32> {
        self.query(|a: &TestAircraft| Self::get_ir_bus_outputs(a).discrete_word_1)
    }

    fn assert_adr_data_valid(&mut self, valid: bool) {
        assert_eq!(
            !self
                .corrected_average_static_pressure()
                .is_failure_warning(),
            valid
        );
        assert_eq!(!self.altitude().is_failure_warning(), valid);
        assert_eq!(
            !self.baro_corrected_altitude_1().is_failure_warning(),
            valid
        );
        assert_eq!(
            !self.baro_corrected_altitude_2().is_failure_warning(),
            valid
        );
        assert_eq!(!self.computed_airspeed().is_failure_warning(), valid);
        assert_eq!(!self.max_airspeed().is_failure_warning(), valid);
        assert_eq!(!self.mach().is_failure_warning(), valid);
        assert_eq!(
            !self.barometric_vertical_speed().is_failure_warning(),
            valid
        );
        assert_eq!(!self.true_airspeed().is_failure_warning(), valid);
        assert_eq!(!self.static_air_temperature().is_failure_warning(), valid);
        assert_eq!(!self.total_air_temperature().is_failure_warning(), valid);
        assert_eq!(!self.angle_of_attack().is_failure_warning(), valid);
    }

    fn assert_adr_status_words_available(&mut self, available: bool) {
        assert_eq!(self.adr_discrete_word_1().is_normal_operation(), available);
    }

    fn assert_all_adr_words_available(&mut self, available: bool) {
        self.assert_adr_data_valid(available);
        self.assert_adr_status_words_available(available);
    }

    fn assert_ir_heading_data_available(&mut self, available: bool) {
        assert_eq!(self.heading().is_normal_operation(), available);
    }

    fn assert_ir_non_attitude_data_available(&mut self, available: bool) {
        assert_eq!(self.track().is_normal_operation(), available);
        assert_eq!(self.drift_angle().is_normal_operation(), available);
        assert_eq!(self.flight_path_angle().is_normal_operation(), available);
        assert_eq!(self.ground_speed().is_normal_operation(), available);
        assert_eq!(self.latitude().is_normal_operation(), available);
        assert_eq!(self.longitude().is_normal_operation(), available);
    }

    fn assert_ir_adr_dependent_data_available(&mut self, available: bool) {
        assert_eq!(
            self.inertial_vertical_speed().is_normal_operation(),
            available
        );
        assert_eq!(self.wind_direction().is_normal_operation(), available);
        assert_eq!(self.wind_direction_bnr().is_normal_operation(), available);
        assert_eq!(self.wind_speed().is_normal_operation(), available);
        assert_eq!(self.wind_speed_bnr().is_normal_operation(), available);
    }

    fn assert_ir_attitude_data_available(&mut self, available: bool) {
        assert_eq!(self.pitch().is_normal_operation(), available);
        assert_eq!(self.roll().is_normal_operation(), available);
        assert_eq!(self.body_pitch_rate().is_normal_operation(), available);
        assert_eq!(self.body_roll_rate().is_normal_operation(), available);
        assert_eq!(self.body_yaw_rate().is_normal_operation(), available);
        assert_eq!(self.body_long_acc().is_normal_operation(), available);
        assert_eq!(self.body_lat_acc().is_normal_operation(), available);
        assert_eq!(self.body_normal_acc().is_normal_operation(), available);
        assert_eq!(self.pitch_att_rate().is_normal_operation(), available);
        assert_eq!(self.roll_att_rate().is_normal_operation(), available);
        assert_eq!(self.track_rate().is_normal_operation(), available);
    }

    fn assert_all_ir_data_available(&mut self, available: bool) {
        self.assert_ir_attitude_data_available(available);
        self.assert_ir_heading_data_available(available);
        self.assert_ir_non_attitude_data_available(available);
    }

    fn assert_ir_status_words_available(&mut self, available: bool) {
        assert_eq!(self.maint_word().is_normal_operation(), available);
    }

    fn assert_all_ir_words_available(&mut self, available: bool) {
        self.assert_all_ir_data_available(available);
        self.assert_ir_status_words_available(available);
    }

    fn assert_wind_direction_and_velocity_zero(&mut self) {
        assert_about_eq!(self.wind_direction().value().get::<degree>(), 0.);
        assert_about_eq!(self.wind_direction_bnr().value().get::<degree>(), 0.);
        assert_about_eq!(self.wind_speed().value().get::<knot>(), 0.);
        assert_about_eq!(self.wind_speed_bnr().value().get::<knot>(), 0.);
    }
}
impl TestBed for AdirsTestBed {
    type Aircraft = TestAircraft;

    fn test_bed(&self) -> &SimulationTestBed<TestAircraft> {
        &self.test_bed
    }

    fn test_bed_mut(&mut self) -> &mut SimulationTestBed<TestAircraft> {
        &mut self.test_bed
    }
}

fn test_bed_with(num: usize) -> AdirsTestBed {
    test_bed(num)
}

fn test_bed(num: usize) -> AdirsTestBed {
    // Nearly all tests require mode selectors to be off, therefore it is the default.
    // TODO This is mislabeled. The ADIRU does not start off here, it starts in the power down state.
    adiru_aligned_test_bed(num).mode_selector_off()
}

fn adiru_aligned_test_bed_with(num: usize) -> AdirsTestBed {
    adiru_aligned_test_bed(num)
}

fn adiru_unaligned_test_bed_with(num: usize) -> AdirsTestBed {
    let mut bed = adiru_aligned_test_bed(num)
        .mode_selector_off()
        .primary_power_set_to(true)
        .and()
        .backup_power_set_to(true);
    // run long enough to bypass quick align
    bed.run_with_delta(Duration::from_secs(10));
    bed
}

fn adiru_aligned_test_bed(num: usize) -> AdirsTestBed {
    AdirsTestBed::new(num)
        .primary_power_set_to(true)
        .and()
        .backup_power_set_to(true)
}

#[rstest]
#[case(1)]
#[case(2)]
#[case(3)]
fn starts_initialized_and_aligned(#[case] adiru_number: usize) {
    // The structs start in an aligned state to support starting a flight
    // on the runway or in the air with the mode selectors in the NAV position.
    let mut test_bed = adiru_aligned_test_bed(adiru_number);
    test_bed.run();

    let maint_word_flags = IrMaintFlags::from_bits(test_bed.maint_word().value());
    assert_eq!(
        maint_word_flags.unwrap() & IrMaintFlags::NAV_MODE,
        IrMaintFlags::NAV_MODE
    );
    test_bed.assert_all_adr_words_available(true);
    test_bed.assert_all_ir_words_available(true);
}

#[rstest]
#[case(1)]
#[case(2)]
#[case(3)]
fn adiru_is_not_aligning_nor_aligned_when_ir_mode_selector_off(#[case] adiru_number: usize) {
    let mut test_bed =
        test_bed_with(adiru_number).ir_mode_selector_set_to(ModeSelectorPosition::Off);

    test_bed.run_with_delta(Duration::from_secs(0));

    assert!(!test_bed.is_align_discrete_set());
    let maint_word_flags = IrMaintFlags::from_bits(test_bed.maint_word().value());
    assert_eq!(
        maint_word_flags.unwrap() & (IrMaintFlags::ALIGNMENT_NOT_READY | IrMaintFlags::NAV_MODE),
        IrMaintFlags::empty()
    );

    test_bed.assert_adr_data_valid(false);
    test_bed.assert_all_ir_data_available(false);
}

#[rstest]
#[case(1)]
#[case(2)]
#[case(3)]
fn adiru_instantly_aligns_when_instant_align_is_set(#[case] adiru_number: usize) {
    let mut test_bed = test_bed_with(adiru_number)
        .and()
        .ir_mode_selector_set_to(ModeSelectorPosition::Navigation);
    test_bed.run_without_delta();

    test_bed = test_bed.perform_instant_align();

    let maint_word_flags = IrMaintFlags::from_bits(test_bed.maint_word().value());
    assert_eq!(
        maint_word_flags.unwrap() & IrMaintFlags::NAV_MODE,
        IrMaintFlags::NAV_MODE
    );
    test_bed.assert_all_adr_words_available(true);
}

#[rstest]
#[case(ModeSelectorPosition::Navigation)]
#[case(ModeSelectorPosition::Attitude)]
fn ten_and_a_half_seconds_after_moving_the_mode_selector_the_on_bat_light_illuminates_for_5_and_a_half_seconds(
    #[case] mode: ModeSelectorPosition,
) {
    let adiru_number = 1;
    let mut test_bed = test_bed_with(adiru_number).ir_mode_selector_set_to(mode);

    test_bed.run_with_delta(
        AirDataInertialReferenceUnit::BACKUP_SUPPLY_TEST_START_TIME - Duration::from_millis(1),
    );
    assert!(!test_bed.on_bat_light_illuminated());

    test_bed.run_with_delta(Duration::from_millis(2));
    test_bed.run_with_delta(Duration::from_millis(400));
    assert!(test_bed.on_bat_light_illuminated());

    test_bed.run_with_delta(
        AirDataInertialReferenceUnit::BACKUP_SUPPLY_TEST_DURATION - Duration::from_millis(500),
    );
    assert!(test_bed.on_bat_light_illuminated());

    test_bed.run_with_delta(Duration::from_millis(200));
    test_bed.run_with_delta(Duration::from_millis(1));
    assert!(!test_bed.on_bat_light_illuminated());
}

#[rstest]
#[case(1)]
#[case(2)]
#[case(3)]
fn switching_between_nav_and_att_doesnt_affect_the_on_bat_light_illumination(
    #[case] adiru_number: usize,
) {
    let mut test_bed =
        test_bed_with(adiru_number).ir_mode_selector_set_to(ModeSelectorPosition::Navigation);
    test_bed.run_with_delta(AirDataInertialReferenceUnit::BACKUP_SUPPLY_TEST_START_TIME);
    test_bed.run_with_delta(Duration::from_millis(420));

    assert!(test_bed.on_bat_light_illuminated());

    test_bed = test_bed
        .then_continue_with()
        .ir_mode_selector_set_to(ModeSelectorPosition::Attitude);
    test_bed.run();

    assert!(test_bed.on_bat_light_illuminated());
}

#[rstest]
#[case(1)]
#[case(2)]
#[case(3)]
fn adiru_is_powered_on_both_primary_and_backup_supply(#[case] adiru_number: usize) {
    let mut test_bed = adiru_aligned_test_bed(adiru_number);
    test_bed.run_without_delta();

    test_bed = test_bed.then_continue_with().primary_power_set_to(false);
    test_bed.run();

    let maint_word_flags = IrMaintFlags::from_bits(test_bed.maint_word().value());
    assert_eq!(
        maint_word_flags.unwrap() & IrMaintFlags::ON_DC,
        IrMaintFlags::ON_DC
    );
    test_bed.assert_all_adr_words_available(true);
    test_bed.assert_all_ir_words_available(true);
    assert!(test_bed.on_bat_light_illuminated());

    test_bed = test_bed
        .then_continue_with()
        .primary_power_set_to(true)
        .and()
        .backup_power_set_to(false);
    test_bed.run();

    let maint_word_flags = IrMaintFlags::from_bits(test_bed.maint_word().value());
    assert_eq!(
        maint_word_flags.unwrap() & IrMaintFlags::DC_FAIL,
        IrMaintFlags::DC_FAIL
    );
    test_bed.assert_all_adr_words_available(true);
    test_bed.assert_all_ir_words_available(true);
    assert!(!test_bed.on_bat_light_illuminated());
}

mod adr {
    use ntest::{assert_false, assert_true};
    use uom::si::{pressure::inch_of_mercury, time::second};

    use crate::{
        navigation::adirs::hw_block3_adiru::adr_runtime::AirDataReferenceRuntime,
        shared::InternationalStandardAtmosphere,
    };

    use super::*;

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn data_is_valid_18_seconds_after_alignment_began(#[case] adiru_number: usize) {
        let mut test_bed = adiru_unaligned_test_bed_with(adiru_number)
            .ir_mode_selector_set_to(ModeSelectorPosition::Navigation);
        test_bed.run_without_delta();

        test_bed.assert_adr_data_valid(false);

        test_bed.run_with_delta(
            AirDataInertialReferenceUnit::ADR_AVERAGE_STARTUP_TIME_MILLIS + Duration::from_secs(1),
        );

        test_bed.run_with_delta(Duration::from_millis(1));
        test_bed.assert_adr_data_valid(true);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn data_is_no_longer_valid_when_adiru_mode_selector_off(#[case] adiru_number: usize) {
        let mut test_bed = adiru_aligned_test_bed(adiru_number);
        test_bed.run();
        test_bed.assert_adr_data_valid(true);

        test_bed = test_bed
            .then_continue_with()
            .ir_mode_selector_set_to(ModeSelectorPosition::Off);
        test_bed.run();
        test_bed.assert_adr_data_valid(false);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn when_adr_push_button_off_data_is_not_valid(#[case] adiru_number: usize) {
        let mut test_bed = adiru_aligned_test_bed(adiru_number).adr_push_button_pushed(true);
        test_bed.run();
        test_bed = test_bed.adr_push_button_pushed(false);
        test_bed.run();

        test_bed.assert_adr_data_valid(false);
        assert!(test_bed.adr_off_light_illuminated())
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn corrected_average_static_pressure_is_supplied_by_adr(#[case] adiru_number: usize) {
        let mut test_bed = adiru_aligned_test_bed(adiru_number);
        test_bed.set_ambient_pressure(Pressure::new::<hectopascal>(1013.));

        // let the filter run a bit
        test_bed.run_iterations_with_delta(5, Duration::from_millis(250));

        assert_about_eq!(
            test_bed
                .corrected_average_static_pressure()
                .normal_value()
                .unwrap()
                .get::<hectopascal>(),
            1013.,
            1e-4
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn baro_correction_is_supplied_by_adr(#[case] adiru_number: usize) {
        let mut test_bed = adiru_aligned_test_bed(adiru_number)
            .altimeter_setting_of(Pressure::new::<hectopascal>(1020.));

        test_bed.run();

        assert_about_eq!(
            test_bed.baro_correction_1_hpa().normal_value().unwrap(),
            1020.
        );
        assert_about_eq!(
            test_bed.baro_correction_2_hpa().normal_value().unwrap(),
            1020.
        );

        test_bed = test_bed.altimeter_setting_of(Pressure::new::<inch_of_mercury>(29.80));

        test_bed.run();

        assert_about_eq!(
            test_bed.baro_correction_1_inhg().normal_value().unwrap(),
            29.80
        );
        assert_about_eq!(
            test_bed.baro_correction_2_inhg().normal_value().unwrap(),
            29.80
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn altitude_is_supplied_by_adr(#[case] adiru_number: usize) {
        use uom::si::pressure::pascal;

        let mut test_bed = adiru_aligned_test_bed(adiru_number);
        // set_pressure_altitude is only valid in the troposhere (due to InternationalStandardAtmosphere::pressure_at_altitude)
        // test_bed.set_pressure_altitude(Length::new::<foot>(41000.));
        test_bed.set_ambient_pressure(Pressure::new::<pascal>(17874.)); // 41000 feet

        test_bed.run_iterations_with_delta(10, Duration::from_millis(250));

        assert_about_eq!(
            test_bed.altitude().normal_value().unwrap().get::<foot>(),
            41000.,
            2.,
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn baro_corrected_altitude_1_is_supplied_by_adr(#[case] adiru_number: usize) {
        let mut test_bed = adiru_aligned_test_bed(adiru_number);
        test_bed.set_pressure_altitude(Length::new::<foot>(10000.));

        test_bed.run_iterations_with_delta(10, Duration::from_millis(250));

        assert_about_eq!(
            test_bed
                .baro_corrected_altitude_1()
                .normal_value()
                .unwrap()
                .get::<foot>(),
            10000.,
            2.,
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn baro_corrected_altitude_2_is_supplied_by_adr(#[case] adiru_number: usize) {
        let mut test_bed = adiru_aligned_test_bed(adiru_number);
        test_bed.set_pressure_altitude(Length::new::<foot>(10000.));

        test_bed.run_iterations_with_delta(10, Duration::from_millis(250));

        assert_about_eq!(
            test_bed
                .baro_corrected_altitude_2()
                .normal_value()
                .unwrap()
                .get::<foot>(),
            10000.,
            2.,
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn computed_airspeed_is_supplied_by_adr_when_greater_than_or_equal_to_30_knots(
        #[case] adiru_number: usize,
    ) {
        let velocity = Velocity::new::<knot>(AirDataReferenceRuntime::MINIMUM_CAS);
        let mut test_bed = adiru_aligned_test_bed(adiru_number);
        test_bed.set_indicated_airspeed(velocity);
        test_bed.run();

        assert_eq!(
            test_bed.computed_airspeed().normal_value().unwrap(),
            velocity
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn computed_airspeed_is_ncd_and_zero_when_less_than_30_knots(#[case] adiru_number: usize) {
        let velocity = Velocity::new::<knot>(AirDataReferenceRuntime::MINIMUM_CAS - 0.01);
        let mut test_bed = adiru_aligned_test_bed(adiru_number);
        test_bed.set_indicated_airspeed(velocity);
        test_bed.run();

        assert_about_eq!(test_bed.computed_airspeed().value().get::<knot>(), 0.);
        assert_eq!(
            test_bed.computed_airspeed().ssm(),
            SignStatus::NoComputedData
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn max_airspeed_is_provided_at_sea_level(#[case] adiru_number: usize) {
        let mut test_bed = adiru_aligned_test_bed(adiru_number);
        test_bed.set_ambient_pressure(InternationalStandardAtmosphere::ground_pressure());
        test_bed.run();

        assert_true!(test_bed.max_airspeed().value().get::<knot>() > 330.);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn max_airspeed_is_limited_by_mmo(#[case] adiru_number: usize) {
        use ntest::assert_true;

        let mut test_bed = adiru_aligned_test_bed(adiru_number);
        test_bed.set_ambient_pressure(InternationalStandardAtmosphere::pressure_at_altitude(
            Length::new::<foot>(39_000.),
        ));
        test_bed.run();

        assert_true!(test_bed.max_airspeed().value().get::<knot>() < 300.);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn overspeed_warning_is_inactive_at_normal_speed_at_sea_level(#[case] adiru_number: usize) {
        // check a value that's below VMO, but above MMO at higher altitudes
        let velocity = Velocity::new::<knot>(330.);
        let mut test_bed = adiru_aligned_test_bed(adiru_number);
        test_bed.set_indicated_airspeed(velocity);
        test_bed.set_ambient_pressure(InternationalStandardAtmosphere::ground_pressure());
        test_bed.run();

        let discrete_word_flags =
            AdrDiscrete1Flags::from_bits(test_bed.adr_discrete_word_1().value());
        assert_false!(discrete_word_flags
            .unwrap()
            .contains(AdrDiscrete1Flags::OVERSPEED_WARNING));
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn overspeed_warning_is_inactive_at_normal_speed_at_high_level(#[case] adiru_number: usize) {
        let fl390_pressure =
            InternationalStandardAtmosphere::pressure_at_altitude(Length::new::<foot>(39_000.));
        let velocity = MachNumber(0.78).to_cas(fl390_pressure);
        let mut test_bed = adiru_aligned_test_bed(adiru_number);
        test_bed.set_indicated_airspeed(velocity);
        test_bed.set_ambient_pressure(fl390_pressure);
        test_bed.run();

        let discrete_word_flags =
            AdrDiscrete1Flags::from_bits(test_bed.adr_discrete_word_1().value());
        assert_false!(discrete_word_flags
            .unwrap()
            .contains(AdrDiscrete1Flags::OVERSPEED_WARNING));
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn overspeed_warning_is_active_above_vmo(#[case] adiru_number: usize) {
        let velocity = Velocity::new::<knot>(400.);
        let mut test_bed = adiru_aligned_test_bed(adiru_number);
        test_bed.set_indicated_airspeed(velocity);
        test_bed.set_ambient_pressure(InternationalStandardAtmosphere::ground_pressure());
        test_bed.run();

        let discrete_word_flags =
            AdrDiscrete1Flags::from_bits(test_bed.adr_discrete_word_1().value());
        assert_true!(discrete_word_flags
            .unwrap()
            .contains(AdrDiscrete1Flags::OVERSPEED_WARNING));
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn overspeed_warning_is_active_above_mmo(#[case] adiru_number: usize) {
        let fl390_pressure =
            InternationalStandardAtmosphere::pressure_at_altitude(Length::new::<foot>(39_000.));
        // This speed will be above MMO, but below VMO, so we ensure MMO gets tested.
        let velocity = MachNumber(0.9).to_cas(fl390_pressure);
        let mut test_bed = adiru_aligned_test_bed(adiru_number);
        test_bed.set_indicated_airspeed(velocity);
        test_bed.set_ambient_pressure(fl390_pressure);
        test_bed.run();

        let discrete_word_flags =
            AdrDiscrete1Flags::from_bits(test_bed.adr_discrete_word_1().value());
        assert_true!(discrete_word_flags
            .unwrap()
            .contains(AdrDiscrete1Flags::OVERSPEED_WARNING));
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn mach_is_supplied_by_adr_when_greater_than_or_equal_to_zero_point_1(
        #[case] adiru_number: usize,
    ) {
        let mach = MachNumber::from(AirDataReferenceRuntime::MINIMUM_MACH);
        let mut test_bed = adiru_aligned_test_bed(adiru_number).mach_of(mach);
        test_bed.run();

        assert_about_eq!(
            f64::from(test_bed.mach().normal_value().unwrap()),
            f64::from(mach)
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn mach_is_ncd_and_zero_when_less_than_zero_point_1(#[case] adiru_number: usize) {
        let mach = MachNumber::from(AirDataReferenceRuntime::MINIMUM_MACH - 0.01);
        let mut test_bed = adiru_aligned_test_bed(adiru_number).mach_of(mach);
        test_bed.run();

        assert_about_eq!(f64::from(test_bed.mach().value()), 0.);
        assert_eq!(test_bed.mach().ssm(), SignStatus::NoComputedData);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn barometric_vertical_speed_is_supplied_by_adr(#[case] adiru_number: usize) {
        let vertical_speed = Velocity::new::<foot_per_minute>(300.);
        let mut test_bed = adiru_aligned_test_bed(adiru_number);
        let mut altitude = Length::new::<foot>(0.);
        for _ in 0..5 {
            test_bed.set_pressure_altitude(altitude);
            test_bed.run();

            altitude += vertical_speed * Time::new::<second>(1.);
        }

        assert_about_eq!(
            test_bed
                .barometric_vertical_speed()
                .normal_value()
                .unwrap()
                .get::<foot_per_minute>(),
            vertical_speed.get::<foot_per_minute>(),
            10.
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn true_airspeed_is_supplied_by_adr_when_greater_than_or_equal_to_60_knots(
        #[case] adiru_number: usize,
    ) {
        let velocity = Velocity::new::<knot>(AirDataReferenceRuntime::MINIMUM_TAS);
        let mut test_bed = adiru_aligned_test_bed(adiru_number).true_airspeed_of(velocity);
        test_bed.run();

        assert_eq!(test_bed.true_airspeed().normal_value().unwrap(), velocity);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn true_airspeed_is_ncd_and_zero_when_less_than_60_knots(#[case] adiru_number: usize) {
        let velocity = Velocity::new::<knot>(AirDataReferenceRuntime::MINIMUM_TAS - 0.01);
        let mut test_bed = adiru_aligned_test_bed(adiru_number).true_airspeed_of(velocity);
        test_bed.run();

        assert_about_eq!(test_bed.true_airspeed().value().get::<knot>(), 0.);
        assert_eq!(test_bed.true_airspeed().ssm(), SignStatus::NoComputedData);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn static_air_temperature_is_supplied_by_adr(#[case] adiru_number: usize) {
        let sat = ThermodynamicTemperature::new::<degree_celsius>(15.);
        let mut test_bed = adiru_aligned_test_bed(adiru_number);
        test_bed.set_ambient_temperature(sat);
        test_bed.run();

        assert_eq!(
            test_bed.static_air_temperature().normal_value().unwrap(),
            sat
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn total_air_temperature_is_supplied_by_adr(#[case] adiru_number: usize) {
        let tat = ThermodynamicTemperature::new::<degree_celsius>(15.);
        let mut test_bed = adiru_aligned_test_bed(adiru_number).total_air_temperature_of(tat);
        test_bed.run();

        assert_eq!(
            test_bed.total_air_temperature().normal_value().unwrap(),
            tat
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn angle_of_attack_is_supplied_by_adr_when_greater_than_or_equal_to_60_knots(
        #[case] adiru_number: usize,
    ) {
        let angle = Angle::new::<degree>(1.);
        let mut test_bed = adiru_aligned_test_bed(adiru_number).angle_of_attack_of(angle);
        test_bed.set_indicated_airspeed(Velocity::new::<knot>(
            AirDataReferenceRuntime::MINIMUM_CAS_FOR_AOA,
        ));
        test_bed.run();

        assert_eq!(test_bed.angle_of_attack().normal_value().unwrap(), angle);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn angle_of_attack_is_ncd_when_less_than_60_knots(#[case] adiru_number: usize) {
        let angle = Angle::new::<degree>(1.);
        let mut test_bed = adiru_aligned_test_bed(adiru_number).angle_of_attack_of(angle);
        test_bed.set_indicated_airspeed(Velocity::new::<knot>(
            AirDataReferenceRuntime::MINIMUM_CAS_FOR_AOA - 0.01,
        ));
        test_bed.run();

        assert_eq!(test_bed.angle_of_attack().value(), angle);
        assert_eq!(test_bed.angle_of_attack().ssm(), SignStatus::NoComputedData);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn discrete_output_speed_warning_1(#[case] adiru_number: usize) {
        let mut test_bed = adiru_aligned_test_bed(adiru_number);
        test_bed.set_indicated_airspeed(Velocity::new::<knot>(95.));
        test_bed.run();

        assert!(!test_bed.query(|a| AdirsTestBed::get_adr_discrete_outputs(a).low_speed_warning_1));

        test_bed.set_indicated_airspeed(Velocity::new::<knot>(105.));
        test_bed.run();
        assert!(test_bed.query(|a| AdirsTestBed::get_adr_discrete_outputs(a).low_speed_warning_1));
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn discrete_output_speed_warning_2(#[case] adiru_number: usize) {
        let mut test_bed = adiru_aligned_test_bed(adiru_number);
        test_bed.set_indicated_airspeed(Velocity::new::<knot>(45.));
        test_bed.run();

        assert!(!test_bed.query(|a| AdirsTestBed::get_adr_discrete_outputs(a).low_speed_warning_2));

        test_bed.set_indicated_airspeed(Velocity::new::<knot>(55.));
        test_bed.run();
        assert!(test_bed.query(|a| AdirsTestBed::get_adr_discrete_outputs(a).low_speed_warning_2));
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn discrete_output_speed_warning_3(#[case] adiru_number: usize) {
        let mut test_bed = adiru_aligned_test_bed(adiru_number);
        test_bed.set_indicated_airspeed(Velocity::new::<knot>(150.));
        test_bed.run();

        assert!(!test_bed.query(|a| AdirsTestBed::get_adr_discrete_outputs(a).low_speed_warning_3));

        test_bed.set_indicated_airspeed(Velocity::new::<knot>(160.));
        test_bed.run();
        assert!(test_bed.query(|a| AdirsTestBed::get_adr_discrete_outputs(a).low_speed_warning_3));
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn discrete_output_speed_warning_4(#[case] adiru_number: usize) {
        let mut test_bed = adiru_aligned_test_bed(adiru_number);
        test_bed.set_indicated_airspeed(Velocity::new::<knot>(255.));
        test_bed.run();

        assert!(test_bed.query(|a| AdirsTestBed::get_adr_discrete_outputs(a).low_speed_warning_4));

        test_bed.set_indicated_airspeed(Velocity::new::<knot>(265.));
        test_bed.run();
        assert!(!test_bed.query(|a| AdirsTestBed::get_adr_discrete_outputs(a).low_speed_warning_4));
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn discrete_output_speed_warnings_with_off_adiru(#[case] adiru_number: usize) {
        let mut test_bed = test_bed(adiru_number);
        test_bed.set_indicated_airspeed(Velocity::new::<knot>(5.));
        test_bed.run();

        assert!(!test_bed.query(|a| AdirsTestBed::get_adr_discrete_outputs(a).low_speed_warning_1));

        assert!(!test_bed.query(|a| AdirsTestBed::get_adr_discrete_outputs(a).low_speed_warning_2));

        assert!(!test_bed.query(|a| AdirsTestBed::get_adr_discrete_outputs(a).low_speed_warning_3));

        assert!(!test_bed.query(|a| AdirsTestBed::get_adr_discrete_outputs(a).low_speed_warning_4));
    }
}

mod ir {
    use super::*;
    use uom::si::{
        acceleration::meter_per_second_squared,
        angular_velocity::{degree_per_second, revolution_per_minute},
        ratio::ratio,
    };

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn adirs_aligns_in_90_seconds_when_configured_align_time_is_fast(#[case] adiru_number: usize) {
        let mut test_bed = test_bed_with(adiru_number)
            .fast_align_set_to(true)
            .and()
            .ir_mode_selector_set_to(ModeSelectorPosition::Navigation);

        // Set the state without any time passing to be able to measure exact time afterward.
        test_bed.run_with_delta(Duration::from_secs(0));

        test_bed.run_with_delta(
            AirDataInertialReferenceUnit::IR_AVERAGE_STARTUP_TIME_MILLIS
                + InertialReferenceRuntime::COARSE_ALIGN_QUICK_DURATION
                + Duration::from_secs(2),
        );
        assert!(test_bed.is_align_discrete_set());
        let maint_word_flags = IrMaintFlags::from_bits(test_bed.maint_word().value());
        assert_eq!(
            maint_word_flags.unwrap() & IrMaintFlags::ALIGNMENT_NOT_READY,
            IrMaintFlags::ALIGNMENT_NOT_READY
        );

        test_bed.run_with_delta(InertialReferenceRuntime::FINE_ALIGN_QUICK_DURATION);
        let maint_word_flags = IrMaintFlags::from_bits(test_bed.maint_word().value());
        assert_eq!(
            maint_word_flags.unwrap() & IrMaintFlags::NAV_MODE,
            IrMaintFlags::NAV_MODE
        );
    }

    #[rstest]
    #[case(Angle::new::<degree>(85.))]
    #[case(Angle::new::<degree>(-85.))]
    fn adirs_does_not_align_near_the_poles(#[case] polar_latitude: Angle) {
        let adiru_number = 1;
        let mut test_bed = start_align_at_latitude(polar_latitude, adiru_number);
        test_bed.run();
        test_bed.run_with_delta(Duration::from_secs(20 * 60)); // run for 20 minutes, enough for any alignment

        let maint_word_flags = IrMaintFlags::from_bits(test_bed.maint_word().value());
        assert_eq!(
            maint_word_flags.unwrap() & IrMaintFlags::ALIGNMENT_NOT_READY,
            IrMaintFlags::ALIGNMENT_NOT_READY
        );
    }

    #[rstest]
    #[case(Angle::new::<degree>(85.))]
    #[case(Angle::new::<degree>(-85.))]
    fn adirs_stays_aligned_near_the_poles(#[case] polar_latitude: Angle) {
        let adiru_number = 1;
        let mut test_bed = adiru_aligned_test_bed(adiru_number)
            .ir_mode_selector_set_to(ModeSelectorPosition::Navigation)
            .and()
            .latitude_of(polar_latitude);
        test_bed.run();

        let maint_word_flags = IrMaintFlags::from_bits(test_bed.maint_word().value());
        assert_eq!(
            maint_word_flags.unwrap() & IrMaintFlags::NAV_MODE,
            IrMaintFlags::NAV_MODE
        );
    }

    #[rstest]
    fn adiru_detects_excess_motion_during_alignment() {
        let adiru_number = 1;
        let mut test_bed = adiru_unaligned_test_bed_with(adiru_number)
            .body_lateral_velocity_of(Velocity::new::<foot_per_second>(0.1))
            .ir_mode_selector_set_to(ModeSelectorPosition::Navigation);
        test_bed.run();
        test_bed.run();

        let maint_word_flags = IrMaintFlags::from_bits(test_bed.maint_word().value());
        assert_eq!(
            maint_word_flags.unwrap() & IrMaintFlags::EXCESS_MOTION_ERROR,
            IrMaintFlags::EXCESS_MOTION_ERROR
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn adirs_does_not_detect_excess_motion_with_excess_motion_inhibit(#[case] adiru_number: usize) {
        let mut test_bed = adiru_unaligned_test_bed_with(adiru_number)
            .excess_motion_inhibit_set_to(true)
            .body_lateral_velocity_of(Velocity::new::<foot_per_second>(0.1))
            .ir_mode_selector_set_to(ModeSelectorPosition::Navigation);
        test_bed.run();
        test_bed.run();

        let maint_word_flags = IrMaintFlags::from_bits(test_bed.maint_word().value());
        assert_eq!(
            maint_word_flags.unwrap() & IrMaintFlags::EXCESS_MOTION_ERROR,
            IrMaintFlags::empty()
        );
    }

    #[rstest]
    #[case(Angle::new::<degree>(80.))]
    #[case(Angle::new::<degree>(-80.))]
    fn adirs_aligns_quicker_near_equator_than_near_the_poles_when_configured_align_time_is_realistic(
        #[case] polar_latitude: Angle,
    ) {
        let adiru_number = 1;

        let step_duration = Duration::from_secs(10);

        let mut equator_alignment_time = Duration::ZERO;
        let mut test_bed = start_align_at_latitude(Angle::new::<degree>(0.), adiru_number);
        while test_bed.is_align_discrete_set() {
            test_bed.run_with_delta(step_duration);
            equator_alignment_time = equator_alignment_time.saturating_add(step_duration);
        }

        let mut south_pole_alignment_time = Duration::ZERO;
        let mut test_bed = start_align_at_latitude(polar_latitude, adiru_number);
        while test_bed.is_align_discrete_set() {
            test_bed.run_with_delta(step_duration);
            south_pole_alignment_time = south_pole_alignment_time.saturating_add(step_duration);
        }

        assert!(equator_alignment_time < south_pole_alignment_time);
    }

    fn start_align_at_latitude(latitude: Angle, adiru_number: usize) -> AdirsTestBed {
        let mut test_bed = adiru_unaligned_test_bed_with(adiru_number)
            .latitude_of(latitude)
            .and()
            .ir_mode_selector_set_to(ModeSelectorPosition::Navigation);

        // Run for startup duration to begin alignment
        test_bed.run_with_delta(
            AirDataInertialReferenceUnit::IR_AVERAGE_STARTUP_TIME_MILLIS + Duration::from_secs(1),
        );
        test_bed
    }

    #[rstest]
    #[case(Angle::new::<degree>(0.))]
    #[case(Angle::new::<degree>(63.))]
    #[case(Angle::new::<degree>(-63.))]
    fn adirs_aligns_quick_when_mode_selector_off_for_3_secs(#[case] latitude: Angle) {
        let adiru_number = 1;
        // Create the conditions for a quick align (aligned, then less than 5 secs off)
        let mut test_bed = adiru_aligned_test_bed(adiru_number)
            .latitude_of(latitude)
            .and()
            .ir_mode_selector_set_to(ModeSelectorPosition::Off);
        test_bed.run_without_delta();
        test_bed.run_with_delta(
            InertialReferenceRuntime::REALIGN_DECISION_TIME - Duration::from_secs(1),
        );

        // Perform the quick align
        test_bed = test_bed
            .then_continue_with()
            .ir_mode_selector_set_to(ModeSelectorPosition::Navigation);
        test_bed.run();

        test_bed.assert_all_ir_data_available(false);
        test_bed.assert_ir_status_words_available(true);

        test_bed
            .run_with_delta(InertialReferenceRuntime::REALIGN_DURATION + Duration::from_secs(1));

        let maint_word_flags = IrMaintFlags::from_bits(test_bed.maint_word().value());
        assert_eq!(
            maint_word_flags.unwrap() & IrMaintFlags::NAV_MODE,
            IrMaintFlags::NAV_MODE
        );
    }

    #[rstest]
    #[case(ModeSelectorPosition::Navigation)]
    #[case(ModeSelectorPosition::Attitude)]
    fn ir_fault_light_briefly_flashes_when_moving_mode_selector_from_off_to(
        #[case] mode: ModeSelectorPosition,
    ) {
        let adiru_number = 1;
        let mut test_bed = test_bed_with(adiru_number).ir_mode_selector_set_to(mode);

        test_bed.run_without_delta();
        assert!(test_bed.ir_fault_light_illuminated());

        test_bed.run_with_delta(
            InertialReferenceRuntime::IR_FAULT_FLASH_DURATION - Duration::from_millis(1),
        );
        assert!(test_bed.ir_fault_light_illuminated());

        test_bed.run_with_delta(Duration::from_millis(1));
        assert!(!test_bed.ir_fault_light_illuminated());
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn ir_fault_light_doesnt_briefly_flash_when_moving_mode_selector_between_nav_and_att(
        #[case] adiru_number: usize,
    ) {
        let mut test_bed =
            test_bed_with(adiru_number).ir_mode_selector_set_to(ModeSelectorPosition::Navigation);
        test_bed.run_without_delta();
        test_bed.run();

        test_bed = test_bed
            .then_continue_with()
            .ir_mode_selector_set_to(ModeSelectorPosition::Attitude);
        test_bed.run_with_delta(Duration::from_millis(1));

        assert!(!test_bed.ir_fault_light_illuminated());
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn all_data_is_available_after_full_alignment_completed(#[case] adiru_number: usize) {
        let mut test_bed = adiru_unaligned_test_bed_with(adiru_number)
            .ir_mode_selector_set_to(ModeSelectorPosition::Navigation);
        test_bed.run_with_delta(
            AirDataInertialReferenceUnit::IR_AVERAGE_STARTUP_TIME_MILLIS + Duration::from_secs(1),
        );

        while test_bed.is_align_discrete_set() {
            // As the attitude and heading data will become available at some point, we're not checking it here.
            test_bed.assert_ir_non_attitude_data_available(false);
            test_bed.run();
        }

        test_bed = test_bed
            .then_continue_with()
            .true_airspeed_of(Velocity::new::<knot>(
                InertialReferenceRuntime::MINIMUM_TRUE_AIRSPEED_FOR_WIND_DETERMINATION_KNOTS + 0.01,
            ));
        test_bed.run();

        test_bed.assert_all_ir_data_available(true);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn data_is_no_longer_available_when_adiru_mode_selector_off(#[case] adiru_number: usize) {
        let mut test_bed =
            adiru_aligned_test_bed(adiru_number).true_airspeed_of(Velocity::new::<knot>(
                InertialReferenceRuntime::MINIMUM_TRUE_AIRSPEED_FOR_WIND_DETERMINATION_KNOTS + 0.01,
            ));
        test_bed.run();
        test_bed.assert_all_ir_data_available(true);

        test_bed = test_bed
            .then_continue_with()
            .ir_mode_selector_set_to(ModeSelectorPosition::Off);
        test_bed.run();
        test_bed.assert_all_ir_data_available(false);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn only_attitude_and_heading_data_is_available_when_reverting_from_nav_to_att_mode(
        #[case] adiru_number: usize,
    ) {
        let mut test_bed = adiru_aligned_test_bed(adiru_number)
            .ir_mode_selector_set_to(ModeSelectorPosition::Attitude);
        test_bed.run();
        test_bed
            .run_with_delta(InertialReferenceRuntime::ERECT_ATT_DURATION + Duration::from_secs(1));

        test_bed.assert_ir_attitude_data_available(true);
        test_bed.assert_ir_heading_data_available(true);
        test_bed.assert_ir_non_attitude_data_available(false);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn in_nav_mode_attitude_is_available_28_seconds_after_alignment_began(
        #[case] adiru_number: usize,
    ) {
        let mut test_bed =
            test_bed_with(adiru_number).ir_mode_selector_set_to(ModeSelectorPosition::Navigation);
        test_bed.run_without_delta();

        test_bed.run_with_delta(
            InertialReferenceRuntime::COARSE_ALIGN_DURATION - Duration::from_millis(1),
        );
        test_bed.assert_ir_attitude_data_available(false);
        test_bed.assert_ir_heading_data_available(false);

        test_bed.run_with_delta(Duration::from_millis(1));
        test_bed.assert_ir_attitude_data_available(true);
        test_bed.assert_ir_heading_data_available(false);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn in_att_mode_attitude_and_heading_are_available_28_seconds_after_alignment_began(
        #[case] adiru_number: usize,
    ) {
        // Note that in reality the HDG part needs HDG entry through the MCDU. As we haven't implemented
        // that feature yet, for now we'll just make it available after 28 seconds in ATT mode.
        let mut test_bed =
            test_bed_with(adiru_number).ir_mode_selector_set_to(ModeSelectorPosition::Attitude);
        test_bed.run_without_delta();

        test_bed.run_with_delta(
            InertialReferenceRuntime::ERECT_ATT_DURATION - Duration::from_millis(1),
        );
        test_bed.assert_ir_attitude_data_available(false);
        // TODO check if HDG should indeed not be available in ERECT ATT mode
        //test_bed.assert_ir_heading_data_available(false);

        test_bed.run_with_delta(Duration::from_millis(1));
        test_bed.assert_ir_attitude_data_available(true);
        test_bed.assert_ir_heading_data_available(true);

        let maint_word_flags = IrMaintFlags::from_bits(test_bed.maint_word().value());
        assert_eq!(
            maint_word_flags.unwrap() & IrMaintFlags::REV_ATT_MODE,
            IrMaintFlags::REV_ATT_MODE
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn when_ir_push_button_off_data_is_not_available(#[case] adiru_number: usize) {
        let mut test_bed = adiru_aligned_test_bed(adiru_number).ir_push_button_pushed(true);
        test_bed.run();
        test_bed = test_bed.ir_push_button_pushed(false);
        test_bed.run();

        test_bed.assert_all_ir_data_available(false);
        assert!(test_bed.ir_off_light_illuminated());
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn pitch_is_supplied_by_ir(#[case] adiru_number: usize) {
        let angle = Angle::new::<degree>(5.);
        let mut test_bed = adiru_aligned_test_bed(adiru_number).pitch_of(angle);
        test_bed.run();

        assert_eq!(test_bed.pitch().normal_value().unwrap(), -angle);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn roll_is_supplied_by_ir(#[case] adiru_number: usize) {
        let angle = Angle::new::<degree>(5.);
        let mut test_bed = adiru_aligned_test_bed(adiru_number).roll_of(angle);
        test_bed.run();

        assert_eq!(test_bed.roll().normal_value().unwrap(), -angle);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn body_roll_rate_is_supplied_by_ir(#[case] adiru_number: usize) {
        let rate = AngularVelocity::new::<revolution_per_minute>(5.);
        let mut test_bed = adiru_aligned_test_bed(adiru_number).body_roll_rate_of(rate);
        test_bed.run();

        assert_about_eq!(
            test_bed
                .body_roll_rate()
                .normal_value()
                .unwrap()
                .get::<degree_per_second>(),
            -rate.get::<degree_per_second>()
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn body_pitch_rate_is_supplied_by_ir(#[case] adiru_number: usize) {
        let rate = AngularVelocity::new::<revolution_per_minute>(5.);
        let mut test_bed = adiru_aligned_test_bed(adiru_number).body_pitch_rate_of(rate);
        test_bed.run();

        assert_about_eq!(
            test_bed
                .body_pitch_rate()
                .normal_value()
                .unwrap()
                .get::<radian_per_second>(),
            -rate.get::<radian_per_second>()
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn body_yaw_rate_is_supplied_by_ir(#[case] adiru_number: usize) {
        let rate = AngularVelocity::new::<degree_per_second>(5.);
        let mut test_bed = adiru_aligned_test_bed(adiru_number).body_yaw_rate_of(rate);
        test_bed.run();

        assert_about_eq!(
            test_bed
                .body_yaw_rate()
                .normal_value()
                .unwrap()
                .get::<degree_per_second>(),
            rate.get::<degree_per_second>()
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn body_long_acc_is_supplied_by_ir(#[case] adiru_number: usize) {
        let acc = Acceleration::new::<meter_per_second_squared>(1.);
        let g = Acceleration::new::<meter_per_second_squared>(9.81);
        let pitch = Angle::new::<degree>(5.);
        let roll = Angle::new::<degree>(5.);
        let mut test_bed = adiru_aligned_test_bed(adiru_number)
            .pitch_of(pitch)
            .roll_of(roll);
        test_bed.set_long_acc(acc);
        test_bed.run();

        assert_about_eq!(
            test_bed
                .body_long_acc()
                .normal_value()
                .unwrap()
                .get::<ratio>(),
            (acc / g + test_bed.pitch().normal_value().unwrap().sin()).get::<ratio>()
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn body_lat_acc_is_supplied_by_ir(#[case] adiru_number: usize) {
        let acc = Acceleration::new::<meter_per_second_squared>(1.);
        let g = Acceleration::new::<meter_per_second_squared>(9.81);
        let pitch = Angle::new::<degree>(5.);
        let roll = Angle::new::<degree>(5.);
        let mut test_bed = adiru_aligned_test_bed(adiru_number)
            .pitch_of(pitch)
            .roll_of(roll);
        test_bed.set_lat_acc(acc);
        test_bed.run();

        assert_about_eq!(
            test_bed
                .body_lat_acc()
                .normal_value()
                .unwrap()
                .get::<ratio>(),
            (acc / g
                - test_bed.pitch().normal_value().unwrap().cos()
                    * test_bed.roll().normal_value().unwrap().sin())
            .get::<ratio>()
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn body_norm_acc_is_supplied_by_ir(#[case] adiru_number: usize) {
        let acc = Acceleration::new::<meter_per_second_squared>(1.);
        let g = Acceleration::new::<meter_per_second_squared>(9.81);
        let pitch = Angle::new::<degree>(5.);
        let roll = Angle::new::<degree>(5.);
        let mut test_bed = adiru_aligned_test_bed(adiru_number)
            .pitch_of(pitch)
            .roll_of(roll);
        test_bed.set_norm_acc(acc);
        test_bed.run();

        assert_about_eq!(
            test_bed
                .body_normal_acc()
                .normal_value()
                .unwrap()
                .get::<ratio>(),
            (acc / g
                + test_bed.pitch().normal_value().unwrap().cos()
                    * test_bed.roll().normal_value().unwrap().cos())
            .get::<ratio>()
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn heading_is_supplied_by_ir(#[case] adiru_number: usize) {
        let angle = Angle::new::<degree>(160.);
        let mut test_bed = adiru_aligned_test_bed(adiru_number).heading_of(angle);
        test_bed.run();

        assert_eq!(test_bed.heading().normal_value().unwrap(), angle);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn true_heading_is_supplied_by_ir(#[case] adiru_number: usize) {
        let angle = Angle::new::<degree>(160.);
        let mut test_bed = adiru_aligned_test_bed(adiru_number).true_heading_of(angle);
        test_bed.run();

        assert_eq!(test_bed.true_heading().normal_value().unwrap(), angle);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn true_heading_is_normal_when_5_minutes_into_alignment(#[case] adiru_number: usize) {
        let mut test_bed =
            test_bed_with(adiru_number).ir_mode_selector_set_to(ModeSelectorPosition::Navigation);

        // Run once to let the simulation write the remaining alignment time.
        test_bed.run_with_delta(Duration::from_secs(0));
        test_bed.run_with_delta(InertialReferenceRuntime::COARSE_ALIGN_DURATION);
        test_bed.run_with_delta(
            InertialReferenceRuntime::HDG_ALIGN_AVAIL_DURATION + Duration::from_secs(1),
        );

        assert!(test_bed.true_heading().is_normal_operation());
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn true_heading_is_not_normal_when_remaining_align_is_less_than_5_minutes(
        #[case] adiru_number: usize,
    ) {
        let mut test_bed =
            test_bed_with(adiru_number).ir_mode_selector_set_to(ModeSelectorPosition::Navigation);

        // Run once to let the simulation write the remaining alignment time.
        test_bed.run_with_delta(Duration::from_secs(0));
        test_bed.run_with_delta(InertialReferenceRuntime::COARSE_ALIGN_DURATION);
        test_bed.run_with_delta(
            InertialReferenceRuntime::HDG_ALIGN_AVAIL_DURATION - Duration::from_secs(1),
        );

        assert!(!test_bed.true_heading().is_normal_operation());
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn magnetic_heading_is_supplied_and_equal_to_true_heading_when_in_polar_region(
        #[case] adiru_number: usize,
    ) {
        let true_heading = Angle::new::<degree>(160.);
        let mag_heading = Angle::new::<degree>(142.);
        let polar_latitude = Angle::new::<degree>(83.);

        let mut test_bed = adiru_aligned_test_bed(adiru_number)
            .true_heading_of(true_heading)
            .heading_of(mag_heading)
            .latitude_of(polar_latitude);
        test_bed.run();

        assert!(test_bed.true_heading().is_normal_operation());
        assert!(test_bed.heading().is_normal_operation());
        assert_about_eq!(
            test_bed.true_heading().value().get::<degree>(),
            test_bed.heading().value().get::<degree>()
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn magnetic_heading_is_supplied_and_not_equal_to_true_heading_when_left_polar_region(
        #[case] adiru_number: usize,
    ) {
        let true_heading = Angle::new::<degree>(160.);
        let mag_heading = Angle::new::<degree>(142.);
        let polar_latitude = Angle::new::<degree>(83.);
        let non_polar_latitude = Angle::new::<degree>(80.);

        let mut test_bed = adiru_aligned_test_bed(adiru_number)
            .true_heading_of(true_heading)
            .heading_of(mag_heading)
            .latitude_of(polar_latitude);
        test_bed.run();

        test_bed.set_latitude(non_polar_latitude);
        test_bed.run();

        assert!(test_bed.true_heading().is_normal_operation());
        assert!(test_bed.heading().is_normal_operation());
        assert_about_eq!(
            test_bed.true_heading().value().get::<degree>(),
            true_heading.get::<degree>()
        );
        assert_about_eq!(
            test_bed.heading().value().get::<degree>(),
            mag_heading.get::<degree>()
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn extreme_latitude_flag_is_set_in_polar_region(#[case] adiru_number: usize) {
        let polar_latitude = Angle::new::<degree>(83.);

        let mut test_bed = adiru_aligned_test_bed(adiru_number).latitude_of(polar_latitude);
        test_bed.run();

        assert!(test_bed.maint_word().is_normal_operation());
        let maint_word_flags = IrMaintFlags::from_bits(test_bed.maint_word().value());
        assert_eq!(
            maint_word_flags.unwrap() & IrMaintFlags::EXTREME_LATITUDE,
            IrMaintFlags::EXTREME_LATITUDE
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn extreme_latitude_flag_is_unset_when_left_polar_region(#[case] adiru_number: usize) {
        let polar_latitude = Angle::new::<degree>(83.);
        let non_polar_latitude = Angle::new::<degree>(80.);

        let mut test_bed = adiru_aligned_test_bed(adiru_number).latitude_of(polar_latitude);
        test_bed.run();

        test_bed.set_latitude(non_polar_latitude);
        test_bed.run();

        assert!(test_bed.maint_word().is_normal_operation());
        let maint_word_flags = IrMaintFlags::from_bits(test_bed.maint_word().value());
        assert_eq!(
            maint_word_flags.unwrap() & IrMaintFlags::EXTREME_LATITUDE,
            IrMaintFlags::default()
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn track_is_supplied_when_ground_speed_greater_than_or_equal_to_50_knots(
        #[case] adiru_number: usize,
    ) {
        let angle = Angle::new::<degree>(160.);
        let mut test_bed = adiru_aligned_test_bed(adiru_number)
            .track_of(angle)
            .and()
            .ground_speed_of(Velocity::new::<knot>(
                InertialReferenceRuntime::MINIMUM_GROUND_SPEED_FOR_TRACK_KNOTS,
            ));
        test_bed.run();

        assert_eq!(test_bed.track().normal_value().unwrap(), angle);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn true_track_is_supplied_when_ground_speed_greater_than_or_equal_to_50_knots(
        #[case] adiru_number: usize,
    ) {
        let angle = Angle::new::<degree>(160.);
        let mut test_bed = adiru_aligned_test_bed(adiru_number)
            .true_track_of(angle)
            .and()
            .ground_speed_of(Velocity::new::<knot>(
                InertialReferenceRuntime::MINIMUM_GROUND_SPEED_FOR_TRACK_KNOTS,
            ));
        test_bed.run();

        assert_eq!(test_bed.true_track().normal_value().unwrap(), angle);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn track_is_heading_when_ground_speed_less_than_50_knots(#[case] adiru_number: usize) {
        let angle = Angle::new::<degree>(160.);
        let mut test_bed = adiru_aligned_test_bed(adiru_number)
            .heading_of(angle)
            .and()
            .ground_speed_of(Velocity::new::<knot>(
                InertialReferenceRuntime::MINIMUM_GROUND_SPEED_FOR_TRACK_KNOTS - 0.01,
            ));
        test_bed.run();

        assert_eq!(test_bed.track().normal_value().unwrap(), angle);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn true_track_is_true_heading_when_ground_speed_less_than_50_knots(
        #[case] adiru_number: usize,
    ) {
        let angle = Angle::new::<degree>(160.);
        let mut test_bed = adiru_aligned_test_bed(adiru_number)
            .true_heading_of(angle)
            .and()
            .ground_speed_of(Velocity::new::<knot>(
                InertialReferenceRuntime::MINIMUM_GROUND_SPEED_FOR_TRACK_KNOTS - 0.01,
            ));
        test_bed.run();

        assert_eq!(test_bed.true_track().normal_value().unwrap(), angle);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn magnetic_track_is_supplied_and_equal_to_true_track_when_in_polar_region(
        #[case] adiru_number: usize,
    ) {
        let true_track = Angle::new::<degree>(160.);
        let mag_track = Angle::new::<degree>(142.);
        let polar_latitude = Angle::new::<degree>(83.);

        let mut test_bed = adiru_aligned_test_bed(adiru_number)
            .true_track_of(true_track)
            .track_of(mag_track)
            .latitude_of(polar_latitude);
        test_bed.run();

        assert!(test_bed.true_track().is_normal_operation());
        assert!(test_bed.track().is_normal_operation());
        assert_about_eq!(
            test_bed.true_track().value().get::<degree>(),
            test_bed.track().value().get::<degree>()
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn magnetic_track_is_supplied_and_not_equal_to_true_track_when_left_polar_region(
        #[case] adiru_number: usize,
    ) {
        let true_track = Angle::new::<degree>(160.);
        let mag_track = Angle::new::<degree>(142.);
        let polar_latitude = Angle::new::<degree>(83.);
        let non_polar_latitude = Angle::new::<degree>(80.);

        let mut test_bed = adiru_aligned_test_bed(adiru_number)
            .true_heading_of(true_track)
            .heading_of(mag_track)
            .latitude_of(polar_latitude);
        test_bed.run();

        test_bed.set_latitude(non_polar_latitude);
        test_bed.run();

        assert!(test_bed.true_track().is_normal_operation());
        assert!(test_bed.track().is_normal_operation());
        assert_about_eq!(
            test_bed.true_track().value().get::<degree>(),
            true_track.get::<degree>()
        );
        assert_about_eq!(
            test_bed.track().value().get::<degree>(),
            mag_track.get::<degree>()
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn drift_angle_is_supplied_when_ground_speed_greater_than_or_equal_to_50_knots(
        #[case] adiru_number: usize,
    ) {
        let heading = Angle::new::<degree>(160.);
        let track = Angle::new::<degree>(180.);
        let mut test_bed = adiru_aligned_test_bed(adiru_number)
            .track_of(track)
            .heading_of(heading)
            .and()
            .ground_speed_of(Velocity::new::<knot>(
                InertialReferenceRuntime::MINIMUM_GROUND_SPEED_FOR_TRACK_KNOTS,
            ));
        test_bed.run();

        assert_about_eq!(
            test_bed
                .drift_angle()
                .normal_value()
                .unwrap()
                .get::<degree>(),
            (track - heading).get::<degree>()
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn drift_angle_is_zero_when_ground_speed_less_than_50_knots(#[case] adiru_number: usize) {
        let heading = Angle::new::<degree>(160.);
        let track = Angle::new::<degree>(180.);
        let mut test_bed = adiru_aligned_test_bed(adiru_number)
            .track_of(track)
            .and()
            .heading_of(heading)
            .and()
            .ground_speed_of(Velocity::new::<knot>(
                InertialReferenceRuntime::MINIMUM_GROUND_SPEED_FOR_TRACK_KNOTS - 0.01,
            ));
        test_bed.run();

        assert_eq!(
            test_bed.drift_angle().normal_value().unwrap(),
            Angle::new::<degree>(0.)
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn flight_path_angle_is_supplied_when_ground_speed_greater_than_or_equal_to_50_knots(
        #[case] adiru_number: usize,
    ) {
        let vs = Velocity::new::<foot_per_minute>(500.);
        let mut test_bed = adiru_aligned_test_bed(adiru_number)
            .vertical_speed_of(vs)
            .and()
            .ground_speed_of(Velocity::new::<knot>(
                InertialReferenceRuntime::MINIMUM_GROUND_SPEED_FOR_TRACK_KNOTS,
            ));
        test_bed.run();

        assert_about_eq!(
            test_bed
                .flight_path_angle()
                .normal_value()
                .unwrap()
                .get::<degree>(),
            vs.atan2(Velocity::new::<knot>(
                InertialReferenceRuntime::MINIMUM_GROUND_SPEED_FOR_TRACK_KNOTS,
            ))
            .get::<degree>()
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn flight_path_angle_is_zero_when_ground_speed_less_than_50_knots(#[case] adiru_number: usize) {
        let vs = Velocity::new::<foot_per_minute>(500.);
        let mut test_bed = adiru_aligned_test_bed(adiru_number)
            .vertical_speed_of(vs)
            .and()
            .ground_speed_of(Velocity::new::<knot>(
                InertialReferenceRuntime::MINIMUM_GROUND_SPEED_FOR_TRACK_KNOTS - 0.01,
            ));
        test_bed.run();

        assert_eq!(
            test_bed.drift_angle().normal_value().unwrap(),
            Angle::new::<degree>(0.)
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn vertical_speed_is_supplied_by_ir(#[case] adiru_number: usize) {
        let vertical_speed = Velocity::new::<foot_per_minute>(300.);
        let mut test_bed = adiru_aligned_test_bed(adiru_number).vertical_speed_of(vertical_speed);
        test_bed.run();

        assert_about_eq!(
            test_bed
                .inertial_vertical_speed()
                .normal_value()
                .unwrap()
                .get::<foot_per_minute>(),
            vertical_speed.get::<foot_per_minute>()
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn ground_speed_is_supplied_by_ir(#[case] adiru_number: usize) {
        let gs = Velocity::new::<knot>(200.);
        let mut test_bed = adiru_aligned_test_bed(adiru_number).ground_speed_of(gs);
        test_bed.run();

        assert_eq!(test_bed.ground_speed().normal_value().unwrap(), gs);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn wind_is_supplied_when_true_airspeed_greater_than_or_equal_to_100_knots(
        #[case] adiru_number: usize,
    ) {
        let wind_angle = Angle::new::<degree>(270.);
        let wind_speed = Velocity::new::<knot>(40.);

        let mut test_bed = adiru_aligned_test_bed(adiru_number).wind_of(wind_angle, wind_speed);
        test_bed.run();

        assert_about_eq!(
            test_bed
                .wind_direction()
                .normal_value()
                .unwrap()
                .get::<degree>(),
            wind_angle.get::<degree>()
        );
        assert_about_eq!(
            test_bed
                .wind_direction_bnr()
                .normal_value()
                .unwrap()
                .get::<degree>(),
            wind_angle.normalised_180().get::<degree>()
        );
        assert_about_eq!(
            test_bed.wind_speed().normal_value().unwrap().get::<knot>(),
            wind_speed.get::<knot>()
        );
        assert_about_eq!(
            test_bed
                .wind_speed_bnr()
                .normal_value()
                .unwrap()
                .get::<knot>(),
            wind_speed.get::<knot>()
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn wind_is_zero_when_true_airspeed_less_than_100_knots(#[case] adiru_number: usize) {
        let mut test_bed = adiru_aligned_test_bed(adiru_number)
            .wind_of(Angle::new::<degree>(150.), Velocity::new::<knot>(40.))
            .and()
            .true_airspeed_of(Velocity::new::<knot>(
                InertialReferenceRuntime::MINIMUM_TRUE_AIRSPEED_FOR_WIND_DETERMINATION_KNOTS - 0.01,
            ));
        test_bed.run();

        test_bed.assert_wind_direction_and_velocity_zero();
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn wind_is_zero_when_true_airspeed_is_unavailable(#[case] adiru_number: usize) {
        let mut test_bed = adiru_aligned_test_bed(adiru_number)
            .wind_of(Angle::new::<degree>(150.), Velocity::new::<knot>(40.))
            .and()
            .adr_push_button_pushed(true);

        test_bed.run();
        test_bed = test_bed.adr_push_button_pushed(false);

        test_bed.assert_wind_direction_and_velocity_zero();
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn latitude_is_supplied_by_ir(#[case] adiru_number: usize) {
        let latitude = Angle::new::<degree>(10.);
        let mut test_bed = adiru_aligned_test_bed(adiru_number).latitude_of(latitude);
        test_bed.run();

        assert_eq!(test_bed.latitude().normal_value().unwrap(), latitude);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn longitude_is_supplied_by_ir(#[case] adiru_number: usize) {
        let longitude = Angle::new::<degree>(10.);
        let mut test_bed = adiru_aligned_test_bed(adiru_number).longitude_of(longitude);
        test_bed.run();

        assert_eq!(test_bed.longitude().normal_value().unwrap(), longitude);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn manual_adr_select_discretes_force_external_adr_usage(#[case] adiru_number: usize) {
        let velocity = Velocity::new::<knot>(
            InertialReferenceRuntime::MINIMUM_TRUE_AIRSPEED_FOR_WIND_DETERMINATION_KNOTS + 1.,
        );

        let mut test_bed = adiru_aligned_test_bed_with(adiru_number)
            .true_airspeed_of(velocity)
            .adr_tas_of(1, velocity)
            .adr_tas_of(2, velocity);
        test_bed.run();

        // Check that IR ADR based values are normal
        test_bed.assert_ir_adr_dependent_data_available(true);

        // Check that own ADR is correctly used with AUTO DADS select set
        test_bed = test_bed
            .then_continue_with()
            .adr_failed(1, true)
            .adr_failed(2, true);
        test_bed.run();

        test_bed.assert_ir_adr_dependent_data_available(true);

        // Check that no ADR values are available if all ADRs are failed
        test_bed = test_bed.adr_push_button_pushed(true);
        test_bed.run();
        test_bed = test_bed.adr_push_button_pushed(false);
        test_bed.assert_ir_adr_dependent_data_available(false);

        // Check that ADR own is not selected if AUTO DADS SELECT is not set
        test_bed = test_bed.adr_push_button_pushed(true);
        test_bed.run();
        test_bed = test_bed
            .adr_push_button_pushed(false)
            .then_continue_with()
            .auto_dads_select_set_to(false)
            .and()
            .manual_dads_select_set_to(false);
        test_bed.run();
        test_bed.assert_ir_adr_dependent_data_available(false);

        // Check that the external ADRs are properly switched with the MANUAL DADS select discrete
        test_bed = test_bed.then_continue_with().adr_failed(1, false);
        test_bed.run();
        test_bed.assert_ir_adr_dependent_data_available(true);

        test_bed = test_bed
            .then_continue_with()
            .adr_failed(1, true)
            .adr_failed(2, false)
            .manual_dads_select_set_to(true);
        test_bed.run();
        test_bed.assert_ir_adr_dependent_data_available(true);
    }
}
