use crate::simulation::{
    InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
    VariableIdentifier,
};
use nalgebra::Vector3;
use uom::si::{f64::Mass, mass::kilogram};

pub const FUEL_GALLONS_TO_KG: f64 = 3.039075693483925;

#[derive(Debug)]
pub struct FuelInfo<'a> {
    pub fuel_tank_id: &'a str,
    pub position: (f64, f64, f64),
}

#[derive(Debug)]
pub struct FuelTank {
    fuel_id: VariableIdentifier,
    location: Vector3<f64>,
    quantity: Mass,
}
impl FuelTank {
    pub fn new(fuel_id: VariableIdentifier, location: Vector3<f64>) -> Self {
        FuelTank {
            fuel_id,
            location,
            quantity: Mass::default(),
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

pub struct FuelSystem {
    unlimited_fuel_id: VariableIdentifier,
    unlimited_fuel: bool,

    fuel_total_weight_id: VariableIdentifier,
    fuel_total_weight: Mass,

    fuel_tanks: Vec<FuelTank>,
}
impl FuelSystem {
    pub fn new(context: &mut InitContext, fuel_tanks: Vec<FuelTank>) -> Self {
        FuelSystem {
            unlimited_fuel_id: context.get_identifier("UNLIMITED FUEL".to_owned()),
            unlimited_fuel: false,
            fuel_total_weight_id: context.get_identifier("FUEL TOTAL QUANTITY WEIGHT".to_owned()),
            fuel_total_weight: Mass::default(),
            fuel_tanks,
        }
    }

    pub fn total_load(&self) -> Mass {
        self.fuel_total_weight
    }

    pub fn tank_has_fuel(&self, t: usize) -> bool {
        self.unlimited_fuel || self.fuel_tanks[t].quantity() > Mass::default()
    }

    pub fn center_of_gravity(&self) -> Vector3<f64> {
        let positions: Vec<Vector3<f64>> = self
            .fuel_tanks
            .iter()
            .map(|t| t.location())
            .collect::<Vec<_>>();

        let masses: Vec<Mass> = self
            .fuel_tanks
            .iter()
            .map(|t| t.quantity())
            .collect::<Vec<_>>();

        // This section of code calculates the center of gravity (assume center of gravity/center of mass is near identical)
        let total_mass_kg: f64 = self.fuel_total_weight.get::<kilogram>();
        let center_of_gravity: Vector3<f64> = if total_mass_kg > 0. {
            positions
                .iter()
                .zip(masses.iter())
                .map(|(pos, m)| pos * m.get::<kilogram>())
                .fold(Vector3::zeros(), |acc, x| acc + x)
                / total_mass_kg
        } else {
            Vector3::zeros()
        };
        center_of_gravity
    }
}
impl SimulationElement for FuelSystem {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.fuel_tanks, visitor);
        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.unlimited_fuel = reader.read(&self.unlimited_fuel_id);
        self.fuel_total_weight = reader.read(&self.fuel_total_weight_id);
    }
}
