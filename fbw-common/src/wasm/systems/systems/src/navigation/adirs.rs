use crate::air_conditioning::AdirsToAirCondInterface;
use crate::simulation::{InitContext, VariableIdentifier};
use crate::{
    overhead::{IndicationLight, OnOffFaultPushButton},
    shared::{
        arinc429::{Arinc429Word, SignStatus},
        low_pass_filter::LowPassFilter,
        AdirsDiscreteOutputs, AdirsMeasurementOutputs, MachNumber,
    },
    simulation::{
        Read, Reader, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, Write, Writer,
    },
};
use bitflags::bitflags;
use nalgebra::{Rotation2, Vector2};
use std::{fmt::Display, time::Duration};
use uom::si::acceleration::meter_per_second_squared;
use uom::si::pressure::inch_of_mercury;
use uom::si::{
    angle::degree,
    angle::radian,
    angular_velocity::degree_per_second,
    f64::*,
    length::foot,
    pressure::hectopascal,
    ratio::ratio,
    velocity::{foot_per_minute, knot},
};

pub struct AirDataInertialReferenceSystemOverheadPanel {
    ir: [OnOffFaultPushButton; 3],
    mode_selectors: [InertialReferenceModeSelector; 3],
    adr: [OnOffFaultPushButton; 3],
    on_bat: IndicationLight,
}
impl AirDataInertialReferenceSystemOverheadPanel {
    const ADIRS_ON_BAT_NAME: &'static str = "ADIRS_ON_BAT";
    const DURATION_AFTER_WHICH_ON_BAT_ILLUMINATES: Duration = Duration::from_millis(10500);
    const ON_BAT_ILLUMINATION_DURATION: Duration = Duration::from_millis(5500);

    pub fn new(context: &mut InitContext) -> Self {
        Self {
            ir: [
                OnOffFaultPushButton::new_on(context, "ADIRS_IR_1"),
                OnOffFaultPushButton::new_on(context, "ADIRS_IR_2"),
                OnOffFaultPushButton::new_on(context, "ADIRS_IR_3"),
            ],
            mode_selectors: [
                InertialReferenceModeSelector::new(context, 1),
                InertialReferenceModeSelector::new(context, 2),
                InertialReferenceModeSelector::new(context, 3),
            ],
            adr: [
                OnOffFaultPushButton::new_on(context, "ADIRS_ADR_1"),
                OnOffFaultPushButton::new_on(context, "ADIRS_ADR_2"),
                OnOffFaultPushButton::new_on(context, "ADIRS_ADR_3"),
            ],
            on_bat: IndicationLight::new(context, Self::ADIRS_ON_BAT_NAME),
        }
    }

    pub fn update(&mut self, context: &UpdateContext, adirs: &AirDataInertialReferenceSystem) {
        self.mode_selectors.iter_mut().for_each(|mode_selector| {
            mode_selector.update(context);
        });

        // Having the illumination logic here and in the mode selectors is
        // a bit silly, as this depends on whether or not any IR is supplied by
        // the battery. Once the battery supplying the IR is modelled, this logic
        // can be moved.
        self.on_bat
            .set_illuminated(self.mode_selectors.iter().any(|mode_selector| {
                let duration = mode_selector.not_off_duration();
                duration >= Self::DURATION_AFTER_WHICH_ON_BAT_ILLUMINATES
                    && duration
                        < Self::DURATION_AFTER_WHICH_ON_BAT_ILLUMINATES
                            + Self::ON_BAT_ILLUMINATION_DURATION
            }));

        self.ir
            .iter_mut()
            .enumerate()
            .for_each(|(index, ir)| ir.set_fault(adirs.ir_has_fault(index + 1)))
    }

    fn mode_of(&self, number: usize) -> InertialReferenceMode {
        self.mode_selectors[number - 1].mode()
    }

    fn adr_is_on(&self, number: usize) -> bool {
        self.adr[number - 1].is_on()
    }

    fn ir_is_on(&self, number: usize) -> bool {
        self.ir[number - 1].is_on()
    }
}
impl SimulationElement for AirDataInertialReferenceSystemOverheadPanel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.ir, visitor);
        accept_iterable!(self.mode_selectors, visitor);
        accept_iterable!(self.adr, visitor);
        self.on_bat.accept(visitor);

        visitor.visit(self);
    }
}

#[derive(Clone, Copy, PartialEq, Debug)]
enum InertialReferenceMode {
    Off = 0,
    Navigation = 1,
    Attitude = 2,
}

read_write_enum!(InertialReferenceMode);

impl From<f64> for InertialReferenceMode {
    fn from(value: f64) -> Self {
        match value as u8 {
            1 => InertialReferenceMode::Navigation,
            2 => InertialReferenceMode::Attitude,
            _ => InertialReferenceMode::Off,
        }
    }
}

struct InertialReferenceModeSelector {
    mode_id: VariableIdentifier,
    mode: InertialReferenceMode,
    not_off_duration: Duration,
}
impl InertialReferenceModeSelector {
    fn new(context: &mut InitContext, number: usize) -> Self {
        Self {
            mode_id: context.get_identifier(Self::mode_id(number)),
            // We start in an aligned state to support starting on the
            // runway or in the air.
            mode: InertialReferenceMode::Navigation,
            not_off_duration: Duration::from_secs(0),
        }
    }

    fn mode_id(number: usize) -> String {
        format!("OVHD_ADIRS_IR_{}_MODE_SELECTOR_KNOB", number)
    }

    fn mode(&self) -> InertialReferenceMode {
        self.mode
    }

    fn not_off_duration(&self) -> Duration {
        self.not_off_duration
    }

    fn update(&mut self, context: &UpdateContext) {
        if self.mode == InertialReferenceMode::Off {
            self.not_off_duration = Duration::from_secs(0)
        } else {
            self.not_off_duration += context.delta();
        }
    }
}
impl SimulationElement for InertialReferenceModeSelector {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.mode = reader.read(&self.mode_id)
    }
}

#[derive(Clone, Copy, PartialEq)]
enum AlignState {
    Off = 0,
    Aligning = 1,
    Aligned = 2,
}

read_write_enum!(AlignState);

impl From<f64> for AlignState {
    fn from(value: f64) -> Self {
        match value as u8 {
            1 => AlignState::Aligning,
            2 => AlignState::Aligned,
            _ => AlignState::Off,
        }
    }
}

#[derive(Clone, Copy)]
struct AdirsSimulatorData {
    mach_id: VariableIdentifier,
    mach: MachNumber,

    vertical_speed_id: VariableIdentifier,
    vertical_speed: Velocity,

    true_airspeed_id: VariableIdentifier,
    true_airspeed: Velocity,

    latitude_id: VariableIdentifier,
    latitude: Angle,

    longitude_id: VariableIdentifier,
    longitude: Angle,

    pitch_id: VariableIdentifier,
    pitch: Angle,

    roll_id: VariableIdentifier,
    roll: Angle,

    body_rotation_rate_x_id: VariableIdentifier,
    body_rotation_rate_x: AngularVelocity,

    body_rotation_rate_y_id: VariableIdentifier,
    body_rotation_rate_y: AngularVelocity,

    body_rotation_rate_z_id: VariableIdentifier,
    body_rotation_rate_z: AngularVelocity,

    heading_id: VariableIdentifier,
    heading: Angle,

    true_heading_id: VariableIdentifier,
    true_heading: Angle,

    track_id: VariableIdentifier,
    track: Angle,

    true_track_id: VariableIdentifier,
    true_track: Angle,

    ground_speed_id: VariableIdentifier,
    ground_speed: Velocity,

    total_air_temperature_id: VariableIdentifier,
    total_air_temperature: ThermodynamicTemperature,

    angle_of_attack_id: VariableIdentifier,
    angle_of_attack: Angle,

    baro_correction_1_id: VariableIdentifier,
    baro_correction_1: Pressure,
}
impl AdirsSimulatorData {
    const MACH: &'static str = "AIRSPEED MACH";
    const VERTICAL_SPEED: &'static str = "VELOCITY WORLD Y";
    const TRUE_AIRSPEED: &'static str = "AIRSPEED TRUE";
    const LATITUDE: &'static str = "PLANE LATITUDE";
    const LONGITUDE: &'static str = "PLANE LONGITUDE";
    const PITCH: &'static str = "PLANE PITCH DEGREES";
    const ROLL: &'static str = "PLANE BANK DEGREES";
    const BODY_ROTATION_RATE_X: &'static str = "ROTATION VELOCITY BODY X";
    const BODY_ROTATION_RATE_Y: &'static str = "ROTATION VELOCITY BODY Y";
    const BODY_ROTATION_RATE_Z: &'static str = "ROTATION VELOCITY BODY Z";
    const HEADING: &'static str = "PLANE HEADING DEGREES MAGNETIC";
    const TRUE_HEADING: &'static str = "PLANE HEADING DEGREES TRUE";
    const TRACK: &'static str = "GPS GROUND MAGNETIC TRACK";
    const TRUE_TRACK: &'static str = "GPS GROUND TRUE TRACK";
    const GROUND_SPEED: &'static str = "GPS GROUND SPEED";
    const TOTAL_AIR_TEMPERATURE: &'static str = "TOTAL AIR TEMPERATURE";
    const ANGLE_OF_ATTACK: &'static str = "INCIDENCE ALPHA";
    const BARO_CORRECTION_1_HPA: &'static str = "KOHLSMAN SETTING MB:1";

    fn new(context: &mut InitContext) -> Self {
        Self {
            mach_id: context.get_identifier(Self::MACH.to_owned()),
            mach: Default::default(),

            vertical_speed_id: context.get_identifier(Self::VERTICAL_SPEED.to_owned()),
            vertical_speed: Default::default(),

            true_airspeed_id: context.get_identifier(Self::TRUE_AIRSPEED.to_owned()),
            true_airspeed: Default::default(),

            latitude_id: context.get_identifier(Self::LATITUDE.to_owned()),
            latitude: Default::default(),

            longitude_id: context.get_identifier(Self::LONGITUDE.to_owned()),
            longitude: Default::default(),

            pitch_id: context.get_identifier(Self::PITCH.to_owned()),
            pitch: Default::default(),

            roll_id: context.get_identifier(Self::ROLL.to_owned()),
            roll: Default::default(),

            body_rotation_rate_x_id: context.get_identifier(Self::BODY_ROTATION_RATE_X.to_owned()),
            body_rotation_rate_x: Default::default(),

            body_rotation_rate_y_id: context.get_identifier(Self::BODY_ROTATION_RATE_Y.to_owned()),
            body_rotation_rate_y: Default::default(),

            body_rotation_rate_z_id: context.get_identifier(Self::BODY_ROTATION_RATE_Z.to_owned()),
            body_rotation_rate_z: Default::default(),

            heading_id: context.get_identifier(Self::HEADING.to_owned()),
            heading: Default::default(),

            true_heading_id: context.get_identifier(Self::TRUE_HEADING.to_owned()),
            true_heading: Default::default(),

            track_id: context.get_identifier(Self::TRACK.to_owned()),
            track: Default::default(),

            true_track_id: context.get_identifier(Self::TRUE_TRACK.to_owned()),
            true_track: Default::default(),

            ground_speed_id: context.get_identifier(Self::GROUND_SPEED.to_owned()),
            ground_speed: Default::default(),

            total_air_temperature_id: context
                .get_identifier(Self::TOTAL_AIR_TEMPERATURE.to_owned()),
            total_air_temperature: Default::default(),

            angle_of_attack_id: context.get_identifier(Self::ANGLE_OF_ATTACK.to_owned()),
            angle_of_attack: Default::default(),

            baro_correction_1_id: context.get_identifier(Self::BARO_CORRECTION_1_HPA.to_owned()),
            baro_correction_1: Default::default(),
        }
    }
}
impl SimulationElement for AdirsSimulatorData {
    fn read(&mut self, reader: &mut SimulatorReader) {
        // To reduce reads, we only read these values once and then share it with the underlying ADRs and IRs.
        self.mach = reader.read(&self.mach_id);
        let vertical_speed: f64 = reader.read(&self.vertical_speed_id);
        self.vertical_speed = Velocity::new::<foot_per_minute>(vertical_speed);
        self.true_airspeed = reader.read(&self.true_airspeed_id);
        self.latitude = reader.read(&self.latitude_id);
        self.longitude = reader.read(&self.longitude_id);
        self.pitch = reader.read(&self.pitch_id);
        self.roll = reader.read(&self.roll_id);
        let body_rotation_rate_x: f64 = reader.read(&self.body_rotation_rate_x_id);
        let body_rotation_rate_y: f64 = reader.read(&self.body_rotation_rate_y_id);
        let body_rotation_rate_z: f64 = reader.read(&self.body_rotation_rate_z_id);
        self.body_rotation_rate_x = AngularVelocity::new::<degree_per_second>(body_rotation_rate_x);
        self.body_rotation_rate_y = AngularVelocity::new::<degree_per_second>(body_rotation_rate_y);
        self.body_rotation_rate_z = AngularVelocity::new::<degree_per_second>(body_rotation_rate_z);
        self.heading = reader.read(&self.heading_id);
        self.true_heading = reader.read(&self.true_heading_id);
        self.track = reader.read(&self.track_id);
        self.true_track = reader.read(&self.true_track_id);
        self.ground_speed = reader.read(&self.ground_speed_id);
        self.total_air_temperature = reader.read(&self.total_air_temperature_id);
        self.angle_of_attack = reader.read(&self.angle_of_attack_id);
        self.baro_correction_1 =
            Pressure::new::<hectopascal>(reader.read(&self.baro_correction_1_id));
    }
}

