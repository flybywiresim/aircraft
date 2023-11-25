use super::{
    cabin_pressure_controller::OutflowValveController,
    pressure_valve::{OutflowValve, PressureValveSignal},
    AdirsToAirCondInterface, Air, OperatingChannel, PressurizationOverheadShared,
};

use crate::{
    shared::{
        low_pass_filter::LowPassFilter, CabinSimulation, ControllerSignal, ElectricalBusType,
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
    length::foot,
    pressure::{hectopascal, psi},
    ratio::percent,
    velocity::foot_per_minute,
};

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
    ocsm_channel_failure_id: VariableIdentifier,

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
        outflow_valve_id: usize,
        powered_by: Vec<ElectricalBusType>,
    ) -> Self {
        Self {
            ocsm_channel_failure_id: context
                .get_identifier(format!("PRESS_{}_OCSM_CHANNEL_FAILURE", outflow_valve_id)),

            active_channel: OperatingChannel::new(1, None, &[powered_by[0]]),
            stand_by_channel: OperatingChannel::new(2, None, &[powered_by[1]]),
            acp: AutomaticControlPartition::new(outflow_valve_id),
            sop: SafetyAndOverridePartition::new(),
            epp: EmergencyPressurizationPartition::new(),
            outflow_valve: OutflowValve::new(
                powered_by,
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
        press_overhead: &impl PressurizationOverheadShared,
        safety_valve_open_amount: Ratio,
    ) {
        self.fault_determination();

        self.acp.update(cpiom_b);

        self.sop.update(self.epp.cabin_pressure(), press_overhead);

        self.epp.update(
            context,
            adirs,
            cabin_simulation,
            cpiom_b.cabin_vertical_speed(),
            self.sop
                .manual_target_vertical_speed()
                .unwrap_or_else(|| self.acp.auto_vertical_speed()),
            press_overhead,
            cpiom_b.ofv_open_allowed() && !self.acp.should_close_ofv(),
            cpiom_b.should_open_ofv(),
            safety_valve_open_amount,
        );

        self.outflow_valve
            .update(context, self.epp.outflow_valve_controller(), false);
    }

    fn fault_determination(&mut self) {
        self.fault = match self.active_channel.has_fault() {
            true => {
                if self.stand_by_channel.has_fault() {
                    Some(OcsmFault::BothChannelsFault)
                } else {
                    self.switch_active_channel();
                    Some(OcsmFault::OneChannelFault)
                }
            }
            false => {
                if self.stand_by_channel.has_fault() {
                    Some(OcsmFault::OneChannelFault)
                } else {
                    None
                }
            }
        };
    }

    fn switch_active_channel(&mut self) {
        std::mem::swap(&mut self.stand_by_channel, &mut self.active_channel);
    }

    pub fn negative_relief_valve_trigger(&self) -> &impl ControllerSignal<PressureValveSignal> {
        &self.epp
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
        let failure_count = match self.fault {
            None => 0,
            Some(OcsmFault::OneChannelFault) => self.stand_by_channel.id().into(),
            Some(OcsmFault::BothChannelsFault) => 3,
        };
        writer.write(&self.ocsm_channel_failure_id, failure_count);
    }

    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.active_channel.accept(visitor);
        self.stand_by_channel.accept(visitor);
        self.outflow_valve.accept(visitor);

        visitor.visit(self);
    }
}

struct AutomaticControlPartition {
    outflow_valve_id: usize,
    cabin_target_vertical_speed: Velocity,
    should_close_ofv: bool,
}

impl AutomaticControlPartition {
    fn new(outflow_valve_id: usize) -> Self {
        Self {
            outflow_valve_id,
            cabin_target_vertical_speed: Velocity::default(),
            should_close_ofv: false,
        }
    }

    fn update(&mut self, cpiom_b: &impl CpcsShared) {
        self.cabin_target_vertical_speed =
            cpiom_b.cabin_target_vertical_speed().unwrap_or_default();
        self.should_close_ofv = self.outflow_valve_id > 2 && cpiom_b.should_close_aft_ofv();
    }

    fn auto_vertical_speed(&self) -> Velocity {
        self.cabin_target_vertical_speed
    }

    fn should_close_ofv(&self) -> bool {
        self.should_close_ofv
    }
}

struct SafetyAndOverridePartition {
    cabin_target_vertical_speed: Option<Velocity>,

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
            cabin_target_vertical_speed: None,

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

