use self::linear_actuator::Actuator;
use crate::hydraulic::electrical_pump_physics::ElectricalPumpPhysics;
use crate::shared::{interpolation, ElectricalBusType, ElectricalBuses};
use crate::simulation::{
    SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext, Write,
};

use std::string::String;
use std::time::Duration;
use uom::si::angular_velocity::radian_per_second;
use uom::si::{
    angular_velocity::revolution_per_minute,
    f64::*,
    pressure::{pascal, psi},
    velocity::knot,
    volume::{cubic_inch, gallon},
    volume_rate::{gallon_per_minute, gallon_per_second},
};

pub mod brake_circuit;
pub mod electrical_pump_physics;
pub mod linear_actuator;
pub mod update_iterator;

pub trait PressureSource {
    /// Gives the maximum available volume at current pump state if it was working at maximum available displacement
    fn delta_vol_max(&self) -> Volume;

    /// Updates the pump after hydraulic system regulation pass. It will adjust its displacement to the real
    /// physical value used for current pressure regulation
    fn update_actual_state_after_pressure_regulation(
        &mut self,
        volume_required: Volume,
        reservoir: &mut Reservoir,
        is_pump_connected_to_reservoir: bool,
        context: &UpdateContext,
    );

    fn flow(&self) -> VolumeRate;

    /// This is the actual physical displacement of the pump
    fn displacement(&self) -> Volume;
}

pub struct Fluid {
    current_bulk: Pressure,
}
impl Fluid {
    pub fn new(bulk: Pressure) -> Self {
        Self { current_bulk: bulk }
    }

    pub fn bulk_mod(&self) -> Pressure {
        self.current_bulk
    }
}

/// Physical pressure switch.
/// It's a physical switch reacting with pressure.
///
/// Goes true above high pressure hystereris value
/// Goes false under low pressure hysteresis value
pub struct PressureSwitch {
    state_is_pressurised: bool,
    high_hysteresis_threshold: Pressure,
    low_hysteresis_threshold: Pressure,
}
impl PressureSwitch {
    pub fn new(high_threshold: Pressure, low_threshold: Pressure) -> Self {
        Self {
            state_is_pressurised: false,
            high_hysteresis_threshold: high_threshold,
            low_hysteresis_threshold: low_threshold,
        }
    }

    pub fn update(&mut self, current_pressure: Pressure) {
        if current_pressure <= self.low_hysteresis_threshold {
            self.state_is_pressurised = false;
        } else if current_pressure >= self.high_hysteresis_threshold {
            self.state_is_pressurised = true;
        }
    }

    pub fn is_pressurised(&self) -> bool {
        self.state_is_pressurised
    }
}

pub trait PowerTransferUnitController {
    fn should_enable(&self) -> bool;
}

pub struct PowerTransferUnit {
    is_enabled: bool,
    is_active_right: bool,
    is_active_left: bool,
    flow_to_right: VolumeRate,
    flow_to_left: VolumeRate,
    last_flow: VolumeRate,
}
impl PowerTransferUnit {
    // Low pass filter to handle flow dynamic: avoids instantaneous flow transient,
    // simulating RPM dynamic of PTU
    const FLOW_DYNAMIC_LOW_PASS_LEFT_SIDE: f64 = 0.05;
    const FLOW_DYNAMIC_LOW_PASS_RIGHT_SIDE: f64 = 0.05;

    const EFFICIENCY_LEFT_TO_RIGHT: f64 = 0.8;
    const EFFICIENCY_RIGHT_TO_LEFT: f64 = 0.8;

    pub fn new() -> Self {
        Self {
            is_enabled: false,
            is_active_right: false,
            is_active_left: false,
            flow_to_right: VolumeRate::new::<gallon_per_second>(0.0),
            flow_to_left: VolumeRate::new::<gallon_per_second>(0.0),
            last_flow: VolumeRate::new::<gallon_per_second>(0.0),
        }
    }

    pub fn flow(&self) -> VolumeRate {
        self.last_flow
    }

    pub fn is_enabled(&self) -> bool {
        self.is_enabled
    }

    pub fn is_active_left_to_right(&self) -> bool {
        self.is_active_left
    }

    pub fn is_active_right_to_left(&self) -> bool {
        self.is_active_right
    }

    pub fn update<T: PowerTransferUnitController>(
        &mut self,
        loop_left_pressure: Pressure,
        loop_right_pressure: Pressure,
        controller: &T,
    ) {
        self.is_enabled = controller.should_enable();

        let delta_p = loop_left_pressure - loop_right_pressure;

        if !self.is_enabled
            || self.is_active_right && delta_p.get::<psi>() > -5.
            || self.is_active_left && delta_p.get::<psi>() < 5.
        {
            self.flow_to_left = VolumeRate::new::<gallon_per_second>(0.0);
            self.flow_to_right = VolumeRate::new::<gallon_per_second>(0.0);
            self.is_active_right = false;
            self.is_active_left = false;
            self.last_flow = VolumeRate::new::<gallon_per_second>(0.0);
        } else if delta_p.get::<psi>() > 500. || (self.is_active_left && delta_p.get::<psi>() > 5.)
        {
            // Left sends flow to right
            // Flow computed as a function of pressure  min(16gal per minute,pressure * 0.0058)
            let mut new_flow = 16.0f64.min(loop_left_pressure.get::<psi>() * 0.0058) / 60.0;

            // Low pass on flow
            new_flow = Self::FLOW_DYNAMIC_LOW_PASS_LEFT_SIDE * new_flow
                + (1.0 - Self::FLOW_DYNAMIC_LOW_PASS_LEFT_SIDE)
                    * self.last_flow.get::<gallon_per_second>();

            self.flow_to_left = VolumeRate::new::<gallon_per_second>(-new_flow);
            self.flow_to_right =
                VolumeRate::new::<gallon_per_second>(new_flow * Self::EFFICIENCY_LEFT_TO_RIGHT);
            self.last_flow = VolumeRate::new::<gallon_per_second>(new_flow);

            self.is_active_left = true;
        } else if delta_p.get::<psi>() < -500.
            || (self.is_active_right && delta_p.get::<psi>() < -5.)
        {
            // Right sends flow to left
            // Flow computed as a function of pressure  min(34gal per minute,pressure * 0.00125)
            let mut new_flow = 34.0f64.min(loop_right_pressure.get::<psi>() * 0.0125) / 60.0;

            // Low pass on flow
            new_flow = Self::FLOW_DYNAMIC_LOW_PASS_RIGHT_SIDE * new_flow
                + (1.0 - Self::FLOW_DYNAMIC_LOW_PASS_RIGHT_SIDE)
                    * self.last_flow.get::<gallon_per_second>();

            self.flow_to_left =
                VolumeRate::new::<gallon_per_second>(new_flow * Self::EFFICIENCY_RIGHT_TO_LEFT);
            self.flow_to_right = VolumeRate::new::<gallon_per_second>(-new_flow);
            self.last_flow = VolumeRate::new::<gallon_per_second>(new_flow);

            self.is_active_right = true;
        }
    }
}
impl SimulationElement for PowerTransferUnit {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write("HYD_PTU_ACTIVE_L2R", self.is_active_left);
        writer.write("HYD_PTU_ACTIVE_R2L", self.is_active_right);
        writer.write("HYD_PTU_MOTOR_FLOW", self.flow());
        writer.write("HYD_PTU_VALVE_OPENED", self.is_enabled());
    }
}
impl Default for PowerTransferUnit {
    fn default() -> Self {
        Self::new()
    }
}

pub trait HydraulicLoopController {
    fn should_open_fire_shutoff_valve(&self, pump_idx: usize) -> bool;
}

pub struct Accumulator {
    total_volume: Volume,
    gas_init_precharge: Pressure,
    gas_pressure: Pressure,
    gas_volume: Volume,
    fluid_volume: Volume,
    current_flow: VolumeRate,
    current_delta_vol: Volume,
    has_control_valve: bool,
}
impl Accumulator {
    const FLOW_DYNAMIC_LOW_PASS: f64 = 0.5;

