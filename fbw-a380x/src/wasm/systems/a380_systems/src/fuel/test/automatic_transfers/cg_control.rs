use super::super::harness::test_bed;
use crate::fuel::{A380FuelPump, A380FuelTankType, A380FuelValve};
use std::time::Duration;

#[test]
fn aft_cg_commands_trim_tank_transfer_to_inner_tanks() {
    let mut test_bed = test_bed()
        .with_fqms_powered()
        .with_all_tank_quantities_pounds(0.)
        .with_remaining_flight_time(Duration::from_mins(3 * 60))
        .with_fms_zero_fuel_weight_and_cg(300_000., 45.)
        .with_tank_quantity_pounds(A380FuelTankType::FeedOne, 45_000.)
        .with_tank_quantity_pounds(A380FuelTankType::FeedTwo, 48_000.)
        .with_tank_quantity_pounds(A380FuelTankType::FeedThree, 48_000.)
        .with_tank_quantity_pounds(A380FuelTankType::FeedFour, 45_000.)
        .with_tank_quantity_pounds(A380FuelTankType::LeftInner, 10_000.)
        .with_tank_quantity_pounds(A380FuelTankType::RightInner, 10_000.)
        .with_tank_quantity_pounds(A380FuelTankType::Trim, 20_000.)
        .and_run_past_fqms_self_test();

    test_bed.assert_fqms_pump_targeted(A380FuelPump::TrimRight);
    test_bed.assert_fqms_pump_targeted(A380FuelPump::TrimLeft);
    test_bed.assert_fqms_valve_targeted(A380FuelValve::LeftInnerAftTransferValve);
    test_bed.assert_fqms_valve_targeted(A380FuelValve::RightInnerAftTransferValve);
    test_bed.assert_fqms_valve_not_targeted(A380FuelValve::FeedTank1AftTransferValve);
}
