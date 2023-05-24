use std::time::Duration;

use crate::simulation::{
    InitContext, SimulationElement, SimulatorWriter, UpdateContext, VariableIdentifier, Write,
};

use uom::si::{
    f64::*, length::millimeter, ratio::ratio, thermodynamic_temperature::degree_celsius,
};

pub trait ActiveDeicingController {
    fn active_deicing_normalized_rate(&self) -> Ratio;
}

pub struct PassiveIcingElement {}
impl ActiveDeicingController for PassiveIcingElement {
    fn active_deicing_normalized_rate(&self) -> Ratio {
        Ratio::default()
    }
}
pub struct IcingState {
    icing_state_id: VariableIdentifier,

    time_to_fully_iced: Duration,
    time_to_passive_fully_deiced: Duration,
    time_to_active_fully_deiced: Option<Duration>,

    icing_state_normalized: Ratio,
}
impl IcingState {
    const MAX_ICING_TEMP_C: f64 = -12.;
    const MAX_ICING_TEMP_STANDARD_DEVIATION_C: f64 = 7.;

    const NO_ICING_TEMP_C: f64 = 0.1;
    const MIN_ICING_PRECIPITATION_RATE: f64 = 0.1;

    const DEICING_FROM_TEMP_GAIN: f64 = 0.25; // Tunes the deicing gain from over 0 temperature
    const MAX_NATURAL_DEICING_FROM_HOT_TEMP_RATIO: f64 = 2.;

    pub fn new(
        context: &mut InitContext,
        name: &str,
        time_to_fully_iced: Duration,
        time_to_passive_fully_deiced: Duration,
        time_to_active_fully_deiced: Option<Duration>,
    ) -> Self {
        Self {
            icing_state_id: context.get_identifier(format!("ICING_STATE_{}", name)),
            time_to_fully_iced,
            time_to_passive_fully_deiced,
            time_to_active_fully_deiced,
            icing_state_normalized: Ratio::default(),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        deicing_controller: Option<&impl ActiveDeicingController>,
    ) {
        let icing_delta = Self::icing_rate_normalized(context).get::<ratio>()
            * context.delta_as_secs_f64()
            / self.time_to_fully_iced.as_secs_f64();

        let passive_deicing_delta = Self::natural_deicing_rate(context).get::<ratio>()
            * context.delta_as_secs_f64()
            / self.time_to_passive_fully_deiced.as_secs_f64();

        let active_deicing_delta = if let Some(deicing) = deicing_controller {
            deicing.active_deicing_normalized_rate().get::<ratio>() * context.delta_as_secs_f64()
                / self
                    .time_to_active_fully_deiced
                    .unwrap_or_default()
                    .as_secs_f64()
        } else {
            0.
        };

        self.icing_state_normalized +=
            Ratio::new::<ratio>(icing_delta) - Ratio::new::<ratio>(passive_deicing_delta);

        // 2 factor on active deicing so it will be able to override full icing.
        // If current icing is 1, with 1 of active deicing we end up in "1 - 2*1 = -1" icing
        self.icing_state_normalized -= 2. * Ratio::new::<ratio>(active_deicing_delta);

        self.icing_state_normalized = self
            .icing_state_normalized
            .min(Ratio::new::<ratio>(1.))
            .max(Ratio::new::<ratio>(0.));
    }

    fn is_in_icing_conditions(context: &UpdateContext) -> bool {
        context.ambient_temperature().get::<degree_celsius>() < Self::NO_ICING_TEMP_C
            && (context.is_in_cloud()
                || context.precipitation_rate().get::<millimeter>()
                    > Self::MIN_ICING_PRECIPITATION_RATE)
    }

    fn icing_rate_normalized(context: &UpdateContext) -> Ratio {
        let raw_icing_ratio = if Self::is_in_icing_conditions(context) {
            (-1. * ((context.ambient_temperature().get::<degree_celsius>()
                - Self::MAX_ICING_TEMP_C)
                .powi(2))
                / (2. * Self::MAX_ICING_TEMP_STANDARD_DEVIATION_C.powi(2)))
            .exp()
        } else {
            0.
        };
        Ratio::new::<ratio>(raw_icing_ratio.clamp(0., 1.))
    }

    fn natural_deicing_rate(context: &UpdateContext) -> Ratio {
        if context.ambient_temperature().get::<degree_celsius>() > 0. {
            Ratio::new::<ratio>(
                (Self::DEICING_FROM_TEMP_GAIN
                    * context.ambient_temperature().get::<degree_celsius>().sqrt())
                .clamp(0., Self::MAX_NATURAL_DEICING_FROM_HOT_TEMP_RATIO),
            )
        } else {
            Ratio::default()
        }
    }
}
impl SimulationElement for IcingState {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.icing_state_id,
            self.icing_state_normalized.get::<ratio>(),
        );
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use crate::simulation::{
        test::{ReadByName, SimulationTestBed, TestBed, WriteByName},
        Aircraft, InitContext, SimulationElement, SimulationElementVisitor, UpdateContext,
    };

