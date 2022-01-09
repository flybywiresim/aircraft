use crate::simulation::{InitContext, VariableIdentifier};
use crate::{
    overhead::{IndicationLight, OnOffFaultPushButton},
    shared::{
        arinc429::{Arinc429Word, SignStatus},
        GroundSpeed, MachNumber,
    },
    simulation::{
        Read, Reader, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, Write, Writer,
    },
};
use std::{fmt::Display, time::Duration};
use uom::si::{
    angle::degree,
    f64::*,
    length::foot,
    thermodynamic_temperature::degree_celsius,
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

#[derive(Clone, Copy, PartialEq)]
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

    heading_id: VariableIdentifier,
    heading: Angle,

    track_id: VariableIdentifier,
    track: Angle,

    ground_speed_id: VariableIdentifier,
    ground_speed: Velocity,

    wind_direction_id: VariableIdentifier,
    wind_direction: Angle,

    wind_velocity_id: VariableIdentifier,
    wind_velocity: Velocity,

    total_air_temperature_id: VariableIdentifier,
    total_air_temperature: ThermodynamicTemperature,
}
impl AdirsSimulatorData {
    const MACH: &'static str = "AIRSPEED MACH";
    const VERTICAL_SPEED: &'static str = "VELOCITY WORLD Y";
    const TRUE_AIRSPEED: &'static str = "AIRSPEED TRUE";
    const LATITUDE: &'static str = "PLANE LATITUDE";
    const LONGITUDE: &'static str = "PLANE LONGITUDE";
    const PITCH: &'static str = "PLANE PITCH DEGREES";
    const ROLL: &'static str = "PLANE BANK DEGREES";
    const HEADING: &'static str = "PLANE HEADING DEGREES MAGNETIC";
    const TRACK: &'static str = "GPS GROUND MAGNETIC TRACK";
    const GROUND_SPEED: &'static str = "GPS GROUND SPEED";
    const WIND_DIRECTION: &'static str = "AMBIENT WIND DIRECTION";
    const WIND_VELOCITY: &'static str = "AMBIENT WIND VELOCITY";
    const TOTAL_AIR_TEMPERATURE: &'static str = "TOTAL AIR TEMPERATURE";

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

            heading_id: context.get_identifier(Self::HEADING.to_owned()),
            heading: Default::default(),

            track_id: context.get_identifier(Self::TRACK.to_owned()),
            track: Default::default(),

            ground_speed_id: context.get_identifier(Self::GROUND_SPEED.to_owned()),
            ground_speed: Default::default(),

            wind_direction_id: context.get_identifier(Self::WIND_DIRECTION.to_owned()),
            wind_direction: Default::default(),

            wind_velocity_id: context.get_identifier(Self::WIND_VELOCITY.to_owned()),
            wind_velocity: Default::default(),

            total_air_temperature_id: context
                .get_identifier(Self::TOTAL_AIR_TEMPERATURE.to_owned()),
            total_air_temperature: Default::default(),
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
        self.heading = reader.read(&self.heading_id);
        self.track = reader.read(&self.track_id);
        self.ground_speed = reader.read(&self.ground_speed_id);
        self.wind_direction = reader.read(&self.wind_direction_id);
        self.wind_velocity = reader.read(&self.wind_velocity_id);
        self.total_air_temperature = reader.read(&self.total_air_temperature_id);
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
                AirDataInertialReferenceUnit::new(context, 1, true),
                AirDataInertialReferenceUnit::new(context, 2, false),
                AirDataInertialReferenceUnit::new(context, 3, true),
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
impl GroundSpeed for AirDataInertialReferenceSystem {
    fn ground_speed(&self) -> Velocity {
        self.adirus[0].ground_speed()
    }
}

struct AirDataInertialReferenceUnit {
    state_id: VariableIdentifier,

