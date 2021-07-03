use crate::simulation::UpdateContext;

use super::PressureValveActuator;

use std::time::Duration;
use uom::si::{
    f64::*,
    length::{foot, meter},
    pressure::{hectopascal, inch_of_mercury, psi},
    ratio::{percent, ratio},
    velocity::{foot_per_minute, foot_per_second, knot, meter_per_second},
};

#[derive(Copy, Clone)]
pub struct CabinPressureController {
    pressure_schedule_manager: PressureScheduleManager,
    exterior_pressure: Pressure,
    cabin_pressure: Pressure,
    cabin_alt: Length,
    departure_elev: Length,
    landing_elev: Length,
    cabin_target_vs: Velocity,
    cabin_vs: Velocity,
}

impl CabinPressureController {
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
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        eng_1_n1: Ratio,
        eng_2_n1: Ratio,
        landing_elevation: Length,
        sea_level_pressure: Pressure,
        destination_qnh: Pressure,
    ) {
        self.pressure_schedule_manager
            .update(context, eng_1_n1, eng_2_n1);
        self.exterior_pressure = context.ambient_pressure();
        self.cabin_pressure = self.calculate_cabin_pressure(context);
        self.cabin_alt = self.calculate_cabin_altitude(sea_level_pressure, destination_qnh);
        self.departure_elev = self.calculate_departure_elev(context);
        self.landing_elev = landing_elevation;
        self.cabin_target_vs = self.calculate_cabin_vs(context); //Pre-smooth function
        self.cabin_vs = self.set_cabin_vs(context); //Smooth function
    }

    fn calculate_cabin_pressure(&self, context: &UpdateContext) -> Pressure {
        if self.pressure_schedule() == PressureSchedule::Ground && context.is_on_ground() {
            context.ambient_pressure()
        } else if self.pressure_schedule() == PressureSchedule::Ground && !context.is_on_ground() {
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
        let p = self.cabin_pressure();

        // Based on local QNH when below 5000ft from departure or arrival airport, ISA when above
        let p_0 = if self.pressure_schedule() == PressureSchedule::DescentInternal
            && (self.cabin_altitude() - self.landing_elevation())
                .get::<foot>()
                .abs()
                < 5000.
        {
            if destination_qnh > Pressure::new::<hectopascal>(0.) {
                destination_qnh
            } else {
                sea_level_pressure
            }
        } else if (self.cabin_altitude() - self.departure_elevation())
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
        const T_0: f64 = 288.2; // ISA standard temperature - K
        const R: f64 = 287.058; // Specific gas constant for air - m2/s2/K
        const L: f64 = -0.00651; // Adiabatic lapse rate K/m
        const G: f64 = 9.80665; // Gravity m/s2

        // Hydrostatic equation with linear temp changes and constant R, g
        let z: f64 = ((T_0 / pressure_ratio.powf((L * R) / G)) - T_0) / L;
        Length::new::<meter>(z)
    }

    fn calculate_departure_elev(&self, context: &UpdateContext) -> Length {
        if self.pressure_schedule() == PressureSchedule::Ground
            && self.departure_elev != context.indicated_altitude()
        {
            context.indicated_altitude()
        } else {
            self.departure_elev
        }
    }

    fn calculate_cabin_vs(&mut self, context: &UpdateContext) -> Velocity {
        match self.pressure_schedule() {
            PressureSchedule::Ground => Velocity::new::<foot_per_minute>(0.),
            PressureSchedule::TakeOff => {
                if self.cabin_delta_p() < Pressure::new::<psi>(0.1) {
                    Velocity::new::<foot_per_minute>(-400.)
                } else {
                    Velocity::new::<foot_per_minute>(0.)
                }
            }
            PressureSchedule::ClimbInternal => {
                if self.cabin_delta_p() >= Pressure::new::<psi>(8.06) {
                    Velocity::new::<foot_per_minute>(750.)
                } else if self.cabin_altitude() >= Length::new::<foot>(8050.) {
                    Velocity::new::<foot_per_minute>(0.)
                } else {
                    // Formula based on existing graphs and tables to simulate climb schedule
                    Velocity::new::<foot_per_minute>(
                        context.vertical_speed().get::<foot_per_minute>()
                            * (0.00000525 * context.indicated_altitude().get::<foot>() + 0.09),
                    )
                }
            }
            PressureSchedule::Cruise => Velocity::new::<foot_per_minute>(0.),
            PressureSchedule::DescentInternal => {
                let target_vs = Velocity::new::<foot_per_minute>(
                    self.get_int_diff_with_ldg_elev().get::<foot>()
                        * context.vertical_speed().get::<foot_per_minute>()
                        / self.get_ext_diff_with_ldg_elev(context).get::<foot>(),
                );
                if target_vs <= Velocity::new::<foot_per_minute>(-750.) {
                    Velocity::new::<foot_per_minute>(-750.)
                } else if target_vs >= Velocity::new::<foot_per_minute>(500.) {
                    Velocity::new::<foot_per_minute>(500.)
                } else {
                    target_vs
                }
            }
            PressureSchedule::Abort => {
                if self.cabin_altitude() < self.departure_elevation() - Length::new::<foot>(187.818)
                {
                    Velocity::new::<foot_per_minute>(500.)
                } else if self.cabin_altitude()
                    > self.departure_elevation() - Length::new::<foot>(187.818)
                {
                    Velocity::new::<foot_per_minute>(-500.)
                } else {
                    Velocity::new::<foot_per_minute>(0.)
                }
            }
        }
    }

    fn get_ext_diff_with_ldg_elev(&self, context: &UpdateContext) -> Length {
        context.indicated_altitude() - self.landing_elevation() - Length::new::<foot>(187.818)
        // Equivalent to 0.1 PSI at sea level
    }

    fn get_int_diff_with_ldg_elev(&self) -> Length {
        self.cabin_altitude() - self.landing_elevation()
    }

    fn set_cabin_vs(&self, context: &UpdateContext) -> Velocity {
        const INTERNAL_VS_RATE_CHANGE: f64 = 100.; // Rate of change of 100fpm per second

        let rate_of_change_for_delta = INTERNAL_VS_RATE_CHANGE * context.delta_as_secs_f64();
        if self.cabin_target_vs > self.cabin_vs() {
            self.cabin_vs
                + Velocity::new::<foot_per_minute>(rate_of_change_for_delta.min(
                    self.cabin_target_vs.get::<foot_per_minute>()
                        - self.cabin_vs().get::<foot_per_minute>(),
                ))
        } else if self.cabin_target_vs < self.cabin_vs() {
            self.cabin_vs
                - Velocity::new::<foot_per_minute>(rate_of_change_for_delta.min(
                    self.cabin_vs().get::<foot_per_minute>()
                        - self.cabin_target_vs.get::<foot_per_minute>(),
                ))
        } else {
            self.cabin_target_vs
        }
    }

    pub fn cabin_pressure(&self) -> Pressure {
        self.cabin_pressure
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

    pub fn pressure_schedule(&self) -> PressureSchedule {
        self.pressure_schedule_manager.pressure_schedule()
    }

    pub fn departure_elevation(&self) -> Length {
        self.departure_elev
    }

    pub fn landing_elevation(&self) -> Length {
        self.landing_elev
    }

    pub fn should_switch_cpc(&self) -> bool {
        self.pressure_schedule_manager.should_switch_cpc()
    }

    pub fn reset_cpc_switch(&mut self) {
        self.pressure_schedule_manager.reset_cpc_switch();
    }
}

impl PressureValveActuator for CabinPressureController {
    fn should_open_pressure_valve(&self) -> bool {
        self.cabin_vs < Velocity::new::<meter_per_second>(0.)
            || self.pressure_schedule() == PressureSchedule::Ground
    }

    fn should_close_pressure_valve(&self) -> bool {
        self.cabin_vs > Velocity::new::<meter_per_second>(0.)
    }

    fn target_valve_position(&self) -> Ratio {
        let pressure_ratio: f64 = self.exterior_pressure.get::<hectopascal>()
            / (self.cabin_pressure().get::<hectopascal>() * 2.);
        let vs_ratio: f64 = self.cabin_target_vs.get::<foot_per_minute>() / 2000. * pressure_ratio;
        if (pressure_ratio + vs_ratio) > 1.
            || (self.pressure_schedule() == PressureSchedule::Ground
                && self.pressure_schedule_manager.should_open_outflow_valve())
        {
            Ratio::new::<percent>(100.)
        } else if (pressure_ratio + vs_ratio) < 0. {
            Ratio::new::<percent>(0.)
        } else {
            Ratio::new::<percent>((pressure_ratio + vs_ratio) * 100.)
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum PressureSchedule {
    Ground,
    TakeOff,
    ClimbInternal,
    Cruise,
    DescentInternal,
    Abort,
}

#[derive(Copy, Clone)]
pub struct PressureScheduleManager {
    pressure_schedule: PressureSchedule,
    timer: Duration,
    cpc_switch_reset: bool,
}

impl PressureScheduleManager {
    pub fn new() -> Self {
        Self {
            pressure_schedule: PressureSchedule::Ground,
            timer: Duration::from_secs_f64(100.),
            cpc_switch_reset: false,
        }
    }

    pub fn update(&mut self, context: &UpdateContext, eng_1_n1: Ratio, eng_2_n1: Ratio) {
        match self.pressure_schedule {
            PressureSchedule::Ground => self.update_from_ground(context, eng_1_n1, eng_2_n1),
            PressureSchedule::TakeOff => self.update_from_takeoff(context, eng_1_n1, eng_2_n1),
            PressureSchedule::ClimbInternal => self.update_from_climb(context),
            PressureSchedule::Cruise => self.update_from_cruise(context),
            PressureSchedule::DescentInternal => self.update_from_descent(context),
            PressureSchedule::Abort => self.update_from_abort(context),
        }
    }

    pub fn pressure_schedule(&self) -> PressureSchedule {
        self.pressure_schedule
    }

    fn update_from_ground(&mut self, context: &UpdateContext, eng_1_n1: Ratio, eng_2_n1: Ratio) {
        if eng_1_n1 > Ratio::new::<percent>(70.)
            && eng_2_n1 > Ratio::new::<percent>(70.)
            && context.is_on_ground()
        {
            self.pressure_schedule = PressureSchedule::TakeOff;
            self.timer = Duration::from_secs_f64(0.);
            self.cpc_switch_reset = true;
        } else if !context.is_on_ground()
            && context.indicated_airspeed().get::<knot>() > 100.
            && context.ambient_pressure().get::<hectopascal>() > 0.
        {
            self.pressure_schedule = PressureSchedule::ClimbInternal;
            self.timer = Duration::from_secs_f64(0.);
            self.cpc_switch_reset = true;
        } else if self.timer < (Duration::from_secs_f64(100.)) {
            self.timer += context.delta();
        }
    }

    fn update_from_takeoff(&mut self, context: &UpdateContext, eng_1_n1: Ratio, eng_2_n1: Ratio) {
        if eng_1_n1 < Ratio::new::<percent>(70.)
            && eng_2_n1 < Ratio::new::<percent>(70.)
            && context.is_on_ground()
        {
            self.pressure_schedule = PressureSchedule::Ground;
        } else if !context.is_on_ground()
            && context.indicated_airspeed().get::<knot>() > 100.
            && context.ambient_pressure().get::<hectopascal>() > 0.
        {
            self.pressure_schedule = PressureSchedule::ClimbInternal;
        }
    }

    fn update_from_climb(&mut self, context: &UpdateContext) {
        if context.indicated_altitude() < Length::new::<foot>(8000.)
            && context.vertical_speed() < Velocity::new::<foot_per_minute>(-200.)
        {
            self.timer += context.delta();
            if self.timer > Duration::from_secs_f64(30.) {
                self.pressure_schedule = PressureSchedule::Abort;
                self.timer = Duration::from_secs_f64(0.);
            }
        } else if context.vertical_speed() < Velocity::new::<foot_per_minute>(100.)
            && context.vertical_speed() > Velocity::new::<foot_per_minute>(-100.)
        {
            self.timer += context.delta();
            if self.timer > Duration::from_secs_f64(30.) {
                self.pressure_schedule = PressureSchedule::Cruise;
                self.timer = Duration::from_secs_f64(0.);
            }
        } else if context.vertical_speed() < Velocity::new::<foot_per_minute>(-250.) {
            self.timer += context.delta();
            if self.timer > Duration::from_secs_f64(60.) {
                self.pressure_schedule = PressureSchedule::DescentInternal;
                self.timer = Duration::from_secs_f64(0.);
            }
        } else if self.timer != Duration::from_secs_f64(0.) {
            self.timer = Duration::from_secs_f64(0.);
        }
    }

    fn update_from_cruise(&mut self, context: &UpdateContext) {
        if context.vertical_speed() > Velocity::new::<foot_per_minute>(250.) {
            self.timer += context.delta();
            if self.timer > Duration::from_secs_f64(60.) {
                self.pressure_schedule = PressureSchedule::ClimbInternal;
                self.timer = Duration::from_secs_f64(0.);
            }
        } else if context.vertical_speed() < Velocity::new::<foot_per_minute>(-250.) {
            self.timer += context.delta();
            if self.timer > Duration::from_secs_f64(30.) {
                self.pressure_schedule = PressureSchedule::DescentInternal;
                self.timer = Duration::from_secs_f64(0.);
            }
        } else if self.timer != Duration::from_secs_f64(0.) {
            self.timer = Duration::from_secs_f64(0.);
        }
    }

    fn update_from_descent(&mut self, context: &UpdateContext) {
        if context.vertical_speed() > Velocity::new::<foot_per_minute>(250.) {
            self.timer += context.delta();
            if self.timer > Duration::from_secs_f64(60.) {
                self.pressure_schedule = PressureSchedule::ClimbInternal;
                self.timer = Duration::from_secs_f64(0.);
            }
        } else if context.is_on_ground() && context.indicated_airspeed().get::<knot>() < 100. {
            self.pressure_schedule = PressureSchedule::Ground;
            self.timer = Duration::from_secs_f64(0.);
        } else if self.timer != Duration::from_secs_f64(0.) {
            self.timer = Duration::from_secs_f64(0.);
        }
    }

    fn update_from_abort(&mut self, context: &UpdateContext) {
        if context.is_on_ground() && context.indicated_airspeed().get::<knot>() < 100. {
            self.pressure_schedule = PressureSchedule::Ground;
            self.timer = Duration::from_secs_f64(0.);
        } else if context.vertical_speed() > Velocity::new::<foot_per_minute>(30.) {
            self.timer += context.delta();
            if self.timer > Duration::from_secs_f64(60.) {
                self.pressure_schedule = PressureSchedule::ClimbInternal;
                self.timer = Duration::from_secs_f64(0.);
            }
        } else if self.timer != Duration::from_secs_f64(0.) {
            self.timer = Duration::from_secs_f64(0.);
        }
    }

    fn should_open_outflow_valve(&self) -> bool {
        self.pressure_schedule == PressureSchedule::Ground
            && self.timer > Duration::from_secs_f64(55.)
    }

    fn reset_cpc_switch(&mut self) {
        if self.should_switch_cpc() {
            self.cpc_switch_reset = false;
        }
    }

    fn should_switch_cpc(&self) -> bool {
        self.pressure_schedule == PressureSchedule::Ground
            && self.timer > Duration::from_secs_f64(70.)
            && self.cpc_switch_reset
    }
}
