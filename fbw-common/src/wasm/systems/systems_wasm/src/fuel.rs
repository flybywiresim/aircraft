#[cfg(not(target_arch = "wasm32"))]
use crate::msfs::legacy::{trigger_key_event, trigger_key_event_ex1};

#[cfg(target_arch = "wasm32")]
use msfs::legacy::{trigger_key_event, trigger_key_event_ex1};

use crate::{
    aspects::{ExecuteOn, MsfsAspectBuilder},
    Variable,
};
use msfs::sys::{KEY_ELECTRICAL_CIRCUIT_TOGGLE, KEY_FUELSYSTEM_PUMP_SET, KEY_FUELSYSTEM_VALVE_SET};
use std::error::Error;

pub(super) fn fuel_pumps(
    pump_indexes: impl IntoIterator<Item = u32>,
) -> impl FnOnce(&mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    move |builder| {
        for pump_index in pump_indexes {
            builder.copy(
                Variable::aircraft("FUELSYSTEM PUMP ACTIVE", "Bool", pump_index as _),
                Variable::aspect(&format!("FUEL_PUMP_{pump_index}_ACTIVE")),
            );

            // TODO: this event expects 2 parameters:
            // 0: pump index
            // 1: status (0 = off, 1 = on, 2 = auto)
            builder.on_change(
                ExecuteOn::PostTick,
                vec![Variable::Aspect(format!(
                    "FUEL_PUMP_{pump_index}_ACTIVE_COMMAND"
                ))],
                Box::new(move |_, new_values| {
                    let pump_state = new_values[0] as _;
                    trigger_key_event_ex1(KEY_FUELSYSTEM_PUMP_SET, pump_index, pump_state, 0, 0, 0);
                }),
            );
        }
        Ok(())
    }
}

pub(super) fn fuel_valves(
    valve_indexes: impl IntoIterator<Item = u32>,
    pump_circuit_ids: impl IntoIterator<Item = u32>,
) -> impl FnOnce(&mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    move |builder| {
        for (valve_index, circuit_id) in valve_indexes.into_iter().zip(pump_circuit_ids) {
            builder.copy(
                Variable::aircraft("FUELSYSTEM VALVE OPEN", "Bool", valve_index as _),
                Variable::aspect(&format!("FUEL_VALVE_{valve_index}_OPEN")),
            );

            // This event expects 2 parameters:
            // 0: valve index
            // 1: status (0 = closed, 1 = open)
            builder.on_change(
                ExecuteOn::PostTick,
                vec![Variable::Aspect(format!(
                    "FUEL_VALVE_{valve_index}_OPEN_COMMAND"
                ))],
                Box::new(move |_, new_values| {
                    let valve_state = new_values[0] as _;
                    trigger_key_event_ex1(
                        KEY_FUELSYSTEM_VALVE_SET,
                        valve_index,
                        valve_state,
                        0,
                        0,
                        0,
                    );
                }),
            );

            let valve_powered_variable =
                Variable::Aspect(format!("FUEL_VALVE_{valve_index}_IS_POWERED"));
            builder.init_variable(valve_powered_variable.clone(), 1.);
            builder.on_change(
                ExecuteOn::PostTick,
                vec![valve_powered_variable],
                Box::new(move |_, _| {
                    trigger_key_event(KEY_ELECTRICAL_CIRCUIT_TOGGLE, circuit_id);
                }),
            );
        }
        Ok(())
    }
}
