#![cfg(any(target_arch = "wasm32", doc))]
use a320_systems::A320;
use msfs::{
    legacy::{execute_calculator_code, AircraftVariable, NamedVariable},
    MSFSEvent,
};
use std::collections::HashMap;
use systems::simulation::{Simulation, SimulatorReaderWriter};

use msfs::sim_connect::{SimConnectRecv, SIMCONNECT_OBJECT_ID_USER};

#[msfs::sim_connect::data_definition]
struct InputOutputBrakeLeft {
    #[name = "BRAKE LEFT POSITION"]
    #[unit = "position"]
    brake_left: f64,
}
#[msfs::sim_connect::data_definition]
struct InputOutputBrakeRight {
    #[name = "BRAKE RIGHT POSITION"]
    #[unit = "Position"]
    brake_right: f64,
}
struct BrakeInput {
    brake_left_sim_input: f64,
    brake_right_sim_input: f64,
    brake_left_sim_input_keyboard: f64,
    brake_right_sim_input_keyboard: f64,

    brake_left_output_to_sim: f64,
    brake_right_output_to_sim: f64,

    parking_brake_lever_is_set: bool,
}
impl BrakeInput {
    const MIN_BRAKE_RAW_VAL_FROM_SIMCONNECT: f64 = -16384.;
    const MAX_BRAKE_RAW_VAL_FROM_SIMCONNECT: f64 = 16384.;

    const RANGE_BRAKE_RAW_VAL_FROM_SIMCONNECT: f64 =
        Self::MAX_BRAKE_RAW_VAL_FROM_SIMCONNECT - Self::MIN_BRAKE_RAW_VAL_FROM_SIMCONNECT;
    const OFFSET_BRAKE_RAW_VAL_FROM_SIMCONNECT: f64 = 16384.;

    pub fn new() -> Self {
        Self {
            brake_left_sim_input: 0.,
            brake_right_sim_input: 0.,
            brake_left_sim_input_keyboard: 0.,
            brake_right_sim_input_keyboard: 0.,

            brake_left_output_to_sim: 0.,
            brake_right_output_to_sim: 0.,

            parking_brake_lever_is_set: true,
        }
    }

    pub fn set_brake_left(&mut self, simconnect_value: u32) {
        let casted_value = (simconnect_value as i32) as f64;
        let scaled_value = (casted_value + Self::OFFSET_BRAKE_RAW_VAL_FROM_SIMCONNECT)
            / Self::RANGE_BRAKE_RAW_VAL_FROM_SIMCONNECT;
        self.brake_left_sim_input = scaled_value.min(1.).max(0.);
    }

    pub fn set_brake_left_key_pressed(&mut self) {
        self.brake_left_sim_input_keyboard += 0.1;
        self.brake_left_sim_input_keyboard.min(1.).max(0.);
    }
    pub fn set_brake_left_key_released(&mut self) {
        self.brake_left_sim_input_keyboard -= 0.1;
        self.brake_left_sim_input_keyboard.min(1.).max(0.);
    }

    pub fn set_brake_right_key_pressed(&mut self) {
        self.brake_right_sim_input_keyboard += 0.1;
        self.brake_right_sim_input_keyboard.min(1.).max(0.);
    }
    pub fn set_brake_right_key_released(&mut self) {
        self.brake_right_sim_input_keyboard -= 0.1;
        self.brake_right_sim_input_keyboard.min(1.).max(0.);
    }

    pub fn set_brake_left_percent(&mut self, percent_value: f64) {
        let scaled_value = percent_value / 100.;
        self.brake_left_sim_input = scaled_value.min(1.).max(0.);
    }

    pub fn set_brake_right(&mut self, simconnect_value: u32) {
        let casted_value = (simconnect_value as i32) as f64;
        let scaled_value = (casted_value + Self::OFFSET_BRAKE_RAW_VAL_FROM_SIMCONNECT)
            / Self::RANGE_BRAKE_RAW_VAL_FROM_SIMCONNECT;
        self.brake_right_sim_input = scaled_value.min(1.).max(0.);
    }

    pub fn set_brake_right_percent(&mut self, percent_value: f64) {
        let scaled_value = percent_value / 100.;
        self.brake_right_sim_input = scaled_value.min(1.).max(0.);
    }

