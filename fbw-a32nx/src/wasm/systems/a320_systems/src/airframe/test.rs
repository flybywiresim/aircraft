use super::*;
use crate::{
    payload::A320Payload,
    systems::simulation::{
        test::{SimulationTestBed, TestBed},
        Aircraft, SimulationElement, SimulationElementVisitor,
    },
};
use nalgebra::Vector3;
use std::time::Duration;
use systems::electrical::Electricity;
use systems::simulation::UpdateContext;

const FUEL_GALLONS_TO_KG: f64 = 3.039075693483925;
const MINUTES_TO_SECONDS: u64 = 60;
struct TestFuel {
    total_fuel_load: Mass,
    center_of_gravity: Vector3<f64>,
}
impl TestFuel {
    fn new(total_fuel_load: Mass, center_of_gravity: Vector3<f64>) -> Self {
        Self {
            total_fuel_load,
            center_of_gravity,
        }
    }

    fn set_fuel(&mut self, total_fuel_load: Mass, center_of_gravity: Vector3<f64>) {
        self.total_fuel_load = total_fuel_load;
        self.center_of_gravity = center_of_gravity;
    }
}
impl FuelPayload for TestFuel {
    fn total_load(&self) -> Mass {
        self.total_fuel_load
    }
    fn fore_aft_center_of_gravity(&self) -> f64 {
        self.center_of_gravity.x
    }
}
struct TestPayload {
    total_passenger_load: Mass,
    total_target_passenger_load: Mass,
    passenger_center_of_gravity: Vector3<f64>,
    passenger_target_center_of_gravity: Vector3<f64>,

    total_cargo_load: Mass,
    total_target_cargo_load: Mass,
    cargo_center_of_gravity: Vector3<f64>,
    cargo_target_center_of_gravity: Vector3<f64>,
}
impl TestPayload {
    fn new(
        total_passenger_load: Mass,
        total_target_passenger_load: Mass,
        passenger_center_of_gravity: Vector3<f64>,
        passenger_target_center_of_gravity: Vector3<f64>,

        total_cargo_load: Mass,
        total_target_cargo_load: Mass,
        cargo_center_of_gravity: Vector3<f64>,
        cargo_target_center_of_gravity: Vector3<f64>,
    ) -> Self {
        Self {
            total_passenger_load,
            total_target_passenger_load,
            passenger_center_of_gravity,
            passenger_target_center_of_gravity,

            total_cargo_load,
            total_target_cargo_load,
            cargo_center_of_gravity,
            cargo_target_center_of_gravity,
        }
    }

    fn set_passengers(&mut self, total_passenger_load: Mass, center_of_gravity: Vector3<f64>) {
        self.total_passenger_load = total_passenger_load;
        self.passenger_center_of_gravity = center_of_gravity;
    }

    fn set_target_passengers(
        &mut self,
        total_target_passenger_load: Mass,
        target_center_of_gravity: Vector3<f64>,
    ) {
        self.total_target_passenger_load = total_target_passenger_load;
        self.passenger_target_center_of_gravity = target_center_of_gravity;
    }

    fn set_cargo(&mut self, total_cargo_load: Mass, center_of_gravity: Vector3<f64>) {
        self.total_cargo_load = total_cargo_load;
        self.cargo_center_of_gravity = center_of_gravity;
    }

    fn set_target_cargo(
        &mut self,
        total_target_cargo_load: Mass,
        target_center_of_gravity: Vector3<f64>,
    ) {
        self.total_target_cargo_load = total_target_cargo_load;
        self.cargo_target_center_of_gravity = target_center_of_gravity;
    }
}

impl PassengerPayload for TestPayload {
    fn total_passenger_load(&self) -> Mass {
        self.total_passenger_load
    }

    fn total_target_passenger_load(&self) -> Mass {
        self.total_target_passenger_load
    }

    fn center_of_gravity(&self) -> Vector3<f64> {
        self.passenger_center_of_gravity
    }

    fn fore_aft_center_of_gravity(&self) -> f64 {
        self.passenger_center_of_gravity.x
    }

    fn target_center_of_gravity(&self) -> Vector3<f64> {
        self.passenger_target_center_of_gravity
    }

    fn target_fore_aft_center_of_gravity(&self) -> f64 {
        self.passenger_target_center_of_gravity.x
    }
}

impl CargoPayload for TestPayload {
    fn total_cargo_load(&self) -> Mass {
        self.total_cargo_load
    }

