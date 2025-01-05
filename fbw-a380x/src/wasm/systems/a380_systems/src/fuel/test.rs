use std::{collections::HashMap, time::Duration};

use ntest::{assert_false, assert_true};
use systems::{electrical::Electricity, fuel::RefuelRate, simulation::test::ReadByName};
use uom::si::mass::kilogram;

use super::*;
use crate::systems::simulation::{
    test::{SimulationTestBed, TestBed, WriteByName},
    Aircraft, SimulationElement, SimulationElementVisitor,
};
struct FuelTestAircraft {
    fuel: A380Fuel,
}

impl FuelTestAircraft {
    fn new(context: &mut InitContext) -> Self {
        Self {
            fuel: A380Fuel::new(context),
        }
    }

    fn fore_aft_center_of_gravity(&self) -> f64 {
        self.fuel.fore_aft_center_of_gravity()
    }

    fn tank_mass(&self, tank: usize) -> Mass {
        self.fuel.tank_mass(tank)
    }
}

impl Aircraft for FuelTestAircraft {
    fn update_before_power_distribution(
        &mut self,
        context: &UpdateContext,
        _electricity: &mut Electricity,
    ) {
        self.fuel.update(context);
    }
}
impl SimulationElement for FuelTestAircraft {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.fuel.accept(visitor);

        visitor.visit(self);
    }
}

const MINUTES_TO_SECONDS: u64 = 60;
const FUEL_GALLONS_TO_KG: f64 = 3.039075693483925;
const LBS_TO_KG: f64 = 0.4535934;

struct FuelTestBed {
    test_bed: SimulationTestBed<FuelTestAircraft>,
}
impl FuelTestBed {
    fn new() -> Self {
        FuelTestBed {
            test_bed: SimulationTestBed::new(FuelTestAircraft::new),
        }
    }

    fn and_run(mut self) -> Self {
        self.run();

        self
    }

    fn and_stabilize(mut self) -> Self {
        let five_minutes = 5 * MINUTES_TO_SECONDS;
        self.test_bed
            .run_multiple_frames(Duration::from_secs(five_minutes));

        self
    }

    fn run_multiple_frames(mut self, duration: Duration) -> Self {
        self.test_bed.run_multiple_frames(duration);
        self
    }

    fn fuel_low(mut self) -> Self {
        self.write_by_name("FUEL_TANK_QUANTITY_1", 300. / FUEL_GALLONS_TO_KG);
        self.write_by_name("FUEL_TANK_QUANTITY_2", 300. / FUEL_GALLONS_TO_KG);
        self.write_by_name("FUEL_TANK_QUANTITY_3", 300. / FUEL_GALLONS_TO_KG);
        self.write_by_name("FUEL_TANK_QUANTITY_4", 300. / FUEL_GALLONS_TO_KG);
        self.write_by_name("FUEL_TANK_QUANTITY_5", 300. / FUEL_GALLONS_TO_KG);
        self.write_by_name("FUEL_TANK_QUANTITY_6", 300. / FUEL_GALLONS_TO_KG);
        self.write_by_name("FUEL_TANK_QUANTITY_7", 300. / FUEL_GALLONS_TO_KG);
        self.write_by_name("FUEL_TANK_QUANTITY_8", 300. / FUEL_GALLONS_TO_KG);
        self.write_by_name("FUEL_TANK_QUANTITY_9", 300. / FUEL_GALLONS_TO_KG);
        self.write_by_name("FUEL_TANK_QUANTITY_10", 300. / FUEL_GALLONS_TO_KG);
        self.write_by_name("FUEL_TANK_QUANTITY_11", 300. / FUEL_GALLONS_TO_KG);
        self.write_by_name("FUEL TOTAL QUANTITY WEIGHT", 3300. / LBS_TO_KG);

        self
    }

