use crate::fuel::{
    cpiom_f::{TankMode, TransferGalleryTankConnections},
    A380FuelPump, A380FuelTankType, A380FuelValve,
};
use enum_map::{enum_map, EnumMap};
use std::sync::LazyLock;

struct SourceControl<'a> {
    fuel_pump_fwd: &'a [A380FuelPump],
    fuel_pump_aft: &'a [A380FuelPump],
    fuel_valve_fwd: &'a [A380FuelValve],
    fuel_valve_aft: &'a [A380FuelValve],
}

struct TargetControl<'a> {
    fuel_inlet_valve_fwd: &'a [A380FuelValve],
    fuel_inlet_valve_aft: &'a [A380FuelValve],
}

static SOURCE_CONTROL_MAP: LazyLock<EnumMap<A380FuelTankType, SourceControl>> = LazyLock::new(
    || {
        enum_map! {
            // Feed tank pumps can't be controlled by the fuel transfer system
            A380FuelTankType::FeedOne | A380FuelTankType::FeedTwo | A380FuelTankType::FeedThree | A380FuelTankType::FeedFour => SourceControl {
                fuel_pump_fwd: &[],
                fuel_pump_aft: &[],
                fuel_valve_fwd: &[],
                fuel_valve_aft: &[],
            },
            A380FuelTankType::LeftInner => SourceControl {
                fuel_pump_fwd: &[A380FuelPump::LeftInnerFwd],
                fuel_pump_aft: &[A380FuelPump::LeftInnerAft],
                fuel_valve_fwd: &[],
                fuel_valve_aft: &[],
            },
            A380FuelTankType::LeftMid => SourceControl {
                fuel_pump_fwd: &[A380FuelPump::LeftMidFwd],
                fuel_pump_aft: &[A380FuelPump::LeftMidAft],
                fuel_valve_fwd: &[],
                fuel_valve_aft: &[],
            },
            A380FuelTankType::LeftOuter => SourceControl {
                fuel_pump_fwd: &[A380FuelPump::LeftOuter],
                fuel_pump_aft: &[A380FuelPump::LeftOuter],
                fuel_valve_fwd: &[],
                fuel_valve_aft: &[],
            },
            A380FuelTankType::RightInner => SourceControl {
                fuel_pump_fwd: &[A380FuelPump::RightInnerFwd],
                fuel_pump_aft: &[A380FuelPump::RightInnerAft],
                fuel_valve_fwd: &[],
                fuel_valve_aft: &[],
            },
            A380FuelTankType::RightMid => SourceControl {
                fuel_pump_fwd: &[A380FuelPump::RightMidFwd],
                fuel_pump_aft: &[A380FuelPump::RightMidAft],
                fuel_valve_fwd: &[],
                fuel_valve_aft: &[],
            },
            A380FuelTankType::RightOuter => SourceControl {
                fuel_pump_fwd: &[A380FuelPump::RightOuter],
                fuel_pump_aft: &[A380FuelPump::RightOuter],
                fuel_valve_fwd: &[],
                fuel_valve_aft: &[],
            },
            A380FuelTankType::Trim => SourceControl {
                fuel_pump_fwd: &[A380FuelPump::TrimLeft, A380FuelPump::TrimRight],
                fuel_pump_aft: &[A380FuelPump::TrimLeft, A380FuelPump::TrimRight],
                fuel_valve_fwd: &[A380FuelValve::TrimLineIsolationValveFwd],
                fuel_valve_aft: &[A380FuelValve::TrimLineIsolationValveAft],
            },
        }
    },
);

