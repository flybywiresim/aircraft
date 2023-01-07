use std::error::Error;

use msfs::sim_connect;
use msfs::sim_connect::{ClientDataArea, SimConnect};
use systems::shared::arinc429::Arinc429Word;
use crate::{
    aspects::{MsfsAspectBuilder, ObjectWrite, VariablesToClientData},
    Variable,
};
use uom::si::{
    f64::{Angle, Length, Velocity},
    angle::degree,
    length::foot,
    velocity::foot_per_minute,
};

pub(super) fn enhanced_gpwc(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    builder.variables_to_clientdata(Box::new(AircraftStatusClientDataArea {
        data: AircraftStatus::new(),
        area: None,
    }));

    Ok(())
}

#[sim_connect::client_data_definition]
struct AircraftStatus {
    adiru_data_valid: u16,
    latitude: f32,
    longitude: f32,
    altitude: i32,
    heading: i16,
    vertical_speed: i16,
    gear_down: u8,
    destination_valid: u8,
    destination_latitude: f32,
    destination_longitude: f32,
    nd_capt_range: u16,
    nd_capt_mode: u8,
    nd_capt_terrain_active: u8,
    nd_capt_terrain_brightness: f32,
    nd_fo_range: u16,
    nd_fo_mode: u8,
    nd_fo_terrain_active: u8,
    nd_fo_terrain_brightness: f32,
    terrain_on_nd_rendering_mode: u8,
}

impl AircraftStatus {
    pub fn new() -> Self {
        Self {
            adiru_data_valid: 0,
            latitude: 0.0,
            longitude: 0.0,
            altitude: 0,
            heading: 0,
            vertical_speed: 0,
            gear_down: 0,
            destination_valid: 0,
            destination_latitude: 0.0,
            destination_longitude: 0.0,
            nd_capt_range: 0,
            nd_capt_mode: 0,
            nd_capt_terrain_active: 0,
            nd_capt_terrain_brightness: 0.0,
            nd_fo_range: 0,
            nd_fo_mode: 0,
            nd_fo_terrain_active: 0,
            nd_fo_terrain_brightness: 0.0,
            terrain_on_nd_rendering_mode: 0,
        }
    }
}

struct AircraftStatusClientDataArea {
    data: AircraftStatus,
    area: Option<ClientDataArea<AircraftStatus>>,
}

fn convert_arinc429_angle(value: f64) -> Arinc429Word<Angle> {
    let arinc_source = Arinc429Word::<f64>::from(value);
    Arinc429Word::new(Angle::new::<degree>(arinc_source.value()), arinc_source.ssm())
}

fn convert_arinc429_length(value: f64) -> Arinc429Word<Length> {
    let arinc_source = Arinc429Word::<f64>::from(value);
    Arinc429Word::new(Length::new::<foot>(arinc_source.value()), arinc_source.ssm())
}

fn convert_arinc429_velocity(value: f64) -> Arinc429Word<Velocity> {
    let arinc_source = Arinc429Word::<f64>::from(value);
    Arinc429Word::new(Velocity::new::<foot_per_minute>(arinc_source.value()), arinc_source.ssm())
}

impl VariablesToClientData for AircraftStatusClientDataArea {
    fn variables(&self) -> Vec<Variable> {
        vec![
            Variable::named("EGPWC_DEST_LAT"),
            Variable::named("EGPWC_DEST_LONG"),
            Variable::named("EGPWC_PRESENT_LAT"),
            Variable::named("EGPWC_PRESENT_LONG"),
            Variable::named("ADIRS_ADR_1_ALTITUDE"),
            Variable::named("ADIRS_IR_1_TRUE_HEADING"),
            Variable::named("ADIRS_ADR_1_BAROMETRIC_VERTICAL_SPEED"),
            Variable::named("EGPWC_GEAR_IS_DOWN"),
            Variable::named("EGPWC_ND_L_RANGE"),
            Variable::named("EFIS_L_ND_MODE"),
            Variable::named("EGPWC_ND_L_TERRAIN_ACTIVE"),
            Variable::named("ND_L_TERR_ON_ND_POTENTIOMETER"),
            Variable::named("EGPWC_ND_R_RANGE"),
            Variable::named("EFIS_R_ND_MODE"),
            Variable::named("EGPWC_ND_R_TERRAIN_ACTIVE"),
            Variable::named("ND_R_TERR_ON_ND_POTENTIOMETER"),
            Variable::named("EGPWC_TERR_ON_ND_RENDERING_MODE"),
        ]
    }

    fn write(&mut self, values: Vec<f64>) -> ObjectWrite {
        let present_latitude = convert_arinc429_angle(values[2]);
        let present_longitude = convert_arinc429_angle(values[3]);
        let altitude = convert_arinc429_length(values[4]);
        let heading = convert_arinc429_angle(values[5]);
        let vertical_speed = convert_arinc429_velocity(values[6]);

        if present_latitude.is_normal_operation() && present_longitude.is_normal_operation() {
            self.data.adiru_data_valid = 1;
        } else {
            self.data.adiru_data_valid = 0;
        }
        self.data.latitude = present_latitude.value().get::<degree>() as f32;
        self.data.longitude = present_longitude.value().get::<degree>() as f32;
        self.data.altitude = altitude.value().get::<foot>() as i32;
        self.data.heading = heading.value().get::<degree>() as i16;
        self.data.vertical_speed = vertical_speed.value().get::<foot_per_minute>() as i16;
        self.data.gear_down = values[7] as u8;

        let destination_latitude = convert_arinc429_angle(values[0]);
        let destination_longitude = convert_arinc429_angle(values[1]);
        if destination_latitude.is_normal_operation() && destination_longitude.is_normal_operation() {
            self.data.destination_valid = 1;
        } else {
            self.data.destination_valid = 0;
        }
        self.data.destination_latitude = destination_latitude.value().get::<degree>() as f32;
        self.data.destination_longitude = destination_longitude.value().get::<degree>() as f32;

        self.data.nd_capt_range = values[8] as u16;
        self.data.nd_capt_mode = values[9] as u8;
        self.data.nd_capt_terrain_active = values[10] as u8;
        self.data.nd_capt_terrain_brightness = values[11] as f32;
        self.data.nd_fo_range = values[12] as u16;
        self.data.nd_fo_mode = values[13] as u8;
        self.data.nd_fo_terrain_active = values[14] as u8;
        self.data.nd_fo_terrain_brightness = values[15] as f32;
        self.data.terrain_on_nd_rendering_mode = values[16] as u8;

        ObjectWrite::default()
    }

    fn set_client_data(&mut self, sim_connect: &mut SimConnect) -> Result<(), Box<dyn Error>> {
        if self.area.is_none() {
            let area = sim_connect.create_client_data::<AircraftStatus>("FBW_SIMBRIDGE_EGPWC_AIRCRAFT_STATUS");
            if area.is_err() {
                println!("EGPWC: Failed to allocate client data area for the aircraft status");
            } else {
                self.area = Some(area.unwrap());
                println!("EGPWC: Allocated client data area for the aircraft status: {}", std::mem::size_of::<AircraftStatus>());
            }
        }

        let result = sim_connect.set_client_data(&self.area.as_ref().unwrap(), &self.data);
        if result.is_err() {
            println!("EGPWC: Failed to send the aircraft status");
        }

        Ok(())
    }
}
