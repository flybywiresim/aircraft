use nalgebra::{Rotation3, Unit, Vector3};

use uom::si::{
    angle::radian,
    angular_acceleration::radian_per_second_squared,
    angular_velocity::{radian_per_second, revolution_per_minute},
    area::square_meter,
    f64::*,
    force::newton,
    length::meter,
    mass::kilogram,
    power::watt,
    pressure::{pascal, psi},
    ratio::ratio,
    torque::newton_meter,
    velocity::meter_per_second,
    volume::{cubic_meter, gallon},
    volume_rate::{cubic_meter_per_second, gallon_per_minute, gallon_per_second},
};

use crate::{
    shared::{
        interpolation, low_pass_filter::LowPassFilter, pid::PidController,
        random_from_normal_distribution, random_from_range, ConsumePower, ElectricalBusType,
        ElectricalBuses,
    },
    simulation::{
        InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        UpdateContext, VariableIdentifier,
    },
};

use super::aerodynamic_model::AerodynamicBody;

use std::fmt::Debug;
use std::time::Duration;

pub trait Actuator {
    fn used_volume(&self) -> Volume;
    fn reservoir_return(&self) -> Volume;
    fn reset_volumes(&mut self);
}

/// Trait linked to anything moving bounded between a minimum and maximum position.
/// Those bounds implies that it will have a max and min distance from a fixed
/// point in space to the position where we apply forces to it,
/// for example a control arm where an actuator is attached.
pub trait BoundedLinearLength {
    fn min_absolute_length_to_anchor(&self) -> Length;
    fn max_absolute_length_to_anchor(&self) -> Length;
    fn absolute_length_to_anchor(&self) -> Length;
}

#[derive(PartialEq, Eq, Clone, Copy, Debug)]
pub enum LinearActuatorMode {
    ClosedValves,
    PositionControl,
    ActiveDamping,
    ClosedCircuitDamping,
}

#[derive(PartialEq, Copy, Clone)]
struct VariableSpeedPump {
    speed: LowPassFilter<AngularVelocity>,

    is_powered: bool,
    should_activate_electrical_mode: bool,
    powered_by: ElectricalBusType,
    consumed_power: Power,
}
impl VariableSpeedPump {
    // Coefficient to convert hyd power in elec power 1.1 means we lose 10% efficiency from the pump
    const HYD_TO_ELEC_POWER_EFFICIENCY: f64 = 1.15;
    const MIN_STATIC_POWER_CONSUMPTION_WATT: f64 = 150.;

    const FLOW_CONSTANT_RPM_CUBIC_INCH_TO_GPM: f64 = 231.;
    const DISPLACEMENT_CU_IN: f64 = 0.214;
    const NOMINAL_MAX_PRESSURE_PSI: f64 = 5000.;

    const LOW_PASS_RPM_TRANSIENT_TIME_CONSTANT: Duration = Duration::from_millis(100);

    pub fn new(powered_by: ElectricalBusType) -> Self {
        Self {
            speed: LowPassFilter::<AngularVelocity>::new(
                Self::LOW_PASS_RPM_TRANSIENT_TIME_CONSTANT,
            ),
            is_powered: false,
            should_activate_electrical_mode: false,
            powered_by,
            consumed_power: Power::default(),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        actuator_flow: VolumeRate,
        actuator_pressure: Pressure,
        controller: &impl ElectroHydrostaticPowered,
    ) {
        self.should_activate_electrical_mode = controller.should_activate_electrical_mode();

        let new_speed = if self.is_active() {
            AngularVelocity::new::<revolution_per_minute>(
                actuator_flow.get::<gallon_per_minute>()
                    * Self::FLOW_CONSTANT_RPM_CUBIC_INCH_TO_GPM
                    / Self::DISPLACEMENT_CU_IN,
            )
        } else {
            AngularVelocity::default()
        };

        self.update_power_consumed(actuator_flow, actuator_pressure);
        self.speed.update(context.delta(), new_speed);
    }

    fn update_power_consumed(&mut self, actuator_flow: VolumeRate, actuator_pressure: Pressure) {
        let current_fluid_power = Power::new::<watt>(
            actuator_pressure.get::<pascal>() * actuator_flow.get::<cubic_meter_per_second>(),
        );

        self.consumed_power = if self.is_active() {
            (current_fluid_power * Self::HYD_TO_ELEC_POWER_EFFICIENCY)
                .max(Power::new::<watt>(Self::MIN_STATIC_POWER_CONSUMPTION_WATT))
        } else {
            Power::default()
        };
    }

    fn is_active(&self) -> bool {
        self.should_activate_electrical_mode && self.is_powered
    }

    fn max_available_pressure(&self, accumulator_pressure: Pressure) -> Pressure {
        if self.is_active() && accumulator_pressure.get::<psi>() > 100. {
            Pressure::new::<psi>(Self::NOMINAL_MAX_PRESSURE_PSI)
        } else {
            Pressure::default()
        }
    }
}
impl SimulationElement for VariableSpeedPump {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by);
    }

    fn consume_power<T: ConsumePower>(&mut self, _: &UpdateContext, consumption: &mut T) {
        consumption.consume_from_bus(self.powered_by, self.consumed_power);
    }
}
impl Debug for VariableSpeedPump {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "\nEHA pump => is powered {:?} / Is active? {:?} / Rpm {:0}",
            self.is_powered,
            self.is_active(),
            self.speed.output().get::<revolution_per_minute>()
        )
    }
}

#[derive(PartialEq, Copy, Clone)]
struct LowPressureAccumulator {
    pressure: LowPassFilter<Pressure>,
    total_volume_to_actuator: Volume,
}
impl LowPressureAccumulator {
    const MEAN_ACCUMULATOR_PRESSURE_PSI: f64 = 800.;
    const STDEV_ACCUMULATOR_PRESSURE_PSI: f64 = 200.;

    const MAX_ACCUMULATOR_PRESSURE_PSI: f64 = 1300.;
    const MAX_ACCUMULATOR_PRESSURE_THRESHOLD_FOR_REFILL_FLOW_PSI: f64 = 50.;

    const PRESSURE_TIME_CONSTANT: Duration = Duration::from_millis(1000);

    const REFILL_FLOW_GALLON_PER_S: f64 = 0.05;

    fn new() -> Self {
        let init_pressure_psi = random_from_normal_distribution(
            Self::MEAN_ACCUMULATOR_PRESSURE_PSI,
            Self::STDEV_ACCUMULATOR_PRESSURE_PSI,
        );

        Self {
            pressure: LowPassFilter::<Pressure>::new_with_init_value(
                Self::PRESSURE_TIME_CONSTANT,
                Pressure::new::<psi>(init_pressure_psi.clamp(
                    0.,
                    Self::MAX_ACCUMULATOR_PRESSURE_PSI
                        - Self::MAX_ACCUMULATOR_PRESSURE_THRESHOLD_FOR_REFILL_FLOW_PSI,
                )),
            ),
            total_volume_to_actuator: Volume::default(),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        input_pressure: Pressure,
        controller: &impl ElectroHydrostaticPowered,
    ) {
        let mut new_pressure =
            if input_pressure > self.pressure.output() && controller.should_open_refill_valve() {
                Pressure::new::<psi>(Self::MAX_ACCUMULATOR_PRESSURE_PSI)
            } else {
                self.pressure.output()
            };

        new_pressure = new_pressure
            .min(Pressure::new::<psi>(Self::MAX_ACCUMULATOR_PRESSURE_PSI))
            .max(Pressure::new::<psi>(0.));

        let refill_flow_present = controller.should_open_refill_valve()
            && (new_pressure
                - Pressure::new::<psi>(
                    Self::MAX_ACCUMULATOR_PRESSURE_THRESHOLD_FOR_REFILL_FLOW_PSI,
                ))
                >= self.pressure.output();

        self.update_flow(context, refill_flow_present);

        self.pressure.update(context.delta(), new_pressure);
    }

    fn update_flow(&mut self, context: &UpdateContext, refill_flow_present: bool) {
        if refill_flow_present {
            self.total_volume_to_actuator +=
                VolumeRate::new::<gallon_per_second>(Self::REFILL_FLOW_GALLON_PER_S)
                    * context.delta_as_time();
        }
    }

    fn pressure(&self) -> Pressure {
        self.pressure.output()
    }

    #[cfg(test)]
    pub fn empty_accumulator(&mut self) {
        self.pressure.reset(Pressure::default());
    }
}
impl Actuator for LowPressureAccumulator {
    fn used_volume(&self) -> Volume {
        self.total_volume_to_actuator
    }

    fn reservoir_return(&self) -> Volume {
        Volume::default()
    }

    fn reset_volumes(&mut self) {
        self.total_volume_to_actuator = Volume::new::<gallon>(0.);
    }
}

pub trait ElectroHydrostaticPowered {
    fn should_open_refill_valve(&self) -> bool {
        false
    }

    fn should_activate_electrical_mode(&self) -> bool {
        false
    }
}

#[derive(PartialEq, Eq, Copy, Clone)]
pub enum ElectroHydrostaticActuatorType {
    ElectroHydrostaticActuator, // Can only run on electric mode or is damping
    ElectricalBackupHydraulicActuator, // Can run either in electric backup mode or from aircraft hydraulic pressure
}

#[derive(PartialEq, Copy, Clone)]
pub struct ElectroHydrostaticBackup {
    accumulator: LowPressureAccumulator,
    pump: VariableSpeedPump,

    backup_type: ElectroHydrostaticActuatorType,
}
impl ElectroHydrostaticBackup {
    pub fn new(powered_by: ElectricalBusType, backup_type: ElectroHydrostaticActuatorType) -> Self {
        Self {
            accumulator: LowPressureAccumulator::new(),
            pump: VariableSpeedPump::new(powered_by),
            backup_type,
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        controller: &impl ElectroHydrostaticPowered,
        current_pressure: Pressure,
        current_actuator_flow: VolumeRate,
        current_actuator_pressure: Pressure,
    ) {
        self.accumulator
            .update(context, current_pressure, controller);
        self.pump.update(
            context,
            current_actuator_flow,
            current_actuator_pressure,
            controller,
        );
    }

    fn max_available_pressure(&self) -> Pressure {
        self.pump
            .max_available_pressure(self.accumulator.pressure())
    }

    fn can_move_using_aircraft_hydraulic_pressure(&self) -> bool {
        self.backup_type == ElectroHydrostaticActuatorType::ElectricalBackupHydraulicActuator
    }

    fn accumulator_pressure(&self) -> Pressure {
        self.accumulator.pressure()
    }

    fn is_electrical_mode_active(&self) -> bool {
        self.pump.is_active()
    }
}
impl SimulationElement for ElectroHydrostaticBackup {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.pump.accept(visitor);

        visitor.visit(self);
    }
}
impl Actuator for ElectroHydrostaticBackup {
    fn used_volume(&self) -> Volume {
        self.accumulator.used_volume()
    }

    fn reservoir_return(&self) -> Volume {
        self.accumulator.reservoir_return()
    }

    fn reset_volumes(&mut self) {
        self.accumulator.reset_volumes();
    }
}
impl Debug for ElectroHydrostaticBackup {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "\nEHA system => Acc pressure {:?} / Max pressure {:.0} Pump {:?}",
            self.accumulator_pressure().get::<psi>(),
            self.max_available_pressure().get::<psi>(),
            self.pump
        )
    }
}

/// Represents an abstraction of the low level hydraulic actuator control system that would in real life consist of a lot of
/// solenoid control valves, spring loaded valves, and a differential pressure mechanism.
///
/// We don't want to simulate all of those little bits, so the functions of the actuator are split into
/// the following functional modes:
///
/// - [LinearActuatorMode.ClosedValves]: Turns actuator in a high constant spring/damper system simulating a closed actuator
///   only constrained by its own fluid compressibility.
/// - [ActiveDamping.LinearActuatorMode]: Actuator use internal valves to provide a force resisting to its own movements, dampening
///   the piece movements it's connected to.
/// - [LinearActuatorMode.PositionControl]: -> Actuator will try to use hydraulic pressure to move to a requested position, while
///   maintaining flow limitations.
///     CAUTION: For actuators having only ON/OFF behaviour (gear, door ...), might be needed to require more than required
///         position to ensure it's reached at max force. So full retract position at 0 might need to require -0.5, full extension might
///         need to request 1.5
/// - [LinearActuatorMode.ClosedCircuitDamping]: -> Actuator will connect retract and extend port in closed loop. This provide a dampened
///   free moving mode, usable for gravity extension, or for aileron droop.
#[derive(PartialEq, Clone, Copy)]
struct CoreHydraulicForce {
    dev_gains_tuning_enable_id: VariableIdentifier,
    test_p_gain_id: VariableIdentifier,
    test_i_gain_id: VariableIdentifier,
    test_force_gain_id: VariableIdentifier,

    test_p_gain: f64,
    test_i_gain: f64,
    test_force_gain: f64,
    is_dev_tuning_active: bool,

    current_mode: LinearActuatorMode,
    closed_valves_reference_position: Ratio,

    active_hydraulic_damping_constant: f64,
    slow_hydraulic_damping_constant: f64,

    fluid_compression_spring_constant: f64,
    fluid_compression_damping_constant: f64,

    flow_open_loop_modifier_extension_map: [f64; 6],
    flow_open_loop_modifier_retraction_map: [f64; 6],
    flow_open_loop_position_breakpoints: [f64; 6],

    max_flow: VolumeRate,
    min_flow: VolumeRate,

    bore_side_area: Area,
    rod_side_area: Area,

    last_control_force: Force,

    force_raw: Force,
    force_filtered: LowPassFilter<Force>,

    pid_controller: PidController,

    min_control_force: LowPassFilter<Force>,
    max_control_force: LowPassFilter<Force>,

    has_flow_restriction: bool,
    max_working_pressure: Pressure,

    locks_position_in_closed_mode: bool,
    is_soft_locked: bool,
    soft_lock_velocity: (AngularVelocity, AngularVelocity),
}
impl CoreHydraulicForce {
    const MIN_MAX_FORCE_CONTROLLER_FILTER_TIME_CONSTANT: Duration = Duration::from_millis(1);

    const MAX_ABSOLUTE_FORCE_NEWTON: f64 = 500000.;

    // Indicates the actuator positioning error from which max flow is applied
    const OPEN_LOOP_POSITION_ERROR_FOR_MAX_FLOW: f64 = 0.02;

    const MIN_PRESSURE_TO_EXIT_POSITION_CONTROL_PSI: f64 = 200.;
    const MIN_PRESSURE_TO_ALLOW_POSITION_CONTROL_PSI: f64 = 400.;

    // Threshold to start reducing max possible flow
    //   ie: 500 value for a max pressure of 3000psi will start reducing flow when below 2500 psi
    const FLOW_REDUCTION_THRESHOLD_BELOW_MAX_PRESS_PSI: f64 = 500.;

    fn new(
        context: &mut InitContext,
        init_position: Ratio,
        active_hydraulic_damping_constant: f64,
        slow_hydraulic_damping_constant: f64,
        slow_hydraulic_damping_filtering_constant: Duration,
        fluid_compression_spring_constant: f64,
        fluid_compression_damping_constant: f64,

        max_flow: VolumeRate,
        min_flow: VolumeRate,
        bore_side_area: Area,
        rod_side_area: Area,
        flow_open_loop_modifier_extension_map: [f64; 6],
        flow_open_loop_modifier_retraction_map: [f64; 6],
        flow_open_loop_position_breakpoints: [f64; 6],
        flow_control_proportional_gain: f64,
        flow_control_integral_gain: f64,
        flow_control_force_gain: f64,
        has_flow_restriction: bool,

        locks_position_in_closed_mode: bool,
        soft_lock_velocity: Option<(AngularVelocity, AngularVelocity)>,

        max_working_pressure: Pressure,
    ) -> Self {
        let max_force = max_working_pressure * bore_side_area;
        let min_force = -max_working_pressure * rod_side_area;

        Self {
            dev_gains_tuning_enable_id: context.get_identifier("DEV_HYD_GAINS_TUNING".to_owned()),
            test_p_gain_id: context.get_identifier("DEV_P_GAIN".to_owned()),
            test_i_gain_id: context.get_identifier("DEV_I_GAIN".to_owned()),
            test_force_gain_id: context.get_identifier("DEV_FORCE_GAIN".to_owned()),

            test_p_gain: flow_control_proportional_gain,
            test_i_gain: flow_control_integral_gain,
            test_force_gain: flow_control_force_gain,
            is_dev_tuning_active: false,

            current_mode: LinearActuatorMode::ClosedCircuitDamping,
            closed_valves_reference_position: init_position,

            active_hydraulic_damping_constant,
            slow_hydraulic_damping_constant,
            fluid_compression_spring_constant,
            fluid_compression_damping_constant,

            flow_open_loop_modifier_extension_map,
            flow_open_loop_modifier_retraction_map,
            flow_open_loop_position_breakpoints,

            max_flow,
            min_flow,

            bore_side_area,
            rod_side_area,
            last_control_force: Force::new::<newton>(0.),
            force_raw: Force::new::<newton>(0.),
            force_filtered: LowPassFilter::<Force>::new(slow_hydraulic_damping_filtering_constant),

            pid_controller: PidController::new(
                flow_control_proportional_gain,
                flow_control_integral_gain,
                0.,
                min_force.get::<newton>(),
                max_force.get::<newton>(),
                0.,
                flow_control_force_gain,
            ),
            min_control_force: LowPassFilter::<Force>::new_with_init_value(
                Self::MIN_MAX_FORCE_CONTROLLER_FILTER_TIME_CONSTANT,
                min_force,
            ),
            max_control_force: LowPassFilter::<Force>::new_with_init_value(
                Self::MIN_MAX_FORCE_CONTROLLER_FILTER_TIME_CONSTANT,
                max_force,
            ),
            has_flow_restriction,
            max_working_pressure,

            locks_position_in_closed_mode,
            is_soft_locked: locks_position_in_closed_mode,
            soft_lock_velocity: soft_lock_velocity.unwrap_or_default(),
        }
    }

