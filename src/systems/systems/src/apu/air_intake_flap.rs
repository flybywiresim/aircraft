use super::AirIntakeFlapController;
use crate::{
    shared::{random_number, ConsumePower, ElectricalBusType, ElectricalBuses},
    simulation::{SimulationElement, UpdateContext},
};
use std::time::Duration;
use uom::si::{f64::*, power::watt, ratio::percent};

pub struct AirIntakeFlap {
    is_powered: bool,
    powered_by: ElectricalBusType,
    open_amount: Ratio,
    travel_time: Duration,
    is_moving: bool,
}
impl AirIntakeFlap {
    const MINIMUM_TRAVEL_TIME_SECS: u8 = 6;
    const MAXIMUM_TRAVEL_TIME_SECS: u8 = 12;

    pub fn new(powered_by: ElectricalBusType) -> AirIntakeFlap {
        let random_above_minimum_mod =
            AirIntakeFlap::MAXIMUM_TRAVEL_TIME_SECS - AirIntakeFlap::MINIMUM_TRAVEL_TIME_SECS + 1;
        let travel_time = Duration::from_secs(
            (AirIntakeFlap::MINIMUM_TRAVEL_TIME_SECS + (random_number() % random_above_minimum_mod))
                as u64,
        );

        AirIntakeFlap {
            is_powered: false,
            powered_by,
            open_amount: Ratio::new::<percent>(0.),
            travel_time,
            is_moving: false,
        }
    }

    pub fn update(&mut self, context: &UpdateContext, controller: &impl AirIntakeFlapController) {
        if !self.is_powered {
            self.is_moving = false;
            return;
        }

        if controller.should_open_air_intake_flap()
            && self.open_amount < Ratio::new::<percent>(100.)
        {
            self.open_amount += Ratio::new::<percent>(
                self.get_flap_change_for_delta(context)
                    .min(100. - self.open_amount.get::<percent>()),
            );

            self.is_moving = (self.open_amount.get::<percent>() - 100.).abs() > f64::EPSILON;
        } else if !controller.should_open_air_intake_flap()
            && self.open_amount > Ratio::new::<percent>(0.)
        {
            self.open_amount -= Ratio::new::<percent>(
                self.get_flap_change_for_delta(context)
                    .min(self.open_amount.get::<percent>()),
            );

            self.is_moving = (self.open_amount.get::<percent>() - 0.).abs() > f64::EPSILON;
        } else {
            self.is_moving = false;
        }
    }

    fn get_flap_change_for_delta(&self, context: &UpdateContext) -> f64 {
        100. * (context.delta_as_secs_f64() / self.travel_time.as_secs_f64())
    }

    pub fn open_amount(&self) -> Ratio {
        self.open_amount
    }

    #[cfg(test)]
    pub fn is_fully_open(&self) -> bool {
        (self.open_amount.get::<percent>() - 100.).abs() < f64::EPSILON
    }

    #[cfg(test)]
    pub fn set_travel_time(&mut self, travel_time: Duration) {
        self.travel_time = travel_time;
    }
}
impl SimulationElement for AirIntakeFlap {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by);
    }

    fn consume_power<T: ConsumePower>(&mut self, consumption: &mut T) {
        if self.is_moving {
            consumption.consume_from_bus(self.powered_by, Power::new::<watt>(20.))
        }
    }
}

#[cfg(test)]
mod air_intake_flap_tests {
    use super::*;
    use crate::shared::{ElectricalBusType, PotentialOrigin, PowerConsumptionReport};
    use crate::simulation::{test::SimulationTestBed, Aircraft, SimulationElement};
    use crate::{
        electrical::{consumption::SuppliedPower, Potential},
        simulation::SimulationElementVisitor,
    };
    use ntest::assert_about_eq;
    use uom::si::{electric_potential::volt, power::watt};

    struct TestAircraft {
        flap: AirIntakeFlap,
        controller: TestFlapController,
        is_powered: bool,
        power_consumption: Power,
    }
    impl TestAircraft {
        fn new() -> Self {
            Self {
                flap: AirIntakeFlap::new(ElectricalBusType::DirectCurrentBattery),
                controller: TestFlapController::new(),
                is_powered: true,
                power_consumption: Power::new::<watt>(0.),
            }
        }

        fn command_flap_open(&mut self) {
            self.controller.open();
        }

        fn command_flap_close(&mut self) {
            self.controller.close();
        }

        fn flap_open_amount(&self) -> Ratio {
            self.flap.open_amount()
        }

        fn flap_is_fully_open(&self) -> bool {
            self.flap.is_fully_open()
        }

        fn unpower(&mut self) {
            self.is_powered = false;
        }

