#![cfg(any(target_arch = "wasm32", doc))]
use a320_systems::A320;
use msfs::sim_connect::{SimConnectRecv, SIMCONNECT_OBJECT_ID_USER};
use msfs::{
    legacy::{AircraftVariable, NamedVariable},
    sim_connect::SimConnect,
    sys,
};
use std::{
    pin::Pin,
    time::{Duration, Instant},
};
use systems::failures::FailureType;
use systems::simulation::{Simulation, VariableIdentifier, VariableRegistry};
use systems_wasm::{
    electrical::{MsfsAuxiliaryPowerUnit, MsfsElectricalBuses},
    f64_to_sim_connect_32k_pos,
    failures::Failures,
    sim_connect_32k_pos_to_f64, MsfsSimulationHandler, MsfsVariableRegistry, SimulatorAspect,
};

#[msfs::gauge(name=systems)]
async fn systems(mut gauge: msfs::Gauge) -> Result<(), Box<dyn std::error::Error>> {
    let mut sim_connect = gauge.open_simconnect("systems")?;

    let mut variable_registry = MsfsVariableRegistry::new("A32NX_".to_owned());
    add_aircraft_variables(&mut variable_registry)?;

    let mut simulation = Simulation::new(A320::new, &mut variable_registry);
    let mut msfs_simulation_handler = MsfsSimulationHandler::new(
        vec![
            Box::new(create_electrical_buses(&mut variable_registry)),
            Box::new(MsfsAuxiliaryPowerUnit::new(
                &mut variable_registry,
                "OVHD_APU_START_PB_IS_AVAILABLE".to_owned(),
                8,
            )?),
            Box::new(Brakes::new(
                &mut variable_registry,
                &mut sim_connect.as_mut(),
            )?),
            Box::new(Autobrakes::new(
                &mut variable_registry,
                &mut sim_connect.as_mut(),
            )?),
            Box::new(CargoDoors::new(
                &mut variable_registry,
                &mut sim_connect.as_mut(),
            )?),
            Box::new(variable_registry),
        ],
        create_failures(),
    );

    while let Some(event) = gauge.next_event().await {
        msfs_simulation_handler.handle(event, &mut simulation, &mut sim_connect.as_mut())?;
    }

    Ok(())
}