static TARGET_CONTROL_MAP: LazyLock<EnumMap<A380FuelTankType, TargetControl>> =
    LazyLock::new(|| {
        enum_map! {
            A380FuelTankType::FeedOne => TargetControl {
                fuel_inlet_valve_fwd: &[A380FuelValve::FeedTank1ForwardTransferValve],
                fuel_inlet_valve_aft: &[A380FuelValve::FeedTank1AftTransferValve],
            },
            A380FuelTankType::FeedTwo => TargetControl {
                fuel_inlet_valve_fwd: &[A380FuelValve::FeedTank2ForwardTransferValve],
                fuel_inlet_valve_aft: &[A380FuelValve::FeedTank2AftTransferValve],
            },
            A380FuelTankType::FeedThree => TargetControl {
                fuel_inlet_valve_fwd: &[A380FuelValve::FeedTank3ForwardTransferValve],
                fuel_inlet_valve_aft: &[A380FuelValve::FeedTank3AftTransferValve],
            },
            A380FuelTankType::FeedFour => TargetControl {
                fuel_inlet_valve_fwd: &[A380FuelValve::FeedTank4ForwardTransferValve],
                fuel_inlet_valve_aft: &[A380FuelValve::FeedTank4AftTransferValve],
            },
            A380FuelTankType::LeftInner => TargetControl {
                fuel_inlet_valve_fwd: &[A380FuelValve::LeftInnerForwardTransferValve],
                fuel_inlet_valve_aft: &[A380FuelValve::LeftInnerAftTransferValve],
            },
            A380FuelTankType::LeftMid => TargetControl {
                fuel_inlet_valve_fwd: &[A380FuelValve::LeftMidForwardTransferValve],
                fuel_inlet_valve_aft: &[A380FuelValve::LeftMidAftTransferValve],
            },
            A380FuelTankType::LeftOuter => TargetControl {
                fuel_inlet_valve_fwd: &[A380FuelValve::LeftOuterForwardTransferValve],
                fuel_inlet_valve_aft: &[A380FuelValve::LeftOuterAftTransferValve],
            },
            A380FuelTankType::RightInner => TargetControl {
                fuel_inlet_valve_fwd: &[A380FuelValve::RightInnerForwardTransferValve],
                fuel_inlet_valve_aft: &[A380FuelValve::RightInnerAftTransferValve],
            },
            A380FuelTankType::RightMid => TargetControl {
                fuel_inlet_valve_fwd: &[A380FuelValve::RightMidForwardTransferValve],
                fuel_inlet_valve_aft: &[A380FuelValve::RightMidAftTransferValve],
            },
            A380FuelTankType::RightOuter => TargetControl {
                fuel_inlet_valve_fwd: &[A380FuelValve::RightOuterForwardTransferValve],
                fuel_inlet_valve_aft: &[A380FuelValve::RightOuterAftTransferValve],
            },
            A380FuelTankType::Trim => TargetControl {
                fuel_inlet_valve_fwd: &[
                    A380FuelValve::TrimTankInletValve1,
                    A380FuelValve::TrimTankInletValve2,
                    A380FuelValve::TrimLineIsolationValveFwd,
                ],
                fuel_inlet_valve_aft: &[
                    A380FuelValve::TrimTankInletValve1,
                    A380FuelValve::TrimTankInletValve2,
                    A380FuelValve::TrimLineIsolationValveAft,
                ],
            },
        }
    });

#[derive(Default)]
pub(super) struct FuelControlApplication {
    fuel_pump_requested_running: EnumMap<A380FuelPump, bool>,
    fuel_valve_requested_open: EnumMap<A380FuelValve, bool>,
}
impl FuelControlApplication {
    pub(super) fn new() -> Self {
        Self::default()
    }

    pub(super) fn update(&mut self, gallery_connections: &TransferGalleryTankConnections) {
        self.fuel_pump_requested_running = Default::default();
        self.fuel_valve_requested_open = Default::default();

        // Process forward gallery connections
        for (tank, mode) in gallery_connections.forward_gallery {
            self.process_tank_mode(tank, mode, true);
        }

        // Process aft gallery connections
        for (tank, mode) in gallery_connections.aft_gallery {
            self.process_tank_mode(tank, mode, false);
        }
    }

