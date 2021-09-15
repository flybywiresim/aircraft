use self::brake_circuit::Actuator;
use crate::shared::{interpolation, ElectricalBusType, ElectricalBuses};
use crate::simulation::{
    SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext, Write,
};
use std::string::String;
use std::time::Duration;
use uom::si::{
    f64::*,
    pressure::psi,
    velocity::knot,
    volume::{cubic_inch, gallon},
    volume_rate::gallon_per_second,
};

pub mod brake_circuit;
pub mod flap_slat;

pub trait PressureSource {
    /// Gives the maximum available volume at that time as if it is a variable displacement
    /// pump it can be adjusted by pump regulation.
    fn delta_vol_max(&self) -> Volume;

    /// Gives the minimum volume that will be output no matter what.
    /// For example if there is a minimal displacement or a fixed displacement (ie. elec pump).
    fn delta_vol_min(&self) -> Volume;
}

// TODO update method that can update physic constants from given temperature
// This would change pressure response to volume
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
    const FLOW_DYNAMIC_LOW_PASS_LEFT_SIDE: f64 = 0.35;
    const FLOW_DYNAMIC_LOW_PASS_RIGHT_SIDE: f64 = 0.35;

    const EFFICIENCY_LEFT_TO_RIGHT: f64 = 0.8;
    const EFFICIENCY_RIGHT_TO_LEFT: f64 = 0.8;

    // Part of the max total pump capacity PTU model is allowed to take. Set to 1 all capacity used
    // set to 0.5 PTU will only use half of the flow that all pumps are able to generate
    const AGRESSIVENESS_FACTOR: f64 = 0.78;

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
        loop_left: &HydraulicLoop,
        loop_right: &HydraulicLoop,
        controller: &T,
    ) {
        self.is_enabled = controller.should_enable();

        let delta_p = loop_left.pressure() - loop_right.pressure();

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
            let mut vr = 16.0f64.min(loop_left.loop_pressure.get::<psi>() * 0.0058) / 60.0;

            // Limiting available flow with maximum flow capacity of all pumps of the loop.
            // This is a workaround to limit PTU greed for flow
            vr = vr.min(
                loop_left.current_max_flow.get::<gallon_per_second>() * Self::AGRESSIVENESS_FACTOR,
            );

            // Low pass on flow
            vr = Self::FLOW_DYNAMIC_LOW_PASS_LEFT_SIDE * vr
                + (1.0 - Self::FLOW_DYNAMIC_LOW_PASS_LEFT_SIDE)
                    * self.last_flow.get::<gallon_per_second>();

            self.flow_to_left = VolumeRate::new::<gallon_per_second>(-vr);
            self.flow_to_right =
                VolumeRate::new::<gallon_per_second>(vr * Self::EFFICIENCY_LEFT_TO_RIGHT);
            self.last_flow = VolumeRate::new::<gallon_per_second>(vr);

            self.is_active_left = true;
        } else if delta_p.get::<psi>() < -500.
            || (self.is_active_right && delta_p.get::<psi>() < -5.)
        {
            // Right sends flow to left
            let mut vr = 34.0f64.min(loop_right.loop_pressure.get::<psi>() * 0.0125) / 60.0;

            // Limiting available flow with maximum flow capacity of all pumps of the loop.
            // This is a workaround to limit PTU greed for flow
            vr = vr.min(
                loop_right.current_max_flow.get::<gallon_per_second>() * Self::AGRESSIVENESS_FACTOR,
            );

            // Low pass on flow
            vr = Self::FLOW_DYNAMIC_LOW_PASS_RIGHT_SIDE * vr
                + (1.0 - Self::FLOW_DYNAMIC_LOW_PASS_RIGHT_SIDE)
                    * self.last_flow.get::<gallon_per_second>();

            self.flow_to_left =
                VolumeRate::new::<gallon_per_second>(vr * Self::EFFICIENCY_RIGHT_TO_LEFT);
            self.flow_to_right = VolumeRate::new::<gallon_per_second>(-vr);
            self.last_flow = VolumeRate::new::<gallon_per_second>(vr);

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
    fn should_open_fire_shutoff_valve(&self) -> bool;
}

struct Accumulator {
    total_volume: Volume,
    gas_init_precharge: Pressure,
    gas_pressure: Pressure,
    gas_volume: Volume,
    fluid_volume: Volume,
    current_flow: VolumeRate,
    current_delta_vol: Volume,
    press_breakpoints: [f64; 10],
    flow_carac: [f64; 10],
    has_control_valve: bool,
}
impl Accumulator {
    const FLOW_DYNAMIC_LOW_PASS: f64 = 0.7;