fn add_aircraft_variables(
    registry: &mut MsfsVariableRegistry,
) -> Result<(), Box<dyn std::error::Error>> {
    registry.add_aircraft_variable("AMBIENT TEMPERATURE", "celsius", 0)?;
    registry.add_aircraft_variable("TOTAL AIR TEMPERATURE", "celsius", 0)?;
    registry.add_aircraft_variable_with_additional_names(
        "EXTERNAL POWER AVAILABLE",
        "Bool",
        1,
        &vec!["OVHD_ELEC_EXT_PWR_PB_IS_AVAILABLE"],
    )?;
    registry.add_aircraft_variable("GEAR CENTER POSITION", "Percent", 0)?;
    registry.add_aircraft_variable("GEAR ANIMATION POSITION", "Percent", 0)?;
    registry.add_aircraft_variable("GEAR ANIMATION POSITION", "Percent", 1)?;
    registry.add_aircraft_variable("GEAR ANIMATION POSITION", "Percent", 2)?;
    registry.add_aircraft_variable("GEAR HANDLE POSITION", "Bool", 0)?;
    registry.add_aircraft_variable("TURB ENG CORRECTED N1", "Percent", 1)?;
    registry.add_aircraft_variable("TURB ENG CORRECTED N1", "Percent", 2)?;
    registry.add_aircraft_variable("TURB ENG CORRECTED N2", "Percent", 1)?;
    registry.add_aircraft_variable("TURB ENG CORRECTED N2", "Percent", 2)?;
    registry.add_aircraft_variable("AIRSPEED INDICATED", "Knots", 0)?;
    registry.add_aircraft_variable("INDICATED ALTITUDE", "Feet", 0)?;
    registry.add_aircraft_variable("AIRSPEED MACH", "Mach", 0)?;
    registry.add_aircraft_variable("AIRSPEED TRUE", "Knots", 0)?;
    registry.add_aircraft_variable("VELOCITY WORLD Y", "feet per minute", 0)?;
    registry.add_aircraft_variable("AMBIENT WIND DIRECTION", "Degrees", 0)?;
    registry.add_aircraft_variable("AMBIENT WIND VELOCITY", "Knots", 0)?;
    registry.add_aircraft_variable("GPS GROUND SPEED", "Knots", 0)?;
    registry.add_aircraft_variable("GPS GROUND MAGNETIC TRACK", "Degrees", 0)?;
    registry.add_aircraft_variable("PLANE PITCH DEGREES", "Degrees", 0)?;
    registry.add_aircraft_variable("PLANE BANK DEGREES", "Degrees", 0)?;
    registry.add_aircraft_variable("PLANE HEADING DEGREES MAGNETIC", "Degrees", 0)?;
    registry.add_aircraft_variable("FUEL TANK LEFT MAIN QUANTITY", "Pounds", 0)?;
    registry.add_aircraft_variable("UNLIMITED FUEL", "Bool", 0)?;
    registry.add_aircraft_variable("INDICATED ALTITUDE", "Feet", 0)?;
    registry.add_aircraft_variable("AMBIENT PRESSURE", "inHg", 0)?;
    registry.add_aircraft_variable("SEA LEVEL PRESSURE", "Millibars", 0)?;
    registry.add_aircraft_variable("SIM ON GROUND", "Bool", 0)?;
    registry.add_aircraft_variable("GENERAL ENG STARTER ACTIVE", "Bool", 1)?;
    registry.add_aircraft_variable("GENERAL ENG STARTER ACTIVE", "Bool", 2)?;
    registry.add_aircraft_variable("PUSHBACK ANGLE", "Radian", 0)?;
    registry.add_aircraft_variable("PUSHBACK STATE", "Enum", 0)?;
    registry.add_aircraft_variable("ANTISKID BRAKES ACTIVE", "Bool", 0)?;
    registry.add_aircraft_variable("ACCELERATION BODY Z", "feet per second squared", 0)?;
    registry.add_aircraft_variable("ACCELERATION BODY X", "feet per second squared", 0)?;
    registry.add_aircraft_variable("ACCELERATION BODY Y", "feet per second squared", 0)?;

    registry.add_aircraft_variable_with_additional_names(
        "APU GENERATOR SWITCH",
        "Bool",
        0,
        &vec!["OVHD_ELEC_APU_GEN_PB_IS_ON"],
    )?;
    registry.add_aircraft_variable_with_additional_names(
        "EXTERNAL POWER ON",
        "Bool",
        1,
        &vec!["OVHD_ELEC_EXT_PWR_PB_IS_ON"],
    )?;
    registry.add_aircraft_variable_with_additional_names(
        "GENERAL ENG MASTER ALTERNATOR",
        "Bool",
        1,
        &vec!["OVHD_ELEC_ENG_GEN_1_PB_IS_ON"],
    )?;
    registry.add_aircraft_variable_with_additional_names(
        "GENERAL ENG MASTER ALTERNATOR",
        "Bool",
        2,
        &vec!["OVHD_ELEC_ENG_GEN_2_PB_IS_ON"],
    )?;
    registry.add_aircraft_variable("PLANE LATITUDE", "degree latitude", 0)?;
    registry.add_aircraft_variable("PLANE LONGITUDE", "degree longitude", 0)?;
    registry.add_aircraft_variable("TRAILING EDGE FLAPS LEFT PERCENT", "Percent", 0)?;
    registry.add_aircraft_variable("TRAILING EDGE FLAPS RIGHT PERCENT", "Percent", 0)?;

    Ok(())
}