pub struct AirDataInertialReferenceSystem {
    remaining_alignment_time_id: VariableIdentifier,
    configured_align_time_id: VariableIdentifier,
    uses_gps_as_primary_id: VariableIdentifier,

    adirus: [AirDataInertialReferenceUnit; 3],
    configured_align_time: AlignTime,
    simulator_data: AdirsSimulatorData,
}
impl AirDataInertialReferenceSystem {
    const REMAINING_ALIGNMENT_TIME_KEY: &'static str = "ADIRS_REMAINING_IR_ALIGNMENT_TIME";
    const CONFIGURED_ALIGN_TIME_KEY: &'static str = "CONFIG_ADIRS_IR_ALIGN_TIME";
    // TODO this is an FMS thing, nothing to do with ADIRUs
    const USES_GPS_AS_PRIMARY_KEY: &'static str = "ADIRS_USES_GPS_AS_PRIMARY";

    pub fn new(context: &mut InitContext) -> Self {
        Self {
            remaining_alignment_time_id: context
                .get_identifier(Self::REMAINING_ALIGNMENT_TIME_KEY.to_owned()),
            configured_align_time_id: context
                .get_identifier(Self::CONFIGURED_ALIGN_TIME_KEY.to_owned()),
            uses_gps_as_primary_id: context
                .get_identifier(Self::USES_GPS_AS_PRIMARY_KEY.to_owned()),

            adirus: [
                AirDataInertialReferenceUnit::new(context, 1),
                AirDataInertialReferenceUnit::new(context, 2),
                AirDataInertialReferenceUnit::new(context, 3),
            ],
            configured_align_time: AlignTime::Realistic,
            simulator_data: AdirsSimulatorData::new(context),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        overhead: &AirDataInertialReferenceSystemOverheadPanel,
    ) {
        let align_time = self.configured_align_time;
        let simulator_data = self.simulator_data;
        self.adirus
            .iter_mut()
            .for_each(|adiru| adiru.update(context, overhead, align_time, simulator_data));
    }

    fn remaining_align_duration(&self) -> Duration {
        self.adirus
            .iter()
            .fold(None, |acc, x| match (acc, x.remaining_align_duration()) {
                (None, None) => None,
                (None, Some(remaining)) => Some(remaining),
                (Some(remaining), None) => Some(remaining),
                (Some(x), Some(y)) => Some(if x > y { x } else { y }),
            })
            .unwrap_or_else(|| Duration::from_secs(0))
    }

    fn any_adiru_fully_aligned_with_ir_on(&self) -> bool {
        self.adirus
            .iter()
            .any(|adiru| adiru.is_fully_aligned() && adiru.ir_is_on())
    }

    fn ir_has_fault(&self, number: usize) -> bool {
        self.adirus[number - 1].ir_has_fault()
    }

    pub fn altitude(&self, number: usize) -> Arinc429Word<Length> {
        (&self.adirus[number - 1].adr.altitude).into()
    }

    pub fn baro_corrected_altitude_1(&self, number: usize) -> Arinc429Word<Length> {
        (&self.adirus[number - 1].adr.baro_corrected_altitude_1).into()
    }

    pub fn baro_corrected_altitude_2(&self, number: usize) -> Arinc429Word<Length> {
        (&self.adirus[number - 1].adr.baro_corrected_altitude_2).into()
    }

    pub fn computed_speed(&self, number: usize) -> Arinc429Word<Velocity> {
        (&self.adirus[number - 1].adr.computed_airspeed).into()
    }
}
impl SimulationElement for AirDataInertialReferenceSystem {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.adirus, visitor);
        self.simulator_data.accept(visitor);

        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.configured_align_time = reader.read(&self.configured_align_time_id);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.remaining_alignment_time_id,
            self.remaining_align_duration(),
        );
        writer.write(
            &self.uses_gps_as_primary_id,
            self.any_adiru_fully_aligned_with_ir_on(),
        )
    }
}
impl AdirsToAirCondInterface for AirDataInertialReferenceSystem {
    fn ground_speed(&self, adiru_number: usize) -> Arinc429Word<Velocity> {
        self.adirus[adiru_number - 1].ground_speed()
    }
    fn true_airspeed(&self, adiru_number: usize) -> Arinc429Word<Velocity> {
        self.adirus[adiru_number - 1].true_airspeed()
    }
    fn baro_correction(&self, adiru_number: usize) -> Arinc429Word<Pressure> {
        self.adirus[adiru_number - 1].baro_correction_1()
    }
    fn ambient_static_pressure(&self, adiru_number: usize) -> Arinc429Word<Pressure> {
        self.adirus[adiru_number - 1].ambient_static_pressure()
    }
}
impl AdirsDiscreteOutputs for AirDataInertialReferenceSystem {
    fn low_speed_warning_1_104kts(&self, adiru_number: usize) -> bool {
        self.adirus[adiru_number - 1].low_speed_warning_1_104kts()
    }

    fn low_speed_warning_2_54kts(&self, adiru_number: usize) -> bool {
        self.adirus[adiru_number - 1].low_speed_warning_2_54kts()
    }

    fn low_speed_warning_3_159kts(&self, adiru_number: usize) -> bool {
        self.adirus[adiru_number - 1].low_speed_warning_3_159kts()
    }

    fn low_speed_warning_4_260kts(&self, adiru_number: usize) -> bool {
        self.adirus[adiru_number - 1].low_speed_warning_4_260kts()
    }
}
impl AdirsMeasurementOutputs for AirDataInertialReferenceSystem {
    fn is_fully_aligned(&self, adiru_number: usize) -> bool {
        self.adirus[adiru_number - 1].is_fully_aligned()
    }

    fn latitude(&self, adiru_number: usize) -> Arinc429Word<Angle> {
        self.adirus[adiru_number - 1].latitude()
    }

    fn longitude(&self, adiru_number: usize) -> Arinc429Word<Angle> {
        self.adirus[adiru_number - 1].longitude()
    }

    fn heading(&self, adiru_number: usize) -> Arinc429Word<Angle> {
        self.adirus[adiru_number - 1].heading()
    }

    fn true_heading(&self, adiru_number: usize) -> Arinc429Word<Angle> {
        self.adirus[adiru_number - 1].true_heading()
    }

    fn vertical_speed(&self, adiru_number: usize) -> Arinc429Word<Velocity> {
        self.adirus[adiru_number - 1].vertical_speed()
    }

    fn altitude(&self, adiru_number: usize) -> Arinc429Word<Length> {
        self.adirus[adiru_number - 1].altitude()
    }
}

struct AirDataInertialReferenceUnit {
    state_id: VariableIdentifier,

    adr: AirDataReference,
    ir: InertialReference,

    // Discrete outputs
    low_speed_warning_1_104kts: bool,
    low_speed_warning_2_54kts: bool,
    low_speed_warning_3_159kts: bool,
    low_speed_warning_4_260kts: bool,
}
impl AirDataInertialReferenceUnit {
    fn new(context: &mut InitContext, number: usize) -> Self {
        Self {
            state_id: context.get_identifier(Self::state_id(number)),
            adr: AirDataReference::new(context, number),
            ir: InertialReference::new(context, number),

            low_speed_warning_1_104kts: false,
            low_speed_warning_2_54kts: false,
            low_speed_warning_3_159kts: false,
            low_speed_warning_4_260kts: false,
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        overhead: &AirDataInertialReferenceSystemOverheadPanel,
        align_time: AlignTime,
        simulator_data: AdirsSimulatorData,
    ) {
        self.adr.update(context, overhead, simulator_data);
        self.ir
            .update(context, &self.adr, overhead, align_time, simulator_data);

        self.update_discrete_outputs();
    }

    fn is_fully_aligned(&self) -> bool {
        self.ir.is_fully_aligned()
    }

    fn ir_is_on(&self) -> bool {
        self.ir.is_on()
    }

    fn remaining_align_duration(&self) -> Option<Duration> {
        self.ir.remaining_align_duration()
    }

    fn state(&self) -> AlignState {
        if self.is_fully_aligned() {
            AlignState::Aligned
        } else if self.ir.is_aligning() {
            AlignState::Aligning
        } else {
            AlignState::Off
        }
    }

    fn state_id(number: usize) -> String {
        format!("ADIRS_ADIRU_{}_STATE", number)
    }

    fn ir_has_fault(&self) -> bool {
        self.ir.has_fault()
    }

    fn adr_is_valid(&self) -> bool {
        self.adr.is_valid()
    }

    // If above speed threshold OR if data is unavailable: all discrete are set to TRUE
    fn update_discrete_outputs(&mut self) {
        let speed_knot = self.adr.computed_airspeed_raw().get::<knot>();

        if speed_knot < 100. {
            self.low_speed_warning_1_104kts = false;
        } else if speed_knot > 104. {
            self.low_speed_warning_1_104kts = true;
        }

        if speed_knot < 50. {
            self.low_speed_warning_2_54kts = false;
        } else if speed_knot > 54. {
            self.low_speed_warning_2_54kts = true;
        }

        if speed_knot < 155. {
            self.low_speed_warning_3_159kts = false;
        } else if speed_knot > 159. {
            self.low_speed_warning_3_159kts = true;
        }

        if speed_knot < 260. {
            self.low_speed_warning_4_260kts = false;
        } else if speed_knot > 264. {
            self.low_speed_warning_4_260kts = true;
        }

        if !self.adr_is_valid() {
            self.low_speed_warning_1_104kts = true;
            self.low_speed_warning_2_54kts = true;
            self.low_speed_warning_3_159kts = true;
            self.low_speed_warning_4_260kts = true;
        }
    }

    fn low_speed_warning_1_104kts(&self) -> bool {
        self.low_speed_warning_1_104kts
    }

    fn low_speed_warning_2_54kts(&self) -> bool {
        self.low_speed_warning_2_54kts
    }

    fn low_speed_warning_3_159kts(&self) -> bool {
        self.low_speed_warning_3_159kts
    }

    fn low_speed_warning_4_260kts(&self) -> bool {
        self.low_speed_warning_4_260kts
    }

    fn latitude(&self) -> Arinc429Word<Angle> {
        self.ir.latitude()
    }

    fn longitude(&self) -> Arinc429Word<Angle> {
        self.ir.longitude()
    }

    fn heading(&self) -> Arinc429Word<Angle> {
        self.ir.heading()
    }

    fn true_heading(&self) -> Arinc429Word<Angle> {
        self.ir.true_heading()
    }

    fn vertical_speed(&self) -> Arinc429Word<Velocity> {
        self.ir.vertical_speed()
    }

    fn altitude(&self) -> Arinc429Word<Length> {
        self.adr.altitude()
    }

    fn ground_speed(&self) -> Arinc429Word<Velocity> {
        self.ir.ground_speed()
    }

    fn true_airspeed(&self) -> Arinc429Word<Velocity> {
        self.adr.true_airspeed()
    }

    fn baro_correction_1(&self) -> Arinc429Word<Pressure> {
        self.adr.baro_correction_1()
    }

    fn ambient_static_pressure(&self) -> Arinc429Word<Pressure> {
        self.adr.corrected_average_static_pressure()
    }
}
impl SimulationElement for AirDataInertialReferenceUnit {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.adr.accept(visitor);
        self.ir.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.state_id, self.state())
    }
}

struct AdirsData<T> {
    id: VariableIdentifier,
    value: T,
    ssm: SignStatus,
}
impl<T: Copy + Default + PartialOrd> AdirsData<T> {
    fn new_adr(context: &mut InitContext, number: usize, name: &str) -> Self {
        Self::new(context, OutputDataType::Adr, number, name)
    }

