use std::error::Error;

use msfs::sim_connect;
use msfs::{sim_connect::SimConnect, sim_connect::SIMCONNECT_OBJECT_ID_USER};

use systems_wasm::aspects::{MsfsAspectBuilder, ObjectWrite, VariablesToObject};
use systems_wasm::{set_data_on_sim_object, Variable};

pub(super) fn reversers(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    builder.variables_to_object(Box::new(ReverserThrust {
        velocity_z: 0.,
        angular_acc_y: 0.,
    }));

    Ok(())
}

const LOW_SPEED_MODE_SPEED_THRESHOLD_FOOT_PER_SEC: f64 = -0.2;

// Multiplier that will artificially increase reverser thrust at low speed to overcome magical MSFS static ground friction in reverse
const LOW_SPEED_MODE_SPEED_FORCE_MULTIPLIER: f64 = 3.;

// Multiplier to tune the angular torque caused by thrust reverser asymetry
const ASYMETRY_EFFECT_MAGIC_MULTIPLIER: f64 = 10.;

#[sim_connect::data_definition]
struct ReverserThrust {
    #[name = "VELOCITY BODY Z"]
    #[unit = "Feet per second"]
    velocity_z: f64,

    #[name = "ROTATION ACCELERATION BODY Y"]
    #[unit = "Radian per second squared"]
    angular_acc_y: f64,
}

impl VariablesToObject for ReverserThrust {
    fn variables(&self) -> Vec<Variable> {
        vec![
            Variable::aircraft("VELOCITY BODY Z", "Feet per second", 0),
            Variable::aspect("REVERSER_DELTA_SPEED"),
            Variable::aircraft(
                "ROTATION ACCELERATION BODY Y",
                "Radian per second squared",
                0,
            ),
            Variable::named("REVERSER_ANGULAR_ACCELERATION"),
            Variable::aspect("BRAKE LEFT FORCE FACTOR"),
            Variable::aspect("BRAKE RIGHT FORCE FACTOR"),
        ]
    }

    fn write(&mut self, values: Vec<f64>) -> ObjectWrite {
        let brakes_in_use = values[4] + values[5] > 0.05;

        self.velocity_z = if values[0] < 0.
            && values[0] > LOW_SPEED_MODE_SPEED_THRESHOLD_FOOT_PER_SEC
            && !brakes_in_use
        {
            values[0] + LOW_SPEED_MODE_SPEED_FORCE_MULTIPLIER * values[1]
        } else {
            values[0] + values[1]
        };

        self.angular_acc_y = values[2] + ASYMETRY_EFFECT_MAGIC_MULTIPLIER * values[3];

        ObjectWrite::on(values[1].abs() > 0. || values[3].abs() > 0.)
    }

    set_data_on_sim_object!();
}