    // Gain of the delta pressure to flow relation.
    // Higher gain enables faster flow transient but brings instability.
    const DELTA_PRESSURE_CHARACTERISTICS: f64 = 0.01;

    fn new(
        gas_precharge: Pressure,
        total_volume: Volume,
        fluid_vol_at_init: Volume,
        has_control_valve: bool,
    ) -> Self {
        // Taking care of case where init volume is maxed at accumulator capacity: we can't exceed max_volume minus a margin for gas to compress
        let limited_volume = fluid_vol_at_init.min(total_volume * 0.9);

        // If we don't start with empty accumulator we need to init pressure too
        let gas_press_at_init = gas_precharge * total_volume / (total_volume - limited_volume);

        Self {
            total_volume,
            gas_init_precharge: gas_precharge,
            gas_pressure: gas_press_at_init,
            gas_volume: (total_volume - limited_volume),
            fluid_volume: limited_volume,
            current_flow: VolumeRate::new::<gallon_per_second>(0.),
            current_delta_vol: Volume::new::<gallon>(0.),
            has_control_valve,
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        delta_vol: &mut Volume,
        loop_pressure: Pressure,
        max_volume_to_target: Volume,
    ) {
        let accumulator_delta_press = self.gas_pressure - loop_pressure;

        let mut flow_variation = VolumeRate::new::<gallon_per_second>(
            accumulator_delta_press.get::<psi>().abs().sqrt()
                * Self::DELTA_PRESSURE_CHARACTERISTICS,
        );

        flow_variation = flow_variation * Self::FLOW_DYNAMIC_LOW_PASS
            + (1. - Self::FLOW_DYNAMIC_LOW_PASS) * self.current_flow;

        if accumulator_delta_press.get::<psi>() > 0.0 && !self.has_control_valve {
            let volume_from_acc = self
                .fluid_volume
                .min(flow_variation * context.delta_as_time())
                .min(max_volume_to_target);
            self.fluid_volume -= volume_from_acc;
            self.gas_volume += volume_from_acc;
            self.current_delta_vol = -volume_from_acc;

            *delta_vol += volume_from_acc;
        } else if accumulator_delta_press.get::<psi>() < 0.0 {
            let fluid_volume_to_reach_equilibrium = self.total_volume
                - Volume::new::<gallon>(
                    (self.gas_init_precharge.get::<psi>() * self.total_volume.get::<gallon>())
                        / 3000.,
                );
            let max_delta_vol = fluid_volume_to_reach_equilibrium - self.fluid_volume;
            let volume_to_acc = delta_vol
                .max(Volume::new::<gallon>(0.0))
                .max(flow_variation * context.delta_as_time())
                .min(max_delta_vol);
            self.fluid_volume += volume_to_acc;
            self.gas_volume -= volume_to_acc;
            self.current_delta_vol = volume_to_acc;

            *delta_vol -= volume_to_acc;
        }

        self.current_flow = self.current_delta_vol / context.delta_as_time();
        self.gas_pressure =
            (self.gas_init_precharge * self.total_volume) / (self.total_volume - self.fluid_volume);
    }

    fn get_delta_vol(&mut self, required_delta_vol: Volume) -> Volume {
        let mut volume_from_acc = Volume::new::<gallon>(0.0);
        if required_delta_vol > Volume::new::<gallon>(0.0) {
            volume_from_acc = self.fluid_volume.min(required_delta_vol);
            if volume_from_acc != Volume::new::<gallon>(0.0) {
                self.fluid_volume -= volume_from_acc;
                self.gas_volume += volume_from_acc;

                self.gas_pressure = self.gas_init_precharge * self.total_volume
                    / (self.total_volume - self.fluid_volume);
            }
        }

        volume_from_acc
    }

    fn fluid_volume(&self) -> Volume {
        self.fluid_volume
    }

    fn raw_gas_press(&self) -> Pressure {
        self.gas_pressure
    }
}

/// Complete hydraulic circuit that can be composed of multiple engine pump sections and one system section.
/// Pump sections are all connected to system section through a checkvalve (one per pump section)
/// Each pump section has its own pressure, and so does system section.
/// Flow is distributed from pump sections to system section according to regulation state and pressure difference.
pub struct HydraulicCircuit {
    pump_sections: Vec<Section>,
    system_section: Section,
    pump_to_system_checkvalves: Vec<CheckValve>,

    fluid: Fluid,
    reservoir: Reservoir,
}
impl HydraulicCircuit {
    const PUMP_SECTION_MAX_VOLUME_GAL: f64 = 0.8;
    const PUMP_SECTION_STATIC_LEAK_GAL_P_S: f64 = 0.005;

    const SYSTEM_SECTION_STATIC_LEAK_GAL_P_S: f64 = 0.03;

    const FLUID_BULK_MODULUS_PASCAL: f64 = 1450000000.0;
    const RESERVOIR_MAX_VOLUME_GAL: f64 = 10.;
    const TARGET_PRESSURE_PSI: f64 = 3000.;

    // Nitrogen PSI precharge pressure
    const ACCUMULATOR_GAS_PRE_CHARGE_PSI: f64 = 1885.0;

    const ACCUMULATOR_MAX_VOLUME_GALLONS: f64 = 0.264;

    // TODO firevalves are actually powered by a sub-bus (401PP DC ESS)
    const DEFAULT_FIRE_VALVE_POWERING_BUS: ElectricalBusType =
        ElectricalBusType::DirectCurrentEssential;

    pub fn new(
        id: &str,

        pump_sections_number: usize,
        priming_volume_percent: f64,
        high_pressure_max_volume: Volume,
        reservoir_volume: Volume,

        system_pressure_switch_lo_hyst: Pressure,
        system_pressure_switch_hi_hyst: Pressure,
        pump_pressure_switch_lo_hyst: Pressure,
        pump_pressure_switch_hi_hyst: Pressure,
        connected_to_ptu_left_side: bool,
        connected_to_ptu_right_side: bool,
    ) -> Self {
        let mut pump_sections: Vec<Section> = Vec::new();
        let mut pump_to_system_checkvalves: Vec<CheckValve> = Vec::new();

        let mut pump_id: Option<usize> = None;

        for pump_idx in 0..pump_sections_number {
            if pump_sections_number > 1 {
                pump_id = Some(pump_idx);
            }

            pump_sections.push(Section::new(
                id,
                "PUMP",
                pump_id,
                VolumeRate::new::<gallon_per_second>(Self::PUMP_SECTION_STATIC_LEAK_GAL_P_S),
                Volume::new::<gallon>(
                    Self::PUMP_SECTION_MAX_VOLUME_GAL * priming_volume_percent / 100.,
                ),
                Volume::new::<gallon>(Self::PUMP_SECTION_MAX_VOLUME_GAL),
                None,
                pump_pressure_switch_lo_hyst,
                pump_pressure_switch_hi_hyst,
                Some(FireValve::new(
                    id,
                    &pump_id,
                    Self::DEFAULT_FIRE_VALVE_POWERING_BUS,
                )),
                false,
                false,
            ));

            pump_to_system_checkvalves.push(CheckValve::new());
        }

        let system_section_volume = high_pressure_max_volume
            - Volume::new::<gallon>(Self::PUMP_SECTION_MAX_VOLUME_GAL)
                * pump_sections_number as f64;

        Self {
            pump_sections,
            system_section: Section::new(
                id,
                "SYSTEM",
                None,
                VolumeRate::new::<gallon_per_second>(Self::SYSTEM_SECTION_STATIC_LEAK_GAL_P_S),
                system_section_volume * priming_volume_percent / 100.,
                system_section_volume,
                Some(Accumulator::new(
                    Pressure::new::<psi>(Self::ACCUMULATOR_GAS_PRE_CHARGE_PSI),
                    Volume::new::<gallon>(Self::ACCUMULATOR_MAX_VOLUME_GALLONS),
                    Volume::new::<gallon>(0.),
                    false,
                )),
                system_pressure_switch_lo_hyst,
                system_pressure_switch_hi_hyst,
                None,
                connected_to_ptu_left_side,
                connected_to_ptu_right_side,
            ),
            pump_to_system_checkvalves,
            fluid: Fluid::new(Pressure::new::<pascal>(Self::FLUID_BULK_MODULUS_PASCAL)),
            reservoir: Reservoir::new(
                id,
                Volume::new::<gallon>(Self::RESERVOIR_MAX_VOLUME_GAL),
                reservoir_volume,
            ),
        }
    }