    fn new_ir(context: &mut InitContext, number: usize, name: &str) -> Self {
        Self::new(context, OutputDataType::Ir, number, name)
    }

    fn new(
        context: &mut InitContext,
        data_type: OutputDataType,
        number: usize,
        name: &str,
    ) -> Self {
        Self {
            id: context.get_identifier(output_data_id(data_type, number, name)),
            value: Default::default(),
            ssm: SignStatus::NoComputedData,
        }
    }

    fn value(&self) -> T {
        self.value
    }

    fn ssm(&self) -> SignStatus {
        self.ssm
    }

    fn set_value(&mut self, value: T, ssm: SignStatus) {
        self.value = value;
        self.ssm = ssm;
    }

    fn set_from(&mut self, other: &AdirsData<T>) {
        self.set_value(other.value, other.ssm);
    }

    /// Sets failure warning with the default (0.0) value.
    fn set_failure_warning(&mut self) {
        self.value = Default::default();
        self.ssm = SignStatus::FailureWarning;
    }

    /// Sets no computed data with the default (0.0) value.
    fn set_no_computed_data(&mut self) {
        self.value = Default::default();
        self.ssm = SignStatus::NoComputedData;
    }

    /// Sets normal operation with the given value.
    fn set_normal_operation_value(&mut self, value: T) {
        self.value = value;
        self.ssm = SignStatus::NormalOperation;
    }

    /// Sets normal operation with the given value when above the threshold,
    /// no computed data otherwise.
    fn normal_above_threshold_ncd_otherwise(&mut self, threshold: T, value: T) {
        if value < threshold {
            self.set_no_computed_data();
        } else {
            self.set_normal_operation_value(value);
        }
    }

    fn write_to<U: Write<T> + Writer>(&self, writer: &mut U) {
        writer.write_arinc429(&self.id, self.value, self.ssm);
    }

    fn write_to_converted<U: Write<f64> + Writer, V: Fn(T) -> f64>(
        &self,
        writer: &mut U,
        convert: V,
    ) {
        writer.write_arinc429(&self.id, convert(self.value), self.ssm);
    }
}

impl<T: Copy + Default + PartialOrd> From<&AdirsData<T>> for Arinc429Word<T> {
    fn from(value: &AdirsData<T>) -> Self {
        Arinc429Word::new(value.value, value.ssm)
    }
}

#[derive(Clone, Copy)]
enum OutputDataType {
    Adr,
    Ir,
}
impl Display for OutputDataType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            OutputDataType::Adr => write!(f, "ADR"),
            OutputDataType::Ir => write!(f, "IR"),
        }
    }
}

fn output_data_id(data_type: OutputDataType, number: usize, name: &str) -> String {
    format!("ADIRS_{}_{}_{}", data_type, number, name)
}

trait TrueAirspeedSource {
    fn true_airspeed(&self) -> Arinc429Word<Velocity>;
}

struct AirDataReference {
    number: usize,
    is_on: bool,

    /// label 234
    baro_correction_1_hpa: AdirsData<Pressure>,
    /// label 235
    baro_correction_1_inhg: AdirsData<Pressure>,
    /// label 236
    baro_correction_2_hpa: AdirsData<Pressure>,
    /// label 237
    baro_correction_2_inhg: AdirsData<Pressure>,
    corrected_average_static_pressure: AdirsData<Pressure>,
    /// pressure altitude
    altitude: AdirsData<Length>,
    /// baro corrected altitude for the captain's side
    baro_corrected_altitude_1: AdirsData<Length>,
    /// baro corrected altitude for the fo's side
    baro_corrected_altitude_2: AdirsData<Length>,
    computed_airspeed: AdirsData<Velocity>,
    mach: AdirsData<MachNumber>,
    barometric_vertical_speed: AdirsData<f64>,
    true_airspeed: AdirsData<Velocity>,
    static_air_temperature: AdirsData<ThermodynamicTemperature>,
    total_air_temperature: AdirsData<ThermodynamicTemperature>,
    angle_of_attack: AdirsData<Angle>,

    remaining_initialisation_duration: Option<Duration>,
}
impl AirDataReference {
    const INITIALISATION_DURATION: Duration = Duration::from_secs(18);
    const BARO_CORRECTION_1_HPA: &'static str = "BARO_CORRECTION_1_HPA";
    const BARO_CORRECTION_1_INHG: &'static str = "BARO_CORRECTION_1_INHG";
    const BARO_CORRECTION_2_HPA: &'static str = "BARO_CORRECTION_2_HPA";
    const BARO_CORRECTION_2_INHG: &'static str = "BARO_CORRECTION_2_INHG";
    const CORRECTED_AVERAGE_STATIC_PRESSURE: &'static str = "CORRECTED_AVERAGE_STATIC_PRESSURE";
    const ALTITUDE: &'static str = "ALTITUDE";
    const BARO_CORRECTED_ALTITUDE_1: &'static str = "BARO_CORRECTED_ALTITUDE_1";
    const BARO_CORRECTED_ALTITUDE_2: &'static str = "BARO_CORRECTED_ALTITUDE_2";
    const COMPUTED_AIRSPEED: &'static str = "COMPUTED_AIRSPEED";
    const MACH: &'static str = "MACH";
    const BAROMETRIC_VERTICAL_SPEED: &'static str = "BAROMETRIC_VERTICAL_SPEED";
    const TRUE_AIRSPEED: &'static str = "TRUE_AIRSPEED";
    const STATIC_AIR_TEMPERATURE: &'static str = "STATIC_AIR_TEMPERATURE";
    const TOTAL_AIR_TEMPERATURE: &'static str = "TOTAL_AIR_TEMPERATURE";
    const ANGLE_OF_ATTACK: &'static str = "ANGLE_OF_ATTACK";
    const MINIMUM_TAS: f64 = 60.;
    const MINIMUM_CAS: f64 = 30.;
    const MINIMUM_MACH: f64 = 0.1;
    const MINIMUM_CAS_FOR_AOA: f64 = 60.;

    fn new(context: &mut InitContext, number: usize) -> Self {
        Self {
            number,
            is_on: true,

            baro_correction_1_hpa: AdirsData::new_adr(context, number, Self::BARO_CORRECTION_1_HPA),
            baro_correction_1_inhg: AdirsData::new_adr(
                context,
                number,
                Self::BARO_CORRECTION_1_INHG,
            ),
            baro_correction_2_hpa: AdirsData::new_adr(context, number, Self::BARO_CORRECTION_2_HPA),
            baro_correction_2_inhg: AdirsData::new_adr(
                context,
                number,
                Self::BARO_CORRECTION_2_INHG,
            ),
            corrected_average_static_pressure: AdirsData::new_adr(
                context,
                number,
                Self::CORRECTED_AVERAGE_STATIC_PRESSURE,
            ),
            altitude: AdirsData::new_adr(context, number, Self::ALTITUDE),
            baro_corrected_altitude_1: AdirsData::new_adr(
                context,
                number,
                Self::BARO_CORRECTED_ALTITUDE_1,
            ),
            baro_corrected_altitude_2: AdirsData::new_adr(
                context,
                number,
                Self::BARO_CORRECTED_ALTITUDE_2,
            ),
            computed_airspeed: AdirsData::new_adr(context, number, Self::COMPUTED_AIRSPEED),
            mach: AdirsData::new_adr(context, number, Self::MACH),
            barometric_vertical_speed: AdirsData::new_adr(
                context,
                number,
                Self::BAROMETRIC_VERTICAL_SPEED,
            ),
            true_airspeed: AdirsData::new_adr(context, number, Self::TRUE_AIRSPEED),
            static_air_temperature: AdirsData::new_adr(
                context,
                number,
                Self::STATIC_AIR_TEMPERATURE,
            ),
            total_air_temperature: AdirsData::new_adr(context, number, Self::TOTAL_AIR_TEMPERATURE),
            angle_of_attack: AdirsData::new_adr(context, number, Self::ANGLE_OF_ATTACK),

            // Start fully initialised.
            remaining_initialisation_duration: Some(Duration::from_secs(0)),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        overhead: &AirDataInertialReferenceSystemOverheadPanel,
        simulator_data: AdirsSimulatorData,
    ) {
        self.is_on = overhead.adr_is_on(self.number);
        self.update_remaining_initialisation_duration(context, overhead);
        self.update_values(context, simulator_data);
    }

    fn update_remaining_initialisation_duration(
        &mut self,
        context: &UpdateContext,
        overhead: &AirDataInertialReferenceSystemOverheadPanel,
    ) {
        self.remaining_initialisation_duration = remaining_initialisation_duration(
            context,
            Self::INITIALISATION_DURATION,
            overhead.mode_of(self.number),
            self.remaining_initialisation_duration,
        );
    }

    fn update_values(&mut self, context: &UpdateContext, simulator_data: AdirsSimulatorData) {
        // For now some of the data will be read from the context. Later the context will no longer
        // contain this information (and instead all usages will be replaced by requests to the ADIRUs).

        // If the ADR is off or not initialized, output all labels as FW with value 0.
        if !self.is_valid() {
            self.baro_correction_1_hpa.set_failure_warning();
            self.baro_correction_1_inhg.set_failure_warning();
            self.baro_correction_2_hpa.set_failure_warning();
            self.baro_correction_2_inhg.set_failure_warning();
            self.corrected_average_static_pressure.set_failure_warning();
            self.altitude.set_failure_warning();
            self.baro_corrected_altitude_1.set_failure_warning();
            self.baro_corrected_altitude_2.set_failure_warning();
            self.barometric_vertical_speed.set_failure_warning();
            self.computed_airspeed.set_failure_warning();
            self.true_airspeed.set_failure_warning();
            self.mach.set_failure_warning();
            self.total_air_temperature.set_failure_warning();
            self.static_air_temperature.set_failure_warning();
            self.angle_of_attack.set_failure_warning();
        } else {
            // If it is on and initialized, output normal values.
            self.baro_correction_1_hpa
                .set_normal_operation_value(simulator_data.baro_correction_1);
            self.baro_correction_1_inhg
                .set_normal_operation_value(simulator_data.baro_correction_1);
            // Fixme: Get data from F/O altimeter when available
            self.baro_correction_2_hpa
                .set_normal_operation_value(simulator_data.baro_correction_1);
            self.baro_correction_2_inhg
                .set_normal_operation_value(simulator_data.baro_correction_1);

            let pressure_alt = Length::new::<foot>(
                ((context.pressure_altitude().get::<foot>() * 2.).round() / 2.)
                    .clamp(-131072., 131072.),
            );

            // FIXME split sides and do the correction ourselves
            // FIXME this currently returns pressure alt when STD mode is selected on the FCU
            let baro_alt = Length::new::<foot>(
                ((context.indicated_altitude().get::<foot>() * 2.).round() / 2.)
                    .clamp(-131072., 131072.),
            );

            self.corrected_average_static_pressure
                .set_normal_operation_value(context.ambient_pressure());
            self.altitude.set_normal_operation_value(pressure_alt);
            self.baro_corrected_altitude_1
                .set_normal_operation_value(baro_alt);
            self.baro_corrected_altitude_2
                .set_normal_operation_value(baro_alt);
            self.barometric_vertical_speed
                .set_normal_operation_value(simulator_data.vertical_speed.get::<foot_per_minute>());

            // If CAS is below 30kn, output as 0 with SSM = NCD
            let computed_airspeed = context.indicated_airspeed();
            self.computed_airspeed.normal_above_threshold_ncd_otherwise(
                Velocity::new::<knot>(Self::MINIMUM_CAS),
                computed_airspeed,
            );

            // If mach is below 0.1, output as 0 with SSM = NCD
            self.mach.normal_above_threshold_ncd_otherwise(
                MachNumber::from(Self::MINIMUM_MACH),
                simulator_data.mach,
            );

            // If TAS is below 60 kts, output as 0 kt with SSM = NCD.
            self.true_airspeed.normal_above_threshold_ncd_otherwise(
                Velocity::new::<knot>(Self::MINIMUM_TAS),
                simulator_data.true_airspeed,
            );

            self.angle_of_attack.set_value(
                simulator_data.angle_of_attack,
                if computed_airspeed < Velocity::new::<knot>(Self::MINIMUM_CAS_FOR_AOA) {
                    SignStatus::NoComputedData
                } else {
                    SignStatus::NormalOperation
                },
            );

            self.total_air_temperature
                .set_normal_operation_value(simulator_data.total_air_temperature);
            self.static_air_temperature
                .set_normal_operation_value(context.ambient_temperature());
        }
    }

    fn is_initialised(&self) -> bool {
        self.remaining_initialisation_duration == Some(Duration::from_secs(0))
    }

    fn is_valid(&self) -> bool {
        self.is_on && self.is_initialised()
    }

    fn computed_airspeed_raw(&self) -> Velocity {
        self.computed_airspeed.value()
    }

    fn altitude(&self) -> Arinc429Word<Length> {
        Arinc429Word::new(self.altitude.value(), self.altitude.ssm())
    }

    fn baro_correction_1(&self) -> Arinc429Word<Pressure> {
        Arinc429Word::new(
            self.baro_correction_1_hpa.value(),
            self.baro_correction_1_hpa.ssm(),
        )
    }

    fn corrected_average_static_pressure(&self) -> Arinc429Word<Pressure> {
        Arinc429Word::new(
            self.corrected_average_static_pressure.value(),
            self.corrected_average_static_pressure.ssm(),
        )
    }
}
impl TrueAirspeedSource for AirDataReference {
    fn true_airspeed(&self) -> Arinc429Word<Velocity> {
        Arinc429Word::new(self.true_airspeed.value(), self.true_airspeed.ssm())
    }
}
impl SimulationElement for AirDataReference {
    fn write(&self, writer: &mut SimulatorWriter) {
        self.baro_correction_1_hpa
            .write_to_converted(writer, |value| value.get::<hectopascal>());
        self.baro_correction_1_inhg
            .write_to_converted(writer, |value| value.get::<inch_of_mercury>());
        self.baro_correction_2_hpa
            .write_to_converted(writer, |value| value.get::<hectopascal>());
        self.baro_correction_2_inhg
            .write_to_converted(writer, |value| value.get::<inch_of_mercury>());
        self.corrected_average_static_pressure
            .write_to_converted(writer, |value| value.get::<hectopascal>());
        self.altitude.write_to(writer);
        self.baro_corrected_altitude_1.write_to(writer);
        self.baro_corrected_altitude_2.write_to(writer);
        self.computed_airspeed.write_to(writer);
        self.mach.write_to(writer);
        self.barometric_vertical_speed.write_to(writer);
        self.true_airspeed.write_to(writer);
        self.static_air_temperature.write_to(writer);
        self.total_air_temperature.write_to(writer);
        self.angle_of_attack.write_to(writer);
    }
}

#[derive(Clone, Copy)]
enum AlignTime {
    Realistic = 0,
    Instant = 1,
    Fast = 2,
}

read_write_enum!(AlignTime);

impl From<f64> for AlignTime {
    fn from(value: f64) -> Self {
        match value as u8 {
            1 => AlignTime::Instant,
            2 => AlignTime::Fast,
            _ => AlignTime::Realistic,
        }
    }
}

bitflags! {
    #[derive(Default)]
    struct IrMaintFlags: u32 {
        const ALIGNMENT_NOT_READY = 0b0000000000000000001;
        const REV_ATT_MODE = 0b0000000000000000010;
        const NAV_MODE = 0b0000000000000000100;
        const VALID_SET_HEADING = 0b0000000000000001000;
        const ATTITUDE_INVALID = 0b0000000000000010000;
        const DC_FAIL = 0b0000000000000100000;
        const ON_DC = 0b0000000000001000000;
        const ADR_FAULT = 0b0000000000010000000;
        const IR_FAULT = 0b0000000000100000000;
        const DC_FAIL_ON_DC = 0b0000000001000000000;
        const ALIGN_FAULT = 0b0000000010000000000;
        const NO_IRS_INITIAL = 0b0000000100000000000;
        const EXCESS_MOTION_ERROR = 0b0000001000000000000;
        const ADR_IR_FAULT = 0b0000010000000000000;
        const EXTREME_LATITUDE = 0b0000100000000000000;
        const ALIGN_7_10_MINUTES = 0b0111000000000000000;
        const ALIGN_6_MINUTES = 0b0110000000000000000;
        const ALIGN_5_MINUTES = 0b0101000000000000000;
        const ALIGN_4_MINUTES = 0b0100000000000000000;
        const ALIGN_3_MINUTES = 0b0011000000000000000;
        const ALIGN_2_MINUTES = 0b0010000000000000000;
        const ALIGN_1_MINUTES = 0b0001000000000000000;
        const COMPUTED_LATITUDE_MISCOMPARE = 0b1000000000000000000;
    }
}

struct InertialReference {
    number: usize,
    is_on: bool,
    /// The remaining time to align, where 0 indicates the IR system is aligned.
    /// None indicates the IR system isn't aligning nor aligned.
    remaining_align_duration: Option<Duration>,
    ir_fault_flash_duration: Option<Duration>,
    remaining_attitude_initialisation_duration: Option<Duration>,
    wind_velocity: LowPassFilter<Vector2<f64>>,
    extreme_latitude: bool,