    use ntest::assert_about_eq;
    use std::time::Duration;

    struct TestDeicingDevice {
        is_deicing: bool,
    }
    impl TestDeicingDevice {
        fn new() -> Self {
            Self { is_deicing: false }
        }
    }
    impl ActiveDeicingController for TestDeicingDevice {
        fn active_deicing_normalized_rate(&self) -> Ratio {
            if self.is_deicing {
                Ratio::new::<ratio>(1.)
            } else {
                Ratio::default()
            }
        }
    }

    struct TestAircraft {
        icing_state: IcingState,
        deicing_device: TestDeicingDevice,
    }
    impl TestAircraft {
        const TIME_FOR_ICING: Duration = Duration::from_secs(30);
        const TIME_FOR_PASSIVE_DEICING: Duration = Duration::from_secs(60);
        const TIME_FOR_ACTIVE_DEICING: Duration = Duration::from_secs(10);

        fn new(context: &mut InitContext) -> Self {
            Self {
                icing_state: IcingState::new(
                    context,
                    "ICING_ELEMENT",
                    Self::TIME_FOR_ICING,
                    Self::TIME_FOR_PASSIVE_DEICING,
                    Some(Self::TIME_FOR_ACTIVE_DEICING),
                ),
                deicing_device: TestDeicingDevice::new(),
            }
        }

        fn update(&mut self, context: &UpdateContext) {
            self.icing_state.update(context, Some(&self.deicing_device));
        }

