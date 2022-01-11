//#![cfg(any(target_arch = "wasm32", doc))]
use std::{error::Error, time::Duration};

use a320_systems::A320;
use msfs::sim_connect;
use msfs::{
    legacy::{AircraftVariable, NamedVariable},
    sim_connect::SimConnect,
    sim_connect::SIMCONNECT_OBJECT_ID_USER,
    sys,
};

use systems::shared::{from_bool, to_bool};
use systems::{
    failures::FailureType,
    simulation::{VariableIdentifier, VariableRegistry},
};
use systems_wasm::aspects::{
    max, EventToVariableOptions, MsfsAspectBuilder, UpdateOn, VariableToEventMapping,
    VariablesToObject,
};
use systems_wasm::{
    aspects::EventToVariableMapping, f64_to_sim_connect_32k_pos, set_data_on_sim_object,
    MsfsAspectCtor, MsfsSimulationBuilder, MsfsVariableRegistry, SimulatorAspect, Variable,
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
            .provides_aircraft_variable("EXTERNAL POWER AVAILABLE", "Bool", 1)?
            .provides_aircraft_variable("FUEL TANK LEFT MAIN QUANTITY", "Pounds", 0)?
            .provides_aircraft_variable("GEAR ANIMATION POSITION", "Percent", 0)?
            .provides_aircraft_variable("GEAR ANIMATION POSITION", "Percent", 1)?
            .provides_aircraft_variable("GEAR ANIMATION POSITION", "Percent", 2)?
            .provides_aircraft_variable("GEAR CENTER POSITION", "Percent", 0)?
            .provides_aircraft_variable("GEAR HANDLE POSITION", "Bool", 0)?
            .provides_aircraft_variable("GENERAL ENG STARTER ACTIVE", "Bool", 1)?
            .provides_aircraft_variable("GENERAL ENG STARTER ACTIVE", "Bool", 2)?
            .provides_aircraft_variable("GPS GROUND SPEED", "Knots", 0)?
            .provides_aircraft_variable("GPS GROUND MAGNETIC TRACK", "Degrees", 0)?
            .provides_aircraft_variable("INDICATED ALTITUDE", "Feet", 0)?
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
            .with_aspect(aircraft_variable_mapping)?
            .with_aspect(brakes)?
            .with_aspect(autobrakes)?
            .with_aspect(nose_wheel_steering)?
            .with_aspect(flaps)?
            .build(A320::new)?;

    while let Some(event) = gauge.next_event().await {
        handler.handle(event, &mut simulation, sim_connect.as_mut().get_mut())?;
    }

    Ok(())
}

fn aircraft_variable_mapping(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    builder.copy(
        Variable::Aircraft("APU GENERATOR SWITCH".to_owned(), "Bool".to_owned(), 0),
        Variable::Aspect("OVHD_ELEC_APU_GEN_PB_IS_ON".to_owned()),
    );
    builder.copy(
        Variable::Aircraft("BLEED AIR ENGINE".to_owned(), "Bool".to_owned(), 1),
        Variable::Aspect("OVHD_PNEU_ENG_1_BLEED_PB_IS_AUTO".to_owned()),
    );
    builder.copy(
        Variable::Aircraft("BLEED AIR ENGINE".to_owned(), "Bool".to_owned(), 2),
        Variable::Aspect("OVHD_PNEU_ENG_2_BLEED_PB_IS_AUTO".to_owned()),
    );
    builder.copy(
        Variable::Aircraft("EXTERNAL POWER AVAILABLE".to_owned(), "Bool".to_owned(), 1),
        Variable::Aspect("OVHD_ELEC_EXT_PWR_PB_IS_AVAILABLE".to_owned()),
    );
    builder.copy(
        Variable::Aircraft("EXTERNAL POWER ON".to_owned(), "Bool".to_owned(), 1),
        Variable::Aspect("OVHD_ELEC_EXT_PWR_PB_IS_ON".to_owned()),
    );

    builder.copy(
        Variable::Aircraft(
            "GENERAL ENG MASTER ALTERNATOR".to_owned(),
            "Bool".to_owned(),
            1,
        ),
        Variable::Aspect("OVHD_ELEC_ENG_GEN_1_PB_IS_ON".to_owned()),
    );

    builder.copy(
        Variable::Aircraft(
            "GENERAL ENG MASTER ALTERNATOR".to_owned(),
            "Bool".to_owned(),
            2,
        ),
        Variable::Aspect("OVHD_ELEC_ENG_GEN_2_PB_IS_ON".to_owned()),
    );

    builder.map(
        UpdateOn::PreTick,
        Variable::Aircraft(
            "INTERACTIVE POINT OPEN".to_owned(),
            "Position".to_owned(),
            5,
        ),
        |value| if value > 0. { 1. } else { 0. },
        Variable::Aspect("FWD_DOOR_CARGO_OPEN_REQ".to_owned()),
    );

    Ok(())
}