fn create_electrical_buses(registry: &mut impl VariableRegistry) -> MsfsElectricalBuses {
    let mut buses = MsfsElectricalBuses::new();
    // The numbers used here are those defined for buses in the systems.cfg [ELECTRICAL] section.
    buses.add(registry, "AC_1", 1, 2);
    buses.add(registry, "AC_2", 1, 3);
    buses.add(registry, "AC_ESS", 1, 4);
    buses.add(registry, "AC_ESS_SHED", 1, 5);
    buses.add(registry, "AC_STAT_INV", 1, 6);
    buses.add(registry, "AC_GND_FLT_SVC", 1, 14);
    buses.add(registry, "DC_1", 1, 7);
    buses.add(registry, "DC_2", 1, 8);
    buses.add(registry, "DC_ESS", 1, 9);
    buses.add(registry, "DC_ESS_SHED", 1, 10);
    buses.add(registry, "DC_BAT", 1, 11);
    buses.add(registry, "DC_HOT_1", 1, 12);
    buses.add(registry, "DC_HOT_2", 1, 13);
    buses.add(registry, "DC_GND_FLT_SVC", 1, 15);

    buses
}

fn create_failures() -> Failures {
    let mut failures = Failures::new(
        NamedVariable::from("A32NX_FAILURE_ACTIVATE"),
        NamedVariable::from("A32NX_FAILURE_DEACTIVATE"),
    );

    failures.add(24_000, FailureType::TransformerRectifier(1));
    failures.add(24_001, FailureType::TransformerRectifier(2));
    failures.add(24_002, FailureType::TransformerRectifier(3));

    failures
}

struct Autobrakes {
    autobrake_disarm_id: VariableIdentifier,
    ovhd_autobrk_low_on_is_pressed_id: VariableIdentifier,
    ovhd_autobrk_med_on_is_pressed_id: VariableIdentifier,
    ovhd_autobrk_max_on_is_pressed_id: VariableIdentifier,

    id_mode_max: sys::DWORD,
    id_mode_med: sys::DWORD,
    id_mode_low: sys::DWORD,
    id_disarm: sys::DWORD,

    low_mode_panel_pushbutton: NamedVariable,
    med_mode_panel_pushbutton: NamedVariable,
    max_mode_panel_pushbutton: NamedVariable,

    low_mode_requested: bool,
    med_mode_requested: bool,
    max_mode_requested: bool,
    disarm_requested: bool,

    last_button_press: Instant,
}
impl Autobrakes {
    // Time to freeze keyboard events once key is released. This will keep key_pressed to TRUE internally when key is actually staying pressed
    // but keyboard events wrongly goes to false then back to true for a short period of time due to poor key event handling
    const DEFAULT_REARMING_DURATION: Duration = Duration::from_millis(1500);

    fn new(
        registry: &mut impl VariableRegistry,
        sim_connect: &mut Pin<&mut SimConnect>,
    ) -> Result<Self, Box<dyn std::error::Error>> {
        Ok(Self {
            autobrake_disarm_id: registry.get("AUTOBRAKE_DISARM".to_owned()),
            ovhd_autobrk_low_on_is_pressed_id: registry
                .get("OVHD_AUTOBRK_LOW_ON_IS_PRESSED".to_owned()),
            ovhd_autobrk_med_on_is_pressed_id: registry
                .get("OVHD_AUTOBRK_MED_ON_IS_PRESSED".to_owned()),
            ovhd_autobrk_max_on_is_pressed_id: registry
                .get("OVHD_AUTOBRK_MAX_ON_IS_PRESSED".to_owned()),

            // SimConnect inputs masking
            id_mode_max: sim_connect.map_client_event_to_sim_event("AUTOBRAKE_HI_SET", false)?,
            id_mode_med: sim_connect.map_client_event_to_sim_event("AUTOBRAKE_MED_SET", false)?,
            id_mode_low: sim_connect.map_client_event_to_sim_event("AUTOBRAKE_LO_SET", false)?,
            id_disarm: sim_connect.map_client_event_to_sim_event("AUTOBRAKE_DISARM", false)?,

            low_mode_panel_pushbutton: NamedVariable::from("A32NX_OVHD_AUTOBRK_LOW_ON_IS_PRESSED"),
            med_mode_panel_pushbutton: NamedVariable::from("A32NX_OVHD_AUTOBRK_MED_ON_IS_PRESSED"),
            max_mode_panel_pushbutton: NamedVariable::from("A32NX_OVHD_AUTOBRK_MAX_ON_IS_PRESSED"),

            low_mode_requested: false,
            med_mode_requested: false,
            max_mode_requested: false,
            disarm_requested: false,

            last_button_press: Instant::now(),
        })
    }

