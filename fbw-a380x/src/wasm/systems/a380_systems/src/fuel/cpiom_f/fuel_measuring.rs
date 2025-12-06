use crate::fuel::{cpiom_f::FEED_TANKS, A380FuelTankType, ArincFuelQuantityProvider};
use enum_map::{enum_map, Enum};
use nalgebra::Vector3;
use std::sync::LazyLock;
use uom::{
    si::{
        f64::{Mass, Ratio},
        mass::kilogram,
        ratio::percent,
    },
    ConstZero,
};

static FUEL_TANK_POSITIONS: LazyLock<[Vector3<f64>; A380FuelTankType::LENGTH]> =
    LazyLock::new(|| {
        // The fuel tank positions in percent
        enum_map! {
            A380FuelTankType::LeftOuter => Vector3::new(-25., -100.0, 8.5),
            A380FuelTankType::FeedOne => Vector3::new(-7.45, -71.0, 7.3),
            A380FuelTankType::LeftMid => Vector3::new(7.1, -46.4, 5.9),
            A380FuelTankType::LeftInner => Vector3::new(16.5, -24.7, 3.2),
            A380FuelTankType::FeedTwo => Vector3::new(27.3, -18.4, 1.0),
            A380FuelTankType::FeedThree => Vector3::new(27.3, 18.4, 1.0),
            A380FuelTankType::RightInner => Vector3::new(16.5, 24.7, 3.2),
            A380FuelTankType::RightMid => Vector3::new(7.1, 46.4, 5.9),
            A380FuelTankType::FeedFour => Vector3::new(-7.45, 71., 7.3),
            A380FuelTankType::RightOuter => Vector3::new(-25., 100., 8.5),
            A380FuelTankType::Trim => Vector3::new(-87.14, 0., 12.1),
        }
        .into_array()
    });

pub(super) struct FuelMeasuringApplication {
    tank_quantities: [Option<Mass>; A380FuelTankType::LENGTH],
    total_fuel_onboard: Option<Mass>,
    total_aircraft_weight: Option<Mass>,
    center_of_gravity: Option<Ratio>,
}
impl FuelMeasuringApplication {
    pub(super) fn new() -> Self {
        Self {
            tank_quantities: [None; A380FuelTankType::LENGTH],
            total_fuel_onboard: None,
            total_aircraft_weight: None,
            center_of_gravity: None,
        }
    }

    pub(super) fn reset(&mut self) {
        *self = Self::new();
    }

    pub(super) fn update(
        &mut self,
        fqdc: &impl ArincFuelQuantityProvider,
        zero_fuel_weight: Option<Mass>,
        zero_fuel_weight_cg: Option<Ratio>,
    ) {
        // Feed tanks & Trim tank
        // In case of FQI failure we consider the trim tank to be empty
        for tank in FEED_TANKS.iter().chain(&[A380FuelTankType::Trim]).copied() {
            self.tank_quantities[tank.into_usize()] = fqdc.get_tank_quantity(tank).normal_value();
        }

        // Wing tanks
        self.update_wing_tank_quantities(
            fqdc,
            (A380FuelTankType::LeftOuter, A380FuelTankType::RightOuter),
        );
        self.update_wing_tank_quantities(
            fqdc,
            (A380FuelTankType::LeftMid, A380FuelTankType::RightMid),
        );
        self.update_wing_tank_quantities(
            fqdc,
            (A380FuelTankType::LeftInner, A380FuelTankType::RightInner),
        );

        self.update_total_fuel_onboard();
        self.update_total_aircraft_weight(zero_fuel_weight);
        self.update_center_of_gravity(zero_fuel_weight, zero_fuel_weight_cg);
    }

    pub(super) fn tank_quantity(&self, tank: A380FuelTankType) -> Option<Mass> {
        self.tank_quantities[tank.into_usize()]
    }

    pub(super) fn total_fuel_onboard(&self) -> Option<Mass> {
        self.total_fuel_onboard
    }

    pub(super) fn total_aircraft_weight(&self) -> Option<Mass> {
        self.total_aircraft_weight
    }

