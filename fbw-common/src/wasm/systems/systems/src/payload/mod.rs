use std::{cell::Cell, rc::Rc};

use crate::simulation::{
    Read, Reader, SimulationElement, SimulationElementVisitor, SimulatorReader, SimulatorWriter,
    VariableIdentifier, Write, Writer,
};
use approx::relative_eq;
use rand::Rng;
use uom::si::{f64::Mass, mass::kilogram, mass::pound};

const JS_MAX_SAFE_INTEGER: i8 = 53;
const MAX_CARGO_MOVE: f64 = 60.;

pub struct PaxInfo {
    pub max_pax: i8,
    pub pax_id: String,
    pub pax_target_id: String,
    pub payload_id: String,
}
impl PaxInfo {
    pub fn new(max_pax: i8, pax_id: &str, pax_target_id: &str, payload_id: &str) -> Self {
        PaxInfo {
            max_pax,
            pax_id: pax_id.to_string(),
            pax_target_id: pax_target_id.to_string(),
            payload_id: payload_id.to_string(),
        }
    }
}

pub struct CargoInfo {
    pub max_cargo: Mass,
    pub cargo_id: String,
    pub cargo_target_id: String,
    pub payload_id: String,
}
impl CargoInfo {
    pub fn new(max_cargo: Mass, cargo_id: &str, cargo_target_id: &str, payload_id: &str) -> Self {
        CargoInfo {
            max_cargo,
            cargo_id: cargo_id.to_string(),
            cargo_target_id: cargo_target_id.to_string(),
            payload_id: payload_id.to_string(),
        }
    }
}
#[derive(Debug)]
pub struct Pax {
    pax_id: VariableIdentifier,
    pax_target_id: VariableIdentifier,
    payload_id: VariableIdentifier,
    per_pax_weight: Rc<Cell<Mass>>,
    pax_target: u64,
    pax: u64,
    payload: Mass,
}
impl Pax {
    pub fn new(
        pax_id: VariableIdentifier,
        pax_target_id: VariableIdentifier,
        payload_id: VariableIdentifier,
        per_pax_weight: Rc<Cell<Mass>>,
    ) -> Self {
        Pax {
            pax_id,
            pax_target_id,
            per_pax_weight,
            payload_id,
            pax_target: 0,
            pax: 0,
            payload: Mass::new::<pound>(0.),
        }
    }

    fn per_pax_weight(&self) -> Mass {
        self.per_pax_weight.get()
    }

    pub fn pax_is_target(&self) -> bool {
        self.pax == self.pax_target
    }

    pub fn pax(&self) -> u64 {
        self.pax
    }

    pub fn pax_num(&self) -> i8 {
        self.pax.count_ones() as i8
    }

    pub fn pax_target_num(&self) -> i8 {
        self.pax_target.count_ones() as i8
    }

    pub fn payload(&self) -> Mass {
        self.payload
    }

    pub fn payload_is_sync(&self) -> bool {
        self.payload
            == Mass::new::<pound>(self.pax_num() as f64 * self.per_pax_weight().get::<pound>())
    }

    pub fn load_payload(&mut self) {
        self.payload =
            Mass::new::<pound>(self.pax_num() as f64 * self.per_pax_weight().get::<pound>());
    }

    pub fn move_all_pax(&mut self) {
        self.pax = self.pax_target;
        self.load_payload();
    }

    pub fn move_pax(&mut self, pax: i8) {
        for _ in 0..pax {
            self.move_one_pax();
        }
    }

    pub fn move_one_pax(&mut self) {
        let pax_diff = self.pax_target_num() - self.pax_num();

        let n: u64 = if pax_diff > 0 {
            !self.pax & self.pax_target
        } else {
            self.pax & !self.pax_target
        };
        let count = n.count_ones() as i8;
        if count > 0 {
            let mut skip: i8 = rand::thread_rng().gen_range(0..count);

            for i in 0..JS_MAX_SAFE_INTEGER {
                let bit = 1 << i;
                if (n & bit) > 0 {
                    if skip <= 0 {
                        self.pax ^= bit;
                        break;
                    }
                    skip -= 1;
                }
            }
        }
        self.load_payload();
    }
}
impl SimulationElement for Pax {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.pax = reader.read(&self.pax_id);
        self.pax_target = reader.read(&self.pax_target_id);
        self.payload = reader.read(&self.payload_id);
    }
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.pax_id, self.pax);
        writer.write(&self.payload_id, self.payload.get::<pound>());
    }
}

#[derive(Debug)]
pub struct Cargo {
    cargo_target_id: VariableIdentifier,
    cargo_id: VariableIdentifier,
    payload_id: VariableIdentifier,
    cargo: Mass,
    cargo_target: Mass,
    payload: Mass,
}
impl Cargo {
    pub fn new(
        cargo_id: VariableIdentifier,
        cargo_target_id: VariableIdentifier,
        payload_id: VariableIdentifier,
    ) -> Self {
        Cargo {
            cargo_id,
            cargo_target_id,
            payload_id,
            cargo: Mass::new::<kilogram>(0.),
            cargo_target: Mass::new::<kilogram>(0.),
            payload: Mass::new::<pound>(0.),
        }
    }

    pub fn cargo(&self) -> Mass {
        self.cargo
    }

    pub fn payload(&self) -> Mass {
        self.payload
    }

    pub fn payload_is_sync(&self) -> bool {
        self.payload == self.cargo
    }

    pub fn cargo_is_target(&self) -> bool {
        relative_eq!(
            self.cargo.get::<kilogram>(),
            self.cargo_target.get::<kilogram>()
        )
    }

    pub fn load_payload(&mut self) {
        self.payload = self.cargo;
    }

    pub fn move_all_cargo(&mut self) {
        self.cargo = self.cargo_target;
        self.load_payload();
    }

    pub fn move_one_cargo(&mut self) {
        let max_move = MAX_CARGO_MOVE;
        let cargo_delta =
            f64::abs(self.cargo_target.get::<kilogram>() - self.cargo.get::<kilogram>());

        let qty = Mass::new::<kilogram>(f64::min(cargo_delta, max_move));

        if self.cargo < self.cargo_target {
            self.cargo += qty;
        } else if self.cargo > self.cargo_target {
            self.cargo -= qty;
        }
        self.load_payload();
    }
}
impl SimulationElement for Cargo {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        visitor.visit(self);
    }
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.cargo = Mass::new::<kilogram>(reader.read(&self.cargo_id));
        self.cargo_target = Mass::new::<kilogram>(reader.read(&self.cargo_target_id));
        self.payload = reader.read(&self.payload_id);
    }
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.cargo_id, self.cargo.get::<kilogram>());
        writer.write(&self.payload_id, self.payload);
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BoardingRate {
    Instant,
    Fast,
    Real,
}
read_write_enum!(BoardingRate);
impl From<f64> for BoardingRate {
    fn from(value: f64) -> Self {
        match value as u8 {
            2 => BoardingRate::Real,
            1 => BoardingRate::Fast,
            0 => BoardingRate::Instant,
            _ => panic!("{} cannot be converted into BoardingRate", value),
        }
    }
}