    pub fn is_fire_shutoff_valve_opened(&self, pump_id: usize) -> bool {
        self.pump_sections[pump_id].fire_valve_is_opened()
    }

    pub fn update_actuator_volumes(&mut self, actuator: &mut impl Actuator) {
        self.system_section.update_actuator_volumes(actuator);
    }

    pub fn update<T: HydraulicLoopController>(
        &mut self,
        main_section_pumps: &mut Vec<&mut impl PressureSource>,
        system_section_pump: Option<&mut impl PressureSource>,
        ptu: &Option<&PowerTransferUnit>,
        context: &UpdateContext,
        controller: &T,
    ) {
        self.update_shutoff_valves_states(controller);

        // Taking care of leaks / consumers / actuators volumes
        self.update_flows(ptu, context);

        // How many fluid needed to reach target pressure considering flow consumption
        self.update_target_volumes_after_flow();

        // Updating for each section its total maximum theoretical pumping capacity
        // "what max volume it could pump considering current reservoir state and pump rpm"
        self.update_maximum_pumping_capacities(main_section_pumps, &system_section_pump);

        // What flow can come through each valve considering what is consumed downstream
        self.update_maximum_valve_flows();

        // Update final flow that will go through each valve (spliting flow between multiple valves)
        self.update_final_valves_flows();

        self.update_delta_vol_from_valves();

        // We have all flow information, now we set pump parameters (displacement) to where it
        // should be so we reach target pressure
        self.update_pumps(main_section_pumps, system_section_pump, context);

        self.update_final_delta_vol_and_pressure(context);
    }

    fn update_delta_vol_from_valves(&mut self) {
        for (pump_idx, section) in self.pump_sections.iter_mut().enumerate() {
            section.update_downstream_delta_vol(&self.pump_to_system_checkvalves[pump_idx]);
        }

        self.system_section
            .update_upstream_delta_vol(&self.pump_to_system_checkvalves);
    }

    fn update_pumps(
        &mut self,
        main_section_pumps: &mut Vec<&mut impl PressureSource>,
        system_section_pump: Option<&mut impl PressureSource>,
        context: &UpdateContext,
    ) {
        for (pump_idx, section) in self.pump_sections.iter_mut().enumerate() {
            section.update_pump_state(main_section_pumps[pump_idx], &mut self.reservoir, &context);
        }

        if let Some(pump) = system_section_pump {
            self.system_section
                .update_pump_state(pump, &mut self.reservoir, &context);
        }
    }

    fn update_final_delta_vol_and_pressure(&mut self, context: &UpdateContext) {
        for section in &mut self.pump_sections {
            section.update_final_delta_vol_and_pressure(&context, &self.fluid);
        }

        self.system_section
            .update_final_delta_vol_and_pressure(&context, &self.fluid);
    }

    fn update_maximum_valve_flows(&mut self) {
        for (pump_section_idx, valve) in self.pump_to_system_checkvalves.iter_mut().enumerate() {
            valve.update_flow_forecast(
                &self.pump_sections[pump_section_idx],
                &self.system_section,
                &self.fluid,
            );
        }
    }

    fn update_maximum_pumping_capacities(
        &mut self,
        main_section_pumps: &mut Vec<&mut impl PressureSource>,
        system_section_pump: &Option<&mut impl PressureSource>,
    ) {
        for (pump_idx, section) in self.pump_sections.iter_mut().enumerate() {
            section.update_maximum_pumping_capacity(main_section_pumps[pump_idx]);
        }

        if let Some(pump) = system_section_pump {
            self.system_section.update_maximum_pumping_capacity(*pump);
        }
    }

    fn update_target_volumes_after_flow(&mut self) {
        for section in &mut self.pump_sections {
            section.update_target_volume_after_flow_update(
                Pressure::new::<psi>(Self::TARGET_PRESSURE_PSI),
                &self.fluid,
            );
        }
        self.system_section.update_target_volume_after_flow_update(
            Pressure::new::<psi>(Self::TARGET_PRESSURE_PSI),
            &self.fluid,
        );
    }

    fn update_flows(&mut self, ptu: &Option<&PowerTransferUnit>, context: &UpdateContext) {
        for section in &mut self.pump_sections {
            section.update_flow(&mut self.reservoir, ptu, &context);
        }
        self.system_section
            .update_flow(&mut self.reservoir, ptu, &context);
    }

    fn update_shutoff_valves_states<T: HydraulicLoopController>(&mut self, controller: &T) {
        for (pump_idx, section) in self.pump_sections.iter_mut().enumerate() {
            section.set_fire_valve_command(controller.should_open_fire_shutoff_valve(pump_idx));
        }
    }

    fn update_final_valves_flows(&mut self) {
        let mut total_max_valves_volume = Volume::new::<gallon>(0.);

        for valve in &mut self.pump_to_system_checkvalves {
            total_max_valves_volume += valve.max_virtual_volume;
        }

        let used_system_volume = self
            .system_section
            .volume_target
            .max(Volume::new::<gallon>(0.));

        if used_system_volume >= total_max_valves_volume {
            // If all the volume upstream is used by system section, each valve will provide its max volume available
            for valve in &mut self.pump_to_system_checkvalves {
                valve.current_volume = valve.max_virtual_volume;
            }
        } else if total_max_valves_volume > Volume::new::<gallon>(0.) {
            let needed_ratio = used_system_volume / total_max_valves_volume;

            for valve in &mut self.pump_to_system_checkvalves {
                valve.current_volume = valve.max_virtual_volume * needed_ratio;
            }
        }
    }

    pub fn pump_pressure(&self, idx: usize) -> Pressure {
        self.pump_sections[idx].pressure()
    }

    pub fn system_pressure(&self) -> Pressure {
        self.system_section.pressure()
    }

    pub fn system_accumulator_fluid_volume(&self) -> Volume {
        self.system_section.accumulator_volume()
    }

    pub fn pump_section_switch_pressurised(&self, idx: usize) -> bool {
        self.pump_sections[idx].pressure_switch()
    }

    pub fn system_section_switch_pressurised(&self) -> bool {
        self.system_section.pressure_switch()
    }

    pub fn reservoir_level(&self) -> Volume {
        self.reservoir.level()
    }

    pub fn reservoir(&self) -> &Reservoir {
        &self.reservoir
    }
}
impl SimulationElement for HydraulicCircuit {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.reservoir.accept(visitor);

        for section in &mut self.pump_sections {
            section.accept(visitor);
        }

        self.system_section.accept(visitor);

        visitor.visit(self);
    }
}

/// This is an hydraulic section with its own volume of fluid and pressure. It can be connected to another section
/// through a checkvalve
pub struct Section {
    pressure_id: String,

    static_leak_at_max_press: VolumeRate,
    current_volume: Volume,
    max_high_press_volume: Volume,
    current_pressure: Pressure,
    current_flow: VolumeRate,

    fire_valve: Option<FireValve>,

    accumulator: Option<Accumulator>,

    connected_to_ptu_left_side: bool,
    connected_to_ptu_right_side: bool,

    delta_volume_flow_pass: Volume,
    max_pumpable_volume: Volume,
    volume_target: Volume,
    delta_vol_from_valves: Volume,
    total_volume_pumped: Volume,

    pressure_switch: PressureSwitch,

