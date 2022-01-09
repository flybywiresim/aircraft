#![cfg(any(target_arch = "wasm32", doc))]
use std::{
    error::Error,
    time::{Duration, Instant},
};

use a320_systems::A320;
use msfs::sim_connect;
use msfs::{
    legacy::{AircraftVariable, NamedVariable},
    sim_connect::SimConnect,
    sim_connect::{SimConnectRecv, SIMCONNECT_OBJECT_ID_USER},
    sys,
};

use systems::{
    failures::FailureType,
    shared::HydraulicColor,
    simulation::{VariableIdentifier, VariableRegistry},
};
use systems_wasm::{
    f64_to_sim_connect_32k_pos, sim_connect_32k_pos_to_f64, MsfsAspectCtor, MsfsSimulationBuilder,
    MsfsVariableRegistry, SimulatorAspect,
};

#[msfs::gauge(name=systems)]
async fn systems(mut gauge: msfs::Gauge) -> Result<(), Box<dyn Error>> {
    let mut sim_connect = gauge.open_simconnect("systems")?;

    let (mut simulation, mut handler) =
        MsfsSimulationBuilder::new("A32NX_".to_owned(), sim_connect.as_mut().get_mut())
            .with_electrical_buses(vec![
                ("AC_1", 2),
                ("AC_1", 2),
                ("AC_2", 3),
                ("AC_ESS", 4),
                ("AC_ESS_SHED", 5),
                ("AC_STAT_INV", 6),
                ("AC_GND_FLT_SVC", 14),
                ("DC_1", 7),
                ("DC_2", 8),
                ("DC_ESS", 9),
                ("DC_ESS_SHED", 10),
                ("DC_BAT", 11),
                ("DC_HOT_1", 12),
                ("DC_HOT_2", 13),
                ("DC_GND_FLT_SVC", 15),
            ])
            .with_auxiliary_power_unit("OVHD_APU_START_PB_IS_AVAILABLE".to_owned(), 8)?
            .with::<Brakes>()?
            .with::<NoseWheelSteering>()?
            .with::<Autobrakes>()?
            .with::<Flaps>()?
            .with::<CargoDoors>()?
            .with_failures(vec![
                (24_000, FailureType::TransformerRectifier(1)),
                (24_001, FailureType::TransformerRectifier(2)),
                (24_002, FailureType::TransformerRectifier(3)),
                (29_000, FailureType::ReservoirLeak(HydraulicColor::Green)),
                (29_001, FailureType::ReservoirLeak(HydraulicColor::Blue)),
                (29_002, FailureType::ReservoirLeak(HydraulicColor::Yellow)),
                (29_003, FailureType::ReservoirAirLeak(HydraulicColor::Green)),
                (29_004, FailureType::ReservoirAirLeak(HydraulicColor::Blue)),
                (
                    29_005,
                    FailureType::ReservoirAirLeak(HydraulicColor::Yellow),
                ),
                (
                    29_006,
                    FailureType::ReservoirReturnLeak(HydraulicColor::Green),
                ),
                (
                    29_007,
                    FailureType::ReservoirReturnLeak(HydraulicColor::Blue),
                ),
                (
                    29_008,
                    FailureType::ReservoirReturnLeak(HydraulicColor::Yellow),
                ),
            ])
            .provides_aircraft_variable("ACCELERATION BODY X", "feet per second squared", 0)?
            .provides_aircraft_variable("ACCELERATION BODY Y", "feet per second squared", 0)?
            .provides_aircraft_variable("ACCELERATION BODY Z", "feet per second squared", 0)?
            .provides_aircraft_variable("AIRSPEED INDICATED", "Knots", 0)?
            .provides_aircraft_variable("AIRSPEED TRUE", "Knots", 0)?
            .provides_aircraft_variable("AIRSPEED MACH", "Mach", 0)?
            .provides_aircraft_variable("AIRSPEED TRUE", "Knots", 0)?
            .provides_aircraft_variable("AMBIENT PRESSURE", "inHg", 0)?
            .provides_aircraft_variable("AMBIENT TEMPERATURE", "celsius", 0)?
            .provides_aircraft_variable("AMBIENT WIND DIRECTION", "Degrees", 0)?
            .provides_aircraft_variable("AMBIENT WIND VELOCITY", "Knots", 0)?
            .provides_aircraft_variable("ANTISKID BRAKES ACTIVE", "Bool", 0)?
            .provides_aircraft_variable_with_additional_names(
                "APU GENERATOR SWITCH",
                "Bool",
                0,
                vec!["OVHD_ELEC_APU_GEN_PB_IS_ON".to_owned()],
            )?
            .provides_aircraft_variable_with_additional_names(
                "BLEED AIR ENGINE",
                "Bool",
                1,
                vec!["OVHD_PNEU_ENG_1_BLEED_PB_IS_AUTO".to_owned()],
            )?
            .provides_aircraft_variable_with_additional_names(
                "BLEED AIR ENGINE",
                "Bool",
                2,
                vec!["OVHD_PNEU_ENG_2_BLEED_PB_IS_AUTO".to_owned()],
            )?
            .provides_aircraft_variable_with_additional_names(
                "EXTERNAL POWER AVAILABLE",
                "Bool",
                1,
                vec!["OVHD_ELEC_EXT_PWR_PB_IS_AVAILABLE".to_owned()],
            )?
            .provides_aircraft_variable_with_additional_names(
                "EXTERNAL POWER ON",
                "Bool",
                1,
                vec!["OVHD_ELEC_EXT_PWR_PB_IS_ON".to_owned()],
            )?
            .provides_aircraft_variable("FUEL TANK LEFT MAIN QUANTITY", "Pounds", 0)?
            .provides_aircraft_variable("GEAR ANIMATION POSITION", "Percent", 0)?
            .provides_aircraft_variable("GEAR ANIMATION POSITION", "Percent", 1)?
            .provides_aircraft_variable("GEAR ANIMATION POSITION", "Percent", 2)?
            .provides_aircraft_variable("GEAR CENTER POSITION", "Percent", 0)?
            .provides_aircraft_variable("GEAR HANDLE POSITION", "Bool", 0)?
            .provides_aircraft_variable_with_additional_names(
                "GENERAL ENG MASTER ALTERNATOR",
                "Bool",
                1,
                vec!["OVHD_ELEC_ENG_GEN_1_PB_IS_ON".to_owned()],
            )?
            .provides_aircraft_variable_with_additional_names(
                "GENERAL ENG MASTER ALTERNATOR",
                "Bool",
                2,
                vec!["OVHD_ELEC_ENG_GEN_2_PB_IS_ON".to_owned()],
            )?
            .provides_aircraft_variable("GENERAL ENG STARTER ACTIVE", "Bool", 1)?
            .provides_aircraft_variable("GENERAL ENG STARTER ACTIVE", "Bool", 2)?
            .provides_aircraft_variable("GPS GROUND SPEED", "Knots", 0)?
            .provides_aircraft_variable("GPS GROUND MAGNETIC TRACK", "Degrees", 0)?
            .provides_aircraft_variable("INDICATED ALTITUDE", "Feet", 0)?
            .provides_aircraft_variable("INTERACTIVE POINT OPEN:0", "Percent", 0)?
            .provides_aircraft_variable("INTERACTIVE POINT OPEN:3", "Percent", 0)?
            .provides_aircraft_variable("PLANE PITCH DEGREES", "Degrees", 0)?
            .provides_aircraft_variable("PLANE BANK DEGREES", "Degrees", 0)?
            .provides_aircraft_variable("PLANE HEADING DEGREES MAGNETIC", "Degrees", 0)?
            .provides_aircraft_variable("PLANE LATITUDE", "degree latitude", 0)?
            .provides_aircraft_variable("PLANE LONGITUDE", "degree longitude", 0)?
            .provides_aircraft_variable("PUSHBACK STATE", "Enum", 0)?
            .provides_aircraft_variable("PUSHBACK ANGLE", "Radians", 0)?
            .provides_aircraft_variable("SEA LEVEL PRESSURE", "Millibars", 0)?
            .provides_aircraft_variable("SIM ON GROUND", "Bool", 0)?
            .provides_aircraft_variable("TOTAL AIR TEMPERATURE", "celsius", 0)?
            .provides_aircraft_variable("TRAILING EDGE FLAPS LEFT PERCENT", "Percent", 0)?
            .provides_aircraft_variable("TRAILING EDGE FLAPS RIGHT PERCENT", "Percent", 0)?
            .provides_aircraft_variable("TURB ENG CORRECTED N1", "Percent", 1)?
            .provides_aircraft_variable("TURB ENG CORRECTED N1", "Percent", 2)?
            .provides_aircraft_variable("TURB ENG CORRECTED N2", "Percent", 1)?
            .provides_aircraft_variable("TURB ENG CORRECTED N2", "Percent", 2)?
            .provides_aircraft_variable("UNLIMITED FUEL", "Bool", 0)?
            .provides_aircraft_variable("VELOCITY WORLD Y", "feet per minute", 0)?
            .build(A320::new)?;

    while let Some(event) = gauge.next_event().await {
        handler.handle(event, &mut simulation, sim_connect.as_mut().get_mut())?;
    }

    Ok(())
}

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
struct FlapsHandleIndex {
    #[name = "FLAPS HANDLE INDEX"]
    #[unit = "Number"]
    index: f64,
}

