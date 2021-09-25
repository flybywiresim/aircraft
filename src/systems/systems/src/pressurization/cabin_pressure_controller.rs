use crate::{
    shared::{ControllerSignal, EngineCorrectedN1},
    simulation::UpdateContext,
};

use super::{
    CabinPressure, OutflowValveActuator, PressureValve, PressureValveSignal,
    PressurizationOverheadPanel,
};

use std::time::Duration;
use uom::si::{
    f64::*,
    length::{foot, meter},
    pressure::{hectopascal, pascal, psi},
    ratio::{percent, ratio},
    velocity::{foot_per_minute, knot, meter_per_second},
    volume_rate::cubic_meter_per_second,
};

#[derive(Copy, Clone)]
pub(super) struct CabinPressureController {
    pressure_schedule_manager: PressureScheduleManager,
    exterior_pressure: Pressure,
    exterior_vertical_speed: Velocity,
    cabin_pressure: Pressure,
    cabin_alt: Length,
    departure_elev: Length,
    landing_elev: Length,
    cabin_target_vs: Velocity,
    outflow_valve_open_amount: Ratio,
    safety_valve_open_amount: Ratio,
}

impl CabinPressureController {
    // Atmospheric constants
    const R: f64 = 287.058; // Specific gas constant for air - m2/s2/K
    const GAMMA: f64 = 1.4; // Rate of specific heats for air
    const G: f64 = 9.80665; // Gravity - m/s2
    const T_0: f64 = 288.2; // ISA standard temperature - K
    const L: f64 = -0.00651; // Adiabatic lapse rate - K/m

    // Aircraft constants
    const RHO: f64 = 1.225; // Cabin air density - Kg/m3
    const CABIN_VOLUME: f64 = 400.; // m3
    const OFV_SIZE: f64 = 0.03; // m2

    // Vertical speed constraints
    const MAX_CLIMB_RATE: f64 = 750.;
    const MAX_CLIMB_RATE_IN_DESCENT: f64 = 500.;
    const MAX_DESCENT_RATE: f64 = -750.;
    const MAX_ABORT_DESCENT_RATE: f64 = -500.;
    const TAKEOFF_RATE: f64 = -400.;
    const DEPRESS_RATE: f64 = 500.;

    pub fn new() -> Self {
        Self {
            pressure_schedule_manager: PressureScheduleManager::new(),
            exterior_pressure: Pressure::new::<hectopascal>(1013.25),
            exterior_vertical_speed: Velocity::new::<foot_per_minute>(0.),
            cabin_pressure: Pressure::new::<hectopascal>(1013.25),
            cabin_alt: Length::new::<meter>(0.),
            departure_elev: Length::new::<foot>(-5000.),
            landing_elev: Length::new::<meter>(0.),
            cabin_target_vs: Velocity::new::<meter_per_second>(0.),
            outflow_valve_open_amount: Ratio::new::<percent>(100.),
            safety_valve_open_amount: Ratio::new::<percent>(0.),
        }
    }

    #[allow(clippy::too_many_arguments)]
    pub fn update(
        &mut self,
        context: &UpdateContext,
        engines: [&impl EngineCorrectedN1; 2],
        exterior_pressure: Pressure,
        landing_elevation: Length,
        departure_elevation: Length,
        sea_level_pressure: Pressure,
        destination_qnh: Pressure,
        lgciu_gear_compressed: bool,
        cabin_pressure: Pressure,
    ) {
        self.exterior_pressure = exterior_pressure;
        self.exterior_vertical_speed = context.vertical_speed();
        self.cabin_pressure = cabin_pressure;
        self.landing_elev = landing_elevation;
        self.departure_elev = departure_elevation;

        self.pressure_schedule_manager =
            self.pressure_schedule_manager
                .update(context, engines, lgciu_gear_compressed);

        self.cabin_target_vs = self.calculate_cabin_vs(context);
        self.cabin_alt = self.calculate_cabin_altitude(sea_level_pressure, destination_qnh);
    }

