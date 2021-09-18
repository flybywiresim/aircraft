#![cfg(any(target_arch = "wasm32", doc))]
use a320_systems::A320;
use msfs::sim_connect::{SimConnectRecv, SIMCONNECT_OBJECT_ID_USER};
use msfs::sim_connect;
use msfs::{legacy::NamedVariable, sim_connect::SimConnect, sys};
use std::{
    pin::Pin,
    time::{Duration, Instant},
};
use systems::failures::FailureType;
use systems::simulation::Simulation;
use systems_wasm::{
    electrical::{MsfsAuxiliaryPowerUnit, MsfsElectricalBuses},
    f64_to_sim_connect_32k_pos,
    failures::Failures,
    sim_connect_32k_pos_to_f64, MsfsAircraftVariableReader, MsfsNamedVariableReaderWriter,
    MsfsSimulationHandler, SimulatorAspect,
};

#[msfs::gauge(name=systems)]
async fn systems(mut gauge: msfs::Gauge) -> Result<(), Box<dyn std::error::Error>> {
    let mut sim_connect = gauge.open_simconnect("systems")?;


    let mut simulation = Simulation::new(|electricity| A320::new(electricity));
    let mut msfs_simulation_handler = MsfsSimulationHandler::new(
        vec![
            Box::new(create_electrical_buses()),
            Box::new(MsfsAuxiliaryPowerUnit::new(
                "OVHD_APU_START_PB_IS_AVAILABLE",
                8,
            )?),
            Box::new(Brakes::new(&mut sim_connect.as_mut())?),
            Box::new(Autobrakes::new(&mut sim_connect.as_mut())?),
            Box::new(Flaps::new(&mut sim_connect.as_mut())?),
            Box::new(create_aircraft_variable_reader()?),
            Box::new(MsfsNamedVariableReaderWriter::new("A32NX_")),
        ],
        create_failures(),
    );

    while let Some(event) = gauge.next_event().await {
        msfs_simulation_handler.handle(event, &mut simulation, &mut sim_connect.as_mut())?;
    }

    Ok(())
}

fn create_aircraft_variable_reader(
) -> Result<MsfsAircraftVariableReader, Box<dyn std::error::Error>> {
    let mut reader = MsfsAircraftVariableReader::new();
    reader.add("AMBIENT TEMPERATURE", "celsius", 0)?;
    reader.add("TOTAL AIR TEMPERATURE", "celsius", 0)?;
    reader.add_with_additional_names(
        "EXTERNAL POWER AVAILABLE",
        "Bool",
        1,
        &vec!["OVHD_ELEC_EXT_PWR_PB_IS_AVAILABLE"],
    )?;
    reader.add("GEAR CENTER POSITION", "Percent", 0)?;
    reader.add("GEAR ANIMATION POSITION", "Percent", 0)?;
    reader.add("GEAR ANIMATION POSITION", "Percent", 1)?;
    reader.add("GEAR ANIMATION POSITION", "Percent", 2)?;
    reader.add("GEAR HANDLE POSITION", "Bool", 0)?;
    reader.add("TURB ENG CORRECTED N1", "Percent", 1)?;
    reader.add("TURB ENG CORRECTED N1", "Percent", 2)?;
    reader.add("TURB ENG CORRECTED N2", "Percent", 1)?;
    reader.add("TURB ENG CORRECTED N2", "Percent", 2)?;
    reader.add("AIRSPEED INDICATED", "Knots", 0)?;
    reader.add("INDICATED ALTITUDE", "Feet", 0)?;
    reader.add("AIRSPEED MACH", "Mach", 0)?;
    reader.add("AIRSPEED TRUE", "Knots", 0)?;
    reader.add("VELOCITY WORLD Y", "feet per minute", 0)?;
    reader.add("AMBIENT WIND DIRECTION", "Degrees", 0)?;
    reader.add("AMBIENT WIND VELOCITY", "Knots", 0)?;
    reader.add("GPS GROUND SPEED", "Knots", 0)?;
    reader.add("GPS GROUND MAGNETIC TRACK", "Degrees", 0)?;
    reader.add("PLANE PITCH DEGREES", "Degrees", 0)?;
    reader.add("PLANE BANK DEGREES", "Degrees", 0)?;
    reader.add("PLANE HEADING DEGREES MAGNETIC", "Degrees", 0)?;
    reader.add("FUEL TANK LEFT MAIN QUANTITY", "Pounds", 0)?;
    reader.add("UNLIMITED FUEL", "Bool", 0)?;
    reader.add("INDICATED ALTITUDE", "Feet", 0)?;
    reader.add("AMBIENT PRESSURE", "inHg", 0)?;
    reader.add("SEA LEVEL PRESSURE", "Millibars", 0)?;
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
    reader.add("PLANE LATITUDE", "degree latitude", 0)?;
    reader.add("PLANE LONGITUDE", "degree longitude", 0)?;
    reader.add("TRAILING EDGE FLAPS LEFT PERCENT", "Percent", 0)?;
    reader.add("TRAILING EDGE FLAPS RIGHT PERCENT", "Percent", 0)?;

    // reader.add("FLAPS HANDLE INDEX", "Number", 0)?;
    Ok(reader)
}

