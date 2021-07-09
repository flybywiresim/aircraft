use crate::{
    overhead::IndicationLight,
    shared::MachNumber,
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
    mode_selectors: [InertialReferenceModeSelector; 3],
    on_bat: IndicationLight,
}
impl AirDataInertialReferenceSystemOverheadPanel {
    const ADIRS_ON_BAT_NAME: &'static str = "ADIRS_ON_BAT";
    const DURATION_AFTER_WHICH_ON_BAT_ILLUMINATES: Duration = Duration::from_millis(10500);
    const ON_BAT_ILLUMINATION_DURATION: Duration = Duration::from_millis(5500);

    pub fn new() -> Self {
        Self {
            mode_selectors: [
                InertialReferenceModeSelector::new(1),
                InertialReferenceModeSelector::new(2),
                InertialReferenceModeSelector::new(3),
            ],
            on_bat: IndicationLight::new(Self::ADIRS_ON_BAT_NAME),
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
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
    }

    fn mode_of(&self, number: usize) -> InertialReferenceMode {
        self.mode_selectors[number - 1].mode()
    }
}
impl SimulationElement for AirDataInertialReferenceSystemOverheadPanel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.mode_selectors.iter_mut().for_each(|mode_selector| {
            mode_selector.accept(visitor);
        });
        self.on_bat.accept(visitor);

        visitor.visit(self);
    }
}
impl Default for AirDataInertialReferenceSystemOverheadPanel {
    fn default() -> Self {
        Self::new()
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
    mode_id: String,
    mode: InertialReferenceMode,
    not_off_duration: Duration,
}
impl InertialReferenceModeSelector {
    fn new(number: usize) -> Self {
        Self {
            mode_id: Self::mode_id(number),
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

#[derive(PartialEq)]
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

#[derive(Clone, Copy, Default)]
struct AdirsSimulatorData {
    mach: MachNumber,
    vertical_speed: Velocity,
    true_airspeed: Velocity,
    latitude: Angle,
    pitch: Angle,
    roll: Angle,
    heading: Angle,
    track: Angle,
    ground_speed: Velocity,
    wind_direction: Angle,
    wind_velocity: Velocity,
}
impl AdirsSimulatorData {
    const LATITUDE: &'static str = "GPS POSITION LAT";
    const MACH: &'static str = "AIRSPEED MACH";
    const VERTICAL_SPEED: &'static str = "VELOCITY WORLD Y";
    const TRUE_AIRSPEED: &'static str = "AIRSPEED TRUE";
    const PITCH: &'static str = "PLANE PITCH DEGREES";
    const ROLL: &'static str = "PLANE BANK DEGREES";
    const HEADING: &'static str = "PLANE HEADING DEGREES MAGNETIC";
    const TRACK: &'static str = "GPS GROUND MAGNETIC TRACK";
    const GROUND_SPEED: &'static str = "GPS GROUND SPEED";
    const WIND_DIRECTION: &'static str = "AMBIENT WIND DIRECTION";
    const WIND_VELOCITY: &'static str = "AMBIENT WIND VELOCITY";
}
impl SimulationElement for AdirsSimulatorData {
    fn read(&mut self, reader: &mut SimulatorReader) {
        // To reduce reads, we only read these values once and then share it with the underlying ADRs and IRs.
        self.mach = reader.read(Self::MACH);
        let vertical_speed: f64 = reader.read(Self::VERTICAL_SPEED);
        self.vertical_speed = Velocity::new::<foot_per_minute>(vertical_speed);
        self.true_airspeed = reader.read(Self::TRUE_AIRSPEED);
        self.latitude = reader.read(Self::LATITUDE);
        self.pitch = reader.read(Self::PITCH);
        self.roll = reader.read(Self::ROLL);
        self.heading = reader.read(Self::HEADING);
        self.track = reader.read(Self::TRACK);
        self.ground_speed = reader.read(Self::GROUND_SPEED);
        self.wind_direction = reader.read(Self::WIND_DIRECTION);
        self.wind_velocity = reader.read(Self::WIND_VELOCITY);
    }
}

pub struct AirDataInertialReferenceSystem {
    adirus: [AirDataInertialReferenceUnit; 3],
    configured_align_time: AlignTime,
    simulator_data: AdirsSimulatorData,
}
impl AirDataInertialReferenceSystem {
    const STATE_KEY: &'static str = "ADIRS_STATE";
    const REMAINING_ALIGNMENT_TIME_KEY: &'static str = "ADIRS_REMAINING_IR_ALIGNMENT_TIME";
    const CONFIGURED_ALIGN_TIME_KEY: &'static str = "CONFIG_ADIRS_IR_ALIGN_TIME";

    pub fn new() -> Self {
        Self {
            adirus: [
                AirDataInertialReferenceUnit::new(1, true),
                AirDataInertialReferenceUnit::new(2, false),
                AirDataInertialReferenceUnit::new(3, true),
            ],
            configured_align_time: AlignTime::Realistic,
            simulator_data: Default::default(),
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

    fn state(&self) -> AlignState {
        if self.adirus.iter().any(|adiru| adiru.is_aligned()) {
            AlignState::Aligned
        } else if self.adirus.iter().any(|adiru| adiru.is_aligning()) {
            AlignState::Aligning
        } else {
            AlignState::Off
        }
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
}
impl SimulationElement for AirDataInertialReferenceSystem {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.adirus.iter_mut().for_each(|adiru| {
            adiru.accept(visitor);
        });
        self.simulator_data.accept(visitor);

        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.configured_align_time = reader.read(Self::CONFIGURED_ALIGN_TIME_KEY);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(Self::STATE_KEY, self.state());
        writer.write(
            Self::REMAINING_ALIGNMENT_TIME_KEY,
            self.remaining_align_duration(),
        );
    }
}
impl Default for AirDataInertialReferenceSystem {
    fn default() -> Self {
        Self::new()
    }
}

struct AirDataInertialReferenceUnit {
    adr: AirDataReference,
    ir: InertialReference,
}
impl AirDataInertialReferenceUnit {
    fn new(number: usize, outputs_temperatures: bool) -> Self {
        Self {
            adr: AirDataReference::new(number, outputs_temperatures),
            ir: InertialReference::new(number),
        }
    }

    #[allow(clippy::too_many_arguments)]
    fn update(
        &mut self,
        context: &UpdateContext,
        overhead: &AirDataInertialReferenceSystemOverheadPanel,
        align_time: AlignTime,
        simulator_data: AdirsSimulatorData,
    ) {
        self.adr.update(context, overhead, simulator_data);
        self.ir
            .update(context, overhead, align_time, simulator_data);
    }

    fn is_aligned(&self) -> bool {
        self.ir.is_aligned()
    }

    fn is_aligning(&self) -> bool {
        self.ir.is_aligning()
    }

    fn remaining_align_duration(&self) -> Option<Duration> {
        self.ir.remaining_align_duration()
    }
}
impl SimulationElement for AirDataInertialReferenceUnit {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.adr.accept(visitor);
        self.ir.accept(visitor);

        visitor.visit(self);
    }
}

struct OutputData<T> {
    id: String,
    value: T,
    uninitialised_value: T,
}
impl<T: Copy + Default> OutputData<T> {
    fn new_adr(number: usize, name: &str, uninitialised_value: T) -> Self {
        Self::new(OutputDataType::ADR, number, name, uninitialised_value)
    }

    fn new_ir(number: usize, name: &str, uninitialised_value: T) -> Self {
        Self::new(OutputDataType::IR, number, name, uninitialised_value)
    }

    fn new(data_type: OutputDataType, number: usize, name: &str, uninitialised_value: T) -> Self {
        Self {
            id: output_data_id(data_type, number, name),
            value: Default::default(),
            uninitialised_value,
        }
    }

    fn set_value(&mut self, value: T) {
        self.value = value;
    }

    fn write_to<U: Write<T>>(&self, writer: &mut U, is_initialised: bool) {
        writer.write(
            &self.id,
            if is_initialised {
                self.value
            } else {
                self.uninitialised_value
            },
        );
    }
}

#[derive(Clone, Copy)]
enum OutputDataType {
    ADR,
    IR,
}
impl Display for OutputDataType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            OutputDataType::ADR => write!(f, "ADR"),
            OutputDataType::IR => write!(f, "IR"),
        }
    }
}

fn output_data_id(data_type: OutputDataType, number: usize, name: &str) -> String {
    format!("ADIRS_{}_{}_{}", data_type, number, name)
}

struct AirDataReference {
    number: usize,
    outputs_temperatures: bool,