    fn new(
        gas_precharge: Pressure,
        total_volume: Volume,
        fluid_vol_at_init: Volume,
        press_breakpoints: [f64; 10],
        flow_carac: [f64; 10],
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
            press_breakpoints,
            flow_carac,
            has_control_valve,
        }
    }

    fn update(&mut self, context: &UpdateContext, delta_vol: &mut Volume, loop_pressure: Pressure) {
        let accumulator_delta_press = self.gas_pressure - loop_pressure;
        let mut flow_variation = VolumeRate::new::<gallon_per_second>(interpolation(
            &self.press_breakpoints,
            &self.flow_carac,
            accumulator_delta_press.get::<psi>().abs(),
        ));
        flow_variation = flow_variation * Self::FLOW_DYNAMIC_LOW_PASS
            + (1. - Self::FLOW_DYNAMIC_LOW_PASS) * self.current_flow;

        // TODO HANDLE OR CHECK IF RESERVOIR AVAILABILITY is OK
        // TODO check if accumulator can be used as a min/max flow producer to
        // avoid it being a consumer that might unsettle pressure
        if accumulator_delta_press.get::<psi>() > 0.0 && !self.has_control_valve {
            let volume_from_acc = self
                .fluid_volume
                .min(flow_variation * context.delta_as_time());
            self.fluid_volume -= volume_from_acc;
            self.gas_volume += volume_from_acc;
            self.current_delta_vol = -volume_from_acc;

            *delta_vol += volume_from_acc;
        } else if accumulator_delta_press.get::<psi>() < 0.0 {
            let volume_to_acc = delta_vol
                .max(Volume::new::<gallon>(0.0))
                .max(flow_variation * context.delta_as_time());
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
pub struct HydraulicLoop {
    pressure_id: String,
    reservoir_id: String,
    fire_valve_id: String,
    fluid: Fluid,
    accumulator: Accumulator,
    connected_to_ptu_left_side: bool,
    connected_to_ptu_right_side: bool,
    loop_pressure: Pressure,
    loop_volume: Volume,
    max_loop_volume: Volume,
    high_pressure_volume: Volume,
    ptu_active: bool,
    reservoir_volume: Volume,
    current_delta_vol: Volume,
    current_flow: VolumeRate,
    /// Current total max flow available from pressure sources
    current_max_flow: VolumeRate,
    fire_shutoff_valve_opened: bool,
    has_fire_valve: bool,
    min_pressure_pressurised_lo_hyst: Pressure,
    min_pressure_pressurised_hi_hyst: Pressure,
    is_pressurised: bool,
    total_actuators_consumed_volume: Volume,
    total_actuators_returned_volume: Volume,
}
impl HydraulicLoop {
    // Nitrogen PSI
    const ACCUMULATOR_GAS_PRE_CHARGE_PSI: f64 = 1885.0;
    // in gallons
    const ACCUMULATOR_MAX_VOLUME_GALLONS: f64 = 0.264;

    // Gallon per s of flow lost to reservoir @ 3000psi
    const STATIC_LEAK_FLOW_GALLON_PER_SECOND: f64 = 0.05;

    const DELTA_VOL_LOW_PASS_FILTER: f64 = 0.4;

    const ACCUMULATOR_PRESS_BREAKPTS: [f64; 10] = [
        0.0, 1., 5.0, 50.0, 100., 200.0, 500.0, 1000., 2000.0, 10000.0,
    ];
    const ACCUMULATOR_FLOW_CARAC: [f64; 10] =
        [0.0, 0.001, 0.005, 0.05, 0.08, 0.15, 0.25, 0.35, 0.5, 0.5];

    #[allow(clippy::too_many_arguments)]
    pub fn new(
        id: &str,
        connected_to_ptu_left_side: bool, // Is connected to PTU "left" side: non variable displacement side
        connected_to_ptu_right_side: bool, // Is connected to PTU "right" side: variable displacement side
        loop_volume: Volume,
        max_loop_volume: Volume,
        high_pressure_volume: Volume,
        reservoir_volume: Volume,
        fluid: Fluid,
        has_fire_valve: bool,
        min_pressure_pressurised_lo_hyst: Pressure,
        min_pressure_pressurised_hi_hyst: Pressure,
    ) -> Self {
        Self {
            pressure_id: format!("HYD_{}_PRESSURE", id),
            reservoir_id: format!("HYD_{}_RESERVOIR", id),
            fire_valve_id: format!("HYD_{}_FIRE_VALVE_OPENED", id),

            connected_to_ptu_left_side,
            connected_to_ptu_right_side,
            loop_pressure: Pressure::new::<psi>(14.7),
            loop_volume,
            max_loop_volume,
            high_pressure_volume,
            ptu_active: false,
            reservoir_volume,
            fluid,
            accumulator: Accumulator::new(
                Pressure::new::<psi>(Self::ACCUMULATOR_GAS_PRE_CHARGE_PSI),
                Volume::new::<gallon>(Self::ACCUMULATOR_MAX_VOLUME_GALLONS),
                Volume::new::<gallon>(0.),
                Self::ACCUMULATOR_PRESS_BREAKPTS,
                Self::ACCUMULATOR_FLOW_CARAC,
                false,
            ),
            current_delta_vol: Volume::new::<gallon>(0.),
            current_flow: VolumeRate::new::<gallon_per_second>(0.),
            current_max_flow: VolumeRate::new::<gallon_per_second>(0.),
            fire_shutoff_valve_opened: true,
            has_fire_valve,
            min_pressure_pressurised_lo_hyst,
            min_pressure_pressurised_hi_hyst,
            is_pressurised: false,
            total_actuators_consumed_volume: Volume::new::<gallon>(0.),
            total_actuators_returned_volume: Volume::new::<gallon>(0.),
        }
    }

    pub fn current_flow(&self) -> VolumeRate {
        self.current_flow
    }

    pub fn current_delta_vol(&self) -> Volume {
        self.current_delta_vol
    }

    pub fn accumulator_gas_pressure(&self) -> Pressure {
        self.accumulator.gas_pressure
    }

    pub fn accumulator_fluid_volume(&self) -> Volume {
        self.accumulator.fluid_volume
    }

    pub fn pressure(&self) -> Pressure {
        self.loop_pressure
    }

    pub fn reservoir_volume(&self) -> Volume {
        self.reservoir_volume
    }

    pub fn loop_fluid_volume(&self) -> Volume {
        self.loop_volume
    }

    pub fn max_volume(&self) -> Volume {
        self.max_loop_volume
    }

    pub fn accumulator_gas_volume(&self) -> Volume {
        self.accumulator.gas_volume
    }

    pub fn update_actuator_volumes<T: Actuator>(&mut self, actuator: &T) {
        self.total_actuators_consumed_volume += actuator.used_volume();
        self.total_actuators_returned_volume += actuator.reservoir_return();
    }

    /// Returns the max flow that can be output from reservoir in dt time
    fn get_usable_reservoir_flow(&self, amount: VolumeRate, delta_time: Time) -> VolumeRate {
        let mut drawn = amount;

        let max_flow = self.reservoir_volume / delta_time;
        if amount > max_flow {
            drawn = max_flow;
        }
        drawn
    }

    /// Method to update pressure of a loop. The more delta volume is added, the more pressure rises
    /// directly from bulk modulus equation
    fn delta_pressure_from_delta_volume(&self, delta_vol: Volume) -> Pressure {
        return delta_vol / self.high_pressure_volume * self.fluid.bulk_mod();
    }

    /// Gives the exact volume of fluid needed to get to any target_press pressure
    fn vol_to_target(&self, target_press: Pressure) -> Volume {
        (target_press - self.loop_pressure) * (self.high_pressure_volume) / self.fluid.bulk_mod()
    }

    pub fn is_fire_shutoff_valve_opened(&self) -> bool {
        self.fire_shutoff_valve_opened
    }

    fn update_ptu_flows(
        &mut self,
        context: &UpdateContext,
        ptus: Vec<&PowerTransferUnit>,
        delta_vol: &mut Volume,
        reservoir_return: &mut Volume,
    ) {
        let mut ptu_act = false;
        for ptu in ptus {
            let actual_flow;
            if self.connected_to_ptu_left_side {
                if ptu.is_active_left || ptu.is_active_right {
                    ptu_act = true;
                }
                if ptu.flow_to_left > VolumeRate::new::<gallon_per_second>(0.0) {
                    // We are left side of PTU and positive flow so we receive flow using own reservoir
                    actual_flow =
                        self.get_usable_reservoir_flow(ptu.flow_to_left, context.delta_as_time());
                    self.reservoir_volume -= actual_flow * context.delta_as_time();
                } else {
                    // We are using own flow to power right side so we send that back
                    // to our own reservoir
                    actual_flow = ptu.flow_to_left;
                    *reservoir_return -= actual_flow * context.delta_as_time();
                }
                *delta_vol += actual_flow * context.delta_as_time();
            } else if self.connected_to_ptu_right_side {
                if ptu.is_active_left || ptu.is_active_right {
                    ptu_act = true;
                }
                if ptu.flow_to_right > VolumeRate::new::<gallon_per_second>(0.0) {
                    // We are right side of PTU and positive flow so we receive flow using own reservoir
                    actual_flow =
                        self.get_usable_reservoir_flow(ptu.flow_to_right, context.delta_as_time());
                    self.reservoir_volume -= actual_flow * context.delta_as_time();
                } else {
                    // We are using own flow to power left side so we send that back
                    // to our own reservoir
                    actual_flow = ptu.flow_to_right;
                    *reservoir_return -= actual_flow * context.delta_as_time();
                }
                *delta_vol += actual_flow * context.delta_as_time();
            }
        }
        self.ptu_active = ptu_act;
    }

    pub fn update<T: HydraulicLoopController>(
        &mut self,
        context: &UpdateContext,
        electric_pumps: Vec<&ElectricPump>,
        engine_driven_pumps: Vec<&EngineDrivenPump>,
        ram_air_pumps: Vec<&RamAirTurbine>,
        ptus: Vec<&PowerTransferUnit>,
        controller: &T,
    ) {
        self.fire_shutoff_valve_opened = controller.should_open_fire_shutoff_valve();

        let mut delta_vol_max = Volume::new::<gallon>(0.);
        let mut delta_vol_min = Volume::new::<gallon>(0.);
        let mut reservoir_return = Volume::new::<gallon>(0.);
        let mut delta_vol = Volume::new::<gallon>(0.);

        if self.fire_shutoff_valve_opened {
            for p in engine_driven_pumps {
                delta_vol_max += p.delta_vol_max();
                delta_vol_min += p.delta_vol_min();
            }
        }
        for p in electric_pumps {
            delta_vol_max += p.delta_vol_max();
            delta_vol_min += p.delta_vol_min();
        }
        for p in ram_air_pumps {
            delta_vol_max += p.delta_vol_max();
            delta_vol_min += p.delta_vol_min();
        }

        // Storing max pump capacity available. for now used in PTU model to limit it's input flow
        self.current_max_flow = delta_vol_max / context.delta_as_time();

        // Static leaks
        // TODO: separate static leaks per zone of high pressure or actuator
        // TODO: Use external pressure and/or reservoir pressure instead of 14.7 psi default
        let static_leaks_vol = Volume::new::<gallon>(
            Self::STATIC_LEAK_FLOW_GALLON_PER_SECOND
                * context.delta_as_secs_f64()
                * (self.loop_pressure.get::<psi>() - 14.7)
                / 3000.0,
        );

        // Draw delta_vol from reservoir
        delta_vol -= static_leaks_vol;
        reservoir_return += static_leaks_vol;

        // Updates current delta_vol and reservoir return quantity based on current ptu flows
        self.update_ptu_flows(context, ptus, &mut delta_vol, &mut reservoir_return);

        // Updates current accumulator state and updates loop delta_vol
        self.accumulator
            .update(context, &mut delta_vol, self.loop_pressure);

        // Priming the loop if not filled in yet
        // TODO bug, ptu can't prime the loop as it is not providing flow through delta_vol_max
        if self.loop_volume < self.max_loop_volume {
            let difference = self.max_loop_volume - self.loop_volume;
            let available_fluid_vol = self.reservoir_volume.min(delta_vol_max);
            let delta_loop_vol = available_fluid_vol.min(difference);
            // TODO check if we cross the deltaVolMin?
            delta_vol_max -= delta_loop_vol;
            self.loop_volume += delta_loop_vol;
            self.reservoir_volume -= delta_loop_vol;
        }

        // Actuators effect is updated here, we get their accumulated consumptions and returns, then reset local accumulators for next iteration
        reservoir_return += self.total_actuators_returned_volume;
        delta_vol -= self.total_actuators_consumed_volume.abs();
        self.total_actuators_consumed_volume = Volume::new::<gallon>(0.);
        self.total_actuators_returned_volume = Volume::new::<gallon>(0.);

        // How much we need to reach target of 3000?
        let mut volume_needed_to_reach_pressure_target =
            self.vol_to_target(Pressure::new::<psi>(3000.0));
        // Actually we need this PLUS what is used by consumers.
        volume_needed_to_reach_pressure_target -= delta_vol;

        // Now computing what we will actually use from flow providers limited by
        // their min and max flows and reservoir availability
        let actual_volume_added_to_pressurise = self
            .reservoir_volume
            .min(delta_vol_min.max(delta_vol_max.min(volume_needed_to_reach_pressure_target)));
        delta_vol += actual_volume_added_to_pressurise;

        // Update reservoir
        // %limit to 0 min? for case of negative added?
        self.reservoir_volume -= actual_volume_added_to_pressurise;
        self.reservoir_volume += reservoir_return;

        // Update Volumes
        self.loop_volume += delta_vol;
        // Low pass filter on final delta vol to help with stability and final flow noise
        delta_vol = Self::DELTA_VOL_LOW_PASS_FILTER * delta_vol
            + (1. - Self::DELTA_VOL_LOW_PASS_FILTER) * self.current_delta_vol;

        // Loop Pressure update From Bulk modulus
        let press_delta = self.delta_pressure_from_delta_volume(delta_vol);
        self.loop_pressure += press_delta;
        // Forcing a min pressure
        self.loop_pressure = self.loop_pressure.max(Pressure::new::<psi>(14.7));

        self.current_delta_vol = delta_vol;
        self.current_flow = delta_vol / context.delta_as_time();

        if self.loop_pressure <= self.min_pressure_pressurised_lo_hyst {
            self.is_pressurised = false;
        } else if self.loop_pressure >= self.min_pressure_pressurised_hi_hyst {
            self.is_pressurised = true;
        }
    }

    pub fn is_pressurised(&self) -> bool {
        self.is_pressurised
    }
}
impl SimulationElement for HydraulicLoop {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.pressure_id, self.pressure());
        writer.write(&self.reservoir_id, self.reservoir_volume());
        if self.has_fire_valve {
            writer.write(&self.fire_valve_id, self.is_fire_shutoff_valve_opened());
        }
    }
}