fn brakes(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    builder.event_to_variable(
        "PARKING_BRAKES",
        EventToVariableMapping::CurrentValueToValue(|current_value| {
            from_bool(!to_bool(current_value))
        }),
        Variable::Named("PARK_BRAKE_LEVER_POS".to_owned()),
        |options| options.mask(),
    )?;
    builder.event_to_variable(
        "PARKING_BRAKE_SET",
        EventToVariableMapping::EventDataToValue(|event_data| from_bool(event_data == 1)),
        Variable::Named("PARK_BRAKE_LEVER_POS".to_owned()),
        |options| options.mask(),
    )?;

    // Controller inputs for the left and right brakes are captured and translated
    // to a named variable so that it can be used by the simulation.
    // After running the simulation, the variable value is written back to the simulator
    // through the event.
    let options = |options: EventToVariableOptions| {
        options
            .mask()
            .bidirectional(VariableToEventMapping::EventData32kPosition)
    };
    builder.event_to_variable(
        "AXIS_LEFT_BRAKE_SET",
        EventToVariableMapping::EventData32kPosition,
        Variable::Aspect("BRAKE LEFT FORCE FACTOR".to_owned()),
        options,
    )?;
    builder.event_to_variable(
        "AXIS_RIGHT_BRAKE_SET",
        EventToVariableMapping::EventData32kPosition,
        Variable::Aspect("BRAKE RIGHT FORCE FACTOR".to_owned()),
        options,
    )?;

    // Keyboard inputs for both brakes, left brake, and right brake are captured and
    // translated via a smooth press function into a ratio which is written to variables.
    const KEYBOARD_PRESS_SPEED: f64 = 0.6;
    const KEYBOARD_RELEASE_SPEED: f64 = 0.3;
    builder.event_to_variable(
        "BRAKES",
        EventToVariableMapping::SmoothPress(KEYBOARD_PRESS_SPEED, KEYBOARD_RELEASE_SPEED),
        Variable::Aspect("BRAKES".to_owned()),
        |options| options.mask(),
    )?;
    builder.event_to_variable(
        "BRAKES_LEFT",
        EventToVariableMapping::SmoothPress(KEYBOARD_PRESS_SPEED, KEYBOARD_RELEASE_SPEED),
        Variable::Aspect("BRAKES_LEFT".to_owned()),
        |options| options.mask(),
    )?;
    builder.event_to_variable(
        "BRAKES_RIGHT",
        EventToVariableMapping::SmoothPress(KEYBOARD_PRESS_SPEED, KEYBOARD_RELEASE_SPEED),
        Variable::Aspect("BRAKES_RIGHT".to_owned()),
        |options| options.mask(),
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
    let options = |options: EventToVariableOptions| {
        options
            .ignore_repeats_for(Duration::from_millis(1500))
            .after_tick_set_to(0.)
    };

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
        |options| options.after_tick_set_to(0.),
    )?;

    Ok(())
}