    pitch: AdirsData<Angle>,
    roll: AdirsData<Angle>,
    heading: AdirsData<Angle>,
    true_heading: AdirsData<Angle>,
    track: AdirsData<Angle>,
    true_track: AdirsData<Angle>,
    drift_angle: AdirsData<Angle>,
    flight_path_angle: AdirsData<Angle>,
    body_pitch_rate: AdirsData<AngularVelocity>,
    body_roll_rate: AdirsData<AngularVelocity>,
    body_yaw_rate: AdirsData<AngularVelocity>,
    body_longitudinal_acc: AdirsData<Ratio>,
    body_lateral_acc: AdirsData<Ratio>,
    body_normal_acc: AdirsData<Ratio>,
    heading_rate: AdirsData<AngularVelocity>,
    pitch_att_rate: AdirsData<AngularVelocity>,
    roll_att_rate: AdirsData<AngularVelocity>,
    vertical_speed: AdirsData<f64>,
    ground_speed: AdirsData<Velocity>,
    /// Label 016, 2 Hz [0, 256)
    wind_speed: AdirsData<Velocity>,
    /// label 015, 2 Hz, [0, 359]
    wind_direction: AdirsData<Angle>,
    /// Label 316, 10 Hz [0, 256)
    wind_speed_bnr: AdirsData<Velocity>,
    /// Label 315, 10 Hz (-180, 180]
    wind_direction_bnr: AdirsData<Angle>,
    latitude: AdirsData<Angle>,
    longitude: AdirsData<Angle>,
    maint_word: AdirsData<u32>,
}
impl InertialReference {
    const FAST_ALIGNMENT_TIME_IN_SECS: f64 = 90.;
    const IR_FAULT_FLASH_DURATION: Duration = Duration::from_millis(50);
    const ATTITUDE_INITIALISATION_DURATION: Duration = Duration::from_secs(28);
    const PITCH: &'static str = "PITCH";
    const ROLL: &'static str = "ROLL";
    const HEADING: &'static str = "HEADING";
    const TRUE_HEADING: &'static str = "TRUE_HEADING";
    const TRACK: &'static str = "TRACK";
    const TRUE_TRACK: &'static str = "TRUE_TRACK";
    const DRIFT_ANGLE: &'static str = "DRIFT_ANGLE";
    const FLIGHT_PATH_ANGLE: &'static str = "FLIGHT_PATH_ANGLE";
    const BODY_PITCH_RATE: &'static str = "BODY_PITCH_RATE";
    const BODY_ROLL_RATE: &'static str = "BODY_ROLL_RATE";
    const BODY_YAW_RATE: &'static str = "BODY_YAW_RATE";
    const BODY_LONGITUDINAL_ACC: &'static str = "BODY_LONGITUDINAL_ACC";
    const BODY_LATERAL_ACC: &'static str = "BODY_LATERAL_ACC";
    const BODY_NORMAL_ACC: &'static str = "BODY_NORMAL_ACC";
    const HEADING_RATE: &'static str = "HEADING_RATE";
    const PITCH_ATT_RATE: &'static str = "PITCH_ATT_RATE";
    const ROLL_ATT_RATE: &'static str = "ROLL_ATT_RATE";
    const VERTICAL_SPEED: &'static str = "VERTICAL_SPEED";
    const GROUND_SPEED: &'static str = "GROUND_SPEED";
    const WIND_DIRECTION: &'static str = "WIND_DIRECTION";
    const WIND_DIRECTION_BNR: &'static str = "WIND_DIRECTION_BNR";
    const WIND_SPEED: &'static str = "WIND_SPEED";
    const WIND_SPEED_BNR: &'static str = "WIND_SPEED_BNR";
    const LATITUDE: &'static str = "LATITUDE";
    const LONGITUDE: &'static str = "LONGITUDE";
    const MAINT_WORD: &'static str = "MAINT_WORD";
    const MINIMUM_TRUE_AIRSPEED_FOR_WIND_DETERMINATION_KNOTS: f64 = 100.;
    const MINIMUM_GROUND_SPEED_FOR_TRACK_KNOTS: f64 = 50.;

    const WIND_VELOCITY_TIME_CONSTANT: Duration = Duration::from_millis(100);