    fn update_force(
        &mut self,
        context: &UpdateContext,
        required_position: Ratio,
        requested_mode: LinearActuatorMode,
        position_normalized: Ratio,
        current_pressure: Pressure,
        signed_flow: VolumeRate,
        speed: Velocity,
    ) {
        let new_requested_mode = self.new_requested_mode(requested_mode, current_pressure);

        self.update_actions(new_requested_mode, position_normalized, current_pressure);

        self.update_force_from_current_mode(
            context,
            required_position,
            position_normalized,
            current_pressure,
            signed_flow,
            speed,
        );
    }

    /// Computes what new requested mode is allowed depending on current mode
    fn new_requested_mode(
        &mut self,
        requested_mode: LinearActuatorMode,
        current_pressure: Pressure,
    ) -> LinearActuatorMode {
        match self.current_mode {
            LinearActuatorMode::ClosedValves => requested_mode,
            LinearActuatorMode::PositionControl => {
                if current_pressure.get::<psi>() < Self::MIN_PRESSURE_TO_EXIT_POSITION_CONTROL_PSI {
                    LinearActuatorMode::ClosedCircuitDamping
                } else {
                    requested_mode
                }
            }
            LinearActuatorMode::ActiveDamping => requested_mode,
            LinearActuatorMode::ClosedCircuitDamping => requested_mode,
        }
    }

    fn update_actions(
        &mut self,
        new_mode: LinearActuatorMode,
        position_normalized: Ratio,
        current_pressure: Pressure,
    ) {
        match new_mode {
            LinearActuatorMode::ClosedValves => {
                self.actions_from_current_to_closed_valves(position_normalized)
            }
            LinearActuatorMode::PositionControl => {
                if current_pressure.get::<psi>() > Self::MIN_PRESSURE_TO_ALLOW_POSITION_CONTROL_PSI
                {
                    self.actions_from_current_to_position_control()
                }
            }
            LinearActuatorMode::ActiveDamping => self.actions_from_current_to_active_damping(),
            LinearActuatorMode::ClosedCircuitDamping => {
                self.actions_from_current_to_closed_circuit_damping()
            }
        }
    }

    fn actions_from_current_to_closed_valves(&mut self, position_normalized: Ratio) {
        match self.current_mode {
            LinearActuatorMode::ClosedValves => {}
            LinearActuatorMode::PositionControl
            | LinearActuatorMode::ActiveDamping
            | LinearActuatorMode::ClosedCircuitDamping => {
                self.go_to_close_control_valves(position_normalized);
            }
        }
    }

    fn actions_from_current_to_position_control(&mut self) {
        match self.current_mode {
            LinearActuatorMode::PositionControl => {}
            LinearActuatorMode::ClosedValves
            | LinearActuatorMode::ActiveDamping
            | LinearActuatorMode::ClosedCircuitDamping => {
                self.go_to_position_control();
            }
        }
    }

    fn actions_from_current_to_active_damping(&mut self) {
        match self.current_mode {
            LinearActuatorMode::ActiveDamping => {}
            LinearActuatorMode::ClosedValves
            | LinearActuatorMode::PositionControl
            | LinearActuatorMode::ClosedCircuitDamping => {
                self.go_to_active_damping();
            }
        }
    }

    fn actions_from_current_to_closed_circuit_damping(&mut self) {
        match self.current_mode {
            LinearActuatorMode::ClosedCircuitDamping => {}
            LinearActuatorMode::ClosedValves
            | LinearActuatorMode::PositionControl
            | LinearActuatorMode::ActiveDamping => {
                self.go_to_closed_circuit_damping();
            }
        }
    }

    fn go_to_close_control_valves(&mut self, position_normalized: Ratio) {
        self.force_filtered.reset(self.force_raw);
        self.closed_valves_reference_position = position_normalized;
        self.current_mode = LinearActuatorMode::ClosedValves;
        self.is_soft_locked = false;
    }

    fn go_to_position_control(&mut self) {
        self.pid_controller
            .reset_with_output(self.force_raw.get::<newton>());
        self.current_mode = LinearActuatorMode::PositionControl;
        self.is_soft_locked = false;
    }

    fn go_to_active_damping(&mut self) {
        self.force_filtered.reset(self.force_raw);
        self.current_mode = LinearActuatorMode::ActiveDamping;
        self.is_soft_locked = false;
    }

    fn go_to_closed_circuit_damping(&mut self) {
        self.force_filtered.reset(self.force_raw);
        self.current_mode = LinearActuatorMode::ClosedCircuitDamping;

        if self.locks_position_in_closed_mode {
            self.is_soft_locked = true;
        }
    }

    fn update_force_from_current_mode(
        &mut self,
        context: &UpdateContext,
        required_position: Ratio,
        position_normalized: Ratio,
        current_pressure: Pressure,
        signed_flow: VolumeRate,
        speed: Velocity,
    ) {
        match self.current_mode {
            LinearActuatorMode::ClosedValves => {
                self.force_raw = self.force_closed_valves(position_normalized, speed);
            }
            LinearActuatorMode::ActiveDamping => {
                self.force_filtered
                    .update(context.delta(), self.force_active_damping(speed));

                self.force_raw = self.force_filtered.output();
            }
            LinearActuatorMode::ClosedCircuitDamping => {
                self.force_filtered
                    .update(context.delta(), self.force_closed_circuit_damping(speed));

                self.force_raw = self.force_filtered.output();
            }
            LinearActuatorMode::PositionControl => {
                self.force_raw = self.force_position_control(
                    context,
                    required_position,
                    position_normalized,
                    signed_flow,
                    current_pressure,
                    speed,
                );
            }
        }

        self.force_raw = self
            .force_raw
            .min(Force::new::<newton>(Self::MAX_ABSOLUTE_FORCE_NEWTON))
            .max(Force::new::<newton>(-Self::MAX_ABSOLUTE_FORCE_NEWTON));
    }

    fn force(&self) -> Force {
        self.force_raw
    }

    fn mode(&self) -> LinearActuatorMode {
        self.current_mode
    }

    fn force_active_damping(&self, speed: Velocity) -> Force {
        Force::new::<newton>(
            -speed.get::<meter_per_second>() * self.active_hydraulic_damping_constant,
        )
    }

    fn force_closed_circuit_damping(&self, speed: Velocity) -> Force {
        Force::new::<newton>(
            -speed.get::<meter_per_second>() * self.slow_hydraulic_damping_constant,
        )
    }

    fn force_closed_valves(&self, position_normalized: Ratio, speed: Velocity) -> Force {
        let position_error = self.closed_valves_reference_position - position_normalized;

        Force::new::<newton>(
            position_error.get::<ratio>() * self.fluid_compression_spring_constant
                - speed.get::<meter_per_second>() * self.fluid_compression_damping_constant,
        )
    }

    /// Computes a hydraulic flow request based on required actuator position and its current position
    /// Flow is computed through the formula flow = position_error^2 * maxflow / [Self::OPEN_LOOP_POSITION_ERROR_FOR_MAX_FLOW]^2.
    /// This formula means max flow will be applied above [Self::OPEN_LOOP_POSITION_ERROR_FOR_MAX_FLOW] position error.
    /// Below [Self::OPEN_LOOP_POSITION_ERROR_FOR_MAX_FLOW] position error, a squared law defines flow vs positioning error.
    ///
    /// Then final flow request is corrected depending on actuator position, modeling dampening holes
    /// in the real actuator at start/end of course
    fn open_loop_flow(&self, required_position: Ratio, position_normalized: Ratio) -> VolumeRate {
        let position_error = required_position - position_normalized;

        let open_loop_flow_target = if position_error.get::<ratio>() >= 0. {
            VolumeRate::new::<gallon_per_second>(
                position_error.get::<ratio>().powi(2) * self.max_flow.get::<gallon_per_second>()
                    / Self::OPEN_LOOP_POSITION_ERROR_FOR_MAX_FLOW.powi(2),
            )
        } else {
            VolumeRate::new::<gallon_per_second>(
                position_error.get::<ratio>().powi(2) * -self.max_flow.get::<gallon_per_second>()
                    / Self::OPEN_LOOP_POSITION_ERROR_FOR_MAX_FLOW.powi(2),
            )
        };

        let open_loop_modifier_from_position = if position_error.get::<ratio>() > 0. {
            interpolation(
                &self.flow_open_loop_position_breakpoints,
                &self.flow_open_loop_modifier_extension_map,
                position_normalized.get::<ratio>(),
            )
        } else {
            interpolation(
                &self.flow_open_loop_position_breakpoints,
                &self.flow_open_loop_modifier_retraction_map,
                position_normalized.get::<ratio>(),
            )
        };

        (open_loop_flow_target.min(self.max_flow).max(self.min_flow))
            * open_loop_modifier_from_position
    }

    fn update_force_min_max(
        &mut self,
        context: &UpdateContext,
        current_pressure: Pressure,
        speed: Velocity,
    ) {
        let mut raw_max_force = Pressure::new::<psi>(3000.) * self.bore_side_area;
        let mut raw_min_force = Pressure::new::<psi>(-3000.) * self.rod_side_area;

        if self.last_control_force > Force::new::<newton>(0.) {
            if speed > Velocity::new::<meter_per_second>(0.) {
                let max_force = current_pressure * self.bore_side_area;
                self.last_control_force = self.last_control_force.min(max_force);
                raw_max_force = max_force;
            }
        } else if self.last_control_force < Force::new::<newton>(0.)
            && speed < Velocity::new::<meter_per_second>(0.)
        {
            let max_force = -1. * current_pressure * self.rod_side_area;
            self.last_control_force = self.last_control_force.max(max_force);
            raw_min_force = max_force;
        }

        self.min_control_force
            .update(context.delta(), raw_min_force);
        self.max_control_force
            .update(context.delta(), raw_max_force);

        self.pid_controller
            .set_min(self.min_control_force.output().get::<newton>());
        self.pid_controller
            .set_max(self.max_control_force.output().get::<newton>());
    }

    fn flow_restriction_factor(&self, current_pressure: Pressure) -> f64 {
        // Selecting old 3000psi vs new hydraulic architecture based on max pressure of the system
        // New 5000 psi systems have a higher flow degradation with pressure going lower
        if self.max_working_pressure < Pressure::new::<psi>(4000.) {
            (1. / (self.max_working_pressure.get::<psi>()
                - Self::FLOW_REDUCTION_THRESHOLD_BELOW_MAX_PRESS_PSI)
                * current_pressure.get::<psi>().powi(2)
                * 1.
                / (self.max_working_pressure.get::<psi>()
                    - Self::FLOW_REDUCTION_THRESHOLD_BELOW_MAX_PRESS_PSI))
                .min(1.)
        } else {
            (current_pressure.get::<psi>().powi(3) * (0.00000004 / 5000.)).min(1.)
        }
    }

    fn force_position_control(
        &mut self,
        context: &UpdateContext,
        required_position: Ratio,
        position_normalized: Ratio,
        signed_flow: VolumeRate,
        current_pressure: Pressure,
        speed: Velocity,
    ) -> Force {
        if self.is_dev_tuning_active {
            self.pid_controller.set_gains(
                self.test_p_gain,
                self.test_i_gain,
                0.,
                self.test_force_gain,
            );
        }

        let open_loop_flow_target = self.open_loop_flow(required_position, position_normalized);

        let pressure_correction_factor = if self.has_flow_restriction {
            self.flow_restriction_factor(current_pressure)
        } else {
            1.
        };

        let pressure_corrected_openloop_target = open_loop_flow_target * pressure_correction_factor;
        self.pid_controller
            .change_setpoint(pressure_corrected_openloop_target.get::<gallon_per_second>());

        self.update_force_min_max(context, current_pressure, speed);

        self.last_control_force = Force::new::<newton>(self.pid_controller.next_control_output(
            signed_flow.get::<gallon_per_second>(),
            Some(context.delta()),
        ));

        self.last_control_force
    }
}
impl HydraulicLocking for CoreHydraulicForce {
    fn should_soft_lock(&self) -> bool {
        self.is_soft_locked
    }

    fn soft_lock_velocity(&self) -> (AngularVelocity, AngularVelocity) {
        self.soft_lock_velocity
    }
}
impl SimulationElement for CoreHydraulicForce {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.is_dev_tuning_active = reader.read(&self.dev_gains_tuning_enable_id);

        if self.is_dev_tuning_active {
            self.test_p_gain = reader.read(&self.test_p_gain_id);
            self.test_i_gain = reader.read(&self.test_i_gain_id);
            self.test_force_gain = reader.read(&self.test_force_gain_id);
        }
    }
}
impl Debug for CoreHydraulicForce {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "\nCOREHYD => Mode {:?} Force(N) {:.0} MaxForce {:.0}",
            self.current_mode,
            self.force().get::<newton>(),
            self.max_control_force.output().get::<newton>(),
        )
    }
}

pub struct LinearActuatorCharacteristics {
    max_flow: VolumeRate,
    slow_damping: f64,
}
impl LinearActuatorCharacteristics {
    pub fn new(
        min_damping: f64,
        max_damping: f64,
        nominal_flow: VolumeRate,
        flow_dispersion: Ratio,
    ) -> Self {
        let flow_max_absolute_dispersion = nominal_flow + nominal_flow * flow_dispersion;
        let flow_min_absolute_dispersion = nominal_flow - nominal_flow * flow_dispersion;

        Self {
            max_flow: VolumeRate::new::<gallon_per_second>(random_from_range(
                flow_min_absolute_dispersion.get::<gallon_per_second>(),
                flow_max_absolute_dispersion.get::<gallon_per_second>(),
            )),
            slow_damping: random_from_range(min_damping, max_damping),
        }
    }

    pub fn max_flow(&self) -> VolumeRate {
        self.max_flow
    }

    pub fn slow_damping(&self) -> f64 {
        self.slow_damping
    }
}
/// Represents a classical linear actuator with a rod side area and a bore side area
/// It is connected between an anchor point on the plane and a control arm of a rigid body
/// When the actuator moves, it takes fluid on one side and gives back to reservoir the fluid on other side
/// Difference of volume between both side will cause variation of loop reservoir level.
/// It moves between a max absolute and minimum absolute position. The position is finally normalized from 0 to 1 (compressed to extended)
///
/// It can behave it two main ways: its control valves are either closed, and it can't move, or valves are opened and
/// hydraulic power can move it with enough pressure.
#[derive(PartialEq, Clone, Copy)]
pub struct LinearActuator {
    number_of_actuators: u8,

    position_normalized: Ratio,
    position: Length,
    last_position: Length,

    speed: Velocity,

    max_absolute_length: Length,
    min_absolute_length: Length,

    total_travel: Length,

    bore_side_area: Area,
    bore_side_volume: Volume,

    rod_side_area: Area,
    rod_side_volume: Volume,

    volume_extension_ratio: Ratio,
    signed_flow: VolumeRate,

    delta_displacement: Length,

    total_volume_to_actuator: Volume,
    total_volume_to_reservoir: Volume,

    requested_position: Ratio,

    core_hydraulics: CoreHydraulicForce,

    electro_hydrostatic_backup: Option<ElectroHydrostaticBackup>,
}
impl LinearActuator {
    pub fn new(
        context: &mut InitContext,
        bounded_linear_length: &impl BoundedLinearLength,
        number_of_actuators: u8,
        bore_side_diameter: Length,
        rod_diameter: Length,
        max_flow: VolumeRate,
        fluid_compression_spring_constant: f64,
        fluid_compression_damping_constant: f64,
        active_hydraulic_damping_constant: f64,
        slow_hydraulic_damping_constant: f64,
        slow_hydraulic_damping_filtering_constant: Duration,
        flow_open_loop_modifier_extension_map: [f64; 6],
        flow_open_loop_modifier_retraction_map: [f64; 6],
        flow_open_loop_position_breakpoints: [f64; 6],
        flow_control_proportional_gain: f64,
        flow_control_integral_gain: f64,
        flow_control_force_gain: f64,
        has_flow_restriction: bool,

        locks_position_in_closed_mode: bool,
        soft_lock_velocity: Option<(AngularVelocity, AngularVelocity)>,

        electro_hydrostatic_backup: Option<ElectroHydrostaticBackup>,

        max_working_pressure: Pressure,
    ) -> Self {
        let total_travel = (bounded_linear_length.max_absolute_length_to_anchor()
            - bounded_linear_length.min_absolute_length_to_anchor())
        .abs();

        let bore_side_area_single_actuator = Area::new::<square_meter>(
            std::f64::consts::PI * (bore_side_diameter.get::<meter>() / 2.).powi(2),
        );
        let bore_side_volume_single_actuator = bore_side_area_single_actuator * total_travel;

        let rod_area = Area::new::<square_meter>(
            std::f64::consts::PI * (rod_diameter.get::<meter>() / 2.).powi(2),
        );

        let rod_side_area_single_actuator = bore_side_area_single_actuator - rod_area;
        let rod_side_volume_single_actuator = rod_side_area_single_actuator * total_travel;

        let volume_extension_ratio: Ratio =
            bore_side_volume_single_actuator / rod_side_volume_single_actuator;

        let actual_max_flow = number_of_actuators as f64 * max_flow;

        // For the same displacement speed there is less flow needed in retraction direction because
        // volume of the fluid is divided by the extension ratio
        let actual_min_flow = -actual_max_flow / volume_extension_ratio;

        let total_bore_side_area = bore_side_area_single_actuator * number_of_actuators as f64;
        let total_bore_side_volume = bore_side_volume_single_actuator * number_of_actuators as f64;

        let total_rod_side_area = rod_side_area_single_actuator * number_of_actuators as f64;
        let total_rod_side_volume = rod_side_volume_single_actuator * number_of_actuators as f64;

        let init_position = bounded_linear_length.absolute_length_to_anchor();
        let init_position_normalized =
            (init_position - bounded_linear_length.min_absolute_length_to_anchor()) / total_travel;

        Self {
            number_of_actuators,

            position_normalized: init_position_normalized,
            position: init_position,
            last_position: init_position,

            speed: Velocity::new::<meter_per_second>(0.),

            max_absolute_length: bounded_linear_length.max_absolute_length_to_anchor(),
            min_absolute_length: bounded_linear_length.min_absolute_length_to_anchor(),

            total_travel,

            bore_side_area: total_bore_side_area,
            bore_side_volume: total_bore_side_volume,

            rod_side_area: total_rod_side_area,
            rod_side_volume: total_rod_side_volume,

            volume_extension_ratio,
            signed_flow: VolumeRate::new::<gallon_per_second>(0.),

            delta_displacement: Length::new::<meter>(0.),

            total_volume_to_actuator: Volume::new::<gallon>(0.),
            total_volume_to_reservoir: Volume::new::<gallon>(0.),

            requested_position: Ratio::new::<ratio>(0.),

            core_hydraulics: CoreHydraulicForce::new(
                context,
                init_position_normalized,
                active_hydraulic_damping_constant,
                slow_hydraulic_damping_constant,
                slow_hydraulic_damping_filtering_constant,
                fluid_compression_spring_constant,
                fluid_compression_damping_constant,
                actual_max_flow,
                actual_min_flow,
                total_bore_side_area,
                total_rod_side_area,
                flow_open_loop_modifier_extension_map,
                flow_open_loop_modifier_retraction_map,
                flow_open_loop_position_breakpoints,
                flow_control_proportional_gain,
                flow_control_integral_gain,
                flow_control_force_gain,
                has_flow_restriction,
                locks_position_in_closed_mode,
                soft_lock_velocity,
                max_working_pressure,
            ),
            electro_hydrostatic_backup,
        }
    }

