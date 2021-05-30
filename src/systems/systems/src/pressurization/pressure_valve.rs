use crate::{
    simulation::UpdateContext,
};

use super::{PressureValveActuator};

use std::time::Duration;
use uom::si::{f64::*, ratio::percent,};

pub struct PressureValve {
    open_amount: Ratio,
    target_open: Ratio,
    full_travel_time: Duration,
}

impl PressureValve {
    pub fn new() -> Self {
        Self {
            open_amount: Ratio::new::<percent>(100.),
            target_open: Ratio::new::<percent>(100.),
            full_travel_time: Duration::from_secs(4), //Guessed value
        }
    }

    pub fn update<T: PressureValveActuator>(&mut self, context: &UpdateContext, actuator: &T) {
        self.target_open = actuator.target_valve_position();
        if actuator.should_open_pressure_valve() && self.open_amount() < self.target_open() {
            self.open_amount += Ratio::new::<percent>(
                self.get_valve_change_for_delta(context).min(self.target_open().get::<percent>() - self.open_amount.get::<percent>()),
            );
        } else if actuator.should_close_pressure_valve() && self.open_amount() > self.target_open() {
            self.open_amount -= Ratio::new::<percent>(
                self.get_valve_change_for_delta(context).min(self.open_amount.get::<percent>() - self.target_open().get::<percent>()),
            );
        }
    }

    fn target_open(&self) -> Ratio {
        self.target_open
    }

    fn get_valve_change_for_delta(&self, context: &UpdateContext) -> f64 {
        100. * (context.delta().as_secs_f64() / self.full_travel_time.as_secs_f64())
    }

    pub fn open_amount(&self) -> Ratio {
        self.open_amount
    }
}

#[cfg(test)]
mod pressure_valve_tests {
    use super::*;
    use crate::simulation::test::SimulationTestBed;
    use crate::simulation::{Aircraft, SimulationElement};

    struct TestAircraft {
        valve: PressureValve,
        actuator: TestValveActuator,
    }
    impl TestAircraft {
        fn new(valve: PressureValve, actuator: TestValveActuator) -> Self {
            Self { valve, actuator }
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
        fn should_open_pressure_valve(&self) -> bool {
            self.should_open
        }
        fn should_close_pressure_valve(&self) -> bool {
            self.should_close
        }
        fn target_valve_position(&self) -> Ratio {
            self.target_valve_position
        }
    }

    #[test]
    fn valve_starts_fully_open() {
        let mut aircraft = TestAircraft::new(PressureValve::new(), TestValveActuator::new());
        let mut test_bed = SimulationTestBed::new_with_delta(Duration::from_secs(5));

        test_bed.run_aircraft(&mut aircraft);

        assert_eq!(aircraft.valve_open_amount().get::<percent>(), 100.);
    }

    #[test]
    fn valve_does_not_instantly_close() {
        let mut aircraft = TestAircraft::new(PressureValve::new(), TestValveActuator::new());
        let mut test_bed = SimulationTestBed::new_with_delta(Duration::from_secs(1));

        aircraft.command_valve_close();
        aircraft.command_valve_open_amount(Ratio::new::<percent>(0.));
        test_bed.run_aircraft(&mut aircraft);

        assert!(aircraft.valve_open_amount().get::<percent>() > 0.);
    }

    #[test]
    fn valve_closes_when_target_is_closed() {
        let mut aircraft = TestAircraft::new(PressureValve::new(), TestValveActuator::new());
        let mut test_bed = SimulationTestBed::new_with_delta(Duration::from_secs(4));

        aircraft.command_valve_open();
        test_bed.run_aircraft(&mut aircraft);

        let valve_open_amount = aircraft.valve_open_amount();

        aircraft.command_valve_close();
        aircraft.command_valve_open_amount(Ratio::new::<percent>(0.));
        test_bed.set_delta(Duration::from_secs(3));
        test_bed.run_aircraft(&mut aircraft);

        assert!(aircraft.valve_open_amount() < valve_open_amount);
    }

    #[test]
    fn valve_does_not_instantly_open() {
        let mut aircraft = TestAircraft::new(PressureValve::new(), TestValveActuator::new());
        let mut test_bed = SimulationTestBed::new_with_delta(Duration::from_secs(4));

        aircraft.command_valve_close();
        aircraft.command_valve_open_amount(Ratio::new::<percent>(0.));
        test_bed.run_aircraft(&mut aircraft);

        aircraft.command_valve_open();
        aircraft.command_valve_open_amount(Ratio::new::<percent>(100.));
        test_bed.set_delta(Duration::from_secs(3));
        test_bed.run_aircraft(&mut aircraft);

        assert!(aircraft.valve_open_amount().get::<percent>() < 100.);
    }

    #[test]
    fn valve_never_closes_beyond_0_percent() {
        let mut aircraft = TestAircraft::new(PressureValve::new(), TestValveActuator::new());
        let mut test_bed = SimulationTestBed::new_with_delta(Duration::from_secs(1_000));

        aircraft.command_valve_close();
        aircraft.command_valve_open_amount(Ratio::new::<percent>(0.));
        test_bed.run_aircraft(&mut aircraft);

        aircraft.command_valve_close();
        test_bed.run_aircraft(&mut aircraft);

        assert_eq!(aircraft.valve_open_amount(), Ratio::new::<percent>(0.));
    }

    #[test]
    fn valve_never_opens_beyond_100_percent() {
        let mut aircraft = TestAircraft::new(PressureValve::new(), TestValveActuator::new());
        let mut test_bed = SimulationTestBed::new_with_delta(Duration::from_secs(1_000));

        aircraft.command_valve_close();
        aircraft.command_valve_open_amount(Ratio::new::<percent>(0.));
        test_bed.run_aircraft(&mut aircraft);

        aircraft.command_valve_open();
        aircraft.command_valve_open_amount(Ratio::new::<percent>(100.));
        test_bed.run_aircraft(&mut aircraft);

        aircraft.command_valve_open();
        test_bed.run_aircraft(&mut aircraft);

        assert_eq!(aircraft.valve_open_amount(), Ratio::new::<percent>(100.));
    }
}
