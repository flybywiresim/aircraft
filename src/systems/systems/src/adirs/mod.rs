use crate::{
    overhead::IndicationLight,
    shared::MachNumber,
    simulation::{
        Read, Reader, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, Write, Writer,
    },
};
use std::time::Duration;
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

pub struct AirDataInertialReferenceSystem {
    adirus: [AirDataInertialReferenceUnit; 3],
    configured_align_time: AlignTime,
    latitude: Angle,
    // Once IRs are split, we can move this into each individual IR.
    remaining_ir_initialisation_duration: Option<Duration>,
}
impl AirDataInertialReferenceSystem {
    const STATE_KEY: &'static str = "ADIRS_STATE";
    const REMAINING_ALIGNMENT_TIME_KEY: &'static str = "ADIRS_REMAINING_IR_ALIGNMENT_TIME";
    const CONFIGURED_ALIGN_TIME_KEY: &'static str = "CONFIG_ADIRS_IR_ALIGN_TIME";
    const LATITUDE_KEY: &'static str = "GPS POSITION LAT";
    const ADR_ALIGNED_KEY: &'static str = "ADIRS_PFD_ALIGNED_FIRST";
    const IR_INITIALISATION_DURATION: Duration = Duration::from_secs(28);
    const IR_ALIGNED_KEY: &'static str = "ADIRS_PFD_ALIGNED_ATT";