    altitude: OutputData<Length>,
    computed_airspeed: OutputData<Velocity>,
    mach: OutputData<MachNumber>,
    barometric_vertical_speed: OutputData<f64>,
    true_airspeed: OutputData<Velocity>,
    static_air_temperature: OutputData<ThermodynamicTemperature>,
    total_air_temperature: OutputData<ThermodynamicTemperature>,
    international_standard_atmosphere_delta: OutputData<ThermodynamicTemperature>,

    remaining_initialisation_duration: Option<Duration>,
}
impl AirDataReference {
    const INITIALISATION_DURATION: Duration = Duration::from_secs(18);
    const UNINITIALISED_MACH: MachNumber = MachNumber(-1_000_000.);
    const UNINITIALISED_VALUE: f64 = -1_000_000.;
    const TOTAL_AIR_TEMPERATURE_KEY: &'static str = "TOTAL AIR TEMPERATURE";
    const ALTITUDE: &'static str = "ALTITUDE";
    const COMPUTED_AIRSPEED: &'static str = "COMPUTED_AIRSPEED";
    const MACH: &'static str = "MACH";
    const BAROMETRIC_VERTICAL_SPEED: &'static str = "BAROMETRIC_VERTICAL_SPEED";
    const TRUE_AIRSPEED: &'static str = "TRUE_AIRSPEED";
    const STATIC_AIR_TEMPERATURE: &'static str = "STATIC_AIR_TEMPERATURE";
    const TOTAL_AIR_TEMPERATURE: &'static str = "TOTAL_AIR_TEMPERATURE";
    const INTERNATIONAL_STANDARD_ATMOSPHERE_DELTA: &'static str =
        "INTERNATIONAL_STANDARD_ATMOSPHERE_DELTA";

