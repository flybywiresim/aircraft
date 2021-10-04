use crate::{shared::ControllerSignal, simulation::UpdateContext};

use super::{CabinPressureSimulation, OutflowValveActuator, PressurizationOverheadPanel};

use std::time::Duration;
use uom::si::{f64::*, ratio::percent};

pub(super) enum PressureValveSignal {
    Open,
    Close,
    Neutral,
}

pub(super) struct PressureValve {
    open_amount: Ratio,
    target_open: Ratio,
    full_travel_time: Duration,
    manual_travel_time: Duration,
}

impl PressureValve {
    pub fn new_outflow_valve() -> Self {
        Self {
            open_amount: Ratio::new::<percent>(100.),
            target_open: Ratio::new::<percent>(100.),
            full_travel_time: Duration::from_secs(4),
            manual_travel_time: Duration::from_secs(55),
        }
    }

    pub fn new_safety_valve() -> Self {
        Self {
            open_amount: Ratio::new::<percent>(0.),
            target_open: Ratio::new::<percent>(0.),
            full_travel_time: Duration::from_secs(1),
            manual_travel_time: Duration::from_secs(1),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        signal: &impl ControllerSignal<PressureValveSignal>,
    ) {
        match signal.signal() {
            Some(PressureValveSignal::Open) => {
                if self.open_amount < Ratio::new::<percent>(100.) {
                    self.open_amount += Ratio::new::<percent>(
                        self.get_manual_change_for_delta(context)
                            .min(100. - self.open_amount.get::<percent>()),
                    );
                }
            }
            Some(PressureValveSignal::Close) => {
                if self.open_amount > Ratio::new::<percent>(0.) {
                    self.open_amount -= Ratio::new::<percent>(
                        self.get_manual_change_for_delta(context)
                            .min(self.open_amount.get::<percent>()),
                    );
                }
            }
            Some(PressureValveSignal::Neutral) => (),
            None => {
                if self.open_amount < self.target_open {
                    self.open_amount +=
                        Ratio::new::<percent>(self.get_valve_change_for_delta(context).min(
                            self.target_open.get::<percent>() - self.open_amount.get::<percent>(),
                        ));
                } else if self.open_amount > self.target_open {
                    self.open_amount -=
                        Ratio::new::<percent>(self.get_valve_change_for_delta(context).min(
                            self.open_amount.get::<percent>() - self.target_open.get::<percent>(),
                        ));
                }
            }
        }
    }

    pub fn calculate_outflow_valve_position<T: OutflowValveActuator>(
        &mut self,
        actuator: &T,
        press_overhead: &PressurizationOverheadPanel,
        cabin_pressure_simulation: &CabinPressureSimulation,
    ) {
        self.target_open =
            actuator.target_valve_position(press_overhead, cabin_pressure_simulation);
    }

    fn get_valve_change_for_delta(&self, context: &UpdateContext) -> f64 {
        100. * (context.delta_as_secs_f64() / self.full_travel_time.as_secs_f64())
    }

    fn get_manual_change_for_delta(&self, context: &UpdateContext) -> f64 {
        100. * (context.delta_as_secs_f64() / self.manual_travel_time.as_secs_f64())
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
                valve: PressureValve::new_outflow_valve(),
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
            self.should_close = false;
        }

        fn close(&mut self) {
            self.should_open = false;
            self.should_close = true;
        }

        fn set_target_valve_position(&mut self, amount: Ratio) {
            self.target_valve_position = amount;
        }
    }
    impl OutflowValveActuator for TestValveActuator {
        fn target_valve_position(
            &self,
            _: &PressurizationOverheadPanel,
            _: &CabinPressureSimulation,
        ) -> Ratio {
            self.target_valve_position
        }
    }
    impl ControllerSignal<PressureValveSignal> for TestValveActuator {
        fn signal(&self) -> Option<PressureValveSignal> {
            if self.should_open {
                Some(PressureValveSignal::Open)
            } else if self.should_close {
                Some(PressureValveSignal::Close)
            } else {
                None
            }
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