    fn calculate_cabin_vs(&mut self, context: &UpdateContext) -> Velocity {
        let error_margin = Pressure::new::<hectopascal>(1.);

        match self.pressure_schedule_manager {
            PressureScheduleManager::Ground(_) => {
                if (self.cabin_pressure - self.exterior_pressure) > error_margin {
                    Velocity::new::<foot_per_minute>(Self::DEPRESS_RATE)
                } else if (self.cabin_pressure - self.exterior_pressure) < -error_margin {
                    Velocity::new::<foot_per_minute>(-Self::DEPRESS_RATE)
                } else {
                    Velocity::new::<foot_per_minute>(0.)
                }
            }
            PressureScheduleManager::TakeOff(_) => {
                if (self.cabin_pressure - self.exterior_pressure) < Pressure::new::<psi>(0.1) {
                    Velocity::new::<foot_per_minute>(Self::TAKEOFF_RATE)
                } else {
                    Velocity::new::<foot_per_minute>(0.)
                }
            }
            PressureScheduleManager::ClimbInternal(_) => {
                const DELTA_PRESSURE_LIMIT: f64 = 8.06; // PSI
                const CABIN_ALTITUDE_LIMIT: f64 = 8050.; // Feet

                // Formula based on empirical graphs and tables to simulate climb schedule as per the real aircraft
                let target_vs = Velocity::new::<foot_per_minute>(
                    self.exterior_vertical_speed.get::<foot_per_minute>()
                        * (0.00000525 * context.indicated_altitude().get::<foot>() + 0.09),
                );
                if (self.cabin_pressure - self.exterior_pressure)
                    >= Pressure::new::<psi>(DELTA_PRESSURE_LIMIT)
                {
                    Velocity::new::<foot_per_minute>(Self::MAX_CLIMB_RATE)
                } else if self.cabin_altitude() >= Length::new::<foot>(CABIN_ALTITUDE_LIMIT) {
                    Velocity::new::<foot_per_minute>(0.)
                } else if target_vs <= Velocity::new::<foot_per_minute>(Self::MAX_DESCENT_RATE) {
                    Velocity::new::<foot_per_minute>(Self::MAX_DESCENT_RATE)
                } else {
                    target_vs
                }
            }
            PressureScheduleManager::Cruise(_) => Velocity::new::<foot_per_minute>(0.),
            PressureScheduleManager::DescentInternal(_) => {
                let target_vs = Velocity::new::<foot_per_minute>(
                    self.get_int_diff_with_ldg_elev().get::<foot>()
                        * self.exterior_vertical_speed.get::<foot_per_minute>()
                        / self.get_ext_diff_with_ldg_elev(context).get::<foot>(),
                );
                if target_vs <= Velocity::new::<foot_per_minute>(Self::MAX_DESCENT_RATE) {
                    Velocity::new::<foot_per_minute>(Self::MAX_DESCENT_RATE)
                } else if target_vs
                    >= Velocity::new::<foot_per_minute>(Self::MAX_CLIMB_RATE_IN_DESCENT)
                {
                    Velocity::new::<foot_per_minute>(Self::MAX_CLIMB_RATE_IN_DESCENT)
                } else {
                    target_vs
                }
            }
            PressureScheduleManager::Abort(_) => {
                // Altitude in ft equivalent to 0.1 PSI delta P at sea level
                const TARGET_LANDING_ALT_DIFF: f64 = 187.818;

                if self.cabin_altitude()
                    < self.departure_elev - Length::new::<foot>(TARGET_LANDING_ALT_DIFF)
                {
                    Velocity::new::<foot_per_minute>(Self::MAX_CLIMB_RATE_IN_DESCENT)
                } else if self.cabin_altitude()
                    > self.departure_elev - Length::new::<foot>(TARGET_LANDING_ALT_DIFF)
                {
                    Velocity::new::<foot_per_minute>(Self::MAX_ABORT_DESCENT_RATE)
                } else {
                    Velocity::new::<foot_per_minute>(0.)
                }
            }
        }
    }

    fn get_ext_diff_with_ldg_elev(&self, context: &UpdateContext) -> Length {
        // Altitude in ft equivalent to 0.1 PSI delta P at sea level
        const TARGET_LANDING_ALT_DIFF: f64 = 187.818;

        context.indicated_altitude()
            - self.landing_elev
            - Length::new::<foot>(TARGET_LANDING_ALT_DIFF)
    }

    fn get_int_diff_with_ldg_elev(&self) -> Length {
        self.cabin_alt - self.landing_elev
    }

    fn calculate_cabin_altitude(
        &self,
        sea_level_pressure: Pressure,
        destination_qnh: Pressure,
    ) -> Length {
        let p = self.cabin_pressure;

        // Based on local QNH when below 5000ft from departure or arrival airport, ISA when above
        let p_0 = if matches!(
            self.pressure_schedule_manager,
            PressureScheduleManager::DescentInternal(_)
        ) && (self.cabin_altitude() - self.landing_elev)
            .get::<foot>()
            .abs()
            < 5000.
        {
            if destination_qnh > Pressure::new::<hectopascal>(0.) {
                destination_qnh
            } else if sea_level_pressure > Pressure::new::<hectopascal>(0.) {
                sea_level_pressure
            } else {
                Pressure::new::<hectopascal>(1013.25)
            }
        } else if (self.cabin_altitude() - self.departure_elev)
            .get::<foot>()
            .abs()
            < 5000.
            && sea_level_pressure > Pressure::new::<hectopascal>(0.)
        {
            sea_level_pressure
        } else {
            Pressure::new::<hectopascal>(1013.25)
        };

        let pressure_ratio = (p / p_0).get::<ratio>();

        // Hydrostatic equation with linear temp changes and constant R, g
        let altitude: f64 = ((CabinPressureController::T_0
            / pressure_ratio.powf(
                (CabinPressureController::L * CabinPressureController::R)
                    / CabinPressureController::G,
            ))
            - CabinPressureController::T_0)
            / CabinPressureController::L;
        Length::new::<meter>(altitude)
    }

