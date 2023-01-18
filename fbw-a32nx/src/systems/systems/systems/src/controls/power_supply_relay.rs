use crate::{
    shared::{ElectricalBusType, ElectricalBuses},
    simulation::SimulationElement,
};

/*
 * This module implements a standard relay to simulate redundant input sources.
 * It needs at least one update cycle to provide power to the output
 */
pub struct PowerSupplyRelay {
    primary: ElectricalBusType,
    fallback: ElectricalBusType,
    primary_powered: bool,
    fallback_powered: bool,
    primary_feedback_powered: bool,
    switch_connected_to_primary: bool,
}

impl PowerSupplyRelay {
    pub fn new(primary: ElectricalBusType, fallback: ElectricalBusType) -> Self {
        PowerSupplyRelay {
            primary,
            fallback,
            primary_powered: false,
            fallback_powered: false,
            primary_feedback_powered: false,
            switch_connected_to_primary: true,
        }
    }

    pub fn update(&mut self) {
        /*
         * The relay sends the primary output to an internal input (if the switch sources the primary).
         * This internal input is used as a source for the connected component.
         * The fallback source is directly used, if the primary source is disconnected.
         */
        if self.primary_powered {
            if self.switch_connected_to_primary {
                self.primary_feedback_powered = true;
            } else {
                self.primary_feedback_powered = false;
                self.switch_connected_to_primary = true;
            }
        } else {
            self.switch_connected_to_primary = false;
            self.primary_feedback_powered = false;
        }
    }

    pub fn output_is_powered(&self) -> bool {
        (self.switch_connected_to_primary && self.primary_feedback_powered)
            || (!self.switch_connected_to_primary && self.fallback_powered)
    }
}

impl SimulationElement for PowerSupplyRelay {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.primary_powered = buses.is_powered(self.primary);
        self.fallback_powered = buses.is_powered(self.fallback);
    }
}