pub trait PumpController {
    fn should_pressurise(&self) -> bool;
}

pub struct Pump {
    delta_vol_max: Volume,
    delta_vol_min: Volume,
    current_displacement: Volume,
    press_breakpoints: [f64; 9],
    displacement_carac: [f64; 9],
    // Displacement low pass filter. [0:1], 0 frozen -> 1 instantaneous dynamic
    displacement_dynamic: f64,
}
impl Pump {
    fn new(
        press_breakpoints: [f64; 9],
        displacement_carac: [f64; 9],
        displacement_dynamic: f64,
    ) -> Self {
        Self {
            delta_vol_max: Volume::new::<gallon>(0.),
            delta_vol_min: Volume::new::<gallon>(0.),
            current_displacement: Volume::new::<gallon>(0.),
            press_breakpoints,
            displacement_carac,
            displacement_dynamic,
        }
    }

    fn update<T: PumpController>(
        &mut self,
        context: &UpdateContext,
        line: &HydraulicLoop,
        rpm: f64,
        controller: &T,
    ) {
        let theoretical_displacement = self.calculate_displacement(line.pressure(), controller);

        // Actual displacement is the calculated one with a low pass filter applied to mimic displacement transients dynamic
        self.current_displacement = (1.0 - self.displacement_dynamic) * self.current_displacement
            + self.displacement_dynamic * theoretical_displacement;

        let flow = Self::calculate_flow(rpm, self.current_displacement)
            .max(VolumeRate::new::<gallon_per_second>(0.));

        self.delta_vol_max = flow * context.delta_as_time();
        self.delta_vol_min = Volume::new::<gallon>(0.0);
    }