    pub fn update_outflow_valve_state(&mut self, outflow_valve: &PressureValve) {
        self.outflow_valve_open_amount = outflow_valve.open_amount();
    }

    pub fn update_safety_valve_state(&mut self, safety_valve: &PressureValve) {
        self.safety_valve_open_amount = safety_valve.open_amount();
    }

    pub fn cabin_altitude(&self) -> Length {
        self.cabin_alt
    }

    pub fn should_switch_cpc(&self) -> bool {
        self.pressure_schedule_manager.should_switch_cpc()
    }

    pub fn should_open_outflow_valve(&self) -> bool {
        self.pressure_schedule_manager.should_open_outflow_valve()
    }

    pub fn reset_cpc_switch(&mut self) {
        self.pressure_schedule_manager.reset_cpc_switch();
    }

    pub fn is_ground(&self) -> bool {
        matches!(
            self.pressure_schedule_manager,
            PressureScheduleManager::Ground(_)
        )
    }

    // FWC warning signals
    pub fn is_excessive_alt(&self) -> bool {
        self.cabin_alt > Length::new::<foot>(9550.)
            && self.cabin_alt > (self.departure_elev + Length::new::<foot>(1000.))
            && self.cabin_alt > (self.landing_elev + Length::new::<foot>(1000.))
    }

    pub fn is_excessive_residual_pressure(&self) -> bool {
        (self.cabin_pressure - self.exterior_pressure) > Pressure::new::<psi>(0.01)
    }

    pub fn is_low_diff_pressure(&self) -> bool {
        (self.cabin_pressure - self.exterior_pressure) < Pressure::new::<psi>(1.45)
            && self.cabin_alt > (self.landing_elev + Length::new::<foot>(1500.))
            && self.exterior_vertical_speed < Velocity::new::<foot_per_minute>(-500.)
    }
}

impl OutflowValveActuator for CabinPressureController {
    fn target_valve_position(
        &self,
        press_overhead: &PressurizationOverheadPanel,
        cabin_pressure_simulation: &CabinPressure,
    ) -> Ratio {
        // Calculation extracted from:
        // F. Y. Kurokawa, C. Regina de Andrade and E. L. Zaparoli
        // DETERMINATION OF THE OUTFLOW VALVE OPENING AREA OF THE AIRCRAFT CABIN PRESSURIZATION SYSTEM
        // 18th International Congress of Mechanical Engineering
        // November 6-11, 2005, Ouro Preto, MG

        // Outflow valve target open area
        let ofv_area = (cabin_pressure_simulation.cabin_flow_properties()[0]
            .get::<cubic_meter_per_second>()
            - cabin_pressure_simulation.cabin_flow_properties()[1].get::<cubic_meter_per_second>()
            + ((CabinPressureController::RHO
                * CabinPressureController::G
                * CabinPressureController::CABIN_VOLUME)
                / (CabinPressureController::R * CabinPressureController::T_0))
                * self.cabin_target_vs.get::<meter_per_second>())
            / (cabin_pressure_simulation.flow_coefficient()
                * ((2.
                    * (CabinPressureController::GAMMA / (CabinPressureController::GAMMA - 1.))
                    * CabinPressureController::RHO
                    * self.cabin_pressure.get::<pascal>()
                    * cabin_pressure_simulation.z_coefficient())
                .abs())
                .sqrt());

        let ofv_open_ratio = Ratio::new::<ratio>(ofv_area / CabinPressureController::OFV_SIZE);

        if press_overhead.is_in_man_mode() {
            self.outflow_valve_open_amount
        } else if press_overhead.ditching.is_on() {
            Ratio::new::<percent>(0.)
        } else if ofv_open_ratio >= Ratio::new::<percent>(100.)
            || (self.is_ground() && self.pressure_schedule_manager.should_open_outflow_valve())
        {
            Ratio::new::<percent>(100.)
        } else if ofv_open_ratio <= Ratio::new::<percent>(0.) {
            Ratio::new::<percent>(0.)
        } else {
            ofv_open_ratio
        }
    }
}