struct Flaps {
    flaps_left_position_id: VariableIdentifier,
    flaps_right_position_id: VariableIdentifier,
    slats_left_position_id: VariableIdentifier,
    slats_right_position_id: VariableIdentifier,

    //IDs of the flaps handle events
    id_flaps_incr: sys::DWORD,
    id_flaps_decr: sys::DWORD,
    id_flaps_1: sys::DWORD,
    id_flaps_2: sys::DWORD,
    id_flaps_3: sys::DWORD,
    id_flaps_set: sys::DWORD,
    id_axis_flaps_set: sys::DWORD,
    id_flaps_down: sys::DWORD,
    id_flaps_up: sys::DWORD,

    //LVars to communicate between the flap movement logic
    //and the simulation animation
    flaps_handle_index_sim_var: NamedVariable,
    flaps_handle_percent_sim_var: NamedVariable,
    left_flaps_position_sim_var: NamedVariable,
    right_flaps_position_sim_var: NamedVariable,
    left_slats_position_sim_var: NamedVariable,
    right_slats_position_sim_var: NamedVariable,

    msfs_flaps_handle_index: FlapsHandleIndex,
    flaps_surface_sim_object: FlapsSurface,
    slats_surface_sim_object: SlatsSurface,
    flaps_handle_position: u8,
    left_flaps_position: f64,
    right_flaps_position: f64,

