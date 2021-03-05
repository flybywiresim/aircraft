use uom::si::{f64::*, ratio::percent};

use crate::simulation::{SimulationElement, SimulatorReader, UpdateContext};

pub struct Engine {
    corrected_n2_id: String,
    pub corrected_n2: Ratio,
}
impl Engine {
    pub fn new(number: usize) -> Engine {
        Engine {
            corrected_n2_id: format!("TURB ENG CORRECTED N2:{}", number),
            corrected_n2: Ratio::new::<percent>(0.),
        }
    }

    pub fn corrected_n2(&self) -> Ratio {
        self.corrected_n2
    }

    pub fn update(&mut self, _: &UpdateContext) {}
}
impl SimulationElement for Engine {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.corrected_n2 = Ratio::new::<percent>(reader.read_f64(&self.corrected_n2_id));
    }
}