fn create_electrical_buses() -> MsfsElectricalBuses {
    let mut buses = MsfsElectricalBuses::new();
    // The numbers used here are those defined for buses in the systems.cfg [ELECTRICAL] section.
    buses.add("AC_1", 1, 2);
    buses.add("AC_2", 1, 3);
    buses.add("AC_ESS", 1, 4);
    buses.add("AC_ESS_SHED", 1, 5);
    buses.add("AC_STAT_INV", 1, 6);
    buses.add("AC_GND_FLT_SVC", 1, 14);
    buses.add("DC_1", 1, 7);
    buses.add("DC_2", 1, 8);
    buses.add("DC_ESS", 1, 9);
    buses.add("DC_ESS_SHED", 1, 10);
    buses.add("DC_BAT", 1, 11);
    buses.add("DC_HOT_1", 1, 12);
    buses.add("DC_HOT_2", 1, 13);
    buses.add("DC_GND_FLT_SVC", 1, 15);

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


//This allows us to set settable AVars
#[sim_connect::data_definition]
struct FlapsSurface {
    #[name = "TRAILING EDGE FLAPS LEFT PERCENT"]
    #[unit = "Percent"]
    left_flap: f64,

    #[name = "TRAILING EDGE FLAPS RIGHT PERCENT"]
    #[unit = "Percent"]
    right_flap: f64,
}

#[sim_connect::data_definition]
struct SlatsSurface {
    #[name = "LEADING EDGE FLAPS LEFT PERCENT"]
    #[unit = "Percent"]
    left_slat: f64,

    #[name = "LEADING EDGE FLAPS RIGHT PERCENT"]
    #[unit = "Percent"]
    right_slat: f64,
}

#[sim_connect::data_definition]
struct FlapsHandleIndex{
    #[name = "FLAPS HANDLE INDEX"]
    #[unit = "Number"]
    flaps_handle_index: f64,
}

struct Flaps {
    //IDs of the flaps handle events
    id_flaps_incr: sys::DWORD,
    id_flaps_decr: sys::DWORD,
    id_flaps_0: sys::DWORD,
    id_flaps_1: sys::DWORD,
    id_flaps_2: sys::DWORD,
    id_flaps_3: sys::DWORD,
    id_flaps_4: sys::DWORD,

    //LVars to communicate between the flap movement logic
    //and the simulation animation
    flaps_handle_index_simvar: NamedVariable,
    flaps_handle_percent_simvar: NamedVariable,
    left_flaps_position_simvar: NamedVariable,
    right_flaps_position_simvar: NamedVariable,
    left_slats_position_simvar: NamedVariable,
    right_slats_position_simvar: NamedVariable,

    flaps_surface_simobject: FlapsSurface,
    slats_surface_simobject: SlatsSurface,
    flaps_handle_index_simobject: FlapsHandleIndex,

    flaps_handle_position: u8,
    left_flaps_position: f64,
    right_flaps_position: f64,

    left_slats_position: f64,
    right_slats_position: f64,

    flaps_conf_helper: f64,
}

impl Flaps {
    fn new(sim_connect: &mut Pin<&mut SimConnect>) -> Result<Self, Box<dyn std::error::Error>> {
        Ok (
            Self {
                id_flaps_incr: sim_connect.map_client_event_to_sim_event("FLAPS_INCR", true)?,
                id_flaps_decr: sim_connect.map_client_event_to_sim_event("FLAPS_DECR", true)?,
                id_flaps_0: sim_connect.map_client_event_to_sim_event("FLAPS_0", true)?,
                id_flaps_1: sim_connect.map_client_event_to_sim_event("FLAPS_1", true)?,
                id_flaps_2: sim_connect.map_client_event_to_sim_event("FLAPS_2", true)?,
                id_flaps_3: sim_connect.map_client_event_to_sim_event("FLAPS_3", true)?,
                id_flaps_4: sim_connect.map_client_event_to_sim_event("FLAPS_4", true)?,


                flaps_handle_index_simvar: NamedVariable::from("A32NX_FLAPS_HANDLE_INDEX"),
                flaps_handle_percent_simvar: NamedVariable::from("A32NX_FLAPS_HANDLE_PERCENT"),
                left_flaps_position_simvar: NamedVariable::from("A32NX_LEFT_FLAPS_POSITION_PERCENT"),
                right_flaps_position_simvar: NamedVariable::from("A32NX_RIGHT_FLAPS_POSITION_PERCENT"),
                left_slats_position_simvar: NamedVariable::from("A32NX_LEFT_SLATS_POSITION_PERCENT"),
                right_slats_position_simvar: NamedVariable::from("A32NX_RIGHT_SLATS_POSITION_PERCENT"),

                flaps_surface_simobject: FlapsSurface {
                    left_flap: 0.,
                    right_flap: 0.,
                },
                slats_surface_simobject: SlatsSurface {
                    left_slat: 0.,
                    right_slat: 0.,
                },

                flaps_handle_index_simobject: FlapsHandleIndex { flaps_handle_index: 0.},

                flaps_handle_position: 0,
                left_flaps_position: 0.,
                right_flaps_position: 0.,

                left_slats_position: 0.,
                right_slats_position:0.,

                flaps_conf_helper: 0.,

            }
        )
    }

    fn flaps_handle_position_f64(&self) -> f64 {
        self.flaps_handle_position as f64
    }

    fn get_left_flaps_position(&self) -> f64 {
        self.left_flaps_position
    }
    fn get_right_flaps_position(&self) -> f64 {
        self.right_flaps_position
    }

    fn catch_event(&mut self, event_id: sys::DWORD) -> bool {
        if event_id == self.id_flaps_incr {
            self.flaps_handle_position += 1;
            self.flaps_handle_position = self.flaps_handle_position.min(4);

            self.flaps_handle_index_simvar.set_value(self.flaps_handle_position_f64());
            self.flaps_handle_percent_simvar.set_value(self.flaps_handle_position_f64() / 4.);

            true
        } else if event_id == self.id_flaps_decr {
            if self.flaps_handle_position > 0 {
                self.flaps_handle_position -= 1;
            }

            self.flaps_handle_index_simvar.set_value(self.flaps_handle_position_f64());
            self.flaps_handle_percent_simvar.set_value(self.flaps_handle_position_f64() / 4.);
            true

        } else if event_id == self.id_flaps_0 {
            self.flaps_handle_position = 0;
            self.flaps_handle_index_simvar.set_value(self.flaps_handle_position_f64());
            self.flaps_handle_percent_simvar.set_value(self.flaps_handle_position_f64() / 4.);
            true
        } else if event_id == self.id_flaps_1 {
            self.flaps_handle_position = 1;
            self.flaps_handle_index_simvar.set_value(self.flaps_handle_position_f64());
            self.flaps_handle_percent_simvar.set_value(self.flaps_handle_position_f64() / 4.);
            true
        } else if event_id == self.id_flaps_2 {
            self.flaps_handle_position = 2;
            self.flaps_handle_index_simvar.set_value(self.flaps_handle_position_f64());
            self.flaps_handle_percent_simvar.set_value(self.flaps_handle_position_f64() / 4.);
            true
        } else if event_id == self.id_flaps_3 {
            self.flaps_handle_position = 3;
            self.flaps_handle_index_simvar.set_value(self.flaps_handle_position_f64());
            self.flaps_handle_percent_simvar.set_value(self.flaps_handle_position_f64() / 4.);
            true
        } else if event_id == self.id_flaps_4 {
            self.flaps_handle_position = 4;
            self.flaps_handle_index_simvar.set_value(self.flaps_handle_position_f64());
            self.flaps_handle_percent_simvar.set_value(self.flaps_handle_position_f64() / 4.);
            true
        } else {
            false
        }

    }
    fn write_simvars(&mut self) {
        self.left_flaps_position_simvar.set_value(self.left_flaps_position);
        self.right_flaps_position_simvar.set_value(self.right_flaps_position);
        self.left_slats_position_simvar.set_value(self.left_slats_position);
        self.right_slats_position_simvar.set_value(self.right_slats_position);
    }
}

impl SimulatorAspect for Flaps {

    fn read(&mut self, name: &str) -> Option<f64> {
        match name {
            "LEFT_FLAPS_POSITION_PERCENT" => Some(self.left_flaps_position),
            "RIGHT_FLAPS_POSITION_PERCENT" => Some(self.right_flaps_position),
            "LEFT_SLATS_POSITION_PERCENT" => Some(self.left_slats_position),
            "RIGHT_SLATS_POSITION_PERCENT" => Some(self.right_slats_position),
            _ => None,
        }
    }

    fn write(&mut self, name: &str, value: f64) -> bool {
        match name {
            "LEFT_FLAPS_POSITION_PERCENT" => {
                self.left_flaps_position = value;
                true
            },
            "RIGHT_FLAPS_POSITION_PERCENT" => {
                self.right_flaps_position = value;
                true
            },
            "LEFT_SLATS_POSITION_PERCENT" => {
                self.left_slats_position = value;
                true
            },
            "RIGHT_SLATS_POSITION_PERCENT" => {
                self.right_slats_position = value;
                true
            },
            "FLAPS_CONF_HANDLE_INDEX_HELPER" => {
                self.flaps_conf_helper = value;
                true
            },
            _ => false,
        }
    }

    fn handle_message(&mut self, message: &SimConnectRecv) -> bool {
        if let SimConnectRecv::Event(e) = message {
            self.catch_event(e.id())
        } else {
            false
        }
    }

    fn post_tick(
        &mut self,
        sim_connect: &mut Pin<&mut SimConnect>,
    ) -> Result<(), Box<dyn std::error::Error>> {

        self.flaps_surface_simobject.left_flap = self.left_flaps_position;
        self.flaps_surface_simobject.right_flap = self.right_flaps_position;
        self.slats_surface_simobject.left_slat = self.left_slats_position;
        self.slats_surface_simobject.right_slat = self.right_slats_position;
        self.flaps_handle_index_simobject.flaps_handle_index = self.flaps_conf_helper;

        self.write_simvars();

        sim_connect.set_data_on_sim_object(SIMCONNECT_OBJECT_ID_USER, &self.flaps_surface_simobject);
        sim_connect.set_data_on_sim_object(SIMCONNECT_OBJECT_ID_USER, &self.slats_surface_simobject);
        sim_connect.set_data_on_sim_object(SIMCONNECT_OBJECT_ID_USER, &self.flaps_handle_index_simobject);

        Ok(())
    }
}


struct Autobrakes {
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

    fn new(sim_connect: &mut Pin<&mut SimConnect>) -> Result<Self, Box<dyn std::error::Error>> {
        Ok(Self {
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
    fn read(&mut self, name: &str) -> Option<f64> {
        match name {
            "AUTOBRAKE_DISARM" => Some(self.disarm_requested as u8 as f64),
            "OVHD_AUTOBRK_LOW_ON_IS_PRESSED" => Some(self.low_mode_requested as u8 as f64),
            "OVHD_AUTOBRK_MED_ON_IS_PRESSED" => Some(self.med_mode_requested as u8 as f64),
            "OVHD_AUTOBRK_MAX_ON_IS_PRESSED" => Some(self.max_mode_requested as u8 as f64),
            _ => None,
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
