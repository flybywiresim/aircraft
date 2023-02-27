use std::error::Error;

use msfs::sim_connect;
use msfs::{sim_connect::SimConnect, sim_connect::SIMCONNECT_OBJECT_ID_USER};

use systems_wasm::aspects::{MsfsAspectBuilder, ObjectWrite, VariablesToObject};
use systems_wasm::{set_data_on_sim_object, Variable};

pub(super) fn reversers(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    builder.variables_to_object(Box::new(ReverserThrust {
        velz: 0.,
        angular_acc_Y: 0.,
    }));

    Ok(())
}

#[sim_connect::data_definition]
struct ReverserThrust {
    #[name = "VELOCITY BODY Z"]
    #[unit = "Feet per second"]
    velz: f64,

    #[name = "ROTATION ACCELERATION BODY Y"]
    #[unit = "Radians per second squared"]
    angular_acc_Y: f64,
}

impl VariablesToObject for ReverserThrust {
    fn variables(&self) -> Vec<Variable> {
        vec![
            Variable::aircraft("VELOCITY BODY Z", "feet per second squared", 0),
            Variable::named("REVERSER_DELTA_SPEED"),
            Variable::aircraft(
                "ROTATION ACCELERATION BODY Y",
                "Radians per second squared",
                0,
            ),
            Variable::named("REVERSER_ANGULAR_ACCELERATION"),
        ]
    }

    fn write(&mut self, values: Vec<f64>) -> ObjectWrite {
        self.velz = values[0] + values[1];
        self.angular_acc_Y = values[2] + values[3];

        println!(
            "WRITEBACK CURR SPEED= {:.4} REVERSER_DELTA= {:.4}  FINAL WRITE VEL{:.4} FINAL WRITE AngAcc{:.4}",
            values[0], values[1], self.velz, self.angular_acc_Y
        );

        ObjectWrite::on(values[1].abs() > 0. || values[3].abs() > 0.)
    }

    set_data_on_sim_object!();
}
