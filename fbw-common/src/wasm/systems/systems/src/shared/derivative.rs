use std::{
    ops::{Div, Sub},
    time::Duration,
};

#[derive(Default)]
pub struct DerivativeNode<T> {
    predecessor: Option<T>,
    output: T,
}

impl<T> DerivativeNode<T>
where
    T: Sub<Output = T> + Div<f64, Output = T> + Copy + Default,
{
    pub fn new() -> Self {
        Self::default()
    }

    pub fn update(&mut self, value: T, delta: Duration) -> T {
        if let Some(prev) = self.predecessor {
            self.output = (value - prev) / delta.as_secs_f64();
            self.predecessor = Some(value);
            self.output
        } else {
            self.predecessor = Some(value);
            T::default()
        }
    }

    pub fn output(&self) -> T {
        self.output
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use ntest::assert_about_eq;

    use uom::si::{f64::*, length::meter};

    #[test]
    fn derivative_init_f64() {
        let rate_limiter = DerivativeNode::<f64>::new();
        assert!(rate_limiter.output() == 0.);
    }

    #[test]
    fn derivative_init_uom() {
        let rate_limiter = DerivativeNode::<Length>::new();

        assert!(rate_limiter.output().get::<meter>() == 0.);
    }

    #[test]
    fn derivative_step_test() {
        let mut rate_limiter = DerivativeNode::<f64>::new();

        rate_limiter.update(1., Duration::from_secs_f64(0.5));
        assert_about_eq!(rate_limiter.output(), 0.);

        rate_limiter.update(1., Duration::from_secs_f64(0.5));
        assert_about_eq!(rate_limiter.output(), 0.);

        rate_limiter.update(0., Duration::from_secs_f64(1.));
        assert_about_eq!(rate_limiter.output(), -1.);
    }
}
