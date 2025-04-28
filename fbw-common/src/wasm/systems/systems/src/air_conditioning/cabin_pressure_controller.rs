use crate::{
    failures::{Failure, FailureType},
    shared::{
        arinc429::{Arinc429Word, SignStatus},
        low_pass_filter::LowPassFilter,
        pid::PidController,
        AverageExt, CabinSimulation, ControllerSignal, EngineCorrectedN1, Resolution,
    },
    simulation::{
        InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, VariableIdentifier, Write,
    },
};

use super::{
    pressure_valve::{OutflowValve, SafetyValve},
    AdirsToAirCondInterface, Air, OutflowValveSignal, PressurizationConstants,
    PressurizationOverheadShared,
};

use std::{fmt::Display, marker::PhantomData, time::Duration};
use uom::si::{
    f64::*,
    length::{foot, meter},
    pressure::{hectopascal, psi},
    ratio::{percent, ratio},
    velocity::{foot_per_minute, knot, meter_per_second},
};

#[derive(Eq, PartialEq, Clone, Copy, Hash)]
pub enum CpcId {
    Cpc1,
    Cpc2,
}

impl Display for CpcId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Cpc1 => write!(f, "1"),
            Self::Cpc2 => write!(f, "2"),
        }
    }
}

pub struct CabinPressureController<C: PressurizationConstants> {
    cabin_altitude_id: VariableIdentifier,
    cabin_vs_id: VariableIdentifier,
    cabin_delta_pressure_id: VariableIdentifier,
    outflow_valve_open_percentage_id: VariableIdentifier,
    safety_valve_open_percentage_id: VariableIdentifier,
    landing_elevation_id: VariableIdentifier,

    auto_landing_elevation_id: VariableIdentifier,
    destination_qnh_id: VariableIdentifier,

    pressure_schedule_manager: Option<PressureScheduleManager>,
    manual_partition: Option<CpcManualPartition>,
    outflow_valve_controller: OutflowValveController,
    adirs_data_is_valid: bool,
    exterior_pressure: LowPassFilter<Pressure>,
    exterior_flight_altitude: Length,
    exterior_vertical_speed: LowPassFilter<Velocity>,
    reference_pressure: Pressure,
    previous_reference_pressure: Pressure,
    cabin_pressure: Pressure,
    cabin_alt: Length,
    cabin_vertical_speed: Velocity,
    cabin_filtered_vertical_speed: LowPassFilter<Velocity>,
    cabin_target_vs: Velocity,
    outflow_valve_open_amount: Ratio,
    safety_valve_open_amount: Ratio,

    landing_elevation: Length,
    landing_elevation_is_auto: bool,
    departure_elevation: Length,
    destination_qnh: Pressure,
    is_in_man_mode: bool,
    man_mode_duration: Duration,
    manual_to_auto_switch: bool,

    is_active: bool,
    is_initialised: bool,
    failure: Failure,
    constants: PhantomData<C>,
}

impl<C: PressurizationConstants> CabinPressureController<C> {
    // Atmospheric constants
    const R: f64 = 287.058; // Specific gas constant for air - m2/s2/K
    const G: f64 = 9.80665; // Gravity - m/s2
    const T_0: f64 = 288.2; // ISA standard temperature - K
    const P_0: f64 = 1013.25; // ISA standard pressure at sea level - hPa
    const L: f64 = -0.00651; // Adiabatic lapse rate - K/m

    const VERTICAL_SPEED_FILTER_TIME_CONSTANT: Duration = Duration::from_millis(1500);
    const AMBIENT_CONDITIONS_FILTER_TIME_CONSTANT: Duration = Duration::from_millis(2000);
    // Altitude in ft equivalent to 0.1 PSI delta P at sea level
    const TARGET_LANDING_ALT_DIFF: f64 = 187.818;
    const OFV_CONTROLLER_KP: f64 = 0.0001;
    const OFV_CONTROLLER_KI: f64 = 6.5;

