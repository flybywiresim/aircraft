use crate::simulation::UpdateContext;

use super::PressureValveActuator;

use std::time::Duration;
use uom::si::{f64::*, ratio::percent};

pub(super) struct PressureValve {
    open_amount: Ratio,
    target_open: Ratio,
    full_travel_time: Duration,
}

impl PressureValve {
    pub fn new() -> Self {
        Self {
            open_amount: Ratio::new::<percent>(100.),
            target_open: Ratio::new::<percent>(100.),
            full_travel_time: Duration::from_secs(4),
        }
    }

    pub fn update<T: PressureValveActuator>(&mut self, context: &UpdateContext, actuator: &T) {
        self.target_open = actuator.target_valve_position();
        if self.open_amount < self.target_open {
            self.open_amount += Ratio::new::<percent>(
                self.get_valve_change_for_delta(context)
                    .min(self.target_open.get::<percent>() - self.open_amount.get::<percent>()),
            );
        } else if self.open_amount > self.target_open {
            self.open_amount -= Ratio::new::<percent>(
                self.get_valve_change_for_delta(context)
                    .min(self.open_amount.get::<percent>() - self.target_open.get::<percent>()),
            );
        }
    }

    fn get_valve_change_for_delta(&self, context: &UpdateContext) -> f64 {
        100. * (context.delta_as_secs_f64() / self.full_travel_time.as_secs_f64())
    }

    pub fn open_amount(&self) -> Ratio {
        self.open_amount
    }
}

#[cfg(test)]
mod pressure_valve_tests {
    use super::*;
    use crate::simulation::test::{SimulationTestBed, TestBed};
    use crate::simulation::{Aircraft, SimulationElement};

    struct TestAircraft {
        valve: PressureValve,
        actuator: TestValveActuator,
    }
    impl TestAircraft {
        fn new() -> Self {
            Self {
                valve: PressureValve::new(),
                actuator: TestValveActuator::new(),
            }
        }

        fn command_valve_open(&mut self) {
            self.actuator.open();
        }

        fn command_valve_close(&mut self) {
            self.actuator.close();
        }

        fn command_valve_open_amount(&mut self, amount: Ratio) {
            self.actuator.set_target_valve_position(amount);
        }

        fn valve_open_amount(&self) -> Ratio {
            self.valve.open_amount()
        }
    }
    impl Aircraft for TestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.valve.update(context, &self.actuator);
        }
    }
    impl SimulationElement for TestAircraft {}

    struct TestValveActuator {
        should_open: bool,
        should_close: bool,
        target_valve_position: Ratio,
    }
    impl TestValveActuator {
        fn new() -> Self {
            TestValveActuator {
                should_open: true,
                should_close: false,
                target_valve_position: Ratio::new::<percent>(100.),
            }
        }

        fn open(&mut self) {
            self.should_open = true;
        }

        fn close(&mut self) {
            self.should_close = true;
        }

        fn set_target_valve_position(&mut self, amount: Ratio) {
            self.target_valve_position = amount;
        }
    }
    impl PressureValveActuator for TestValveActuator {
        fn target_valve_position(&self) -> Ratio {
            self.target_valve_position
        }
    }

    #[test]
    fn valve_starts_fully_open() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());
        let error_margin = f64::EPSILON;

        test_bed.run_with_delta(Duration::from_secs(5));

        assert!(
            (test_bed.query(|a| a.valve_open_amount().get::<percent>()) - 100.).abs()
                < error_margin
        );
    }

    #[test]
    fn valve_does_not_instantly_close() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.command(|a| a.command_valve_close());
        test_bed.command(|a| a.command_valve_open_amount(Ratio::new::<percent>(0.)));
        test_bed.run();

        assert!(test_bed.query(|a| a.valve_open_amount().get::<percent>()) > 0.);
    }

    #[test]
    fn valve_closes_when_target_is_closed() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.command(|a| a.command_valve_open());
        test_bed.run_with_delta(Duration::from_secs(4));

        let valve_open_amount = test_bed.query(|a| a.valve_open_amount());

        test_bed.command(|a| a.command_valve_close());
        test_bed.command(|a| a.command_valve_open_amount(Ratio::new::<percent>(0.)));
        test_bed.run_with_delta(Duration::from_secs(3));

        assert!(test_bed.query(|a| a.valve_open_amount()) < valve_open_amount);
    }

    #[test]
    fn valve_does_not_instantly_open() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.command(|a| a.command_valve_close());
        test_bed.command(|a| a.command_valve_open_amount(Ratio::new::<percent>(0.)));
        test_bed.run_with_delta(Duration::from_secs(4));

        test_bed.command(|a| a.command_valve_open());
        test_bed.command(|a| a.command_valve_open_amount(Ratio::new::<percent>(100.)));
        test_bed.run_with_delta(Duration::from_secs(3));

        assert!(test_bed.query(|a| a.valve_open_amount().get::<percent>()) < 100.);
    }

    #[test]
    fn valve_never_closes_beyond_0_percent() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.command(|a| a.command_valve_close());
        test_bed.command(|a| a.command_valve_open_amount(Ratio::new::<percent>(0.)));
        test_bed.run_with_delta(Duration::from_secs(1_000));

        test_bed.command(|a| a.command_valve_close());
        test_bed.run();

        assert_eq!(
            test_bed.query(|a| a.valve_open_amount()),
            Ratio::new::<percent>(0.)
        );
    }

    #[test]
    fn valve_never_opens_beyond_100_percent() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.command(|a| a.command_valve_close());
        test_bed.command(|a| a.command_valve_open_amount(Ratio::new::<percent>(0.)));
        test_bed.run_with_delta(Duration::from_secs(1_000));

        test_bed.command(|a| a.command_valve_open());
        test_bed.command(|a| a.command_valve_open_amount(Ratio::new::<percent>(100.)));
        test_bed.run_with_delta(Duration::from_secs(1_000));

        test_bed.command(|a| a.command_valve_open());
        test_bed.run();

        assert_eq!(
            test_bed.query(|a| a.valve_open_amount()),
            Ratio::new::<percent>(100.)
        );
    }
}
