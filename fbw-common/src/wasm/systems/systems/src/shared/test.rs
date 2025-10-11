pub fn about_gt_lt<T: std::ops::Sub<Output = T> + PartialOrd>(
    value: T,
    expected_value: T,
    epsilon: T,
) -> bool {
    let delta = if value < expected_value {
        expected_value - value
    } else {
        value - expected_value
    };
    delta < epsilon
}

#[macro_export]
macro_rules! assert_gt_lt {
    ($a:expr, $b:expr, $eps:expr) => {
        let eps = $eps;
        assert!(
            $crate::shared::test::about_gt_lt($a, $b, eps),
            "assertion failed: `(left !== right)` \
             (left: `{:.3?}`, right: `{:.3?}`, epsilon: `{:.3?}`)",
            $a,
            $b,
            eps
        );
    };
    ($a:expr, $b:expr,$eps:expr,) => {
        assert_gt_lt!($a, $b, $eps);
    };
}

#[cfg(test)]
mod about_gt_lt_tests {
    use uom::si::{angle::radian, f64::*};

    #[test]
    fn about_gt_lt_uom() {
        let expected = Angle::new::<radian>(3.);
        let delta = Angle::new::<radian>(0.5);

        let result = Angle::new::<radian>(3.);
        assert_gt_lt!(result, expected, delta);

        let result = Angle::new::<radian>(3.2);
        assert_gt_lt!(result, expected, delta);

        let result = Angle::new::<radian>(2.8);
        assert_gt_lt!(result, expected, delta);
    }
}