    fn calculate_displacement<T: PumpController>(
        &self,
        pressure: Pressure,
        controller: &T,
    ) -> Volume {
        if controller.should_pressurise() {
            return Volume::new::<cubic_inch>(interpolation(
                &self.press_breakpoints,
                &self.displacement_carac,
                pressure.get::<psi>(),
            ));
        }
        Volume::new::<cubic_inch>(0.)
    }

    fn calculate_flow(rpm: f64, displacement: Volume) -> VolumeRate {
        VolumeRate::new::<gallon_per_second>(rpm * displacement.get::<cubic_inch>() / 231.0 / 60.0)
    }
}
impl PressureSource for Pump {
    fn delta_vol_max(&self) -> Volume {
        self.delta_vol_max
    }

    fn delta_vol_min(&self) -> Volume {
        self.delta_vol_min
    }
}

pub struct ElectricPump {
    active_id: String,

    is_active: bool,
    bus_type: ElectricalBusType,
    is_powered: bool,
    rpm: f64,
    pump: Pump,
}
impl ElectricPump {
    const SPOOLUP_TIME: f64 = 0.1;
    const SPOOLDOWN_TIME: f64 = 0.3;
    const NOMINAL_SPEED: f64 = 7600.0;
    const DISPLACEMENT_BREAKPTS: [f64; 9] = [
        0.0, 500.0, 1000.0, 1500.0, 2800.0, 2900.0, 3000.0, 3050.0, 3500.0,
    ];
    const DISPLACEMENT_MAP: [f64; 9] = [0.263, 0.263, 0.263, 0.263, 0.263, 0.263, 0.163, 0.0, 0.0];
    // 1 == No filtering
    const DISPLACEMENT_DYNAMICS: f64 = 1.0;

