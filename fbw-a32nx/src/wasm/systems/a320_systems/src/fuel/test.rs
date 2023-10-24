use std::time::Duration;

use super::*;
use crate::systems::simulation::{
    test::{SimulationTestBed, TestBed, WriteByName},
    Aircraft, SimulationElement, SimulationElementVisitor,
};

struct FuelTestAircraft {
    fuel: A320Fuel,
}

impl FuelTestAircraft {
    fn new(context: &mut InitContext) -> Self {
        Self {
            fuel: A320Fuel::new(context),
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

const MINUTES_TO_SECONDS: u64 = 60;
const FUEL_GALLONS_TO_KG: f64 = 3.039075693483925;
const LBS_TO_KG: f64 = 0.4535934;

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
        self.write_by_name("FUEL TANK LEFT MAIN QUANTITY", 324. / FUEL_GALLONS_TO_KG);
        self.write_by_name("FUEL TANK LEFT AUX QUANTITY", 150. / FUEL_GALLONS_TO_KG);
        self.write_by_name("FUEL TANK RIGHT MAIN QUANTITY", 324. / FUEL_GALLONS_TO_KG);
        self.write_by_name("FUEL TANK RIGHT AUX QUANTITY", 150. / FUEL_GALLONS_TO_KG);
        self.write_by_name("FUEL TANK CENTER QUANTITY", 0. / FUEL_GALLONS_TO_KG);

        self.write_by_name("FUEL TOTAL QUANTITY WEIGHT", 1248. / LBS_TO_KG);

        self
    }

    fn fuel_high(mut self) -> Self {
        self.write_by_name("FUEL TANK LEFT MAIN QUANTITY", 1600. / FUEL_GALLONS_TO_KG);
        self.write_by_name("FUEL TANK LEFT AUX QUANTITY", 200. / FUEL_GALLONS_TO_KG);
        self.write_by_name("FUEL TANK RIGHT MAIN QUANTITY", 1600. / FUEL_GALLONS_TO_KG);
        self.write_by_name("FUEL TANK RIGHT AUX QUANTITY", 200. / FUEL_GALLONS_TO_KG);
        self.write_by_name("FUEL TANK CENTER QUANTITY", 0. / FUEL_GALLONS_TO_KG);
        self.write_by_name("FUEL TOTAL QUANTITY WEIGHT", 3600. / LBS_TO_KG);

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

    assert!(test_bed.contains_variable_with_name("FUEL TANK LEFT MAIN QUANTITY"));
    assert!(test_bed.contains_variable_with_name("FUEL TANK LEFT AUX QUANTITY"));
    assert!(test_bed.contains_variable_with_name("FUEL TANK RIGHT MAIN QUANTITY"));
    assert!(test_bed.contains_variable_with_name("FUEL TANK RIGHT AUX QUANTITY"));
    assert!(test_bed.contains_variable_with_name("FUEL TANK CENTER QUANTITY"));
    assert!(test_bed.contains_variable_with_name("FUEL TOTAL QUANTITY WEIGHT"));
}

#[test]
fn low_fuel() {
    let mut test_bed = test_bed_with().fuel_low();
    test_bed = test_bed.and_run().and_stabilize();

    assert_eq!(
        (test_bed.fore_aft_center_of_gravity() * 100.).round() / 100.,
        -8.22,
        "Expected cg: -8.22, cg: {}",
        (test_bed.fore_aft_center_of_gravity() * 100.).round() / 100.,
    );
}

#[test]
fn high_fuel() {
    let mut test_bed = test_bed_with().fuel_high();
    test_bed = test_bed.and_run().and_stabilize();

    assert_eq!(
        (test_bed.fore_aft_center_of_gravity() * 100.).round() / 100.,
        -8.99,
        "Expected cg: -8.99, cg: {}",
        (test_bed.fore_aft_center_of_gravity() * 100.).round() / 100.,
    );
}
