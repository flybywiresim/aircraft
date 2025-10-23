use uom::{
    si::{angle::degree, f64::*},
    ConstZero,
};

pub(super) struct SlatFlapControlComputerMisc {}
impl SlatFlapControlComputerMisc {
    const POSITIONING_THRESHOLD_DEGREE: f64 = 6.69;
    const ENLARGED_TARGET_THRESHOLD_DEGREE: f64 = 0.8;
    const TARGET_THRESHOLD_DEGREE: f64 = 0.18;

    pub(super) fn in_positioning_threshold_range(position: Angle, target_position: Angle) -> bool {
        let tolerance = Angle::new::<degree>(Self::POSITIONING_THRESHOLD_DEGREE);
        position > (target_position - tolerance) && position < (target_position + tolerance)
    }

    pub(super) fn in_target_threshold_range(position: Angle, target_position: Angle) -> bool {
        let tolerance = Angle::new::<degree>(Self::TARGET_THRESHOLD_DEGREE);
        position > (target_position - tolerance) && position < (target_position + tolerance)
    }

    pub(super) fn below_enlarged_target_range(position: Angle, target_position: Angle) -> bool {
        let tolerance = Angle::new::<degree>(Self::ENLARGED_TARGET_THRESHOLD_DEGREE);
        position < target_position - tolerance
    }

    pub(super) fn in_enlarged_target_range(position: Angle, target_position: Angle) -> bool {
        let tolerance = Angle::new::<degree>(Self::ENLARGED_TARGET_THRESHOLD_DEGREE);
        position > (target_position - tolerance) && position < (target_position + tolerance)
    }

    pub(super) fn in_or_above_enlarged_target_range(
        position: Angle,
        target_position: Angle,
    ) -> bool {
        let tolerance = Angle::new::<degree>(Self::ENLARGED_TARGET_THRESHOLD_DEGREE);
        Self::in_enlarged_target_range(position, target_position)
            || position >= target_position + tolerance
    }

    pub(super) fn between_0_1f_enlarged_target_range(position: Angle) -> bool {
        let tolerance = Angle::new::<degree>(Self::ENLARGED_TARGET_THRESHOLD_DEGREE);
        position > (Angle::ZERO + tolerance)
            && position < (Angle::new::<degree>(120.21) - tolerance)
    }
}

#[cfg(test)]
pub mod tests {
    use super::*;

    #[test]
    fn sfcc_misc_ops() {
        let target_position = Angle::new::<degree>(10.);

        let position = Angle::new::<degree>(10.);
        assert!(!SlatFlapControlComputerMisc::below_enlarged_target_range(
            position,
            target_position
        ));
        assert!(SlatFlapControlComputerMisc::in_enlarged_target_range(
            position,
            target_position
        ));
        assert!(
            SlatFlapControlComputerMisc::in_or_above_enlarged_target_range(
                position,
                target_position
            )
        );

        let position = Angle::new::<degree>(0.);
        assert!(SlatFlapControlComputerMisc::below_enlarged_target_range(
            position,
            target_position
        ));
        assert!(!SlatFlapControlComputerMisc::in_enlarged_target_range(
            position,
            target_position
        ));
        assert!(
            !SlatFlapControlComputerMisc::in_or_above_enlarged_target_range(
                position,
                target_position
            )
        );

        let position = Angle::new::<degree>(20.);
        assert!(!SlatFlapControlComputerMisc::below_enlarged_target_range(
            position,
            target_position
        ));
        assert!(!SlatFlapControlComputerMisc::in_enlarged_target_range(
            position,
            target_position
        ));
        assert!(
            SlatFlapControlComputerMisc::in_or_above_enlarged_target_range(
                position,
                target_position
            )
        );

        let position = Angle::new::<degree>(10.7);
        assert!(!SlatFlapControlComputerMisc::below_enlarged_target_range(
            position,
            target_position
        ));
        assert!(SlatFlapControlComputerMisc::in_enlarged_target_range(
            position,
            target_position
        ));
        assert!(
            SlatFlapControlComputerMisc::in_or_above_enlarged_target_range(
                position,
                target_position
            )
        );

        let position = Angle::new::<degree>(9.3);
        assert!(!SlatFlapControlComputerMisc::below_enlarged_target_range(
            position,
            target_position
        ));
        assert!(SlatFlapControlComputerMisc::in_enlarged_target_range(
            position,
            target_position
        ));
        assert!(
            SlatFlapControlComputerMisc::in_or_above_enlarged_target_range(
                position,
                target_position
            )
        );
    }
}
