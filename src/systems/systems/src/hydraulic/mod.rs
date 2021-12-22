use self::linear_actuator::Actuator;
use crate::failures::{Failure, FailureType};
use crate::hydraulic::electrical_pump_physics::ElectricalPumpPhysics;
use crate::pneumatic::PressurizeableReservoir;
use crate::shared::{interpolation, ElectricalBusType, ElectricalBuses};
use crate::simulation::{
    InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
    VariableIdentifier, Write,
};

use std::time::Duration;
use uom::si::angular_velocity::radian_per_second;
use uom::si::{
    angular_velocity::revolution_per_minute,
    f64::*,
    pressure::{pascal, psi},
    ratio::ratio,
    velocity::knot,
    volume::{cubic_inch, gallon},
    volume_rate::{gallon_per_minute, gallon_per_second},
};

pub mod brake_circuit;
pub mod electrical_pump_physics;
pub mod linear_actuator;
pub mod nose_steering;
pub mod update_iterator;

pub trait SectionPressure {
    fn pressure(&self) -> Pressure;
    fn is_pressure_switch_pressurised(&self) -> bool;
}
pub trait PressureSource {
    /// Gives the maximum available volume at current pump state if it was working at maximum available displacement
    fn delta_vol_max(&self) -> Volume;

    /// Updates the pump after hydraulic system regulation pass. It will adjust its displacement to the real
    /// physical value used for current pressure regulation
    fn update_after_pressure_regulation(
        &mut self,
        context: &UpdateContext,
        volume_required: Volume,
        reservoir: &mut Reservoir,
        is_pump_connected_to_reservoir: bool,
    );

    fn flow(&self) -> VolumeRate;

    /// This is the physical displacement of the pump
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

#[derive(PartialEq, Clone, Copy)]
pub enum PressureSwitchState {
    Pressurised,
    NotPressurised,
}

pub enum PressureSwitchType {
    Relative,
    Absolute,
}

/// Physical pressure switch.
/// It's a physical switch reacting to pressure.
pub struct PressureSwitch {
    state_is_pressurised: bool,
    high_hysteresis_threshold: Pressure,
    low_hysteresis_threshold: Pressure,

    sensor_type: PressureSwitchType,
}
impl PressureSwitch {
    pub fn new(
        high_threshold: Pressure,
        low_threshold: Pressure,
        sensor_type: PressureSwitchType,
    ) -> Self {
        Self {
            state_is_pressurised: false,
            high_hysteresis_threshold: high_threshold,
            low_hysteresis_threshold: low_threshold,
            sensor_type,
        }
    }

    pub fn update(&mut self, context: &UpdateContext, current_pressure: Pressure) {
        let pressure_measured = match self.sensor_type {
            PressureSwitchType::Relative => current_pressure - context.ambient_pressure(),
            PressureSwitchType::Absolute => current_pressure,
        };

        if pressure_measured <= self.low_hysteresis_threshold {
            self.state_is_pressurised = false;
        } else if pressure_measured >= self.high_hysteresis_threshold {
            self.state_is_pressurised = true;
        }
    }

    pub fn state(&self) -> PressureSwitchState {
        if self.state_is_pressurised {
            PressureSwitchState::Pressurised
        } else {
            PressureSwitchState::NotPressurised
        }
    }
}

/// Physical pressure switch.
/// It's a physical switch reacting to pressure.
pub struct LevelSwitch {
    state_is_low: bool,
    high_hysteresis_threshold: Volume,
    low_hysteresis_threshold: Volume,
}
impl LevelSwitch {
    const HYSTERESIS_VALUE_GAL: f64 = 0.1;

    pub fn new(threshold: Volume) -> Self {
        Self {
            state_is_low: false,
            high_hysteresis_threshold: threshold
                + Volume::new::<gallon>(Self::HYSTERESIS_VALUE_GAL),
            low_hysteresis_threshold: threshold,
        }
    }

    pub fn update(&mut self, current_volume: Volume) {
        if current_volume <= self.low_hysteresis_threshold {
            self.state_is_low = true;
        } else if current_volume >= self.high_hysteresis_threshold {
            self.state_is_low = false;
        }
    }

    pub fn is_low_level(&self) -> bool {
        self.state_is_low
    }
}

pub trait PowerTransferUnitController {
    fn should_enable(&self) -> bool;
}

pub struct PowerTransferUnit {
    active_l2r_id: VariableIdentifier,
    active_r2l_id: VariableIdentifier,
    motor_flow_id: VariableIdentifier,
    valve_opened_id: VariableIdentifier,

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

    pub fn new(context: &mut InitContext) -> Self {
        Self {
            active_l2r_id: context.get_identifier("HYD_PTU_ACTIVE_L2R".to_owned()),
            active_r2l_id: context.get_identifier("HYD_PTU_ACTIVE_R2L".to_owned()),
            motor_flow_id: context.get_identifier("HYD_PTU_MOTOR_FLOW".to_owned()),
            valve_opened_id: context.get_identifier("HYD_PTU_VALVE_OPENED".to_owned()),

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
        loop_left_section: &impl SectionPressure,
        loop_right_section: &impl SectionPressure,
        controller: &T,
    ) {
        self.is_enabled = controller.should_enable();

        let delta_p = loop_left_section.pressure() - loop_right_section.pressure();

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
            let mut new_flow =
                16.0f64.min(loop_left_section.pressure().get::<psi>() * 0.0058) / 60.0;

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
            let mut new_flow =
                34.0f64.min(loop_right_section.pressure().get::<psi>() * 0.0125) / 60.0;

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
        writer.write(&self.active_l2r_id, self.is_active_left);
        writer.write(&self.active_r2l_id, self.is_active_right);
        writer.write(&self.motor_flow_id, self.flow());
        writer.write(&self.valve_opened_id, self.is_enabled());
    }
}

pub trait HydraulicCircuitController {
    fn should_open_fire_shutoff_valve(&self, pump_index: usize) -> bool;
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
    const FLOW_DYNAMIC_LOW_PASS: f64 = 0.7;