    total_actuator_consumed_volume: Volume,
    total_actuator_returned_volume: Volume,
}
impl Section {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        loop_id: &str,
        section_id: &str,
        pump_id: Option<usize>,
        static_leak_at_max_press: VolumeRate,
        current_volume: Volume,
        max_high_press_volume: Volume,
        accumulator: Option<Accumulator>,
        pressure_switch_lo_hyst: Pressure,
        pressure_switch_hi_hyst: Pressure,
        fire_valve: Option<FireValve>,
        connected_to_ptu_left_side: bool,
        connected_to_ptu_right_side: bool,
    ) -> Self {
        let section_name: String = if pump_id.is_some() {
            format!("HYD_{}_{}{}_SECTION", loop_id, section_id, pump_id.unwrap())
        } else {
            format!("HYD_{}_{}_SECTION", loop_id, section_id)
        };

        Self {
            pressure_id: format!("{}_PRESSURE", section_name),
            static_leak_at_max_press,
            current_volume,
            max_high_press_volume,
            current_pressure: Pressure::new::<psi>(14.7),
            current_flow: VolumeRate::new::<gallon_per_second>(0.),
            fire_valve,
            accumulator,
            connected_to_ptu_left_side,
            connected_to_ptu_right_side,
            delta_volume_flow_pass: Volume::new::<gallon>(0.),
            max_pumpable_volume: Volume::new::<gallon>(0.),
            volume_target: Volume::new::<gallon>(0.),
            delta_vol_from_valves: Volume::new::<gallon>(0.),
            total_volume_pumped: Volume::new::<gallon>(0.),

            pressure_switch: PressureSwitch::new(pressure_switch_hi_hyst, pressure_switch_lo_hyst),

            total_actuator_consumed_volume: Volume::new::<gallon>(0.),
            total_actuator_returned_volume: Volume::new::<gallon>(0.),
        }
    }

    /// Gives the exact volume of fluid needed to get to any target_press pressure
    fn volume_to_reach_target(&self, target_press: Pressure, fluid: &Fluid) -> Volume {
        (target_press - self.current_pressure) * (self.max_high_press_volume) / fluid.bulk_mod()
    }

    fn pressure_switch(&self) -> bool {
        self.pressure_switch.is_pressurised()
    }

    fn fire_valve_is_opened(&self) -> bool {
        if self.fire_valve.is_some() {
            self.fire_valve.as_ref().unwrap().is_opened()
        } else {
            true
        }
    }

    fn set_fire_valve_command(&mut self, open_request: bool) {
        if self.fire_valve.is_some() {
            self.fire_valve
                .as_mut()
                .unwrap()
                .set_open_state(open_request);
        }
    }

    pub fn update_target_volume_after_flow_update(
        &mut self,
        target_pressure: Pressure,
        fluid: &Fluid,
    ) {
        self.volume_target = if self.is_primed() {
            self.volume_to_reach_target(target_pressure, fluid)
        } else {
            self.max_high_press_volume - self.current_volume
                + self.volume_to_reach_target(target_pressure, fluid)
        };

        self.volume_target -= self.delta_volume_flow_pass;
    }

    fn static_leak(&self, context: &UpdateContext) -> Volume {
        self.static_leak_at_max_press
            * context.delta_as_time()
            * (self.current_pressure - Pressure::new::<psi>(14.7))
            / Pressure::new::<psi>(3000.)
    }

    /// Updates hydraulic flow from consumers like accumulator / ptu / any actuator
    pub fn update_flow(
        &mut self,
        reservoir: &mut Reservoir,
        ptu: &Option<&PowerTransferUnit>,
        context: &UpdateContext,
    ) {
        let static_leak = self.static_leak(&context);
        let mut delta_volume_flow_pass = -static_leak;

        reservoir.add_return_volume(static_leak);

        if self.accumulator.is_some() {
            self.accumulator.as_mut().unwrap().update(
                context,
                &mut delta_volume_flow_pass,
                self.current_pressure,
                self.volume_target,
            );
        }

        if ptu.is_some() {
            self.update_ptu_flows(
                context,
                ptu.as_ref().unwrap(),
                &mut delta_volume_flow_pass,
                reservoir,
            );
        }

        delta_volume_flow_pass -= self.total_actuator_consumed_volume;
        reservoir.add_return_volume(self.total_actuator_returned_volume);

        self.delta_volume_flow_pass = delta_volume_flow_pass;

        self.reset_actuator_volumes();
    }

    fn update_actuator_volumes(&mut self, actuator: &mut impl Actuator) {
        self.total_actuator_consumed_volume += actuator.used_volume();
        self.total_actuator_returned_volume += actuator.reservoir_return();
        actuator.reset_volumes();
    }

    fn reset_actuator_volumes(&mut self) {
        self.total_actuator_returned_volume = Volume::new::<gallon>(0.);
        self.total_actuator_consumed_volume = Volume::new::<gallon>(0.);
    }

    pub fn update_maximum_pumping_capacity(&mut self, pump: &impl PressureSource) {
        if self.fire_valve_is_opened() {
            self.max_pumpable_volume = pump.delta_vol_max();
        } else {
            self.max_pumpable_volume = Volume::new::<gallon>(0.);
        }
    }

    fn update_upstream_delta_vol(&mut self, upstream_valves: &[CheckValve]) {
        for up in upstream_valves {
            self.delta_vol_from_valves += up.current_volume;
        }
    }

    fn update_downstream_delta_vol(&mut self, downstream_valve: &CheckValve) {
        self.delta_vol_from_valves -= downstream_valve.current_volume;
    }

    pub fn update_pump_state(
        &mut self,
        pump: &mut impl PressureSource,
        reservoir: &mut Reservoir,
        context: &UpdateContext,
    ) {
        // Final volume target to reach target pressure is:
        // raw volume_target - (upstream volume - downstream volume)
        let final_volume_needed_to_reach_target_pressure =
            self.volume_target - self.delta_vol_from_valves;

        pump.update_actual_state_after_pressure_regulation(
            final_volume_needed_to_reach_target_pressure,
            reservoir,
            self.fire_valve_is_opened(),
            &context,
        );
        self.total_volume_pumped = pump.flow() * context.delta_as_time();
    }

    pub fn update_final_delta_vol_and_pressure(&mut self, context: &UpdateContext, fluid: &Fluid) {
        let mut final_delta_volume = self.delta_volume_flow_pass + self.delta_vol_from_valves;

        final_delta_volume += self.total_volume_pumped;

        self.current_volume += final_delta_volume;

        self.update_pressure(fluid);

        self.current_flow = final_delta_volume / context.delta_as_time();

        self.delta_vol_from_valves = Volume::new::<gallon>(0.);
        self.total_volume_pumped = Volume::new::<gallon>(0.);
    }

    fn update_pressure(&mut self, fluid: &Fluid) {
        let fluid_volume_compressed = self.current_volume - self.max_high_press_volume;

        self.current_pressure = Pressure::new::<psi>(14.7)
            + self.delta_pressure_from_delta_volume(fluid_volume_compressed, fluid);
        self.current_pressure = self.current_pressure.max(Pressure::new::<psi>(14.7));

        self.pressure_switch.update(self.current_pressure);
    }

    fn delta_pressure_from_delta_volume(&self, delta_vol: Volume, fluid: &Fluid) -> Pressure {
        return delta_vol / self.max_high_press_volume * fluid.bulk_mod();
    }

    fn is_primed(&self) -> bool {
        self.current_volume >= self.max_high_press_volume
    }

    pub fn pressure(&self) -> Pressure {
        self.current_pressure
    }

    pub fn volume(&self) -> Volume {
        self.current_volume
    }

    pub fn flow(&self) -> VolumeRate {
        self.current_flow
    }

    pub fn accumulator_volume(&self) -> Volume {
        if self.accumulator.is_some() {
            self.accumulator.as_ref().unwrap().fluid_volume()
        } else {
            Volume::new::<gallon>(0.)
        }
    }

    fn update_ptu_flows(
        &mut self,
        context: &UpdateContext,
        ptu: &PowerTransferUnit,
        delta_vol: &mut Volume,
        reservoir: &mut Reservoir,
    ) {
        let actual_flow;
        if self.connected_to_ptu_left_side {
            if ptu.flow_to_left > VolumeRate::new::<gallon_per_second>(0.0) {
                // We are left side of PTU and positive flow so we receive flow using own reservoir
                actual_flow = reservoir.try_take_flow(ptu.flow_to_left, context);
            } else {
                // We are using own flow to power right side so we send that back
                // to our own reservoir
                actual_flow = ptu.flow_to_left;
                reservoir.add_return_volume(-actual_flow * context.delta_as_time());
            }
            *delta_vol += actual_flow * context.delta_as_time();
        } else if self.connected_to_ptu_right_side {
            if ptu.flow_to_right > VolumeRate::new::<gallon_per_second>(0.0) {
                // We are right side of PTU and positive flow so we receive flow using own reservoir
                actual_flow = reservoir.try_take_flow(ptu.flow_to_right, context);
            } else {
                // We are using own flow to power left side so we send that back
                // to our own reservoir
                actual_flow = ptu.flow_to_right;
                reservoir.add_return_volume(-actual_flow * context.delta_as_time());
            }
            *delta_vol += actual_flow * context.delta_as_time();
        }
    }
}
impl SimulationElement for Section {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        if self.fire_valve.is_some() {
            self.fire_valve.as_mut().unwrap().accept(visitor);
        }

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.pressure_id, self.pressure());
    }
}

