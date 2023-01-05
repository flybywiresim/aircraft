use uom::si::{
    f64::{Length, Ratio},
    length::{nautical_mile},
    ratio::{percent},
};

pub trait NavigationDisplay {
    fn terrain_display_active(&self) -> bool;
    fn display_range(&self) -> Length;
    fn display_mode(&self) -> u8;
    fn display_potentiometer(&self) -> Ratio;
}

pub struct Terrain {
    terrain_display_active: bool,
    efis_nd_range: Length,
    efis_nd_mode: u8,
    potentiometer: Ratio,
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
        adiru_data_valid: bool,
        terrain_pb_active: bool,
        efis_nd_range: Length,
        efis_nd_mode: u8,
        potentiometer: Ratio,
    ) {
        // ND mode 4 is PLAN everything below is ROSE or ARC
        self.terrain_display_active = terrain_pb_active && adiru_data_valid && efis_nd_mode < 4;
        self.efis_nd_range = efis_nd_range;
        self.efis_nd_mode = efis_nd_mode;
        self.potentiometer = potentiometer;
    }
}
impl NavigationDisplay for Terrain {
    fn terrain_display_active(&self) -> bool {
        self.terrain_display_active
    }
    fn display_range(&self) -> Length {
        self.efis_nd_range
    }
    fn display_mode(&self) -> u8 {
        self.efis_nd_mode
    }
    fn display_potentiometer(&self) -> Ratio {
        self.potentiometer
    }
}
