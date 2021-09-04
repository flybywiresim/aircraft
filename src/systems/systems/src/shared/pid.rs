use std::time::Duration;

// Pid controller implementation
// Implementation in a recursive form
// u(k+1) = u(k) + (e(k)-e(k-1))*Kp + e(k) * Ki * dt + (e(k)- 2*e(k-1) + e(k-2)) * Kd / dt
// For variable dt add dt duration as argument, if fixed dt or scheduled synchronously with controlled system input None as dt
struct Pid {
    kp: f64,
    ki: f64,
    kd: f64,

    min_output: f64,
    max_output: f64,

    setpoint: f64,

    error_k_1: f64,
    error_k_2: f64,
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
            error_k_1: 0.,
            error_k_2: 0.,
            output: 0.,
        }
    }

    pub fn change_setpoint(&mut self, new_setpoint: f64) {
        self.setpoint = new_setpoint;
    }

    fn next_control_output(&mut self, measurement: f64, delta_time: Option<Duration>) -> f64 {
        let mut dt = 1.;
        if delta_time.is_some() {
            dt = delta_time.unwrap().as_secs_f64();
        }

        let error = self.setpoint - measurement;

        let p_term = (error - self.error_k_1) * self.kp;

        let i_term = error * self.ki * dt;

        let d_term = (error - 2. * self.error_k_1 + self.error_k_2) * self.kd / dt;

        let output = self.output + p_term + i_term + d_term;

        self.error_k_2 = self.error_k_1;
        self.error_k_1 = error;

        self.output = output.max(self.min_output).min(self.max_output);

        self.output
    }
}

#[cfg(test)]
mod tests {

    use super::*;
    #[test]
    /// Runs electric pump, checks pressure OK, shut it down, check drop of pressure after 20s
    fn pid_init() {
        let pid = Pid::new(1., 1., 1., 0., 1., 1.);

        assert!(pid.output == 0.)
    }
}
