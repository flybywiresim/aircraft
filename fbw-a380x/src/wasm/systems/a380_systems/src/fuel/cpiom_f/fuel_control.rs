use super::{TransferGallery, TransferSourceTank};
use crate::fuel::{A380FuelPump, A380FuelTankType, A380FuelValve};
use enum_map::Enum;
use fxhash::{FxHashMap, FxHashSet};
use uom::si::{
    f64::{Mass, Ratio},
    mass::pound,
    ratio::percent,
};

pub(super) struct FuelControlApplication {
    fuel_pump_requested_running: [bool; A380FuelPump::LENGTH],
    fuel_valve_requested_open: [bool; A380FuelValve::LENGTH],

    source_tank_to_fuel_pump_map:
        FxHashMap<(TransferSourceTank, TransferGallery), (A380FuelPump, A380FuelPump)>,

    tank_inlet_valve_map: FxHashMap<(A380FuelTankType, TransferGallery), A380FuelValve>,
}
impl FuelControlApplication {
    const FEED_TANK_FWD_INLET_VALVES: [A380FuelValve; 4] = [
        A380FuelValve::FeedTank1ForwardInletValve,
        A380FuelValve::FeedTank2ForwardInletValve,
        A380FuelValve::FeedTank3ForwardInletValve,
        A380FuelValve::FeedTank4ForwardInletValve,
    ];
    const FEED_TANK_AFT_INLET_VALVES: [A380FuelValve; 4] = [
        A380FuelValve::FeedTank1AftInletValve,
        A380FuelValve::FeedTank2AftInletValve,
        A380FuelValve::FeedTank3AftInletValve,
        A380FuelValve::FeedTank4AftInletValve,
    ];

    fn new() -> Self {
        Self {
            fuel_pump_requested_running: [false; A380FuelPump::LENGTH],
            fuel_valve_requested_open: [false; A380FuelValve::LENGTH],

            source_tank_to_fuel_pump_map: FxHashMap::from_iter([
                (
                    (TransferSourceTank::Inner, TransferGallery::Fwd),
                    (A380FuelPump::LeftInnerFwd, A380FuelPump::RightInnerFwd),
                ),
                (
                    (TransferSourceTank::Inner, TransferGallery::Aft),
                    (A380FuelPump::LeftInnerAft, A380FuelPump::RightInnerAft),
                ),
                (
                    (TransferSourceTank::Mid, TransferGallery::Fwd),
                    (A380FuelPump::LeftMidFwd, A380FuelPump::RightMidFwd),
                ),
                (
                    (TransferSourceTank::Mid, TransferGallery::Aft),
                    (A380FuelPump::LeftMidAft, A380FuelPump::RightMidAft),
                ),
                (
                    (TransferSourceTank::Outer, TransferGallery::Fwd),
                    (A380FuelPump::LeftOuter, A380FuelPump::RightOuter),
                ),
                (
                    (TransferSourceTank::Trim, TransferGallery::Fwd),
                    (A380FuelPump::TrimLeft, A380FuelPump::TrimRight),
                ),
                (
                    (TransferSourceTank::Trim, TransferGallery::Aft),
                    (A380FuelPump::TrimLeft, A380FuelPump::TrimRight),
                ),
            ]),

            tank_inlet_valve_map: FxHashMap::from_iter([
                (
                    (A380FuelTankType::FeedOne, TransferGallery::Fwd),
                    A380FuelValve::FeedTank1ForwardInletValve,
                ),
                (
                    (A380FuelTankType::FeedOne, TransferGallery::Aft),
                    A380FuelValve::FeedTank1AftInletValve,
                ),
                (
                    (A380FuelTankType::FeedTwo, TransferGallery::Fwd),
                    A380FuelValve::FeedTank2ForwardInletValve,
                ),
                (
                    (A380FuelTankType::FeedTwo, TransferGallery::Aft),
                    A380FuelValve::FeedTank2AftInletValve,
                ),
                (
                    (A380FuelTankType::FeedThree, TransferGallery::Fwd),
                    A380FuelValve::FeedTank3ForwardInletValve,
                ),
                (
                    (A380FuelTankType::FeedThree, TransferGallery::Aft),
                    A380FuelValve::FeedTank3AftInletValve,
                ),
                (
                    (A380FuelTankType::FeedFour, TransferGallery::Fwd),
                    A380FuelValve::FeedTank4ForwardInletValve,
                ),
                (
                    (A380FuelTankType::FeedFour, TransferGallery::Aft),
                    A380FuelValve::FeedTank4AftInletValve,
                ),
                // TODO: complete map
            ]),
        }
    }

    fn update(&mut self, feed_tank_sources: [(TransferSourceTank, TransferGallery); 4]) {
        self.fuel_pump_requested_running = Default::default();
        self.fuel_valve_requested_open = [false; A380FuelValve::LENGTH];

        let mut source_tanks = FxHashSet::default(); // TODO: use predefined size or use previous buffer

        source_tanks.extend(&feed_tank_sources);

        // Determine feed tank inlet valve state
        for (i, (source_tank, gallery)) in feed_tank_sources.iter().enumerate() {
            if source_tank.is_some() {
                let fuel_valves = match gallery {
                    TransferGallery::Fwd => Self::FEED_TANK_FWD_INLET_VALVES,
                    TransferGallery::Aft => Self::FEED_TANK_AFT_INLET_VALVES,
                };
                self.fuel_valve_requested_open[fuel_valves[i].into_usize()] = true;
            }
        }

        // Determine which fuel pumps should run
        for source in &source_tanks {
            let (left_pump, right_pump) = self.source_tank_to_fuel_pump_map[source];
            self.fuel_pump_requested_running[left_pump.into_usize()] = true;
            self.fuel_pump_requested_running[right_pump.into_usize()] = true;
        }
    }
}
