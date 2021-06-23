use std::collections::HashMap;

use msfs::legacy::execute_calculator_code;

use crate::{HandleMessage, PrePostTick, ReadWrite, SimulatorAspect};

pub struct MsfsElectricalBuses {
    connections: HashMap<String, ElectricalBusConnection>,
}
impl MsfsElectricalBuses {
    pub fn new() -> Self {
        Self {
            connections: HashMap::new(),
        }
    }

    pub fn add(&mut self, name: &str, from: usize, to: usize) {
        self.connections.insert(
            format!("ELEC_{}_BUS_IS_POWERED", name),
            ElectricalBusConnection::new(from, to),
        );
    }
}
impl SimulatorAspect for MsfsElectricalBuses {}
impl ReadWrite for MsfsElectricalBuses {
    fn write(&mut self, name: &str, value: f64) -> bool {
        if name.starts_with("ELEC_") && name.ends_with("_BUS_IS_POWERED") {
            if let Some(connection) = self.connections.get_mut(name) {
                connection.update(value);
            }
        }

        // The powered state of a bus isn't just updated here, but should also be set as a named
        // variable, therefore we always return false here.
        false
    }
}
impl HandleMessage for MsfsElectricalBuses {}
impl PrePostTick for MsfsElectricalBuses {}

struct ElectricalBusConnection {
    connected: bool,
    from: usize,
    to: usize,
}
impl ElectricalBusConnection {
    fn new(from: usize, to: usize) -> Self {
        Self {
            connected: true,
            from,
            to,
        }
    }

    fn update(&mut self, value: f64) {
        let should_be_connected = (value - 1.).abs() < f64::EPSILON;
        if should_be_connected != self.connected {
            execute_calculator_code::<()>(&format!(
                "{} {} (>K:2:ELECTRICAL_BUS_TO_BUS_CONNECTION_TOGGLE)",
                self.from, self.to
            ));
            self.connected = !self.connected;
        }
    }
}
