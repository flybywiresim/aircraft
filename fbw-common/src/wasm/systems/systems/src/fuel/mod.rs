use crate::simulation::{Read, SimulationElement, SimulatorReader, VariableIdentifier};
use nalgebra::Vector3;
use uom::si::{f64::Mass, mass::kilogram};

pub const FUEL_GALLONS_TO_KG: f64 = 3.039075693483925;
pub struct FuelTank {
    fuel_id: VariableIdentifier,
    location: Vector3<f64>,
    quantity: Mass,
}
impl FuelTank {
    pub fn new(fuel_id: VariableIdentifier, location: Vector3<f64>, quantity: Mass) -> Self {
        FuelTank {
            fuel_id,
            location,
            quantity,
        }
    }

    pub fn location(&self) -> Vector3<f64> {
        self.location
    }

    pub fn quantity(&self) -> Mass {
        self.quantity
    }
}
impl SimulationElement for FuelTank {
    fn read(&mut self, reader: &mut SimulatorReader) {
        let volume: f64 = reader.read(&self.fuel_id);
        self.quantity = Mass::new::<kilogram>(volume * FUEL_GALLONS_TO_KG);
    }
}
