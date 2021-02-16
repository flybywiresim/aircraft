use uom::si::{f64::*, ratio::percent};

use crate::simulation::{SimulationElement, SimulatorReader, UpdateContext};

pub struct Engine {
    n2_id: String,
    pub n2: Ratio,
}
impl Engine {
    pub fn new(number: usize) -> Engine {
        Engine {
            n2_id: format!("ENG N2 RPM:{}", number),
            n2: Ratio::new::<percent>(0.),
        }
    }

    pub fn update(&mut self, _: &UpdateContext) {}
}
impl SimulationElement for Engine {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.n2 = Ratio::new::<percent>(reader.read_f64(&self.n2_id));
    }
}
