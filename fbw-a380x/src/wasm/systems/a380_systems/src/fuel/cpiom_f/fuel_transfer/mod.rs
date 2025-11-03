mod cg_transfer;
mod load_alleviation_transfer;
mod main_transfer;

use super::{FuelQuantityProvider, TransferSourceTank};
use crate::fuel::{
    cpiom_f::{
        fuel_transfer::{
            cg_transfer::CGTransfer, load_alleviation_transfer::LoadAlleviationTransfer,
        },
        FEED_TANKS, INNER_TANKS, MID_TANKS,
    },
    A380FuelTankType,
};
use enum_map::{enum_map, Enum};
use std::{cell::LazyCell, time::Duration};
use uom::si::{
    f64::{Length, Mass, Ratio},
    mass::{kilogram, pound},
};

/// The CPIOM-F partition which calculates how the fuel should get transfered
#[derive(Default)]
pub(super) struct FuelTransferApplication {
    tank_sources: [TransferSourceTank; A380FuelTankType::LENGTH],

    load_alleviation_transfer: LoadAlleviationTransfer,
    cg_transfer: CGTransfer,
}
impl FuelTransferApplication {
    // Check: MSFS fuel density is currently always fixed, if this changes this will need to read from the var.
    const FUEL_GALLONS_TO_KG: f64 = 3.039075693483925;

    // TODO: deduplicate this information
    const FUEL_TANK_CAPACITIES: LazyCell<[Mass; A380FuelTankType::LENGTH]> = LazyCell::new(|| {
        // The fuel tank capacities in gallons
        let fuel_tank_capacities_gallons = enum_map! {
            A380FuelTankType::LeftOuter => 2731.5,
            A380FuelTankType::RightOuter => 2731.5,
            A380FuelTankType::FeedOne => 7299.6,
            A380FuelTankType::FeedTwo => 7753.2,
            A380FuelTankType::FeedThree => 7753.2,
            A380FuelTankType::FeedFour => 7299.6,
            A380FuelTankType::LeftMid => 9632.,
            A380FuelTankType::RightMid => 9632.,
            A380FuelTankType::LeftInner => 12189.4,
            A380FuelTankType::RightInner => 12189.4,
            A380FuelTankType::Trim => 6260.3,
        };
        fuel_tank_capacities_gallons
            .into_array()
            .map(|g| Mass::new::<kilogram>(g * Self::FUEL_GALLONS_TO_KG))
    });

    pub(super) fn new() -> Self {
        Self::default()
    }

    pub(super) fn reset(&mut self) {
        *self = Self::new();
    }