    pub fn new(id: &str, bus_type: ElectricalBusType) -> Self {
        Self {
            active_id: format!("HYD_{}_EPUMP_ACTIVE", id),
            is_active: false,
            bus_type,
            is_powered: false,
            rpm: 0.,
            pump: Pump::new(
                Self::DISPLACEMENT_BREAKPTS,
                Self::DISPLACEMENT_MAP,
                Self::DISPLACEMENT_DYNAMICS,
            ),
        }
    }

    pub fn rpm(&self) -> f64 {
        self.rpm
    }

    pub fn update<T: PumpController>(
        &mut self,
        context: &UpdateContext,
        line: &HydraulicLoop,
        controller: &T,
    ) {
        self.is_active = controller.should_pressurise() && self.is_powered;

        // Pump startup/shutdown process
        if self.is_active && self.rpm < Self::NOMINAL_SPEED {
            self.rpm += (Self::NOMINAL_SPEED / Self::SPOOLUP_TIME) * context.delta_as_secs_f64();
        } else if !self.is_active && self.rpm > 0.0 {
            self.rpm -= (Self::NOMINAL_SPEED / Self::SPOOLDOWN_TIME) * context.delta_as_secs_f64();
        }

        // Limiting min and max speed
        self.rpm = self.rpm.min(Self::NOMINAL_SPEED).max(0.0);

        self.pump.update(context, line, self.rpm, controller);
    }
}
impl PressureSource for ElectricPump {
    fn delta_vol_max(&self) -> Volume {
        self.pump.delta_vol_max()
    }
    fn delta_vol_min(&self) -> Volume {
        self.pump.delta_vol_min()
    }
}
impl SimulationElement for ElectricPump {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.active_id, self.is_active);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.bus_type);
    }
}

