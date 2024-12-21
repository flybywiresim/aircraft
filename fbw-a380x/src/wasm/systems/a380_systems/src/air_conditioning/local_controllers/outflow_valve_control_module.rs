use systems::{
    air_conditioning::{
        cabin_pressure_controller::OutflowValveController, pressure_valve::OutflowValve,
        AdirsToAirCondInterface, Air, Channel, OcsmId, OperatingChannel, PressurizationConstants,
        PressurizationOverheadShared,
    },
    failures::{Failure, FailureType},
    shared::{
        low_pass_filter::LowPassFilter, CabinSimulation, ElectricalBusType,
        InternationalStandardAtmosphere,
    },
    simulation::{
        InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
        VariableIdentifier, Write,
    },
};

use std::time::Duration;

use uom::si::{
    f64::*,
    length::{foot, meter},
    pressure::{hectopascal, psi},
    ratio::ratio,
    velocity::foot_per_minute,
};

use crate::air_conditioning::A380PressurizationConstants;

pub trait CpcsShared {
    fn cabin_vertical_speed(&self) -> Velocity;
    fn cabin_target_vertical_speed(&self) -> Option<Velocity>;
    fn ofv_open_allowed(&self) -> bool;
    fn should_open_ofv(&self) -> bool;
    fn should_close_aft_ofv(&self) -> bool;
}

pub trait OcsmShared {
    fn cabin_pressure(&self) -> Pressure;
    fn cabin_target_vertical_speed(&self) -> Velocity;
    fn cabin_target_altitude(&self) -> Option<Length>;
    fn cabin_delta_pressure(&self) -> Pressure;
    fn outflow_valve_open_amount(&self) -> Ratio;
    fn overpressure_relief_valve_inhibit(&self) -> bool;
}

enum OcsmFault {
    OneChannelFault,
    BothChannelsFault,
}

pub struct OutflowValveControlModule {
    ocsm_id: OcsmId,

    ocsm_channel_1_failure_id: VariableIdentifier,
    ocsm_channel_2_failure_id: VariableIdentifier,
    ocsm_auto_partition_failure_id: VariableIdentifier,

    active_channel: OperatingChannel,
    stand_by_channel: OperatingChannel,
    acp: AutomaticControlPartition,
    sop: SafetyAndOverridePartition,
    epp: EmergencyPressurizationPartition,
    outflow_valve: OutflowValve,
    fault: Option<OcsmFault>,
}

