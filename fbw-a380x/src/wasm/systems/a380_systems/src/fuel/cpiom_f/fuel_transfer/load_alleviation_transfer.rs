use crate::fuel::{
    cpiom_f::{
        fuel_transfer::{tank_empty, tank_full, tanks_empty, tanks_full},
        FuelQuantityProvider, TransferSourceTank, FEED_TANKS, INNER_TANKS, MID_TANKS, OUTER_TANKS,
    },
    A380FuelTankType,
};
use enum_map::Enum;
use std::{ops::Not, time::Duration};
use uom::si::{
    f64::{Length, Mass},
    length::foot,
    mass::pound,
};

#[derive(Default)]
pub(super) struct LoadAlleviationTransfer {
    transfer_to_outer_tank_active: [bool; 2],
    transfer_from_outer_tank_active: [bool; 2],
    trim_tank_forward_transfer_active: bool,
    max_altitude_reached: Length,
}
impl LoadAlleviationTransfer {
    const TIME_TO_DESTINATION_TRIM_TANK_FWD_TRANSFER_STOP: Duration = Duration::from_secs(60 * 80);
    const TIME_TO_DESTINATION_TRIM_TANK_FWD_TRANSFER_START: Duration = Duration::from_secs(60 * 78);
    const TIME_TO_DESTINATION_TRANSFER_FROM_OUTER_STOP: Duration = Duration::from_secs(60 * 30);
    const TIME_TO_DESTINATION_TRANSFER_FROM_OUTER_START: Duration = Duration::from_secs(60 * 28);

    pub(super) fn update(
        &mut self,
        tank_capacities: &[Mass; A380FuelTankType::LENGTH],
        tank_quantities: &impl FuelQuantityProvider,
        total_fuel_on_board: Mass,
        remaining_flight_time: Option<Duration>,
        in_flight: bool,
        trim_tank_feed_isolated: bool,
        altitude: Option<Length>,
    ) {
        // TODO: verify logic
        self.max_altitude_reached = if in_flight {
            self.max_altitude_reached.max(altitude.unwrap_or_default())
        } else {
            Length::default()
        };

        self.update_transfer_to_outer_tanks(
            tank_capacities,
            tank_quantities,
            total_fuel_on_board,
            in_flight,
        );

        // Load alleviation transfers from outer tanks
        self.update_transfer_from_outer_tanks(tank_quantities, remaining_flight_time, altitude);

        self.update_transfer_from_trim_tank(
            tank_quantities,
            remaining_flight_time,
            altitude,
            trim_tank_feed_isolated,
        );
    }

    pub(super) fn is_transfer_to_outer_tank_active(&self) -> bool {
        self.transfer_to_outer_tank_active
            .iter()
            .any(|&active| active)
    }

    pub(super) fn is_transfer_from_outer_tank_active(&self) -> bool {
        self.transfer_from_outer_tank_active
            .iter()
            .any(|&active| active)
    }

    pub(super) fn is_trim_tank_forward_transfer_active(&self) -> bool {
        self.trim_tank_forward_transfer_active
    }

    /// Determines the tanks to which load alleviation transfer should be performed.
    pub(super) fn determine_load_alleviation_transfer_to_outer_tanks(
        &self,
        tank_quantities: &impl FuelQuantityProvider,
    ) -> impl Iterator<Item = (A380FuelTankType, TransferSourceTank)> {
        let tank_source = if !tanks_empty(tank_quantities, &INNER_TANKS) {
            TransferSourceTank::Inner
        } else if !tanks_empty(tank_quantities, &MID_TANKS) {
            TransferSourceTank::Mid
        } else {
            TransferSourceTank::None
        };

        OUTER_TANKS
            .into_iter()
            .zip(self.transfer_to_outer_tank_active)
            .filter_map(move |(tank, active)| {
                if tank_source.is_some() && active {
                    Some((tank, tank_source))
                } else {
                    None
                }
            })
    }

    pub(super) fn determine_load_alleviation_transfer_from_outer_tanks(
        &self,
    ) -> impl Iterator<Item = A380FuelTankType> {
        OUTER_TANKS
            .into_iter()
            .zip(self.transfer_from_outer_tank_active)
            .filter_map(|(tank, active)| if active { Some(tank) } else { None })
    }

