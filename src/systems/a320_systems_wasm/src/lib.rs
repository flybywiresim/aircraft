#![cfg(any(target_arch = "wasm32", doc))]
use a320_systems::A320;
use msfs::{
    legacy::{execute_calculator_code, AircraftVariable, NamedVariable},
    MSFSEvent,
};
use std::collections::HashMap;
use systems::simulation::{Simulation, SimulatorReaderWriter};

//use msfs::sim_connect::data_definition;
use msfs::sim_connect::SimConnectRecv;

#[msfs::sim_connect::data_definition]
struct InputOutputBrakeLeft {
    #[name = "BRAKE LEFT POSITION"]
    #[unit = "position"]
    brake_left: f64,
}
#[msfs::sim_connect::data_definition]
struct InputOutputBrakeRight {
    #[name = "BRAKE LEFT POSITION"]
    #[unit = "Position"]
    brake_right: f64,
}
struct BrakeInput {
    brake_left: f64,
    brake_right: f64,
}
impl BrakeInput {
    const MIN_BRAKE_RAW_VAL_FROM_SIMCONNECT: f64 = -16384.;
    const MAX_BRAKE_RAW_VAL_FROM_SIMCONNECT: f64 = 16384.;

    const RANGE_BRAKE_RAW_VAL_FROM_SIMCONNECT: f64 =
        Self::MAX_BRAKE_RAW_VAL_FROM_SIMCONNECT - Self::MIN_BRAKE_RAW_VAL_FROM_SIMCONNECT;
    const OFFSET_BRAKE_RAW_VAL_FROM_SIMCONNECT: f64 = 16384.;

    pub fn new() -> Self {
        Self {
            brake_left: 0.,
            brake_right: 0.,
        }
    }

    pub fn set_brake_left(&mut self, simconnect_value: u32) {
        let casted_value = (simconnect_value as i32) as f64;
        let scaled_value = (casted_value + Self::OFFSET_BRAKE_RAW_VAL_FROM_SIMCONNECT)
            / Self::RANGE_BRAKE_RAW_VAL_FROM_SIMCONNECT;
        self.brake_left = scaled_value.min(1.).max(0.);
    }

    pub fn set_brake_left_percent(&mut self, percent_value: f64) {
        let scaled_value = percent_value / 100.;
        self.brake_left = scaled_value.min(1.).max(0.);
    }

    pub fn set_brake_right(&mut self, simconnect_value: u32) {
        let casted_value = (simconnect_value as i32) as f64;
        let scaled_value = (casted_value + Self::OFFSET_BRAKE_RAW_VAL_FROM_SIMCONNECT)
            / Self::RANGE_BRAKE_RAW_VAL_FROM_SIMCONNECT;
        self.brake_right = scaled_value.min(1.).max(0.);
    }

    pub fn set_brake_right_percent(&mut self, percent_value: f64) {
        let scaled_value = percent_value / 100.;
        self.brake_right = scaled_value.min(1.).max(0.);
    }

    pub fn brake_left(&mut self) -> f64 {
        self.brake_left
    }

    pub fn brake_right(&mut self) -> f64 {
        self.brake_right
    }
}

