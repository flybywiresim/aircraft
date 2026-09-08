use crate::fuel::{
    cpiom_f::{
        fuel_transfer::FuelTransfer, tanks_balanced, FuelQuantityProvider, TankMode,
        TransferGalleryConnections, FEED_TANKS, INNER_TANKS, MID_TANKS, OUTER_TANKS, TRIM_TANK,
    },
    A380FuelTankType,
};
use std::time::Duration;
use uom::si::{f64::Mass, mass::pound};

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
enum TransferSourceTank {
    #[default]
    None,
    Inner,
    Mid,
    Trim,
    Outer,
}

#[derive(Default)]
pub(super) struct MainTransfer {
    feed_tank_is_target: [bool; 4],
    source_tank: TransferSourceTank,
}
impl MainTransfer {
    /// Updates the source tanks for the main fuel transfer
    pub(crate) fn update(
        &mut self,
        tank_quantities: &impl FuelQuantityProvider,
        remaining_flight_time: Option<Duration>,
    ) {
        // Determine the source for a fuel transfer depending on priority and available fuel
        self.source_tank = if !tank_quantities.tanks_empty(INNER_TANKS) {
            TransferSourceTank::Inner
        } else if !tank_quantities.tanks_empty(MID_TANKS) {
            TransferSourceTank::Mid
        } else if !tank_quantities.tank_empty(TRIM_TANK) {
            TransferSourceTank::Trim
        } else if !tank_quantities.tanks_empty(OUTER_TANKS) {
            TransferSourceTank::Outer
        } else {
            *self = Default::default();
            return;
        };

        // Get thresholds and whether pairwise balancing applies
        let (feed_1_4_threshold, feed_2_3_threshold, transfer_threshold_diff, pairwise_synced) =
            Self::transfer_thresholds(tank_quantities, self.source_tank, remaining_flight_time);

        // Determine if the feed tanks are below the lower threshold
        let feed_tank_below_threshold = FEED_TANKS.map(|tank| {
            let q = tank_quantities.get_tank_quantity(tank);
            if matches!(tank, A380FuelTankType::FeedOne | A380FuelTankType::FeedFour) {
                q <= feed_1_4_threshold
            } else {
                q <= feed_2_3_threshold
            }
        });

        // Determine if the feed tanks are below the upper threshold
        let feed_tank_below_upper_threshold = FEED_TANKS.map(|tank| {
            let q = tank_quantities.get_tank_quantity(tank);
            if matches!(tank, A380FuelTankType::FeedOne | A380FuelTankType::FeedFour) {
                q <= feed_1_4_threshold + transfer_threshold_diff
            } else {
                q <= feed_2_3_threshold + transfer_threshold_diff
            }
        });

        // Determine if a feed tank should be target of a fuel transfer
        let feed_tank_quantities = tank_quantities.get_feed_tank_quantities();
        if pairwise_synced {
            self.assign_pairwise(
                feed_tank_quantities,
                feed_tank_below_threshold,
                feed_tank_below_upper_threshold,
            );
        } else {
            self.assign_non_pairwise(
                feed_tank_quantities,
                feed_tank_below_threshold,
                feed_tank_below_upper_threshold,
            );
        }
    }