    left_slats_position: f64,
    right_slats_position: f64,
}
impl MsfsAspectCtor for Flaps {
    fn new(
        registry: &mut MsfsVariableRegistry,
        sim_connect: &mut SimConnect,
    ) -> Result<Self, Box<dyn Error>> {
        Ok(Self {
            flaps_left_position_id: registry.get("LEFT_FLAPS_POSITION_PERCENT".to_owned()),
            flaps_right_position_id: registry.get("RIGHT_FLAPS_POSITION_PERCENT".to_owned()),
            slats_left_position_id: registry.get("LEFT_SLATS_POSITION_PERCENT".to_owned()),
            slats_right_position_id: registry.get("RIGHT_SLATS_POSITION_PERCENT".to_owned()),

            id_flaps_incr: sim_connect.map_client_event_to_sim_event("FLAPS_INCR", true)?,
            id_flaps_decr: sim_connect.map_client_event_to_sim_event("FLAPS_DECR", true)?,
            id_flaps_1: sim_connect.map_client_event_to_sim_event("FLAPS_1", true)?,
            id_flaps_2: sim_connect.map_client_event_to_sim_event("FLAPS_2", true)?,
            id_flaps_3: sim_connect.map_client_event_to_sim_event("FLAPS_3", true)?,
            id_flaps_set: sim_connect.map_client_event_to_sim_event("FLAPS_SET", true)?,
            id_axis_flaps_set: sim_connect.map_client_event_to_sim_event("AXIS_FLAPS_SET", true)?,
            id_flaps_down: sim_connect.map_client_event_to_sim_event("FLAPS_DOWN", true)?,
            id_flaps_up: sim_connect.map_client_event_to_sim_event("FLAPS_UP", true)?,

            flaps_handle_index_sim_var: NamedVariable::from("A32NX_FLAPS_HANDLE_INDEX"),
            flaps_handle_percent_sim_var: NamedVariable::from("A32NX_FLAPS_HANDLE_PERCENT"),
            left_flaps_position_sim_var: NamedVariable::from("A32NX_LEFT_FLAPS_POSITION_PERCENT"),
            right_flaps_position_sim_var: NamedVariable::from("A32NX_RIGHT_FLAPS_POSITION_PERCENT"),
            left_slats_position_sim_var: NamedVariable::from("A32NX_LEFT_SLATS_POSITION_PERCENT"),
            right_slats_position_sim_var: NamedVariable::from("A32NX_RIGHT_SLATS_POSITION_PERCENT"),

            msfs_flaps_handle_index: FlapsHandleIndex { index: 0. },
            flaps_surface_sim_object: FlapsSurface {
                left_flap: 0.,
                right_flap: 0.,
            },
            slats_surface_sim_object: SlatsSurface {
                left_slat: 0.,
                right_slat: 0.,
            },

            flaps_handle_position: 0,
            left_flaps_position: 0.,
            right_flaps_position: 0.,

            left_slats_position: 0.,
            right_slats_position: 0.,
        })
    }
}

