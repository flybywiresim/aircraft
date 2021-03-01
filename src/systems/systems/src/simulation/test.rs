use super::{from_bool, SimulatorReaderWriter};

pub struct TestReaderWriter {
    variables: Vec<(String, f64)>,
}
impl TestReaderWriter {
    pub fn new() -> Self {
        Self { variables: vec![] }
    }

    pub fn contains_f64(&self, name: &str, value: f64) -> bool {
        self.variables
            .iter()
            .any(|x| x.0 == name && (x.1 - value).abs() < f64::EPSILON)
    }

    pub fn contains_bool(&self, name: &str, value: bool) -> bool {
        self.contains_f64(name, from_bool(value))
    }

    pub fn len_is(&self, length: usize) -> bool {
        self.variables.len() == length
    }
}
impl SimulatorReaderWriter for TestReaderWriter {
    fn read(&mut self, name: &str) -> f64 {
        self.variables
            .iter()
            .find(|x| x.0 == name)
            .map(|x| x.1)
            .unwrap_or(0.)
    }

    fn write(&mut self, name: &str, value: f64) {
        self.variables.push((name.to_owned(), value));
    }
}
impl Default for TestReaderWriter {
    fn default() -> Self {
        Self::new()
    }
}