    fn update_before_rigid_body(
        &mut self,
        context: &UpdateContext,
        connected_body: &mut LinearActuatedRigidBodyOnHingeAxis,
        controller: &(impl HydraulicAssemblyController + HydraulicLocking + ElectroHydrostaticPowered),
        current_input_pressure: Pressure,
    ) {
        let mut can_move_using_aircraft_hydraulic_pressure = true;

        let internal_actuator_pressure = self.pressure();

        if let Some(eha) = self.electro_hydrostatic_backup.as_mut() {
            eha.update(
                context,
                controller,
                current_input_pressure,
                self.signed_flow,
                internal_actuator_pressure,
            );

            can_move_using_aircraft_hydraulic_pressure =
                eha.can_move_using_aircraft_hydraulic_pressure();
        }

        let internal_actuator_pressure = if controller.should_activate_electrical_mode()
            && self.electro_hydrostatic_backup.is_some()
        {
            self.electro_hydrostatic_backup
                .unwrap()
                .max_available_pressure()
        } else if can_move_using_aircraft_hydraulic_pressure {
            current_input_pressure
        } else {
            Pressure::default()
        };

        self.core_hydraulics.update_force(
            context,
            self.requested_position,
            controller.requested_mode(),
            self.position_normalized,
            internal_actuator_pressure,
            self.signed_flow,
            self.speed,
        );
        connected_body.apply_control_arm_force(self.core_hydraulics.force());
    }

    fn update_after_rigid_body(
        &mut self,
        context: &UpdateContext,
        connected_body: &LinearActuatedRigidBodyOnHingeAxis,
    ) {
        self.update_speed_position(context, connected_body);

        self.update_fluid_displacements(context);
    }

    fn update_speed_position(
        &mut self,
        context: &UpdateContext,
        connected_body: &LinearActuatedRigidBodyOnHingeAxis,
    ) {
        self.last_position = self.position;
        self.position = connected_body.linear_extension_to_anchor();

        self.position_normalized = (self.position - self.min_absolute_length) / self.total_travel;

        self.delta_displacement = self.position - self.last_position;

        self.speed = self.delta_displacement / context.delta_as_time();
    }

    fn update_fluid_displacements(&mut self, context: &UpdateContext) {
        let mut volume_to_actuator = Volume::new::<cubic_meter>(0.);
        let mut volume_to_reservoir = Volume::new::<cubic_meter>(0.);

        if self.delta_displacement > Length::new::<meter>(0.) {
            volume_to_actuator = self.delta_displacement * self.bore_side_area;
            volume_to_reservoir = volume_to_actuator / self.volume_extension_ratio;
        } else if self.delta_displacement < Length::new::<meter>(0.) {
            volume_to_actuator = -self.delta_displacement * self.rod_side_area;
            volume_to_reservoir = volume_to_actuator * self.volume_extension_ratio;
        }

        self.signed_flow = if self.delta_displacement >= Length::new::<meter>(0.) {
            volume_to_actuator
        } else {
            -volume_to_actuator
        } / context.delta_as_time();

        // If eha mode, we don't want to use any fluid from the circuit when actuator moves, else we compute correct volumes
        if !self.eha_backup_is_active() {
            // If actuator is in active control, it can use fluid from its input port
            // Else it will only return fluid to reservoir or take fluid from reservoir
            //
            // Note on assymetric actuators, in extension direction, return to reservoir can be negative,
            //   meaning actuator takes fluid in the return circuit to be able to move.
            // This is a shortcut as it shouldn't directly take from reservoir but from return circuit
            if self.core_hydraulics.mode() == LinearActuatorMode::PositionControl {
                self.total_volume_to_actuator += volume_to_actuator;
                self.total_volume_to_reservoir += volume_to_reservoir;
            } else {
                self.total_volume_to_reservoir += volume_to_reservoir - volume_to_actuator;
            }
        }
    }

    fn eha_backup_is_active(&self) -> bool {
        self.electro_hydrostatic_backup
            .is_some_and(|eha| eha.is_electrical_mode_active())
    }

    pub fn set_position_target(&mut self, target_position: Ratio) {
        self.requested_position = target_position;
    }

    pub fn position_normalized(&self) -> Ratio {
        self.position_normalized
    }

    fn force(&self) -> Force {
        self.core_hydraulics.force()
    }

    pub fn signed_flow(&self) -> VolumeRate {
        self.signed_flow
    }

    fn pressure(&self) -> Pressure {
        let area = if self.speed > Velocity::new::<meter_per_second>(0.) {
            self.bore_side_area
        } else {
            self.rod_side_area
        };

        self.force() / area
    }
}
impl Actuator for LinearActuator {
    fn used_volume(&self) -> Volume {
        let mut eha_volume_used = Volume::default();
        if let Some(eha) = self.electro_hydrostatic_backup.as_ref() {
            eha_volume_used = eha.used_volume();
        }

        self.total_volume_to_actuator + eha_volume_used
    }

    fn reservoir_return(&self) -> Volume {
        self.total_volume_to_reservoir
    }

    fn reset_volumes(&mut self) {
        self.total_volume_to_reservoir = Volume::new::<gallon>(0.);
        self.total_volume_to_actuator = Volume::new::<gallon>(0.);

        if let Some(eha) = self.electro_hydrostatic_backup.as_mut() {
            eha.reset_volumes();
        }
    }
}
impl HydraulicLocking for LinearActuator {
    fn should_soft_lock(&self) -> bool {
        self.core_hydraulics.should_soft_lock()
    }

    fn soft_lock_velocity(&self) -> (AngularVelocity, AngularVelocity) {
        self.core_hydraulics.soft_lock_velocity()
    }
}
impl SimulationElement for LinearActuator {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.core_hydraulics.accept(visitor);
        if let Some(eha) = self.electro_hydrostatic_backup.as_mut() {
            eha.accept(visitor);
        };

        visitor.visit(self);
    }
}
impl Debug for LinearActuator {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        if self.electro_hydrostatic_backup.is_some() {
            write!(
                f,
                "Actuator => Type:EHA {:?} / {:?} / Current flow gpm{:.3}",
                self.electro_hydrostatic_backup.unwrap(),
                self.core_hydraulics,
                self.signed_flow.get::<gallon_per_minute>()
            )
        } else {
            write!(
                f,
                "Actuator => Type:Standard / {:?} / Current flow gpm{:.3}",
                self.core_hydraulics,
                self.signed_flow.get::<gallon_per_minute>()
            )
        }
    }
}

pub trait HydraulicAssemblyController {
    fn requested_mode(&self) -> LinearActuatorMode;
    fn requested_position(&self) -> Ratio;
    fn should_lock(&self) -> bool;
    fn requested_lock_position(&self) -> Ratio;
    fn should_run_electro_hydrostatic_backup(&self) -> bool {
        false
    }
}

pub trait HydraulicLocking {
    fn should_soft_lock(&self) -> bool {
        false
    }

    fn soft_lock_velocity(&self) -> (AngularVelocity, AngularVelocity) {
        (AngularVelocity::default(), AngularVelocity::default())
    }
}

pub fn get_more_restrictive_soft_lock_velocities(
    controller1: &impl HydraulicLocking,
    controller2: &impl HydraulicLocking,
) -> (AngularVelocity, AngularVelocity) {
    (
        controller1
            .soft_lock_velocity()
            .0
            .max(controller2.soft_lock_velocity().0),
        controller1
            .soft_lock_velocity()
            .1
            .min(controller2.soft_lock_velocity().1),
    )
}

pub struct HydraulicLinearActuatorAssembly<const N: usize> {
    linear_actuators: [LinearActuator; N],
    rigid_body: LinearActuatedRigidBodyOnHingeAxis,
}
impl<const N: usize> HydraulicLinearActuatorAssembly<N> {
    pub fn new(
        linear_actuators: [LinearActuator; N],
        rigid_body: LinearActuatedRigidBodyOnHingeAxis,
    ) -> Self {
        Self {
            linear_actuators,
            rigid_body,
        }
    }

    pub fn actuator(&mut self, index: usize) -> &mut impl Actuator {
        assert!(index < N);
        &mut self.linear_actuators[index]
    }

    pub fn body(&mut self) -> &mut impl AerodynamicBody {
        &mut self.rigid_body
    }

    pub fn aerodynamic_torque(&self) -> Torque {
        self.rigid_body.aerodynamic_torque()
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        assembly_controllers: &[impl HydraulicAssemblyController
              + HydraulicLocking
              + ElectroHydrostaticPowered],
        current_pressure: [Pressure; N],
    ) {
        for (index, actuator) in self.linear_actuators.iter_mut().enumerate() {
            actuator.set_position_target(
                self.rigid_body
                    .linear_actuator_pos_normalized_from_angular_position_normalized(
                        assembly_controllers[index].requested_position(),
                    ),
            );
        }

        self.update_hard_lock_mechanism(assembly_controllers);

        if !self.rigid_body.is_locked() {
            self.update_soft_lock_mechanism(assembly_controllers);

            for (index, actuator) in self.linear_actuators.iter_mut().enumerate() {
                actuator.update_before_rigid_body(
                    context,
                    &mut self.rigid_body,
                    &assembly_controllers[index],
                    current_pressure[index],
                );
            }

            self.rigid_body.update(context);

            for actuator in &mut self.linear_actuators {
                actuator.update_after_rigid_body(context, &self.rigid_body);
            }
        } else {
            self.rigid_body.update(context);
        }
    }

    fn update_hard_lock_mechanism(
        &mut self,
        assembly_controllers: &[impl HydraulicAssemblyController],
    ) {
        // The first controller requesting a lock locks the body
        let mut no_lock = true;
        for controller in assembly_controllers {
            if controller.should_lock() {
                self.rigid_body
                    .lock_at_position_normalized(controller.requested_lock_position());

                no_lock = false;

                break;
            }
        }

        if no_lock {
            self.rigid_body.unlock();
        }
    }

    fn update_soft_lock_mechanism(&mut self, assembly_controllers: &[impl HydraulicLocking]) {
        let mut no_lock = true;

        let mut min_velocity = AngularVelocity::new::<radian_per_second>(-10000.);
        let mut max_velocity = AngularVelocity::new::<radian_per_second>(10000.);

        // Min velocity will be the max one amongst all the limit velocities requested
        // Max velocity will be the min one amongst all the limit velocities requested
        // This way we use the more restrictive speed limitation over all the controller demands
        for (idx, controller) in assembly_controllers.iter().enumerate() {
            if controller.should_soft_lock() || self.linear_actuators[idx].should_soft_lock() {
                // If actuator itself already is locking we take the more restrictive locking speeds, else we only use external locking speeds
                let (new_min, new_max) = if controller.should_soft_lock()
                    && self.linear_actuators[idx].should_soft_lock()
                {
                    get_more_restrictive_soft_lock_velocities(
                        controller,
                        &self.linear_actuators[idx],
                    )
                } else if controller.should_soft_lock() {
                    controller.soft_lock_velocity()
                } else {
                    self.linear_actuators[idx].soft_lock_velocity()
                };

                max_velocity = max_velocity.min(new_max);
                min_velocity = min_velocity.max(new_min);

                no_lock = false;
            }
        }

        if no_lock {
            self.rigid_body.soft_unlock();
        } else {
            self.rigid_body.soft_lock(min_velocity, max_velocity)
        }
    }

    pub fn is_locked(&self) -> bool {
        self.rigid_body.is_locked()
    }

    pub fn position_normalized(&self) -> Ratio {
        self.rigid_body.position_normalized()
    }

    pub fn actuator_position_normalized(&self, index: usize) -> Ratio {
        self.linear_actuators[index].position_normalized()
    }

    pub fn set_trim_offset(&mut self, trim_angle: Angle) {
        self.rigid_body.apply_global_angle_offset(trim_angle);
    }

    #[cfg(test)]
    pub fn actuator_flow(&self, index: usize) -> VolumeRate {
        self.linear_actuators[index].signed_flow().abs()
    }
}
impl SimulationElement for HydraulicLinearActuatorAssembly<1> {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.linear_actuators, visitor);

        visitor.visit(self);
    }
}
impl Debug for HydraulicLinearActuatorAssembly<1> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "\nHYD ASSEMBLY => \nActuator {:?}",
            self.linear_actuators[0],
        )
    }
}
impl SimulationElement for HydraulicLinearActuatorAssembly<2> {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.linear_actuators, visitor);

        visitor.visit(self);
    }
}
impl Debug for HydraulicLinearActuatorAssembly<2> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "\nHYD ASSEMBLY => \nActuator1 {:?} \nActuator2 {:?}",
            self.linear_actuators[0], self.linear_actuators[1],
        )
    }
}
impl SimulationElement for HydraulicLinearActuatorAssembly<3> {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.linear_actuators, visitor);

        visitor.visit(self);
    }
}
impl Debug for HydraulicLinearActuatorAssembly<3> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "\nHYD ASSEMBLY => \nActuator1 {:?} \nActuator2 {:?} \nActuator3 {:?}",
            self.linear_actuators[0], self.linear_actuators[1], self.linear_actuators[2],
        )
    }
}

/// Represent any physical object able to rotate on a hinge axis.
/// It can be a gear, elevator, cargo door, etc. Only one rotation degree of freedom is handled.
/// An linear actuator or multiple linear actuators can apply forces to its control arm.
///
/// Coordinates are as follows:
/// on x (left->right looking at the plane from the back)
/// on y (down->up)
/// on z (aft->fwd)
///
/// All coordinate references are from the hinge axis. So (0,0,0) is the hinge rotation axis center.
#[derive(PartialEq, Clone, Copy)]
pub struct LinearActuatedRigidBodyOnHingeAxis {
    total_travel: Angle,
    min_angle: Angle,
    max_angle: Angle,

    // size in meters
    size: Vector3<f64>,

    center_of_gravity_offset: Vector3<f64>,
    center_of_gravity_actual: Vector3<f64>,

    center_of_pressure_offset: Vector3<f64>,
    center_of_pressure_actual: Vector3<f64>,

    control_arm: Vector3<f64>,
    control_arm_actual: Vector3<f64>,
    actuator_extension_gives_positive_angle: bool,

    anchor_point: Vector3<f64>,

    angular_position: Angle,
    angular_speed: AngularVelocity,
    angular_acceleration: AngularAcceleration,
    sum_of_torques: Torque,

    aerodynamic_torque: Torque,

    position_normalized: Ratio,
    position_normalized_prev: Ratio,

    mass: Mass,
    inertia_at_hinge: f64,

    natural_damping_constant: f64,

    lock_position_request: Ratio,
    is_lock_requested: bool,
    is_locked: bool,

    axis_direction: Vector3<f64>,
    rotation_transform: Rotation3<f64>,

    global_angular_offset: Angle,

    is_soft_locked: bool,
    min_soft_lock_velocity: AngularVelocity,
    max_soft_lock_velocity: AngularVelocity,

    min_absolute_length_to_anchor: Length,
    max_absolute_length_to_anchor: Length,
}
impl LinearActuatedRigidBodyOnHingeAxis {
    // Rebound energy when hiting min or max position. 0.3 means the body rebounds at 30% of the speed it hit the min/max position
    const DEFAULT_MAX_MIN_POSITION_REBOUND_FACTOR: f64 = 0.3;

    // Speed cap for all rigid bodies movements. Avoids chain reaction to numerical instability
    const MAX_ABSOLUTE_ANGULAR_SPEED_RAD_S: f64 = 8.;