pub struct EngineDrivenPump {
    active_id: String,

    is_active: bool,
    rpm: f64,
    pump: Pump,
}
impl EngineDrivenPump {
    const DISPLACEMENT_BREAKPTS: [f64; 9] = [
        0.0, 500.0, 1000.0, 1500.0, 2800.0, 2900.0, 3000.0, 3020.0, 3500.0,
    ];
    const DISPLACEMENT_MAP: [f64; 9] = [2.4, 2.4, 2.4, 2.4, 2.4, 2.0, 0.9, 0.0, 0.0];

    // 0.1 == 90% filtering on max displacement transient
    const DISPLACEMENT_DYNAMICS: f64 = 0.95;

    pub fn new(id: &str) -> Self {
        Self {
            active_id: format!("HYD_{}_EDPUMP_ACTIVE", id),
            is_active: false,
            rpm: 0.,
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
        line: &HydraulicLoop,
        pump_rpm: f64,
        controller: &T,
    ) {
        self.rpm = pump_rpm;
        self.pump.update(context, line, pump_rpm, controller);
        self.is_active = controller.should_pressurise();
    }

    pub fn rpm(&self) -> f64 {
        self.rpm
    }
}
impl PressureSource for EngineDrivenPump {
    fn delta_vol_min(&self) -> Volume {
        self.pump.delta_vol_min()
    }
    fn delta_vol_max(&self) -> Volume {
        self.pump.delta_vol_max()
    }
}
impl SimulationElement for EngineDrivenPump {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.active_id, self.is_active);
    }
}

