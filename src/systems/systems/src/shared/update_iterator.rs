use crate::simulation::DeltaContext;
use std::time::Duration;

/// Provides fixed time interval looping.
///
/// ## Example scenario
/// With a fixed time interval of 10 ms and a frame delta of 35 ms, this type will provide three
/// iterations of 10 ms. The remaining 5 ms will carry over to the next frame. When the next frame
/// takes 15 ms, this will result in 2 iterations of 10 ms (15 ms + 5 ms).
#[derive(Copy, Clone)]
pub struct FixedStepLoop {
    lag_time_accumulator: Duration,
    time_step: Duration,
    number_of_loops_remaining: u32,
}
impl FixedStepLoop {
    pub fn new(time_step: Duration) -> Self {
        Self {
            lag_time_accumulator: Duration::from_millis(0),
            time_step,
            number_of_loops_remaining: 0,
        }
    }

    fn time_step(&self) -> Duration {
        self.time_step
    }

    pub fn update(&mut self, context: &impl DeltaContext) {
        // Time to catch up in our simulation = new delta + time not updated last iteration
        let time_to_catch = context.delta() + self.lag_time_accumulator;

        // Number of time steps (with floating part) to do according to required time step
        let number_of_steps = time_to_catch.as_secs_f64() / self.time_step().as_secs_f64();

        if number_of_steps < 1.0 {
            // Can't do a full time step
            // we can decide either do an update with smaller step or wait next iteration
            // for now we only update lag accumulator and chose a hard fixed step: if smaller
            // than chosen time step we do nothing and wait next iteration

            // Time lag is float part only of num of steps (because is < 1.0 here) * fixed time step to get a result in time
            self.lag_time_accumulator =
                Duration::from_secs_f64(number_of_steps * self.time_step().as_secs_f64());
            self.number_of_loops_remaining = 0;
        } else {
            // Keep track of time left after all fixed loop are done
            self.lag_time_accumulator =
                Duration::from_secs_f64(number_of_steps.fract() * self.time_step().as_secs_f64());

            // Int part is the actual number of loops to do
            // rest of floating part goes into accumulator
            self.number_of_loops_remaining = number_of_steps.floor() as u32;
        }
    }
}
impl Iterator for FixedStepLoop {
    type Item = Duration;

    fn next(&mut self) -> Option<Self::Item> {
        match self.number_of_loops_remaining {
            0 => None,
            _ => {
                self.number_of_loops_remaining -= 1;
                Some(self.time_step)
            }
        }
    }
}

/// Provides maximum time interval looping.
///
/// ## Example scenario
/// With a max time step of 10 ms and a frame delta of 35 ms, this type will provide four
/// iterations of 8.75ms, thus completing the 35ms total delta.
#[derive(Copy, Clone)]
pub struct MaxStepLoop {
    max_time_step: Duration,
    num_of_loops: u32,
    frame_duration: Option<Duration>,
}
impl MaxStepLoop {
    pub fn new(max_time_step: Duration) -> Self {
        Self {
            max_time_step,
            num_of_loops: 0,
            frame_duration: None,
        }
    }

    pub fn update(&mut self, context: &impl DeltaContext) {
        if context.delta() > Duration::from_secs(0) {
            self.num_of_loops =
                (context.delta_as_secs_f64() / self.max_time_step.as_secs_f64()).ceil() as u32;

            self.frame_duration = Some(context.delta() / self.num_of_loops);
        } else {
            self.num_of_loops = 0;
            self.frame_duration = None;
        }
    }
}
impl Iterator for MaxStepLoop {
    type Item = Duration;

    fn next(&mut self) -> Option<Self::Item> {
        match self.num_of_loops {
            0 => None,
            _ => {
                self.num_of_loops -= 1;
                self.frame_duration
            }
        }
    }
}

#[cfg(test)]
mod fixed_tests {
    use super::*;
    use crate::simulation::test::TestUpdateContext;
    use std::time::Duration;

