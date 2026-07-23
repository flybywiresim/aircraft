use super::harness::*;
use crate::fuel::A380FuelTankType;
use ntest::{assert_false, assert_true};
use std::{collections::HashMap, time::Duration};
use systems::simulation::test::TestBed;
use uom::si::{f64::Mass, mass::kilogram};

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

    test_bed = test_bed
        .desired_fuel_50000()
        .trigger_real_refuel()
        .and_run()
        .run_multiple_frames(Duration::from_mins(18));

    assert_fuel_quantity_50000(&test_bed);
    assert_false!(test_bed.refuel_status());
}

#[test]
fn spawn_no_fuel_load_desired_real_100000_done() {
    let mut test_bed: FuelTestBed = test_bed();
    test_bed.set_on_ground(true);

    test_bed = test_bed
        .desired_fuel_100000()
        .trigger_real_refuel()
        .and_run()
        .run_multiple_frames(Duration::from_mins(40));

    assert_fuel_quantity_100000(&test_bed);
    assert_false!(test_bed.refuel_status());
}

#[test]
fn spawn_no_fuel_load_desired_real_200000_done() {
    let mut test_bed: FuelTestBed = test_bed();
    test_bed.set_on_ground(true);

    test_bed = test_bed
        .desired_fuel_200000()
        .trigger_real_refuel()
        .and_run()
        .run_multiple_frames(Duration::from_mins(70));

    assert_fuel_quantity_200000(&test_bed);
    assert_false!(test_bed.refuel_status());
}

#[test]
fn defuel_high_fuel_load_desired_real_done() {
    let mut test_bed: FuelTestBed = test_bed();
    test_bed.set_on_ground(true);

    test_bed = test_bed
        .fuel_high()
        .desired_fuel_min()
        .trigger_real_refuel()
        .and_run()
        .run_multiple_frames(Duration::from_mins(70));

    assert_fuel_quantity_0(&test_bed);
    assert_false!(test_bed.refuel_status());
}

#[test]
fn spawn_high_fuel_load_desired_real_200000_done() {
    let mut test_bed: FuelTestBed = test_bed();
    test_bed.set_on_ground(true);

    test_bed = test_bed
        .fuel_high()
        .desired_fuel_200000()
        .trigger_real_refuel()
        .and_run()
        .run_multiple_frames(Duration::from_mins(70));

    assert_fuel_quantity_200000(&test_bed);
    assert_false!(test_bed.refuel_status());
}
