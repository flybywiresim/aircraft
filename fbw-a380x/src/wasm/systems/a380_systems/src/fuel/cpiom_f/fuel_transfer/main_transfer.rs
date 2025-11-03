use crate::fuel::{
    cpiom_f::{
        fuel_transfer::{get_feed_tank_sources, sum_tanks, tanks_balanced},
        FuelQuantityProvider, TransferSourceTank, FEED_TANKS, INNER_TANKS, MID_TANKS, OUTER_TANKS,
        TRIM_TANK,
    },
    A380FuelTankType,
};
use std::{f64::INFINITY, time::Duration};
use uom::{
    si::{f64::Mass, mass::pound},
    ConstZero,
};

const TIME_TO_DESTINATION_CUTOFF: Duration = Duration::from_secs(60 * 24);

/// Determines the source tanks for the main fuel transfer
pub(crate) fn determine_feed_tank_source_main_transfer(
    tank_quantities: &impl FuelQuantityProvider,
    tank_sources: &[TransferSourceTank],
    remaining_flight_time: Option<Duration>,
) -> [TransferSourceTank; 4] {
    let inner_quantity = sum_tanks(tank_quantities, &INNER_TANKS);
    let mid_quantity = sum_tanks(tank_quantities, &MID_TANKS);
    let outer_quantity = sum_tanks(tank_quantities, &OUTER_TANKS);
    let trim_quantity = tank_quantities.get_tank_quantity(TRIM_TANK);

    // Determine the source for a fuel transfer depending on priority and available fuel
    let source_tank = if remaining_flight_time.is_some_and(|d| d < TIME_TO_DESTINATION_CUTOFF) {
        TransferSourceTank::None
    } else if inner_quantity > Mass::ZERO {
        TransferSourceTank::Inner
    } else if mid_quantity > Mass::ZERO {
        TransferSourceTank::Mid
    } else if trim_quantity > Mass::ZERO {
        TransferSourceTank::Trim
    } else if outer_quantity > Mass::ZERO {
        TransferSourceTank::Outer
    } else {
        TransferSourceTank::None
    };

    if source_tank == TransferSourceTank::None {
        return Default::default();
    }

    // Get thresholds and whether pairwise balancing applies
    let (feed_1_4_threshold, feed_2_3_threshold, transfer_threshold_diff, pairwise_synced) =
        transfer_thresholds(source_tank, remaining_flight_time, mid_quantity);

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
    let feed_tank_sources = get_feed_tank_sources(tank_sources);
    let feed_tank_quantities = tank_quantities.get_feed_tank_quantities();
    if pairwise_synced {
        assign_pairwise(
            feed_tank_sources,
            feed_tank_quantities,
            source_tank,
            feed_tank_below_threshold,
            feed_tank_below_upper_threshold,
        )
    } else {
        assign_non_pairwise(
            feed_tank_sources,
            feed_tank_quantities,
            source_tank,
            feed_tank_below_threshold,
            feed_tank_below_upper_threshold,
        )
    }
}

