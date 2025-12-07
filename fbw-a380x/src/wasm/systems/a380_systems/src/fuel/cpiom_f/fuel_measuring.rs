use crate::fuel::{cpiom_f::FEED_TANKS, A380FuelTankType, ArincFuelQuantityProvider};
use enum_map::{enum_map, Enum};
use nalgebra::Vector3;
use std::sync::LazyLock;
use systems::payload::LoadsheetInfo;
use uom::si::{
    f64::{Mass, Ratio},
    mass::kilogram,
    ratio::{percent, ratio},
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

#[derive(Clone, Copy, Debug, Default, PartialEq)]
enum AlternateOption<T> {
    #[default]
    None,
    Alternate(T),
    Some(T),
}
impl<T> AlternateOption<T> {
    fn value(self) -> Option<T> {
        match self {
            Self::Some(v) | Self::Alternate(v) => Some(v),
            Self::None => None,
        }
    }

    fn non_alternate_value(self) -> Option<T> {
        match self {
            Self::Some(v) => Some(v),
            Self::Alternate(_) | Self::None => None,
        }
    }
}
impl<T: Copy> AlternateOption<T> {
    fn or(self, other: Self) -> Self {
        match (self, other) {
            (Self::Some(_), _) => self,
            (Self::None, Self::Some(v)) => Self::Alternate(v),
            _ => Self::None,
        }
    }
}
impl<T> From<Option<T>> for AlternateOption<T> {
    fn from(value: Option<T>) -> Self {
        match value {
            Some(v) => Self::Some(v),
            None => Self::None,
        }
    }
}

#[derive(Default)]
pub(super) struct FuelMeasuringApplication {
    tank_quantities: [AlternateOption<Mass>; A380FuelTankType::LENGTH],
    total_fuel_onboard: Option<Mass>,
    total_aircraft_weight: Option<Mass>,
    center_of_gravity: Option<Ratio>,
}
impl FuelMeasuringApplication {
    pub(super) fn new() -> Self {
        Self::default()
    }

    pub(super) fn reset(&mut self) {
        *self = Self::new();
    }

    pub(super) fn update(
        &mut self,
        loadsheet: &LoadsheetInfo,
        fqdc: &impl ArincFuelQuantityProvider,
        zero_fuel_weight: Option<Mass>,
        zero_fuel_weight_cg: Option<Ratio>,
    ) {
        // Feed tanks & Trim tank
        // In case of FQI failure we consider the trim tank to be empty
        for tank in FEED_TANKS.iter().chain(&[A380FuelTankType::Trim]).copied() {
            self.tank_quantities[tank.into_usize()] =
                fqdc.get_tank_quantity(tank).normal_value().into();
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
        self.update_center_of_gravity(loadsheet, zero_fuel_weight, zero_fuel_weight_cg);
    }

    pub(super) fn tank_quantity(&self, tank: A380FuelTankType) -> Option<Mass> {
        self.tank_quantities[tank.into_usize()].non_alternate_value()
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
            .filter_map(|q| q.value())
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
        loadsheet: &LoadsheetInfo,
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
            let zero_fuel_weight_moment = Self::cg_mac_to_arm(loadsheet, zero_fuel_weight_cg)
                * zero_fuel_weight.get::<kilogram>();

            let fuel_moment = self
                .tank_quantities
                .iter()
                .zip(FUEL_TANK_POSITIONS.iter())
                .map(|(q, pos)| q.value().map(|m| pos.x * m.get::<kilogram>()))
                .try_fold(0., |acc, x| x.map(|x| acc + x));

            fuel_moment.map(|fuel_moment| {
                let total_moment = fuel_moment + zero_fuel_weight_moment;
                let gross_arm = total_moment / total_aircraft_weight.get::<kilogram>();
                Self::arm_to_cg_mac(loadsheet, gross_arm)
            })
        } else {
            None
        };
    }

    fn cg_mac_to_arm(loadsheet: &LoadsheetInfo, cg_mac: Ratio) -> f64 {
        -(cg_mac.get::<ratio>() * loadsheet.mean_aerodynamic_chord_size
            - loadsheet.leading_edge_mean_aerodynamic_chord)
    }

    fn arm_to_cg_mac(loadsheet: &LoadsheetInfo, arm: f64) -> Ratio {
        Ratio::new::<ratio>(
            -(arm - loadsheet.leading_edge_mean_aerodynamic_chord)
                / loadsheet.mean_aerodynamic_chord_size,
        )
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
    fn mirror_pair<T: Copy>(
        left: Option<T>,
        right: Option<T>,
    ) -> (AlternateOption<T>, AlternateOption<T>) {
        let left: AlternateOption<T> = left.into();
        let right: AlternateOption<T> = right.into();
        let l = left.or(right);
        let r = right.or(left);
        (l, r)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    mod alternate_option_tests {
        use super::*;
        use rstest::rstest;

        #[rstest]
        #[case(AlternateOption::Some(42), Some(42))]
        #[case(AlternateOption::Alternate(42), Some(42))]
        #[case(AlternateOption::None, None)]
        fn value(#[case] v: AlternateOption<i32>, #[case] expected_value: Option<i32>) {
            assert_eq!(v.value(), expected_value);
        }

        #[rstest]
        #[case(AlternateOption::Some(42), Some(42))]
        #[case(AlternateOption::Alternate(42), None)]
        #[case(AlternateOption::None, None)]
        fn non_alternate_value(
            #[case] v: AlternateOption<i32>,
            #[case] expected_value: Option<i32>,
        ) {
            assert_eq!(v.non_alternate_value(), expected_value);
        }

        #[rstest]
        #[case(
            AlternateOption::Some(1),
            AlternateOption::Some(2),
            AlternateOption::Some(1)
        )]
        #[case(
            AlternateOption::Some(1),
            AlternateOption::Alternate(2),
            AlternateOption::Some(1)
        )]
        #[case(
            AlternateOption::Alternate(1),
            AlternateOption::Some(2),
            AlternateOption::None
        )]
        #[case(
            AlternateOption::None,
            AlternateOption::Some(2),
            AlternateOption::Alternate(2)
        )]
        #[case(
            AlternateOption::Some(1),
            AlternateOption::None,
            AlternateOption::Some(1)
        )]
        #[case(AlternateOption::None, AlternateOption::None, AlternateOption::None)]
        fn or(
            #[case] l: AlternateOption<i32>,
            #[case] r: AlternateOption<i32>,
            #[case] expected_value: AlternateOption<i32>,
        ) {
            assert_eq!(l.or(r), expected_value);
        }
    }
    mod mirror_pair_tests {
        use super::*;

        #[test]
        fn both_present() {
            let (l, r) = FuelMeasuringApplication::mirror_pair(Some(10u32), Some(20));
            assert_eq!(l, AlternateOption::Some(10));
            assert_eq!(r, AlternateOption::Some(20));
        }

        #[test]
        fn left_missing_mirrors_right() {
            let (l, r) = FuelMeasuringApplication::mirror_pair(None, Some(20));
            assert_eq!(l, AlternateOption::Alternate(20));
            assert_eq!(r, AlternateOption::Some(20));
        }

        #[test]
        fn right_missing_mirrors_left() {
            let (l, r) = FuelMeasuringApplication::mirror_pair(Some(10u32), None);
            assert_eq!(l, AlternateOption::Some(10));
            assert_eq!(r, AlternateOption::Alternate(10));
        }

        #[test]
        fn both_missing_stay_none() {
            let (l, r) = FuelMeasuringApplication::mirror_pair::<u32>(None, None);
            assert_eq!(l, AlternateOption::None);
            assert_eq!(r, AlternateOption::None);
        }
    }
}
