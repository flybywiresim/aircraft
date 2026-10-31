use crate::fuel::{
    cpiom_f::{
        fuel_transfer::FuelTransfer, FuelQuantityProvider, TankMode, TransferGalleryConnections,
        FEED_TANKS, INNER_TANKS, MID_TANKS,
    },
    A380FuelTankType,
};
use uom::si::{
    f64::{Mass, Ratio},
    mass::pound,
    ratio::percent,
};

#[derive(Default)]
pub(super) struct CGTransfer {
    active: bool,
}
impl CGTransfer {
    pub(super) fn update(&mut self, gross_weight: Option<Mass>, gross_cg: Option<Ratio>) {
        self.active = if let (Some(weight), Some(cg)) = (gross_weight, gross_cg) {
            // Calculate the target CG based on the total weight
            let target_aft_cg = Self::calculate_target_cg(weight);

            if self.active {
                cg > target_aft_cg - Ratio::new::<percent>(1.)
            } else {
                cg >= target_aft_cg
            }
        } else {
            // If we don't have the necessary data, we can't adjust CG
            false
        }
    }

    #[cfg(test)]
    fn is_active(&self) -> bool {
        self.active
    }

    /// Calculates the CG Target based on aircraft total weight
    fn calculate_target_cg(weight: Mass) -> Ratio {
        // the formula is based on kLBS
        let weight = weight.get::<pound>() / 1000.;

        // coefficients determined using regression on FCOM diagram
        let target = 1.52792360195336e-14 * weight.powi(5) - 7.7447769532209e-11 * weight.powi(4)
            + 1.57545973208929e-7 * weight.powi(3)
            - 0.000162820304673144 * weight.powi(2)
            + 0.0884071656630996 * weight
            + 20.6522282591408;
        Ratio::new::<percent>(target)
    }
}
impl FuelTransfer for CGTransfer {
    fn set_gallery_modes(
        &self,
        gallery_connections: &mut impl TransferGalleryConnections,
        tank_quantities: &impl FuelQuantityProvider,
    ) {
        if self.active && gallery_connections.is_aft_gallery_usable() {
            // TODO: balance tanks (by filling up lowest tanks first)
            // TODO: what if feed tanks are full?
            let target_tanks: &[A380FuelTankType] = if !tank_quantities.tanks_empty(INNER_TANKS) {
                &INNER_TANKS
            } else if !tank_quantities.tanks_empty(MID_TANKS) {
                &MID_TANKS
            } else {
                &FEED_TANKS
            };

            gallery_connections.set_aft_gallery_modes(
                target_tanks
                    .iter()
                    .map(|t| (*t, TankMode::Target))
                    .chain([(A380FuelTankType::Trim, TankMode::Source)]),
            );
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fuel::cpiom_f::TransferGalleryTankConnections;
    use ntest::assert_about_eq;
    use rstest::rstest;
    use rustc_hash::FxHashMap;
    use uom::ConstZero;

    #[test]
    fn update_with_none_inputs() {
        let mut cg_transfer = CGTransfer::default();
        cg_transfer.update(None, None);
        assert!(!cg_transfer.is_active());
    }

    #[test]
    fn update_activates_when_cg_above_threshold() {
        let mut cg_transfer = CGTransfer::default();
        let weight = Mass::new::<pound>(800_000.);
        let target_cg = CGTransfer::calculate_target_cg(weight);
        let current_cg = target_cg + Ratio::new::<percent>(2.);
        cg_transfer.update(Some(weight), Some(current_cg));
        assert!(cg_transfer.is_active());
    }

    #[test]
    fn update_does_not_activate_when_cg_below_threshold() {
        let mut cg_transfer = CGTransfer::default();
        let weight = Mass::new::<pound>(800_000.);
        let target_cg = CGTransfer::calculate_target_cg(weight);
        let current_cg = target_cg - Ratio::new::<percent>(2.);
        cg_transfer.update(Some(weight), Some(current_cg));
        assert!(!cg_transfer.is_active());
    }

    #[test]
    fn update_stays_active_if_on_or_above_target() {
        let mut cg_transfer = CGTransfer { active: true };
        let weight = Mass::new::<pound>(800_000.);
        let target_cg = CGTransfer::calculate_target_cg(weight);
        let current_cg = target_cg;
        cg_transfer.update(Some(weight), Some(current_cg));
        assert!(cg_transfer.is_active());
    }

    #[test]
    fn update_deactivates_if_below_target_when_active() {
        let mut cg_transfer = CGTransfer { active: true };
        let weight = Mass::new::<pound>(800_000.);
        let target_cg = CGTransfer::calculate_target_cg(weight);
        let current_cg = target_cg - Ratio::new::<percent>(1.);
        cg_transfer.update(Some(weight), Some(current_cg));
        assert!(!cg_transfer.is_active());
    }

    #[test]
    fn update_activates_when_cg_exactly_at_target() {
        let mut cg_transfer = CGTransfer::default();
        let weight = Mass::new::<pound>(800_000.);
        let target_cg = CGTransfer::calculate_target_cg(weight);
        cg_transfer.update(Some(weight), Some(target_cg));
        assert!(cg_transfer.is_active());
    }

    #[test]
    fn update_stays_active_within_one_percent_below_target() {
        let mut cg_transfer = CGTransfer { active: true };
        let weight = Mass::new::<pound>(800_000.);
        let target_cg = CGTransfer::calculate_target_cg(weight);
        let current_cg = target_cg - Ratio::new::<percent>(0.5);
        cg_transfer.update(Some(weight), Some(current_cg));
        assert!(cg_transfer.is_active());
    }

    #[rstest]
    #[case(Mass::new::<pound>(0.), 20.6522282591408)]
    #[case(Mass::new::<pound>(300_000.), 36.184093424445)]
    #[case(Mass::new::<pound>(500_000.), 39.480972103368)]
    #[case(Mass::new::<pound>(700_000.), 40.766335477252)]
    fn calculate_target_cg_matches_reference_values(
        #[case] weight: Mass,
        #[case] expected_percent_mac: f64,
    ) {
        assert_about_eq!(
            CGTransfer::calculate_target_cg(weight).get::<percent>(),
            expected_percent_mac,
            1e-6,
        );
    }

    #[derive(Default)]
    struct MockFuelQuantityProvider {
        quantities: FxHashMap<A380FuelTankType, Mass>,
    }
    impl MockFuelQuantityProvider {
        fn with_quantity(&mut self, tank: A380FuelTankType, quantity: Mass) -> &mut Self {
            self.quantities.insert(tank, quantity);
            self
        }
    }
    impl FuelQuantityProvider for MockFuelQuantityProvider {
        fn get_tank_quantity(&self, tank: A380FuelTankType) -> Mass {
            *self.quantities.get(&tank).unwrap_or(&Mass::ZERO)
        }

        fn get_tank_capacity(&self, _tank: A380FuelTankType) -> Mass {
            Mass::new::<pound>(10_000.)
        }
    }

    #[test]
    fn set_gallery_modes_targets_inner_tanks_when_inner_have_fuel() {
        let mut provider = MockFuelQuantityProvider::default();
        provider.with_quantity(A380FuelTankType::LeftInner, Mass::new::<pound>(100.));
        let mut connections = TransferGalleryTankConnections::default();
        let cg_transfer = CGTransfer { active: true };

        cg_transfer.set_gallery_modes(&mut connections, &provider);

        assert_eq!(
            connections.aft_gallery[A380FuelTankType::LeftInner],
            TankMode::Target
        );
        assert_eq!(
            connections.aft_gallery[A380FuelTankType::RightInner],
            TankMode::Target
        );
        assert_eq!(
            connections.aft_gallery[A380FuelTankType::Trim],
            TankMode::Source
        );
        assert_eq!(
            connections.aft_gallery[A380FuelTankType::FeedOne],
            TankMode::None
        );
        assert!(!connections.forward_gallery_in_use);
    }

    #[test]
    fn set_gallery_modes_falls_back_to_mid_tanks_when_inner_are_empty() {
        let mut provider = MockFuelQuantityProvider::default();
        provider.with_quantity(A380FuelTankType::LeftMid, Mass::new::<pound>(100.));
        let mut connections = TransferGalleryTankConnections::default();
        let cg_transfer = CGTransfer { active: true };

        cg_transfer.set_gallery_modes(&mut connections, &provider);

        assert_eq!(
            connections.aft_gallery[A380FuelTankType::LeftMid],
            TankMode::Target
        );
        assert_eq!(
            connections.aft_gallery[A380FuelTankType::RightMid],
            TankMode::Target
        );
        assert_eq!(
            connections.aft_gallery[A380FuelTankType::LeftInner],
            TankMode::None
        );
        assert_eq!(
            connections.aft_gallery[A380FuelTankType::Trim],
            TankMode::Source
        );
    }

    #[test]
    fn set_gallery_modes_falls_back_to_feed_tanks_when_inner_and_mid_are_empty() {
        let provider = MockFuelQuantityProvider::default();
        let mut connections = TransferGalleryTankConnections::default();
        let cg_transfer = CGTransfer { active: true };

        cg_transfer.set_gallery_modes(&mut connections, &provider);

        for tank in FEED_TANKS {
            assert_eq!(connections.aft_gallery[tank], TankMode::Target);
        }
        assert_eq!(
            connections.aft_gallery[A380FuelTankType::Trim],
            TankMode::Source
        );
    }

    #[test]
    fn set_gallery_modes_does_nothing_when_inactive() {
        let mut provider = MockFuelQuantityProvider::default();
        provider.with_quantity(A380FuelTankType::LeftInner, Mass::new::<pound>(100.));
        let mut connections = TransferGalleryTankConnections::default();
        let cg_transfer = CGTransfer::default();

        cg_transfer.set_gallery_modes(&mut connections, &provider);

        assert!(!connections.aft_gallery_in_use);
        assert!(!connections.forward_gallery_in_use);
    }

    #[test]
    fn set_gallery_modes_does_nothing_when_aft_gallery_is_in_use() {
        let mut provider = MockFuelQuantityProvider::default();
        provider.with_quantity(A380FuelTankType::LeftInner, Mass::new::<pound>(100.));
        let mut connections = TransferGalleryTankConnections::default();
        connections.set_aft_gallery_modes([(A380FuelTankType::Trim, TankMode::Source)]);
        let cg_transfer = CGTransfer { active: true };

        cg_transfer.set_gallery_modes(&mut connections, &provider);

        assert_eq!(
            connections.aft_gallery[A380FuelTankType::LeftInner],
            TankMode::None
        );
    }
}
