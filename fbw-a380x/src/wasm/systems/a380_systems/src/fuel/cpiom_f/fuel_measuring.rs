use crate::fuel::{
    cpiom_f::{FuelQuantityProvider, FEED_TANKS, TRIM_TANK, WING_TANKS},
    A380FuelTankType, ArincFuelQuantityProvider,
};
use enum_map::{enum_map, Enum};
use nalgebra::Vector3;
use std::sync::LazyLock;
use systems::{fuel::FUEL_GALLONS_TO_KG, payload::LoadsheetInfo};
use uom::si::{
    f64::{Mass, Ratio},
    mass::kilogram,
    ratio::ratio,
};

/// Approximate *relative* locations of each A380 fuel tank within the aircraft reference frame.
///
/// Values are expressed as percentages of the airframe dimensions (normalized coordinates),
/// not meters. The Vector3 components map to the aircraft axes:
///
///   x: longitudinal position (aft/forward) (negative/positive)
///   y: lateral position (left/right) (negative/positive)
///   z: vertical position (down/up) (negative/positive)
///
/// These positions are used as representative tank centroids for CG calculation and
/// distribution logic (i.e., they are not exact geometric tank shapes).
static FUEL_TANK_POSITIONS: LazyLock<[Vector3<f64>; A380FuelTankType::LENGTH]> =
    LazyLock::new(|| {
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
    /// Given two optional values, mirror the opposite
    /// when one side is missing. If both are missing, both stay `None`.
    fn mirror_pair(left: Option<T>, right: Option<T>) -> (Self, Self) {
        let left: Self = left.into();
        let right: Self = right.into();
        let l = left.or(right);
        let r = right.or(left);
        (l, r)
    }

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

    pub(super) fn unavailable_tank_quantity_count(&self) -> usize {
        WING_TANKS
            .iter()
            .chain(&[TRIM_TANK])
            .map(|tank| self.tank_quantities[tank.into_usize()])
            .filter(|q| q.non_alternate_value().is_none())
            .count()
    }

    pub(super) fn all_feed_tanks_valid(&self) -> bool {
        FEED_TANKS
            .iter()
            .all(|tank| self.tank_quantities[tank.into_usize()].value().is_some())
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

    /// Converts a center of gravity expressed as a ratio of the mean aerodynamic chord (MAC)
    /// into an arm, i.e. the longitudinal distance from the reference origin in the
    /// airframe coordinate system (same units as the loadsheet MAC dimensions).
    ///
    /// A CG of 0 lies at the leading edge of the MAC and 1 at its trailing edge.
    /// This is the inverse of [`Self::arm_to_cg_mac`].
    fn cg_mac_to_arm(loadsheet: &LoadsheetInfo, cg_mac: Ratio) -> f64 {
        -(cg_mac.get::<ratio>() * loadsheet.mean_aerodynamic_chord_size
            - loadsheet.leading_edge_mean_aerodynamic_chord)
    }

    /// Converts an arm, i.e. a longitudinal distance from the reference origin in the
    /// airframe coordinate system (same units as the loadsheet MAC dimensions),
    /// into a center of gravity expressed as a ratio of the mean aerodynamic chord (MAC).
    ///
    /// A CG of 0 lies at the leading edge of the MAC and 1 at its trailing edge.
    /// This is the inverse of [`Self::cg_mac_to_arm`].
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

        let (l_resolved, r_resolved) = AlternateOption::mirror_pair(left_quantity, right_quantity);

        self.tank_quantities[left_tank.into_usize()] = l_resolved;
        self.tank_quantities[right_tank.into_usize()] = r_resolved;
    }
}
impl FuelQuantityProvider for FuelMeasuringApplication {
    fn get_tank_quantity(&self, tank: A380FuelTankType) -> Mass {
        self.tank_quantities[tank.into_usize()]
            .value()
            .unwrap_or_default()
    }

    fn get_tank_capacity(&self, tank: A380FuelTankType) -> Mass {
        // TODO: deduplicate this information
        static FUEL_TANK_CAPACITIES: LazyLock<[Mass; A380FuelTankType::LENGTH]> =
            LazyLock::new(|| {
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
                    .map(|g| Mass::new::<kilogram>(g * FUEL_GALLONS_TO_KG))
            });
        FUEL_TANK_CAPACITIES[tank.into_usize()]
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
            let (l, r) = AlternateOption::mirror_pair(Some(10u32), Some(20));
            assert_eq!(l, AlternateOption::Some(10));
            assert_eq!(r, AlternateOption::Some(20));
        }

        #[test]
        fn left_missing_mirrors_right() {
            let (l, r) = AlternateOption::mirror_pair(None, Some(20));
            assert_eq!(l, AlternateOption::Alternate(20));
            assert_eq!(r, AlternateOption::Some(20));
        }

        #[test]
        fn right_missing_mirrors_left() {
            let (l, r) = AlternateOption::mirror_pair(Some(10u32), None);
            assert_eq!(l, AlternateOption::Some(10));
            assert_eq!(r, AlternateOption::Alternate(10));
        }

        #[test]
        fn both_missing_stay_none() {
            let (l, r) = AlternateOption::<u32>::mirror_pair(None, None);
            assert_eq!(l, AlternateOption::None);
            assert_eq!(r, AlternateOption::None);
        }
    }

    mod fuel_measuring_application_tests {
        use super::*;
        use crate::airframe::A380Airframe;
        use enum_map::EnumMap;
        use more_asserts::{assert_gt, assert_lt};
        use ntest::assert_about_eq;
        use systems::shared::arinc429::{Arinc429Word, SignStatus};
        use uom::{si::ratio::percent, ConstZero};

        struct MockFqdc {
            quantities: EnumMap<A380FuelTankType, Arinc429Word<Mass>>,
        }
        impl MockFqdc {
            fn all_normal(quantity: Mass) -> Self {
                let quantities = enum_map! {
                    _ => Arinc429Word::new(quantity, SignStatus::NormalOperation),
                };
                Self { quantities }
            }

            fn set(&mut self, tank: A380FuelTankType, quantity: Mass) {
                self.quantities[tank] = Arinc429Word::new(quantity, SignStatus::NormalOperation);
            }

            fn set_failure_warning(&mut self, tank: A380FuelTankType) {
                self.quantities[tank] = Arinc429Word::new(Mass::ZERO, SignStatus::FailureWarning);
            }
        }
        impl ArincFuelQuantityProvider for MockFqdc {
            fn get_tank_quantity(&self, tank: A380FuelTankType) -> Arinc429Word<Mass> {
                self.quantities[tank]
            }
        }

        fn update_measuring_application(
            fqdc: &MockFqdc,
            zero_fuel_weight: Option<Mass>,
            zero_fuel_weight_cg: Option<Ratio>,
        ) -> FuelMeasuringApplication {
            let mut application = FuelMeasuringApplication::new();
            application.update(
                A380Airframe::get_loadsheet(),
                fqdc,
                zero_fuel_weight,
                zero_fuel_weight_cg,
            );
            application
        }

        #[test]
        fn total_fuel_onboard_sums_all_valid_tanks() {
            let fqdc = MockFqdc::all_normal(Mass::new::<kilogram>(100.));
            let application = update_measuring_application(&fqdc, None, None);

            assert_eq!(
                application.total_fuel_onboard(),
                Some(Mass::new::<kilogram>(1_100.)),
            );
            assert_eq!(application.unavailable_tank_quantity_count(), 0);
            assert!(application.all_feed_tanks_valid());
        }

        #[test]
        fn total_fuel_onboard_is_none_when_no_tank_is_available() {
            let mut fqdc = MockFqdc::all_normal(Mass::new::<kilogram>(100.));
            for tank in A380FuelTankType::iterator() {
                fqdc.set_failure_warning(tank);
            }
            let application = update_measuring_application(&fqdc, None, None);

            assert_eq!(application.total_fuel_onboard(), None);
            assert_eq!(
                application.unavailable_tank_quantity_count(),
                WING_TANKS.len() + 1,
            );
            assert!(!application.all_feed_tanks_valid());
        }

        #[test]
        fn wing_fqi_failure_mirrors_opposite_tank() {
            let mut fqdc = MockFqdc::all_normal(Mass::ZERO);
            fqdc.set(A380FuelTankType::RightOuter, Mass::new::<kilogram>(1_000.));
            fqdc.set_failure_warning(A380FuelTankType::LeftOuter);
            let application = update_measuring_application(&fqdc, None, None);

            // The failed side has no own value, but mirrors the opposite side
            assert_eq!(application.tank_quantity(A380FuelTankType::LeftOuter), None);
            assert_eq!(
                application.tank_quantity(A380FuelTankType::RightOuter),
                Some(Mass::new::<kilogram>(1_000.)),
            );
            assert_eq!(
                application.get_tank_quantity(A380FuelTankType::LeftOuter),
                Mass::new::<kilogram>(1_000.),
            );

            // The mirrored quantity is used for the failed side, so the total
            // counts the mirrored value plus the value of the opposite tank
            assert_eq!(
                application.total_fuel_onboard(),
                Some(Mass::new::<kilogram>(2_000.)),
            );
            assert_eq!(application.unavailable_tank_quantity_count(), 1);
            assert!(application.all_feed_tanks_valid());
        }

        #[test]
        fn both_failed_wing_tanks_are_excluded_from_total() {
            let mut fqdc = MockFqdc::all_normal(Mass::new::<kilogram>(100.));
            fqdc.set_failure_warning(A380FuelTankType::LeftOuter);
            fqdc.set_failure_warning(A380FuelTankType::RightOuter);
            let application = update_measuring_application(&fqdc, None, None);

            assert_eq!(application.tank_quantity(A380FuelTankType::LeftOuter), None);
            assert_eq!(
                application.tank_quantity(A380FuelTankType::RightOuter),
                None
            );
            assert_eq!(
                application.total_fuel_onboard(),
                Some(Mass::new::<kilogram>(900.)),
            );
            assert_eq!(application.unavailable_tank_quantity_count(), 2);
        }

        #[test]
        fn failed_trim_tank_is_treated_as_empty() {
            let mut fqdc = MockFqdc::all_normal(Mass::new::<kilogram>(100.));
            fqdc.set_failure_warning(A380FuelTankType::Trim);
            let application = update_measuring_application(&fqdc, None, None);

            assert_eq!(application.tank_quantity(A380FuelTankType::Trim), None);
            assert_eq!(
                application.get_tank_quantity(A380FuelTankType::Trim),
                Mass::ZERO
            );
            assert_eq!(
                application.total_fuel_onboard(),
                Some(Mass::new::<kilogram>(1_000.)),
            );
            assert_eq!(application.unavailable_tank_quantity_count(), 1);
        }

        #[test]
        fn failed_feed_tank_disables_feed_tank_validity_without_affecting_unavailable_count() {
            let mut fqdc = MockFqdc::all_normal(Mass::new::<kilogram>(100.));
            fqdc.set_failure_warning(A380FuelTankType::FeedOne);
            let application = update_measuring_application(&fqdc, None, None);

            assert_eq!(application.tank_quantity(A380FuelTankType::FeedOne), None);
            assert_eq!(
                application.get_tank_quantity(A380FuelTankType::FeedOne),
                Mass::ZERO,
            );
            assert!(!application.all_feed_tanks_valid());
            // Feed tanks are not counted as unavailable wing tanks
            assert_eq!(application.unavailable_tank_quantity_count(), 0);
            assert_eq!(
                application.total_fuel_onboard(),
                Some(Mass::new::<kilogram>(1_000.)),
            );
        }

        #[test]
        fn total_aircraft_weight_is_none_without_zero_fuel_weight() {
            let fqdc = MockFqdc::all_normal(Mass::new::<kilogram>(100.));
            let application = update_measuring_application(&fqdc, None, None);

            assert_eq!(application.total_aircraft_weight(), None);
            assert_eq!(application.center_of_gravity(), None);
        }

        #[test]
        fn total_aircraft_weight_sums_zero_fuel_weight_and_fuel() {
            let fqdc = MockFqdc::all_normal(Mass::new::<kilogram>(100.));
            let application = update_measuring_application(
                &fqdc,
                Some(Mass::new::<kilogram>(300_000.)),
                Some(Ratio::new::<percent>(40.)),
            );

            assert_eq!(
                application.total_aircraft_weight(),
                Some(Mass::new::<kilogram>(301_100.)),
            );
        }

        #[test]
        fn center_of_gravity_is_none_without_zero_fuel_weight_cg() {
            let fqdc = MockFqdc::all_normal(Mass::new::<kilogram>(100.));
            let application =
                update_measuring_application(&fqdc, Some(Mass::new::<kilogram>(300_000.)), None);

            assert_eq!(
                application.total_aircraft_weight(),
                Some(Mass::new::<kilogram>(301_100.))
            );
            assert_eq!(application.center_of_gravity(), None);
        }

        #[test]
        fn center_of_gravity_equals_zero_fuel_weight_cg_when_no_fuel_is_onboard() {
            let fqdc = MockFqdc::all_normal(Mass::ZERO);
            let application = update_measuring_application(
                &fqdc,
                Some(Mass::new::<kilogram>(300_000.)),
                Some(Ratio::new::<percent>(40.)),
            );

            assert_about_eq!(
                application.center_of_gravity().unwrap().get::<percent>(),
                40.,
                1e-9,
            );
        }

        // NOTE: A higher %MAC means a more aft CG
        #[test]
        fn center_of_gravity_moves_aft_with_trim_tank_fuel_and_forward_with_inner_tank_fuel() {
            let mut fqdc = MockFqdc::all_normal(Mass::ZERO);
            fqdc.set(A380FuelTankType::Trim, Mass::new::<kilogram>(10_000.));
            let application = update_measuring_application(
                &fqdc,
                Some(Mass::new::<kilogram>(300_000.)),
                Some(Ratio::new::<percent>(40.)),
            );
            let trim_cg = application.center_of_gravity().unwrap();
            assert_gt!(
                trim_cg,
                Ratio::new::<percent>(40.),
                "trim tank fuel should move the CG aft (towards a higher %MAC), got {trim_cg:?}",
            );

            fqdc = MockFqdc::all_normal(Mass::ZERO);
            fqdc.set(A380FuelTankType::LeftInner, Mass::new::<kilogram>(10_000.));
            let application = update_measuring_application(
                &fqdc,
                Some(Mass::new::<kilogram>(300_000.)),
                Some(Ratio::new::<percent>(40.)),
            );
            let inner_cg = application.center_of_gravity().unwrap();
            assert_lt!(
                inner_cg,
                Ratio::new::<percent>(40.),
                "inner tank fuel should move the CG forward (towards a lower %MAC), got {inner_cg:?}",
            );
        }

        #[test]
        fn center_of_gravity_is_calculated_with_mirrored_wing_tank_quantities() {
            let mut fqdc = MockFqdc::all_normal(Mass::ZERO);
            fqdc.set(A380FuelTankType::RightOuter, Mass::new::<kilogram>(10_000.));
            fqdc.set_failure_warning(A380FuelTankType::LeftOuter);
            let application = update_measuring_application(
                &fqdc,
                Some(Mass::new::<kilogram>(300_000.)),
                Some(Ratio::new::<percent>(40.)),
            );

            // Despite the failed FQI the mirrored quantity still allows a CG calculation
            assert!(application.center_of_gravity().is_some());
        }

        #[test]
        fn cg_mac_and_arm_conversions_are_inverses() {
            let loadsheet = A380Airframe::get_loadsheet();
            for mac in [25., 40., 55.] {
                let cg_mac = Ratio::new::<percent>(mac);
                let arm = FuelMeasuringApplication::cg_mac_to_arm(loadsheet, cg_mac);
                assert_about_eq!(
                    FuelMeasuringApplication::arm_to_cg_mac(loadsheet, arm).get::<percent>(),
                    mac,
                    1e-9,
                );
            }
        }
    }
}