    fn total_target_cargo_load(&self) -> Mass {
        self.total_target_cargo_load
    }

    fn center_of_gravity(&self) -> Vector3<f64> {
        self.cargo_center_of_gravity
    }

    fn fore_aft_center_of_gravity(&self) -> f64 {
        self.cargo_center_of_gravity.x
    }

    fn target_center_of_gravity(&self) -> Vector3<f64> {
        self.cargo_target_center_of_gravity
    }

    fn target_fore_aft_center_of_gravity(&self) -> f64 {
        self.cargo_target_center_of_gravity.x
    }
}

struct AirframeTestAircraft {
    airframe: A320Airframe,
    payload: TestPayload,
    fuel: TestFuel,
}

impl AirframeTestAircraft {
    fn new(context: &mut InitContext) -> Self {
        Self {
            airframe: A320Airframe::new(context),
            fuel: TestFuel::new(Mass::default(), Vector3::zeros()),
            payload: TestPayload::new(
                Mass::default(),
                Mass::default(),
                Vector3::zeros(),
                Vector3::zeros(),
                Mass::default(),
                Mass::default(),
                Vector3::zeros(),
                Vector3::zeros(),
            ),
        }
    }

    fn zero_fuel_weight_center_of_gravity(&self) -> f64 {
        self.airframe.zero_fuel_weight_center_of_gravity()
    }

    fn gross_weight_center_of_gravity(&self) -> f64 {
        self.airframe.gross_weight_center_of_gravity()
    }

    #[allow(dead_code)]
    fn take_off_center_of_gravity(&self) -> f64 {
        self.airframe.take_off_center_of_gravity()
    }

    fn target_zero_fuel_weight_center_of_gravity(&self) -> f64 {
        self.airframe.target_zero_fuel_weight_center_of_gravity()
    }

    fn target_gross_weight_center_of_gravity(&self) -> f64 {
        self.airframe.target_gross_weight_center_of_gravity()
    }

    #[allow(dead_code)]
    fn target_take_off_center_of_gravity(&self) -> f64 {
        self.airframe.target_take_off_center_of_gravity()
    }

    fn set_passengers(&mut self, total_passenger_load: Mass, center_of_gravity: Vector3<f64>) {
        self.payload
            .set_passengers(total_passenger_load, center_of_gravity);
    }

    fn set_target_passengers(
        &mut self,
        total_target_passenger_load: Mass,
        target_center_of_gravity: Vector3<f64>,
    ) {
        self.payload
            .set_target_passengers(total_target_passenger_load, target_center_of_gravity);
    }

    fn set_cargo(&mut self, total_cargo: Mass, center_of_gravity: Vector3<f64>) {
        self.payload.set_cargo(total_cargo, center_of_gravity);
    }

    fn set_target_cargo(
        &mut self,
        total_target_cargo_load: Mass,
        target_center_of_gravity: Vector3<f64>,
    ) {
        self.payload
            .set_target_cargo(total_target_cargo_load, target_center_of_gravity);
    }

    fn set_fuel(&mut self, total_fuel_load: Mass, center_of_gravity: Vector3<f64>) {
        self.fuel.set_fuel(total_fuel_load, center_of_gravity);
    }
}
impl Aircraft for AirframeTestAircraft {
    fn update_before_power_distribution(
        &mut self,
        _context: &UpdateContext,
        _electricity: &mut Electricity,
    ) {
        self.airframe
            .update(&self.fuel, &self.payload, &self.payload);
    }
}
impl SimulationElement for AirframeTestAircraft {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.airframe.accept(visitor);

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

    fn set_passengers(
        mut self,
        total_passenger_load: Mass,
        center_of_gravity: Vector3<f64>,
    ) -> Self {
        self.command(|a| a.set_passengers(total_passenger_load, center_of_gravity));
        self
    }

    fn set_target_passengers(
        mut self,
        total_target_passenger_load: Mass,
        target_center_of_gravity: Vector3<f64>,
    ) -> Self {
        self.command(|a| {
            a.set_target_passengers(total_target_passenger_load, target_center_of_gravity)
        });
        self
    }

    fn load_cargo(mut self, total_cargo_load: Mass, center_of_gravity: Vector3<f64>) -> Self {
        self.command(|a| a.set_cargo(total_cargo_load, center_of_gravity));
        self
    }

    fn target_cargo(
        mut self,
        total_target_cargo_load: Mass,
        target_center_of_gravity: Vector3<f64>,
    ) -> Self {
        self.command(|a| a.set_target_cargo(total_target_cargo_load, target_center_of_gravity));
        self
    }

