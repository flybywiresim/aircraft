use std::time::Duration;

use super::*;
use crate::systems::simulation::{
    test::{SimulationTestBed, TestBed, WriteByName},
    Aircraft, SimulationElement, SimulationElementVisitor,
};

struct FuelTestAircraft {
    fuel: A380Fuel,
}

impl FuelTestAircraft {
    fn new(context: &mut InitContext) -> Self {
        Self {
            fuel: A380Fuel::new(context),
        }
    }

    fn fore_aft_center_of_gravity(&self) -> f64 {
        self.fuel.fore_aft_center_of_gravity()
    }
}

impl Aircraft for FuelTestAircraft {}
impl SimulationElement for FuelTestAircraft {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.fuel.accept(visitor);

        visitor.visit(self);
    }
}

pub const MINUTES_TO_SECONDS: u64 = 60;
pub const FUEL_GALLONS_TO_KG: f64 = 3.039075693483925;

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

    fn fuel_low(mut self) -> Self {
        self.write_by_name("FUELSYSTEM TANK QUANTITY:1", 324. * FUEL_GALLONS_TO_KG);
        self.write_by_name("FUELSYSTEM TANK QUANTITY:2", 150. * FUEL_GALLONS_TO_KG);
        self.write_by_name("FUELSYSTEM TANK QUANTITY:3", 324. * FUEL_GALLONS_TO_KG);
        self.write_by_name("FUELSYSTEM TANK QUANTITY:4", 150. * FUEL_GALLONS_TO_KG);
        self.write_by_name("FUELSYSTEM TANK QUANTITY:5", 0.);

        self
    }

    fn fuel_high(mut self) -> Self {
        self.write_by_name("FUELSYSTEM TANK QUANTITY:1", 1600. * FUEL_GALLONS_TO_KG);
        self.write_by_name("FUELSYSTEM TANK QUANTITY:2", 200. * FUEL_GALLONS_TO_KG);
        self.write_by_name("FUELSYSTEM TANK QUANTITY:3", 1600. * FUEL_GALLONS_TO_KG);
        self.write_by_name("FUELSYSTEM TANK QUANTITY:4", 200. * FUEL_GALLONS_TO_KG);
        self.write_by_name("FUELSYSTEM TANK QUANTITY:5", 2000.);

        self
    }

    fn fore_aft_center_of_gravity(&self) -> f64 {
        self.query(|a: &FuelTestAircraft| a.fore_aft_center_of_gravity())
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
    let test_bed = test_bed_with().fuel_low();

    assert!(test_bed.contains_variable_with_name("FUELSYSTEM TANK QUANTITY:1"));
    assert!(test_bed.contains_variable_with_name("FUELSYSTEM TANK QUANTITY:2"));
    assert!(test_bed.contains_variable_with_name("FUELSYSTEM TANK QUANTITY:3"));
    assert!(test_bed.contains_variable_with_name("FUELSYSTEM TANK QUANTITY:4"));
    assert!(test_bed.contains_variable_with_name("FUELSYSTEM TANK QUANTITY:5"));
}

#[test]
fn low_fuel() {
    let mut test_bed = test_bed_with().fuel_low();
    test_bed = test_bed.and_run().and_stabilize();

    assert_eq!(
        (test_bed.fore_aft_center_of_gravity() * 100.).round() / 100.,
        -10.43,
        "Expected cg: -10.43, cg: {}",
        (test_bed.fore_aft_center_of_gravity() * 100.).round() / 100.,
    );
}

#[test]
fn high_fuel() {
    let mut test_bed = test_bed_with().fuel_high();
    test_bed = test_bed.and_run().and_stabilize();

    assert_eq!(
        (test_bed.fore_aft_center_of_gravity() * 100.).round() / 100.,
        -7.82,
        "Expected cg: -7.82, cg: {}",
        (test_bed.fore_aft_center_of_gravity() * 100.).round() / 100.,
    );
}