    pub fn new(context: &mut InitContext, id: CpcId) -> Self {
        Self {
            cabin_altitude_id: context.get_identifier(format!("PRESS_CPC_{}_CABIN_ALTITUDE", id)),
            cabin_vs_id: context.get_identifier(format!("PRESS_CPC_{}_CABIN_VS", id)),
            cabin_delta_pressure_id: context
                .get_identifier(format!("PRESS_CPC_{}_CABIN_DELTA_PRESSURE", id)),
            outflow_valve_open_percentage_id: context
                .get_identifier(format!("PRESS_CPC_{}_OUTFLOW_VALVE_OPEN_PERCENTAGE", id)),
            landing_elevation_id: context
                .get_identifier(format!("PRESS_CPC_{}_LANDING_ELEVATION", id)),
            safety_valve_open_percentage_id: context
                .get_identifier("PRESS_SAFETY_VALVE_OPEN_PERCENTAGE".to_owned()),

            auto_landing_elevation_id: context.get_identifier("FM1_LANDING_ELEVATION".to_owned()),
            destination_qnh_id: context.get_identifier("DESTINATION_QNH".to_owned()),

            pressure_schedule_manager: Some(PressureScheduleManager::new()),
            manual_partition: if id == CpcId::Cpc1 {
                Some(CpcManualPartition::new(context))
            } else {
                None
            },
            outflow_valve_controller: OutflowValveController::new(
                Self::OFV_CONTROLLER_KP,
                Self::OFV_CONTROLLER_KI,
            ),
            adirs_data_is_valid: false,
            exterior_pressure: LowPassFilter::new_with_init_value(
                Self::AMBIENT_CONDITIONS_FILTER_TIME_CONSTANT,
                Pressure::new::<hectopascal>(Self::P_0),
            ),
            exterior_flight_altitude: Length::default(),
            exterior_vertical_speed: LowPassFilter::new_with_init_value(
                Self::AMBIENT_CONDITIONS_FILTER_TIME_CONSTANT,
                Velocity::default(),
            ),
            reference_pressure: Pressure::new::<hectopascal>(Self::P_0),
            previous_reference_pressure: Pressure::new::<hectopascal>(Self::P_0),
            cabin_pressure: Pressure::new::<hectopascal>(Self::P_0),
            cabin_alt: Length::default(),
            cabin_vertical_speed: Velocity::default(),
            cabin_filtered_vertical_speed: LowPassFilter::new(
                Self::VERTICAL_SPEED_FILTER_TIME_CONSTANT,
            ),
            cabin_target_vs: Velocity::default(),
            outflow_valve_open_amount: Ratio::new::<percent>(100.),
            safety_valve_open_amount: Ratio::new::<percent>(0.),

            landing_elevation: Length::default(),
            landing_elevation_is_auto: false,
            departure_elevation: Length::default(),
            destination_qnh: Pressure::default(),
            is_in_man_mode: false,
            man_mode_duration: Duration::from_secs(0),
            manual_to_auto_switch: false,

            is_active: false,
            is_initialised: false,
            failure: Failure::new(FailureType::CpcFault(id)),
            constants: PhantomData,
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        adirs: &impl AdirsToAirCondInterface,
        engines: [&impl EngineCorrectedN1; 2],
        lgciu_gears_compressed: bool,
        press_overhead: &impl PressurizationOverheadShared,
        cabin_simulation: &impl CabinSimulation,
        outflow_valve: Vec<&OutflowValve>,
        safety_valve: &SafetyValve,
        is_active: bool,
    ) {
        self.adirs_data_is_valid = [1, 2, 3]
            .iter()
            .any(|&adr| adirs.ambient_static_pressure(adr).is_normal_operation());
        let (adirs_airspeed, _) = self.adirs_values_calculation(adirs);

        self.cabin_pressure = cabin_simulation.cabin_pressure();

        self.landing_elevation_is_auto = press_overhead.ldg_elev_is_auto();
        if !self.landing_elevation_is_auto {
            self.landing_elevation = Length::new::<foot>(press_overhead.ldg_elev_knob_value())
        }

        if let Some(manager) = self.pressure_schedule_manager.take() {
            self.pressure_schedule_manager = Some(manager.update(
                context,
                adirs_airspeed.unwrap_or_default(),
                self.exterior_pressure.output(),
                &engines,
                lgciu_gears_compressed,
                self.exterior_flight_altitude,
                self.exterior_vertical_speed.output(),
            ));
        }
        self.cabin_target_vs = self.calculate_cabin_target_vs();

        let new_reference_pressure = self.calculate_reference_pressure(adirs, press_overhead);
        let new_cabin_alt = self.calculate_altitude(self.cabin_pressure, new_reference_pressure);

        self.cabin_vertical_speed =
            self.calculate_vertical_speed(context, new_cabin_alt, new_reference_pressure);
        self.cabin_filtered_vertical_speed
            .update(context.delta(), self.cabin_vertical_speed);
        self.cabin_alt = new_cabin_alt;
        self.reference_pressure = new_reference_pressure;
        self.departure_elevation = self.calculate_departure_elevation();

        if !self.has_fault() {
            self.outflow_valve_controller.update(
                context,
                self.cabin_vertical_speed,
                self.cabin_target_vs,
                press_overhead,
                self.is_ground() || (self.cabin_altitude() <= Length::new::<foot>(15000.)),
                self.is_ground() && self.should_open_outflow_valve(),
            );
        }

        self.outflow_valve_open_amount = outflow_valve
            .iter()
            .map(|valve| valve.open_amount())
            .average();
        self.safety_valve_open_amount = safety_valve.open_amount();

        if self.is_in_man_mode && press_overhead.is_in_man_mode() {
            self.man_mode_duration += context.delta();
        } else if self.is_in_man_mode && !press_overhead.is_in_man_mode() {
            if self.man_mode_duration > Duration::from_secs(10) {
                self.manual_to_auto_switch = true;
            }
            self.man_mode_duration = Duration::from_secs(0)
        }

        if let Some(partition) = self.manual_partition.take() {
            self.manual_partition = Some(partition.update(
                self.cabin_altitude(),
                self.cabin_delta_p(),
                self.cabin_vertical_speed(),
                self.is_excessive_alt(),
                self.outflow_valve_open_amount,
            ));
        }

        self.is_in_man_mode = press_overhead.is_in_man_mode();
        self.is_active = is_active;
    }

    /// Separate update function for exterior pressure, exterior altitude and exterior vertical speed
    /// This avoids issues with different update time steps
    pub fn update_ambient_conditions(
        &mut self,
        context: &UpdateContext,
        adirs: &impl AdirsToAirCondInterface,
    ) {
        let (_, adirs_ambient_pressure) = self.adirs_values_calculation(adirs);
        let new_exterior_altitude: Length;

        if !self.is_initialised && adirs_ambient_pressure.is_some() {
            self.exterior_pressure.reset(
                adirs_ambient_pressure.unwrap_or_else(|| Pressure::new::<hectopascal>(Air::P_0)),
            );
            new_exterior_altitude =
                self.calculate_altitude(self.exterior_pressure.output(), self.reference_pressure);
            self.is_initialised = true;
        } else {
            self.exterior_pressure.update(
                context.delta(),
                adirs_ambient_pressure.unwrap_or_else(|| Pressure::new::<hectopascal>(Air::P_0)),
            );

            new_exterior_altitude =
                self.calculate_altitude(self.exterior_pressure.output(), self.reference_pressure);
            // When the reference pressure changes, we skip the update to the external
            // V/S to avoid a jump
            if (self.previous_reference_pressure.get::<hectopascal>()
                - self.reference_pressure.get::<hectopascal>())
            .abs()
                < f64::EPSILON
            {
                self.exterior_vertical_speed.update(
                    context.delta(),
                    self.calculate_exterior_vertical_speed(context, new_exterior_altitude),
                );
            }
        }

        self.exterior_flight_altitude = new_exterior_altitude;
        self.previous_reference_pressure = self.reference_pressure;
    }

    fn adirs_values_calculation(
        &self,
        adirs: &impl AdirsToAirCondInterface,
    ) -> (Option<Velocity>, Option<Pressure>) {
        // TODO: Each CPC has a different order for checking the ADIRS
        let adiru_check_order = [1, 2, 3];
        let adirs_airspeed = adiru_check_order
            .iter()
            .find_map(|&adiru_number| adirs.true_airspeed(adiru_number).normal_value());
        let adirs_ambient_pressure = adiru_check_order
            .iter()
            .find_map(|&adiru_number| adirs.ambient_static_pressure(adiru_number).normal_value());
        (adirs_airspeed, adirs_ambient_pressure)
    }

    fn calculate_cabin_target_vs(&mut self) -> Velocity {
        let error_margin = Pressure::new::<hectopascal>(1.);

        match self.pressure_schedule_manager {
            Some(PressureScheduleManager::Ground(_)) => {
                Velocity::new::<foot_per_minute>(if self.cabin_delta_p() > error_margin {
                    C::DEPRESS_RATE
                } else if self.cabin_delta_p() < -error_margin {
                    -C::DEPRESS_RATE
                } else {
                    0.
                })
            }
            Some(PressureScheduleManager::TakeOff(_)) => Velocity::new::<foot_per_minute>(
                if self.cabin_delta_p() < Pressure::new::<psi>(C::MAX_TAKEOFF_DELTA_P) {
                    C::TAKEOFF_RATE
                } else {
                    0.
                },
            ),
            Some(PressureScheduleManager::ClimbInternal(_)) => {
                // Formula based on empirical graphs and tables to simulate climb schedule as per the real aircraft
                let target_vs_fpm = self
                    .exterior_vertical_speed
                    .output()
                    .get::<foot_per_minute>()
                    * (0.00000525 * self.exterior_flight_altitude.get::<foot>() + 0.09);
                Velocity::new::<foot_per_minute>(
                    if self.cabin_delta_p() >= Pressure::new::<psi>(C::MAX_CLIMB_DELTA_P) {
                        C::MAX_CLIMB_RATE
                    } else if self.cabin_altitude()
                        >= Length::new::<foot>(C::MAX_CLIMB_CABIN_ALTITUDE)
                    {
                        0.
                    } else if target_vs_fpm <= C::MAX_DESCENT_RATE {
                        C::MAX_DESCENT_RATE
                    } else {
                        target_vs_fpm
                    },
                )
            }
            Some(PressureScheduleManager::Cruise(_)) => Velocity::default(),
            Some(PressureScheduleManager::DescentInternal(_)) => {
                let ext_diff_with_ldg_elev = self.get_ext_diff_with_ldg_elev().get::<foot>();
                let target_vs_fpm = self.get_int_diff_with_ldg_elev().get::<foot>()
                    * self
                        .exterior_vertical_speed
                        .output()
                        .get::<foot_per_minute>()
                    / ext_diff_with_ldg_elev;
                Velocity::new::<foot_per_minute>(if ext_diff_with_ldg_elev <= 0. {
                    0.
                } else if target_vs_fpm <= C::MAX_DESCENT_RATE {
                    C::MAX_DESCENT_RATE
                } else if target_vs_fpm >= C::MAX_CLIMB_RATE_IN_DESCENT {
                    C::MAX_CLIMB_RATE_IN_DESCENT
                } else {
                    target_vs_fpm
                })
            }
            Some(PressureScheduleManager::Abort(_)) => Velocity::new::<foot_per_minute>(
                if self.cabin_altitude()
                    > self.departure_elevation - Length::new::<foot>(Self::TARGET_LANDING_ALT_DIFF)
                {
                    C::MAX_ABORT_DESCENT_RATE
                } else {
                    0.
                },
            ),
            None => Velocity::new::<foot_per_minute>(0.),
        }
    }

    fn get_ext_diff_with_ldg_elev(&self) -> Length {
        // TODO: Replace constant target landing alt diff for pressure diff
        self.exterior_flight_altitude
            - (self.landing_elevation - Length::new::<foot>(Self::TARGET_LANDING_ALT_DIFF))
    }

    fn get_int_diff_with_ldg_elev(&self) -> Length {
        self.cabin_alt
            - (self.landing_elevation - Length::new::<foot>(Self::TARGET_LANDING_ALT_DIFF))
    }

    /// In decent the reference pressure is based on the local QNH when below 5000ft from arrival airport, ISA when above.
    /// If no QNH data has been entered in the MCDU, the ADIRS baro correction is used.
    /// In all other phases, ISA is used when the aircraft is higher than 5000ft from departing or landing airfields
    /// When the system is in manual, the reference pressure is always ISA
    fn calculate_reference_pressure(
        &self,
        adirs: &impl AdirsToAirCondInterface,
        press_overhead: &impl PressurizationOverheadShared,
    ) -> Pressure {
        if press_overhead.is_in_man_mode() {
            return Pressure::new::<hectopascal>(Self::P_0);
        }

        // TODO: Each CPC has a different order for checking the ADIRS - CPC1 1-2-3, CPC2 2-1-3
        let altimeter_setting = [1, 2, 3]
            .iter()
            .find_map(|&adiru_number| adirs.baro_correction(adiru_number).normal_value());

        if matches!(
            self.pressure_schedule_manager,
            Some(PressureScheduleManager::DescentInternal(_))
        ) && (self.exterior_flight_altitude - self.landing_elevation)
            .get::<foot>()
            .abs()
            < 5000.
        {
            if self.destination_qnh > Pressure::new::<hectopascal>(0.) {
                self.destination_qnh
            } else if let Some(alt) = altimeter_setting {
                alt
            } else {
                Pressure::new::<hectopascal>(Self::P_0)
            }
        } else if ((self.exterior_flight_altitude - self.departure_elevation)
            .get::<foot>()
            .abs()
            < 5000.
            || (self.exterior_flight_altitude - self.landing_elevation)
                .get::<foot>()
                .abs()
                < 5000.)
            && altimeter_setting.is_some()
            // Avoid coming back to local QNH in turbulence
            && !(!self.is_ground()
                && (self.reference_pressure.get::<hectopascal>() - Self::P_0).abs() < f64::EPSILON
                && (altimeter_setting.unwrap_or_default().get::<hectopascal>() - Self::P_0).abs()
                    > f64::EPSILON)
        {
            altimeter_setting.unwrap()
        } else {
            Pressure::new::<hectopascal>(Self::P_0)
        }
    }

    fn calculate_exterior_vertical_speed(
        &self,
        context: &UpdateContext,
        new_altitude: Length,
    ) -> Velocity {
        Velocity::new::<meter_per_second>(
            (new_altitude.get::<meter>() - self.exterior_flight_altitude.get::<meter>())
                / context.delta_as_secs_f64(),
        )
    }

    fn calculate_vertical_speed(
        &self,
        context: &UpdateContext,
        new_cabin_alt: Length,
        new_reference_pressure: Pressure,
    ) -> Velocity {
        // When the reference pressure changes, V/S is the same as previous to avoid a jump
        if (new_reference_pressure.get::<hectopascal>()
            - self.reference_pressure.get::<hectopascal>())
        .abs()
            > f64::EPSILON
        {
            self.cabin_vertical_speed
        } else {
            // Distance over time :)
            Velocity::new::<meter_per_second>(
                (new_cabin_alt.get::<meter>() - self.cabin_alt.get::<meter>())
                    / context.delta_as_secs_f64(),
            )
        }
    }

    /// Calculation of altidude based on a pressure and reference pressure
    /// This uses the hydrostatic equation with linear temp changes and constant R, g
    fn calculate_altitude(&self, pressure: Pressure, reference_pressure: Pressure) -> Length {
        let pressure_ratio = (pressure / reference_pressure).get::<ratio>();

        // Hydrostatic equation with linear temp changes and constant R, g
        let altitude: f64 = ((Self::T_0 / pressure_ratio.powf((Self::L * Self::R) / Self::G))
            - Self::T_0)
            / Self::L;
        Length::new::<meter>(altitude)
    }

    fn calculate_departure_elevation(&self) -> Length {
        if self.is_ground() {
            self.cabin_alt
        } else {
            self.departure_elevation
        }
    }

    pub fn cabin_delta_p(&self) -> Pressure {
        self.cabin_pressure - self.exterior_pressure.output()
    }

    pub fn cabin_altitude(&self) -> Length {
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
            || self.has_fault()
    }

    pub fn should_open_outflow_valve(&self) -> bool {
        self.pressure_schedule_manager
            .as_ref()
            .map_or(false, |manager| manager.should_open_outflow_valve())
    }

    pub fn reset_cpc_switch(&mut self) {
        self.manual_to_auto_switch = false;
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

    pub fn is_active(&self) -> bool {
        self.is_active
    }

    pub fn has_fault(&self) -> bool {
        self.failure.is_active()
    }

    pub fn landing_elevation_is_auto(&self) -> bool {
        self.landing_elevation_is_auto
    }

    pub fn cabin_vertical_speed(&self) -> Velocity {
        // When on the ground with outflow valve open, V/S is always zero
        // Vertical speed word range is from -6400 to +6400 fpm (AMM)
        if self.is_ground() && self.outflow_valve_open_amount == Ratio::new::<percent>(100.) {
            Velocity::default()
        } else {
            Velocity::new::<foot_per_minute>(
                self.cabin_filtered_vertical_speed
                    .output()
                    .get::<foot_per_minute>()
                    .clamp(-6400., 6400.),
            )
        }
    }

    // FWC warning signals
    pub fn is_excessive_alt(&self) -> bool {
        self.cabin_alt > Length::new::<foot>(C::EXCESSIVE_ALT_WARNING)
            && self.cabin_alt > (self.departure_elevation + Length::new::<foot>(1000.))
            && self.cabin_alt > (self.landing_elevation + Length::new::<foot>(1000.))
    }

    pub fn is_low_diff_pressure(&self) -> bool {
        // Only emit the signal if delta pressure information is valid
        self.cabin_delta_p() < Pressure::new::<psi>(C::LOW_DIFFERENTIAL_PRESSURE_WARNING)
            && self.cabin_alt > (self.landing_elevation + Length::new::<foot>(1500.))
            && self.exterior_vertical_speed.output() < Velocity::new::<foot_per_minute>(-500.)
            && self.adirs_data_is_valid
    }

    fn cabin_delta_p_out(&self) -> Pressure {
        // Correct format for ARINC delta P
        let delta_p_psi = self
            .cabin_delta_p()
            .get::<psi>()
            .clamp(-6., 12.)
            .resolution(0.075);
        Pressure::new::<psi>(delta_p_psi)
    }

    fn cabin_altitude_out(&self) -> Length {
        // Correct format for ARINC altitude
        let altitude_ft = self
            .cabin_altitude()
            .get::<foot>()
            .clamp(-15000., 30000.)
            .resolution(16.);
        Length::new::<foot>(altitude_ft)
    }

    fn cabin_vertical_speed_out(&self) -> Velocity {
        let vertical_speed_fpm = self
            .cabin_vertical_speed()
            .get::<foot_per_minute>()
            .clamp(-6400., 6400.)
            .resolution(50.);
        Velocity::new::<foot_per_minute>(vertical_speed_fpm)
    }

    fn outflow_valve_open_amount_out(&self) -> Ratio {
        let outflow_valve_position_pct = self
            .outflow_valve_open_amount
            .get::<percent>()
            .clamp(0., 100.)
            .resolution(1.);
        Ratio::new::<percent>(outflow_valve_position_pct)
    }

    fn landing_elevation_out(&self) -> Length {
        let landing_elevation_ft = self
            .landing_elevation
            .get::<foot>()
            .clamp(-2000., 14000.)
            .resolution(32.);
        Length::new::<foot>(landing_elevation_ft)
    }

    pub fn landing_elevation(&self) -> Length {
        self.landing_elevation
    }

    pub fn reference_pressure(&self) -> Pressure {
        self.reference_pressure
    }
}

impl<C: PressurizationConstants> ControllerSignal<OutflowValveSignal>
    for CabinPressureController<C>
{
    fn signal(&self) -> Option<OutflowValveSignal> {
        self.outflow_valve_controller.signal()
    }
}

impl<C: PressurizationConstants> SimulationElement for CabinPressureController<C> {
    fn write(&self, writer: &mut SimulatorWriter) {
        let ssm = if self.failure.is_active() {
            SignStatus::FailureWarning
        } else {
            SignStatus::NormalOperation
        };

        // Delta P is no computed data if the adirs are not sending ambient pressure information
        let delta_p_ssm = if self.failure.is_active() {
            SignStatus::FailureWarning
        } else if !self.adirs_data_is_valid {
            SignStatus::NoComputedData
        } else {
            SignStatus::NormalOperation
        };

        // Safety valve open percentage is not sent by the CPC in real life
        writer.write(
            &self.safety_valve_open_percentage_id,
            self.safety_valve_open_amount,
        );

        writer.write_arinc429(
            &self.cabin_delta_pressure_id,
            self.cabin_delta_p_out(),
            delta_p_ssm,
        );
        writer.write_arinc429(&self.cabin_altitude_id, self.cabin_altitude_out(), ssm);
        writer.write_arinc429(
            &self.outflow_valve_open_percentage_id,
            self.outflow_valve_open_amount_out(),
            ssm,
        );
        writer.write_arinc429(
            &self.cabin_vs_id,
            self.cabin_vertical_speed_out().get::<foot_per_minute>(),
            ssm,
        );
        writer.write_arinc429(
            &self.landing_elevation_id,
            self.landing_elevation_out(),
            ssm,
        );
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        let landing_elevation_word: Arinc429Word<Length> =
            reader.read_arinc429(&self.auto_landing_elevation_id);
        self.landing_elevation = landing_elevation_word.normal_value().unwrap_or_default();
        self.destination_qnh = Pressure::new::<hectopascal>(reader.read(&self.destination_qnh_id));
    }

    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.failure.accept(visitor);
        if let Some(ref mut partition) = self.manual_partition {
            partition.accept(visitor);
        }

        visitor.visit(self);
    }
}

pub struct OutflowValveController {
    is_in_man_mode: bool,
    open_allowed: bool,
    should_open: bool,
    pid: PidController,
}

impl OutflowValveController {
    pub fn new(kp: f64, ki: f64) -> Self {
        Self {
            is_in_man_mode: false,
            open_allowed: true,
            should_open: true,
            pid: PidController::new(kp, ki, 0., 0., 100., 0., 1.),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        cabin_vertical_speed: Velocity,
        cabin_target_vs: Velocity,
        press_overhead: &impl PressurizationOverheadShared,
        open_allowed: bool,
        should_open_ofv: bool,
    ) {
        self.is_in_man_mode = press_overhead.is_in_man_mode();
        self.open_allowed = open_allowed && !press_overhead.ditching_is_on();
        self.should_open = should_open_ofv && self.open_allowed;

        if self.open_allowed {
            self.pid
                .change_setpoint(cabin_target_vs.get::<meter_per_second>());
            self.pid.next_control_output(
                cabin_vertical_speed.get::<meter_per_second>(),
                Some(context.delta()),
            );
        } else {
            self.pid.reset();
        }
    }
}

impl ControllerSignal<OutflowValveSignal> for OutflowValveController {
    fn signal(&self) -> Option<OutflowValveSignal> {
        if self.is_in_man_mode {
            None
        } else {
            let target_open: Ratio = Ratio::new::<percent>(self.pid.output());
            if !self.open_allowed {
                Some(OutflowValveSignal::new_closed())
            } else if self.should_open {
                Some(OutflowValveSignal::new_open())
            } else {
                Some(OutflowValveSignal::new(target_open))
            }
        }
    }
}

/// The manual partition of the CPC1 only transmits cabin pressure, vertical speed, OFV open amount
/// and the signal for excessive cabin altitude. Here we add the cabin altitude and delta pressure as
/// neither the SDAC nor the DMC are modelled. When that is done, these should be removed from here.
struct CpcManualPartition {
    cabin_altitude_man_id: VariableIdentifier,
    cabin_delta_p_man_id: VariableIdentifier,
    cabin_vertical_speed_man_id: VariableIdentifier,
    fwc_excessive_cabin_altitude_man_id: VariableIdentifier,
    outflow_valve_open_amount_man_id: VariableIdentifier,