    #[test]
    fn no_step_after_init() {
        let mut fixed_step = FixedStepLoop::new(Duration::from_millis(100));

        assert_eq!(fixed_step.next(), None);
    }

    #[test]
    fn no_step_after_zero_time_update() {
        let mut fixed_step = FixedStepLoop::new(Duration::from_millis(100));

        fixed_step.update(&TestUpdateContext::default());

        assert_eq!(fixed_step.next(), None);
    }

    #[test]
    fn no_step_after_short_time_update() {
        let mut fixed_step = FixedStepLoop::new(Duration::from_millis(100));

        fixed_step.update(&TestUpdateContext::default().with_delta(Duration::from_millis(80)));

        assert_eq!(fixed_step.next(), None);
    }

    #[test]
    fn one_step_after_exact_fixed_time_step_update() {
        let mut fixed_step = FixedStepLoop::new(Duration::from_millis(100));

        fixed_step.update(&TestUpdateContext::default().with_delta(Duration::from_millis(100)));

        assert_eq!(fixed_step.next(), Some(Duration::from_millis(100)));
        assert_eq!(fixed_step.next(), None);
    }

    #[test]
    fn more_than_fixed_step_gives_correct_num_of_loops() {
        let mut fixed_step = FixedStepLoop::new(Duration::from_millis(100));

        fixed_step.update(&TestUpdateContext::default().with_delta(Duration::from_millis(320)));

        assert_eq!(fixed_step.next(), Some(Duration::from_millis(100)));
        assert_eq!(fixed_step.next(), Some(Duration::from_millis(100)));
        assert_eq!(fixed_step.next(), Some(Duration::from_millis(100)));
        assert_eq!(fixed_step.next(), None);
    }

    #[test]
    fn more_than_fixed_step_carries_over_remaining_time_to_next_update() {
        let mut fixed_step = FixedStepLoop::new(Duration::from_millis(100));

        fixed_step.update(&TestUpdateContext::default().with_delta(Duration::from_millis(101)));

        assert_eq!(fixed_step.next(), Some(Duration::from_millis(100)));
        assert_eq!(fixed_step.next(), None);

        fixed_step.update(&TestUpdateContext::default().with_delta(Duration::from_millis(99)));

        assert_eq!(fixed_step.next(), Some(Duration::from_millis(100)));
        assert_eq!(fixed_step.next(), None);
    }
}

#[cfg(test)]
mod max_step_tests {
    use super::*;
    use crate::simulation::test::TestUpdateContext;
    use std::time::Duration;

    #[test]
    fn no_step_after_init() {
        let mut max_step = MaxStepLoop::new(Duration::from_millis(100));

        assert_eq!(max_step.next(), None);
    }

    #[test]
    fn no_step_after_zero_time_update() {
        let mut max_step = MaxStepLoop::new(Duration::from_millis(100));

        max_step.update(&TestUpdateContext::default());

        assert_eq!(max_step.next(), None);
    }

    #[test]
    fn one_step_after_exact_fixed_time_step_update() {
        let mut max_step = MaxStepLoop::new(Duration::from_millis(100));

        max_step.update(&TestUpdateContext::default().with_delta(Duration::from_millis(100)));

        assert_eq!(max_step.next(), Some(Duration::from_millis(100)));
        assert_eq!(max_step.next(), None);
    }

    #[test]
    fn more_than_max_step_gives_correct_num_of_loops_of_equal_delta_time() {
        let mut max_step = MaxStepLoop::new(Duration::from_millis(100));

        max_step.update(&TestUpdateContext::default().with_delta(Duration::from_millis(320)));

        assert_eq!(max_step.next(), Some(Duration::from_millis(80)));
        assert_eq!(max_step.next(), Some(Duration::from_millis(80)));
        assert_eq!(max_step.next(), Some(Duration::from_millis(80)));
        assert_eq!(max_step.next(), Some(Duration::from_millis(80)));
        assert_eq!(max_step.next(), None);
    }
}