    fn new(context: &mut InitContext, number: usize) -> Self {
        Self {
            number,
            is_on: true,
            // We start in an aligned state to support starting on the
            // runway or in the air.
            remaining_align_duration: Some(Duration::from_secs(0)),
            ir_fault_flash_duration: None,
            // Start fully initialised.
            remaining_attitude_initialisation_duration: Some(Duration::from_secs(0)),
            wind_velocity: LowPassFilter::new(Self::WIND_VELOCITY_TIME_CONSTANT),
            extreme_latitude: false,

            pitch: AdirsData::new_ir(context, number, Self::PITCH),
            roll: AdirsData::new_ir(context, number, Self::ROLL),
            heading: AdirsData::new_ir(context, number, Self::HEADING),
            true_heading: AdirsData::new_ir(context, number, Self::TRUE_HEADING),
            track: AdirsData::new_ir(context, number, Self::TRACK),
            true_track: AdirsData::new_ir(context, number, Self::TRUE_TRACK),
            drift_angle: AdirsData::new_ir(context, number, Self::DRIFT_ANGLE),
            flight_path_angle: AdirsData::new_ir(context, number, Self::FLIGHT_PATH_ANGLE),
            body_pitch_rate: AdirsData::new_ir(context, number, Self::BODY_PITCH_RATE),
            body_roll_rate: AdirsData::new_ir(context, number, Self::BODY_ROLL_RATE),
            body_yaw_rate: AdirsData::new_ir(context, number, Self::BODY_YAW_RATE),
            body_longitudinal_acc: AdirsData::new_ir(context, number, Self::BODY_LONGITUDINAL_ACC),
            body_lateral_acc: AdirsData::new_ir(context, number, Self::BODY_LATERAL_ACC),
            body_normal_acc: AdirsData::new_ir(context, number, Self::BODY_NORMAL_ACC),
            heading_rate: AdirsData::new_ir(context, number, Self::HEADING_RATE),
            pitch_att_rate: AdirsData::new_ir(context, number, Self::PITCH_ATT_RATE),
            roll_att_rate: AdirsData::new_ir(context, number, Self::ROLL_ATT_RATE),
            vertical_speed: AdirsData::new_ir(context, number, Self::VERTICAL_SPEED),
            ground_speed: AdirsData::new_ir(context, number, Self::GROUND_SPEED),
            wind_direction: AdirsData::new_ir(context, number, Self::WIND_DIRECTION),
            wind_direction_bnr: AdirsData::new_ir(context, number, Self::WIND_DIRECTION_BNR),
            wind_speed: AdirsData::new_ir(context, number, Self::WIND_SPEED),
            wind_speed_bnr: AdirsData::new_ir(context, number, Self::WIND_SPEED_BNR),
            latitude: AdirsData::new_ir(context, number, Self::LATITUDE),
            longitude: AdirsData::new_ir(context, number, Self::LONGITUDE),
            /// label 270
            maint_word: AdirsData::new_ir(context, number, Self::MAINT_WORD),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        true_airspeed_source: &impl TrueAirspeedSource,
        overhead: &AirDataInertialReferenceSystemOverheadPanel,
        configured_align_time: AlignTime,
        simulator_data: AdirsSimulatorData,
    ) {
        self.is_on = overhead.ir_is_on(self.number);

        self.update_fault_flash_duration(context, overhead);
        self.update_remaining_attitude_align_duration(context, overhead);
        self.update_remaining_align_duration(
            context,
            overhead,
            configured_align_time,
            simulator_data,
        );

        self.update_latitude(simulator_data);
        self.update_attitude_values(context, simulator_data);
        self.update_heading_values(overhead, simulator_data);
        self.update_non_attitude_values(context, true_airspeed_source, overhead, simulator_data);
        self.update_maint_word(overhead);
    }

    fn update_fault_flash_duration(
        &mut self,
        context: &UpdateContext,
        overhead: &AirDataInertialReferenceSystemOverheadPanel,
    ) {
        if self.alignment_starting(overhead.mode_of(self.number)) {
            self.ir_fault_flash_duration = Some(Self::IR_FAULT_FLASH_DURATION);
        } else if let Some(flash_duration) = self.ir_fault_flash_duration {
            let remaining = subtract_delta_from_duration(context, flash_duration);
            self.ir_fault_flash_duration = if remaining > Duration::from_secs(0) {
                Some(remaining)
            } else {
                None
            };
        }
    }

    fn update_remaining_attitude_align_duration(
        &mut self,
        context: &UpdateContext,
        overhead: &AirDataInertialReferenceSystemOverheadPanel,
    ) {
        self.remaining_attitude_initialisation_duration = remaining_initialisation_duration(
            context,
            Self::ATTITUDE_INITIALISATION_DURATION,
            overhead.mode_of(self.number),
            self.remaining_attitude_initialisation_duration,
        );
    }

    fn update_remaining_align_duration(
        &mut self,
        context: &UpdateContext,
        overhead: &AirDataInertialReferenceSystemOverheadPanel,
        configured_align_time: AlignTime,
        simulator_data: AdirsSimulatorData,
    ) {
        // If the  align time setting has been changed to instant during alignment,
        // then set remaining time to 0. This allows to implement a "Instant Align" button in the EFB
        // for users who want to align the ADIRS instantly but do not want to change the default
        // setting and restart the flight.
        if let AlignTime::Instant = configured_align_time {
            self.remaining_align_duration = Some(Duration::from_secs_f64(0.));
        }

        self.remaining_align_duration = match overhead.mode_of(self.number) {
            InertialReferenceMode::Navigation => match self.remaining_align_duration {
                Some(remaining) => Some(subtract_delta_from_duration(context, remaining)),
                None => Some(Self::total_alignment_duration(
                    configured_align_time,
                    simulator_data.latitude,
                )),
            },
            InertialReferenceMode::Off | InertialReferenceMode::Attitude => None,
        };
    }

    fn update_latitude(&mut self, simulator_data: AdirsSimulatorData) {
        let latitude = simulator_data.latitude.get::<degree>();
        let longitude = simulator_data.longitude.get::<degree>();

        let hysteresis_sign = if self.extreme_latitude { 1. } else { -1. };

        self.extreme_latitude = !((-60. + hysteresis_sign * 0.5) <= latitude
            && (latitude <= (73. - hysteresis_sign * 0.5)
                || (latitude <= (82. - hysteresis_sign * 0.5)
                    && (longitude <= (-120. - hysteresis_sign * 2.5)
                        || longitude >= (-90. + hysteresis_sign * 2.5)))))
    }

    fn update_attitude_values(
        &mut self,
        context: &UpdateContext,
        simulator_data: AdirsSimulatorData,
    ) {
        let ssm = if self.is_on && self.is_attitude_aligned() {
            SignStatus::NormalOperation
        } else {
            SignStatus::NoComputedData
        };
        // Calculate the attitudes and body rotation rates.
        // Correct the signs so that they conform to standard aeronautical norms.
        let pitch = -simulator_data.pitch;
        let roll = -simulator_data.roll;
        self.pitch.set_value(pitch, ssm);
        self.roll.set_value(roll, ssm);

        let p = -simulator_data.body_rotation_rate_z;
        let q = -simulator_data.body_rotation_rate_x;
        let r = simulator_data.body_rotation_rate_y;
        self.body_roll_rate.set_value(p, ssm);
        self.body_pitch_rate.set_value(q, ssm);
        self.body_yaw_rate.set_value(r, ssm);

        // Calculate attitude rates, by applying the inverse body coordinate transformation matrix.
        self.heading_rate.set_value(
            (r * V::from(roll.cos()) + q * V::from(roll.sin())) / V::from(pitch.cos()),
            ssm,
        );
        self.pitch_att_rate
            .set_value(q * V::from(roll.cos()) - r * V::from(roll.sin()), ssm);
        self.roll_att_rate.set_value(
            p + (q * V::from(roll.sin()) + r * V::from(roll.cos())) * V::from(pitch.tan()),
            ssm,
        );

        // Calculate the body accelerations as measured by the IRS accelerometers.
        // The sim only gives the acceleration vector without gravity, so we have to calculate and add the gravity vector
        // based on Theta and Phi.
        let g = Acceleration::new::<meter_per_second_squared>(9.81);
        self.body_longitudinal_acc
            .set_value(context.long_accel() / g - pitch.cos(), ssm);
        self.body_lateral_acc
            .set_value(context.lat_accel() / g + pitch.cos() * roll.sin(), ssm);
        self.body_normal_acc
            .set_value(context.vert_accel() / g + pitch.cos() * roll.cos(), ssm);
    }

    fn update_heading_values(
        &mut self,
        overhead: &AirDataInertialReferenceSystemOverheadPanel,
        simulator_data: AdirsSimulatorData,
    ) {
        // TODO BNR labels (that most things use) are actually +/- 180

        // TODO tests for when should be mag or true in mag labels

        let heading_available = self.is_on
            && (self.is_fully_aligned()
                || (overhead.mode_of(self.number) == InertialReferenceMode::Navigation
                    && self
                        .remaining_align_duration
                        .map_or(false, |duration| duration.as_secs() < 120)));

        let true_heading_ssm = if heading_available {
            SignStatus::NormalOperation
        } else {
            SignStatus::NoComputedData
        };
        self.true_heading
            .set_value(simulator_data.true_heading, true_heading_ssm);

        // TODO in ATT mode NCD until heading initialised on MCDU
        let magnetic_heading_ssm = if self.is_on
            && (heading_available
                || (overhead.mode_of(self.number) == InertialReferenceMode::Attitude
                    && self.is_attitude_aligned()))
        {
            SignStatus::NormalOperation
        } else {
            SignStatus::NoComputedData
        };
        self.heading.set_value(
            if self.has_magnetic_data() {
                simulator_data.heading
            } else {
                simulator_data.true_heading
            },
            magnetic_heading_ssm,
        );
    }

    fn update_wind_velocity(
        &mut self,
        context: &UpdateContext,
        true_airspeed_source: &impl TrueAirspeedSource,
        overhead: &AirDataInertialReferenceSystemOverheadPanel,
        simulator_data: AdirsSimulatorData,
    ) {
        // In ATT mode these labels are not even transmitted
        // In Align, NCD prior to NAV

        let no_transmission = match overhead.mode_of(self.number) {
            InertialReferenceMode::Navigation => false,
            InertialReferenceMode::Off | InertialReferenceMode::Attitude => true,
        } || !self.is_on;

        // The IR does not compute the wind if the TAS is less than 100 knots or NCD
        let true_airspeed_above_minimum_threshold = true_airspeed_source
            .true_airspeed()
            .is_normal_operation()
            && true_airspeed_source.true_airspeed().value()
                >= Velocity::new::<knot>(Self::MINIMUM_TRUE_AIRSPEED_FOR_WIND_DETERMINATION_KNOTS);

        let ssm = if no_transmission {
            SignStatus::FailureWarning // TODO should be no transmission
        } else if true_airspeed_above_minimum_threshold && self.is_fully_aligned() {
            SignStatus::NormalOperation
        } else {
            SignStatus::NoComputedData
        };

        // if conditions are valid to calculate wind, we do so, otherwise we send zero
        let mut wind_direction: f64 = 0.;
        let mut wind_speed: f64 = 0.;

        if true_airspeed_above_minimum_threshold && !no_transmission && self.is_fully_aligned() {
            // should be label 324 from IR
            let pitch_angle = simulator_data.pitch;

            // should be tas label xx from ADR, hdg label 314 from IR, pitch angle label 324 from IR
            let tas_vector = Vector2::new(
                simulator_data.true_airspeed.get::<knot>()
                    * simulator_data.true_heading.sin().get::<ratio>(),
                simulator_data.true_airspeed.get::<knot>()
                    * simulator_data.true_heading.cos().get::<ratio>(),
            ) * pitch_angle.cos().get::<ratio>();

            // should be label 367/366 from ADR
            let gs_vector = Vector2::new(
                simulator_data.ground_speed.get::<knot>()
                    * simulator_data.true_track.sin().get::<ratio>(),
                simulator_data.ground_speed.get::<knot>()
                    * simulator_data.true_track.cos().get::<ratio>(),
            );

            self.wind_velocity
                .update(context.delta(), gs_vector - tas_vector);

            wind_speed = self
                .wind_velocity
                .output()
                .magnitude()
                .clamp(0., 255.)
                .round();

            let direction =
                Rotation2::rotation_between(&self.wind_velocity.output(), &Vector2::y());
            wind_direction = (Angle::new::<radian>(direction.angle()).normalised()
                + Angle::HALF_TURN)
                .normalised()
                .get::<degree>();
        } else {
            self.wind_velocity.reset(Vector2::default());
        }

        // set all the labels...
        // TODO build out bus implementation for correct period, bnr/bcd encoding and no transmission state
        self.wind_direction
            .set_value(Angle::new::<degree>(wind_direction.round()), ssm);

        self.wind_direction_bnr.set_value(
            Angle::new::<degree>(
                (if wind_direction > 180. {
                    wind_direction - 360.
                } else {
                    wind_direction
                } / 0.05)
                    .round()
                    * 0.05,
            ),
            ssm,
        );

        self.wind_speed
            .set_value(Velocity::new::<knot>(wind_speed), ssm);

        self.wind_speed_bnr
            .set_value(Velocity::new::<knot>(wind_speed), ssm);
    }

    fn update_non_attitude_values(
        &mut self,
        context: &UpdateContext,
        true_airspeed_source: &impl TrueAirspeedSource,
        overhead: &AirDataInertialReferenceSystemOverheadPanel,
        simulator_data: AdirsSimulatorData,
    ) {
        let ssm = if self.is_on && self.is_fully_aligned() {
            SignStatus::NormalOperation
        } else {
            SignStatus::NoComputedData
        };

        let ground_speed_above_minimum_threshold = simulator_data.ground_speed
            >= Velocity::new::<knot>(Self::MINIMUM_GROUND_SPEED_FOR_TRACK_KNOTS);

        let track = if self.has_magnetic_data() {
            simulator_data.track
        } else {
            simulator_data.true_track
        };

        let heading = if self.has_magnetic_data() {
            simulator_data.heading
        } else {
            simulator_data.true_heading
        };

        self.track.set_value(
            if ground_speed_above_minimum_threshold {
                track
            } else {
                heading
            },
            ssm,
        );

        if ground_speed_above_minimum_threshold {
            self.true_track.set_value(simulator_data.true_track, ssm);
        } else {
            self.true_track.set_from(&self.true_heading);
        }

        self.drift_angle.set_value(
            if ground_speed_above_minimum_threshold {
                let diff = simulator_data.track - simulator_data.heading;
                if diff > Angle::new::<degree>(180.) {
                    diff - Angle::new::<degree>(360.)
                } else if diff < Angle::new::<degree>(-180.) {
                    diff + Angle::new::<degree>(360.)
                } else {
                    diff
                }
            } else {
                Angle::new::<degree>(0.)
            },
            ssm,
        );
        self.flight_path_angle.set_value(
            if ground_speed_above_minimum_threshold {
                simulator_data
                    .vertical_speed
                    .atan2(simulator_data.ground_speed)
            } else {
                Angle::new::<degree>(0.)
            },
            ssm,
        );

        self.vertical_speed
            .set_value(simulator_data.vertical_speed.get::<foot_per_minute>(), ssm);
        self.ground_speed
            .set_value(simulator_data.ground_speed, ssm);

        self.latitude.set_value(simulator_data.latitude, ssm);
        self.longitude.set_value(simulator_data.longitude, ssm);

        self.update_wind_velocity(context, true_airspeed_source, overhead, simulator_data);
    }

    fn update_maint_word(&mut self, overhead: &AirDataInertialReferenceSystemOverheadPanel) {
        // TODO check status of these during mode transitions (first need to implement mode FSM)
        let mut maint_word: IrMaintFlags = IrMaintFlags::default();

        if !self.is_on {
            // FIXME should be no transmission (can we just do this at a higher level...)
            self.maint_word
                .set_value(maint_word.bits(), SignStatus::FailureWarning);
            return;
        }

        if !self.is_fully_aligned() {
            maint_word |= IrMaintFlags::ALIGNMENT_NOT_READY;
        }

        if overhead.mode_of(self.number) == InertialReferenceMode::Attitude {
            maint_word |= IrMaintFlags::REV_ATT_MODE;
        }

        if self.is_fully_aligned() {
            maint_word |= IrMaintFlags::NAV_MODE;
        }

        // TODO request heading setting in att mode if not set

        // TODO attitude invalid fault

        // TODO dc < 18 V

        // TODO on DC (re-implement ON BAT light properly at the same time)

        // TODO ADR input data fault

        // TODO unimportant nav fault

        // TODO DC fault during DC operation last power up

        // TODO align fault

        // TODO No IRS initial pos

        // TODO excess motion during align

        // TODO ADR data not received or parity error

        if self.extreme_latitude {
            maint_word |= IrMaintFlags::EXTREME_LATITUDE;
        }

        maint_word |= match self
            .remaining_align_duration()
            .map(|duration| duration.as_secs())
        {
            Some(1..=60) => IrMaintFlags::ALIGN_1_MINUTES,
            Some(61..=120) => IrMaintFlags::ALIGN_2_MINUTES,
            Some(121..=180) => IrMaintFlags::ALIGN_3_MINUTES,
            Some(181..=240) => IrMaintFlags::ALIGN_4_MINUTES,
            Some(241..=300) => IrMaintFlags::ALIGN_5_MINUTES,
            Some(301..=360) => IrMaintFlags::ALIGN_6_MINUTES,
            Some(361..) => IrMaintFlags::ALIGN_7_10_MINUTES,
            Some(0) | None => IrMaintFlags::default(),
        };

        // TODO sin/cos test discrepancy

        self.maint_word
            .set_value(maint_word.bits(), SignStatus::NormalOperation);

        // TODO tests!
    }

    fn alignment_starting(&self, selected_mode: InertialReferenceMode) -> bool {
        selected_mode != InertialReferenceMode::Off
            && self.remaining_attitude_initialisation_duration.is_none()
    }

    fn total_alignment_duration(configured_align_time: AlignTime, latitude: Angle) -> Duration {
        Duration::from_secs_f64(match configured_align_time {
            AlignTime::Realistic => ((latitude.get::<degree>().powi(2)) * 0.095) + 310.,
            AlignTime::Instant => 0.,
            AlignTime::Fast => Self::FAST_ALIGNMENT_TIME_IN_SECS,
        })
    }

    fn is_fully_aligned(&self) -> bool {
        self.remaining_align_duration == Some(Duration::from_secs(0))
    }

    fn is_on(&self) -> bool {
        self.is_on
    }

    fn is_aligning(&self) -> bool {
        match self.remaining_align_duration.as_ref() {
            Some(remaining) => *remaining > Duration::from_secs(0),
            None => false,
        }
    }

    fn remaining_align_duration(&self) -> Option<Duration> {
        self.remaining_align_duration
    }

    fn is_attitude_aligned(&self) -> bool {
        self.remaining_attitude_initialisation_duration == Some(Duration::from_secs(0))
    }

    fn has_fault(&self) -> bool {
        self.ir_fault_flash_duration.is_some()
    }

    fn has_magnetic_data(&self) -> bool {
        !self.extreme_latitude
    }

    fn latitude(&self) -> Arinc429Word<Angle> {
        Arinc429Word::new(self.latitude.value(), self.latitude.ssm())
    }

    fn longitude(&self) -> Arinc429Word<Angle> {
        Arinc429Word::new(self.longitude.value(), self.longitude.ssm())
    }

    fn heading(&self) -> Arinc429Word<Angle> {
        Arinc429Word::new(self.heading.value(), self.heading.ssm())
    }

    fn true_heading(&self) -> Arinc429Word<Angle> {
        Arinc429Word::new(self.true_heading.value(), self.true_heading.ssm())
    }

    fn vertical_speed(&self) -> Arinc429Word<Velocity> {
        Arinc429Word::new(
            Velocity::new::<foot_per_minute>(self.vertical_speed.value()),
            self.vertical_speed.ssm(),
        )
    }

    fn ground_speed(&self) -> Arinc429Word<Velocity> {
        Arinc429Word::new(self.ground_speed.value(), self.ground_speed.ssm())
    }
}
impl SimulationElement for InertialReference {
    fn write(&self, writer: &mut SimulatorWriter) {
        self.pitch.write_to(writer);
        self.roll.write_to(writer);

        self.heading.write_to(writer);
        self.true_heading.write_to(writer);
        self.track.write_to(writer);
        self.true_track.write_to(writer);
        self.drift_angle.write_to(writer);
        self.flight_path_angle.write_to(writer);
        self.body_pitch_rate
            .write_to_converted(writer, |value| value.get::<degree_per_second>());
        self.body_roll_rate
            .write_to_converted(writer, |value| value.get::<degree_per_second>());
        self.body_yaw_rate
            .write_to_converted(writer, |value| value.get::<degree_per_second>());
        self.body_longitudinal_acc
            .write_to_converted(writer, |value| value.get::<ratio>());
        self.body_lateral_acc
            .write_to_converted(writer, |value| value.get::<ratio>());
        self.body_normal_acc
            .write_to_converted(writer, |value| value.get::<ratio>());
        self.heading_rate
            .write_to_converted(writer, |value| value.get::<degree_per_second>());
        self.pitch_att_rate
            .write_to_converted(writer, |value| value.get::<degree_per_second>());
        self.roll_att_rate
            .write_to_converted(writer, |value| value.get::<degree_per_second>());
        self.vertical_speed.write_to(writer);
        self.ground_speed.write_to(writer);
        self.wind_direction.write_to(writer);
        self.wind_direction_bnr.write_to(writer);
        self.wind_speed.write_to(writer);
        self.wind_speed_bnr.write_to(writer);
        self.latitude.write_to(writer);
        self.longitude.write_to(writer);
        self.maint_word.write_to(writer);
    }
}

fn remaining_initialisation_duration(
    context: &UpdateContext,
    starting_initialisation_duration: Duration,
    mode: InertialReferenceMode,
    remaining: Option<Duration>,
) -> Option<Duration> {
    match mode {
        InertialReferenceMode::Navigation | InertialReferenceMode::Attitude => match remaining {
            Some(remaining) => Some(subtract_delta_from_duration(context, remaining)),
            None => Some(starting_initialisation_duration),
        },
        InertialReferenceMode::Off => None,
    }
}

fn subtract_delta_from_duration(context: &UpdateContext, duration: Duration) -> Duration {
    Duration::from_secs_f64((duration.as_secs_f64() - context.delta_as_secs_f64()).max(0.))
}

trait NormaliseAngleExt {
    fn normalised(self) -> Angle;
    fn normalised_180(self) -> Angle;
}

impl NormaliseAngleExt for Angle {
    /// Create a new angle by normalizing the value into the range of
    /// [0, 2π) rad.
    #[inline]
    fn normalised(self) -> Angle {
        if self < Angle::FULL_TURN && self >= Angle::default() {
            self
        } else {
            let v = self % Angle::FULL_TURN;

            if v >= Angle::default() {
                v
            } else {
                v + Angle::FULL_TURN
            }
        }
    }