    fn process_tank_mode(&mut self, tank: A380FuelTankType, mode: TankMode, is_forward: bool) {
        match mode {
            TankMode::None => {}
            TankMode::Source => {
                let SourceControl {
                    fuel_pump_fwd,
                    fuel_pump_aft,
                    fuel_valve_fwd,
                    fuel_valve_aft,
                } = SOURCE_CONTROL_MAP[tank];
                if is_forward {
                    for &pump in fuel_pump_fwd {
                        self.fuel_pump_requested_running[pump] = true;
                    }
                    for &valve in fuel_valve_fwd {
                        self.fuel_valve_requested_open[valve] = true;
                    }
                } else {
                    for &pump in fuel_pump_aft {
                        self.fuel_pump_requested_running[pump] = true;
                    }
                    for &valve in fuel_valve_aft {
                        self.fuel_valve_requested_open[valve] = true;
                    }
                }
            }
            TankMode::Target => {
                let TargetControl {
                    fuel_inlet_valve_fwd,
                    fuel_inlet_valve_aft,
                } = TARGET_CONTROL_MAP[tank];
                if is_forward {
                    for &valve in fuel_inlet_valve_fwd {
                        self.fuel_valve_requested_open[valve] = true;
                    }
                } else {
                    for &valve in fuel_inlet_valve_aft {
                        self.fuel_valve_requested_open[valve] = true;
                    }
                }
            }
        }
    }

    pub(super) fn fuel_pump_requested_running(&self) -> EnumMap<A380FuelPump, bool> {
        self.fuel_pump_requested_running
    }

    pub(super) fn fuel_valve_requested_open(&self) -> EnumMap<A380FuelValve, bool> {
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
        gallery.forward_gallery[A380FuelTankType::LeftInner] = TankMode::Source;

        control.update(&gallery);

        assert_only_specified_pumps_on(&control, &[A380FuelPump::LeftInnerFwd]);
    }

    #[test]
    fn test_source_tank_activates_aft_pump_in_aft_gallery() {
        let mut control = FuelControlApplication::new();
        let mut gallery = TransferGalleryTankConnections::default();

        // Set LeftInner as source in aft gallery
        gallery.aft_gallery[A380FuelTankType::LeftInner] = TankMode::Source;

        control.update(&gallery);

        assert_only_specified_pumps_on(&control, &[A380FuelPump::LeftInnerAft]);
    }

    #[test]
    fn test_target_feed_tank_opens_forward_valve() {
        let mut control = FuelControlApplication::new();
        let mut gallery = TransferGalleryTankConnections::default();

        // Set FeedOne as target in forward gallery
        gallery.forward_gallery[A380FuelTankType::FeedOne] = TankMode::Target;

        control.update(&gallery);

        assert_only_specified_valves_open(
            &control,
            &[A380FuelValve::FeedTank1ForwardTransferValve],
        );
    }

    #[test]
    fn test_target_feed_tank_opens_aft_valve() {
        let mut control = FuelControlApplication::new();
        let mut gallery = TransferGalleryTankConnections::default();

        // Set FeedTwo as target in aft gallery
        gallery.aft_gallery[A380FuelTankType::FeedTwo] = TankMode::Target;

        control.update(&gallery);

        assert_only_specified_valves_open(&control, &[A380FuelValve::FeedTank2AftTransferValve]);
    }

    #[test]
    fn test_any_tank_can_be_target_opens_valve() {
        let mut control = FuelControlApplication::new();
        let mut gallery = TransferGalleryTankConnections::default();

        // Set various tank types as targets
        gallery.forward_gallery[A380FuelTankType::Trim] = TankMode::Target;
        gallery.aft_gallery[A380FuelTankType::LeftInner] = TankMode::Target;

        control.update(&gallery);

        assert_only_specified_valves_open(
            &control,
            &[
                A380FuelValve::TrimLineIsolationValveFwd,
                A380FuelValve::TrimTankInletValve1,
                A380FuelValve::TrimTankInletValve2,
                A380FuelValve::LeftInnerAftTransferValve,
            ],
        );
    }

