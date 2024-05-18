use uom::si::{angular_velocity::revolution_per_minute, f64::*, pressure::psi, ratio::percent};

use crate::{
    shared::{EngineCorrectedN1, EngineCorrectedN2, EngineUncorrectedN2},
    simulation::{Read, SimulationElement, SimulatorReader, UpdateContext},
};

use super::Engine;
use crate::simulation::{InitContext, VariableIdentifier};

pub struct TrentEngine {
    thrust_id: VariableIdentifier,

    corrected_n1_id: VariableIdentifier,
    corrected_n1: Ratio,
    corrected_n2_id: VariableIdentifier,
    corrected_n2: Ratio,

    uncorrected_n2_id: VariableIdentifier,
    uncorrected_n2: Ratio,
    uncorrected_n3_id: VariableIdentifier,
    uncorrected_n3: Ratio,

    n3_speed: AngularVelocity,
    hydraulic_pump_output_speed: AngularVelocity,
    oil_pressure: Pressure,

    net_thrust: Mass,
}
impl TrentEngine {
    // 100% N1 @ 2900 RPM
    // 100% N2 @ 8300 RPM
    // 100% N3 @ 12200 RPM

    const TRENT_900_100_PCT_N3_RPM: f64 = 12200.0;

    // Gear ratio from primary gearbox input to EDP drive shaft
    // TODO find real value, 0.31 is guessed to get the target 3775 pump rpm
    const PUMP_N3_GEAR_RATIO: f64 = 0.31; //EDP rated speed is 3775 RPM

    const MIN_IDLE_N2_UNCORRECTED_THRESHOLD_PERCENT: f64 = 55.;

    const LOW_OIL_PRESSURE_THRESHOLD_PSI: f64 = 18.;

    pub fn new(context: &mut InitContext, number: usize) -> TrentEngine {
        TrentEngine {
            thrust_id: context.get_identifier(format!("TURB ENG JET THRUST:{}", number)),

            corrected_n1_id: context.get_identifier(format!("TURB ENG CORRECTED N1:{}", number)),
            corrected_n1: Ratio::new::<percent>(0.),
            corrected_n2_id: context.get_identifier(format!("TURB ENG CORRECTED N2:{}", number)),
            corrected_n2: Ratio::new::<percent>(0.),
            uncorrected_n2_id: context.get_identifier(format!("ENGINE_N2:{}", number)),
            uncorrected_n2: Ratio::new::<percent>(0.),
            uncorrected_n3_id: context.get_identifier(format!("ENGINE_N3:{}", number)),
            uncorrected_n3: Ratio::new::<percent>(0.),

            n3_speed: AngularVelocity::default(),
            hydraulic_pump_output_speed: AngularVelocity::new::<revolution_per_minute>(0.),
            oil_pressure: Pressure::new::<psi>(0.),

            net_thrust: Mass::default(),
        }
    }

    pub fn update(&mut self, _: &UpdateContext) {}

    fn update_parameters(&mut self) {
        self.n3_speed = AngularVelocity::new::<revolution_per_minute>(
            self.uncorrected_n3.get::<percent>() * Self::TRENT_900_100_PCT_N3_RPM / 100.,
        );
        self.hydraulic_pump_output_speed = self.n3_speed * Self::PUMP_N3_GEAR_RATIO;

        // Ultra stupid model just to have 18psi crossing at 25% N2
        self.oil_pressure = Pressure::new::<psi>(18. / 25. * self.uncorrected_n2.get::<percent>());
    }
}
impl SimulationElement for TrentEngine {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.corrected_n1 = reader.read(&self.corrected_n1_id);
        self.corrected_n2 = reader.read(&self.corrected_n2_id);
        self.uncorrected_n2 = reader.read(&self.uncorrected_n2_id);
        self.uncorrected_n3 = reader.read(&self.uncorrected_n3_id);
        self.net_thrust = reader.read(&self.thrust_id);

        self.update_parameters();
    }
}
impl EngineCorrectedN1 for TrentEngine {
    fn corrected_n1(&self) -> Ratio {
        self.corrected_n1
    }
}
impl EngineCorrectedN2 for TrentEngine {
    fn corrected_n2(&self) -> Ratio {
        self.corrected_n2
    }
}
impl EngineUncorrectedN2 for TrentEngine {
    fn uncorrected_n2(&self) -> Ratio {
        self.uncorrected_n2
    }
}
impl Engine for TrentEngine {
    fn hydraulic_pump_output_speed(&self) -> AngularVelocity {
        self.hydraulic_pump_output_speed
    }

    fn oil_pressure_is_low(&self) -> bool {
        self.oil_pressure.get::<psi>() < TrentEngine::LOW_OIL_PRESSURE_THRESHOLD_PSI
    }

    fn is_above_minimum_idle(&self) -> bool {
        self.uncorrected_n2
            >= Ratio::new::<percent>(TrentEngine::MIN_IDLE_N2_UNCORRECTED_THRESHOLD_PERCENT)
    }

    fn net_thrust(&self) -> Mass {
        self.net_thrust
    }

    fn gearbox_speed(&self) -> AngularVelocity {
        self.n3_speed
    }
}