    /// Create a new angle by normalizing the value into the range of
    /// [-π, π) rad.
    #[inline]
    fn normalised_180(self) -> Angle {
        if self < Angle::HALF_TURN && self >= -Angle::HALF_TURN {
            self
        } else {
            let v = self % Angle::FULL_TURN;

            if v < Angle::HALF_TURN {
                v
            } else {
                v - Angle::FULL_TURN
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::simulation::test::{ReadByName, WriteByName};
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
    use uom::si::{
        angle::degree,
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
            adirs_test_bed.move_all_mode_selectors_to(InertialReferenceMode::Navigation);

            adirs_test_bed
        }

        fn and(self) -> Self {
            self
        }

        fn then_continue_with(self) -> Self {
            self
        }

        fn wait_for_alignment_of(mut self, adiru_number: usize) -> Self {
            while self.align_state(adiru_number) != AlignState::Aligned {
                self.run();
            }

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

        fn vertical_speed_of(mut self, velocity: Velocity) -> Self {
            self.write_by_name(
                AdirsSimulatorData::VERTICAL_SPEED,
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
                InertialReference::MINIMUM_TRUE_AIRSPEED_FOR_WIND_DETERMINATION_KNOTS + 10.,
            );
            let heading = Angle::new::<degree>(0.);

            let gs = Velocity::new::<knot>(
                ((velocity.get::<knot>() * (angle + Angle::HALF_TURN).sin().get::<ratio>())
                    .powi(2)
                    + (tas.get::<knot>()
                        + velocity.get::<knot>()
                            * (angle + Angle::HALF_TURN).cos().get::<ratio>())
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
            self.write_by_name(
                AdirsSimulatorData::BARO_CORRECTION_1_HPA,
                altimeter.get::<hectopascal>(),
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

        fn ir_mode_selector_set_to(mut self, number: usize, mode: InertialReferenceMode) -> Self {
            WriteByName::<AdirsTestBed, f64>::write_by_name(
                &mut self,
                &InertialReferenceModeSelector::mode_id(number),
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
            self.move_all_mode_selectors_to(InertialReferenceMode::Off);
            self.run_without_delta();
            self
        }

        fn move_all_mode_selectors_to(&mut self, mode: InertialReferenceMode) {
            for number in 1..=3 {
                self.write_by_name(&InertialReferenceModeSelector::mode_id(number), mode);
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
                AirDataReference::CORRECTED_AVERAGE_STATIC_PRESSURE,
            ))
        }

        fn baro_correction_1_hpa(&mut self, adiru_number: usize) -> Arinc429Word<f64> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Adr,
                adiru_number,
                AirDataReference::BARO_CORRECTION_1_HPA,
            ))
        }

        fn baro_correction_1_inhg(&mut self, adiru_number: usize) -> Arinc429Word<f64> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Adr,
                adiru_number,
                AirDataReference::BARO_CORRECTION_1_INHG,
            ))
        }

        fn baro_correction_2_hpa(&mut self, adiru_number: usize) -> Arinc429Word<f64> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Adr,
                adiru_number,
                AirDataReference::BARO_CORRECTION_2_HPA,
            ))
        }

