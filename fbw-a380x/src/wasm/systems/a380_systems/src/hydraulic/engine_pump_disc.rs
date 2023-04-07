use crate::systems::{
    shared::{ElectricalBusType, ElectricalBuses},
    simulation::SimulationElement,
};

pub struct EnginePumpDisconnectionClutch {
    powered_by: ElectricalBusType,

    is_powered: bool,
    is_clutch_engaged: bool,
}
impl EnginePumpDisconnectionClutch {
    pub fn new(powered_by: ElectricalBusType) -> Self {
        Self {
            powered_by,

            is_powered: false,
            is_clutch_engaged: true,
        }
    }

    pub fn update(&mut self, disconnect: bool) {
        if disconnect && self.is_powered {
            self.is_clutch_engaged = false;
        }
    }

    pub fn is_connected(&self) -> bool {
        self.is_clutch_engaged
    }
}
impl SimulationElement for EnginePumpDisconnectionClutch {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by);
    }
}
