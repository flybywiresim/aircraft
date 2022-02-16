use std::error::Error;

use crate::{ExecuteOn, MsfsAspectBuilder, Variable};
use msfs::legacy::execute_calculator_code;
use systems::shared::{to_bool, ElectricalBusType};

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
                vec![variable],
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
/// function can probably be removed.
pub(super) fn auxiliary_power_unit(
    is_available_variable: Variable,
    fuel_valve_number: u8,
) -> impl FnOnce(&mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    move |builder: &mut MsfsAspectBuilder| {
        builder.on_change(
            ExecuteOn::PostTick,
            vec![
                is_available_variable,
                Variable::aircraft("APU SWITCH", "Bool", 0),
            ],
            Box::new(move |_, values| {
                let is_available = to_bool(values[0]);
                let msfs_apu_is_on = to_bool(values[1]);

                if is_available && !msfs_apu_is_on {
                    toggle_fuel_valve(fuel_valve_number);
                    start_apu();
                } else if !is_available && msfs_apu_is_on {
                    toggle_fuel_valve(fuel_valve_number);
                    stop_apu();
                }
            }),
        );

        Ok(())
    }
}

fn toggle_fuel_valve(fuel_valve_number: u8) {
    execute_calculator_code::<()>(&format!(
        "{} (>K:FUELSYSTEM_VALVE_TOGGLE)",
        fuel_valve_number
    ));
}

fn start_apu() {
    // In the systems.cfg, the `apu_pct_rpm_per_second` setting
    // is set to 1000, meaning the MSFS APU starts in 1 millisecond.
    execute_calculator_code::<()>("1 (>K:APU_STARTER, Number)");
}

fn stop_apu() {
    execute_calculator_code::<()>("1 (>K:APU_OFF_SWITCH, Number)");
}
