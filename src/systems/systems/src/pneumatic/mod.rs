//! As we've not yet modelled pneumatic systems and some pneumatic things are needed for the APU, for now this implementation will be very simple.

use crate::shared::{ControllerSignal, PneumaticValve, PneumaticValveSignal};

pub trait BleedAirValveState {
    fn bleed_air_valve_is_open(&self) -> bool;
}

pub struct BleedAirValve {
    open: bool,
}
impl BleedAirValve {
    pub fn new() -> Self {
        BleedAirValve { open: false }
    }

    pub fn update(&mut self, controller: &impl ControllerSignal<PneumaticValveSignal>) {
        match controller.signal() {
            Some(PneumaticValveSignal::Open) => {
                self.open = true;
            }
            // When no signal is received, the valve should automatically close.
            // Note that when BLEED is implemented this should also take into account
            // bleed air pressure, as no pressure should also result in the valve closing.
            Some(PneumaticValveSignal::Close) | None => {
                self.open = false;
            }
        }
    }
}
impl PneumaticValve for BleedAirValve {
    fn is_open(&self) -> bool {
        self.open
    }
}
impl Default for BleedAirValve {
    fn default() -> Self {
        Self::new()
    }
}