    pub(super) fn update(
        &mut self,
        tank_quantities: &impl FuelQuantityProvider,
        total_fuel_on_board: Option<Mass>,
        gross_weight: Option<Mass>,
        gross_cg: Option<Ratio>,
        remaining_flight_time: Option<Duration>,
        in_flight: bool,
        trim_tank_feed_isolated: bool,
        altitude: Option<Length>,
    ) {
        let Some(total_fuel_on_board) = total_fuel_on_board else {
            // Only manual transfers are available
            // TODO
            self.tank_sources = Default::default();
            return;
        };

        self.load_alleviation_transfer.update(
            &Self::FUEL_TANK_CAPACITIES,
            tank_quantities,
            total_fuel_on_board,
            remaining_flight_time,
            in_flight,
            trim_tank_feed_isolated,
            altitude,
        );

        self.cg_transfer.update(gross_weight, gross_cg);

        let mut new_tank_sources = Default::default();

        let forward_gallery_transfer_active = if self
            .load_alleviation_transfer
            .is_transfer_to_outer_tank_active()
        {
            for (tank, source) in self
                .load_alleviation_transfer
                .determine_load_alleviation_transfer_to_outer_tanks(tank_quantities)
            {
                new_tank_sources[tank.into_usize()] = source;
            }
            true
        } else if self
            .load_alleviation_transfer
            .is_transfer_from_outer_tank_active()
        {
            // TODO: balance tanks
            let target_tanks =
                if !tanks_full(&Self::FUEL_TANK_CAPACITIES, tank_quantities, &FEED_TANKS) {
                    &FEED_TANKS
                } else if !tanks_full(&Self::FUEL_TANK_CAPACITIES, tank_quantities, &MID_TANKS) {
                    &MID_TANKS
                } else if !tanks_full(&Self::FUEL_TANK_CAPACITIES, tank_quantities, &INNER_TANKS) {
                    &INNER_TANKS[..]
                } else {
                    &[]
                };
            for source in self
                .load_alleviation_transfer
                .determine_load_alleviation_transfer_from_outer_tanks()
            {
                new_tank_sources[target_tanks.into_usize()] = source;
            }
            true
        } else {
            false
        };

        let aft_gallery_transfer_active = if self
            .load_alleviation_transfer
            .is_trim_tank_forward_transfer_active()
        {
            let feed_tank_sources = self
                .load_alleviation_transfer
                .get_trim_tank_transfer_targets(&Self::FUEL_TANK_CAPACITIES, tank_quantities);
            for (tank, source) in feed_tank_sources {
                new_tank_sources[tank.into_usize()] = source;
            }
            true
        } else if self.cg_transfer.is_active() {
            for tank in self.cg_transfer.determine_target_tank(tank_quantities) {
                new_tank_sources[tank.into_usize()] = TransferSourceTank::Trim;
            }
            true
        } else {
            false
        };

        let feed_tank_sources = main_transfer::determine_feed_tank_source_main_transfer(
            tank_quantities,
            &self.tank_sources,
            remaining_flight_time,
        );

        // Update the transfer sources for the feed tanks
        // TODO: balance the wing tanks
        for (tank, source) in FEED_TANKS.into_iter().zip(feed_tank_sources) {
            if forward_gallery_transfer_active && matches!(source, TransferSourceTank::Trim)
                || aft_gallery_transfer_active && !matches!(source, TransferSourceTank::Trim)
            {
                // FIXME: tanks can actually have multiple sources
                new_tank_sources[tank.into_usize()] = source;
            }
        }

        self.tank_sources = new_tank_sources;
    }
}

/// Sums the quantities of the given tanks
fn sum_tanks(tank_quantities: &impl FuelQuantityProvider, tanks: &[A380FuelTankType]) -> Mass {
    tanks
        .iter()
        .map(|&t| tank_quantities.get_tank_quantity(t))
        .sum()
}

fn get_feed_tank_sources(tank_sources: &[TransferSourceTank]) -> [TransferSourceTank; 4] {
    FEED_TANKS.map(|t| tank_sources[t.into_usize()])
}

fn tanks_balanced(tank1: Mass, tank2: Mass) -> bool {
    (tank1 - tank2).abs().get::<kilogram>() < 10.
}

fn tanks_empty(tank_quantities: &impl FuelQuantityProvider, tanks: &[A380FuelTankType]) -> bool {
    tanks
        .into_iter()
        .all(|&tank| Self::tank_empty(tank_quantities.get_tank_quantity(tank)))
}

fn tank_empty(tank: Mass) -> bool {
    tank.get::<pound>() < 20.
}

fn tanks_full(
    tank_capacities: &[Mass; A380FuelTankType::LENGTH],
    tank_quantities: &impl FuelQuantityProvider,
    tanks: &[A380FuelTankType],
) -> bool {
    tanks
        .into_iter()
        .all(|&tank| Self::tank_full(tank_capacities, tank_quantities, tank))
}

fn tank_full(
    tank_capacities: &[Mass; A380FuelTankType::LENGTH],
    tank_quantities: &impl FuelQuantityProvider,
    tank: A380FuelTankType,
) -> bool {
    (tank_quantities.get_tank_quantity(tank) - tank_capacities[tank.into_usize()]).abs()
        <= Mass::new::<pound>(20.)
}

#[cfg(test)]
mod tests {
    use super::*;
    use uom::si::{f64::Mass, mass::pound};