        fn baro_correction_2_inhg(&mut self, adiru_number: usize) -> Arinc429Word<f64> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Adr,
                adiru_number,
                AirDataReference::BARO_CORRECTION_2_INHG,
            ))
        }

        /// pressure altitude
        fn altitude(&mut self, adiru_number: usize) -> Arinc429Word<Length> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Adr,
                adiru_number,
                AirDataReference::ALTITUDE,
            ))
        }

        /// baro corrected altitude for captain's side
        fn baro_corrected_altitude_1(&mut self, adiru_number: usize) -> Arinc429Word<Length> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Adr,
                adiru_number,
                AirDataReference::BARO_CORRECTED_ALTITUDE_1,
            ))
        }

        /// baro corrected altitude for fo's side
        fn baro_corrected_altitude_2(&mut self, adiru_number: usize) -> Arinc429Word<Length> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Adr,
                adiru_number,
                AirDataReference::BARO_CORRECTED_ALTITUDE_2,
            ))
        }

        fn computed_airspeed(&mut self, adiru_number: usize) -> Arinc429Word<Velocity> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Adr,
                adiru_number,
                AirDataReference::COMPUTED_AIRSPEED,
            ))
        }

        fn mach(&mut self, adiru_number: usize) -> Arinc429Word<MachNumber> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Adr,
                adiru_number,
                AirDataReference::MACH,
            ))
        }

        fn barometric_vertical_speed(&mut self, adiru_number: usize) -> Arinc429Word<Velocity> {
            let vertical_speed: Arinc429Word<f64> = self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Adr,
                adiru_number,
                AirDataReference::BAROMETRIC_VERTICAL_SPEED,
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
                AirDataReference::TRUE_AIRSPEED,
            ))
        }

        fn static_air_temperature(
            &mut self,
            adiru_number: usize,
        ) -> Arinc429Word<ThermodynamicTemperature> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Adr,
                adiru_number,
                AirDataReference::STATIC_AIR_TEMPERATURE,
            ))
        }

        fn total_air_temperature(
            &mut self,
            adiru_number: usize,
        ) -> Arinc429Word<ThermodynamicTemperature> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Adr,
                adiru_number,
                AirDataReference::TOTAL_AIR_TEMPERATURE,
            ))
        }

        fn angle_of_attack(&mut self, adiru_number: usize) -> Arinc429Word<Angle> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Adr,
                adiru_number,
                AirDataReference::ANGLE_OF_ATTACK,
            ))
        }

        fn pitch(&mut self, adiru_number: usize) -> Arinc429Word<Angle> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Ir,
                adiru_number,
                InertialReference::PITCH,
            ))
        }

        fn roll(&mut self, adiru_number: usize) -> Arinc429Word<Angle> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Ir,
                adiru_number,
                InertialReference::ROLL,
            ))
        }

        fn heading(&mut self, adiru_number: usize) -> Arinc429Word<Angle> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Ir,
                adiru_number,
                InertialReference::HEADING,
            ))
        }

        fn true_heading(&mut self, adiru_number: usize) -> Arinc429Word<Angle> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Ir,
                adiru_number,
                InertialReference::TRUE_HEADING,
            ))
        }

        fn track(&mut self, adiru_number: usize) -> Arinc429Word<Angle> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Ir,
                adiru_number,
                InertialReference::TRACK,
            ))
        }

        fn true_track(&mut self, adiru_number: usize) -> Arinc429Word<Angle> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Ir,
                adiru_number,
                InertialReference::TRUE_TRACK,
            ))
        }

        fn drift_angle(&mut self, adiru_number: usize) -> Arinc429Word<Angle> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Ir,
                adiru_number,
                InertialReference::DRIFT_ANGLE,
            ))
        }

        fn flight_path_angle(&mut self, adiru_number: usize) -> Arinc429Word<Angle> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Ir,
                adiru_number,
                InertialReference::FLIGHT_PATH_ANGLE,
            ))
        }

        fn body_pitch_rate(&mut self, adiru_number: usize) -> Arinc429Word<AngularVelocity> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Ir,
                adiru_number,
                InertialReference::BODY_PITCH_RATE,
            ))
        }

        fn body_roll_rate(&mut self, adiru_number: usize) -> Arinc429Word<AngularVelocity> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Ir,
                adiru_number,
                InertialReference::BODY_ROLL_RATE,
            ))
        }

        fn body_yaw_rate(&mut self, adiru_number: usize) -> Arinc429Word<AngularVelocity> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Ir,
                adiru_number,
                InertialReference::BODY_YAW_RATE,
            ))
        }

        fn body_long_acc(&mut self, adiru_number: usize) -> Arinc429Word<Ratio> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Ir,
                adiru_number,
                InertialReference::BODY_LONGITUDINAL_ACC,
            ))
        }

        fn body_lat_acc(&mut self, adiru_number: usize) -> Arinc429Word<Ratio> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Ir,
                adiru_number,
                InertialReference::BODY_LATERAL_ACC,
            ))
        }

        fn body_normal_acc(&mut self, adiru_number: usize) -> Arinc429Word<Ratio> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Ir,
                adiru_number,
                InertialReference::BODY_NORMAL_ACC,
            ))
        }

        fn pitch_att_rate(&mut self, adiru_number: usize) -> Arinc429Word<Angle> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Ir,
                adiru_number,
                InertialReference::PITCH_ATT_RATE,
            ))
        }

        fn roll_att_rate(&mut self, adiru_number: usize) -> Arinc429Word<Angle> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Ir,
                adiru_number,
                InertialReference::ROLL_ATT_RATE,
            ))
        }

        fn heading_rate(&mut self, adiru_number: usize) -> Arinc429Word<Angle> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Ir,
                adiru_number,
                InertialReference::HEADING_RATE,
            ))
        }

        fn ground_speed(&mut self, adiru_number: usize) -> Arinc429Word<Velocity> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Ir,
                adiru_number,
                InertialReference::GROUND_SPEED,
            ))
        }

        fn wind_direction(&mut self, adiru_number: usize) -> Arinc429Word<Angle> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Ir,
                adiru_number,
                InertialReference::WIND_DIRECTION,
            ))
        }

        fn wind_direction_bnr(&mut self, adiru_number: usize) -> Arinc429Word<Angle> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Ir,
                adiru_number,
                InertialReference::WIND_DIRECTION_BNR,
            ))
        }

        fn wind_speed(&mut self, adiru_number: usize) -> Arinc429Word<Velocity> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Ir,
                adiru_number,
                InertialReference::WIND_SPEED,
            ))
        }

        fn wind_speed_bnr(&mut self, adiru_number: usize) -> Arinc429Word<Velocity> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Ir,
                adiru_number,
                InertialReference::WIND_SPEED_BNR,
            ))
        }

        fn inertial_vertical_speed(&mut self, adiru_number: usize) -> Arinc429Word<Velocity> {
            let vertical_speed: Arinc429Word<f64> = self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Ir,
                adiru_number,
                InertialReference::VERTICAL_SPEED,
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
                InertialReference::LONGITUDE,
            ))
        }

        fn latitude(&mut self, adiru_number: usize) -> Arinc429Word<Angle> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Ir,
                adiru_number,
                InertialReference::LATITUDE,
            ))
        }

        fn maint_word(&mut self, adiru_number: usize) -> Arinc429Word<u32> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Ir,
                adiru_number,
                InertialReference::MAINT_WORD,
            ))
        }

        fn uses_gps_as_primary(&mut self) -> bool {
            self.read_by_name(AirDataInertialReferenceSystem::USES_GPS_AS_PRIMARY_KEY)
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

        fn realistic_navigation_align_until(
            mut self,
            adiru_number: usize,
            duration: Duration,
        ) -> Self {
            self = self
                .align_time_configured_as(AlignTime::Realistic)
                .and()
                .ir_mode_selector_set_to(adiru_number, InertialReferenceMode::Navigation);

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
        // TODO: Once the ADIRUs are split, this unit test needs to be modified to test all
        // ADIRUs individually.
        let mut test_bed =
            test_bed_with().ir_mode_selector_set_to(adiru_number, InertialReferenceMode::Off);

        test_bed.run_with_delta(Duration::from_secs(0));

        assert!(!test_bed.is_aligned(adiru_number));
        assert!(!test_bed.is_aligning(adiru_number));
        let maint_word_flags = IrMaintFlags::from_bits(test_bed.maint_word(adiru_number).value());
        assert_eq!(
            maint_word_flags.unwrap() & IrMaintFlags::ALIGNMENT_NOT_READY,
            IrMaintFlags::ALIGNMENT_NOT_READY
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
            .ir_mode_selector_set_to(adiru_number, InertialReferenceMode::Navigation);

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
            .ir_mode_selector_set_to(adiru_number, InertialReferenceMode::Navigation);

        // Set the state without any time passing to be able to measure exact time afterward.
        test_bed.run_with_delta(Duration::from_secs(0));

        test_bed.run_with_delta(Duration::from_secs_f64(
            InertialReference::FAST_ALIGNMENT_TIME_IN_SECS - 1.,
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
    #[case(Angle::new::<degree>(90.))]
    #[case(Angle::new::<degree>(-90.))]
    fn adirs_aligns_quicker_near_equator_than_near_the_poles_when_configured_align_time_is_realistic(
        #[case] polar_latitude: Angle,
    ) {
        let mut test_bed = align_at_latitude(Angle::new::<degree>(0.));
        let equator_alignment_time = test_bed.remaining_alignment_time();

        let mut test_bed = align_at_latitude(polar_latitude);
        let south_pole_alignment_time = test_bed.remaining_alignment_time();

        assert!(equator_alignment_time < south_pole_alignment_time);
    }

    fn align_at_latitude(latitude: Angle) -> AdirsTestBed {
        let mut test_bed = test_bed_with()
            .align_time_configured_as(AlignTime::Realistic)
            .latitude_of(latitude)
            .and()
            .ir_mode_selector_set_to(1, InertialReferenceMode::Navigation);

        test_bed.run();
        test_bed
    }

    #[rstest]
    #[case(InertialReferenceMode::Navigation)]
    #[case(InertialReferenceMode::Attitude)]
    fn ir_fault_light_briefly_flashes_when_moving_mode_selector_from_off_to(
        #[case] mode: InertialReferenceMode,
    ) {
        let mut test_bed = test_bed_with().ir_mode_selector_set_to(1, mode);

        test_bed.run_without_delta();
        assert!(test_bed.ir_fault_light_illuminated(1));

        test_bed
            .run_with_delta(InertialReference::IR_FAULT_FLASH_DURATION - Duration::from_millis(1));
        assert!(test_bed.ir_fault_light_illuminated(1));

        test_bed.run_with_delta(Duration::from_millis(1));
        assert!(!test_bed.ir_fault_light_illuminated(1));
    }

    #[test]
    fn ir_fault_light_doesnt_briefly_flash_when_moving_mode_selector_between_nav_and_att() {
        let mut test_bed =
            test_bed_with().ir_mode_selector_set_to(1, InertialReferenceMode::Navigation);
        test_bed.run_without_delta();
        test_bed.run();

        test_bed = test_bed
            .then_continue_with()
            .ir_mode_selector_set_to(1, InertialReferenceMode::Attitude);
        test_bed.run_with_delta(Duration::from_millis(1));

        assert!(!test_bed.ir_fault_light_illuminated(1));
    }

    #[rstest]
    #[case(InertialReferenceMode::Navigation)]
    #[case(InertialReferenceMode::Attitude)]
    fn ten_and_a_half_seconds_after_moving_the_mode_selector_the_on_bat_light_illuminates_for_5_and_a_half_seconds(
        #[case] mode: InertialReferenceMode,
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

        let mut test_bed =
            test_bed_with().ir_mode_selector_set_to(1, InertialReferenceMode::Navigation);
        test_bed.run_without_delta();
        test_bed.run_with_delta(additional_duration);

        test_bed = test_bed
            .then_continue_with()
            .ir_mode_selector_set_to(2, InertialReferenceMode::Navigation);
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
        let mut test_bed =
            test_bed_with().ir_mode_selector_set_to(1, InertialReferenceMode::Navigation);
        test_bed.run_without_delta();
        test_bed.run_with_delta(
            AirDataInertialReferenceSystemOverheadPanel::DURATION_AFTER_WHICH_ON_BAT_ILLUMINATES,
        );

        assert!(test_bed.on_bat_light_illuminated());

        test_bed = test_bed
            .then_continue_with()
            .ir_mode_selector_set_to(1, InertialReferenceMode::Attitude);
        test_bed.run();

        assert!(test_bed.on_bat_light_illuminated());
    }

    #[test]
    #[timeout(500)]
    fn remaining_alignment_time_counts_down_to_0_seconds() {
        let mut test_bed =
            test_bed_with().ir_mode_selector_set_to(1, InertialReferenceMode::Navigation);
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
        let mut test_bed =
            test_bed_with().ir_mode_selector_set_to(1, InertialReferenceMode::Navigation);
        test_bed.run_without_delta();
        test_bed.run_with_delta(Duration::from_secs(60));
        let single_adiru_remaining_alignment_time = test_bed.remaining_alignment_time();

        test_bed = test_bed
            .then_continue_with()
            .ir_mode_selector_set_to(2, InertialReferenceMode::Navigation);
        test_bed.run();

        assert!(test_bed.remaining_alignment_time() > single_adiru_remaining_alignment_time);
    }

    #[test]
    fn remaining_alignment_time_is_greater_than_zero_when_a_single_adiru_is_aligned_but_another_is_still_aligning(
    ) {
        let mut test_bed =
            test_bed_with().ir_mode_selector_set_to(1, InertialReferenceMode::Navigation);
        test_bed.run_without_delta();

        while test_bed.remaining_alignment_time() > Duration::from_secs(0) {
            test_bed.run();
        }

        test_bed = test_bed
            .then_continue_with()
            .ir_mode_selector_set_to(2, InertialReferenceMode::Navigation);
        test_bed.run();

        assert!(test_bed.remaining_alignment_time() > Duration::from_secs(0));
    }

    mod adr {
        use super::*;

        #[rstest]
        #[case(1)]
        #[case(2)]
        #[case(3)]
        fn data_is_valid_18_seconds_after_alignment_began(#[case] adiru_number: usize) {
            let mut test_bed = test_bed_with()
                .ir_mode_selector_set_to(adiru_number, InertialReferenceMode::Navigation);
            test_bed.run_without_delta();

            test_bed.run_with_delta(
                AirDataReference::INITIALISATION_DURATION - Duration::from_millis(1),
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
                .ir_mode_selector_set_to(adiru_number, InertialReferenceMode::Off);
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

            test_bed.run();

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
                all_adirus_aligned_test_bed()
                    .altimeter_setting_of(Pressure::new::<hectopascal>(1020.));

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
            let mut test_bed = all_adirus_aligned_test_bed();
            test_bed.set_pressure_altitude(Length::new::<foot>(38000.));

            test_bed.run();

            assert_eq!(
                test_bed.altitude(adiru_number).normal_value().unwrap(),
                Length::new::<foot>(38000.)
            );
        }

        #[rstest]
        #[case(1)]
        #[case(2)]
        #[case(3)]
        fn baro_corrected_altitude_1_is_supplied_by_adr(#[case] adiru_number: usize) {
            let mut test_bed = all_adirus_aligned_test_bed();
            test_bed.set_indicated_altitude(Length::new::<foot>(10000.));

            test_bed.run();

            assert_eq!(
                test_bed
                    .baro_corrected_altitude_1(adiru_number)
                    .normal_value()
                    .unwrap(),
                Length::new::<foot>(10000.)
            );
        }

        #[rstest]
        #[case(1)]
        #[case(2)]
        #[case(3)]
        fn baro_corrected_altitude_2_is_supplied_by_adr(#[case] adiru_number: usize) {
            let mut test_bed = all_adirus_aligned_test_bed();
            test_bed.set_indicated_altitude(Length::new::<foot>(10000.));

            test_bed.run();

            assert_eq!(
                test_bed
                    .baro_corrected_altitude_2(adiru_number)
                    .normal_value()
                    .unwrap(),
                Length::new::<foot>(10000.)
            );
        }

        #[rstest]
        #[case(1)]
        #[case(2)]
        #[case(3)]
        fn computed_airspeed_is_supplied_by_adr_when_greater_than_or_equal_to_30_knots(
            #[case] adiru_number: usize,
        ) {
            let velocity = Velocity::new::<knot>(AirDataReference::MINIMUM_CAS);
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
            let velocity = Velocity::new::<knot>(AirDataReference::MINIMUM_CAS - 0.01);
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
        fn mach_is_supplied_by_adr_when_greater_than_or_equal_to_zero_point_1(
            #[case] adiru_number: usize,
        ) {
            let mach = MachNumber::from(AirDataReference::MINIMUM_MACH);
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
            let mach = MachNumber::from(AirDataReference::MINIMUM_MACH - 0.01);
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
            let mut test_bed = all_adirus_aligned_test_bed_with().vertical_speed_of(vertical_speed);
            test_bed.run();

            assert_eq!(
                test_bed
                    .barometric_vertical_speed(adiru_number)
                    .normal_value()
                    .unwrap(),
                vertical_speed
            );
        }

        #[rstest]
        #[case(1)]
        #[case(2)]
        #[case(3)]
        fn true_airspeed_is_supplied_by_adr_when_greater_than_or_equal_to_60_knots(
            #[case] adiru_number: usize,
        ) {
            let velocity = Velocity::new::<knot>(AirDataReference::MINIMUM_TAS);
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
            let velocity = Velocity::new::<knot>(AirDataReference::MINIMUM_TAS - 0.01);
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
                AirDataReference::MINIMUM_CAS_FOR_AOA,
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
                AirDataReference::MINIMUM_CAS_FOR_AOA - 0.01,
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
        use uom::si::angular_velocity::revolution_per_minute;

        #[rstest]
        #[case(1)]
        #[case(2)]
        #[case(3)]
        fn all_data_is_available_after_full_alignment_completed(#[case] adiru_number: usize) {
            let mut test_bed = test_bed_with()
                .ir_mode_selector_set_to(adiru_number, InertialReferenceMode::Navigation);

            while test_bed.align_state(adiru_number) != AlignState::Aligned {
                // As the attitude and heading data will become available at some point, we're not checking it here.
                test_bed.assert_ir_non_attitude_data_available(false, adiru_number);
                test_bed.run();
            }

            test_bed = test_bed
                .then_continue_with()
                .true_airspeed_of(Velocity::new::<knot>(
                    InertialReference::MINIMUM_TRUE_AIRSPEED_FOR_WIND_DETERMINATION_KNOTS + 0.01,
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
                    InertialReference::MINIMUM_TRUE_AIRSPEED_FOR_WIND_DETERMINATION_KNOTS + 0.01,
                ));
            test_bed.run();
            test_bed.assert_all_ir_data_available(true, adiru_number);

            test_bed = test_bed
                .then_continue_with()
                .ir_mode_selector_set_to(adiru_number, InertialReferenceMode::Off);
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
                .ir_mode_selector_set_to(adiru_number, InertialReferenceMode::Attitude);
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
            let mut test_bed = test_bed_with()
                .ir_mode_selector_set_to(adiru_number, InertialReferenceMode::Navigation);
            test_bed.run_without_delta();

            test_bed.run_with_delta(
                InertialReference::ATTITUDE_INITIALISATION_DURATION - Duration::from_millis(1),
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
            let mut test_bed = test_bed_with()
                .ir_mode_selector_set_to(adiru_number, InertialReferenceMode::Attitude);
            test_bed.run_without_delta();

            test_bed.run_with_delta(
                InertialReference::ATTITUDE_INITIALISATION_DURATION - Duration::from_millis(1),
            );
            test_bed.assert_ir_attitude_data_available(false, adiru_number);
            test_bed.assert_ir_heading_data_available(false, adiru_number);

            test_bed.run_with_delta(Duration::from_millis(1));
            test_bed.assert_ir_attitude_data_available(true, adiru_number);
            test_bed.assert_ir_heading_data_available(true, adiru_number);

            let maint_word_flags =
                IrMaintFlags::from_bits(test_bed.maint_word(adiru_number).value());
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
                    .get::<degree_per_second>(),
                -rate.get::<degree_per_second>()
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
                (acc / g - test_bed.pitch(adiru_number).normal_value().unwrap().cos())
                    .get::<ratio>()
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
                    + test_bed.pitch(adiru_number).normal_value().unwrap().cos()
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
            let maint_word_flags =
                IrMaintFlags::from_bits(test_bed.maint_word(adiru_number).value());
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
            let maint_word_flags =
                IrMaintFlags::from_bits(test_bed.maint_word(adiru_number).value());
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
                    InertialReference::MINIMUM_GROUND_SPEED_FOR_TRACK_KNOTS,
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
                    InertialReference::MINIMUM_GROUND_SPEED_FOR_TRACK_KNOTS,
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
                    InertialReference::MINIMUM_GROUND_SPEED_FOR_TRACK_KNOTS - 0.01,
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
                    InertialReference::MINIMUM_GROUND_SPEED_FOR_TRACK_KNOTS - 0.01,
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
                    InertialReference::MINIMUM_GROUND_SPEED_FOR_TRACK_KNOTS,
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
                    InertialReference::MINIMUM_GROUND_SPEED_FOR_TRACK_KNOTS - 0.01,
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
                .vertical_speed_of(vs)
                .and()
                .ground_speed_of(Velocity::new::<knot>(
                    InertialReference::MINIMUM_GROUND_SPEED_FOR_TRACK_KNOTS,
                ));
            test_bed.run();

            assert_about_eq!(
                test_bed
                    .flight_path_angle(adiru_number)
                    .normal_value()
                    .unwrap()
                    .get::<degree>(),
                vs.atan2(Velocity::new::<knot>(
                    InertialReference::MINIMUM_GROUND_SPEED_FOR_TRACK_KNOTS,
                ))
                .get::<degree>()
            );
        }

        #[rstest]
        #[case(1)]
        #[case(2)]
        #[case(3)]
        fn flight_path_angle_is_zero_when_ground_speed_less_than_50_knots(
            #[case] adiru_number: usize,
        ) {
            let vs = Velocity::new::<foot_per_minute>(500.);
            let mut test_bed = all_adirus_aligned_test_bed_with()
                .vertical_speed_of(vs)
                .and()
                .ground_speed_of(Velocity::new::<knot>(
                    InertialReference::MINIMUM_GROUND_SPEED_FOR_TRACK_KNOTS - 0.01,
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
            let mut test_bed = all_adirus_aligned_test_bed_with().vertical_speed_of(vertical_speed);
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
                    InertialReference::MINIMUM_TRUE_AIRSPEED_FOR_WIND_DETERMINATION_KNOTS - 0.01,
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
        fn uses_gps_as_primary_when_any_adiru_is_aligned(#[case] adiru_number: usize) {
            // The GPSSU is for now assumed to always work. Thus, when any ADIRU is aligned
            // GPS is used as the primary means of navigation.
            let mut test_bed = test_bed_with()
                .ir_mode_selector_set_to(adiru_number, InertialReferenceMode::Navigation)
                .wait_for_alignment_of(adiru_number);

            assert!(test_bed.uses_gps_as_primary());
        }

        #[test]
        fn does_not_use_gps_as_primary_when_no_adiru_is_aligned() {
            let mut test_bed = test_bed();
            test_bed.run();

            assert!(!test_bed.uses_gps_as_primary());
        }

        #[test]
        fn does_not_use_gps_as_primary_when_adirus_aligned_with_ir_push_buttons_off() {
            let mut test_bed = all_adirus_aligned_test_bed_with()
                .ir_push_button_off(1)
                .ir_push_button_off(2)
                .and()
                .ir_push_button_off(3);

            test_bed.run();

            assert!(!test_bed.uses_gps_as_primary());
        }

        #[rstest]
        #[case(1)]
        #[case(2)]
        #[case(3)]
        fn discrete_output_speed_warning_1(#[case] adiru_number: usize) {
            let mut test_bed = all_adirus_aligned_test_bed();
            test_bed.set_indicated_airspeed(Velocity::new::<knot>(95.));
            test_bed.run();

            assert!(
                !test_bed.query(|a| a.adirs.adirus[adiru_number - 1].low_speed_warning_1_104kts())
            );

            test_bed.set_indicated_airspeed(Velocity::new::<knot>(105.));
            test_bed.run();
            assert!(
                test_bed.query(|a| a.adirs.adirus[adiru_number - 1].low_speed_warning_1_104kts())
            );
        }

        #[rstest]
        #[case(1)]
        #[case(2)]
        #[case(3)]
        fn discrete_output_speed_warning_2(#[case] adiru_number: usize) {
            let mut test_bed = all_adirus_aligned_test_bed();
            test_bed.set_indicated_airspeed(Velocity::new::<knot>(45.));
            test_bed.run();

            assert!(
                !test_bed.query(|a| a.adirs.adirus[adiru_number - 1].low_speed_warning_2_54kts())
            );

            test_bed.set_indicated_airspeed(Velocity::new::<knot>(55.));
            test_bed.run();
            assert!(
                test_bed.query(|a| a.adirs.adirus[adiru_number - 1].low_speed_warning_2_54kts())
            );
        }

        #[rstest]
        #[case(1)]
        #[case(2)]
        #[case(3)]
        fn discrete_output_speed_warning_3(#[case] adiru_number: usize) {
            let mut test_bed = all_adirus_aligned_test_bed();
            test_bed.set_indicated_airspeed(Velocity::new::<knot>(150.));
            test_bed.run();

            assert!(
                !test_bed.query(|a| a.adirs.adirus[adiru_number - 1].low_speed_warning_3_159kts())
            );

            test_bed.set_indicated_airspeed(Velocity::new::<knot>(160.));
            test_bed.run();
            assert!(
                test_bed.query(|a| a.adirs.adirus[adiru_number - 1].low_speed_warning_3_159kts())
            );
        }

        #[rstest]
        #[case(1)]
        #[case(2)]
        #[case(3)]
        fn discrete_output_speed_warning_4(#[case] adiru_number: usize) {
            let mut test_bed = all_adirus_aligned_test_bed();
            test_bed.set_indicated_airspeed(Velocity::new::<knot>(255.));
            test_bed.run();

            assert!(
                !test_bed.query(|a| a.adirs.adirus[adiru_number - 1].low_speed_warning_4_260kts())
            );

            test_bed.set_indicated_airspeed(Velocity::new::<knot>(265.));
            test_bed.run();
            assert!(
                test_bed.query(|a| a.adirs.adirus[adiru_number - 1].low_speed_warning_4_260kts())
            );
        }

        #[rstest]
        #[case(1)]
        #[case(2)]
        #[case(3)]
        fn discrete_output_speed_warnings_with_off_adir(#[case] adiru_number: usize) {
            let mut test_bed = test_bed();
            test_bed.set_indicated_airspeed(Velocity::new::<knot>(5.));
            test_bed.run();

            assert!(
                test_bed.query(|a| a.adirs.adirus[adiru_number - 1].low_speed_warning_1_104kts())
            );

            assert!(
                test_bed.query(|a| a.adirs.adirus[adiru_number - 1].low_speed_warning_2_54kts())
            );

            assert!(
                test_bed.query(|a| a.adirs.adirus[adiru_number - 1].low_speed_warning_3_159kts())
            );

            assert!(
                test_bed.query(|a| a.adirs.adirus[adiru_number - 1].low_speed_warning_4_260kts())
            );
        }
    }
}
