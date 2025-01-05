use std::error::Error;

use msfs::sim_connect;
use msfs::{sim_connect::SimConnect, sim_connect::SIMCONNECT_OBJECT_ID_USER};
use systems::shared::to_bool;

use systems_wasm::aspects::{MsfsAspectBuilder, ObjectWrite, VariablesToObject};
use systems_wasm::{set_data_on_sim_object, Variable};

pub(super) fn fuel(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    for i in 1..=11 {
        builder.copy(
            Variable::aircraft("FUELSYSTEM TANK QUANTITY", "gallons", i),
            Variable::aspect(&format!("FUEL_TANK_QUANTITY_{i}")),
        );
    }

    builder.variables_to_object(Box::<Fuel>::default());

    Ok(())
}

#[sim_connect::data_definition]
#[derive(Default)]
struct Fuel {
    #[name = "FUELSYSTEM TANK QUANTITY:1"]
    #[unit = "gallons"]
    fuel_1: f64,

    #[name = "FUELSYSTEM TANK QUANTITY:2"]
    #[unit = "gallons"]
    fuel_2: f64,

    #[name = "FUELSYSTEM TANK QUANTITY:3"]
    #[unit = "gallons"]
    fuel_3: f64,

    #[name = "FUELSYSTEM TANK QUANTITY:4"]
    #[unit = "gallons"]
    fuel_4: f64,

    #[name = "FUELSYSTEM TANK QUANTITY:5"]
    #[unit = "gallons"]
    fuel_5: f64,

    #[name = "FUELSYSTEM TANK QUANTITY:6"]
    #[unit = "gallons"]
    fuel_6: f64,

    #[name = "FUELSYSTEM TANK QUANTITY:7"]
    #[unit = "gallons"]
    fuel_7: f64,

    #[name = "FUELSYSTEM TANK QUANTITY:8"]
    #[unit = "gallons"]
    fuel_8: f64,

    #[name = "FUELSYSTEM TANK QUANTITY:9"]
    #[unit = "gallons"]
    fuel_9: f64,

    #[name = "FUELSYSTEM TANK QUANTITY:10"]
    #[unit = "gallons"]
    fuel_10: f64,

    #[name = "FUELSYSTEM TANK QUANTITY:11"]
    #[unit = "gallons"]
    fuel_11: f64,
}

impl VariablesToObject for Fuel {
    fn variables(&self) -> Vec<Variable> {
        // (1..=11)
        //    .map(|i| Variable::aspect(&format!("FUEL_TANK_QUANTITY_{i}")))
        //    .collect::<Vec<_>>()

        vec![
            Variable::aspect("FUEL_TANK_QUANTITY_1"),
            Variable::aspect("FUEL_TANK_QUANTITY_2"),
            Variable::aspect("FUEL_TANK_QUANTITY_3"),
            Variable::aspect("FUEL_TANK_QUANTITY_4"),
            Variable::aspect("FUEL_TANK_QUANTITY_5"),
            Variable::aspect("FUEL_TANK_QUANTITY_6"),
            Variable::aspect("FUEL_TANK_QUANTITY_7"),
            Variable::aspect("FUEL_TANK_QUANTITY_8"),
            Variable::aspect("FUEL_TANK_QUANTITY_9"),
            Variable::aspect("FUEL_TANK_QUANTITY_10"),
            Variable::aspect("FUEL_TANK_QUANTITY_11"),
            Variable::named("REFUEL_STARTED_BY_USR"),
        ]
    }

    fn write(&mut self, values: Vec<f64>) -> ObjectWrite {
        self.fuel_1 = values[0];
        self.fuel_2 = values[1];
        self.fuel_3 = values[2];
        self.fuel_4 = values[3];
        self.fuel_5 = values[4];
        self.fuel_6 = values[5];
        self.fuel_7 = values[6];
        self.fuel_8 = values[7];
        self.fuel_9 = values[8];
        self.fuel_10 = values[9];
        self.fuel_11 = values[10];

        ObjectWrite::on(to_bool(values[11]))
    }

    set_data_on_sim_object!();
}
