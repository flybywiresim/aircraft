use std::error::Error;

use msfs::sim_connect;
use msfs::{sim_connect::SimConnect, sim_connect::SIMCONNECT_OBJECT_ID_USER};

use systems_wasm::aspects::{MsfsAspectBuilder, ObjectWrite, VariablesToObject};
use systems_wasm::{set_data_on_sim_object, Variable};

pub(super) fn payload(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    builder.copy(
        Variable::aircraft("PAYLOAD STATION WEIGHT", "Pounds", 1),
        Variable::aspect("PAYLOAD_STATION_1_REQ"),
    );
    builder.copy(
        Variable::aircraft("PAYLOAD STATION WEIGHT", "Pounds", 2),
        Variable::aspect("PAYLOAD_STATION_2_REQ"),
    );
    builder.copy(
        Variable::aircraft("PAYLOAD STATION WEIGHT", "Pounds", 3),
        Variable::aspect("PAYLOAD_STATION_3_REQ"),
    );
    builder.copy(
        Variable::aircraft("PAYLOAD STATION WEIGHT", "Pounds", 4),
        Variable::aspect("PAYLOAD_STATION_4_REQ"),
    );
    builder.copy(
        Variable::aircraft("PAYLOAD STATION WEIGHT", "Pounds", 5),
        Variable::aspect("PAYLOAD_STATION_5_REQ"),
    );
    builder.copy(
        Variable::aircraft("PAYLOAD STATION WEIGHT", "Pounds", 6),
        Variable::aspect("PAYLOAD_STATION_6_REQ"),
    );
    builder.copy(
        Variable::aircraft("PAYLOAD STATION WEIGHT", "Pounds", 7),
        Variable::aspect("PAYLOAD_STATION_7_REQ"),
    );
    builder.copy(
        Variable::aircraft("PAYLOAD STATION WEIGHT", "Pounds", 8),
        Variable::aspect("PAYLOAD_STATION_8_REQ"),
    );

    builder.variables_to_object(Box::new(Payload {
        payload_station_1: 0.,
        payload_station_2: 0.,
        payload_station_3: 0.,
        payload_station_4: 0.,
        payload_station_5: 0.,
        payload_station_6: 0.,
        payload_station_7: 0.,
        payload_station_8: 0.,
    }));

    Ok(())
}

#[sim_connect::data_definition]
struct Payload {
    #[name = "PAYLOAD STATION WEIGHT:1"]
    #[unit = "Pounds"]
    payload_station_1: f64,

    #[name = "PAYLOAD STATION WEIGHT:2"]
    #[unit = "Pounds"]
    payload_station_2: f64,

    #[name = "PAYLOAD STATION WEIGHT:3"]
    #[unit = "Pounds"]
    payload_station_3: f64,

    #[name = "PAYLOAD STATION WEIGHT:4"]
    #[unit = "Pounds"]
    payload_station_4: f64,

    #[name = "PAYLOAD STATION WEIGHT:5"]
    #[unit = "Pounds"]
    payload_station_5: f64,

    #[name = "PAYLOAD STATION WEIGHT:6"]
    #[unit = "Pounds"]
    payload_station_6: f64,

    #[name = "PAYLOAD STATION WEIGHT:7"]
    #[unit = "Pounds"]
    payload_station_7: f64,

    #[name = "PAYLOAD STATION WEIGHT:8"]
    #[unit = "Pounds"]
    payload_station_8: f64,
}

impl VariablesToObject for Payload {
    fn variables(&self) -> Vec<Variable> {
        vec![
            Variable::aspect("PAYLOAD_STATION_1_REQ"),
            Variable::aspect("PAYLOAD_STATION_2_REQ"),
            Variable::aspect("PAYLOAD_STATION_3_REQ"),
            Variable::aspect("PAYLOAD_STATION_4_REQ"),
            Variable::aspect("PAYLOAD_STATION_5_REQ"),
            Variable::aspect("PAYLOAD_STATION_6_REQ"),
            Variable::aspect("PAYLOAD_STATION_7_REQ"),
            Variable::aspect("PAYLOAD_STATION_8_REQ"),
        ]
    }

    fn write(&mut self, values: Vec<f64>) -> ObjectWrite {
        self.payload_station_1 = values[0];
        self.payload_station_2 = values[1];
        self.payload_station_3 = values[2];
        self.payload_station_4 = values[3];
        self.payload_station_5 = values[4];
        self.payload_station_6 = values[5];
        self.payload_station_7 = values[6];
        self.payload_station_8 = values[7];
        ObjectWrite::default()
    }

    set_data_on_sim_object!();
}