    // Gain of the delta pressure to flow relation.
    // Higher gain enables faster flow transient but brings instability.
    const DELTA_PRESSURE_CHARACTERISTICS: f64 = 0.009;

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
        circuit_pressure: Pressure,
        max_volume_to_target: Volume,
    ) {
        let accumulator_delta_press = self.gas_pressure - circuit_pressure;

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
    pump_to_system_check_valves: Vec<CheckValve>,

    fluid: Fluid,
    reservoir: Reservoir,
}
impl HydraulicCircuit {
    const PUMP_SECTION_MAX_VOLUME_GAL: f64 = 0.8;
    const PUMP_SECTION_STATIC_LEAK_GAL_P_S: f64 = 0.005;

    const SYSTEM_SECTION_STATIC_LEAK_GAL_P_S: f64 = 0.03;

    const FLUID_BULK_MODULUS_PASCAL: f64 = 1450000000.0;
    const TARGET_PRESSURE_PSI: f64 = 3000.;

    // Nitrogen PSI precharge pressure
    const ACCUMULATOR_GAS_PRE_CHARGE_PSI: f64 = 1885.0;

    const ACCUMULATOR_MAX_VOLUME_GALLONS: f64 = 0.264;

    // TODO firevalves are actually powered by a sub-bus (401PP DC ESS)
    const DEFAULT_FIRE_VALVE_POWERING_BUS: ElectricalBusType =
        ElectricalBusType::DirectCurrentEssential;