impl Flaps {
    fn flaps_handle_position_f64(&self) -> f64 {
        self.flaps_handle_position as f64
    }

    /// Tries to take actual surfaces position PERCENTS and convert it into flight model FLAP HANDLE INDEX
    /// This index is used by MSFS to select correct aerodynamic properties
    /// There is no index available for flaps but no slats configurations (possible plane failure case)
    /// The percent thresholds can be tuned to change the timing of aerodynamic impact versus surface actual position
    fn msfs_flap_index_from_surfaces_positions_percent(&self) -> u8 {
        let flap_mean_position = (self.left_flaps_position + self.right_flaps_position) / 2.;
        let slat_mean_position = (self.left_slats_position + self.right_slats_position) / 2.;

        // Clean configuration no flaps no slats
        if flap_mean_position < 2. && slat_mean_position < 2. {
            return 0;
        }

        // Almost no flaps but some slats -> CONF 1
        if flap_mean_position < 12. && slat_mean_position > 15. {
            return 1;
        }

        if flap_mean_position > 80. {
            5
        } else if flap_mean_position > 49. {
            4
        } else if flap_mean_position > 30. {
            3
        } else if flap_mean_position > 12. {
            2
        } else {
            0
        }
    }

    fn get_handle_pos_from_0_1(&self, input: f64) -> u8 {
        if input < -0.8 {
            0
        } else if input > -0.7 && input < -0.3 {
            1
        } else if input > -0.2 && input < 0.2 {
            2
        } else if input > 0.3 && input < 0.7 {
            3
        } else if input > 0.8 {
            4
        } else {
            self.flaps_handle_position
        }
    }

    fn get_handle_pos_flaps_set(&self, input: i32) -> u8 {
        let normalized_input: f64 = (input as f64) / 8192. - 1.;
        return self.get_handle_pos_from_0_1(normalized_input);
    }

    fn get_handle_pos_axis_flaps_set(&self, input: i32) -> u8 {
        let normalized_input: f64 = (input as f64) / 16384.;
        return self.get_handle_pos_from_0_1(normalized_input);
    }