struct WindTurbine {
    position: f64,
    speed: f64,
    acceleration: f64,
    rpm: f64,
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
            speed: 0.,
            acceleration: 0.,
            rpm: 0.,
            torque_sum: 0.,
        }
    }

    fn rpm(&self) -> f64 {
        self.rpm
    }

    fn update_generated_torque(&mut self, indicated_speed: &Velocity, stow_pos: f64) {
        let cur_aplha = interpolation(
            &Self::RPM_GOVERNOR_BREAKPTS,
            &Self::PROP_ALPHA_MAP,
            self.rpm,
        );

        // Simple model. stow pos sin simulates the angle of the blades vs wind while deploying
        let air_speed_torque = cur_aplha.to_radians().sin()
            * (indicated_speed.get::<knot>() * indicated_speed.get::<knot>() / 100.)
            * 0.5
            * (std::f64::consts::PI / 2. * stow_pos).sin();
        self.torque_sum += air_speed_torque;
    }

    fn update_friction_torque(&mut self, displacement_ratio: f64) {
        let mut pump_torque = 0.;
        if self.rpm < Self::LOW_SPEED_PHYSICS_ACTIVATION {
            pump_torque += (self.position * 4.).cos() * displacement_ratio.max(0.35) * 35.;
            pump_torque += -self.speed * 15.;
        } else {
            pump_torque += displacement_ratio.max(0.35) * 1. * -self.speed;
        }
        pump_torque -= self.speed * 0.05;
        // Static air drag of the propeller
        self.torque_sum += pump_torque;
    }

    fn update_physics(&mut self, delta_time: &Duration) {
        self.acceleration = self.torque_sum / Self::PROPELLER_INERTIA;
        self.speed += self.acceleration * delta_time.as_secs_f64();
        self.position += self.speed * delta_time.as_secs_f64();

        // rad/s to RPM
        self.rpm = self.speed * 30. / std::f64::consts::PI;

        // Reset torque accumulator at end of update
        self.torque_sum = 0.;
    }

    fn update(
        &mut self,
        delta_time: &Duration,
        indicated_speed: &Velocity,
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
        line: &HydraulicLoop,
        controller: &T,
    ) {
        // Once commanded, stays commanded forever
        self.deployment_commanded = controller.should_deploy() || self.deployment_commanded;

        self.pump.update(
            context,
            line,
            self.wind_turbine.rpm(),
            &self.pump_controller,
        );

        // Now forcing min to max to force a true real time regulation.
        // TODO: handle this properly by calculating who produced what volume at end of hyd loop update
        self.pump.delta_vol_min = self.pump.delta_vol_max;
    }

    pub fn update_physics(&mut self, delta_time: &Duration, indicated_airspeed: &Velocity) {
        // Calculate the ratio of current displacement vs max displacement as an image of the load of the pump
        let displacement_ratio = self.delta_vol_max().get::<gallon>() / self.max_displacement;
        self.wind_turbine.update(
            &delta_time,
            &indicated_airspeed,
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

    pub fn turbine_rpm(&self) -> f64 {
        self.wind_turbine.rpm
    }
}
impl PressureSource for RamAirTurbine {
    fn delta_vol_max(&self) -> Volume {
        self.pump.delta_vol_max()
    }

    fn delta_vol_min(&self) -> Volume {
        self.pump.delta_vol_min()
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
    use crate::simulation::UpdateContext;
    use uom::si::{
        acceleration::foot_per_second_squared,
        f64::*,
        length::foot,
        pressure::{pascal, psi},
        thermodynamic_temperature::degree_celsius,
        volume::gallon,
    };

    struct TestHydraulicLoopController {
        should_open_fire_shutoff_valve: bool,
    }
    impl TestHydraulicLoopController {
        fn commanding_open_fire_shutoff_valve() -> Self {
            Self {
                should_open_fire_shutoff_valve: true,
            }
        }
    }
    impl HydraulicLoopController for TestHydraulicLoopController {
        fn should_open_fire_shutoff_valve(&self) -> bool {
            self.should_open_fire_shutoff_valve
        }
    }

    struct TestPumpController {
        should_pressurise: bool,
    }
    impl TestPumpController {
        fn commanding_pressurise() -> Self {
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

    struct TestRamAirTurbineController {
        should_deploy: bool,
    }
    impl TestRamAirTurbineController {
        fn new() -> Self {
            Self {
                should_deploy: false,
            }
        }

        fn command_deployment(&mut self) {
            self.should_deploy = true;
        }
    }
    impl RamAirTurbineController for TestRamAirTurbineController {
        fn should_deploy(&self) -> bool {
            self.should_deploy
        }
    }

    use super::*;
    #[test]
    /// Runs electric pump, checks pressure OK, shut it down, check drop of pressure after 20s
    fn blue_loop_rat_deploy_simulation() {
        let mut rat = RamAirTurbine::new();
        let mut rat_controller = TestRamAirTurbineController::new();
        let mut blue_loop = hydraulic_loop("BLUE");
        let blue_loop_controller =
            TestHydraulicLoopController::commanding_open_fire_shutoff_valve();

        let timestep = 0.05;
        let context = context(Duration::from_secs_f64(timestep));
        let mut indicated_airspeed = context.indicated_airspeed();

        let mut time = 0.0;
        for x in 0..1500 {
            rat.update_position(&context.delta());
            if time >= 10. && time < 10. + timestep {
                println!("ASSERT RAT STOWED");
                assert!(blue_loop.loop_pressure <= Pressure::new::<psi>(50.0));
                rat.deployment_commanded = false;
                assert!(rat.position == 0.);
            }

            if time >= 20. && time < 20. + timestep {
                println!("ASSERT RAT STOWED STILL NO PRESS");
                assert!(blue_loop.loop_pressure <= Pressure::new::<psi>(50.0));
                rat_controller.command_deployment();
            }

            if time >= 30. && time < 30. + timestep {
                println!("ASSERT RAT OUT AND SPINING");
                assert!(blue_loop.loop_pressure >= Pressure::new::<psi>(2000.0));
                assert!(rat.position >= 0.999);
                assert!(rat.wind_turbine.rpm >= 1000.);
            }
            if time >= 60. && time < 60. + timestep {
                println!("ASSERT RAT AT SPEED");
                assert!(blue_loop.loop_pressure >= Pressure::new::<psi>(2000.0));
                assert!(rat.wind_turbine.rpm >= 4500.);
            }

            if time >= 70. && time < 70. + timestep {
                println!("STOPING THE PLANE");
                indicated_airspeed = Velocity::new::<knot>(0.);
            }

            if time >= 120. && time < 120. + timestep {
                println!("ASSERT RAT SLOWED DOWN");
                assert!(rat.wind_turbine.rpm <= 2500.);
            }

            rat.update_physics(&context.delta(), &indicated_airspeed);
            rat.update(&context, &blue_loop, &rat_controller);
            blue_loop.update(
                &context,
                Vec::new(),
                Vec::new(),
                vec![&rat],
                Vec::new(),
                &blue_loop_controller,
            );
            if x % 20 == 0 {
                println!("Iteration {} Time {}", x, time);
                println!("-------------------------------------------");
                println!("---PSI: {}", blue_loop.loop_pressure.get::<psi>());
                println!("---RAT stow pos: {}", rat.position);
                println!("---RAT RPM: {}", rat.wind_turbine.rpm);
                println!("---RAT volMax: {}", rat.delta_vol_max().get::<gallon>());
                println!(
                    "--------Reservoir Volume (g): {}",
                    blue_loop.reservoir_volume.get::<gallon>()
                );
                println!(
                    "--------Loop Volume (g): {}",
                    blue_loop.loop_volume.get::<gallon>()
                );
            }
            time += timestep;
        }
    }

    fn hydraulic_loop(loop_color: &str) -> HydraulicLoop {
        match loop_color {
            "GREEN" => HydraulicLoop::new(
                loop_color,
                true,
                false,
                Volume::new::<gallon>(26.41),
                Volume::new::<gallon>(26.41),
                Volume::new::<gallon>(10.0),
                Volume::new::<gallon>(3.83),
                Fluid::new(Pressure::new::<pascal>(1450000000.0)),
                true,
                Pressure::new::<psi>(1450.0),
                Pressure::new::<psi>(1750.0),
            ),
            "YELLOW" => HydraulicLoop::new(
                loop_color,
                false,
                true,
                Volume::new::<gallon>(10.2),
                Volume::new::<gallon>(10.2),
                Volume::new::<gallon>(8.0),
                Volume::new::<gallon>(3.3),
                Fluid::new(Pressure::new::<pascal>(1450000000.0)),
                true,
                Pressure::new::<psi>(1450.0),
                Pressure::new::<psi>(1750.0),
            ),
            _ => HydraulicLoop::new(
                loop_color,
                false,
                false,
                Volume::new::<gallon>(15.85),
                Volume::new::<gallon>(15.85),
                Volume::new::<gallon>(8.0),
                Volume::new::<gallon>(1.5),
                Fluid::new(Pressure::new::<pascal>(1450000000.0)),
                false,
                Pressure::new::<psi>(1450.0),
                Pressure::new::<psi>(1750.0),
            ),
        }
    }

    fn engine_driven_pump() -> EngineDrivenPump {
        EngineDrivenPump::new("DEFAULT")
    }

    fn context(delta_time: Duration) -> UpdateContext {
        UpdateContext::new(
            delta_time,
            Velocity::new::<knot>(250.),
            Length::new::<foot>(5000.),
            ThermodynamicTemperature::new::<degree_celsius>(25.0),
            true,
            Acceleration::new::<foot_per_second_squared>(0.),
        )
    }

    #[cfg(test)]
    mod edp_tests {
        use super::*;

        #[test]
        fn starts_inactive() {
            assert!(!engine_driven_pump().is_active);
        }

        #[test]
        fn zero_flow_above_3000_psi_after_25ms() {
            let pump_rpm = 3300.;
            let pressure = Pressure::new::<psi>(3100.);
            let context = context(Duration::from_millis(25));
            let displacement = Volume::new::<cubic_inch>(0.);
            assert!(delta_vol_equality_check(
                pump_rpm,
                displacement,
                pressure,
                &context
            ))
        }

        fn delta_vol_equality_check(
            pump_rpm: f64,
            displacement: Volume,
            pressure: Pressure,
            context: &UpdateContext,
        ) -> bool {
            let actual = get_edp_actual_delta_vol_when(pump_rpm, pressure, context);
            let predicted = get_edp_predicted_delta_vol_when(pump_rpm, displacement, context);
            println!("Actual: {}", actual.get::<gallon>());
            println!("Predicted: {}", predicted.get::<gallon>());
            actual == predicted
        }

        fn get_edp_actual_delta_vol_when(
            pump_rpm: f64,
            pressure: Pressure,
            context: &UpdateContext,
        ) -> Volume {
            let mut edp = engine_driven_pump();
            let mut line = hydraulic_loop("GREEN");

            let engine_driven_pump_controller = TestPumpController::commanding_pressurise();
            line.loop_pressure = pressure;
            edp.update(
                &context.with_delta(Duration::from_secs(1)),
                &line,
                pump_rpm,
                &engine_driven_pump_controller,
            ); // Update 10 times to stabilize displacement

            edp.update(context, &line, pump_rpm, &engine_driven_pump_controller);
            edp.delta_vol_max()
        }

        fn get_edp_predicted_delta_vol_when(
            pump_rpm: f64,
            displacement: Volume,
            context: &UpdateContext,
        ) -> Volume {
            let expected_flow = Pump::calculate_flow(pump_rpm, displacement);
            expected_flow * context.delta_as_time()
        }
    }
}