    /// Determines the tanks to which load alleviation transfer should be performed.
    pub(super) fn get_trim_tank_transfer_targets<'a>(
        &self,
        tank_capacities: &'a [Mass; A380FuelTankType::LENGTH],
        tank_quantities: &'a impl FuelQuantityProvider,
    ) -> impl Iterator<Item = (A380FuelTankType, TransferSourceTank)> + 'a {
        let target_tanks = if self.trim_tank_forward_transfer_active {
            // Fuel transfers from the trim tank, via the aft gallery, to the:
            // ‐ Feed tanks, or
            // ‐ Mid tanks, if the feed tanks are full, or
            // ‐ Inner tanks, if the feed tanks and mid tanks are full.

            // Determine where to transfer fuel from the trim tank
            let feed_tanks_full = tanks_full(tank_capacities, tank_quantities, &FEED_TANKS);
            let mid_tanks_full = tanks_full(
                tank_capacities,
                tank_quantities,
                &[A380FuelTankType::LeftMid, A380FuelTankType::RightMid],
            );
            let inner_tanks_full = !tanks_full(
                tank_capacities,
                tank_quantities,
                &[A380FuelTankType::LeftInner, A380FuelTankType::RightInner],
            );

            if !feed_tanks_full {
                // Transfer to feed tanks which are not full
                &FEED_TANKS
            } else if !mid_tanks_full {
                // Transfer to mid tanks
                &[A380FuelTankType::LeftMid, A380FuelTankType::RightMid]
            } else if !inner_tanks_full {
                // Transfer to inner tanks
                &[A380FuelTankType::LeftInner, A380FuelTankType::RightInner][..]
            } else {
                // No transfer
                &[]
            }
        } else {
            &[]
        };

        // TODO: balance tanks
        target_tanks.into_iter().filter_map(|&tank| {
            tank_full(tank_capacities, tank_quantities, tank)
                .not()
                .then_some((tank, TransferSourceTank::Trim))
        })
    }

    fn update_transfer_to_outer_tanks(
        &mut self,
        tank_capacities: &[Mass; A380FuelTankType::LENGTH],
        tank_quantities: &impl FuelQuantityProvider,
        total_fuel_on_board: Mass,
        in_flight: bool,
    ) {
        let transfer_enabled = total_fuel_on_board.get::<pound>() > 110_200. && in_flight;
        self.transfer_to_outer_tank_active = OUTER_TANKS
            .map(|tank| transfer_enabled && !tank_full(tank_capacities, tank_quantities, tank));
    }

    fn update_transfer_from_outer_tanks(
        &mut self,
        tank_quantities: &impl FuelQuantityProvider,
        remaining_flight_time: Option<Duration>,
        altitude: Option<Length>,
    ) {
        self.transfer_from_outer_tank_active = [
            (
                A380FuelTankType::LeftOuter,
                self.transfer_from_outer_tank_active[0],
            ),
            (
                A380FuelTankType::RightOuter,
                self.transfer_from_outer_tank_active[1],
            ),
        ]
        .map(|(tank, active)| {
            let q = tank_quantities.get_tank_quantity(tank);
            q.get::<pound>() > 8_800.
                && if active {
                    remaining_flight_time
                        .is_some_and(|d| d <= Self::TIME_TO_DESTINATION_TRANSFER_FROM_OUTER_STOP)
                } else {
                    remaining_flight_time
                        .is_some_and(|d| d < Self::TIME_TO_DESTINATION_TRANSFER_FROM_OUTER_START)
                        || self.max_altitude_reached > Length::new::<foot>(25500.)
                            && altitude.is_some_and(|a| a < Length::new::<foot>(24500.))
                    // TODO: verify what happens when altitude is missing
                }
        });
    }

    fn update_transfer_from_trim_tank(
        &mut self,
        tank_quantities: &impl FuelQuantityProvider,
        remaining_flight_time: Option<Duration>,
        altitude: Option<Length>,
        trim_tank_feed_isolated: bool,
    ) {
        let trim_tank_empty = tank_empty(tank_quantities.get_tank_quantity(A380FuelTankType::Trim));
        self.trim_tank_forward_transfer_active = if self.trim_tank_forward_transfer_active {
            !trim_tank_empty
                && remaining_flight_time
                    .is_none_or(|d| d <= Self::TIME_TO_DESTINATION_TRIM_TANK_FWD_TRANSFER_STOP)
                && !trim_tank_feed_isolated
        } else {
            !trim_tank_empty
                && !trim_tank_feed_isolated
                && (remaining_flight_time.is_some_and(|d| d < Self::TIME_TO_DESTINATION_TRIM_TANK_FWD_TRANSFER_START) // The FCOM is not really clear in this regard
                    || self.max_altitude_reached > Length::new::<foot>(25500.)
                        && altitude.is_some_and(|a| a < Length::new::<foot>(24500.)))
            // TODO: verify what happens when altitude is missing
        };
    }
}