    #[test]
    fn fuel_in_all_tanks() {
        let tank_quantity = Mass::new::<pound>(10_000.);
        let remaining_flight_time = Duration::from_secs(120 * 60);
        let mut app = FuelTransferApplication::new();

        let feed_tank_quantities = [
            (
                "Feed tanks above upper threshold",
                Mass::new::<pound>(45_323.),
                Mass::new::<pound>(48_140.),
                Mass::new::<pound>(48_140.),
                Mass::new::<pound>(45_323.),
                [TransferSourceTank::None; 4],
            ),
            (
                "Feed tanks below upper threshold but above lower threshold",
                Mass::new::<pound>(44_000.),
                Mass::new::<pound>(46_000.),
                Mass::new::<pound>(46_000.),
                Mass::new::<pound>(44_000.),
                [TransferSourceTank::None; 4],
            ),
            (
                "Feed 1 below lower threshold",
                Mass::new::<pound>(43_090.),
                Mass::new::<pound>(46_000.),
                Mass::new::<pound>(46_000.),
                Mass::new::<pound>(44_000.),
                [
                    TransferSourceTank::Inner,
                    TransferSourceTank::None,
                    TransferSourceTank::None,
                    TransferSourceTank::None,
                ],
            ),
            (
                "Feed 1 above lower threshold",
                Mass::new::<pound>(43_500.),
                Mass::new::<pound>(46_000.),
                Mass::new::<pound>(46_000.),
                Mass::new::<pound>(44_000.),
                [
                    TransferSourceTank::Inner,
                    TransferSourceTank::None,
                    TransferSourceTank::None,
                    TransferSourceTank::None,
                ],
            ),
            (
                "Feed 1 and 4 are balanced and below upper threshold",
                Mass::new::<pound>(43_700.),
                Mass::new::<pound>(46_000.),
                Mass::new::<pound>(46_000.),
                Mass::new::<pound>(43_700.),
                [
                    TransferSourceTank::Inner,
                    TransferSourceTank::None,
                    TransferSourceTank::None,
                    TransferSourceTank::Inner,
                ],
            ),
            (
                "Feed 1 is above, 4 below upper threshold, and feed 3 is below lower threshold",
                Mass::new::<pound>(45_310.),
                Mass::new::<pound>(46_000.),
                Mass::new::<pound>(45_940.),
                Mass::new::<pound>(45_210.),
                [
                    TransferSourceTank::None,
                    TransferSourceTank::None,
                    TransferSourceTank::Inner,
                    TransferSourceTank::Inner,
                ],
            ),
            (
                "Feed 1 and 4 are above upper threshold, and feed 2 and 3 are and above lower threshold",
                Mass::new::<pound>(45_310.),
                Mass::new::<pound>(46_000.),
                Mass::new::<pound>(46_000.),
                Mass::new::<pound>(45_310.),
                [
                    TransferSourceTank::None,
                    TransferSourceTank::Inner,
                    TransferSourceTank::Inner,
                    TransferSourceTank::None,
                ],
            ),
        ];

        for (
            description,
            feed_1_tank_quantity,
            feed_2_tank_quantity,
            feed_3_tank_quantity,
            feed_4_tank_quantity,
            expected,
        ) in feed_tank_quantities
        {
            let tank_quantities = TankQuantities {
                feed_tank_quantities: [
                    feed_1_tank_quantity,
                    feed_2_tank_quantity,
                    feed_3_tank_quantity,
                    feed_4_tank_quantity,
                ],
                inner_left_tank_quantity: tank_quantity,
                inner_right_tank_quantity: tank_quantity,
                mid_left_tank_quantity: tank_quantity,
                mid_right_tank_quantity: tank_quantity,
                outer_left_tank_quantity: tank_quantity,
                outer_right_tank_quantity: tank_quantity,
                trim_tank_quantity: tank_quantity,
            };
            app.update(&tank_quantities, remaining_flight_time);
            assert_eq!(
                app.get_tank_sources(),
                expected,
                "Scenario failed: {}",
                description
            );
        }
    }