// Safety valve signal
impl ControllerSignal<PressureValveSignal> for CabinPressureController {
    fn signal(&self) -> Option<PressureValveSignal> {
        if (self.cabin_pressure - self.exterior_pressure) > Pressure::new::<psi>(8.1) {
            if (self.cabin_pressure - self.exterior_pressure) > Pressure::new::<psi>(8.6) {
                Some(PressureValveSignal::Open)
            } else {
                Some(PressureValveSignal::Neutral)
            }
        } else if (self.cabin_pressure - self.exterior_pressure) < Pressure::new::<psi>(-0.5) {
            if (self.cabin_pressure - self.exterior_pressure) < Pressure::new::<psi>(-1.) {
                Some(PressureValveSignal::Open)
            } else {
                Some(PressureValveSignal::Neutral)
            }
        } else if self.safety_valve_open_amount > Ratio::new::<percent>(0.) {
            Some(PressureValveSignal::Close)
        } else {
            Some(PressureValveSignal::Neutral)
        }
    }
}

#[derive(Copy, Clone)]
enum PressureScheduleManager {
    Ground(PressureSchedule<Ground>),
    TakeOff(PressureSchedule<TakeOff>),
    ClimbInternal(PressureSchedule<ClimbInternal>),
    Cruise(PressureSchedule<Cruise>),
    DescentInternal(PressureSchedule<DescentInternal>),
    Abort(PressureSchedule<Abort>),
}

impl PressureScheduleManager {
    fn new() -> Self {
        PressureScheduleManager::Ground(PressureSchedule::with_open_outflow_valve())
    }

    fn update(
        mut self,
        context: &UpdateContext,
        engines: [&impl EngineCorrectedN1; 2],
        lgciu_gear_compressed: bool,
    ) -> Self {
        self = match self {
            PressureScheduleManager::Ground(val) => {
                val.step(context, engines, lgciu_gear_compressed)
            }
            PressureScheduleManager::TakeOff(val) => {
                val.step(context, engines, lgciu_gear_compressed)
            }
            PressureScheduleManager::ClimbInternal(val) => val.step(context),
            PressureScheduleManager::Cruise(val) => val.step(context),
            PressureScheduleManager::DescentInternal(val) => {
                val.step(context, lgciu_gear_compressed)
            }
            PressureScheduleManager::Abort(val) => val.step(context, lgciu_gear_compressed),
        };
        self
    }

    fn should_open_outflow_valve(&self) -> bool {
        match self {
            PressureScheduleManager::Ground(schedule) => schedule.should_open_outflow_valve(),
            _ => false,
        }
    }

    fn reset_cpc_switch(&mut self) {
        if let PressureScheduleManager::Ground(schedule) = self {
            schedule.reset_cpc_switch();
        }
    }

    fn should_switch_cpc(&self) -> bool {
        match self {
            PressureScheduleManager::Ground(schedule) => schedule.should_switch_cpc(),
            _ => false,
        }
    }
}

impl Default for PressureScheduleManager {
    fn default() -> Self {
        Self::new()
    }
}

macro_rules! transition {
    ($from: ty, $to: tt) => {
        transition_with_ctor!($from, $to, || $to);
    };
}

macro_rules! transition_with_ctor {
    ($from: ty, $to: tt, $ctor: expr) => {
        impl From<PressureSchedule<$from>> for PressureSchedule<$to> {
            fn from(val: PressureSchedule<$from>) -> PressureSchedule<$to> {
                PressureSchedule::new(val, $ctor)
            }
        }
    };
}

#[derive(Copy, Clone)]
struct PressureSchedule<S> {
    timer: Duration,
    pressure_schedule: S,
}

impl<S> PressureSchedule<S> {
    fn increase_timer(mut self, context: &UpdateContext) -> Self {
        self.timer += context.delta();
        self
    }

    fn reset_timer(mut self) -> Self {
        self.timer = Duration::from_secs(0);
        self
    }

    fn new<T, U: Fn() -> S>(_from: PressureSchedule<T>, ctor_fn: U) -> Self {
        Self {
            timer: Duration::from_secs(0),
            pressure_schedule: (ctor_fn)(),
        }
    }
}

#[derive(Copy, Clone)]
struct Ground {
    cpc_switch_reset: bool,
}

impl Ground {
    fn reset() -> Self {
        Ground {
            cpc_switch_reset: true,
        }
    }
}

impl PressureSchedule<Ground> {
    const OUTFLOW_VALVE_OPENS_AFTER_SECS: u64 = 55;

    fn with_open_outflow_valve() -> Self {
        Self {
            timer: Duration::from_secs(Self::OUTFLOW_VALVE_OPENS_AFTER_SECS),
            pressure_schedule: Ground {
                cpc_switch_reset: false,
            },
        }
    }

