// Note: Fuel system for now is still handled in MSFS. This is used for calculating fuel-related factors.
use std::time::Duration;

use enum_map::{Enum, EnumMap};
use nalgebra::Vector3;
use systems::{
    accept_iterable,
    fuel::FuelTank,
    simulation::{
        test::{SimulationTestBed, TestBed, WriteByName},
        Aircraft, InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        VariableIdentifier,
    },
};
use uom::si::{f64::*, mass::kilogram};

pub trait LeftTankHasFuel {
    fn left_inner_tank_has_fuel_remaining(&self) -> bool;
}

pub trait FuelForeAftCG {
    fn fore_aft_center_of_gravity(&self) -> f64;
}
impl FuelForeAftCG for A320Fuel {
    fn fore_aft_center_of_gravity(&self) -> f64 {
        self.fore_aft_center_of_gravity()
    }
}

pub trait FuelCG {
    fn center_of_gravity(&self) -> Vector3<f64>;
}
impl FuelCG for A320Fuel {
    fn center_of_gravity(&self) -> Vector3<f64> {
        self.center_of_gravity()
    }
}

#[derive(Debug, Clone, Copy, Enum)]
pub enum A320FuelTankType {
    Center,
    LeftInner,
    LeftOuter,
    RightInner,
    RightOuter,
}

impl A320FuelTankType {
    pub fn iterator() -> impl Iterator<Item = A320FuelTankType> {
        [
            A320FuelTankType::Center,
            A320FuelTankType::LeftInner,
            A320FuelTankType::LeftOuter,
            A320FuelTankType::RightInner,
            A320FuelTankType::RightOuter,
        ]
        .iter()
        .copied()
    }
}

pub struct A320Fuel {
    unlimited_fuel_id: VariableIdentifier,
    unlimited_fuel: bool,

    fuel_tanks: EnumMap<A320FuelTankType, FuelTank>,
}
impl A320Fuel {
    pub fn new(context: &mut InitContext) -> Self {
        A320Fuel {
            unlimited_fuel_id: context.get_identifier("UNLIMITED FUEL".to_owned()),
            unlimited_fuel: false,

            fuel_tanks: EnumMap::from_array([
                FuelTank::new(
                    context.get_identifier("FUEL TANK CENTER QUANTITY".to_owned()),
                    Vector3::new(-4.5, 0., 1.),
                    Mass::default(),
                ),
                FuelTank::new(
                    context.get_identifier("FUEL TANK LEFT MAIN QUANTITY".to_owned()),
                    Vector3::new(-8., -13., 2.),
                    Mass::default(),
                ),
                FuelTank::new(
                    context.get_identifier("FUEL TANK LEFT AUX QUANTITY".to_owned()),
                    Vector3::new(-16.9, -27., 3.),
                    Mass::default(),
                ),
                FuelTank::new(
                    context.get_identifier("FUEL TANK RIGHT MAIN QUANTITY".to_owned()),
                    Vector3::new(-8., 13., 2.),
                    Mass::default(),
                ),
                FuelTank::new(
                    context.get_identifier("FUEL TANK RIGHT AUX QUANTITY".to_owned()),
                    Vector3::new(-16.9, 27., 3.),
                    Mass::default(),
                ),
            ]),
        }
    }

    fn _center_tank_has_fuel_remaining(&self) -> bool {
        self.unlimited_fuel
            || self.fuel_tanks[A320FuelTankType::Center].quantity() > Mass::default()
    }

    pub fn left_inner_tank_has_fuel_remaining(&self) -> bool {
        self.unlimited_fuel
            || self.fuel_tanks[A320FuelTankType::LeftInner].quantity() > Mass::default()
    }

    fn _left_outer_tank_has_fuel_remaining(&self) -> bool {
        self.unlimited_fuel
            || self.fuel_tanks[A320FuelTankType::LeftOuter].quantity() > Mass::default()
    }

    fn _right_inner_tank_has_fuel_remaining(&self) -> bool {
        self.unlimited_fuel
            || self.fuel_tanks[A320FuelTankType::RightInner].quantity() > Mass::default()
    }

    fn _right_outer_tank_has_fuel_remaining(&self) -> bool {
        self.unlimited_fuel
            || self.fuel_tanks[A320FuelTankType::RightOuter].quantity() > Mass::default()
    }

    fn fore_aft_center_of_gravity(&self) -> f64 {
        self.center_of_gravity().x
    }

    fn center_of_gravity(&self) -> Vector3<f64> {
        let positions: Vec<Vector3<f64>> = self
            .fuel_tanks
            .iter()
            .map(|t| t.1.location())
            .collect::<Vec<_>>();

        let masses: Vec<Mass> = self
            .fuel_tanks
            .iter()
            .map(|t| t.1.quantity())
            .collect::<Vec<_>>();

        // This section of code calculates the center of gravity (assume center of gravity/center of mass is near identical)
        let total_mass_kg: f64 = masses.iter().map(|m| m.get::<kilogram>()).sum();
        let center_of_gravity = positions
            .iter()
            .zip(masses.iter())
            .map(|(pos, m)| pos * m.get::<kilogram>())
            .fold(Vector3::zeros(), |acc, x| acc + x)
            / total_mass_kg;

        center_of_gravity
    }
}
impl SimulationElement for A320Fuel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.fuel_tanks, visitor);
        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.unlimited_fuel = reader.read(&self.unlimited_fuel_id);
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

pub const HOURS_TO_MINUTES: u64 = 60;
pub const MINUTES_TO_SECONDS: u64 = 60;

struct FuelTestBed {
    test_bed: SimulationTestBed<FuelTestAircraft>,
}
impl FuelTestBed {
    fn new() -> Self {
        FuelTestBed {
            test_bed: SimulationTestBed::new(FuelTestAircraft::new),
        }
    }

    fn and_run(mut self) -> Self {
        self.run();

        self
    }

    fn and_stabilize(mut self) -> Self {
        let five_minutes = 5 * MINUTES_TO_SECONDS;
        self.test_bed
            .run_multiple_frames(Duration::from_secs(five_minutes));

        self
    }

    fn init_vars(mut self) -> Self {
        self.write_by_name("FUEL TANK LEFT MAIN QUANTITY", 1000.);
        self.write_by_name("FUEL TANK LEFT AUX QUANTITY", 1000.);
        self.write_by_name("FUEL TANK RIGHT MAIN QUANTITY", 1000.);
        self.write_by_name("FUEL TANK RIGHT AUX QUANTITY", 1000.);
        self.write_by_name("FUEL TANK CENTER QUANTITY", 0.);

        self
    }

    fn fore_aft_center_of_gravity(&self) -> f64 {
        self.query(|a| a.fuel.fore_aft_center_of_gravity())
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

#[test]
fn init() {
    let mut test_bed = test_bed_with().init_vars();

    assert!(test_bed.contains_variable_with_name("FUEL TANK LEFT MAIN QUANTITY"));
    assert!(test_bed.contains_variable_with_name("FUEL TANK LEFT AUX QUANTITY"));
    assert!(test_bed.contains_variable_with_name("FUEL TANK RIGHT MAIN QUANTITY"));
    assert!(test_bed.contains_variable_with_name("FUEL TANK RIGHT AUX QUANTITY"));
    assert!(test_bed.contains_variable_with_name("FUEL TANK CENTER QUANTITY"));

    test_bed = test_bed.and_run();

    println!("{}", test_bed.fore_aft_center_of_gravity());
}