impl OutflowValveControlModule {
    pub fn new(
        context: &mut InitContext,
        outflow_valve_id: OcsmId,
        powered_by: [ElectricalBusType; 2],
    ) -> Self {
        Self {
            ocsm_id: outflow_valve_id,

            ocsm_channel_1_failure_id: context
                .get_identifier(format!("PRESS_OCSM_{}_CHANNEL_1_FAILURE", outflow_valve_id)),
            ocsm_channel_2_failure_id: context
                .get_identifier(format!("PRESS_OCSM_{}_CHANNEL_2_FAILURE", outflow_valve_id)),
            ocsm_auto_partition_failure_id: context.get_identifier(format!(
                "PRESS_OCSM_{}_AUTO_PARTITION_FAILURE",
                outflow_valve_id
            )),

            active_channel: OperatingChannel::new(
                1,
                Some(FailureType::Ocsm(outflow_valve_id, Channel::ChannelOne)),
                &powered_by[0..1],
            ),
            stand_by_channel: OperatingChannel::new(
                2,
                Some(FailureType::Ocsm(outflow_valve_id, Channel::ChannelTwo)),
                &powered_by[1..2],
            ),
            acp: AutomaticControlPartition::new(outflow_valve_id),
            sop: SafetyAndOverridePartition::new(),
            epp: EmergencyPressurizationPartition::new(context, outflow_valve_id),
            outflow_valve: OutflowValve::new(
                powered_by.to_vec(),
                vec![ElectricalBusType::DirectCurrentBattery],
            ),
            fault: None,
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        adirs: &impl AdirsToAirCondInterface,
        cabin_simulation: &impl CabinSimulation,
        cpiom_b: &impl CpcsShared,
        cpiom_b_failure: bool,
        first_operating_ocsm: Option<usize>,
        ocsm_cross_communication: Option<Velocity>,
        press_overhead: &impl PressurizationOverheadShared,
        safety_valve_open_amount: Ratio,
    ) {
        self.fault_determination();

        self.acp
            .update(cpiom_b, cpiom_b_failure, ocsm_cross_communication);

        self.sop.update(self.epp.cabin_pressure(), press_overhead);

        self.epp.update(
            context,
            adirs,
            cabin_simulation,
            cpiom_b.cabin_vertical_speed(),
            self.sop
                .manual_target_vertical_speed()
                .or_else(|| self.acp.auto_vertical_speed()),
            press_overhead,
            cpiom_b.ofv_open_allowed()
                && !self.acp.should_close_ofv()
                && !matches!(&self.fault, Some(OcsmFault::BothChannelsFault)),
            self.outflow_valve_open_amount(),
            safety_valve_open_amount,
            cpiom_b.should_open_ofv(),
            Some(self.ocsm_id.index()) == first_operating_ocsm,
        );

        self.outflow_valve
            .update(context, self.epp.outflow_valve_controller(), false);
    }

    fn fault_determination(&mut self) {
        self.active_channel.update_fault();
        self.stand_by_channel.update_fault();

        self.fault = match (
            self.active_channel.has_fault(),
            self.stand_by_channel.has_fault(),
        ) {
            (true, true) => Some(OcsmFault::BothChannelsFault),
            (false, false) => None,
            (ac, _) => {
                if ac {
                    self.switch_active_channel();
                }
                Some(OcsmFault::OneChannelFault)
            }
        };
    }

    fn switch_active_channel(&mut self) {
        std::mem::swap(&mut self.stand_by_channel, &mut self.active_channel);
    }

    /// The OCSM can cross-communicate via an RS-422 bus (here we just use data)
    pub fn auto_cabin_vertical_speed_demand(&self) -> Option<Velocity> {
        self.acp.auto_vertical_speed()
    }

    pub fn has_failed(&self) -> bool {
        matches!(self.fault, Some(OcsmFault::BothChannelsFault))
    }
}

impl OcsmShared for OutflowValveControlModule {
    fn cabin_pressure(&self) -> Pressure {
        self.epp.cabin_pressure()
    }
    fn cabin_target_vertical_speed(&self) -> Velocity {
        self.epp.cabin_target_vertical_speed()
    }
    fn cabin_target_altitude(&self) -> Option<Length> {
        self.sop.manual_cabin_target_altitude()
    }
    fn cabin_delta_pressure(&self) -> Pressure {
        self.epp.differential_pressure()
    }
    fn outflow_valve_open_amount(&self) -> Ratio {
        self.outflow_valve.open_amount()
    }
    fn overpressure_relief_valve_inhibit(&self) -> bool {
        false //Fixme
    }
}

impl SimulationElement for OutflowValveControlModule {
    fn write(&self, writer: &mut SimulatorWriter) {
        let (channel_1_failure, channel_2_failure) = match self.fault {
            None => (false, false),
            Some(OcsmFault::OneChannelFault) => (
                self.stand_by_channel.id() == Channel::ChannelOne,
                self.stand_by_channel.id() == Channel::ChannelTwo,
            ),
            Some(OcsmFault::BothChannelsFault) => (true, true),
        };
        writer.write(&self.ocsm_channel_1_failure_id, channel_1_failure);
        writer.write(&self.ocsm_channel_2_failure_id, channel_2_failure);
        writer.write(
            &self.ocsm_auto_partition_failure_id,
            self.acp.auto_failure(),
        );
    }

    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.active_channel.accept(visitor);
        self.stand_by_channel.accept(visitor);
        self.outflow_valve.accept(visitor);
        self.acp.accept(visitor);
        self.epp.accept(visitor);

        visitor.visit(self);
    }
}

struct AutomaticControlPartition {
    outflow_valve_id: OcsmId,
    cabin_target_vertical_speed: Option<Velocity>,
    should_close_ofv: bool,

    failure: Failure,
}

impl AutomaticControlPartition {
    fn new(outflow_valve_id: OcsmId) -> Self {
        Self {
            outflow_valve_id,
            cabin_target_vertical_speed: None,
            should_close_ofv: false,

            failure: Failure::new(FailureType::OcsmAutoPartition(outflow_valve_id)),
        }
    }