fn nose_wheel_steering(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    // The rudder pedals should start in a centered position.
    builder.init_variable(
        Variable::Aspect("RAW_RUDDER_PEDAL_POSITION".to_owned()),
        0.5,
    );

    builder.map(
        UpdateOn::PreTick,
        Variable::Named("RUDDER_PEDAL_POSITION".to_owned()),
        |value| ((value + 100.) / 200.),
        Variable::Aspect("RAW_RUDDER_PEDAL_POSITION".to_owned()),
    );

    builder.map_many(
        UpdateOn::PostTick,
        vec![
            Variable::Named("REALISTIC_TILLER_ENABLED".to_owned()),
            Variable::Aspect("RAW_RUDDER_PEDAL_POSITION".to_owned()),
        ],
        |values| {
            let realistic_tiller_enabled = to_bool(values[0]);
            let rudder_pedal_position = values[1];
            if realistic_tiller_enabled {
                // Convert rudder pedal position to [-1;1], -1 is left
                rudder_pedal_position * 2. - 1.
            } else {
                0.
            }
        },
        Variable::Named("RUDDER_PEDAL_POSITION".to_owned()),
    );

    // The tiller handle should start in a centered position.
    builder.init_variable(
        Variable::Aspect("RAW_TILLER_HANDLE_POSITION".to_owned()),
        0.5,
    );

    // Lacking a better event to bind to, we've picked a mixture axis for setting the
    // tiller handle position.
    builder.event_to_variable(
        "AXIS_MIXTURE4_SET",
        EventToVariableMapping::EventData32kPosition,
        Variable::Aspect("RAW_TILLER_HANDLE_POSITION".to_owned()),
        |options| options.mask(),
    )?;

    const TILLER_KEYBOARD_INCREMENTS: f64 = 0.05;
    builder.event_to_variable(
        "STEERING_INC",
        EventToVariableMapping::CurrentValueToValue(|current_value| {
            recenter_when_close_to_center(
                (current_value + TILLER_KEYBOARD_INCREMENTS).min(1.),
                TILLER_KEYBOARD_INCREMENTS,
            )
        }),
        Variable::Aspect("RAW_TILLER_HANDLE_POSITION".to_owned()),
        |options| options.mask(),
    )?;
    builder.event_to_variable(
        "STEERING_DEC",
        EventToVariableMapping::CurrentValueToValue(|current_value| {
            recenter_when_close_to_center(
                (current_value - TILLER_KEYBOARD_INCREMENTS).max(0.),
                TILLER_KEYBOARD_INCREMENTS,
            )
        }),
        Variable::Aspect("RAW_TILLER_HANDLE_POSITION".to_owned()),
        |options| options.mask(),
    )?;

    builder.map_many(
        UpdateOn::PostTick,
        vec![
            Variable::Named("REALISTIC_TILLER_ENABLED".to_owned()),
            Variable::Aspect("RAW_RUDDER_PEDAL_POSITION".to_owned()),
            Variable::Aspect("RAW_TILLER_HANDLE_POSITION".to_owned()),
            Variable::Aspect("TILLER_PEDAL_DISCONNECT".to_owned()),
        ],
        |values| {
            let realistic_tiller_enabled = to_bool(values[0]);
            let rudder_pedal_position = values[1];
            let tiller_handle_position = values[2];
            let tiller_pedal_disconnect = to_bool(values[3]);

            if realistic_tiller_enabled {
                // Convert tiller handle position to [-1;1], -1 is left
                tiller_handle_position * 2. - 1.
            } else {
                if !tiller_pedal_disconnect {
                    // Convert rudder pedal position to [-1;1], -1 is left
                    rudder_pedal_position * 2. - 1.
                } else {
                    0.
                }
            }
        },
        Variable::Named("TILLER_HANDLE_POSITION".to_owned()),
    );

    // Lacking a better event to bind to, we've picked the toggle water rudder event for
    // disconnecting the rudder pedals via the PEDALS DISC button on the tiller.
    builder.event_to_variable(
        "TOGGLE_WATER_RUDDER",
        EventToVariableMapping::Value(1.),
        Variable::Aspect("TILLER_PEDAL_DISCONNECT".to_owned()),
        |options| options.mask().after_tick_set_to(0.),
    )?;

    builder.init_variable(Variable::Aspect("RUDDER_POSITION_RAW".to_owned()), 0.5);

    builder.map(
        UpdateOn::PreTick,
        Variable::Aircraft("RUDDER POSITION".to_owned(), "Position".to_owned(), 0),
        |value| value + 1. / 2.,
        Variable::Aspect("RUDDER_POSITION_RAW".to_owned()),
    );

    builder.map(
        UpdateOn::PostTick,
        Variable::Aspect("NOSE_WHEEL_POSITION_RAW".to_owned()),
        steering_animation_to_msfs_from_steering_angle,
        Variable::Named("NOSE_WHEEL_POSITION".to_owned()),
    );

    builder.map_many(
        UpdateOn::PostTick,
        vec![
            Variable::Aspect("NOSE_WHEEL_POSITION_RAW".to_owned()),
            Variable::Aspect("RUDDER_POSITION_RAW".to_owned()),
        ],
        |values| {
            let nose_wheel_position = values[0];
            let rudder_position = values[1];

            steering_demand_to_msfs_from_steering_angle(nose_wheel_position, rudder_position)
        },
        Variable::Aspect("STEERING_ANGLE".to_owned()),
    );

    builder.variable_to_event(
        Variable::Aspect("STEERING_ANGLE".to_owned()),
        VariableToEventMapping::EventData32kPosition,
        "STEERING_SET",
    );

    Ok(())
}

