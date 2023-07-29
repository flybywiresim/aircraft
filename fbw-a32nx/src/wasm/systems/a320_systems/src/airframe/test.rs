use std::time::Duration;

use nalgebra::Vector3;
use systems::electrical::Electricity;
use systems::simulation::UpdateContext;

use super::*;
use crate::systems::simulation::{
    test::{ReadByName, SimulationTestBed, TestBed, WriteByName},
    Aircraft, SimulationElement, SimulationElementVisitor,
};

pub const FUEL_GALLONS_TO_KG: f64 = 3.039075693483925;
pub const HOURS_TO_MINUTES: u64 = 60;
pub const MINUTES_TO_SECONDS: u64 = 60;
struct TestFuel;
impl FuelPayload for TestFuel {
    fn total_load(&self) -> Mass {
        Mass::new::<kilogram>(324. * FUEL_GALLONS_TO_KG * 4.)
    }
    fn fore_aft_center_of_gravity(&self) -> f64 {
        -12.45
    }
}
struct TestPayload;

impl PassengerPayload for TestPayload {
    fn total_passenger_load(&self) -> Mass {
        Mass::default()
    }

    fn total_target_passenger_load(&self) -> Mass {
        Mass::default()
    }

    fn center_of_gravity(&self) -> Vector3<f64> {
        Vector3::zeros()
    }

    fn fore_aft_center_of_gravity(&self) -> f64 {
        0.
    }

    fn target_center_of_gravity(&self) -> Vector3<f64> {
        Vector3::zeros()
    }

    fn target_fore_aft_center_of_gravity(&self) -> f64 {
        0.
    }
}

impl CargoPayload for TestPayload {
    fn total_cargo_load(&self) -> Mass {
        Mass::default()
    }

    fn total_target_cargo_load(&self) -> Mass {
        Mass::default()
    }

    fn center_of_gravity(&self) -> Vector3<f64> {
        Vector3::zeros()
    }

    fn fore_aft_center_of_gravity(&self) -> f64 {
        0.
    }

    fn target_center_of_gravity(&self) -> Vector3<f64> {
        Vector3::zeros()
    }

    fn target_fore_aft_center_of_gravity(&self) -> f64 {
        0.
    }
}

struct AirframeTestAircraft {
    airframe: A320Airframe,
    fuel: TestFuel,
    payload: TestPayload,
}

impl AirframeTestAircraft {
    fn new(context: &mut InitContext) -> Self {
        Self {
            airframe: A320Airframe::new(context),
            fuel: TestFuel {},
            payload: TestPayload {},
        }
    }

    fn test(&mut self, on_ground: bool) {
        // self.payload.
    }
}
impl Aircraft for AirframeTestAircraft {
    fn update_before_power_distribution(
        &mut self,
        context: &UpdateContext,
        _electricity: &mut Electricity,
    ) {
        // self.payload.update(context);
        self.airframe
            .update(&self.fuel, &self.payload, &self.payload);
    }
}
impl SimulationElement for AirframeTestAircraft {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.airframe.accept(visitor);
        // self.fuel.accept(visitor);
        // self.payload.accept(visitor);

        visitor.visit(self);
    }
}

struct AirframeTestBed {
    test_bed: SimulationTestBed<AirframeTestAircraft>,
}
impl AirframeTestBed {
    fn new() -> Self {
        AirframeTestBed {
            test_bed: SimulationTestBed::new(AirframeTestAircraft::new),
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
}

impl TestBed for AirframeTestBed {
    type Aircraft = AirframeTestAircraft;

    fn test_bed(&self) -> &SimulationTestBed<AirframeTestAircraft> {
        &self.test_bed
    }

    fn test_bed_mut(&mut self) -> &mut SimulationTestBed<AirframeTestAircraft> {
        &mut self.test_bed
    }
}

fn test_bed() -> AirframeTestBed {
    AirframeTestBed::new()
}

fn test_bed_with() -> AirframeTestBed {
    test_bed()
}

#[test]
fn init() {
    let mut test_bed = test_bed_with();
    test_bed = test_bed.and_run();
}