    #[test]
    fn fuel_in_all_tanks_less_than_90_min() {
        let tank_quantity = Mass::new::<pound>(10_000.);
        let remaining_flight_time = Duration::from_secs(60 * 60);
        let mut app = FuelTransferApplication::new();

        let feed_tank_quantities = [
            (
                "Feed tanks above upper threshold",
                Mass::new::<pound>(40_000.),
                Mass::new::<pound>(43_000.),
                Mass::new::<pound>(43_000.),
                Mass::new::<pound>(40_000.),
                [TransferSourceTank::None; 4],
            ),
            (
                "Feed tanks below upper threshold but above lower threshold",
                Mass::new::<pound>(37_000.),
                Mass::new::<pound>(40_000.),
                Mass::new::<pound>(40_000.),
                Mass::new::<pound>(37_000.),
                [TransferSourceTank::None; 4],
            ),
            (
                "Feed 4 below lower threshold",
                Mass::new::<pound>(37_000.),
                Mass::new::<pound>(40_000.),
                Mass::new::<pound>(40_000.),
                Mass::new::<pound>(36_490.),
                [
                    TransferSourceTank::None,
                    TransferSourceTank::None,
                    TransferSourceTank::None,
                    TransferSourceTank::Inner,
                ],
            ),
            (
                "Feed 4 above lower threshold",
                Mass::new::<pound>(37_000.),
                Mass::new::<pound>(40_000.),
                Mass::new::<pound>(40_000.),
                Mass::new::<pound>(36_700.),
                [
                    TransferSourceTank::None,
                    TransferSourceTank::None,
                    TransferSourceTank::None,
                    TransferSourceTank::Inner,
                ],
            ),
            (
                "Feed 1 and 4 are balanced and below upper threshold",
                Mass::new::<pound>(37_000.),
                Mass::new::<pound>(40_000.),
                Mass::new::<pound>(40_000.),
                Mass::new::<pound>(37_000.),
                [
                    TransferSourceTank::Inner,
                    TransferSourceTank::None,
                    TransferSourceTank::None,
                    TransferSourceTank::Inner,
                ],
            ),
            (
                "Feed 4 is above, 1 below upper threshold, and feed 2 is below lower threshold",
                Mass::new::<pound>(38_690.),
                Mass::new::<pound>(39_350.),
                Mass::new::<pound>(40_000.),
                Mass::new::<pound>(38_710.),
                [
                    TransferSourceTank::Inner,
                    TransferSourceTank::Inner,
                    TransferSourceTank::None,
                    TransferSourceTank::None,
                ],
            ),
            (
                "Feed 1 and 4 are above upper threshold, and feed 2 and 3 are and above lower threshold",
                Mass::new::<pound>(38_710.),
                Mass::new::<pound>(41_000.),
                Mass::new::<pound>(41_000.),
                Mass::new::<pound>(38_710.),
                [
                    TransferSourceTank::None,
                    TransferSourceTank::Inner,
                    TransferSourceTank::Inner,
                    TransferSourceTank::None,
                ],
            ),
        ];

        for (
            description,
            feed_1_tank_quantity,
            feed_2_tank_quantity,
            feed_3_tank_quantity,
            feed_4_tank_quantity,
            expected,
        ) in feed_tank_quantities
        {
            let tank_quantities = TankQuantities {
                feed_tank_quantities: [
                    feed_1_tank_quantity,
                    feed_2_tank_quantity,
                    feed_3_tank_quantity,
                    feed_4_tank_quantity,
                ],
                inner_left_tank_quantity: tank_quantity,
                inner_right_tank_quantity: tank_quantity,
                mid_left_tank_quantity: tank_quantity,
                mid_right_tank_quantity: tank_quantity,
                outer_left_tank_quantity: tank_quantity,
                outer_right_tank_quantity: tank_quantity,
                trim_tank_quantity: tank_quantity,
            };
            app.update(&tank_quantities, remaining_flight_time);
            assert_eq!(
                app.get_tank_sources(),
                expected,
                "Scenario failed: {}",
                description
            );
        }
    }