pub struct FireValve {
    opened_id: String,
    is_opened: bool,
    bus_type: ElectricalBusType,
    is_powered: bool,
}
impl FireValve {
    fn new(hyd_loop_id: &str, pump_id: &Option<usize>, bus_type: ElectricalBusType) -> Self {
        let opened_id: String;
        if pump_id.is_some() {
            opened_id = format!(
                "HYD_{}_PUMP{}_FIRE_VALVE_OPENED",
                hyd_loop_id,
                pump_id.as_ref().unwrap()
            );
        } else {
            opened_id = format!("HYD_{}_FIRE_VALVE_OPENED", hyd_loop_id);
        }
        Self {
            opened_id,
            is_opened: true,
            bus_type,
            is_powered: false,
        }
    }

    /// Updates opening state:
    /// A firevalve will move if powered, stay at current position if unpowered
    fn set_open_state(&mut self, valve_open_command: bool) {
        if self.is_powered {
            self.is_opened = valve_open_command;
        }
    }

    fn is_opened(&self) -> bool {
        self.is_opened
    }
}
impl SimulationElement for FireValve {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.opened_id, self.is_opened());
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        // TODO is actually powered by a sub-bus (401PP DC ESS)
        self.is_powered = buses.is_powered(self.bus_type);
    }
}

/// Handles the flow that goes between two sections
/// Flow is handled in two ways:
/// -An optional flow that can only pass through if downstream needs flow
/// and if upstream has enough capacity to provide flow while maintaining its target pressure
/// -A physical flow, that is mandatory to pass through the valve, caused by pressure difference between
/// upstream and downstream.
pub struct CheckValve {
    current_volume: Volume,
    max_virtual_volume: Volume,
}
impl CheckValve {
    pub fn new() -> Self {
        Self {
            current_volume: Volume::new::<gallon>(0.),
            max_virtual_volume: Volume::new::<gallon>(0.),
        }
    }

    fn volume_to_equalize_pressures(
        &self,
        upstream_section: &Section,
        downstream_section: &Section,
        fluid: &Fluid,
    ) -> Volume {
        let delta_pressure = upstream_section.pressure() - downstream_section.pressure();

        if delta_pressure > Pressure::new::<psi>(0.) {
            downstream_section.max_high_press_volume
                * upstream_section.max_high_press_volume
                * delta_pressure
                / (fluid.bulk_mod() * downstream_section.max_high_press_volume
                    + fluid.bulk_mod() * upstream_section.max_high_press_volume)
        } else {
            Volume::new::<gallon>(0.)
        }
    }

    /// Based on upstream pumping capacity (if any) and pressure difference, computes what flow could go through
    /// the valve
    pub fn update_flow_forecast(
        &mut self,
        upstream_section: &Section,
        downstream_section: &Section,
        fluid: &Fluid,
    ) {
        let physical_volume_transferred =
            self.volume_to_equalize_pressures(upstream_section, downstream_section, fluid);

        let mut available_volume_from_upstream = (upstream_section.max_pumpable_volume
            - upstream_section.volume_target)
            .max(physical_volume_transferred);

        if !downstream_section.is_primed() {
            available_volume_from_upstream = upstream_section
                .max_pumpable_volume
                .max(physical_volume_transferred);
        }

        self.max_virtual_volume = if available_volume_from_upstream.get::<gallon>() > 0. {
            available_volume_from_upstream
        } else {
            Volume::new::<gallon>(0.)
        };
    }
}
impl Default for CheckValve {
    fn default() -> Self {
        Self::new()
    }
}

pub struct Reservoir {
    level_id: String,
    max_capacity: Volume,
    current_level: Volume,
    min_usable: Volume,
}
impl Reservoir {
    const MIN_USABLE_VOLUME: f64 = 0.2; // Gallons

    pub fn new(hyd_loop_id: &str, max_capacity: Volume, current_level: Volume) -> Self {
        Self {
            level_id: format!("HYD_{}_RESERVOIR_LEVEL", hyd_loop_id),
            max_capacity,
            current_level,
            min_usable: Volume::new::<gallon>(Self::MIN_USABLE_VOLUME),
        }
    }

    // Try to take volume from reservoir. Will return only what's currently available
    fn try_take_volume(&mut self, volume: Volume) -> Volume {
        let volume_taken = if self.current_level > self.min_usable {
            let volume_available = self.current_level - self.min_usable;
            volume_available.min(volume).max(Volume::new::<gallon>(0.))
        } else {
            Volume::new::<gallon>(0.)
        };
        self.current_level -= volume_taken;

        volume_taken
    }

    // Try to take flow from reservoir. Will return only what's currently available
    fn try_take_flow(&mut self, flow: VolumeRate, context: &UpdateContext) -> VolumeRate {
        let desired_volume = flow * context.delta_as_time();
        let volume_taken = self.try_take_volume(desired_volume);
        volume_taken / context.delta_as_time()
    }

    // What's current flow available
    fn request_flow_availability(&self, flow: VolumeRate, context: &UpdateContext) -> VolumeRate {
        let desired_volume = flow * context.delta_as_time();
        let max_volume_available = self.current_level - self.min_usable;
        max_volume_available.min(desired_volume) / context.delta_as_time()
    }

    fn add_return_volume(&mut self, volume: Volume) {
        self.current_level = (self.current_level + volume).min(self.max_capacity);
    }

    pub fn level(&self) -> Volume {
        self.current_level
    }
}
impl SimulationElement for Reservoir {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.level_id, self.level().get::<gallon>());
    }
}

pub trait PumpController {
    fn should_pressurise(&self) -> bool;
}

pub struct Pump {
    delta_vol_max: Volume,
    current_displacement: Volume,
    current_flow: VolumeRate,
    current_max_displacement: Volume,
    press_breakpoints: [f64; 9],
    displacement_carac: [f64; 9],
    // Displacement low pass filter. [0:1], 0 frozen -> 1 instantaneous dynamic
    displacement_dynamic: f64,
    speed: AngularVelocity,
}
impl Pump {
    fn new(
        press_breakpoints: [f64; 9],
        displacement_carac: [f64; 9],
        displacement_dynamic: f64,
    ) -> Self {
        Self {
            delta_vol_max: Volume::new::<gallon>(0.),
            current_displacement: Volume::new::<gallon>(0.),
            current_flow: VolumeRate::new::<gallon_per_second>(0.),
            current_max_displacement: Volume::new::<gallon>(0.),
            press_breakpoints,
            displacement_carac,
            displacement_dynamic,
            speed: AngularVelocity::new::<revolution_per_minute>(0.),
        }
    }

