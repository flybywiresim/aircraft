use super::adiru::*;
use super::adr_runtime::*;
use super::ir_runtime::*;
use super::*;
use crate::navigation::adirs::ModeSelectorPosition;
use crate::shared::arinc429::SignStatus;
use crate::simulation::test::{ReadByName, WriteByName};
use crate::simulation::SimulatorReader;
use crate::{
    shared::arinc429::Arinc429Word,
    simulation::{
        test::{SimulationTestBed, TestBed},
        Aircraft, SimulationElementVisitor, SimulatorWriter, UpdateContext,
    },
};
use ntest::{assert_about_eq, timeout};
use rstest::rstest;
use std::time::Duration;
use uom::si::pressure::hectopascal;
use uom::si::velocity::foot_per_second;
use uom::si::{
    angle::degree,
    angular_velocity::radian_per_second,
    length::foot,
    ratio::percent,
    thermodynamic_temperature::degree_celsius,
    velocity::{foot_per_minute, knot},
};

struct TestAircraft {
    adirs: AirDataInertialReferenceSystem,
    overhead: AirDataInertialReferenceSystemOverheadPanel,
}
impl TestAircraft {
    fn new(context: &mut InitContext) -> Self {
        let adirs_programming = AirDataInertialReferenceUnitProgramming::new(
            Velocity::new::<knot>(340.),
            MachNumber(0.82),
            [
                LowSpeedWarningThreshold::new(
                    Velocity::new::<knot>(100.),
                    Velocity::new::<knot>(104.),
                ),
                LowSpeedWarningThreshold::new(
                    Velocity::new::<knot>(50.),
                    Velocity::new::<knot>(54.),
                ),
                LowSpeedWarningThreshold::new(
                    Velocity::new::<knot>(155.),
                    Velocity::new::<knot>(159.),
                ),
                LowSpeedWarningThreshold::new(
                    Velocity::new::<knot>(260.),
                    Velocity::new::<knot>(264.),
                ),
            ],
        );
        Self {
            adirs: AirDataInertialReferenceSystem::new(context),
            overhead: AirDataInertialReferenceSystemOverheadPanel::new(context),
        }
    }
}
impl Aircraft for TestAircraft {
    fn update_after_power_distribution(&mut self, context: &UpdateContext) {
        self.adirs.update(context, &self.overhead);
        self.overhead.update(context, &self.adirs);
    }
}
impl SimulationElement for TestAircraft {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.adirs.accept(visitor);
        self.overhead.accept(visitor);

        visitor.visit(self);
    }

    fn read(&mut self, _reader: &mut SimulatorReader) {}

    fn write(&self, _writer: &mut SimulatorWriter) {}
}

struct AdirsTestBed {
    test_bed: SimulationTestBed<TestAircraft>,
}
impl AdirsTestBed {
    fn new() -> Self {
        let mut adirs_test_bed = Self {
            test_bed: SimulationTestBed::new(TestAircraft::new),
        };
        adirs_test_bed.move_all_mode_selectors_to(ModeSelectorPosition::Navigation);
        adirs_test_bed.altimeter_setting_of(Pressure::new::<hectopascal>(1013.25))
    }

    fn and(self) -> Self {
        self
    }

    fn then_continue_with(self) -> Self {
        self
    }

    fn latitude_of(mut self, latitude: Angle) -> Self {
        self.write_by_name(AdirsSimulatorData::LATITUDE, latitude);
        self
    }

    fn longitude_of(mut self, longitude: Angle) -> Self {
        self.write_by_name(AdirsSimulatorData::LONGITUDE, longitude);
        self
    }

    fn mach_of(mut self, mach: MachNumber) -> Self {
        self.write_by_name(AdirsSimulatorData::MACH, mach);
        self
    }

    fn inertial_vertical_speed_of(mut self, velocity: Velocity) -> Self {
        self.write_by_name(
            AdirsSimulatorData::INERTIAL_VERTICAL_SPEED,
            velocity.get::<foot_per_minute>(),
        );
        self
    }

    fn true_airspeed_of(mut self, velocity: Velocity) -> Self {
        self.write_by_name(AdirsSimulatorData::TRUE_AIRSPEED, velocity);
        self
    }

    fn total_air_temperature_of(mut self, temperature: ThermodynamicTemperature) -> Self {
        self.write_by_name(AdirsSimulatorData::TOTAL_AIR_TEMPERATURE, temperature);
        self
    }

    fn angle_of_attack_of(mut self, angle: Angle) -> Self {
        self.write_by_name(AdirsSimulatorData::ANGLE_OF_ATTACK, angle);
        self
    }

    fn pitch_of(mut self, angle: Angle) -> Self {
        self.write_by_name(AdirsSimulatorData::PITCH, angle);
        self
    }

    fn roll_of(mut self, angle: Angle) -> Self {
        self.write_by_name(AdirsSimulatorData::ROLL, angle);
        self
    }

    fn body_roll_rate_of(mut self, rate: AngularVelocity) -> Self {
        self.write_by_name(AdirsSimulatorData::BODY_ROTATION_RATE_Z, rate);
        self
    }

    fn body_pitch_rate_of(mut self, rate: AngularVelocity) -> Self {
        self.write_by_name(AdirsSimulatorData::BODY_ROTATION_RATE_X, rate);
        self
    }

    fn body_yaw_rate_of(mut self, rate: AngularVelocity) -> Self {
        self.write_by_name(AdirsSimulatorData::BODY_ROTATION_RATE_Y, rate);
        self
    }

    fn body_lateral_velocity_of(mut self, velocity: Velocity) -> Self {
        self.write_by_name(UpdateContext::LOCAL_LATERAL_SPEED_KEY, velocity);
        self
    }

    fn heading_of(mut self, angle: Angle) -> Self {
        self.write_by_name(AdirsSimulatorData::HEADING, angle);
        self
    }

    fn true_heading_of(mut self, angle: Angle) -> Self {
        self.write_by_name(AdirsSimulatorData::TRUE_HEADING, angle);
        self
    }

    fn track_of(mut self, angle: Angle) -> Self {
        self.write_by_name(AdirsSimulatorData::TRACK, angle);
        self
    }

    fn true_track_of(mut self, angle: Angle) -> Self {
        self.write_by_name(AdirsSimulatorData::TRUE_TRACK, angle);
        self
    }

    fn ground_speed_of(mut self, velocity: Velocity) -> Self {
        self.write_by_name(AdirsSimulatorData::GROUND_SPEED, velocity);
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
            .pitch_angle_of(Angle::default())
    }

    fn pitch_angle_of(mut self, angle: Angle) -> Self {
        self.write_by_name(AdirsSimulatorData::PITCH, angle);
        self
    }

    fn altimeter_setting_of(mut self, altimeter: Pressure) -> Self {
        self.write_arinc429_by_name(
            AdirsSimulatorData::BARO_CORRECTION_1_HPA,
            altimeter.get::<hectopascal>(),
            SignStatus::NormalOperation,
        );
        self.write_arinc429_by_name(
            AdirsSimulatorData::BARO_CORRECTION_2_HPA,
            altimeter.get::<hectopascal>(),
            SignStatus::NormalOperation,
        );
        self
    }

    fn align_time_configured_as(mut self, align_time: AlignTime) -> Self {
        WriteByName::<AdirsTestBed, f64>::write_by_name(
            &mut self,
            AirDataInertialReferenceSystem::CONFIGURED_ALIGN_TIME_KEY,
            align_time.into(),
        );
        self
    }

    fn ir_mode_selector_set_to(mut self, number: usize, mode: ModeSelectorPosition) -> Self {
        WriteByName::<AdirsTestBed, f64>::write_by_name(
            &mut self,
            &ModeSelectorPositionSelector::mode_id(number),
            mode.into(),
        );
        self
    }

    fn adr_push_button_off(mut self, number: usize) -> Self {
        self.write_by_name(
            &OnOffFaultPushButton::is_on_id(&format!("ADIRS_ADR_{}", number)),
            false,
        );

        self
    }

    fn ir_push_button_off(mut self, number: usize) -> Self {
        self.write_by_name(
            &OnOffFaultPushButton::is_on_id(&format!("ADIRS_IR_{}", number)),
            false,
        );

        self
    }

    fn boarding_rate_of(mut self, rate: BoardingRate) -> Self {
        self.write_by_name(AdirsSimulatorData::BOARDING_RATE, rate);

        self
    }

    fn boarding_started_of(mut self, started: bool) -> Self {
        self.write_by_name(AdirsSimulatorData::BOARDING_STARTED_BY_USR, started);

        self
    }

    fn ir_fault_light_illuminated(&mut self, number: usize) -> bool {
        self.read_by_name(&OnOffFaultPushButton::has_fault_id(&format!(
            "ADIRS_IR_{}",
            number
        )))
    }

    fn is_aligned(&mut self, adiru_number: usize) -> bool {
        self.align_state(adiru_number) == AlignState::Aligned
    }

    fn is_aligning(&mut self, adiru_number: usize) -> bool {
        self.align_state(adiru_number) == AlignState::Aligning
    }

    fn align_state(&mut self, adiru_number: usize) -> AlignState {
        self.read_by_name(&AirDataInertialReferenceUnit::state_id(adiru_number))
    }

    fn remaining_alignment_time(&mut self) -> Duration {
        self.read_by_name(AirDataInertialReferenceSystem::REMAINING_ALIGNMENT_TIME_KEY)
    }

    fn all_mode_selectors_off(mut self) -> Self {
        self.move_all_mode_selectors_to(ModeSelectorPosition::Off);
        self.run_without_delta();
        self
    }

