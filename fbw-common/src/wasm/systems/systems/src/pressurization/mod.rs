use self::{
    cabin_pressure_simulation::CabinPressureSimulation,
    pressure_valve::{PressureValve, PressureValveSignal},
};
use crate::shared::PressurizationOverheadShared;

use uom::si::{f64::*, ratio::percent};
pub mod cabin_pressure_controller;
pub mod cabin_pressure_simulation;
pub mod pressure_valve;

pub trait OutflowValveActuator {
    fn target_valve_position(
        &self,
        press_overhead: &impl PressurizationOverheadShared,
        cabin_pressure_simulation: &CabinPressureSimulation,
    ) -> Ratio;
}

pub struct OutflowValveSignal {
    target_open_amount: Ratio,
}

impl OutflowValveSignal {
    fn new(target_open_amount: Ratio) -> Self {
        Self { target_open_amount }
    }

    fn new_open() -> Self {
        Self::new(Ratio::new::<percent>(100.))
    }

    fn new_closed() -> Self {
        Self::new(Ratio::new::<percent>(0.))
    }

    fn target_open_amount(&self) -> Ratio {
        self.target_open_amount
    }
}

pub trait CabinPressure {
    fn exterior_pressure(&self) -> Pressure;
    fn cabin_pressure(&self) -> Pressure;
    fn vertical_speed(&self) -> Velocity;
}
