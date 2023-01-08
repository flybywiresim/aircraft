use self::pressure_valve::{PressureValve, PressureValveSignal};

use uom::si::{f64::*, ratio::percent};
pub mod cabin_pressure_controller;
pub mod pressure_valve;

pub trait OutflowValveActuator {
    fn target_valve_position(&self) -> Ratio;
}

pub struct OutflowValveSignal {
    target_open_amount: Ratio,
}

impl OutflowValveSignal {
    fn new(target_open_amount: Ratio) -> Self {
        Self { target_open_amount }
    }

    fn new_open() -> Self {
        Self::new(Ratio::new::<percent>(100.))
    }

    fn new_closed() -> Self {
        Self::new(Ratio::new::<percent>(0.))
    }

    fn target_open_amount(&self) -> Ratio {
        self.target_open_amount
    }
}

pub trait CabinPressure {
    fn exterior_pressure(&self) -> Pressure;
    fn cabin_pressure(&self) -> Pressure;
}

pub trait PressurizationConstants {
    const CABIN_VOLUME_CUBIC_METER: f64;
    const COCKPIT_VOLUME_CUBIC_METER: f64;
    const PRESSURIZED_FUSELAGE_VOLUME_CUBIC_METER: f64;
    const CABIN_LEAKAGE_AREA: f64;
    const OUTFLOW_VALVE_SIZE: f64;
    const SAFETY_VALVE_SIZE: f64;

    const MAX_CLIMB_RATE: f64;
    const MAX_CLIMB_RATE_IN_DESCENT: f64;
    const MAX_DESCENT_RATE: f64;
    const MAX_ABORT_DESCENT_RATE: f64;
    const MAX_TAKEOFF_DELTA_P: f64;
    const MAX_CLIMB_DELTA_P: f64;
    const MAX_CLIMB_CABIN_ALTITUDE: f64;
    const MAX_SAFETY_DELTA_P: f64;
    const MIN_SAFETY_DELTA_P: f64;
    const TAKEOFF_RATE: f64;
    const DEPRESS_RATE: f64;
    const EXCESSIVE_ALT_WARNING: f64;
    const EXCESSIVE_RESIDUAL_PRESSURE_WARNING: f64;
    const LOW_DIFFERENTIAL_PRESSURE_WARNING: f64;
}