    #[test]
    fn test_wing_tanks_as_targets() {
        let mut control = FuelControlApplication::new();
        let mut gallery = TransferGalleryTankConnections::default();

        // Set wing tanks as targets
        gallery.forward_gallery[A380FuelTankType::LeftOuter] = TankMode::Target;
        gallery.aft_gallery[A380FuelTankType::RightMid] = TankMode::Target;

        control.update(&gallery);

        assert_only_specified_valves_open(
            &control,
            &[
                A380FuelValve::LeftOuterForwardTransferValve,
                A380FuelValve::RightMidAftTransferValve,
            ],
        );
    }

    #[test]
    fn test_multiple_sources_in_different_galleries() {
        let mut control = FuelControlApplication::new();
        let mut gallery = TransferGalleryTankConnections::default();

        // Set sources in different galleries
        gallery.forward_gallery[A380FuelTankType::LeftOuter] = TankMode::Source;
        gallery.aft_gallery[A380FuelTankType::RightMid] = TankMode::Source;

        control.update(&gallery);

        assert_only_specified_pumps_on(
            &control,
            &[A380FuelPump::LeftOuter, A380FuelPump::RightMidAft],
        );
    }

    #[test]
    fn test_none_mode_does_nothing() {
        let mut control = FuelControlApplication::new();
        let gallery = TransferGalleryTankConnections::default(); // All TankMode::None by default

        control.update(&gallery);

        assert_only_specified_pumps_on(&control, &[]);
        assert_only_specified_valves_open(&control, &[]);
    }

    #[test]
    fn test_forward_pump_turns_off_when_no_longer_source() {
        let mut control = FuelControlApplication::new();
        let mut gallery = TransferGalleryTankConnections::default();

        // First update: LeftInner is source in forward gallery
        gallery.forward_gallery[A380FuelTankType::LeftInner] = TankMode::Source;
        control.update(&gallery);

        assert_only_specified_pumps_on(&control, &[A380FuelPump::LeftInnerFwd]);

        // Second update: Clear LeftInner as source (set to None)
        gallery.forward_gallery[A380FuelTankType::LeftInner] = TankMode::None;
        control.update(&gallery);

        assert_only_specified_pumps_on(&control, &[]);
    }

    #[test]
    fn test_valves_turn_off_when_no_longer_target() {
        let mut control = FuelControlApplication::new();
        let mut gallery = TransferGalleryTankConnections::default();

        // First update: FeedOne is target
        gallery.forward_gallery[A380FuelTankType::FeedOne] = TankMode::Target;
        control.update(&gallery);

        assert_only_specified_valves_open(
            &control,
            &[A380FuelValve::FeedTank1ForwardTransferValve],
        );

        // Second update: Clear FeedOne as target (set to None)
        gallery.forward_gallery[A380FuelTankType::FeedOne] = TankMode::None;
        control.update(&gallery);

        assert_only_specified_valves_open(&control, &[]);
    }

    #[test]
    fn test_only_specified_pumps_run() {
        let mut control = FuelControlApplication::new();
        let mut gallery = TransferGalleryTankConnections::default();

        // Set RightOuter as source
        gallery.forward_gallery[A380FuelTankType::RightOuter] = TankMode::Source;
        control.update(&gallery);

        assert_only_specified_pumps_on(&control, &[A380FuelPump::RightOuter]);
    }

    #[test]
    fn test_only_specified_valves_open() {
        let mut control = FuelControlApplication::new();
        let mut gallery = TransferGalleryTankConnections::default();

        // Set FeedThree as target
        gallery.aft_gallery[A380FuelTankType::FeedThree] = TankMode::Target;
        control.update(&gallery);

        assert_only_specified_valves_open(&control, &[A380FuelValve::FeedTank3AftTransferValve]);
    }

    #[test]
    fn test_switching_source_tank_turns_off_old_gallery_pump() {
        let mut control = FuelControlApplication::new();
        let mut gallery = TransferGalleryTankConnections::default();

        // First update: LeftMid is source in forward gallery
        gallery.forward_gallery[A380FuelTankType::LeftMid] = TankMode::Source;
        control.update(&gallery);

        assert_only_specified_pumps_on(&control, &[A380FuelPump::LeftMidFwd]);

        // Second update: Switch to RightMid as source in forward gallery
        gallery.forward_gallery[A380FuelTankType::LeftMid] = TankMode::None;
        gallery.forward_gallery[A380FuelTankType::RightMid] = TankMode::Source;
        control.update(&gallery);

        assert_only_specified_pumps_on(&control, &[A380FuelPump::RightMidFwd]);
    }