    cabin_altitude: Length,
    cabin_delta_p: Pressure,
    cabin_vertical_speed: Velocity,
    fwc_excessive_cabin_altitude: bool,
    outflow_valve_open_amount: Ratio,
}

impl CpcManualPartition {
    fn new(context: &mut InitContext) -> Self {
        Self {
            cabin_altitude_man_id: context.get_identifier("PRESS_MAN_CABIN_ALTITUDE".to_owned()),
            cabin_delta_p_man_id: context
                .get_identifier("PRESS_MAN_CABIN_DELTA_PRESSURE".to_owned()),
            cabin_vertical_speed_man_id: context.get_identifier("PRESS_MAN_CABIN_VS".to_owned()),
            fwc_excessive_cabin_altitude_man_id: context
                .get_identifier("PRESS_MAN_EXCESSIVE_CABIN_ALTITUDE".to_owned()),
            outflow_valve_open_amount_man_id: context
                .get_identifier("PRESS_MAN_OUTFLOW_VALVE_OPEN_PERCENTAGE".to_owned()),

            cabin_altitude: Length::default(),
            cabin_delta_p: Pressure::default(),
            cabin_vertical_speed: Velocity::default(),
            fwc_excessive_cabin_altitude: false,
            outflow_valve_open_amount: Ratio::default(),
        }
    }

