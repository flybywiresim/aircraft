#![cfg(any(target_arch = "wasm32", doc))]
use a320_systems::A320;
use msfs::sim_connect::{SimConnectRecv, SIMCONNECT_OBJECT_ID_USER};
use msfs::{
    legacy::{execute_calculator_code, NamedVariable},
    sim_connect::SimConnect,
    sys,
};
use std::{pin::Pin, time::Duration};
use systems_wasm::{
    f64_to_sim_connect_32k_pos, sim_connect_32k_pos_to_f64, HandleMessage,
    MsfsAircraftVariableReader, MsfsNamedVariableReaderWriter, MsfsSimulationHandler, PrePostTick,
    ReadWrite, SimulatorAspect,
};

#[msfs::gauge(name=systems)]
async fn systems(mut gauge: msfs::Gauge) -> Result<(), Box<dyn std::error::Error>> {
    let mut sim_connect = gauge.open_simconnect("systems")?;

    let mut electricity = Electricity::new();
    let mut aircraft = A320::new(&mut electricity);
    let mut msfs_simulation_handler = MsfsSimulationHandler::new(vec![
        Box::new(ElectricalBuses::new()),
        Box::new(Brakes::new(&mut sim_connect.as_mut())?),
        Box::new(create_aircraft_variable_reader()?),
        Box::new(MsfsNamedVariableReaderWriter::new("A32NX_")),
    ]);

    while let Some(event) = gauge.next_event().await {
        msfs_simulation_handler.handle(event, &mut aircraft, &mut sim_connect.as_mut())?;
    }

    Ok(())
}

fn create_aircraft_variable_reader(
) -> Result<MsfsAircraftVariableReader, Box<dyn std::error::Error>> {
    let mut reader = MsfsAircraftVariableReader::new();
    reader.add("AMBIENT TEMPERATURE", "celsius", 0)?;
    reader.add_with_additional_names(
        "EXTERNAL POWER AVAILABLE",
        "Bool",
        1,
        &vec!["OVHD_ELEC_EXT_PWR_PB_IS_AVAILABLE"],
    )?;
    reader.add("GEAR CENTER POSITION", "Percent", 0)?;
    reader.add("GEAR HANDLE POSITION", "Bool", 0)?;
    reader.add("TURB ENG CORRECTED N2", "Percent", 1)?;
    reader.add("TURB ENG CORRECTED N2", "Percent", 2)?;
    reader.add("AIRSPEED INDICATED", "Knots", 0)?;
    reader.add("FUEL TANK LEFT MAIN QUANTITY", "Pounds", 0)?;
    reader.add("UNLIMITED FUEL", "Bool", 0)?;
    reader.add("INDICATED ALTITUDE", "Feet", 0)?;
    reader.add("SIM ON GROUND", "Bool", 0)?;
    reader.add("GENERAL ENG STARTER ACTIVE", "Bool", 1)?;
    reader.add("GENERAL ENG STARTER ACTIVE", "Bool", 2)?;
    reader.add("EXIT OPEN", "Percent", 5)?;
    // TODO It is the catering door for now.
    reader.add("EXIT OPEN", "Percent", 3)?;
    reader.add("PUSHBACK ANGLE", "Radian", 0)?;
    reader.add("PUSHBACK STATE", "Enum", 0)?;
    reader.add("ANTISKID BRAKES ACTIVE", "Bool", 0)?;
    reader.add("ACCELERATION BODY Z", "feet per second squared", 0)?;
    reader.add("SURFACE TYPE", "Enum", 0)?;
    reader.add_with_additional_names(
        "APU GENERATOR SWITCH",
        "Bool",
        0,
        &vec!["OVHD_ELEC_APU_GEN_PB_IS_ON"],
    )?;
    reader.add_with_additional_names(
        "EXTERNAL POWER ON",
        "Bool",
        1,
        &vec!["OVHD_ELEC_EXT_PWR_PB_IS_ON"],
    )?;
    reader.add_with_additional_names(
        "GENERAL ENG MASTER ALTERNATOR",
        "Bool",
        1,
        &vec!["OVHD_ELEC_ENG_GEN_1_PB_IS_ON"],
    );
    reader.add_with_additional_names(
        "GENERAL ENG MASTER ALTERNATOR",
        "Bool",
        2,
        &vec!["OVHD_ELEC_ENG_GEN_2_PB_IS_ON"],
    );

    Ok(reader)
}