    fn fuel_high(mut self) -> Self {
        self.write_by_name("FUEL_TANK_QUANTITY_1", 1500. / FUEL_GALLONS_TO_KG);
        self.write_by_name("FUEL_TANK_QUANTITY_2", 1500. / FUEL_GALLONS_TO_KG);
        self.write_by_name("FUEL_TANK_QUANTITY_3", 1500. / FUEL_GALLONS_TO_KG);
        self.write_by_name("FUEL_TANK_QUANTITY_4", 10000. / FUEL_GALLONS_TO_KG);
        self.write_by_name("FUEL_TANK_QUANTITY_5", 1500. / FUEL_GALLONS_TO_KG);
        self.write_by_name("FUEL_TANK_QUANTITY_6", 1500. / FUEL_GALLONS_TO_KG);
        self.write_by_name("FUEL_TANK_QUANTITY_7", 10000. / FUEL_GALLONS_TO_KG);
        self.write_by_name("FUEL_TANK_QUANTITY_8", 1500. / FUEL_GALLONS_TO_KG);
        self.write_by_name("FUEL_TANK_QUANTITY_9", 1500. / FUEL_GALLONS_TO_KG);
        self.write_by_name("FUEL_TANK_QUANTITY_10", 1500. / FUEL_GALLONS_TO_KG);
        self.write_by_name("FUEL_TANK_QUANTITY_11", 1500. / FUEL_GALLONS_TO_KG);
        self.write_by_name("FUEL TOTAL QUANTITY WEIGHT", 33500. / LBS_TO_KG);

        self
    }

    #[allow(dead_code)]
    fn desired_fuel_a(mut self) -> Self {
        self.write_by_name("FUEL_DESIRED", 18000.);
        self
    }

    #[allow(dead_code)]
    fn desired_fuel_b(mut self) -> Self {
        self.write_by_name("FUEL_DESIRED", 26000.);
        self
    }

    #[allow(dead_code)]
    fn desired_fuel_c(mut self) -> Self {
        self.write_by_name("FUEL_DESIRED", 36000.);
        self
    }

    #[allow(dead_code)]
    fn desired_fuel_d(mut self) -> Self {
        self.write_by_name("FUEL_DESIRED", 47000.);
        self
    }

    #[allow(dead_code)]
    fn desired_fuel_e(mut self) -> Self {
        self.write_by_name("FUEL_DESIRED", 103788.);
        self
    }

    #[allow(dead_code)]
    fn desired_fuel_f(mut self) -> Self {
        self.write_by_name("FUEL_DESIRED", 158042.);
        self
    }

    #[allow(dead_code)]
    fn desired_fuel_g(mut self) -> Self {
        self.write_by_name("FUEL_DESIRED", 215702.);
        self
    }

    #[allow(dead_code)]
    fn desired_fuel_h(mut self) -> Self {
        self.write_by_name("FUEL_DESIRED", 223028.);
        self
    }

    #[allow(dead_code)]
    fn desired_fuel_max(mut self) -> Self {
        self.write_by_name("FUEL_DESIRED", 260059.);
        self.write_by_name("AIRFRAME_ZFW_DESIRED", 300000.);
        self.write_by_name("AIRFRAME_ZFW_CG_PERCENT_MAC_DESIRED", 36.5);
        self
    }

    #[allow(dead_code)]
    fn desired_fuel_min(mut self) -> Self {
        self.write_by_name("FUEL_DESIRED", 0.);
        self.write_by_name("AIRFRAME_ZFW_DESIRED", 300000.);
        self.write_by_name("AIRFRAME_ZFW_CG_PERCENT_MAC_DESIRED", 36.5);
        self
    }

    #[allow(dead_code)]
    fn desired_fuel_50000(mut self) -> Self {
        self.write_by_name("FUEL_DESIRED", 50000.);
        self.write_by_name("AIRFRAME_ZFW_DESIRED", 300000.);
        self.write_by_name("AIRFRAME_ZFW_CG_PERCENT_MAC_DESIRED", 36.5);
        self
    }

    #[allow(dead_code)]
    fn desired_fuel_100000(mut self) -> Self {
        self.write_by_name("FUEL_DESIRED", 100000.);
        self.write_by_name("AIRFRAME_ZFW_DESIRED", 300000.);
        self.write_by_name("AIRFRAME_ZFW_CG_PERCENT_MAC_DESIRED", 36.5);
        self
    }

    #[allow(dead_code)]
    fn desired_fuel_200000(mut self) -> Self {
        self.write_by_name("FUEL_DESIRED", 200000.);
        self.write_by_name("AIRFRAME_ZFW_DESIRED", 300000.);
        self.write_by_name("AIRFRAME_ZFW_CG_PERCENT_MAC_DESIRED", 36.5);
        self
    }

    fn trigger_instant_refuel(mut self) -> Self {
        self.write_by_name("EFB_REFUEL_RATE_SETTING", RefuelRate::Instant);
        self.write_by_name("REFUEL_STARTED_BY_USR", true);
        self
    }

    fn trigger_fast_refuel(mut self) -> Self {
        self.write_by_name("EFB_REFUEL_RATE_SETTING", RefuelRate::Fast);
        self.write_by_name("REFUEL_STARTED_BY_USR", true);
        self
    }