    pub fn brake_left(&mut self) -> f64 {
        self.brake_left_sim_input
            .max(self.brake_left_sim_input_keyboard)
    }

    pub fn brake_right(&mut self) -> f64 {
        self.brake_right_sim_input
            .max(self.brake_right_sim_input_keyboard)
    }

    pub fn set_brake_right_output(&mut self, brake_force_factor: f64) {
        self.brake_right_output_to_sim = brake_force_factor;
    }

    pub fn set_brake_left_output(&mut self, brake_force_factor: f64) {
        self.brake_left_output_to_sim = brake_force_factor;
    }

    pub fn receive_a_park_brake_event(&mut self) {
        self.parking_brake_lever_is_set = !self.parking_brake_lever_is_set;
    }

    pub fn get_brake_right_output_converted_in_simconnect_format(&mut self) -> u32 {
        let back_to_position_format = ((self.brake_right_output_to_sim)
            * Self::RANGE_BRAKE_RAW_VAL_FROM_SIMCONNECT)
            - Self::OFFSET_BRAKE_RAW_VAL_FROM_SIMCONNECT;
        let to_i32 = back_to_position_format as i32;
        let to_u32 = to_i32 as u32;

        to_u32
    }

    pub fn get_brake_left_output_converted_in_simconnect_format(&mut self) -> u32 {
        let back_to_position_format = ((self.brake_left_output_to_sim)
            * Self::RANGE_BRAKE_RAW_VAL_FROM_SIMCONNECT)
            - Self::OFFSET_BRAKE_RAW_VAL_FROM_SIMCONNECT;
        let to_i32 = back_to_position_format as i32;
        let to_u32 = to_i32 as u32;

        to_u32
    }

    pub fn is_park_brake_set(&self) -> f64 {
        if self.parking_brake_lever_is_set {
            1.
        } else {
            0.
        }
    }
}

