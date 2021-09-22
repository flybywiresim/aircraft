use crate::simulation::UpdateContext;
use std::time::Duration;

/// Provides fixed time interval looping.
///
/// ## Example scenario
/// With a fixed time interval of 10 ms and a frame delta of 35 ms, this type will provide three
/// iterations of 10 ms. The remaining 5 ms will carry over to the next frame. When the next frame
/// takes 15 ms, this will result in 2 iterations of 10 ms (15 ms + 5 ms).
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

    pub fn update(&mut self, context: &UpdateContext) {
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
impl IntoIterator for &mut FixedStepLoop {
    type Item = Duration;

    type IntoIter = std::vec::IntoIter<Self::Item>;

    fn into_iter(self) -> Self::IntoIter {
        let mut v = vec![];
        while self.number_of_loops_remaining > 0 {
            self.number_of_loops_remaining -= 1;
            v.push(self.time_step);
        }

        IntoIterator::into_iter(v)
    }
}

/// Provides maximum fixed time interval looping.
///
/// ## Example scenario
/// With a max fixed time interval of 10 ms and a frame delta of 35 ms, this type will provide three
/// iterations of 10 ms, and one iteration of 5ms to complete the 35ms total delta.
pub struct MaxFixedStepLoop {
    max_time_step: Duration,
    num_of_max_step_loop: u32,
    remaining_frame_duration: Option<Duration>,
}
impl MaxFixedStepLoop {
    pub fn new(max_time_step: Duration) -> Self {
        Self {
            max_time_step,
            num_of_max_step_loop: 0,
            remaining_frame_duration: None,
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        let max_fixed_seconds = self.max_time_step.as_secs_f64();

        let number_of_steps = context.delta_as_secs_f64() / max_fixed_seconds;

        self.num_of_max_step_loop = number_of_steps.floor() as u32;

        let remaining_time_step_update = Duration::from_secs_f64(
            (number_of_steps - (self.num_of_max_step_loop as f64)) * max_fixed_seconds,
        );

        if remaining_time_step_update > Duration::from_secs(0) {
            self.remaining_frame_duration = Some(remaining_time_step_update);
        } else {
            self.remaining_frame_duration = None;
        }
    }
}
impl IntoIterator for &mut MaxFixedStepLoop {
    type Item = Duration;

    type IntoIter = std::vec::IntoIter<Self::Item>;

    fn into_iter(self) -> Self::IntoIter {
        let mut v = vec![];

        while self.num_of_max_step_loop > 0 {
            self.num_of_max_step_loop -= 1;

            v.push(self.max_time_step);
        }

        if self.remaining_frame_duration.is_some() {
            v.push(self.remaining_frame_duration.unwrap());
            self.remaining_frame_duration = None;
        }
        IntoIterator::into_iter(v)
    }
}

#[cfg(test)]
mod fixed_tests {
    use super::*;

    use std::time::Duration;

    use uom::si::{
        acceleration::foot_per_second_squared, angle::radian, f64::*, length::foot,
        thermodynamic_temperature::degree_celsius, velocity::knot,
    };

    #[test]
    fn no_step_after_init() {
        let mut fixed_step = FixedStepLoop::new(Duration::from_millis(100));

        assert!(fixed_step.into_iter().len() == 0);
    }

    #[test]
    fn no_step_after_zero_time_update() {
        let mut fixed_step = FixedStepLoop::new(Duration::from_millis(100));

        fixed_step.update(&context(Duration::from_secs(0)));

        assert!(fixed_step.into_iter().len() == 0);
    }

    #[test]
    fn one_step_after_exact_fixed_time_step_update() {
        let mut fixed_step = FixedStepLoop::new(Duration::from_millis(100));

        fixed_step.update(&context(Duration::from_millis(100)));

        assert!(fixed_step.into_iter().len() == 1);
    }

    #[test]
    fn more_than_fixed_step_gives_correct_num_of_loops() {
        let timestep = Duration::from_millis(100);
        let mut fixed_step = FixedStepLoop::new(timestep);

        let test_duration = Duration::from_secs_f64(1.25);

        let expected_num_of_loops =
            (test_duration.as_secs_f64() / timestep.as_secs_f64()).floor() as u32;

        let expected_remaining_time_at_end_of_loops =
            test_duration - expected_num_of_loops * timestep;

        fixed_step.update(&context(test_duration));

        let mut actual_loop_num = 0;
        for cur_time_step in &mut fixed_step {
            assert!(cur_time_step == Duration::from_millis(100));
            actual_loop_num += 1;
        }

        assert!(expected_remaining_time_at_end_of_loops == fixed_step.lag_time_accumulator);
        assert!(actual_loop_num == expected_num_of_loops);
    }

    fn context(delta_time: Duration) -> UpdateContext {
        UpdateContext::new(
            delta_time,
            Velocity::new::<knot>(250.),
            Length::new::<foot>(5000.),
            ThermodynamicTemperature::new::<degree_celsius>(25.0),
            true,
            Acceleration::new::<foot_per_second_squared>(0.),
            Acceleration::new::<foot_per_second_squared>(0.),
            Acceleration::new::<foot_per_second_squared>(0.),
            Angle::new::<radian>(0.),
            Angle::new::<radian>(0.),
        )
    }
}

#[cfg(test)]
mod max_step_tests {
    use super::*;

    use std::time::Duration;

    use uom::si::{
        acceleration::foot_per_second_squared, angle::radian, f64::*, length::foot,
        thermodynamic_temperature::degree_celsius, velocity::knot,
    };

    #[test]
    fn no_step_after_init() {
        let mut max_step = MaxFixedStepLoop::new(Duration::from_millis(100));

        assert!(max_step.into_iter().len() == 0);
    }

    #[test]
    fn no_step_after_zero_time_update() {
        let mut max_step = MaxFixedStepLoop::new(Duration::from_millis(100));

        max_step.update(&context(Duration::from_secs(0)));

        assert!(max_step.into_iter().len() == 0);
    }

    #[test]
    fn one_step_after_exact_fixed_time_step_update() {
        let mut max_step = MaxFixedStepLoop::new(Duration::from_millis(100));

        max_step.update(&context(Duration::from_millis(100)));

        assert!(max_step.into_iter().len() == 1);
    }

    #[test]
    fn more_than_max_step_gives_correct_num_of_loops() {
        let timestep = Duration::from_millis(100);
        let mut max_step = MaxFixedStepLoop::new(timestep);

        let test_duration = Duration::from_secs_f64(0.320);

        max_step.update(&context(test_duration));

        let mut actual_loop_num = 0;
        let mut time_simulated = Duration::from_secs(0);
        for cur_time_step in &mut max_step {
            time_simulated += cur_time_step;
            actual_loop_num += 1;
        }

        //0.320 seconds with max of 0.100 we expect 3 max step duration plus 1 final step so 4
        assert!(actual_loop_num == 4);
        assert!(
            time_simulated <= test_duration + Duration::from_millis(5)
                && time_simulated >= test_duration - Duration::from_millis(5)
        );
    }

    fn context(delta_time: Duration) -> UpdateContext {
        UpdateContext::new(
            delta_time,
            Velocity::new::<knot>(250.),
            Length::new::<foot>(5000.),
            ThermodynamicTemperature::new::<degree_celsius>(25.0),
            true,
            Acceleration::new::<foot_per_second_squared>(0.),
            Acceleration::new::<foot_per_second_squared>(0.),
            Acceleration::new::<foot_per_second_squared>(0.),
            Angle::new::<radian>(0.),
            Angle::new::<radian>(0.),
        )
    }
}