struct ElectricalBuses {
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
impl ElectricalBuses {
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
}
impl SimulatorAspect for ElectricalBuses {}
impl ReadWrite for ElectricalBuses {
    fn write(&mut self, name: &str, value: f64) -> bool {
        if name.starts_with("ELEC_") && name.ends_with("_BUS_IS_POWERED") {
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

        // The powered state of a bus isn't just updated here, but should also be set as a named
        // variable, therefore we always return false here.
        false
    }
}
impl HandleMessage for ElectricalBuses {}
impl PrePostTick for ElectricalBuses {}

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

struct Brakes {
    park_brake_lever_masked_input: NamedVariable,
    left_pedal_brake_masked_input: NamedVariable,
    right_pedal_brake_masked_input: NamedVariable,

    id_brake_left: sys::DWORD,
    id_brake_right: sys::DWORD,
    id_brake_keyboard: sys::DWORD,
    id_brake_left_keyboard: sys::DWORD,
    id_brake_right_keyboard: sys::DWORD,
    id_parking_brake: sys::DWORD,
    id_parking_brake_set: sys::DWORD,

    brake_left_sim_input: f64,
    brake_right_sim_input: f64,
    brake_left_sim_input_keyboard: f64,
    brake_right_sim_input_keyboard: f64,
    left_key_pressed: bool,
    right_key_pressed: bool,

    brake_left_output_to_sim: f64,
    brake_right_output_to_sim: f64,

    parking_brake_lever_is_set: bool,
}
impl Brakes {
    const KEYBOARD_PRESS_SPEED: f64 = 0.6;
    const KEYBOARD_RELEASE_SPEED: f64 = 0.3;

    fn new(sim_connect: &mut Pin<&mut SimConnect>) -> Result<Self, Box<dyn std::error::Error>> {
        Ok(Self {
            park_brake_lever_masked_input: NamedVariable::from("A32NX_PARK_BRAKE_LEVER_POS"),
            left_pedal_brake_masked_input: NamedVariable::from("A32NX_LEFT_BRAKE_PEDAL_INPUT"),
            right_pedal_brake_masked_input: NamedVariable::from("A32NX_RIGHT_BRAKE_PEDAL_INPUT"),

            // SimConnect inputs masking
            id_brake_left: sim_connect
                .map_client_event_to_sim_event("AXIS_LEFT_BRAKE_SET", true)?,
            id_brake_right: sim_connect
                .map_client_event_to_sim_event("AXIS_RIGHT_BRAKE_SET", true)?,

            id_brake_keyboard: sim_connect.map_client_event_to_sim_event("BRAKES", true)?,
            id_brake_left_keyboard: sim_connect
                .map_client_event_to_sim_event("BRAKES_LEFT", true)?,
            id_brake_right_keyboard: sim_connect
                .map_client_event_to_sim_event("BRAKES_RIGHT", true)?,

            id_parking_brake: sim_connect.map_client_event_to_sim_event("PARKING_BRAKES", true)?,
            id_parking_brake_set: sim_connect
                .map_client_event_to_sim_event("PARKING_BRAKE_SET", true)?,

            brake_left_sim_input: 0.,
            brake_right_sim_input: 0.,
            brake_left_sim_input_keyboard: 0.,
            brake_right_sim_input_keyboard: 0.,
            left_key_pressed: false,
            right_key_pressed: false,

            brake_left_output_to_sim: 0.,
            brake_right_output_to_sim: 0.,

            parking_brake_lever_is_set: true,
        })
    }

    fn set_brake_left(&mut self, simconnect_value: u32) {
        self.brake_left_sim_input = sim_connect_32k_pos_to_f64(simconnect_value);
    }

    fn set_brake_left_key_pressed(&mut self) {
        self.left_key_pressed = true;
    }

    fn set_brake_right_key_pressed(&mut self) {
        self.right_key_pressed = true;
    }

    fn update_keyboard_inputs(&mut self, delta: Duration) {
        if self.left_key_pressed {
            self.brake_left_sim_input_keyboard += delta.as_secs_f64() * Self::KEYBOARD_PRESS_SPEED;
        } else {
            self.brake_left_sim_input_keyboard -=
                delta.as_secs_f64() * Self::KEYBOARD_RELEASE_SPEED;
        }

        if self.right_key_pressed {
            self.brake_right_sim_input_keyboard += delta.as_secs_f64() * Self::KEYBOARD_PRESS_SPEED;
        } else {
            self.brake_right_sim_input_keyboard -=
                delta.as_secs_f64() * Self::KEYBOARD_RELEASE_SPEED;
        }

        self.brake_right_sim_input_keyboard = self.brake_right_sim_input_keyboard.min(1.).max(0.);
        self.brake_left_sim_input_keyboard = self.brake_left_sim_input_keyboard.min(1.).max(0.);
    }

    fn reset_keyboard_events(&mut self) {
        self.left_key_pressed = false;
        self.right_key_pressed = false;
    }

