use crate::{
    shared::{ControllerSignal, EngineCorrectedN1, PressurizationOverheadShared},
    simulation::{
        InitContext, Read, SimulationElement, SimulatorReader, SimulatorWriter, UpdateContext,
        VariableIdentifier, Write,
    },
};

use super::{
    CabinPressure, CabinPressureSimulation, OutflowValveActuator, PressureValve,
    PressureValveSignal,
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

pub struct CabinPressureController {
    cabin_altitude_id: VariableIdentifier,
    fwc_excess_cabin_altitude_id: VariableIdentifier,
    fwc_excess_residual_pressure_id: VariableIdentifier,
    fwc_low_diff_pressure_id: VariableIdentifier,
    outflow_valve_open_percentage_id: VariableIdentifier,
    safety_valve_open_percentage_id: VariableIdentifier,

    auto_landing_elevation_id: VariableIdentifier,
    departure_elevation_id: VariableIdentifier,
    sea_level_pressure_id: VariableIdentifier,
    destination_qnh_id: VariableIdentifier,

    pressure_schedule_manager: Option<PressureScheduleManager>,
    exterior_pressure: Pressure,
    exterior_vertical_speed: Velocity,
    cabin_pressure: Pressure,
    cabin_alt: Length,
    departure_elev: Length,
    landing_elev: Length,
    cabin_target_vs: Velocity,
    outflow_valve_open_amount: Ratio,
    safety_valve_open_amount: Ratio,

    landing_elevation: Length,
    departure_elevation: Length,
    sea_level_pressure: Pressure,
    destination_qnh: Pressure,
    is_in_man_mode: bool,
    man_mode_duration: Duration,
    manual_to_auto_switch: bool,
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

    pub fn new(context: &mut InitContext) -> Self {
        Self {
            cabin_altitude_id: context.get_identifier("PRESS_CABIN_ALTITUDE".to_owned()),
            fwc_excess_cabin_altitude_id: context.get_identifier("PRESS_EXCESS_CAB_ALT".to_owned()),
            fwc_excess_residual_pressure_id: context
                .get_identifier("PRESS_EXCESS_RESIDUAL_PR".to_owned()),
            fwc_low_diff_pressure_id: context.get_identifier("PRESS_LOW_DIFF_PR".to_owned()),
            outflow_valve_open_percentage_id: context
                .get_identifier("PRESS_OUTFLOW_VALVE_OPEN_PERCENTAGE".to_owned()),
            safety_valve_open_percentage_id: context
                .get_identifier("PRESS_SAFETY_VALVE_OPEN_PERCENTAGE".to_owned()),

            auto_landing_elevation_id: context
                .get_identifier("PRESS_AUTO_LANDING_ELEVATION".to_owned()),
            departure_elevation_id: context.get_identifier("DEPARTURE_ELEVATION".to_owned()),
            sea_level_pressure_id: context.get_identifier("SEA LEVEL PRESSURE".to_owned()),
            destination_qnh_id: context.get_identifier("DESTINATION_QNH".to_owned()),

            pressure_schedule_manager: Some(PressureScheduleManager::new()),
            exterior_pressure: Pressure::new::<hectopascal>(1013.25),
            exterior_vertical_speed: Velocity::new::<foot_per_minute>(0.),
            cabin_pressure: Pressure::new::<hectopascal>(1013.25),
            cabin_alt: Length::new::<meter>(0.),
            departure_elev: Length::new::<foot>(-5000.),
            landing_elev: Length::new::<meter>(0.),
            cabin_target_vs: Velocity::new::<meter_per_second>(0.),
            outflow_valve_open_amount: Ratio::new::<percent>(100.),
            safety_valve_open_amount: Ratio::new::<percent>(0.),

            landing_elevation: Length::new::<foot>(0.),
            departure_elevation: Length::new::<foot>(0.),
            sea_level_pressure: Pressure::new::<hectopascal>(1013.25),
            destination_qnh: Pressure::new::<hectopascal>(0.),
            is_in_man_mode: false,
            man_mode_duration: Duration::from_secs(0),
            manual_to_auto_switch: false,
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        engines: [&impl EngineCorrectedN1; 2],
        lgciu_gears_compressed: bool,
        press_overhead: &impl PressurizationOverheadShared,
        cabin_simulation: &impl CabinPressure,
        outflow_valve: &PressureValve,
        safety_valve: &PressureValve,
    ) {
        self.exterior_pressure = cabin_simulation.exterior_pressure();
        self.exterior_vertical_speed = context.vertical_speed();
        self.cabin_pressure = cabin_simulation.cabin_pressure();

        if !press_overhead.ldg_elev_is_auto() {
            self.landing_elevation = Length::new::<foot>(press_overhead.ldg_elev_knob_value())
        }

        if let Some(manager) = self.pressure_schedule_manager.take() {
            self.pressure_schedule_manager =
                Some(manager.update(context, engines, lgciu_gears_compressed));
        }

        self.cabin_target_vs = self.calculate_cabin_target_vs(context);
        self.cabin_alt = self.calculate_cabin_altitude();

        self.outflow_valve_open_amount = outflow_valve.open_amount();
        self.safety_valve_open_amount = safety_valve.open_amount();

        if self.is_in_man_mode && press_overhead.is_in_man_mode() {
            self.man_mode_duration += context.delta();
        } else if self.is_in_man_mode && !press_overhead.is_in_man_mode() {
            if self.man_mode_duration > Duration::from_secs(10) {
                self.manual_to_auto_switch = true;
            }
            self.man_mode_duration = Duration::from_secs(0)
        }

        self.is_in_man_mode = press_overhead.is_in_man_mode();
    }

    fn calculate_cabin_target_vs(&mut self, context: &UpdateContext) -> Velocity {
        let error_margin = Pressure::new::<hectopascal>(1.);

        match self.pressure_schedule_manager {
            Some(PressureScheduleManager::Ground(_)) => {
                if self.cabin_delta_p() > error_margin {
                    Velocity::new::<foot_per_minute>(Self::DEPRESS_RATE)
                } else if self.cabin_delta_p() < -error_margin {
                    Velocity::new::<foot_per_minute>(-Self::DEPRESS_RATE)
                } else {
                    Velocity::new::<foot_per_minute>(0.)
                }
            }
            Some(PressureScheduleManager::TakeOff(_)) => {
                if self.cabin_delta_p() < Pressure::new::<psi>(0.1) {
                    Velocity::new::<foot_per_minute>(Self::TAKEOFF_RATE)
                } else {
                    Velocity::new::<foot_per_minute>(0.)
                }
            }
            Some(PressureScheduleManager::ClimbInternal(_)) => {
                const DELTA_PRESSURE_LIMIT: f64 = 8.06; // PSI
                const CABIN_ALTITUDE_LIMIT: f64 = 8050.; // Feet

                // Formula based on empirical graphs and tables to simulate climb schedule as per the real aircraft
                let target_vs = Velocity::new::<foot_per_minute>(
                    self.exterior_vertical_speed.get::<foot_per_minute>()
                        * (0.00000525 * context.indicated_altitude().get::<foot>() + 0.09),
                );
                if self.cabin_delta_p() >= Pressure::new::<psi>(DELTA_PRESSURE_LIMIT) {
                    Velocity::new::<foot_per_minute>(Self::MAX_CLIMB_RATE)
                } else if self.cabin_altitude() >= Length::new::<foot>(CABIN_ALTITUDE_LIMIT) {
                    Velocity::new::<foot_per_minute>(0.)
                } else if target_vs <= Velocity::new::<foot_per_minute>(Self::MAX_DESCENT_RATE) {
                    Velocity::new::<foot_per_minute>(Self::MAX_DESCENT_RATE)
                } else {
                    target_vs
                }
            }
            Some(PressureScheduleManager::Cruise(_)) => Velocity::new::<foot_per_minute>(0.),
            Some(PressureScheduleManager::DescentInternal(_)) => {
                let ext_diff_with_ldg_elev = self.get_ext_diff_with_ldg_elev(context).get::<foot>();
                let target_vs = Velocity::new::<foot_per_minute>(
                    self.get_int_diff_with_ldg_elev().get::<foot>()
                        * self.exterior_vertical_speed.get::<foot_per_minute>()
                        / ext_diff_with_ldg_elev,
                );
                if ext_diff_with_ldg_elev <= 0. {
                    Velocity::new::<foot_per_minute>(0.)
                } else if target_vs <= Velocity::new::<foot_per_minute>(Self::MAX_DESCENT_RATE) {
                    Velocity::new::<foot_per_minute>(Self::MAX_DESCENT_RATE)
                } else if target_vs
                    >= Velocity::new::<foot_per_minute>(Self::MAX_CLIMB_RATE_IN_DESCENT)
                {
                    Velocity::new::<foot_per_minute>(Self::MAX_CLIMB_RATE_IN_DESCENT)
                } else {
                    target_vs
                }
            }
            Some(PressureScheduleManager::Abort(_)) => {
                // Altitude in ft equivalent to 0.1 PSI delta P at sea level
                const TARGET_LANDING_ALT_DIFF: f64 = 187.818;

                if self.cabin_altitude()
                    > self.departure_elev - Length::new::<foot>(TARGET_LANDING_ALT_DIFF)
                {
                    Velocity::new::<foot_per_minute>(Self::MAX_ABORT_DESCENT_RATE)
                } else {
                    Velocity::new::<foot_per_minute>(0.)
                }
            }
            None => Velocity::new::<foot_per_minute>(0.),
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

    fn calculate_cabin_altitude(&self) -> Length {
        let p = self.cabin_pressure;

        // Based on local QNH when below 5000ft from departure or arrival airport, ISA when above
        let p_0 = if matches!(
            self.pressure_schedule_manager,
            Some(PressureScheduleManager::DescentInternal(_))
        ) && (self.cabin_altitude() - self.landing_elev)
            .get::<foot>()
            .abs()
            < 5000.
        {
            if self.destination_qnh > Pressure::new::<hectopascal>(0.) {
                self.destination_qnh
            } else if self.sea_level_pressure > Pressure::new::<hectopascal>(0.) {
                self.sea_level_pressure
            } else {
                Pressure::new::<hectopascal>(1013.25)
            }
        } else if (self.cabin_altitude() - self.departure_elev)
            .get::<foot>()
            .abs()
            < 5000.
            && self.sea_level_pressure > Pressure::new::<hectopascal>(0.)
        {
            self.sea_level_pressure
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

    fn cabin_delta_p(&self) -> Pressure {
        self.cabin_pressure - self.exterior_pressure
    }

    pub(super) fn cabin_altitude(&self) -> Length {
        self.cabin_alt
    }

    pub fn should_switch_cpc(&mut self) -> bool {
        if self.manual_to_auto_switch {
            self.manual_to_auto_switch = false;
            return true;
        }
        self.pressure_schedule_manager
            .as_ref()
            .map_or(false, |manager| manager.should_switch_cpc())
    }

    pub fn should_open_outflow_valve(&self) -> bool {
        self.pressure_schedule_manager
            .as_ref()
            .map_or(false, |manager| manager.should_open_outflow_valve())
    }

    pub fn reset_cpc_switch(&mut self) {
        if let Some(manager) = self.pressure_schedule_manager.as_mut() {
            manager.reset_cpc_switch();
        }
    }

    fn is_ground(&self) -> bool {
        matches!(
            self.pressure_schedule_manager,
            Some(PressureScheduleManager::Ground(_))
        )
    }

    // FWC warning signals
    pub(super) fn is_excessive_alt(&self) -> bool {
        self.cabin_alt > Length::new::<foot>(9550.)
            && self.cabin_alt > (self.departure_elev + Length::new::<foot>(1000.))
            && self.cabin_alt > (self.landing_elev + Length::new::<foot>(1000.))
    }

    pub(super) fn is_excessive_residual_pressure(&self) -> bool {
        self.cabin_delta_p() > Pressure::new::<psi>(0.03)
    }

    pub(super) fn is_low_diff_pressure(&self) -> bool {
        self.cabin_delta_p() < Pressure::new::<psi>(1.45)
            && self.cabin_alt > (self.landing_elev + Length::new::<foot>(1500.))
            && self.exterior_vertical_speed < Velocity::new::<foot_per_minute>(-500.)
    }
}

impl OutflowValveActuator for CabinPressureController {
    fn target_valve_position(
        &self,
        press_overhead: &impl PressurizationOverheadShared,
        cabin_pressure_simulation: &CabinPressureSimulation,
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
        } else if press_overhead.ditching_is_on() {
            Ratio::new::<percent>(0.)
        } else if ofv_open_ratio >= Ratio::new::<percent>(100.)
            || (self.is_ground() && self.should_open_outflow_valve())
        {
            Ratio::new::<percent>(100.)
        } else if ofv_open_ratio <= Ratio::new::<percent>(0.)
            || self.cabin_altitude() > Length::new::<foot>(15000.)
        {
            Ratio::new::<percent>(0.)
        } else {
            ofv_open_ratio
        }
    }
}

// Safety valve signal
impl ControllerSignal<PressureValveSignal> for CabinPressureController {
    fn signal(&self) -> Option<PressureValveSignal> {
        if self.cabin_delta_p() > Pressure::new::<psi>(8.1) {
            if self.cabin_delta_p() > Pressure::new::<psi>(8.6) {
                Some(PressureValveSignal::Open)
            } else {
                Some(PressureValveSignal::Neutral)
            }
        } else if self.cabin_delta_p() < Pressure::new::<psi>(-0.5) {
            if self.cabin_delta_p() < Pressure::new::<psi>(-1.) {
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

impl SimulationElement for CabinPressureController {
    fn write(&self, writer: &mut SimulatorWriter) {
        // Add check for active cpc only
        writer.write(&self.cabin_altitude_id, self.cabin_altitude());
        writer.write(
            &self.outflow_valve_open_percentage_id,
            self.outflow_valve_open_amount,
        );
        writer.write(
            &self.safety_valve_open_percentage_id,
            self.safety_valve_open_amount,
        );

        // FWC warning signals
        writer.write(&self.fwc_excess_cabin_altitude_id, self.is_excessive_alt());
        writer.write(
            &self.fwc_excess_residual_pressure_id,
            self.is_excessive_residual_pressure(),
        );
        writer.write(&self.fwc_low_diff_pressure_id, self.is_low_diff_pressure());
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.landing_elevation = reader.read(&self.auto_landing_elevation_id);
        self.departure_elevation = reader.read(&self.departure_elevation_id);
        self.sea_level_pressure =
            Pressure::new::<hectopascal>(reader.read(&self.sea_level_pressure_id));
        self.destination_qnh = Pressure::new::<hectopascal>(reader.read(&self.destination_qnh_id));
    }
}

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
        lgciu_gears_compressed: bool,
    ) -> Self {
        self = match self {
            PressureScheduleManager::Ground(val) => {
                val.step(context, engines, lgciu_gears_compressed)
            }
            PressureScheduleManager::TakeOff(val) => {
                val.step(context, engines, lgciu_gears_compressed)
            }
            PressureScheduleManager::ClimbInternal(val) => val.step(context),
            PressureScheduleManager::Cruise(val) => val.step(context),
            PressureScheduleManager::DescentInternal(val) => {
                val.step(context, lgciu_gears_compressed)
            }
            PressureScheduleManager::Abort(val) => val.step(context, lgciu_gears_compressed),
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

    fn new<T, U: Fn() -> S>(_: PressureSchedule<T>, ctor_fn: U) -> Self {
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
        lgciu_gears_compressed: bool,
    ) -> PressureScheduleManager {
        if engines
            .iter()
            .all(|&x| x.corrected_n1() > Ratio::new::<percent>(70.))
            && lgciu_gears_compressed
        {
            PressureScheduleManager::TakeOff(self.into())
        } else if !lgciu_gears_compressed
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
        lgciu_gears_compressed: bool,
    ) -> PressureScheduleManager {
        if engines
            .iter()
            .all(|&x| x.corrected_n1() < Ratio::new::<percent>(70.))
            && lgciu_gears_compressed
        {
            PressureScheduleManager::Ground(self.into())
        } else if !lgciu_gears_compressed
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
        lgciu_gears_compressed: bool,
    ) -> PressureScheduleManager {
        const DURATION_UNTIL_CLIMB: u64 = 60;

        if context.vertical_speed() > Velocity::new::<foot_per_minute>(250.) {
            if self.timer > Duration::from_secs(DURATION_UNTIL_CLIMB) {
                PressureScheduleManager::ClimbInternal(self.into())
            } else {
                PressureScheduleManager::DescentInternal(self.increase_timer(context))
            }
        } else if lgciu_gears_compressed && context.indicated_airspeed().get::<knot>() < 100. {
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
        lgciu_gears_compressed: bool,
    ) -> PressureScheduleManager {
        const DURATION_UNTIL_CLIMB: u64 = 60;

        if lgciu_gears_compressed && context.indicated_airspeed().get::<knot>() < 100. {
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
mod tests {
    use super::*;
    use crate::simulation::{Aircraft, InitContext, SimulationElement, SimulationElementVisitor};
    use crate::{
        overhead::{AutoManFaultPushButton, NormalOnPushButton, SpringLoadedSwitch, ValueKnob},
        shared::{EngineCorrectedN1, LgciuWeightOnWheels},
        simulation::{
            test::{SimulationTestBed, TestBed},
            UpdateContext,
        },
    };

    use std::time::Duration;
    use uom::si::{
        length::foot,
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

    struct TestLgciu {
        compressed: bool,
    }
    impl TestLgciu {
        fn new(compressed: bool) -> Self {
            Self { compressed }
        }

        fn set_on_ground(&mut self, on_ground: bool) {
            self.compressed = on_ground;
        }
    }

    impl LgciuWeightOnWheels for TestLgciu {
        fn left_and_right_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            self.compressed
        }
        fn right_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            true
        }
        fn right_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            false
        }
        fn left_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            true
        }
        fn left_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            false
        }
        fn left_and_right_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            false
        }
        fn nose_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            true
        }
        fn nose_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            false
        }
    }

    struct TestPressurizationOverheadPanel {
        mode_sel: AutoManFaultPushButton,
        man_vs_ctl_switch: SpringLoadedSwitch,
        ldg_elev_knob: ValueKnob,
        ditching: NormalOnPushButton,
    }

    impl TestPressurizationOverheadPanel {
        pub fn new(context: &mut InitContext) -> Self {
            Self {
                mode_sel: AutoManFaultPushButton::new_auto(context, "PRESS_MODE_SEL"),
                man_vs_ctl_switch: SpringLoadedSwitch::new(context, "PRESS_MAN_VS_CTL"),
                ldg_elev_knob: ValueKnob::new_with_value(context, "PRESS_LDG_ELEV", -2000.),
                ditching: NormalOnPushButton::new_normal(context, "PRESS_DITCHING"),
            }
        }

        fn man_vs_switch_position(&self) -> usize {
            self.man_vs_ctl_switch.position()
        }
    }

    impl SimulationElement for TestPressurizationOverheadPanel {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.mode_sel.accept(visitor);
            self.man_vs_ctl_switch.accept(visitor);
            self.ldg_elev_knob.accept(visitor);
            self.ditching.accept(visitor);

            visitor.visit(self);
        }
    }

    impl ControllerSignal<PressureValveSignal> for TestPressurizationOverheadPanel {
        fn signal(&self) -> Option<PressureValveSignal> {
            if !self.is_in_man_mode() {
                None
            } else {
                match self.man_vs_switch_position() {
                    0 => Some(PressureValveSignal::Open),
                    1 => Some(PressureValveSignal::Neutral),
                    2 => Some(PressureValveSignal::Close),
                    _ => panic!("Could not convert manual vertical speed switch position '{}' to pressure valve signal.", self.man_vs_switch_position()),
                }
            }
        }
    }

    impl PressurizationOverheadShared for TestPressurizationOverheadPanel {
        fn is_in_man_mode(&self) -> bool {
            !self.mode_sel.is_auto()
        }

        fn ditching_is_on(&self) -> bool {
            self.ditching.is_on()
        }

        fn ldg_elev_is_auto(&self) -> bool {
            let margin = 100.;
            (self.ldg_elev_knob.value() + 2000.).abs() < margin
        }

        fn ldg_elev_knob_value(&self) -> f64 {
            self.ldg_elev_knob.value()
        }
    }

    struct TestAircraft {
        cpc: CabinPressureController,
        cabin_simulation: CabinPressureSimulation,
        outflow_valve: PressureValve,
        safety_valve: PressureValve,
        press_overhead: TestPressurizationOverheadPanel,
        engine_1: TestEngine,
        engine_2: TestEngine,
        lgciu1: TestLgciu,
        lgciu2: TestLgciu,
    }
    impl TestAircraft {
        fn new(context: &mut InitContext) -> Self {
            let mut test_aircraft = Self {
                cpc: CabinPressureController::new(context),
                cabin_simulation: CabinPressureSimulation::new(context),
                outflow_valve: PressureValve::new_outflow_valve(),
                safety_valve: PressureValve::new_safety_valve(),
                press_overhead: TestPressurizationOverheadPanel::new(context),
                engine_1: TestEngine::new(Ratio::new::<percent>(0.)),
                engine_2: TestEngine::new(Ratio::new::<percent>(0.)),
                lgciu1: TestLgciu::new(false),
                lgciu2: TestLgciu::new(false),
            };
            test_aircraft.cpc.outflow_valve_open_amount = Ratio::new::<percent>(50.);
            test_aircraft.set_engine_n1(Ratio::new::<percent>(30.));
            test_aircraft
        }

        fn set_engine_n1(&mut self, n: Ratio) {
            self.engine_1.set_engine_n1(n);
            self.engine_2.set_engine_n1(n)
        }

        fn set_on_ground(&mut self, on_ground: bool) {
            self.lgciu1.set_on_ground(on_ground);
            self.lgciu2.set_on_ground(on_ground);
        }

        fn is_ground(&self) -> bool {
            matches!(
                self.cpc.pressure_schedule_manager,
                Some(PressureScheduleManager::Ground(_))
            )
        }

        fn is_takeoff(&self) -> bool {
            matches!(
                self.cpc.pressure_schedule_manager,
                Some(PressureScheduleManager::TakeOff(_))
            )
        }

        fn is_climb(&self) -> bool {
            matches!(
                self.cpc.pressure_schedule_manager,
                Some(PressureScheduleManager::ClimbInternal(_))
            )
        }

        fn is_cruise(&self) -> bool {
            matches!(
                self.cpc.pressure_schedule_manager,
                Some(PressureScheduleManager::Cruise(_))
            )
        }

        fn is_descent(&self) -> bool {
            matches!(
                self.cpc.pressure_schedule_manager,
                Some(PressureScheduleManager::DescentInternal(_))
            )
        }

        fn is_abort(&self) -> bool {
            matches!(
                self.cpc.pressure_schedule_manager,
                Some(PressureScheduleManager::Abort(_))
            )
        }
    }
    impl Aircraft for TestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            let lgciu_gears_compressed = self.lgciu1.left_and_right_gear_compressed(true)
                && self.lgciu2.left_and_right_gear_compressed(true);

            self.cpc.update(
                context,
                [&self.engine_1, &self.engine_2],
                lgciu_gears_compressed,
                &self.press_overhead,
                &self.cabin_simulation,
                &self.outflow_valve,
                &self.safety_valve,
            );
        }
    }
    impl SimulationElement for TestAircraft {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.cpc.accept(visitor);
            self.press_overhead.accept(visitor);

            visitor.visit(self);
        }
    }

    #[test]
    fn schedule_starts_on_ground() {
        let test_bed = SimulationTestBed::new(TestAircraft::new);

        assert!(test_bed.query(|a| a.is_ground()));
    }

    #[test]
    fn schedule_changes_from_ground_to_takeoff() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| a.set_engine_n1(Ratio::new::<percent>(95.)));

        test_bed.command(|a| a.set_on_ground(true));
        test_bed.set_indicated_airspeed(Velocity::new::<knot>(0.));

        test_bed.run();

        assert!(test_bed.query(|a| a.is_takeoff()));
    }

    #[test]
    fn schedule_changes_from_ground_to_climb() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| a.set_on_ground(true));
        test_bed.set_indicated_airspeed(Velocity::new::<knot>(101.));

        test_bed.run();

        test_bed.command(|a| a.set_on_ground(false));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_climb()));
    }

    #[test]
    fn schedule_changes_from_takeoff_to_climb() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

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
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

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
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.run();

        assert!(test_bed.query(|a| a.is_climb()));

        test_bed.set_indicated_altitude(Length::new::<foot>(7900.));
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-201.));
        test_bed.run_with_delta(Duration::from_secs(1));

        assert!(test_bed.query(|a| a.is_climb()));
    }

    #[test]
    fn schedule_changes_from_climb_to_abort() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

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
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.run();

        assert!(test_bed.query(|a| a.is_climb()));

        test_bed.set_indicated_altitude(Length::new::<foot>(7900.));
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(99.));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_climb()));
    }

    #[test]
    fn schedule_changes_from_climb_to_cruise() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

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
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

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
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

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
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

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
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

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
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

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
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

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
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

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
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

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
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

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
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

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
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

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
