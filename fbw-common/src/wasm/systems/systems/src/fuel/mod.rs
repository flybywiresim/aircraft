use crate::simulation::{Read, SimulationElement, SimulatorReader, VariableIdentifier};
use nalgebra::Vector3;
use uom::si::f64::Mass;

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
        self.quantity = reader.read(&self.fuel_id);
    }
}