    fn update(
        &mut self,
        cpiom_b: &impl CpcsShared,
        cpiom_b_failure: bool,
        ocsm_cross_communication: Option<Velocity>,
    ) {
        // If the auto pressurization fails we take the cross communication target (or None if all failed)
        self.cabin_target_vertical_speed = if self.failure.is_active() || cpiom_b_failure {
            ocsm_cross_communication
        } else {
            // Here we take the target vertical speed if we have it, or else the first available from the other OCSMs
            cpiom_b
                .cabin_target_vertical_speed()
                .or(ocsm_cross_communication)
        };
        self.should_close_ofv = (self.outflow_valve_id == OcsmId::Three
            || self.outflow_valve_id == OcsmId::Four)
            && cpiom_b.should_close_aft_ofv();
    }

    fn auto_vertical_speed(&self) -> Option<Velocity> {
        self.cabin_target_vertical_speed
    }

    fn should_close_ofv(&self) -> bool {
        self.should_close_ofv
    }

    fn auto_failure(&self) -> bool {
        self.failure.is_active()
    }
}

impl SimulationElement for AutomaticControlPartition {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.failure.accept(visitor);

        visitor.visit(self);
    }
}

struct SafetyAndOverridePartition {
    override_cabin_target_vertical_speed: Option<Velocity>,

    cabin_altitude: Length,
    is_alt_man_sel: bool,
    is_vs_man_sel: bool,
    selected_altitude: Length,
}

impl SafetyAndOverridePartition {
    const DEFAULT_CLIMB_VS: f64 = 500.;
    const DEFAULT_DESCENT_VS: f64 = -300.;

    fn new() -> Self {
        Self {
            override_cabin_target_vertical_speed: None,

            cabin_altitude: Length::default(),
            is_alt_man_sel: false,
            is_vs_man_sel: false,
            selected_altitude: Length::default(),
        }
    }

    fn update(
        &mut self,
        cabin_pressure: Pressure,
        pressurization_overhead: &impl PressurizationOverheadShared,
    ) {
        self.cabin_altitude =
            InternationalStandardAtmosphere::altitude_from_pressure(cabin_pressure);

        self.selected_altitude = pressurization_overhead.alt_knob_value();
        self.is_alt_man_sel = pressurization_overhead.is_alt_man_sel();
        self.is_vs_man_sel = pressurization_overhead.is_vs_man_sel();

        self.override_cabin_target_vertical_speed =
            self.target_vertical_speed_determination(self.cabin_altitude, pressurization_overhead);
    }

    fn target_vertical_speed_determination(
        &self,
        cabin_altitude: Length,
        pressurization_overhead: &impl PressurizationOverheadShared,
    ) -> Option<Velocity> {
        if !self.is_alt_man_sel {
            if !self.is_vs_man_sel {
                None
            } else {
                Some(pressurization_overhead.vs_knob_value())
            }
        } else {
            let base_vertical_speed = if self.is_vs_man_sel {
                pressurization_overhead.vs_knob_value()
            } else if cabin_altitude < pressurization_overhead.alt_knob_value() {
                Velocity::new::<foot_per_minute>(Self::DEFAULT_CLIMB_VS)
            } else if cabin_altitude > pressurization_overhead.alt_knob_value() {
                Velocity::new::<foot_per_minute>(Self::DEFAULT_DESCENT_VS)
            } else {
                Velocity::default()
            };

            let target_vs = if cabin_altitude < pressurization_overhead.alt_knob_value() {
                base_vertical_speed
                    .get::<foot_per_minute>()
                    .min((pressurization_overhead.alt_knob_value() - cabin_altitude).get::<foot>())
            } else if cabin_altitude > pressurization_overhead.alt_knob_value() {
                base_vertical_speed
                    .get::<foot_per_minute>()
                    .max((pressurization_overhead.alt_knob_value() - cabin_altitude).get::<foot>())
            } else {
                0.
            };
            Some(Velocity::new::<foot_per_minute>(target_vs))
        }
    }

    fn manual_target_vertical_speed(&self) -> Option<Velocity> {
        self.override_cabin_target_vertical_speed
    }

