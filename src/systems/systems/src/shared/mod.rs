use crate::simulation::UpdateContext;
use std::time::Duration;
use uom::si::{f64::*, thermodynamic_temperature::degree_celsius};

mod random;
pub use random::*;

/// The delay logic gate delays the true result of a given expression by the given amount of time.
/// False results are output immediately.
pub struct DelayedTrueLogicGate {
    delay: Duration,
    expression_result: bool,
    true_duration: Duration,
}
impl DelayedTrueLogicGate {
    pub fn new(delay: Duration) -> DelayedTrueLogicGate {
        DelayedTrueLogicGate {
            delay,
            expression_result: false,
            true_duration: Duration::from_millis(0),
        }
    }

    pub fn update(&mut self, context: &UpdateContext, expression_result: bool) {
        // We do not include the delta representing the moment before the expression_result became true.
        if self.expression_result && expression_result {
            self.true_duration += context.delta;
        } else {
            self.true_duration = Duration::from_millis(0);
        }

        self.expression_result = expression_result;
    }

    pub fn output(&self) -> bool {
        self.expression_result && self.delay <= self.true_duration
    }
}

/// Provides a way to return a different value from a collection of values
/// which is randomly selected once per the given duration.
pub struct TimedRandom<T> {
    recalculate_every: Duration,
    passed_time: Duration,
    values: Vec<T>,
    current_value_index: usize,
}
impl<T: Copy + Default> TimedRandom<T> {
    pub fn new(recalculate_every: Duration, values: Vec<T>) -> Self {
        TimedRandom {
            recalculate_every,
            passed_time: Duration::from_secs(0),
            values,
            current_value_index: 0,
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        self.passed_time += context.delta;
        if self.passed_time >= self.recalculate_every {
            self.passed_time = Duration::from_secs(0);

            self.current_value_index = random_number() as usize % self.values.len();
        }
    }

    pub fn current_value(&self) -> T {
        self.values
            .get(self.current_value_index)
            .cloned()
            .unwrap_or_default()
    }
}

/// Given a current and target temperature, takes a coefficient and delta to
/// determine the new temperature after a certain duration has passed.
pub(crate) fn calculate_towards_target_temperature(
    current: ThermodynamicTemperature,
    target: ThermodynamicTemperature,
    coefficient: f64,
    delta: Duration,
) -> ThermodynamicTemperature {
    if current == target {
        current
    } else if current > target {
        ThermodynamicTemperature::new::<degree_celsius>(
            (current.get::<degree_celsius>() - (coefficient * delta.as_secs_f64()))
                .max(target.get::<degree_celsius>()),
        )
    } else {
        ThermodynamicTemperature::new::<degree_celsius>(
            (current.get::<degree_celsius>() + (coefficient * delta.as_secs_f64()))
                .min(target.get::<degree_celsius>()),
        )
    }
}

#[cfg(test)]
mod delayed_true_logic_gate_tests {
    use crate::simulation::context_with;

    use super::*;

    #[test]
    fn when_the_expression_is_false_returns_false() {
        let mut gate = delay_logic_gate(Duration::from_millis(100));
        gate.update(
            &context_with().delta(Duration::from_millis(0)).build(),
            false,
        );
        gate.update(
            &context_with().delta(Duration::from_millis(1_000)).build(),
            false,
        );

        assert_eq!(gate.output(), false);
    }

    #[test]
    fn when_the_expression_is_true_and_delay_hasnt_passed_returns_false() {
        let mut gate = delay_logic_gate(Duration::from_millis(10_000));
        gate.update(
            &context_with().delta(Duration::from_millis(0)).build(),
            false,
        );
        gate.update(
            &context_with().delta(Duration::from_millis(1_000)).build(),
            false,
        );

        assert_eq!(gate.output(), false);
    }

    #[test]
    fn when_the_expression_is_true_and_delay_has_passed_returns_true() {
        let mut gate = delay_logic_gate(Duration::from_millis(100));
        gate.update(
            &context_with().delta(Duration::from_millis(0)).build(),
            true,
        );
        gate.update(
            &context_with().delta(Duration::from_millis(1_000)).build(),
            true,
        );

        assert_eq!(gate.output(), true);
    }