    fn trigger_real_refuel(mut self) -> Self {
        self.write_by_name("EFB_REFUEL_RATE_SETTING", RefuelRate::Real);
        self.write_by_name("REFUEL_STARTED_BY_USR", true);
        self
    }

    fn refuel_status(&mut self) -> bool {
        self.read_by_name("REFUEL_STARTED_BY_USR")
    }

    fn fore_aft_center_of_gravity(&self) -> f64 {
        self.query(|a: &FuelTestAircraft| a.fore_aft_center_of_gravity())
    }

    fn tank_mass(&self, tank: usize) -> Mass {
        self.query(|a: &FuelTestAircraft| a.tank_mass(tank))
    }
}

impl TestBed for FuelTestBed {
    type Aircraft = FuelTestAircraft;

    fn test_bed(&self) -> &SimulationTestBed<FuelTestAircraft> {
        &self.test_bed
    }

    fn test_bed_mut(&mut self) -> &mut SimulationTestBed<FuelTestAircraft> {
        &mut self.test_bed
    }
}

fn test_bed() -> FuelTestBed {
    FuelTestBed::new()
}

fn test_bed_with() -> FuelTestBed {
    test_bed()
}

fn assert_fuel_quantity(
    test_bed: &FuelTestBed,
    expected_quantities: HashMap<A380FuelTankType, Mass>,
) {
    for tank in A380FuelTankType::iterator() {
        assert_eq!(
            test_bed.tank_mass(tank as usize).get::<kilogram>().round(),
            (*expected_quantities.get(&tank).unwrap_or(&Mass::default()))
                .get::<kilogram>()
                .round(),
            "Actual Mass of {:?} was {:?}",
            tank,
            test_bed.tank_mass(tank as usize).get::<kilogram>(),
        )
    }
}

fn assert_fuel_quantity_0(test_bed: &FuelTestBed) {
    let expected_quantities = HashMap::new();
    assert_fuel_quantity(test_bed, expected_quantities);
}

fn assert_fuel_quantity_50000(test_bed: &FuelTestBed) {
    let mut expected_quantities = HashMap::new();
    expected_quantities.insert(A380FuelTankType::Trim, Mass::new::<kilogram>(3000.));
    expected_quantities.insert(A380FuelTankType::LeftOuter, Mass::new::<kilogram>(4000.));
    expected_quantities.insert(A380FuelTankType::RightOuter, Mass::new::<kilogram>(4000.));
    expected_quantities.insert(A380FuelTankType::LeftInner, Mass::new::<kilogram>(5500.));
    expected_quantities.insert(A380FuelTankType::RightInner, Mass::new::<kilogram>(5500.));
    expected_quantities.insert(A380FuelTankType::FeedOne, Mass::new::<kilogram>(7000.));
    expected_quantities.insert(A380FuelTankType::FeedTwo, Mass::new::<kilogram>(7000.));
    expected_quantities.insert(A380FuelTankType::FeedThree, Mass::new::<kilogram>(7000.));
    expected_quantities.insert(A380FuelTankType::FeedFour, Mass::new::<kilogram>(7000.));
    assert_fuel_quantity(test_bed, expected_quantities);
}

fn assert_fuel_quantity_100000(test_bed: &FuelTestBed) {
    let mut expected_quantities = HashMap::new();
    expected_quantities.insert(A380FuelTankType::Trim, Mass::new::<kilogram>(8500.));
    expected_quantities.insert(A380FuelTankType::LeftOuter, Mass::new::<kilogram>(4000.));
    expected_quantities.insert(A380FuelTankType::RightOuter, Mass::new::<kilogram>(4000.));
    expected_quantities.insert(A380FuelTankType::LeftInner, Mass::new::<kilogram>(5500.));
    expected_quantities.insert(A380FuelTankType::RightInner, Mass::new::<kilogram>(5500.));
    expected_quantities.insert(
        A380FuelTankType::FeedOne,
        Mass::new::<kilogram>(7000. + 44500. * 20558. / 84788.),
    );
    expected_quantities.insert(
        A380FuelTankType::FeedTwo,
        Mass::new::<kilogram>(7000. + 44500. * 21836. / 84788.),
    );
    expected_quantities.insert(
        A380FuelTankType::FeedThree,
        Mass::new::<kilogram>(7000. + 44500. * 21836. / 84788.),
    );
    expected_quantities.insert(
        A380FuelTankType::FeedFour,
        Mass::new::<kilogram>(7000. + 44500. * 20558. / 84788.),
    );

    assert_fuel_quantity(test_bed, expected_quantities);
}

