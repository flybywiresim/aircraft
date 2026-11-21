use super::harness::*;
use crate::fuel::{A380FuelPump, A380FuelTankType, A380FuelValve};
use ntest::assert_true;
use std::time::Duration;
use strum::IntoEnumIterator;
use systems::shared::{arinc429::SignStatus, ElectricalBusType};
use systems::simulation::test::{TestBed, WriteByName};

/// Configuration where the inner tanks are the main transfer source
/// and all feed tanks are below the transfer threshold.
fn transfer_test_bed() -> FuelTestBed {
    test_bed()
        .with_fqms_powered()
        .with_all_tank_quantities_pounds(0.)
        .with_remaining_flight_time(Duration::from_hours(3))
        .with_tank_quantity_pounds(A380FuelTankType::FeedOne, 43_000.)
        .with_tank_quantity_pounds(A380FuelTankType::FeedTwo, 43_000.)
        .with_tank_quantity_pounds(A380FuelTankType::FeedThree, 43_000.)
        .with_tank_quantity_pounds(A380FuelTankType::FeedFour, 43_000.)
        .with_tank_quantity_pounds(A380FuelTankType::LeftInner, 10_000.)
        .with_tank_quantity_pounds(A380FuelTankType::RightInner, 10_000.)
}

#[test]
fn fqms_writes_failure_warning_during_self_test_and_normal_operation_after() {
    let mut test_bed = test_bed().with_fqms_powered();
    test_bed.run_with_delta(Duration::from_secs(1));

    // The FQMS self test takes 30 seconds, so all outputs must be failure warning
    assert!(
        test_bed.fqms_status_word().is_failure_warning(),
        "status word should be failure warning during the self test",
    );
    assert!(
        test_bed.fqms_pump_target_word("LEFT").is_failure_warning(),
        "pump target word should be failure warning during the self test",
    );
    assert!(
        test_bed.fqms_pump_target_word("RIGHT").is_failure_warning(),
        "pump target word should be failure warning during the self test",
    );

    test_bed = test_bed.and_run_past_fqms_self_test();

    assert!(
        test_bed.fqms_status_word().is_normal_operation(),
        "status word should be normal operation after the self test",
    );
    assert!(
        test_bed.fqms_pump_target_word("LEFT").is_normal_operation(),
        "pump target word should be normal operation after the self test",
    );
    assert!(
        test_bed
            .fqms_pump_target_word("RIGHT")
            .is_normal_operation(),
        "pump target word should be normal operation after the self test",
    );
}

#[test]
fn transfers_continue_when_fqdc_1_is_depowered() {
    // FQDC 1 is powered by the 501PP sub bus, FQDC 2 by DC 1.
    // With FQDC 1 unpowered the FQMS must fall back to FQDC 2.
    let mut test_bed = transfer_test_bed()
        .with_bus_depowered(ElectricalBusType::Sub("501PP"))
        .and_run_past_fqms_self_test();

    assert!(test_bed.fqms_status_word().is_normal_operation());
    test_bed.assert_fqms_pump_targeted(A380FuelPump::LeftInnerFwd);
    test_bed.assert_fqms_pump_targeted(A380FuelPump::RightInnerFwd);
}

#[test]
fn transfers_stop_when_all_fqdcs_are_depowered() {
    // Without any healthy FQDC no tank quantity is available
    // (unavailable tank count >= 2), so automatic transfers must be disabled.
    let mut test_bed = transfer_test_bed()
        .with_bus_depowered(ElectricalBusType::Sub("501PP"))
        .with_bus_depowered(ElectricalBusType::DirectCurrent(1))
        .and_run_past_fqms_self_test();

    for pump in A380FuelPump::iter() {
        test_bed.assert_fqms_pump_not_targeted(pump);
    }
    for valve in A380FuelValve::iter() {
        test_bed.assert_fqms_valve_not_targeted(valve);
    }
}

#[test]
fn fqms_status_word_sets_fms_no_data_when_no_fms_data_is_available() {
    let mut test_bed = test_bed().with_fqms_powered().and_run_past_fqms_self_test();

    let word = test_bed.fqms_status_word();
    assert!(word.is_normal_operation());
    assert!(word.get_bit(11), "expected FMS NO DATA flag at bit 11");
    assert!(
        !word.get_bit(12),
        "did not expect FMS DATA DISAGREE flag at bit 12"
    );
}