    #[test]
    fn fuel_in_all_tanks_less_than_17_650_lbs() {
        let tank_quantity = Mass::new::<pound>(7_000.);
        let remaining_flight_time = Duration::from_secs(120 * 60);
        let mut app = FuelTransferApplication::new();

        let feed_tank_quantities = [
            (
                "Feed tanks above upper threshold",
                Mass::new::<pound>(46_000.),
                Mass::new::<pound>(46_000.),
                Mass::new::<pound>(46_000.),
                Mass::new::<pound>(46_000.),
                [TransferSourceTank::None; 4],
            ),
            (
                "Feed tanks below upper threshold but above lower threshold",
                Mass::new::<pound>(44_000.),
                Mass::new::<pound>(44_000.),
                Mass::new::<pound>(44_000.),
                Mass::new::<pound>(44_000.),
                [TransferSourceTank::None; 4],
            ),
            (
                "Feed 2 below lower threshold",
                Mass::new::<pound>(44_000.),
                Mass::new::<pound>(43_090.),
                Mass::new::<pound>(44_000.),
                Mass::new::<pound>(44_000.),
                [
                    TransferSourceTank::None,
                    TransferSourceTank::Inner,
                    TransferSourceTank::None,
                    TransferSourceTank::None,
                ],
            ),
            (
                "Feed 2 above lower threshold",
                Mass::new::<pound>(44_000.),
                Mass::new::<pound>(43_500.),
                Mass::new::<pound>(44_000.),
                Mass::new::<pound>(44_000.),
                [
                    TransferSourceTank::None,
                    TransferSourceTank::Inner,
                    TransferSourceTank::None,
                    TransferSourceTank::None,
                ],
            ),
            (
                "Feed 2 and 3 are balanced and below upper threshold",
                Mass::new::<pound>(44_000.),
                Mass::new::<pound>(43_600.),
                Mass::new::<pound>(43_600.),
                Mass::new::<pound>(44_000.),
                [
                    TransferSourceTank::None,
                    TransferSourceTank::Inner,
                    TransferSourceTank::Inner,
                    TransferSourceTank::None,
                ],
            ),
            (
                "Feed 1, 2, and 3 are balanced and below upper threshold",
                Mass::new::<pound>(43_800.),
                Mass::new::<pound>(43_800.),
                Mass::new::<pound>(43_800.),
                Mass::new::<pound>(44_000.),
                [
                    TransferSourceTank::Inner,
                    TransferSourceTank::Inner,
                    TransferSourceTank::Inner,
                    TransferSourceTank::None,
                ],
            ),
            (
                "Feed tanks are balanced and below upper threshold",
                Mass::new::<pound>(44_000.),
                Mass::new::<pound>(44_000.),
                Mass::new::<pound>(44_000.),
                Mass::new::<pound>(44_000.),
                [
                    TransferSourceTank::Inner,
                    TransferSourceTank::Inner,
                    TransferSourceTank::Inner,
                    TransferSourceTank::Inner,
                ],
            ),
            (
                "Feed 1 above upper threshold other feed tanks below upper threshold",
                Mass::new::<pound>(45_310.),
                Mass::new::<pound>(44_000.),
                Mass::new::<pound>(44_000.),
                Mass::new::<pound>(44_000.),
                [
                    TransferSourceTank::None,
                    TransferSourceTank::Inner,
                    TransferSourceTank::Inner,
                    TransferSourceTank::Inner,
                ],
            ),
            (
                "Feed tanks above upper threshold",
                Mass::new::<pound>(45_310.),
                Mass::new::<pound>(45_310.),
                Mass::new::<pound>(45_310.),
                Mass::new::<pound>(45_310.),
                [
                    TransferSourceTank::None,
                    TransferSourceTank::None,
                    TransferSourceTank::None,
                    TransferSourceTank::None,
                ],
            ),
        ];

        for (
            description,
            feed_1_tank_quantity,
            feed_2_tank_quantity,
            feed_3_tank_quantity,
            feed_4_tank_quantity,
            expected,
        ) in feed_tank_quantities
        {
            let tank_quantities = TankQuantities {
                feed_tank_quantities: [
                    feed_1_tank_quantity,
                    feed_2_tank_quantity,
                    feed_3_tank_quantity,
                    feed_4_tank_quantity,
                ],
                inner_left_tank_quantity: tank_quantity,
                inner_right_tank_quantity: tank_quantity,
                mid_left_tank_quantity: tank_quantity,
                mid_right_tank_quantity: tank_quantity,
                outer_left_tank_quantity: tank_quantity,
                outer_right_tank_quantity: tank_quantity,
                trim_tank_quantity: tank_quantity,
            };
            app.update(&tank_quantities, remaining_flight_time);
            assert_eq!(
                app.get_tank_sources(),
                expected,
                "Scenario failed: {}",
                description
            );
        }
    }
}
