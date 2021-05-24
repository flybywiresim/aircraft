use crate::{
    simulation::UpdateContext,
};

use super::{PressureValveActuator};

use std::time::Duration;
use uom::si::{f64::*, ratio::percent,};

pub struct PressureValve {
    open_amount: Ratio,
    target_open: Ratio,
    full_travel_time: Duration,
}

impl PressureValve {
    pub fn new() -> Self {
        Self {
            open_amount: Ratio::new::<percent>(100.),
            target_open: Ratio::new::<percent>(100.),
            full_travel_time: Duration::from_secs(4), //Guessed value
        }
    }

    pub fn update<T: PressureValveActuator>(&mut self, context: &UpdateContext, actuator: &T) {
        self.target_open = actuator.target_valve_position();
        if actuator.should_open_pressure_valve() && self.open_amount() < self.target_open() {
            self.open_amount += Ratio::new::<percent>(
                self.get_valve_change_for_delta(context).min(self.target_open().get::<percent>() - self.open_amount.get::<percent>()),
            );
        } else if actuator.should_close_pressure_valve() && self.open_amount() > self.target_open() {
            self.open_amount -= Ratio::new::<percent>(
                self.get_valve_change_for_delta(context).min(self.open_amount.get::<percent>() - self.target_open().get::<percent>()),
            );
        }
    }

    fn target_open(&self) -> Ratio {
        self.target_open
    }

    fn get_valve_change_for_delta(&self, context: &UpdateContext) -> f64 {
        100. * (context.delta().as_secs_f64() / self.full_travel_time.as_secs_f64())
    }

    pub fn open_amount(&self) -> Ratio {
        self.open_amount
    }
}