#[test]
fn fqms_status_word_sets_fms_data_disagree_when_fms_data_disagrees() {
    let mut test_bed = test_bed()
        .with_fqms_powered()
        .with_fms_zero_fuel_weight_and_cg(300_000., 40.)
        .with_remaining_flight_time(Duration::from_mins(180));
    // Override the zero fuel weight on one FMS so that the values disagree
    test_bed.write_arinc429_by_name(
        "FM2_ZERO_FUEL_WEIGHT",
        350_000.,
        SignStatus::NormalOperation,
    );
    test_bed = test_bed.and_run_past_fqms_self_test();

    let word = test_bed.fqms_status_word();
    assert!(word.is_normal_operation());
    assert!(
        !word.get_bit(11),
        "did not expect FMS NO DATA flag at bit 11"
    );
    assert!(
        word.get_bit(12),
        "expected FMS DATA DISAGREE flag at bit 12"
    );
}

#[test]
fn fqms_status_word_is_clear_when_fms_data_agrees() {
    let mut test_bed = test_bed()
        .with_fqms_powered()
        .with_fms_zero_fuel_weight_and_cg(300_000., 40.)
        .with_remaining_flight_time(Duration::from_mins(180))
        .and_run_past_fqms_self_test();

    let word = test_bed.fqms_status_word();
    assert!(word.is_normal_operation());
    assert_eq!(word.value(), 0);
}

#[test]
fn automatic_transfers_disabled_when_refuel_is_enabled() {
    let mut test_bed = transfer_test_bed().and_run_past_fqms_self_test();

    // Sanity check: without refuel the transfer is active
    test_bed.assert_fqms_pump_targeted(A380FuelPump::LeftInnerFwd);

    // Start refueling (engines off, sim on ground, no movement). The weight on
    // wheels (LGCIU) is intentionally left not compressed so that only the
    // refuel condition disables the transfer.
    test_bed.set_on_ground(true);
    test_bed.write_by_name("REFUEL_STARTED_BY_USR", true);
    test_bed.run();

    assert_true!(test_bed.refuel_status());
    test_bed.assert_fqms_pump_not_targeted(A380FuelPump::LeftInnerFwd);
    test_bed.assert_fqms_pump_not_targeted(A380FuelPump::RightInnerFwd);
}

#[test]
fn automatic_transfers_reset_when_aircraft_lands() {
    let mut test_bed = transfer_test_bed().and_run_past_fqms_self_test();

    // Sanity check: in the air the transfer is active
    test_bed.assert_fqms_pump_targeted(A380FuelPump::LeftInnerFwd);

    let mut test_bed = test_bed.with_on_ground(true).and_run();

    test_bed.assert_fqms_pump_not_targeted(A380FuelPump::LeftInnerFwd);
    test_bed.assert_fqms_pump_not_targeted(A380FuelPump::RightInnerFwd);
    for valve in A380FuelValve::iter() {
        test_bed.assert_fqms_valve_not_targeted(valve);
    }
}