fn assert_fuel_quantity_200000(test_bed: &FuelTestBed) {
    let mut expected_quantities = HashMap::new();
    expected_quantities.insert(A380FuelTankType::Trim, Mass::new::<kilogram>(13500.));
    expected_quantities.insert(A380FuelTankType::LeftOuter, Mass::new::<kilogram>(4000.));
    expected_quantities.insert(A380FuelTankType::RightOuter, Mass::new::<kilogram>(4000.));
    expected_quantities.insert(A380FuelTankType::LeftMid, Mass::new::<kilogram>(27127.));
    expected_quantities.insert(A380FuelTankType::RightMid, Mass::new::<kilogram>(27127.));
    expected_quantities.insert(A380FuelTankType::LeftInner, Mass::new::<kilogram>(19729.));
    expected_quantities.insert(A380FuelTankType::RightInner, Mass::new::<kilogram>(19729.));
    expected_quantities.insert(A380FuelTankType::FeedOne, Mass::new::<kilogram>(20558.));
    expected_quantities.insert(A380FuelTankType::FeedTwo, Mass::new::<kilogram>(21836.));
    expected_quantities.insert(A380FuelTankType::FeedThree, Mass::new::<kilogram>(21836.));
    expected_quantities.insert(A380FuelTankType::FeedFour, Mass::new::<kilogram>(20558.));

    assert_fuel_quantity(test_bed, expected_quantities);
}

#[test]
fn init() {
    let test_bed = test_bed_with().fuel_low();

    assert!(test_bed.contains_variable_with_name("FUEL_TANK_QUANTITY_1"));
    assert!(test_bed.contains_variable_with_name("FUEL_TANK_QUANTITY_2"));
    assert!(test_bed.contains_variable_with_name("FUEL_TANK_QUANTITY_3"));
    assert!(test_bed.contains_variable_with_name("FUEL_TANK_QUANTITY_4"));
    assert!(test_bed.contains_variable_with_name("FUEL_TANK_QUANTITY_5"));
    assert!(test_bed.contains_variable_with_name("FUEL_TANK_QUANTITY_6"));
    assert!(test_bed.contains_variable_with_name("FUEL_TANK_QUANTITY_7"));
    assert!(test_bed.contains_variable_with_name("FUEL_TANK_QUANTITY_8"));
    assert!(test_bed.contains_variable_with_name("FUEL_TANK_QUANTITY_9"));
    assert!(test_bed.contains_variable_with_name("FUEL_TANK_QUANTITY_10"));
    assert!(test_bed.contains_variable_with_name("FUEL_TANK_QUANTITY_11"));
    assert!(test_bed.contains_variable_with_name("FUEL TOTAL QUANTITY WEIGHT"));
}

#[test]
fn low_fuel() {
    let mut test_bed = test_bed_with().fuel_low();
    test_bed = test_bed.and_run().and_stabilize();

    assert_eq!(
        (test_bed.fore_aft_center_of_gravity() * 100.).round() / 100.,
        -4.57,
        "Expected cg: -4.57, cg: {}",
        (test_bed.fore_aft_center_of_gravity() * 100.).round() / 100.,
    );
}

#[test]
fn high_fuel() {
    let mut test_bed = test_bed_with().fuel_high();
    test_bed = test_bed.and_run().and_stabilize();

    assert_eq!(
        (test_bed.fore_aft_center_of_gravity() * 100.).round() / 100.,
        6.12,
        "Expected cg: 6.12, cg: {}",
        (test_bed.fore_aft_center_of_gravity() * 100.).round() / 100.,
    );
}

#[test]
fn spawn_no_fuel_with_desired_set() {
    let mut test_bed = test_bed_with().desired_fuel_200000().and_run();

    assert_fuel_quantity_0(&test_bed);
    assert_false!(test_bed.refuel_status());
}

#[test]
fn spawn_no_fuel_load_desired_instant_50000() {
    let test_bed = test_bed_with()
        .desired_fuel_50000()
        .trigger_instant_refuel()
        .and_run()
        .and_stabilize();

    assert_fuel_quantity_50000(&test_bed);
}

#[test]
fn spawn_high_fuel_load_desired_instant_50000() {
    let test_bed = test_bed_with()
        .fuel_high()
        .desired_fuel_50000()
        .trigger_instant_refuel()
        .and_run()
        .and_stabilize();

    assert_fuel_quantity_50000(&test_bed);
}

#[test]
fn spawn_no_fuel_load_desired_instant_100000() {
    let test_bed = test_bed_with()
        .desired_fuel_100000()
        .trigger_instant_refuel()
        .and_run()
        .and_stabilize();

    assert_fuel_quantity_100000(&test_bed);
}