    fn catch_event(&mut self, event_id: sys::DWORD, event_data: u32) -> bool {
        if event_id == self.id_flaps_incr {
            self.flaps_handle_position += 1;
            self.flaps_handle_position = self.flaps_handle_position.min(4);
        } else if event_id == self.id_flaps_decr {
            if self.flaps_handle_position > 0 {
                self.flaps_handle_position -= 1;
            }
        } else if event_id == self.id_flaps_1 {
            self.flaps_handle_position = 1;
        } else if event_id == self.id_flaps_2 {
            self.flaps_handle_position = 2;
        } else if event_id == self.id_flaps_3 {
            self.flaps_handle_position = 3;
        } else if event_id == self.id_flaps_set {
            self.flaps_handle_position = self.get_handle_pos_flaps_set(event_data as i32);
        } else if event_id == self.id_axis_flaps_set {
            self.flaps_handle_position = self.get_handle_pos_axis_flaps_set(event_data as i32);
        } else if event_id == self.id_flaps_down {
            self.flaps_handle_position = 4;
        } else if event_id == self.id_flaps_up {
            self.flaps_handle_position = 0;
        } else {
            return false;
        }
        self.flaps_handle_index_sim_var
            .set_value(self.flaps_handle_position_f64());
        self.flaps_handle_percent_sim_var
            .set_value(self.flaps_handle_position_f64() / 4.);
        true
    }

    fn write_sim_vars(&mut self) {
        self.left_flaps_position_sim_var
            .set_value(self.left_flaps_position);
        self.right_flaps_position_sim_var
            .set_value(self.right_flaps_position);
        self.left_slats_position_sim_var
            .set_value(self.left_slats_position);
        self.right_slats_position_sim_var
            .set_value(self.right_slats_position);
    }
}

impl SimulatorAspect for Flaps {
    fn read(&mut self, identifier: &VariableIdentifier) -> Option<f64> {
        if identifier == &self.flaps_left_position_id {
            Some(self.left_flaps_position)
        } else if identifier == &self.flaps_right_position_id {
            Some(self.right_flaps_position)
        } else if identifier == &self.slats_left_position_id {
            Some(self.left_slats_position)
        } else if identifier == &self.slats_right_position_id {
            Some(self.right_slats_position)
        } else {
            None
        }
    }

    fn write(&mut self, identifier: &VariableIdentifier, value: f64) -> bool {
        if identifier == &self.flaps_left_position_id {
            self.left_flaps_position = value;
            true
        } else if identifier == &self.flaps_right_position_id {
            self.right_flaps_position = value;
            true
        } else if identifier == &self.slats_left_position_id {
            self.left_slats_position = value;
            true
        } else if identifier == &self.slats_right_position_id {
            self.right_slats_position = value;
            true
        } else {
            false
        }
    }

    fn handle_message(&mut self, message: &SimConnectRecv) -> bool {
        if let SimConnectRecv::Event(e) = message {
            self.catch_event(e.id(), e.data())
        } else {
            false
        }
    }

    fn post_tick(&mut self, sim_connect: &mut SimConnect) -> Result<(), Box<dyn Error>> {
        self.flaps_surface_sim_object.left_flap = self.left_flaps_position;
        self.flaps_surface_sim_object.right_flap = self.right_flaps_position;
        self.slats_surface_sim_object.left_slat = self.left_slats_position;
        self.slats_surface_sim_object.right_slat = self.right_slats_position;
        self.msfs_flaps_handle_index.index =
            self.msfs_flap_index_from_surfaces_positions_percent() as f64;

        self.write_sim_vars();

        sim_connect
            .set_data_on_sim_object(SIMCONNECT_OBJECT_ID_USER, &self.msfs_flaps_handle_index)?;
        sim_connect
            .set_data_on_sim_object(SIMCONNECT_OBJECT_ID_USER, &self.flaps_surface_sim_object)?;
        sim_connect
            .set_data_on_sim_object(SIMCONNECT_OBJECT_ID_USER, &self.slats_surface_sim_object)?;

        Ok(())
    }
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

impl MsfsAspectCtor for Autobrakes {
    fn new(
        registry: &mut MsfsVariableRegistry,
        sim_connect: &mut SimConnect,
    ) -> Result<Self, Box<dyn Error>> {
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
}

impl Autobrakes {
    // Time to freeze keyboard events once key is released. This will keep key_pressed to TRUE internally when key is actually staying pressed
    // but keyboard events wrongly goes to false then back to true for a short period of time due to poor key event handling
    const DEFAULT_REARMING_DURATION: Duration = Duration::from_millis(1500);

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

