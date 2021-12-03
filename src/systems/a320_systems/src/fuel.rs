use systems::simulation::{
    InitContext, Read, SimulationElement, SimulatorReader, VariableIdentifier, NestedElement,
};
use uom::si::{f64::*, mass::kilogram};

#[derive(NestedElement)]
pub struct A320Fuel {
    unlimited_fuel_id: VariableIdentifier,
    fuel_tank_left_main_quantity_id: VariableIdentifier,

    unlimited_fuel: bool,
    left_inner_tank_fuel_quantity: Mass,
}
impl A320Fuel {
    pub fn new(context: &mut InitContext) -> Self {
        A320Fuel {
            unlimited_fuel_id: context.get_identifier("UNLIMITED FUEL".to_owned()),
            fuel_tank_left_main_quantity_id: context
                .get_identifier("FUEL TANK LEFT MAIN QUANTITY".to_owned()),

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
        self.unlimited_fuel = reader.read(&self.unlimited_fuel_id);
        self.left_inner_tank_fuel_quantity = reader.read(&self.fuel_tank_left_main_quantity_id);
    }
}