    /// Determines threshold levels and balancing mode based on source and flight time
    fn transfer_thresholds(
        tank_quantities: &impl FuelQuantityProvider,
        source_tank: TransferSourceTank,
        remaining_flight_time: Option<Duration>,
    ) -> (Mass, Mass, Mass, bool) {
        match source_tank {
            TransferSourceTank::Inner | TransferSourceTank::Mid => {
                if remaining_flight_time.is_some_and(|d| d < Duration::from_mins(90)) {
                    (
                        Mass::new::<pound>(36_500.), // 16'556.12 kg
                        Mass::new::<pound>(39_350.), // 17'848.86 kg
                        Mass::new::<pound>(2_200.),  // 997.90 kg
                        true,
                    )
                } else if tank_quantities.sum_tanks(MID_TANKS).get::<pound>() < 17_650. {
                    (
                        Mass::new::<pound>(43_100.), // 19'549.83 kg
                        Mass::new::<pound>(43_100.), // 19'549.83 kg
                        Mass::new::<pound>(2_200.),  // 997.90 kg
                        false,
                    )
                } else {
                    (
                        Mass::new::<pound>(43_100.), // 19'549.83 kg - 20'547.73 kg
                        Mass::new::<pound>(45_950.), // 20'842.57 kg - 21'840.47 kg
                        Mass::new::<pound>(2_200.),  // 997.90 kg
                        true,
                    )
                }
            }
            TransferSourceTank::Trim => (
                Mass::new::<pound>(13_250.), // 6'010.10 kg
                Mass::new::<pound>(13_250.), // 6'010.10 kg
                Mass::new::<pound>(f64::INFINITY),
                false, // TODO: when not enough fuel is in the trim tank to balance all feed tanks they are balanced pair-wise
            ),
            TransferSourceTank::Outer | TransferSourceTank::None => (
                Mass::new::<pound>(8_800.), // 3'991.61 kg
                Mass::new::<pound>(8_800.), // 3'991.61 kg
                Mass::new::<pound>(1_100.), // 498.95 kg
                true,
            ),
        }
    }

    /// Assigns sources when tanks are balanced in pairs (e.g., 1-4, 2-3)
    fn assign_pairwise(
        &mut self,
        feed_tank_quantities: [Mass; 4],
        feed_tank_below_threshold: [bool; 4],
        feed_tank_below_upper_threshold: [bool; 4],
    ) {
        let mut new_feed_tank_is_target = self.feed_tank_is_target;
        for (
            (((feed_tank_is_target, feed_tank_quantity), below_threshold), below_upper_threshold),
            (paired_feed_tank_is_target, paired_feed_tank_quantity),
        ) in new_feed_tank_is_target
            .iter_mut()
            .zip(feed_tank_quantities)
            .zip(feed_tank_below_threshold)
            .zip(feed_tank_below_upper_threshold)
            .zip(
                self.feed_tank_is_target
                    .into_iter()
                    .zip(feed_tank_quantities)
                    .rev(),
            )
        {
            *feed_tank_is_target = below_threshold
                || below_upper_threshold
                    && (*feed_tank_is_target
                        || paired_feed_tank_is_target
                            && tanks_balanced(feed_tank_quantity, paired_feed_tank_quantity));
        }
        self.feed_tank_is_target = new_feed_tank_is_target;
    }

