use crate::fuel::{
    cpiom_f::{TankMode, TransferGalleryTankConnections},
    A380FuelPump, A380FuelTankType, A380FuelValve,
};
use enum_map::{enum_map, Enum, EnumMap};
use std::sync::LazyLock;

static TANK_PUMP_MAP: LazyLock<EnumMap<A380FuelTankType, (A380FuelPump, A380FuelPump)>> =
    LazyLock::new(|| {
        enum_map! {
            A380FuelTankType::FeedOne => (A380FuelPump::Feed1Main, A380FuelPump::Feed1Stby),
            A380FuelTankType::FeedTwo => (A380FuelPump::Feed2Main, A380FuelPump::Feed2Stby),
            A380FuelTankType::FeedThree => (A380FuelPump::Feed3Main, A380FuelPump::Feed3Stby),
            A380FuelTankType::FeedFour => (A380FuelPump::Feed4Main, A380FuelPump::Feed4Stby),
            A380FuelTankType::LeftInner => (A380FuelPump::LeftInnerFwd, A380FuelPump::LeftInnerAft),
            A380FuelTankType::LeftMid => (A380FuelPump::LeftMidFwd, A380FuelPump::LeftMidAft),
            A380FuelTankType::LeftOuter => (A380FuelPump::LeftOuter, A380FuelPump::LeftOuter), // only one pump for outer tank
            A380FuelTankType::RightInner => (A380FuelPump::RightInnerFwd, A380FuelPump::RightInnerAft),
            A380FuelTankType::RightMid => (A380FuelPump::RightMidFwd, A380FuelPump::RightMidAft),
            A380FuelTankType::RightOuter => (A380FuelPump::RightOuter, A380FuelPump::RightOuter), // only one pump for outer tank
            A380FuelTankType::Trim => (A380FuelPump::TrimLeft, A380FuelPump::TrimRight),
        }
    });

static PUMP_TANK_MAP: LazyLock<EnumMap<A380FuelPump, A380FuelTankType>> = LazyLock::new(|| {
    enum_map! {
        A380FuelPump::Feed1Main => A380FuelTankType::FeedOne,
        A380FuelPump::Feed1Stby => A380FuelTankType::FeedOne,
        A380FuelPump::Feed2Main => A380FuelTankType::FeedTwo,
        A380FuelPump::Feed2Stby => A380FuelTankType::FeedTwo,
        A380FuelPump::Feed3Main => A380FuelTankType::FeedThree,
        A380FuelPump::Feed3Stby => A380FuelTankType::FeedThree,
        A380FuelPump::Feed4Main => A380FuelTankType::FeedFour,
        A380FuelPump::Feed4Stby => A380FuelTankType::FeedFour,
        A380FuelPump::LeftInnerFwd => A380FuelTankType::LeftInner,
        A380FuelPump::LeftInnerAft => A380FuelTankType::LeftInner,
        A380FuelPump::LeftMidFwd => A380FuelTankType::LeftMid,
        A380FuelPump::LeftMidAft => A380FuelTankType::LeftMid,
        A380FuelPump::LeftOuter => A380FuelTankType::LeftOuter,
        A380FuelPump::RightInnerFwd => A380FuelTankType::RightInner,
        A380FuelPump::RightInnerAft => A380FuelTankType::RightInner,
        A380FuelPump::RightMidFwd => A380FuelTankType::RightMid,
        A380FuelPump::RightMidAft => A380FuelTankType::RightMid,
        A380FuelPump::RightOuter => A380FuelTankType::RightOuter,
        A380FuelPump::TrimLeft => A380FuelTankType::Trim,
        A380FuelPump::TrimRight => A380FuelTankType::Trim,
        A380FuelPump::Apu => A380FuelTankType::FeedFour,
    }
});

