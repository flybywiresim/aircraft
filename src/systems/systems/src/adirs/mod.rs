use crate::{
    overhead::IndicationLight,
    simulation::{
        Read, Reader, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, Write, Writer,
    },
};
use std::time::Duration;
use uom::si::{angle::degree, f64::*};

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
    fn new(number: u8) -> Self {
        Self {
            mode_id: Self::mode_id(number),
            // We start in an aligned state to support starting on the
            // runway or in the air.
            mode: InertialReferenceMode::Navigation,
            not_off_duration: Duration::from_secs(0),
        }
    }

    fn mode_id(number: u8) -> String {
        format!("ADIRS_IR_MODE_SELECTOR_KNOB_{}", number)
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
    // Once ADRs are split, we can move this into each individual ADR.
    remaining_adr_initialisation_duration: Option<Duration>,
    // Once IRs are split, we can move this into each individual IR.
    remaining_ir_initialisation_duration: Option<Duration>,
}
impl AirDataInertialReferenceSystem {
    const STATE_KEY: &'static str = "ADIRS_STATE";
    const TIME_KEY: &'static str = "ADIRS_TIME";
    const CONFIGURED_ALIGN_TIME_KEY: &'static str = "CONFIG_ADIRS_IR_ALIGN_TIME";
    const LATITUDE_KEY: &'static str = "GPS POSITION LAT";
    const ADR_INITIALISATION_DURATION: Duration = Duration::from_secs(18);
    const ADR_ALIGNED_KEY: &'static str = "ADIRS_PFD_ALIGNED_FIRST";
    const IR_INITIALISATION_DURATION: Duration = Duration::from_secs(28);
    const IR_ALIGNED_KEY: &'static str = "ADIRS_PFD_ALIGNED_ATT";

    pub fn new() -> Self {
        Self {
            adirus: [
                AirDataInertialReferenceUnit::new(1),
                AirDataInertialReferenceUnit::new(2),
                AirDataInertialReferenceUnit::new(3),
            ],
            configured_align_time: AlignTime::Realistic,
            latitude: Angle::new::<degree>(0.),
            // Start fully initialised.
            remaining_adr_initialisation_duration: Some(Duration::from_secs(0)),
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

        self.remaining_adr_initialisation_duration = self.update_initialisation(
            context,
            self.remaining_adr_initialisation_duration,
            Self::ADR_INITIALISATION_DURATION,
        );

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
                (Some(x), Some(y)) => Some(if x < y { x } else { y }),
            })
            .unwrap_or_else(|| Duration::from_secs(0))
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
        writer.write(Self::TIME_KEY, self.remaining_align_duration());
        writer.write(
            Self::ADR_ALIGNED_KEY,
            self.remaining_adr_initialisation_duration == Some(Duration::from_secs(0)),
        );
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
    ir: InertialReference,
}
impl AirDataInertialReferenceUnit {
    fn new(number: usize) -> Self {
        Self {
            ir: InertialReference::new(number),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        overhead: &AirDataInertialReferenceSystemOverheadPanel,
        align_time: AlignTime,
        latitude: Angle,
    ) {
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
}
impl SimulationElement for AirDataInertialReferenceUnit {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.ir.accept(visitor);

        visitor.visit(self);
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
        format!("ADIRS_IR_{}_HAS_FAULT", number)
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
            self.ir_fault_flash_duration = Some(Duration::from_millis(20));
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
    use uom::si::angle::degree;

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

        fn align_time_configured_as(mut self, align_time: AlignTime) -> Self {
            Write::<f64>::write(
                &mut self,
                AirDataInertialReferenceSystem::CONFIGURED_ALIGN_TIME_KEY,
                align_time.into(),
            );
            self
        }

        fn ir_mode_selector_set_to(mut self, number: u8, mode: InertialReferenceMode) -> Self {
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
            self.read(AirDataInertialReferenceSystem::TIME_KEY)
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
        // Nearly all tests require mode selectors to be off, therefore it is the default.
        all_adirus_aligned_test_bed().all_mode_selectors_off()
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

        test_bed.run_with_delta(Duration::from_millis(19));
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
    fn remaining_alignment_time_is_the_shortest_out_of_all_aligning_adirus() {
        // Note that this seems to be incorrect. I'm keeping it as is for the purpose of the JS to Rust refactoring.
        // This will change later.
        let one_minute = Duration::from_secs(60);

        let mut test_bed =
            test_bed_with().ir_mode_selector_set_to(1, InertialReferenceMode::Navigation);
        test_bed.run_without_delta();
        test_bed.run_with_delta(one_minute);
        let remaining_alignment_time = test_bed.remaining_alignment_time();

        test_bed = test_bed
            .then_continue_with()
            .ir_mode_selector_set_to(2, InertialReferenceMode::Navigation);
        test_bed.run_without_delta();
        test_bed.run_with_delta(one_minute);

        assert_eq!(
            test_bed.remaining_alignment_time(),
            remaining_alignment_time - one_minute
        );
    }

    #[test]
    fn remaining_alignment_time_is_zero_when_a_single_adiru_aligned() {
        // Note that this seems to be incorrect. I'm keeping it as is for the purpose of the JS to Rust refactoring.
        // This will change later.
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

        assert_eq!(test_bed.remaining_alignment_time(), Duration::from_secs(0));
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

        test_bed.run_with_delta(
            AirDataInertialReferenceSystem::ADR_INITIALISATION_DURATION - Duration::from_millis(1),
        );
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

        test_bed.run_with_delta(AirDataInertialReferenceSystem::ADR_INITIALISATION_DURATION);
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
