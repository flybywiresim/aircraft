unit! {
    system: uom::si;
    quantity: uom::si::volume_rate;

    @liter_per_minute: prefix!(milli) / 60.; "L/min", "liter per minute", "liters per minute";
}

#[cfg(test)]
mod tests {
    use uom::si::{f64::VolumeRate, volume_rate::liter_per_second};

    use super::*;

    #[test]
    fn test_liter_per_minute() {
        let flow = VolumeRate::new::<liter_per_second>(1.);

        assert_eq!(flow.get::<liter_per_minute>(), 60.);
    }
}
