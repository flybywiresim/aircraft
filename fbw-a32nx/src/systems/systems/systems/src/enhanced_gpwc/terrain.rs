use crate::shared::arinc429::Arinc429Word;
use uom::si::{
    f64::{Angle, Length, Velocity, Ratio},
    length::{nautical_mile},
    ratio::{percent},
};

pub struct Terrain {
    pub terrain_display_active: bool,
    pub efis_nd_range: Length,
    pub efis_nd_mode: u8,
    pub potentiometer: Ratio,
}

impl Terrain {
    pub fn new() -> Self {
        Terrain {
            terrain_display_active: false,
            efis_nd_range: Length::new::<nautical_mile>(10.0),
            efis_nd_mode: 0,
            potentiometer: Ratio::new::<percent>(0.0),
        }
    }

    pub fn update(
        &mut self,
        latitude: Arinc429Word<Angle>,
        longitude: Arinc429Word<Angle>,
        altitude: Arinc429Word<Length>,
        vertical_speed: Arinc429Word<Velocity>,
        terrain_pb_active: bool,
        efis_nd_range: Length,
        efis_nd_mode: u8,
        potentiometer: Ratio,
    ) {
        self.terrain_display_active = terrain_pb_active && latitude.is_normal_operation();
        self.terrain_display_active = self.terrain_display_active && altitude.is_normal_operation() && longitude.is_normal_operation();
        // ND mode 4 is PLAN everything below is ROSE or ARC
        self.terrain_display_active = self.terrain_display_active && vertical_speed.is_normal_operation() && efis_nd_mode < 4;

        self.efis_nd_range = efis_nd_range;
        self.efis_nd_mode = efis_nd_mode;
        self.potentiometer = potentiometer;
    }
}
