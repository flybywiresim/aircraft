use std::ops::AddAssign;
use std::ops::Mul;
use std::ops::Sub;
use std::time::Duration;

#[derive(PartialEq, Eq, Copy, Clone, Debug)]
/// Rate limiter
/// y(k) = y(k-1) + min(max(x(k) - y(k-1), falling_max_rate), rising_max_rate) with the rates being in the units of T per second
pub struct RateLimiter<T>
where
    T: PartialOrd + AddAssign<T> + Sub<Output = T> + Mul<f64, Output = T> + Copy,
{
    rising_max_rate: T,
    falling_max_rate: T,
    limited_output: T,
}
impl<T> RateLimiter<T>
where
    T: PartialOrd + AddAssign<T> + Sub<Output = T> + Mul<f64, Output = T> + Copy + Default,
{
    pub fn new(rising_max_rate: T, falling_max_rate: T) -> Self {
        Self::new_with_init_value(rising_max_rate, falling_max_rate, T::default())
    }

    pub fn new_symmetrical(max_rate: T) -> Self {
        Self::new(max_rate, max_rate * -1.)
    }

    pub fn new_with_init_value(rising_max_rate: T, falling_max_rate: T, init_value: T) -> Self {
        debug_assert!(
            falling_max_rate <= T::default(),
            "Falling max rate must be negative or zero"
        );
        debug_assert!(
            rising_max_rate >= T::default(),
            "Rising max rate must be positive or zero"
        );
        Self {
            rising_max_rate,
            falling_max_rate,
            limited_output: init_value,
        }
    }

    pub fn update(&mut self, time_delta: Duration, new_input: T) -> T {
        // We need to do this stupid shit because rust doesnt implement Ord for floats.
        // If anyone has a better way to solve this, please let me know.
        let mut clamped_delta = new_input - self.limited_output;
        if clamped_delta > self.rising_max_rate * time_delta.as_secs_f64() {
            clamped_delta = self.rising_max_rate;
        } else if clamped_delta < self.falling_max_rate * time_delta.as_secs_f64() {
            clamped_delta = self.falling_max_rate;
        }
        self.limited_output += clamped_delta;

        self.limited_output
    }

    pub fn output(&self) -> T {
        self.limited_output
    }

    pub fn set_max_rate(&mut self, rising_max_rate: T, falling_max_rate: T) {
        self.rising_max_rate = rising_max_rate;
        self.falling_max_rate = falling_max_rate;
    }

    pub fn reset(&mut self, reset_value: T) {
        self.limited_output = reset_value;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use ntest::assert_about_eq;

    use uom::si::{f64::*, length::meter};

    #[test]
    fn rate_limiter_init_f64() {
        let rate_limiter = RateLimiter::<f64>::new(1., -2.);
        assert!(rate_limiter.output() == 0.);
    }

    #[test]
    fn rate_limiter_init_uom() {
        let rate_limiter =
            RateLimiter::<Length>::new(Length::new::<meter>(1.), Length::new::<meter>(-2.));

        assert!(rate_limiter.output().get::<meter>() == 0.);
    }

    #[test]
    fn rate_limiter_step_test() {
        let mut rate_limiter = RateLimiter::<f64>::new(1., -0.5);

        rate_limiter.update(Duration::from_secs_f64(0.5), 1.);
        assert!(rate_limiter.output() > 0.);

        assert_about_eq!(rate_limiter.update(Duration::from_secs_f64(0.5), 1.), 1.);

        rate_limiter.update(Duration::from_secs_f64(1.), 0.);
        assert_about_eq!(rate_limiter.output(), 0.5);
    }
}