    fn update<T: PumpController>(
        &mut self,
        context: &UpdateContext,
        pressure: Pressure,
        reservoir: &Reservoir,
        speed: AngularVelocity,
        controller: &T,
    ) {
        self.speed = speed;

        let theoretical_displacement = self.calculate_displacement(pressure, controller);

        // Actual displacement is the calculated one with a low pass filter applied to mimic displacement transients dynamic
        // Note this is applied on "max" delta vol, so any regulation within pump capacity will remain "instantaneous'
        self.current_max_displacement = self.displacement_dynamic * theoretical_displacement
            + (1.0 - self.displacement_dynamic) * self.current_max_displacement;

        let max_flow = Self::calculate_flow(speed, self.current_max_displacement)
            .max(VolumeRate::new::<gallon_per_second>(0.));

        let max_flow_available_from_reservoir =
            reservoir.request_flow_availability(max_flow, &context);

        self.delta_vol_max = max_flow_available_from_reservoir * context.delta_as_time();
    }

    fn calculate_displacement<T: PumpController>(
        &self,
        pressure: Pressure,
        controller: &T,
    ) -> Volume {
        if controller.should_pressurise() {
            Volume::new::<cubic_inch>(interpolation(
                &self.press_breakpoints,
                &self.displacement_carac,
                pressure.get::<psi>(),
            ))
        } else {
            Volume::new::<cubic_inch>(0.)
        }
    }

    fn calculate_displacement_from_required_flow(&self, required_flow: VolumeRate) -> Volume {
        if self.speed.get::<revolution_per_minute>() > 0. {
            let displacement = Volume::new::<cubic_inch>(
                required_flow.get::<gallon_per_second>() * 231.0 * 60.0
                    / self.speed.get::<revolution_per_minute>(),
            );
            self.current_max_displacement
                .min(displacement)
                .max(Volume::new::<cubic_inch>(0.))
        } else {
            self.current_max_displacement
        }
    }

    fn calculate_flow(speed: AngularVelocity, displacement: Volume) -> VolumeRate {
        if speed.get::<revolution_per_minute>() > 0. {
            VolumeRate::new::<gallon_per_second>(
                speed.get::<revolution_per_minute>() * displacement.get::<cubic_inch>()
                    / 231.00
                    / 60.0,
            )
        } else {
            VolumeRate::new::<gallon_per_second>(0.)
        }
    }

    fn get_max_flow(&self) -> VolumeRate {
        if self.speed.get::<revolution_per_minute>() > 0. {
            VolumeRate::new::<gallon_per_minute>(
                self.speed.get::<revolution_per_minute>()
                    * self.current_displacement.get::<cubic_inch>()
                    / 231.0,
            )
        } else {
            VolumeRate::new::<gallon_per_second>(0.)
        }
    }
}
impl PressureSource for Pump {
    fn delta_vol_max(&self) -> Volume {
        self.delta_vol_max
    }

    fn update_actual_state_after_pressure_regulation(
        &mut self,
        volume_required: Volume,
        reservoir: &mut Reservoir,
        is_pump_connected_to_reservoir: bool,
        context: &UpdateContext,
    ) {
        let required_flow = volume_required / context.delta_as_time();
        self.current_displacement = self.calculate_displacement_from_required_flow(required_flow);
        let max_current_flow = self.get_max_flow();

        self.current_flow = if is_pump_connected_to_reservoir {
            reservoir.try_take_flow(max_current_flow, &context)
        } else {
            VolumeRate::new::<gallon_per_second>(0.)
        }
    }

    fn flow(&self) -> VolumeRate {
        self.current_flow
    }

    fn displacement(&self) -> Volume {
        self.current_displacement
    }
}

pub struct ElectricPump {
    pump: Pump,
    pump_physics: ElectricalPumpPhysics,
}
impl ElectricPump {
    const NOMINAL_SPEED: f64 = 7600.0;
    const DISPLACEMENT_BREAKPTS: [f64; 9] = [
        0.0, 500.0, 1000.0, 1500.0, 2175.0, 2850.0, 3080.0, 3100.0, 3500.0,
    ];
    const DISPLACEMENT_MAP: [f64; 9] = [0.263, 0.263, 0.263, 0.263, 0.263, 0.2, 0.0, 0.0, 0.0];
    // 1 == No filtering
    const DISPLACEMENT_DYNAMICS: f64 = 0.4;

    pub fn new(id: &str, bus_type: ElectricalBusType, max_current: ElectricCurrent) -> Self {
        Self {
            pump: Pump::new(
                Self::DISPLACEMENT_BREAKPTS,
                Self::DISPLACEMENT_MAP,
                Self::DISPLACEMENT_DYNAMICS,
            ),
            pump_physics: ElectricalPumpPhysics::new(
                id,
                bus_type,
                max_current,
                AngularVelocity::new::<revolution_per_minute>(Self::NOMINAL_SPEED),
            ),
        }
    }

    pub fn update<T: PumpController>(
        &mut self,
        context: &UpdateContext,
        current_pressure: Pressure,
        reservoir: &Reservoir,
        controller: &T,
    ) {
        self.pump_physics.set_active(controller.should_pressurise());
        self.pump_physics
            .update(current_pressure, self.pump.displacement(), context);

        self.pump.update(
            context,
            current_pressure,
            &reservoir,
            self.pump_physics.speed(),
            controller,
        );
    }
}
impl PressureSource for ElectricPump {
    fn delta_vol_max(&self) -> Volume {
        self.pump.delta_vol_max()
    }

    fn update_actual_state_after_pressure_regulation(
        &mut self,
        volume_required: Volume,
        reservoir: &mut Reservoir,
        is_pump_connected_to_reservoir: bool,
        context: &UpdateContext,
    ) {
        self.pump.update_actual_state_after_pressure_regulation(
            volume_required,
            reservoir,
            is_pump_connected_to_reservoir,
            context,
        );
    }

    fn flow(&self) -> VolumeRate {
        self.pump.flow()
    }

    fn displacement(&self) -> Volume {
        self.pump.displacement()
    }
}
impl SimulationElement for ElectricPump {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.pump_physics.accept(visitor);

        visitor.visit(self);
    }
}

pub struct EngineDrivenPump {
    active_id: String,

    is_active: bool,
    speed: AngularVelocity,
    pump: Pump,
}
impl EngineDrivenPump {
    const DISPLACEMENT_BREAKPTS: [f64; 9] = [
        0.0, 500.0, 1000.0, 1500.0, 2800.0, 2950.0, 3000.0, 3020.0, 3500.0,
    ];
    const DISPLACEMENT_MAP: [f64; 9] = [2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.2, 1.0, 0.0];

    // 0.1 == 90% filtering on max displacement transient
    const DISPLACEMENT_DYNAMICS: f64 = 0.1;

    pub fn new(id: &str) -> Self {
        Self {
            active_id: format!("HYD_{}_EDPUMP_ACTIVE", id),
            is_active: false,
            speed: AngularVelocity::new::<revolution_per_minute>(0.),
            pump: Pump::new(
                Self::DISPLACEMENT_BREAKPTS,
                Self::DISPLACEMENT_MAP,
                Self::DISPLACEMENT_DYNAMICS,
            ),
        }
    }

    pub fn update<T: PumpController>(
        &mut self,
        context: &UpdateContext,
        pressure: Pressure,
        reservoir: &Reservoir,
        pump_speed: AngularVelocity,
        controller: &T,
    ) {
        self.speed = pump_speed;
        self.pump
            .update(context, pressure, &reservoir, pump_speed, controller);
        self.is_active = controller.should_pressurise();
    }

    pub fn rpm(&self) -> f64 {
        self.speed.get::<revolution_per_minute>()
    }
}
impl PressureSource for EngineDrivenPump {
    fn delta_vol_max(&self) -> Volume {
        self.pump.delta_vol_max()
    }

    fn update_actual_state_after_pressure_regulation(
        &mut self,
        volume_required: Volume,
        reservoir: &mut Reservoir,
        is_pump_connected_to_reservoir: bool,
        context: &UpdateContext,
    ) {
        self.pump.update_actual_state_after_pressure_regulation(
            volume_required,
            reservoir,
            is_pump_connected_to_reservoir,
            context,
        );
    }

