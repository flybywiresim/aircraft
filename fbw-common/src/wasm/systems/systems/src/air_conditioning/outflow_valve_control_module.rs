use super::{
    cabin_pressure_controller::OutflowValveController, pressure_valve::OutflowValve,
    AdirsToAirCondInterface, Air, OperatingChannel, PressurizationOverheadShared,
};

use crate::{
    shared::{low_pass_filter::LowPassFilter, CabinSimulation, ElectricalBusType},
    simulation::{SimulationElement, SimulationElementVisitor, UpdateContext},
};

use std::time::Duration;

use uom::si::{
    f64::*,
    length::{foot, meter},
    pressure::hectopascal,
    ratio::ratio,
    velocity::foot_per_minute,
};

pub trait CpcsShared {
    fn cabin_vertical_speed(&self) -> Velocity;
    fn cabin_target_vertical_speed(&self) -> Option<Velocity>;
    fn ofv_open_allowed(&self) -> bool;
    fn should_open_ofv(&self) -> bool;
}

pub trait OcsmShared {
    fn cabin_pressure(&self) -> Pressure;
    fn cabin_delta_pressure(&self) -> Pressure;
    fn outflow_valve_open_amount(&self) -> Ratio;
}

enum OcsmFault {
    OneChannelFault,
    BothChannelsFault,
}

pub struct OutflowValveControlModule {
    // Write outflow valve open percentage
    active_channel: OperatingChannel,
    stand_by_channel: OperatingChannel,
    acp: AutomaticControlPartition,
    sop: SafetyAndOverridePartition,
    epp: EmergencyPressurizationPartition,
    outflow_valve: OutflowValve,
    fault: Option<OcsmFault>,
}

impl OutflowValveControlModule {
    pub fn new(powered_by: Vec<ElectricalBusType>) -> Self {
        Self {
            active_channel: OperatingChannel::new(1, None, &[powered_by[0]]),
            stand_by_channel: OperatingChannel::new(2, None, &[powered_by[1]]),
            acp: AutomaticControlPartition::new(),
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
    ) {
        self.fault_determination();

        self.acp.update(cpiom_b.cabin_target_vertical_speed());

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
            cpiom_b.ofv_open_allowed(),
            cpiom_b.should_open_ofv(),
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
}

impl OcsmShared for OutflowValveControlModule {
    fn cabin_pressure(&self) -> Pressure {
        self.epp.cabin_pressure()
    }
    fn cabin_delta_pressure(&self) -> Pressure {
        self.epp.differential_pressure()
    }
    fn outflow_valve_open_amount(&self) -> Ratio {
        self.outflow_valve.open_amount()
    }
}

impl SimulationElement for OutflowValveControlModule {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.active_channel.accept(visitor);
        self.stand_by_channel.accept(visitor);
        self.outflow_valve.accept(visitor);

        visitor.visit(self);
    }
}

struct AutomaticControlPartition {
    cabin_target_vertical_speed: Velocity,
}

impl AutomaticControlPartition {
    fn new() -> Self {
        Self {
            cabin_target_vertical_speed: Velocity::default(),
        }
    }

    fn update(&mut self, cabin_target_vs: Option<Velocity>) {
        self.cabin_target_vertical_speed = cabin_target_vs.unwrap_or_default();
    }

    fn auto_vertical_speed(&self) -> Velocity {
        self.cabin_target_vertical_speed
    }
}

struct SafetyAndOverridePartition {
    cabin_target_vertical_speed: Option<Velocity>,

    cabin_altitude: Length,
    is_alt_man_sel: bool,
    is_vs_man_sel: bool,
    pre_selected_altitude: Length,
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
            pre_selected_altitude: Length::default(),
        }
    }

    fn update(
        &mut self,
        cabin_pressure: Pressure,
        pressurization_overhead: &impl PressurizationOverheadShared,
    ) {
        self.cabin_altitude = self.cabin_altitude_calculation(cabin_pressure);
        if !self.is_alt_man_sel && pressurization_overhead.is_alt_man_sel() {
            self.pre_selected_altitude = pressurization_overhead.alt_knob_value()
        }
        self.is_alt_man_sel = pressurization_overhead.is_alt_man_sel();
        self.is_vs_man_sel = pressurization_overhead.is_vs_man_sel();

        self.cabin_target_vertical_speed =
            self.target_vertical_speed_determination(self.cabin_altitude, pressurization_overhead);
    }

    /// Calculation of altidude based on a pressure and reference pressure
    /// This uses the hydrostatic equation with linear temp changes and constant R, g
    fn cabin_altitude_calculation(&self, pressure: Pressure) -> Length {
        // Manual mode uses ISA as reference pressure
        let pressure_ratio = (pressure / Pressure::new::<hectopascal>(Air::P_0)).get::<ratio>();

        // Hydrostatic equation with linear temp changes and constant R, g
        let altitude: f64 =
            ((Air::T_0 / pressure_ratio.powf((Air::L * Air::R) / Air::G)) - Air::T_0) / Air::L;
        Length::new::<meter>(altitude)
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
}

/// The Emergency Pressurization Partition (EPP) is responsible for:
/// - The computation of cabin pressure and differential pressure *
/// - The OFV motor computation based on position demands from the ACP and/or SOP *
/// - The protection of positive differential pressure and cabin altitude limits against inadvertent function from the ACP and/or SOP,
/// - The warnings to the FWS in case of strong system malfunction
/// - The limitation of the maximum negative differential pressure
struct EmergencyPressurizationPartition {
    cabin_pressure: Pressure,
    exterior_pressure: LowPassFilter<Pressure>,
    differential_pressure: Pressure,
    is_initialised: bool,

    outflow_valve_controller: OutflowValveController,
}

impl EmergencyPressurizationPartition {
    const AMBIENT_CONDITIONS_FILTER_TIME_CONSTANT: Duration = Duration::from_millis(2000);

    fn new() -> Self {
        Self {
            cabin_pressure: Pressure::new::<hectopascal>(Air::P_0),
            exterior_pressure: LowPassFilter::new_with_init_value(
                Self::AMBIENT_CONDITIONS_FILTER_TIME_CONSTANT,
                Pressure::new::<hectopascal>(Air::P_0),
            ),
            differential_pressure: Pressure::default(),
            is_initialised: false,

            outflow_valve_controller: OutflowValveController::new(),
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
    ) {
        self.update_ambient_conditions(context, adirs);
        self.cabin_pressure = cabin_simulation.cabin_pressure();
        self.differential_pressure = self.differential_pressure_calculation();
        self.outflow_valve_controller.update(
            context,
            cabin_vertical_speed,
            cabin_target_vs,
            press_overhead,
            open_allowed,
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

    fn differential_pressure_calculation(&self) -> Pressure {
        self.cabin_pressure - self.exterior_pressure.output()
    }

    fn cabin_pressure(&self) -> Pressure {
        self.cabin_pressure
    }

    fn differential_pressure(&self) -> Pressure {
        self.differential_pressure
    }

    fn outflow_valve_controller(&self) -> &OutflowValveController {
        &self.outflow_valve_controller
    }
}