    fn update(
        mut self,
        cabin_altitude: Length,
        cabin_delta_pressure: Pressure,
        cabin_vertical_speed: Velocity,
        fwc_excessive_cabin_altitude: bool,
        outflow_valve_open_amount: Ratio,
    ) -> Self {
        self.cabin_altitude = cabin_altitude;
        self.cabin_delta_p = cabin_delta_pressure;
        self.cabin_vertical_speed = cabin_vertical_speed;
        self.fwc_excessive_cabin_altitude = fwc_excessive_cabin_altitude;
        self.outflow_valve_open_amount = outflow_valve_open_amount;
        self
    }
}

impl SimulationElement for CpcManualPartition {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.cabin_altitude_man_id, self.cabin_altitude);
        writer.write(&self.cabin_delta_p_man_id, self.cabin_delta_p);
        writer.write(
            &self.cabin_vertical_speed_man_id,
            self.cabin_vertical_speed.get::<foot_per_minute>(),
        );
        writer.write(
            &self.fwc_excessive_cabin_altitude_man_id,
            self.fwc_excessive_cabin_altitude,
        );
        writer.write(
            &self.outflow_valve_open_amount_man_id,
            self.outflow_valve_open_amount,
        );
    }
}

pub enum PressureScheduleManager {
    Ground(PressureSchedule<Ground>),
    TakeOff(PressureSchedule<TakeOff>),
    ClimbInternal(PressureSchedule<ClimbInternal>),
    Cruise(PressureSchedule<Cruise>),
    DescentInternal(PressureSchedule<DescentInternal>),
    Abort(PressureSchedule<Abort>),
}

impl PressureScheduleManager {
    pub fn new() -> Self {
        PressureScheduleManager::Ground(PressureSchedule::with_open_outflow_valve())
    }