        fn power_consumption(&self) -> Power {
            self.power_consumption
        }
    }
    impl Aircraft for TestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            // In the real aircraft this update would happen before power distribution.
            // Updating before power distribution would require two runs to be executed.
            // For testing purposes this doesn't matter, and therefore we don't do it.
            self.flap.update(context, &self.controller);
        }

        fn get_supplied_power(&mut self) -> SuppliedPower {
            let mut supplied_power = SuppliedPower::new();
            if self.is_powered {
                supplied_power.add(
                    ElectricalBusType::DirectCurrentBattery,
                    Potential::single(
                        PotentialOrigin::Battery(1),
                        ElectricPotential::new::<volt>(28.),
                    ),
                );
            }

            supplied_power
        }
    }
    impl SimulationElement for TestAircraft {
        fn process_power_consumption_report<T: PowerConsumptionReport>(&mut self, report: &T) {
            self.power_consumption = report.total_consumption_of(PotentialOrigin::Battery(1));
        }

        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.flap.accept(visitor);

            visitor.visit(self);
        }
    }

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
        let mut aircraft = TestAircraft::new();
        let mut test_bed = SimulationTestBed::new_with_delta(Duration::from_secs(5));

        aircraft.command_flap_open();
        test_bed.run_aircraft(&mut aircraft);

        assert!(aircraft.flap_open_amount().get::<percent>() > 0.);
    }

    #[test]
    fn does_not_instantly_open() {
        let mut aircraft = TestAircraft::new();
        let mut test_bed = SimulationTestBed::new_with_delta(Duration::from_secs(
            (AirIntakeFlap::MINIMUM_TRAVEL_TIME_SECS - 1) as u64,
        ));

        aircraft.command_flap_open();
        test_bed.run_aircraft(&mut aircraft);

        assert!(aircraft.flap_open_amount().get::<percent>() < 100.);
    }

    #[test]
    fn closes_when_target_is_closed() {
        let mut aircraft = TestAircraft::new();
        let mut test_bed = SimulationTestBed::new_with_delta(Duration::from_secs(5));

        aircraft.command_flap_open();
        test_bed.run_aircraft(&mut aircraft);

        let flap_open_amount = aircraft.flap_open_amount();

        aircraft.command_flap_close();
        test_bed.set_delta(Duration::from_secs(2));
        test_bed.run_aircraft(&mut aircraft);

        assert!(aircraft.flap_open_amount() < flap_open_amount);
    }

    #[test]
    fn does_not_instantly_close() {
        let mut aircraft = TestAircraft::new();
        let mut test_bed = SimulationTestBed::new_with_delta(Duration::from_secs(
            AirIntakeFlap::MAXIMUM_TRAVEL_TIME_SECS as u64,
        ));

        aircraft.command_flap_open();
        test_bed.run_aircraft(&mut aircraft);

        aircraft.command_flap_close();
        test_bed.set_delta(Duration::from_secs(
            (AirIntakeFlap::MINIMUM_TRAVEL_TIME_SECS - 1) as u64,
        ));
        test_bed.run_aircraft(&mut aircraft);

        assert!(aircraft.flap_open_amount().get::<percent>() > 0.);
    }

    #[test]
    fn never_closes_beyond_0_percent() {
        let mut aircraft = TestAircraft::new();
        let mut test_bed = SimulationTestBed::new_with_delta(Duration::from_secs(1_000));

        aircraft.command_flap_close();
        test_bed.run_aircraft(&mut aircraft);

        assert_eq!(aircraft.flap_open_amount(), Ratio::new::<percent>(0.));
    }

    #[test]
    fn never_opens_beyond_100_percent() {
        let mut aircraft = TestAircraft::new();
        let mut test_bed = SimulationTestBed::new_with_delta(Duration::from_secs(1_000));

        aircraft.command_flap_open();
        test_bed.run_aircraft(&mut aircraft);

        assert_eq!(aircraft.flap_open_amount(), Ratio::new::<percent>(100.));
    }

    #[test]
    fn is_fully_open_returns_false_when_closed() {
        let aircraft = TestAircraft::new();

        assert_eq!(aircraft.flap_is_fully_open(), false)
    }

    #[test]
    fn is_fully_open_returns_true_when_open() {
        let mut aircraft = TestAircraft::new();
        let mut test_bed = SimulationTestBed::new_with_delta(Duration::from_secs(1_000));

        aircraft.command_flap_open();
        test_bed.run_aircraft(&mut aircraft);

        assert_eq!(aircraft.flap_is_fully_open(), true)
    }

    #[test]
    fn does_not_move_when_unpowered() {
        let mut aircraft = TestAircraft::new();
        let mut test_bed = SimulationTestBed::new_with_delta(Duration::from_secs(5));

        aircraft.command_flap_open();
        aircraft.unpower();
        test_bed.run_aircraft(&mut aircraft);

        assert_about_eq!(aircraft.flap_open_amount().get::<percent>(), 0.);
    }

    #[test]
    fn uses_power_when_moving() {
        let mut aircraft = TestAircraft::new();
        let mut test_bed = SimulationTestBed::new_with_delta(Duration::from_secs(2));

        aircraft.command_flap_open();
        test_bed.run_aircraft(&mut aircraft);

        assert!(aircraft.power_consumption().get::<watt>() > 0.);
    }

    #[test]
    fn uses_no_power_when_not_moving() {
        let mut aircraft = TestAircraft::new();
        let mut test_bed = SimulationTestBed::new_with_delta(Duration::from_secs(2));

        test_bed.run_aircraft(&mut aircraft);

        assert_about_eq!(aircraft.power_consumption().get::<watt>(), 0.);
    }
}