    fn post_tick(&mut self, _: &mut SimConnect) -> Result<(), Box<dyn Error>> {
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

impl MsfsAspectCtor for Brakes {
    fn new(
        registry: &mut MsfsVariableRegistry,
        sim_connect: &mut SimConnect,
    ) -> Result<Self, Box<dyn Error>> {
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
}

impl Brakes {
    const KEYBOARD_PRESS_SPEED: f64 = 0.6;
    const KEYBOARD_RELEASE_SPEED: f64 = 0.3;

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
        sim_connect: &mut SimConnect,
    ) -> Result<(), Box<dyn Error>> {
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

    fn post_tick(&mut self, sim_connect: &mut SimConnect) -> Result<(), Box<dyn Error>> {
        self.reset_keyboard_events();
        self.transmit_client_events(sim_connect)?;
        self.transmit_masked_inputs();

        Ok(())
    }
}

struct NoseWheelSteering {
    realistic_tiller_axis_var: NamedVariable,
    is_realistic_tiller_mode: bool,

    tiller_handle_position_id: VariableIdentifier,
    tiller_handle_position_var: NamedVariable,

    rudder_pedal_position_id: VariableIdentifier,

    rudder_position_var: AircraftVariable,
    rudder_position: f64,

    nose_wheel_position_id: VariableIdentifier,
    nose_wheel_position_var: NamedVariable,
    nose_wheel_position: f64,

    rudder_pedal_position_var: NamedVariable,
    rudder_pedal_position: f64,

    tiller_handle_position_event: sys::DWORD,
    tiller_handle_position: f64,

    nose_wheel_angle_event: sys::DWORD,
    nose_wheel_angle_inc_event: sys::DWORD,
    nose_wheel_angle_dec_event: sys::DWORD,

    pedal_disconnect_event: sys::DWORD,
    pedal_disconnect_id: VariableIdentifier,
    pedal_disconnect: bool,
}

impl MsfsAspectCtor for NoseWheelSteering {
    fn new(
        registry: &mut MsfsVariableRegistry,
        sim_connect: &mut SimConnect,
    ) -> Result<Self, Box<dyn Error>> {
        Ok(Self {
            realistic_tiller_axis_var: NamedVariable::from("A32NX_REALISTIC_TILLER_ENABLED"),
            is_realistic_tiller_mode: false,

            tiller_handle_position_id: registry.get("TILLER_HANDLE_POSITION".to_owned()),
            tiller_handle_position_var: NamedVariable::from("A32NX_TILLER_HANDLE_POSITION"),

            rudder_pedal_position_id: registry.get("RUDDER_PEDAL_POSITION".to_owned()),

            rudder_position_var: AircraftVariable::from("RUDDER POSITION", "Position", 0)?,
            rudder_position: 0.5,

            nose_wheel_position_id: registry.get("NOSE_WHEEL_POSITION".to_owned()),
            nose_wheel_position_var: NamedVariable::from("A32NX_NOSE_WHEEL_POSITION"),
            nose_wheel_position: 0.,

            rudder_pedal_position_var: NamedVariable::from("A32NX_RUDDER_PEDAL_POSITION"),
            rudder_pedal_position: 0.5,

            tiller_handle_position_event: sim_connect
                .map_client_event_to_sim_event("AXIS_MIXTURE4_SET", true)?,
            tiller_handle_position: 0.5,

            nose_wheel_angle_event: sim_connect
                .map_client_event_to_sim_event("STEERING_SET", true)?,
            nose_wheel_angle_inc_event: sim_connect
                .map_client_event_to_sim_event("STEERING_INC", true)?,
            nose_wheel_angle_dec_event: sim_connect
                .map_client_event_to_sim_event("STEERING_DEC", true)?,

            pedal_disconnect_event: sim_connect
                .map_client_event_to_sim_event("TOGGLE_WATER_RUDDER", true)?,
            pedal_disconnect_id: registry.get("TILLER_PEDAL_DISCONNECT".to_owned()),
            pedal_disconnect: false,
        })
    }
}
impl NoseWheelSteering {
    const MAX_CONTROLLABLE_STEERING_ANGLE_DEGREES: f64 = 75.;
    const MAX_MSFS_STEERING_ANGLE_DEGREES: f64 = 90.;
    const STEERING_ANIMATION_TOTAL_RANGE_DEGREES: f64 = 360.;

    const TILLER_KEYBOARD_INCREMENTS: f64 = 0.05;

    fn set_tiller_handle(&mut self, simconnect_value: u32) {
        self.tiller_handle_position = sim_connect_32k_pos_to_f64(simconnect_value);
    }

    fn decrement_tiller(&mut self) {
        self.tiller_handle_position -= Self::TILLER_KEYBOARD_INCREMENTS;
        self.tiller_handle_position = self.tiller_handle_position.min(1.).max(0.);

        self.tiller_key_event_centering();
    }

    fn increment_tiller(&mut self) {
        self.tiller_handle_position += Self::TILLER_KEYBOARD_INCREMENTS;
        self.tiller_handle_position = self.tiller_handle_position.min(1.).max(0.);

        self.tiller_key_event_centering();
    }

    fn tiller_key_event_centering(&mut self) {
        if self.tiller_handle_position < 0.5 + Self::TILLER_KEYBOARD_INCREMENTS
            && self.tiller_handle_position > 0.5 - Self::TILLER_KEYBOARD_INCREMENTS
        {
            self.tiller_handle_position = 0.5;
        }
    }

    fn set_pedal_disconnect(&mut self, is_disconnected: bool) {
        self.pedal_disconnect = is_disconnected;
    }

    /// Steering position is [-1;1]  -1 is left, 0 is straight
    fn set_steering_position(&mut self, steering_position: f64) {
        self.nose_wheel_position = steering_position;
    }

    /// Tiller position in [-1;1] range, -1 is left
    fn tiller_handle_position(&self) -> f64 {
        self.tiller_handle_position * 2. - 1.
    }

    /// Rudder pedal position in [-1;1] range, -1 is left
    fn rudder_pedal_position(&self) -> f64 {
        self.rudder_pedal_position * 2. - 1.
    }

    fn set_realistic_tiller_mode(&mut self, is_active: bool) {
        self.is_realistic_tiller_mode = is_active;
    }

    fn synchronise_with_sim(&mut self) {
        let rudder_percent: f64 = self.rudder_pedal_position_var.get_value();
        self.rudder_pedal_position = (rudder_percent + 100.) / 200.;

        let rudder_position: f64 = self.rudder_position_var.get();
        self.rudder_position = (rudder_position + 1.) / 2.;

        let realistic_mode: f64 = self.realistic_tiller_axis_var.get_value();
        self.set_realistic_tiller_mode(realistic_mode > 0.);
    }

    fn final_tiller_position_sent_to_systems(&self) -> f64 {
        if self.is_realistic_tiller_mode {
            self.tiller_handle_position()
        } else {
            if !self.pedal_disconnect {
                self.rudder_pedal_position()
            } else {
                0.
            }
        }
    }

    fn final_rudder_pedal_position_sent_to_systems(&self) -> f64 {
        if self.is_realistic_tiller_mode {
            self.rudder_pedal_position()
        } else {
            0.
        }
    }

    fn steering_demand_to_msfs_from_steering_angle(&self) -> f64 {
        // Steering in msfs is the max we want rescaled to the max in msfs
        let steering_ratio_converted = self.nose_wheel_position
            * Self::MAX_CONTROLLABLE_STEERING_ANGLE_DEGREES
            / Self::MAX_MSFS_STEERING_ANGLE_DEGREES
            / 2.
            + 0.5;

        // Steering demand is reverted in msfs so we do 1 - angle.
        // Then we hack msfs by adding the rudder value that it will always substract internally
        // This way we end up with actual angle we required
        (1. - steering_ratio_converted) + (self.rudder_position - 0.5)
    }

    fn steering_animation_to_msfs_from_steering_angle(&self) -> f64 {
        ((self.nose_wheel_position * Self::MAX_CONTROLLABLE_STEERING_ANGLE_DEGREES
            / (Self::STEERING_ANIMATION_TOTAL_RANGE_DEGREES / 2.))
            / 2.)
            + 0.5
    }

    fn write_animation_position_to_sim(&self) {
        self.tiller_handle_position_var
            .set_value((self.final_tiller_position_sent_to_systems() + 1.) / 2.);

        self.nose_wheel_position_var
            .set_value(self.steering_animation_to_msfs_from_steering_angle());
    }

    fn transmit_client_events(
        &mut self,
        sim_connect: &mut SimConnect,
    ) -> Result<(), Box<dyn Error>> {
        sim_connect.transmit_client_event(
            SIMCONNECT_OBJECT_ID_USER,
            self.nose_wheel_angle_event,
            f64_to_sim_connect_32k_pos(self.steering_demand_to_msfs_from_steering_angle()),
        )?;

        Ok(())
    }
}
impl SimulatorAspect for NoseWheelSteering {
    fn read(&mut self, identifier: &VariableIdentifier) -> Option<f64> {
        if identifier == &self.tiller_handle_position_id {
            Some(self.final_tiller_position_sent_to_systems())
        } else if identifier == &self.rudder_pedal_position_id {
            Some(self.final_rudder_pedal_position_sent_to_systems())
        } else if identifier == &self.pedal_disconnect_id {
            Some(self.pedal_disconnect as u8 as f64)
        } else {
            None
        }
    }

    fn write(&mut self, identifier: &VariableIdentifier, value: f64) -> bool {
        if identifier == &self.nose_wheel_position_id {
            self.set_steering_position(value);
            true
        } else {
            false
        }
    }

    fn handle_message(&mut self, message: &SimConnectRecv) -> bool {
        match message {
            SimConnectRecv::Event(e) => {
                if e.id() == self.tiller_handle_position_event {
                    self.set_tiller_handle(e.data());
                    true
                } else if e.id() == self.pedal_disconnect_event {
                    self.set_pedal_disconnect(true);
                    true
                } else if e.id() == self.nose_wheel_angle_dec_event {
                    self.decrement_tiller();
                    true
                } else if e.id() == self.nose_wheel_angle_inc_event {
                    self.increment_tiller();
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

    fn post_tick(&mut self, sim_connect: &mut SimConnect) -> Result<(), Box<dyn Error>> {
        self.transmit_client_events(sim_connect)?;
        self.write_animation_position_to_sim();
        self.set_pedal_disconnect(false);

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
impl MsfsAspectCtor for CargoDoors {
    fn new(
        registry: &mut MsfsVariableRegistry,
        _: &mut SimConnect,
    ) -> Result<Self, Box<dyn Error>> {
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
}

impl CargoDoors {
    fn set_forward_door_postition(&mut self, value: f64) {
        self.fwd_position = value;
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

    fn post_tick(&mut self, _: &mut SimConnect) -> Result<(), Box<dyn Error>> {
        self.forward_cargo_door_position
            .set_value(self.fwd_position);

        Ok(())
    }
}
