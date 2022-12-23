use msfs::sim_connect::{client_data_definition, ClientDataArea, SimConnect};
use std::error::Error;
use systems::enhanced_gpwc::{EnhancedGPWC, terrain::Terrain};
use uom::si::{
    angle::degree,
    length::{nautical_mile, foot},
    ratio::percent,
    velocity::foot_per_minute,
};

#[client_data_definition]
struct AircraftStatusData {
    latitude: f32,
    longitude: f32,
    altitude: f32,
    vertical_speed: f32,
    gear_down: bool,
    destination_valid: bool,
    destination_latitude: f32,
    destination_longitude: f32,
}

#[client_data_definition]
struct NdConfigurationData {
    terrain_active: bool,
    range: u16,
    mode: u8,
    potentiometer: f32,
}

pub struct Simbridge<'a, 'b> {
    connection: &'a mut SimConnect<'b>,
    aircraft_status: ClientDataArea<AircraftStatusData>,
    nd_configuration_capt: ClientDataArea<NdConfigurationData>,
    nd_configuration_fo: ClientDataArea<NdConfigurationData>,
}

impl<'a, 'b> Simbridge<'a, 'b> {
    pub fn new(sim_connect: &'a mut SimConnect<'b>) -> Result<Self, Box<dyn Error>> {
        let aircraft_status = sim_connect.create_client_data::<AircraftStatusData>("FBW_SIMBRIDGE_AIRCRAFT_STATUS")?;
        let nd_configuration_capt = sim_connect.create_client_data::<NdConfigurationData>("FBW_SIMBRIDGE_ND_DATA_CAPT")?;
        let nd_configuration_fo = sim_connect.create_client_data::<NdConfigurationData>("FBW_SIMBRIDGE_ND_DATA_FO")?;

        Ok(Self {
            connection: sim_connect,
            aircraft_status,
            nd_configuration_capt,
            nd_configuration_fo,
        })
    }

    pub fn send_aircraft_status(&mut self, egpwc: &EnhancedGPWC) {
        let data = AircraftStatusData {
            latitude: egpwc.latitude.value().get::<degree>() as f32,
            longitude: egpwc.longitude.value().get::<degree>() as f32,
            altitude: egpwc.altitude.value().get::<foot>() as f32,
            vertical_speed: egpwc.vertical_speed.value().get::<foot_per_minute>() as f32,
            gear_down: false,
            destination_valid: false,
            destination_latitude: 0.0,
            destination_longitude: 0.0,
        };

        self.connection.set_client_data(&self.aircraft_status, &data);
    }

    pub fn send_terrain_nd_data(&mut self, terrain: &Terrain, capt_side: bool) {
        let data = NdConfigurationData {
            terrain_active: terrain.terrain_display_active,
            range: terrain.efis_nd_range.get::<nautical_mile>() as u16,
            mode: terrain.efis_nd_mode,
            potentiometer: terrain.potentiometer.get::<percent>() as f32,
        };

        if capt_side {
            self.connection.set_client_data(&self.nd_configuration_capt, &data);
        } else {
            self.connection.set_client_data(&self.nd_configuration_fo, &data);
        }
    }
}
