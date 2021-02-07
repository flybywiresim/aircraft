use crate::simulator::UpdateContext;
use std::time::Duration;

mod random;
pub use random::*;

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

#[cfg(test)]
mod timed_random_tests {
    use crate::simulator::test_helpers::context_with;

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