    fn step(
        self: PressureSchedule<Ground>,
        context: &UpdateContext,
        engines: [&impl EngineCorrectedN1; 2],
        lgciu_gear_compressed: bool,
    ) -> PressureScheduleManager {
        if engines
            .iter()
            .all(|&x| x.corrected_n1() > Ratio::new::<percent>(70.))
            && lgciu_gear_compressed
        {
            PressureScheduleManager::TakeOff(self.into())
        } else if !lgciu_gear_compressed
            && context.indicated_airspeed().get::<knot>() > 100.
            && context.ambient_pressure().get::<hectopascal>() > 0.
        {
            PressureScheduleManager::ClimbInternal(self.into())
        } else {
            PressureScheduleManager::Ground(self.increase_timer(context))
        }
    }

    fn should_open_outflow_valve(&self) -> bool {
        self.timer >= Duration::from_secs(Self::OUTFLOW_VALVE_OPENS_AFTER_SECS)
    }

    fn should_switch_cpc(self: PressureSchedule<Ground>) -> bool {
        self.timer > Duration::from_secs(70) && self.pressure_schedule.cpc_switch_reset
    }

    fn reset_cpc_switch(&mut self) {
        self.pressure_schedule.cpc_switch_reset = false;
    }
}

transition_with_ctor!(TakeOff, Ground, Ground::reset);
transition_with_ctor!(DescentInternal, Ground, Ground::reset);
transition_with_ctor!(Abort, Ground, Ground::reset);

#[derive(Copy, Clone)]
struct TakeOff;

impl PressureSchedule<TakeOff> {
    fn step(
        self: PressureSchedule<TakeOff>,
        context: &UpdateContext,
        engines: [&impl EngineCorrectedN1; 2],
        lgciu_gear_compressed: bool,
    ) -> PressureScheduleManager {
        if engines
            .iter()
            .all(|&x| x.corrected_n1() < Ratio::new::<percent>(70.))
            && lgciu_gear_compressed
        {
            PressureScheduleManager::Ground(self.into())
        } else if !lgciu_gear_compressed
            && context.indicated_airspeed().get::<knot>() > 100.
            && context.ambient_pressure().get::<hectopascal>() > 0.
        {
            PressureScheduleManager::ClimbInternal(self.into())
        } else {
            PressureScheduleManager::TakeOff(self)
        }
    }
}

transition!(Ground, TakeOff);

#[derive(Copy, Clone)]
struct ClimbInternal;

impl PressureSchedule<ClimbInternal> {
    fn step(
        self: PressureSchedule<ClimbInternal>,
        context: &UpdateContext,
    ) -> PressureScheduleManager {
        const DURATION_UNTIL_ABORT: u64 = 30;
        const DURATION_UNTIL_CRUISE: u64 = 30;
        const DURATION_UNTIL_DESCENT: u64 = 60;

        if context.indicated_altitude() < Length::new::<foot>(8000.)
            && context.vertical_speed() < Velocity::new::<foot_per_minute>(-200.)
        {
            if self.timer > Duration::from_secs(DURATION_UNTIL_ABORT) {
                PressureScheduleManager::Abort(self.into())
            } else {
                PressureScheduleManager::ClimbInternal(self.increase_timer(context))
            }
        } else if context.vertical_speed() < Velocity::new::<foot_per_minute>(100.)
            && context.vertical_speed() > Velocity::new::<foot_per_minute>(-100.)
        {
            if self.timer > Duration::from_secs(DURATION_UNTIL_CRUISE) {
                PressureScheduleManager::Cruise(self.into())
            } else {
                PressureScheduleManager::ClimbInternal(self.increase_timer(context))
            }
        } else if context.vertical_speed() < Velocity::new::<foot_per_minute>(-250.) {
            if self.timer > Duration::from_secs(DURATION_UNTIL_DESCENT) {
                PressureScheduleManager::DescentInternal(self.into())
            } else {
                PressureScheduleManager::ClimbInternal(self.increase_timer(context))
            }
        } else {
            PressureScheduleManager::ClimbInternal(self.reset_timer())
        }
    }
}

transition!(Ground, ClimbInternal);
transition!(TakeOff, ClimbInternal);
transition!(Cruise, ClimbInternal);
transition!(DescentInternal, ClimbInternal);
transition!(Abort, ClimbInternal);

#[derive(Copy, Clone)]
struct Cruise;