    pub fn update(
        mut self,
        context: &UpdateContext,
        adirs_airspeed: Velocity,
        adirs_ambient_pressure: Pressure,
        engines: &[&impl EngineCorrectedN1],
        lgciu_gears_compressed: bool,
        exterior_flight_altitude: Length,
        exterior_vertical_speed: Velocity,
    ) -> Self {
        self = match self {
            PressureScheduleManager::Ground(val) => val.step(
                context,
                adirs_airspeed,
                adirs_ambient_pressure,
                engines,
                lgciu_gears_compressed,
            ),
            PressureScheduleManager::TakeOff(val) => val.step(
                adirs_airspeed,
                adirs_ambient_pressure,
                engines,
                lgciu_gears_compressed,
            ),
            PressureScheduleManager::ClimbInternal(val) => {
                val.step(context, exterior_flight_altitude, exterior_vertical_speed)
            }
            PressureScheduleManager::Cruise(val) => val.step(context, exterior_vertical_speed),
            PressureScheduleManager::DescentInternal(val) => val.step(
                context,
                adirs_airspeed,
                lgciu_gears_compressed,
                exterior_vertical_speed,
            ),
            PressureScheduleManager::Abort(val) => val.step(
                context,
                adirs_airspeed,
                lgciu_gears_compressed,
                exterior_vertical_speed,
            ),
        };
        self
    }

