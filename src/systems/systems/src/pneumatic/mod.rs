//! As we've not yet modelled pneumatic systems and some pneumatic things are needed for the APU, for now this implementation will be very simple.

pub trait BleedAirValveState {
    fn bleed_air_valve_is_open(&self) -> bool;
}

pub trait Valve {
    fn is_open(&self) -> bool;
}

/// Signals to the bleed air valve what position it should move towards.
pub trait BleedAirValveController {
    fn should_open_bleed_air_valve(&self) -> bool;
}

pub struct BleedAirValve {
    open: bool,
}
impl BleedAirValve {
    pub fn new() -> Self {
        BleedAirValve { open: false }
    }

    pub fn update(&mut self, controller: &impl BleedAirValveController) {
        self.open = controller.should_open_bleed_air_valve();
    }
}
impl Valve for BleedAirValve {
    fn is_open(&self) -> bool {
        self.open
    }
}
impl Default for BleedAirValve {
    fn default() -> Self {
        Self::new()
    }
}