    fn synchronise_with_sim(&mut self) {
        if self.low_mode_panel_pushbutton.get_value() {
            self.set_mode_low();
        }
        if self.med_mode_panel_pushbutton.get_value() {
            self.set_mode_med();
        }
        if self.max_mode_panel_pushbutton.get_value() {
            self.set_mode_max();
        }
    }

    fn reset_events(&mut self) {
        if self.last_button_press.elapsed() > Self::DEFAULT_REARMING_DURATION {
            self.max_mode_requested = false;
            self.med_mode_requested = false;
            self.low_mode_requested = false;
        }
        self.disarm_requested = false;
    }

    fn on_receive_pushbutton_event(&mut self) {
        self.last_button_press = Instant::now();
    }

    fn set_mode_max(&mut self) {
        self.max_mode_requested = true;
        self.med_mode_requested = false;
        self.low_mode_requested = false;
        self.on_receive_pushbutton_event();
    }

    fn set_mode_med(&mut self) {
        self.med_mode_requested = true;
        self.max_mode_requested = false;
        self.low_mode_requested = false;
        self.on_receive_pushbutton_event();
    }

    fn set_mode_low(&mut self) {
        self.low_mode_requested = true;
        self.med_mode_requested = false;
        self.max_mode_requested = false;
        self.on_receive_pushbutton_event();
    }

    fn set_disarm(&mut self) {
        self.disarm_requested = true;
    }
}
impl SimulatorAspect for Autobrakes {
    fn read(&mut self, identifier: &VariableIdentifier) -> Option<f64> {
        if identifier == &self.autobrake_disarm_id {
            Some(self.disarm_requested as u8 as f64)
        } else if identifier == &self.ovhd_autobrk_low_on_is_pressed_id {
            Some(self.low_mode_requested as u8 as f64)
        } else if identifier == &self.ovhd_autobrk_med_on_is_pressed_id {
            Some(self.med_mode_requested as u8 as f64)
        } else if identifier == &self.ovhd_autobrk_max_on_is_pressed_id {
            Some(self.max_mode_requested as u8 as f64)
        } else {
            None
        }
    }

    fn handle_message(&mut self, message: &SimConnectRecv) -> bool {
        match message {
            SimConnectRecv::Event(e) => {
                if e.id() == self.id_mode_low {
                    self.set_mode_low();
                    true
                } else if e.id() == self.id_mode_med {
                    self.set_mode_med();
                    true
                } else if e.id() == self.id_mode_max {
                    self.set_mode_max();
                    true
                } else if e.id() == self.id_disarm {
                    self.set_disarm();
                    true
                } else {
                    false
                }
            }
            _ => false,
        }
    }

    fn pre_tick(&mut self, _: Duration) {
        self.synchronise_with_sim();
    }

    fn post_tick(
        &mut self,
        _: &mut Pin<&mut SimConnect>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        self.reset_events();

        Ok(())
    }
}

struct Brakes {
    park_brak_lever_pos_id: VariableIdentifier,
    left_brake_pedal_input_id: VariableIdentifier,
    right_brake_pedal_input_id: VariableIdentifier,
    brake_left_force_factor_id: VariableIdentifier,
    brake_right_force_factor_id: VariableIdentifier,

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
    last_transmitted_park_brake_lever_position: f64,
}
impl Brakes {
    const KEYBOARD_PRESS_SPEED: f64 = 0.6;
    const KEYBOARD_RELEASE_SPEED: f64 = 0.3;