    adr: AirDataReference,
    ir: InertialReference,
}
impl AirDataInertialReferenceUnit {
    fn new(context: &mut InitContext, number: usize, outputs_temperatures: bool) -> Self {
        Self {
            state_id: context.get_identifier(Self::state_id(number)),
            adr: AirDataReference::new(context, number, outputs_temperatures),
            ir: InertialReference::new(context, number),
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
impl GroundSpeed for AirDataInertialReferenceUnit {
    fn ground_speed(&self) -> Velocity {
        self.ir.ground_speed()
    }
}

struct AdirsData<T> {
    id: VariableIdentifier,
    value: T,
    ssm: SignStatus,
}
impl<T: Copy + Default> AdirsData<T> {
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

    fn write_to<U: Write<T> + Writer>(&self, writer: &mut U) {
        writer.write_arinc429(&self.id, self.value, self.ssm);
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
    outputs_temperatures: bool,

    altitude: AdirsData<Length>,
    computed_airspeed: AdirsData<Velocity>,
    mach: AdirsData<MachNumber>,
    barometric_vertical_speed: AdirsData<f64>,
    true_airspeed: AdirsData<Velocity>,
    static_air_temperature: AdirsData<ThermodynamicTemperature>,
    total_air_temperature: AdirsData<ThermodynamicTemperature>,
    international_standard_atmosphere_delta: AdirsData<ThermodynamicTemperature>,

    remaining_initialisation_duration: Option<Duration>,
}
impl AirDataReference {
    const INITIALISATION_DURATION: Duration = Duration::from_secs(18);
    const ALTITUDE: &'static str = "ALTITUDE";
    const COMPUTED_AIRSPEED: &'static str = "COMPUTED_AIRSPEED";
    const MACH: &'static str = "MACH";
    const BAROMETRIC_VERTICAL_SPEED: &'static str = "BAROMETRIC_VERTICAL_SPEED";
    const TRUE_AIRSPEED: &'static str = "TRUE_AIRSPEED";
    const STATIC_AIR_TEMPERATURE: &'static str = "STATIC_AIR_TEMPERATURE";
    const TOTAL_AIR_TEMPERATURE: &'static str = "TOTAL_AIR_TEMPERATURE";
    const INTERNATIONAL_STANDARD_ATMOSPHERE_DELTA: &'static str =
        "INTERNATIONAL_STANDARD_ATMOSPHERE_DELTA";
    const MINIMUM_COMPUTED_AIRSPEED_FOR_TRUE_AIRSPEED_DETERMINATION_KNOTS: f64 = 60.;

    fn new(context: &mut InitContext, number: usize, outputs_temperatures: bool) -> Self {
        Self {
            number,
            is_on: true,
            outputs_temperatures,

            altitude: AdirsData::new_adr(context, number, Self::ALTITUDE),
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
            international_standard_atmosphere_delta: AdirsData::new_adr(
                context,
                number,
                Self::INTERNATIONAL_STANDARD_ATMOSPHERE_DELTA,
            ),

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
        let should_set_values = self.is_on && self.is_initialised();
        let ssm = if should_set_values {
            SignStatus::NormalOperation
        } else {
            SignStatus::NoComputedData
        };

        // For now some of the data will be read from the context. Later the context will no longer
        // contain this information (and instead all usages will be replaced by requests to the ADIRUs).
        self.altitude.set_value(context.indicated_altitude(), ssm);
        self.barometric_vertical_speed
            .set_value(simulator_data.vertical_speed.get::<foot_per_minute>(), ssm);

        let computed_airspeed = context.indicated_airspeed();
        self.computed_airspeed.set_value(computed_airspeed, ssm);

        // If CAS is below 60 kts, label 210 indicates 0 kt with SSM = NCD.
        let has_true_airspeed = ssm == SignStatus::NormalOperation
            && computed_airspeed
                >= Velocity::new::<knot>(
                    Self::MINIMUM_COMPUTED_AIRSPEED_FOR_TRUE_AIRSPEED_DETERMINATION_KNOTS,
                );
        self.true_airspeed.set_value(
            if has_true_airspeed {
                simulator_data.true_airspeed
            } else {
                Velocity::new::<knot>(0.)
            },
            if should_set_values && has_true_airspeed {
                SignStatus::NormalOperation
            } else {
                SignStatus::NoComputedData
            },
        );

        self.mach.set_value(simulator_data.mach, ssm);

        if self.outputs_temperatures {
            self.total_air_temperature
                .set_value(simulator_data.total_air_temperature, ssm);

            self.static_air_temperature
                .set_value(context.ambient_temperature(), ssm);

            self.international_standard_atmosphere_delta.set_value(
                self.international_standard_atmosphere_delta(
                    context.indicated_altitude(),
                    context.ambient_temperature(),
                ),
                ssm,
            );
        }
    }

    fn is_initialised(&self) -> bool {
        self.remaining_initialisation_duration == Some(Duration::from_secs(0))
    }

    fn international_standard_atmosphere_delta(
        &self,
        indicated_altitude: Length,
        static_air_temperature: ThermodynamicTemperature,
    ) -> ThermodynamicTemperature {
        let isa = indicated_altitude.get::<foot>().min(36_089.) * -0.0019812 + 15.;
        ThermodynamicTemperature::new::<degree_celsius>(
            static_air_temperature.get::<degree_celsius>() - isa,
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
        self.altitude.write_to(writer);
        self.computed_airspeed.write_to(writer);
        self.mach.write_to(writer);
        self.barometric_vertical_speed.write_to(writer);
        self.true_airspeed.write_to(writer);

        if self.outputs_temperatures {
            self.static_air_temperature.write_to(writer);
            self.total_air_temperature.write_to(writer);
            self.international_standard_atmosphere_delta
                .write_to(writer);
        }
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

struct InertialReference {
    number: usize,
    is_on: bool,
    /// The remaining time to align, where 0 indicates the IR system is aligned.
    /// None indicates the IR system isn't aligning nor aligned.
    remaining_align_duration: Option<Duration>,
    ir_fault_flash_duration: Option<Duration>,
    remaining_attitude_initialisation_duration: Option<Duration>,

    pitch: AdirsData<Angle>,
    roll: AdirsData<Angle>,
    heading: AdirsData<Angle>,
    track: AdirsData<Angle>,
    vertical_speed: AdirsData<f64>,
    ground_speed: AdirsData<Velocity>,
    wind_direction: AdirsData<Angle>,
    wind_velocity: AdirsData<Velocity>,
    latitude: AdirsData<Angle>,
    longitude: AdirsData<Angle>,
}
impl InertialReference {
    const FAST_ALIGNMENT_TIME_IN_SECS: f64 = 90.;
    const IR_FAULT_FLASH_DURATION: Duration = Duration::from_millis(50);
    const ATTITUDE_INITIALISATION_DURATION: Duration = Duration::from_secs(28);
    const PITCH: &'static str = "PITCH";
    const ROLL: &'static str = "ROLL";
    const HEADING: &'static str = "HEADING";
    const TRACK: &'static str = "TRACK";
    const VERTICAL_SPEED: &'static str = "VERTICAL_SPEED";
    const GROUND_SPEED: &'static str = "GROUND_SPEED";
    const WIND_DIRECTION: &'static str = "WIND_DIRECTION";
    const WIND_VELOCITY: &'static str = "WIND_VELOCITY";
    const LATITUDE: &'static str = "LATITUDE";
    const LONGITUDE: &'static str = "LONGITUDE";
    const MINIMUM_TRUE_AIRSPEED_FOR_WIND_DETERMINATION_KNOTS: f64 = 100.;
    const MINIMUM_GROUND_SPEED_FOR_TRACK_KNOTS: f64 = 50.;

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
            pitch: AdirsData::new_ir(context, number, Self::PITCH),
            roll: AdirsData::new_ir(context, number, Self::ROLL),
            heading: AdirsData::new_ir(context, number, Self::HEADING),
            track: AdirsData::new_ir(context, number, Self::TRACK),
            vertical_speed: AdirsData::new_ir(context, number, Self::VERTICAL_SPEED),
            ground_speed: AdirsData::new_ir(context, number, Self::GROUND_SPEED),
            wind_direction: AdirsData::new_ir(context, number, Self::WIND_DIRECTION),
            wind_velocity: AdirsData::new_ir(context, number, Self::WIND_VELOCITY),
            latitude: AdirsData::new_ir(context, number, Self::LATITUDE),
            longitude: AdirsData::new_ir(context, number, Self::LONGITUDE),
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

        self.update_attitude_values(simulator_data);
        self.update_heading_value(overhead, simulator_data);
        self.update_non_attitude_values(true_airspeed_source, simulator_data);
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

    fn update_attitude_values(&mut self, simulator_data: AdirsSimulatorData) {
        let ssm = if self.is_on && self.is_attitude_aligned() {
            SignStatus::NormalOperation
        } else {
            SignStatus::NoComputedData
        };
        self.pitch.set_value(simulator_data.pitch, ssm);
        self.roll.set_value(simulator_data.roll, ssm);
    }

    fn update_heading_value(
        &mut self,
        overhead: &AirDataInertialReferenceSystemOverheadPanel,
        simulator_data: AdirsSimulatorData,
    ) {
        let ssm = if self.is_on
            && (self.is_fully_aligned()
                || (overhead.mode_of(self.number) == InertialReferenceMode::Attitude
                    && self.is_attitude_aligned()))
        {
            SignStatus::NormalOperation
        } else {
            SignStatus::NoComputedData
        };

        self.heading.set_value(simulator_data.heading, ssm);
    }

    fn update_non_attitude_values(
        &mut self,
        true_airspeed_source: &impl TrueAirspeedSource,
        simulator_data: AdirsSimulatorData,
    ) {
        let ssm = if self.is_on && self.is_fully_aligned() {
            SignStatus::NormalOperation
        } else {
            SignStatus::NoComputedData
        };

        let ground_speed_above_minimum_threshold = simulator_data.ground_speed
            >= Velocity::new::<knot>(Self::MINIMUM_GROUND_SPEED_FOR_TRACK_KNOTS);

        self.track.set_value(
            if ground_speed_above_minimum_threshold {
                simulator_data.track
            } else {
                simulator_data.heading
            },
            ssm,
        );

        self.vertical_speed
            .set_value(simulator_data.vertical_speed.get::<foot_per_minute>(), ssm);
        self.ground_speed
            .set_value(simulator_data.ground_speed, ssm);

        // The IR does not compute the wind if the TAS is less than 100 knots or unavailable.
        let true_airspeed_above_minimum_threshold = true_airspeed_source
            .true_airspeed()
            .is_normal_operation()
            && true_airspeed_source.true_airspeed().value()
                >= Velocity::new::<knot>(Self::MINIMUM_TRUE_AIRSPEED_FOR_WIND_DETERMINATION_KNOTS);
        self.wind_direction.set_value(
            if true_airspeed_above_minimum_threshold {
                simulator_data.wind_direction
            } else {
                Angle::new::<degree>(0.)
            },
            ssm,
        );
        self.wind_velocity.set_value(
            if true_airspeed_above_minimum_threshold {
                simulator_data.wind_velocity
            } else {
                Velocity::new::<knot>(0.)
            },
            ssm,
        );

        self.latitude.set_value(simulator_data.latitude, ssm);
        self.longitude.set_value(simulator_data.longitude, ssm);
    }

    fn alignment_starting(&self, selected_mode: InertialReferenceMode) -> bool {
        selected_mode != InertialReferenceMode::Off
            && self.remaining_attitude_initialisation_duration == None
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
}
impl SimulationElement for InertialReference {
    fn write(&self, writer: &mut SimulatorWriter) {
        self.pitch.write_to(writer);
        self.roll.write_to(writer);

        self.heading.write_to(writer);
        self.track.write_to(writer);
        self.vertical_speed.write_to(writer);
        self.ground_speed.write_to(writer);
        self.wind_direction.write_to(writer);
        self.wind_velocity.write_to(writer);
        self.latitude.write_to(writer);
        self.longitude.write_to(writer);
    }
}
impl GroundSpeed for InertialReference {
    fn ground_speed(&self) -> Velocity {
        self.ground_speed.value()
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

        fn pitch_of(mut self, angle: Angle) -> Self {
            self.write_by_name(AdirsSimulatorData::PITCH, angle);
            self
        }

        fn roll_of(mut self, angle: Angle) -> Self {
            self.write_by_name(AdirsSimulatorData::ROLL, angle);
            self
        }

        fn heading_of(mut self, angle: Angle) -> Self {
            self.write_by_name(AdirsSimulatorData::HEADING, angle);
            self
        }

        fn track_of(mut self, angle: Angle) -> Self {
            self.write_by_name(AdirsSimulatorData::TRACK, angle);
            self
        }

        fn ground_speed_of(mut self, velocity: Velocity) -> Self {
            self.write_by_name(AdirsSimulatorData::GROUND_SPEED, velocity);
            self
        }

        fn wind_of(mut self, angle: Angle, velocity: Velocity) -> Self {
            self.write_by_name(AdirsSimulatorData::WIND_DIRECTION, angle);
            self.write_by_name(AdirsSimulatorData::WIND_VELOCITY, velocity);
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

        fn altitude(&mut self, adiru_number: usize) -> Arinc429Word<Length> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Adr,
                adiru_number,
                AirDataReference::ALTITUDE,
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

        fn international_standard_atmosphere_delta(
            &mut self,
            adiru_number: usize,
        ) -> Arinc429Word<ThermodynamicTemperature> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Adr,
                adiru_number,
                AirDataReference::INTERNATIONAL_STANDARD_ATMOSPHERE_DELTA,
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

        fn track(&mut self, adiru_number: usize) -> Arinc429Word<Angle> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Ir,
                adiru_number,
                InertialReference::TRACK,
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

        fn wind_velocity(&mut self, adiru_number: usize) -> Arinc429Word<Velocity> {
            self.read_arinc429_by_name(&output_data_id(
                OutputDataType::Ir,
                adiru_number,
                InertialReference::WIND_VELOCITY,
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

        fn uses_gps_as_primary(&mut self) -> bool {
            self.read_by_name(AirDataInertialReferenceSystem::USES_GPS_AS_PRIMARY_KEY)
        }

        fn assert_adr_data_available(&mut self, available: bool, adiru_number: usize) {
            assert_eq!(self.altitude(adiru_number).is_normal_operation(), available);
            assert_eq!(
                self.computed_airspeed(adiru_number).is_normal_operation(),
                available
            );
            assert_eq!(self.mach(adiru_number).is_normal_operation(), available);
            assert_eq!(
                self.barometric_vertical_speed(adiru_number)
                    .is_normal_operation(),
                available
            );
            assert_eq!(
                self.true_airspeed(adiru_number).is_normal_operation(),
                available
            );

            if adiru_number == 1 || adiru_number == 3 {
                assert_eq!(
                    self.static_air_temperature(adiru_number)
                        .is_normal_operation(),
                    available
                );
                assert_eq!(
                    self.total_air_temperature(adiru_number)
                        .is_normal_operation(),
                    available
                );
                assert_eq!(
                    self.international_standard_atmosphere_delta(adiru_number)
                        .is_normal_operation(),
                    available
                );
            }
        }

        fn assert_ir_heading_data_available(&mut self, available: bool, adiru_number: usize) {
            assert_eq!(self.heading(adiru_number).is_normal_operation(), available);
        }

        fn assert_ir_non_attitude_data_available(&mut self, available: bool, adiru_number: usize) {
            assert_eq!(self.track(adiru_number).is_normal_operation(), available);
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
                self.wind_velocity(adiru_number).is_normal_operation(),
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
        }

        fn assert_all_ir_data_available(&mut self, available: bool, adiru_number: usize) {
            self.assert_ir_attitude_data_available(available, adiru_number);
            self.assert_ir_heading_data_available(available, adiru_number);
            self.assert_ir_non_attitude_data_available(available, adiru_number);
        }

        fn assert_wind_direction_and_velocity_zero(&mut self, adiru_number: usize) {
            assert_about_eq!(
                self.wind_direction(adiru_number)
                    .normal_value()
                    .unwrap()
                    .get::<degree>(),
                0.
            );
            assert_about_eq!(
                self.wind_velocity(adiru_number)
                    .normal_value()
                    .unwrap()
                    .get::<knot>(),
                0.
            );
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

        test_bed.run_with_delta(Duration::from_secs(1));
        assert!(test_bed.is_aligned(adiru_number));
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
        fn data_is_available_18_seconds_after_alignment_began(#[case] adiru_number: usize) {
            let mut test_bed = test_bed_with()
                .ir_mode_selector_set_to(adiru_number, InertialReferenceMode::Navigation);
            test_bed.run_without_delta();

            test_bed.run_with_delta(
                AirDataReference::INITIALISATION_DURATION - Duration::from_millis(1),
            );
            test_bed.assert_adr_data_available(false, adiru_number);

            test_bed.run_with_delta(Duration::from_millis(1));
            test_bed.assert_adr_data_available(true, adiru_number);
        }

        #[rstest]
        #[case(1)]
        #[case(2)]
        #[case(3)]
        fn data_is_no_longer_available_when_adiru_mode_selector_off(#[case] adiru_number: usize) {
            let mut test_bed = all_adirus_aligned_test_bed();
            test_bed.run();
            test_bed.assert_adr_data_available(true, adiru_number);

            test_bed = test_bed
                .then_continue_with()
                .ir_mode_selector_set_to(adiru_number, InertialReferenceMode::Off);
            test_bed.run();
            test_bed.assert_adr_data_available(false, adiru_number);
        }

        #[rstest]
        #[case(1)]
        #[case(2)]
        #[case(3)]
        fn when_adr_push_button_off_data_is_not_available(#[case] adiru_number: usize) {
            let mut test_bed = all_adirus_aligned_test_bed_with().adr_push_button_off(adiru_number);
            test_bed.run();

            test_bed.assert_adr_data_available(false, adiru_number);
        }

        #[rstest]
        #[case(1)]
        #[case(2)]
        #[case(3)]
        fn altitude_is_supplied_by_adr(#[case] adiru_number: usize) {
            let mut test_bed = all_adirus_aligned_test_bed();
            test_bed.set_indicated_altitude(Length::new::<foot>(10000.));

            test_bed.run();

            assert_eq!(
                test_bed.altitude(adiru_number).normal_value().unwrap(),
                Length::new::<foot>(10000.)
            );
        }

        #[rstest]
        #[case(1)]
        #[case(2)]
        #[case(3)]
        fn computed_airspeed_is_supplied_by_adr(#[case] adiru_number: usize) {
            let mut test_bed = all_adirus_aligned_test_bed();
            test_bed.set_indicated_airspeed(Velocity::new::<knot>(250.));

            test_bed.run();

            assert_eq!(
                test_bed
                    .computed_airspeed(adiru_number)
                    .normal_value()
                    .unwrap(),
                Velocity::new::<knot>(250.)
            );
        }

        #[rstest]
        #[case(1)]
        #[case(2)]
        #[case(3)]
        fn mach_is_supplied_by_adr(#[case] adiru_number: usize) {
            let mach = MachNumber(0.7844);
            let mut test_bed = all_adirus_aligned_test_bed_with().mach_of(mach);
            test_bed.run();

            assert_about_eq!(
                test_bed.mach(adiru_number).normal_value().unwrap().0,
                mach.0
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
        fn true_airspeed_is_supplied_by_adr_when_computed_airspeed_greater_than_or_equal_to_60_knots(
            #[case] adiru_number: usize,
        ) {
            let velocity = Velocity::new::<knot>(
                AirDataReference::MINIMUM_COMPUTED_AIRSPEED_FOR_TRUE_AIRSPEED_DETERMINATION_KNOTS,
            );
            let mut test_bed = all_adirus_aligned_test_bed_with().true_airspeed_of(velocity);
            test_bed.set_indicated_airspeed(velocity);
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
        fn true_airspeed_is_zero_when_computed_airspeed_less_than_60_knots(
            #[case] adiru_number: usize,
        ) {
            let velocity = Velocity::new::<knot>(
                AirDataReference::MINIMUM_COMPUTED_AIRSPEED_FOR_TRUE_AIRSPEED_DETERMINATION_KNOTS
                    - 0.01,
            );
            let mut test_bed = all_adirus_aligned_test_bed_with().true_airspeed_of(velocity);
            test_bed.set_indicated_airspeed(velocity);
            test_bed.run();

            assert_about_eq!(
                test_bed.true_airspeed(adiru_number).value().get::<knot>(),
                0.
            );
        }

        #[rstest]
        #[case(1)]
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
        #[case(2)]
        fn static_air_temperature_is_not_supplied_by_adr(#[case] adiru_number: usize) {
            let sat = ThermodynamicTemperature::new::<degree_celsius>(15.);
            let mut test_bed = all_adirus_aligned_test_bed();
            test_bed.set_ambient_temperature(sat);
            test_bed.run();

            assert_eq!(
                test_bed.static_air_temperature(adiru_number).value(),
                ThermodynamicTemperature::new::<degree_celsius>(0.)
            );
        }

        #[rstest]
        #[case(1)]
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
        #[case(2)]
        fn total_air_temperature_is_not_supplied_by_adr(#[case] adiru_number: usize) {
            let tat = ThermodynamicTemperature::new::<degree_celsius>(15.);
            let mut test_bed = all_adirus_aligned_test_bed_with().total_air_temperature_of(tat);
            test_bed.run();

            assert_eq!(
                test_bed.total_air_temperature(adiru_number).value(),
                ThermodynamicTemperature::new::<degree_celsius>(0.)
            );
        }

        #[rstest]
        #[case(1)]
        #[case(3)]
        fn international_standard_atmosphere_delta_is_supplied_by_adr(#[case] adiru_number: usize) {
            let sea_level_temperature = 15.;
            let deviation = 5.;
            let mut test_bed = all_adirus_aligned_test_bed();
            test_bed.set_indicated_altitude(Length::new::<foot>(0.));
            test_bed.set_ambient_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                sea_level_temperature + deviation,
            ));
            test_bed.run();

            assert_eq!(
                test_bed
                    .international_standard_atmosphere_delta(adiru_number)
                    .normal_value()
                    .unwrap(),
                ThermodynamicTemperature::new::<degree_celsius>(deviation)
            );
        }

        #[rstest]
        #[case(2)]
        fn international_standard_atmosphere_delta_is_not_supplied_by_adr(
            #[case] adiru_number: usize,
        ) {
            let sea_level_temperature = 15.;
            let deviation = 5.;
            let mut test_bed = all_adirus_aligned_test_bed_with();
            test_bed.set_indicated_altitude(Length::new::<foot>(0.));
            test_bed.set_ambient_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                sea_level_temperature + deviation,
            ));
            test_bed.run();

            assert_eq!(
                test_bed
                    .international_standard_atmosphere_delta(adiru_number)
                    .value(),
                ThermodynamicTemperature::new::<degree_celsius>(0.)
            );
        }
    }

    mod ir {
        use super::*;

        #[rstest]
        #[case(1)]
        #[case(2)]
        #[case(3)]
        fn all_data_is_available_after_full_alignment_completed(#[case] adiru_number: usize) {
            let mut test_bed = test_bed_with()
                .ir_mode_selector_set_to(adiru_number, InertialReferenceMode::Navigation);

            while test_bed.align_state(adiru_number) != AlignState::Aligned {
                // As the attitude data will become available at some point, we're not checking it here.
                test_bed.assert_ir_heading_data_available(false, adiru_number);
                test_bed.assert_ir_non_attitude_data_available(false, adiru_number);
                test_bed.run();
            }

            test_bed.assert_all_ir_data_available(true, adiru_number);
        }

        #[rstest]
        #[case(1)]
        #[case(2)]
        #[case(3)]
        fn data_is_no_longer_available_when_adiru_mode_selector_off(#[case] adiru_number: usize) {
            let mut test_bed = all_adirus_aligned_test_bed();
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

            assert_eq!(test_bed.pitch(adiru_number).normal_value().unwrap(), angle);
        }

        #[rstest]
        #[case(1)]
        #[case(2)]
        #[case(3)]
        fn roll_is_supplied_by_ir(#[case] adiru_number: usize) {
            let angle = Angle::new::<degree>(5.);
            let mut test_bed = all_adirus_aligned_test_bed_with().roll_of(angle);
            test_bed.run();

            assert_eq!(test_bed.roll(adiru_number).normal_value().unwrap(), angle);
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
            let wind_angle = Angle::new::<degree>(150.);
            let wind_velocity = Velocity::new::<knot>(40.);
            let mut test_bed = all_adirus_aligned_test_bed_with()
                .wind_of(wind_angle, wind_velocity)
                .and()
                .true_airspeed_of(Velocity::new::<knot>(
                    InertialReference::MINIMUM_TRUE_AIRSPEED_FOR_WIND_DETERMINATION_KNOTS,
                ));
            test_bed.run();

            assert_eq!(
                test_bed
                    .wind_direction(adiru_number)
                    .normal_value()
                    .unwrap(),
                wind_angle
            );
            assert_eq!(
                test_bed.wind_velocity(adiru_number).normal_value().unwrap(),
                wind_velocity
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
                .true_airspeed_of(Velocity::new::<knot>(
                    InertialReference::MINIMUM_TRUE_AIRSPEED_FOR_WIND_DETERMINATION_KNOTS,
                ))
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
    }
}