    fn flow(&self) -> VolumeRate {
        self.pump.flow()
    }

    fn displacement(&self) -> Volume {
        self.pump.current_displacement
    }
}
impl SimulationElement for EngineDrivenPump {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.active_id, self.is_active);
    }
}

struct WindTurbine {
    position: f64,
    speed: AngularVelocity,
    acceleration: f64,
    torque_sum: f64,
}
impl WindTurbine {
    // Low speed special calculation threshold. Under that value we compute resistant torque depending on pump angle and displacement.
    const LOW_SPEED_PHYSICS_ACTIVATION: f64 = 50.;
    const STOWED_ANGLE: f64 = std::f64::consts::PI / 2.;
    const PROPELLER_INERTIA: f64 = 2.;
    const RPM_GOVERNOR_BREAKPTS: [f64; 9] = [
        0.0, 1000., 3000.0, 4000.0, 4800.0, 5800.0, 6250.0, 9000.0, 15000.0,
    ];
    const PROP_ALPHA_MAP: [f64; 9] = [45., 45., 45., 45., 35., 25., 1., 1., 1.];

    fn new() -> Self {
        Self {
            position: Self::STOWED_ANGLE,
            speed: AngularVelocity::new::<revolution_per_minute>(0.),
            acceleration: 0.,
            torque_sum: 0.,
        }
    }

    fn rpm(&self) -> f64 {
        self.speed.get::<revolution_per_minute>()
    }

    fn speed(&self) -> AngularVelocity {
        self.speed
    }

    fn update_generated_torque(&mut self, indicated_speed: Velocity, stow_pos: f64) {
        let cur_alpha = interpolation(
            &Self::RPM_GOVERNOR_BREAKPTS,
            &Self::PROP_ALPHA_MAP,
            self.rpm(),
        );

        // Simple model. stow pos sin simulates the angle of the blades vs wind while deploying
        let air_speed_torque = cur_alpha.to_radians().sin()
            * (indicated_speed.get::<knot>() * indicated_speed.get::<knot>() / 100.)
            * 0.5
            * (std::f64::consts::PI / 2. * stow_pos).sin();
        self.torque_sum += air_speed_torque;
    }

    fn update_friction_torque(&mut self, displacement_ratio: f64) {
        let mut pump_torque = 0.;
        if self.rpm() < Self::LOW_SPEED_PHYSICS_ACTIVATION {
            pump_torque += (self.position * 4.).cos() * displacement_ratio.max(0.35) * 35.;
            pump_torque += -self.speed.get::<radian_per_second>() * 15.;
        } else {
            pump_torque +=
                displacement_ratio.max(0.35) * 1. * -self.speed.get::<radian_per_second>();
        }
        pump_torque -= self.speed.get::<radian_per_second>() * 0.05;
        // Static air drag of the propeller
        self.torque_sum += pump_torque;
    }

    fn update_physics(&mut self, delta_time: &Duration) {
        self.acceleration = self.torque_sum / Self::PROPELLER_INERTIA;
        self.speed +=
            AngularVelocity::new::<radian_per_second>(self.acceleration * delta_time.as_secs_f64());
        self.position += self.speed.get::<radian_per_second>() * delta_time.as_secs_f64();

        // Reset torque accumulator at end of update
        self.torque_sum = 0.;
    }

    fn update(
        &mut self,
        delta_time: &Duration,
        indicated_speed: Velocity,
        stow_pos: f64,
        displacement_ratio: f64,
    ) {
        if stow_pos > 0.1 {
            // Do not update anything on the propeller if still stowed
            self.update_generated_torque(indicated_speed, stow_pos);
            self.update_friction_torque(displacement_ratio);
            self.update_physics(delta_time);
        }
    }
}
impl SimulationElement for WindTurbine {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write("HYD_RAT_RPM", self.rpm());
    }
}
impl Default for WindTurbine {
    fn default() -> Self {
        Self::new()
    }
}

struct AlwaysPressurisePumpController {}
impl AlwaysPressurisePumpController {
    fn new() -> Self {
        Self {}
    }
}
impl PumpController for AlwaysPressurisePumpController {
    fn should_pressurise(&self) -> bool {
        true
    }
}
impl Default for AlwaysPressurisePumpController {
    fn default() -> Self {
        Self::new()
    }
}

pub trait RamAirTurbineController {
    fn should_deploy(&self) -> bool;
}

pub struct RamAirTurbine {
    deployment_commanded: bool,
    pump: Pump,
    pump_controller: AlwaysPressurisePumpController,
    wind_turbine: WindTurbine,
    position: f64,
    max_displacement: f64,
}
impl RamAirTurbine {
    const DISPLACEMENT_BREAKPTS: [f64; 9] = [
        0.0, 500.0, 1000.0, 1500.0, 2100.0, 2300.0, 2600.0, 3050.0, 3500.0,
    ];
    const DISPLACEMENT_MAP: [f64; 9] = [1.15, 1.15, 1.15, 1.15, 1.15, 0.5, 0.0, 0.0, 0.0];

    // 1 == no filtering. 0.1 == 90% filtering. 0.2==80%... !!Warning, filter frequency is time delta dependant.
    const DISPLACEMENT_DYNAMICS: f64 = 0.2;

    // Speed to go from 0 to 1 stow position per sec. 1 means full deploying in 1s
    const STOWING_SPEED: f64 = 1.;

    pub fn new() -> Self {
        let mut max_disp = 0.;
        for v in Self::DISPLACEMENT_MAP.iter() {
            if v > &max_disp {
                max_disp = *v;
            }
        }

        Self {
            deployment_commanded: false,
            pump: Pump::new(
                Self::DISPLACEMENT_BREAKPTS,
                Self::DISPLACEMENT_MAP,
                Self::DISPLACEMENT_DYNAMICS,
            ),
            pump_controller: AlwaysPressurisePumpController::new(),
            wind_turbine: WindTurbine::new(),
            position: 0.,
            max_displacement: max_disp,
        }
    }

    pub fn update<T: RamAirTurbineController>(
        &mut self,
        context: &UpdateContext,
        pressure: Pressure,
        reservoir: &Reservoir,
        controller: &T,
    ) {
        // Once commanded, stays commanded forever
        self.deployment_commanded = controller.should_deploy() || self.deployment_commanded;

        self.pump.update(
            context,
            pressure,
            &reservoir,
            self.wind_turbine.speed(),
            &self.pump_controller,
        );
    }

    pub fn update_physics(&mut self, delta_time: &Duration, indicated_airspeed: Velocity) {
        // Calculate the ratio of current displacement vs max displacement as an image of the load of the pump
        let displacement_ratio = self.delta_vol_max().get::<gallon>() / self.max_displacement;
        self.wind_turbine.update(
            &delta_time,
            indicated_airspeed,
            self.position,
            displacement_ratio,
        );
    }

    pub fn update_position(&mut self, delta_time: &Duration) {
        if self.deployment_commanded {
            self.position += delta_time.as_secs_f64() * Self::STOWING_SPEED;

            // Finally limiting pos in [0:1] range
            if self.position < 0. {
                self.position = 0.;
            } else if self.position > 1. {
                self.position = 1.;
            }
        }
    }
}
impl PressureSource for RamAirTurbine {
    fn delta_vol_max(&self) -> Volume {
        self.pump.delta_vol_max()
    }

    fn update_actual_state_after_pressure_regulation(
        &mut self,
        volume_required: Volume,
        reservoir: &mut Reservoir,
        is_pump_connected_to_reservoir: bool,
        context: &UpdateContext,
    ) {
        self.pump.update_actual_state_after_pressure_regulation(
            volume_required,
            reservoir,
            is_pump_connected_to_reservoir,
            context,
        );
    }

    fn flow(&self) -> VolumeRate {
        self.pump.flow()
    }