    pub(super) fn center_of_gravity(&self) -> Option<Ratio> {
        self.center_of_gravity
    }

    fn update_total_fuel_onboard(&mut self) {
        // TODO: it takes some time for the calculation of the values
        self.total_fuel_onboard = self
            .tank_quantities
            .iter()
            .filter_map(|q| *q)
            .reduce(|a, b| a + b);
    }

    fn update_total_aircraft_weight(&mut self, zero_fuel_weight: Option<Mass>) {
        // TODO: it normally takes around 5 seconds to calculate
        self.total_aircraft_weight = zero_fuel_weight
            .zip(self.total_fuel_onboard)
            .map(|(zfw, fob)| zfw + fob);
    }

    fn update_center_of_gravity(
        &mut self,
        zero_fuel_weight: Option<Mass>,
        zero_fuel_weight_cg: Option<Ratio>,
    ) {
        // TODO: it normally takes around 5 seconds to calculate
        self.center_of_gravity = if let (
            Some(total_aircraft_weight),
            Some(zero_fuel_weight),
            Some(zero_fuel_weight_cg),
        ) = (
            self.total_aircraft_weight,
            zero_fuel_weight,
            zero_fuel_weight_cg,
        ) {
            // Calculate the center of gravity based on the fuel tank quantities
            // and the zero fuel weight center of gravity
            self.tank_quantities
                .iter()
                .zip(FUEL_TANK_POSITIONS.iter())
                .map(|(q, pos)| q.map(|m| Ratio::new::<percent>(pos.x * m.get::<kilogram>())))
                .try_fold(Ratio::ZERO, |acc, x| x.map(|x| acc + x))
                .map(|fuel_cg| {
                    (fuel_cg + zero_fuel_weight_cg * zero_fuel_weight.get::<kilogram>())
                        / total_aircraft_weight.get::<kilogram>()
                })
        } else {
            None
        };
    }

    /// Determines the fuel quantity of the wing tanks even in case of a FQI failure.
    /// In case of FQI failure we consider the tank to have the same fuel quantity
    /// as the opposite tank
    fn update_wing_tank_quantities(
        &mut self,
        fqdc: &impl ArincFuelQuantityProvider,
        (left_tank, right_tank): (A380FuelTankType, A380FuelTankType),
    ) {
        let left_quantity = fqdc.get_tank_quantity(left_tank).normal_value();
        let right_quantity = fqdc.get_tank_quantity(right_tank).normal_value();

        let (l_resolved, r_resolved) = Self::mirror_pair(left_quantity, right_quantity);

        self.tank_quantities[left_tank.into_usize()] = l_resolved;
        self.tank_quantities[right_tank.into_usize()] = r_resolved;
    }

    /// Given two optional values, mirror the opposite
    /// when one side is missing. If both are missing, both stay `None`.
    fn mirror_pair<T: Clone>(left: Option<T>, right: Option<T>) -> (Option<T>, Option<T>) {
        let l = left.clone().or(right.clone());
        let r = right.or(left);
        (l, r)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    mod mirror_pair_tests {
        use super::FuelMeasuringApplication;

        #[test]
        fn both_present() {
            let (l, r) = FuelMeasuringApplication::mirror_pair(Some(10u32), Some(20));
            assert_eq!(l, Some(10));
            assert_eq!(r, Some(20));
        }

        #[test]
        fn left_missing_mirrors_right() {
            let (l, r) = FuelMeasuringApplication::mirror_pair(None, Some(20));
            assert_eq!(l, Some(20));
            assert_eq!(r, Some(20));
        }

        #[test]
        fn right_missing_mirrors_left() {
            let (l, r) = FuelMeasuringApplication::mirror_pair(Some(10u32), None);
            assert_eq!(l, Some(10));
            assert_eq!(r, Some(10));
        }

        #[test]
        fn both_missing_stay_none() {
            let (l, r) = FuelMeasuringApplication::mirror_pair::<u32>(None, None);
            assert_eq!(l, None);
            assert_eq!(r, None);
        }
    }
}
