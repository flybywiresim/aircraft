use strum::IntoEnumIterator;
use systems::simulation::test::ReadByName;
use uom::si::{f64::Mass, mass::kilogram};

use super::super::harness::{test_bed, FuelTestBed};
use crate::fuel::{A380FuelPump, A380FuelTankType, A380FuelValve};
use std::time::Duration;

fn main_transfer_test_bed() -> FuelTestBed {
    test_bed()
        .with_fqms_powered()
        .with_all_tank_quantities_pounds(0.)
        .with_remaining_flight_time(Duration::from_hours(3))
}

fn with_feed_tanks_below_inner_mid_thresholds(test_bed: FuelTestBed) -> FuelTestBed {
    test_bed
        .with_tank_quantity_pounds(A380FuelTankType::FeedOne, 43_000.)
        .with_tank_quantity_pounds(A380FuelTankType::FeedTwo, 43_000.)
        .with_tank_quantity_pounds(A380FuelTankType::FeedThree, 43_000.)
        .with_tank_quantity_pounds(A380FuelTankType::FeedFour, 43_000.)
}

fn assert_forward_feed_tank_inlet_valves_targeted(test_bed: &mut FuelTestBed) {
    for valve in [
        A380FuelValve::FeedTank1ForwardTransferValve,
        A380FuelValve::FeedTank2ForwardTransferValve,
        A380FuelValve::FeedTank3ForwardTransferValve,
        A380FuelValve::FeedTank4ForwardTransferValve,
    ] {
        test_bed.assert_fqms_valve_targeted(valve);
    }
}

fn assert_aft_feed_tank_inlet_valves_targeted(test_bed: &mut FuelTestBed) {
    for valve in [
        A380FuelValve::FeedTank1AftTransferValve,
        A380FuelValve::FeedTank2AftTransferValve,
        A380FuelValve::FeedTank3AftTransferValve,
        A380FuelValve::FeedTank4AftTransferValve,
    ] {
        test_bed.assert_fqms_valve_targeted(valve);
    }
}

#[test]
fn inner_tanks_feed_low_feed_tanks_through_forward_gallery() {
    let mut test_bed = with_feed_tanks_below_inner_mid_thresholds(main_transfer_test_bed())
        .with_tank_quantity_pounds(A380FuelTankType::LeftInner, 10_000.)
        .with_tank_quantity_pounds(A380FuelTankType::RightInner, 10_000.)
        .and_run_past_fqms_self_test();

    let left_pump_target_state_word: Option<u32> = test_bed
        .read_arinc429_by_name("FQMS_LEFT_FUEL_PUMP_TARGET_STATE_WORD")
        .normal_value();
    let right_pump_target_state_word: Option<u32> = test_bed
        .read_arinc429_by_name("FQMS_RIGHT_FUEL_PUMP_TARGET_STATE_WORD")
        .normal_value();
    println!("{left_pump_target_state_word:x?}");
    println!("{right_pump_target_state_word:x?}");
    test_bed.assert_fqms_pump_targeted(A380FuelPump::LeftInnerFwd);
    test_bed.assert_fqms_pump_targeted(A380FuelPump::RightInnerFwd);
    test_bed.assert_fqms_pump_not_targeted(A380FuelPump::LeftInnerAft);
    test_bed.assert_fqms_pump_not_targeted(A380FuelPump::RightInnerAft);
    assert_forward_feed_tank_inlet_valves_targeted(&mut test_bed);
    test_bed.assert_fqms_valve_not_targeted(A380FuelValve::FeedTank1AftTransferValve);
}

#[test]
fn mid_tanks_feed_low_feed_tanks_after_inner_tanks_are_empty() {
    let mut test_bed = with_feed_tanks_below_inner_mid_thresholds(main_transfer_test_bed())
        .with_tank_quantity_pounds(A380FuelTankType::LeftMid, 10_000.)
        .with_tank_quantity_pounds(A380FuelTankType::RightMid, 10_000.)
        .and_run_past_fqms_self_test();

    test_bed.assert_fqms_pump_targeted(A380FuelPump::LeftMidFwd);
    test_bed.assert_fqms_pump_targeted(A380FuelPump::RightMidFwd);
    test_bed.assert_fqms_pump_not_targeted(A380FuelPump::LeftMidAft);
    test_bed.assert_fqms_pump_not_targeted(A380FuelPump::RightMidAft);
    assert_forward_feed_tank_inlet_valves_targeted(&mut test_bed);
    test_bed.assert_fqms_valve_not_targeted(A380FuelValve::FeedTank1AftTransferValve);
}

