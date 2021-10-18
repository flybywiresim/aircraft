use std::collections::HashMap;
use std::error::Error;

use crate::SimulatorAspect;
use msfs::legacy::execute_calculator_code;
use msfs::legacy::AircraftVariable;
use systems::shared::to_bool;

#[derive(Default)]
pub(super) struct MsfsElectricalBuses {
    connections: HashMap<String, ElectricalBusConnection>,
}
impl MsfsElectricalBuses {
    pub(super) fn add(&mut self, name: &str, from: usize, to: usize) {
        self.connections.insert(
            format!("ELEC_{}_BUS_IS_POWERED", name),
            ElectricalBusConnection::new(from, to),
        );
    }
}
impl SimulatorAspect for MsfsElectricalBuses {
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

/// The default MSFS APU is still used during engine start.
/// At this moment, the engines cannot be started without it.
/// Once pneumatics and the engine model are completed, this
/// type can probably be removed.
pub(super) struct MsfsAuxiliaryPowerUnit {
    is_available_variable_name: String,
    msfs_apu_is_on: AircraftVariable,
    fuel_valve_number: u8,
}
impl MsfsAuxiliaryPowerUnit {
    pub(super) fn new(
        is_available_variable_name: &str,
        fuel_valve_number: u8,
    ) -> Result<Self, Box<dyn Error>> {
        Ok(Self {
            is_available_variable_name: is_available_variable_name.to_owned(),
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
    fn write(&mut self, name: &str, value: f64) -> bool {
        if name == self.is_available_variable_name {
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
