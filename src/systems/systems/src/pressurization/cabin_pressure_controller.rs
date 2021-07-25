use crate::{shared::EngineCorrectedN1, simulation::UpdateContext};

use super::{PressureValve, PressureValveActuator, PressurizationOverheadPanel};

use std::time::Duration;
use uom::si::{
    f64::*,
    length::{foot, meter},
    pressure::{hectopascal, inch_of_mercury, pascal, psi},
    ratio::{percent, ratio},
    velocity::{foot_per_minute, foot_per_second, knot, meter_per_second},
    volume_rate::cubic_meter_per_second,
};

#[derive(Copy, Clone)]
pub(super) struct CabinPressureController {
    pressure_schedule_manager: PressureScheduleManager,
    exterior_pressure: Pressure,
    cabin_pressure: Pressure,
    cabin_alt: Length,
    departure_elev: Length,
    landing_elev: Length,
    cabin_target_vs: Velocity,
    cabin_vs: Velocity,
    outflow_valve_open_amount: Ratio,
    cabin_flow_in: VolumeRate,
    cabin_flow_out: VolumeRate,
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
    const AREA_LEAKAGE: f64 = 0.0003; // m2
    const CABIN_VOLUME: f64 = 400.; // m3
    const OFV_SIZE: f64 = 0.06; // m2
    const C: f64 = 1.; // Flow coefficient

    pub fn new() -> Self {
        Self {
            pressure_schedule_manager: PressureScheduleManager::new(),
            exterior_pressure: Pressure::new::<inch_of_mercury>(29.92),
            cabin_pressure: Pressure::new::<inch_of_mercury>(29.92),
            cabin_alt: Length::new::<meter>(0.),
            departure_elev: Length::new::<foot>(-5000.),
            landing_elev: Length::new::<meter>(0.),
            cabin_target_vs: Velocity::new::<meter_per_second>(0.),
            cabin_vs: Velocity::new::<meter_per_second>(0.),
            outflow_valve_open_amount: Ratio::new::<percent>(100.),
            cabin_flow_in: VolumeRate::new::<cubic_meter_per_second>(0.),
            cabin_flow_out: VolumeRate::new::<cubic_meter_per_second>(0.),
        }
    }

    #[allow(clippy::too_many_arguments)]
    pub fn update(
        &mut self,
        context: &UpdateContext,
        engines: [&impl EngineCorrectedN1; 2],
        landing_elevation: Length,
        sea_level_pressure: Pressure,
        destination_qnh: Pressure,
        packs_are_on: bool,
        _is_in_man_mode: bool,
    ) {
        self.pressure_schedule_manager = self.pressure_schedule_manager.update(context, engines);
        self.exterior_pressure = context.ambient_pressure();
        self.cabin_pressure = self.calculate_cabin_pressure(context);
        self.cabin_alt = self.calculate_cabin_altitude(sea_level_pressure, destination_qnh);
        self.departure_elev = self.calculate_departure_elev(context);
        self.landing_elev = landing_elevation;
        self.cabin_target_vs = self.calculate_cabin_vs(context);
        self.cabin_vs = self.set_cabin_vs(context);
        self.cabin_flow_in = self.calculate_cabin_flow_in(engines, packs_are_on, context);
        self.cabin_flow_out = self.calculate_cabin_flow_out();
    }