#[test]
fn trim_tank_feeds_low_feed_tanks_after_inner_and_mid_tanks_are_empty() {
    let mut test_bed = main_transfer_test_bed()
        .with_tank_quantity_pounds(A380FuelTankType::FeedOne, 13_000.)
        .with_tank_quantity_pounds(A380FuelTankType::FeedTwo, 13_000.)
        .with_tank_quantity_pounds(A380FuelTankType::FeedThree, 13_000.)
        .with_tank_quantity_pounds(A380FuelTankType::FeedFour, 13_000.)
        .with_tank_quantity_pounds(A380FuelTankType::Trim, 20_000.)
        .and_run_past_fqms_self_test();

    test_bed.assert_fqms_pump_targeted(A380FuelPump::TrimRight);
    test_bed.assert_fqms_pump_targeted(A380FuelPump::TrimLeft);
    assert_aft_feed_tank_inlet_valves_targeted(&mut test_bed);
    test_bed.assert_fqms_valve_not_targeted(A380FuelValve::FeedTank1ForwardTransferValve);
}

#[test]
fn outer_tanks_feed_low_feed_tanks_after_inner_mid_and_trim_tanks_are_empty() {
    let mut test_bed = main_transfer_test_bed()
        .with_tank_quantity_pounds(A380FuelTankType::FeedOne, 8_700.)
        .with_tank_quantity_pounds(A380FuelTankType::FeedTwo, 8_700.)
        .with_tank_quantity_pounds(A380FuelTankType::FeedThree, 8_700.)
        .with_tank_quantity_pounds(A380FuelTankType::FeedFour, 8_700.)
        .with_tank_quantity_pounds(A380FuelTankType::LeftOuter, 10_000.)
        .with_tank_quantity_pounds(A380FuelTankType::RightOuter, 10_000.)
        .and_run_past_fqms_self_test();

    test_bed.assert_fqms_pump_targeted(A380FuelPump::LeftOuter);
    test_bed.assert_fqms_pump_targeted(A380FuelPump::RightOuter);
    assert_forward_feed_tank_inlet_valves_targeted(&mut test_bed);
    test_bed.assert_fqms_valve_not_targeted(A380FuelValve::FeedTank1AftTransferValve);
}

#[test]
fn ground_main_transfer_disabled() {
    let mut test_bed = main_transfer_test_bed()
        .with_on_ground(true)
        .with_tank_quantity(A380FuelTankType::FeedOne, Mass::new::<kilogram>(14_500.))
        .with_tank_quantity(A380FuelTankType::FeedTwo, Mass::new::<kilogram>(15_000.))
        .with_tank_quantity(A380FuelTankType::FeedThree, Mass::new::<kilogram>(15_000.))
        .with_tank_quantity(A380FuelTankType::FeedFour, Mass::new::<kilogram>(14_500.))
        .with_tank_quantity(A380FuelTankType::LeftOuter, Mass::new::<kilogram>(4_000.))
        .with_tank_quantity(A380FuelTankType::RightOuter, Mass::new::<kilogram>(4_000.))
        .with_tank_quantity(A380FuelTankType::LeftInner, Mass::new::<kilogram>(5_500.))
        .with_tank_quantity(A380FuelTankType::RightInner, Mass::new::<kilogram>(5_500.))
        .with_tank_quantity(A380FuelTankType::Trim, Mass::new::<kilogram>(7_500.))
        .and_run_past_fqms_self_test();

    for pump in A380FuelPump::iter() {
        test_bed.assert_fqms_pump_not_targeted(pump);
    }
    for valve in A380FuelValve::iter() {
        test_bed.assert_fqms_valve_not_targeted(valve);
    }
}
