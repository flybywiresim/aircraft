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
    builder.copy(
        Variable::aircraft("PAYLOAD STATION WEIGHT", "Pounds", 9),
        Variable::aspect("PAYLOAD_STATION_9_REQ"),
    );
    builder.copy(
        Variable::aircraft("PAYLOAD STATION WEIGHT", "Pounds", 10),
        Variable::aspect("PAYLOAD_STATION_10_REQ"),
    );
    builder.copy(
        Variable::aircraft("PAYLOAD STATION WEIGHT", "Pounds", 11),
        Variable::aspect("PAYLOAD_STATION_11_REQ"),
    );
    builder.copy(
        Variable::aircraft("PAYLOAD STATION WEIGHT", "Pounds", 12),
        Variable::aspect("PAYLOAD_STATION_12_REQ"),
    );
    builder.copy(
        Variable::aircraft("PAYLOAD STATION WEIGHT", "Pounds", 13),
        Variable::aspect("PAYLOAD_STATION_13_REQ"),
    );
    builder.copy(
        Variable::aircraft("PAYLOAD STATION WEIGHT", "Pounds", 14),
        Variable::aspect("PAYLOAD_STATION_14_REQ"),
    );
    builder.copy(
        Variable::aircraft("PAYLOAD STATION WEIGHT", "Pounds", 15),
        Variable::aspect("PAYLOAD_STATION_15_REQ"),
    );
    builder.copy(
        Variable::aircraft("PAYLOAD STATION WEIGHT", "Pounds", 16),
        Variable::aspect("PAYLOAD_STATION_16_REQ"),
    );
    builder.copy(
        Variable::aircraft("PAYLOAD STATION WEIGHT", "Pounds", 17),
        Variable::aspect("PAYLOAD_STATION_17_REQ"),
    );
    builder.copy(
        Variable::aircraft("PAYLOAD STATION WEIGHT", "Pounds", 18),
        Variable::aspect("PAYLOAD_STATION_18_REQ"),
    );

    builder.variables_to_object(Box::<Payload>::default());

    Ok(())
}

#[sim_connect::data_definition]
#[derive(Default)]
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

    #[name = "PAYLOAD STATION WEIGHT:9"]
    #[unit = "Pounds"]
    payload_station_9: f64,

    #[name = "PAYLOAD STATION WEIGHT:10"]
    #[unit = "Pounds"]
    payload_station_10: f64,

    #[name = "PAYLOAD STATION WEIGHT:11"]
    #[unit = "Pounds"]
    payload_station_11: f64,

    #[name = "PAYLOAD STATION WEIGHT:12"]
    #[unit = "Pounds"]
    payload_station_12: f64,

    #[name = "PAYLOAD STATION WEIGHT:13"]
    #[unit = "Pounds"]
    payload_station_13: f64,

    #[name = "PAYLOAD STATION WEIGHT:14"]
    #[unit = "Pounds"]
    payload_station_14: f64,

    #[name = "PAYLOAD STATION WEIGHT:15"]
    #[unit = "Pounds"]
    payload_station_15: f64,

    #[name = "PAYLOAD STATION WEIGHT:16"]
    #[unit = "Pounds"]
    payload_station_16: f64,

    #[name = "PAYLOAD STATION WEIGHT:17"]
    #[unit = "Pounds"]
    payload_station_17: f64,

    #[name = "PAYLOAD STATION WEIGHT:18"]
    #[unit = "Pounds"]
    payload_station_18: f64,
}

impl VariablesToObject for Payload {
    fn variables(&self) -> Vec<Variable> {
        (1..=18)
            .map(|i| Variable::aspect(&format!("PAYLOAD_STATION_{i}_REQ")))
            .collect::<Vec<_>>()
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
        self.payload_station_9 = values[8];
        self.payload_station_10 = values[9];
        self.payload_station_11 = values[10];
        self.payload_station_12 = values[11];
        self.payload_station_13 = values[12];
        self.payload_station_14 = values[13];
        self.payload_station_15 = values[14];
        self.payload_station_16 = values[15];
        self.payload_station_17 = values[16];
        self.payload_station_18 = values[17];
        ObjectWrite::default()
    }

    set_data_on_sim_object!();
}