    fn manual_cabin_target_altitude(&self) -> Option<Length> {
        if self.is_alt_man_sel {
            Some(self.selected_altitude)
        } else {
            None
        }
    }
}

struct EmergencyPressurizationPartition {
    cabin_pressure: Pressure,
    cabin_target_vertical_speed: Velocity,
    exterior_flight_altitude: Length,
    exterior_pressure: LowPassFilter<Pressure>,
    exterior_vertical_speed: LowPassFilter<Velocity>,
    differential_pressure: Pressure,
    is_initialised: bool,
    epp_emergency_signals: EppEmergencySignals,

    outflow_valve_controller: OutflowValveController,
    safety_valve_open_amount: Ratio,
}

impl EmergencyPressurizationPartition {
    const AMBIENT_CONDITIONS_FILTER_TIME_CONSTANT: Duration = Duration::from_millis(2000);
    const OFV_CONTROLLER_KP: f64 = 1.2;
    const OFV_CONTROLLER_KI: f64 = 3.;
    // Altitude in ft equivalent to 0.1 PSI delta P at sea level
    const TARGET_LANDING_ALT_DIFF: f64 = 187.818;
    const BACKUP_LANDING_ELEVATION_FT: f64 = 7000.;

    fn new(context: &mut InitContext, outflow_valve_id: OcsmId) -> Self {
        Self {
            cabin_pressure: Pressure::new::<hectopascal>(Air::P_0),
            cabin_target_vertical_speed: Velocity::default(),
            exterior_flight_altitude: Length::default(),
            exterior_pressure: LowPassFilter::new_with_init_value(
                Self::AMBIENT_CONDITIONS_FILTER_TIME_CONSTANT,
                Pressure::new::<hectopascal>(Air::P_0),
            ),
            exterior_vertical_speed: LowPassFilter::new_with_init_value(
                Self::AMBIENT_CONDITIONS_FILTER_TIME_CONSTANT,
                Velocity::default(),
            ),
            differential_pressure: Pressure::default(),
            is_initialised: false,
            epp_emergency_signals: EppEmergencySignals::new(context, outflow_valve_id),

            outflow_valve_controller: OutflowValveController::new(
                Self::OFV_CONTROLLER_KP,
                Self::OFV_CONTROLLER_KI,
            ),
            safety_valve_open_amount: Ratio::default(),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        adirs: &impl AdirsToAirCondInterface,
        cabin_simulation: &impl CabinSimulation,
        cabin_vertical_speed: Velocity,
        cabin_target_vs: Option<Velocity>,
        press_overhead: &impl PressurizationOverheadShared,
        open_allowed: bool,
        outflow_valve_open_amount: Ratio,
        safety_valve_open_amount: Ratio,
        should_open_ofv: bool,
        should_transmit_emergency_signals: bool,
    ) {
        self.update_ambient_conditions(context, adirs);
        self.cabin_pressure = cabin_simulation.cabin_pressure();
        self.cabin_target_vertical_speed =
            self.emergency_control_cabin_vs(cabin_target_vs, cabin_vertical_speed);
        self.differential_pressure = self.differential_pressure_calculation();
        self.safety_valve_open_amount = safety_valve_open_amount;
        let cabin_altitude_protection = !self.emergency_cabin_altitude(self.cabin_pressure);
        self.outflow_valve_controller.update(
            context,
            cabin_vertical_speed,
            self.cabin_target_vertical_speed,
            press_overhead,
            open_allowed && cabin_altitude_protection,
            should_open_ofv,
        );

        let manual_cabin_altitude =
            InternationalStandardAtmosphere::altitude_from_pressure(self.cabin_pressure);
        self.epp_emergency_signals.update(
            manual_cabin_altitude,
            self.differential_pressure,
            cabin_vertical_speed,
            manual_cabin_altitude > Length::new::<foot>(9550.),
            outflow_valve_open_amount,
            should_transmit_emergency_signals,
        );
    }

    pub fn update_ambient_conditions(
        &mut self,
        context: &UpdateContext,
        adirs: &impl AdirsToAirCondInterface,
    ) {
        let (_, adirs_ambient_pressure) = self.adirs_values_calculation(adirs);

        self.exterior_flight_altitude = if !self.is_initialised {
            self.exterior_pressure
                .reset(adirs_ambient_pressure.unwrap_or(Pressure::new::<hectopascal>(Air::P_0)));
            self.is_initialised = true;
            self.calculate_altitude(
                self.exterior_pressure.output(),
                Pressure::new::<hectopascal>(Air::P_0),
            )
        } else {
            self.exterior_pressure.update(
                context.delta(),
                adirs_ambient_pressure.unwrap_or(Pressure::new::<hectopascal>(Air::P_0)),
            );

            let new_exterior_altitude = self.calculate_altitude(
                self.exterior_pressure.output(),
                Pressure::new::<hectopascal>(Air::P_0),
            );
            self.exterior_vertical_speed.update(
                context.delta(),
                self.calculate_exterior_vertical_speed(context, new_exterior_altitude),
            );
            new_exterior_altitude
        }
    }

    fn adirs_values_calculation(
        &self,
        adirs: &impl AdirsToAirCondInterface,
    ) -> (Option<Velocity>, Option<Pressure>) {
        // TODO: Confirm order for checking the ADIRS
        let adiru_check_order = [1, 2, 3];
        let adirs_airspeed = adiru_check_order
            .iter()
            .find_map(|&adiru_number| adirs.true_airspeed(adiru_number).normal_value());
        let adirs_ambient_pressure = adiru_check_order
            .iter()
            .find_map(|&adiru_number| adirs.ambient_static_pressure(adiru_number).normal_value());
        (adirs_airspeed, adirs_ambient_pressure)
    }

    fn calculate_exterior_vertical_speed(
        &self,
        context: &UpdateContext,
        new_altitude: Length,
    ) -> Velocity {
        (new_altitude - self.exterior_flight_altitude) / context.delta_as_time()
    }

    /// Calculation of altidude based on a pressure and reference pressure
    /// This uses the hydrostatic equation with linear temp changes and constant R, g
    fn calculate_altitude(&self, pressure: Pressure, reference_pressure: Pressure) -> Length {
        let pressure_ratio = (pressure / reference_pressure).get::<ratio>();
        // Hydrostatic equation with linear temp changes and constant R, g
        let altitude =
            ((Air::T_0 / pressure_ratio.powf((Air::L * Air::R) / Air::G)) - Air::T_0) / Air::L;
        Length::new::<meter>(altitude)
    }

    fn emergency_control_cabin_vs(
        &self,
        cabin_target_vs: Option<Velocity>,
        cabin_vertical_speed: Velocity,
    ) -> Velocity {
        let emergency_vertical_speed = self.emergency_vertical_speed_determination();
        let target_vs = cabin_target_vs.unwrap_or(emergency_vertical_speed);
        if self.differential_pressure.get::<psi>()
            > A380PressurizationConstants::MAX_SAFETY_DELTA_P - 0.2
        {
            if self.differential_pressure.get::<psi>()
                > A380PressurizationConstants::MAX_SAFETY_DELTA_P
                || cabin_vertical_speed > Velocity::new::<foot_per_minute>(200.)
            {
                Velocity::new::<foot_per_minute>(6400.)
            } else {
                target_vs
            }
        } else {
            target_vs
        }
    }

    /// The safety partition acts in back up mode if the auto partition fails
    fn emergency_vertical_speed_determination(&self) -> Velocity {
        const TARGET_VELOCITY_FACTOR: f64 = 1.04651e-5; // Linear factor based on references

        // Using the same constant as the CPIOM B
        if self.exterior_vertical_speed.output() >= Velocity::default() {
            Velocity::new::<foot_per_minute>(
                self.exterior_vertical_speed
                    .output()
                    .get::<foot_per_minute>()
                    * self.exterior_flight_altitude.get::<foot>()
                    * TARGET_VELOCITY_FACTOR,
            )
        } else {
            let ext_diff_with_ldg_elev = self.get_ext_diff_with_ldg_elev();
            let target_vs = self.get_int_diff_with_ldg_elev()
                * self.exterior_vertical_speed.output()
                / ext_diff_with_ldg_elev;
            if ext_diff_with_ldg_elev <= Length::default() {
                Velocity::default()
            } else {
                target_vs
            }
        }
    }

    fn get_ext_diff_with_ldg_elev(&self) -> Length {
        self.exterior_flight_altitude
            - Length::new::<foot>(Self::BACKUP_LANDING_ELEVATION_FT - Self::TARGET_LANDING_ALT_DIFF)
    }

    fn get_int_diff_with_ldg_elev(&self) -> Length {
        InternationalStandardAtmosphere::altitude_from_pressure(self.cabin_pressure)
            - Length::new::<foot>(Self::BACKUP_LANDING_ELEVATION_FT - Self::TARGET_LANDING_ALT_DIFF)
    }

    fn emergency_cabin_altitude(&self, cabin_pressure: Pressure) -> bool {
        InternationalStandardAtmosphere::altitude_from_pressure(cabin_pressure)
            > Length::new::<foot>(22000.)
    }

    fn differential_pressure_calculation(&self) -> Pressure {
        self.cabin_pressure - self.exterior_pressure.output()
    }

    fn cabin_pressure(&self) -> Pressure {
        self.cabin_pressure
    }

    fn cabin_target_vertical_speed(&self) -> Velocity {
        self.cabin_target_vertical_speed
    }

    fn differential_pressure(&self) -> Pressure {
        self.differential_pressure
    }

    fn outflow_valve_controller(&self) -> &OutflowValveController {
        &self.outflow_valve_controller
    }
}

impl SimulationElement for EmergencyPressurizationPartition {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.epp_emergency_signals.accept(visitor);