    pub fn new(
        mass: Mass,
        size: Vector3<f64>,
        center_of_gravity_offset: Vector3<f64>,
        center_of_pressure_offset: Vector3<f64>,
        control_arm: Vector3<f64>,
        anchor_point: Vector3<f64>,
        min_angle: Angle,
        total_travel: Angle,
        init_angle: Angle,
        natural_damping_constant: f64,
        locked: bool,
        axis_direction: Vector3<f64>,
    ) -> Self {
        // The inertia about a given axis is the sum of squares of the size of the rectangle, minus
        // the size along the axis dimension
        let relevant_inertia = size.norm_squared();
        let relevant_inertia = relevant_inertia - (size.dot(&axis_direction)).powf(2.);
        let inertia_at_cog = (1. / 12.) * mass.get::<kilogram>() * relevant_inertia;
        // Parallel axis theorem to get inertia at hinge axis from inertia at CoG
        let inertia_at_hinge =
            inertia_at_cog + mass.get::<kilogram>() * center_of_gravity_offset.norm_squared();

        let mut new_body = Self {
            total_travel,
            min_angle,
            max_angle: min_angle + total_travel,
            size,
            center_of_gravity_offset,
            center_of_gravity_actual: center_of_gravity_offset,
            center_of_pressure_offset,
            center_of_pressure_actual: center_of_pressure_offset,
            control_arm,
            control_arm_actual: control_arm,
            actuator_extension_gives_positive_angle: false,
            anchor_point,
            angular_position: init_angle,
            angular_speed: AngularVelocity::default(),
            angular_acceleration: AngularAcceleration::default(),
            sum_of_torques: Torque::default(),
            aerodynamic_torque: Torque::default(),
            position_normalized: Ratio::default(),
            position_normalized_prev: Ratio::default(),
            mass,
            inertia_at_hinge,
            natural_damping_constant,
            lock_position_request: Ratio::default(),
            is_lock_requested: locked,
            is_locked: locked,
            axis_direction,
            rotation_transform: Rotation3::from_axis_angle(
                &Unit::new_normalize(axis_direction),
                0.,
            ),

            global_angular_offset: Angle::default(),

            is_soft_locked: false,
            min_soft_lock_velocity: AngularVelocity::default(),
            max_soft_lock_velocity: AngularVelocity::default(),

            min_absolute_length_to_anchor: Length::default(),
            max_absolute_length_to_anchor: Length::default(),
        };
        // Make sure the new object has coherent structure by updating internal roations and positions once
        new_body.initialize_actuator_force_direction();
        new_body.update_all_rotations();
        new_body.init_min_max_linear_length();
        new_body.init_position_normalized();

        new_body
    }

    pub fn apply_control_arm_force(&mut self, actuator_local_force: Force) {
        let absolute_actuator_force = -actuator_local_force;

        // Computing the normalized vector on which force is applied. This is the vector from anchor point of actuator to where
        // it is connected to the rigid body
        let force_support_vector = self.anchor_point - self.control_arm_actual;
        let force_support_vector_normalized = force_support_vector / force_support_vector.norm();

        // Final torque is control arm position relative to hinge, cross product with
        // magnitude of the force applied on the force support vector
        let torque = self
            .control_arm
            .cross(&(absolute_actuator_force.get::<newton>() * force_support_vector_normalized));

        let torque_value = Torque::new::<newton_meter>(self.axis_direction.dot(&torque));

        self.sum_of_torques += torque_value;
    }

    pub fn apply_aero_force(&mut self, aerodynamic_force: Vector3<Force>) {
        let torque = self.center_of_pressure_actual.cross(&Vector3::<f64>::new(
            aerodynamic_force[0].get::<newton>(),
            aerodynamic_force[1].get::<newton>(),
            aerodynamic_force[2].get::<newton>(),
        ));

        self.aerodynamic_torque = Torque::new::<newton_meter>(self.axis_direction.dot(&torque));

        self.sum_of_torques += self.aerodynamic_torque;
    }

    pub fn apply_global_angle_offset(&mut self, offset: Angle) {
        self.global_angular_offset = offset;
    }

    pub fn linear_extension_to_anchor(&self) -> Length {
        Length::new::<meter>((self.anchor_point - self.control_arm_actual).norm())
    }

    /// Indicates correct direction of the rigid body when an actuator would be extending or compressing.
    /// If extending actuator would give an increasing rigid body angle, sets TRUE
    /// If extending actuator would give a decreasing rigid body angle, sets FALSE
    fn initialize_actuator_force_direction(&mut self) {
        self.actuator_extension_gives_positive_angle = self
            .absolute_length_to_anchor_at_angle(self.min_angle)
            < self.absolute_length_to_anchor_at_angle(self.max_angle)
    }

    /// If extending actuator would give an increasing rigid body angle, returns TRUE
    /// If extending actuator would give a decreasing rigid body angle, returns FALSE
    pub fn actuator_extension_gives_positive_angle(&self) -> bool {
        self.actuator_extension_gives_positive_angle
    }

    fn lock_requested_position_in_absolute_reference(&self) -> Angle {
        if self.actuator_extension_gives_positive_angle() {
            self.lock_position_request.get::<ratio>() * self.total_travel + self.min_angle
        } else {
            -self.lock_position_request.get::<ratio>() * self.total_travel + self.max_angle
        }
    }

    pub fn aerodynamic_torque(&self) -> Torque {
        self.aerodynamic_torque
    }

    pub fn position_normalized(&self) -> Ratio {
        self.position_normalized
    }

    fn init_position_normalized(&mut self) {
        self.update_position_normalized();
        self.position_normalized_prev = self.position_normalized;
    }

    fn update_position_normalized(&mut self) {
        self.position_normalized_prev = self.position_normalized;

        self.position_normalized = (self.angular_position - self.min_angle) / self.total_travel;

        if !self.actuator_extension_gives_positive_angle() {
            self.position_normalized = Ratio::new::<ratio>(1.) - self.position_normalized;
        };
    }

    // Rotates the static coordinates of the body according to its current angle to get the actual coordinates
    fn update_all_rotations(&mut self) {
        self.rotation_transform = Rotation3::from_axis_angle(
            &Unit::new_normalize(self.axis_direction),
            self.angular_position.get::<radian>(),
        );
        self.control_arm_actual = self.rotation_transform * self.control_arm;
        self.center_of_gravity_actual = self.rotation_transform * self.center_of_gravity_offset;
        self.center_of_pressure_actual = self.rotation_transform * self.center_of_pressure_offset;
    }

    // Computes torque caused by local plane acceleration
    fn torque_from_local_acceleration_and_gravity(&self, context: &UpdateContext) -> Torque {
        // Force = m * G
        let resultant_force_plane_reference = context
            .acceleration_plane_reference_filtered_ms2_vector()
            * self.mass.get::<kilogram>();

        // Global offset rotates the world vs our body, so it impacts all external accelerations
        let global_offset_rotation = Rotation3::from_axis_angle(
            &Unit::new_normalize(self.axis_direction),
            -self.global_angular_offset.get::<radian>(),
        );

        let resultant_force_plane_reference_with_angle_offset =
            global_offset_rotation * resultant_force_plane_reference;

        // The Moment generated by acceleration force is the CoG offset from hinge position cross product with the acceleration force
        let gravity_moment_vector = self
            .center_of_gravity_actual
            .cross(&resultant_force_plane_reference_with_angle_offset);

        // We work with only one degree of freedom so final result holds in the hinge rotation component only
        Torque::new::<newton_meter>(gravity_moment_vector.dot(&self.axis_direction))
    }

    // A global damping factor that simulates hinge friction and local air resistance
    fn natural_damping(&self) -> Torque {
        Torque::new::<newton_meter>(
            -self.angular_speed.get::<radian_per_second>() * self.natural_damping_constant,
        )
    }

    pub fn update(&mut self, context: &UpdateContext) {
        if !self.is_locked {
            self.sum_of_torques +=
                self.natural_damping() + self.torque_from_local_acceleration_and_gravity(context);

            self.angular_acceleration = AngularAcceleration::new::<radian_per_second_squared>(
                self.sum_of_torques.get::<newton_meter>() / self.inertia_at_hinge,
            );

            self.angular_speed += AngularVelocity::new::<radian_per_second>(
                self.angular_acceleration.get::<radian_per_second_squared>()
                    * context.delta_as_secs_f64(),
            );

            self.limit_absolute_angular_speed();
            self.limit_angular_speed_from_soft_lock();

            self.angular_position += Angle::new::<radian>(
                self.angular_speed.get::<radian_per_second>() * context.delta_as_secs_f64(),
            );

            self.update_lock_state();
            self.limit_position_to_range();

            self.update_position_normalized();
            self.update_all_rotations();
        }

        self.sum_of_torques = Torque::new::<newton_meter>(0.);
    }

    fn update_lock_state(&mut self) {
        // We check if lock is requested and if we crossed the lock position since last update
        if self.is_lock_requested
            && (self.position_normalized >= self.lock_position_request
                && self.position_normalized_prev <= self.lock_position_request
                || self.position_normalized <= self.lock_position_request
                    && self.position_normalized_prev >= self.lock_position_request)
        {
            self.is_locked = true;
            self.angular_position = self.lock_requested_position_in_absolute_reference();
            self.angular_speed = AngularVelocity::new::<radian_per_second>(0.);
        }
    }

    /// If a soft lock is active, will limit the current angular velocity
    fn limit_angular_speed_from_soft_lock(&mut self) {
        if self.is_soft_locked {
            self.angular_speed = self
                .angular_speed
                .min(self.max_soft_lock_velocity)
                .max(self.min_soft_lock_velocity);
        }
    }

    fn limit_absolute_angular_speed(&mut self) {
        let max_angular_speed =
            AngularVelocity::new::<radian_per_second>(Self::MAX_ABSOLUTE_ANGULAR_SPEED_RAD_S);

        self.angular_speed = self
            .angular_speed
            .min(max_angular_speed)
            .max(-max_angular_speed);
    }

    fn limit_position_to_range(&mut self) {
        if self.angular_position >= self.max_angle {
            self.angular_position = self.max_angle;
            self.angular_speed =
                -self.angular_speed * Self::DEFAULT_MAX_MIN_POSITION_REBOUND_FACTOR;
        } else if self.angular_position <= self.min_angle {
            self.angular_position = self.min_angle;
            self.angular_speed =
                -self.angular_speed * Self::DEFAULT_MAX_MIN_POSITION_REBOUND_FACTOR;
        }
    }

    pub fn unlock(&mut self) {
        self.is_locked = false;
        self.is_lock_requested = false;
    }

    pub fn lock_at_position_normalized(&mut self, position_normalized: Ratio) {
        self.is_lock_requested = true;
        self.lock_position_request = position_normalized;
    }

    pub fn is_locked(&self) -> bool {
        self.is_locked
    }

    pub fn soft_unlock(&mut self) {
        self.is_soft_locked = false;
    }

    pub fn soft_lock(&mut self, min_velocity: AngularVelocity, max_velocity: AngularVelocity) {
        self.is_soft_locked = true;
        self.min_soft_lock_velocity = min_velocity;
        self.max_soft_lock_velocity = max_velocity;
    }

    fn absolute_length_to_anchor_at_angle(&self, position: Angle) -> Length {
        let rotation = Rotation3::from_axis_angle(
            &Unit::new_normalize(self.axis_direction),
            position.get::<radian>(),
        );
        let control_arm_position = rotation * self.control_arm;

        Length::new::<meter>((self.anchor_point - control_arm_position).norm())
    }

    fn init_min_max_linear_length(&mut self) {
        let length_at_min_angle = self.absolute_length_to_anchor_at_angle(self.min_angle);
        let length_at_max_angle = self.absolute_length_to_anchor_at_angle(self.max_angle);

        self.min_absolute_length_to_anchor = length_at_min_angle.min(length_at_max_angle);
        self.max_absolute_length_to_anchor = length_at_min_angle.max(length_at_max_angle);
    }

    fn linear_length_normalized_from_absolute_angle(&self, angle_demand: Angle) -> Ratio {
        let total_linear_travel =
            self.max_absolute_length_to_anchor - self.min_absolute_length_to_anchor;

        let current_length_from_angle = self.absolute_length_to_anchor_at_angle(angle_demand);

        (current_length_from_angle - self.min_absolute_length_to_anchor) / total_linear_travel
    }

    fn angular_ratio_to_absolute_angle(&self, angular_ratio_normalized: Ratio) -> Angle {
        if self.actuator_extension_gives_positive_angle() {
            angular_ratio_normalized.get::<ratio>() * self.total_travel + self.min_angle
        } else {
            -angular_ratio_normalized.get::<ratio>() * self.total_travel + self.max_angle
        }
    }

    pub fn linear_actuator_pos_normalized_from_angular_position_normalized(
        &self,
        angular_ratio_normalized: Ratio,
    ) -> Ratio {
        // We allow 0.1 over min and max range so actuators that are controlled to end position do not slow down just before max position
        let limited_ratio = angular_ratio_normalized
            .max(Ratio::new::<ratio>(-0.1))
            .min(Ratio::new::<ratio>(1.1));
        self.linear_length_normalized_from_absolute_angle(
            self.angular_ratio_to_absolute_angle(limited_ratio),
        )
    }
}
impl BoundedLinearLength for LinearActuatedRigidBodyOnHingeAxis {
    fn min_absolute_length_to_anchor(&self) -> Length {
        self.min_absolute_length_to_anchor
    }

    fn max_absolute_length_to_anchor(&self) -> Length {
        self.max_absolute_length_to_anchor
    }

    fn absolute_length_to_anchor(&self) -> Length {
        self.linear_extension_to_anchor()
    }
}
impl AerodynamicBody for LinearActuatedRigidBodyOnHingeAxis {
    fn size(&self) -> Vector3<Length> {
        Vector3::new(
            Length::new::<meter>(self.size[0]),
            Length::new::<meter>(self.size[1]),
            Length::new::<meter>(self.size[2]),
        )
    }

    fn rotation_transform(&self) -> Rotation3<f64> {
        Rotation3::from_axis_angle(
            &Unit::new_normalize(self.axis_direction),
            (self.angular_position + self.global_angular_offset).get::<radian>(),
        )
    }

    fn apply_aero_forces(&mut self, aero_forces: Vector3<Force>) {
        self.apply_aero_force(aero_forces);
    }
}

#[cfg(test)]
mod tests {
    use nalgebra::Vector3;
    use ntest::assert_about_eq;

    use super::*;

    use crate::electrical::test::TestElectricitySource;
    use crate::electrical::ElectricalBus;
    use crate::electrical::Electricity;

    use crate::shared::PowerConsumptionReport;
    use crate::shared::{update_iterator::MaxStepLoop, PotentialOrigin};
    use crate::simulation::test::{ElementCtorFn, SimulationTestBed, TestBed, WriteByName};
    use crate::simulation::{Aircraft, InitContext, SimulationElement};
    use std::time::Duration;
    use uom::si::{angle::degree, electric_potential::volt, mass::kilogram, pressure::psi};

    #[derive(PartialEq, Clone, Copy)]
    struct TestHydraulicAssemblyController {
        mode: LinearActuatorMode,
        requested_position: Ratio,
        lock_request: bool,
        lock_position: Ratio,

        soft_lock_request: bool,
        soft_lock_velocity: (AngularVelocity, AngularVelocity),

        should_activate_elec_backup: bool,
        should_activate_elec_backup_refill: bool,
    }
    impl TestHydraulicAssemblyController {
        fn new() -> Self {
            Self {
                mode: LinearActuatorMode::ClosedValves,

                requested_position: Ratio::new::<ratio>(0.),
                lock_request: true,
                lock_position: Ratio::new::<ratio>(0.),
                soft_lock_request: false,
                soft_lock_velocity: (AngularVelocity::default(), AngularVelocity::default()),

                should_activate_elec_backup: false,
                should_activate_elec_backup_refill: false,
            }
        }

        fn set_mode(&mut self, mode: LinearActuatorMode) {
            self.mode = mode;
        }

        fn set_lock(&mut self, lock_position: Ratio) {
            self.lock_request = true;
            self.lock_position = lock_position;
        }

        fn set_unlock(&mut self) {
            self.lock_request = false;
        }

        fn set_position_target(&mut self, requested_position: Ratio) {
            self.requested_position = requested_position;
        }

        fn set_soft_lock(&mut self, lock_velocity: (AngularVelocity, AngularVelocity)) {
            self.soft_lock_request = true;
            self.soft_lock_velocity = lock_velocity;
        }

        fn set_elec_backup(&mut self, is_on: bool) {
            self.should_activate_elec_backup = is_on;
        }

        fn set_elec_backup_refill(&mut self, is_on: bool) {
            self.should_activate_elec_backup_refill = is_on;
        }
    }
    impl HydraulicAssemblyController for TestHydraulicAssemblyController {
        fn requested_mode(&self) -> LinearActuatorMode {
            self.mode
        }

        fn requested_position(&self) -> Ratio {
            self.requested_position
        }

        fn should_lock(&self) -> bool {
            self.lock_request
        }

        fn requested_lock_position(&self) -> Ratio {
            self.lock_position
        }
    }
    impl HydraulicLocking for TestHydraulicAssemblyController {
        fn should_soft_lock(&self) -> bool {
            self.soft_lock_request
        }

        fn soft_lock_velocity(&self) -> (AngularVelocity, AngularVelocity) {
            self.soft_lock_velocity
        }
    }
    impl ElectroHydrostaticPowered for TestHydraulicAssemblyController {
        fn should_activate_electrical_mode(&self) -> bool {
            self.should_activate_elec_backup
        }

        fn should_open_refill_valve(&self) -> bool {
            self.should_activate_elec_backup_refill
        }
    }

    struct TestAerodynamicModel {
        force: Vector3<Force>,
    }
    impl TestAerodynamicModel {
        fn new() -> Self {
            Self {
                force: Vector3::<Force>::new(Force::default(), Force::default(), Force::default()),
            }
        }

        fn apply_up_force(&mut self, force_up: Force) {
            self.force[1] = force_up;
        }

        fn update_body(&self, body: &mut impl AerodynamicBody) {
            body.apply_aero_forces(self.force);
        }
    }

    struct TestAircraft<const N: usize> {
        loop_updater: MaxStepLoop,

        hydraulic_assembly: HydraulicLinearActuatorAssembly<N>,

        controllers: [TestHydraulicAssemblyController; N],

        pressures: [Pressure; N],

        aero_forces: TestAerodynamicModel,

        powered_source_ac: TestElectricitySource,
        ac_1_bus: ElectricalBus,
        is_ac_1_powered: bool,
        power_consumption: Power,
    }
    impl<const N: usize> TestAircraft<N> {
        const PHYSICS_TIME_STEP: Duration = Duration::from_millis(10);