    pub fn new(
        context: &mut InitContext,
        id: &str,

        number_of_pump_sections: usize,
        priming_volume: Ratio,
        high_pressure_max_volume: Volume,
        reservoir: Reservoir,

        system_pressure_switch_lo_hyst: Pressure,
        system_pressure_switch_hi_hyst: Pressure,
        pump_pressure_switch_lo_hyst: Pressure,
        pump_pressure_switch_hi_hyst: Pressure,
        connected_to_ptu_left_side: bool,
        connected_to_ptu_right_side: bool,
    ) -> Self {
        assert!(number_of_pump_sections > 0);

        let mut pump_sections: Vec<Section> = Vec::new();
        let mut pump_to_system_check_valves: Vec<CheckValve> = Vec::new();

        for pump_id in 1..=number_of_pump_sections {
            let fire_valve = Some(FireValve::new(
                context,
                id,
                pump_id,
                Self::DEFAULT_FIRE_VALVE_POWERING_BUS,
            ));

            pump_sections.push(Section::new(
                context,
                id,
                "PUMP",
                pump_id,
                VolumeRate::new::<gallon_per_second>(Self::PUMP_SECTION_STATIC_LEAK_GAL_P_S),
                Volume::new::<gallon>(
                    Self::PUMP_SECTION_MAX_VOLUME_GAL * priming_volume.get::<ratio>(),
                ),
                Volume::new::<gallon>(Self::PUMP_SECTION_MAX_VOLUME_GAL),
                None,
                pump_pressure_switch_lo_hyst,
                pump_pressure_switch_hi_hyst,
                fire_valve,
                false,
                false,
            ));

            pump_to_system_check_valves.push(CheckValve::default());
        }

        let system_section_volume = high_pressure_max_volume
            - Volume::new::<gallon>(Self::PUMP_SECTION_MAX_VOLUME_GAL)
                * number_of_pump_sections as f64;

        Self {
            pump_sections,
            system_section: Section::new(
                context,
                id,
                "SYSTEM",
                1,
                VolumeRate::new::<gallon_per_second>(Self::SYSTEM_SECTION_STATIC_LEAK_GAL_P_S),
                system_section_volume * priming_volume,
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
            pump_to_system_check_valves,
            fluid: Fluid::new(Pressure::new::<pascal>(Self::FLUID_BULK_MODULUS_PASCAL)),
            reservoir,
        }
    }

    pub fn is_fire_shutoff_valve_open(&self, pump_id: usize) -> bool {
        self.pump_sections[pump_id].fire_valve_is_open()
    }

    pub fn update_actuator_volumes(&mut self, actuator: &mut impl Actuator) {
        self.system_section.update_actuator_volumes(actuator);
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        main_section_pumps: &mut Vec<&mut impl PressureSource>,
        system_section_pump: Option<&mut impl PressureSource>,
        ptu: Option<&PowerTransferUnit>,
        controller: &impl HydraulicCircuitController,
        reservoir_pressure: Pressure,
    ) {
        self.reservoir.update(context, reservoir_pressure);

        self.update_shutoff_valves(controller);

        // Taking care of leaks / consumers / actuators volumes
        self.update_flows(context, ptu);

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
        self.update_pumps(context, main_section_pumps, system_section_pump);

        self.update_final_delta_vol_and_pressure(context);
    }

    fn update_delta_vol_from_valves(&mut self) {
        for (pump_index, section) in self.pump_sections.iter_mut().enumerate() {
            section.update_downstream_delta_vol(&self.pump_to_system_check_valves[pump_index]);
        }

        self.system_section
            .update_upstream_delta_vol(&self.pump_to_system_check_valves);
    }

    fn update_pumps(
        &mut self,
        context: &UpdateContext,
        main_section_pumps: &mut Vec<&mut impl PressureSource>,
        system_section_pump: Option<&mut impl PressureSource>,
    ) {
        for (pump_index, section) in self.pump_sections.iter_mut().enumerate() {
            section.update_pump_state(context, main_section_pumps[pump_index], &mut self.reservoir);
        }

        if let Some(pump) = system_section_pump {
            self.system_section
                .update_pump_state(context, pump, &mut self.reservoir);
        }
    }

    fn update_final_delta_vol_and_pressure(&mut self, context: &UpdateContext) {
        for section in &mut self.pump_sections {
            section.update_final_delta_vol_and_pressure(context, &self.fluid);
        }

        self.system_section
            .update_final_delta_vol_and_pressure(context, &self.fluid);
    }

    fn update_maximum_valve_flows(&mut self) {
        for (pump_section_idx, valve) in self.pump_to_system_check_valves.iter_mut().enumerate() {
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
        for (pump_index, section) in self.pump_sections.iter_mut().enumerate() {
            section.update_maximum_pumping_capacity(main_section_pumps[pump_index]);
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

    fn update_flows(&mut self, context: &UpdateContext, ptu: Option<&PowerTransferUnit>) {
        for section in &mut self.pump_sections {
            section.update_flow(context, &mut self.reservoir, ptu);
        }
        self.system_section
            .update_flow(context, &mut self.reservoir, ptu);
    }

    fn update_shutoff_valves(&mut self, controller: &impl HydraulicCircuitController) {
        self.pump_sections
            .iter_mut()
            .for_each(|section| section.update_shutoff_valve(controller));
    }

    fn update_final_valves_flows(&mut self) {
        let mut total_max_valves_volume = Volume::new::<gallon>(0.);

        for valve in &mut self.pump_to_system_check_valves {
            total_max_valves_volume += valve.max_virtual_volume;
        }

        let used_system_volume = self
            .system_section
            .volume_target
            .max(Volume::new::<gallon>(0.));

        if used_system_volume >= total_max_valves_volume {
            // If all the volume upstream is used by system section, each valve will provide its max volume available
            for valve in &mut self.pump_to_system_check_valves {
                valve.current_volume = valve.max_virtual_volume;
            }
        } else if total_max_valves_volume > Volume::new::<gallon>(0.) {
            let needed_ratio = used_system_volume / total_max_valves_volume;

            for valve in &mut self.pump_to_system_check_valves {
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

    pub fn pump_section_pressure_switch(&self, idx: usize) -> PressureSwitchState {
        self.pump_sections[idx].pressure_switch_state()
    }

    pub fn system_section_pressure_switch(&self) -> PressureSwitchState {
        self.system_section.pressure_switch_state()
    }

    pub fn reservoir_level(&self) -> Volume {
        self.reservoir.fluid_level_real()
    }

    pub fn reservoir(&self) -> &Reservoir {
        &self.reservoir
    }

    pub fn system_section(&self) -> &impl SectionPressure {
        &self.system_section
    }

    pub fn pump_section(&self, pump_index: usize) -> &impl SectionPressure {
        &self.pump_sections[pump_index]
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
    pressure_id: VariableIdentifier,

    section_id_number: usize,

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
        context: &mut InitContext,
        loop_id: &str,
        section_id: &str,
        pump_id: usize,
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
        let section_name: String = format!("HYD_{}_{}_{}_SECTION", loop_id, section_id, pump_id);

        Self {
            pressure_id: context
                .get_identifier(format!("{}_PRESSURE", section_name))
                .to_owned(),
            section_id_number: pump_id,
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

            pressure_switch: PressureSwitch::new(
                pressure_switch_hi_hyst,
                pressure_switch_lo_hyst,
                PressureSwitchType::Relative,
            ),

            total_actuator_consumed_volume: Volume::new::<gallon>(0.),
            total_actuator_returned_volume: Volume::new::<gallon>(0.),
        }
    }

    /// Gives the exact volume of fluid needed to get to any target_press pressure
    fn volume_to_reach_target(&self, target_press: Pressure, fluid: &Fluid) -> Volume {
        (target_press - self.current_pressure) * (self.max_high_press_volume) / fluid.bulk_mod()
    }

    fn pressure_switch_state(&self) -> PressureSwitchState {
        self.pressure_switch.state()
    }

    fn fire_valve_is_open(&self) -> bool {
        match &self.fire_valve {
            Some(valve) => valve.is_open(),
            None => true,
        }
    }

    fn update_shutoff_valve(&mut self, controller: &impl HydraulicCircuitController) {
        if let Some(valve) = &mut self.fire_valve {
            valve.update(controller.should_open_fire_shutoff_valve(self.section_id_number));
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
        context: &UpdateContext,
        reservoir: &mut Reservoir,
        ptu: Option<&PowerTransferUnit>,
    ) {
        let static_leak = self.static_leak(context);
        let mut delta_volume_flow_pass = -static_leak;

        reservoir.add_return_volume(static_leak);

        if let Some(accumulator) = &mut self.accumulator {
            accumulator.update(
                context,
                &mut delta_volume_flow_pass,
                self.current_pressure,
                self.volume_target,
            );
        }

        if let Some(ptu) = ptu {
            self.update_ptu_flows(context, ptu, &mut delta_volume_flow_pass, reservoir);
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
        self.max_pumpable_volume = if self.fire_valve_is_open() {
            pump.delta_vol_max()
        } else {
            Volume::new::<gallon>(0.)
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
        context: &UpdateContext,
        pump: &mut impl PressureSource,
        reservoir: &mut Reservoir,
    ) {
        // Final volume target to reach target pressure is:
        // raw volume_target - (upstream volume - downstream volume)
        let final_volume_needed_to_reach_target_pressure =
            self.volume_target - self.delta_vol_from_valves;

        pump.update_after_pressure_regulation(
            context,
            final_volume_needed_to_reach_target_pressure,
            reservoir,
            self.fire_valve_is_open(),
        );
        self.total_volume_pumped = pump.flow() * context.delta_as_time();
    }

    pub fn update_final_delta_vol_and_pressure(&mut self, context: &UpdateContext, fluid: &Fluid) {
        let mut final_delta_volume = self.delta_volume_flow_pass + self.delta_vol_from_valves;

        final_delta_volume += self.total_volume_pumped;

        self.current_volume += final_delta_volume;

        self.update_pressure(context, fluid);

        self.current_flow = final_delta_volume / context.delta_as_time();

        self.delta_vol_from_valves = Volume::new::<gallon>(0.);
        self.total_volume_pumped = Volume::new::<gallon>(0.);
    }

    fn update_pressure(&mut self, context: &UpdateContext, fluid: &Fluid) {
        let fluid_volume_compressed = self.current_volume - self.max_high_press_volume;

        self.current_pressure = Pressure::new::<psi>(14.7)
            + self.delta_pressure_from_delta_volume(fluid_volume_compressed, fluid);
        self.current_pressure = self.current_pressure.max(Pressure::new::<psi>(14.7));

        self.pressure_switch.update(context, self.current_pressure);
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

    pub fn accumulator_volume(&self) -> Volume {
        match &self.accumulator {
            Some(accumulator) => accumulator.fluid_volume(),
            None => Volume::new::<gallon>(0.),
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
                actual_flow = reservoir.try_take_flow(context, ptu.flow_to_left);
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
                actual_flow = reservoir.try_take_flow(context, ptu.flow_to_right);
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
        if let Some(fire_valve) = &mut self.fire_valve {
            fire_valve.accept(visitor);
        }

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.pressure_id, self.pressure());
    }
}
impl SectionPressure for Section {
    fn pressure(&self) -> Pressure {
        self.pressure()
    }

    fn is_pressure_switch_pressurised(&self) -> bool {
        self.pressure_switch_state() == PressureSwitchState::Pressurised
    }
}

pub struct FireValve {
    opened_id: VariableIdentifier,
    is_open: bool,
    bus_type: ElectricalBusType,
    is_powered: bool,
}
impl FireValve {
    fn new(
        context: &mut InitContext,
        hyd_loop_id: &str,
        pump_id: usize,
        bus_type: ElectricalBusType,
    ) -> Self {
        Self {
            opened_id: context
                .get_identifier(format!(
                    "HYD_{}_PUMP_{}_FIRE_VALVE_OPENED",
                    hyd_loop_id, pump_id
                ))
                .to_owned(),
            is_open: true,
            bus_type,
            is_powered: false,
        }
    }

    /// Updates opening state:
    /// A firevalve will move if powered, stay at current position if unpowered
    fn update(&mut self, valve_open_command: bool) {
        if self.is_powered {
            self.is_open = valve_open_command;
        }
    }

    fn is_open(&self) -> bool {
        self.is_open
    }
}
impl SimulationElement for FireValve {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.opened_id, self.is_open());
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        // TODO is actually powered by a sub-bus (401PP DC ESS)
        self.is_powered = buses.is_powered(self.bus_type);
    }
}

/// Handles the flow that goes between two sections
/// Flow is handled in two ways:
/// - An optional flow that can only pass through if downstream needs flow
/// and if upstream has enough capacity to provide flow while maintaining its target pressure
/// - A physical flow, that is mandatory to pass through the valve, caused by pressure difference between
/// upstream and downstream.

#[derive(Default)]
pub struct CheckValve {
    current_volume: Volume,
    max_virtual_volume: Volume,
}
impl CheckValve {
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

        self.max_virtual_volume = available_volume_from_upstream.max(Volume::new::<gallon>(0.));
    }
}

pub struct Reservoir {
    level_id: VariableIdentifier,
    low_level_id: VariableIdentifier,

    max_capacity: Volume,
    max_gaugeable: Volume,
    current_level: Volume,
    min_usable: Volume,

    air_pressure: Pressure,

    air_pressure_switches: Vec<PressureSwitch>,

    level_switch: LevelSwitch,

    leak_failure: Failure,
    return_failure: Failure,
}
impl Reservoir {
    const MIN_USABLE_VOLUME_GAL: f64 = 0.2;

    const LEAK_FAILURE_FLOW_GAL_PER_S: f64 = 0.1;

    // Part of the fluid lost instead of returning to reservoir
    const RETURN_FAILURE_LEAK_RATIO: f64 = 0.1;

    pub fn new(
        context: &mut InitContext,
        hyd_loop_id: &str,
        max_capacity: Volume,
        max_gaugeable: Volume,
        current_level: Volume,
        air_pressure_switches: Vec<PressureSwitch>,
        low_level_threshold: Volume,
    ) -> Self {
        let leak_failure = match hyd_loop_id {
            "GREEN" => Failure::new(FailureType::GreenReservoirLeak),
            "BLUE" => Failure::new(FailureType::BlueReservoirLeak),
            "YELLOW" => Failure::new(FailureType::YellowReservoirLeak),
            _ => Failure::new(FailureType::YellowReservoirLeak),
        };

        let return_failure = match hyd_loop_id {
            "GREEN" => Failure::new(FailureType::GreenReservoirReturnLeak),
            "BLUE" => Failure::new(FailureType::BlueReservoirReturnLeak),
            "YELLOW" => Failure::new(FailureType::YellowReservoirReturnLeak),
            _ => Failure::new(FailureType::YellowReservoirLeak),
        };

        Self {
            level_id: context.get_identifier(format!("HYD_{}_RESERVOIR_LEVEL", hyd_loop_id)),
            low_level_id: context
                .get_identifier(format!("HYD_{}_RESERVOIR_LEVEL_IS_LOW", hyd_loop_id)),
            max_capacity,
            max_gaugeable,
            current_level,
            min_usable: Volume::new::<gallon>(Self::MIN_USABLE_VOLUME_GAL),
            air_pressure: Pressure::new::<psi>(50.),
            leak_failure,
            return_failure,
            air_pressure_switches,
            level_switch: LevelSwitch::new(low_level_threshold),
        }
    }

    fn update(&mut self, context: &UpdateContext, air_pressure: Pressure) {
        self.air_pressure = air_pressure;

        self.level_switch.update(self.current_level);

        self.update_pressure_switches(context);

        self.update_leak_failure(context);
    }

    fn update_leak_failure(&mut self, context: &UpdateContext) {
        if self.leak_failure.is_active() {
            self.current_level -=
                VolumeRate::new::<gallon_per_second>(Self::LEAK_FAILURE_FLOW_GAL_PER_S)
                    * context.delta_as_time();

            self.current_level = self.current_level.max(Volume::new::<gallon>(0.));
        }
    }

    fn update_pressure_switches(&mut self, context: &UpdateContext) {
        for switch in &mut self.air_pressure_switches {
            switch.update(context, self.air_pressure)
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
    fn try_take_flow(&mut self, context: &UpdateContext, flow: VolumeRate) -> VolumeRate {
        let desired_volume = flow * context.delta_as_time();
        let volume_taken = self.try_take_volume(desired_volume);
        volume_taken / context.delta_as_time()
    }

    // What's current flow available
    fn request_flow_availability(&self, context: &UpdateContext, flow: VolumeRate) -> VolumeRate {
        let desired_volume = flow * context.delta_as_time();
        let max_volume_available = self.current_level - self.min_usable;
        max_volume_available.min(desired_volume) / context.delta_as_time()
    }

    fn add_return_volume(&mut self, volume: Volume) {
        let volume_actually_returned = if !self.return_failure.is_active() {
            volume
        } else {
            volume - (Self::RETURN_FAILURE_LEAK_RATIO * volume)
        };

        self.current_level = (self.current_level + volume_actually_returned).min(self.max_capacity);
    }

    fn fluid_level_real(&self) -> Volume {
        self.current_level
    }

    fn fluid_level_from_gauge(&self) -> Volume {
        self.current_level.min(self.max_gaugeable)
    }

    pub fn air_pressure(&self) -> Pressure {
        self.air_pressure
    }

    fn is_empty(&self) -> bool {
        self.fluid_level_real() <= Volume::new::<gallon>(Self::MIN_USABLE_VOLUME_GAL)
    }

    pub fn is_low_air_pressure(&self) -> bool {
        for switch in &self.air_pressure_switches {
            if switch.state() == PressureSwitchState::NotPressurised {
                return true;
            }
        }

        false
    }

    pub fn is_low_level(&self) -> bool {
        self.level_switch.is_low_level()
    }
}
impl SimulationElement for Reservoir {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.leak_failure.accept(visitor);
        self.return_failure.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.level_id, self.fluid_level_from_gauge());
        writer.write(&self.low_level_id, self.is_low_level());
    }
}
impl PressurizeableReservoir for Reservoir {
    fn available_volume(&self) -> Volume {
        self.max_capacity - self.fluid_level_real()
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

    speed: AngularVelocity,

    cavitation_efficiency: Ratio,
}
impl Pump {
    const AIR_PRESSURE_BREAKPTS_PSI: [f64; 9] = [0., 5., 10., 15., 20., 30., 50., 70., 100.];
    const AIR_PRESSURE_CARAC_RATIO: [f64; 9] = [0.0, 0.1, 0.6, 0.8, 0.9, 1., 1., 1., 1.];

    fn new(press_breakpoints: [f64; 9], displacement_carac: [f64; 9]) -> Self {
        Self {
            delta_vol_max: Volume::new::<gallon>(0.),
            current_displacement: Volume::new::<gallon>(0.),
            current_flow: VolumeRate::new::<gallon_per_second>(0.),
            current_max_displacement: Volume::new::<gallon>(0.),
            press_breakpoints,
            displacement_carac,

            speed: AngularVelocity::new::<revolution_per_minute>(0.),

            cavitation_efficiency: Ratio::new::<ratio>(1.),
        }
    }

    fn update<T: PumpController>(
        &mut self,
        context: &UpdateContext,
        section: &impl SectionPressure,
        reservoir: &Reservoir,
        speed: AngularVelocity,
        controller: &T,
    ) {
        self.speed = speed;

        self.update_cavitation(reservoir);

        let theoretical_displacement = self.calculate_displacement(section, controller);

        self.current_max_displacement = self.cavitation_efficiency * theoretical_displacement;

        let max_flow = Self::calculate_flow(speed, self.current_max_displacement)
            .max(VolumeRate::new::<gallon_per_second>(0.));

        let max_flow_available_from_reservoir =
            reservoir.request_flow_availability(context, max_flow);

        self.delta_vol_max = max_flow_available_from_reservoir * context.delta_as_time();
    }

    fn update_cavitation(&mut self, reservoir: &Reservoir) {
        self.cavitation_efficiency = Ratio::new::<ratio>(interpolation(
            &Self::AIR_PRESSURE_BREAKPTS_PSI,
            &Self::AIR_PRESSURE_CARAC_RATIO,
            reservoir.air_pressure().get::<psi>(),
        ));

        if reservoir.is_empty() {
            self.cavitation_efficiency = Ratio::new::<ratio>(0.);
        }
    }

    fn calculate_displacement<T: PumpController>(
        &self,
        section: &impl SectionPressure,
        controller: &T,
    ) -> Volume {
        if controller.should_pressurise() {
            Volume::new::<cubic_inch>(interpolation(
                &self.press_breakpoints,
                &self.displacement_carac,
                section.pressure().get::<psi>(),
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

    fn cavitation_efficiency(&self) -> Ratio {
        self.cavitation_efficiency
    }
}
impl PressureSource for Pump {
    fn delta_vol_max(&self) -> Volume {
        self.delta_vol_max
    }

    fn update_after_pressure_regulation(
        &mut self,
        context: &UpdateContext,
        volume_required: Volume,
        reservoir: &mut Reservoir,
        is_pump_connected_to_reservoir: bool,
    ) {
        let required_flow = volume_required / context.delta_as_time();
        self.current_displacement = self.calculate_displacement_from_required_flow(required_flow);
        let max_current_flow = self.get_max_flow();

        self.current_flow = if is_pump_connected_to_reservoir {
            reservoir.try_take_flow(context, max_current_flow)
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
    cavitation_id: VariableIdentifier,
    pump: Pump,
    pump_physics: ElectricalPumpPhysics,
}
impl ElectricPump {
    const NOMINAL_SPEED: f64 = 7600.0;
    const DISPLACEMENT_BREAKPTS: [f64; 9] = [
        0.0, 500.0, 1000.0, 1500.0, 2175.0, 2850.0, 3080.0, 3100.0, 3500.0,
    ];
    const DISPLACEMENT_MAP: [f64; 9] = [0.263, 0.263, 0.263, 0.263, 0.263, 0.2, 0.0, 0.0, 0.0];

    pub fn new(
        context: &mut InitContext,
        id: &str,
        bus_type: ElectricalBusType,
        max_current: ElectricCurrent,
    ) -> Self {
        Self {
            cavitation_id: context.get_identifier(format!("HYD_{}_EPUMP_CAVITATION", id)),
            pump: Pump::new(Self::DISPLACEMENT_BREAKPTS, Self::DISPLACEMENT_MAP),
            pump_physics: ElectricalPumpPhysics::new(
                context,
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
        section: &impl SectionPressure,
        reservoir: &Reservoir,
        controller: &T,
    ) {
        self.pump_physics.set_active(controller.should_pressurise());
        self.pump_physics
            .update(context, section, self.pump.displacement());

        self.pump.update(
            context,
            section,
            reservoir,
            self.pump_physics.speed(),
            controller,
        );
    }

    pub fn cavitation_efficiency(&self) -> Ratio {
        self.pump.cavitation_efficiency()
    }

    pub fn flow(&self) -> VolumeRate {
        self.pump.flow()
    }
}
impl PressureSource for ElectricPump {
    fn delta_vol_max(&self) -> Volume {
        self.pump.delta_vol_max()
    }

    fn update_after_pressure_regulation(
        &mut self,
        context: &UpdateContext,
        volume_required: Volume,
        reservoir: &mut Reservoir,
        is_pump_connected_to_reservoir: bool,
    ) {
        self.pump.update_after_pressure_regulation(
            context,
            volume_required,
            reservoir,
            is_pump_connected_to_reservoir,
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

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.cavitation_id,
            self.cavitation_efficiency().get::<ratio>(),
        );
    }
}

pub struct EngineDrivenPump {
    active_id: VariableIdentifier,

    is_active: bool,
    speed: AngularVelocity,
    pump: Pump,
}
impl EngineDrivenPump {
    const DISPLACEMENT_BREAKPTS: [f64; 9] = [
        0.0, 500.0, 1000.0, 1500.0, 2800.0, 2950.0, 3000.0, 3020.0, 3500.0,
    ];
    const DISPLACEMENT_MAP: [f64; 9] = [2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.2, 1.0, 0.0];

    pub fn new(context: &mut InitContext, id: &str) -> Self {
        Self {
            active_id: context.get_identifier(format!("HYD_{}_EDPUMP_ACTIVE", id)),
            is_active: false,
            speed: AngularVelocity::new::<revolution_per_minute>(0.),
            pump: Pump::new(Self::DISPLACEMENT_BREAKPTS, Self::DISPLACEMENT_MAP),
        }
    }

    pub fn update<T: PumpController>(
        &mut self,
        context: &UpdateContext,
        section: &impl SectionPressure,
        reservoir: &Reservoir,
        pump_speed: AngularVelocity,
        controller: &T,
    ) {
        self.speed = pump_speed;
        self.pump
            .update(context, section, reservoir, pump_speed, controller);
        self.is_active = controller.should_pressurise();
    }
}
impl PressureSource for EngineDrivenPump {
    fn delta_vol_max(&self) -> Volume {
        self.pump.delta_vol_max()
    }

    fn update_after_pressure_regulation(
        &mut self,
        context: &UpdateContext,
        volume_required: Volume,
        reservoir: &mut Reservoir,
        is_pump_connected_to_reservoir: bool,
    ) {
        self.pump.update_after_pressure_regulation(
            context,
            volume_required,
            reservoir,
            is_pump_connected_to_reservoir,
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
    rpm_id: VariableIdentifier,

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

    fn new(context: &mut InitContext) -> Self {
        Self {
            rpm_id: context.get_identifier("HYD_RAT_RPM".to_owned()),

            position: Self::STOWED_ANGLE,
            speed: AngularVelocity::new::<revolution_per_minute>(0.),
            acceleration: 0.,
            torque_sum: 0.,
        }
    }

    fn speed(&self) -> AngularVelocity {
        self.speed
    }

    fn update_generated_torque(&mut self, indicated_speed: Velocity, stow_pos: f64) {
        let cur_alpha = interpolation(
            &Self::RPM_GOVERNOR_BREAKPTS,
            &Self::PROP_ALPHA_MAP,
            self.speed().get::<revolution_per_minute>(),
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
        if self.speed().get::<revolution_per_minute>() < Self::LOW_SPEED_PHYSICS_ACTIVATION {
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
        writer.write(&self.rpm_id, self.speed().get::<revolution_per_minute>());
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
    stow_position_id: VariableIdentifier,

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

    // Speed to go from 0 to 1 stow position per sec. 1 means full deploying in 1s
    const STOWING_SPEED: f64 = 1.;

    pub fn new(context: &mut InitContext) -> Self {
        let mut max_disp = 0.;
        for v in Self::DISPLACEMENT_MAP.iter() {
            if v > &max_disp {
                max_disp = *v;
            }
        }

        Self {
            stow_position_id: context.get_identifier("HYD_RAT_STOW_POSITION".to_owned()),

            deployment_commanded: false,
            pump: Pump::new(Self::DISPLACEMENT_BREAKPTS, Self::DISPLACEMENT_MAP),
            pump_controller: AlwaysPressurisePumpController::new(),
            wind_turbine: WindTurbine::new(context),
            position: 0.,
            max_displacement: max_disp,
        }
    }

    pub fn update<T: RamAirTurbineController>(
        &mut self,
        context: &UpdateContext,
        section: &impl SectionPressure,
        reservoir: &Reservoir,
        controller: &T,
    ) {
        // Once commanded, stays commanded forever
        self.deployment_commanded = controller.should_deploy() || self.deployment_commanded;

        self.pump.update(
            context,
            section,
            reservoir,
            self.wind_turbine.speed(),
            &self.pump_controller,
        );
    }

    pub fn update_physics(&mut self, delta_time: &Duration, indicated_airspeed: Velocity) {
        // Calculate the ratio of current displacement vs max displacement as an image of the load of the pump
        let displacement_ratio = self.delta_vol_max().get::<gallon>() / self.max_displacement;
        self.wind_turbine.update(
            delta_time,
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

    fn update_after_pressure_regulation(
        &mut self,
        context: &UpdateContext,
        volume_required: Volume,
        reservoir: &mut Reservoir,
        is_pump_connected_to_reservoir: bool,
    ) {
        self.pump.update_after_pressure_regulation(
            context,
            volume_required,
            reservoir,
            is_pump_connected_to_reservoir,
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
        writer.write(&self.stow_position_id, self.position);
    }
}

#[cfg(test)]
mod tests {
    use crate::simulation::test::{ElementCtorFn, ReadByName, SimulationTestBed, TestBed};
    use crate::simulation::InitContext;
    use ntest::assert_about_eq;

    use uom::si::{f64::*, pressure::psi, ratio::percent, volume::gallon};

    use super::*;

    #[test]
    fn section_writes_its_state() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            section(context, "BROWN", "PUMP", 2)
        }));

        test_bed.run();

        assert!(test_bed.contains_variable_with_name("HYD_BROWN_PUMP_2_SECTION_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("HYD_BROWN_PUMP_2_FIRE_VALVE_OPENED"));
    }

    #[test]
    fn hyd_circuit_writes_its_state() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            hydraulic_circuit(context, "BROWN", 2)
        }));

        test_bed.run();

        assert!(test_bed.contains_variable_with_name("HYD_BROWN_SYSTEM_1_SECTION_PRESSURE"));
        assert!(!test_bed.contains_variable_with_name("HYD_BROWN_SYSTEM_1_FIRE_VALVE_OPENED"));

        assert!(test_bed.contains_variable_with_name("HYD_BROWN_PUMP_1_SECTION_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("HYD_BROWN_PUMP_1_FIRE_VALVE_OPENED"));

        assert!(test_bed.contains_variable_with_name("HYD_BROWN_PUMP_2_SECTION_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("HYD_BROWN_PUMP_2_FIRE_VALVE_OPENED"));

        assert!(!test_bed.contains_variable_with_name("HYD_BROWN_PUMP_0_SECTION_PRESSURE"));
        assert!(!test_bed.contains_variable_with_name("HYD_BROWN_PUMP_0_FIRE_VALVE_OPENED"));

        assert!(!test_bed.contains_variable_with_name("HYD_BROWN_PUMP_3_SECTION_PRESSURE"));
        assert!(!test_bed.contains_variable_with_name("HYD_BROWN_PUMP_3_FIRE_VALVE_OPENED"));
    }

    #[test]
    fn reservoir_gives_desired_flow() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            reservoir(
                context,
                "GREEN",
                Volume::new::<gallon>(5.),
                Volume::new::<gallon>(5.),
                Volume::new::<gallon>(5.),
            )
        }));

        assert_about_eq!(
            test_bed
                .command_element(|r| r.try_take_volume(Volume::new::<gallon>(1.)).get::<gallon>()),
            1.
        );

        assert_about_eq!(
            test_bed.query_element(|r| r.fluid_level_real().get::<gallon>()),
            4.
        );

        assert_about_eq!(
            test_bed.query_element(|r| r.fluid_level_from_gauge().get::<gallon>()),
            4.
        );
    }

    #[test]
    fn reservoir_gives_only_volume_available() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            reservoir(
                context,
                "GREEN",
                Volume::new::<gallon>(5.),
                Volume::new::<gallon>(5.),
                Volume::new::<gallon>(5.),
            )
        }));

        let drawn_volume =
            test_bed.command_element(|r| r.try_take_volume(Volume::new::<gallon>(10.)));
        assert!(drawn_volume.get::<gallon>() == 5. - Reservoir::MIN_USABLE_VOLUME_GAL);
    }

    #[test]
    fn reservoir_reports_only_gaugeable_volume() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            reservoir(
                context,
                "GREEN",
                Volume::new::<gallon>(5.),
                Volume::new::<gallon>(2.),
                Volume::new::<gallon>(5.),
            )
        }));

        test_bed.run();

        let volume_gallon: f64 = test_bed.read_by_name("HYD_GREEN_RESERVOIR_LEVEL");

        assert_about_eq!(volume_gallon, 2.);
    }

    #[test]
    fn reservoir_leaking_loses_fluid() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            reservoir(
                context,
                "GREEN",
                Volume::new::<gallon>(5.),
                Volume::new::<gallon>(2.),
                Volume::new::<gallon>(5.),
            )
        }));

        test_bed.set_update_after_power_distribution(|reservoir, context| {
            reservoir.update(context, Pressure::new::<psi>(50.))
        });

        test_bed.fail(FailureType::GreenReservoirLeak);
        test_bed.run_multiple_frames(Duration::from_secs(10));

        let volume_after_leak_gallon: f64 = test_bed.read_by_name("HYD_GREEN_RESERVOIR_LEVEL");
        assert!(volume_after_leak_gallon < 4.5);
    }

    #[test]
    fn reservoir_leaking_cant_go_lower_then_0() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            reservoir(
                context,
                "GREEN",
                Volume::new::<gallon>(5.),
                Volume::new::<gallon>(2.),
                Volume::new::<gallon>(0.5),
            )
        }));

        test_bed.set_update_after_power_distribution(|reservoir, context| {
            reservoir.update(context, Pressure::new::<psi>(50.))
        });

        test_bed.fail(FailureType::GreenReservoirLeak);
        test_bed.run_multiple_frames(Duration::from_secs(10));

        let volume_after_leak_gallon: f64 = test_bed.read_by_name("HYD_GREEN_RESERVOIR_LEVEL");
        assert!(volume_after_leak_gallon == 0.);
    }

    #[test]
    fn reservoir_empty_has_level_switch_reporting_empty() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            reservoir(
                context,
                "GREEN",
                Volume::new::<gallon>(5.),
                Volume::new::<gallon>(2.),
                Volume::new::<gallon>(0.5),
            )
        }));

