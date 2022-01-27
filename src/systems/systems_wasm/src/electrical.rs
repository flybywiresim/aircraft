use std::error::Error;

use crate::{Aspect, ExecuteOn, MsfsAspectBuilder, Variable};
use msfs::legacy::execute_calculator_code;
use msfs::legacy::AircraftVariable;
use systems::shared::{to_bool, ElectricalBusType};
use systems::simulation::{VariableIdentifier, VariableRegistry};

pub(super) fn electrical_buses<const N: usize>(
    buses: [(ElectricalBusType, usize); N],
) -> impl FnOnce(&mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    move |builder: &mut MsfsAspectBuilder| {
        for bus in buses {
            const INFINITELY_POWERED_BUS_IDENTIFIER: usize = 1;
            let toggle_code = format!(
                "{} {} (>K:2:ELECTRICAL_BUS_TO_BUS_CONNECTION_TOGGLE)",
                INFINITELY_POWERED_BUS_IDENTIFIER, bus.1
            );
            let variable = Variable::Named(format!("ELEC_{}_BUS_IS_POWERED", bus.0));
            // MSFS' starting state has all buses connected.
            builder.init_variable(variable.clone(), 1.);
            builder.on_change(
                ExecuteOn::PostTick,
                variable,
                Box::new(move |_, _| {
                    execute_calculator_code::<()>(&toggle_code);
                }),
            );
        }

        Ok(())
    }
}

/// The default MSFS APU is still used during engine start.
/// At this moment, the engines cannot be started without it.
/// Once pneumatics and the engine model are completed, this
/// type can probably be removed.
pub(super) struct MsfsAuxiliaryPowerUnit {
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
impl Aspect for MsfsAuxiliaryPowerUnit {
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