#[msfs::gauge(name=systems)]
async fn systems(mut gauge: msfs::Gauge) -> Result<(), Box<dyn std::error::Error>> {
    let mut sim = gauge.open_simconnect("systems")?;

    // SimConnect inputs masking
    let id_brake_left = sim.map_client_event_to_sim_event("AXIS_LEFT_BRAKE_SET", true)?;
    let id_brake_right = sim.map_client_event_to_sim_event("AXIS_RIGHT_BRAKE_SET", true)?;
    let id_parking_brake = sim.map_client_event_to_sim_event("PARKING_BRAKES", true)?;
    let id_brake_keyboard = sim.map_client_event_to_sim_event("BRAKES", true)?;
    let id_brake_left_keyboard = sim.map_client_event_to_sim_event("BRAKES_LEFT", true)?;
    let id_brake_right_keyboard = sim.map_client_event_to_sim_event("BRAKES_RIGHT", true)?;

    let mut reader_writer = A320SimulatorReaderWriter::new()?;
    let mut a320 = A320::new();
    let mut simulation = Simulation::new(&mut a320, &mut reader_writer);

    let mut key_brake_event = false;

    let mut key_brake_left_event = false;
    let mut key_brake_right_event = false;

    while let Some(event) = gauge.next_event().await {
        match event {
            MSFSEvent::PreDraw(d) => {
                simulation.tick(d.delta_time());

                // We want to send our brake commands once per refresh event, thus doing it after a draw event
                sim.transmit_client_event(
                    SIMCONNECT_OBJECT_ID_USER,
                    id_brake_left,
                    simulation.get_brake_output_left(),
                )?;

                sim.transmit_client_event(
                    SIMCONNECT_OBJECT_ID_USER,
                    id_brake_right,
                    simulation.get_brake_output_right(),
                )?;

                // Clearing keyboard events
                if key_brake_event {
                    key_brake_event = false;
                    simulation.update_brake_input_right(0 - 16384);
                    simulation.update_brake_input_left(0 - 16384);
                    //println!("CLEAR_BRAKE");
                }

                if key_brake_left_event {
                    key_brake_left_event = false;
                    simulation.update_brake_input_left(0 - 16384);
                    //println!("CLEAR_BRAKELEFT");
                }

                if key_brake_right_event {
                    key_brake_right_event = false;
                    //println!("CLEAR_BRAKERIGHT");
                    simulation.update_brake_input_right(0 - 16384);
                }
            }

            MSFSEvent::SimConnect(recv) => match recv {
                SimConnectRecv::Event(e) => {
                    if e.id() == id_brake_left {
                        simulation.update_brake_input_left(e.data());
                    }
                    if e.id() == id_brake_right {
                        simulation.update_brake_input_right(e.data());
                    }
                    if e.id() == id_parking_brake {
                        simulation.receive_a_park_brake_event();
                    }
                    if e.id() == id_brake_keyboard {
                        println!("BRAKE");
                        simulation.update_brake_input_right(16384);
                        simulation.update_brake_input_left(16384);
                        key_brake_event = true;
                    }
                    if e.id() == id_brake_left_keyboard {
                        println!("BRAKELEFT");
                        simulation.update_brake_input_left(16384);
                        key_brake_left_event = true;
                    }
                    if e.id() == id_brake_right_keyboard {
                        println!("BRAKERIGHT");
                        simulation.update_brake_input_right(16384);
                        key_brake_right_event = true;
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
    master_eng_1: AircraftVariable,
    master_eng_2: AircraftVariable,
    cargo_door_front_pos: AircraftVariable,
    cargo_door_back_pos: AircraftVariable,
    pushback_angle: AircraftVariable,
    pushback_state: AircraftVariable,
    anti_skid_activated: AircraftVariable,
    longitudinal_accel: AircraftVariable,
    surface_type: AircraftVariable,
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
            surface_type: AircraftVariable::from("SURFACE TYPE", "Enum", 0)?,
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
            "BRAKE PARKING POSITION" => self.masked_brake_input.is_park_brake_set(),
            "EXIT OPEN:5" => self.cargo_door_front_pos.get(),
            "EXIT OPEN:3" => self.cargo_door_back_pos.get(),
            "PUSHBACK ANGLE" => self.pushback_angle.get(),
            "PUSHBACK STATE" => self.pushback_state.get(),
            "ANTISKID BRAKES ACTIVE" => self.anti_skid_activated.get(),
            "BRAKE LEFT POSITION" => self.masked_brake_input.brake_left(),
            "BRAKE RIGHT POSITION" => self.masked_brake_input.brake_right(),
            "ACCELERATION BODY Z" => self.longitudinal_accel.get(),
            "SURFACE TYPE" => self.surface_type.get(),
            _ => {
                lookup_named_variable(&mut self.dynamic_named_variables, "A32NX_", name).get_value()
            }
        }
    }

    fn write(&mut self, name: &str, value: f64) {
        if name.starts_with("ELEC_") && name.ends_with("_BUS_IS_POWERED") {
            self.electrical_bus_connections.update(name, value);
        }

        if name.contains("BRAKE LEFT POSITION") {
            self.masked_brake_input.set_brake_left_output(value);
        } else if name.contains("BRAKE RIGHT POSITION") {
            self.masked_brake_input.set_brake_right_output(value);
        } else {
            let named_variable =
                lookup_named_variable(&mut self.dynamic_named_variables, "A32NX_", name);

            named_variable.set_value(value);
        }
    }

    fn update_brake_input_left(&mut self, left_raw_val: u32) {
        self.masked_brake_input.set_brake_left(left_raw_val);
    }
    fn update_brake_input_right(&mut self, right_raw_val: u32) {
        self.masked_brake_input.set_brake_right(right_raw_val);
    }
    fn get_brake_output_left(&mut self) -> u32 {
        self.masked_brake_input
            .get_brake_left_output_converted_in_simconnect_format()
    }
    fn get_brake_output_right(&mut self) -> u32 {
        self.masked_brake_input
            .get_brake_right_output_converted_in_simconnect_format()
    }
    fn receive_a_park_brake_event(&mut self) {
        self.masked_brake_input.receive_a_park_brake_event();
    }

    fn set_brake_left_key_pressed(&mut self) {
        self.masked_brake_input.set_brake_left_key_pressed();
    }
    fn set_brake_left_key_released(&mut self) {
        self.masked_brake_input.set_brake_left_key_released();
    }

    fn set_brake_right_key_pressed(&mut self) {
        self.masked_brake_input.set_brake_right_key_pressed();
    }
    fn set_brake_right_key_released(&mut self) {
        self.masked_brake_input.set_brake_left_key_released();
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