    fn displacement(&self) -> Volume {
        self.pump.displacement()
    }
}
impl SimulationElement for RamAirTurbine {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.wind_turbine.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write("HYD_RAT_STOW_POSITION", self.position);
    }
}
impl Default for RamAirTurbine {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use crate::simulation::test::{SimulationTestBed, TestBed};
    use crate::simulation::UpdateContext;
    use uom::si::{
        acceleration::foot_per_second_squared, angle::radian, f64::*, length::foot, pressure::psi,
        thermodynamic_temperature::degree_celsius, volume::gallon,
    };

    struct TestHydraulicLoopController {
        should_open_fire_shutoff_valve: Vec<bool>,
    }
    impl TestHydraulicLoopController {
        fn _commanding_open_fire_shutoff_valve(number_of_pumps: usize) -> Self {
            Self {
                should_open_fire_shutoff_valve: vec![true; number_of_pumps],
            }
        }
    }
    impl HydraulicLoopController for TestHydraulicLoopController {
        fn should_open_fire_shutoff_valve(&self, pump_idx: usize) -> bool {
            self.should_open_fire_shutoff_valve[pump_idx]
        }
    }

    struct TestPumpController {
        should_pressurise: bool,
    }
    impl TestPumpController {
        fn _commanding_pressurise() -> Self {
            Self {
                should_pressurise: true,
            }
        }
    }
    impl PumpController for TestPumpController {
        fn should_pressurise(&self) -> bool {
            self.should_pressurise
        }
    }

    use super::*;

    #[test]
    fn reservoir_gives_desired_flow() {
        let mut reservoir = Reservoir::new(
            "GREEN",
            Volume::new::<gallon>(5.),
            Volume::new::<gallon>(5.),
        );

        assert!(Volume::new::<gallon>(1.) == reservoir.try_take_volume(Volume::new::<gallon>(1.)));
        assert!(
            reservoir.current_level > Volume::new::<gallon>(3.99)
                && reservoir.current_level < Volume::new::<gallon>(4.01)
        );
    }

    #[test]
    fn reservoir_gives_only_volume_available() {
        let mut reservoir = Reservoir::new(
            "GREEN",
            Volume::new::<gallon>(5.),
            Volume::new::<gallon>(5.),
        );

        let drawn_volume = reservoir.try_take_volume(Volume::new::<gallon>(10.));
        assert!(drawn_volume.get::<gallon>() == 5. - Reservoir::MIN_USABLE_VOLUME);
    }

    #[test]
    fn section_with_pump_number_writes_its_state() {
        let mut test_bed = SimulationTestBed::from(section("BROWN", "PUMP", Some(2)));

        test_bed.run();

        assert!(test_bed.contains_key("HYD_BROWN_PUMP2_SECTION_PRESSURE"));
        assert!(test_bed.contains_key("HYD_BROWN_PUMP2_FIRE_VALVE_OPENED"));
    }

    #[test]
    fn hyd_circuit_with_pump_number_writes_its_state() {
        let mut test_bed = SimulationTestBed::from(hydraulic_loop("BROWN", 2));

        test_bed.run();

        assert!(test_bed.contains_key("HYD_BROWN_PUMP0_SECTION_PRESSURE"));
        assert!(test_bed.contains_key("HYD_BROWN_PUMP0_FIRE_VALVE_OPENED"));

        assert!(test_bed.contains_key("HYD_BROWN_PUMP1_SECTION_PRESSURE"));
        assert!(test_bed.contains_key("HYD_BROWN_PUMP1_FIRE_VALVE_OPENED"));

        assert!(!test_bed.contains_key("HYD_BROWN_PUMP2_SECTION_PRESSURE"));
        assert!(!test_bed.contains_key("HYD_BROWN_PUMP2_FIRE_VALVE_OPENED"));
    }

    #[test]
    fn section_without_pump_number_writes_its_state() {
        let mut test_bed = SimulationTestBed::from(section("BROWN", "SYSTEM", None));

        test_bed.run();

        assert!(test_bed.contains_key("HYD_BROWN_SYSTEM_SECTION_PRESSURE"));
    }

    #[test]
    fn hyd_circuit_without_pump_number_writes_its_state() {
        let mut test_bed = SimulationTestBed::from(hydraulic_loop("BROWN", 1));

        test_bed.run();

        assert!(test_bed.contains_key("HYD_BROWN_SYSTEM_SECTION_PRESSURE"));

        assert!(test_bed.contains_key("HYD_BROWN_PUMP_SECTION_PRESSURE"));
        assert!(test_bed.contains_key("HYD_BROWN_FIRE_VALVE_OPENED"));

        assert!(!test_bed.contains_key("HYD_BROWN_PUMP1_SECTION_PRESSURE"));
        assert!(!test_bed.contains_key("HYD_BROWN_PUMP1_FIRE_VALVE_OPENED"));

        assert!(!test_bed.contains_key("HYD_BROWN_PUMP2_SECTION_PRESSURE"));
        assert!(!test_bed.contains_key("HYD_BROWN_PUMP2_FIRE_VALVE_OPENED"));
    }

    fn section(loop_id: &str, section_id: &str, pump_number: Option<usize>) -> Section {
        Section::new(
            loop_id,
            section_id,
            pump_number,
            VolumeRate::new::<gallon_per_second>(
                HydraulicCircuit::PUMP_SECTION_STATIC_LEAK_GAL_P_S,
            ),
            Volume::new::<gallon>(HydraulicCircuit::PUMP_SECTION_MAX_VOLUME_GAL),
            Volume::new::<gallon>(HydraulicCircuit::PUMP_SECTION_MAX_VOLUME_GAL),
            None,
            Pressure::new::<psi>(1400.),
            Pressure::new::<psi>(2000.),
            Some(FireValve::new(
                loop_id,
                &pump_number,
                HydraulicCircuit::DEFAULT_FIRE_VALVE_POWERING_BUS,
            )),
            false,
            false,
        )
    }

    fn hydraulic_loop(loop_color: &str, main_pump_number: usize) -> HydraulicCircuit {
        match loop_color {
            "GREEN" => HydraulicCircuit::new(
                loop_color,
                main_pump_number,
                100.,
                Volume::new::<gallon>(10.),
                Volume::new::<gallon>(3.6),
                Pressure::new::<psi>(1450.),
                Pressure::new::<psi>(1900.),
                Pressure::new::<psi>(1300.),
                Pressure::new::<psi>(1800.),
                true,
                false,
            ),
            "YELLOW" => HydraulicCircuit::new(
                loop_color,
                main_pump_number,
                100.,
                Volume::new::<gallon>(10.),
                Volume::new::<gallon>(3.6),
                Pressure::new::<psi>(1450.),
                Pressure::new::<psi>(1900.),
                Pressure::new::<psi>(1300.),
                Pressure::new::<psi>(1800.),
                true,
                false,
            ),
            _ => HydraulicCircuit::new(
                loop_color,
                main_pump_number,
                100.,
                Volume::new::<gallon>(10.),
                Volume::new::<gallon>(3.6),
                Pressure::new::<psi>(1450.),
                Pressure::new::<psi>(1900.),
                Pressure::new::<psi>(1300.),
                Pressure::new::<psi>(1800.),
                true,
                false,
            ),
        }
    }

    fn engine_driven_pump() -> EngineDrivenPump {
        EngineDrivenPump::new("DEFAULT")
    }

    fn _context(delta_time: Duration) -> UpdateContext {
        UpdateContext::new(
            delta_time,
            Velocity::new::<knot>(250.),
            Length::new::<foot>(5000.),
            ThermodynamicTemperature::new::<degree_celsius>(25.0),
            true,
            Acceleration::new::<foot_per_second_squared>(0.),
            Acceleration::new::<foot_per_second_squared>(0.),
            Acceleration::new::<foot_per_second_squared>(0.),
            Angle::new::<radian>(0.),
            Angle::new::<radian>(0.),
        )
    }

    #[cfg(test)]
    mod edp_tests {
        use super::*;

        #[test]
        fn starts_inactive() {
            assert!(!engine_driven_pump().is_active);
        }
    }
}
