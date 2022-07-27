use crate::shared::interpolation;

use uom::si::{
    angular_velocity::revolution_per_minute, f64::*, pressure::psi, ratio::ratio,
    volume::cubic_inch,
};

/// Defines a pump by:
///     displacement map: giving max possible displacement vs current pressure
///     cavitation map: giving the pumping efficiency vs low pressure side air pressure
///     regulated speed: regulation speed value for constant speed pumps
pub struct PumpCharacteristics {
    pressure_map_breakpoints_psi: [f64; 9],
    displacement_map_cubic_inch: [f64; 9],

    air_pressure_map_breakpoints_psi: [f64; 9],
    cavitation_map_ratio: [f64; 9],

    regulated_speed: Option<AngularVelocity>,
}
impl PumpCharacteristics {
    const AIR_PRESSURE_BREAKPTS_PSI: [f64; 9] = [0., 5., 10., 15., 20., 30., 50., 70., 100.];
    const AIR_PRESSURE_CARAC_RATIO: [f64; 9] = [0.0, 0.1, 0.6, 0.8, 0.9, 1., 1., 1., 1.];

    const A320_EDP_DISPLACEMENT_BREAKPTS_PSI: [f64; 9] = [
        0.0, 500.0, 1000.0, 1500.0, 2800.0, 2910.0, 3025.0, 3050.0, 3500.0,
    ];
    const A320_EDP_DISPLACEMENT_MAP_CUBIC_INCH: [f64; 9] =
        [2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 0.0, 0.0, 0.0];

    const A320_EPUMP_REGULATED_SPEED_RPM: f64 = 7600.0;

    const A320_EPUMP_DISPLACEMENT_BREAKPTS_PSI: [f64; 9] = [
        0.0, 500.0, 1000.0, 1500.0, 2175.0, 2850.0, 3080.0, 3100.0, 3500.0,
    ];
    const A320_EPUMP_DISPLACEMENT_MAP_CUBIC_INCH: [f64; 9] =
        [0.263, 0.263, 0.263, 0.263, 0.263, 0.2, 0.0, 0.0, 0.0];

    const A320_RAT_DISPLACEMENT_BREAKPTS_PSI: [f64; 9] = [
        0.0, 500.0, 1000.0, 1500.0, 2100.0, 2300.0, 2600.0, 2700.0, 3500.0,
    ];
    const A320_RAT_DISPLACEMENT_MAP_CUBIC_INCH: [f64; 9] =
        [0.5, 0.8, 1.15, 1.15, 1.15, 0.8, 0.3, 0.0, 0.0];

    const A380_EDP_DISPLACEMENT_BREAKPTS_PSI: [f64; 9] = [
        0.0, 500.0, 1000.0, 3000.0, 5800.0, 5910.0, 5025.0, 5050.0, 5500.0,
    ];
    const A380_EDP_DISPLACEMENT_MAP_CUBIC_INCH: [f64; 9] =
        [2.4, 2.4, 2.4, 1., 0.3, 0.1, 0.0, 0.0, 0.0];

    fn new(
        pressure_map_breakpoints_psi: [f64; 9],
        displacement_map_cubic_inch: [f64; 9],

        air_pressure_map_breakpoints_psi: [f64; 9],
        cavitation_map_ratio: [f64; 9],

        regulated_speed: Option<AngularVelocity>,
    ) -> Self {
        Self {
            pressure_map_breakpoints_psi,
            displacement_map_cubic_inch,

            air_pressure_map_breakpoints_psi,
            cavitation_map_ratio,

            regulated_speed,
        }
    }

    pub fn a320_edp() -> Self {
        PumpCharacteristics::new(
            Self::A320_EDP_DISPLACEMENT_BREAKPTS_PSI,
            Self::A320_EDP_DISPLACEMENT_MAP_CUBIC_INCH,
            Self::AIR_PRESSURE_BREAKPTS_PSI,
            Self::AIR_PRESSURE_CARAC_RATIO,
            None,
        )
    }

    pub fn a320_rat() -> Self {
        PumpCharacteristics::new(
            Self::A320_RAT_DISPLACEMENT_BREAKPTS_PSI,
            Self::A320_RAT_DISPLACEMENT_MAP_CUBIC_INCH,
            Self::AIR_PRESSURE_BREAKPTS_PSI,
            Self::AIR_PRESSURE_CARAC_RATIO,
            None,
        )
    }

    pub fn a320_electric_pump() -> Self {
        PumpCharacteristics::new(
            Self::A320_EPUMP_DISPLACEMENT_BREAKPTS_PSI,
            Self::A320_EPUMP_DISPLACEMENT_MAP_CUBIC_INCH,
            Self::AIR_PRESSURE_BREAKPTS_PSI,
            Self::AIR_PRESSURE_CARAC_RATIO,
            Some(AngularVelocity::new::<revolution_per_minute>(
                Self::A320_EPUMP_REGULATED_SPEED_RPM,
            )),
        )
    }

    pub fn a380_edp() -> Self {
        PumpCharacteristics::new(
            Self::A380_EDP_DISPLACEMENT_BREAKPTS_PSI,
            Self::A380_EDP_DISPLACEMENT_MAP_CUBIC_INCH,
            Self::AIR_PRESSURE_BREAKPTS_PSI,
            Self::AIR_PRESSURE_CARAC_RATIO,
            None,
        )
    }

    pub fn current_displacement(&self, pressure: Pressure) -> Volume {
        Volume::new::<cubic_inch>(interpolation(
            &self.pressure_map_breakpoints_psi,
            &self.displacement_map_cubic_inch,
            pressure.get::<psi>(),
        ))
    }

    pub fn cavitation_efficiency(&self, air_pressure: Pressure) -> Ratio {
        Ratio::new::<ratio>(interpolation(
            &self.air_pressure_map_breakpoints_psi,
            &self.cavitation_map_ratio,
            air_pressure.get::<psi>(),
        ))
    }

    pub fn regulated_speed(&self) -> AngularVelocity {
        self.regulated_speed.unwrap_or_default()
    }
}
