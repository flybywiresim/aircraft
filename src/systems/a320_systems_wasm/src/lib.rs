#![cfg(any(target_arch = "wasm32", doc))]
use a320_systems::A320;
use msfs::{
    legacy::{AircraftVariable, NamedVariable, CompiledCalculatorCode},
    MSFSEvent,
};
use std::collections::HashMap;
use systems::simulation::{Simulation, SimulatorReaderWriter};

#[msfs::gauge(name=systems)]
async fn systems(mut gauge: msfs::Gauge) -> Result<(), Box<dyn std::error::Error>> {
    let mut reader_writer = A320SimulatorReaderWriter::new()?;
    let mut a320 = A320::new();
    let mut simulation = Simulation::new(&mut a320, &mut reader_writer);

    while let Some(event) = gauge.next_event().await {
        if let MSFSEvent::PreDraw(d) = event {
            simulation.tick(d.delta_time());
        }
    }

    Ok(())
}

struct A320SimulatorReaderWriter {
    dynamic_named_variables: HashMap<String, NamedVariable>,
    electrical_bus_connections: ElectricalBusConnections,

    ambient_temperature: AircraftVariable,
    apu_generator_pb_on: AircraftVariable,
    external_power_available: AircraftVariable,
    external_power_pb_on: AircraftVariable,
    engine_generator_1_pb_on: AircraftVariable,
    engine_generator_2_pb_on: AircraftVariable,
    gear_center_position: AircraftVariable,
    turb_eng_corrected_n2_1: AircraftVariable,
    turb_eng_corrected_n2_2: AircraftVariable,
    airspeed_indicated: AircraftVariable,
    indicated_altitude: AircraftVariable,
    fuel_tank_left_main_quantity: AircraftVariable,
    sim_on_ground: AircraftVariable,
    unlimited_fuel: AircraftVariable,
}
impl A320SimulatorReaderWriter {
    fn new() -> Result<Self, Box<dyn std::error::Error>> {
        Ok(A320SimulatorReaderWriter {
            dynamic_named_variables: HashMap::new(),
            electrical_bus_connections: ElectricalBusConnections::new(),

            ambient_temperature: AircraftVariable::from("AMBIENT TEMPERATURE", "celsius", 0)?,
            apu_generator_pb_on: AircraftVariable::from("APU GENERATOR SWITCH", "Bool", 0)?,
            external_power_available: AircraftVariable::from(
                "EXTERNAL POWER AVAILABLE",
                "Bool",
                1,
            )?,
            external_power_pb_on: AircraftVariable::from("EXTERNAL POWER ON", "Bool", 1)?,
            engine_generator_1_pb_on: AircraftVariable::from(
                "GENERAL ENG MASTER ALTERNATOR",
                "Bool",
                1,
            )?,
            engine_generator_2_pb_on: AircraftVariable::from(
                "GENERAL ENG MASTER ALTERNATOR",
                "Bool",
                2,
            )?,
            gear_center_position: AircraftVariable::from("GEAR CENTER POSITION", "Percent", 0)?,
            turb_eng_corrected_n2_1: AircraftVariable::from("TURB ENG CORRECTED N2", "Percent", 1)?,
            turb_eng_corrected_n2_2: AircraftVariable::from("TURB ENG CORRECTED N2", "Percent", 2)?,
            airspeed_indicated: AircraftVariable::from("AIRSPEED INDICATED", "Knots", 0)?,
            indicated_altitude: AircraftVariable::from("INDICATED ALTITUDE", "Feet", 0)?,
            fuel_tank_left_main_quantity: AircraftVariable::from(
                "FUEL TANK LEFT MAIN QUANTITY",
                "Pounds",
                0,
            )?,
            sim_on_ground: AircraftVariable::from("SIM ON GROUND", "Bool", 0)?,
            unlimited_fuel: AircraftVariable::from("UNLIMITED FUEL", "Bool", 0)?,
        })
    }
}
impl SimulatorReaderWriter for A320SimulatorReaderWriter {
    fn read(&mut self, name: &str) -> f64 {
        match name {
            "OVHD_ELEC_APU_GEN_PB_IS_ON" => self.apu_generator_pb_on.get(),
            "OVHD_ELEC_EXT_PWR_PB_IS_AVAILABLE" => self.external_power_available.get(),
            "OVHD_ELEC_EXT_PWR_PB_IS_ON" => self.external_power_pb_on.get(),
            "OVHD_ELEC_ENG_GEN_1_PB_IS_ON" => self.engine_generator_1_pb_on.get(),
            "OVHD_ELEC_ENG_GEN_2_PB_IS_ON" => self.engine_generator_2_pb_on.get(),
            "AMBIENT TEMPERATURE" => self.ambient_temperature.get(),
            "EXTERNAL POWER AVAILABLE:1" => self.external_power_available.get(),
            "GEAR CENTER POSITION" => self.gear_center_position.get(),
            "TURB ENG CORRECTED N2:1" => self.turb_eng_corrected_n2_1.get(),
            "TURB ENG CORRECTED N2:2" => self.turb_eng_corrected_n2_2.get(),
            "FUEL TANK LEFT MAIN QUANTITY" => self.fuel_tank_left_main_quantity.get(),
            "UNLIMITED FUEL" => self.unlimited_fuel.get(),
            "AIRSPEED INDICATED" => self.airspeed_indicated.get(),
            "INDICATED ALTITUDE" => self.indicated_altitude.get(),
            "SIM ON GROUND" => self.sim_on_ground.get(),
            _ => {
                lookup_named_variable(&mut self.dynamic_named_variables, "A32NX_", name).get_value()
            }
        }
    }