    fn transmit_masked_inputs(&mut self) {
        let park_is_set = self.parking_brake_lever_is_set as u32 as f64;
        let brake_right = self.brake_right() * 100.;
        let brake_left = self.brake_left() * 100.;
        self.park_brake_lever_masked_input.set_value(park_is_set);
        self.right_pedal_brake_masked_input.set_value(brake_right);
        self.left_pedal_brake_masked_input.set_value(brake_left);
    }

    fn transmit_client_events(
        &mut self,
        sim_connect: &mut Pin<&mut SimConnect>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        // We want to send our brake commands once per refresh event, thus doing it after a draw event
        sim_connect.transmit_client_event(
            SIMCONNECT_OBJECT_ID_USER,
            self.id_brake_left,
            self.get_brake_left_output_converted_in_simconnect_format(),
        )?;

        sim_connect.transmit_client_event(
            SIMCONNECT_OBJECT_ID_USER,
            self.id_brake_right,
            self.get_brake_right_output_converted_in_simconnect_format(),
        )?;

        Ok(())
    }

    fn set_brake_right(&mut self, simconnect_value: u32) {
        self.brake_right_sim_input = sim_connect_32k_pos_to_f64(simconnect_value);
    }

    fn brake_left(&mut self) -> f64 {
        self.brake_left_sim_input
            .max(self.brake_left_sim_input_keyboard)
    }

    fn brake_right(&mut self) -> f64 {
        self.brake_right_sim_input
            .max(self.brake_right_sim_input_keyboard)
    }

    fn set_brake_right_output(&mut self, brake_force_factor: f64) {
        self.brake_right_output_to_sim = brake_force_factor;
    }

    fn set_brake_left_output(&mut self, brake_force_factor: f64) {
        self.brake_left_output_to_sim = brake_force_factor;
    }

    fn receive_a_park_brake_event(&mut self) {
        self.parking_brake_lever_is_set = !self.parking_brake_lever_is_set;
    }

    fn receive_a_park_brake_set_event(&mut self, data: u32) {
        self.parking_brake_lever_is_set = data == 1;
    }

    fn get_brake_right_output_converted_in_simconnect_format(&mut self) -> u32 {
        f64_to_sim_connect_32k_pos(self.brake_right_output_to_sim)
    }

    fn get_brake_left_output_converted_in_simconnect_format(&mut self) -> u32 {
        f64_to_sim_connect_32k_pos(self.brake_left_output_to_sim)
    }

    fn is_park_brake_set(&self) -> f64 {
        if self.parking_brake_lever_is_set {
            1.
        } else {
            0.
        }
    }
}
impl SimulatorAspect for Brakes {}
impl ReadWrite for Brakes {
    fn read(&mut self, name: &str) -> Option<f64> {
        match name {
            "PARK_BRAKE_LEVER_POS" => Some(self.is_park_brake_set()),
            "LEFT_BRAKE_PEDAL_INPUT" => Some(self.brake_left()),
            "RIGHT_BRAKE_PEDAL_INPUT" => Some(self.brake_right()),
            _ => None,
        }
    }

    fn write(&mut self, name: &str, value: f64) -> bool {
        match name {
            "BRAKE LEFT FORCE FACTOR" => {
                self.set_brake_left_output(value);
                true
            }
            "BRAKE RIGHT FORCE FACTOR" => {
                self.set_brake_right_output(value);
                true
            }
            _ => false,
        }
    }
}
impl HandleMessage for Brakes {
    fn handle_message(&mut self, message: &SimConnectRecv) -> bool {
        match message {
            SimConnectRecv::Event(e) => {
                if e.id() == self.id_brake_left {
                    self.set_brake_left(e.data());
                    true
                } else if e.id() == self.id_brake_right {
                    self.set_brake_right(e.data());
                    true
                } else if e.id() == self.id_parking_brake {
                    self.receive_a_park_brake_event();
                    true
                } else if e.id() == self.id_parking_brake_set {
                    self.receive_a_park_brake_set_event(e.data());
                    true
                } else if e.id() == self.id_brake_keyboard {
                    self.set_brake_left_key_pressed();
                    self.set_brake_right_key_pressed();
                    true
                } else if e.id() == self.id_brake_left_keyboard {
                    self.set_brake_left_key_pressed();
                    true
                } else if e.id() == self.id_brake_right_keyboard {
                    self.set_brake_right_key_pressed();
                    true
                } else {
                    false
                }
            }
            _ => false,
        }
    }
}
impl PrePostTick for Brakes {
    fn pre_tick(&mut self, delta: Duration) {
        self.update_keyboard_inputs(delta);
    }

    fn post_tick(
        &mut self,
        sim_connect: &mut Pin<&mut SimConnect>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        self.reset_keyboard_events();
        self.transmit_client_events(sim_connect)?;
        self.transmit_masked_inputs();

        Ok(())
    }
}
