unit! {
    system: uom::si;
    quantity: uom::si::pressure;

    @newton_per_square_millimeter: 1.0_E6; "N/mm²", "newton per square millimeter", "newtons per square millimeter";
}

#[cfg(test)]
mod tests {
    use uom::si::{f64::Pressure, pressure::pascal};

    use super::*;

    #[test]
    fn test_newton_per_square_millimeter() {
        let pressure = Pressure::new::<pascal>(1.);

        assert_eq!(pressure.get::<newton_per_square_millimeter>(), 1e-6);
    }
}
