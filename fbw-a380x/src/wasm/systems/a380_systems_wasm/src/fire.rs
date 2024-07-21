use std::error::Error;

use msfs::sim_connect;
use msfs::{sim_connect::SimConnect, sim_connect::SIMCONNECT_OBJECT_ID_USER};

use systems_wasm::aspects::{MsfsAspectBuilder, ObjectWrite, VariablesToObject};
use systems_wasm::{set_data_on_sim_object, Variable};

pub(super) fn fire(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    builder.variables_to_object(Box::<Fire>::default());

    Ok(())
}

#[sim_connect::data_definition]
#[derive(Default)]
struct Fire {
    #[name = "ENG ON FIRE:1"]
    #[unit = "Bool"]
    fire_detected_1: f64,

    #[name = "ENG ON FIRE:2"]
    #[unit = "Bool"]
    fire_detected_2: f64,

    #[name = "ENG ON FIRE:3"]
    #[unit = "Bool"]
    fire_detected_3: f64,

    #[name = "ENG ON FIRE:4"]
    #[unit = "Bool"]
    fire_detected_4: f64,
}

impl VariablesToObject for Fire {
    fn variables(&self) -> Vec<Variable> {
        (1..=4)
            .map(|id| Variable::named(&format!("ENG_{}_ON_FIRE", id)))
            .collect()
    }

    fn write(&mut self, values: Vec<f64>) -> ObjectWrite {
        self.fire_detected_1 = values[0];
        self.fire_detected_2 = values[1];
        self.fire_detected_3 = values[2];
        self.fire_detected_4 = values[3];

        ObjectWrite::default()
    }

    set_data_on_sim_object!();
}
