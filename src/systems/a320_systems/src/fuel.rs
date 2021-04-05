use systems::simulation::{SimulationElement, SimulatorReader};
use uom::si::{
    f64::*,
    mass::{kilogram, pound},
};

pub struct A320Fuel {
    unlimited_fuel: bool,
    left_inner_tank_fuel_quantity: Mass,
}
impl A320Fuel {
    pub fn new() -> Self {
        A320Fuel {
            unlimited_fuel: false,
            left_inner_tank_fuel_quantity: Mass::new::<kilogram>(0.),
        }
    }

    pub fn left_inner_tank_has_fuel_remaining(&self) -> bool {
        self.unlimited_fuel || self.left_inner_tank_fuel_quantity > Mass::new::<kilogram>(0.)
    }
}
impl SimulationElement for A320Fuel {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.unlimited_fuel = reader.read_bool("UNLIMITED FUEL");
        self.left_inner_tank_fuel_quantity =
            Mass::new::<pound>(reader.read_f64("FUEL TANK LEFT MAIN QUANTITY"));
    }
}