    fn set_fuel(mut self, total_fuel_load: Mass, center_of_gravity: Vector3<f64>) -> Self {
        self.command(|a| a.set_fuel(total_fuel_load, center_of_gravity));
        self
    }

    fn load_pax(self, pax_qty: i16, center_of_gravity: Vector3<f64>) -> Self {
        let payload =
            Mass::new::<kilogram>(pax_qty as f64 * A320Payload::DEFAULT_PER_PAX_WEIGHT_KG);

        self.set_passengers(payload, center_of_gravity)
    }

    fn target_pax(self, pax_qty: i16, center_of_gravity: Vector3<f64>) -> Self {
        let payload =
            Mass::new::<kilogram>(pax_qty as f64 * A320Payload::DEFAULT_PER_PAX_WEIGHT_KG);

        self.set_target_passengers(payload, center_of_gravity)
    }

    fn load_no_pax(self) -> Self {
        self.load_pax(0, Vector3::zeros())
    }

    fn load_half_pax(self) -> Self {
        self.load_pax(87, Vector3::new(-9.7966, 0., 5.1897))
    }

    fn load_full_pax(self) -> Self {
        self.load_pax(174, Vector3::new(-9.7966, 0., 5.1897))
    }

    fn target_no_pax(self) -> Self {
        self.target_pax(0, Vector3::zeros())
    }

    fn target_half_pax(self) -> Self {
        self.target_pax(87, Vector3::new(-9.7966, 0., 5.1897))
    }

    fn target_full_pax(self) -> Self {
        self.target_pax(174, Vector3::new(-9.7966, 0., 5.1897))
    }

    fn load_no_cargo(self) -> Self {
        self.load_cargo(Mass::default(), Vector3::zeros())
    }

    fn load_half_cargo(self) -> Self {
        self.load_cargo(
            Mass::new::<kilogram>(4717.5),
            Vector3::new(-14.3122, 0., 0.7476),
        )
    }

    fn load_full_cargo(self) -> Self {
        self.load_cargo(
            Mass::new::<kilogram>(9435.),
            Vector3::new(-14.3122, 0., 0.7476),
        )
    }

    fn target_no_cargo(self) -> Self {
        self.target_cargo(Mass::default(), Vector3::zeros())
    }

    #[allow(dead_code)]
    fn target_half_cargo(self) -> Self {
        self.target_cargo(
            Mass::new::<kilogram>(4717.5),
            Vector3::new(-14.3122, 0., 0.7476),
        )
    }

    fn target_full_cargo(self) -> Self {
        self.target_cargo(
            Mass::new::<kilogram>(9435.),
            Vector3::new(-14.3122, 0., 0.7476),
        )
    }

    fn load_no_fuel(self) -> Self {
        self.set_fuel(Mass::default(), Vector3::zeros())
    }

    fn load_low_fuel(self) -> Self {
        self.set_fuel(
            Mass::new::<kilogram>(948. * FUEL_GALLONS_TO_KG),
            Vector3::new(-10.8165, 0., 2.3165),
        )
    }

    fn load_high_fuel(self) -> Self {
        self.set_fuel(
            Mass::new::<kilogram>(5600. * FUEL_GALLONS_TO_KG),
            Vector3::new(-8.2951, 0., 1.9394),
        )
    }

    fn zero_fuel_weight_center_of_gravity(&self) -> f64 {
        self.query(|a| a.zero_fuel_weight_center_of_gravity())
    }

    fn gross_weight_center_of_gravity(&self) -> f64 {
        self.query(|a| a.gross_weight_center_of_gravity())
    }

    #[allow(dead_code)]
    fn take_off_center_of_gravity(&self) -> f64 {
        self.query(|a| a.take_off_center_of_gravity())
    }

    fn target_zero_fuel_weight_center_of_gravity(&self) -> f64 {
        self.query(|a| a.target_zero_fuel_weight_center_of_gravity())
    }

    fn target_gross_weight_center_of_gravity(&self) -> f64 {
        self.query(|a| a.target_gross_weight_center_of_gravity())
    }

