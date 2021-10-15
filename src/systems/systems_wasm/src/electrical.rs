use fxhash::FxHashMap;
use std::error::Error;

use crate::SimulatorAspect;
use msfs::legacy::execute_calculator_code;
use msfs::legacy::AircraftVariable;
use systems::shared::to_bool;
use systems::simulation::{VariableIdentifier, VariableRegistry};

pub struct MsfsElectricalBuses {
    connections: FxHashMap<VariableIdentifier, ElectricalBusConnection>,
}
impl MsfsElectricalBuses {
    pub fn new() -> Self {
        Self {
            connections: FxHashMap::default(),
        }
    }

    pub fn add(
        &mut self,
        registry: &mut impl VariableRegistry,
        name: &str,
        from: usize,
        to: usize,
    ) {
        let identifier = registry.get(format!("ELEC_{}_BUS_IS_POWERED", name));
        self.connections
            .insert(identifier, ElectricalBusConnection::new(from, to));
    }
}
impl SimulatorAspect for MsfsElectricalBuses {
    fn write(&mut self, identifier: &VariableIdentifier, value: f64) -> bool {
        match self.connections.get_mut(identifier) {
            Some(connection) => connection.update(value),
            None => {}
        }

        // The powered state of a bus isn't just updated here, but should also be set as a named
        // variable, therefore we always return false here.
        false
    }
}

struct ElectricalBusConnection {
    connected: bool,
    toggle_code: String,
}
impl ElectricalBusConnection {
    fn new(from: usize, to: usize) -> Self {
        Self {
            connected: true,
            toggle_code: format!(
                "{} {} (>K:2:ELECTRICAL_BUS_TO_BUS_CONNECTION_TOGGLE)",
                from, to
            ),
        }
    }

    fn update(&mut self, value: f64) {
        let should_be_connected = (value - 1.).abs() < f64::EPSILON;
        if should_be_connected != self.connected {
            execute_calculator_code::<()>(&self.toggle_code);
            self.connected = !self.connected;
        }
    }
}

/// The default MSFS APU is still used during engine start.
/// At this moment, the engines cannot be started without it.
/// Once pneumatics and the engine model are completed, this
/// type can probably be removed.
pub struct MsfsAuxiliaryPowerUnit {
    is_available_id: VariableIdentifier,
    msfs_apu_is_on: AircraftVariable,
    fuel_valve_number: u8,
}
impl MsfsAuxiliaryPowerUnit {
    pub fn new(
        registry: &mut impl VariableRegistry,
        is_available_variable_name: String,
        fuel_valve_number: u8,
    ) -> Result<Self, Box<dyn Error>> {
        Ok(Self {
            is_available_id: registry.get(is_available_variable_name),
            msfs_apu_is_on: AircraftVariable::from("APU SWITCH", "Bool", 0)?,
            fuel_valve_number,
        })
    }

    fn toggle_fuel_valve(&self) {
        execute_calculator_code::<()>(&format!(
            "{} (>K:FUELSYSTEM_VALVE_TOGGLE)",
            self.fuel_valve_number
        ));
    }

    fn start_apu(&self) {
        // In the systems.cfg, the `apu_pct_rpm_per_second` setting
        // is set to 1000, meaning the MSFS APU starts in 1 millisecond.
        execute_calculator_code::<()>("1 (>K:APU_STARTER, Number)");
    }

    fn stop_apu(&self) {
        execute_calculator_code::<()>("1 (>K:APU_OFF_SWITCH, Number)");
    }
}
impl SimulatorAspect for MsfsAuxiliaryPowerUnit {
    fn write(&mut self, identifier: &VariableIdentifier, value: f64) -> bool {
        if identifier == &self.is_available_id {
            let is_available = to_bool(value);
            let msfs_apu_is_on = to_bool(self.msfs_apu_is_on.get());

            if is_available && !msfs_apu_is_on {
                self.toggle_fuel_valve();
                self.start_apu();
            } else if !is_available && msfs_apu_is_on {
                self.toggle_fuel_valve();
                self.stop_apu();
            }
        }

        // We only take a peek at the value, but don't write it.
        // Therefore, return false to indicate it should still be
        // written elsewhere.
        false
    }
}
