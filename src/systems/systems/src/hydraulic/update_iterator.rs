use crate::simulation::UpdateContext;
use std::{iter::Iterator, time::Duration};

pub struct FixedStepLoop {
    lag_time_accumulator: Duration,
    time_step: Duration,
    number_of_loops_this_iteration: u32,
    number_of_loops_remaining: u32,
}
impl FixedStepLoop {
    pub fn new(time_step: Duration) -> Self {
        Self {
            lag_time_accumulator: Duration::from_millis(0),
            time_step,
            number_of_loops_this_iteration: 0,
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
        let number_of_steps_floating_point =
            time_to_catch.as_secs_f64() / self.time_step().as_secs_f64();

        if number_of_steps_floating_point < 1.0 {
            // Can't do a full time step
            // we can decide either do an update with smaller step or wait next iteration
            // for now we only update lag accumulator and chose a hard fixed step: if smaller
            // than chosen time step we do nothing and wait next iteration

            // Time lag is float part only of num of steps (because is < 1.0 here) * fixed time step to get a result in time
            self.lag_time_accumulator = Duration::from_secs_f64(
                number_of_steps_floating_point * self.time_step().as_secs_f64(),
            );
            self.number_of_loops_this_iteration = 0;
        } else {
            // Int part is the actual number of loops to do
            // rest of floating part goes into accumulator
            self.number_of_loops_this_iteration = number_of_steps_floating_point.floor() as u32;

            self.lag_time_accumulator = Duration::from_secs_f64(
                (number_of_steps_floating_point - (self.number_of_loops_this_iteration as f64))
                    * self.time_step().as_secs_f64(),
            ); // Keep track of time left after all fixed loop are done
        }

        self.number_of_loops_remaining = self.number_of_loops_this_iteration;
    }
}
impl Iterator for FixedStepLoop {
    type Item = Duration;

    fn next(&mut self) -> Option<Self::Item> {
        // Check to see if we've finished counting or not.
        if self.number_of_loops_remaining > 0 {
            self.number_of_loops_remaining -= 1;
            Some(self.time_step)
        } else {
            None
        }
    }
}

pub struct MaxStepLoop {
    max_time_step: Duration,
    num_of_max_step_loop: u32,
    remaining_frame_duration: Option<Duration>,
    number_of_loops_this_iteration: u32,
}
impl MaxStepLoop {
    pub fn new(max_time_step: Duration) -> Self {
        Self {
            max_time_step,
            num_of_max_step_loop: 0,
            remaining_frame_duration: None,
            number_of_loops_this_iteration: 0,
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        let max_fixed_seconds = self.max_time_step.as_secs_f64();

        let number_of_steps_floating_point = context.delta_as_secs_f64() / max_fixed_seconds;

        self.num_of_max_step_loop = number_of_steps_floating_point.floor() as u32;
        self.number_of_loops_this_iteration = self.num_of_max_step_loop;

        let remaining_time_step_update = Duration::from_secs_f64(
            (number_of_steps_floating_point - (self.num_of_max_step_loop as f64))
                * max_fixed_seconds,
        );

        if remaining_time_step_update > self.max_time_step / 10 {
            self.remaining_frame_duration = Some(remaining_time_step_update);
            self.number_of_loops_this_iteration += 1;
        } else {
            self.remaining_frame_duration = None;
        }
    }
}
impl Iterator for MaxStepLoop {
    type Item = Duration;

    fn next(&mut self) -> Option<Self::Item> {
        if self.num_of_max_step_loop > 0 {
            self.num_of_max_step_loop -= 1;

            Some(self.max_time_step)
        } else if self.remaining_frame_duration.is_some() {
            let last_frame_duration = self.remaining_frame_duration.unwrap();
            self.remaining_frame_duration = None;

            Some(last_frame_duration)
        } else {
            None
        }
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

        assert!(fixed_step.next() == None);
    }

    #[test]
    fn no_step_after_zero_time_update() {
        let mut fixed_step = FixedStepLoop::new(Duration::from_millis(100));

        fixed_step.update(&context(Duration::from_secs(0)));

        assert!(fixed_step.next() == None);
    }

    #[test]
    fn one_step_after_exact_fixed_time_step_update() {
        let mut fixed_step = FixedStepLoop::new(Duration::from_millis(100));

        fixed_step.update(&context(Duration::from_millis(100)));

        let first_iter = fixed_step.next();
        let second_iter = fixed_step.next();
        assert!(first_iter == Some(Duration::from_millis(100)));
        assert!(second_iter == None);
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
        while let Some(cur_time_step) = fixed_step.next() {
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
        let mut max_step = MaxStepLoop::new(Duration::from_millis(100));

        assert!(max_step.next() == None);
    }

    #[test]
    fn no_step_after_zero_time_update() {
        let mut max_step = MaxStepLoop::new(Duration::from_millis(100));

        max_step.update(&context(Duration::from_secs(0)));

        assert!(max_step.next() == None);
    }

    #[test]
    fn one_step_after_exact_fixed_time_step_update() {
        let mut max_step = MaxStepLoop::new(Duration::from_millis(100));

        max_step.update(&context(Duration::from_millis(100)));

        let first_iter = max_step.next();
        let second_iter = max_step.next();
        assert!(first_iter == Some(Duration::from_millis(100)));
        assert!(second_iter == None);
    }

    #[test]
    fn more_than_max_step_gives_correct_num_of_loops() {
        let timestep = Duration::from_millis(100);
        let mut max_step = MaxStepLoop::new(timestep);

        let test_duration = Duration::from_secs_f64(0.320);

        max_step.update(&context(test_duration));

        let mut actual_loop_num = 0;
        let mut time_simulated = Duration::from_secs(0);
        while let Some(cur_time_step) = max_step.next() {
            time_simulated += cur_time_step;
            actual_loop_num += 1;
        }

        assert!(actual_loop_num == max_step.number_of_loops_this_iteration);
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
