use uom::si::{
    f64::{Mass, Ratio},
    mass::pound,
    ratio::percent,
};

use crate::fuel::{
    cpiom_f::{
        fuel_transfer::tanks_empty, FuelQuantityProvider, FEED_TANKS, INNER_TANKS, MID_TANKS,
    },
    A380FuelTankType,
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
                cg >= target_aft_cg
            } else {
                cg > target_aft_cg - Ratio::new::<percent>(1.)
            }
        } else {
            // If we don't have the necessary data, we can't adjust CG
            false
        }
    }

    pub(super) fn determine_target_tank(
        &self,
        tank_quantities: &impl FuelQuantityProvider,
    ) -> &[A380FuelTankType] {
        if self.active {
            // TODO: balance tanks (by filling up lowest tanks first)
            if !tanks_empty(tank_quantities, &INNER_TANKS) {
                &INNER_TANKS
            } else if !tanks_empty(tank_quantities, &MID_TANKS) {
                &MID_TANKS
            } else {
                &FEED_TANKS
            }
        } else {
            // No transfer needed if not active
            &[]
        }
    }

    pub(super) fn is_active(&self) -> bool {
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

#[cfg(test)]
mod tests {
    use super::*;

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
}