    pub fn new() -> Self {
        Self {
            adirus: [
                AirDataInertialReferenceUnit::new(1, true),
                AirDataInertialReferenceUnit::new(2, false),
                AirDataInertialReferenceUnit::new(3, false),
            ],
            configured_align_time: AlignTime::Realistic,
            latitude: Angle::new::<degree>(0.),
            // Start fully initialised.
            remaining_ir_initialisation_duration: Some(Duration::from_secs(0)),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        overhead: &AirDataInertialReferenceSystemOverheadPanel,
    ) {
        let align_time = self.configured_align_time;
        let latitude = self.latitude;
        self.adirus
            .iter_mut()
            .for_each(|adiru| adiru.update(context, overhead, align_time, latitude));

        self.remaining_ir_initialisation_duration = self.update_initialisation(
            context,
            self.remaining_ir_initialisation_duration,
            Self::IR_INITIALISATION_DURATION,
        );
    }

    fn update_initialisation(
        &mut self,
        context: &UpdateContext,
        current: Option<Duration>,
        initialisation_duration: Duration,
    ) -> Option<Duration> {
        if self.adirus.iter().any(|adiru| adiru.is_aligned()) {
            Some(Duration::from_secs(0))
        } else if self.adirus.iter().any(|adiru| adiru.is_aligning()) {
            Some(match current {
                Some(remaining) => subtract_delta_from_duration(context, remaining),
                None => initialisation_duration,
            })
        } else {
            None
        }
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

    fn any_adr_is_initialised(&self) -> bool {
        self.adirus.iter().any(|adiru| adiru.adr_initialised())
    }
}
impl SimulationElement for AirDataInertialReferenceSystem {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.adirus.iter_mut().for_each(|adiru| {
            adiru.accept(visitor);
        });

        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.configured_align_time = reader.read(Self::CONFIGURED_ALIGN_TIME_KEY);
        self.latitude = reader.read(Self::LATITUDE_KEY);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(Self::STATE_KEY, self.state());
        writer.write(
            Self::REMAINING_ALIGNMENT_TIME_KEY,
            self.remaining_align_duration(),
        );
        writer.write(Self::ADR_ALIGNED_KEY, self.any_adr_is_initialised());
        writer.write(
            Self::IR_ALIGNED_KEY,
            self.remaining_ir_initialisation_duration == Some(Duration::from_secs(0)),
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

    mach: MachNumber,
    vertical_speed: Velocity,
    true_airspeed: Velocity,
}
impl AirDataInertialReferenceUnit {
    const MACH_KEY: &'static str = "AIRSPEED MACH";
    const VERTICAL_SPEED_KEY: &'static str = "VELOCITY WORLD Y";
    const TRUE_AIRSPEED_KEY: &'static str = "AIRSPEED TRUE";

    fn new(number: usize, outputs_temperatures: bool) -> Self {
        Self {
            adr: AirDataReference::new(number, outputs_temperatures),
            ir: InertialReference::new(number),

            mach: MachNumber(0.),
            vertical_speed: Velocity::new::<foot_per_minute>(0.),
            true_airspeed: Velocity::new::<knot>(0.),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        overhead: &AirDataInertialReferenceSystemOverheadPanel,
        align_time: AlignTime,
        latitude: Angle,
    ) {
        self.adr.update(
            context,
            overhead,
            self.mach,
            self.vertical_speed,
            self.true_airspeed,
        );
        self.ir.update(context, overhead, align_time, latitude);
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

    fn adr_initialised(&self) -> bool {
        self.adr.is_initialised()
    }
}
impl SimulationElement for AirDataInertialReferenceUnit {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.adr.accept(visitor);
        self.ir.accept(visitor);

        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        // To reduce reads, we only read this value once and then share it with the underlying ADRs.
        self.mach = reader.read(Self::MACH_KEY);
        let vertical_speed: f64 = reader.read(Self::VERTICAL_SPEED_KEY);
        self.vertical_speed = Velocity::new::<foot_per_minute>(vertical_speed);
        self.true_airspeed = reader.read(Self::TRUE_AIRSPEED_KEY);
    }
}

struct AirDataReference {
    altitude_id: String,
    computed_airspeed_id: String,
    mach_id: String,
    barometric_vertical_speed_id: String,
    true_airspeed_id: String,
    static_air_temperature_id: String,
    total_air_temperature_id: String,
    international_standard_atmosphere_delta_id: String,

    number: usize,
    outputs_temperatures: bool,

    indicated_altitude: Length,
    indicated_airspeed: Velocity,
    mach: MachNumber,
    vertical_speed: Velocity,
    true_airspeed: Velocity,

    ambient_temperature: ThermodynamicTemperature,
    total_air_temperature: ThermodynamicTemperature,

    remaining_initialisation_duration: Option<Duration>,
}
impl AirDataReference {
    const INITIALISATION_DURATION: Duration = Duration::from_secs(18);
    const UNINITIALISED_MACH: MachNumber = MachNumber(-1_000_000.);
    const UNINITIALISED_VALUE: f64 = -1_000_000.;
    const TOTAL_AIR_TEMPERATURE_KEY: &'static str = "TOTAL AIR TEMPERATURE";

    fn new(number: usize, outputs_temperatures: bool) -> Self {
        Self {
            altitude_id: Self::altitude_id(number),
            computed_airspeed_id: Self::computed_airspeed_id(number),
            mach_id: Self::mach_id(number),
            barometric_vertical_speed_id: Self::barometric_vertical_speed_id(number),
            true_airspeed_id: Self::true_airspeed_id(number),
            static_air_temperature_id: Self::static_air_temperature_id(number),
            total_air_temperature_id: Self::total_air_temperature_id(number),
            international_standard_atmosphere_delta_id:
                Self::international_standard_atmosphere_delta_id(number),

            number,
            outputs_temperatures,

            indicated_altitude: Length::new::<foot>(0.),
            indicated_airspeed: Velocity::new::<knot>(0.),
            mach: MachNumber(0.),
            vertical_speed: Velocity::new::<foot_per_minute>(0.),
            true_airspeed: Velocity::new::<knot>(0.),

            ambient_temperature: ThermodynamicTemperature::new::<degree_celsius>(0.),
            total_air_temperature: ThermodynamicTemperature::new::<degree_celsius>(0.),

            // Start fully initialised.
            remaining_initialisation_duration: Some(Duration::from_secs(0)),
        }
    }

    fn altitude_id(number: usize) -> String {
        format!("ADIRS_ADR_{}_ALTITUDE", number)
    }

    fn computed_airspeed_id(number: usize) -> String {
        format!("ADIRS_ADR_{}_COMPUTED_AIRSPEED", number)
    }

    fn mach_id(number: usize) -> String {
        format!("ADIRS_ADR_{}_MACH", number)
    }

    fn barometric_vertical_speed_id(number: usize) -> String {
        format!("ADIRS_ADR_{}_BAROMETRIC_VERTICAL_SPEED", number)
    }

    fn true_airspeed_id(number: usize) -> String {
        format!("ADIRS_ADR_{}_TRUE_AIRSPEED", number)
    }

    fn static_air_temperature_id(number: usize) -> String {
        format!("ADIRS_ADR_{}_STATIC_AIR_TEMPERATURE", number)
    }

    fn total_air_temperature_id(number: usize) -> String {
        format!("ADIRS_ADR_{}_TOTAL_AIR_TEMPERATURE", number)
    }

    fn international_standard_atmosphere_delta_id(number: usize) -> String {
        format!(
            "ADIRS_ADR_{}_INTERNATIONAL_STANDARD_ATMOSPHERE_DELTA",
            number
        )
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        overhead: &AirDataInertialReferenceSystemOverheadPanel,
        mach: MachNumber,
        vertical_speed: Velocity,
        true_airspeed: Velocity,
    ) {
        // For now we'll read from the context. Later the context will no longer
        // contain the indicated airspeed (and instead all usages of IAS will be replaced by
        // requests to the ADIRUs).
        self.indicated_altitude = context.indicated_altitude();
        self.indicated_airspeed = context.indicated_airspeed();
        self.ambient_temperature = context.ambient_temperature();

        self.mach = mach;
        self.vertical_speed = vertical_speed;
        self.true_airspeed = true_airspeed;

        self.remaining_initialisation_duration = match overhead.mode_of(self.number) {
            InertialReferenceMode::Navigation | InertialReferenceMode::Attitude => {
                match self.remaining_initialisation_duration {
                    Some(remaining) => Some(subtract_delta_from_duration(context, remaining)),
                    None => Some(Self::INITIALISATION_DURATION),
                }
            }
            InertialReferenceMode::Off => None,
        }
    }

    fn is_initialised(&self) -> bool {
        self.remaining_initialisation_duration == Some(Duration::from_secs(0))
    }

    fn international_standard_atmosphere_delta(&self) -> ThermodynamicTemperature {
        let isa = self.indicated_altitude.get::<foot>().min(36_089.) * -0.0019812 + 15.;
        ThermodynamicTemperature::new::<degree_celsius>(
            self.ambient_temperature.get::<degree_celsius>() - isa,
        )
    }

    fn write<T: Write<U>, U>(&self, writer: &mut T, id: &str, initialised: U, uninitialised: U) {
        writer.write(
            id,
            if self.is_initialised() {
                initialised
            } else {
                uninitialised
            },
        );
    }
}
impl SimulationElement for AirDataReference {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.total_air_temperature = reader.read(Self::TOTAL_AIR_TEMPERATURE_KEY);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        self.write(
            writer,
            &self.altitude_id,
            self.indicated_altitude,
            Length::new::<foot>(Self::UNINITIALISED_VALUE),
        );
        self.write(
            writer,
            &self.computed_airspeed_id,
            self.indicated_airspeed,
            Velocity::new::<knot>(Self::UNINITIALISED_VALUE),
        );
        self.write(writer, &self.mach_id, self.mach, Self::UNINITIALISED_MACH);
        self.write(
            writer,
            &self.barometric_vertical_speed_id,
            self.vertical_speed.get::<foot_per_minute>(),
            Self::UNINITIALISED_VALUE,
        );
        self.write(
            writer,
            &self.true_airspeed_id,
            self.true_airspeed,
            Velocity::new::<knot>(Self::UNINITIALISED_VALUE),
        );

        if self.outputs_temperatures {
            self.write(
                writer,
                &self.static_air_temperature_id,
                self.ambient_temperature,
                ThermodynamicTemperature::new::<degree_celsius>(Self::UNINITIALISED_VALUE),
            );
            self.write(
                writer,
                &self.total_air_temperature_id,
                self.total_air_temperature,
                ThermodynamicTemperature::new::<degree_celsius>(Self::UNINITIALISED_VALUE),
            );
            self.write(
                writer,
                &self.international_standard_atmosphere_delta_id,
                self.international_standard_atmosphere_delta(),
                ThermodynamicTemperature::new::<degree_celsius>(Self::UNINITIALISED_VALUE),
            )
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
}
impl InertialReference {
    const FAST_ALIGNMENT_TIME_IN_SECS: f64 = 90.;
    const IR_FAULT_FLASH_DURATION: Duration = Duration::from_millis(50);

    fn new(number: usize) -> Self {
        Self {
            has_fault_id: Self::has_fault_id(number),
            number,
            // We start in an aligned state to support starting on the
            // runway or in the air.
            remaining_align_duration: Some(Duration::from_secs(0)),
            ir_fault_flash_duration: None,
        }
    }

    fn has_fault_id(number: usize) -> String {
        format!("OVHD_ADIRS_IR_{}_PB_HAS_FAULT", number)
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        overhead: &AirDataInertialReferenceSystemOverheadPanel,
        configured_align_time: AlignTime,
        latitude: Angle,
    ) {
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
                        latitude,
                    )),
                }
            }
            InertialReferenceMode::Off => None,
        }
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
        match self.remaining_align_duration.as_ref() {
            Some(remaining) => *remaining == Duration::from_secs(0),
            None => false,
        }
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
}
impl SimulationElement for InertialReference {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.has_fault_id, self.ir_fault_flash_duration.is_some());
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
    use ntest::timeout;
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
            self.write(AirDataInertialReferenceSystem::LATITUDE_KEY, latitude);
            self
        }

        fn mach_of(mut self, mach: MachNumber) -> Self {
            self.write(AirDataInertialReferenceUnit::MACH_KEY, mach);
            self
        }

        fn vertical_speed_of(mut self, velocity: Velocity) -> Self {
            self.write(
                AirDataInertialReferenceUnit::VERTICAL_SPEED_KEY,
                velocity.get::<foot_per_minute>(),
            );
            self
        }

        fn true_airspeed_of(mut self, velocity: Velocity) -> Self {
            self.write(AirDataInertialReferenceUnit::TRUE_AIRSPEED_KEY, velocity);
            self
        }

        fn total_air_temperature_of(mut self, temperature: ThermodynamicTemperature) -> Self {
            self.write(AirDataReference::TOTAL_AIR_TEMPERATURE_KEY, temperature);
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

        fn altitude_speed_and_vertical_speed_available(&mut self) -> bool {
            self.read(AirDataInertialReferenceSystem::ADR_ALIGNED_KEY)
        }

        fn attitude_available(&mut self) -> bool {
            self.read(AirDataInertialReferenceSystem::IR_ALIGNED_KEY)
        }

        fn altitude(&mut self, adiru_number: usize) -> Length {
            self.read(&AirDataReference::altitude_id(adiru_number))
        }

        fn altitude_is_available(&mut self, adiru_number: usize) -> bool {
            self.altitude(adiru_number) > Length::new::<foot>(AirDataReference::UNINITIALISED_VALUE)
        }

        fn computed_airspeed(&mut self, adiru_number: usize) -> Velocity {
            self.read(&AirDataReference::computed_airspeed_id(adiru_number))
        }

        fn computed_airspeed_is_available(&mut self, adiru_number: usize) -> bool {
            self.computed_airspeed(adiru_number)
                > Velocity::new::<knot>(AirDataReference::UNINITIALISED_VALUE)
        }

        fn mach(&mut self, adiru_number: usize) -> MachNumber {
            self.read(&AirDataReference::mach_id(adiru_number))
        }

        fn mach_is_available(&mut self, adiru_number: usize) -> bool {
            self.mach(adiru_number) > AirDataReference::UNINITIALISED_MACH
        }

        fn barometric_vertical_speed(&mut self, adiru_number: usize) -> Velocity {
            let vertical_speed: f64 = self.read(&AirDataReference::barometric_vertical_speed_id(
                adiru_number,
            ));
            Velocity::new::<foot_per_minute>(vertical_speed)
        }

        fn barometric_vertical_speed_is_available(&mut self, adiru_number: usize) -> bool {
            self.barometric_vertical_speed(adiru_number)
                > Velocity::new::<foot_per_minute>(AirDataReference::UNINITIALISED_VALUE)
        }

        fn true_airspeed(&mut self, adiru_number: usize) -> Velocity {
            self.read(&AirDataReference::true_airspeed_id(adiru_number))
        }

        fn true_airspeed_is_available(&mut self, adiru_number: usize) -> bool {
            self.true_airspeed(adiru_number)
                > Velocity::new::<knot>(AirDataReference::UNINITIALISED_VALUE)
        }

        fn static_air_temperature(&mut self, adiru_number: usize) -> ThermodynamicTemperature {
            self.read(&AirDataReference::static_air_temperature_id(adiru_number))
        }

        fn static_air_temperature_is_available(&mut self, adiru_number: usize) -> bool {
            self.static_air_temperature(adiru_number)
                > ThermodynamicTemperature::new::<degree_celsius>(
                    AirDataReference::UNINITIALISED_VALUE,
                )
        }

        fn total_air_temperature(&mut self, adiru_number: usize) -> ThermodynamicTemperature {
            self.read(&AirDataReference::total_air_temperature_id(adiru_number))
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
            self.read(&AirDataReference::international_standard_atmosphere_delta_id(adiru_number))
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
    fn altitude_is_supplied_by_each_individual_adr(#[case] adiru_number: usize) {
        let mut test_bed = all_adirus_aligned_test_bed();
        test_bed.set_indicated_altitude(Length::new::<foot>(10000.));

        test_bed.run();

        assert_eq!(test_bed.altitude(adiru_number), Length::new::<foot>(10000.));
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn computed_airspeed_is_supplied_by_each_individual_adr(#[case] adiru_number: usize) {
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
    fn mach_is_supplied_by_each_individual_adr(#[case] adiru_number: usize) {
        let mach = MachNumber(0.7844);
        let mut test_bed = all_adirus_aligned_test_bed_with().mach_of(mach);
        test_bed.run();

        assert_eq!(test_bed.mach(adiru_number), mach);
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    fn barometric_vertical_speed_is_supplied_by_each_individual_adr(#[case] adiru_number: usize) {
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
    fn true_airspeed_is_supplied_by_each_individual_adr(#[case] adiru_number: usize) {
        let tas = Velocity::new::<knot>(200.);
        let mut test_bed = all_adirus_aligned_test_bed_with().true_airspeed_of(tas);
        test_bed.run();

        assert_eq!(test_bed.true_airspeed(adiru_number), tas);
    }

    #[test]
    fn static_air_temperature_is_supplied_by_adr_1() {
        let sat = ThermodynamicTemperature::new::<degree_celsius>(15.);
        let mut test_bed = all_adirus_aligned_test_bed();
        test_bed.set_ambient_temperature(sat);
        test_bed.run();

        assert_eq!(test_bed.static_air_temperature(1), sat);
    }

    #[rstest]
    #[case(2)]
    #[case(3)]
    fn static_air_temperature_is_not_supplied_by_adr_2_and_3(#[case] adiru_number: usize) {
        let sat = ThermodynamicTemperature::new::<degree_celsius>(15.);
        let mut test_bed = all_adirus_aligned_test_bed();
        test_bed.set_ambient_temperature(sat);
        test_bed.run();

        assert_eq!(
            test_bed.static_air_temperature(adiru_number),
            ThermodynamicTemperature::new::<degree_celsius>(0.)
        );
    }

    #[test]
    fn total_air_temperature_is_supplied_by_adr_1() {
        let tat = ThermodynamicTemperature::new::<degree_celsius>(15.);
        let mut test_bed = all_adirus_aligned_test_bed_with().total_air_temperature_of(tat);
        test_bed.run();

        assert_eq!(test_bed.total_air_temperature(1), tat);
    }

    #[rstest]
    #[case(2)]
    #[case(3)]
    fn total_air_temperature_is_not_supplied_by_adr_2_and_3(#[case] adiru_number: usize) {
        let tat = ThermodynamicTemperature::new::<degree_celsius>(15.);
        let mut test_bed = all_adirus_aligned_test_bed_with().total_air_temperature_of(tat);
        test_bed.run();

        assert_eq!(
            test_bed.total_air_temperature(adiru_number),
            ThermodynamicTemperature::new::<degree_celsius>(0.)
        );
    }

    #[test]
    fn international_standard_atmosphere_delta_is_supplied_by_adr_1() {
        let sea_level_temperature = 15.;
        let deviation = 5.;
        let mut test_bed = all_adirus_aligned_test_bed();
        test_bed.set_indicated_altitude(Length::new::<foot>(0.));
        test_bed.set_ambient_temperature(ThermodynamicTemperature::new::<degree_celsius>(
            sea_level_temperature + deviation,
        ));
        test_bed.run();

        assert_eq!(
            test_bed.international_standard_atmosphere_delta(1),
            ThermodynamicTemperature::new::<degree_celsius>(deviation)
        );
    }

    #[rstest]
    #[case(2)]
    #[case(3)]
    fn international_standard_atmosphere_delta_is_not_supplied_by_adr_2_and_3(
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

        if adiru_number == 1 {
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

        if adiru_number == 1 {
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

        if adiru_number == 1 {
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

        if adiru_number == 1 {
            assert!(!test_bed.static_air_temperature_is_available(adiru_number));
            assert!(!test_bed.total_air_temperature_is_available(adiru_number));
            assert!(!test_bed.international_standard_atmosphere_delta_is_available(adiru_number));
        }
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

    #[test]
    fn pfd_altitude_speed_and_vertical_speed_are_available_18_seconds_after_alignment_of_any_adiru_began(
    ) {
        let mut test_bed =
            test_bed_with().ir_mode_selector_set_to(1, InertialReferenceMode::Navigation);
        test_bed.run_without_delta();

        test_bed
            .run_with_delta(AirDataReference::INITIALISATION_DURATION - Duration::from_millis(1));
        assert!(!test_bed.altitude_speed_and_vertical_speed_available());

        test_bed.run_with_delta(Duration::from_millis(1));
        assert!(test_bed.altitude_speed_and_vertical_speed_available());
    }

    #[test]
    fn pfd_altitude_speed_and_vertical_speed_are_no_longer_available_when_all_adiru_mode_selectors_off(
    ) {
        let mut test_bed =
            test_bed_with().ir_mode_selector_set_to(1, InertialReferenceMode::Navigation);
        test_bed.run_without_delta();

        test_bed.run_with_delta(AirDataReference::INITIALISATION_DURATION);
        assert!(test_bed.altitude_speed_and_vertical_speed_available(), "Test precondition: altitude, speed and vertical speed should be available at this point.");

        test_bed = test_bed
            .then_continue_with()
            .ir_mode_selector_set_to(1, InertialReferenceMode::Off);
        test_bed.run();

        assert!(!test_bed.altitude_speed_and_vertical_speed_available());
    }

    #[test]
    fn pfd_attitude_is_available_28_seconds_after_alignment_of_any_adiru_began() {
        let mut test_bed =
            test_bed_with().ir_mode_selector_set_to(1, InertialReferenceMode::Navigation);
        test_bed.run_without_delta();

        test_bed.run_with_delta(
            AirDataInertialReferenceSystem::IR_INITIALISATION_DURATION - Duration::from_millis(1),
        );
        assert!(!test_bed.attitude_available());

        test_bed.run_with_delta(Duration::from_millis(1));
        assert!(test_bed.attitude_available());
    }

    #[test]
    fn pfd_attitude_is_no_longer_available_when_all_adiru_mode_selectors_off() {
        let mut test_bed =
            test_bed_with().ir_mode_selector_set_to(1, InertialReferenceMode::Navigation);
        test_bed.run_without_delta();

        test_bed.run_with_delta(AirDataInertialReferenceSystem::IR_INITIALISATION_DURATION);
        assert!(
            test_bed.attitude_available(),
            "Test precondition: attitude should be available at this point."
        );

        test_bed = test_bed
            .then_continue_with()
            .ir_mode_selector_set_to(1, InertialReferenceMode::Off);
        test_bed.run();

        assert!(!test_bed.attitude_available());
    }
}