        visitor.visit(self);
    }
}

/// The Emergency Partition transmits cabin pressure, vertical speed, OFV open amount
/// and the signal for excessive cabin altitude in case of system malfunction (ie CPIOM failure).
/// Here we add the cabin altitude and delta pressure to be transmitted as back up signals.
/// Fixme: This struct is probably not 100% accurate to the real system and will need to be improved
/// when other systems are in place.
struct EppEmergencySignals {
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

    // This prevents multiple OCSMs from overriding vars
    should_transmit: bool,
}

impl EppEmergencySignals {
    fn new(context: &mut InitContext, outflow_valve_id: OcsmId) -> Self {
        Self {
            cabin_altitude_man_id: context.get_identifier("PRESS_MAN_CABIN_ALTITUDE".to_owned()),
            cabin_delta_p_man_id: context
                .get_identifier("PRESS_MAN_CABIN_DELTA_PRESSURE".to_owned()),
            cabin_vertical_speed_man_id: context.get_identifier("PRESS_MAN_CABIN_VS".to_owned()),
            fwc_excessive_cabin_altitude_man_id: context
                .get_identifier("PRESS_MAN_EXCESSIVE_CABIN_ALTITUDE".to_owned()),
            outflow_valve_open_amount_man_id: context.get_identifier(format!(
                "PRESS_MAN_OUTFLOW_VALVE_{}_OPEN_PERCENTAGE",
                outflow_valve_id
            )),

            cabin_altitude: Length::default(),
            cabin_delta_p: Pressure::default(),
            cabin_vertical_speed: Velocity::default(),
            fwc_excessive_cabin_altitude: false,
            outflow_valve_open_amount: Ratio::default(),

            should_transmit: false,
        }
    }

    fn update(
        &mut self,
        cabin_altitude: Length,
        cabin_delta_pressure: Pressure,
        cabin_vertical_speed: Velocity,
        fwc_excessive_cabin_altitude: bool,
        outflow_valve_open_amount: Ratio,
        should_transmit: bool,
    ) {
        self.cabin_altitude = cabin_altitude;
        self.cabin_delta_p = cabin_delta_pressure;
        self.cabin_vertical_speed = cabin_vertical_speed;
        self.fwc_excessive_cabin_altitude = fwc_excessive_cabin_altitude;
        self.outflow_valve_open_amount = outflow_valve_open_amount;
        self.should_transmit = should_transmit;
    }
}

impl SimulationElement for EppEmergencySignals {
    fn write(&self, writer: &mut SimulatorWriter) {
        if self.should_transmit {
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
        }
        // We always transmit the outflow valve open amount
        writer.write(
            &self.outflow_valve_open_amount_man_id,
            self.outflow_valve_open_amount,
        );
    }
}
