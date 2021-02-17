#[derive(Debug)]
pub struct LagFilter {
    time_constant: f64,
    prev_in: f64,
    prev_out: f64,
}

impl LagFilter {
    pub fn new() -> Self {
        LagFilter {
            time_constant: 1.0,
            prev_in: 0.0,
            prev_out: 0.0,
        }
    }

    pub fn iterate(&mut self, n: f64, dt: f64) -> f64 {
        let sdt = dt * self.time_constant;
        let sum0 = sdt + 2.0;

        let output = (n + self.prev_in) * sdt / sum0 + (2.0 - sdt) / sum0 * self.prev_out;
        self.prev_in = n;
        self.prev_out = output;

        output
    }
}