        self.cabin_target_vertical_speed =
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
        self.cabin_target_vertical_speed
    }

    fn manual_cabin_target_altitude(&self) -> Option<Length> {
        if self.is_alt_man_sel {
            Some(self.selected_altitude)
        } else {
            None
        }
    }
}

/// The Emergency Pressurization Partition (EPP) is responsible for:
/// - The computation of cabin pressure and differential pressure *
/// - The OFV motor computation based on position demands from the ACP and/or SOP *
/// - The protection of positive differential pressure and cabin altitude limits against inadvertent function from the ACP and/or SOP, **
/// - The warnings to the FWS in case of strong system malfunction
/// - The limitation of the maximum negative differential pressure *
struct EmergencyPressurizationPartition {
    cabin_pressure: Pressure,
    cabin_target_vertical_speed: Velocity,
    exterior_pressure: LowPassFilter<Pressure>,
    differential_pressure: Pressure,
    is_initialised: bool,

    outflow_valve_controller: OutflowValveController,
    safety_valve_open_amount: Ratio,
}

impl EmergencyPressurizationPartition {
    const AMBIENT_CONDITIONS_FILTER_TIME_CONSTANT: Duration = Duration::from_millis(2000);
    const OFV_CONTROLLER_KP: f64 = 1.;
    const OFV_CONTROLLER_KI: f64 = 1.;
    const MIN_SAFETY_DELTA_P: f64 = -0.725; // PSI
    const MAX_SAFETY_DELTA_P: f64 = 9.; // PSI

    fn new() -> Self {
        Self {
            cabin_pressure: Pressure::new::<hectopascal>(Air::P_0),
            cabin_target_vertical_speed: Velocity::default(),
            exterior_pressure: LowPassFilter::new_with_init_value(
                Self::AMBIENT_CONDITIONS_FILTER_TIME_CONSTANT,
                Pressure::new::<hectopascal>(Air::P_0),
            ),
            differential_pressure: Pressure::default(),
            is_initialised: false,

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
        cabin_target_vs: Velocity,
        press_overhead: &impl PressurizationOverheadShared,
        open_allowed: bool,
        should_open_ofv: bool,
        safety_valve_open_amount: Ratio,
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
    }

    pub fn update_ambient_conditions(
        &mut self,
        context: &UpdateContext,
        adirs: &impl AdirsToAirCondInterface,
    ) {
        let (_, adirs_ambient_pressure) = self.adirs_values_calculation(adirs);

        if !self.is_initialised {
            self.exterior_pressure.reset(
                adirs_ambient_pressure.unwrap_or_else(|| Pressure::new::<hectopascal>(Air::P_0)),
            );
            self.is_initialised = true;
        } else {
            self.exterior_pressure.update(
                context.delta(),
                adirs_ambient_pressure.unwrap_or_else(|| Pressure::new::<hectopascal>(Air::P_0)),
            );
        }
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

    fn emergency_control_cabin_vs(
        &self,
        cabin_target_vs: Velocity,
        cabin_vertical_speed: Velocity,
    ) -> Velocity {
        if self.differential_pressure > Pressure::new::<psi>(Self::MAX_SAFETY_DELTA_P - 0.2) {
            if self.differential_pressure > Pressure::new::<psi>(Self::MAX_SAFETY_DELTA_P)
                || cabin_vertical_speed > Velocity::new::<foot_per_minute>(200.)
            {
                Velocity::new::<foot_per_minute>(6400.)
            } else {
                cabin_target_vs
            }
        } else {
            cabin_target_vs
        }
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

/// Negative relieve valves signal. This returns a controller signal, but the valves are mechanical assemblies
impl ControllerSignal<PressureValveSignal> for EmergencyPressurizationPartition {
    fn signal(&self) -> Option<PressureValveSignal> {
        let open = Some(PressureValveSignal::Open(
            Ratio::new::<percent>(100.),
            Duration::from_secs(1),
        ));
        let closed = Some(PressureValveSignal::Close(
            Ratio::new::<percent>(0.),
            Duration::from_secs(1),
        ));
        if self.differential_pressure < Pressure::new::<psi>(Self::MIN_SAFETY_DELTA_P + 0.2) {
            if self.differential_pressure < Pressure::new::<psi>(Self::MIN_SAFETY_DELTA_P) {
                open
            } else {
                Some(PressureValveSignal::Neutral)
            }
        } else if self.safety_valve_open_amount > Ratio::new::<percent>(0.) {
            closed
        } else {
            Some(PressureValveSignal::Neutral)
        }
    }
}