        fn activate_deicing(&mut self) {
            self.deicing_device.is_deicing = true;
        }
    }
    impl Aircraft for TestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.update(context);
        }
    }
    impl SimulationElement for TestAircraft {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.icing_state.accept(visitor);
            visitor.visit(self);
        }
    }

    #[test]
    fn check_init_not_iced() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.write_by_name("AMBIENT TEMPERATURE", 20.);

        test_bed.run();

        let icing_state: f64 = test_bed.read_by_name("ICING_STATE_ICING_ELEMENT");
        assert!(icing_state == 0.);
    }

    #[test]
    fn check_no_icing_hot_and_rain() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.write_by_name("AMBIENT TEMPERATURE", 20.);
        test_bed.write_by_name("AMBIENT PRECIP RATE", 50.);

        test_bed.run_with_delta(Duration::from_secs(5) + TestAircraft::TIME_FOR_ICING);

        let icing_state: f64 = test_bed.read_by_name("ICING_STATE_ICING_ELEMENT");
        assert!(icing_state == 0.);
    }

    #[test]
    fn check_no_icing_hot_and_rain_and_cloud() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.write_by_name("AMBIENT TEMPERATURE", 20.);
        test_bed.write_by_name("AMBIENT PRECIP RATE", 50.);
        test_bed.write_by_name("AMBIENT IN CLOUD", 1.);

        test_bed.run_with_delta(Duration::from_secs(5) + TestAircraft::TIME_FOR_ICING);

        let icing_state: f64 = test_bed.read_by_name("ICING_STATE_ICING_ELEMENT");
        assert!(icing_state == 0.);
    }

    #[test]
    fn check_no_icing_extreme_cold_and_rain_and_cloud() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.write_by_name("AMBIENT TEMPERATURE", -50.);
        test_bed.write_by_name("AMBIENT PRECIP RATE", 50.);
        test_bed.write_by_name("AMBIENT IN CLOUD", 1.);

        test_bed.run_with_delta(Duration::from_secs(5) + TestAircraft::TIME_FOR_ICING);

        let icing_state: f64 = test_bed.read_by_name("ICING_STATE_ICING_ELEMENT");
        assert_about_eq!(icing_state, 0.);
    }

    #[test]
    fn check_icing_cold_and_rain() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.write_by_name("AMBIENT TEMPERATURE", -12.);
        test_bed.write_by_name("AMBIENT PRECIP RATE", 50.);
        test_bed.write_by_name("AMBIENT IN CLOUD", 0.);

        test_bed.run_with_delta(Duration::from_secs(5) + TestAircraft::TIME_FOR_ICING);

        let icing_state: f64 = test_bed.read_by_name("ICING_STATE_ICING_ELEMENT");
        assert!(icing_state > 0.95);
    }

    #[test]
    fn check_icing_cold_and_cloud() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.write_by_name("AMBIENT TEMPERATURE", -12.);
        test_bed.write_by_name("AMBIENT PRECIP RATE", 0.);
        test_bed.write_by_name("AMBIENT IN CLOUD", 1.);

        test_bed.run_with_delta(Duration::from_secs(5) + TestAircraft::TIME_FOR_ICING);

        let icing_state: f64 = test_bed.read_by_name("ICING_STATE_ICING_ELEMENT");
        assert!(icing_state > 0.95);
    }

    #[test]
    fn check_icing_deicing_cycle_cold_and_cloud_and_then_no_cloud_and_hot() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.write_by_name("AMBIENT TEMPERATURE", -12.);
        test_bed.write_by_name("AMBIENT PRECIP RATE", 0.);
        test_bed.write_by_name("AMBIENT IN CLOUD", 1.);

        test_bed.run_with_delta(Duration::from_secs(5) + TestAircraft::TIME_FOR_ICING);

        let icing_state: f64 = test_bed.read_by_name("ICING_STATE_ICING_ELEMENT");
        assert!(icing_state > 0.95);

        test_bed.write_by_name("AMBIENT TEMPERATURE", 20.);
        test_bed.write_by_name("AMBIENT PRECIP RATE", 0.);
        test_bed.write_by_name("AMBIENT IN CLOUD", 0.);

        test_bed.run_with_delta(Duration::from_secs(5) + TestAircraft::TIME_FOR_PASSIVE_DEICING);

        let icing_state: f64 = test_bed.read_by_name("ICING_STATE_ICING_ELEMENT");
        assert!(icing_state < 0.05);
    }

    #[test]
    fn check_icing_deicing_cycle_cold_and_cloud_and_then_no_cloud_stays_iced_with_no_active_deicing(
    ) {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.write_by_name("AMBIENT TEMPERATURE", -12.);
        test_bed.write_by_name("AMBIENT PRECIP RATE", 0.);
        test_bed.write_by_name("AMBIENT IN CLOUD", 1.);

        test_bed.run_with_delta(Duration::from_secs(5) + TestAircraft::TIME_FOR_ICING);

        let icing_state: f64 = test_bed.read_by_name("ICING_STATE_ICING_ELEMENT");
        assert!(icing_state > 0.95);

        test_bed.write_by_name("AMBIENT TEMPERATURE", -12.);
        test_bed.write_by_name("AMBIENT PRECIP RATE", 0.);
        test_bed.write_by_name("AMBIENT IN CLOUD", 0.);

        test_bed.run_with_delta(Duration::from_secs(5) + TestAircraft::TIME_FOR_PASSIVE_DEICING);

        let icing_state: f64 = test_bed.read_by_name("ICING_STATE_ICING_ELEMENT");
        assert!(icing_state > 0.95);
    }

    #[test]
    fn check_icing_deicing_cycle_cold_and_cloud_and_then_no_cloud_deicing_with_active_deicing() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.write_by_name("AMBIENT TEMPERATURE", -12.);
        test_bed.write_by_name("AMBIENT PRECIP RATE", 0.);
        test_bed.write_by_name("AMBIENT IN CLOUD", 1.);

        test_bed.run_with_delta(Duration::from_secs(5) + TestAircraft::TIME_FOR_ICING);

        let icing_state: f64 = test_bed.read_by_name("ICING_STATE_ICING_ELEMENT");
        assert!(icing_state > 0.95);

        test_bed.write_by_name("AMBIENT TEMPERATURE", -12.);
        test_bed.write_by_name("AMBIENT PRECIP RATE", 0.);
        test_bed.write_by_name("AMBIENT IN CLOUD", 0.);

        test_bed.command(|a| a.activate_deicing());

        test_bed.run_with_delta(Duration::from_secs(1) + TestAircraft::TIME_FOR_ACTIVE_DEICING);

        let icing_state: f64 = test_bed.read_by_name("ICING_STATE_ICING_ELEMENT");
        assert!(icing_state < 0.05);
    }

    #[test]
    fn check_icing_deicing_cycle_with_active_deicing_while_staying_at_max_icing_conditions() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.write_by_name("AMBIENT TEMPERATURE", -12.);
        test_bed.write_by_name("AMBIENT PRECIP RATE", 0.);
        test_bed.write_by_name("AMBIENT IN CLOUD", 1.);

        test_bed.run_with_delta(Duration::from_secs(5) + TestAircraft::TIME_FOR_ICING);

        let icing_state: f64 = test_bed.read_by_name("ICING_STATE_ICING_ELEMENT");
        assert!(icing_state > 0.95);

        test_bed.command(|a| a.activate_deicing());

        test_bed.run_with_delta(Duration::from_secs(1) + TestAircraft::TIME_FOR_ACTIVE_DEICING);

        let icing_state: f64 = test_bed.read_by_name("ICING_STATE_ICING_ELEMENT");
        assert!(icing_state < 0.05);
    }
}
