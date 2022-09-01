use std::error::Error;

use msfs::sim_connect;
use msfs::{sim_connect::SimConnect, sim_connect::SIMCONNECT_OBJECT_ID_USER};

use systems_wasm::aspects::{
    EventToVariableMapping, MsfsAspectBuilder, ObjectWrite, VariableToEventMapping,
    VariableToEventWriteOn, VariablesToObject,
};
use systems_wasm::{set_data_on_sim_object, Variable};

pub(super) fn gear(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    // Read gear demand from all sim sim events and mask them
    let gear_set_set_event_id = builder.event_to_variable(
        "GEAR_SET",
        EventToVariableMapping::EventDataRaw,
        Variable::aspect("GEAR_LEVER_POSITION_REQUEST"),
        |options| options.mask(),
    )?;

    builder.event_to_variable(
        "GEAR_TOGGLE",
        EventToVariableMapping::CurrentValueToValue(
            |current_value| {
                if current_value > 0.5 {
                    0.
                } else {
                    1.
                }
            },
        ),
        Variable::aspect("GEAR_LEVER_POSITION_REQUEST"),
        |options| options.mask(),
    )?;

    builder.event_to_variable(
        "GEAR_UP",
        EventToVariableMapping::Value(0.),
        Variable::aspect("GEAR_LEVER_POSITION_REQUEST"),
        |options| options.mask(),
    )?;

    builder.event_to_variable(
        "GEAR_DOWN",
        EventToVariableMapping::Value(1.),
        Variable::aspect("GEAR_LEVER_POSITION_REQUEST"),
        |options| options.mask(),
    )?;

    // Feedback the gear event to the sim
    builder.variable_to_event_id(
        Variable::aspect("GEAR_HANDLE_POSITION"),
        VariableToEventMapping::EventDataRaw,
        VariableToEventWriteOn::Change,
        gear_set_set_event_id,
    );

    // GEAR POSITION FEEDBACK TO SIM
    builder.variables_to_object(Box::new(GearPosition {
        nose_position: 1.,
        left_position: 1.,
        right_position: 1.,
    }));

    // STATIC PLANE POSITION
    builder.variables_to_object(Box::new(PlaneStaticPosition {
        // longitude: -0.027933959772,
        // latitude: 0.82302885833,
        accx: 0.,
        accy: 0.,
        accz: 0.,
        velx: 0.,
        vely: 0.,
        velz: 0.,
    }));

    Ok(())
}

#[sim_connect::data_definition]
struct GearPosition {
    #[name = "GEAR CENTER POSITION"]
    #[unit = "Percent over 100"]
    nose_position: f64,

    #[name = "GEAR LEFT POSITION"]
    #[unit = "Percent over 100"]
    left_position: f64,

    #[name = "GEAR RIGHT POSITION"]
    #[unit = "Percent over 100"]
    right_position: f64,
}

impl VariablesToObject for GearPosition {
    fn variables(&self) -> Vec<Variable> {
        vec![
            Variable::named("GEAR_CENTER_POSITION"),
            Variable::named("GEAR_LEFT_POSITION"),
            Variable::named("GEAR_RIGHT_POSITION"),
        ]
    }

    fn write(&mut self, values: Vec<f64>) -> ObjectWrite {
        self.nose_position = values[0] / 100.;
        self.left_position = values[1] / 100.;
        self.right_position = values[2] / 100.;

        ObjectWrite::default()
    }

    set_data_on_sim_object!();
}

#[sim_connect::data_definition]
struct PlaneStaticPosition {
    // #[name = "PLANE LONGITUDE"]
    // #[unit = "Radians"]
    // longitude: f64,

    // #[name = "PLANE LATITUDE"]
    // #[unit = "Radians"]
    // latitude: f64,
    #[name = "ACCELERATION WORLD X"]
    #[unit = "Feet per second squared"]
    accx: f64,

    #[name = "ACCELERATION WORLD Y"]
    #[unit = "Feet per second squared"]
    accy: f64,

    #[name = "ACCELERATION WORLD Z"]
    #[unit = "Feet per second squared"]
    accz: f64,

    #[name = "VELOCITY BODY X"]
    #[unit = "Feet per second"]
    velx: f64,

    #[name = "VELOCITY BODY Y"]
    #[unit = "Feet per second"]
    vely: f64,

    #[name = "VELOCITY BODY Z"]
    #[unit = "Feet per second"]
    velz: f64,
}

impl VariablesToObject for PlaneStaticPosition {
    fn variables(&self) -> Vec<Variable> {
        vec![
            Variable::named("GEARSWING_LATITUDE"),
            Variable::named("GEARSWING_LONGITUDE"),
        ]
    }

    fn write(&mut self, values: Vec<f64>) -> ObjectWrite {
        // self.latitude = values[0];
        // self.longitude = values[1];

        self.accx = 0.;
        self.accy = 0.;
        self.accz = 0.;

        self.velx = 0.;
        self.vely = 0.;
        self.velz = 0.;

        ObjectWrite::default()
    }

    set_data_on_sim_object!();
}
