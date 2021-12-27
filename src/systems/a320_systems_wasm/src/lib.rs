//#![cfg(any(target_arch = "wasm32", doc))]
use std::{error::Error, time::Duration};

use a320_systems::A320;
use msfs::sim_connect;
use msfs::{
    legacy::{AircraftVariable, NamedVariable},
    sim_connect::SimConnect,
    sim_connect::{SimConnectRecv, SIMCONNECT_OBJECT_ID_USER},
    sys,
};

use systems::shared::{from_bool, to_bool};
use systems::{
    failures::FailureType,
    simulation::{VariableIdentifier, VariableRegistry},
};
use systems_wasm::aspects::{
    max, EventToVariableOptions, MsfsAspectBuilder, UpdateOn, VariableToEventMapping,
};
use systems_wasm::{
    aspects::{EventToVariableMapping, Variable},
    f64_to_sim_connect_32k_pos, sim_connect_32k_pos_to_f64, AircraftVariableOptions,
    MsfsAspectCtor, MsfsSimulationBuilder, MsfsVariableRegistry, SimulatorAspect,
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
            .with_aspect(brakes)?
            .with_aspect(autobrakes)?
            .with::<NoseWheelSteering>()?
            .with_aspect(flaps)?
            .with_failures(vec![
                (24_000, FailureType::TransformerRectifier(1)),
                (24_001, FailureType::TransformerRectifier(2)),
                (24_002, FailureType::TransformerRectifier(3)),
            ])
            .provides_aircraft_variable("ACCELERATION BODY X", "feet per second squared", 0)?
            .provides_aircraft_variable("ACCELERATION BODY Y", "feet per second squared", 0)?
            .provides_aircraft_variable("ACCELERATION BODY Z", "feet per second squared", 0)?
            .provides_aircraft_variable("AIRSPEED INDICATED", "Knots", 0)?
            .provides_aircraft_variable("AIRSPEED MACH", "Mach", 0)?
            .provides_aircraft_variable("AIRSPEED TRUE", "Knots", 0)?
            .provides_aircraft_variable("AMBIENT PRESSURE", "inHg", 0)?
            .provides_aircraft_variable("AMBIENT TEMPERATURE", "celsius", 0)?
            .provides_aircraft_variable("AMBIENT WIND DIRECTION", "Degrees", 0)?
            .provides_aircraft_variable("AMBIENT WIND VELOCITY", "Knots", 0)?
            .provides_aircraft_variable("ANTISKID BRAKES ACTIVE", "Bool", 0)?
            .provides_aircraft_variable_with_options(
                "APU GENERATOR SWITCH",
                "Bool",
                0,
                AircraftVariableOptions::default()
                    .additional_name("OVHD_ELEC_APU_GEN_PB_IS_ON".to_owned()),
            )?
            .provides_aircraft_variable_with_options(
                "BLEED AIR ENGINE",
                "Bool",
                1,
                AircraftVariableOptions::default()
                    .additional_name("OVHD_PNEU_ENG_1_BLEED_PB_IS_AUTO".to_owned()),
            )?
            .provides_aircraft_variable_with_options(
                "BLEED AIR ENGINE",
                "Bool",
                2,
                AircraftVariableOptions::default()
                    .additional_name("OVHD_PNEU_ENG_2_BLEED_PB_IS_AUTO".to_owned()),
            )?
            .provides_aircraft_variable_with_options(
                "EXTERNAL POWER AVAILABLE",
                "Bool",
                1,
                AircraftVariableOptions::default()
                    .additional_name("OVHD_ELEC_EXT_PWR_PB_IS_AVAILABLE".to_owned()),
            )?
            .provides_aircraft_variable_with_options(
                "EXTERNAL POWER ON",
                "Bool",
                1,
                AircraftVariableOptions::default()
                    .additional_name("OVHD_ELEC_EXT_PWR_PB_IS_ON".to_owned()),
            )?
            .provides_aircraft_variable("FUEL TANK LEFT MAIN QUANTITY", "Pounds", 0)?
            .provides_aircraft_variable("GEAR ANIMATION POSITION", "Percent", 0)?
            .provides_aircraft_variable("GEAR ANIMATION POSITION", "Percent", 1)?
            .provides_aircraft_variable("GEAR ANIMATION POSITION", "Percent", 2)?
            .provides_aircraft_variable("GEAR CENTER POSITION", "Percent", 0)?
            .provides_aircraft_variable("GEAR HANDLE POSITION", "Bool", 0)?
            .provides_aircraft_variable_with_options(
                "GENERAL ENG MASTER ALTERNATOR",
                "Bool",
                1,
                AircraftVariableOptions::default()
                    .additional_name("OVHD_ELEC_ENG_GEN_1_PB_IS_ON".to_owned()),
            )?
            .provides_aircraft_variable_with_options(
                "GENERAL ENG MASTER ALTERNATOR",
                "Bool",
                2,
                AircraftVariableOptions::default()
                    .additional_name("OVHD_ELEC_ENG_GEN_2_PB_IS_ON".to_owned()),
            )?
            .provides_aircraft_variable("GENERAL ENG STARTER ACTIVE", "Bool", 1)?
            .provides_aircraft_variable("GENERAL ENG STARTER ACTIVE", "Bool", 2)?
            .provides_aircraft_variable("GPS GROUND SPEED", "Knots", 0)?
            .provides_aircraft_variable("GPS GROUND MAGNETIC TRACK", "Degrees", 0)?
            .provides_aircraft_variable("INDICATED ALTITUDE", "Feet", 0)?
            .provides_aircraft_variable_with_options(
                "INTERACTIVE POINT OPEN",
                "Position",
                5,
                AircraftVariableOptions::default()
                    .mapping(|value| if value > 0. { 1. } else { 0. })
                    .additional_name("FWD_DOOR_CARGO_OPEN_REQ".to_owned()),
            )?
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

fn brakes(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    builder.event_to_variable(
        "PARKING_BRAKES",
        EventToVariableMapping::CurrentValueToValue(|current_value| {
            from_bool(!to_bool(current_value))
        }),
        Variable::Named("PARK_BRAKE_LEVER_POS".to_owned()),
        EventToVariableOptions::default().mask(),
    )?;
    builder.event_to_variable(
        "PARKING_BRAKE_SET",
        EventToVariableMapping::EventDataToValue(|event_data| from_bool(event_data == 1)),
        Variable::Named("PARK_BRAKE_LEVER_POS".to_owned()),
        EventToVariableOptions::default().mask(),
    )?;

    // Controller inputs for the left and right brakes are captured and translated
    // to a named variable so that it can be used by the simulation.
    // After running the simulation, the variable value is written back to the simulator
    // through the event.
    builder.event_to_variable(
        "AXIS_LEFT_BRAKE_SET",
        EventToVariableMapping::EventData32kPosition,
        Variable::Aspect("BRAKE LEFT FORCE FACTOR".to_owned()),
        EventToVariableOptions::default()
            .mask()
            .bidirectional(VariableToEventMapping::EventData32kPosition),
    )?;
    builder.event_to_variable(
        "AXIS_RIGHT_BRAKE_SET",
        EventToVariableMapping::EventData32kPosition,
        Variable::Aspect("BRAKE RIGHT FORCE FACTOR".to_owned()),
        EventToVariableOptions::default()
            .mask()
            .bidirectional(VariableToEventMapping::EventData32kPosition),
    )?;

    // Keyboard inputs for both brakes, left brake, and right brake are captured and
    // translated via a smooth press function into a ratio which is written to variables.
    const KEYBOARD_PRESS_SPEED: f64 = 0.6;
    const KEYBOARD_RELEASE_SPEED: f64 = 0.3;
    builder.event_to_variable(
        "BRAKES",
        EventToVariableMapping::SmoothPress(KEYBOARD_PRESS_SPEED, KEYBOARD_RELEASE_SPEED),
        Variable::Aspect("BRAKES".to_owned()),
        EventToVariableOptions::default().mask(),
    )?;
    builder.event_to_variable(
        "BRAKES_LEFT",
        EventToVariableMapping::SmoothPress(KEYBOARD_PRESS_SPEED, KEYBOARD_RELEASE_SPEED),
        Variable::Aspect("BRAKES_LEFT".to_owned()),
        EventToVariableOptions::default().mask(),
    )?;
    builder.event_to_variable(
        "BRAKES_RIGHT",
        EventToVariableMapping::SmoothPress(KEYBOARD_PRESS_SPEED, KEYBOARD_RELEASE_SPEED),
        Variable::Aspect("BRAKES_RIGHT".to_owned()),
        EventToVariableOptions::default().mask(),
    )?;

    // The maximum braking demand of all keyboard and controller inputs
    // is calculated and made available as a percentage.
    builder.reduce(
        UpdateOn::PreTick,
        vec![
            Variable::Aspect("BRAKES".to_owned()),
            Variable::Aspect("BRAKES_LEFT".to_owned()),
            Variable::Aspect("BRAKE LEFT FORCE FACTOR".to_owned()),
        ],
        to_percent_max,
        Variable::Named("LEFT_BRAKE_PEDAL_INPUT".to_owned()),
    );
    builder.reduce(
        UpdateOn::PreTick,
        vec![
            Variable::Aspect("BRAKES".to_owned()),
            Variable::Aspect("BRAKES_RIGHT".to_owned()),
            Variable::Aspect("BRAKE RIGHT FORCE FACTOR".to_owned()),
        ],
        to_percent_max,
        Variable::Named("RIGHT_BRAKE_PEDAL_INPUT".to_owned()),
    );

    Ok(())
}

fn to_percent_max(accumulator: f64, item: f64) -> f64 {
    max(accumulator, item * 100.)
}

fn autobrakes(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    let options = EventToVariableOptions::default()
        .ignore_repeats_for(Duration::from_millis(1500))
        .after_tick_set_to(0.);

    builder.event_to_variable(
        "AUTOBRAKE_LO_SET",
        EventToVariableMapping::Value(1.),
        Variable::Named("OVHD_AUTOBRK_LOW_ON_IS_PRESSED".to_owned()),
        options,
    )?;
    builder.event_to_variable(
        "AUTOBRAKE_MED_SET",
        EventToVariableMapping::Value(1.),
        Variable::Named("OVHD_AUTOBRK_MED_ON_IS_PRESSED".to_owned()),
        options,
    )?;
    builder.event_to_variable(
        "AUTOBRAKE_HI_SET",
        EventToVariableMapping::Value(1.),
        Variable::Named("OVHD_AUTOBRK_MAX_ON_IS_PRESSED".to_owned()),
        options,
    )?;
    builder.event_to_variable(
        "AUTOBRAKE_DISARM",
        EventToVariableMapping::Value(1.),
        Variable::Named("AUTOBRAKE_DISARM".to_owned()),
        EventToVariableOptions::default().after_tick_set_to(0.),
    )?;

    Ok(())
}

fn flaps(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    builder.event_to_variable(
        "FLAPS_INCR",
        EventToVariableMapping::CurrentValueToValue(|current_value| (current_value + 1.).min(4.)),
        Variable::Named("FLAPS_HANDLE_INDEX".to_owned()),
        EventToVariableOptions::default().mask(),
    )?;
    builder.event_to_variable(
        "FLAPS_DECR",
        EventToVariableMapping::CurrentValueToValue(|current_value| (current_value - 1.).max(0.)),
        Variable::Named("FLAPS_HANDLE_INDEX".to_owned()),
        EventToVariableOptions::default().mask(),
    )?;
    flaps_event_to_value(builder, "FLAPS_UP", 0.)?;
    flaps_event_to_value(builder, "FLAPS_1", 1.)?;
    flaps_event_to_value(builder, "FLAPS_2", 2.)?;
    flaps_event_to_value(builder, "FLAPS_3", 3.)?;
    flaps_event_to_value(builder, "FLAPS_DOWN", 4.)?;
    builder.event_to_variable(
        "FLAPS_SET",
        EventToVariableMapping::EventDataAndCurrentValueToValue(|event_data, current_value| {
            let normalized_input: f64 = (event_data as i32 as f64) / 8192. - 1.;
            get_handle_pos_from_0_1(normalized_input, current_value)
        }),
        Variable::Named("FLAPS_HANDLE_INDEX".to_owned()),
        EventToVariableOptions::default().mask(),
    )?;
    builder.event_to_variable(
        "AXIS_FLAPS_SET",
        EventToVariableMapping::EventDataAndCurrentValueToValue(|event_data, current_value| {
            let normalized_input: f64 = (event_data as i32 as f64) / 16384.;
            get_handle_pos_from_0_1(normalized_input, current_value)
        }),
        Variable::Named("FLAPS_HANDLE_INDEX".to_owned()),
        EventToVariableOptions::default().mask(),
    )?;

    builder.map(
        UpdateOn::PreTick,
        Variable::Named("FLAPS_HANDLE_INDEX".to_owned()),
        |value| value / 4.,
        Variable::Named("FLAPS_HANDLE_PERCENT".to_owned()),
    );

    Ok(())
}

fn flaps_event_to_value(
    builder: &mut MsfsAspectBuilder,
    event_name: &str,
    value: f64,
) -> Result<(), Box<dyn Error>> {
    builder.event_to_variable(
        event_name,
        EventToVariableMapping::Value(value),
        Variable::Named("FLAPS_HANDLE_INDEX".to_owned()),
        EventToVariableOptions::default().mask(),
    )
}

fn get_handle_pos_from_0_1(input: f64, current_value: f64) -> f64 {
    if input < -0.8 {
        0.
    } else if input > -0.7 && input < -0.3 {
        1.
    } else if input > -0.2 && input < 0.2 {
        2.
    } else if input > 0.3 && input < 0.7 {
        3.
    } else if input > 0.8 {
        4.
    } else {
        current_value
    }
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

    //LVars to communicate between the flap movement logic
    //and the simulation animation
    left_flaps_position_sim_var: NamedVariable,
    right_flaps_position_sim_var: NamedVariable,
    left_slats_position_sim_var: NamedVariable,
    right_slats_position_sim_var: NamedVariable,

    msfs_flaps_handle_index: FlapsHandleIndex,
    flaps_surface_sim_object: FlapsSurface,
    slats_surface_sim_object: SlatsSurface,
    left_flaps_position: f64,
    right_flaps_position: f64,

    left_slats_position: f64,
    right_slats_position: f64,
}
impl MsfsAspectCtor for Flaps {
    fn new(
        registry: &mut MsfsVariableRegistry,
        _: &mut SimConnect,
    ) -> Result<Self, Box<dyn Error>> {
        Ok(Self {
            flaps_left_position_id: registry.get("LEFT_FLAPS_POSITION_PERCENT".to_owned()),
            flaps_right_position_id: registry.get("RIGHT_FLAPS_POSITION_PERCENT".to_owned()),
            slats_left_position_id: registry.get("LEFT_SLATS_POSITION_PERCENT".to_owned()),
            slats_right_position_id: registry.get("RIGHT_SLATS_POSITION_PERCENT".to_owned()),

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

            left_flaps_position: 0.,
            right_flaps_position: 0.,

            left_slats_position: 0.,
            right_slats_position: 0.,
        })
    }
}

impl Flaps {
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