#[test]
fn fqms_reverts_to_failure_warning_when_power_is_lost_after_the_self_test() {
    // Bring the FQMS up and let it finish its self test so that the outputs are
    // in normal operation with the transfer running.
    let mut test_bed = transfer_test_bed().and_run_past_fqms_self_test();
    test_bed.assert_fqms_pump_targeted(A380FuelPump::LeftInnerFwd);
    assert!(test_bed.fqms_status_word().is_normal_operation());

    // Losing FQMS/CPIOM power after power-up must revert every output word to
    // failure warning. A couple of frames are needed for the lost bus power to
    // propagate through the CPIOMs into the FQMS.
    test_bed.set_fqms_powered(false);
    for _ in 0..3 {
        test_bed.run();
    }

    assert!(
        test_bed.fqms_status_word().is_failure_warning(),
        "status word should revert to failure warning when power is lost"
    );
    assert!(
        test_bed.fqms_pump_target_word("LEFT").is_failure_warning(),
        "left pump target word should revert to failure warning when power is lost"
    );
    assert!(
        test_bed.fqms_pump_target_word("RIGHT").is_failure_warning(),
        "right pump target word should revert to failure warning when power is lost"
    );

    // Restoring power must not instantly return to normal operation: the FQMS
    // restarts its self test from zero. Because the restored bus power itself
    // only propagates into the FQMS a frame later, first wait until a valve
    // reports powered again (a purely electrical signal that is not gated by the
    // self test), then advance a few more frames - far short of the 30 s self
    // test - and assert the outputs are *still* in failure warning.
    let valve_for_power = A380FuelValve::FeedTank1ForwardTransferValve;
    test_bed.set_fqms_powered(true);
    let mut frames = 0;
    while !test_bed.fqms_valve_powered(valve_for_power) && frames < 20 {
        test_bed.run();
        frames += 1;
    }
    assert!(
        test_bed.fqms_valve_powered(valve_for_power),
        "bus power did not come back after restoring the FQMS supply"
    );
    // A handful of frames: enough to rule out the power-propagation lag, far
    // below the 30 s self test duration.
    test_bed.run();
    test_bed.run();
    assert!(
        test_bed.fqms_pump_target_word("LEFT").is_failure_warning(),
        "the self test must restart after power is restored, but the left pump word is already normal"
    );
    assert!(
        test_bed.fqms_pump_target_word("RIGHT").is_failure_warning(),
        "the self test must restart after power is restored, but the right pump word is already normal"
    );

    // Once the restarted self test completes, normal operation resumes.
    let mut test_bed = test_bed.and_run_past_fqms_self_test();
    assert!(
        test_bed.fqms_pump_target_word("LEFT").is_normal_operation(),
        "left pump target word should return to normal operation after the self test"
    );
    test_bed.assert_fqms_pump_targeted(A380FuelPump::LeftInnerFwd);
}

#[test]
fn transfers_fail_over_from_fqdc_1_to_fqdc_2_while_running() {
    // Start fully healthy so that the FQMS runs on FQDC 1 (the 501PP sub bus).
    let mut test_bed = transfer_test_bed().and_run_past_fqms_self_test();
    test_bed.assert_fqms_pump_targeted(A380FuelPump::LeftInnerFwd);
    test_bed.assert_fqms_pump_targeted(A380FuelPump::RightInnerFwd);

    // Losing FQDC 1 during operation must fail the FQMS over to the still
    // healthy FQDC 2 (DC 1) without interrupting the transfers.
    test_bed.set_bus_depowered(ElectricalBusType::Sub("501PP"));
    test_bed.run();

    assert!(test_bed.fqms_status_word().is_normal_operation());
    test_bed.assert_fqms_pump_targeted(A380FuelPump::LeftInnerFwd);
    test_bed.assert_fqms_pump_targeted(A380FuelPump::RightInnerFwd);
}

#[test]
fn transfers_re_enable_when_going_airborne_after_being_on_ground() {
    // Bring the FQMS up while on the ground: transfers stay inhibited.
    let mut test_bed = transfer_test_bed()
        .with_on_ground(true)
        .and_run_past_fqms_self_test();
    for pump in A380FuelPump::iter() {
        test_bed.assert_fqms_pump_not_targeted(pump);
    }

    // Going airborne must re-enable the automatic transfers.
    let mut test_bed = test_bed.with_on_ground(false).and_run();

    test_bed.assert_fqms_pump_targeted(A380FuelPump::LeftInnerFwd);
    test_bed.assert_fqms_pump_targeted(A380FuelPump::RightInnerFwd);
}

#[test]
fn valve_target_command_is_independent_of_valve_power() {
    let valve = A380FuelValve::FeedTank1ForwardTransferValve; // powered by 502PP

    let mut test_bed = transfer_test_bed().and_run_past_fqms_self_test();

    // With a running transfer the valve is commanded open and powered.
    test_bed.assert_fqms_valve_targeted(valve);
    test_bed.assert_fqms_valve_powered(valve, true);

    // Depowering only the valve bus must not change the FQMS command: the FQMS
    // keeps commanding the valve open, but the valve reports itself unpowered
    // (and therefore cannot actually move).
    test_bed.set_bus_depowered(ElectricalBusType::DirectCurrentNamed("502PP"));
    test_bed.run();

    test_bed.assert_fqms_valve_targeted(valve);
    test_bed.assert_fqms_valve_powered(valve, false);
}
