#[cfg(not(target_arch = "wasm32"))]
use crate::msfs::{legacy::trigger_key_event, legacy::trigger_key_event_ex1};

#[cfg(target_arch = "wasm32")]
use msfs::{legacy::trigger_key_event, legacy::trigger_key_event_ex1};

use crate::{ExecuteOn, MsfsAspectBuilder, Variable};
use msfs::sys::{
    KEY_APU_BLEED_AIR_SOURCE_SET, KEY_APU_OFF_SWITCH, KEY_APU_STARTER,
    KEY_ELECTRICAL_BUS_TO_BUS_CONNECTION_TOGGLE, KEY_FUELSYSTEM_PUMP_OFF, KEY_FUELSYSTEM_PUMP_ON,
    KEY_FUELSYSTEM_VALVE_CLOSE, KEY_FUELSYSTEM_VALVE_OPEN,
};
use std::error::Error;
use systems::shared::{to_bool, ElectricalBusType};

pub(super) fn electrical_buses<const N: usize>(
    buses: [(ElectricalBusType, u32); N],
) -> impl FnOnce(&mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    move |builder: &mut MsfsAspectBuilder| {
        for bus in buses {
            const INFINITELY_POWERED_BUS_IDENTIFIER: u32 = 1;
            let variable = Variable::named(&format!("ELEC_{}_BUS_IS_POWERED", bus.0));

            builder.init_variable(variable.clone(), 1.);

            builder.on_change(
                ExecuteOn::PostTick,
                vec![variable],
                Box::new(move |_, _| {
                    trigger_key_event_ex1(
                        KEY_ELECTRICAL_BUS_TO_BUS_CONNECTION_TOGGLE,
                        INFINITELY_POWERED_BUS_IDENTIFIER,
                        bus.1,
                        0,
                        0,
                        0,
                    );
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
    apu_fuel_valve_number: u8,
    apu_fuel_pump_number: u8,
) -> impl FnOnce(&mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    move |builder: &mut MsfsAspectBuilder| {
        builder.on_change(
            ExecuteOn::PostTick,
            vec![
                is_available_variable,
                Variable::aircraft("APU SWITCH", "Bool", 0),
                Variable::aircraft("BLEED AIR APU", "Bool", 0),
                Variable::named("ASU_TURNED_ON"),
                Variable::named("APU_BLEED_AIR_VALVE_OPEN"),
            ],
            Box::new(move |_, values| {
                let is_available = to_bool(values[0]);
                let msfs_apu_is_on = to_bool(values[1]);
                let msfs_apu_bleed_on = to_bool(values[2]);
                let asu_turned_on = to_bool(values[3]);
                let apu_bleed_valve_open = to_bool(values[4]);

                if (is_available || asu_turned_on) && !msfs_apu_is_on {
                    set_fuel_valve_and_pump(apu_fuel_valve_number, apu_fuel_pump_number, true);
                    start_apu();
                } else if !is_available && !asu_turned_on && msfs_apu_is_on {
                    set_fuel_valve_and_pump(apu_fuel_valve_number, apu_fuel_pump_number, false);
                    stop_apu();
                }

                if ((is_available && apu_bleed_valve_open) || asu_turned_on) && !msfs_apu_bleed_on {
                    supply_bleed(true);
                } else if (!is_available || !apu_bleed_valve_open)
                    && !asu_turned_on
                    && msfs_apu_bleed_on
                {
                    supply_bleed(false);
                }
            }),
        );

        Ok(())
    }
}

fn set_fuel_valve_and_pump(fuel_valve_number: u8, fuel_pump_number: u8, on: bool) {
    if on {
        trigger_key_event(KEY_FUELSYSTEM_VALVE_OPEN, fuel_valve_number.into());
        trigger_key_event(KEY_FUELSYSTEM_PUMP_ON, fuel_pump_number.into());
    } else {
        trigger_key_event(KEY_FUELSYSTEM_VALVE_CLOSE, fuel_valve_number.into());
        trigger_key_event(KEY_FUELSYSTEM_PUMP_OFF, fuel_pump_number.into());
    }
}

fn start_apu() {
    // In the systems.cfg, the `apu_pct_rpm_per_second` setting
    // is set to 1000, meaning the MSFS APU starts in 1 millisecond.
    trigger_key_event(KEY_APU_STARTER, 1);
}

fn stop_apu() {
    trigger_key_event(KEY_APU_OFF_SWITCH, 1);
}

fn supply_bleed(on: bool) {
    trigger_key_event(KEY_APU_BLEED_AIR_SOURCE_SET, on.into());
}