static TANK_INLET_MAP: LazyLock<EnumMap<A380FuelTankType, (A380FuelValve, A380FuelValve)>> =
    LazyLock::new(|| {
        enum_map! {
            A380FuelTankType::FeedOne => (A380FuelValve::FeedTank1ForwardTransferValve, A380FuelValve::FeedTank1AftTransferValve),
            A380FuelTankType::FeedTwo => (A380FuelValve::FeedTank2ForwardTransferValve, A380FuelValve::FeedTank2AftTransferValve),
            A380FuelTankType::FeedThree => (A380FuelValve::FeedTank3ForwardTransferValve, A380FuelValve::FeedTank3AftTransferValve),
            A380FuelTankType::FeedFour => (A380FuelValve::FeedTank4ForwardTransferValve, A380FuelValve::FeedTank4AftTransferValve),
            A380FuelTankType::LeftInner => (A380FuelValve::LeftInnerForwardTransferValve, A380FuelValve::LeftInnerAftTransferValve),
            A380FuelTankType::LeftMid => (A380FuelValve::LeftMidForwardTransferValve, A380FuelValve::LeftMidAftTransferValve),
            A380FuelTankType::LeftOuter => (A380FuelValve::LeftOuterForwardTransferValve, A380FuelValve::LeftOuterAftTransferValve),
            A380FuelTankType::RightInner => (A380FuelValve::RightInnerForwardTransferValve, A380FuelValve::RightInnerAftTransferValve),
            A380FuelTankType::RightMid => (A380FuelValve::RightMidForwardTransferValve, A380FuelValve::RightMidAftTransferValve),
            A380FuelTankType::RightOuter => (A380FuelValve::RightOuterForwardTransferValve, A380FuelValve::RightOuterAftTransferValve),
            // The trim tank inlet valves are not used for fuel transfer, but for filling the tank during refueling
            A380FuelTankType::Trim => (A380FuelValve::TrimTankInletValve1, A380FuelValve::TrimTankInletValve2),
        }
    });

pub(super) struct FuelControlApplication {
    fuel_pump_requested_running: [bool; A380FuelPump::LENGTH],
    fuel_valve_requested_open: [bool; A380FuelValve::LENGTH],
}
impl FuelControlApplication {
    pub(super) fn new() -> Self {
        Self {
            fuel_pump_requested_running: [false; A380FuelPump::LENGTH],
            fuel_valve_requested_open: [false; A380FuelValve::LENGTH],
        }
    }

    pub(super) fn update(&mut self, gallery_connections: &TransferGalleryTankConnections) {
        self.fuel_pump_requested_running = Default::default();
        self.fuel_valve_requested_open = [false; A380FuelValve::LENGTH];

        // Process forward gallery connections
        for (tank, mode) in A380FuelTankType::iterator().zip(gallery_connections.forward_gallery) {
            self.process_tank_mode(tank, mode, true);
        }

        // Process aft gallery connections
        for (tank, mode) in A380FuelTankType::iterator().zip(gallery_connections.aft_gallery) {
            self.process_tank_mode(tank, mode, false);
        }
    }

    fn process_tank_mode(&mut self, tank: A380FuelTankType, mode: TankMode, is_forward: bool) {
        match mode {
            TankMode::None => {}
            TankMode::Source => {
                // Activate fuel pump for source tank
                let (pump1, pump2) = TANK_PUMP_MAP[tank];
                let pump = if is_forward { pump1 } else { pump2 };
                self.fuel_pump_requested_running[pump.into_usize()] = true;
            }
            TankMode::Target => {
                // Open inlet valves for target tank (any tank type can be a target)
                let (fwd_valve, aft_valve) = TANK_INLET_MAP[tank];
                let valve = if is_forward { fwd_valve } else { aft_valve };
                self.fuel_valve_requested_open[valve.into_usize()] = true;
            }
        }
    }

    pub(super) fn fuel_pump_requested_running(&self) -> [bool; A380FuelPump::LENGTH] {
        self.fuel_pump_requested_running
    }