    fn new(
        registry: &mut impl VariableRegistry,
        sim_connect: &mut Pin<&mut SimConnect>,
    ) -> Result<Self, Box<dyn std::error::Error>> {
        Ok(Self {
            park_brak_lever_pos_id: registry.get("PARK_BRAKE_LEVER_POS".to_owned()),
            left_brake_pedal_input_id: registry.get("LEFT_BRAKE_PEDAL_INPUT".to_owned()),
            right_brake_pedal_input_id: registry.get("RIGHT_BRAKE_PEDAL_INPUT".to_owned()),
            brake_left_force_factor_id: registry.get("BRAKE LEFT FORCE FACTOR".to_owned()),
            brake_right_force_factor_id: registry.get("BRAKE RIGHT FORCE FACTOR".to_owned()),

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

            last_transmitted_park_brake_lever_position: 1.,
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

    fn synchronise_with_sim(&mut self) {
        // Synchronising WASM park brake state with simulator park brake lever variable
        let current_in_sim_park_brake: f64 = self.park_brake_lever_masked_input.get_value();

        if current_in_sim_park_brake != self.last_transmitted_park_brake_lever_position {
            self.receive_a_park_brake_set_event(current_in_sim_park_brake as u32);
        }
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
        self.last_transmitted_park_brake_lever_position = park_is_set;
        self.park_brake_lever_masked_input.set_value(park_is_set);

        let brake_right = self.brake_right() * 100.;
        let brake_left = self.brake_left() * 100.;
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
impl SimulatorAspect for Brakes {
    fn read(&mut self, identifier: &VariableIdentifier) -> Option<f64> {
        if identifier == &self.park_brak_lever_pos_id {
            Some(self.is_park_brake_set())
        } else if identifier == &self.left_brake_pedal_input_id {
            Some(self.brake_left())
        } else if identifier == &self.right_brake_pedal_input_id {
            Some(self.brake_right())
        } else {
            None
        }
    }

    fn write(&mut self, identifier: &VariableIdentifier, value: f64) -> bool {
        if identifier == &self.brake_left_force_factor_id {
            self.set_brake_left_output(value);
            true
        } else if identifier == &self.brake_right_force_factor_id {
            self.set_brake_right_output(value);
            true
        } else {
            false
        }
    }

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

    fn pre_tick(&mut self, delta: Duration) {
        self.synchronise_with_sim();
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

struct CargoDoors {
    fwd_door_cargo_position_id: VariableIdentifier,
    fwd_door_cargo_open_req_id: VariableIdentifier,

    forward_cargo_door_position: NamedVariable,
    forward_cargo_door_sim_position_request: AircraftVariable,
    fwd_position: f64,
    forward_cargo_door_open_req: f64,
}
impl CargoDoors {
    fn set_forward_door_postition(&mut self, value: f64) {
        self.fwd_position = value;
    }

    fn new(
        registry: &mut impl VariableRegistry,
        _: &mut Pin<&mut SimConnect>,
    ) -> Result<Self, Box<dyn std::error::Error>> {
        Ok(Self {
            fwd_door_cargo_position_id: registry.get("FWD_DOOR_CARGO_POSITION".to_owned()),
            fwd_door_cargo_open_req_id: registry.get("FWD_DOOR_CARGO_OPEN_REQ".to_owned()),

            forward_cargo_door_position: NamedVariable::from("A32NX_FWD_DOOR_CARGO_POSITION"),
            forward_cargo_door_sim_position_request: AircraftVariable::from(
                "INTERACTIVE POINT OPEN",
                "Position",
                5,
            )?,
            fwd_position: 0.,
            forward_cargo_door_open_req: 0.,
        })
    }

    fn set_in_sim_position_request(&mut self, position_requested: f64) {
        if position_requested > 0. {
            self.forward_cargo_door_open_req = 1.;
        } else {
            self.forward_cargo_door_open_req = 0.;
        }
    }
}
impl SimulatorAspect for CargoDoors {
    fn write(&mut self, identifier: &VariableIdentifier, value: f64) -> bool {
        if identifier == &self.fwd_door_cargo_position_id {
            self.set_forward_door_postition(value);
            true
        } else {
            false
        }
    }

    fn read(&mut self, identifier: &VariableIdentifier) -> Option<f64> {
        if identifier == &self.fwd_door_cargo_open_req_id {
            Some(self.forward_cargo_door_open_req)
        } else if identifier == &self.fwd_door_cargo_position_id {
            Some(self.fwd_position)
        } else {
            None
        }
    }

    fn pre_tick(&mut self, _: Duration) {
        let read_val = self.forward_cargo_door_sim_position_request.get();
        self.set_in_sim_position_request(read_val);
    }

    fn post_tick(
        &mut self,
        _: &mut Pin<&mut SimConnect>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        self.forward_cargo_door_position
            .set_value(self.fwd_position);

        Ok(())
    }
}