        fn new(
            context: &mut InitContext,
            hydraulic_assembly: HydraulicLinearActuatorAssembly<N>,
        ) -> Self {
            Self {
                loop_updater: MaxStepLoop::new(Self::PHYSICS_TIME_STEP),

                hydraulic_assembly,

                controllers: [TestHydraulicAssemblyController::new(); N],

                pressures: [Pressure::new::<psi>(0.); N],

                aero_forces: TestAerodynamicModel::new(),

                powered_source_ac: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::EngineGenerator(1),
                ),
                ac_1_bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(1)),
                is_ac_1_powered: false,
                power_consumption: Power::default(),
            }
        }

        fn set_pressures(&mut self, pressures: [Pressure; N]) {
            self.pressures = pressures;
        }

        fn command_active_damping_mode(&mut self, actuator_id: usize) {
            assert!(actuator_id < N);
            self.controllers[actuator_id].set_mode(LinearActuatorMode::ActiveDamping);
        }

        fn command_closed_circuit_damping_mode(&mut self, actuator_id: usize) {
            assert!(actuator_id < N);
            self.controllers[actuator_id].set_mode(LinearActuatorMode::ClosedCircuitDamping);
        }

        fn command_closed_valve_mode(&mut self, actuator_id: usize) {
            assert!(actuator_id < N);
            self.controllers[actuator_id].set_mode(LinearActuatorMode::ClosedValves);
        }

        fn command_position_control(&mut self, position: Ratio, actuator_id: usize) {
            assert!(actuator_id < N);
            self.controllers[actuator_id].set_mode(LinearActuatorMode::PositionControl);
            self.controllers[actuator_id].set_position_target(position);
        }

        fn command_electro_backup(&mut self, is_active: bool, actuator_id: usize) {
            assert!(actuator_id < N);
            self.controllers[actuator_id].set_elec_backup(is_active);
        }

        fn command_electro_backup_refill(&mut self, is_active: bool, actuator_id: usize) {
            assert!(actuator_id < N);
            self.controllers[actuator_id].set_elec_backup_refill(is_active);
        }

        fn accumulator_pressure(&self, actuator_id: usize) -> Pressure {
            if let Some(eha) =
                self.hydraulic_assembly.linear_actuators[actuator_id].electro_hydrostatic_backup
            {
                eha.accumulator_pressure()
            } else {
                Pressure::default()
            }
        }

        fn actuator_used_volume(&self, actuator_id: usize) -> Volume {
            self.hydraulic_assembly.linear_actuators[actuator_id].used_volume()
        }

        fn command_empty_eha_accumulator(&mut self, actuator_id: usize) {
            assert!(actuator_id < N);
            if let Some(eha) = self.hydraulic_assembly.linear_actuators[actuator_id]
                .electro_hydrostatic_backup
                .as_mut()
            {
                eha.accumulator.empty_accumulator();
            }
        }

        fn command_lock(&mut self, lock_position: Ratio) {
            for controller in &mut self.controllers {
                controller.set_lock(lock_position);
            }
        }

        fn command_soft_lock(&mut self, lock_velocity: (AngularVelocity, AngularVelocity)) {
            for controller in &mut self.controllers {
                controller.set_soft_lock(lock_velocity);
            }
        }

        fn command_unlock(&mut self) {
            for controller in &mut self.controllers {
                controller.set_unlock();
            }
        }

        fn command_assembly_trim(&mut self, trim_angle: Angle) {
            self.hydraulic_assembly.set_trim_offset(trim_angle);
        }

        fn body_position(&self) -> Ratio {
            self.hydraulic_assembly.position_normalized()
        }

        fn current_power_consumption(&self) -> Power {
            self.power_consumption
        }

        fn apply_up_aero_forces(&mut self, force_up: Force) {
            self.aero_forces.apply_up_force(force_up);
        }

        fn is_locked(&self) -> bool {
            self.hydraulic_assembly.is_locked()
        }

        fn update_actuator_physics(&mut self, context: &UpdateContext) {
            self.aero_forces.update_body(self.hydraulic_assembly.body());

            self.hydraulic_assembly
                .update(context, &self.controllers[..], self.pressures);

            println!(
                "Body angle {:.2} Body Npos {:.3}, Act Npos {:.3}, Act force {:.1} , Fluid used act0 {:.5} Flow gps{:.4}",
                self.hydraulic_assembly
                    .rigid_body
                    .angular_position
                    .get::<degree>(),
                self.hydraulic_assembly
                    .rigid_body
                    .position_normalized()
                    .get::<ratio>(),
                self.hydraulic_assembly.linear_actuators[0]
                    .position_normalized
                    .get::<ratio>(),
                self.hydraulic_assembly.linear_actuators[0]
                    .force()
                    .get::<newton>(),
                self.hydraulic_assembly.linear_actuators[0].used_volume().get::<gallon>(),
                self.hydraulic_assembly.linear_actuators[0].signed_flow().get::<gallon_per_second>()
            );
        }

        fn set_ac_1_power(&mut self, is_powered: bool) {
            self.is_ac_1_powered = is_powered;
        }
    }
    impl Aircraft for TestAircraft<1> {
        fn update_before_power_distribution(
            &mut self,
            _: &UpdateContext,
            electricity: &mut Electricity,
        ) {
            self.powered_source_ac
                .power_with_potential(ElectricPotential::new::<volt>(115.));
            electricity.supplied_by(&self.powered_source_ac);

            if self.is_ac_1_powered {
                electricity.flow(&self.powered_source_ac, &self.ac_1_bus);
            }
        }

        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.loop_updater.update(context);

            for cur_time_step in self.loop_updater {
                self.update_actuator_physics(&context.with_delta(cur_time_step));
            }
        }
    }
    impl SimulationElement for TestAircraft<1> {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.hydraulic_assembly.accept(visitor);

            visitor.visit(self);
        }

        fn process_power_consumption_report<T: PowerConsumptionReport>(
            &mut self,
            _: &UpdateContext,
            report: &T,
        ) {
            self.power_consumption =
                report.total_consumption_of(PotentialOrigin::EngineGenerator(1));
        }
    }

    impl Aircraft for TestAircraft<2> {
        fn update_before_power_distribution(
            &mut self,
            _: &UpdateContext,
            electricity: &mut Electricity,
        ) {
            self.powered_source_ac
                .power_with_potential(ElectricPotential::new::<volt>(115.));
            electricity.supplied_by(&self.powered_source_ac);

            if self.is_ac_1_powered {
                electricity.flow(&self.powered_source_ac, &self.ac_1_bus);
            }
        }

        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.loop_updater.update(context);

            for cur_time_step in self.loop_updater {
                self.update_actuator_physics(&context.with_delta(cur_time_step));
            }
        }
    }
    impl SimulationElement for TestAircraft<2> {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.hydraulic_assembly.accept(visitor);

            visitor.visit(self);
        }

        fn process_power_consumption_report<T: PowerConsumptionReport>(
            &mut self,
            _: &UpdateContext,
            report: &T,
        ) {
            self.power_consumption =
                report.total_consumption_of(PotentialOrigin::EngineGenerator(1));
        }
    }

    impl SimulationElement for LinearActuatedRigidBodyOnHingeAxis {}

    #[test]
    fn asymetrical_deflection_body_converts_angle_to_linear_ratio() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|_| elevator_body()));

        assert!(
            test_bed
                .command_element(|e| {
                    e.linear_length_normalized_from_absolute_angle(Angle::new::<degree>(0.))
                })
                .get::<ratio>()
                >= 0.35
        );
        assert!(
            test_bed
                .command_element(|e| {
                    e.linear_length_normalized_from_absolute_angle(Angle::new::<degree>(0.))
                })
                .get::<ratio>()
                <= 0.45
        );

        assert_about_eq!(
            test_bed
                .command_element(|e| {
                    e.linear_length_normalized_from_absolute_angle(Angle::new::<degree>(-17.))
                })
                .get::<ratio>(),
            0.
        );

        assert_about_eq!(
            test_bed
                .command_element(|e| {
                    e.linear_length_normalized_from_absolute_angle(Angle::new::<degree>(30.))
                })
                .get::<ratio>(),
            1.
        );
    }

    #[test]
    fn asymetrical_deflection_body_converts_angle_ratio_to_absolute_angle() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|_| elevator_body()));

        assert!(
            test_bed
                .command_element(|e| {
                    e.angular_ratio_to_absolute_angle(Ratio::new::<ratio>(0.36))
                })
                .get::<degree>()
                >= -1.
        );
        assert!(
            test_bed
                .command_element(|e| {
                    e.angular_ratio_to_absolute_angle(Ratio::new::<ratio>(0.36))
                })
                .get::<degree>()
                <= 1.
        );

        assert_about_eq!(
            test_bed
                .command_element(|e| { e.angular_ratio_to_absolute_angle(Ratio::new::<ratio>(0.)) })
                .get::<degree>(),
            -17.
        );

        assert_about_eq!(
            test_bed
                .command_element(|e| { e.angular_ratio_to_absolute_angle(Ratio::new::<ratio>(1.)) })
                .get::<degree>(),
            30.
        );
    }

    #[test]
    fn symetrical_deflection_body_converts_angle_to_linear_ratio() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|_| aileron_body(true)));

        assert_about_eq!(
            test_bed
                .command_element(|e| {
                    e.linear_length_normalized_from_absolute_angle(Angle::new::<degree>(0.))
                })
                .get::<ratio>(),
            0.5,
            0.001
        );

        assert_about_eq!(
            test_bed
                .command_element(|e| {
                    e.linear_length_normalized_from_absolute_angle(Angle::new::<degree>(-25.))
                })
                .get::<ratio>(),
            0.
        );

        assert_about_eq!(
            test_bed
                .command_element(|e| {
                    e.linear_length_normalized_from_absolute_angle(Angle::new::<degree>(25.))
                })
                .get::<ratio>(),
            1.
        );
    }

    #[test]
    fn left_gear_body_converts_angle_ratio_to_absolute_angle() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|_| main_gear_left_body(true)));

        assert!(
            test_bed
                .command_element(|e| {
                    e.angular_ratio_to_absolute_angle(Ratio::new::<ratio>(0.5))
                })
                .get::<degree>()
                >= 35.
        );
        assert!(
            test_bed
                .command_element(|e| {
                    e.angular_ratio_to_absolute_angle(Ratio::new::<ratio>(0.5))
                })
                .get::<degree>()
                <= 45.
        );

        assert_about_eq!(
            test_bed
                .command_element(|e| { e.angular_ratio_to_absolute_angle(Ratio::new::<ratio>(0.)) })
                .get::<degree>(),
            0.
        );

        assert_about_eq!(
            test_bed
                .command_element(|e| { e.angular_ratio_to_absolute_angle(Ratio::new::<ratio>(1.)) })
                .get::<degree>(),
            80.
        );
    }

    #[test]
    fn right_gear_body_converts_angle_ratio_to_absolute_angle() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|_| main_gear_right_body(true)));

        assert!(
            test_bed
                .command_element(|e| {
                    e.angular_ratio_to_absolute_angle(Ratio::new::<ratio>(0.5))
                })
                .get::<degree>()
                <= -35.
        );
        assert!(
            test_bed
                .command_element(|e| {
                    e.angular_ratio_to_absolute_angle(Ratio::new::<ratio>(0.5))
                })
                .get::<degree>()
                >= -45.
        );

        assert_about_eq!(
            test_bed
                .command_element(|e| { e.angular_ratio_to_absolute_angle(Ratio::new::<ratio>(0.)) })
                .get::<degree>(),
            0.
        );

        assert_about_eq!(
            test_bed
                .command_element(|e| { e.angular_ratio_to_absolute_angle(Ratio::new::<ratio>(1.)) })
                .get::<degree>(),
            -80.
        );
    }

    #[test]
    fn left_gear_body_converts_angle_to_linear_ratio() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|_| main_gear_left_body(true)));

        assert_about_eq!(
            test_bed
                .command_element(|e| {
                    e.linear_length_normalized_from_absolute_angle(Angle::new::<degree>(0.))
                })
                .get::<ratio>(),
            0.
        );

        assert_about_eq!(
            test_bed
                .command_element(|e| {
                    e.linear_length_normalized_from_absolute_angle(Angle::new::<degree>(80.))
                })
                .get::<ratio>(),
            1.
        );
    }

    #[test]
    fn right_gear_body_converts_angle_to_linear_ratio() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|_| main_gear_right_body(true)));

        assert_about_eq!(
            test_bed
                .command_element(|e| {
                    e.linear_length_normalized_from_absolute_angle(Angle::new::<degree>(0.))
                })
                .get::<ratio>(),
            0.
        );

        assert_about_eq!(
            test_bed
                .command_element(|e| {
                    e.linear_length_normalized_from_absolute_angle(Angle::new::<degree>(-80.))
                })
                .get::<ratio>(),
            1.
        );
    }

    #[test]
    fn linear_actuator_not_moving_on_locked_rigid_body() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = cargo_door_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        let actuator_position_init = test_bed.query(|a| a.body_position());

        test_bed.run_with_delta(Duration::from_secs(1));

        assert!(test_bed.query(|a| a.body_position()) == actuator_position_init);
    }

    #[test]
    fn linear_actuator_moving_on_unlocked_rigid_body() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = cargo_door_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        let actuator_position_init = test_bed.query(|a| a.body_position());

        test_bed.run_with_delta(Duration::from_secs(1));

        assert!(test_bed.query(|a| a.body_position()) == actuator_position_init);

        test_bed.command(|a| a.command_unlock());
        test_bed.run_with_delta(Duration::from_secs(5));

        assert!(test_bed.query(|a| a.body_position()) > actuator_position_init);
    }

    #[test]
    fn linear_actuator_can_move_rigid_body_up() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = cargo_door_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        let actuator_position_init = test_bed.query(|a| a.body_position());

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.1), 0));

        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(3000.)]));

        test_bed.run_with_delta(Duration::from_secs(1));

        assert!(test_bed.query(|a| a.body_position()) > actuator_position_init);

        test_bed.run_with_delta(Duration::from_secs(25));

        assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.9));
    }

    #[test]
    fn linear_actuator_resists_body_drop_when_valves_closed() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = cargo_door_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.), 0));

        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(3000.)]));

        test_bed.run_with_delta(Duration::from_secs(25));

        assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.9));

        test_bed.command(|a| a.command_closed_valve_mode(0));

        test_bed.run_with_delta(Duration::from_secs(25));

        assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.7));
    }

    #[test]
    fn linear_actuator_dampens_body_drop_when_active_damping_mode() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = cargo_door_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.), 0));

        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(3000.)]));

        test_bed.run_with_delta(Duration::from_secs(25));

        assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.9));

        test_bed.command(|a| a.command_active_damping_mode(0));

        test_bed.run_with_delta(Duration::from_secs(1));

        assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.9));
        assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.5));
    }

    #[test]
    fn linear_actuator_dampens_super_slow_body_drop_when_slow_damping_mode() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = cargo_door_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.), 0));

        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(3000.)]));

        test_bed.run_with_delta(Duration::from_secs(25));

        assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.9));

        test_bed.command(|a| a.command_closed_circuit_damping_mode(0));

        test_bed.run_with_delta(Duration::from_secs(10));

        assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.9));
        assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.5));
    }

    #[test]
    fn linear_actuator_without_hyd_pressure_cant_move_body_up() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = cargo_door_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.), 0));

        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(0.)]));

        test_bed.run_with_delta(Duration::from_secs(25));

        assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.3));
    }

    #[test]
    fn linear_actuator_losing_hyd_pressure_half_way_cant_move_body_up() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = cargo_door_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.), 0));

        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(3000.)]));

        test_bed.run_with_delta(Duration::from_secs(10));

        let actuator_position_at_10s = test_bed.query(|a| a.body_position());

        println!("PRESSURE LOST!");
        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(0.)]));
        test_bed.run_with_delta(Duration::from_secs(25));

        assert!(
            test_bed.query(|a| a.body_position())
                <= actuator_position_at_10s + Ratio::new::<ratio>(0.05)
        );
    }

    #[test]
    fn body_gravity_movement_if_unlocked() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = cargo_door_assembly(context, false);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.command_active_damping_mode(0));

        test_bed.write_by_name(UpdateContext::PLANE_BANK_KEY, -45.);

        test_bed.run_with_delta(Duration::from_secs(25));

        // At 45 degrees bank angle we expect door around mid position
        assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.4));
        assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.6));
    }

    #[test]
    fn start_moving_once_unlocked() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = cargo_door_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        test_bed.write_by_name(UpdateContext::PLANE_BANK_KEY, -45.);

        let actuator_position_at_init = test_bed.query(|a| a.body_position());
        test_bed.run_with_delta(Duration::from_secs(5));

        assert!(test_bed.query(|a| a.body_position()) == actuator_position_at_init);

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.command_active_damping_mode(0));

        test_bed.run_with_delta(Duration::from_secs(5));

        assert!(test_bed.query(|a| a.body_position()) > actuator_position_at_init);
    }

    #[test]
    fn locks_at_required_position() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = cargo_door_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        test_bed.write_by_name(UpdateContext::PLANE_BANK_KEY, -45.);

        let actuator_position_at_init = test_bed.query(|a| a.body_position());
        test_bed.run_with_delta(Duration::from_secs(5));

        assert!(test_bed.query(|a| a.body_position()) == actuator_position_at_init);

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.command_active_damping_mode(0));

        test_bed.run_with_delta(Duration::from_secs_f64(0.1));

        assert!(test_bed.query(|a| a.body_position()) > actuator_position_at_init);

        test_bed.command(|a| a.command_lock(Ratio::new::<ratio>(0.3)));

        test_bed.run_with_delta(Duration::from_secs(20));

        assert!(test_bed.query(|a| a.is_locked()));
        assert!(test_bed.query(|a| a.body_position()) == Ratio::new::<ratio>(0.3));
    }

    #[test]
    fn soft_lock_with_zero_velocity_stops_the_body() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = cargo_door_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        test_bed.write_by_name(UpdateContext::PLANE_BANK_KEY, -45.);

        let actuator_position_at_init = test_bed.query(|a| a.body_position());
        test_bed.run_with_delta(Duration::from_secs(1));

        assert!(test_bed.query(|a| a.body_position()) == actuator_position_at_init);

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.command_active_damping_mode(0));

        test_bed.run_with_delta(Duration::from_secs_f64(0.5));

        assert!(test_bed.query(|a| a.body_position()) > actuator_position_at_init);

        let actuator_position_before_soft_lock = test_bed.query(|a| a.body_position());

        test_bed.command(|a| {
            a.command_soft_lock((
                AngularVelocity::new::<radian_per_second>(0.),
                AngularVelocity::new::<radian_per_second>(0.),
            ))
        });

        test_bed.run_with_delta(Duration::from_secs(1));

        assert!(!test_bed.query(|a| a.is_locked()));
        assert!(
            test_bed.query(|a| (a.body_position() - actuator_position_before_soft_lock).abs())
                <= Ratio::new::<ratio>(0.01)
        );
    }

    #[test]
    fn linear_actuator_can_control_position() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = cargo_door_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(0.7), 0));

        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(3000.)]));

        test_bed.run_with_delta(Duration::from_secs(20));

        assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.68));
        assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.72));

        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(0.2), 0));
        test_bed.run_with_delta(Duration::from_secs(20));

        assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.18));
        assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.22));
    }

    #[test]
    fn right_main_gear_door_drops_when_unlocked() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = main_gear_door_right_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_closed_circuit_damping_mode(0));
        test_bed.command(|a| a.command_unlock());
        test_bed.run_with_delta(Duration::from_secs(7));

        assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.98));
    }

    #[test]
    fn right_main_gear_door_drops_freefall_when_unlocked_with_broken_actuator() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = main_gear_door_right_broken_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_closed_circuit_damping_mode(0));
        test_bed.command(|a| a.command_unlock());
        test_bed.run_with_delta(Duration::from_secs_f64(1.));

        assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.9));
    }

    #[test]
    fn right_main_gear_door_cant_open_fully_if_banking_right() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = main_gear_door_right_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        test_bed.run_with_delta(Duration::from_secs(1));

        test_bed.write_by_name(UpdateContext::PLANE_BANK_KEY, -45.);
        test_bed.command(|a| a.command_closed_circuit_damping_mode(0));
        test_bed.command(|a| a.command_unlock());
        test_bed.run_with_delta(Duration::from_secs(20));

        assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.8));
    }

    #[test]
    fn right_main_gear_door_closes_after_opening_with_pressure() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = main_gear_door_right_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(3000.)]));
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.5), 0));
        test_bed.command(|a| a.command_unlock());
        test_bed.run_with_delta(Duration::from_secs_f64(3.5));

        assert!(test_bed.query(|a| a.body_position()) >= Ratio::new::<ratio>(0.98));

        test_bed.command(|a| a.command_closed_valve_mode(0));
        test_bed.run_with_delta(Duration::from_secs_f64(0.1));

        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(-0.5), 0));
        test_bed.command(|a| a.command_lock(Ratio::new::<ratio>(0.)));

        test_bed.run_with_delta(Duration::from_secs_f64(4.));
        assert!(test_bed.query(|a| a.body_position()) <= Ratio::new::<ratio>(0.001));
    }

    #[test]
    fn nose_gear_door_closes_after_opening_with_pressure() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = nose_gear_door_assembly(context);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(3000.)]));
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.5), 0));
        test_bed.command(|a| a.command_unlock());
        test_bed.run_with_delta(Duration::from_secs_f64(2.5));

        assert!(test_bed.query(|a| a.body_position()) >= Ratio::new::<ratio>(0.98));

        test_bed.command(|a| a.command_closed_valve_mode(0));
        test_bed.run_with_delta(Duration::from_secs_f64(0.1));

        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(-0.5), 0));
        test_bed.command(|a| a.command_lock(Ratio::new::<ratio>(0.)));

        test_bed.run_with_delta(Duration::from_secs_f64(3.));
        assert!(test_bed.query(|a| a.body_position()) <= Ratio::new::<ratio>(0.001));
    }

    #[test]
    fn left_main_gear_door_drops_when_unlocked() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = main_gear_door_left_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_closed_circuit_damping_mode(0));
        test_bed.command(|a| a.command_unlock());
        test_bed.run_with_delta(Duration::from_secs(7));

        assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.98));
    }

    #[test]
    fn left_main_gear_door_can_open_fully_if_banking_right() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = main_gear_door_left_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        test_bed.write_by_name(UpdateContext::PLANE_BANK_KEY, -45.);
        test_bed.command(|a| a.command_closed_circuit_damping_mode(0));
        test_bed.command(|a| a.command_unlock());
        test_bed.run_with_delta(Duration::from_secs(20));

        assert!(test_bed.query(|a| a.body_position()) >= Ratio::new::<ratio>(0.98));
    }

    #[test]
    fn left_main_gear_door_opens_with_pressure() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = main_gear_door_left_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(3000.)]));
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.5), 0));
        test_bed.command(|a| a.command_unlock());
        test_bed.run_with_delta(Duration::from_secs(4));

        assert!(test_bed.query(|a| a.body_position()) >= Ratio::new::<ratio>(0.98));
    }

    #[test]
    fn right_main_gear_retracts_with_pressure() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = main_gear_right_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(3000.)]));
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.5), 0));
        test_bed.command(|a| a.command_unlock());
        test_bed.run_with_delta(Duration::from_secs(10));

        assert!(test_bed.query(|a| a.body_position()) >= Ratio::new::<ratio>(0.98));
    }

    #[test]
    fn right_main_gear_locked_down_at_init() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = main_gear_right_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        assert!(test_bed.query(|a| a.is_locked()));
        assert!(test_bed.query(|a| a.body_position()) <= Ratio::new::<ratio>(0.01));

        test_bed.run_with_delta(Duration::from_secs(1));

        assert!(test_bed.query(|a| a.is_locked()));
        assert!(test_bed.query(|a| a.body_position()) <= Ratio::new::<ratio>(0.01));
    }

    #[test]
    fn right_main_gear_locks_up_when_retracted() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = main_gear_right_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(3000.)]));
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.5), 0));
        test_bed.command(|a| a.command_unlock());
        test_bed.run_with_delta(Duration::from_secs(1));

        test_bed.command(|a| a.command_lock(Ratio::new::<ratio>(1.)));
        test_bed.run_with_delta(Duration::from_secs(10));

        assert!(test_bed.query(|a| a.body_position()) >= Ratio::new::<ratio>(0.999));
        assert!(test_bed.query(|a| a.is_locked()));
    }

    #[test]
    fn right_main_gear_locks_down_when_extended_by_gravity() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = main_gear_right_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        // FIRST GEAR UP
        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(3000.)]));
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.5), 0));
        test_bed.command(|a| a.command_unlock());
        test_bed.run_with_delta(Duration::from_secs(1));

        test_bed.command(|a| a.command_lock(Ratio::new::<ratio>(1.)));
        test_bed.run_with_delta(Duration::from_secs(10));
        assert!(test_bed.query(|a| a.body_position()) >= Ratio::new::<ratio>(0.999));
        assert!(test_bed.query(|a| a.is_locked()));

        //Gravity extension
        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(0.)]));
        test_bed.command(|a| a.command_closed_circuit_damping_mode(0));
        test_bed.command(|a| a.command_unlock());
        test_bed.run_with_delta(Duration::from_secs(1));

        test_bed.command(|a| a.command_lock(Ratio::new::<ratio>(0.01)));
        test_bed.run_with_delta(Duration::from_secs(13));

        assert!(test_bed.query(|a| a.body_position()) <= Ratio::new::<ratio>(0.011));
        assert!(test_bed.query(|a| a.is_locked()));
    }

    #[test]
    fn left_main_gear_retracts_with_pressure() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = main_gear_left_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(3000.)]));
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.5), 0));
        test_bed.command(|a| a.command_unlock());
        test_bed.run_with_delta(Duration::from_secs(10));

        assert!(test_bed.query(|a| a.body_position()) >= Ratio::new::<ratio>(0.98));
    }

    #[test]
    fn left_main_gear_retracts_with_limited_pressure() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = main_gear_left_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(1500.)]));
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.5), 0));
        test_bed.command(|a| a.command_unlock());
        test_bed.run_with_delta(Duration::from_secs(35));

        assert!(test_bed.query(|a| a.body_position()) >= Ratio::new::<ratio>(0.98));
    }

    #[test]
    fn left_main_gear_locked_down_at_init() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = main_gear_left_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        assert!(test_bed.query(|a| a.is_locked()));
        assert!(test_bed.query(|a| a.body_position()) <= Ratio::new::<ratio>(0.01));

        test_bed.run_with_delta(Duration::from_secs(1));

        assert!(test_bed.query(|a| a.is_locked()));
        assert!(test_bed.query(|a| a.body_position()) <= Ratio::new::<ratio>(0.01));
    }

    #[test]
    fn left_main_gear_locks_up_when_retracted() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = main_gear_left_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(3000.)]));
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.5), 0));
        test_bed.command(|a| a.command_unlock());
        test_bed.run_with_delta(Duration::from_secs(1));

        test_bed.command(|a| a.command_lock(Ratio::new::<ratio>(1.)));
        test_bed.run_with_delta(Duration::from_secs(10));

        assert!(test_bed.query(|a| a.body_position()) >= Ratio::new::<ratio>(0.999));
        assert!(test_bed.query(|a| a.is_locked()));
    }

    #[test]
    fn left_main_gear_locks_down_when_extended_by_gravity() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = main_gear_left_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        // FIRST GEAR UP
        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(3000.)]));
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.5), 0));
        test_bed.command(|a| a.command_unlock());
        test_bed.run_with_delta(Duration::from_secs(1));

        test_bed.command(|a| a.command_lock(Ratio::new::<ratio>(1.)));
        test_bed.run_with_delta(Duration::from_secs(10));
        assert!(test_bed.query(|a| a.body_position()) >= Ratio::new::<ratio>(0.999));
        assert!(test_bed.query(|a| a.is_locked()));

        //Gravity extension
        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(0.)]));
        test_bed.command(|a| a.command_closed_circuit_damping_mode(0));
        test_bed.command(|a| a.command_unlock());
        test_bed.run_with_delta(Duration::from_secs(1));

        test_bed.command(|a| a.command_lock(Ratio::new::<ratio>(0.01)));
        test_bed.run_with_delta(Duration::from_secs(13));

        assert!(test_bed.query(|a| a.body_position()) <= Ratio::new::<ratio>(0.011));
        assert!(test_bed.query(|a| a.is_locked()));
    }

    #[test]
    fn nose_gear_locks_up_when_retracted() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = nose_gear_assembly(context);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(3000.)]));
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(-0.1), 0));
        test_bed.command(|a| a.command_unlock());
        test_bed.run_with_delta(Duration::from_secs(1));

        test_bed.command(|a| a.command_lock(Ratio::new::<ratio>(0.)));
        test_bed.run_with_delta(Duration::from_secs(10));

        assert!(test_bed.query(|a| a.body_position()) <= Ratio::new::<ratio>(0.01));
        assert!(test_bed.query(|a| a.is_locked()));
    }

    #[test]
    fn aileron_initialized_down_stays_down_with_broken_actuator() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = aileron_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.command_closed_circuit_damping_mode(0));
        test_bed.command(|a| a.command_closed_circuit_damping_mode(1));
        test_bed.run_with_delta(Duration::from_secs_f64(1.));

        assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.1));
    }

    #[test]
    fn aileron_initialized_down_moves_up_when_commanded() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = aileron_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| {
            a.set_pressures([Pressure::new::<psi>(3000.), Pressure::new::<psi>(3000.)])
        });
        test_bed.command(|a| a.command_active_damping_mode(0));
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.), 1));
        test_bed.run_with_delta(Duration::from_secs_f64(2.));

        assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.95));
    }

    #[test]
    fn aileron_drops_from_middle_pos_in_more_20s_in_closed_circuit_damping() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = aileron_assembly(context, false);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.command_closed_circuit_damping_mode(0));
        test_bed.command(|a| a.command_closed_circuit_damping_mode(1));
        test_bed.run_with_delta(Duration::from_secs_f64(20.));

        assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.1));

        test_bed.run_with_delta(Duration::from_secs_f64(20.));
        assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.1));
    }

    #[test]
    fn aileron_drops_from_middle_pos_and_damping_is_stable() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = aileron_assembly(context, false);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.command_closed_circuit_damping_mode(0));
        test_bed.command(|a| a.command_closed_circuit_damping_mode(1));
        test_bed.run_with_delta(Duration::from_secs_f64(30.));

        assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.1));

        for _ in 0..20 {
            test_bed.run_with_delta(Duration::from_secs_f64(1.));
            assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.01));
        }
    }

    #[test]
    fn aileron_position_control_is_stable() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = aileron_assembly(context, false);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| {
            a.set_pressures([Pressure::new::<psi>(3000.), Pressure::new::<psi>(3000.)])
        });
        test_bed.command(|a| a.command_active_damping_mode(0));
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(0.8), 1));

        // Step demand in 0.3s to position 0.8
        test_bed.run_with_delta(Duration::from_secs_f64(0.3));

        //Now check position is stable for 20s
        for _ in 0..20 {
            test_bed.run_with_delta(Duration::from_secs_f64(1.));
            assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.75));
            assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.85));
        }

        // Step demand in 0.3s to position 0.2
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(0.2), 1));
        test_bed.run_with_delta(Duration::from_secs_f64(0.3));

        //Now check position is stable for 20s
        for _ in 0..20 {
            test_bed.run_with_delta(Duration::from_secs_f64(1.));
            assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.15));
            assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.25));
        }
    }

    #[test]
    fn aileron_position_control_from_down_to_up_less_0_5s() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = aileron_assembly(context, false);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| {
            a.set_pressures([Pressure::new::<psi>(3000.), Pressure::new::<psi>(3000.)])
        });

        // Let aileron fall fully down first
        test_bed.command(|a| a.command_active_damping_mode(0));
        test_bed.command(|a| a.command_active_damping_mode(1));
        test_bed.run_with_delta(Duration::from_secs_f64(2.));
        assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.01));

        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.), 1));
        test_bed.run_with_delta(Duration::from_secs_f64(0.5));

        assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.95));
    }

    #[test]
    fn aileron_initialized_down_goes_neutral_when_trimmed_90_degrees_down() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = aileron_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.command_active_damping_mode(0));
        test_bed.command(|a| a.command_active_damping_mode(1));
        test_bed.run_with_delta(Duration::from_secs_f64(1.));

        assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.1));

        test_bed.command(|a| a.command_assembly_trim(Angle::new::<degree>(-90.)));
        test_bed.run_with_delta(Duration::from_secs_f64(2.));

        assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.6));
        assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.4));
    }

    #[test]
    fn aileron_position_control_resists_step_change_in_aero_force() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = aileron_assembly(context, false);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| {
            a.set_pressures([Pressure::new::<psi>(3000.), Pressure::new::<psi>(3000.)])
        });

        // Let aileron control at 0.5 position
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(0.5), 0));
        test_bed.command(|a| a.command_active_damping_mode(1));
        test_bed.run_with_delta(Duration::from_secs_f64(2.));
        assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.51));
        assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.49));

        test_bed.command(|a| a.apply_up_aero_forces(Force::new::<newton>(5000.)));

        println!("APPLYING UP FORCE");
        test_bed.run_with_delta(Duration::from_secs_f64(1.));

        assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.51));
        assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.49));
    }

    #[test]
    fn aileron_position_control_fails_when_aero_force_over_max_force() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = aileron_assembly(context, false);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| {
            a.set_pressures([Pressure::new::<psi>(3000.), Pressure::new::<psi>(3000.)])
        });

        // Let aileron control at 0.5 position
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(0.5), 0));
        test_bed.command(|a| a.command_active_damping_mode(1));

        let mut test_force = Force::new::<newton>(2000.);

        for _ in 0..25 {
            println!("APPLYING UP FORCE {:.0}", test_force.get::<newton>());
            test_bed.command(|a| a.apply_up_aero_forces(test_force));
            test_bed.run_with_delta(Duration::from_secs_f64(0.5));

            test_force += Force::new::<newton>(400.);

            if test_force < Force::new::<newton>(10000.) {
                assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.51));
                assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.49));
            }
        }
        assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.6));
        // test_bed.run_with_delta(Duration::from_secs_f64(1.));
    }

    #[test]
    fn aileron_position_control_fails_when_lower_pressure_and_back_in_position_with_pressure_back()
    {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = aileron_assembly(context, false);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| {
            a.set_pressures([Pressure::new::<psi>(3000.), Pressure::new::<psi>(3000.)])
        });

        // Let aileron control at 0.5 position
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(0.5), 0));
        test_bed.command(|a| a.command_active_damping_mode(1));

        let mut test_pressure = Pressure::new::<psi>(3000.);

        for _ in 0..10 {
            println!("Reducing pressure {:.0}", test_pressure.get::<psi>());
            test_bed.command(|a| a.set_pressures([test_pressure, test_pressure]));
            test_bed.command(|a| a.apply_up_aero_forces(Force::new::<newton>(7000.)));
            test_bed.run_with_delta(Duration::from_secs_f64(0.3));

            test_pressure -= Pressure::new::<psi>(300.);

            test_pressure = test_pressure.max(Pressure::new::<psi>(0.));

            if test_pressure > Pressure::new::<psi>(2500.) {
                assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.51));
                assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.49));
            }
        }
        assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.6));

        println!("Pressure back to 3000");
        test_bed.command(|a| {
            a.set_pressures([Pressure::new::<psi>(3000.), Pressure::new::<psi>(3000.)])
        });
        test_bed.run_with_delta(Duration::from_secs_f64(1.));

        assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.51));
        assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.49));
    }

    #[test]
    fn aileron_position_control_from_down_to_up_less_0_5s_with_limited_pressure() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = aileron_assembly(context, false);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| {
            a.set_pressures([Pressure::new::<psi>(1700.), Pressure::new::<psi>(1700.)])
        });

        // Let aileron fall fully down first
        test_bed.command(|a| a.command_active_damping_mode(0));
        test_bed.command(|a| a.command_active_damping_mode(1));
        test_bed.run_with_delta(Duration::from_secs_f64(2.));
        assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.01));

        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.), 0));
        test_bed.run_with_delta(Duration::from_secs_f64(0.5));

        assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.95));
    }

    #[test]
    fn elevator_position_control_is_stable_with_all_actuators_in_control() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = elevator_assembly(context);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| {
            a.set_pressures([Pressure::new::<psi>(3000.), Pressure::new::<psi>(3000.)])
        });

        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(0.8), 0));
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(0.8), 1));

        // Step demand in 0.3s to position 0.8
        test_bed.run_with_delta(Duration::from_secs_f64(0.5));

        //Now check position is stable for 20s
        for _ in 0..20 {
            test_bed.run_with_delta(Duration::from_secs_f64(1.));
            assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.75));
            assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.85));
        }

        // Step demand in 0.3s to position 0.2
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(0.2), 0));
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(0.2), 1));
        test_bed.run_with_delta(Duration::from_secs_f64(0.5));

        // Now check position is stable for 20s
        for _ in 0..20 {
            test_bed.run_with_delta(Duration::from_secs_f64(1.));
            assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.15));
            assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.25));
        }
    }

    #[test]
    fn elevator_droop_control_is_stable_engaged_at_full_speed() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = elevator_assembly(context);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| {
            a.set_pressures([Pressure::new::<psi>(3000.), Pressure::new::<psi>(3000.)])
        });

        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.), 0));
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.), 1));

        // Run until 0.8 position is reached
        for _ in 0..20 {
            test_bed.run_with_delta(Duration::from_secs_f64(0.1));
            if test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.8) {
                break;
            }
        }

        assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.8));

        test_bed.command(|a| a.command_closed_circuit_damping_mode(0));
        test_bed.command(|a| a.command_closed_circuit_damping_mode(1));

        // Capture position at damping engagement
        let damping_start_position = test_bed.query(|a| a.body_position());

        // Wait for oscillations to settle
        test_bed.run_with_delta(Duration::from_secs_f64(0.5));

        // Now check position slowly decrease
        for _ in 0..10 {
            test_bed.run_with_delta(Duration::from_secs_f64(1.));
            assert!(test_bed.query(|a| a.body_position()) < damping_start_position);
        }
    }

    #[test]
    fn spoiler_position_control_from_down_to_up_less_0_8s() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = spoiler_assembly(context, false);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(3000.)]));

        assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.01));

        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.), 0));
        test_bed.run_with_delta(Duration::from_secs_f64(0.8));

        assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.95));
    }

    #[test]
    fn spoiler_position_can_go_down_but_not_up_when_soft_locked_up() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = spoiler_assembly(context, false);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.command_active_damping_mode(0));

        test_bed.command(|a| a.apply_up_aero_forces(Force::new::<newton>(300.)));
        test_bed.run_with_delta(Duration::from_secs_f64(1.));

        let position_before_lock = test_bed.query(|a| a.body_position());

        println!("Soft lock up direction");
        test_bed.command(|a| {
            a.command_soft_lock((
                AngularVelocity::new::<radian_per_second>(-10000.),
                AngularVelocity::new::<radian_per_second>(0.),
            ))
        });

        test_bed.run_with_delta(Duration::from_secs_f64(2.));
        assert!(
            test_bed.query(|a| (a.body_position() - position_before_lock).abs())
                < Ratio::new::<ratio>(0.01)
        );

        println!("Aero force down");
        test_bed.command(|a| a.apply_up_aero_forces(Force::new::<newton>(-300.)));
        test_bed.run_with_delta(Duration::from_secs_f64(1.));

        assert!(
            test_bed.query(|a| a.body_position() - position_before_lock) < Ratio::new::<ratio>(0.2)
        );
    }

    #[test]
    fn spoiler_position_cant_go_up_when_not_pressurised() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = spoiler_assembly(context, false);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.), 0));
        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(0.)]));

        test_bed.command(|a| a.apply_up_aero_forces(Force::new::<newton>(5000.)));
        test_bed.run_with_delta(Duration::from_secs_f64(2.));

        assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.2));
    }

    #[test]
    fn elevator_electro_hydrostatic_cannot_move_with_elec_and_no_pressure_but_backup_not_active() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = elevator_electro_hydrostatic_assembly(context);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(0.), Pressure::new::<psi>(0.)]));
        test_bed.command(|a| a.set_ac_1_power(true));

        test_bed.command(|a| a.command_active_damping_mode(0));
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(0.8), 1));

        test_bed.run_with_delta(Duration::from_secs_f64(1.));

        assert!(
            test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.75)
                || test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.85)
        );
    }

    #[test]
    fn elevator_electro_hydrostatic_can_move_with_elec_and_no_pressure() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = elevator_electro_hydrostatic_assembly(context);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(0.), Pressure::new::<psi>(0.)]));

        test_bed.command(|a| a.set_ac_1_power(true));

        test_bed.command(|a| a.command_active_damping_mode(0));
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(0.8), 1));
        test_bed.command(|a| a.command_electro_backup(true, 1));

        test_bed.run_with_delta(Duration::from_secs_f64(1.));

        assert!(
            test_bed.query(|a| a.body_position()) >= Ratio::new::<ratio>(0.75)
                && test_bed.query(|a| a.body_position()) <= Ratio::new::<ratio>(0.85)
        );
    }

    #[test]
    fn elevator_electro_hydrostatic_losing_elec_cannot_move_anymore() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = elevator_electro_hydrostatic_assembly(context);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(0.), Pressure::new::<psi>(0.)]));

        test_bed.command(|a| a.set_ac_1_power(true));

        test_bed.command(|a| a.command_active_damping_mode(0));
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(0.8), 1));
        test_bed.command(|a| a.command_electro_backup(true, 1));

        test_bed.run_with_delta(Duration::from_secs_f64(1.));

        assert!(
            test_bed.query(|a| a.body_position()) >= Ratio::new::<ratio>(0.75)
                && test_bed.query(|a| a.body_position()) <= Ratio::new::<ratio>(0.85)
        );

        test_bed.command(|a| a.set_ac_1_power(false));

        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(0.2), 1));

        test_bed.run_with_delta(Duration::from_secs_f64(5.));

        assert!(test_bed.query(|a| a.body_position()) >= Ratio::new::<ratio>(0.4));
    }

    #[test]
    fn spoiler_electro_hydrostatic_can_move_with_pressure() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = spoiler_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(3000.)]));

        assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.01));

        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.), 0));
        test_bed.run_with_delta(Duration::from_secs_f64(0.8));

        assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.95));
    }

    #[test]
    fn spoiler_electro_hydrostatic_cannot_move_without_pressure_without_backup_active() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = spoiler_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(0.)]));

        assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.01));

        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.), 0));
        test_bed.run_with_delta(Duration::from_secs_f64(0.8));

        assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.01));
    }

    #[test]
    fn spoiler_electro_hydrostatic_cannot_move_without_pressure_without_elec_with_backup_active() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = spoiler_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(0.)]));

        assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.01));

        test_bed.command(|a| a.command_electro_backup(true, 0));
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.), 0));
        test_bed.run_with_delta(Duration::from_secs_f64(0.8));

        assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.01));
    }

    #[test]
    fn spoiler_electro_hydrostatic_can_move_without_pressure_with_elec_with_backup_active() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = spoiler_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(0.)]));

        assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.01));

        test_bed.command(|a| a.set_ac_1_power(true));
        test_bed.command(|a| a.command_electro_backup(true, 0));
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.), 0));
        test_bed.run_with_delta(Duration::from_secs_f64(0.8));

        assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.8));
    }

    #[test]
    fn electro_hydrostatic_actuator_consumes_power_when_moving() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = spoiler_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(0.)]));

        assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.01));

        test_bed.command(|a| a.set_ac_1_power(true));
        test_bed.command(|a| a.command_electro_backup(true, 0));
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.), 0));
        test_bed.run_with_delta(Duration::from_secs_f64(0.2));

        assert!(
            test_bed
                .query(|a| a.current_power_consumption())
                .get::<watt>()
                > 150.
        );
    }

    #[test]
    fn electro_hydrostatic_actuator_do_not_use_hydraulic_flow_when_moving() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = spoiler_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(0.)]));

        assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.01));

        test_bed.command(|a| a.set_ac_1_power(true));
        test_bed.command(|a| a.command_electro_backup(true, 0));
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.), 0));
        test_bed.run_with_delta(Duration::from_secs_f64(0.2));

        assert!(
            test_bed
                .query(|a| a.actuator_used_volume(0))
                .get::<gallon>()
                < 0.00001
        );
    }

    #[test]
    fn electro_hydrostatic_actuator_do_not_consume_power_when_inactive() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = spoiler_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(0.)]));

        assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.01));

        test_bed.command(|a| a.set_ac_1_power(true));
        test_bed.command(|a| a.command_electro_backup(false, 0));
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.), 0));
        test_bed.run_with_delta(Duration::from_secs_f64(0.2));

        assert!(
            test_bed
                .query(|a| a.current_power_consumption())
                .get::<watt>()
                < 100.
        );
    }

    #[test]
    fn spoiler_electro_hydrostatic_cannot_move_once_accumulator_empty() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = spoiler_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(0.)]));

        assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.01));

        test_bed.command(|a| a.set_ac_1_power(true));
        test_bed.command(|a| a.command_electro_backup(true, 0));
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.), 0));
        test_bed.run_with_delta(Duration::from_secs_f64(0.8));

        assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.8));

        test_bed.command(|a| a.command_empty_eha_accumulator(0));
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(0.3), 0));
        test_bed.run_with_delta(Duration::from_secs_f64(0.8));

        assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.8));
    }

    #[test]
    fn electro_hydrostatic_accumulator_pressure_increase_when_refilled() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = spoiler_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        let accumulator_press_init = test_bed.query(|a| a.accumulator_pressure(0));

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(3000.)]));
        test_bed.command(|a| a.command_electro_backup_refill(true, 0));
        test_bed.run_with_delta(Duration::from_secs_f64(1.));

        assert!(test_bed.query(|a| a.accumulator_pressure(0)) > accumulator_press_init);
        assert!(test_bed.query(|a| a.actuator_used_volume(0).get::<gallon>()) >= 0.0001);
    }

    #[test]
    fn electro_hydrostatic_accumulator_pressure_wont_increase_when_refilled_if_low_pressure_input()
    {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = spoiler_assembly(context, true);
            TestAircraft::new(context, tested_object)
        });

        let accumulator_press_init = test_bed.query(|a| a.accumulator_pressure(0));

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(15.)]));
        test_bed.command(|a| a.command_electro_backup_refill(true, 0));
        test_bed.run_with_delta(Duration::from_secs_f64(1.));

        assert!(test_bed.query(|a| a.accumulator_pressure(0)) == accumulator_press_init);
        assert!(test_bed.query(|a| a.actuator_used_volume(0).get::<gallon>()) <= 0.0001);
    }

    #[test]
    fn linear_actuator_can_move_heavy_door_up() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let tested_object = cargo_door_assembly_heavy(context, true);
            TestAircraft::new(context, tested_object)
        });

        let actuator_position_init = test_bed.query(|a| a.body_position());

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.1), 0));

        test_bed.command(|a| a.set_pressures([Pressure::new::<psi>(5000.)]));

        test_bed.run_with_delta(Duration::from_secs(1));

        assert!(test_bed.query(|a| a.body_position()) > actuator_position_init);

        test_bed.run_with_delta(Duration::from_secs(33));

        assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.9));
    }

    fn cargo_door_actuator(
        context: &mut InitContext,
        bounded_linear_length: &impl BoundedLinearLength,
    ) -> LinearActuator {
        const DEFAULT_I_GAIN: f64 = 5.;
        const DEFAULT_P_GAIN: f64 = 0.05;
        const DEFAULT_FORCE_GAIN: f64 = 200000.;

        LinearActuator::new(
            context,
            bounded_linear_length,
            2,
            Length::new::<meter>(0.04422),
            Length::new::<meter>(0.03366),
            VolumeRate::new::<gallon_per_second>(0.01),
            800000.,
            15000.,
            50000.,
            1200000.,
            Duration::from_millis(100),
            [1., 1., 1., 1., 1., 1.],
            [1., 1., 1., 1., 1., 1.],
            [0., 0.2, 0.21, 0.79, 0.8, 1.],
            DEFAULT_P_GAIN,
            DEFAULT_I_GAIN,
            DEFAULT_FORCE_GAIN,
            false,
            false,
            None,
            None,
            Pressure::new::<psi>(3000.),
        )
    }

    fn cargo_door_actuator_heavy(
        context: &mut InitContext,
        bounded_linear_length: &impl BoundedLinearLength,
    ) -> LinearActuator {
        const DEFAULT_I_GAIN: f64 = 4.;
        const DEFAULT_P_GAIN: f64 = 0.05;
        const DEFAULT_FORCE_GAIN: f64 = 200000.;

        LinearActuator::new(
            context,
            bounded_linear_length,
            1,
            Length::new::<meter>(0.06651697090182), // Real actuator 34.75cm^2
            Length::new::<meter>(0.0509),
            VolumeRate::new::<gallon_per_second>(0.02),
            800000.,
            15000.,
            50000.,
            1200000.,
            Duration::from_millis(100),
            [1., 1., 1., 1., 1., 1.],
            [1., 1., 1., 1., 1., 1.],
            [0., 0.2, 0.21, 0.79, 0.8, 1.],
            DEFAULT_P_GAIN,
            DEFAULT_I_GAIN,
            DEFAULT_FORCE_GAIN,
            false,
            false,
            None,
            None,
            Pressure::new::<psi>(5250.),
        )
    }

    fn cargo_door_assembly(
        context: &mut InitContext,
        is_locked: bool,
    ) -> HydraulicLinearActuatorAssembly<1> {
        let rigid_body = cargo_door_body(is_locked);
        let actuator = cargo_door_actuator(context, &rigid_body);

        HydraulicLinearActuatorAssembly::new([actuator], rigid_body)
    }

    fn cargo_door_assembly_heavy(
        context: &mut InitContext,
        is_locked: bool,
    ) -> HydraulicLinearActuatorAssembly<1> {
        let rigid_body = cargo_door_body_heavy(is_locked);
        let actuator = cargo_door_actuator_heavy(context, &rigid_body);

        HydraulicLinearActuatorAssembly::new([actuator], rigid_body)
    }

    fn cargo_door_body(is_locked: bool) -> LinearActuatedRigidBodyOnHingeAxis {
        let size = Vector3::new(100. / 1000., 1855. / 1000., 2025. / 1000.);
        let cg_offset = Vector3::new(0., -size[1] / 2., 0.);

        let control_arm = Vector3::new(-0.1597, -0.1614, 0.);
        let anchor = Vector3::new(-0.759, -0.086, 0.);

        LinearActuatedRigidBodyOnHingeAxis::new(
            Mass::new::<kilogram>(130.),
            size,
            cg_offset,
            cg_offset,
            control_arm,
            anchor,
            Angle::new::<degree>(-23.),
            Angle::new::<degree>(136.),
            Angle::new::<degree>(-23.),
            100.,
            is_locked,
            Vector3::new(0., 0., 1.),
        )
    }

    fn cargo_door_body_heavy(is_locked: bool) -> LinearActuatedRigidBodyOnHingeAxis {
        let size = Vector3::new(100. / 1000., 1855. / 1000., 2025. / 1000.);
        let cg_offset = Vector3::new(0., -size[1] / 2., 0.);

        let control_arm = Vector3::new(0., -0.45, 0.);
        let anchor = Vector3::new(-0.7596, -0.4, 0.);
        let axis_direction = Vector3::new(0., 0., 1.);

        LinearActuatedRigidBodyOnHingeAxis::new(
            Mass::new::<kilogram>(250.),
            size,
            cg_offset,
            cg_offset,
            control_arm,
            anchor,
            Angle::new::<degree>(-23.),
            Angle::new::<degree>(136.),
            Angle::new::<degree>(-23.),
            100.,
            is_locked,
            axis_direction,
        )
    }

    fn main_gear_door_right_assembly(
        context: &mut InitContext,
        is_locked: bool,
    ) -> HydraulicLinearActuatorAssembly<1> {
        let rigid_body = main_gear_door_right_body(is_locked);
        let actuator = main_gear_door_actuator(context, &rigid_body);

        HydraulicLinearActuatorAssembly::new([actuator], rigid_body)
    }

    fn main_gear_door_left_assembly(
        context: &mut InitContext,
        is_locked: bool,
    ) -> HydraulicLinearActuatorAssembly<1> {
        let rigid_body = main_gear_door_left_body(is_locked);
        let actuator = main_gear_door_actuator(context, &rigid_body);

        HydraulicLinearActuatorAssembly::new([actuator], rigid_body)
    }

    fn main_gear_door_right_broken_assembly(
        context: &mut InitContext,
        is_locked: bool,
    ) -> HydraulicLinearActuatorAssembly<1> {
        let rigid_body = main_gear_door_right_body(is_locked);
        let actuator = disconnected_actuator(context, &rigid_body);

        HydraulicLinearActuatorAssembly::new([actuator], rigid_body)
    }

    fn main_gear_door_actuator(
        context: &mut InitContext,
        bounded_linear_length: &impl BoundedLinearLength,
    ) -> LinearActuator {
        const DEFAULT_I_GAIN: f64 = 5.;
        const DEFAULT_P_GAIN: f64 = 0.7;
        const DEFAULT_FORCE_GAIN: f64 = 200000.;

        LinearActuator::new(
            context,
            bounded_linear_length,
            1,
            Length::new::<meter>(0.055),
            Length::new::<meter>(0.03),
            VolumeRate::new::<gallon_per_second>(0.09),
            20000.,
            5000.,
            2000.,
            9000.,
            Duration::from_millis(100),
            [1., 1., 1., 1., 0.5, 0.5],
            [0.5, 0.5, 1., 1., 1., 1.],
            [0., 0.15, 0.16, 0.84, 0.85, 1.],
            DEFAULT_P_GAIN,
            DEFAULT_I_GAIN,
            DEFAULT_FORCE_GAIN,
            true,
            false,
            None,
            None,
            Pressure::new::<psi>(3000.),
        )
    }

    fn disconnected_actuator(
        context: &mut InitContext,
        bounded_linear_length: &impl BoundedLinearLength,
    ) -> LinearActuator {
        LinearActuator::new(
            context,
            bounded_linear_length,
            1,
            Length::new::<meter>(0.055),
            Length::new::<meter>(0.03),
            VolumeRate::new::<gallon_per_second>(0.004),
            0.,
            0.,
            0.,
            0.,
            Duration::from_millis(100),
            [0.5, 1., 1., 1., 1., 0.5],
            [0.5, 1., 1., 1., 1., 0.5],
            [0., 0.2, 0.21, 0.79, 0.8, 1.],
            0.,
            0.,
            0.,
            false,
            false,
            None,
            None,
            Pressure::new::<psi>(3000.),
        )
    }

    fn main_gear_door_right_body(is_locked: bool) -> LinearActuatedRigidBodyOnHingeAxis {
        let size = Vector3::new(1.73, 0.02, 1.7);
        let cg_offset = Vector3::new(2. / 3. * size[0], 0.1, 0.);

        let control_arm = Vector3::new(0.76, 0., 0.);
        let anchor = Vector3::new(0.19, 0.23, 0.);

        LinearActuatedRigidBodyOnHingeAxis::new(
            Mass::new::<kilogram>(50.),
            size,
            cg_offset,
            cg_offset,
            control_arm,
            anchor,
            Angle::new::<degree>(-85.),
            Angle::new::<degree>(85.),
            Angle::new::<degree>(0.),
            150.,
            is_locked,
            Vector3::new(0., 0., 1.),
        )
    }

    fn main_gear_door_left_body(is_locked: bool) -> LinearActuatedRigidBodyOnHingeAxis {
        let size = Vector3::new(-1.73, 0.02, 1.7);
        let cg_offset = Vector3::new(2. / 3. * size[0], 0.1, 0.);

        let control_arm = Vector3::new(-0.76, 0., 0.);
        let anchor = Vector3::new(-0.19, 0.23, 0.);

        LinearActuatedRigidBodyOnHingeAxis::new(
            Mass::new::<kilogram>(50.),
            size,
            cg_offset,
            cg_offset,
            control_arm,
            anchor,
            Angle::new::<degree>(0.),
            Angle::new::<degree>(85.),
            Angle::new::<degree>(0.),
            150.,
            is_locked,
            Vector3::new(0., 0., 1.),
        )
    }

    fn main_gear_right_assembly(
        context: &mut InitContext,
        is_locked: bool,
    ) -> HydraulicLinearActuatorAssembly<1> {
        let rigid_body = main_gear_right_body(is_locked);
        let actuator = main_gear_actuator(context, &rigid_body);

        HydraulicLinearActuatorAssembly::new([actuator], rigid_body)
    }

    fn main_gear_left_assembly(
        context: &mut InitContext,
        is_locked: bool,
    ) -> HydraulicLinearActuatorAssembly<1> {
        let rigid_body = main_gear_left_body(is_locked);
        let actuator = main_gear_actuator(context, &rigid_body);

        HydraulicLinearActuatorAssembly::new([actuator], rigid_body)
    }

    fn main_gear_actuator(
        context: &mut InitContext,
        bounded_linear_length: &impl BoundedLinearLength,
    ) -> LinearActuator {
        const DEFAULT_I_GAIN: f64 = 4.5;
        const DEFAULT_P_GAIN: f64 = 0.3;
        const DEFAULT_FORCE_GAIN: f64 = 250000.;

        LinearActuator::new(
            context,
            bounded_linear_length,
            1,
            Length::new::<meter>(0.145),
            Length::new::<meter>(0.105),
            VolumeRate::new::<gallon_per_second>(0.17),
            800000.,
            15000.,
            50000.,
            1200000.,
            Duration::from_millis(100),
            [1., 1., 1., 1., 0.5, 0.5],
            [0.5, 0.5, 1., 1., 1., 1.],
            [0., 0.1, 0.11, 0.89, 0.9, 1.],
            DEFAULT_P_GAIN,
            DEFAULT_I_GAIN,
            DEFAULT_FORCE_GAIN,
            true,
            false,
            None,
            None,
            Pressure::new::<psi>(3000.),
        )
    }

    fn main_gear_right_body(is_locked: bool) -> LinearActuatedRigidBodyOnHingeAxis {
        let size = Vector3::new(0.3, 3.453, 0.3);
        let cg_offset = Vector3::new(0., -3. / 4. * size[1], 0.);

        let control_arm = Vector3::new(-0.1815, 0.15, 0.);
        let anchor = Vector3::new(-0.26, 0.15, 0.);

        LinearActuatedRigidBodyOnHingeAxis::new(
            Mass::new::<kilogram>(700.),
            size,
            cg_offset,
            cg_offset,
            control_arm,
            anchor,
            Angle::new::<degree>(-80.),
            Angle::new::<degree>(80.),
            Angle::new::<degree>(0.),
            150.,
            is_locked,
            Vector3::new(0., 0., 1.),
        )
    }

    fn main_gear_left_body(is_locked: bool) -> LinearActuatedRigidBodyOnHingeAxis {
        let size = Vector3::new(0.3, 3.453, 0.3);
        let cg_offset = Vector3::new(0., -3. / 4. * size[1], 0.);

        let control_arm = Vector3::new(0.1815, 0.15, 0.);
        let anchor = Vector3::new(0.26, 0.15, 0.);

        LinearActuatedRigidBodyOnHingeAxis::new(
            Mass::new::<kilogram>(700.),
            size,
            cg_offset,
            cg_offset,
            control_arm,
            anchor,
            Angle::new::<degree>(0.),
            Angle::new::<degree>(80.),
            Angle::new::<degree>(0.),
            150.,
            is_locked,
            Vector3::new(0., 0., 1.),
        )
    }

    fn nose_gear_assembly(context: &mut InitContext) -> HydraulicLinearActuatorAssembly<1> {
        let rigid_body = nose_gear_body();
        let actuator = nose_gear_actuator(context, &rigid_body);

        HydraulicLinearActuatorAssembly::new([actuator], rigid_body)
    }

    fn nose_gear_actuator(
        context: &mut InitContext,
        bounded_linear_length: &impl BoundedLinearLength,
    ) -> LinearActuator {
        const DEFAULT_I_GAIN: f64 = 4.5;
        const DEFAULT_P_GAIN: f64 = 0.3;
        const DEFAULT_FORCE_GAIN: f64 = 200000.;

        LinearActuator::new(
            context,
            bounded_linear_length,
            1,
            Length::new::<meter>(0.0792),
            Length::new::<meter>(0.035),
            VolumeRate::new::<gallon_per_second>(0.053),
            800000.,
            15000.,
            50000.,
            2200000.,
            Duration::from_millis(100),
            [1., 1., 1., 1., 0.5, 0.5],
            [0.5, 0.5, 1., 1., 1., 1.],
            [0., 0.1, 0.11, 0.89, 0.9, 1.],
            DEFAULT_P_GAIN,
            DEFAULT_I_GAIN,
            DEFAULT_FORCE_GAIN,
            true,
            false,
            None,
            None,
            Pressure::new::<psi>(3000.),
        )
    }

    fn nose_gear_body() -> LinearActuatedRigidBodyOnHingeAxis {
        let size = Vector3::new(0.3, 2.453, 0.3);
        let cg_offset = Vector3::new(0., -2. / 3. * size[1], 0.);

        let control_arm = Vector3::new(0., -0.093, 0.212);
        let anchor = Vector3::new(0., 0.56, 0.);

        LinearActuatedRigidBodyOnHingeAxis::new(
            Mass::new::<kilogram>(300.),
            size,
            cg_offset,
            cg_offset,
            control_arm,
            anchor,
            Angle::new::<degree>(-101.),
            Angle::new::<degree>(92.),
            Angle::new::<degree>(-9.),
            150.,
            true,
            Vector3::new(1., 0., 0.),
        )
    }

    fn nose_gear_door_assembly(context: &mut InitContext) -> HydraulicLinearActuatorAssembly<1> {
        let rigid_body = nose_gear_door_right_left_body();
        let actuator = nose_gear_door_actuator(context, &rigid_body);

        HydraulicLinearActuatorAssembly::new([actuator], rigid_body)
    }

    fn nose_gear_door_actuator(
        context: &mut InitContext,
        bounded_linear_length: &impl BoundedLinearLength,
    ) -> LinearActuator {
        const DEFAULT_I_GAIN: f64 = 5.;
        const DEFAULT_P_GAIN: f64 = 0.15;
        const DEFAULT_FORCE_GAIN: f64 = 200000.;

        LinearActuator::new(
            context,
            bounded_linear_length,
            1,
            Length::new::<meter>(0.0378),
            Length::new::<meter>(0.023),
            VolumeRate::new::<gallon_per_second>(0.027),
            20000.,
            5000.,
            2000.,
            28000.,
            Duration::from_millis(100),
            [1., 1., 1., 1., 0.5, 0.5],
            [0.5, 0.5, 1., 1., 1., 1.],
            [0., 0.15, 0.16, 0.84, 0.85, 1.],
            DEFAULT_P_GAIN,
            DEFAULT_I_GAIN,
            DEFAULT_FORCE_GAIN,
            true,
            false,
            None,
            None,
            Pressure::new::<psi>(3000.),
        )
    }

    fn nose_gear_door_right_left_body() -> LinearActuatedRigidBodyOnHingeAxis {
        let size = Vector3::new(-0.4, 0.02, 1.5);
        let cg_offset = Vector3::new(0.5 * size[0], 0., 0.);

        let control_arm = Vector3::new(-0.1465, 0., 0.);
        let anchor = Vector3::new(-0.1465, 0.40, 0.);

        LinearActuatedRigidBodyOnHingeAxis::new(
            Mass::new::<kilogram>(40.),
            size,
            cg_offset,
            cg_offset,
            control_arm,
            anchor,
            Angle::new::<degree>(0.),
            Angle::new::<degree>(85.),
            Angle::new::<degree>(0.),
            150.,
            true,
            Vector3::new(0., 0., 1.),
        )
    }

    fn aileron_assembly(
        context: &mut InitContext,
        is_init_down: bool,
    ) -> HydraulicLinearActuatorAssembly<2> {
        let rigid_body = aileron_body(is_init_down);
        let actuator = aileron_actuator(context, &rigid_body);

        HydraulicLinearActuatorAssembly::new([actuator, actuator], rigid_body)
    }

    fn aileron_actuator(
        context: &mut InitContext,
        bounded_linear_length: &impl BoundedLinearLength,
    ) -> LinearActuator {
        const DEFAULT_I_GAIN: f64 = 5.;
        const DEFAULT_P_GAIN: f64 = 0.35;
        const DEFAULT_FORCE_GAIN: f64 = 450000.;

        LinearActuator::new(
            context,
            bounded_linear_length,
            1,
            Length::new::<meter>(0.0537878),
            Length::new::<meter>(0.),
            VolumeRate::new::<gallon_per_second>(0.055),
            80000.,
            1500.,
            5000.,
            800000.,
            Duration::from_millis(300),
            [1., 1., 1., 1., 1., 1.],
            [1., 1., 1., 1., 1., 1.],
            [0., 0.2, 0.21, 0.79, 0.8, 1.],
            DEFAULT_P_GAIN,
            DEFAULT_I_GAIN,
            DEFAULT_FORCE_GAIN,
            false,
            false,
            None,
            None,
            Pressure::new::<psi>(3000.),
        )
    }

    fn aileron_body(is_init_down: bool) -> LinearActuatedRigidBodyOnHingeAxis {
        let size = Vector3::new(3.325, 0.16, 0.58);
        let cg_offset = Vector3::new(0., 0., -0.5 * size[2]);
        let aero_center_offset = Vector3::new(0., 0., -0.4 * size[2]);

        let control_arm = Vector3::new(0., -0.0525, 0.);
        let anchor = Vector3::new(0., -0.0525, 0.33);

        let init_angle = if is_init_down {
            Angle::new::<degree>(-25.)
        } else {
            Angle::new::<degree>(0.)
        };

        LinearActuatedRigidBodyOnHingeAxis::new(
            Mass::new::<kilogram>(24.65),
            size,
            cg_offset,
            aero_center_offset,
            control_arm,
            anchor,
            Angle::new::<degree>(-25.),
            Angle::new::<degree>(50.),
            init_angle,
            1.,
            false,
            Vector3::new(1., 0., 0.),
        )
    }

    fn elevator_assembly(context: &mut InitContext) -> HydraulicLinearActuatorAssembly<2> {
        let rigid_body = elevator_body();
        let actuator = elevator_actuator(context, &rigid_body, false);

        HydraulicLinearActuatorAssembly::new([actuator, actuator], rigid_body)
    }

    fn elevator_actuator(
        context: &mut InitContext,
        bounded_linear_length: &impl BoundedLinearLength,
        has_electro_backup: bool,
    ) -> LinearActuator {
        const DEFAULT_I_GAIN: f64 = 5.;
        const DEFAULT_P_GAIN: f64 = 1.;
        const DEFAULT_FORCE_GAIN: f64 = 450000.;

        LinearActuator::new(
            context,
            bounded_linear_length,
            1,
            Length::new::<meter>(0.0407),
            Length::new::<meter>(0.),
            VolumeRate::new::<gallon_per_second>(0.029),
            80000.,
            1500.,
            20000.,
            10000000.,
            Duration::from_millis(300),
            [1., 1., 1., 1., 1., 1.],
            [1., 1., 1., 1., 1., 1.],
            [0., 0.2, 0.21, 0.79, 0.8, 1.],
            DEFAULT_P_GAIN,
            DEFAULT_I_GAIN,
            DEFAULT_FORCE_GAIN,
            false,
            false,
            None,
            if has_electro_backup {
                Some(ElectroHydrostaticBackup::new(
                    ElectricalBusType::AlternatingCurrent(1),
                    ElectroHydrostaticActuatorType::ElectroHydrostaticActuator,
                ))
            } else {
                None
            },
            Pressure::new::<psi>(3000.),
        )
    }

    fn elevator_body() -> LinearActuatedRigidBodyOnHingeAxis {
        let size = Vector3::new(6., 0.405, 1.125);
        let cg_offset = Vector3::new(0., 0., -0.5 * size[2]);
        let aero_center_offset = Vector3::new(0., 0., -0.3 * size[2]);

        let control_arm = Vector3::new(0., -0.091, 0.);
        let anchor = Vector3::new(0., -0.091, 0.41);

        LinearActuatedRigidBodyOnHingeAxis::new(
            Mass::new::<kilogram>(58.6),
            size,
            cg_offset,
            aero_center_offset,
            control_arm,
            anchor,
            Angle::new::<degree>(-17.),
            Angle::new::<degree>(47.),
            Angle::new::<degree>(-17.),
            100.,
            false,
            Vector3::new(1., 0., 0.),
        )
    }

    fn spoiler_assembly(
        context: &mut InitContext,
        has_eletro_backup: bool,
    ) -> HydraulicLinearActuatorAssembly<1> {
        let rigid_body = spoiler_body();
        let actuator = spoiler_actuator(context, &rigid_body, has_eletro_backup);

        HydraulicLinearActuatorAssembly::new([actuator], rigid_body)
    }

    fn spoiler_actuator(
        context: &mut InitContext,
        bounded_linear_length: &impl BoundedLinearLength,
        has_electro_backup: bool,
    ) -> LinearActuator {
        const DEFAULT_I_GAIN: f64 = 1.;
        const DEFAULT_P_GAIN: f64 = 0.15;
        const DEFAULT_FORCE_GAIN: f64 = 450000.;

        LinearActuator::new(
            context,
            bounded_linear_length,
            1,
            Length::new::<meter>(0.03),
            Length::new::<meter>(0.),
            VolumeRate::new::<gallon_per_second>(0.03),
            80000.,
            1500.,
            5000.,
            800000.,
            Duration::from_millis(300),
            [1., 1., 1., 1., 1., 1.],
            [1., 1., 1., 1., 1., 1.],
            [0., 0.2, 0.21, 0.79, 0.8, 1.],
            DEFAULT_P_GAIN,
            DEFAULT_I_GAIN,
            DEFAULT_FORCE_GAIN,
            false,
            true,
            Some((
                AngularVelocity::new::<radian_per_second>(-10000.),
                AngularVelocity::new::<radian_per_second>(0.),
            )),
            if has_electro_backup {
                Some(ElectroHydrostaticBackup::new(
                    ElectricalBusType::AlternatingCurrent(1),
                    ElectroHydrostaticActuatorType::ElectricalBackupHydraulicActuator,
                ))
            } else {
                None
            },
            Pressure::new::<psi>(3000.),
        )
    }

    fn spoiler_body() -> LinearActuatedRigidBodyOnHingeAxis {
        let size = Vector3::new(1.785, 0.1, 0.685);
        let cg_offset = Vector3::new(0., 0., -0.5 * size[2]);
        let aero_center_offset = Vector3::new(0., 0., -0.4 * size[2]);

        let control_arm = Vector3::new(0., -0.067 * size[2], -0.26 * size[2]);
        let anchor = Vector3::new(0., -0.26 * size[2], 0.26 * size[2]);

        LinearActuatedRigidBodyOnHingeAxis::new(
            Mass::new::<kilogram>(16.),
            size,
            cg_offset,
            aero_center_offset,
            control_arm,
            anchor,
            Angle::new::<degree>(-10.),
            Angle::new::<degree>(40.),
            Angle::new::<degree>(-10.),
            50.,
            false,
            Vector3::new(1., 0., 0.),
        )
    }

    fn elevator_electro_hydrostatic_assembly(
        context: &mut InitContext,
    ) -> HydraulicLinearActuatorAssembly<2> {
        let rigid_body = elevator_body();
        let standard_actuator = elevator_actuator(context, &rigid_body, false);
        let eha_actuator = elevator_actuator(context, &rigid_body, true);

        HydraulicLinearActuatorAssembly::new([standard_actuator, eha_actuator], rigid_body)
    }
}