        test_bed.set_update_after_power_distribution(|reservoir, context| {
            reservoir.update(context, Pressure::new::<psi>(50.))
        });

        let is_low: bool = test_bed.read_by_name("HYD_GREEN_RESERVOIR_LEVEL_IS_LOW");
        assert!(!is_low);

        test_bed.fail(FailureType::GreenReservoirLeak);
        test_bed.run_multiple_frames(Duration::from_secs(10));

        let is_low: bool = test_bed.read_by_name("HYD_GREEN_RESERVOIR_LEVEL_IS_LOW");
        assert!(is_low);
    }

    fn section(
        context: &mut InitContext,
        loop_id: &str,
        section_id: &str,
        pump_id: usize,
    ) -> Section {
        let fire_valve = Some(FireValve::new(
            context,
            loop_id,
            pump_id,
            HydraulicCircuit::DEFAULT_FIRE_VALVE_POWERING_BUS,
        ));
        Section::new(
            context,
            loop_id,
            section_id,
            pump_id,
            VolumeRate::new::<gallon_per_second>(
                HydraulicCircuit::PUMP_SECTION_STATIC_LEAK_GAL_P_S,
            ),
            Volume::new::<gallon>(HydraulicCircuit::PUMP_SECTION_MAX_VOLUME_GAL),
            Volume::new::<gallon>(HydraulicCircuit::PUMP_SECTION_MAX_VOLUME_GAL),
            None,
            Pressure::new::<psi>(1400.),
            Pressure::new::<psi>(2000.),
            fire_valve,
            false,
            false,
        )
    }