#[test]
fn spawn_no_fuel_load_desired_instant_200000() {
    let test_bed = test_bed_with()
        .desired_fuel_200000()
        .trigger_instant_refuel()
        .and_run()
        .and_stabilize();

    assert_fuel_quantity_200000(&test_bed);
}

#[test]
fn spawn_no_fuel_load_desired_fast_50000_one_tick() {
    let mut test_bed: FuelTestBed = test_bed();
    test_bed.set_on_ground(true);

    test_bed = test_bed
        .desired_fuel_50000()
        .trigger_fast_refuel()
        .and_run();

    let mut expected_quantities = HashMap::new();
    expected_quantities.insert(A380FuelTankType::FeedOne, Mass::new::<kilogram>(121.55));
    expected_quantities.insert(A380FuelTankType::FeedFour, Mass::new::<kilogram>(121.55));

    assert_fuel_quantity(&test_bed, expected_quantities);
    assert_true!(test_bed.refuel_status());
}

#[test]
fn spawn_no_fuel_load_desired_fast_50000_done() {
    let mut test_bed: FuelTestBed = test_bed();
    test_bed.set_on_ground(true);

    test_bed = test_bed
        .desired_fuel_50000()
        .trigger_fast_refuel()
        .and_run()
        .and_stabilize();

    assert_fuel_quantity_50000(&test_bed);
}

#[test]
fn spawn_no_fuel_load_desired_real_50000_in_progress() {
    let mut test_bed: FuelTestBed = test_bed();
    test_bed.set_on_ground(true);

    test_bed = test_bed
        .desired_fuel_50000()
        .trigger_real_refuel()
        .and_run()
        .and_stabilize();

    assert_true!(test_bed.refuel_status());
}

#[test]
fn spawn_no_fuel_load_desired_real_50000_done() {
    let mut test_bed: FuelTestBed = test_bed();
    test_bed.set_on_ground(true);

    let eighteen_minutes = 18 * MINUTES_TO_SECONDS;

    test_bed = test_bed
        .desired_fuel_50000()
        .trigger_real_refuel()
        .and_run()
        .run_multiple_frames(Duration::from_secs(eighteen_minutes));

    assert_fuel_quantity_50000(&test_bed);
    assert_false!(test_bed.refuel_status());
}

#[test]
fn spawn_no_fuel_load_desired_real_100000_done() {
    let mut test_bed: FuelTestBed = test_bed();
    test_bed.set_on_ground(true);

    let fourty_minutes = 40 * MINUTES_TO_SECONDS;

    test_bed = test_bed
        .desired_fuel_100000()
        .trigger_real_refuel()
        .and_run()
        .run_multiple_frames(Duration::from_secs(fourty_minutes));

    assert_fuel_quantity_100000(&test_bed);
    assert_false!(test_bed.refuel_status());
}

#[test]
fn spawn_no_fuel_load_desired_real_200000_done() {
    let mut test_bed: FuelTestBed = test_bed();
    test_bed.set_on_ground(true);

    let seventy_minutes = 70 * MINUTES_TO_SECONDS;

    test_bed = test_bed
        .desired_fuel_200000()
        .trigger_real_refuel()
        .and_run()
        .run_multiple_frames(Duration::from_secs(seventy_minutes));

    assert_fuel_quantity_200000(&test_bed);
    assert_false!(test_bed.refuel_status());
}

#[test]
fn defuel_high_fuel_load_desired_real_done() {
    let mut test_bed: FuelTestBed = test_bed();
    test_bed.set_on_ground(true);

    let seventy_minutes = 70 * MINUTES_TO_SECONDS;

    test_bed = test_bed
        .fuel_high()
        .desired_fuel_min()
        .trigger_real_refuel()
        .and_run()
        .run_multiple_frames(Duration::from_secs(seventy_minutes));

    assert_fuel_quantity_0(&test_bed);
    assert_false!(test_bed.refuel_status());
}

#[test]
fn spawn_high_fuel_load_desired_real_200000_done() {
    let mut test_bed: FuelTestBed = test_bed();
    test_bed.set_on_ground(true);

    let seventy_minutes = 70 * MINUTES_TO_SECONDS;

    test_bed = test_bed
        .fuel_high()
        .desired_fuel_200000()
        .trigger_real_refuel()
        .and_run()
        .run_multiple_frames(Duration::from_secs(seventy_minutes));

    assert_fuel_quantity_200000(&test_bed);
    assert_false!(test_bed.refuel_status());
}
