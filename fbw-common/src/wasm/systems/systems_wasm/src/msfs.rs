///! Module declared to be able to compile documentation.
///! Does not provide any meaningful functionality.
#[cfg(not(target_arch = "wasm32"))]
pub(crate) mod legacy {
    use std::cell::Cell;
    use std::rc::Rc;

    pub fn execute_calculator_code<T>(_code: &str) {}

    #[derive(Debug)]
    pub struct AircraftVariable {}

    impl AircraftVariable {
        pub fn from(
            _name: &str,
            _units: &str,
            _index: usize,
        ) -> Result<Self, Box<dyn std::error::Error>> {
            Ok(Self {})
        }

        pub fn get(&self) -> f64 {
            0.
        }
    }

    #[derive(Debug)]
    pub struct NamedVariable {
        value: Rc<Cell<f64>>,
    }

    impl NamedVariable {
        pub fn from(_name: &str) -> Self {
            Self {
                value: Rc::new(Cell::new(0.)),
            }
        }

        pub fn get_value(&self) -> f64 {
            self.value.get()
        }

        pub fn set_value(&self, value: f64) {
            self.value.set(value);
        }
    }
}