    /// Assigns sources when tanks are balanced indipendently
    fn assign_non_pairwise(
        &mut self,
        feed_tank_quantities: [Mass; 4],
        feed_tank_below_threshold: [bool; 4],
        feed_tank_below_upper_threshold: [bool; 4],
    ) {
        let all_feed_tank_below_upper_threshold =
            feed_tank_below_upper_threshold.iter().all(|t| *t);

        let mut new_feed_tank_is_target = self.feed_tank_is_target;
        for (
            i,
            (((feed_tank_is_target, feed_tank_quantity), below_threshold), below_upper_threshold),
        ) in new_feed_tank_is_target
            .iter_mut()
            .zip(feed_tank_quantities)
            .zip(feed_tank_below_threshold)
            .zip(feed_tank_below_upper_threshold)
            .enumerate()
        {
            *feed_tank_is_target = below_threshold && all_feed_tank_below_upper_threshold
                || below_upper_threshold
                    && (*feed_tank_is_target
                        || self
                            .feed_tank_is_target
                            .into_iter()
                            .zip(feed_tank_quantities)
                            .enumerate()
                            .any(|(j, (s, q))| {
                                i != j && s && tanks_balanced(feed_tank_quantity, q)
                            }));
        }
        self.feed_tank_is_target = new_feed_tank_is_target;
    }
}
impl FuelTransfer for MainTransfer {
    fn set_gallery_modes(
        &self,
        gallery_connections: &mut impl TransferGalleryConnections,
        _tank_quantities: &impl FuelQuantityProvider,
    ) {
        if self.feed_tank_is_target != [false; 4] {
            let targets = FEED_TANKS
                .into_iter()
                .zip(self.feed_tank_is_target)
                .filter_map(|(tank, is_target)| is_target.then_some((tank, TankMode::Target)));

            // TODO: balance tanks
            match self.source_tank {
                TransferSourceTank::Inner => {
                    if gallery_connections.is_forward_gallery_usable() {
                        gallery_connections.set_forward_gallery_modes(
                            INNER_TANKS
                                .into_iter()
                                .map(|t| (t, TankMode::Source))
                                .chain(targets),
                        )
                    }
                }
                TransferSourceTank::Mid => {
                    if gallery_connections.is_forward_gallery_usable() {
                        gallery_connections.set_forward_gallery_modes(
                            MID_TANKS
                                .into_iter()
                                .map(|t| (t, TankMode::Source))
                                .chain(targets),
                        )
                    }
                }
                TransferSourceTank::Outer => {
                    if gallery_connections.is_forward_gallery_usable() {
                        gallery_connections.set_forward_gallery_modes(
                            OUTER_TANKS
                                .into_iter()
                                .map(|t| (t, TankMode::Source))
                                .chain(targets),
                        )
                    }
                }
                TransferSourceTank::Trim => {
                    if gallery_connections.is_aft_gallery_usable() {
                        gallery_connections.set_aft_gallery_modes(
                            [(TRIM_TANK, TankMode::Source)].into_iter().chain(targets),
                        )
                    }
                }
                TransferSourceTank::None => {}
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use ntest::assert_about_eq;
    use rstest::rstest;
    use rustc_hash::FxHashMap;
    use uom::si::mass::kilogram;

    #[derive(Default)]
    struct MockFuelQuantityProvider {
        quantities: FxHashMap<A380FuelTankType, Mass>,
    }
    impl MockFuelQuantityProvider {
        fn with_mid_tank_total_quantity(quantity: Mass) -> Self {
            Self {
                quantities: FxHashMap::from_iter([
                    (A380FuelTankType::LeftMid, quantity / 2.),
                    (A380FuelTankType::RightMid, quantity / 2.),
                ]),
            }
        }
    }
    impl FuelQuantityProvider for MockFuelQuantityProvider {
        fn get_tank_quantity(&self, tank: A380FuelTankType) -> Mass {
            *self.quantities.get(&tank).unwrap_or(&Mass::default())
        }

        fn get_tank_capacity(&self, _tank: A380FuelTankType) -> Mass {
            // For testing, we assume all tanks have the same capacity
            Mass::new::<kilogram>(10_000.)
        }
    }

    #[rstest]
    #[case(A380FuelTankType::LeftInner, TransferSourceTank::Inner)]
    #[case(A380FuelTankType::LeftMid, TransferSourceTank::Mid)]
    #[case(A380FuelTankType::LeftOuter, TransferSourceTank::Outer)]
    #[case(A380FuelTankType::Trim, TransferSourceTank::Trim)]
    fn test_inner_selected_when_single_tank_has_fuel(
        #[case] fuel_tank: A380FuelTankType,
        #[case] source_tank: TransferSourceTank,
    ) {
        let quantities = FxHashMap::from_iter([(fuel_tank, Mass::new::<kilogram>(1000.))]);
        let provider = MockFuelQuantityProvider { quantities };
        let mut transfer = MainTransfer::default();
        transfer.update(&provider, Some(Duration::from_mins(60)));
        assert!(transfer.feed_tank_is_target.iter().any(|s| *s));
        assert_eq!(transfer.source_tank, source_tank);
    }

    #[test]
    fn test_transfer_thresholds_inner_short_flight() {
        let (f1_4, f2_3, _diff, pairwise) = MainTransfer::transfer_thresholds(
            &MockFuelQuantityProvider::with_mid_tank_total_quantity(Mass::new::<pound>(20_000.)),
            TransferSourceTank::Inner,
            Some(Duration::from_mins(60)),
        );
        assert_about_eq!(f1_4.get::<pound>(), 36_500., 1e-2);
        assert_about_eq!(f2_3.get::<pound>(), 39_350., 1e-2);
        assert!(pairwise);
    }

    #[test]
    fn test_transfer_thresholds_mid_low_quantity() {
        let (f1_4, f2_3, _diff, pairwise) = MainTransfer::transfer_thresholds(
            &MockFuelQuantityProvider::with_mid_tank_total_quantity(Mass::new::<pound>(17_000.)),
            TransferSourceTank::Mid,
            Some(Duration::from_mins(120)),
        );
        assert_about_eq!(f1_4.get::<pound>(), 43_100., 1e-2);
        assert_about_eq!(f2_3.get::<pound>(), 43_100., 1e-2);
        assert!(!pairwise);
    }

    #[test]
    fn test_transfer_thresholds_mid_high_quantity() {
        let (f1_4, f2_3, _diff, pairwise) = MainTransfer::transfer_thresholds(
            &MockFuelQuantityProvider::with_mid_tank_total_quantity(Mass::new::<pound>(20_000.)),
            TransferSourceTank::Mid,
            Some(Duration::from_mins(120)),
        );
        assert_about_eq!(f1_4.get::<pound>(), 43_100., 1e-2);
        assert_about_eq!(f2_3.get::<pound>(), 45_950., 1e-2);
        assert!(pairwise);
    }

    #[test]
    fn test_transfer_thresholds_trim() {
        let (f1_4, f2_3, diff, pairwise) = MainTransfer::transfer_thresholds(
            &MockFuelQuantityProvider::default(),
            TransferSourceTank::Trim,
            None,
        );
        assert_about_eq!(f1_4.get::<pound>(), 13_250., 1e-2);
        assert_about_eq!(f2_3.get::<pound>(), 13_250., 1e-2);
        assert_eq!(diff.get::<pound>(), f64::INFINITY);
        assert!(!pairwise);
    }

    #[test]
    fn test_transfer_thresholds_outer() {
        let (f1_4, f2_3, diff, pairwise) = MainTransfer::transfer_thresholds(
            &MockFuelQuantityProvider::default(),
            TransferSourceTank::Outer,
            None,
        );
        assert_about_eq!(f1_4.get::<pound>(), 8_800., 1e-2);
        assert_about_eq!(f2_3.get::<pound>(), 8_800., 1e-2);
        assert_about_eq!(diff.get::<pound>(), 1_100., 1e-2);
        assert!(pairwise);
    }

    #[test]
    fn test_assign_pairwise_with_balanced_pairs() {
        let quantities = [100.; 4].map(Mass::new::<kilogram>);
        let below = [false; 4];
        let upper = [true; 4];

        let mut main_transfer = MainTransfer {
            // One pair has active source, other none
            feed_tank_is_target: [true, false, false, true],
            source_tank: TransferSourceTank::Mid,
        };

        main_transfer.assign_pairwise(quantities, below, upper);

        // Expect pairs (1-4) to be updated if balanced
        assert!(main_transfer.feed_tank_is_target[0]);
        assert!(main_transfer.feed_tank_is_target[3]);
        assert_eq!(main_transfer.source_tank, TransferSourceTank::Mid);
    }

    #[test]
    fn test_assign_pairwise_with_unbalanced_pairs() {
        // Provide active source on one side, big imbalance on other
        let quantities = [100., 200., 100., 50.].map(Mass::new::<kilogram>);
        let below = [false, true, false, true];
        let upper = [true, true, true, true];

        let mut main_transfer = MainTransfer {
            feed_tank_is_target: [false, true, false, false],
            source_tank: TransferSourceTank::Outer,
        };

        main_transfer.assign_pairwise(quantities, below, upper);

        // Expect unbalanced pairs to be updated correctly
        assert_eq!(
            main_transfer.feed_tank_is_target,
            [false, true, false, true]
        );
        assert_eq!(main_transfer.source_tank, TransferSourceTank::Outer);
    }

    #[test]
    fn test_assign_non_pairwise_all_below_upper() {
        let quantities = [50.; 4].map(Mass::new::<kilogram>);
        let below = [true; 4];
        let upper = [true; 4];

        let mut main_transfer = MainTransfer {
            feed_tank_is_target: [false; 4],
            source_tank: TransferSourceTank::Trim,
        };

        main_transfer.assign_non_pairwise(quantities, below, upper);

        // Expect all to be set to Trim since all below upper threshold
        assert_eq!(main_transfer.feed_tank_is_target, [true; 4]);
        assert_eq!(main_transfer.source_tank, TransferSourceTank::Trim);
    }

    #[test]
    fn test_assign_non_pairwise_with_mixed_prior_sources() {
        let quantities = [60., 65., 60., 65.].map(Mass::new::<kilogram>);
        let below = [false, true, false, true];
        let upper = [true, true, true, true];

        let mut main_transfer = MainTransfer {
            feed_tank_is_target: [true, false, true, false],
            source_tank: TransferSourceTank::Outer,
        };

        main_transfer.assign_non_pairwise(quantities, below, upper);

        // Expect tanks with prior active sources and close balance to be updated
        assert!(main_transfer.feed_tank_is_target[0]);
        assert!(main_transfer.feed_tank_is_target[2]);
        assert_eq!(main_transfer.source_tank, TransferSourceTank::Outer);
    }

    #[test]
    fn test_no_transfer_when_no_fuel() {
        let provider = MockFuelQuantityProvider::default();
        let mut main_transfer = MainTransfer::default();
        main_transfer.update(&provider, Some(Duration::from_secs(60 * 60 * 6)));
        assert_eq!(main_transfer.feed_tank_is_target, [false; 4]);
        assert_eq!(main_transfer.source_tank, TransferSourceTank::None);
    }

    #[rstest]
    #[case(A380FuelTankType::LeftOuter, TransferSourceTank::Outer)]
    #[case(A380FuelTankType::LeftMid, TransferSourceTank::Mid)]
    #[case(A380FuelTankType::LeftInner, TransferSourceTank::Inner)]
    #[case(A380FuelTankType::Trim, TransferSourceTank::Trim)]
    fn test_transfer_stops_when_no_fuel_left(
        #[case] fuel_tank: A380FuelTankType,
        #[case] source_tank: TransferSourceTank,
    ) {
        let quantities = FxHashMap::from_iter([(fuel_tank, Mass::new::<kilogram>(800.))]);
        let mut main_transfer = MainTransfer::default();
        main_transfer.update(
            &MockFuelQuantityProvider { quantities },
            Some(Duration::from_hours(2)),
        );
        assert_eq!(main_transfer.feed_tank_is_target, [true; 4]);
        assert_eq!(main_transfer.source_tank, source_tank);

        main_transfer.update(
            &MockFuelQuantityProvider::default(),
            Some(Duration::from_hours(2)),
        );
        assert_eq!(main_transfer.feed_tank_is_target, [false; 4]);
        assert_eq!(main_transfer.source_tank, TransferSourceTank::None);
    }

    #[test]
    fn test_tanks_balanced_function() {
        let a = Mass::new::<kilogram>(100.);
        let b = Mass::new::<kilogram>(105.);
        let c = Mass::new::<kilogram>(200.);
        assert!(tanks_balanced(a, b));
        assert!(!tanks_balanced(a, c));
    }
}