impl PressureSchedule<Cruise> {
    fn step(self: PressureSchedule<Cruise>, context: &UpdateContext) -> PressureScheduleManager {
        const DURATION_UNTIL_CLIMB: u64 = 60;
        const DURATION_UNTIL_DESCENT: u64 = 30;

        if context.vertical_speed() > Velocity::new::<foot_per_minute>(250.) {
            if self.timer > Duration::from_secs(DURATION_UNTIL_CLIMB) {
                PressureScheduleManager::ClimbInternal(self.into())
            } else {
                PressureScheduleManager::Cruise(self.increase_timer(context))
            }
        } else if context.vertical_speed() < Velocity::new::<foot_per_minute>(-250.) {
            if self.timer > Duration::from_secs(DURATION_UNTIL_DESCENT) {
                PressureScheduleManager::DescentInternal(self.into())
            } else {
                PressureScheduleManager::Cruise(self.increase_timer(context))
            }
        } else {
            PressureScheduleManager::Cruise(self.reset_timer())
        }
    }
}

transition!(ClimbInternal, Cruise);

#[derive(Copy, Clone)]
struct DescentInternal;

impl PressureSchedule<DescentInternal> {
    fn step(
        self: PressureSchedule<DescentInternal>,
        context: &UpdateContext,
        lgciu_gear_compressed: bool,
    ) -> PressureScheduleManager {
        const DURATION_UNTIL_CLIMB: u64 = 60;

        if context.vertical_speed() > Velocity::new::<foot_per_minute>(250.) {
            if self.timer > Duration::from_secs(DURATION_UNTIL_CLIMB) {
                PressureScheduleManager::ClimbInternal(self.into())
            } else {
                PressureScheduleManager::DescentInternal(self.increase_timer(context))
            }
        } else if lgciu_gear_compressed && context.indicated_airspeed().get::<knot>() < 100. {
            PressureScheduleManager::Ground(self.into())
        } else {
            PressureScheduleManager::DescentInternal(self.reset_timer())
        }
    }
}

transition!(ClimbInternal, DescentInternal);
transition!(Cruise, DescentInternal);

#[derive(Copy, Clone)]
struct Abort;

impl PressureSchedule<Abort> {
    fn step(
        self: PressureSchedule<Abort>,
        context: &UpdateContext,
        lgciu_gear_compressed: bool,
    ) -> PressureScheduleManager {
        const DURATION_UNTIL_CLIMB: u64 = 60;

        if lgciu_gear_compressed && context.indicated_airspeed().get::<knot>() < 100. {
            PressureScheduleManager::Ground(self.into())
        } else if context.vertical_speed() > Velocity::new::<foot_per_minute>(30.) {
            if self.timer > Duration::from_secs(DURATION_UNTIL_CLIMB) {
                PressureScheduleManager::ClimbInternal(self.into())
            } else {
                PressureScheduleManager::Abort(self.increase_timer(context))
            }
        } else {
            PressureScheduleManager::Abort(self.reset_timer())
        }
    }
}

transition!(ClimbInternal, Abort);

#[cfg(test)]
mod pressure_schedule_manager_tests {
    use super::*;
    use crate::simulation::{Aircraft, SimulationElement};
    use crate::{
        shared::EngineCorrectedN1,
        simulation::test::{SimulationTestBed, TestBed},
    };

    use std::time::Duration;
    use uom::si::{
        length::foot,
        pressure::hectopascal,
        ratio::percent,
        velocity::{foot_per_minute, knot},
    };

    struct TestEngine {
        corrected_n1: Ratio,
    }
    impl TestEngine {
        fn new(engine_corrected_n1: Ratio) -> Self {
            Self {
                corrected_n1: engine_corrected_n1,
            }
        }

        fn set_engine_n1(&mut self, n: Ratio) {
            self.corrected_n1 = n;
        }
    }
    impl EngineCorrectedN1 for TestEngine {
        fn corrected_n1(&self) -> Ratio {
            self.corrected_n1
        }
    }

    struct TestAircraft {
        cpc: CabinPressureController,
        outflow_valve: PressureValve,
        press_overhead: PressurizationOverheadPanel,
        engine_1: TestEngine,
        engine_2: TestEngine,
        lgciu_gear_compressed: bool,
    }
    impl TestAircraft {
        fn new() -> Self {
            let mut test_aircraft = Self {
                cpc: CabinPressureController::new(),
                outflow_valve: PressureValve::new_outflow_valve(),
                press_overhead: PressurizationOverheadPanel::new(),
                engine_1: TestEngine::new(Ratio::new::<percent>(0.)),
                engine_2: TestEngine::new(Ratio::new::<percent>(0.)),
                lgciu_gear_compressed: false,
            };
            test_aircraft.cpc.outflow_valve_open_amount = Ratio::new::<percent>(50.);
            test_aircraft
        }

        fn set_engine_n1(&mut self, n: Ratio) {
            self.engine_1.set_engine_n1(n);
            self.engine_2.set_engine_n1(n)
        }

        fn is_ground(&self) -> bool {
            matches!(
                self.cpc.pressure_schedule_manager,
                PressureScheduleManager::Ground(_)
            )
        }