    fn reservoir(
        context: &mut InitContext,
        hyd_loop_id: &str,
        max_capacity: Volume,
        max_gaugeable: Volume,
        current_level: Volume,
    ) -> Reservoir {
        Reservoir::new(
            context,
            hyd_loop_id,
            max_capacity,
            max_gaugeable,
            current_level,
            vec![PressureSwitch::new(
                Pressure::new::<psi>(23.45),
                Pressure::new::<psi>(20.55),
                PressureSwitchType::Relative,
            )],
            max_capacity * 0.1,
        )
    }

    fn hydraulic_circuit(
        context: &mut InitContext,
        loop_color: &str,
        main_pump_number: usize,
    ) -> HydraulicCircuit {
        let reservoir = reservoir(
            context,
            loop_color,
            Volume::new::<gallon>(5.),
            Volume::new::<gallon>(4.),
            Volume::new::<gallon>(3.),
        );
        HydraulicCircuit::new(
            context,
            loop_color,
            main_pump_number,
            Ratio::new::<percent>(100.),
            Volume::new::<gallon>(10.),
            reservoir,
            Pressure::new::<psi>(1450.),
            Pressure::new::<psi>(1900.),
            Pressure::new::<psi>(1300.),
            Pressure::new::<psi>(1800.),
            true,
            false,
        )
    }

    fn engine_driven_pump(context: &mut InitContext) -> EngineDrivenPump {
        EngineDrivenPump::new(context, "DEFAULT")
    }

    #[cfg(test)]
    mod edp_tests {
        use super::*;

        use crate::simulation::test::{ElementCtorFn, SimulationTestBed};

        #[test]
        fn starts_inactive() {
            let test_bed = SimulationTestBed::from(ElementCtorFn(engine_driven_pump));

            assert!(test_bed.query_element(|e| !e.is_active));
        }
    }
}