    fn calculate_cabin_pressure(&self, context: &UpdateContext) -> Pressure {
        if self.is_ground()
            && context.is_on_ground()
            && self.outflow_valve_open_amount > Ratio::new::<percent>(99.)
        {
            context.ambient_pressure()
        } else if self.outflow_valve_open_amount == Ratio::new::<percent>(0.) {
            let volume_ratio_change_per_second = (self.cabin_flow_in - self.cabin_flow_out)
                .get::<cubic_meter_per_second>()
                / CabinPressureController::CABIN_VOLUME;
            self.cabin_pressure
                + self.cabin_pressure * volume_ratio_change_per_second * context.delta_as_secs_f64()
        } else if self.is_ground() && !context.is_on_ground() {
            // Formula to simulate pressure start state if starting in flight
            let ambient_pressure: f64 = context.ambient_pressure().get::<hectopascal>();
            Pressure::new::<hectopascal>(
                -0.0002 * ambient_pressure.powf(2.) + 0.5463 * ambient_pressure + 658.85,
            )
        } else {
            // Convert cabin V/S to pressure/delta
            const KPA_FT: f64 = 0.0366; //KPa/ft ASL
            self.cabin_pressure
                + Pressure::new::<hectopascal>(
                    -self.cabin_vs.get::<foot_per_second>() * KPA_FT * context.delta_as_secs_f64(),
                )
        }
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
            } else {
                sea_level_pressure
            }
        } else if (self.cabin_altitude() - self.departure_elev)
            .get::<foot>()
            .abs()
            < 5000.
        {
            sea_level_pressure
        } else {
            Pressure::new::<hectopascal>(1013.25)
        };

        let pressure_ratio = (p / p_0).get::<ratio>();

        // ISA constants for calculating cabin altitude

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

    fn calculate_departure_elev(&self, context: &UpdateContext) -> Length {
        if self.is_ground() && self.departure_elev != context.indicated_altitude() {
            context.indicated_altitude()
        } else {
            self.departure_elev
        }
    }

    fn calculate_cabin_vs(&mut self, context: &UpdateContext) -> Velocity {
        const MAX_CLIMB_RATE: f64 = 750.;
        const MAX_CLIMB_RATE_IN_DESCENT: f64 = 500.;
        const MAX_DESCENT_RATE: f64 = -750.;
        const MAX_ABORT_DESCENT_RATE: f64 = -500.;
        const DEPRESS_RATE: f64 = 500.;

        if (self.is_ground() && self.outflow_valve_open_amount > Ratio::new::<percent>(99.))
            || self.outflow_valve_open_amount == Ratio::new::<percent>(0.)
        {
            Velocity::new::<foot_per_minute>(0.)
        } else {
            match self.pressure_schedule_manager {
                PressureScheduleManager::Ground(_) => {
                    Velocity::new::<foot_per_minute>(DEPRESS_RATE)
                }
                PressureScheduleManager::TakeOff(_) => {
                    if self.cabin_delta_p() < Pressure::new::<psi>(0.1) {
                        Velocity::new::<foot_per_minute>(-400.)
                    } else {
                        Velocity::new::<foot_per_minute>(0.)
                    }
                }
                PressureScheduleManager::ClimbInternal(_) => {
                    const DELTA_PRESSURE_LIMIT: f64 = 8.06; // PSI
                    const CABIN_ALTITUDE_LIMIT: f64 = 8050.; // Feet

                    // Formula based on empirical graphs and tables to simulate climb schedule as per the real aircraft
                    let target_vs = Velocity::new::<foot_per_minute>(
                        context.vertical_speed().get::<foot_per_minute>()
                            * (0.00000525 * context.indicated_altitude().get::<foot>() + 0.09),
                    );

                    if self.cabin_delta_p() >= Pressure::new::<psi>(DELTA_PRESSURE_LIMIT) {
                        Velocity::new::<foot_per_minute>(MAX_CLIMB_RATE)
                    } else if self.cabin_altitude() >= Length::new::<foot>(CABIN_ALTITUDE_LIMIT) {
                        Velocity::new::<foot_per_minute>(0.)
                    } else if target_vs <= Velocity::new::<foot_per_minute>(MAX_DESCENT_RATE) {
                        Velocity::new::<foot_per_minute>(MAX_DESCENT_RATE)
                    } else {
                        target_vs
                    }
                }
                PressureScheduleManager::Cruise(_) => Velocity::new::<foot_per_minute>(0.),
                PressureScheduleManager::DescentInternal(_) => {
                    let target_vs = Velocity::new::<foot_per_minute>(
                        self.get_int_diff_with_ldg_elev().get::<foot>()
                            * context.vertical_speed().get::<foot_per_minute>()
                            / self.get_ext_diff_with_ldg_elev(context).get::<foot>(),
                    );
                    if target_vs <= Velocity::new::<foot_per_minute>(MAX_DESCENT_RATE) {
                        Velocity::new::<foot_per_minute>(MAX_DESCENT_RATE)
                    } else if target_vs
                        >= Velocity::new::<foot_per_minute>(MAX_CLIMB_RATE_IN_DESCENT)
                    {
                        Velocity::new::<foot_per_minute>(MAX_CLIMB_RATE_IN_DESCENT)
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
                        Velocity::new::<foot_per_minute>(MAX_CLIMB_RATE_IN_DESCENT)
                    } else if self.cabin_altitude()
                        > self.departure_elev - Length::new::<foot>(TARGET_LANDING_ALT_DIFF)
                    {
                        Velocity::new::<foot_per_minute>(MAX_ABORT_DESCENT_RATE)
                    } else {
                        Velocity::new::<foot_per_minute>(0.)
                    }
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
        self.cabin_altitude() - self.landing_elev
    }

    fn set_cabin_vs(&self, context: &UpdateContext) -> Velocity {
        const INTERNAL_VS_RATE_CHANGE: f64 = 100.;

        let pressure_ratio = (self.exterior_pressure / self.cabin_pressure).get::<ratio>();
        let equilibrium_ratio = self.calculate_equilibrium_outflow_valve_open_amount();

        if (pressure_ratio - 1.) >= 0. && self.outflow_valve_open_amount >= equilibrium_ratio {
            let rate_of_change_for_delta = INTERNAL_VS_RATE_CHANGE * context.delta_as_secs_f64();
            if Velocity::new::<meter_per_second>(0.) > self.cabin_vs {
                self.cabin_vs
                    + Velocity::new::<foot_per_minute>(
                        rate_of_change_for_delta.min(self.cabin_vs.get::<foot_per_minute>()),
                    )
            } else if Velocity::new::<meter_per_second>(0.) < self.cabin_vs {
                self.cabin_vs
                    - Velocity::new::<foot_per_minute>(
                        rate_of_change_for_delta.min(self.cabin_vs.get::<foot_per_minute>()),
                    )
            } else {
                Velocity::new::<meter_per_second>(0.)
            }
        } else {
            let z = self.calculate_z();
            let vertical_speed = (self.outflow_valve_open_amount.get::<ratio>()
                * CabinPressureController::OFV_SIZE
                * CabinPressureController::C
                * (2.
                    * (CabinPressureController::GAMMA / (CabinPressureController::GAMMA - 1.))
                    * CabinPressureController::RHO
                    * self.cabin_pressure.get::<pascal>()
                    * z)
                    .sqrt()
                - self.cabin_flow_in.get::<cubic_meter_per_second>()
                + self.cabin_flow_out.get::<cubic_meter_per_second>())
                / ((CabinPressureController::RHO
                    * CabinPressureController::G
                    * CabinPressureController::CABIN_VOLUME)
                    / (CabinPressureController::R * CabinPressureController::T_0));
            Velocity::new::<meter_per_second>(vertical_speed)
        }
    }

    fn calculate_z(&self) -> f64 {
        let pressure_ratio = (self.exterior_pressure / self.cabin_pressure).get::<ratio>();

        let margin = 0.005;
        if (0.53..0.995).contains(&pressure_ratio) {
            pressure_ratio.powf(2. / CabinPressureController::GAMMA)
                - pressure_ratio
                    .powf((CabinPressureController::GAMMA + 1.) / CabinPressureController::GAMMA)
        } else if (pressure_ratio - 1.).abs() <= margin || (pressure_ratio - 1.) > 0. {
            0.001
        } else {
            0.256
        }
    }

    fn calculate_cabin_flow_in(
        &self,
        engines: [&impl EngineCorrectedN1; 2],
        packs_are_on: bool,
        context: &UpdateContext,
    ) -> VolumeRate {
        const INTERNAL_FLOW_RATE_CHANGE: f64 = 0.1;
        const FLOW_RATE_WITH_PACKS_ON: f64 = 0.6;
        if engines
            .iter()
            .any(|&x| x.corrected_n1() > Ratio::new::<percent>(15.))
            && packs_are_on
        {
            let rate_of_change_for_delta = INTERNAL_FLOW_RATE_CHANGE * context.delta_as_secs_f64();
            if VolumeRate::new::<cubic_meter_per_second>(FLOW_RATE_WITH_PACKS_ON)
                > self.cabin_flow_in
            {
                self.cabin_flow_in
                    + VolumeRate::new::<cubic_meter_per_second>(rate_of_change_for_delta.min(
                        FLOW_RATE_WITH_PACKS_ON
                            - self.cabin_flow_in.get::<cubic_meter_per_second>(),
                    ))
            } else {
                VolumeRate::new::<cubic_meter_per_second>(FLOW_RATE_WITH_PACKS_ON)
            }
        } else {
            VolumeRate::new::<cubic_meter_per_second>(0.)
        }
    }

    fn calculate_cabin_flow_out(&self) -> VolumeRate {
        let z = self.calculate_z();

        let w_leakage = VolumeRate::new::<cubic_meter_per_second>(
            CabinPressureController::C
                * CabinPressureController::AREA_LEAKAGE
                * (2.
                    * (CabinPressureController::GAMMA / (CabinPressureController::GAMMA - 1.))
                    * CabinPressureController::RHO
                    * self.cabin_pressure.get::<pascal>()
                    * z.abs())
                .sqrt(),
        );
        if z >= 0. {
            w_leakage
        } else {
            -w_leakage
        }
    }

    fn calculate_equilibrium_outflow_valve_open_amount(&self) -> Ratio {
        let z = self.calculate_z();

        // Ouflow valve open area for v/s = 0
        let ofv_area = (self.cabin_flow_in.get::<cubic_meter_per_second>()
            - self.cabin_flow_out.get::<cubic_meter_per_second>())
            / (CabinPressureController::C
                * (2.
                    * (CabinPressureController::GAMMA / (CabinPressureController::GAMMA - 1.))
                    * CabinPressureController::RHO
                    * self.cabin_pressure.get::<pascal>()
                    * z)
                    .sqrt());

        let ofv_ratio = Ratio::new::<ratio>(ofv_area / CabinPressureController::OFV_SIZE);
        if ofv_ratio > Ratio::new::<percent>(100.) {
            Ratio::new::<percent>(100.)
        } else {
            ofv_ratio
        }
    }

    pub fn update_outflow_valve_state(&mut self, outflow_valve: &PressureValve) {
        self.outflow_valve_open_amount = outflow_valve.open_amount();
    }

    pub fn cabin_altitude(&self) -> Length {
        self.cabin_alt
    }

    pub fn cabin_vs(&self) -> Velocity {
        self.cabin_vs
    }

    pub fn cabin_delta_p(&self) -> Pressure {
        self.cabin_pressure - self.exterior_pressure
    }

    pub fn should_switch_cpc(&self) -> bool {
        self.pressure_schedule_manager.should_switch_cpc()
    }

    pub fn reset_cpc_switch(&mut self) {
        self.pressure_schedule_manager.reset_cpc_switch();
    }

    fn is_ground(&self) -> bool {
        matches!(
            self.pressure_schedule_manager,
            PressureScheduleManager::Ground(_)
        )
    }

    #[cfg(test)]
    pub fn cabin_pressure(&self) -> Pressure {
        self.cabin_pressure
    }
}

impl PressureValveActuator for CabinPressureController {
    fn target_valve_position(&self, press_overhead: &PressurizationOverheadPanel) -> Ratio {
        // Calculation extracted from:
        // F. Y. Kurokawa, C. Regina de Andrade and E. L. Zaparoli
        // DETERMINATION OF THE OUTFLOW VALVE OPENING AREA OF THE AIRCRAFT CABIN PRESSURIZATION SYSTEM
        // 18th International Congress of Mechanical Engineering
        // November 6-11, 2005, Ouro Preto, MG

        let z = self.calculate_z();

        // Ouflow valve target open area
        let ofv_area = (self.cabin_flow_in.get::<cubic_meter_per_second>()
            - self.cabin_flow_out.get::<cubic_meter_per_second>()
            + ((CabinPressureController::RHO
                * CabinPressureController::G
                * CabinPressureController::CABIN_VOLUME)
                / (CabinPressureController::R * CabinPressureController::T_0)
                * self.cabin_target_vs.get::<meter_per_second>()))
            / (CabinPressureController::C
                * (2.
                    * (CabinPressureController::GAMMA / (CabinPressureController::GAMMA - 1.))
                    * CabinPressureController::RHO
                    * self.cabin_pressure.get::<pascal>()
                    * z)
                    .sqrt());

        let ofv_open_ratio = Ratio::new::<ratio>(ofv_area / CabinPressureController::OFV_SIZE);

        if press_overhead.is_in_man_mode() {
            self.outflow_valve_open_amount
        } else if (ofv_open_ratio <= Ratio::new::<percent>(0.)) || press_overhead.ditching.is_on() {
            Ratio::new::<percent>(0.)
        } else if ofv_open_ratio >= Ratio::new::<percent>(100.)
            || (self.is_ground() && self.pressure_schedule_manager.should_open_outflow_valve())
        {
            Ratio::new::<percent>(100.)
        } else {
            ofv_open_ratio
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

    fn update(mut self, context: &UpdateContext, engines: [&impl EngineCorrectedN1; 2]) -> Self {
        self = match self {
            PressureScheduleManager::Ground(val) => val.step(context, engines),
            PressureScheduleManager::TakeOff(val) => val.step(context, engines),
            PressureScheduleManager::ClimbInternal(val) => val.step(context),
            PressureScheduleManager::Cruise(val) => val.step(context),
            PressureScheduleManager::DescentInternal(val) => val.step(context),
            PressureScheduleManager::Abort(val) => val.step(context),
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
    vertical_speed: Velocity, // Placeholder
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

    fn new<T, U: Fn() -> S>(from: PressureSchedule<T>, ctor_fn: U) -> Self {
        Self {
            vertical_speed: from.vertical_speed,
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
            vertical_speed: Velocity::new::<foot_per_minute>(0.),
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
    ) -> PressureScheduleManager {
        if engines
            .iter()
            .all(|&x| x.corrected_n1() > Ratio::new::<percent>(70.))
            && context.is_on_ground()
        {
            PressureScheduleManager::TakeOff(self.into())
        } else if !context.is_on_ground()
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
    ) -> PressureScheduleManager {
        if engines
            .iter()
            .all(|&x| x.corrected_n1() < Ratio::new::<percent>(70.))
            && context.is_on_ground()
        {
            PressureScheduleManager::Ground(self.into())
        } else if !context.is_on_ground()
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
    ) -> PressureScheduleManager {
        const DURATION_UNTIL_CLIMB: u64 = 60;

        if context.vertical_speed() > Velocity::new::<foot_per_minute>(250.) {
            if self.timer > Duration::from_secs(DURATION_UNTIL_CLIMB) {
                PressureScheduleManager::ClimbInternal(self.into())
            } else {
                PressureScheduleManager::DescentInternal(self.increase_timer(context))
            }
        } else if context.is_on_ground() && context.indicated_airspeed().get::<knot>() < 100. {
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
    fn step(self: PressureSchedule<Abort>, context: &UpdateContext) -> PressureScheduleManager {
        const DURATION_UNTIL_CLIMB: u64 = 60;

        if context.is_on_ground() && context.indicated_airspeed().get::<knot>() < 100. {
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
        pressure::{hectopascal, psi},
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
    }
    impl TestAircraft {
        fn new() -> Self {
            let mut test_aircraft = Self {
                cpc: CabinPressureController::new(),
                outflow_valve: PressureValve::new(),
                press_overhead: PressurizationOverheadPanel::new(),
                engine_1: TestEngine::new(Ratio::new::<percent>(0.)),
                engine_2: TestEngine::new(Ratio::new::<percent>(0.)),
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
    }
    impl Aircraft for TestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.cpc.update(
                context,
                [&self.engine_1, &self.engine_2],
                Length::new::<meter>(0.),
                Pressure::new::<hectopascal>(1013.),
                Pressure::new::<hectopascal>(1013.),
                true,
                false,
            );
            self.outflow_valve
                .update(context, &self.cpc, &self.press_overhead);
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
    fn aircraft_vs_starts_at_0() {
        let test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        assert_eq!(
            test_bed.query(|a| a.cpc.cabin_vs()),
            Velocity::new::<foot_per_minute>(0.)
        );
    }

    #[test]
    fn schedule_changes_from_ground_to_takeoff() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.command(|a| a.set_engine_n1(Ratio::new::<percent>(95.)));

        test_bed.set_on_ground(true);
        test_bed.set_indicated_airspeed(Velocity::new::<knot>(0.));

        test_bed.run();

        assert!(test_bed.query(|a| a.is_takeoff()));
    }

    #[test]
    fn cabin_vs_changes_to_takeoff() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.command(|a| a.set_engine_n1(Ratio::new::<percent>(95.)));

        test_bed.set_on_ground(true);
        test_bed.set_indicated_airspeed(Velocity::new::<knot>(0.));

        test_bed.run();
        assert!(test_bed.query(|a| a.is_takeoff()));
        test_bed.run_with_delta(Duration::from_secs(10));
        test_bed.run();

        assert!(
            (test_bed.query(|a| a.cpc.cabin_vs()) - Velocity::new::<foot_per_minute>(-400.)).abs()
                < Velocity::new::<foot_per_minute>(10.)
        );
    }

    #[test]
    fn cabin_delta_p_does_not_exceed_0_1_during_takeoff() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.command(|a| a.set_engine_n1(Ratio::new::<percent>(95.)));

        test_bed.set_on_ground(true);
        test_bed.set_indicated_airspeed(Velocity::new::<knot>(0.));
        test_bed.set_ambient_pressure(Pressure::new::<hectopascal>(1005.));
        test_bed.run_with_delta(Duration::from_secs(10));

        assert!(test_bed.query(|a| a.cpc.cabin_delta_p()) > Pressure::new::<psi>(0.1));
        assert!(test_bed.query(|a| a.cpc.cabin_vs()).abs() < Velocity::new::<foot_per_minute>(10.));
    }

    #[test]
    fn schedule_changes_from_ground_to_climb() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.set_on_ground(true);
        test_bed.set_indicated_airspeed(Velocity::new::<knot>(101.));

        test_bed.run();

        test_bed.set_on_ground(false);
        test_bed.run();

        assert!(test_bed.query(|a| a.is_climb()));
    }

    #[test]
    fn cabin_vs_changes_to_climb() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(1000.));

        test_bed.run();
        test_bed.run_with_delta(Duration::from_secs(10));
        assert!(test_bed.query(|a| a.cpc.cabin_vs()) > Velocity::new::<foot_per_minute>(0.));
    }

    #[test]
    fn cabin_vs_increases_with_altitude() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());
        test_bed.run_with_delta(Duration::from_secs(10));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(2000.));
        test_bed.run_with_delta(Duration::from_secs(10));
        let first_vs = test_bed.query(|a| a.cpc.cabin_vs());

        test_bed.set_indicated_altitude(Length::new::<foot>(20000.));
        test_bed.set_ambient_pressure(Pressure::new::<hectopascal>(465.67));
        test_bed.run_with_delta(Duration::from_secs(10));

        test_bed.set_indicated_altitude(Length::new::<foot>(30000.));
        test_bed.set_ambient_pressure(Pressure::new::<hectopascal>(300.92));
        test_bed.run_with_delta(Duration::from_secs(10));

        test_bed.set_indicated_altitude(Length::new::<foot>(39000.));
        test_bed.set_ambient_pressure(Pressure::new::<hectopascal>(196.4));
        test_bed.run_with_delta(Duration::from_secs(10));

        assert!(test_bed.query(|a| a.cpc.cabin_vs()) > first_vs);
    }

    #[test]
    fn cabin_delta_p_does_not_exceed_8_06_psi_in_climb() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.run();

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(1000.));

        for i in 1..39 {
            test_bed.run_with_delta(Duration::from_secs(60));
            test_bed.set_indicated_altitude(Length::new::<foot>((i * 1000) as f64));
        }
        test_bed.set_ambient_pressure(Pressure::new::<hectopascal>(196.41));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(0.));
        test_bed.run_with_delta(Duration::from_secs(60));

        assert!(test_bed.query(|a| a.cpc.cabin_delta_p()) < Pressure::new::<psi>(8.06));
    }

    #[test]
    fn schedule_changes_from_takeoff_to_climb() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.command(|a| a.set_engine_n1(Ratio::new::<percent>(95.)));

        test_bed.set_on_ground(true);
        test_bed.set_indicated_airspeed(Velocity::new::<knot>(0.));
        test_bed.run();

        test_bed.set_on_ground(false);
        test_bed.set_indicated_airspeed(Velocity::new::<knot>(101.));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_climb()));
    }

    #[test]
    fn schedule_changes_from_takeoff_to_ground() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.command(|a| a.set_engine_n1(Ratio::new::<percent>(95.)));
        test_bed.set_on_ground(true);
        test_bed.set_indicated_airspeed(Velocity::new::<knot>(0.));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_takeoff()));

        test_bed.command(|a| a.set_engine_n1(Ratio::new::<percent>(50.)));
        test_bed.set_on_ground(true);
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
    fn cabin_vs_changes_to_cruise() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.run();

        assert!(test_bed.query(|a| a.is_climb()));

        test_bed.set_indicated_altitude(Length::new::<foot>(7900.));
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(99.));
        test_bed.run_with_delta(Duration::from_secs(31));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_cruise()));
        assert_eq!(
            test_bed.query(|a| a.cpc.cabin_vs()),
            Velocity::new::<foot_per_minute>(0.)
        );
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
    fn cabin_vs_changes_to_descent() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.run();
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(1000.));
        test_bed.run();

        for i in 1..39 {
            test_bed.run_with_delta(Duration::from_secs(60));
            test_bed.set_indicated_altitude(Length::new::<foot>((i * 1000) as f64));
        }
        test_bed.set_ambient_pressure(Pressure::new::<hectopascal>(196.41));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(0.));
        test_bed.run_with_delta(Duration::from_secs(60));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-260.));
        test_bed.run_with_delta(Duration::from_secs(31));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_descent()));

        assert!(test_bed.query(|a| a.cpc.cabin_vs()) > Velocity::new::<foot_per_minute>(-260.));
        assert!(test_bed.query(|a| a.cpc.cabin_vs()) < Velocity::new::<foot_per_minute>(0.));
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
        test_bed.set_on_ground(true);
        test_bed.run();

        assert!(test_bed.query(|a| a.is_ground()));
    }

    #[test]
    fn cabin_vs_changes_to_ground() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.run();
        test_bed.run_with_delta(Duration::from_secs(31));
        test_bed.run();

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-260.));
        test_bed.run_with_delta(Duration::from_secs(31));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_descent()));

        test_bed.set_indicated_airspeed(Velocity::new::<knot>(99.));
        test_bed.set_on_ground(true);
        test_bed.run();

        assert!(test_bed.query(|a| a.is_ground()));

        test_bed.run();
        assert!(test_bed.query(|a| a.cpc.cabin_vs()) > Velocity::new::<foot_per_minute>(-1.));
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
        test_bed.set_on_ground(true);
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