        fn is_takeoff(&self) -> bool {
            matches!(
                self.cpc.pressure_schedule_manager,
                PressureScheduleManager::TakeOff(_)
            )
        }

        fn is_climb(&self) -> bool {
            matches!(
                self.cpc.pressure_schedule_manager,
                PressureScheduleManager::ClimbInternal(_)
            )
        }

        fn is_cruise(&self) -> bool {
            matches!(
                self.cpc.pressure_schedule_manager,
                PressureScheduleManager::Cruise(_)
            )
        }

        fn is_descent(&self) -> bool {
            matches!(
                self.cpc.pressure_schedule_manager,
                PressureScheduleManager::DescentInternal(_)
            )
        }

        fn is_abort(&self) -> bool {
            matches!(
                self.cpc.pressure_schedule_manager,
                PressureScheduleManager::Abort(_)
            )
        }

        fn set_on_ground(&mut self, on_ground: bool) {
            self.lgciu_gear_compressed = on_ground;
        }
    }
    impl Aircraft for TestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.cpc.update(
                context,
                [&self.engine_1, &self.engine_2],
                Pressure::new::<hectopascal>(1013.),
                Length::new::<meter>(0.),
                Length::new::<meter>(0.),
                Pressure::new::<hectopascal>(1013.),
                Pressure::new::<hectopascal>(1013.),
                self.lgciu_gear_compressed,
                Pressure::new::<hectopascal>(1013.),
            );
            self.outflow_valve.update(context, &self.press_overhead);
            self.cpc.update_outflow_valve_state(&self.outflow_valve);
        }
    }
    impl SimulationElement for TestAircraft {}

    #[test]
    fn schedule_starts_on_ground() {
        let test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        assert!(test_bed.query(|a| a.is_ground()));
    }

    #[test]
    fn schedule_changes_from_ground_to_takeoff() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.command(|a| a.set_engine_n1(Ratio::new::<percent>(95.)));

        test_bed.command(|a| a.set_on_ground(true));
        test_bed.set_indicated_airspeed(Velocity::new::<knot>(0.));

        test_bed.run();

        assert!(test_bed.query(|a| a.is_takeoff()));
    }

    #[test]
    fn schedule_changes_from_ground_to_climb() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.command(|a| a.set_on_ground(true));
        test_bed.set_indicated_airspeed(Velocity::new::<knot>(101.));

        test_bed.run();

        test_bed.command(|a| a.set_on_ground(false));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_climb()));
    }

    #[test]
    fn schedule_changes_from_takeoff_to_climb() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.command(|a| a.set_engine_n1(Ratio::new::<percent>(95.)));

        test_bed.command(|a| a.set_on_ground(true));
        test_bed.set_indicated_airspeed(Velocity::new::<knot>(0.));
        test_bed.run();

        test_bed.command(|a| a.set_on_ground(false));
        test_bed.set_indicated_airspeed(Velocity::new::<knot>(101.));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_climb()));
    }

    #[test]
    fn schedule_changes_from_takeoff_to_ground() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.command(|a| a.set_engine_n1(Ratio::new::<percent>(95.)));
        test_bed.command(|a| a.set_on_ground(true));
        test_bed.set_indicated_airspeed(Velocity::new::<knot>(0.));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_takeoff()));

        test_bed.command(|a| a.set_engine_n1(Ratio::new::<percent>(50.)));
        test_bed.command(|a| a.set_on_ground(true));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_ground()));
    }

    #[test]
    fn schedule_does_not_instantly_change_from_climb_to_abort() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.run();

        assert!(test_bed.query(|a| a.is_climb()));

        test_bed.set_indicated_altitude(Length::new::<foot>(7900.));
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-201.));
        test_bed.run_with_delta(Duration::from_secs(1));

        assert!(test_bed.query(|a| a.is_climb()));
    }

    #[test]
    fn schedule_changes_from_climb_to_abort() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.run();

        assert!(test_bed.query(|a| a.is_climb()));

        test_bed.set_indicated_altitude(Length::new::<foot>(7900.));
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-201.));
        test_bed.run_with_delta(Duration::from_secs(31));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_abort()));
    }

    #[test]
    fn schedule_does_not_instantly_change_from_climb_to_cruise() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.run();

        assert!(test_bed.query(|a| a.is_climb()));

        test_bed.set_indicated_altitude(Length::new::<foot>(7900.));
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(99.));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_climb()));
    }

    #[test]
    fn schedule_changes_from_climb_to_cruise() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.run();

        assert!(test_bed.query(|a| a.is_climb()));

        test_bed.set_indicated_altitude(Length::new::<foot>(7900.));
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(99.));
        test_bed.run_with_delta(Duration::from_secs(31));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_cruise()));
    }

    #[test]
    fn schedule_does_not_instantly_change_from_cruise_to_climb_and_descent() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.run();
        test_bed.run_with_delta(Duration::from_secs(31));
        test_bed.run_with_delta(Duration::from_secs(1));

        assert!(test_bed.query(|a| a.is_cruise()));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(260.));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_cruise()));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-260.));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_cruise()));
    }

    #[test]
    fn schedule_changes_from_cruise_to_climb() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.run();
        test_bed.run_with_delta(Duration::from_secs(31));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_cruise()));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(260.));
        test_bed.run_with_delta(Duration::from_secs(61));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_climb()));
    }

    #[test]
    fn schedule_changes_from_cruise_to_descent() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.run();
        test_bed.run_with_delta(Duration::from_secs(31));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_cruise()));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-260.));
        test_bed.run_with_delta(Duration::from_secs(31));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_descent()));
    }

    #[test]
    fn schedule_changes_from_descent_to_climb() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.run();
        test_bed.run_with_delta(Duration::from_secs(31));
        test_bed.run();

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-260.));
        test_bed.run_with_delta(Duration::from_secs(31));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_descent()));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(260.));
        test_bed.run_with_delta(Duration::from_secs(61));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_climb()));
    }

    #[test]
    fn schedule_changes_from_descent_to_ground() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.run();
        test_bed.run_with_delta(Duration::from_secs(31));
        test_bed.run();

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-260.));
        test_bed.run_with_delta(Duration::from_secs(31));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_descent()));

        test_bed.set_indicated_airspeed(Velocity::new::<knot>(99.));
        test_bed.command(|a| a.set_on_ground(true));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_ground()));
    }

    #[test]
    fn schedule_changes_from_abort_to_climb() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.set_indicated_altitude(Length::new::<foot>(7900.));
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-201.));
        test_bed.run();
        test_bed.run_with_delta(Duration::from_secs(31));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_abort()));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(31.));
        test_bed.run_with_delta(Duration::from_secs(61));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_climb()));
    }

    #[test]
    fn schedule_changes_from_abort_to_ground() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.set_indicated_altitude(Length::new::<foot>(7900.));
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-201.));
        test_bed.run();
        test_bed.run_with_delta(Duration::from_secs(31));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_abort()));

        test_bed.set_indicated_airspeed(Velocity::new::<knot>(99.));
        test_bed.command(|a| a.set_on_ground(true));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_ground()));
    }

    #[test]
    fn schedule_timer_resets_after_climb_condition_is_not_met() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.run();
        assert!(test_bed.query(|a| a.is_climb()));

        test_bed.set_indicated_altitude(Length::new::<foot>(7900.));
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(99.));
        test_bed.run_with_delta(Duration::from_secs(10));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_climb()));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(200.));
        test_bed.run();
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(99.));
        test_bed.run_with_delta(Duration::from_secs(25));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_climb()));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(200.));
        test_bed.run();
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(99.));
        test_bed.run_with_delta(Duration::from_secs(31));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_cruise()));
    }

    #[test]
    fn schedule_timer_resets_after_cruise_condition_is_not_met() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.run();
        test_bed.run_with_delta(Duration::from_secs(31));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_cruise()));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-260.));
        test_bed.run_with_delta(Duration::from_secs(25));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_cruise()));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-10.));
        test_bed.run();
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-260.));
        test_bed.run_with_delta(Duration::from_secs(25));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_cruise()));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-10.));
        test_bed.run();
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-260.));
        test_bed.run_with_delta(Duration::from_secs(31));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_descent()));
    }

    #[test]
    fn schedule_timer_resets_after_descent_condition_is_not_met() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.run();
        test_bed.run_with_delta(Duration::from_secs(31));
        test_bed.run();

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-260.));
        test_bed.run_with_delta(Duration::from_secs(31));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_descent()));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(240.));
        test_bed.run();
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(260.));
        test_bed.run_with_delta(Duration::from_secs(31));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_descent()));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(240.));
        test_bed.run();
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(260.));
        test_bed.run_with_delta(Duration::from_secs(31));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_descent()));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(240.));
        test_bed.run();
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(260.));
        test_bed.run_with_delta(Duration::from_secs(61));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_climb()));
    }

    #[test]
    fn schedule_timer_resets_after_abort_condition_is_not_met() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.set_indicated_altitude(Length::new::<foot>(7900.));
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-201.));
        test_bed.run();
        test_bed.run_with_delta(Duration::from_secs(31));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_abort()));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(31.));
        test_bed.run_with_delta(Duration::from_secs(31));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_abort()));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(29.));
        test_bed.run();
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(31.));
        test_bed.run_with_delta(Duration::from_secs(31));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_abort()));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(29.));
        test_bed.run();
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(31.));
        test_bed.run_with_delta(Duration::from_secs(61));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_climb()));
    }
}