    #[allow(dead_code)]
    fn target_take_off_center_of_gravity(&self) -> f64 {
        self.query(|a| a.target_take_off_center_of_gravity())
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
fn empty() {
    let test_bed = test_bed_with()
        .load_no_pax()
        .target_no_pax()
        .load_no_cargo()
        .target_no_cargo()
        .load_no_fuel()
        .and_run();

    let zero_fuel_weight_center_of_gravity =
        (test_bed.zero_fuel_weight_center_of_gravity() * 100.0).round() / 100.0;
    let gross_weight_center_of_gravity =
        (test_bed.gross_weight_center_of_gravity() * 100.0).round() / 100.0;

    println!("ZFW CG MAC: {}", zero_fuel_weight_center_of_gravity);
    println!("GW CG MAC: {}", gross_weight_center_of_gravity);

    assert_eq!(zero_fuel_weight_center_of_gravity, 29.98);
    assert_eq!(gross_weight_center_of_gravity, 29.98);
    // Equal when fuel is empty
    assert_eq!(
        zero_fuel_weight_center_of_gravity,
        gross_weight_center_of_gravity
    );
}

#[test]
fn low_fuel_half_pax() {
    let test_bed = test_bed_with()
        .load_half_pax()
        .target_half_pax()
        .load_no_cargo()
        .target_no_cargo()
        .load_low_fuel()
        .and_run()
        .and_stabilize();

    let zero_fuel_weight_center_of_gravity =
        (test_bed.zero_fuel_weight_center_of_gravity() * 100.0).round() / 100.0;
    let gross_weight_center_of_gravity =
        (test_bed.gross_weight_center_of_gravity() * 100.0).round() / 100.0;

    println!("ZFW CG MAC: {}", zero_fuel_weight_center_of_gravity);
    println!("GW CG MAC: {}", gross_weight_center_of_gravity);

    assert!(zero_fuel_weight_center_of_gravity > 30.);
    assert!(zero_fuel_weight_center_of_gravity < 30.5);
    assert!(gross_weight_center_of_gravity > 30.5);
    assert!(gross_weight_center_of_gravity < 31.);
}

#[test]
fn high_fuel_full_pax_full_cargo() {
    let test_bed = test_bed_with()
        .load_full_pax()
        .load_full_cargo()
        .target_full_pax()
        .target_full_cargo()
        .load_high_fuel()
        .and_run()
        .and_stabilize();

    let zero_fuel_weight_center_of_gravity =
        (test_bed.zero_fuel_weight_center_of_gravity() * 100.0).round() / 100.0;
    let gross_weight_center_of_gravity =
        (test_bed.gross_weight_center_of_gravity() * 100.0).round() / 100.0;

    println!("ZFW CG MAC: {}", zero_fuel_weight_center_of_gravity);
    println!("GW CG MAC: {}", gross_weight_center_of_gravity);

    assert!(zero_fuel_weight_center_of_gravity > 35.);
    assert!(zero_fuel_weight_center_of_gravity < 36.);
    assert!(gross_weight_center_of_gravity > 32.);
    assert!(gross_weight_center_of_gravity < 33.);
}

#[test]
fn half_pax_cargo_target_full() {
    let test_bed = test_bed_with()
        .load_half_pax()
        .target_full_pax()
        .load_half_cargo()
        .target_full_cargo()
        .load_low_fuel()
        .and_run()
        .and_stabilize();

    let zero_fuel_weight_center_of_gravity =
        (test_bed.zero_fuel_weight_center_of_gravity() * 100.0).round() / 100.0;
    let gross_weight_center_of_gravity =
        (test_bed.gross_weight_center_of_gravity() * 100.0).round() / 100.0;

    let target_zero_fuel_weight_center_of_gravity =
        (test_bed.target_zero_fuel_weight_center_of_gravity() * 100.0).round() / 100.0;
    let target_gross_weight_center_of_gravity =
        (test_bed.target_gross_weight_center_of_gravity() * 100.0).round() / 100.0;

    println!(
        "ZFW CG MAC: {} => {}",
        zero_fuel_weight_center_of_gravity, target_zero_fuel_weight_center_of_gravity
    );
    println!(
        "GW CG MAC: {} => {}",
        gross_weight_center_of_gravity, target_gross_weight_center_of_gravity
    );

    assert!(zero_fuel_weight_center_of_gravity > 33.);
    assert!(zero_fuel_weight_center_of_gravity < 34.);
    assert!(gross_weight_center_of_gravity > 33.5);
    assert!(gross_weight_center_of_gravity < 34.);

    assert!(target_zero_fuel_weight_center_of_gravity > 35.5);
    assert!(target_zero_fuel_weight_center_of_gravity < 36.);
    assert!(target_gross_weight_center_of_gravity > 35.5);
    assert!(target_gross_weight_center_of_gravity < 36.);
}