    pub fn should_open_outflow_valve(&self) -> bool {
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
pub struct PressureSchedule<S> {
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
pub struct Ground {
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
    const CPC_SWITCHES_AFTER_SECS: u64 = 70;

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
        adirs_airspeed: Velocity,
        adirs_ambient_pressure: Pressure,
        engines: &[&impl EngineCorrectedN1],
        lgciu_gears_compressed: bool,
    ) -> PressureScheduleManager {
        if engines
            .iter()
            .all(|&x| x.corrected_n1() > Ratio::new::<percent>(70.))
            && lgciu_gears_compressed
        {
            PressureScheduleManager::TakeOff(self.into())
        } else if !lgciu_gears_compressed
            && adirs_airspeed.get::<knot>() > 100.
            && adirs_ambient_pressure.get::<hectopascal>() > 0.
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
        self.timer > Duration::from_secs(Self::CPC_SWITCHES_AFTER_SECS)
            && self.pressure_schedule.cpc_switch_reset
    }

    fn reset_cpc_switch(&mut self) {
        self.pressure_schedule.cpc_switch_reset = false;
    }
}

transition_with_ctor!(TakeOff, Ground, Ground::reset);
transition_with_ctor!(DescentInternal, Ground, Ground::reset);
transition_with_ctor!(Abort, Ground, Ground::reset);

#[derive(Copy, Clone)]
pub struct TakeOff;

impl PressureSchedule<TakeOff> {
    fn step(
        self: PressureSchedule<TakeOff>,
        adirs_airspeed: Velocity,
        adirs_ambient_pressure: Pressure,
        engines: &[&impl EngineCorrectedN1],
        lgciu_gears_compressed: bool,
    ) -> PressureScheduleManager {
        if engines
            .iter()
            .all(|&x| x.corrected_n1() < Ratio::new::<percent>(70.))
            && lgciu_gears_compressed
        {
            PressureScheduleManager::Ground(self.into())
        } else if !lgciu_gears_compressed
            && adirs_airspeed.get::<knot>() > 100.
            && adirs_ambient_pressure.get::<hectopascal>() > 0.
        {
            PressureScheduleManager::ClimbInternal(self.into())
        } else {
            PressureScheduleManager::TakeOff(self)
        }
    }
}

transition!(Ground, TakeOff);

#[derive(Copy, Clone)]
pub struct ClimbInternal;

impl PressureSchedule<ClimbInternal> {
    fn step(
        self: PressureSchedule<ClimbInternal>,
        context: &UpdateContext,
        exterior_flight_altitude: Length,
        exterior_vertical_speed: Velocity,
    ) -> PressureScheduleManager {
        const DURATION_UNTIL_ABORT: u64 = 30;
        const DURATION_UNTIL_CRUISE: u64 = 30;
        const DURATION_UNTIL_DESCENT: u64 = 60;

        if exterior_flight_altitude < Length::new::<foot>(8000.)
            && exterior_vertical_speed < Velocity::new::<foot_per_minute>(-200.)
        {
            if self.timer > Duration::from_secs(DURATION_UNTIL_ABORT) {
                PressureScheduleManager::Abort(self.into())
            } else {
                PressureScheduleManager::ClimbInternal(self.increase_timer(context))
            }
        } else if exterior_vertical_speed < Velocity::new::<foot_per_minute>(100.)
            && exterior_vertical_speed > Velocity::new::<foot_per_minute>(-100.)
        {
            if self.timer > Duration::from_secs(DURATION_UNTIL_CRUISE) {
                PressureScheduleManager::Cruise(self.into())
            } else {
                PressureScheduleManager::ClimbInternal(self.increase_timer(context))
            }
        } else if exterior_vertical_speed < Velocity::new::<foot_per_minute>(-250.) {
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
pub struct Cruise;

impl PressureSchedule<Cruise> {
    fn step(
        self: PressureSchedule<Cruise>,
        context: &UpdateContext,
        exterior_vertical_speed: Velocity,
    ) -> PressureScheduleManager {
        const DURATION_UNTIL_CLIMB: u64 = 60;
        const DURATION_UNTIL_DESCENT: u64 = 30;

        if exterior_vertical_speed > Velocity::new::<foot_per_minute>(250.) {
            if self.timer > Duration::from_secs(DURATION_UNTIL_CLIMB) {
                PressureScheduleManager::ClimbInternal(self.into())
            } else {
                PressureScheduleManager::Cruise(self.increase_timer(context))
            }
        } else if exterior_vertical_speed < Velocity::new::<foot_per_minute>(-250.) {
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
pub struct DescentInternal;

impl PressureSchedule<DescentInternal> {
    fn step(
        self: PressureSchedule<DescentInternal>,
        context: &UpdateContext,
        adirs_airspeed: Velocity,
        lgciu_gears_compressed: bool,
        exterior_vertical_speed: Velocity,
    ) -> PressureScheduleManager {
        const DURATION_UNTIL_CLIMB: u64 = 60;

        if exterior_vertical_speed > Velocity::new::<foot_per_minute>(250.) {
            if self.timer > Duration::from_secs(DURATION_UNTIL_CLIMB) {
                PressureScheduleManager::ClimbInternal(self.into())
            } else {
                PressureScheduleManager::DescentInternal(self.increase_timer(context))
            }
        } else if lgciu_gears_compressed && adirs_airspeed.get::<knot>() < 100. {
            PressureScheduleManager::Ground(self.into())
        } else {
            PressureScheduleManager::DescentInternal(self.reset_timer())
        }
    }
}

transition!(ClimbInternal, DescentInternal);
transition!(Cruise, DescentInternal);

#[derive(Copy, Clone)]
pub struct Abort;

impl PressureSchedule<Abort> {
    fn step(
        self: PressureSchedule<Abort>,
        context: &UpdateContext,
        adirs_airspeed: Velocity,
        lgciu_gears_compressed: bool,
        exterior_vertical_speed: Velocity,
    ) -> PressureScheduleManager {
        const DURATION_UNTIL_CLIMB: u64 = 60;

        if lgciu_gears_compressed && adirs_airspeed.get::<knot>() < 100. {
            PressureScheduleManager::Ground(self.into())
        } else if exterior_vertical_speed > Velocity::new::<foot_per_minute>(30.) {
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
    use crate::air_conditioning::VcmShared;
    use crate::shared::ElectricalBusType;
    use crate::simulation::{Aircraft, InitContext, SimulationElement, SimulationElementVisitor};
    use crate::{
        air_conditioning::{
            cabin_air::CabinAirSimulation,
            {Air, DuctTemperature, OutletAir, PackFlow, ZoneType},
        },
        shared::arinc429::{Arinc429Word, SignStatus},
    };
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
        thermodynamic_temperature::degree_celsius,
        velocity::{foot_per_minute, knot},
    };

    struct TestAdirs {
        true_airspeed: Velocity,
        ambient_pressure: Pressure,
    }
    impl TestAdirs {
        fn new() -> Self {
            Self {
                true_airspeed: Velocity::default(),
                ambient_pressure: Pressure::new::<hectopascal>(1013.25),
            }
        }
        fn set_true_airspeed(&mut self, airspeed: Velocity) {
            self.true_airspeed = airspeed;
        }
        fn set_ambient_pressure(&mut self, pressure: Pressure) {
            self.ambient_pressure = pressure;
        }
    }
    impl AdirsToAirCondInterface for TestAdirs {
        fn ground_speed(&self, _adiru_number: usize) -> Arinc429Word<Velocity> {
            Arinc429Word::new(Velocity::default(), SignStatus::NormalOperation)
        }
        fn true_airspeed(&self, _adiru_number: usize) -> Arinc429Word<Velocity> {
            Arinc429Word::new(self.true_airspeed, SignStatus::NormalOperation)
        }
        fn baro_correction(&self, _adiru_number: usize) -> Arinc429Word<Pressure> {
            Arinc429Word::new(Pressure::default(), SignStatus::NoComputedData)
        }
        fn ambient_static_pressure(&self, _adiru_number: usize) -> Arinc429Word<Pressure> {
            Arinc429Word::new(self.ambient_pressure, SignStatus::NormalOperation)
        }
    }

    struct TestAirConditioningSystem {
        duct_demand_temperature: ThermodynamicTemperature,
        pack_flow: MassRate,
    }

    impl TestAirConditioningSystem {
        fn new() -> Self {
            Self {
                duct_demand_temperature: ThermodynamicTemperature::new::<degree_celsius>(24.),
                pack_flow: MassRate::default(),
            }
        }
    }

    impl DuctTemperature for TestAirConditioningSystem {
        fn duct_temperature(&self) -> Vec<ThermodynamicTemperature> {
            let mut duct_temperature: Vec<ThermodynamicTemperature> = Vec::new();
            // We push a 2 len element to simulate the cockpit so the indices match the final model
            let mut cabin_duct_temperatures = vec![
                ThermodynamicTemperature::new::<degree_celsius>(24.),
                self.duct_demand_temperature,
                self.duct_demand_temperature,
            ];
            duct_temperature.append(&mut cabin_duct_temperatures);
            duct_temperature
        }
    }

    impl PackFlow for TestAirConditioningSystem {
        fn pack_flow(&self) -> MassRate {
            self.pack_flow
        }
    }

    impl OutletAir for TestAirConditioningSystem {
        fn outlet_air(&self) -> Air {
            let mut outlet_air = Air::new();
            outlet_air.set_flow_rate(self.pack_flow);
            outlet_air.set_pressure(Pressure::new::<psi>(16.));
            outlet_air
        }
    }

    impl VcmShared for TestAirConditioningSystem {}

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

    impl ControllerSignal<OutflowValveSignal> for TestPressurizationOverheadPanel {
        fn signal(&self) -> Option<OutflowValveSignal> {
            if !self.is_in_man_mode() {
                None
            } else {
                match self.man_vs_switch_position() {
                    0 => Some(OutflowValveSignal::new_open()),
                    1 => None,
                    2 => Some(OutflowValveSignal::new_closed()),
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

    #[derive(Clone, Copy)]
    struct TestConstants;

    impl PressurizationConstants for TestConstants {
        const CABIN_ZONE_VOLUME_CUBIC_METER: f64 = 139.; // m3
        const COCKPIT_VOLUME_CUBIC_METER: f64 = 9.; // m3
        const FWD_CARGO_ZONE_VOLUME_CUBIC_METER: f64 = 89.4; // m3
        const BULK_CARGO_ZONE_VOLUME_CUBIC_METER: f64 = 14.3; // m3
        const PRESSURIZED_FUSELAGE_VOLUME_CUBIC_METER: f64 = 330.; // m3
        const CABIN_LEAKAGE_AREA: f64 = 0.0003; // m2
        const OUTFLOW_VALVE_SIZE: f64 = 0.05; // m2
        const SAFETY_VALVE_SIZE: f64 = 0.02; //m2
        const DOOR_OPENING_AREA: f64 = 1.5; // m2
        const HULL_BREACH_AREA: f64 = 0.02; // m2

        const MAX_CLIMB_RATE: f64 = 750.; // fpm
        const MAX_CLIMB_RATE_IN_DESCENT: f64 = 500.; // fpm
        const MAX_DESCENT_RATE: f64 = -750.; // fpm
        const MAX_ABORT_DESCENT_RATE: f64 = -500.; //fpm
        const MAX_TAKEOFF_DELTA_P: f64 = 0.1; // PSI
        const MAX_CLIMB_DELTA_P: f64 = 8.06; // PSI
        const MAX_CLIMB_CABIN_ALTITUDE: f64 = 8050.; // feet
        const MAX_SAFETY_DELTA_P: f64 = 8.1; // PSI
        const MIN_SAFETY_DELTA_P: f64 = -0.5; // PSI
        const TAKEOFF_RATE: f64 = -400.;
        const DEPRESS_RATE: f64 = 500.;
        const EXCESSIVE_ALT_WARNING: f64 = 9550.; // feet
        const EXCESSIVE_RESIDUAL_PRESSURE_WARNING: f64 = 0.03; // PSI
        const LOW_DIFFERENTIAL_PRESSURE_WARNING: f64 = 1.45; // PSI
    }

    struct TestAircraft {
        adirs: TestAdirs,
        air_conditioning_system: TestAirConditioningSystem,
        cpc: CabinPressureController<TestConstants>,
        cabin_air_simulation: CabinAirSimulation<TestConstants, 3>,
        outflow_valve: OutflowValve,
        safety_valve: SafetyValve,
        press_overhead: TestPressurizationOverheadPanel,
        engine_1: TestEngine,
        engine_2: TestEngine,
        lgciu1: TestLgciu,
        lgciu2: TestLgciu,
    }
    impl TestAircraft {
        // Atmospheric constants
        const R: f64 = 287.058; // Specific gas constant for air - m2/s2/K
        const G: f64 = 9.80665; // Gravity - m/s2
        const T_0: f64 = 288.2; // ISA standard temperature - K
        const P_0: f64 = 1013.25; // ISA standard pressure at sea level - hPa
        const L: f64 = -0.00651; // Adiabatic lapse rate - K/m

        fn new(context: &mut InitContext) -> Self {
            let mut test_aircraft = Self {
                adirs: TestAdirs::new(),
                air_conditioning_system: TestAirConditioningSystem::new(),
                cpc: CabinPressureController::new(context, CpcId::Cpc1),
                cabin_air_simulation: CabinAirSimulation::new(
                    context,
                    &[ZoneType::Cockpit, ZoneType::Cabin(1), ZoneType::Cabin(2)],
                ),
                outflow_valve: OutflowValve::new(
                    vec![
                        ElectricalBusType::DirectCurrentEssential,
                        ElectricalBusType::DirectCurrent(2),
                    ],
                    vec![ElectricalBusType::DirectCurrentBattery],
                ),
                safety_valve: SafetyValve::new(),
                press_overhead: TestPressurizationOverheadPanel::new(context),
                engine_1: TestEngine::new(Ratio::default()),
                engine_2: TestEngine::new(Ratio::default()),
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

        fn set_true_airspeed(&mut self, airspeed: Velocity) {
            self.adirs.set_true_airspeed(airspeed);
        }

        fn run_with_vertical_speed_of(&mut self, delta: Duration, vertical_speed: Velocity) {
            let distance: Length = Length::new::<meter>(
                vertical_speed.get::<meter_per_second>() * delta.as_secs_f64(),
            );

            self.set_pressure_based_on_vs(distance);
        }

        fn set_pressure_based_on_vs(&mut self, alt_diff: Length) {
            // We find the atmosferic pressure that would give us the desired v/s
            let init_pressure_ratio: f64 =
                self.adirs.ambient_pressure.get::<hectopascal>() / Self::P_0;

            let init_altitude: Length = Length::new::<meter>(
                ((Self::T_0 / init_pressure_ratio.powf((Self::L * Self::R) / Self::G)) - Self::T_0)
                    / Self::L,
            );
            let final_altitude: Length = init_altitude + alt_diff;
            let final_pressure_ratio: f64 = (1.
                / (final_altitude.get::<meter>() * Self::L / Self::T_0 + 1.))
                .powf(Self::G / (Self::L * Self::R));
            let final_pressure: Pressure =
                Pressure::new::<hectopascal>(final_pressure_ratio * Self::P_0);

            self.adirs.set_ambient_pressure(final_pressure);
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

            self.cabin_air_simulation.update(
                context,
                &self.air_conditioning_system,
                self.outflow_valve.open_amount(),
                self.safety_valve.open_amount(),
                lgciu_gears_compressed,
                [2, 50, 50],
                0,
            );
            self.cpc.update_ambient_conditions(context, &self.adirs);
            self.cpc.update(
                context,
                &self.adirs,
                [&self.engine_1, &self.engine_2],
                lgciu_gears_compressed,
                &self.press_overhead,
                &self.cabin_air_simulation,
                vec![&self.outflow_valve],
                &self.safety_valve,
                true,
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

    struct CabinPressureControllerTestBed {
        test_bed: SimulationTestBed<TestAircraft>,
        vertical_speed: Velocity,
    }
    impl CabinPressureControllerTestBed {
        fn new() -> Self {
            Self {
                test_bed: SimulationTestBed::new(TestAircraft::new),
                vertical_speed: Velocity::default(),
            }
        }

        fn run_with_vertical_speed(&mut self) {
            // Run with a 10 seconds delta to allow the low pass filter to reach desired V/S
            self.run_with_delta_of(Duration::from_secs(10));
        }

        fn run_with_delta_of(&mut self, delta: Duration) {
            let vertical_speed = self.vertical_speed;
            self.command(|a| a.run_with_vertical_speed_of(delta, vertical_speed));
            self.run_with_delta(delta);
        }

        fn set_vertical_speed(&mut self, vertical_speed: Velocity) {
            self.vertical_speed = vertical_speed;
        }
    }
    impl TestBed for CabinPressureControllerTestBed {
        type Aircraft = TestAircraft;

        fn test_bed(&self) -> &SimulationTestBed<TestAircraft> {
            &self.test_bed
        }

        fn test_bed_mut(&mut self) -> &mut SimulationTestBed<TestAircraft> {
            &mut self.test_bed
        }
    }
    fn test_bed() -> CabinPressureControllerTestBed {
        CabinPressureControllerTestBed::new()
    }

    #[test]
    fn schedule_starts_on_ground() {
        let test_bed = test_bed();

        assert!(test_bed.query(|a| a.is_ground()));
    }

    #[test]
    fn schedule_changes_from_ground_to_takeoff() {
        let mut test_bed = test_bed();

        test_bed.command(|a| a.set_engine_n1(Ratio::new::<percent>(95.)));

        test_bed.command(|a| a.set_on_ground(true));
        test_bed.command(|a| a.set_true_airspeed(Velocity::default()));

        test_bed.run();

        assert!(test_bed.query(|a| a.is_takeoff()));
    }

    #[test]
    fn schedule_changes_from_ground_to_climb() {
        let mut test_bed = test_bed();

        test_bed.command(|a| a.set_on_ground(true));
        test_bed.command(|a| a.set_true_airspeed(Velocity::new::<knot>(101.)));

        test_bed.run();

        test_bed.command(|a| a.set_on_ground(false));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_climb()));
    }

    #[test]
    fn schedule_changes_from_takeoff_to_climb() {
        let mut test_bed = test_bed();

        test_bed.command(|a| a.set_engine_n1(Ratio::new::<percent>(95.)));

        test_bed.command(|a| a.set_on_ground(true));
        test_bed.command(|a| a.set_true_airspeed(Velocity::default()));
        test_bed.run();

        test_bed.command(|a| a.set_on_ground(false));
        test_bed.command(|a| a.set_true_airspeed(Velocity::new::<knot>(101.)));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_climb()));
    }

    #[test]
    fn schedule_changes_from_takeoff_to_ground() {
        let mut test_bed = test_bed();

        test_bed.command(|a| a.set_engine_n1(Ratio::new::<percent>(95.)));
        test_bed.command(|a| a.set_on_ground(true));
        test_bed.command(|a| a.set_true_airspeed(Velocity::default()));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_takeoff()));

        test_bed.command(|a| a.set_engine_n1(Ratio::new::<percent>(50.)));
        test_bed.command(|a| a.set_on_ground(true));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_ground()));
    }

    #[test]
    fn schedule_does_not_instantly_change_from_climb_to_abort() {
        let mut test_bed = test_bed();
        test_bed.command(|a| a.set_true_airspeed(Velocity::new::<knot>(101.)));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_climb()));

        test_bed.set_indicated_altitude(Length::new::<foot>(7900.));
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-210.));
        test_bed.run_with_vertical_speed();

        assert!(test_bed.query(|a| a.is_climb()));
    }

    #[test]
    fn schedule_changes_from_climb_to_abort() {
        let mut test_bed = test_bed();
        test_bed.command(|a| a.set_true_airspeed(Velocity::new::<knot>(101.)));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_climb()));

        test_bed.set_indicated_altitude(Length::new::<foot>(7900.));
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-210.));
        test_bed.run_with_delta_of(Duration::from_secs(31));
        test_bed.run_with_vertical_speed();

        assert!(test_bed.query(|a| a.is_abort()));
    }

    #[test]
    fn schedule_does_not_instantly_change_from_climb_to_cruise() {
        let mut test_bed = test_bed();
        test_bed.command(|a| a.set_true_airspeed(Velocity::new::<knot>(101.)));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_climb()));

        test_bed.set_indicated_altitude(Length::new::<foot>(7900.));
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(99.));
        test_bed.run_with_vertical_speed();