fn recenter_when_close_to_center(value: f64, increment: f64) -> f64 {
    if value < 0.5 + increment && value > 0.5 - increment {
        0.5
    } else {
        value
    }
}

const MAX_CONTROLLABLE_STEERING_ANGLE_DEGREES: f64 = 75.;

fn steering_animation_to_msfs_from_steering_angle(nose_wheel_position: f64) -> f64 {
    const STEERING_ANIMATION_TOTAL_RANGE_DEGREES: f64 = 360.;

    ((nose_wheel_position * MAX_CONTROLLABLE_STEERING_ANGLE_DEGREES
        / (STEERING_ANIMATION_TOTAL_RANGE_DEGREES / 2.))
        / 2.)
        + 0.5
}

fn steering_demand_to_msfs_from_steering_angle(
    nose_wheel_position: f64,
    rudder_position: f64,
) -> f64 {
    const MAX_MSFS_STEERING_ANGLE_DEGREES: f64 = 90.;

    // Steering in msfs is the max we want rescaled to the max in msfs
    let steering_ratio_converted = nose_wheel_position * MAX_CONTROLLABLE_STEERING_ANGLE_DEGREES
        / MAX_MSFS_STEERING_ANGLE_DEGREES
        / 2.
        + 0.5;

    // Steering demand is reverted in msfs so we do 1 - angle.
    // Then we hack msfs by adding the rudder value that it will always substract internally
    // This way we end up with actual angle we required
    (1. - steering_ratio_converted) + (rudder_position - 0.5)
}