    fn new(number: usize, outputs_temperatures: bool) -> Self {
        Self {
            number,
            outputs_temperatures,

            altitude: OutputData::new_adr(
                number,
                Self::ALTITUDE,
                Length::new::<foot>(Self::UNINITIALISED_VALUE),
            ),
            computed_airspeed: OutputData::new_adr(
                number,
                Self::COMPUTED_AIRSPEED,
                Velocity::new::<knot>(Self::UNINITIALISED_VALUE),
            ),
            mach: OutputData::new_adr(number, Self::MACH, Self::UNINITIALISED_MACH),
            barometric_vertical_speed: OutputData::new_adr(
                number,
                Self::BAROMETRIC_VERTICAL_SPEED,
                Self::UNINITIALISED_VALUE,
            ),
            true_airspeed: OutputData::new_adr(
                number,
                Self::TRUE_AIRSPEED,
                Velocity::new::<knot>(Self::UNINITIALISED_VALUE),
            ),
            static_air_temperature: OutputData::new_adr(
                number,
                Self::STATIC_AIR_TEMPERATURE,
                ThermodynamicTemperature::new::<degree_celsius>(Self::UNINITIALISED_VALUE),
            ),
            total_air_temperature: OutputData::new_adr(
                number,
                Self::TOTAL_AIR_TEMPERATURE,
                ThermodynamicTemperature::new::<degree_celsius>(Self::UNINITIALISED_VALUE),
            ),
            international_standard_atmosphere_delta: OutputData::new_adr(
                number,
                Self::INTERNATIONAL_STANDARD_ATMOSPHERE_DELTA,
                ThermodynamicTemperature::new::<degree_celsius>(Self::UNINITIALISED_VALUE),
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
        // For now some of the data will be read from the context. Later the context will no longer
        // contain this information (and instead all usages will be replaced by requests to the ADIRUs).
        self.altitude.set_value(context.indicated_altitude());
        self.barometric_vertical_speed
            .set_value(simulator_data.vertical_speed.get::<foot_per_minute>());

        let computed_airspeed = context.indicated_airspeed();
        self.computed_airspeed.set_value(computed_airspeed);

        // If CAS is below 60 kts, label 210 indicates 0 kt with SSM = NCD.
        self.true_airspeed
            .set_value(if computed_airspeed >= Velocity::new::<knot>(60.) {
                simulator_data.true_airspeed
            } else {
                Velocity::new::<knot>(0.)
            });

        self.mach.set_value(simulator_data.mach);

        if self.outputs_temperatures {
            self.static_air_temperature
                .set_value(context.ambient_temperature());

            self.international_standard_atmosphere_delta.set_value(
                self.international_standard_atmosphere_delta(
                    context.indicated_altitude(),
                    context.ambient_temperature(),
                ),
            );
        }

        self.remaining_initialisation_duration = remaining_initialisation_duration(
            context,
            Self::INITIALISATION_DURATION,
            overhead.mode_of(self.number),
            self.remaining_initialisation_duration,
        );
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
impl SimulationElement for AirDataReference {
    fn read(&mut self, reader: &mut SimulatorReader) {
        if self.outputs_temperatures {
            self.total_air_temperature
                .set_value(reader.read(Self::TOTAL_AIR_TEMPERATURE_KEY));
        }
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        let is_initialised = self.is_initialised();

        self.altitude.write_to(writer, is_initialised);
        self.computed_airspeed.write_to(writer, is_initialised);
        self.mach.write_to(writer, is_initialised);
        self.barometric_vertical_speed
            .write_to(writer, is_initialised);
        self.true_airspeed.write_to(writer, is_initialised);

        if self.outputs_temperatures {
            self.static_air_temperature.write_to(writer, is_initialised);
            self.total_air_temperature.write_to(writer, is_initialised);
            self.international_standard_atmosphere_delta
                .write_to(writer, is_initialised);
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
    has_fault_id: String,
    number: usize,
    /// The remaining time to align, where 0 indicates the IR system is aligned.
    /// None indicates the IR system isn't aligning nor aligned.
    remaining_align_duration: Option<Duration>,
    ir_fault_flash_duration: Option<Duration>,
    remaining_attitude_initialisation_duration: Option<Duration>,

    pitch: OutputData<Angle>,
    roll: OutputData<Angle>,
    heading: OutputData<Angle>,
    track: OutputData<Angle>,
    vertical_speed: OutputData<f64>,
    ground_speed: OutputData<Velocity>,
    wind_direction: OutputData<Angle>,
    wind_velocity: OutputData<Velocity>,
}
impl InertialReference {
    const FAST_ALIGNMENT_TIME_IN_SECS: f64 = 90.;
    const IR_FAULT_FLASH_DURATION: Duration = Duration::from_millis(50);
    const ATTITUDE_INITIALISATION_DURATION: Duration = Duration::from_secs(28);
    const UNINITIALISED_VALUE: f64 = -1_000_000.;
    const PITCH: &'static str = "PITCH";
    const ROLL: &'static str = "ROLL";
    const HEADING: &'static str = "HEADING";
    const TRACK: &'static str = "TRACK";
    const VERTICAL_SPEED: &'static str = "VERTICAL_SPEED";
    const GROUND_SPEED: &'static str = "GROUND_SPEED";
    const WIND_DIRECTION: &'static str = "WIND_DIRECTION";
    const WIND_VELOCITY: &'static str = "WIND_VELOCITY";

    fn new(number: usize) -> Self {
        Self {
            has_fault_id: Self::has_fault_id(number),
            number,
            // We start in an aligned state to support starting on the
            // runway or in the air.
            remaining_align_duration: Some(Duration::from_secs(0)),
            ir_fault_flash_duration: None,
            // Start fully initialised.
            remaining_attitude_initialisation_duration: Some(Duration::from_secs(0)),
            pitch: OutputData::new_ir(
                number,
                Self::PITCH,
                Angle::new::<degree>(Self::UNINITIALISED_VALUE),
            ),
            roll: OutputData::new_ir(
                number,
                Self::ROLL,
                Angle::new::<degree>(Self::UNINITIALISED_VALUE),
            ),
            heading: OutputData::new_ir(
                number,
                Self::HEADING,
                Angle::new::<degree>(Self::UNINITIALISED_VALUE),
            ),
            track: OutputData::new_ir(
                number,
                Self::TRACK,
                Angle::new::<degree>(Self::UNINITIALISED_VALUE),
            ),
            vertical_speed: OutputData::new_ir(
                number,
                Self::VERTICAL_SPEED,
                Self::UNINITIALISED_VALUE,
            ),
            ground_speed: OutputData::new_ir(
                number,
                Self::GROUND_SPEED,
                Velocity::new::<knot>(Self::UNINITIALISED_VALUE),
            ),
            wind_direction: OutputData::new_ir(
                number,
                Self::WIND_DIRECTION,
                Angle::new::<degree>(Self::UNINITIALISED_VALUE),
            ),
            wind_velocity: OutputData::new_ir(
                number,
                Self::WIND_VELOCITY,
                Velocity::new::<knot>(Self::UNINITIALISED_VALUE),
            ),
        }
    }

    fn has_fault_id(number: usize) -> String {
        format!("OVHD_ADIRS_IR_{}_PB_HAS_FAULT", number)
    }

    #[allow(clippy::too_many_arguments)]
    fn update(
        &mut self,
        context: &UpdateContext,
        overhead: &AirDataInertialReferenceSystemOverheadPanel,
        configured_align_time: AlignTime,
        simulator_data: AdirsSimulatorData,
    ) {
        self.pitch.set_value(simulator_data.pitch);
        self.roll.set_value(simulator_data.roll);
        self.heading.set_value(simulator_data.heading);
        self.track.set_value(simulator_data.track);
        self.vertical_speed
            .set_value(simulator_data.vertical_speed.get::<foot_per_minute>());
        self.ground_speed.set_value(simulator_data.ground_speed);
        self.wind_direction.set_value(simulator_data.wind_direction);
        self.wind_velocity.set_value(simulator_data.wind_velocity);

        let selected_mode = overhead.mode_of(self.number);

        if self.alignment_starting(selected_mode) {
            self.ir_fault_flash_duration = Some(Self::IR_FAULT_FLASH_DURATION);
        } else if let Some(flash_duration) = self.ir_fault_flash_duration {
            let remaining = subtract_delta_from_duration(context, flash_duration);
            self.ir_fault_flash_duration = if remaining > Duration::from_secs(0) {
                Some(remaining)
            } else {
                None
            };
        }

        self.remaining_align_duration = match selected_mode {
            InertialReferenceMode::Navigation | InertialReferenceMode::Attitude => {
                match self.remaining_align_duration {
                    Some(remaining) => Some(subtract_delta_from_duration(context, remaining)),
                    None => Some(Self::total_alignment_duration(
                        configured_align_time,
                        simulator_data.latitude,
                    )),
                }
            }
            InertialReferenceMode::Off => None,
        };

        self.remaining_attitude_initialisation_duration = remaining_initialisation_duration(
            context,
            Self::ATTITUDE_INITIALISATION_DURATION,
            overhead.mode_of(self.number),
            self.remaining_attitude_initialisation_duration,
        );
    }

    fn alignment_starting(&self, selected_mode: InertialReferenceMode) -> bool {
        selected_mode != InertialReferenceMode::Off && self.remaining_align_duration == None
    }

    fn total_alignment_duration(configured_align_time: AlignTime, latitude: Angle) -> Duration {
        Duration::from_secs_f64(match configured_align_time {
            AlignTime::Realistic => ((latitude.get::<degree>().powi(2)) * 0.095) + 310.,
            AlignTime::Instant => 0.,
            AlignTime::Fast => Self::FAST_ALIGNMENT_TIME_IN_SECS,
        })
    }

    fn is_aligned(&self) -> bool {
        self.remaining_align_duration == Some(Duration::from_secs(0))
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

    fn attitude_is_initialised(&self) -> bool {
        self.remaining_attitude_initialisation_duration == Some(Duration::from_secs(0))
    }
}
impl SimulationElement for InertialReference {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.has_fault_id, self.ir_fault_flash_duration.is_some());

        let attitude_is_initialised = self.attitude_is_initialised();
        self.pitch.write_to(writer, attitude_is_initialised);
        self.roll.write_to(writer, attitude_is_initialised);

        let is_aligned = self.is_aligned();
        self.heading.write_to(writer, is_aligned);
        self.track.write_to(writer, is_aligned);
        self.vertical_speed.write_to(writer, is_aligned);
        self.ground_speed.write_to(writer, is_aligned);
        self.wind_direction.write_to(writer, is_aligned);
        self.wind_velocity.write_to(writer, is_aligned);
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
    use crate::simulation::{
        test::{SimulationTestBed, TestBed},
        Aircraft, SimulationElementVisitor, SimulatorWriter, UpdateContext, Write,
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
        fn new() -> Self {
            Self {
                adirs: AirDataInertialReferenceSystem::new(),
                overhead: AirDataInertialReferenceSystemOverheadPanel::new(),
            }
        }
    }
    impl Aircraft for TestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.adirs.update(context, &self.overhead);
            self.overhead.update(context);
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
                test_bed: SimulationTestBed::new(|_| TestAircraft::new()),
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

        fn latitude_of(mut self, latitude: Angle) -> Self {
            self.write(AdirsSimulatorData::LATITUDE, latitude);
            self
        }

        fn mach_of(mut self, mach: MachNumber) -> Self {
            self.write(AdirsSimulatorData::MACH, mach);
            self
        }

        fn vertical_speed_of(mut self, velocity: Velocity) -> Self {
            self.write(
                AdirsSimulatorData::VERTICAL_SPEED,
                velocity.get::<foot_per_minute>(),
            );
            self
        }

        fn true_airspeed_of(mut self, velocity: Velocity) -> Self {
            self.write(AdirsSimulatorData::TRUE_AIRSPEED, velocity);
            self
        }

        fn total_air_temperature_of(mut self, temperature: ThermodynamicTemperature) -> Self {
            self.write(AirDataReference::TOTAL_AIR_TEMPERATURE_KEY, temperature);
            self
        }

        fn pitch_of(mut self, angle: Angle) -> Self {
            self.write(AdirsSimulatorData::PITCH, angle);
            self
        }

        fn roll_of(mut self, angle: Angle) -> Self {
            self.write(AdirsSimulatorData::ROLL, angle);
            self
        }

        fn heading_of(mut self, angle: Angle) -> Self {
            self.write(AdirsSimulatorData::HEADING, angle);
            self
        }

        fn track_of(mut self, angle: Angle) -> Self {
            self.write(AdirsSimulatorData::TRACK, angle);
            self
        }

        fn ground_speed_of(mut self, velocity: Velocity) -> Self {
            self.write(AdirsSimulatorData::GROUND_SPEED, velocity);
            self
        }

        fn wind_of(mut self, angle: Angle, velocity: Velocity) -> Self {
            self.write(AdirsSimulatorData::WIND_DIRECTION, angle);
            self.write(AdirsSimulatorData::WIND_VELOCITY, velocity);
            self
        }

        fn align_time_configured_as(mut self, align_time: AlignTime) -> Self {
            Write::<f64>::write(
                &mut self,
                AirDataInertialReferenceSystem::CONFIGURED_ALIGN_TIME_KEY,
                align_time.into(),
            );
            self
        }

        fn ir_mode_selector_set_to(mut self, number: usize, mode: InertialReferenceMode) -> Self {
            Write::<f64>::write(
                &mut self,
                &InertialReferenceModeSelector::mode_id(number),
                mode.into(),
            );
            self
        }

        fn ir_fault_light_illuminated(&mut self, number: usize) -> bool {
            self.read(&InertialReference::has_fault_id(number))
        }

        fn is_aligned(&mut self) -> bool {
            self.align_state() == AlignState::Aligned
        }

        fn is_aligning(&mut self) -> bool {
            self.align_state() == AlignState::Aligning
        }

        fn align_state(&mut self) -> AlignState {
            self.read(AirDataInertialReferenceSystem::STATE_KEY)
        }

        fn remaining_alignment_time(&mut self) -> Duration {
            self.read(AirDataInertialReferenceSystem::REMAINING_ALIGNMENT_TIME_KEY)
        }

        fn all_mode_selectors_off(mut self) -> Self {
            self.move_all_mode_selectors_to(InertialReferenceMode::Off);
            self.run_without_delta();
            self
        }

        fn move_all_mode_selectors_to(&mut self, mode: InertialReferenceMode) {
            for number in 1..=3 {
                self.write(&InertialReferenceModeSelector::mode_id(number), mode);
            }
        }

        fn on_bat_light_illuminated(&mut self) -> bool {
            self.read(&IndicationLight::is_illuminated_id(
                AirDataInertialReferenceSystemOverheadPanel::ADIRS_ON_BAT_NAME,
            ))
        }

        fn altitude(&mut self, adiru_number: usize) -> Length {
            self.read(&output_data_id(
                OutputDataType::ADR,
                adiru_number,
                AirDataReference::ALTITUDE,
            ))
        }

        fn altitude_is_available(&mut self, adiru_number: usize) -> bool {
            self.altitude(adiru_number) > Length::new::<foot>(AirDataReference::UNINITIALISED_VALUE)
        }

        fn computed_airspeed(&mut self, adiru_number: usize) -> Velocity {
            self.read(&output_data_id(
                OutputDataType::ADR,
                adiru_number,
                AirDataReference::COMPUTED_AIRSPEED,
            ))
        }

        fn computed_airspeed_is_available(&mut self, adiru_number: usize) -> bool {
            self.computed_airspeed(adiru_number)
                > Velocity::new::<knot>(AirDataReference::UNINITIALISED_VALUE)
        }

        fn mach(&mut self, adiru_number: usize) -> MachNumber {
            self.read(&output_data_id(
                OutputDataType::ADR,
                adiru_number,
                AirDataReference::MACH,
            ))
        }

        fn mach_is_available(&mut self, adiru_number: usize) -> bool {
            self.mach(adiru_number) > AirDataReference::UNINITIALISED_MACH
        }

        fn barometric_vertical_speed(&mut self, adiru_number: usize) -> Velocity {
            let vertical_speed: f64 = self.read(&output_data_id(
                OutputDataType::ADR,
                adiru_number,
                AirDataReference::BAROMETRIC_VERTICAL_SPEED,
            ));
            Velocity::new::<foot_per_minute>(vertical_speed)
        }

        fn barometric_vertical_speed_is_available(&mut self, adiru_number: usize) -> bool {
            self.barometric_vertical_speed(adiru_number)
                > Velocity::new::<foot_per_minute>(AirDataReference::UNINITIALISED_VALUE)
        }

        fn true_airspeed(&mut self, adiru_number: usize) -> Velocity {
            self.read(&output_data_id(
                OutputDataType::ADR,
                adiru_number,
                AirDataReference::TRUE_AIRSPEED,
            ))
        }

        fn true_airspeed_is_available(&mut self, adiru_number: usize) -> bool {
            self.true_airspeed(adiru_number)
                > Velocity::new::<knot>(AirDataReference::UNINITIALISED_VALUE)
        }

        fn static_air_temperature(&mut self, adiru_number: usize) -> ThermodynamicTemperature {
            self.read(&output_data_id(
                OutputDataType::ADR,
                adiru_number,
                AirDataReference::STATIC_AIR_TEMPERATURE,
            ))
        }

        fn static_air_temperature_is_available(&mut self, adiru_number: usize) -> bool {
            self.static_air_temperature(adiru_number)
                > ThermodynamicTemperature::new::<degree_celsius>(
                    AirDataReference::UNINITIALISED_VALUE,
                )
        }

        fn total_air_temperature(&mut self, adiru_number: usize) -> ThermodynamicTemperature {
            self.read(&output_data_id(
                OutputDataType::ADR,
                adiru_number,
                AirDataReference::TOTAL_AIR_TEMPERATURE,
            ))
        }

        fn total_air_temperature_is_available(&mut self, adiru_number: usize) -> bool {
            self.total_air_temperature(adiru_number)
                > ThermodynamicTemperature::new::<degree_celsius>(
                    AirDataReference::UNINITIALISED_VALUE,
                )
        }

        fn international_standard_atmosphere_delta(
            &mut self,
            adiru_number: usize,
        ) -> ThermodynamicTemperature {
            self.read(&output_data_id(
                OutputDataType::ADR,
                adiru_number,
                AirDataReference::INTERNATIONAL_STANDARD_ATMOSPHERE_DELTA,
            ))
        }

        fn international_standard_atmosphere_delta_is_available(
            &mut self,
            adiru_number: usize,
        ) -> bool {
            self.total_air_temperature(adiru_number)
                > ThermodynamicTemperature::new::<degree_celsius>(
                    AirDataReference::UNINITIALISED_VALUE,
                )
        }

        fn pitch(&mut self, adiru_number: usize) -> Angle {
            self.read(&output_data_id(
                OutputDataType::IR,
                adiru_number,
                InertialReference::PITCH,
            ))
        }

        fn pitch_is_available(&mut self, adiru_number: usize) -> bool {
            self.pitch(adiru_number) > Angle::new::<degree>(InertialReference::UNINITIALISED_VALUE)
        }

        fn roll(&mut self, adiru_number: usize) -> Angle {
            self.read(&output_data_id(
                OutputDataType::IR,
                adiru_number,
                InertialReference::ROLL,
            ))
        }

        fn roll_is_available(&mut self, adiru_number: usize) -> bool {
            self.roll(adiru_number) > Angle::new::<degree>(InertialReference::UNINITIALISED_VALUE)
        }

        fn heading(&mut self, adiru_number: usize) -> Angle {
            self.read(&output_data_id(
                OutputDataType::IR,
                adiru_number,
                InertialReference::HEADING,
            ))
        }

        fn heading_is_available(&mut self, adiru_number: usize) -> bool {
            self.heading(adiru_number)
                > Angle::new::<degree>(InertialReference::UNINITIALISED_VALUE)
        }

        fn track(&mut self, adiru_number: usize) -> Angle {
            self.read(&output_data_id(
                OutputDataType::IR,
                adiru_number,
                InertialReference::TRACK,
            ))
        }

        fn track_is_available(&mut self, adiru_number: usize) -> bool {
            self.track(adiru_number) > Angle::new::<degree>(InertialReference::UNINITIALISED_VALUE)
        }

        fn ground_speed(&mut self, adiru_number: usize) -> Velocity {
            self.read(&output_data_id(
                OutputDataType::IR,
                adiru_number,
                InertialReference::GROUND_SPEED,
            ))
        }

        fn ground_speed_is_available(&mut self, adiru_number: usize) -> bool {
            self.ground_speed(adiru_number)
                > Velocity::new::<knot>(InertialReference::UNINITIALISED_VALUE)
        }

        fn wind_direction(&mut self, adiru_number: usize) -> Angle {
            self.read(&output_data_id(
                OutputDataType::IR,
                adiru_number,
                InertialReference::WIND_DIRECTION,
            ))
        }

        fn wind_direction_is_available(&mut self, adiru_number: usize) -> bool {
            self.wind_direction(adiru_number)
                > Angle::new::<degree>(InertialReference::UNINITIALISED_VALUE)
        }

        fn wind_velocity(&mut self, adiru_number: usize) -> Velocity {
            self.read(&output_data_id(
                OutputDataType::IR,
                adiru_number,
                InertialReference::WIND_VELOCITY,
            ))
        }

        fn wind_velocity_is_available(&mut self, adiru_number: usize) -> bool {
            self.wind_velocity(adiru_number)
                > Velocity::new::<knot>(InertialReference::UNINITIALISED_VALUE)
        }

        fn inertial_vertical_speed(&mut self, adiru_number: usize) -> Velocity {
            let vertical_speed: f64 = self.read(&output_data_id(
                OutputDataType::IR,
                adiru_number,
                InertialReference::VERTICAL_SPEED,
            ));
            Velocity::new::<foot_per_minute>(vertical_speed)
        }

        fn inertial_vertical_speed_is_available(&mut self, adiru_number: usize) -> bool {
            self.inertial_vertical_speed(adiru_number)
                > Velocity::new::<foot_per_minute>(InertialReference::UNINITIALISED_VALUE)
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

    #[test]
    fn starts_aligned() {
        // The structs start in an aligned state to support starting a flight
        // on the runway or in the air with the mode selectors in the NAV position.
        let mut test_bed = all_adirus_aligned_test_bed();
        test_bed.run();

        assert!(test_bed.is_aligned());
    }

    #[test]
    fn adirs_is_not_aligning_nor_aligned_when_all_ir_mode_selectors_off() {
        // TODO: Once the ADIRUs are split, this unit test needs to be modified to test all
        // ADIRUs individually.
        let mut test_bed = test_bed_with()
            .ir_mode_selector_set_to(1, InertialReferenceMode::Off)
            .ir_mode_selector_set_to(2, InertialReferenceMode::Off)
            .ir_mode_selector_set_to(3, InertialReferenceMode::Off);

        test_bed.run_with_delta(Duration::from_secs(0));

        assert!(!test_bed.is_aligned());
        assert!(!test_bed.is_aligning());
    }

    #[test]
    fn adirs_instantly_aligns_when_configured_align_time_is_instant() {
        // TODO: Once the ADIRUs are split, this unit test needs to be modified to test all
        // ADIRUs individually.
        let mut test_bed = test_bed_with()
            .align_time_configured_as(AlignTime::Instant)
            .and()
            .ir_mode_selector_set_to(1, InertialReferenceMode::Navigation);

        test_bed.run_with_delta(Duration::from_secs(0));

        assert!(test_bed.is_aligned());
    }

    #[test]
    fn adirs_aligns_in_90_seconds_when_configured_align_time_is_fast() {
        // TODO: Once the ADIRUs are split, this unit test needs to be modified to test all
        // ADIRUs individually.
        let mut test_bed = test_bed_with()
            .align_time_configured_as(AlignTime::Fast)
            .and()
            .ir_mode_selector_set_to(1, InertialReferenceMode::Navigation);

        // Set the state without any time passing to be able to measure exact time afterward.
        test_bed.run_with_delta(Duration::from_secs(0));

        test_bed.run_with_delta(Duration::from_secs_f64(
            InertialReference::FAST_ALIGNMENT_TIME_IN_SECS - 1.,
        ));
        assert!(test_bed.is_aligning());

        test_bed.run_with_delta(Duration::from_secs(1));
        assert!(test_bed.is_aligned());
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

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn altitude_is_supplied_by_adr(#[case] adiru_number: usize) {
        let mut test_bed = all_adirus_aligned_test_bed();
        test_bed.set_indicated_altitude(Length::new::<foot>(10000.));

        test_bed.run();

        assert_eq!(test_bed.altitude(adiru_number), Length::new::<foot>(10000.));
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
            test_bed.computed_airspeed(adiru_number),
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

        assert_eq!(test_bed.mach(adiru_number), mach);
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
            test_bed.barometric_vertical_speed(adiru_number),
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
        let velocity = Velocity::new::<knot>(60.);
        let mut test_bed = all_adirus_aligned_test_bed_with().true_airspeed_of(velocity);
        test_bed.set_indicated_airspeed(velocity);
        test_bed.run();

        assert_eq!(test_bed.true_airspeed(adiru_number), velocity);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn adr_true_airspeed_is_zero_when_computed_airspeed_less_than_60_knots(
        #[case] adiru_number: usize,
    ) {
        let velocity = Velocity::new::<knot>(59.9);
        let mut test_bed = all_adirus_aligned_test_bed_with().true_airspeed_of(velocity);
        test_bed.set_indicated_airspeed(velocity);
        test_bed.run();

        assert_about_eq!(test_bed.true_airspeed(adiru_number).get::<knot>(), 0.);
    }

    #[rstest]
    #[case(1)]
    #[case(3)]
    fn static_air_temperature_is_supplied_by_adr(#[case] adiru_number: usize) {
        let sat = ThermodynamicTemperature::new::<degree_celsius>(15.);
        let mut test_bed = all_adirus_aligned_test_bed();
        test_bed.set_ambient_temperature(sat);
        test_bed.run();

        assert_eq!(test_bed.static_air_temperature(adiru_number), sat);
    }

    #[rstest]
    #[case(2)]
    fn static_air_temperature_is_not_supplied_by_adr(#[case] adiru_number: usize) {
        let sat = ThermodynamicTemperature::new::<degree_celsius>(15.);
        let mut test_bed = all_adirus_aligned_test_bed();
        test_bed.set_ambient_temperature(sat);
        test_bed.run();

        assert_eq!(
            test_bed.static_air_temperature(adiru_number),
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

        assert_eq!(test_bed.total_air_temperature(adiru_number), tat);
    }

    #[rstest]
    #[case(2)]
    fn total_air_temperature_is_not_supplied_by_adr(#[case] adiru_number: usize) {
        let tat = ThermodynamicTemperature::new::<degree_celsius>(15.);
        let mut test_bed = all_adirus_aligned_test_bed_with().total_air_temperature_of(tat);
        test_bed.run();

        assert_eq!(
            test_bed.total_air_temperature(adiru_number),
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
            test_bed.international_standard_atmosphere_delta(adiru_number),
            ThermodynamicTemperature::new::<degree_celsius>(deviation)
        );
    }

    #[rstest]
    #[case(2)]
    fn international_standard_atmosphere_delta_is_not_supplied_by_adr(#[case] adiru_number: usize) {
        let sea_level_temperature = 15.;
        let deviation = 5.;
        let mut test_bed = all_adirus_aligned_test_bed_with();
        test_bed.set_indicated_altitude(Length::new::<foot>(0.));
        test_bed.set_ambient_temperature(ThermodynamicTemperature::new::<degree_celsius>(
            sea_level_temperature + deviation,
        ));
        test_bed.run();

        assert_eq!(
            test_bed.international_standard_atmosphere_delta(adiru_number),
            ThermodynamicTemperature::new::<degree_celsius>(0.)
        );
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn adr_data_is_available_18_seconds_after_alignment_began(#[case] adiru_number: usize) {
        let mut test_bed = test_bed_with()
            .ir_mode_selector_set_to(adiru_number, InertialReferenceMode::Navigation);
        test_bed.run_without_delta();

        test_bed
            .run_with_delta(AirDataReference::INITIALISATION_DURATION - Duration::from_millis(1));
        assert!(!test_bed.altitude_is_available(adiru_number));
        assert!(!test_bed.computed_airspeed_is_available(adiru_number));
        assert!(!test_bed.mach_is_available(adiru_number));
        assert!(!test_bed.barometric_vertical_speed_is_available(adiru_number));
        assert!(!test_bed.true_airspeed_is_available(adiru_number));

        if adiru_number == 1 || adiru_number == 3 {
            assert!(!test_bed.static_air_temperature_is_available(adiru_number));
            assert!(!test_bed.total_air_temperature_is_available(adiru_number));
            assert!(!test_bed.international_standard_atmosphere_delta_is_available(adiru_number));
        }

        test_bed.run_with_delta(Duration::from_millis(1));
        assert!(test_bed.altitude_is_available(adiru_number));
        assert!(test_bed.computed_airspeed_is_available(adiru_number));
        assert!(test_bed.mach_is_available(adiru_number));
        assert!(test_bed.barometric_vertical_speed_is_available(adiru_number));
        assert!(test_bed.true_airspeed_is_available(adiru_number));

        if adiru_number == 1 || adiru_number == 3 {
            assert!(test_bed.static_air_temperature_is_available(adiru_number));
            assert!(test_bed.total_air_temperature_is_available(adiru_number));
            assert!(test_bed.international_standard_atmosphere_delta_is_available(adiru_number));
        }
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn adr_data_is_no_longer_available_when_adiru_mode_selector_off(#[case] adiru_number: usize) {
        let mut test_bed = test_bed_with()
            .ir_mode_selector_set_to(adiru_number, InertialReferenceMode::Navigation);
        test_bed.run_without_delta();

        test_bed.run_with_delta(AirDataReference::INITIALISATION_DURATION);
        assert!(
            test_bed.altitude_is_available(adiru_number),
            "Test precondition: altitude should be available at this point."
        );
        assert!(
            test_bed.computed_airspeed_is_available(adiru_number),
            "Test precondition: computed airspeed should be available at this point."
        );
        assert!(
            test_bed.mach_is_available(adiru_number),
            "Test precondition: mach should be available at this point."
        );
        assert!(
            test_bed.barometric_vertical_speed_is_available(adiru_number),
            "Test precondition: barometric vertical speed should be available at this point."
        );
        assert!(
            test_bed.true_airspeed_is_available(adiru_number),
            "Test precondition: true airspeed should be available at this point."
        );

        if adiru_number == 1 || adiru_number == 3 {
            assert!(
                test_bed.static_air_temperature_is_available(adiru_number),
                "Test precondition: static air temperature should be available at this point."
            );
            assert!(
                test_bed.total_air_temperature_is_available(adiru_number),
                "Test precondition: total air temperature should be available at this point."
            );
            assert!(
                test_bed.international_standard_atmosphere_delta_is_available(adiru_number),
                "Test precondition: total air temperature should be available at this point."
            );
        }

        test_bed = test_bed
            .then_continue_with()
            .ir_mode_selector_set_to(adiru_number, InertialReferenceMode::Off);
        test_bed.run();

        assert!(!test_bed.altitude_is_available(adiru_number));
        assert!(!test_bed.computed_airspeed_is_available(adiru_number));
        assert!(!test_bed.mach_is_available(adiru_number));
        assert!(!test_bed.barometric_vertical_speed_is_available(adiru_number));
        assert!(!test_bed.true_airspeed_is_available(adiru_number));

        if adiru_number == 1 || adiru_number == 3 {
            assert!(!test_bed.static_air_temperature_is_available(adiru_number));
            assert!(!test_bed.total_air_temperature_is_available(adiru_number));
            assert!(!test_bed.international_standard_atmosphere_delta_is_available(adiru_number));
        }
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn pitch_is_supplied_by_ir(#[case] adiru_number: usize) {
        let angle = Angle::new::<degree>(5.);
        let mut test_bed = all_adirus_aligned_test_bed_with().pitch_of(angle);
        test_bed.run();

        assert_eq!(test_bed.pitch(adiru_number), angle);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn roll_is_supplied_by_ir(#[case] adiru_number: usize) {
        let angle = Angle::new::<degree>(5.);
        let mut test_bed = all_adirus_aligned_test_bed_with().roll_of(angle);
        test_bed.run();

        assert_eq!(test_bed.roll(adiru_number), angle);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn ir_attitude_is_available_28_seconds_after_alignment_began(#[case] adiru_number: usize) {
        let mut test_bed = test_bed_with()
            .ir_mode_selector_set_to(adiru_number, InertialReferenceMode::Navigation);
        test_bed.run_without_delta();

        test_bed.run_with_delta(
            InertialReference::ATTITUDE_INITIALISATION_DURATION - Duration::from_millis(1),
        );
        assert!(!test_bed.pitch_is_available(adiru_number));
        assert!(!test_bed.roll_is_available(adiru_number));

        test_bed.run_with_delta(Duration::from_millis(1));
        assert!(test_bed.pitch_is_available(adiru_number));
        assert!(test_bed.roll_is_available(adiru_number));
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn ir_data_is_no_longer_available_when_adiru_mode_selector_off(#[case] adiru_number: usize) {
        let mut test_bed = all_adirus_aligned_test_bed();
        assert!(
            test_bed.pitch_is_available(adiru_number),
            "Test precondition: pitch should be available at this point."
        );
        assert!(
            test_bed.roll_is_available(adiru_number),
            "Test precondition: roll should be available at this point."
        );
        assert!(
            test_bed.heading_is_available(adiru_number),
            "Test precondition: heading should be available at this point."
        );
        assert!(
            test_bed.track_is_available(adiru_number),
            "Test precondition: track should be available at this point."
        );
        assert!(
            test_bed.inertial_vertical_speed_is_available(adiru_number),
            "Test precondition: inertial vertical speed should be available at this point."
        );
        assert!(
            test_bed.ground_speed_is_available(adiru_number),
            "Test precondition: ground speed should be available at this point."
        );
        assert!(
            test_bed.wind_direction_is_available(adiru_number),
            "Test precondition: wind direction should be available at this point."
        );
        assert!(
            test_bed.wind_velocity_is_available(adiru_number),
            "Test precondition: wind velocity should be available at this point."
        );

        test_bed = test_bed
            .then_continue_with()
            .ir_mode_selector_set_to(adiru_number, InertialReferenceMode::Off);
        test_bed.run();

        assert!(!test_bed.pitch_is_available(adiru_number));
        assert!(!test_bed.roll_is_available(adiru_number));
        assert!(!test_bed.heading_is_available(adiru_number));
        assert!(!test_bed.track_is_available(adiru_number));
        assert!(!test_bed.inertial_vertical_speed_is_available(adiru_number));
        assert!(!test_bed.ground_speed_is_available(adiru_number));
        assert!(!test_bed.wind_direction_is_available(adiru_number));
        assert!(!test_bed.wind_velocity_is_available(adiru_number));
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn heading_is_supplied_by_ir(#[case] adiru_number: usize) {
        let angle = Angle::new::<degree>(160.);
        let mut test_bed = all_adirus_aligned_test_bed_with().heading_of(angle);
        test_bed.run();

        assert_eq!(test_bed.heading(adiru_number), angle);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn track_is_supplied_by_ir(#[case] adiru_number: usize) {
        let angle = Angle::new::<degree>(160.);
        let mut test_bed = all_adirus_aligned_test_bed_with().track_of(angle);
        test_bed.run();

        assert_eq!(test_bed.track(adiru_number), angle);
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
            test_bed.inertial_vertical_speed(adiru_number),
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

        assert_eq!(test_bed.ground_speed(adiru_number), gs);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn wind_is_supplied_by_ir(#[case] adiru_number: usize) {
        let angle = Angle::new::<degree>(150.);
        let velocity = Velocity::new::<knot>(40.);
        let mut test_bed = all_adirus_aligned_test_bed_with().wind_of(angle, velocity);
        test_bed.run();

        assert_eq!(test_bed.wind_direction(adiru_number), angle);
        assert_eq!(test_bed.wind_velocity(adiru_number), velocity);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn ir_heading_and_track_and_vertical_speed_and_ground_speed_and_wind_are_available_after_full_alignment_completed(
        #[case] adiru_number: usize,
    ) {
        let mut test_bed = test_bed_with()
            .ir_mode_selector_set_to(adiru_number, InertialReferenceMode::Navigation);

        while test_bed.align_state() != AlignState::Aligned {
            assert!(!test_bed.heading_is_available(adiru_number));
            assert!(!test_bed.track_is_available(adiru_number));
            assert!(!test_bed.inertial_vertical_speed_is_available(adiru_number));
            assert!(!test_bed.ground_speed_is_available(adiru_number));
            assert!(!test_bed.wind_direction_is_available(adiru_number));
            assert!(!test_bed.wind_velocity_is_available(adiru_number));
            test_bed.run();
        }

        assert!(test_bed.heading_is_available(adiru_number));
        assert!(test_bed.track_is_available(adiru_number));
        assert!(test_bed.inertial_vertical_speed_is_available(adiru_number));
        assert!(test_bed.ground_speed_is_available(adiru_number));
        assert!(test_bed.wind_direction_is_available(adiru_number));
        assert!(test_bed.wind_velocity_is_available(adiru_number));
    }

    // NOTE: TESTS BELOW ARE NOT BASED ON REAL AIRCRAFT BEHAVIOUR. For example,
    // PFD attitude is shown 28 seconds after alignment of any ADIRU began, while
    // this should be fed by the selected ADIRU for the captain side (1 or 3), it is now
    // any ADIRU.

    #[test]
    fn nav_and_att_mode_alignment_time_are_equal() {
        let mut test_bed =
            test_bed_with().ir_mode_selector_set_to(1, InertialReferenceMode::Navigation);
        test_bed.run_without_delta();
        let nav_mode_alignment_time = test_bed.remaining_alignment_time();

        let mut test_bed =
            test_bed_with().ir_mode_selector_set_to(1, InertialReferenceMode::Attitude);
        test_bed.run_without_delta();

        assert_eq!(nav_mode_alignment_time, test_bed.remaining_alignment_time());
    }

    #[test]
    fn is_no_longer_aligned_when_all_irs_are_off() {
        let mut test_bed = all_adirus_aligned_test_bed();
        assert!(
            test_bed.is_aligned(),
            "Test precondition: we're starting aligned."
        );

        test_bed = test_bed.then_continue_with().all_mode_selectors_off();
        test_bed.run();

        assert!(!test_bed.is_aligned());
    }
}
