use super::AirIntakeFlapController;
use crate::{shared::random_number, simulator::UpdateContext};
use std::time::Duration;
use uom::si::{f64::*, ratio::percent};

#[derive(Debug)]
pub struct AirIntakeFlap {
    state: Ratio,
    delay: Duration,
}
impl AirIntakeFlap {
    const MINIMUM_TRAVEL_TIME_SECS: u8 = 6;
    const MAXIMUM_TRAVEL_TIME_SECS: u8 = 12;

    pub fn new() -> AirIntakeFlap {
        let random_above_minimum_mod =
            AirIntakeFlap::MAXIMUM_TRAVEL_TIME_SECS - AirIntakeFlap::MINIMUM_TRAVEL_TIME_SECS + 1;
        let delay = Duration::from_secs(
            (AirIntakeFlap::MINIMUM_TRAVEL_TIME_SECS + (random_number() % random_above_minimum_mod))
                as u64,
        );

        AirIntakeFlap {
            state: Ratio::new::<percent>(0.),
            delay,
        }
    }

    pub fn update<T: AirIntakeFlapController>(&mut self, context: &UpdateContext, controller: &T) {
        if controller.should_open_air_intake_flap() && self.state < Ratio::new::<percent>(100.) {
            self.state += Ratio::new::<percent>(
                self.get_flap_change_for_delta(context)
                    .min(100. - self.state.get::<percent>()),
            );
        } else if !controller.should_open_air_intake_flap()
            && self.state > Ratio::new::<percent>(0.)
        {
            self.state -= Ratio::new::<percent>(
                self.get_flap_change_for_delta(context)
                    .min(self.state.get::<percent>()),
            );
        }
    }

    fn get_flap_change_for_delta(&self, context: &UpdateContext) -> f64 {
        100. * (context.delta.as_secs_f64() / self.delay.as_secs_f64())
    }

    pub fn is_fully_open(&self) -> bool {
        self.state == Ratio::new::<percent>(100.)
    }

    pub fn get_open_amount(&self) -> Ratio {
        self.state
    }

    #[cfg(test)]
    pub fn set_delay(&mut self, delay: Duration) {
        self.delay = delay;
    }
}

#[cfg(test)]
mod air_intake_flap_tests {
    use ntest::assert_about_eq;

    use super::*;
    use crate::simulator::test_helpers::context_with;

    struct TestFlapController {
        should_open: bool,
    }
    impl TestFlapController {
        fn new() -> Self {
            TestFlapController { should_open: false }
        }

        fn open(&mut self) {
            self.should_open = true;
        }

        fn close(&mut self) {
            self.should_open = false;
        }
    }
    impl AirIntakeFlapController for TestFlapController {
        fn should_open_air_intake_flap(&self) -> bool {
            self.should_open
        }
    }

    #[test]
    fn starts_opening_when_target_is_open() {
        let mut flap = AirIntakeFlap::new();
        let mut controller = TestFlapController::new();
        controller.open();

        flap.update(
            &context_with().delta(Duration::from_secs(5)).build(),
            &controller,
        );

        assert!(flap.state.get::<percent>() > 0.);
    }

    #[test]
    fn does_not_instantly_open() {
        let mut flap = AirIntakeFlap::new();
        let mut controller = TestFlapController::new();
        controller.open();

        flap.update(
            &context_with()
                .delta(Duration::from_secs(
                    (AirIntakeFlap::MINIMUM_TRAVEL_TIME_SECS - 1) as u64,
                ))
                .build(),
            &controller,
        );

        assert!(flap.state.get::<percent>() < 100.);
    }

    #[test]
    fn closes_when_target_is_closed() {
        let mut flap = AirIntakeFlap::new();
        let mut controller = TestFlapController::new();
        controller.open();

        flap.update(
            &context_with().delta(Duration::from_secs(5)).build(),
            &controller,
        );
        let open_percentage = flap.state.get::<percent>();

        controller.close();
        flap.update(
            &context_with().delta(Duration::from_secs(2)).build(),
            &controller,
        );

        assert!(flap.state.get::<percent>() < open_percentage);
    }

    #[test]
    fn does_not_instantly_close() {
        let mut flap = AirIntakeFlap::new();
        let mut controller = TestFlapController::new();
        controller.open();

        flap.update(
            &context_with()
                .delta(Duration::from_secs(
                    AirIntakeFlap::MAXIMUM_TRAVEL_TIME_SECS as u64,
                ))
                .build(),
            &controller,
        );

        controller.close();
        flap.update(
            &context_with()
                .delta(Duration::from_secs(
                    (AirIntakeFlap::MINIMUM_TRAVEL_TIME_SECS - 1) as u64,
                ))
                .build(),
            &controller,
        );

        assert!(flap.state.get::<percent>() > 0.);
    }

    #[test]
    fn never_closes_beyond_0_percent() {
        let mut flap = AirIntakeFlap::new();
        let mut controller = TestFlapController::new();
        controller.close();

        flap.update(
            &context_with().delta(Duration::from_secs(1_000)).build(),
            &controller,
        );

        assert_about_eq!(flap.state.get::<percent>(), 0.);
    }

    #[test]
    fn never_opens_beyond_100_percent() {
        let mut flap = AirIntakeFlap::new();
        let mut controller = TestFlapController::new();
        controller.open();

        flap.update(
            &context_with().delta(Duration::from_secs(1_000)).build(),
            &controller,
        );

        assert_about_eq!(flap.state.get::<percent>(), 100.);
    }

    #[test]
    fn is_fully_open_returns_false_when_closed() {
        let flap = AirIntakeFlap::new();

        assert_eq!(flap.is_fully_open(), false)
    }

    #[test]
    fn is_fully_open_returns_true_when_open() {
        let mut flap = AirIntakeFlap::new();
        let mut controller = TestFlapController::new();
        controller.open();

        flap.update(
            &context_with().delta(Duration::from_secs(1_000)).build(),
            &controller,
        );

        assert_eq!(flap.is_fully_open(), true)
    }
}