#[msfs::gauge(name=systems)]
async fn systems(mut gauge: msfs::Gauge) -> Result<(), Box<dyn std::error::Error>> {
    // Testing simconnect input masking
    let mut sim = gauge.open_simconnect("systems")?;
    let id_brake_left = sim.map_client_event_to_sim_event("AXIS_LEFT_BRAKE_SET", true)?;
    let id_brake_right = sim.map_client_event_to_sim_event("AXIS_RIGHT_BRAKE_SET", true)?;

    let mut reader_writer = A320SimulatorReaderWriter::new()?;
    let mut a320 = A320::new();
    let mut simulation = Simulation::new(&mut a320, &mut reader_writer);

    while let Some(event) = gauge.next_event().await {
        match event {
            MSFSEvent::PreDraw(d) => simulation.tick(d.delta_time()),

            MSFSEvent::SimConnect(recv) => match recv {
                SimConnectRecv::Event(e) => {
                    if e.id() == id_brake_left {
                        simulation.update_brake_input_left(e.data());
                        // brake_inputs.set_brake_left(e.data());
                        // println!(
                        //     "eventid_simconnect brakeleft!!   L={} R= {}",
                        //     brake_inputs.brake_left, brake_inputs.brake_right
                        // );
                    }
                    if e.id() == id_brake_right {
                        simulation.update_brake_input_right(e.data());
                        // brake_inputs.set_brake_right(e.data());
                        // println!(
                        //     "eventid_simconnect brakeleft!!   L={} R= {}",
                        //     brake_inputs.brake_left, brake_inputs.brake_right
                        // );
                    }
                }
                _ => {}
            },
            _ => {}
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
    gear_handle_position: AircraftVariable,
    turb_eng_corrected_n2_1: AircraftVariable,
    turb_eng_corrected_n2_2: AircraftVariable,
    airspeed_indicated: AircraftVariable,
    indicated_altitude: AircraftVariable,
    fuel_tank_left_main_quantity: AircraftVariable,
    sim_on_ground: AircraftVariable,
    unlimited_fuel: AircraftVariable,
    parking_brake_demand: AircraftVariable,
    master_eng_1: AircraftVariable,
    master_eng_2: AircraftVariable,
    cargo_door_front_pos: AircraftVariable,
    cargo_door_back_pos: AircraftVariable,
    pushback_angle: AircraftVariable,
    pushback_state: AircraftVariable,
    anti_skid_activated: AircraftVariable,
    longitudinal_accel: AircraftVariable,
    masked_brake_input: BrakeInput,
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
            gear_handle_position: AircraftVariable::from("GEAR HANDLE POSITION", "Bool", 0)?,
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
            parking_brake_demand: AircraftVariable::from("BRAKE PARKING INDICATOR", "Bool", 0)?,
            master_eng_1: AircraftVariable::from("GENERAL ENG STARTER ACTIVE", "Bool", 1)?,
            master_eng_2: AircraftVariable::from("GENERAL ENG STARTER ACTIVE", "Bool", 2)?,
            cargo_door_front_pos: AircraftVariable::from("EXIT OPEN", "Percent", 5)?,

            // TODO It is the catering door for now.
            cargo_door_back_pos: AircraftVariable::from("EXIT OPEN", "Percent", 3)?,

            pushback_angle: AircraftVariable::from("PUSHBACK ANGLE", "Radian", 0)?,
            pushback_state: AircraftVariable::from("PUSHBACK STATE", "Enum", 0)?,
            anti_skid_activated: AircraftVariable::from("ANTISKID BRAKES ACTIVE", "Bool", 0)?,
            longitudinal_accel: AircraftVariable::from(
                "ACCELERATION BODY Z",
                "feet per second squared",
                0,
            )?,
            masked_brake_input: BrakeInput::new(),
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
            "GEAR HANDLE POSITION" => self.gear_handle_position.get(),
            "TURB ENG CORRECTED N2:1" => self.turb_eng_corrected_n2_1.get(),
            "TURB ENG CORRECTED N2:2" => self.turb_eng_corrected_n2_2.get(),
            "FUEL TANK LEFT MAIN QUANTITY" => self.fuel_tank_left_main_quantity.get(),
            "UNLIMITED FUEL" => self.unlimited_fuel.get(),
            "AIRSPEED INDICATED" => self.airspeed_indicated.get(),
            "INDICATED ALTITUDE" => self.indicated_altitude.get(),
            "SIM ON GROUND" => self.sim_on_ground.get(),
            "GENERAL ENG STARTER ACTIVE:1" => self.master_eng_1.get(),
            "GENERAL ENG STARTER ACTIVE:2" => self.master_eng_2.get(),
            "BRAKE PARKING INDICATOR" => self.parking_brake_demand.get(),
            "EXIT OPEN:5" => self.cargo_door_front_pos.get(),
            "EXIT OPEN:3" => self.cargo_door_back_pos.get(),
            "PUSHBACK ANGLE" => self.pushback_angle.get(),
            "PUSHBACK STATE" => self.pushback_state.get(),
            "ANTISKID BRAKES ACTIVE" => self.anti_skid_activated.get(),
            "BRAKE LEFT POSITION" => self.masked_brake_input.brake_left(),
            "BRAKE RIGHT POSITION" => self.masked_brake_input.brake_right(),
            "ACCELERATION BODY Z" => self.longitudinal_accel.get(),
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

    fn update_brake_input_left(&mut self, left_raw_val: u32) {
        self.masked_brake_input.set_brake_left(left_raw_val);
    }
    fn update_brake_input_right(&mut self, right_raw_val: u32) {
        self.masked_brake_input.set_brake_right(right_raw_val);
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
    ac_gnd_flt_svc_bus: ElectricalBusConnection,
    dc_bus_1: ElectricalBusConnection,
    dc_bus_2: ElectricalBusConnection,
    dc_ess_bus: ElectricalBusConnection,
    dc_ess_shed_bus: ElectricalBusConnection,
    dc_bat_bus: ElectricalBusConnection,
    dc_hot_bus_1: ElectricalBusConnection,
    dc_hot_bus_2: ElectricalBusConnection,
    dc_gnd_flt_svc_bus: ElectricalBusConnection,
}
impl ElectricalBusConnections {
    fn new() -> Self {
        Self {
            // The numbers used here are those defined for buses in the systems.cfg [ELECTRICAL] section.
            ac_bus_1: ElectricalBusConnection::new(1, 2),
            ac_bus_2: ElectricalBusConnection::new(1, 3),
            ac_ess_bus: ElectricalBusConnection::new(1, 4),
            ac_ess_shed_bus: ElectricalBusConnection::new(1, 5),
            ac_stat_inv_bus: ElectricalBusConnection::new(1, 6),
            ac_gnd_flt_svc_bus: ElectricalBusConnection::new(1, 14),
            dc_bus_1: ElectricalBusConnection::new(1, 7),
            dc_bus_2: ElectricalBusConnection::new(1, 8),
            dc_ess_bus: ElectricalBusConnection::new(1, 9),
            dc_ess_shed_bus: ElectricalBusConnection::new(1, 10),
            dc_bat_bus: ElectricalBusConnection::new(1, 11),
            dc_hot_bus_1: ElectricalBusConnection::new(1, 12),
            dc_hot_bus_2: ElectricalBusConnection::new(1, 13),
            dc_gnd_flt_svc_bus: ElectricalBusConnection::new(1, 15),
        }
    }

    fn update(&mut self, name: &str, value: f64) {
        match name {
            "ELEC_AC_1_BUS_IS_POWERED" => self.ac_bus_1.update(value),
            "ELEC_AC_2_BUS_IS_POWERED" => self.ac_bus_2.update(value),
            "ELEC_AC_ESS_BUS_IS_POWERED" => self.ac_ess_bus.update(value),
            "ELEC_AC_ESS_SHED_BUS_IS_POWERED" => self.ac_ess_shed_bus.update(value),
            "ELEC_AC_STAT_INV_BUS_IS_POWERED" => self.ac_stat_inv_bus.update(value),
            "ELEC_AC_GND_FLT_SVC_BUS_IS_POWERED" => self.ac_gnd_flt_svc_bus.update(value),
            "ELEC_DC_1_BUS_IS_POWERED" => self.dc_bus_1.update(value),
            "ELEC_DC_2_BUS_IS_POWERED" => self.dc_bus_2.update(value),
            "ELEC_DC_ESS_BUS_IS_POWERED" => self.dc_ess_bus.update(value),
            "ELEC_DC_ESS_SHED_BUS_IS_POWERED" => self.dc_ess_shed_bus.update(value),
            "ELEC_DC_BAT_BUS_IS_POWERED" => self.dc_bat_bus.update(value),
            "ELEC_DC_HOT_1_BUS_IS_POWERED" => self.dc_hot_bus_1.update(value),
            "ELEC_DC_HOT_2_BUS_IS_POWERED" => self.dc_hot_bus_2.update(value),
            "ELEC_DC_GND_FLT_SVC_BUS_IS_POWERED" => self.dc_gnd_flt_svc_bus.update(value),
            _ => panic!("No known connection for electrical bus '{}'.", name),
        }
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