/// Determines threshold levels and balancing mode based on source and flight time
fn transfer_thresholds(
    source_tank: TransferSourceTank,
    remaining_flight_time: Option<Duration>,
    mid_quantity: Mass,
) -> (Mass, Mass, Mass, bool) {
    match source_tank {
        TransferSourceTank::Inner | TransferSourceTank::Mid => {
            if remaining_flight_time.is_some_and(|d| d < Duration::from_secs(90 * 60)) {
                (
                    Mass::new::<pound>(36_500.), // 16'556.12 kg
                    Mass::new::<pound>(39_350.), // 17'848.86 kg
                    Mass::new::<pound>(2_200.),  // 997.90 kg
                    true,
                )
            } else if mid_quantity.get::<pound>() < 17_650. {
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
            Mass::new::<pound>(INFINITY),
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
    feed_tank_sources: [TransferSourceTank; 4],
    feed_tank_quantities: [Mass; 4],
    source_tank: TransferSourceTank,
    feed_tank_below_threshold: [bool; 4],
    feed_tank_below_upper_threshold: [bool; 4],
) -> [TransferSourceTank; 4] {
    let mut new_feed_tank_sources = feed_tank_sources;
    for (
        (((feed_tank_source, feed_tank_quantity), below_threshold), below_upper_threshold),
        (paired_feed_tank_source, paired_feed_tank_quantity),
    ) in new_feed_tank_sources
        .iter_mut()
        .zip(feed_tank_quantities)
        .zip(feed_tank_below_threshold)
        .zip(feed_tank_below_upper_threshold)
        .zip(
            feed_tank_sources
                .into_iter()
                .zip(feed_tank_quantities)
                .rev(),
        )
    {
        *feed_tank_source = if below_threshold
            || below_upper_threshold
                && (feed_tank_source.is_some()
                    || paired_feed_tank_source.is_some()
                        && tanks_balanced(feed_tank_quantity, paired_feed_tank_quantity))
        {
            source_tank
        } else {
            TransferSourceTank::None
        };
    }
    new_feed_tank_sources
}

/// Assigns sources when tanks are balanced indipendently
fn assign_non_pairwise(
    feed_tank_sources: [TransferSourceTank; 4],
    feed_tank_quantities: [Mass; 4],
    source_tank: TransferSourceTank,
    feed_tank_below_threshold: [bool; 4],
    feed_tank_below_upper_threshold: [bool; 4],
) -> [TransferSourceTank; 4] {
    let all_feed_tank_below_upper_threshold = feed_tank_below_upper_threshold.iter().all(|t| *t);

    let mut new_feed_tank_sources = feed_tank_sources;
    for (i, (((feed_tank_source, feed_tank_quantity), below_threshold), below_upper_threshold)) in
        new_feed_tank_sources
            .iter_mut()
            .zip(feed_tank_quantities)
            .zip(feed_tank_below_threshold)
            .zip(feed_tank_below_upper_threshold)
            .enumerate()
    {
        *feed_tank_source = if below_threshold && all_feed_tank_below_upper_threshold
            || below_upper_threshold
                && (feed_tank_source.is_some()
                    || feed_tank_sources
                        .into_iter()
                        .zip(feed_tank_quantities)
                        .enumerate()
                        .any(|(j, (s, q))| {
                            i != j && s.is_some() && tanks_balanced(feed_tank_quantity, q)
                        })) {
            source_tank
        } else {
            TransferSourceTank::None
        };
    }
    new_feed_tank_sources
}

#[cfg(test)]
mod tests {
    use super::*;
    use fxhash::FxHashMap;
    use ntest::assert_about_eq;

    #[derive(Default)]
    struct MockFuelQuantityProvider {
        quantities: FxHashMap<A380FuelTankType, Mass>,
    }
    impl FuelQuantityProvider for MockFuelQuantityProvider {
        fn get_tank_quantity(&self, tank: A380FuelTankType) -> Mass {
            *self.quantities.get(&tank).unwrap_or(&Mass::default())
        }
    }

    #[test]
    fn test_no_transfer_when_flight_time_below_cutoff() {
        let provider = MockFuelQuantityProvider {
            quantities: Default::default(),
        };
        let sources = [TransferSourceTank::None; 4];
        let result = determine_feed_tank_source_main_transfer(
            &provider,
            &sources,
            Some(Duration::from_secs(60 * 10)),
        );
        assert_eq!(result, [TransferSourceTank::None; 4]);
    }

    #[test]
    fn test_inner_selected_when_inner_has_fuel() {
        let quantities =
            FxHashMap::from_iter([(A380FuelTankType::LeftInner, Mass::new::<kilogram>(1000.))]);
        let provider = MockFuelQuantityProvider { quantities };
        let sources = [TransferSourceTank::None; 4];
        let result = determine_feed_tank_source_main_transfer(
            &provider,
            &sources,
            Some(Duration::from_secs(60 * 60 * 2)),
        );
        assert!(result.iter().any(|s| *s == TransferSourceTank::Inner));
    }

    #[test]
    fn test_mid_selected_when_only_mid_has_fuel() {
        let quantities =
            FxHashMap::from_iter([(A380FuelTankType::LeftMid, Mass::new::<kilogram>(1500.))]);
        let provider = MockFuelQuantityProvider { quantities };
        let sources = [TransferSourceTank::None; 4];
        let result = determine_feed_tank_source_main_transfer(
            &provider,
            &sources,
            Some(Duration::from_secs(60 * 60 * 3)),
        );
        assert!(result.iter().any(|s| *s == TransferSourceTank::Mid));
    }

    #[test]
    fn test_trim_selected_when_only_trim_has_fuel() {
        let quantities =
            FxHashMap::from_iter([(A380FuelTankType::Trim, Mass::new::<kilogram>(500.))]);
        let provider = MockFuelQuantityProvider { quantities };
        let sources = [TransferSourceTank::None; 4];
        let result = determine_feed_tank_source_main_transfer(
            &provider,
            &sources,
            Some(Duration::from_secs(60 * 60 * 4)),
        );
        assert!(result.iter().any(|s| *s == TransferSourceTank::Trim));
    }

    #[test]
    fn test_outer_selected_when_only_outer_has_fuel() {
        let quantities =
            FxHashMap::from_iter([(A380FuelTankType::LeftOuter, Mass::new::<kilogram>(800.))]);
        let provider = MockFuelQuantityProvider { quantities };
        let sources = [TransferSourceTank::None; 4];
        let result = determine_feed_tank_source_main_transfer(
            &provider,
            &sources,
            Some(Duration::from_secs(60 * 60 * 5)),
        );
        assert!(result.iter().any(|s| *s == TransferSourceTank::Outer));
    }

    #[test]
    fn test_transfer_thresholds_inner_short_flight() {
        let (f1_4, f2_3, diff, pairwise) = transfer_thresholds(
            TransferSourceTank::Inner,
            Some(Duration::from_secs(60 * 60)),
            Mass::new::<pound>(20_000.),
        );
        assert_about_eq!(f1_4.get::<pound>(), 36_500., 1e-2);
        assert_about_eq!(f2_3.get::<pound>(), 39_350., 1e-2);
        assert!(pairwise);
    }

    #[test]
    fn test_transfer_thresholds_mid_low_quantity() {
        let (f1_4, f2_3, diff, pairwise) = transfer_thresholds(
            TransferSourceTank::Mid,
            Some(Duration::from_secs(60 * 60 * 2)),
            Mass::new::<pound>(17_000.),
        );
        assert_about_eq!(f1_4.get::<pound>(), 43_100., 1e-2);
        assert_about_eq!(f2_3.get::<pound>(), 43_100., 1e-2);
        assert!(!pairwise);
    }

    #[test]
    fn test_transfer_thresholds_mid_high_quantity() {
        let (f1_4, f2_3, diff, pairwise) = transfer_thresholds(
            TransferSourceTank::Mid,
            Some(Duration::from_secs(60 * 60 * 3)),
            Mass::new::<pound>(20_000.),
        );
        assert_about_eq!(f1_4.get::<pound>(), 43_100., 1e-2);
        assert_about_eq!(f2_3.get::<pound>(), 45_950., 1e-2);
        assert!(pairwise);
    }

    #[test]
    fn test_transfer_thresholds_trim() {
        let (f1_4, f2_3, diff, pairwise) =
            transfer_thresholds(TransferSourceTank::Trim, None, Mass::default());
        assert_about_eq!(f1_4.get::<pound>(), 13_250., 1e-2);
        assert_about_eq!(f2_3.get::<pound>(), 13_250., 1e-2);
        assert_eq!(diff.get::<pound>(), f64::INFINITY);
        assert!(!pairwise);
    }

    #[test]
    fn test_transfer_thresholds_outer() {
        let (f1_4, f2_3, diff, pairwise) =
            transfer_thresholds(TransferSourceTank::Outer, None, Mass::default());
        assert_about_eq!(f1_4.get::<pound>(), 8_800., 1e-2);
        assert_about_eq!(f2_3.get::<pound>(), 8_800., 1e-2);
        assert_about_eq!(diff.get::<pound>(), 1_100., 1e-2);
        assert!(pairwise);
    }

    #[test]
    fn test_assign_pairwise_with_balanced_pairs() {
        // One pair has active source, other none
        let sources = [
            TransferSourceTank::Inner,
            TransferSourceTank::None,
            TransferSourceTank::None,
            TransferSourceTank::Inner,
        ];
        let quantities = [100.; 4].map(|q| Mass::new::<kilogram>(q));
        let below = [false; 4];
        let upper = [true; 4];

        let assigned_sources =
            assign_pairwise(sources, quantities, TransferSourceTank::Mid, below, upper);

        // Expect pairs (1-4) to be updated if balanced
        assert_eq!(assigned_sources[0], TransferSourceTank::Mid);
        assert_eq!(assigned_sources[3], TransferSourceTank::Mid);
    }

    #[test]
    fn test_assign_pairwise_with_unbalanced_pairs() {
        // Provide active source on one side, big imbalance on other
        let sources = [
            TransferSourceTank::None,
            TransferSourceTank::Outer,
            TransferSourceTank::Outer,
            TransferSourceTank::None,
        ];
        let quantities = [100., 200., 100., 100.].map(|q| Mass::new::<kilogram>(q));
        let below = [false; 4];
        let upper = [true; 4];

        let assigned_sources =
            assign_pairwise(sources, quantities, TransferSourceTank::Outer, below, upper);

        // Expect only balanced pairs to be updated
        assert_eq!(assigned_sources[1], TransferSourceTank::None);
        assert_eq!(assigned_sources[2], TransferSourceTank::None);
    }

    #[test]
    fn test_assign_non_pairwise_all_below_upper() {
        let sources = [TransferSourceTank::None; 4];
        let quantities = [50.; 4].map(|q| Mass::new::<kilogram>(q));
        let below = [true; 4];
        let upper = [true; 4];

        let assigned_sources =
            assign_non_pairwise(sources, quantities, TransferSourceTank::Trim, below, upper);

        // Expect all to be set to Trim since all below upper threshold
        assert_eq!(assigned_sources, [TransferSourceTank::Trim; 4]);
    }

    #[test]
    fn test_assign_non_pairwise_with_mixed_prior_sources() {
        let sources = [
            TransferSourceTank::Outer,
            TransferSourceTank::None,
            TransferSourceTank::Outer,
            TransferSourceTank::None,
        ];
        let quantities = [60., 65., 60., 65.].map(|q| Mass::new::<kilogram>(q));
        let below = [false, true, false, true];
        let upper = [true, true, true, true];

        let assigned_sources =
            assign_non_pairwise(sources, quantities, TransferSourceTank::Outer, below, upper);

        // Expect tanks with prior active sources and close balance to be updated
        assert_eq!(assigned_sources[0], TransferSourceTank::Outer);
        assert_eq!(assigned_sources[2], TransferSourceTank::Outer);
    }

    #[test]
    fn test_all_none_when_no_fuel() {
        let provider = MockFuelQuantityProvider::default();
        let sources = [TransferSourceTank::None; 4];
        let result = determine_feed_tank_source_main_transfer(
            &provider,
            &sources,
            Some(Duration::from_secs(60 * 60 * 6)),
        );
        assert!(result.iter().all(|s| *s == TransferSourceTank::None));
    }

    #[test]
    fn test_tanks_balanced_function() {
        let a = Mass::new::<kilogram>(100.);
        let b = Mass::new::<kilogram>(105.);
        let c = Mass::new::<kilogram>(200.);
        assert!(tanks_balanced(a, b));
        assert!(!tanks_balanced(a, c));
    }

    #[test]
    fn test_sum_tanks_function() {
        let quantities = FxHashMap::from_iter([
            (A380FuelTankType::LeftMid, Mass::new::<kilogram>(500.)),
            (A380FuelTankType::RightMid, Mass::new::<kilogram>(500.)),
        ]);
        let provider = MockFuelQuantityProvider { quantities };
        let sum = sum_tanks(
            &provider,
            &[A380FuelTankType::LeftMid, A380FuelTankType::RightMid],
        );
        assert_about_eq!(sum.get::<kilogram>(), 1000., 1e-2);
    }
}