    fn write(&mut self, name: &str, value: f64) {
        if name.starts_with("ELEC_") && name.ends_with("_BUS_IS_POWERED") {
            self.electrical_bus_connections.update(name, value);
        }

        let named_variable =
            lookup_named_variable(&mut self.dynamic_named_variables, "A32NX_", name);

        named_variable.set_value(value);
    }
}

fn lookup_named_variable<'a>(
    collection: &'a mut HashMap<String, NamedVariable>,
    key_prefix: &str,
    key: &str,
) -> &'a mut NamedVariable {
    let key = format!("{}{}", key_prefix, key);

    collection
        .entry(key.clone())
        .or_insert_with(|| NamedVariable::from(&key))
}

struct ElectricalBusConnections {
    ac_bus_1: ElectricalBusConnection,
    ac_bus_2: ElectricalBusConnection,
    ac_ess_bus: ElectricalBusConnection,
    ac_ess_shed_bus: ElectricalBusConnection,
    ac_stat_inv_bus: ElectricalBusConnection,
    dc_bus_1: ElectricalBusConnection,
    dc_bus_2: ElectricalBusConnection,
    dc_ess_bus: ElectricalBusConnection,
    dc_ess_shed_bus: ElectricalBusConnection,
    dc_bat_bus: ElectricalBusConnection,
    dc_hot_bus_1: ElectricalBusConnection,
    dc_hot_bus_2: ElectricalBusConnection,
}
impl ElectricalBusConnections {
    const INFINIBAT_BUS: usize = 12;

    fn new() -> Self {
        Self {
            // The numbers used here are those defined for buses in the systems.cfg [ELECTRICAL] section.
            ac_bus_1: ElectricalBusConnection::new(13, ElectricalBusConnections::INFINIBAT_BUS),
            ac_bus_2: ElectricalBusConnection::new(14, ElectricalBusConnections::INFINIBAT_BUS),
            ac_ess_bus: ElectricalBusConnection::new(15, ElectricalBusConnections::INFINIBAT_BUS),
            ac_ess_shed_bus: ElectricalBusConnection::new(16, ElectricalBusConnections::INFINIBAT_BUS),
            ac_stat_inv_bus: ElectricalBusConnection::new(17, ElectricalBusConnections::INFINIBAT_BUS),
            dc_bus_1: ElectricalBusConnection::new(18, ElectricalBusConnections::INFINIBAT_BUS),
            dc_bus_2: ElectricalBusConnection::new(19, ElectricalBusConnections::INFINIBAT_BUS),
            dc_ess_bus: ElectricalBusConnection::new(20, ElectricalBusConnections::INFINIBAT_BUS),
            dc_ess_shed_bus: ElectricalBusConnection::new(21, ElectricalBusConnections::INFINIBAT_BUS),
            dc_bat_bus: ElectricalBusConnection::new(22, ElectricalBusConnections::INFINIBAT_BUS),
            dc_hot_bus_1: ElectricalBusConnection::new(23, ElectricalBusConnections::INFINIBAT_BUS),
            dc_hot_bus_2: ElectricalBusConnection::new(24, ElectricalBusConnections::INFINIBAT_BUS),
        }
    }

    fn update(&mut self, name: &str, value: f64) {
        match name {
            "ELEC_AC_1_BUS_IS_POWERED" => self.ac_bus_1.update(value),
            "ELEC_AC_2_BUS_IS_POWERED" => self.ac_bus_2.update(value),
            "ELEC_AC_ESS_BUS_IS_POWERED" => self.ac_ess_bus.update(value),
            "ELEC_AC_ESS_SHED_BUS_IS_POWERED" => self.ac_ess_shed_bus.update(value),
            "ELEC_AC_STAT_INV_BUS_IS_POWERED" => self.ac_stat_inv_bus.update(value),
            "ELEC_DC_1_BUS_IS_POWERED" => self.dc_bus_1.update(value),
            "ELEC_DC_2_BUS_IS_POWERED" => self.dc_bus_2.update(value),
            "ELEC_DC_ESS_BUS_IS_POWERED" => self.dc_ess_bus.update(value),
            "ELEC_DC_ESS_SHED_BUS_IS_POWERED" => self.dc_ess_shed_bus.update(value),
            "ELEC_DC_BAT_BUS_IS_POWERED" => self.dc_bat_bus.update(value),
            "ELEC_DC_HOT_1_BUS_IS_POWERED" => self.dc_hot_bus_1.update(value),
            "ELEC_DC_HOT_2_BUS_IS_POWERED" => self.dc_hot_bus_2.update(value),
            _ => panic!("No known connection for electrical bus '{}'.", name),
        }
    }
}

struct ElectricalBusConnection {
    connected: bool,
    toggle_code: CompiledCalculatorCode,
}
impl ElectricalBusConnection {
    fn new(from: usize, to: usize) -> Self {
        Self {
            connected: false,
            toggle_code: CompiledCalculatorCode::new(&format!("{} {} (>K:2:ELECTRICAL_BUS_TO_BUS_CONNECTION_TOGGLE)", from, to)).unwrap(),
        }
    }

    fn update(&mut self, value: f64) {
        let should_be_connected = (value - 1.).abs() < f64::EPSILON;
        if should_be_connected != self.connected {
            println!("execute");
            self.toggle_code.execute::<()>();
            self.connected = !self.connected;
        }
    }
}