    #[test]
    fn test_switching_target_tank_turns_off_old_valves() {
        let mut control = FuelControlApplication::new();
        let mut gallery = TransferGalleryTankConnections::default();

        // First update: FeedOne is target (forward gallery)
        gallery.forward_gallery[A380FuelTankType::FeedOne] = TankMode::Target;
        control.update(&gallery);

        assert_only_specified_valves_open(
            &control,
            &[A380FuelValve::FeedTank1ForwardTransferValve],
        );

        // Second update: Switch to FeedTwo as target
        gallery.forward_gallery[A380FuelTankType::FeedOne] = TankMode::None;
        gallery.forward_gallery[A380FuelTankType::FeedTwo] = TankMode::Target;
        control.update(&gallery);

        assert_only_specified_valves_open(
            &control,
            &[A380FuelValve::FeedTank2ForwardTransferValve],
        );
    }

    #[test]
    fn test_complex_scenario_multiple_sources_and_targets() {
        let mut control = FuelControlApplication::new();
        let mut gallery = TransferGalleryTankConnections::default();

        // Setup: LeftOuter and RightMid as sources (from different galleries)
        // FeedOne and FeedThree as targets (from different galleries)
        gallery.forward_gallery[A380FuelTankType::LeftOuter] = TankMode::Source;
        gallery.forward_gallery[A380FuelTankType::FeedOne] = TankMode::Target;
        gallery.aft_gallery[A380FuelTankType::RightMid] = TankMode::Source;
        gallery.aft_gallery[A380FuelTankType::FeedThree] = TankMode::Target;

        control.update(&gallery);

        assert_only_specified_pumps_on(
            &control,
            &[A380FuelPump::LeftOuter, A380FuelPump::RightMidAft],
        );
        assert_only_specified_valves_open(
            &control,
            &[
                A380FuelValve::FeedTank1ForwardTransferValve,
                A380FuelValve::FeedTank3AftTransferValve,
            ],
        );
    }

    #[test]
    fn test_outer_tank_pump_activation() {
        let mut control = FuelControlApplication::new();
        let mut gallery = TransferGalleryTankConnections::default();

        // Outer tanks have only one pump (LeftOuter == LeftOuter for both galleries)
        gallery.forward_gallery[A380FuelTankType::LeftOuter] = TankMode::Source;
        control.update(&gallery);

        assert_only_specified_pumps_on(&control, &[A380FuelPump::LeftOuter]);
    }

    #[test]
    fn test_gallery_specific_pump_control_prevents_interference() {
        let mut control = FuelControlApplication::new();
        let mut gallery = TransferGalleryTankConnections::default();

        // Forward: LeftMid source, Aft: RightMid source
        gallery.forward_gallery[A380FuelTankType::LeftMid] = TankMode::Source;
        gallery.aft_gallery[A380FuelTankType::RightMid] = TankMode::Source;
        control.update(&gallery);

        assert_only_specified_pumps_on(
            &control,
            &[A380FuelPump::LeftMidFwd, A380FuelPump::RightMidAft],
        );
    }

    #[test]
    fn test_trim_tank_forward_transfer_should_open_correct_valves() {
        let mut control = FuelControlApplication::new();
        let mut gallery = TransferGalleryTankConnections::default();

        // Forward: LeftMid source, Aft: RightMid source
        gallery.forward_gallery[A380FuelTankType::Trim] = TankMode::Source;
        gallery.forward_gallery[A380FuelTankType::LeftInner] = TankMode::Target;
        gallery.forward_gallery[A380FuelTankType::RightInner] = TankMode::Target;
        control.update(&gallery);

        assert_only_specified_pumps_on(
            &control,
            &[A380FuelPump::TrimLeft, A380FuelPump::TrimRight],
        );
        assert_only_specified_valves_open(
            &control,
            &[
                A380FuelValve::TrimLineIsolationValveFwd,
                A380FuelValve::LeftInnerForwardTransferValve,
                A380FuelValve::RightInnerForwardTransferValve,
            ],
        );
    }

