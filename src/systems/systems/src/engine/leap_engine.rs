use uom::si::{angular_velocity::revolution_per_minute, f64::*, pressure::psi, ratio::percent};

use crate::{
    shared::{EngineCorrectedN1, EngineCorrectedN2, EngineUncorrectedN2},
    simulation::{Read, SimulationElement, SimulatorReader, UpdateContext},
};

use super::Engine;
use crate::simulation::{InitContext, VariableIdentifier};

pub struct LeapEngine {
    corrected_n1_id: VariableIdentifier,
    corrected_n1: Ratio,
    corrected_n2_id: VariableIdentifier,
    corrected_n2: Ratio,

    uncorrected_n2_id: VariableIdentifier,
    uncorrected_n2: Ratio,

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

    const MIN_IDLE_N2_UNCORRECTED_THRESHOLD_PERCENT: f64 = 55.;

    pub fn new(context: &mut InitContext, number: usize) -> LeapEngine {
        LeapEngine {
            corrected_n1_id: context.get_identifier(format!("TURB ENG CORRECTED N1:{}", number)),
            corrected_n1: Ratio::new::<percent>(0.),
            corrected_n2_id: context.get_identifier(format!("TURB ENG CORRECTED N2:{}", number)),
            corrected_n2: Ratio::new::<percent>(0.),
            uncorrected_n2_id: context.get_identifier(format!("ENGINE_N2:{}", number)),
            uncorrected_n2: Ratio::new::<percent>(0.),
            n2_speed: AngularVelocity::new::<revolution_per_minute>(0.),
            hydraulic_pump_output_speed: AngularVelocity::new::<revolution_per_minute>(0.),
            oil_pressure: Pressure::new::<psi>(0.),
        }
    }

    pub fn update(&mut self, _: &UpdateContext) {}

    fn update_parameters(&mut self) {
        self.n2_speed = AngularVelocity::new::<revolution_per_minute>(
            self.uncorrected_n2.get::<percent>() * Self::LEAP_1A26_MAX_N2_RPM / 100.,
        );
        self.hydraulic_pump_output_speed = self.n2_speed * Self::PUMP_N2_GEAR_RATIO;

        // Ultra stupid model just to have 18psi crossing at 25% N2
        self.oil_pressure = Pressure::new::<psi>(18. / 25. * self.uncorrected_n2.get::<percent>());
    }
}
impl SimulationElement for LeapEngine {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.corrected_n1 = reader.read(&self.corrected_n1_id);
        self.corrected_n2 = reader.read(&self.corrected_n2_id);
        self.uncorrected_n2 = reader.read(&self.uncorrected_n2_id);
        self.update_parameters();
    }
}
impl EngineCorrectedN1 for LeapEngine {
    fn corrected_n1(&self) -> Ratio {
        self.corrected_n1
    }
}
impl EngineCorrectedN2 for LeapEngine {
    fn corrected_n2(&self) -> Ratio {
        self.corrected_n2
    }
}
impl EngineUncorrectedN2 for LeapEngine {
    fn uncorrected_n2(&self) -> Ratio {
        self.uncorrected_n2
    }
}
impl Engine for LeapEngine {
    fn hydraulic_pump_output_speed(&self) -> AngularVelocity {
        self.hydraulic_pump_output_speed
    }

    fn oil_pressure(&self) -> Pressure {
        self.oil_pressure
    }

    fn is_above_minimum_idle(&self) -> bool {
        self.uncorrected_n2
            >= Ratio::new::<percent>(LeapEngine::MIN_IDLE_N2_UNCORRECTED_THRESHOLD_PERCENT)
    }
}
