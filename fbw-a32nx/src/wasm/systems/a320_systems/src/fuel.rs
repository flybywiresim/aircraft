use nalgebra::{ArrayStorage, Matrix, Vector3, U1, U3};
use systems::simulation::{
    test::{SimulationTestBed, TestBed},
    Aircraft, InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
    VariableIdentifier,
};
use uom::si::{f64::*, mass::kilogram};

pub trait LeftTankHasFuel {
    fn left_inner_tank_has_fuel_remaining(&self) -> bool;
}

pub struct A320Fuel {
    unlimited_fuel_id: VariableIdentifier,
    unlimited_fuel: bool,

    fuel_tank_center_quantity_id: VariableIdentifier,
    fuel_tank_left_main_quantity_id: VariableIdentifier,
    fuel_tank_left_aux_quantity_id: VariableIdentifier,
    fuel_tank_right_main_quantity_id: VariableIdentifier,
    fuel_tank_right_aux_quantity_id: VariableIdentifier,

    center_tank_location: Vector3<f64>,
    left_inner_tank_location: Vector3<f64>,
    left_outer_tank_location: Vector3<f64>,
    right_inner_tank_location: Vector3<f64>,
    right_outer_tank_location: Vector3<f64>,

    center_tank_fuel_quantity: Mass,
    left_inner_tank_fuel_quantity: Mass,
    left_outer_tank_fuel_quantity: Mass,
    right_inner_tank_fuel_quantity: Mass,
    right_outer_tank_fuel_quantity: Mass,

    cg: Matrix<f64, U3, U1, ArrayStorage<f64, U3, U1>>,
}
impl A320Fuel {
    pub fn new(context: &mut InitContext) -> Self {
        A320Fuel {
            unlimited_fuel_id: context.get_identifier("UNLIMITED FUEL".to_owned()),

            fuel_tank_center_quantity_id: context
                .get_identifier("FUEL TANK CENTER QUANTITY".to_owned()),
            fuel_tank_left_main_quantity_id: context
                .get_identifier("FUEL TANK LEFT MAIN QUANTITY".to_owned()),
            fuel_tank_left_aux_quantity_id: context
                .get_identifier("FUEL TANK LEFT AUX QUANTITY".to_owned()),
            fuel_tank_right_main_quantity_id: context
                .get_identifier("FUEL TANK RIGHT MAIN QUANTITY".to_owned()),
            fuel_tank_right_aux_quantity_id: context
                .get_identifier("FUEL TANK RIGHT AUX QUANTITY".to_owned()),
            unlimited_fuel: false,

            center_tank_location: Vector3::new(-4.5, 0., 1.),
            left_inner_tank_location: Vector3::new(-8., -13., 2.),
            left_outer_tank_location: Vector3::new(-16.9, -27., 3.),
            right_inner_tank_location: Vector3::new(-8., 13., 2.),
            right_outer_tank_location: Vector3::new(-16.9, 27., 3.),

            center_tank_fuel_quantity: Mass::default(),
            left_inner_tank_fuel_quantity: Mass::default(),
            left_outer_tank_fuel_quantity: Mass::default(),
            right_inner_tank_fuel_quantity: Mass::default(),
            right_outer_tank_fuel_quantity: Mass::default(),

            cg: Matrix::default(),
        }
    }

    pub fn left_inner_tank_has_fuel_remaining(&self) -> bool {
        self.unlimited_fuel || self.left_inner_tank_fuel_quantity > Mass::default()
    }

    pub fn _right_inner_tank_has_fuel_remaining(&self) -> bool {
        self.unlimited_fuel || self.right_inner_tank_fuel_quantity > Mass::default()
    }

    pub fn _left_outer_tank_has_fuel_remaining(&self) -> bool {
        self.unlimited_fuel || self.left_outer_tank_fuel_quantity > Mass::default()
    }

    pub fn _right_outer_tank_has_fuel_remaining(&self) -> bool {
        self.unlimited_fuel || self.right_outer_tank_fuel_quantity > Mass::default()
    }

    pub fn _center_tank_has_fuel_remaining(&self) -> bool {
        self.unlimited_fuel || self.center_tank_fuel_quantity > Mass::default()
    }
}
impl SimulationElement for A320Fuel {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.unlimited_fuel = reader.read(&self.unlimited_fuel_id);
        self.center_tank_fuel_quantity = reader.read(&self.fuel_tank_center_quantity_id);
        self.left_inner_tank_fuel_quantity = reader.read(&self.fuel_tank_left_main_quantity_id);
        self.left_outer_tank_fuel_quantity = reader.read(&self.fuel_tank_left_aux_quantity_id);
        self.right_inner_tank_fuel_quantity = reader.read(&self.fuel_tank_right_main_quantity_id);
        self.right_outer_tank_fuel_quantity = reader.read(&self.fuel_tank_right_aux_quantity_id);

        let positions = vec![
            self.center_tank_location,
            self.left_inner_tank_location,
            self.left_outer_tank_location,
            self.right_inner_tank_location,
            self.right_outer_tank_location,
        ];

        let masses = vec![
            self.center_tank_fuel_quantity,
            self.left_inner_tank_fuel_quantity,
            self.left_outer_tank_fuel_quantity,
            self.right_inner_tank_fuel_quantity,
            self.right_outer_tank_fuel_quantity,
        ];
        // Calculate center of mass
        let total_mass_kg: f64 = masses.iter().map(|m| m.get::<kilogram>()).sum();
        self.cg = positions
            .iter()
            .zip(masses.iter())
            .map(|(pos, m)| pos * m.get::<kilogram>())
            .fold(Vector3::zeros(), |acc, x| acc + x)
            / total_mass_kg;

        println!("cg x: {}", self.cg.x);
        println!("cg: {:?}", self.cg);
    }
}

struct FuelTestAircraft {
    fuel: A320Fuel,
}

impl FuelTestAircraft {
    fn new(context: &mut InitContext) -> Self {
        Self {
            fuel: A320Fuel::new(context),
        }
    }
}

impl Aircraft for FuelTestAircraft {
    /*
    fn update_before_power_distribution(
        &mut self,
        context: &UpdateContext,
        _electricity: &mut Electricity,
    ) {
        // self.fuel.update(context);
    }
     */
}
impl SimulationElement for FuelTestAircraft {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.fuel.accept(visitor);

        visitor.visit(self);
    }
}

struct FuelTestBed {
    test_bed: SimulationTestBed<FuelTestAircraft>,
}
impl FuelTestBed {
    fn new() -> Self {
        FuelTestBed {
            test_bed: SimulationTestBed::new(FuelTestAircraft::new),
        }
    }
}

impl TestBed for FuelTestBed {
    type Aircraft = FuelTestAircraft;

    fn test_bed(&self) -> &SimulationTestBed<FuelTestAircraft> {
        &self.test_bed
    }

    fn test_bed_mut(&mut self) -> &mut SimulationTestBed<FuelTestAircraft> {
        &mut self.test_bed
    }
}

fn test_bed() -> FuelTestBed {
    FuelTestBed::new()
}

fn test_bed_with() -> FuelTestBed {
    test_bed()
}
