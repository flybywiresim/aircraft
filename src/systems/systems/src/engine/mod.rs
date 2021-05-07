use uom::si::f64::*;

pub mod leap_engine;

pub trait Engine {
    fn corrected_n2(&self) -> Ratio;
    fn hydraulic_pump_output_speed(&self) -> AngularVelocity;
    fn oil_pressure(&self) -> Pressure;
}
