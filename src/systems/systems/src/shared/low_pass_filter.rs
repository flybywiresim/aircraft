use std::ops::AddAssign;
use std::ops::Mul;
use std::ops::Sub;
use std::time::Duration;

/// First order low pass filter
/// y(k) = y(k-1)  +  (1-a)*( x(k) - y(k-1) ) with a = exp (-T/tau)
/// See https://gregstanleyandassociates.com/whitepapers/FaultDiagnosis/Filtering/Exponential-Filter/exponential-filter.htm
pub struct LowPassFilter<T>
where
    T: AddAssign<T> + Sub<Output = T> + Mul<f64, Output = T> + Copy,
{
    time_constant: Duration,
    filtered_output: T,
}
impl<T> LowPassFilter<T>
where
    T: AddAssign<T> + Sub<Output = T> + Mul<f64, Output = T> + Copy + Default,
{
    pub fn new(time_constant: Duration) -> Self {
        Self {
            time_constant,
            filtered_output: T::default(),
        }
    }

    pub fn update(&mut self, time_delta: Duration, new_input: T) -> T {
        self.filtered_output += (new_input - self.filtered_output)
            * (1.
                - std::f64::consts::E
                    .powf(-time_delta.as_secs_f64() / self.time_constant.as_secs_f64()));

        self.filtered_output
    }

    pub fn output(&self) -> T {
        self.filtered_output
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use ntest::assert_about_eq;

    use uom::si::{acceleration::meter_per_second_squared, f64::*};

    #[test]
    fn filter_init_f64() {
        let low_pass = LowPassFilter::<f64>::new(Duration::from_secs_f64(0.5));
        assert!(low_pass.output() == 0.);
    }

    #[test]
    fn filter_init_uom() {
        let low_pass = LowPassFilter::<Acceleration>::new(Duration::from_secs_f64(0.5));

        assert!(low_pass.output().get::<meter_per_second_squared>() == 0.);
    }

    #[test]
    fn filter_step_test_1_second() {
        let mut low_pass = LowPassFilter::<f64>::new(Duration::from_secs(1));

        low_pass.update(Duration::from_secs_f64(0.5), 1.);
        assert!(low_pass.output() > 0.);

        assert_about_eq!(
            low_pass.update(Duration::from_secs_f64(0.5), 1.),
            expected_step_response_0_to_1(Duration::from_secs(1), Duration::from_secs(1))
        );
    }

    #[test]
    fn filter_zero_time_constant_step_test_outputs_input() {
        let mut low_pass = LowPassFilter::<f64>::new(Duration::from_secs(0));

        low_pass.update(Duration::from_secs_f64(0.5), 1.);
        assert_about_eq!(low_pass.output(), 1.);

        low_pass.update(Duration::from_secs_f64(0.5), 12.);
        assert_about_eq!(low_pass.output(), 12.);
    }

    fn expected_step_response_0_to_1(delta_time: Duration, time_constant: Duration) -> f64 {
        1. - std::f64::consts::E.powf(-1. / time_constant.as_secs_f64() * delta_time.as_secs_f64())
    }
}