fn flaps(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    builder.event_to_variable(
        "FLAPS_INCR",
        EventToVariableMapping::CurrentValueToValue(|current_value| (current_value + 1.).min(4.)),
        Variable::Named("FLAPS_HANDLE_INDEX".to_owned()),
        |options| options.mask(),
    )?;
    builder.event_to_variable(
        "FLAPS_DECR",
        EventToVariableMapping::CurrentValueToValue(|current_value| (current_value - 1.).max(0.)),
        Variable::Named("FLAPS_HANDLE_INDEX".to_owned()),
        |options| options.mask(),
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
        |options| options.mask(),
    )?;
    builder.event_to_variable(
        "AXIS_FLAPS_SET",
        EventToVariableMapping::EventDataAndCurrentValueToValue(|event_data, current_value| {
            let normalized_input: f64 = (event_data as i32 as f64) / 16384.;
            get_handle_pos_from_0_1(normalized_input, current_value)
        }),
        Variable::Named("FLAPS_HANDLE_INDEX".to_owned()),
        |options| options.mask(),
    )?;

    builder.map(
        UpdateOn::PreTick,
        Variable::Named("FLAPS_HANDLE_INDEX".to_owned()),
        |value| value / 4.,
        Variable::Named("FLAPS_HANDLE_PERCENT".to_owned()),
    );

    builder.variables_to_object(Box::new(FlapsSurface {
        left_flap: 0.,
        right_flap: 0.,
    }));
    builder.variables_to_object(Box::new(SlatsSurface {
        left_slat: 0.,
        right_slat: 0.,
    }));
    builder.variables_to_object(Box::new(FlapsHandleIndex { index: 0. }));

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
        |options| options.mask(),
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

impl VariablesToObject for FlapsSurface {
    fn variables(&self) -> Vec<Variable> {
        vec![
            Variable::Named("LEFT_FLAPS_POSITION_PERCENT".to_owned()),
            Variable::Named("RIGHT_FLAPS_POSITION_PERCENT".to_owned()),
        ]
    }

    fn write(&mut self, values: Vec<f64>) {
        self.left_flap = values[0];
        self.right_flap = values[1];
    }

    set_data_on_sim_object!();
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

impl VariablesToObject for SlatsSurface {
    fn variables(&self) -> Vec<Variable> {
        vec![
            Variable::Named("LEFT_SLATS_POSITION_PERCENT".to_owned()),
            Variable::Named("RIGHT_SLATS_POSITION_PERCENT".to_owned()),
        ]
    }

    fn write(&mut self, values: Vec<f64>) {
        self.left_slat = values[0];
        self.right_slat = values[1];
    }

    set_data_on_sim_object!();
}

#[sim_connect::data_definition]
struct FlapsHandleIndex {
    #[name = "FLAPS HANDLE INDEX"]
    #[unit = "Number"]
    index: f64,
}

impl VariablesToObject for FlapsHandleIndex {
    fn variables(&self) -> Vec<Variable> {
        vec![
            Variable::Named("LEFT_FLAPS_POSITION_PERCENT".to_owned()),
            Variable::Named("RIGHT_FLAPS_POSITION_PERCENT".to_owned()),
            Variable::Named("LEFT_SLATS_POSITION_PERCENT".to_owned()),
            Variable::Named("RIGHT_SLATS_POSITION_PERCENT".to_owned()),
        ]
    }

    fn write(&mut self, values: Vec<f64>) {
        self.index = Self::msfs_flap_index_from_surfaces_positions_percent(values);
    }

    set_data_on_sim_object!();
}

impl FlapsHandleIndex {
    /// Tries to take actual surfaces position PERCENTS and convert it into flight model FLAP HANDLE INDEX
    /// This index is used by MSFS to select correct aerodynamic properties
    /// There is no index available for flaps but no slats configurations (possible plane failure case)
    /// The percent thresholds can be tuned to change the timing of aerodynamic impact versus surface actual position
    fn msfs_flap_index_from_surfaces_positions_percent(values: Vec<f64>) -> f64 {
        let left_flaps_position = values[0];
        let right_flaps_position = values[1];
        let left_slats_position = values[2];
        let right_slats_position = values[3];
        let flap_mean_position = (left_flaps_position + right_flaps_position) / 2.;
        let slat_mean_position = (left_slats_position + right_slats_position) / 2.;

        if flap_mean_position < 2. && slat_mean_position < 2. {
            // Clean configuration no flaps no slats
            0.
        } else if flap_mean_position < 12. && slat_mean_position > 15. {
            // Almost no flaps but some slats -> CONF 1
            1.
        } else if flap_mean_position > 80. {
            5.
        } else if flap_mean_position > 49. {
            4.
        } else if flap_mean_position > 30. {
            3.
        } else if flap_mean_position > 12. {
            2.
        } else {
            0.
        }
    }
}

struct NoseWheelSteering {
    rudder_position_var: AircraftVariable,
    rudder_position: f64,

    nose_wheel_position_id: VariableIdentifier,
    nose_wheel_position_var: NamedVariable,
    nose_wheel_position: f64,

    nose_wheel_angle_event: sys::DWORD,
}

impl MsfsAspectCtor for NoseWheelSteering {
    fn new(
        registry: &mut MsfsVariableRegistry,
        sim_connect: &mut SimConnect,
    ) -> Result<Self, Box<dyn Error>> {
        Ok(Self {
            rudder_position_var: AircraftVariable::from("RUDDER POSITION", "Position", 0)?,
            rudder_position: 0.5,

            nose_wheel_position_id: registry.get("NOSE_WHEEL_POSITION_RATIO".to_owned()),
            nose_wheel_position_var: NamedVariable::from("A32NX_NOSE_WHEEL_POSITION"),
            nose_wheel_position: 0.,

            nose_wheel_angle_event: sim_connect
                .map_client_event_to_sim_event("STEERING_SET", true)?,
        })
    }
}
impl NoseWheelSteering {
    const MAX_CONTROLLABLE_STEERING_ANGLE_DEGREES: f64 = 75.;
    const MAX_MSFS_STEERING_ANGLE_DEGREES: f64 = 90.;
    const STEERING_ANIMATION_TOTAL_RANGE_DEGREES: f64 = 360.;

    /// Steering position is [-1;1]  -1 is left, 0 is straight
    fn set_nose_wheel_position(&mut self, nose_wheel_position: f64) {
        self.nose_wheel_position = nose_wheel_position;
    }

    fn synchronise_with_sim(&mut self) {
        let rudder_position: f64 = self.rudder_position_var.get();
        self.rudder_position = (rudder_position + 1.) / 2.;
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
    fn write(&mut self, identifier: &VariableIdentifier, value: f64) -> bool {
        if identifier == &self.nose_wheel_position_id {
            self.set_nose_wheel_position(value);
            true
        } else {
            false
        }
    }

    fn pre_tick(
        &mut self,
        _variables: &mut MsfsVariableRegistry,
        _: &mut SimConnect,
        _: Duration,
    ) -> Result<(), Box<dyn Error>> {
        self.synchronise_with_sim();
        Ok(())
    }

    fn post_tick(
        &mut self,
        _variables: &mut MsfsVariableRegistry,
        sim_connect: &mut SimConnect,
    ) -> Result<(), Box<dyn Error>> {
        self.transmit_client_events(sim_connect)?;
        self.write_animation_position_to_sim();

        Ok(())
    }
}