        assert!(test_bed.query(|a| a.is_climb()));
    }

    #[test]
    fn schedule_changes_from_climb_to_cruise() {
        let mut test_bed = test_bed();
        test_bed.command(|a| a.set_true_airspeed(Velocity::new::<knot>(101.)));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_climb()));

        test_bed.set_indicated_altitude(Length::new::<foot>(7900.));
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(99.));
        test_bed.run_with_delta_of(Duration::from_secs(31));
        test_bed.run_with_vertical_speed();

        assert!(test_bed.query(|a| a.is_cruise()));
    }

    #[test]
    fn schedule_does_not_instantly_change_from_cruise_to_climb_and_descent() {
        let mut test_bed = test_bed();
        test_bed.command(|a| a.set_true_airspeed(Velocity::new::<knot>(101.)));
        test_bed.run();
        test_bed.run_with_delta_of(Duration::from_secs(31));
        test_bed.run_with_delta_of(Duration::from_secs(1));

        assert!(test_bed.query(|a| a.is_cruise()));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(260.));
        test_bed.run_with_vertical_speed();

        assert!(test_bed.query(|a| a.is_cruise()));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-260.));
        test_bed.run_with_vertical_speed();

        assert!(test_bed.query(|a| a.is_cruise()));
    }

    #[test]
    fn schedule_changes_from_cruise_to_climb() {
        let mut test_bed = test_bed();
        test_bed.command(|a| a.set_true_airspeed(Velocity::new::<knot>(101.)));
        test_bed.run();
        test_bed.run_with_delta_of(Duration::from_secs(31));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_cruise()));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(260.));
        test_bed.run_with_delta_of(Duration::from_secs(61));
        test_bed.run_with_vertical_speed();

        assert!(test_bed.query(|a| a.is_climb()));
    }

    #[test]
    fn schedule_changes_from_cruise_to_descent() {
        let mut test_bed = test_bed();
        test_bed.command(|a| a.set_true_airspeed(Velocity::new::<knot>(101.)));
        test_bed.run();
        test_bed.run_with_delta_of(Duration::from_secs(31));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_cruise()));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-260.));
        test_bed.run_with_delta_of(Duration::from_secs(31));
        test_bed.run_with_vertical_speed();

        assert!(test_bed.query(|a| a.is_descent()));
    }

    #[test]
    fn schedule_changes_from_descent_to_climb() {
        let mut test_bed = test_bed();
        test_bed.command(|a| a.set_true_airspeed(Velocity::new::<knot>(101.)));
        test_bed.run();
        test_bed.run_with_delta_of(Duration::from_secs(31));
        test_bed.run();

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-260.));
        test_bed.run_with_delta_of(Duration::from_secs(31));
        test_bed.run_with_vertical_speed();

        assert!(test_bed.query(|a| a.is_descent()));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(260.));
        test_bed.run_with_delta_of(Duration::from_secs(61));
        test_bed.run_with_vertical_speed();

        assert!(test_bed.query(|a| a.is_climb()));
    }

    #[test]
    fn schedule_changes_from_descent_to_ground() {
        let mut test_bed = test_bed();
        test_bed.command(|a| a.set_true_airspeed(Velocity::new::<knot>(101.)));
        test_bed.run();
        test_bed.run_with_delta_of(Duration::from_secs(31));
        test_bed.run();

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-260.));
        test_bed.run_with_delta_of(Duration::from_secs(31));
        test_bed.run_with_vertical_speed();

        assert!(test_bed.query(|a| a.is_descent()));

        test_bed.command(|a| a.set_true_airspeed(Velocity::new::<knot>(99.)));
        test_bed.command(|a| a.set_on_ground(true));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_ground()));
    }

    #[test]
    fn schedule_changes_from_abort_to_climb() {
        let mut test_bed = test_bed();
        test_bed.command(|a| a.set_true_airspeed(Velocity::new::<knot>(101.)));
        test_bed.set_indicated_altitude(Length::new::<foot>(7900.));
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-210.));
        test_bed.run_with_vertical_speed();
        test_bed.run_with_delta_of(Duration::from_secs(31));
        test_bed.run_with_vertical_speed();

        assert!(test_bed.query(|a| a.is_abort()));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(31.));
        test_bed.run_with_delta_of(Duration::from_secs(61));
        test_bed.run_with_vertical_speed();

        assert!(test_bed.query(|a| a.is_climb()));
    }

    #[test]
    fn schedule_changes_from_abort_to_ground() {
        let mut test_bed = test_bed();
        test_bed.command(|a| a.set_true_airspeed(Velocity::new::<knot>(101.)));
        test_bed.set_indicated_altitude(Length::new::<foot>(7900.));
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-210.));
        test_bed.run_with_vertical_speed();
        test_bed.run_with_delta_of(Duration::from_secs(31));
        test_bed.run_with_vertical_speed();

        assert!(test_bed.query(|a| a.is_abort()));

        test_bed.command(|a| a.set_true_airspeed(Velocity::new::<knot>(99.)));
        test_bed.command(|a| a.set_on_ground(true));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_ground()));
    }

    #[test]
    fn schedule_timer_resets_after_climb_condition_is_not_met() {
        let mut test_bed = test_bed();
        test_bed.command(|a| a.set_true_airspeed(Velocity::new::<knot>(101.)));
        test_bed.run();
        assert!(test_bed.query(|a| a.is_climb()));

        test_bed.set_indicated_altitude(Length::new::<foot>(7900.));
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(99.));
        test_bed.run_with_delta_of(Duration::from_secs(10));
        test_bed.run_with_vertical_speed();

        assert!(test_bed.query(|a| a.is_climb()));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(200.));
        test_bed.run_with_vertical_speed();
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(99.));
        test_bed.run_with_delta_of(Duration::from_secs(25));
        test_bed.run_with_vertical_speed();

        assert!(test_bed.query(|a| a.is_climb()));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(200.));
        test_bed.run_with_vertical_speed();
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(99.));
        test_bed.run_with_delta_of(Duration::from_secs(31));
        test_bed.run_with_vertical_speed();

        assert!(test_bed.query(|a| a.is_cruise()));
    }

    #[test]
    fn schedule_timer_resets_after_cruise_condition_is_not_met() {
        let mut test_bed = test_bed();
        test_bed.command(|a| a.set_true_airspeed(Velocity::new::<knot>(101.)));
        test_bed.run();
        test_bed.run_with_delta_of(Duration::from_secs(31));
        test_bed.run();

        assert!(test_bed.query(|a| a.is_cruise()));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-260.));
        test_bed.run_with_delta_of(Duration::from_secs(25));
        test_bed.run_with_vertical_speed();

        assert!(test_bed.query(|a| a.is_cruise()));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-10.));
        test_bed.run_with_vertical_speed();
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-260.));
        test_bed.run_with_delta_of(Duration::from_secs(25));
        test_bed.run_with_vertical_speed();

        assert!(test_bed.query(|a| a.is_cruise()));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-10.));
        test_bed.run_with_vertical_speed();
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-260.));
        test_bed.run_with_delta_of(Duration::from_secs(31));
        test_bed.run_with_vertical_speed();

        assert!(test_bed.query(|a| a.is_descent()));
    }

    #[test]
    fn schedule_timer_resets_after_descent_condition_is_not_met() {
        let mut test_bed = test_bed();
        test_bed.command(|a| a.set_true_airspeed(Velocity::new::<knot>(101.)));
        test_bed.run();
        test_bed.run_with_delta_of(Duration::from_secs(31));
        test_bed.run();

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-260.));
        test_bed.run_with_delta_of(Duration::from_secs(31));
        test_bed.run_with_vertical_speed();

        assert!(test_bed.query(|a| a.is_descent()));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(240.));
        test_bed.run_with_vertical_speed();
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(260.));
        test_bed.run_with_delta_of(Duration::from_secs(31));
        test_bed.run_with_vertical_speed();

        assert!(test_bed.query(|a| a.is_descent()));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(240.));
        test_bed.run_with_vertical_speed();
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(260.));
        test_bed.run_with_delta_of(Duration::from_secs(31));
        test_bed.run_with_vertical_speed();

        assert!(test_bed.query(|a| a.is_descent()));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(240.));
        test_bed.run_with_vertical_speed();
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(260.));
        test_bed.run_with_delta_of(Duration::from_secs(61));
        test_bed.run_with_vertical_speed();

        assert!(test_bed.query(|a| a.is_climb()));
    }

    #[test]
    fn schedule_timer_resets_after_abort_condition_is_not_met() {
        let mut test_bed = test_bed();
        test_bed.command(|a| a.set_true_airspeed(Velocity::new::<knot>(101.)));
        test_bed.set_indicated_altitude(Length::new::<foot>(7900.));
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-210.));
        test_bed.run_with_vertical_speed();
        test_bed.run_with_delta_of(Duration::from_secs(31));
        test_bed.run_with_vertical_speed();

        assert!(test_bed.query(|a| a.is_abort()));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(31.));
        test_bed.run_with_delta_of(Duration::from_secs(31));
        test_bed.run_with_vertical_speed();

        assert!(test_bed.query(|a| a.is_abort()));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(29.));
        test_bed.run_with_vertical_speed();
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(31.));
        test_bed.run_with_delta_of(Duration::from_secs(31));
        test_bed.run_with_vertical_speed();

        assert!(test_bed.query(|a| a.is_abort()));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(29.));
        test_bed.run_with_vertical_speed();
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(31.));
        test_bed.run_with_delta_of(Duration::from_secs(61));
        test_bed.run_with_vertical_speed();

        assert!(test_bed.query(|a| a.is_climb()));
    }
}
