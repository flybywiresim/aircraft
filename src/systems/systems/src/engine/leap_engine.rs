use uom::si::{angular_velocity::revolution_per_minute, f64::*, pressure::psi, ratio::percent};

use crate::simulation::{SimulationElement, SimulatorReader, UpdateContext};

use super::Engine;
pub struct LeapEngine {
    corrected_n2_id: String,
    corrected_n2: Ratio,
    n2_speed: AngularVelocity,
    hydraulic_pump_output_speed: AngularVelocity,
    oil_pressure: Pressure,
}
impl LeapEngine {
    // According to the Type Certificate Data Sheet of LEAP 1A26
    // Max N2 rpm is 116.5% @ 19391 RPM
    // 100% @ 16645 RPM
    const LEAP_1A26_MAX_N2_RPM: f64 = 16645.0;
    // Gear ratio from primary gearbox input to EDP drive shaft
    const PUMP_N2_GEAR_RATIO: f64 = 0.211;

    const MIN_IDLE_N2_THRESHOLD: f64 = 60.;

    pub fn new(number: usize) -> LeapEngine {
        LeapEngine {
            corrected_n2_id: format!("TURB ENG CORRECTED N2:{}", number),
            corrected_n2: Ratio::new::<percent>(0.),
            n2_speed: AngularVelocity::new::<revolution_per_minute>(0.),
            hydraulic_pump_output_speed: AngularVelocity::new::<revolution_per_minute>(0.),
            oil_pressure: Pressure::new::<psi>(0.),
        }
    }

    pub fn update(&mut self, _: &UpdateContext) {}

    fn update_parameters(&mut self) {
        self.n2_speed = AngularVelocity::new::<revolution_per_minute>(
            self.corrected_n2.get::<percent>() * Self::LEAP_1A26_MAX_N2_RPM / 100.,
        );
        self.hydraulic_pump_output_speed = self.n2_speed * Self::PUMP_N2_GEAR_RATIO;

        // Ultra stupid model just to have 18psi crossing at 25% N2
        self.oil_pressure = Pressure::new::<psi>(18. / 25. * self.corrected_n2.get::<percent>());
    }
}
impl SimulationElement for LeapEngine {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.corrected_n2 = Ratio::new::<percent>(reader.read_f64(&self.corrected_n2_id));
        self.update_parameters();
    }
}

impl Engine for LeapEngine {
    fn corrected_n2(&self) -> Ratio {
        self.corrected_n2
    }

    fn hydraulic_pump_output_speed(&self) -> AngularVelocity {
        self.hydraulic_pump_output_speed
    }

    fn oil_pressure(&self) -> Pressure {
        self.oil_pressure
    }

    fn is_above_minimum_idle(&self) -> bool {
        self.corrected_n2 >= Ratio::new::<percent>(LeapEngine::MIN_IDLE_N2_THRESHOLD)
    }
}