    #[test]
    fn test_trim_tank_aft_transfer_should_open_correct_valves() {
        let mut control = FuelControlApplication::new();
        let mut gallery = TransferGalleryTankConnections::default();

        // Forward: LeftMid source, Aft: RightMid source
        gallery.aft_gallery[A380FuelTankType::Trim] = TankMode::Source;
        gallery.aft_gallery[A380FuelTankType::LeftInner] = TankMode::Target;
        gallery.aft_gallery[A380FuelTankType::RightInner] = TankMode::Target;
        control.update(&gallery);

        assert_only_specified_pumps_on(
            &control,
            &[A380FuelPump::TrimLeft, A380FuelPump::TrimRight],
        );
        assert_only_specified_valves_open(
            &control,
            &[
                A380FuelValve::TrimLineIsolationValveAft,
                A380FuelValve::LeftInnerAftTransferValve,
                A380FuelValve::RightInnerAftTransferValve,
            ],
        );
    }

    #[test]
    fn test_target_trim_tank_forward_transfer_should_open_correct_valves() {
        let mut control = FuelControlApplication::new();
        let mut gallery = TransferGalleryTankConnections::default();

        gallery.forward_gallery[A380FuelTankType::Trim] = TankMode::Target;
        gallery.forward_gallery[A380FuelTankType::LeftInner] = TankMode::Source;
        gallery.forward_gallery[A380FuelTankType::RightInner] = TankMode::Source;
        control.update(&gallery);

        assert_only_specified_pumps_on(
            &control,
            &[A380FuelPump::LeftInnerFwd, A380FuelPump::RightInnerFwd],
        );
        assert_only_specified_valves_open(
            &control,
            &[
                A380FuelValve::TrimLineIsolationValveFwd,
                A380FuelValve::TrimTankInletValve1,
                A380FuelValve::TrimTankInletValve2,
            ],
        );
    }

    #[test]
    fn test_target_trim_tank_aft_transfer_should_open_correct_valves() {
        let mut control = FuelControlApplication::new();
        let mut gallery = TransferGalleryTankConnections::default();

        gallery.aft_gallery[A380FuelTankType::Trim] = TankMode::Target;
        gallery.aft_gallery[A380FuelTankType::LeftInner] = TankMode::Source;
        gallery.aft_gallery[A380FuelTankType::RightInner] = TankMode::Source;
        control.update(&gallery);

        assert_only_specified_pumps_on(
            &control,
            &[A380FuelPump::LeftInnerAft, A380FuelPump::RightInnerAft],
        );
        assert_only_specified_valves_open(
            &control,
            &[
                A380FuelValve::TrimLineIsolationValveAft,
                A380FuelValve::TrimTankInletValve1,
                A380FuelValve::TrimTankInletValve2,
            ],
        );
    }

    fn assert_only_specified_pumps_on(
        control: &FuelControlApplication,
        expected_on: &[A380FuelPump],
    ) {
        let pump_state = control.fuel_pump_requested_running();
        for (pump, state) in pump_state {
            if expected_on.contains(&pump) {
                assert!(state, "Expected pump {pump:?} to be ON");
            } else {
                assert!(!state, "Expected pump {pump:?} to be OFF");
            }
        }
    }

    fn assert_only_specified_valves_open(
        control: &FuelControlApplication,
        expected_open: &[A380FuelValve],
    ) {
        let valve_state = control.fuel_valve_requested_open();
        for (valve, state) in valve_state {
            if expected_open.contains(&valve) {
                assert!(state, "Expected valve {valve:?} to be OPEN");
            } else {
                assert!(!state, "Expected valve {valve:?} to be CLOSED");
            }
        }
    }
}