    pub(super) fn fuel_valve_requested_open(&self) -> [bool; A380FuelValve::LENGTH] {
        self.fuel_valve_requested_open
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fuel::cpiom_f::TankMode;

    #[test]
    fn test_source_tank_activates_gallery_specific_pump() {
        let mut control = FuelControlApplication::new();
        let mut gallery = TransferGalleryTankConnections::default();

        // Set LeftInner as source in forward gallery
        gallery.forward_gallery[A380FuelTankType::LeftInner.into_usize()] = TankMode::Source;

        control.update(&gallery);

        // Only the forward pump for the gallery should be running
        let pump_state = control.fuel_pump_requested_running();
        assert!(pump_state[A380FuelPump::LeftInnerFwd.into_usize()]);
        // Aft pump should be OFF
        assert!(!pump_state[A380FuelPump::LeftInnerAft.into_usize()]);
    }

    #[test]
    fn test_source_tank_activates_aft_pump_in_aft_gallery() {
        let mut control = FuelControlApplication::new();
        let mut gallery = TransferGalleryTankConnections::default();

        // Set LeftInner as source in aft gallery
        gallery.aft_gallery[A380FuelTankType::LeftInner.into_usize()] = TankMode::Source;

        control.update(&gallery);

        // Only the aft pump for the gallery should be running
        let pump_state = control.fuel_pump_requested_running();
        assert!(pump_state[A380FuelPump::LeftInnerAft.into_usize()]);
        // Forward pump should be OFF
        assert!(!pump_state[A380FuelPump::LeftInnerFwd.into_usize()]);
    }

    #[test]
    fn test_target_feed_tank_opens_forward_valve() {
        let mut control = FuelControlApplication::new();
        let mut gallery = TransferGalleryTankConnections::default();

        // Set FeedOne as target in forward gallery
        gallery.forward_gallery[A380FuelTankType::FeedOne.into_usize()] = TankMode::Target;

        control.update(&gallery);

        // Check that forward transfer valve is open
        let valve_state = control.fuel_valve_requested_open();
        assert!(valve_state[A380FuelValve::FeedTank1ForwardTransferValve.into_usize()]);
    }

    #[test]
    fn test_target_feed_tank_opens_aft_valve() {
        let mut control = FuelControlApplication::new();
        let mut gallery = TransferGalleryTankConnections::default();

        // Set FeedTwo as target in aft gallery
        gallery.aft_gallery[A380FuelTankType::FeedTwo.into_usize()] = TankMode::Target;

        control.update(&gallery);

        // Check that aft transfer valve is open
        let valve_state = control.fuel_valve_requested_open();
        assert!(valve_state[A380FuelValve::FeedTank2AftTransferValve.into_usize()]);
    }

    #[test]
    fn test_any_tank_can_be_target_opens_valve() {
        let mut control = FuelControlApplication::new();
        let mut gallery = TransferGalleryTankConnections::default();

        // Set various tank types as targets
        gallery.forward_gallery[A380FuelTankType::Trim.into_usize()] = TankMode::Target;
        gallery.aft_gallery[A380FuelTankType::LeftInner.into_usize()] = TankMode::Target;

        control.update(&gallery);

        let valve_state = control.fuel_valve_requested_open();
        // Trim forward valve should be open
        assert!(valve_state[A380FuelValve::TrimTankInletValve1.into_usize()]);
        // LeftInner aft valve should be open
        assert!(valve_state[A380FuelValve::LeftInnerAftTransferValve.into_usize()]);
    }

    #[test]
    fn test_wing_tanks_as_targets() {
        let mut control = FuelControlApplication::new();
        let mut gallery = TransferGalleryTankConnections::default();

        // Set wing tanks as targets
        gallery.forward_gallery[A380FuelTankType::LeftOuter.into_usize()] = TankMode::Target;
        gallery.aft_gallery[A380FuelTankType::RightMid.into_usize()] = TankMode::Target;

        control.update(&gallery);

        let valve_state = control.fuel_valve_requested_open();
        // LeftOuter forward valve should be open
        assert!(valve_state[A380FuelValve::LeftOuterForwardTransferValve.into_usize()]);
        // RightMid aft valve should be open
        assert!(valve_state[A380FuelValve::RightMidAftTransferValve.into_usize()]);
    }

    #[test]
    fn test_multiple_sources_in_different_galleries() {
        let mut control = FuelControlApplication::new();
        let mut gallery = TransferGalleryTankConnections::default();

        // Set sources in different galleries
        gallery.forward_gallery[A380FuelTankType::LeftOuter.into_usize()] = TankMode::Source;
        gallery.aft_gallery[A380FuelTankType::RightMid.into_usize()] = TankMode::Source;

        control.update(&gallery);

        let pump_state = control.fuel_pump_requested_running();
        // LeftOuter forward pump should be on
        assert!(pump_state[A380FuelPump::LeftOuter.into_usize()]);
        // RightMid aft pump should be on
        assert!(pump_state[A380FuelPump::RightMidAft.into_usize()]);
        // RightMid forward pump should be OFF (different gallery)
        assert!(!pump_state[A380FuelPump::RightMidFwd.into_usize()]);
    }

    #[test]
    fn test_none_mode_does_nothing() {
        let mut control = FuelControlApplication::new();
        let gallery = TransferGalleryTankConnections::default(); // All TankMode::None by default

        control.update(&gallery);

        // All pumps and valves should be off
        let pump_state = control.fuel_pump_requested_running();
        let valve_state = control.fuel_valve_requested_open();

        assert!(pump_state.iter().all(|&b| !b));
        assert!(valve_state.iter().all(|&b| !b));
    }

    #[test]
    fn test_forward_pump_turns_off_when_no_longer_source() {
        let mut control = FuelControlApplication::new();
        let mut gallery = TransferGalleryTankConnections::default();

        // First update: LeftInner is source in forward gallery
        gallery.forward_gallery[A380FuelTankType::LeftInner.into_usize()] = TankMode::Source;
        control.update(&gallery);

        let pump_state = control.fuel_pump_requested_running();
        assert!(pump_state[A380FuelPump::LeftInnerFwd.into_usize()]);

        // Second update: Clear LeftInner as source (set to None)
        gallery.forward_gallery[A380FuelTankType::LeftInner.into_usize()] = TankMode::None;
        control.update(&gallery);

        let pump_state = control.fuel_pump_requested_running();
        // LeftInner forward pump should now be OFF
        assert!(!pump_state[A380FuelPump::LeftInnerFwd.into_usize()]);
    }

    #[test]
    fn test_valves_turn_off_when_no_longer_target() {
        let mut control = FuelControlApplication::new();
        let mut gallery = TransferGalleryTankConnections::default();

        // First update: FeedOne is target
        gallery.forward_gallery[A380FuelTankType::FeedOne.into_usize()] = TankMode::Target;
        control.update(&gallery);

        let valve_state = control.fuel_valve_requested_open();
        assert!(valve_state[A380FuelValve::FeedTank1ForwardTransferValve.into_usize()]);

        // Second update: Clear FeedOne as target (set to None)
        gallery.forward_gallery[A380FuelTankType::FeedOne.into_usize()] = TankMode::None;
        control.update(&gallery);

        let valve_state = control.fuel_valve_requested_open();
        // FeedOne forward valve should now be OFF
        assert!(!valve_state[A380FuelValve::FeedTank1ForwardTransferValve.into_usize()]);
    }

    #[test]
    fn test_only_specified_pumps_run() {
        let mut control = FuelControlApplication::new();
        let mut gallery = TransferGalleryTankConnections::default();

        // Set RightOuter as source
        gallery.forward_gallery[A380FuelTankType::RightOuter.into_usize()] = TankMode::Source;
        control.update(&gallery);

        let pump_state = control.fuel_pump_requested_running();

        // Only RightOuter pump should be on
        assert!(pump_state[A380FuelPump::RightOuter.into_usize()]);

        // Other pumps should be off
        assert!(!pump_state[A380FuelPump::LeftInnerFwd.into_usize()]);
        assert!(!pump_state[A380FuelPump::LeftMidFwd.into_usize()]);
        assert!(!pump_state[A380FuelPump::TrimLeft.into_usize()]);
        assert!(!pump_state[A380FuelPump::Feed1Main.into_usize()]);
    }

    #[test]
    fn test_only_specified_valves_open() {
        let mut control = FuelControlApplication::new();
        let mut gallery = TransferGalleryTankConnections::default();

        // Set FeedThree as target
        gallery.aft_gallery[A380FuelTankType::FeedThree.into_usize()] = TankMode::Target;
        control.update(&gallery);

        let valve_state = control.fuel_valve_requested_open();

        // Only FeedThree aft valve should be open
        assert!(valve_state[A380FuelValve::FeedTank3AftTransferValve.into_usize()]);

        // Other feed tank transfer valves should be closed
        assert!(!valve_state[A380FuelValve::FeedTank1ForwardTransferValve.into_usize()]);
        assert!(!valve_state[A380FuelValve::FeedTank2ForwardTransferValve.into_usize()]);
        assert!(!valve_state[A380FuelValve::FeedTank4AftTransferValve.into_usize()]);
    }

    #[test]
    fn test_switching_source_tank_turns_off_old_gallery_pump() {
        let mut control = FuelControlApplication::new();
        let mut gallery = TransferGalleryTankConnections::default();

        // First update: LeftMid is source in forward gallery
        gallery.forward_gallery[A380FuelTankType::LeftMid.into_usize()] = TankMode::Source;
        control.update(&gallery);

        let pump_state = control.fuel_pump_requested_running();
        assert!(pump_state[A380FuelPump::LeftMidFwd.into_usize()]);

        // Second update: Switch to RightMid as source in forward gallery
        gallery.forward_gallery[A380FuelTankType::LeftMid.into_usize()] = TankMode::None;
        gallery.forward_gallery[A380FuelTankType::RightMid.into_usize()] = TankMode::Source;
        control.update(&gallery);

        let pump_state = control.fuel_pump_requested_running();
        // Old pump should be off
        assert!(!pump_state[A380FuelPump::LeftMidFwd.into_usize()]);
        // New pump should be on
        assert!(pump_state[A380FuelPump::RightMidFwd.into_usize()]);
    }

    #[test]
    fn test_switching_target_tank_turns_off_old_valves() {
        let mut control = FuelControlApplication::new();
        let mut gallery = TransferGalleryTankConnections::default();

        // First update: FeedOne is target (forward gallery)
        gallery.forward_gallery[A380FuelTankType::FeedOne.into_usize()] = TankMode::Target;
        control.update(&gallery);

        let valve_state = control.fuel_valve_requested_open();
        assert!(valve_state[A380FuelValve::FeedTank1ForwardTransferValve.into_usize()]);

        // Second update: Switch to FeedTwo as target
        gallery.forward_gallery[A380FuelTankType::FeedOne.into_usize()] = TankMode::None;
        gallery.forward_gallery[A380FuelTankType::FeedTwo.into_usize()] = TankMode::Target;
        control.update(&gallery);

        let valve_state = control.fuel_valve_requested_open();
        // Old valve should be off
        assert!(!valve_state[A380FuelValve::FeedTank1ForwardTransferValve.into_usize()]);
        // New valve should be on
        assert!(valve_state[A380FuelValve::FeedTank2ForwardTransferValve.into_usize()]);
    }

    #[test]
    fn test_complex_scenario_multiple_sources_and_targets() {
        let mut control = FuelControlApplication::new();
        let mut gallery = TransferGalleryTankConnections::default();

        // Setup: LeftOuter and RightMid as sources (from different galleries)
        // FeedOne and FeedThree as targets (from different galleries)
        gallery.forward_gallery[A380FuelTankType::LeftOuter.into_usize()] = TankMode::Source;
        gallery.forward_gallery[A380FuelTankType::FeedOne.into_usize()] = TankMode::Target;
        gallery.aft_gallery[A380FuelTankType::RightMid.into_usize()] = TankMode::Source;
        gallery.aft_gallery[A380FuelTankType::FeedThree.into_usize()] = TankMode::Target;

        control.update(&gallery);

        let pump_state = control.fuel_pump_requested_running();
        let valve_state = control.fuel_valve_requested_open();

        // Verify forward gallery source is active (only forward pump)
        assert!(pump_state[A380FuelPump::LeftOuter.into_usize()]);
        // Verify aft gallery source is active (only aft pump)
        assert!(pump_state[A380FuelPump::RightMidAft.into_usize()]);
        // Verify aft pump for RightMid is NOT on (wrong gallery)
        assert!(!pump_state[A380FuelPump::RightMidFwd.into_usize()]);

        // Verify targets are active
        assert!(valve_state[A380FuelValve::FeedTank1ForwardTransferValve.into_usize()]);
        assert!(valve_state[A380FuelValve::FeedTank3AftTransferValve.into_usize()]);

        // Verify other pumps/valves are off
        assert!(!pump_state[A380FuelPump::LeftInnerFwd.into_usize()]);
        assert!(!valve_state[A380FuelValve::FeedTank2ForwardTransferValve.into_usize()]);
    }

    #[test]
    fn test_outer_tank_pump_activation() {
        let mut control = FuelControlApplication::new();
        let mut gallery = TransferGalleryTankConnections::default();

        // Outer tanks have only one pump (LeftOuter == LeftOuter for both galleries)
        gallery.forward_gallery[A380FuelTankType::LeftOuter.into_usize()] = TankMode::Source;
        control.update(&gallery);

        let pump_state = control.fuel_pump_requested_running();
        // LeftOuter pump should be running (same pump for both galleries)
        assert!(pump_state[A380FuelPump::LeftOuter.into_usize()]);
    }

    #[test]
    fn test_gallery_specific_pump_control_prevents_interference() {
        let mut control = FuelControlApplication::new();
        let mut gallery = TransferGalleryTankConnections::default();

        // Forward: LeftMid source, Aft: RightMid source
        gallery.forward_gallery[A380FuelTankType::LeftMid.into_usize()] = TankMode::Source;
        gallery.aft_gallery[A380FuelTankType::RightMid.into_usize()] = TankMode::Source;
        control.update(&gallery);

        let pump_state = control.fuel_pump_requested_running();

        // Forward pumps
        assert!(pump_state[A380FuelPump::LeftMidFwd.into_usize()]);
        assert!(!pump_state[A380FuelPump::LeftMidAft.into_usize()]);

        // Aft pumps
        assert!(pump_state[A380FuelPump::RightMidAft.into_usize()]);
        assert!(!pump_state[A380FuelPump::RightMidFwd.into_usize()]);
    }
}
