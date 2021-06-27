use crate::simulation::UpdateContext;

use super::{
    AircraftInputsPressurization, PressureValve, PressureValveActuator, PressurizationOverheadPanel,
};

use std::time::Duration;
use uom::si::{
    f64::*,
    length::{foot, meter},
    pressure::{hectopascal, inch_of_mercury, psi},
    ratio::percent,
    velocity::{foot_per_minute, knot, meter_per_second},
};

pub struct CabinPressureController {
    pressure_schedule_manager: PressureScheduleManager,
    outflow_valve_open_amount: Ratio,
    exterior_pressure: Pressure,
    cabin_pressure: Pressure,
    last_cabin_pressure: Pressure,
    departure_elev: Length,
    landing_elev: Length,
    is_ldg_elev_auto: bool,
    cabin_alt: Length,
    aircraft_vs: Velocity,
    cabin_target_vs: Velocity,
    cabin_vs: Velocity,
    is_standby: bool,
    // is_faulted: bool,
}

impl CabinPressureController {
    pub fn new() -> Self {
        Self {
            pressure_schedule_manager: PressureScheduleManager::new(),
            outflow_valve_open_amount: Ratio::new::<percent>(100.),
            exterior_pressure: Pressure::new::<inch_of_mercury>(29.92),
            cabin_pressure: Pressure::new::<inch_of_mercury>(29.92),
            cabin_alt: Length::new::<meter>(0.),
            aircraft_vs: Velocity::new::<meter_per_second>(0.),
            cabin_target_vs: Velocity::new::<meter_per_second>(0.),
            cabin_vs: Velocity::new::<meter_per_second>(0.),
            last_cabin_pressure: Pressure::new::<inch_of_mercury>(29.92),
            departure_elev: Length::new::<foot>(-5000.),
            landing_elev: Length::new::<meter>(0.),
            is_ldg_elev_auto: true,
            is_standby: true,
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        outflow_valve: &PressureValve,
        overhead: &PressurizationOverheadPanel,
        aircraft_inputs: &AircraftInputsPressurization,
    ) {
        self.pressure_schedule_manager.update(
            context,
            aircraft_inputs.eng_1_n1(),
            aircraft_inputs.eng_2_n1(),
        );
        self.outflow_valve_open_amount = outflow_valve.open_amount();
        self.exterior_pressure = context.ambient_pressure();
        self.aircraft_vs = context.vertical_speed();
        self.last_cabin_pressure = self.cabin_pressure;
        self.update_cabin_pressure(context);
        self.update_cabin_altitude(
            aircraft_inputs.sea_level_pressure(),
            aircraft_inputs.destination_qnh(),
        );
        self.update_cabin_vs(context); //Pre-smooth function
        self.set_cabin_vs(context); //Smooth function
        self.update_departure_elev(context);
        self.update_landing_elev(aircraft_inputs.landing_elev());
        self.is_ldg_elev_auto = !overhead.mode_is_man();
        self.update_active_system(context);
    }

    fn update_cabin_pressure(&mut self, context: &UpdateContext) {
        // Convert cabin V/S to pressure/delta
        const KPA_FT: f64 = 0.0366; //ASL

        let cab_press_var =
            -self.cabin_vs.get::<foot_per_minute>() * KPA_FT / 60. * context.delta().as_secs_f64();
        self.cabin_pressure =
            self.last_cabin_pressure + Pressure::new::<hectopascal>(cab_press_var);
    }

    fn update_cabin_altitude(&mut self, sea_level_pressure: Pressure, destination_qnh: Pressure) {
        // ISA constants for calculating cabin altitude
        const T_0: f64 = 288.2; // K
        const R: f64 = 287.058; // m2/s2/K
        const L: f64 = -0.00651; // K/m
        const G: f64 = 9.80665; // m/s2

        let p_0: f64;
        let p: f64 = self.cabin_pressure().get::<hectopascal>();

        // Based on local QNH when below 5000ft from departure or arrival airport, ISA when above
        if self.pressure_schedule() == PressureSchedule::DescentInternal
            && (self.cabin_altitude() - self.landing_elevation())
                .get::<foot>()
                .abs()
                < 5000.
        {
            if destination_qnh > Pressure::new::<hectopascal>(0.) {
                p_0 = destination_qnh.get::<hectopascal>();
            } else {
                p_0 = sea_level_pressure.get::<hectopascal>();
            }
        } else if (self.cabin_altitude() - self.departure_elevation())
            .get::<foot>()
            .abs()
            < 5000.
        {
            p_0 = sea_level_pressure.get::<hectopascal>();
        } else {
            p_0 = 1013.25;
        }

        // Vars
        let pressure_ratio: f64 = p / p_0;

        // Hydrostatic equation with linear temp changes and constant R, g
        let z: f64 = ((T_0 / pressure_ratio.powf((L * R) / G)) - T_0) / L;
        self.cabin_alt = Length::new::<meter>(z);
    }

    fn update_cabin_vs(&mut self, context: &UpdateContext) {
        match self.pressure_schedule() {
            PressureSchedule::Ground => {
                if context.is_on_ground() {
                    self.cabin_pressure = self.exterior_pressure;
                } else {
                    // Formula to simulate pressure start state if starting in flight
                    let ambient_pressure: f64 = context.ambient_pressure().get::<hectopascal>();
                    self.cabin_pressure = Pressure::new::<hectopascal>(
                        -0.0002 * ambient_pressure.powf(2.) + 0.5463 * ambient_pressure + 658.85,
                    );
                }
                self.cabin_target_vs = Velocity::new::<foot_per_minute>(0.);
            }
            PressureSchedule::TakeOff => {
                if self.cabin_delta_p() < Pressure::new::<psi>(0.1) {
                    self.cabin_target_vs = Velocity::new::<foot_per_minute>(-400.)
                } else {
                    self.cabin_target_vs = Velocity::new::<foot_per_minute>(0.)
                }
            }
            PressureSchedule::ClimbInternal => {
                if self.cabin_delta_p() >= Pressure::new::<psi>(8.06) {
                    self.cabin_target_vs = Velocity::new::<foot_per_minute>(750.);
                } else if self.cabin_altitude() >= Length::new::<foot>(8050.) {
                    self.cabin_target_vs = Velocity::new::<foot_per_minute>(0.);
                } else if self.cabin_delta_p() < Pressure::new::<psi>(8.06) {
                    // Formula based on existing graphs and tables to simulate climb schedule
                    self.cabin_target_vs = Velocity::new::<foot_per_minute>(
                        self.aircraft_vs.get::<foot_per_minute>()
                            * (0.00000525 * context.indicated_altitude().get::<foot>() + 0.09),
                    );
                }
            }
            PressureSchedule::Cruise => {
                self.cabin_target_vs = Velocity::new::<foot_per_minute>(0.);
            }
            PressureSchedule::DescentInternal => {
                let target_vs = Velocity::new::<foot_per_minute>(
                    self.get_int_diff_with_ldg_elev().get::<foot>()
                        * self.aircraft_vs.get::<foot_per_minute>()
                        / self.get_ext_diff_with_ldg_elev(context).get::<foot>(),
                );
                if target_vs <= Velocity::new::<foot_per_minute>(-750.) {
                    self.cabin_target_vs = Velocity::new::<foot_per_minute>(-750.);
                } else if target_vs >= Velocity::new::<foot_per_minute>(500.) {
                    self.cabin_target_vs = Velocity::new::<foot_per_minute>(500.);
                } else {
                    self.cabin_target_vs = target_vs;
                }
            }
            PressureSchedule::Abort => {
                if self.cabin_altitude() < self.departure_elevation() - Length::new::<foot>(187.818)
                {
                    self.cabin_target_vs = Velocity::new::<foot_per_minute>(500.)
                } else if self.cabin_altitude()
                    == self.departure_elevation() - Length::new::<foot>(187.818)
                {
                    self.cabin_target_vs = Velocity::new::<foot_per_minute>(0.)
                } else if self.cabin_altitude()
                    > self.departure_elevation() - Length::new::<foot>(187.818)
                {
                    self.cabin_target_vs = Velocity::new::<foot_per_minute>(-500.)
                }
            }
        }
    }

    fn update_departure_elev(&mut self, context: &UpdateContext) {
        if self.pressure_schedule() == PressureSchedule::Ground
            && self.departure_elev != context.indicated_altitude()
        {
            self.departure_elev = context.indicated_altitude()
        }
    }

    fn update_landing_elev(&mut self, landing_elevation: Length) {
        self.landing_elev = landing_elevation
    }

    fn get_ext_diff_with_ldg_elev(&self, context: &UpdateContext) -> Length {
        context.indicated_altitude() - self.landing_elevation() - Length::new::<foot>(187.818)
        // Equivalent to 0.1 PSI at sea level
    }

    fn get_int_diff_with_ldg_elev(&self) -> Length {
        self.cabin_altitude() - self.landing_elevation()
    }

    fn set_cabin_vs(&mut self, context: &UpdateContext) {
        const INTERNAL_VS_RATE_CHANGE: f64 = 100.; // Guessed value, rate of change of 100fpm per second

        let rate_of_change_for_delta = INTERNAL_VS_RATE_CHANGE * context.delta().as_secs_f64();
        if self.cabin_target_vs > self.cabin_vs() {
            self.cabin_vs += Velocity::new::<foot_per_minute>(rate_of_change_for_delta.min(
                self.cabin_target_vs.get::<foot_per_minute>()
                    - self.cabin_vs().get::<foot_per_minute>(),
            ));
        } else if self.cabin_target_vs < self.cabin_vs() {
            self.cabin_vs -= Velocity::new::<foot_per_minute>(rate_of_change_for_delta.min(
                self.cabin_vs().get::<foot_per_minute>()
                    - self.cabin_target_vs.get::<foot_per_minute>(),
            ));
        } else {
            self.cabin_vs = self.cabin_target_vs;
        }
    }

    fn update_active_system(&mut self, context: &UpdateContext) {
        if self.is_active() {
            if self.pressure_schedule_manager.pressure_schedule() == PressureSchedule::Ground
                && self.pressure_schedule_manager.timer() > Duration::from_secs_f64(70.)
                && self.pressure_schedule_manager.timer()
                    <= (Duration::from_secs_f64(70.) + context.delta())
            {
                self.set_active(false);
            }
        } else if !self.is_active()
            && self.pressure_schedule_manager.pressure_schedule() == PressureSchedule::Ground
            && self.pressure_schedule_manager.timer() > Duration::from_secs_f64(70.)
            && self.pressure_schedule_manager.timer()
                <= (Duration::from_secs_f64(70.) + context.delta())
        {
            self.set_active(true);
        }
    }

    pub fn set_active(&mut self, is_active: bool) {
        self.is_standby = !is_active;
    }

    pub fn is_active(&self) -> bool {
        !self.is_standby
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

    pub fn outflow_valve_open_amount(&self) -> Ratio {
        self.outflow_valve_open_amount
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
                && self.pressure_schedule_manager.timer().as_secs_f64() > 55.)
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

pub struct PressureScheduleManager {
    pressure_schedule: PressureSchedule,
    timer: Duration,
}

impl PressureScheduleManager {
    pub fn new() -> Self {
        Self {
            pressure_schedule: PressureSchedule::Ground,
            timer: Duration::from_secs_f64(100.),
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
        } else if !context.is_on_ground()
            && context.indicated_airspeed().get::<knot>() > 100.
            && context.ambient_pressure().get::<hectopascal>() > 0.
        {
            self.pressure_schedule = PressureSchedule::ClimbInternal;
            self.timer = Duration::from_secs_f64(0.);
        } else if self.timer < (Duration::from_secs_f64(70.) + context.delta()) {
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

    pub fn timer(&self) -> Duration {
        self.timer
    }
}