    fn move_all_mode_selectors_to(&mut self, mode: ModeSelectorPosition) {
        for number in 1..=3 {
            self.write_by_name(&ModeSelectorPositionSelector::mode_id(number), mode);
        }
    }

    fn on_bat_light_illuminated(&mut self) -> bool {
        self.read_by_name(&IndicationLight::is_illuminated_id(
            AirDataInertialReferenceSystemOverheadPanel::ADIRS_ON_BAT_NAME,
        ))
    }

    fn corrected_average_static_pressure(&mut self, adiru_number: usize) -> Arinc429Word<f64> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Adr,
            adiru_number,
            AirDataReferenceRuntime::CORRECTED_AVERAGE_STATIC_PRESSURE,
        ))
    }

    fn baro_correction_1_hpa(&mut self, adiru_number: usize) -> Arinc429Word<f64> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Adr,
            adiru_number,
            AirDataReferenceRuntime::BARO_CORRECTION_1_HPA,
        ))
    }

    fn baro_correction_1_inhg(&mut self, adiru_number: usize) -> Arinc429Word<f64> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Adr,
            adiru_number,
            AirDataReferenceRuntime::BARO_CORRECTION_1_INHG,
        ))
    }

    fn baro_correction_2_hpa(&mut self, adiru_number: usize) -> Arinc429Word<f64> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Adr,
            adiru_number,
            AirDataReferenceRuntime::BARO_CORRECTION_2_HPA,
        ))
    }

    fn baro_correction_2_inhg(&mut self, adiru_number: usize) -> Arinc429Word<f64> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Adr,
            adiru_number,
            AirDataReferenceRuntime::BARO_CORRECTION_2_INHG,
        ))
    }

    /// pressure altitude
    fn altitude(&mut self, adiru_number: usize) -> Arinc429Word<Length> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Adr,
            adiru_number,
            AirDataReferenceRuntime::ALTITUDE,
        ))
    }

    /// baro corrected altitude for captain's side
    fn baro_corrected_altitude_1(&mut self, adiru_number: usize) -> Arinc429Word<Length> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Adr,
            adiru_number,
            AirDataReferenceRuntime::BARO_CORRECTED_ALTITUDE_1,
        ))
    }

    /// baro corrected altitude for fo's side
    fn baro_corrected_altitude_2(&mut self, adiru_number: usize) -> Arinc429Word<Length> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Adr,
            adiru_number,
            AirDataReferenceRuntime::BARO_CORRECTED_ALTITUDE_2,
        ))
    }

    fn computed_airspeed(&mut self, adiru_number: usize) -> Arinc429Word<Velocity> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Adr,
            adiru_number,
            AirDataReferenceRuntime::COMPUTED_AIRSPEED,
        ))
    }

    fn max_airspeed(&mut self, adiru_number: usize) -> Arinc429Word<Velocity> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Adr,
            adiru_number,
            AirDataReferenceRuntime::MAX_AIRSPEED,
        ))
    }

    fn mach(&mut self, adiru_number: usize) -> Arinc429Word<MachNumber> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Adr,
            adiru_number,
            AirDataReferenceRuntime::MACH,
        ))
    }

    fn barometric_vertical_speed(&mut self, adiru_number: usize) -> Arinc429Word<Velocity> {
        let vertical_speed: Arinc429Word<f64> = self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Adr,
            adiru_number,
            AirDataReferenceRuntime::BAROMETRIC_VERTICAL_SPEED,
        ));
        Arinc429Word::new(
            Velocity::new::<foot_per_minute>(vertical_speed.value()),
            vertical_speed.ssm(),
        )
    }

    fn true_airspeed(&mut self, adiru_number: usize) -> Arinc429Word<Velocity> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Adr,
            adiru_number,
            AirDataReferenceRuntime::TRUE_AIRSPEED,
        ))
    }

    fn static_air_temperature(
        &mut self,
        adiru_number: usize,
    ) -> Arinc429Word<ThermodynamicTemperature> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Adr,
            adiru_number,
            AirDataReferenceRuntime::STATIC_AIR_TEMPERATURE,
        ))
    }

    fn total_air_temperature(
        &mut self,
        adiru_number: usize,
    ) -> Arinc429Word<ThermodynamicTemperature> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Adr,
            adiru_number,
            AirDataReferenceRuntime::TOTAL_AIR_TEMPERATURE,
        ))
    }

    fn angle_of_attack(&mut self, adiru_number: usize) -> Arinc429Word<Angle> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Adr,
            adiru_number,
            AirDataReferenceRuntime::ANGLE_OF_ATTACK,
        ))
    }

    fn adr_discrete_word_1(&mut self, adiru_number: usize) -> Arinc429Word<u32> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Adr,
            adiru_number,
            AirDataReferenceRuntime::DISCRETE_WORD_1,
        ))
    }

    fn pitch(&mut self, adiru_number: usize) -> Arinc429Word<Angle> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Ir,
            adiru_number,
            InertialReferenceRuntime::PITCH,
        ))
    }

    fn roll(&mut self, adiru_number: usize) -> Arinc429Word<Angle> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Ir,
            adiru_number,
            InertialReferenceRuntime::ROLL,
        ))
    }

    fn heading(&mut self, adiru_number: usize) -> Arinc429Word<Angle> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Ir,
            adiru_number,
            InertialReferenceRuntime::HEADING,
        ))
    }

    fn true_heading(&mut self, adiru_number: usize) -> Arinc429Word<Angle> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Ir,
            adiru_number,
            InertialReferenceRuntime::TRUE_HEADING,
        ))
    }

    fn track(&mut self, adiru_number: usize) -> Arinc429Word<Angle> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Ir,
            adiru_number,
            InertialReferenceRuntime::TRACK,
        ))
    }

    fn true_track(&mut self, adiru_number: usize) -> Arinc429Word<Angle> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Ir,
            adiru_number,
            InertialReferenceRuntime::TRUE_TRACK,
        ))
    }

    fn drift_angle(&mut self, adiru_number: usize) -> Arinc429Word<Angle> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Ir,
            adiru_number,
            InertialReferenceRuntime::DRIFT_ANGLE,
        ))
    }

    fn flight_path_angle(&mut self, adiru_number: usize) -> Arinc429Word<Angle> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Ir,
            adiru_number,
            InertialReferenceRuntime::FLIGHT_PATH_ANGLE,
        ))
    }

    fn body_pitch_rate(&mut self, adiru_number: usize) -> Arinc429Word<AngularVelocity> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Ir,
            adiru_number,
            InertialReferenceRuntime::BODY_PITCH_RATE,
        ))
    }

    fn body_roll_rate(&mut self, adiru_number: usize) -> Arinc429Word<AngularVelocity> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Ir,
            adiru_number,
            InertialReferenceRuntime::BODY_ROLL_RATE,
        ))
    }

    fn body_yaw_rate(&mut self, adiru_number: usize) -> Arinc429Word<AngularVelocity> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Ir,
            adiru_number,
            InertialReferenceRuntime::BODY_YAW_RATE,
        ))
    }

    fn body_long_acc(&mut self, adiru_number: usize) -> Arinc429Word<Ratio> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Ir,
            adiru_number,
            InertialReferenceRuntime::BODY_LONGITUDINAL_ACC,
        ))
    }

    fn body_lat_acc(&mut self, adiru_number: usize) -> Arinc429Word<Ratio> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Ir,
            adiru_number,
            InertialReferenceRuntime::BODY_LATERAL_ACC,
        ))
    }

    fn body_normal_acc(&mut self, adiru_number: usize) -> Arinc429Word<Ratio> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Ir,
            adiru_number,
            InertialReferenceRuntime::BODY_NORMAL_ACC,
        ))
    }

    fn pitch_att_rate(&mut self, adiru_number: usize) -> Arinc429Word<Angle> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Ir,
            adiru_number,
            InertialReferenceRuntime::PITCH_ATT_RATE,
        ))
    }

    fn roll_att_rate(&mut self, adiru_number: usize) -> Arinc429Word<Angle> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Ir,
            adiru_number,
            InertialReferenceRuntime::ROLL_ATT_RATE,
        ))
    }

    fn heading_rate(&mut self, adiru_number: usize) -> Arinc429Word<Angle> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Ir,
            adiru_number,
            InertialReferenceRuntime::HEADING_RATE,
        ))
    }

    fn ground_speed(&mut self, adiru_number: usize) -> Arinc429Word<Velocity> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Ir,
            adiru_number,
            InertialReferenceRuntime::GROUND_SPEED,
        ))
    }

    fn wind_direction(&mut self, adiru_number: usize) -> Arinc429Word<Angle> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Ir,
            adiru_number,
            InertialReferenceRuntime::WIND_DIRECTION,
        ))
    }

    fn wind_direction_bnr(&mut self, adiru_number: usize) -> Arinc429Word<Angle> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Ir,
            adiru_number,
            InertialReferenceRuntime::WIND_DIRECTION_BNR,
        ))
    }

    fn wind_speed(&mut self, adiru_number: usize) -> Arinc429Word<Velocity> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Ir,
            adiru_number,
            InertialReferenceRuntime::WIND_SPEED,
        ))
    }

    fn wind_speed_bnr(&mut self, adiru_number: usize) -> Arinc429Word<Velocity> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Ir,
            adiru_number,
            InertialReferenceRuntime::WIND_SPEED_BNR,
        ))
    }

    fn inertial_vertical_speed(&mut self, adiru_number: usize) -> Arinc429Word<Velocity> {
        let vertical_speed: Arinc429Word<f64> = self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Ir,
            adiru_number,
            InertialReferenceRuntime::VERTICAL_SPEED,
        ));
        Arinc429Word::new(
            Velocity::new::<foot_per_minute>(vertical_speed.value()),
            vertical_speed.ssm(),
        )
    }

    fn longitude(&mut self, adiru_number: usize) -> Arinc429Word<Angle> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Ir,
            adiru_number,
            InertialReferenceRuntime::LONGITUDE,
        ))
    }

    fn latitude(&mut self, adiru_number: usize) -> Arinc429Word<Angle> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Ir,
            adiru_number,
            InertialReferenceRuntime::LATITUDE,
        ))
    }

    fn maint_word(&mut self, adiru_number: usize) -> Arinc429Word<u32> {
        self.read_arinc429_by_name(&output_data_id(
            OutputDataType::Ir,
            adiru_number,
            InertialReferenceRuntime::MAINT_WORD,
        ))
    }

    fn assert_adr_data_valid(&mut self, valid: bool, adiru_number: usize) {
        assert_eq!(
            !self
                .corrected_average_static_pressure(adiru_number)
                .is_failure_warning(),
            valid
        );
        assert_eq!(!self.altitude(adiru_number).is_failure_warning(), valid);
        assert_eq!(
            !self
                .baro_corrected_altitude_1(adiru_number)
                .is_failure_warning(),
            valid
        );
        assert_eq!(
            !self
                .baro_corrected_altitude_2(adiru_number)
                .is_failure_warning(),
            valid
        );
        assert_eq!(
            !self.computed_airspeed(adiru_number).is_failure_warning(),
            valid
        );
        assert_eq!(!self.max_airspeed(adiru_number).is_failure_warning(), valid);
        assert_eq!(!self.mach(adiru_number).is_failure_warning(), valid);
        assert_eq!(
            !self
                .barometric_vertical_speed(adiru_number)
                .is_failure_warning(),
            valid
        );
        assert_eq!(
            !self.true_airspeed(adiru_number).is_failure_warning(),
            valid
        );
        assert_eq!(
            !self
                .static_air_temperature(adiru_number)
                .is_failure_warning(),
            valid
        );
        assert_eq!(
            !self
                .total_air_temperature(adiru_number)
                .is_failure_warning(),
            valid
        );
        assert_eq!(
            !self.angle_of_attack(adiru_number).is_failure_warning(),
            valid
        );

        let discrete_word_flags =
            AdrDiscrete1Flags::from_bits(self.adr_discrete_word_1(adiru_number).value());
        assert_eq!(
            !(discrete_word_flags
                .unwrap()
                .contains(AdrDiscrete1Flags::ADR_STATUS_FAIL)
                || self.adr_discrete_word_1(adiru_number).is_failure_warning()),
            valid
        );
    }

    fn assert_ir_heading_data_available(&mut self, available: bool, adiru_number: usize) {
        assert_eq!(self.heading(adiru_number).is_normal_operation(), available);
    }

    fn assert_ir_non_attitude_data_available(&mut self, available: bool, adiru_number: usize) {
        assert_eq!(self.track(adiru_number).is_normal_operation(), available);
        assert_eq!(
            self.drift_angle(adiru_number).is_normal_operation(),
            available
        );
        assert_eq!(
            self.flight_path_angle(adiru_number).is_normal_operation(),
            available
        );
        assert_eq!(
            self.inertial_vertical_speed(adiru_number)
                .is_normal_operation(),
            available
        );
        assert_eq!(
            self.ground_speed(adiru_number).is_normal_operation(),
            available
        );
        assert_eq!(
            self.wind_direction(adiru_number).is_normal_operation(),
            available
        );
        assert_eq!(
            self.wind_direction_bnr(adiru_number).is_normal_operation(),
            available
        );
        assert_eq!(
            self.wind_speed(adiru_number).is_normal_operation(),
            available
        );
        assert_eq!(
            self.wind_speed_bnr(adiru_number).is_normal_operation(),
            available
        );
        assert_eq!(self.latitude(adiru_number).is_normal_operation(), available);
        assert_eq!(
            self.longitude(adiru_number).is_normal_operation(),
            available
        );
    }

    fn assert_ir_attitude_data_available(&mut self, available: bool, adiru_number: usize) {
        assert_eq!(self.pitch(adiru_number).is_normal_operation(), available);
        assert_eq!(self.roll(adiru_number).is_normal_operation(), available);
        assert_eq!(
            self.body_pitch_rate(adiru_number).is_normal_operation(),
            available
        );
        assert_eq!(
            self.body_roll_rate(adiru_number).is_normal_operation(),
            available
        );
        assert_eq!(
            self.body_yaw_rate(adiru_number).is_normal_operation(),
            available
        );
        assert_eq!(
            self.body_long_acc(adiru_number).is_normal_operation(),
            available
        );
        assert_eq!(
            self.body_lat_acc(adiru_number).is_normal_operation(),
            available
        );
        assert_eq!(
            self.body_normal_acc(adiru_number).is_normal_operation(),
            available
        );
        assert_eq!(
            self.pitch_att_rate(adiru_number).is_normal_operation(),
            available
        );
        assert_eq!(
            self.roll_att_rate(adiru_number).is_normal_operation(),
            available
        );
        assert_eq!(
            self.heading_rate(adiru_number).is_normal_operation(),
            available
        );
    }

    fn assert_all_ir_data_available(&mut self, available: bool, adiru_number: usize) {
        self.assert_ir_attitude_data_available(available, adiru_number);
        self.assert_ir_heading_data_available(available, adiru_number);
        self.assert_ir_non_attitude_data_available(available, adiru_number);
        assert_eq!(
            self.maint_word(adiru_number).is_normal_operation(),
            available
        );
    }

    fn assert_wind_direction_and_velocity_zero(&mut self, adiru_number: usize) {
        assert_about_eq!(
            self.wind_direction(adiru_number).value().get::<degree>(),
            0.
        );
        assert_about_eq!(
            self.wind_direction_bnr(adiru_number)
                .value()
                .get::<degree>(),
            0.
        );
        assert_about_eq!(self.wind_speed(adiru_number).value().get::<knot>(), 0.);
        assert_about_eq!(self.wind_speed_bnr(adiru_number).value().get::<knot>(), 0.);
    }

    fn realistic_navigation_align_until(mut self, adiru_number: usize, duration: Duration) -> Self {
        self = self
            .align_time_configured_as(AlignTime::Realistic)
            .and()
            .ir_mode_selector_set_to(adiru_number, ModeSelectorPosition::Navigation);

        // Run once to let the simulation write the remaining alignment time.
        self.run_with_delta(Duration::from_secs(0));

        let remaining_alignment_time = self.remaining_alignment_time();
        self.run_with_delta(remaining_alignment_time - duration);

        println!("{:?}", self.remaining_alignment_time());
        self
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

fn test_bed_with() -> AdirsTestBed {
    test_bed()
}

fn test_bed() -> AdirsTestBed {
    // Nearly all tests require mode selectors to be off, therefore it is the default.
    all_adirus_aligned_test_bed().all_mode_selectors_off()
}

fn all_adirus_aligned_test_bed_with() -> AdirsTestBed {
    all_adirus_aligned_test_bed()
}

fn all_adirus_unaligned_test_bed_with() -> AdirsTestBed {
    let mut bed = all_adirus_aligned_test_bed().all_mode_selectors_off();
    // run long enough to bypass quick align
    bed.run_with_delta(Duration::from_secs(10));
    bed
}

fn all_adirus_aligned_test_bed() -> AdirsTestBed {
    AdirsTestBed::new()
}

#[rstest]
#[case(1)]
#[case(2)]
#[case(3)]
fn starts_aligned(#[case] adiru_number: usize) {
    // The structs start in an aligned state to support starting a flight
    // on the runway or in the air with the mode selectors in the NAV position.
    let mut test_bed = all_adirus_aligned_test_bed();
    test_bed.run();

    assert!(test_bed.is_aligned(adiru_number));
    let maint_word_flags = IrMaintFlags::from_bits(test_bed.maint_word(adiru_number).value());
    assert_eq!(
        maint_word_flags.unwrap() & IrMaintFlags::NAV_MODE,
        IrMaintFlags::NAV_MODE
    );
}

#[rstest]
#[case(1)]
#[case(2)]
#[case(3)]
fn adiru_is_not_aligning_nor_aligned_when_ir_mode_selector_off(#[case] adiru_number: usize) {
    let mut test_bed =
        test_bed_with().ir_mode_selector_set_to(adiru_number, ModeSelectorPosition::Off);

    test_bed.run_with_delta(Duration::from_secs(0));

    assert!(!test_bed.is_aligned(adiru_number));
    assert!(!test_bed.is_aligning(adiru_number));
    let maint_word_flags = IrMaintFlags::from_bits(test_bed.maint_word(adiru_number).value());
    assert_eq!(
        maint_word_flags.unwrap() & (IrMaintFlags::ALIGNMENT_NOT_READY | IrMaintFlags::NAV_MODE),
        IrMaintFlags::empty()
    );
}

#[rstest]
#[case(1)]
#[case(2)]
#[case(3)]
fn adiru_instantly_aligns_when_configured_align_time_is_instant(#[case] adiru_number: usize) {
    // TODO: Once the ADIRUs are split, this unit test needs to be modified to test all
    // ADIRUs individually.
    let mut test_bed = test_bed_with()
        .align_time_configured_as(AlignTime::Instant)
        .and()
        .ir_mode_selector_set_to(adiru_number, ModeSelectorPosition::Navigation);

    test_bed.run_with_delta(Duration::from_secs(0));

    assert!(test_bed.is_aligned(adiru_number));
    let maint_word_flags = IrMaintFlags::from_bits(test_bed.maint_word(adiru_number).value());
    assert_eq!(
        maint_word_flags.unwrap() & IrMaintFlags::NAV_MODE,
        IrMaintFlags::NAV_MODE
    );
}

#[rstest]
#[case(1)]
#[case(2)]
#[case(3)]
fn adirs_aligns_in_90_seconds_when_configured_align_time_is_fast(#[case] adiru_number: usize) {
    // TODO: Once the ADIRUs are split, this unit test needs to be modified to test all
    // ADIRUs individually.
    let mut test_bed = test_bed_with()
        .align_time_configured_as(AlignTime::Fast)
        .and()
        .ir_mode_selector_set_to(adiru_number, ModeSelectorPosition::Navigation);

    // Set the state without any time passing to be able to measure exact time afterward.
    test_bed.run_with_delta(Duration::from_secs(0));

    test_bed.run_with_delta(Duration::from_secs_f64(
        InertialReferenceRuntime::FAST_ALIGNMENT_TIME_IN_SECS - 1.,
    ));
    assert!(test_bed.is_aligning(adiru_number));
    let maint_word_flags = IrMaintFlags::from_bits(test_bed.maint_word(adiru_number).value());
    assert_eq!(
        maint_word_flags.unwrap() & IrMaintFlags::ALIGNMENT_NOT_READY,
        IrMaintFlags::ALIGNMENT_NOT_READY
    );

    test_bed.run_with_delta(Duration::from_secs(1));
    assert!(test_bed.is_aligned(adiru_number));
    let maint_word_flags = IrMaintFlags::from_bits(test_bed.maint_word(adiru_number).value());
    assert_eq!(
        maint_word_flags.unwrap() & IrMaintFlags::NAV_MODE,
        IrMaintFlags::NAV_MODE
    );
}

#[rstest]
#[case(Angle::new::<degree>(85.))]
#[case(Angle::new::<degree>(-85.))]
fn adirs_does_not_align_near_the_poles(#[case] polar_latitude: Angle) {
    let mut test_bed = start_align_at_latitude(polar_latitude);
    test_bed.run();
    test_bed.run_with_delta(Duration::from_secs(20 * 60)); // run for 20 minutes, enough for any alignment

    assert!(!test_bed.is_aligned(1));
}

#[rstest]
#[case(Angle::new::<degree>(85.))]
#[case(Angle::new::<degree>(-85.))]
fn adirs_stays_aligned_near_the_poles(#[case] polar_latitude: Angle) {
    let mut test_bed = all_adirus_aligned_test_bed_with()
        .ir_mode_selector_set_to(1, ModeSelectorPosition::Navigation)
        .and()
        .latitude_of(polar_latitude);
    test_bed.run();

    assert!(test_bed.is_aligned(1));
}

#[rstest]
fn adirs_detects_excess_motion_during_alignment() {
    let mut test_bed = all_adirus_unaligned_test_bed_with()
        .body_lateral_velocity_of(Velocity::new::<foot_per_second>(0.1))
        .ir_mode_selector_set_to(1, ModeSelectorPosition::Navigation);
    test_bed.run();
    test_bed.run();

    let maint_word_flags = IrMaintFlags::from_bits(test_bed.maint_word(1).value());
    assert_eq!(
        maint_word_flags.unwrap() & IrMaintFlags::EXCESS_MOTION_ERROR,
        IrMaintFlags::EXCESS_MOTION_ERROR
    );
}

#[rstest]
fn adirs_detects_excess_motion_during_alignment_with_instant_boarding_selected() {
    let mut test_bed = all_adirus_unaligned_test_bed_with()
        .boarding_rate_of(BoardingRate::Instant)
        .body_lateral_velocity_of(Velocity::new::<foot_per_second>(0.1))
        .ir_mode_selector_set_to(1, ModeSelectorPosition::Navigation);
    test_bed.run();
    test_bed.run();

    let maint_word_flags = IrMaintFlags::from_bits(test_bed.maint_word(1).value());
    assert_eq!(
        maint_word_flags.unwrap() & IrMaintFlags::EXCESS_MOTION_ERROR,
        IrMaintFlags::EXCESS_MOTION_ERROR
    );
}

#[rstest]
fn adirs_detects_excess_motion_during_alignment_with_fast_boarding_selected() {
    let mut test_bed = all_adirus_unaligned_test_bed_with()
        .boarding_rate_of(BoardingRate::Fast)
        .body_lateral_velocity_of(Velocity::new::<foot_per_second>(0.1))
        .ir_mode_selector_set_to(1, ModeSelectorPosition::Navigation);
    test_bed.run();
    test_bed.run();

    let maint_word_flags = IrMaintFlags::from_bits(test_bed.maint_word(1).value());
    assert_eq!(
        maint_word_flags.unwrap() & IrMaintFlags::EXCESS_MOTION_ERROR,
        IrMaintFlags::EXCESS_MOTION_ERROR
    );
}

#[rstest]
fn adirs_does_not_detect_excess_motion_during_instant_boarding() {
    let mut test_bed = all_adirus_unaligned_test_bed_with()
        .boarding_rate_of(BoardingRate::Instant)
        .boarding_started_of(true)
        .body_lateral_velocity_of(Velocity::new::<foot_per_second>(0.1))
        .ir_mode_selector_set_to(1, ModeSelectorPosition::Navigation);
    test_bed.run();
    test_bed.run();

    let maint_word_flags = IrMaintFlags::from_bits(test_bed.maint_word(1).value());
    assert_eq!(
        maint_word_flags.unwrap() & IrMaintFlags::EXCESS_MOTION_ERROR,
        IrMaintFlags::empty()
    );
}

#[rstest]
fn adirs_does_not_detect_excess_motion_during_fast_boarding() {
    let mut test_bed = all_adirus_unaligned_test_bed_with()
        .boarding_rate_of(BoardingRate::Fast)
        .boarding_started_of(true)
        .body_lateral_velocity_of(Velocity::new::<foot_per_second>(0.1))
        .ir_mode_selector_set_to(1, ModeSelectorPosition::Navigation);
    test_bed.run();
    test_bed.run();

    let maint_word_flags = IrMaintFlags::from_bits(test_bed.maint_word(1).value());
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
    let mut test_bed = start_align_at_latitude(Angle::new::<degree>(0.));
    let equator_alignment_time = test_bed.remaining_alignment_time();

    let mut test_bed = start_align_at_latitude(polar_latitude);
    let south_pole_alignment_time = test_bed.remaining_alignment_time();

    assert!(equator_alignment_time < south_pole_alignment_time);
}

fn start_align_at_latitude(latitude: Angle) -> AdirsTestBed {
    let mut test_bed = all_adirus_unaligned_test_bed_with()
        .align_time_configured_as(AlignTime::Realistic)
        .latitude_of(latitude)
        .and()
        .ir_mode_selector_set_to(1, ModeSelectorPosition::Navigation);

    test_bed.run();
    test_bed
}

#[rstest]
#[case(Angle::new::<degree>(0.))]
#[case(Angle::new::<degree>(63.))]
#[case(Angle::new::<degree>(-63.))]
fn adirs_aligns_quick_when_mode_selector_off_for_3_secs(#[case] latitude: Angle) {
    // Create the conditions for a quick align (aligned, then less than 5 secs off)
    let mut test_bed = all_adirus_aligned_test_bed_with()
        .align_time_configured_as(AlignTime::Realistic)
        .latitude_of(latitude)
        .and()
        .ir_mode_selector_set_to(1, ModeSelectorPosition::Off);
    test_bed.run_with_delta(Duration::from_secs(2));

    // Perform the quick align
    test_bed = test_bed
        .then_continue_with()
        .ir_mode_selector_set_to(1, ModeSelectorPosition::Navigation);
    test_bed.run();

    let alignment_time = test_bed.remaining_alignment_time();

    assert!(alignment_time <= Duration::from_secs(180));
}

#[rstest]
#[case(ModeSelectorPosition::Navigation)]
#[case(ModeSelectorPosition::Attitude)]
fn ir_fault_light_briefly_flashes_when_moving_mode_selector_from_off_to(
    #[case] mode: ModeSelectorPosition,
) {
    let mut test_bed = test_bed_with().ir_mode_selector_set_to(1, mode);

    test_bed.run_without_delta();
    assert!(test_bed.ir_fault_light_illuminated(1));

    test_bed.run_with_delta(
        InertialReferenceRuntime::IR_FAULT_FLASH_DURATION - Duration::from_millis(1),
    );
    assert!(test_bed.ir_fault_light_illuminated(1));

    test_bed.run_with_delta(Duration::from_millis(1));
    assert!(!test_bed.ir_fault_light_illuminated(1));
}

#[test]
fn ir_fault_light_doesnt_briefly_flash_when_moving_mode_selector_between_nav_and_att() {
    let mut test_bed = test_bed_with().ir_mode_selector_set_to(1, ModeSelectorPosition::Navigation);
    test_bed.run_without_delta();
    test_bed.run();

    test_bed = test_bed
        .then_continue_with()
        .ir_mode_selector_set_to(1, ModeSelectorPosition::Attitude);
    test_bed.run_with_delta(Duration::from_millis(1));

    assert!(!test_bed.ir_fault_light_illuminated(1));
}

#[rstest]
#[case(ModeSelectorPosition::Navigation)]
#[case(ModeSelectorPosition::Attitude)]
fn ten_and_a_half_seconds_after_moving_the_mode_selector_the_on_bat_light_illuminates_for_5_and_a_half_seconds(
    #[case] mode: ModeSelectorPosition,
) {
    let mut test_bed = test_bed_with().ir_mode_selector_set_to(1, mode);
    test_bed.run_without_delta();

    test_bed.run_with_delta(
        AirDataInertialReferenceSystemOverheadPanel::DURATION_AFTER_WHICH_ON_BAT_ILLUMINATES
            - Duration::from_millis(1),
    );
    assert!(!test_bed.on_bat_light_illuminated());

    test_bed.run_with_delta(Duration::from_millis(1));
    assert!(test_bed.on_bat_light_illuminated());

    test_bed.run_with_delta(
        AirDataInertialReferenceSystemOverheadPanel::ON_BAT_ILLUMINATION_DURATION
            - Duration::from_millis(1),
    );
    assert!(test_bed.on_bat_light_illuminated());

    test_bed.run_with_delta(Duration::from_millis(1));
    assert!(!test_bed.on_bat_light_illuminated());
}

#[test]
fn on_bat_illuminates_for_longer_than_5_and_a_half_seconds_when_selectors_move_to_nav_at_different_times(
) {
    // The duration after which we turn the second selector to NAV, and therefore
    // the additional duration we would expect the ON BAT light to be illuminated.
    let additional_duration = Duration::from_secs(1);

    let mut test_bed = test_bed_with().ir_mode_selector_set_to(1, ModeSelectorPosition::Navigation);
    test_bed.run_without_delta();
    test_bed.run_with_delta(additional_duration);

    test_bed = test_bed
        .then_continue_with()
        .ir_mode_selector_set_to(2, ModeSelectorPosition::Navigation);
    test_bed.run_without_delta();
    test_bed.run_with_delta(
        AirDataInertialReferenceSystemOverheadPanel::DURATION_AFTER_WHICH_ON_BAT_ILLUMINATES
            - additional_duration
            - Duration::from_millis(1),
    );
    assert!(!test_bed.on_bat_light_illuminated());

    test_bed.run_with_delta(Duration::from_millis(1));
    assert!(test_bed.on_bat_light_illuminated());

    test_bed.run_with_delta(
        AirDataInertialReferenceSystemOverheadPanel::ON_BAT_ILLUMINATION_DURATION
            + additional_duration
            - Duration::from_millis(1),
    );
    assert!(test_bed.on_bat_light_illuminated());

    test_bed.run_with_delta(Duration::from_millis(1));
    assert!(!test_bed.on_bat_light_illuminated());
}

#[test]
fn switching_between_nav_and_att_doesnt_affect_the_on_bat_light_illumination() {
    let mut test_bed = test_bed_with().ir_mode_selector_set_to(1, ModeSelectorPosition::Navigation);
    test_bed.run_without_delta();
    test_bed.run_with_delta(
        AirDataInertialReferenceSystemOverheadPanel::DURATION_AFTER_WHICH_ON_BAT_ILLUMINATES,
    );

    assert!(test_bed.on_bat_light_illuminated());

    test_bed = test_bed
        .then_continue_with()
        .ir_mode_selector_set_to(1, ModeSelectorPosition::Attitude);
    test_bed.run();

    assert!(test_bed.on_bat_light_illuminated());
}

#[test]
#[timeout(500)]
fn remaining_alignment_time_counts_down_to_0_seconds() {
    let mut test_bed = test_bed_with().ir_mode_selector_set_to(1, ModeSelectorPosition::Navigation);
    test_bed.run_without_delta();

    assert!(
        test_bed.remaining_alignment_time() > Duration::from_secs(0),
        "Test precondition: alignment time should be greater than 0 seconds."
    );

    while test_bed.remaining_alignment_time() > Duration::from_secs(0) {
        test_bed.run();
    }
}

#[test]
fn remaining_alignment_time_is_0_seconds_when_nothing_is_aligning() {
    let mut test_bed = test_bed_with().all_mode_selectors_off();
    test_bed.run();

    assert_eq!(test_bed.remaining_alignment_time(), Duration::from_secs(0));
}

#[test]
fn remaining_alignment_time_is_the_longest_out_of_all_aligning_adirus() {
    let mut test_bed = test_bed_with().ir_mode_selector_set_to(1, ModeSelectorPosition::Navigation);
    test_bed.run_without_delta();
    test_bed.run_with_delta(Duration::from_secs(60));
    let single_adiru_remaining_alignment_time = test_bed.remaining_alignment_time();

    test_bed = test_bed
        .then_continue_with()
        .ir_mode_selector_set_to(2, ModeSelectorPosition::Navigation);
    test_bed.run();

    assert!(test_bed.remaining_alignment_time() > single_adiru_remaining_alignment_time);
}

#[test]
fn remaining_alignment_time_is_greater_than_zero_when_a_single_adiru_is_aligned_but_another_is_still_aligning(
) {
    let mut test_bed = test_bed_with().ir_mode_selector_set_to(1, ModeSelectorPosition::Navigation);
    test_bed.run_without_delta();

    while test_bed.remaining_alignment_time() > Duration::from_secs(0) {
        test_bed.run();
    }

    test_bed = test_bed
        .then_continue_with()
        .ir_mode_selector_set_to(2, ModeSelectorPosition::Navigation);
    test_bed.run();

    assert!(test_bed.remaining_alignment_time() > Duration::from_secs(0));
}

mod adr {
    use ntest::{assert_false, assert_true};
    use uom::si::{angle::second, pressure::inch_of_mercury};

    use crate::{
        navigation::hw_block3_adiru::adr_runtime::AirDataReferenceRuntime,
        shared::InternationalStandardAtmosphere,
    };

    use super::*;

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn data_is_valid_18_seconds_after_alignment_began(#[case] adiru_number: usize) {
        let mut test_bed =
            test_bed_with().ir_mode_selector_set_to(adiru_number, ModeSelectorPosition::Navigation);
        test_bed.run_without_delta();

        test_bed.run_with_delta(
            AirDataReferenceRuntime::INITIALISATION_DURATION - Duration::from_millis(1),
        );
        test_bed.assert_adr_data_valid(false, adiru_number);

        test_bed.run_with_delta(Duration::from_millis(1));
        test_bed.assert_adr_data_valid(true, adiru_number);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn data_is_no_longer_valid_when_adiru_mode_selector_off(#[case] adiru_number: usize) {
        let mut test_bed = all_adirus_aligned_test_bed();
        test_bed.run();
        test_bed.assert_adr_data_valid(true, adiru_number);

        test_bed = test_bed
            .then_continue_with()
            .ir_mode_selector_set_to(adiru_number, ModeSelectorPosition::Off);
        test_bed.run();
        test_bed.assert_adr_data_valid(false, adiru_number);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn when_adr_push_button_off_data_is_not_valid(#[case] adiru_number: usize) {
        let mut test_bed = all_adirus_aligned_test_bed_with().adr_push_button_off(adiru_number);
        test_bed.run();

        test_bed.assert_adr_data_valid(false, adiru_number);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn corrected_average_static_pressure_is_supplied_by_adr(#[case] adiru_number: usize) {
        let mut test_bed = all_adirus_aligned_test_bed();
        test_bed.set_ambient_pressure(Pressure::new::<hectopascal>(1013.));

        // let the filter run a bit
        test_bed.run_iterations_with_delta(5, Duration::from_millis(250));

        assert_about_eq!(
            test_bed
                .corrected_average_static_pressure(adiru_number)
                .normal_value()
                .unwrap(),
            1013.
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn baro_correction_is_supplied_by_adr(#[case] adiru_number: usize) {
        let mut test_bed =
            all_adirus_aligned_test_bed().altimeter_setting_of(Pressure::new::<hectopascal>(1020.));

        test_bed.run();

        assert_about_eq!(
            test_bed
                .baro_correction_1_hpa(adiru_number)
                .normal_value()
                .unwrap(),
            1020.
        );
        assert_about_eq!(
            test_bed
                .baro_correction_2_hpa(adiru_number)
                .normal_value()
                .unwrap(),
            1020.
        );

        test_bed = test_bed.altimeter_setting_of(Pressure::new::<inch_of_mercury>(29.80));

        test_bed.run();

        assert_about_eq!(
            test_bed
                .baro_correction_1_inhg(adiru_number)
                .normal_value()
                .unwrap(),
            29.80
        );
        assert_about_eq!(
            test_bed
                .baro_correction_2_inhg(adiru_number)
                .normal_value()
                .unwrap(),
            29.80
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn altitude_is_supplied_by_adr(#[case] adiru_number: usize) {
        use uom::si::pressure::pascal;

        let mut test_bed = all_adirus_aligned_test_bed();
        // set_pressure_altitude is only valid in the troposhere (due to InternationalStandardAtmosphere::pressure_at_altitude)
        // test_bed.set_pressure_altitude(Length::new::<foot>(41000.));
        test_bed.set_ambient_pressure(Pressure::new::<pascal>(17874.)); // 41000 feet

        test_bed.run_iterations_with_delta(10, Duration::from_millis(250));

        assert_about_eq!(
            test_bed
                .altitude(adiru_number)
                .normal_value()
                .unwrap()
                .get::<foot>(),
            41000.,
            2.,
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn baro_corrected_altitude_1_is_supplied_by_adr(#[case] adiru_number: usize) {
        let mut test_bed = all_adirus_aligned_test_bed();
        test_bed.set_pressure_altitude(Length::new::<foot>(10000.));

        test_bed.run_iterations_with_delta(10, Duration::from_millis(250));

        assert_about_eq!(
            test_bed
                .baro_corrected_altitude_1(adiru_number)
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
        let mut test_bed = all_adirus_aligned_test_bed();
        test_bed.set_pressure_altitude(Length::new::<foot>(10000.));

        test_bed.run_iterations_with_delta(10, Duration::from_millis(250));

        assert_about_eq!(
            test_bed
                .baro_corrected_altitude_2(adiru_number)
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
        let mut test_bed = all_adirus_aligned_test_bed();
        test_bed.set_indicated_airspeed(velocity);
        test_bed.run();

        assert_eq!(
            test_bed
                .computed_airspeed(adiru_number)
                .normal_value()
                .unwrap(),
            velocity
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn computed_airspeed_is_ncd_and_zero_when_less_than_30_knots(#[case] adiru_number: usize) {
        let velocity = Velocity::new::<knot>(AirDataReferenceRuntime::MINIMUM_CAS - 0.01);
        let mut test_bed = all_adirus_aligned_test_bed();
        test_bed.set_indicated_airspeed(velocity);
        test_bed.run();

        assert_about_eq!(
            test_bed
                .computed_airspeed(adiru_number)
                .value()
                .get::<knot>(),
            0.
        );
        assert_eq!(
            test_bed.computed_airspeed(adiru_number).ssm(),
            SignStatus::NoComputedData
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn max_airspeed_is_provided_at_sea_level(#[case] adiru_number: usize) {
        let mut test_bed = all_adirus_aligned_test_bed();
        test_bed.set_ambient_pressure(InternationalStandardAtmosphere::ground_pressure());
        test_bed.run();

        assert_true!(test_bed.max_airspeed(adiru_number).value().get::<knot>() > 330.);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn max_airspeed_is_limited_by_mmo(#[case] adiru_number: usize) {
        use ntest::assert_true;

        let mut test_bed = all_adirus_aligned_test_bed();
        test_bed.set_ambient_pressure(InternationalStandardAtmosphere::pressure_at_altitude(
            Length::new::<foot>(39_000.),
        ));
        test_bed.run();

        assert_true!(test_bed.max_airspeed(adiru_number).value().get::<knot>() < 300.);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn overspeed_warning_is_inactive_at_normal_speed_at_sea_level(#[case] adiru_number: usize) {
        // check a value that's below VMO, but above MMO at higher altitudes
        let velocity = Velocity::new::<knot>(330.);
        let mut test_bed = all_adirus_aligned_test_bed();
        test_bed.set_indicated_airspeed(velocity);
        test_bed.set_ambient_pressure(InternationalStandardAtmosphere::ground_pressure());
        test_bed.run();

        let discrete_word_flags =
            AdrDiscrete1Flags::from_bits(test_bed.adr_discrete_word_1(adiru_number).value());
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
        let mut test_bed = all_adirus_aligned_test_bed();
        test_bed.set_indicated_airspeed(velocity);
        test_bed.set_ambient_pressure(fl390_pressure);
        test_bed.run();

        let discrete_word_flags =
            AdrDiscrete1Flags::from_bits(test_bed.adr_discrete_word_1(adiru_number).value());
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
        let mut test_bed = all_adirus_aligned_test_bed();
        test_bed.set_indicated_airspeed(velocity);
        test_bed.set_ambient_pressure(InternationalStandardAtmosphere::ground_pressure());
        test_bed.run();

        let discrete_word_flags =
            AdrDiscrete1Flags::from_bits(test_bed.adr_discrete_word_1(adiru_number).value());
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
        let mut test_bed = all_adirus_aligned_test_bed();
        test_bed.set_indicated_airspeed(velocity);
        test_bed.set_ambient_pressure(fl390_pressure);
        test_bed.run();

        let discrete_word_flags =
            AdrDiscrete1Flags::from_bits(test_bed.adr_discrete_word_1(adiru_number).value());
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
        let mut test_bed = all_adirus_aligned_test_bed_with().mach_of(mach);
        test_bed.run();

        assert_about_eq!(
            f64::from(test_bed.mach(adiru_number).normal_value().unwrap()),
            f64::from(mach)
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn mach_is_ncd_and_zero_when_less_than_zero_point_1(#[case] adiru_number: usize) {
        let mach = MachNumber::from(AirDataReferenceRuntime::MINIMUM_MACH - 0.01);
        let mut test_bed = all_adirus_aligned_test_bed_with().mach_of(mach);
        test_bed.run();

        assert_about_eq!(f64::from(test_bed.mach(adiru_number).value()), 0.);
        assert_eq!(
            test_bed.mach(adiru_number).ssm(),
            SignStatus::NoComputedData
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn barometric_vertical_speed_is_supplied_by_adr(#[case] adiru_number: usize) {
        let vertical_speed = Velocity::new::<foot_per_minute>(300.);
        let mut test_bed = all_adirus_aligned_test_bed_with();
        let mut altitude = Length::new::<foot>(0.);
        for _ in 0..5 {
            test_bed.set_pressure_altitude(altitude);
            test_bed.run();

            altitude += vertical_speed * Time::new::<second>(1.);
        }

        assert_about_eq!(
            test_bed
                .barometric_vertical_speed(adiru_number)
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
        let mut test_bed = all_adirus_aligned_test_bed_with().true_airspeed_of(velocity);
        test_bed.run();

        assert_eq!(
            test_bed.true_airspeed(adiru_number).normal_value().unwrap(),
            velocity
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn true_airspeed_is_ncd_and_zero_when_less_than_60_knots(#[case] adiru_number: usize) {
        let velocity = Velocity::new::<knot>(AirDataReferenceRuntime::MINIMUM_TAS - 0.01);
        let mut test_bed = all_adirus_aligned_test_bed_with().true_airspeed_of(velocity);
        test_bed.run();

        assert_about_eq!(
            test_bed.true_airspeed(adiru_number).value().get::<knot>(),
            0.
        );
        assert_eq!(
            test_bed.true_airspeed(adiru_number).ssm(),
            SignStatus::NoComputedData
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn static_air_temperature_is_supplied_by_adr(#[case] adiru_number: usize) {
        let sat = ThermodynamicTemperature::new::<degree_celsius>(15.);
        let mut test_bed = all_adirus_aligned_test_bed();
        test_bed.set_ambient_temperature(sat);
        test_bed.run();

        assert_eq!(
            test_bed
                .static_air_temperature(adiru_number)
                .normal_value()
                .unwrap(),
            sat
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn total_air_temperature_is_supplied_by_adr(#[case] adiru_number: usize) {
        let tat = ThermodynamicTemperature::new::<degree_celsius>(15.);
        let mut test_bed = all_adirus_aligned_test_bed_with().total_air_temperature_of(tat);
        test_bed.run();

        assert_eq!(
            test_bed
                .total_air_temperature(adiru_number)
                .normal_value()
                .unwrap(),
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
        let mut test_bed = all_adirus_aligned_test_bed_with().angle_of_attack_of(angle);
        test_bed.set_indicated_airspeed(Velocity::new::<knot>(
            AirDataReferenceRuntime::MINIMUM_CAS_FOR_AOA,
        ));
        test_bed.run();

        assert_eq!(
            test_bed
                .angle_of_attack(adiru_number)
                .normal_value()
                .unwrap(),
            angle
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn angle_of_attack_is_ncd_when_less_than_60_knots(#[case] adiru_number: usize) {
        let angle = Angle::new::<degree>(1.);
        let mut test_bed = all_adirus_aligned_test_bed_with().angle_of_attack_of(angle);
        test_bed.set_indicated_airspeed(Velocity::new::<knot>(
            AirDataReferenceRuntime::MINIMUM_CAS_FOR_AOA - 0.01,
        ));
        test_bed.run();

        assert_eq!(test_bed.angle_of_attack(adiru_number).value(), angle);
        assert_eq!(
            test_bed.angle_of_attack(adiru_number).ssm(),
            SignStatus::NoComputedData
        );
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
    fn all_data_is_available_after_full_alignment_completed(#[case] adiru_number: usize) {
        let mut test_bed =
            test_bed_with().ir_mode_selector_set_to(adiru_number, ModeSelectorPosition::Navigation);

        while test_bed.align_state(adiru_number) != AlignState::Aligned {
            // As the attitude and heading data will become available at some point, we're not checking it here.
            test_bed.assert_ir_non_attitude_data_available(false, adiru_number);
            test_bed.run();
        }

        test_bed = test_bed
            .then_continue_with()
            .true_airspeed_of(Velocity::new::<knot>(
                InertialReferenceRuntime::MINIMUM_TRUE_AIRSPEED_FOR_WIND_DETERMINATION_KNOTS + 0.01,
            ));
        test_bed.run();

        test_bed.assert_all_ir_data_available(true, adiru_number);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn data_is_no_longer_available_when_adiru_mode_selector_off(#[case] adiru_number: usize) {
        let mut test_bed =
            all_adirus_aligned_test_bed_with().true_airspeed_of(Velocity::new::<knot>(
                InertialReferenceRuntime::MINIMUM_TRUE_AIRSPEED_FOR_WIND_DETERMINATION_KNOTS + 0.01,
            ));
        test_bed.run();
        test_bed.assert_all_ir_data_available(true, adiru_number);

        test_bed = test_bed
            .then_continue_with()
            .ir_mode_selector_set_to(adiru_number, ModeSelectorPosition::Off);
        test_bed.run();
        test_bed.assert_all_ir_data_available(false, adiru_number);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn only_attitude_and_heading_data_is_available_when_adir_mode_selector_att(
        #[case] adiru_number: usize,
    ) {
        let mut test_bed = all_adirus_aligned_test_bed_with()
            .ir_mode_selector_set_to(adiru_number, ModeSelectorPosition::Attitude);
        test_bed.run();

        test_bed.assert_ir_attitude_data_available(true, adiru_number);
        test_bed.assert_ir_heading_data_available(true, adiru_number);
        test_bed.assert_ir_non_attitude_data_available(false, adiru_number);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn in_nav_mode_attitude_is_available_28_seconds_after_alignment_began(
        #[case] adiru_number: usize,
    ) {
        let mut test_bed =
            test_bed_with().ir_mode_selector_set_to(adiru_number, ModeSelectorPosition::Navigation);
        test_bed.run_without_delta();

        test_bed.run_with_delta(
            InertialReferenceRuntime::ATTITUDE_INITIALISATION_DURATION - Duration::from_millis(1),
        );
        test_bed.assert_ir_attitude_data_available(false, adiru_number);
        test_bed.assert_ir_heading_data_available(false, adiru_number);

        test_bed.run_with_delta(Duration::from_millis(1));
        test_bed.assert_ir_attitude_data_available(true, adiru_number);
        test_bed.assert_ir_heading_data_available(false, adiru_number);
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
            test_bed_with().ir_mode_selector_set_to(adiru_number, ModeSelectorPosition::Attitude);
        test_bed.run_without_delta();

        test_bed.run_with_delta(
            InertialReferenceRuntime::ATTITUDE_INITIALISATION_DURATION - Duration::from_millis(1),
        );
        test_bed.assert_ir_attitude_data_available(false, adiru_number);
        test_bed.assert_ir_heading_data_available(false, adiru_number);

        test_bed.run_with_delta(Duration::from_millis(1));
        test_bed.assert_ir_attitude_data_available(true, adiru_number);
        test_bed.assert_ir_heading_data_available(true, adiru_number);

        let maint_word_flags = IrMaintFlags::from_bits(test_bed.maint_word(adiru_number).value());
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
        let mut test_bed = all_adirus_aligned_test_bed_with().ir_push_button_off(adiru_number);
        test_bed.run();

        test_bed.assert_all_ir_data_available(false, adiru_number);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn pitch_is_supplied_by_ir(#[case] adiru_number: usize) {
        let angle = Angle::new::<degree>(5.);
        let mut test_bed = all_adirus_aligned_test_bed_with().pitch_of(angle);
        test_bed.run();

        assert_eq!(test_bed.pitch(adiru_number).normal_value().unwrap(), -angle);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn roll_is_supplied_by_ir(#[case] adiru_number: usize) {
        let angle = Angle::new::<degree>(5.);
        let mut test_bed = all_adirus_aligned_test_bed_with().roll_of(angle);
        test_bed.run();

        assert_eq!(test_bed.roll(adiru_number).normal_value().unwrap(), -angle);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn body_roll_rate_is_supplied_by_ir(#[case] adiru_number: usize) {
        let rate = AngularVelocity::new::<revolution_per_minute>(5.);
        let mut test_bed = all_adirus_aligned_test_bed_with().body_roll_rate_of(rate);
        test_bed.run();

        assert_about_eq!(
            test_bed
                .body_roll_rate(adiru_number)
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
        let mut test_bed = all_adirus_aligned_test_bed_with().body_pitch_rate_of(rate);
        test_bed.run();

        assert_about_eq!(
            test_bed
                .body_pitch_rate(adiru_number)
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
        let rate = AngularVelocity::new::<revolution_per_minute>(5.);
        let mut test_bed = all_adirus_aligned_test_bed_with().body_yaw_rate_of(rate);
        test_bed.run();

        assert_about_eq!(
            test_bed
                .body_yaw_rate(adiru_number)
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
        let mut test_bed = all_adirus_aligned_test_bed().pitch_of(pitch).roll_of(roll);
        test_bed.set_long_acc(acc);
        test_bed.run();

        assert_about_eq!(
            test_bed
                .body_long_acc(adiru_number)
                .normal_value()
                .unwrap()
                .get::<percent>(),
            (acc / g + test_bed.pitch(adiru_number).normal_value().unwrap().sin()).get::<ratio>()
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
        let mut test_bed = all_adirus_aligned_test_bed().pitch_of(pitch).roll_of(roll);
        test_bed.set_lat_acc(acc);
        test_bed.run();

        assert_about_eq!(
            test_bed
                .body_lat_acc(adiru_number)
                .normal_value()
                .unwrap()
                .get::<percent>(),
            (acc / g
                - test_bed.pitch(adiru_number).normal_value().unwrap().cos()
                    * test_bed.roll(adiru_number).normal_value().unwrap().sin())
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
        let mut test_bed = all_adirus_aligned_test_bed().pitch_of(pitch).roll_of(roll);
        test_bed.set_norm_acc(acc);
        test_bed.run();

        assert_about_eq!(
            test_bed
                .body_normal_acc(adiru_number)
                .normal_value()
                .unwrap()
                .get::<percent>(),
            (acc / g
                + test_bed.pitch(adiru_number).normal_value().unwrap().cos()
                    * test_bed.roll(adiru_number).normal_value().unwrap().cos())
            .get::<ratio>()
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn heading_is_supplied_by_ir(#[case] adiru_number: usize) {
        let angle = Angle::new::<degree>(160.);
        let mut test_bed = all_adirus_aligned_test_bed_with().heading_of(angle);
        test_bed.run();

        assert_eq!(
            test_bed.heading(adiru_number).normal_value().unwrap(),
            angle
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn true_heading_is_supplied_by_ir(#[case] adiru_number: usize) {
        let angle = Angle::new::<degree>(160.);
        let mut test_bed = all_adirus_aligned_test_bed_with().true_heading_of(angle);
        test_bed.run();

        assert_eq!(
            test_bed.true_heading(adiru_number).normal_value().unwrap(),
            angle
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn true_heading_is_normal_when_remaining_align_is_less_than_two_minutes(
        #[case] adiru_number: usize,
    ) {
        let mut test_bed = test_bed_with()
            .realistic_navigation_align_until(adiru_number, Duration::from_millis(119999));

        assert!(test_bed.true_heading(adiru_number).is_normal_operation());
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn true_heading_is_not_normal_when_remaining_align_is_equal_to_two_minutes(
        #[case] adiru_number: usize,
    ) {
        let mut test_bed = test_bed_with()
            .realistic_navigation_align_until(adiru_number, Duration::from_millis(120000));

        assert!(!test_bed.true_heading(adiru_number).is_normal_operation());
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

        let mut test_bed = all_adirus_aligned_test_bed_with()
            .true_heading_of(true_heading)
            .heading_of(mag_heading)
            .latitude_of(polar_latitude);
        test_bed.run();

        assert!(test_bed.true_heading(adiru_number).is_normal_operation());
        assert!(test_bed.heading(adiru_number).is_normal_operation());
        assert_about_eq!(
            test_bed.true_heading(adiru_number).value().get::<degree>(),
            test_bed.heading(adiru_number).value().get::<degree>()
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

        let mut test_bed = all_adirus_aligned_test_bed_with()
            .true_heading_of(true_heading)
            .heading_of(mag_heading)
            .latitude_of(polar_latitude);
        test_bed.run();

        test_bed.set_latitude(non_polar_latitude);
        test_bed.run();

        assert!(test_bed.true_heading(adiru_number).is_normal_operation());
        assert!(test_bed.heading(adiru_number).is_normal_operation());
        assert_about_eq!(
            test_bed.true_heading(adiru_number).value().get::<degree>(),
            true_heading.get::<degree>()
        );
        assert_about_eq!(
            test_bed.heading(adiru_number).value().get::<degree>(),
            mag_heading.get::<degree>()
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn extreme_latitude_flag_is_set_in_polar_region(#[case] adiru_number: usize) {
        let polar_latitude = Angle::new::<degree>(83.);

        let mut test_bed = all_adirus_aligned_test_bed_with().latitude_of(polar_latitude);
        test_bed.run();

        assert!(test_bed.maint_word(adiru_number).is_normal_operation());
        let maint_word_flags = IrMaintFlags::from_bits(test_bed.maint_word(adiru_number).value());
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

        let mut test_bed = all_adirus_aligned_test_bed_with().latitude_of(polar_latitude);
        test_bed.run();

        test_bed.set_latitude(non_polar_latitude);
        test_bed.run();

        assert!(test_bed.maint_word(adiru_number).is_normal_operation());
        let maint_word_flags = IrMaintFlags::from_bits(test_bed.maint_word(adiru_number).value());
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
        let mut test_bed = all_adirus_aligned_test_bed_with()
            .track_of(angle)
            .and()
            .ground_speed_of(Velocity::new::<knot>(
                InertialReferenceRuntime::MINIMUM_GROUND_SPEED_FOR_TRACK_KNOTS,
            ));
        test_bed.run();

        assert_eq!(test_bed.track(adiru_number).normal_value().unwrap(), angle);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn true_track_is_supplied_when_ground_speed_greater_than_or_equal_to_50_knots(
        #[case] adiru_number: usize,
    ) {
        let angle = Angle::new::<degree>(160.);
        let mut test_bed = all_adirus_aligned_test_bed_with()
            .true_track_of(angle)
            .and()
            .ground_speed_of(Velocity::new::<knot>(
                InertialReferenceRuntime::MINIMUM_GROUND_SPEED_FOR_TRACK_KNOTS,
            ));
        test_bed.run();

        assert_eq!(
            test_bed.true_track(adiru_number).normal_value().unwrap(),
            angle
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn track_is_heading_when_ground_speed_less_than_50_knots(#[case] adiru_number: usize) {
        let angle = Angle::new::<degree>(160.);
        let mut test_bed = all_adirus_aligned_test_bed_with()
            .heading_of(angle)
            .and()
            .ground_speed_of(Velocity::new::<knot>(
                InertialReferenceRuntime::MINIMUM_GROUND_SPEED_FOR_TRACK_KNOTS - 0.01,
            ));
        test_bed.run();

        assert_eq!(test_bed.track(adiru_number).normal_value().unwrap(), angle);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn true_track_is_true_heading_when_ground_speed_less_than_50_knots(
        #[case] adiru_number: usize,
    ) {
        let angle = Angle::new::<degree>(160.);
        let mut test_bed = all_adirus_aligned_test_bed_with()
            .true_heading_of(angle)
            .and()
            .ground_speed_of(Velocity::new::<knot>(
                InertialReferenceRuntime::MINIMUM_GROUND_SPEED_FOR_TRACK_KNOTS - 0.01,
            ));
        test_bed.run();

        assert_eq!(
            test_bed.true_track(adiru_number).normal_value().unwrap(),
            angle
        );
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

        let mut test_bed = all_adirus_aligned_test_bed_with()
            .true_track_of(true_track)
            .track_of(mag_track)
            .latitude_of(polar_latitude);
        test_bed.run();

        assert!(test_bed.true_track(adiru_number).is_normal_operation());
        assert!(test_bed.track(adiru_number).is_normal_operation());
        assert_about_eq!(
            test_bed.true_track(adiru_number).value().get::<degree>(),
            test_bed.track(adiru_number).value().get::<degree>()
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

        let mut test_bed = all_adirus_aligned_test_bed_with()
            .true_heading_of(true_track)
            .heading_of(mag_track)
            .latitude_of(polar_latitude);
        test_bed.run();

        test_bed.set_latitude(non_polar_latitude);
        test_bed.run();

        assert!(test_bed.true_track(adiru_number).is_normal_operation());
        assert!(test_bed.track(adiru_number).is_normal_operation());
        assert_about_eq!(
            test_bed.true_track(adiru_number).value().get::<degree>(),
            true_track.get::<degree>()
        );
        assert_about_eq!(
            test_bed.track(adiru_number).value().get::<degree>(),
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
        let mut test_bed = all_adirus_aligned_test_bed_with()
            .track_of(track)
            .heading_of(heading)
            .and()
            .ground_speed_of(Velocity::new::<knot>(
                InertialReferenceRuntime::MINIMUM_GROUND_SPEED_FOR_TRACK_KNOTS,
            ));
        test_bed.run();

        assert_about_eq!(
            test_bed
                .drift_angle(adiru_number)
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
        let mut test_bed = all_adirus_aligned_test_bed_with()
            .track_of(track)
            .and()
            .heading_of(heading)
            .and()
            .ground_speed_of(Velocity::new::<knot>(
                InertialReferenceRuntime::MINIMUM_GROUND_SPEED_FOR_TRACK_KNOTS - 0.01,
            ));
        test_bed.run();

        assert_eq!(
            test_bed.drift_angle(adiru_number).normal_value().unwrap(),
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
        let mut test_bed = all_adirus_aligned_test_bed_with()
            .inertial_vertical_speed_of(vs)
            .and()
            .ground_speed_of(Velocity::new::<knot>(
                InertialReferenceRuntime::MINIMUM_GROUND_SPEED_FOR_TRACK_KNOTS,
            ));
        test_bed.run();

        assert_about_eq!(
            test_bed
                .flight_path_angle(adiru_number)
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
        let mut test_bed = all_adirus_aligned_test_bed_with()
            .inertial_vertical_speed_of(vs)
            .and()
            .ground_speed_of(Velocity::new::<knot>(
                InertialReferenceRuntime::MINIMUM_GROUND_SPEED_FOR_TRACK_KNOTS - 0.01,
            ));
        test_bed.run();

        assert_eq!(
            test_bed.drift_angle(adiru_number).normal_value().unwrap(),
            Angle::new::<degree>(0.)
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn vertical_speed_is_supplied_by_ir(#[case] adiru_number: usize) {
        let vertical_speed = Velocity::new::<foot_per_minute>(300.);
        let mut test_bed =
            all_adirus_aligned_test_bed_with().inertial_vertical_speed_of(vertical_speed);
        test_bed.run();

        assert_eq!(
            test_bed
                .inertial_vertical_speed(adiru_number)
                .normal_value()
                .unwrap(),
            vertical_speed
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn ground_speed_is_supplied_by_ir(#[case] adiru_number: usize) {
        let gs = Velocity::new::<knot>(200.);
        let mut test_bed = all_adirus_aligned_test_bed_with().ground_speed_of(gs);
        test_bed.run();

        assert_eq!(
            test_bed.ground_speed(adiru_number).normal_value().unwrap(),
            gs
        );
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

        let mut test_bed = all_adirus_aligned_test_bed_with().wind_of(wind_angle, wind_speed);
        test_bed.run();

        assert_about_eq!(
            test_bed
                .wind_direction(adiru_number)
                .normal_value()
                .unwrap()
                .get::<degree>(),
            wind_angle.get::<degree>()
        );
        assert_about_eq!(
            test_bed
                .wind_direction_bnr(adiru_number)
                .normal_value()
                .unwrap()
                .get::<degree>(),
            wind_angle.normalised_180().get::<degree>()
        );
        assert_about_eq!(
            test_bed
                .wind_speed(adiru_number)
                .normal_value()
                .unwrap()
                .get::<knot>(),
            wind_speed.get::<knot>()
        );
        assert_about_eq!(
            test_bed
                .wind_speed_bnr(adiru_number)
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
        let mut test_bed = all_adirus_aligned_test_bed_with()
            .wind_of(Angle::new::<degree>(150.), Velocity::new::<knot>(40.))
            .and()
            .true_airspeed_of(Velocity::new::<knot>(
                InertialReferenceRuntime::MINIMUM_TRUE_AIRSPEED_FOR_WIND_DETERMINATION_KNOTS - 0.01,
            ));
        test_bed.run();

        test_bed.assert_wind_direction_and_velocity_zero(adiru_number);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn wind_is_zero_when_true_airspeed_is_unavailable(#[case] adiru_number: usize) {
        let mut test_bed = all_adirus_aligned_test_bed_with()
            .wind_of(Angle::new::<degree>(150.), Velocity::new::<knot>(40.))
            .and()
            .adr_push_button_off(adiru_number);

        test_bed.run();

        test_bed.assert_wind_direction_and_velocity_zero(adiru_number);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn latitude_is_supplied_by_ir(#[case] adiru_number: usize) {
        let latitude = Angle::new::<degree>(10.);
        let mut test_bed = all_adirus_aligned_test_bed_with().latitude_of(latitude);
        test_bed.run();

        assert_eq!(
            test_bed.latitude(adiru_number).normal_value().unwrap(),
            latitude
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn longitude_is_supplied_by_ir(#[case] adiru_number: usize) {
        let longitude = Angle::new::<degree>(10.);
        let mut test_bed = all_adirus_aligned_test_bed_with().longitude_of(longitude);
        test_bed.run();

        assert_eq!(
            test_bed.longitude(adiru_number).normal_value().unwrap(),
            longitude
        );
    }
}

mod gps {
    use super::*;

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn discrete_output_speed_warning_1(#[case] adiru_number: usize) {
        let mut test_bed = all_adirus_aligned_test_bed();
        test_bed.set_indicated_airspeed(Velocity::new::<knot>(95.));
        test_bed.run();

        assert!(!test_bed.query(|a| a.adirs.adirus[adiru_number - 1].low_speed_warning_1()));

        test_bed.set_indicated_airspeed(Velocity::new::<knot>(105.));
        test_bed.run();
        assert!(test_bed.query(|a| a.adirs.adirus[adiru_number - 1].low_speed_warning_1()));
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn discrete_output_speed_warning_2(#[case] adiru_number: usize) {
        let mut test_bed = all_adirus_aligned_test_bed();
        test_bed.set_indicated_airspeed(Velocity::new::<knot>(45.));
        test_bed.run();

        assert!(!test_bed.query(|a| a.adirs.adirus[adiru_number - 1].low_speed_warning_2()));

        test_bed.set_indicated_airspeed(Velocity::new::<knot>(55.));
        test_bed.run();
        assert!(test_bed.query(|a| a.adirs.adirus[adiru_number - 1].low_speed_warning_2()));
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn discrete_output_speed_warning_3(#[case] adiru_number: usize) {
        let mut test_bed = all_adirus_aligned_test_bed();
        test_bed.set_indicated_airspeed(Velocity::new::<knot>(150.));
        test_bed.run();

        assert!(!test_bed.query(|a| a.adirs.adirus[adiru_number - 1].low_speed_warning_3()));

        test_bed.set_indicated_airspeed(Velocity::new::<knot>(160.));
        test_bed.run();
        assert!(test_bed.query(|a| a.adirs.adirus[adiru_number - 1].low_speed_warning_3()));
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn discrete_output_speed_warning_4(#[case] adiru_number: usize) {
        let mut test_bed = all_adirus_aligned_test_bed();
        test_bed.set_indicated_airspeed(Velocity::new::<knot>(255.));
        test_bed.run();

        assert!(test_bed.query(|a| a.adirs.adirus[adiru_number - 1].low_speed_warning_4()));

        test_bed.set_indicated_airspeed(Velocity::new::<knot>(265.));
        test_bed.run();
        assert!(!test_bed.query(|a| a.adirs.adirus[adiru_number - 1].low_speed_warning_4()));
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn discrete_output_speed_warnings_with_off_adir(#[case] adiru_number: usize) {
        let mut test_bed = test_bed();
        test_bed.set_indicated_airspeed(Velocity::new::<knot>(5.));
        test_bed.run();

        assert!(!test_bed.query(|a| a.adirs.adirus[adiru_number - 1].low_speed_warning_1()));

        assert!(!test_bed.query(|a| a.adirs.adirus[adiru_number - 1].low_speed_warning_2()));

        assert!(!test_bed.query(|a| a.adirs.adirus[adiru_number - 1].low_speed_warning_3()));

        assert!(!test_bed.query(|a| a.adirs.adirus[adiru_number - 1].low_speed_warning_4()));
    }
}
