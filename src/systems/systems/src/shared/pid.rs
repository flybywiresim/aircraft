use std::time::Duration;

// Pid controller implementation
// Implementation in a recursive form
// u(k+1) = u(k) + (e(k) - e(k-1)) * Kp + e(k) * Ki * dt + (e(k) - 2 * e(k-1) + e(k-2)) * Kd / dt
// For variable dt add dt duration as argument, if fixed dt or scheduled synchronously with controlled system input None as dt
pub struct Pid {
    kp: f64,
    ki: f64,
    kd: f64,

    min_output: f64,
    max_output: f64,

    setpoint: f64,

    error_k_1: Option<f64>,
    error_k_2: Option<f64>,
    output: f64,
}

impl Pid {
    pub fn new(kp: f64, ki: f64, kd: f64, min_output: f64, max_output: f64, setpoint: f64) -> Self {
        Self {
            kp,
            ki,
            kd,
            min_output,
            max_output,
            setpoint,
            error_k_1: None,
            error_k_2: None,
            output: 0.,
        }
    }

    pub fn change_setpoint(&mut self, new_setpoint: f64) {
        self.setpoint = new_setpoint;
    }

    pub fn setpoint(&self) -> f64 {
        self.setpoint
    }
    pub fn output(&self) -> f64 {
        self.output
    }
    pub fn reset(&mut self, setpoint: f64) {
        self.output = 0.;
        self.change_setpoint(setpoint);
        self.reset_error();
    }

    pub fn next_control_output(&mut self, measurement: f64, delta_time: Option<Duration>) -> f64 {
        let mut dt = 1.;
        if let Some(delta) = delta_time {
            dt = delta.as_secs_f64();
        }

        let error = self.setpoint - measurement;

        let p_term;
        if self.error_k_1.is_some() {
            p_term = (error - self.error_k_1.unwrap()) * self.kp;
        } else {
            p_term = error * self.kp;
        }

        let i_term = error * self.ki * dt;

        let mut d_term = 0.;
        if self.error_k_2.is_some() && self.error_k_1.is_some() {
            d_term =
                (error - 2. * self.error_k_1.unwrap() + self.error_k_2.unwrap()) * self.kd / dt;
        }

        let unbound_output = self.output + p_term + i_term + d_term;
        // Limiting output to configured bounds
        self.output = unbound_output.max(self.min_output).min(self.max_output);

        self.update_error(error);

        self.output
    }

    fn update_error(&mut self, error: f64) {
        self.error_k_2 = self.error_k_1;
        self.error_k_1 = Some(error);
    }

    fn reset_error(&mut self) {
        self.error_k_2 = None;
        self.error_k_1 = None;
    }
}

#[cfg(test)]
mod tests {

    use super::*;
    #[test]
    fn pid_init() {
        let pid = Pid::new(1., 1., 1., 0., 1., 1.);

        assert!(pid.output == 0.)
    }

    #[test]
    fn proportional() {
        let mut pid = Pid::new(2.0, 0.0, 0.0, 0.0, 100.0, 10.0);
        assert!((pid.setpoint - 10.).abs() < f64::EPSILON);

        // Test simple proportional
        assert!((pid.next_control_output(0.0, None) - 20.).abs() < f64::EPSILON);
    }

    #[test]
    fn derivative() {
        let mut pid = Pid::new(0.0, 0.0, 2.0, -100.0, 100., 10.0);

        // No derivative term for first two updates
        assert!((pid.next_control_output(0.0, None) - 0.).abs() < f64::EPSILON);
        assert!((pid.next_control_output(0.0, None) - 0.).abs() < f64::EPSILON);

        // Test that there's a derivative at 3rd update
        assert!((pid.next_control_output(5.0, None) - -10.).abs() < f64::EPSILON);

        // Then no more derivative term
        assert!((pid.next_control_output(5.0, None) - 0.).abs() < f64::EPSILON);
        assert!((pid.next_control_output(5.0, None) - 0.).abs() < f64::EPSILON);
    }

    #[test]
    fn integral() {
        let mut pid = Pid::new(0.0, 2.0, 0.0, 0., 100.0, 10.0);

        // Test basic integration
        assert!((pid.next_control_output(0.0, None) - 20.).abs() < f64::EPSILON);
        assert!((pid.next_control_output(0.0, None) - 40.).abs() < f64::EPSILON);
        assert!((pid.next_control_output(5.0, None) - 50.).abs() < f64::EPSILON);

        // Test that error integral accumulates negative values
        let mut pid2 = Pid::new(0.0, 2.0, 0.0, -100., 100.0, -10.0);
        assert!((pid2.next_control_output(0.0, None) - -20.).abs() < f64::EPSILON);
        assert!((pid2.next_control_output(0.0, None) - -40.).abs() < f64::EPSILON);
    }

    #[test]
    fn output_limit() {
        let mut pid = Pid::new(1.0, 0.0, 0.0, -1., 1.0, 10.0);

        let out = pid.next_control_output(0.0, None);
        assert!((out - 1.).abs() < f64::EPSILON);

        let out = pid.next_control_output(20.0, None);

        assert!((out - -1.).abs() < f64::EPSILON);
    }

    #[test]
    fn pid() {
        let mut pid = Pid::new(1.0, 0.1, 1.0, -100.0, 100.0, 10.0);

        let out = pid.next_control_output(0.0, None);
        assert!((out - 11.).abs() < f64::EPSILON);

        let out = pid.next_control_output(5.0, None);
        assert!((out - 6.5).abs() < f64::EPSILON);

        let out = pid.next_control_output(11.0, None);
        assert!((out - -0.6).abs() < f64::EPSILON);

        let out = pid.next_control_output(10.0, None);
        assert!((out - 7.4).abs() < f64::EPSILON);
    }
}
