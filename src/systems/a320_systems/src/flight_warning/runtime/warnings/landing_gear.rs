use super::*;
use systems::flight_warning::parameters::Value;
use systems::flight_warning::utils::FwcSsm;

pub(in crate::flight_warning::runtime) trait LgDownlocked {
    fn main_lg_downlocked(&self) -> bool;
    fn lg_downlocked(&self) -> bool;
}

#[derive(Default)]
pub(in crate::flight_warning::runtime) struct LgDownlockedActivation {
    main_lg_downlocked: bool,
    lg_downlocked: bool,
}

impl LgDownlockedActivation {
    pub fn update(&mut self, signals: &(impl LhGearDownLock + RhGearDownLock + NoseGearDownLock)) {
        let lh_gear_down_lock_1 = signals.lh_gear_down_lock(1).value();
        let lh_gear_down_lock_2 = signals.lh_gear_down_lock(2).value();
        let lh_gear_invalid =
            signals.lh_gear_down_lock(1).is_inv() || signals.lh_gear_down_lock(2).is_inv();
        let lh_gear_norm_down_lock = lh_gear_down_lock_1 && lh_gear_down_lock_2;
        let lh_gear_abnorm_down_lock =
            lh_gear_invalid && (lh_gear_down_lock_1 || lh_gear_down_lock_2);
        let lh_gear_downlocked = lh_gear_norm_down_lock || lh_gear_abnorm_down_lock;

        let rh_gear_down_lock_1 = signals.rh_gear_down_lock(1).value();
        let rh_gear_down_lock_2 = signals.rh_gear_down_lock(2).value();
        let rh_gear_invalid =
            signals.rh_gear_down_lock(1).is_inv() || signals.rh_gear_down_lock(2).is_inv();
        let rh_gear_norm_down_lock = rh_gear_down_lock_1 && rh_gear_down_lock_2;
        let rh_gear_abnorm_down_lock =
            rh_gear_invalid && (rh_gear_down_lock_1 || rh_gear_down_lock_2);
        let rh_gear_downlocked = rh_gear_norm_down_lock || rh_gear_abnorm_down_lock;

        self.main_lg_downlocked = lh_gear_downlocked && rh_gear_downlocked;

        let nose_gear_down_lock_1 = signals.nose_gear_down_lock(1).value();
        let nose_gear_down_lock_2 = signals.nose_gear_down_lock(2).value();
        let nose_gear_invalid =
            signals.nose_gear_down_lock(1).is_inv() || signals.nose_gear_down_lock(2).is_inv();
        let nose_gear_norm_down_lock = nose_gear_down_lock_1 && nose_gear_down_lock_2;
        let nose_gear_abnorm_down_lock =
            nose_gear_invalid && (nose_gear_down_lock_1 || nose_gear_down_lock_2);
        let nose_gear_downlocked = nose_gear_norm_down_lock || nose_gear_abnorm_down_lock;

        self.lg_downlocked = self.main_lg_downlocked && nose_gear_downlocked;
    }
}

impl LgDownlocked for LgDownlockedActivation {
    fn main_lg_downlocked(&self) -> bool {
        self.main_lg_downlocked
    }

    fn lg_downlocked(&self) -> bool {
        self.lg_downlocked
    }
}

#[cfg(test)]
mod tests {
    use crate::flight_warning::runtime::test::*;

    use super::*;

    #[cfg(test)]
    mod lg_downlocked_activation_tests {
        use super::*;

        #[test]
        fn when_main_gears_downlocked_reports_main_lg_downlocked() {
            let mut sheet = LgDownlockedActivation::default();
            sheet.update(
                test_bed_with()
                    .lh_gear_downlocked(true)
                    .rh_gear_downlocked(true)
                    .nose_gear_downlocked(false)
                    .parameters(),
            );
            assert!(sheet.main_lg_downlocked());
            assert!(!sheet.lg_downlocked());
        }

        #[test]
        fn when_all_gears_downlocked_reports_lg_downlocked() {
            let mut sheet = LgDownlockedActivation::default();
            sheet.update(
                test_bed_with()
                    .lh_gear_downlocked(true)
                    .rh_gear_downlocked(true)
                    .nose_gear_downlocked(true)
                    .parameters(),
            );
            assert!(sheet.main_lg_downlocked());
            assert!(sheet.lg_downlocked());
        }
    }
}