    #[test]
    fn when_the_expression_is_true_and_becomes_false_before_delay_has_passed_returns_false_once_delay_passed(
    ) {
        let mut gate = delay_logic_gate(Duration::from_millis(1_000));
        gate.update(
            &context_with().delta(Duration::from_millis(0)).build(),
            true,
        );
        gate.update(
            &context_with().delta(Duration::from_millis(800)).build(),
            true,
        );
        gate.update(
            &context_with().delta(Duration::from_millis(100)).build(),
            false,
        );
        gate.update(
            &context_with().delta(Duration::from_millis(200)).build(),
            false,
        );

        assert_eq!(gate.output(), false);
    }

    #[test]
    fn does_not_include_delta_at_the_moment_of_expression_becoming_true() {
        let mut gate = delay_logic_gate(Duration::from_millis(1_000));
        gate.update(
            &context_with().delta(Duration::from_millis(900)).build(),
            true,
        );
        gate.update(
            &context_with().delta(Duration::from_millis(200)).build(),
            true,
        );

        assert_eq!(gate.output(), false);
    }

    fn delay_logic_gate(delay: Duration) -> DelayedTrueLogicGate {
        DelayedTrueLogicGate::new(delay)
    }
}

#[cfg(test)]
mod timed_random_tests {
    use crate::simulation::context_with;

    use super::TimedRandom;
    use std::time::Duration;

    #[test]
    fn empty_values_returns_default() {
        let tr = TimedRandom::<u8>::new(Duration::from_secs(1), vec![]);

        assert_eq!(tr.current_value(), 0);
    }

    #[test]
    fn single_value_returns_value() {
        let tr = TimedRandom::<u8>::new(Duration::from_secs(1), vec![4]);

        assert_eq!(tr.current_value(), 4);
    }

    #[test]
    fn multiple_values_returns_one_of_the_values() {
        let mut tr = TimedRandom::<u8>::new(Duration::from_secs(1), vec![4, 5]);
        tr.update(&context_with().delta(Duration::from_secs(2)).build());

        assert!(tr.current_value() == 4 || tr.current_value() == 5);
    }

    #[test]
    fn value_does_not_change_when_recalculation_time_not_passed() {
        let mut tr =
            TimedRandom::<u8>::new(Duration::from_secs(1), vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
        let value = tr.current_value();

        tr.update(&context_with().delta(Duration::from_millis(999)).build());

        assert_eq!(tr.current_value(), value);
    }
}

#[cfg(test)]
mod calculate_towards_target_temperature_tests {
    use ntest::assert_about_eq;

    use super::*;

    #[test]
    fn when_current_equals_target_returns_current() {
        let temperature = ThermodynamicTemperature::new::<degree_celsius>(10.);
        let result = calculate_towards_target_temperature(
            temperature,
            temperature,
            1.,
            Duration::from_secs(1),
        );

        assert_eq!(result, temperature);
    }

    #[test]
    fn when_current_less_than_target_moves_towards_target() {
        let result = calculate_towards_target_temperature(
            ThermodynamicTemperature::new::<degree_celsius>(10.),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
            1.,
            Duration::from_secs(1),
        );

        assert_about_eq!(result.get::<degree_celsius>(), 11.);
    }

    #[test]
    fn when_current_slightly_less_than_target_does_not_overshoot_target() {
        let result = calculate_towards_target_temperature(
            ThermodynamicTemperature::new::<degree_celsius>(14.9),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
            1.,
            Duration::from_secs(1),
        );

        assert_about_eq!(result.get::<degree_celsius>(), 15.);
    }

    #[test]
    fn when_current_more_than_target_moves_towards_target() {
        let result = calculate_towards_target_temperature(
            ThermodynamicTemperature::new::<degree_celsius>(15.),
            ThermodynamicTemperature::new::<degree_celsius>(10.),
            1.,
            Duration::from_secs(1),
        );

        assert_about_eq!(result.get::<degree_celsius>(), 14.);
    }

    #[test]
    fn when_current_slightly_more_than_target_does_not_undershoot_target() {
        let result = calculate_towards_target_temperature(
            ThermodynamicTemperature::new::<degree_celsius>(10.1),
            ThermodynamicTemperature::new::<degree_celsius>(10.),
            1.,
            Duration::from_secs(1),
        );

        assert_about_eq!(result.get::<degree_celsius>(), 10.);
    }
}
