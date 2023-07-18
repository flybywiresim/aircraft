use self::brake_circuit::BrakeAccumulatorCharacteristics;
use self::linear_actuator::Actuator;
use crate::failures::{Failure, FailureType};
use crate::hydraulic::{
    electrical_pump_physics::ElectricalPumpPhysics, pumps::PumpCharacteristics,
};
use crate::pneumatic::PressurizeableReservoir;
use crate::wind_turbine::WindTurbine;

use crate::physics::{GravityEffect, WobblePhysics};
use crate::shared::{
    interpolation, low_pass_filter::LowPassFilter, random_from_normal_distribution,
    random_from_range, AirbusElectricPumpId, AirbusEngineDrivenPumpId, DelayedTrueLogicGate,
    ElectricalBusType, ElectricalBuses, HydraulicColor, RamAirTurbineController, SectionPressure,
};
use crate::simulation::{
    InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
    SimulatorWriter, UpdateContext, VariableIdentifier, Write,
};
use nalgebra::Vector3;

use std::time::Duration;

use uom::si::{
    angular_velocity::{radian_per_second, revolution_per_minute},
    f64::*,
    length::meter,
    pressure::{pascal, psi},
    ratio::ratio,
    torque::{newton_meter, pound_force_inch},
    volume::{cubic_inch, cubic_meter, gallon},
    volume_rate::{gallon_per_minute, gallon_per_second},
};

pub mod aerodynamic_model;
pub mod brake_circuit;
pub mod cargo_doors;
pub mod electrical_generator;
pub mod electrical_pump_physics;
pub mod flap_slat;
pub mod landing_gear;
pub mod linear_actuator;
pub mod nose_steering;
pub mod pumps;
pub mod pushback;
pub mod reverser;
pub mod rudder_control;
pub mod trimmable_horizontal_stabilizer;

/// Indicates the pressure sensors info of an hydraulic circuit at different locations
/// Information can be wrong in case of sensor failure -> do not use for physical pressure
pub trait HydraulicPressureSensors {
    /// Pressure switch state in pump section
    fn pump_section_switch_pressurised(&self, pump_index: usize) -> bool;

    /// Pressure switch state in system section downstream leak measurement valve
    fn system_section_switch_pressurised(&self) -> bool;

    /// Pressure transducer value in system section upstream leak measurement valve
    fn system_section_pressure_transducer(&self) -> Pressure;
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
    heat_state: HeatingProperties,
}
impl Fluid {
    const HEATING_TIME_CONSTANT_MEAN_S: f64 = 40.;
    const HEATING_TIME_CONSTANT_STD_S: f64 = 10.;

    const COOLING_TIME_CONSTANT: Duration = Duration::from_secs(60 * 3);
    const DAMAGE_TIME_CONSTANT: Duration = Duration::from_secs(60 * 3);

    pub fn new(bulk: Pressure) -> Self {
        Self {
            current_bulk: bulk,
            heat_state: HeatingProperties::new(
                Duration::from_secs_f64(
                    random_from_normal_distribution(
                        Self::HEATING_TIME_CONSTANT_MEAN_S,
                        Self::HEATING_TIME_CONSTANT_STD_S,
                    )
                    .max(10.),
                ),
                Self::COOLING_TIME_CONSTANT,
                Self::DAMAGE_TIME_CONSTANT,
            ),
        }
    }

    pub fn bulk_mod(&self) -> Pressure {
        self.current_bulk
    }

    fn update(&mut self, context: &UpdateContext, is_heating: bool) {
        self.heat_state.update(context, is_heating);
    }
}
impl HeatingElement for Fluid {
    fn is_overheating(&self) -> bool {
        self.heat_state.is_overheating()
    }

    fn is_damaged(&self) -> bool {
        self.heat_state.is_damaged()
    }
}

#[derive(PartialEq, Eq, Clone, Copy)]
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

    current_pressure_filtered: LowPassFilter<Pressure>,

    sensor_type: PressureSwitchType,
}
impl PressureSwitch {
    const PRESSURE_DYNAMIC_TIME_CONSTANT: Duration = Duration::from_millis(200);

    pub fn new(
        high_threshold: Pressure,
        low_threshold: Pressure,
        sensor_type: PressureSwitchType,
    ) -> Self {
        Self {
            state_is_pressurised: false,
            high_hysteresis_threshold: high_threshold,
            low_hysteresis_threshold: low_threshold,
            current_pressure_filtered: LowPassFilter::new(Self::PRESSURE_DYNAMIC_TIME_CONSTANT),
            sensor_type,
        }
    }

    pub fn update(&mut self, context: &UpdateContext, current_pressure: Pressure) {
        let pressure_measured = match self.sensor_type {
            PressureSwitchType::Relative => current_pressure - context.ambient_pressure(),
            PressureSwitchType::Absolute => current_pressure,
        };
        self.current_pressure_filtered
            .update(context.delta(), pressure_measured);

        if self.current_pressure_filtered.output() <= self.low_hysteresis_threshold {
            self.state_is_pressurised = false;
        } else if self.current_pressure_filtered.output() >= self.high_hysteresis_threshold {
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

/// Physical low level switch.
/// It's a physical switch that changes state when crossing a fluid level threshold.
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

    pub fn update(&mut self, current_volume: Volume, is_upside_down: bool) {
        if current_volume <= self.low_hysteresis_threshold && !is_upside_down {
            self.state_is_low = true;
        } else if current_volume >= self.high_hysteresis_threshold || is_upside_down {
            self.state_is_low = false;
        }
    }

    pub fn is_low_level(&self) -> bool {
        self.state_is_low
    }
}

pub trait HeatingElement {
    fn is_overheating(&self) -> bool {
        false
    }
    fn is_damaged(&self) -> bool {
        false
    }
}

pub trait HeatingPressureSource: PressureSource + HeatingElement {}

pub struct HeatingProperties {
    is_overheating: bool,
    is_damaged_by_heat: bool,

    damaging_time: DelayedTrueLogicGate,

    heat_factor: LowPassFilter<Ratio>,
    heat_time: Duration,
    cool_time: Duration,
}
impl HeatingProperties {
    const OVERHEATING_THRESHOLD: f64 = 0.5;

    fn new(heat_time: Duration, cool_time: Duration, damage_time: Duration) -> Self {
        Self {
            is_overheating: false,
            is_damaged_by_heat: false,
            damaging_time: DelayedTrueLogicGate::new(damage_time),
            heat_factor: LowPassFilter::new(heat_time),
            heat_time,
            cool_time,
        }
    }

    fn update(&mut self, context: &UpdateContext, is_heating: bool) {
        if is_heating {
            self.heat_factor.set_time_constant(self.heat_time);
            self.heat_factor
                .update(context.delta(), Ratio::new::<ratio>(1.));
        } else {
            self.heat_factor.set_time_constant(self.cool_time);
            self.heat_factor
                .update(context.delta(), Ratio::new::<ratio>(0.));
        };

        self.is_overheating =
            self.heat_factor.output().get::<ratio>() > Self::OVERHEATING_THRESHOLD;

        self.damaging_time.update(context, self.is_overheating);
        self.is_damaged_by_heat = self.is_damaged_by_heat || self.damaging_time.output();
    }

    /// When overheating, provides a ratio of the heating severity
    /// Above OVERHEATING_THRESHOLD it will rise from 0 to 1, while always 0 under the threshold
    fn overheat_ratio(&self) -> Ratio {
        Ratio::new::<ratio>(
            ((self.heat_factor.output().get::<ratio>() - Self::OVERHEATING_THRESHOLD)
                / (1. - Self::OVERHEATING_THRESHOLD))
                .max(0.)
                .min(1.),
        )
    }
}
impl HeatingElement for HeatingProperties {
    fn is_overheating(&self) -> bool {
        self.is_overheating
    }

    fn is_damaged(&self) -> bool {
        self.is_damaged_by_heat
    }
}

pub trait PowerTransferUnitController {
    fn should_enable(&self) -> bool;
}

pub trait PowerTransferUnitCharacteristics {
    fn efficiency(&self) -> Ratio;
    fn deactivation_delta_pressure(&self) -> Pressure;
    fn activation_delta_pressure(&self) -> Pressure;
    fn shot_to_shot_variability(&self) -> Ratio;
}

pub struct PowerTransferUnit {
    valve_opened_id: VariableIdentifier,
    shaft_rpm_id: VariableIdentifier,
    bark_strength_id: VariableIdentifier,

    dev_efficiency_id: VariableIdentifier,
    dev_delta_pressure: VariableIdentifier,

    is_enabled: bool,
    is_active_right: bool,
    is_active_left: bool,
    flow_to_right: VolumeRate,
    flow_to_left: VolumeRate,
    left_displacement: Volume,
    right_displacement: LowPassFilter<Volume>,
    last_flow: VolumeRate,

    control_valve_opened: bool,

    shaft_speed: AngularVelocity,

    shaft_speed_filtered: LowPassFilter<AngularVelocity>,

    is_in_continuous_mode: bool,
    is_rotating_after_delay: DelayedTrueLogicGate,

    activation_delta_pressure: Pressure,
    deactivation_delta_pressure: Pressure,

    shot_to_shot_variability: Ratio,
    shot_to_shot_activation_coefficient: f64,
    shot_to_shot_deactivation_coefficient: f64,

    duration_since_active: Duration,
    speed_captured_at_active_duration: AngularVelocity,
    bark_strength: u8,
    has_stopped_since_last_write: bool,

    efficiency: Ratio,

    heat_state: HeatingProperties,
}
impl PowerTransferUnit {
    const MIN_SPEED_SIMULATION_RPM: f64 = 50.;
    const DEFAULT_LEFT_DISPLACEMENT_CUBIC_INCH: f64 = 0.92;
    const MIN_RIGHT_DISPLACEMENT_CUBIC_INCH: f64 = 0.65;
    const MAX_RIGHT_DISPLACEMENT_CUBIC_INCH: f64 = 1.21;

    const DISPLACEMENT_TIME_CONSTANT: Duration = Duration::from_millis(45);

    const PRESSURE_BREAKPOINTS_PSI: [f64; 10] =
        [-500., -250., -100., -50., -10., 0., 100., 220., 250., 500.];
    const DISPLACEMENT_CARAC_CUBIC_INCH: [f64; 10] = [
        0.65,
        0.65,
        0.65,
        0.65,
        0.65,
        Self::DEFAULT_LEFT_DISPLACEMENT_CUBIC_INCH,
        1.21,
        1.21,
        1.21,
        1.21,
    ];

    const SHAFT_FRICTION: f64 = 0.12;
    const BREAKOUT_TORQUE_NM: f64 = 2.;
    const SHAFT_INERTIA: f64 = 0.0055;

    const SHAFT_SPEED_FILTER_TIME_CONSTANT: Duration = Duration::from_millis(1500);

    const DELAY_TO_DECLARE_CONTINUOUS: Duration = Duration::from_millis(1500);
    const THRESHOLD_DELTA_TO_DECLARE_CONTINUOUS_RPM: f64 = 400.;
    const DURATION_BEFORE_CAPTURING_BARK_STRENGTH_SPEED: Duration = Duration::from_millis(133);

    const HEATING_TIME_CONSTANT_MEAN_S: f64 = 20.;
    const HEATING_TIME_CONSTANT_STD_S: f64 = 5.;
    const COOLING_TIME_CONSTANT: Duration = Duration::from_secs(60 * 3);
    const DAMAGE_TIME_CONSTANT: Duration = Duration::from_secs(60 * 3);

    const MAX_SPEED_BEFORE_HEATING_UP_RPM: f64 = 2000.;

    // We consider that ptu can't overheat if there's enough pressure on both side (it's cooled by hyd fluid)
    const MIN_PRESSURE_ALLOWING_PTU_HEATING_UP_RPM: f64 = 500.;

    pub fn new(
        context: &mut InitContext,
        characteristics: &impl PowerTransferUnitCharacteristics,
    ) -> Self {
        Self {
            valve_opened_id: context.get_identifier("HYD_PTU_VALVE_OPENED".to_owned()),
            shaft_rpm_id: context.get_identifier("HYD_PTU_SHAFT_RPM".to_owned()),
            dev_delta_pressure: context.get_identifier("HYD_PTU_DEV_DEACTIVATION_DELTA".to_owned()),
            bark_strength_id: context.get_identifier("HYD_PTU_BARK_STRENGTH".to_owned()),
            dev_efficiency_id: context.get_identifier("HYD_PTU_DEV_EFFICIENCY".to_owned()),

            is_enabled: false,
            is_active_right: false,
            is_active_left: false,
            flow_to_right: VolumeRate::new::<gallon_per_second>(0.0),
            flow_to_left: VolumeRate::new::<gallon_per_second>(0.0),
            left_displacement: Volume::new::<cubic_inch>(
                Self::DEFAULT_LEFT_DISPLACEMENT_CUBIC_INCH,
            ),
            right_displacement: LowPassFilter::<Volume>::new(Self::DISPLACEMENT_TIME_CONSTANT), //::<cubic_inch>(Self::DEFAULT_RIGHT_DISPLACEMENT),
            last_flow: VolumeRate::new::<gallon_per_second>(0.0),

            control_valve_opened: false,

            shaft_speed: AngularVelocity::new::<radian_per_second>(0.),

            shaft_speed_filtered: LowPassFilter::<AngularVelocity>::new(
                Self::SHAFT_SPEED_FILTER_TIME_CONSTANT,
            ),

            is_in_continuous_mode: false,
            is_rotating_after_delay: DelayedTrueLogicGate::new(Self::DELAY_TO_DECLARE_CONTINUOUS),

            activation_delta_pressure: characteristics.activation_delta_pressure(),
            deactivation_delta_pressure: characteristics.deactivation_delta_pressure(),

            shot_to_shot_variability: characteristics.shot_to_shot_variability(),
            shot_to_shot_activation_coefficient: 1.,
            shot_to_shot_deactivation_coefficient: 1.,

            duration_since_active: Duration::default(),
            speed_captured_at_active_duration: AngularVelocity::default(),
            bark_strength: 0,
            has_stopped_since_last_write: false,

            efficiency: characteristics.efficiency(),

            heat_state: HeatingProperties::new(
                Duration::from_secs_f64(
                    random_from_normal_distribution(
                        Self::HEATING_TIME_CONSTANT_MEAN_S,
                        Self::HEATING_TIME_CONSTANT_STD_S,
                    )
                    .max(10.),
                ),
                Self::COOLING_TIME_CONSTANT,
                Self::DAMAGE_TIME_CONSTANT,
            ),
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

    pub fn update(
        &mut self,
        context: &UpdateContext,
        loop_left_section: &impl SectionPressure,
        loop_right_section: &impl SectionPressure,
        controller: &impl PowerTransferUnitController,
    ) {
        self.is_enabled = controller.should_enable();

        self.update_displacement(context, loop_left_section, loop_right_section);
        self.update_shaft_physics(context, loop_left_section, loop_right_section);
        self.update_active_state(context);
        self.update_continuous_state(context);
        self.capture_bark_strength();
        self.update_flows();

        self.heat_state.update(
            context,
            self.shaft_speed.get::<revolution_per_minute>().abs()
                > Self::MAX_SPEED_BEFORE_HEATING_UP_RPM
                && (loop_left_section.pressure().get::<psi>()
                    < Self::MIN_PRESSURE_ALLOWING_PTU_HEATING_UP_RPM
                    || loop_right_section.pressure().get::<psi>()
                        < Self::MIN_PRESSURE_ALLOWING_PTU_HEATING_UP_RPM),
        );
    }

    fn update_displacement(
        &mut self,
        context: &UpdateContext,
        loop_left_section: &impl SectionPressure,
        loop_right_section: &impl SectionPressure,
    ) {
        let delta_p = if self.is_enabled {
            loop_left_section.pressure_downstream_priority_valve()
                - loop_right_section.pressure_downstream_priority_valve()
        } else {
            Pressure::new::<psi>(0.)
        };

        if delta_p.abs() > self.activation_delta_pressure * self.shot_to_shot_activation_coefficient
        {
            self.control_valve_opened = true;
            self.shot_to_shot_activation_coefficient = self.rand_shot_to_shot();
        } else if delta_p.abs()
            < self.deactivation_delta_pressure * self.shot_to_shot_deactivation_coefficient
        {
            self.shot_to_shot_deactivation_coefficient = self.rand_shot_to_shot();
            self.control_valve_opened = false;
        }

        let new_displacement = if !self.control_valve_opened {
            self.calc_equilibrium_displacement(
                loop_left_section.pressure_downstream_priority_valve(),
                loop_right_section.pressure_downstream_priority_valve(),
            )
        } else {
            Volume::new::<cubic_inch>(interpolation(
                &Self::PRESSURE_BREAKPOINTS_PSI,
                &Self::DISPLACEMENT_CARAC_CUBIC_INCH,
                -delta_p.get::<psi>(),
            ))
        };

        self.right_displacement
            .update(context.delta(), new_displacement);
    }

    /// Snapshots the ptu rotational speed after a fixed time to measure its expected "sound power level"
    fn capture_bark_strength(&mut self) {
        if self.duration_since_active > Self::DURATION_BEFORE_CAPTURING_BARK_STRENGTH_SPEED
            && self
                .speed_captured_at_active_duration
                .get::<revolution_per_minute>()
                == 0.
        {
            self.speed_captured_at_active_duration = self.shaft_speed.abs();
            self.bark_strength =
                Self::speed_to_bark_strength(self.speed_captured_at_active_duration);
        }
    }

    fn update_active_state(&mut self, context: &UpdateContext) {
        let is_rotating = self.is_rotating();

        if is_rotating {
            self.duration_since_active += context.delta();
        } else {
            self.duration_since_active = Duration::default();
            self.speed_captured_at_active_duration = AngularVelocity::default();
            self.bark_strength = 0;
            self.has_stopped_since_last_write = true;
        }

        let active_direction = self.shaft_speed.get::<revolution_per_minute>().signum();

        self.is_active_left = is_rotating && active_direction < 0.;
        self.is_active_right = is_rotating && active_direction > 0.;
    }

    fn update_shaft_physics(
        &mut self,
        context: &UpdateContext,
        loop_left_section: &impl SectionPressure,
        loop_right_section: &impl SectionPressure,
    ) {
        let left_pressure = if self.is_enabled {
            loop_left_section.pressure_downstream_priority_valve()
        } else {
            Pressure::new::<psi>(0.)
        };
        let right_pressure = if self.is_enabled {
            loop_right_section.pressure_downstream_priority_valve()
        } else {
            Pressure::new::<psi>(0.)
        };

        let left_side_torque = -Self::calc_generated_torque(left_pressure, self.left_displacement);
        let right_side_torque =
            Self::calc_generated_torque(right_pressure, self.right_displacement.output());

        let friction_torque = Torque::new::<newton_meter>(
            Self::SHAFT_FRICTION * -self.shaft_speed.get::<radian_per_second>(),
        );

        let total_torque = friction_torque + left_side_torque + right_side_torque;

        if !self.heat_state.is_damaged()
            && (self.is_rotating()
                || total_torque.abs().get::<newton_meter>() > Self::BREAKOUT_TORQUE_NM)
        {
            let acc = total_torque.get::<newton_meter>() / Self::SHAFT_INERTIA;
            self.shaft_speed +=
                AngularVelocity::new::<radian_per_second>(acc * context.delta_as_secs_f64());
            self.shaft_speed_filtered
                .update(context.delta(), self.shaft_speed);
        } else {
            self.shaft_speed = AngularVelocity::default();
            self.shaft_speed_filtered.reset(AngularVelocity::default());
        }
    }

    fn update_continuous_state(&mut self, context: &UpdateContext) {
        self.is_rotating_after_delay.update(
            context,
            self.shaft_speed.abs().get::<revolution_per_minute>()
                > Self::THRESHOLD_DELTA_TO_DECLARE_CONTINUOUS_RPM,
        );

        self.is_in_continuous_mode = (self.is_in_continuous_mode
            || self.is_rotating_after_delay.output())
            && self.is_rotating();
    }

    pub fn update_characteristics(
        &mut self,
        characteristics: &impl PowerTransferUnitCharacteristics,
    ) {
        self.efficiency = characteristics.efficiency();
        self.activation_delta_pressure = characteristics.activation_delta_pressure();
        self.deactivation_delta_pressure = characteristics.deactivation_delta_pressure();
        self.shot_to_shot_variability = characteristics.shot_to_shot_variability();
    }

    fn calc_generated_torque(pressure: Pressure, displacement: Volume) -> Torque {
        Torque::new::<newton_meter>(
            pressure.get::<pascal>() * displacement.get::<cubic_meter>()
                / (2. * std::f64::consts::PI),
        )
    }

    /// Computes the displacement that equalizes torque on both sides
    fn calc_equilibrium_displacement(
        &self,
        pressure_left: Pressure,
        pressure_right: Pressure,
    ) -> Volume {
        Volume::new::<cubic_meter>(
            pressure_left.get::<pascal>() * self.left_displacement.get::<cubic_meter>()
                / pressure_right.get::<pascal>(),
        )
        .max(Volume::new::<cubic_inch>(
            Self::MIN_RIGHT_DISPLACEMENT_CUBIC_INCH,
        ))
        .min(Volume::new::<cubic_inch>(
            Self::MAX_RIGHT_DISPLACEMENT_CUBIC_INCH,
        ))
    }

    fn update_flows(&mut self) {
        let shaft_rpm = self.shaft_speed.get::<revolution_per_minute>();

        if shaft_rpm < -Self::MIN_SPEED_SIMULATION_RPM {
            // Left sends flow to right
            let flow = Self::calc_flow(self.shaft_speed.abs(), self.left_displacement);
            self.flow_to_left = -flow;
            self.flow_to_right = flow * self.efficiency;
            self.last_flow = flow;
        } else if shaft_rpm > Self::MIN_SPEED_SIMULATION_RPM {
            // Right sends flow to left
            let flow = Self::calc_flow(self.shaft_speed.abs(), self.right_displacement.output());
            self.flow_to_left = flow * self.efficiency;
            self.flow_to_right = -flow;
            self.last_flow = flow;
        } else {
            self.flow_to_left = VolumeRate::new::<gallon_per_second>(0.);
            self.flow_to_right = VolumeRate::new::<gallon_per_second>(0.);
            self.last_flow = VolumeRate::new::<gallon_per_second>(0.);
        }
    }

    fn calc_flow(speed: AngularVelocity, displacement: Volume) -> VolumeRate {
        VolumeRate::new::<gallon_per_second>(
            speed.get::<revolution_per_minute>() * displacement.get::<cubic_inch>() / 231. / 60.,
        )
    }

    fn is_rotating(&self) -> bool {
        self.shaft_speed.abs().get::<revolution_per_minute>() > Self::MIN_SPEED_SIMULATION_RPM
    }

    pub fn is_in_continuous_mode(&self) -> bool {
        self.is_in_continuous_mode
    }

    fn speed_to_bark_strength(speed: AngularVelocity) -> u8 {
        let rpm = speed.get::<revolution_per_minute>();

        if rpm > 1700. {
            5
        } else if rpm > 1560. {
            4
        } else if rpm > 1470. {
            3
        } else if rpm > 1370. {
            2
        } else {
            1
        }
    }

    fn rand_shot_to_shot(&self) -> f64 {
        random_from_range(
            1. - self.shot_to_shot_variability.get::<ratio>(),
            1. + self.shot_to_shot_variability.get::<ratio>(),
        )
    }
}
impl SimulationElement for PowerTransferUnit {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.valve_opened_id, self.is_enabled());
        writer.write(
            &self.shaft_rpm_id,
            (self.shaft_speed_filtered.output()).abs(),
        );

        // As write can happen slower than ptu update, if we had ptu stopping between two writes
        // we ensure here we send the 0 value for 1 tick at least
        // This flag is reset in the read() to finish the handshake
        let refreshed_bark_strength = if self.has_stopped_since_last_write {
            0
        } else {
            self.bark_strength
        };

        writer.write(&self.bark_strength_id, refreshed_bark_strength);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        // Ensuring we take dev value into account only if not zero
        let deactivation_delta_pressure_raw = reader.read(&self.dev_delta_pressure);
        if deactivation_delta_pressure_raw != 0. {
            self.deactivation_delta_pressure =
                Pressure::new::<psi>(deactivation_delta_pressure_raw);
        }

        let efficiency_raw = reader.read(&self.dev_efficiency_id);
        if efficiency_raw != 0. {
            self.efficiency = Ratio::new::<ratio>(efficiency_raw);
        }

        // As read/write can happen slower than ptu update, if we had ptu stopping between two writes
        // we ensure here to reset the flag indicating we missed a stop
        self.has_stopped_since_last_write = false;
    }
}
impl HeatingElement for PowerTransferUnit {
    fn is_overheating(&self) -> bool {
        self.heat_state.is_overheating()
    }

    fn is_damaged(&self) -> bool {
        self.heat_state.is_damaged()
    }
}

pub trait HydraulicCircuitController {
    fn should_open_fire_shutoff_valve(&self, pump_index: usize) -> bool;
    fn should_open_leak_measurement_valve(&self) -> bool;
    fn should_route_pump_to_auxiliary(&self, _pump_index: usize) -> bool {
        false
    }
}

pub struct Accumulator {
    total_volume: Volume,
    current_gas_init_precharge: Pressure, // Current precharge as it can be changed by leaks for example
    gas_nominal_init_precharge: Pressure, // Original precharge used at plane init
    gas_pressure: Pressure,
    gas_volume: Volume,
    fluid_volume: Volume,
    current_flow: VolumeRate,
    current_delta_vol: Volume,
    has_control_valve: bool,

    circuit_target_pressure: Pressure,
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
        circuit_target_pressure: Pressure,
    ) -> Self {
        // Taking care of case where init volume is maxed at accumulator capacity: we can't exceed max_volume minus a margin for gas to compress
        let limited_volume = fluid_vol_at_init.min(total_volume * 0.9);

        // If we don't start with empty accumulator we need to init pressure too
        let gas_press_at_init =
            Self::gas_pressure_from_gas_precharge(gas_precharge, total_volume, limited_volume);

        Self {
            total_volume,
            current_gas_init_precharge: gas_precharge,
            gas_nominal_init_precharge: gas_precharge,
            gas_pressure: gas_press_at_init,
            gas_volume: (total_volume - limited_volume),
            fluid_volume: limited_volume,
            current_flow: VolumeRate::new::<gallon_per_second>(0.),
            current_delta_vol: Volume::new::<gallon>(0.),
            has_control_valve,
            circuit_target_pressure,
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
                - ((self.current_gas_init_precharge / self.circuit_target_pressure)
                    * self.total_volume);

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
        self.gas_pressure = (self.current_gas_init_precharge * self.total_volume)
            / (self.total_volume - self.fluid_volume);
    }

    fn new_system_accumulator(
        gas_precharge: Pressure,
        total_volume: Volume,
        fluid_vol_at_init: Volume,
        circuit_target_pressure: Pressure,
    ) -> Self {
        Accumulator::new(
            gas_precharge,
            total_volume,
            fluid_vol_at_init,
            false,
            circuit_target_pressure,
        )
    }

    pub fn new_brake_accumulator(characteristics: BrakeAccumulatorCharacteristics) -> Self {
        Accumulator::new(
            characteristics.gas_precharge(),
            characteristics.total_volume(),
            characteristics.volume_at_init(),
            true,
            characteristics.target_pressure(),
        )
    }

    fn get_delta_vol(&mut self, required_delta_vol: Volume) -> Volume {
        let mut volume_from_acc = Volume::new::<gallon>(0.0);
        if required_delta_vol > Volume::new::<gallon>(0.0) {
            volume_from_acc = self.fluid_volume.min(required_delta_vol);
            if volume_from_acc != Volume::new::<gallon>(0.0) {
                self.fluid_volume -= volume_from_acc;
                self.gas_volume += volume_from_acc;

                self.gas_pressure = self.current_gas_init_precharge * self.total_volume
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

    fn set_gas_precharge_pressure(&mut self, new_pressure: Pressure) {
        self.current_gas_init_precharge = new_pressure;
        self.gas_pressure = Self::gas_pressure_from_gas_precharge(
            self.current_gas_init_precharge,
            self.total_volume,
            self.fluid_volume,
        );
    }

    fn gas_precharge_pressure(&mut self) -> Pressure {
        self.current_gas_init_precharge
    }

    fn reset_gas_precharge_pressure_to_nominal(&mut self) {
        self.fluid_volume = Volume::default();
        self.set_gas_precharge_pressure(self.gas_nominal_init_precharge);
    }

    fn gas_pressure_from_gas_precharge(
        gas_precharge: Pressure,
        total_volume: Volume,
        current_volume: Volume,
    ) -> Pressure {
        gas_precharge * total_volume / (total_volume - current_volume)
    }

    #[cfg(test)]
    fn total_volume(&self) -> Volume {
        self.total_volume
    }

    #[cfg(test)]
    fn gas_volume(&self) -> Volume {
        self.gas_volume
    }
}

/// Complete hydraulic circuit that can be composed of multiple engine pump sections and one system section.
/// Pump sections are all connected to system section through a checkvalve (one per pump section)
/// Each pump section has its own pressure, and so does system section.
/// Flow is distributed from pump sections to system section according to regulation state and pressure difference.
pub struct HydraulicCircuit {
    pump_sections: Vec<Section>,
    system_section: Section,
    auxiliary_section: Option<Section>,

    pump_sections_check_valves: Vec<CheckValve>,

    // True routed to auxiliary False routed to system section
    pump_section_routed_to_auxiliary_section: Vec<bool>,

    fluid: Fluid,
    reservoir: Reservoir,

    circuit_target_pressure: Pressure,
}
impl HydraulicCircuit {
    const PUMP_SECTION_MAX_VOLUME_GAL: f64 = 0.8;
    const PUMP_SECTION_STATIC_LEAK_GAL_P_S: f64 = 0.005;

    // Size of auxiliary section vs system section. 0.5 means auxiliary is half the size of system section
    const AUXILIARY_TO_SYSTEM_SECTION_SIZE_RATIO: f64 = 0.5;

    const SYSTEM_SECTION_STATIC_LEAK_GAL_P_S: f64 = 0.03;
    const AUX_SECTION_STATIC_LEAK_GAL_P_S: f64 = 0.001;

    const FLUID_BULK_MODULUS_PASCAL: f64 = 1450000000.0;

    // TODO firevalves are actually powered by a sub-bus (401PP DC ESS)
    const DEFAULT_FIRE_VALVE_POWERING_BUS: ElectricalBusType =
        ElectricalBusType::DirectCurrentEssential;

    // TODO leak meas valves are actually powered by a sub-bus (Bus 601PP)
    const DEFAULT_LEAK_MEASUREMENT_VALVE_POWERING_BUS: ElectricalBusType =
        ElectricalBusType::DirectCurrentGndFltService;

    pub fn new(
        context: &mut InitContext,
        id: HydraulicColor,

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
        has_auxiliary_section: bool,

        circuit_target_pressure: Pressure,
        priority_valve: PriorityValve,
        system_accumulator_precharge: Pressure,
        system_accumulator_volume: Volume,
    ) -> Self {
        assert!(number_of_pump_sections > 0);

        let mut pump_sections: Vec<Section> = Vec::new();
        let mut pump_to_system_check_valves: Vec<CheckValve> = Vec::new();

        let mut pump_section_to_auxiliary: Vec<bool> = Vec::new();

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
                None,
                None,
            ));

            pump_to_system_check_valves.push(CheckValve::new());

            pump_section_to_auxiliary.push(false);
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
                Some(Accumulator::new_system_accumulator(
                    system_accumulator_precharge,
                    system_accumulator_volume,
                    Volume::new::<gallon>(0.),
                    circuit_target_pressure,
                )),
                system_pressure_switch_lo_hyst,
                system_pressure_switch_hi_hyst,
                None,
                connected_to_ptu_left_side,
                connected_to_ptu_right_side,
                Some(LeakMeasurementValve::new(
                    Self::DEFAULT_LEAK_MEASUREMENT_VALVE_POWERING_BUS,
                )),
                Some(priority_valve),
            ),
            auxiliary_section: if has_auxiliary_section {
                Some(Section::new(
                    context,
                    id,
                    "AUXILIARY",
                    1,
                    VolumeRate::new::<gallon_per_second>(Self::AUX_SECTION_STATIC_LEAK_GAL_P_S),
                    system_section_volume
                        * Self::AUXILIARY_TO_SYSTEM_SECTION_SIZE_RATIO
                        * priming_volume,
                    system_section_volume * Self::AUXILIARY_TO_SYSTEM_SECTION_SIZE_RATIO,
                    None,
                    system_pressure_switch_lo_hyst,
                    system_pressure_switch_hi_hyst,
                    None,
                    false,
                    false,
                    None,
                    None,
                ))
            } else {
                None
            },
            pump_sections_check_valves: pump_to_system_check_valves,
            pump_section_routed_to_auxiliary_section: pump_section_to_auxiliary,
            fluid: Fluid::new(Pressure::new::<pascal>(Self::FLUID_BULK_MODULUS_PASCAL)),
            reservoir,
            circuit_target_pressure,
        }
    }

    pub fn is_fire_shutoff_valve_open(&self, pump_id: usize) -> bool {
        self.pump_sections[pump_id].fire_valve_is_open()
    }

    pub fn update_system_actuator_volumes(&mut self, actuator: &mut impl Actuator) {
        self.system_section.update_actuator_volumes(actuator);
    }

    pub fn update_auxiliary_actuator_volumes(&mut self, actuator: &mut impl Actuator) {
        if let Some(auxiliary_section) = self.auxiliary_section.as_mut() {
            auxiliary_section.update_actuator_volumes(actuator);
        } else {
            panic!("No auxiliary section available but an actuator was provided")
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        main_section_pumps: &mut [&mut dyn HeatingPressureSource],
        system_section_pump: Option<&mut impl HeatingPressureSource>,
        auxiliary_section_pump: Option<&mut impl HeatingPressureSource>,
        ptu: Option<&PowerTransferUnit>,
        controller: &impl HydraulicCircuitController,
        reservoir_pressure: Pressure,
    ) {
        let mut any_pump_is_overheating = false;
        for pump in main_section_pumps.iter() {
            if pump.flow().get::<gallon_per_second>() > 0.01 && pump.is_overheating() {
                any_pump_is_overheating = true;
            }
        }

        if let Some(pump) = system_section_pump.as_ref() {
            if pump.flow().get::<gallon_per_second>() > 0.01 && pump.is_overheating() {
                any_pump_is_overheating = true;
            }
        }

        if let Some(pump) = auxiliary_section_pump.as_ref() {
            if pump.flow().get::<gallon_per_second>() > 0.01 && pump.is_overheating() {
                any_pump_is_overheating = true;
            }
        }

        let ptu_overheats_fluid = ptu.map_or(false, |p| p.is_overheating() && p.is_rotating());

        self.fluid
            .update(context, ptu_overheats_fluid || any_pump_is_overheating);

        self.reservoir
            .update(context, reservoir_pressure, &self.fluid);

        self.update_shutoff_valves(controller);
        self.update_leak_measurement_valves(context, controller);
        self.update_auxiliary_selector_valve(controller);

        // Taking care of leaks / consumers / actuators volumes
        self.update_flows(context, ptu);

        // How many fluid needed to reach target pressure considering flow consumption
        self.update_target_volumes_after_flow();

        // Updating for each section its total maximum theoretical pumping capacity
        // "what max volume it could pump considering current reservoir state and pump rpm"
        self.update_maximum_pumping_capacities(
            main_section_pumps,
            &system_section_pump,
            &auxiliary_section_pump,
        );

        // What flow can come through each valve considering what is consumed downstream
        self.update_maximum_valve_flows(context);

        // Update final flow that will go through each valve (spliting flow between multiple valves)
        self.update_system_final_valves_flows();
        self.update_auxiliary_final_valves_flows();

        self.update_delta_vol_from_valves();

        // We have all flow information, now we set pump parameters (displacement) to where it
        // should be so we reach target pressure
        self.update_pumps(
            context,
            main_section_pumps,
            system_section_pump,
            auxiliary_section_pump,
        );

        self.update_final_delta_vol_and_pressure(context);
    }

    fn update_delta_vol_from_valves(&mut self) {
        for (pump_index, section) in self.pump_sections.iter_mut().enumerate() {
            section.update_downstream_delta_vol(&self.pump_sections_check_valves[pump_index]);
        }

        for (pump_index, _) in self.pump_sections.iter_mut().enumerate() {
            if self.auxiliary_section.is_some()
                && self.pump_section_routed_to_auxiliary_section[pump_index]
            {
                self.auxiliary_section
                    .as_mut()
                    .unwrap()
                    .update_upstream_delta_vol(std::slice::from_ref(
                        &self.pump_sections_check_valves[pump_index],
                    ));
            } else {
                self.system_section
                    .update_upstream_delta_vol(std::slice::from_ref(
                        &self.pump_sections_check_valves[pump_index],
                    ));
            }
        }
    }

    fn update_pumps(
        &mut self,
        context: &UpdateContext,
        main_section_pumps: &mut [&mut dyn HeatingPressureSource],
        system_section_pump: Option<&mut impl HeatingPressureSource>,
        auxiliary_section_pump: Option<&mut impl HeatingPressureSource>,
    ) {
        for (pump_index, section) in self.pump_sections.iter_mut().enumerate() {
            section.update_pump_state(context, main_section_pumps[pump_index], &mut self.reservoir);
        }

        if let Some(pump) = system_section_pump {
            self.system_section
                .update_pump_state(context, pump, &mut self.reservoir);
        }

        if let Some(pump) = auxiliary_section_pump {
            if let Some(auxiliary_section) = self.auxiliary_section.as_mut() {
                auxiliary_section.update_pump_state(context, pump, &mut self.reservoir);
            }
        }
    }

    fn update_final_delta_vol_and_pressure(&mut self, context: &UpdateContext) {
        for section in &mut self.pump_sections {
            section.update_final_delta_vol_and_pressure(context, &self.fluid);
        }

        self.system_section
            .update_final_delta_vol_and_pressure(context, &self.fluid);

        if let Some(auxiliary_section) = self.auxiliary_section.as_mut() {
            auxiliary_section.update_final_delta_vol_and_pressure(context, &self.fluid);
        }
    }

    fn update_maximum_valve_flows(&mut self, context: &UpdateContext) {
        for (pump_section_idx, valve) in self.pump_sections_check_valves.iter_mut().enumerate() {
            valve.update_flow_forecast(
                context,
                &self.pump_sections[pump_section_idx],
                if self.auxiliary_section.is_some()
                    && self.pump_section_routed_to_auxiliary_section[pump_section_idx]
                {
                    self.auxiliary_section.as_mut().unwrap()
                } else {
                    &self.system_section
                },
                &self.fluid,
            );
        }
    }

    fn update_maximum_pumping_capacities(
        &mut self,
        main_section_pumps: &mut [&mut dyn HeatingPressureSource],
        system_section_pump: &Option<&mut impl HeatingPressureSource>,
        auxiliary_section_pump: &Option<&mut impl HeatingPressureSource>,
    ) {
        for (pump_index, section) in self.pump_sections.iter_mut().enumerate() {
            section.update_maximum_pumping_capacity(main_section_pumps[pump_index]);
        }

        if let Some(pump) = system_section_pump {
            self.system_section.update_maximum_pumping_capacity(*pump);
        }

        if let Some(pump) = auxiliary_section_pump {
            if let Some(auxiliary_section) = self.auxiliary_section.as_mut() {
                auxiliary_section.update_maximum_pumping_capacity(*pump);
            }
        }
    }

    fn update_target_volumes_after_flow(&mut self) {
        for section in &mut self.pump_sections {
            section
                .update_target_volume_after_flow_update(self.circuit_target_pressure, &self.fluid);
        }
        self.system_section
            .update_target_volume_after_flow_update(self.circuit_target_pressure, &self.fluid);

        if let Some(auxiliary_section) = self.auxiliary_section.as_mut() {
            auxiliary_section
                .update_target_volume_after_flow_update(self.circuit_target_pressure, &self.fluid);
        }
    }

    fn update_flows(&mut self, context: &UpdateContext, ptu: Option<&PowerTransferUnit>) {
        for section in &mut self.pump_sections {
            section.update_flow(
                context,
                &mut self.reservoir,
                ptu,
                self.circuit_target_pressure,
            );
        }
        self.system_section.update_flow(
            context,
            &mut self.reservoir,
            ptu,
            self.circuit_target_pressure,
        );

        if let Some(auxiliary_section) = self.auxiliary_section.as_mut() {
            auxiliary_section.update_flow(
                context,
                &mut self.reservoir,
                ptu,
                self.circuit_target_pressure,
            );
        }
    }

    fn update_shutoff_valves(&mut self, controller: &impl HydraulicCircuitController) {
        self.pump_sections
            .iter_mut()
            .for_each(|section| section.update_shutoff_valve(controller));
    }

    fn update_leak_measurement_valves(
        &mut self,
        context: &UpdateContext,
        controller: &impl HydraulicCircuitController,
    ) {
        self.system_section
            .update_leak_measurement_valve(context, controller);
    }

    fn update_auxiliary_selector_valve(&mut self, controller: &impl HydraulicCircuitController) {
        for (pump_section_index, _) in self.pump_sections_check_valves.iter().enumerate() {
            self.pump_section_routed_to_auxiliary_section[pump_section_index] =
                controller.should_route_pump_to_auxiliary(pump_section_index);
        }
    }

    fn update_final_valves_flows(&mut self, to_auxiliary: bool) {
        let mut total_max_valves_volume = Volume::new::<gallon>(0.);

        for (idx, valve) in &mut self.pump_sections_check_valves.iter_mut().enumerate() {
            if self.pump_section_routed_to_auxiliary_section[idx] == to_auxiliary {
                total_max_valves_volume += valve.max_virtual_volume;
            }
        }

        let downstream_section = if to_auxiliary {
            self.auxiliary_section.as_ref().unwrap()
        } else {
            &self.system_section
        };

        let used_downstream_volume = downstream_section
            .volume_target
            .max(Volume::new::<gallon>(0.));

        if used_downstream_volume >= total_max_valves_volume {
            // If all the volume upstream is used by downstream section, each valve will provide its max volume available
            for (idx, valve) in &mut self.pump_sections_check_valves.iter_mut().enumerate() {
                if self.pump_section_routed_to_auxiliary_section[idx] == to_auxiliary {
                    valve.current_volume = valve.max_virtual_volume;
                }
            }
        } else if total_max_valves_volume > Volume::new::<gallon>(0.) {
            let needed_ratio = used_downstream_volume / total_max_valves_volume;

            for (idx, valve) in &mut self.pump_sections_check_valves.iter_mut().enumerate() {
                if self.pump_section_routed_to_auxiliary_section[idx] == to_auxiliary {
                    valve.current_volume = valve.max_virtual_volume * needed_ratio;
                }
            }
        }
    }

    fn update_system_final_valves_flows(&mut self) {
        self.update_final_valves_flows(false);
    }

    fn update_auxiliary_final_valves_flows(&mut self) {
        if self.auxiliary_section.is_some() {
            self.update_final_valves_flows(true);
        }
    }

    pub fn pump_pressure(&self, idx: usize) -> Pressure {
        self.pump_sections[idx].pressure()
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

    pub fn system_section_pressure(&self) -> Pressure {
        self.system_section.pressure()
    }

    pub fn system_section(&self) -> &impl SectionPressure {
        &self.system_section
    }

    pub fn auxiliary_section(&self) -> &impl SectionPressure {
        if self.auxiliary_section.is_some() {
            self.auxiliary_section.as_ref().unwrap()
        } else {
            &self.system_section
        }
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

        if let Some(auxiliary_section) = self.auxiliary_section.as_mut() {
            auxiliary_section.accept(visitor);
        }

        visitor.visit(self);
    }
}
impl HydraulicPressureSensors for HydraulicCircuit {
    fn pump_section_switch_pressurised(&self, pump_index: usize) -> bool {
        self.pump_section(pump_index)
            .is_pressure_switch_pressurised()
    }

    fn system_section_switch_pressurised(&self) -> bool {
        self.system_section().is_pressure_switch_pressurised()
    }

    fn system_section_pressure_transducer(&self) -> Pressure {
        self.system_section().pressure()
    }
}

/// This is an hydraulic section with its own volume of fluid and pressure. It can be connected to another section
/// through a checkvalve
pub struct Section {
    pressure_id: VariableIdentifier,
    pressure_switch_id: VariableIdentifier,

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

    leak_measurement_valve: Option<LeakMeasurementValve>,
    priority_valve: Option<PriorityValve>,

    total_actuator_consumed_volume: Volume,
    total_actuator_returned_volume: Volume,
}
impl Section {
    pub fn new(
        context: &mut InitContext,
        loop_id: HydraulicColor,
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
        leak_measurement_valve: Option<LeakMeasurementValve>,
        priority_valve: Option<PriorityValve>,
    ) -> Self {
        let section_name: String = format!("HYD_{}_{}_{}_SECTION", loop_id, section_id, pump_id);

        Self {
            pressure_id: context
                .get_identifier(format!("{}_PRESSURE", section_name))
                .to_owned(),
            pressure_switch_id: context
                .get_identifier(format!("{}_PRESSURE_SWITCH", section_name))
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

            leak_measurement_valve,
            priority_valve,

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

    fn update_leak_measurement_valve(
        &mut self,
        context: &UpdateContext,
        controller: &impl HydraulicCircuitController,
    ) {
        let pressure = self.pressure();
        if let Some(valve) = &mut self.leak_measurement_valve {
            valve.update(context, pressure, controller);
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

    fn static_leak(&self, context: &UpdateContext, target_pressure: Pressure) -> Volume {
        self.static_leak_at_max_press
            * context.delta_as_time()
            * (self.current_pressure - Pressure::new::<psi>(14.7))
            / target_pressure
    }

    /// Updates hydraulic flow from consumers like accumulator / ptu / any actuator
    pub fn update_flow(
        &mut self,
        context: &UpdateContext,
        reservoir: &mut Reservoir,
        ptu: Option<&PowerTransferUnit>,
        target_pressure: Pressure,
    ) {
        let static_leak = self.static_leak(context, target_pressure);
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

    pub fn update_maximum_pumping_capacity(&mut self, pump: &dyn HeatingPressureSource) {
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
        pump: &mut dyn HeatingPressureSource,
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

        self.pressure_switch
            .update(context, self.pressure_downstream_leak_valve());

        if let Some(priority_valve) = &mut self.priority_valve {
            priority_valve.update(context, self.current_pressure)
        }
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

        if let Some(leak_meas_valve) = &mut self.leak_measurement_valve {
            leak_meas_valve.accept(visitor);
        }

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.pressure_id, self.pressure());

        writer.write(
            &self.pressure_switch_id,
            self.pressure_switch_state() == PressureSwitchState::Pressurised,
        );
    }
}
impl SectionPressure for Section {
    fn pressure(&self) -> Pressure {
        self.pressure()
    }

    fn pressure_downstream_leak_valve(&self) -> Pressure {
        if let Some(valve) = &self.leak_measurement_valve {
            valve.downstream_pressure()
        } else {
            self.pressure()
        }
    }

    fn pressure_downstream_priority_valve(&self) -> Pressure {
        if let Some(valve) = &self.priority_valve {
            valve.downstream_pressure()
        } else {
            self.pressure()
        }
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
        hyd_loop_id: HydraulicColor,
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

pub struct CheckValve {
    current_volume: Volume,
    max_virtual_volume: Volume,

    delta_pressure: LowPassFilter<Pressure>,
}
impl CheckValve {
    const AGRESSIVENESS_FACTOR: f64 = 5.;
    const DELTA_PRESSURE_FILTER_TIME_CONSTANT: Duration = Duration::from_millis(60);

    fn new() -> Self {
        Self {
            current_volume: Volume::default(),
            max_virtual_volume: Volume::default(),
            delta_pressure: LowPassFilter::<Pressure>::new(
                Self::DELTA_PRESSURE_FILTER_TIME_CONSTANT,
            ),
        }
    }

    fn volume_to_equalize_pressures(
        &mut self,
        context: &UpdateContext,
        upstream_section: &Section,
        downstream_section: &Section,
        fluid: &Fluid,
    ) -> Volume {
        let new_delta_pressure = upstream_section.pressure() - downstream_section.pressure();

        self.delta_pressure
            .update(context.delta(), new_delta_pressure);

        if self.delta_pressure.output() > Pressure::new::<psi>(0.) {
            Self::AGRESSIVENESS_FACTOR
                * downstream_section.max_high_press_volume
                * upstream_section.max_high_press_volume
                * self.delta_pressure.output()
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
        context: &UpdateContext,
        upstream_section: &Section,
        downstream_section: &Section,
        fluid: &Fluid,
    ) {
        let physical_volume_transferred =
            self.volume_to_equalize_pressures(context, upstream_section, downstream_section, fluid);

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

pub struct PriorityValve {
    open_ratio: LowPassFilter<Ratio>,

    fully_closed_threshold: Pressure,
    fully_opened_threshold: Pressure,

    upstream_pressure: Pressure,
    downstream_pressure: Pressure,
}
impl PriorityValve {
    const VALVE_RESPONSE_TIME_CONSTANT: Duration = Duration::from_millis(5);

    pub fn new(fully_closed_threshold: Pressure, fully_opened_threshold: Pressure) -> Self {
        Self {
            open_ratio: LowPassFilter::<Ratio>::new(Self::VALVE_RESPONSE_TIME_CONSTANT),

            fully_closed_threshold,
            fully_opened_threshold,

            upstream_pressure: Pressure::default(),
            downstream_pressure: Pressure::default(),
        }
    }

    fn update(&mut self, context: &UpdateContext, upstream_pressure: Pressure) {
        self.upstream_pressure = upstream_pressure;

        self.update_open_state(context);

        self.update_downstream_pressure();
    }

    fn update_open_state(&mut self, context: &UpdateContext) {
        let opening_ratio = Ratio::new::<ratio>(
            ((self.upstream_pressure - self.fully_closed_threshold).get::<psi>()
                / (self.fully_opened_threshold - self.fully_closed_threshold).get::<psi>())
            .max(0.)
            .min(1.),
        );

        self.open_ratio.update(context.delta(), opening_ratio);
    }

    fn update_downstream_pressure(&mut self) {
        let current_open_state = self.open_ratio.output();

        self.downstream_pressure = self.upstream_pressure * current_open_state * current_open_state;
    }

    fn downstream_pressure(&self) -> Pressure {
        self.downstream_pressure
    }
}

pub struct LeakMeasurementValve {
    open_ratio: LowPassFilter<Ratio>,

    is_powered: bool,
    powered_by: ElectricalBusType,

    upstream_pressure: Pressure,
    downstream_pressure: Pressure,
}
impl LeakMeasurementValve {
    const VALVE_RESPONSE_TIME_CONSTANT: Duration = Duration::from_millis(500);

    fn new(powered_by: ElectricalBusType) -> Self {
        Self {
            open_ratio: LowPassFilter::<Ratio>::new(Self::VALVE_RESPONSE_TIME_CONSTANT),
            is_powered: false,
            powered_by,
            upstream_pressure: Pressure::default(),
            downstream_pressure: Pressure::default(),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        upstream_pressure: Pressure,
        valve_controller: &impl HydraulicCircuitController,
    ) {
        self.upstream_pressure = upstream_pressure;

        self.update_open_state(context, valve_controller);

        self.update_downstream_pressure();
    }

    fn update_open_state(
        &mut self,
        context: &UpdateContext,
        valve_controller: &impl HydraulicCircuitController,
    ) {
        let opening_ratio = if self.is_powered {
            if valve_controller.should_open_leak_measurement_valve() {
                Ratio::new::<ratio>(1.)
            } else {
                Ratio::new::<ratio>(0.)
            }
        } else {
            Ratio::new::<ratio>(1.)
        };

        self.open_ratio.update(context.delta(), opening_ratio);
    }

    fn update_downstream_pressure(&mut self) {
        let current_open_state = self.open_ratio.output();

        self.downstream_pressure = self.upstream_pressure * current_open_state * current_open_state;
    }

    fn downstream_pressure(&self) -> Pressure {
        self.downstream_pressure
    }
}
impl SimulationElement for LeakMeasurementValve {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by);
    }
}

struct FluidPhysics {
    wobble_physics: WobblePhysics,

    g_trap_is_empty: DelayedTrueLogicGate,
}
impl FluidPhysics {
    const MEAN_G_TRAP_CAVITY_TIME_DURATION_SECONDS: f64 = 20.;
    const STD_DEV_G_TRAP_CAVITY_TIME_DURATION_SECONDS: f64 = 4.;
    const ABSOLUTE_MIN_G_TRAP_CAVITY_TIME_DURATION_SECONDS: f64 = 8.;
    const ABSOLUTE_MAX_G_TRAP_CAVITY_TIME_DURATION_SECONDS: f64 = 32.;

    const SPRING_K_CONSTANT: f64 = 5000.;
    const SPRING_DAMPING_CONSTANT: f64 = 500.;

    fn new() -> Self {
        Self {
            wobble_physics: WobblePhysics::new(
                GravityEffect::GravityFiltered,
                Vector3::new(0., -0.2, 0.),
                100.,
                2.,
                Self::SPRING_K_CONSTANT,
                5.,
                Self::SPRING_DAMPING_CONSTANT,
                1.,
                Vector3::new(25., 20., 25.),
                1.,
            ),

            g_trap_is_empty: DelayedTrueLogicGate::new(Duration::from_secs_f64(
                random_from_normal_distribution(
                    Self::MEAN_G_TRAP_CAVITY_TIME_DURATION_SECONDS,
                    Self::STD_DEV_G_TRAP_CAVITY_TIME_DURATION_SECONDS,
                )
                .clamp(
                    Self::ABSOLUTE_MIN_G_TRAP_CAVITY_TIME_DURATION_SECONDS,
                    Self::ABSOLUTE_MAX_G_TRAP_CAVITY_TIME_DURATION_SECONDS,
                ),
            )),
        }
    }

    fn update(&mut self, context: &UpdateContext) {
        self.wobble_physics.update(context);

        self.g_trap_is_empty
            .update(context, self.is_fluid_going_up());
    }

    // Returns a coefficient of the actual level that will be seen by the gauge.
    // Example: 0.5 means gauge reads half the actual level of the reservoir
    fn gauge_modifier(&self) -> Ratio {
        const LATERAL_BREAKPOINTS: [f64; 6] = [-1., -0.2, 0., 0.2, 0.4, 1.];
        const LATERAL_MAP: [f64; 6] = [0.2, 0.95, 1., 1.05, 1.2, 1.3];
        let lateral_ratio = interpolation(
            &LATERAL_BREAKPOINTS,
            &LATERAL_MAP,
            self.wobble_physics.position()[0],
        );

        const LONGITUDINAL_BREAKPOINTS: [f64; 6] = [-1., -0.1, 0., 0.1, 0.4, 1.];
        const LONGITUDINAL_MAP: [f64; 6] = [0.2, 0.98, 1., 0.98, 0.2, 0.2];
        let longitudinal_ratio = interpolation(
            &LONGITUDINAL_BREAKPOINTS,
            &LONGITUDINAL_MAP,
            self.wobble_physics.position()[2],
        );

        const VERTICAL_BREAKPOINTS: [f64; 6] = [-1., -0.1, 0., 0.1, 0.2, 1.];
        const VERTICAL_MAP: [f64; 6] = [1., 1., 0.7, 0.9, 1.2, 1.5];
        let vertical_ratio = interpolation(
            &VERTICAL_BREAKPOINTS,
            &VERTICAL_MAP,
            self.wobble_physics.position()[1],
        );

        Ratio::new::<ratio>(lateral_ratio * vertical_ratio * longitudinal_ratio)
    }

    // Returns a coefficient of the actual level that will be available for pumps.
    // Example: 0.5 means from pumps point of view half the actual level of the reservoir is available
    fn usable_level_modifier(&self) -> Ratio {
        const LATERAL_BREAKPOINTS: [f64; 6] = [-1., -0.2, 0., 0.2, 0.4, 1.];
        const LATERAL_MAP: [f64; 6] = [0.2, 0.8, 1., 1., 1., 1.];
        let lateral_ratio = interpolation(
            &LATERAL_BREAKPOINTS,
            &LATERAL_MAP,
            self.wobble_physics.position()[0],
        );

        const LONGITUDINAL_BREAKPOINTS: [f64; 6] = [-1., -0.1, 0., 0.1, 0.4, 1.];
        const LONGITUDINAL_MAP: [f64; 6] = [0.2, 1., 1., 1., 0.2, 0.2];
        let longitudinal_ratio = interpolation(
            &LONGITUDINAL_BREAKPOINTS,
            &LONGITUDINAL_MAP,
            self.wobble_physics.position()[2],
        );

        if self.g_trap_is_empty.output() {
            Ratio::new::<ratio>(0.)
        } else {
            Ratio::new::<ratio>(longitudinal_ratio * lateral_ratio)
        }
    }

    fn is_fluid_going_up(&self) -> bool {
        self.wobble_physics.position()[1] > 0.
    }
}

pub struct Reservoir {
    level_id: VariableIdentifier,
    low_level_id: VariableIdentifier,
    low_air_press_id: VariableIdentifier,
    overheating_id: VariableIdentifier,

    max_capacity: Volume,
    max_gaugeable: Volume,
    current_level: Volume,

    air_pressure: Pressure,

    air_pressure_switches: Vec<PressureSwitch>,

    level_switch: LevelSwitch,

    leak_failure: Failure,
    return_failure: Failure,

    fluid_physics: FluidPhysics,

    heat_state: HeatingProperties,

    total_return_flow: VolumeRate,
    total_return_volume: Volume,
}
impl Reservoir {
    const MIN_USABLE_VOLUME_GAL: f64 = 0.2;

    const LEAK_FAILURE_FLOW_GAL_PER_S: f64 = 0.1;

    // Part of the fluid lost instead of returning to reservoir
    const RETURN_FAILURE_LEAK_RATIO: f64 = 0.1;

    const HEATING_TIME_CONSTANT_MEAN_S: f64 = 30.;
    const HEATING_TIME_CONSTANT_STD_S: f64 = 5.;
    const COOLING_TIME_CONSTANT: Duration = Duration::from_secs(60 * 3);
    const DAMAGE_TIME_CONSTANT: Duration = Duration::from_secs(60 * 5);

    pub fn new(
        context: &mut InitContext,
        hyd_loop_id: HydraulicColor,
        max_capacity: Volume,
        max_gaugeable: Volume,
        current_level: Volume,
        air_pressure_switches: Vec<PressureSwitch>,
        low_level_threshold: Volume,
    ) -> Self {
        Self {
            level_id: context.get_identifier(format!("HYD_{}_RESERVOIR_LEVEL", hyd_loop_id)),
            low_level_id: context
                .get_identifier(format!("HYD_{}_RESERVOIR_LEVEL_IS_LOW", hyd_loop_id)),
            low_air_press_id: context
                .get_identifier(format!("HYD_{}_RESERVOIR_AIR_PRESSURE_IS_LOW", hyd_loop_id)),
            overheating_id: context.get_identifier(format!("HYD_{}_RESERVOIR_OVHT", hyd_loop_id)),

            max_capacity,
            max_gaugeable,
            current_level,

            air_pressure: Pressure::new::<psi>(50.),
            leak_failure: Failure::new(FailureType::ReservoirLeak(hyd_loop_id)),
            return_failure: Failure::new(FailureType::ReservoirReturnLeak(hyd_loop_id)),
            air_pressure_switches,
            level_switch: LevelSwitch::new(low_level_threshold),
            fluid_physics: FluidPhysics::new(),

            heat_state: HeatingProperties::new(
                Duration::from_secs_f64(
                    random_from_normal_distribution(
                        Self::HEATING_TIME_CONSTANT_MEAN_S,
                        Self::HEATING_TIME_CONSTANT_STD_S,
                    )
                    .max(10.),
                ),
                Self::COOLING_TIME_CONSTANT,
                Self::DAMAGE_TIME_CONSTANT,
            ),
            total_return_flow: VolumeRate::default(),
            total_return_volume: Volume::default(),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        air_pressure: Pressure,
        fluid: &impl HeatingElement,
    ) {
        self.air_pressure = air_pressure;

        self.update_return_flow(context);
        self.update_heat(context, fluid);

        self.fluid_physics.update(context);

        self.level_switch.update(
            self.fluid_level_from_gauge(),
            self.fluid_physics.is_fluid_going_up(),
        );

        self.update_pressure_switches(context);

        self.update_leak_failure(context);
    }

    fn update_return_flow(&mut self, context: &UpdateContext) {
        self.total_return_flow = self.total_return_volume / context.delta_as_time();
        self.total_return_volume = Volume::default();
    }

    fn update_heat(&mut self, context: &UpdateContext, fluid: &impl HeatingElement) {
        let has_fluid_return = self.total_return_flow.get::<gallon_per_second>() > 0.01;
        self.heat_state
            .update(context, has_fluid_return && fluid.is_overheating())
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
        let volume_taken = self
            .fluid_level_reachable_by_pumps()
            .min(volume)
            .max(Volume::new::<gallon>(0.));

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
        self.fluid_level_reachable_by_pumps().min(desired_volume) / context.delta_as_time()
    }

    fn add_return_volume(&mut self, volume: Volume) {
        let volume_actually_returned = if !self.return_failure.is_active() {
            volume
        } else {
            volume - (Self::RETURN_FAILURE_LEAK_RATIO * volume)
        };

        self.current_level = (self.current_level + volume_actually_returned).min(self.max_capacity);

        self.total_return_volume += volume_actually_returned;
    }

    fn fluid_level_real(&self) -> Volume {
        self.current_level
    }

    fn fluid_level_reachable_by_pumps(&self) -> Volume {
        (self.current_level * self.fluid_physics.usable_level_modifier()
            - Volume::new::<gallon>(Self::MIN_USABLE_VOLUME_GAL))
        .max(Volume::new::<gallon>(0.))
    }

    fn fluid_level_from_gauge(&self) -> Volume {
        self.current_level.min(self.max_gaugeable) * self.fluid_physics.gauge_modifier()
    }

    pub fn air_pressure(&self) -> Pressure {
        self.air_pressure
    }

    fn is_empty(&self) -> bool {
        self.fluid_level_reachable_by_pumps() <= Volume::new::<gallon>(0.01)
    }

    pub fn is_low_air_pressure(&self) -> bool {
        self.air_pressure_switches
            .iter()
            .any(|s| s.state() == PressureSwitchState::NotPressurised)
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
        writer.write(&self.low_air_press_id, self.is_low_air_pressure());
        writer.write(&self.overheating_id, self.is_overheating());
    }
}
impl PressurizeableReservoir for Reservoir {
    fn available_volume(&self) -> Volume {
        self.max_capacity - self.fluid_level_real()
    }
}
impl HeatingElement for Reservoir {
    fn is_damaged(&self) -> bool {
        self.heat_state.is_damaged()
    }

    fn is_overheating(&self) -> bool {
        self.heat_state.is_overheating()
    }
}

pub trait PumpController {
    fn should_pressurise(&self) -> bool;

    // Gives a factor applied to max pump displacement to manually control displacement of the pump
    fn max_displacement_restriction(&self) -> Ratio {
        Ratio::new::<ratio>(1.)
    }

    fn is_input_shaft_connected(&self) -> bool {
        true
    }
}

pub struct Pump {
    delta_vol_max: Volume,
    current_displacement: Volume,
    current_flow: VolumeRate,
    current_max_displacement: LowPassFilter<Volume>,

    pump_characteristics: PumpCharacteristics,

    speed: AngularVelocity,

    cavitation_efficiency: Ratio,
}
impl Pump {
    const SECONDS_PER_MINUTES: f64 = 60.;
    const FLOW_CONSTANT_RPM_CUBIC_INCH_TO_GPM: f64 = 231.;

    const MAX_DISPLACEMENT_FILTER_TIME_CONSTANT: Duration = Duration::from_millis(150);

    fn new(pump_characteristics: PumpCharacteristics) -> Self {
        Self {
            delta_vol_max: Volume::new::<gallon>(0.),
            current_displacement: Volume::new::<gallon>(0.),
            current_flow: VolumeRate::new::<gallon_per_second>(0.),
            current_max_displacement: LowPassFilter::<Volume>::new(
                Self::MAX_DISPLACEMENT_FILTER_TIME_CONSTANT,
            ),
            pump_characteristics,

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

        self.current_max_displacement.update(
            context.delta(),
            self.cavitation_efficiency
                * theoretical_displacement
                * controller.max_displacement_restriction(),
        );

        let max_flow = self
            .get_max_flow_from_max_displacement()
            .max(VolumeRate::new::<gallon_per_second>(0.));

        let max_flow_available_from_reservoir =
            reservoir.request_flow_availability(context, max_flow);

        self.delta_vol_max = max_flow_available_from_reservoir * context.delta_as_time();
    }

    fn update_cavitation(&mut self, reservoir: &Reservoir) {
        self.cavitation_efficiency = if !reservoir.is_empty() {
            self.pump_characteristics.cavitation_efficiency(
                reservoir.air_pressure(),
                reservoir.heat_state.overheat_ratio(),
            )
        } else {
            Ratio::new::<ratio>(0.)
        };
    }

    fn calculate_displacement<T: PumpController>(
        &self,
        section: &impl SectionPressure,
        controller: &T,
    ) -> Volume {
        if controller.should_pressurise() {
            self.pump_characteristics
                .current_displacement(section.pressure())
        } else {
            Volume::new::<cubic_inch>(0.)
        }
    }

    fn calculate_displacement_from_required_flow(&self, required_flow: VolumeRate) -> Volume {
        if self.speed.get::<revolution_per_minute>() > 0. {
            let displacement = Volume::new::<cubic_inch>(
                required_flow.get::<gallon_per_second>()
                    * Self::FLOW_CONSTANT_RPM_CUBIC_INCH_TO_GPM
                    * Self::SECONDS_PER_MINUTES
                    / self.speed.get::<revolution_per_minute>(),
            );
            self.current_max_displacement
                .output()
                .min(displacement)
                .max(Volume::new::<cubic_inch>(0.))
        } else {
            self.current_max_displacement.output()
        }
    }

    fn get_max_flow_from_max_displacement(&self) -> VolumeRate {
        if self.speed
            > self
                .pump_characteristics
                .min_speed_for_non_zero_efficiency()
        {
            VolumeRate::new::<gallon_per_second>(
                self.speed.get::<revolution_per_minute>()
                    * self.current_max_displacement.output().get::<cubic_inch>()
                    / Self::FLOW_CONSTANT_RPM_CUBIC_INCH_TO_GPM
                    / Self::SECONDS_PER_MINUTES,
            )
        } else {
            VolumeRate::new::<gallon_per_second>(0.)
        }
    }

    fn get_max_flow_from_current_dsiplacement(&self) -> VolumeRate {
        if self.speed
            > self
                .pump_characteristics
                .min_speed_for_non_zero_efficiency()
        {
            VolumeRate::new::<gallon_per_minute>(
                self.speed.get::<revolution_per_minute>()
                    * self.current_displacement.get::<cubic_inch>()
                    / Self::FLOW_CONSTANT_RPM_CUBIC_INCH_TO_GPM,
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
        let max_current_flow = self.get_max_flow_from_current_dsiplacement();

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
    overheat_id: VariableIdentifier,
    pump: Pump,
    pump_physics: ElectricalPumpPhysics,
}
impl ElectricPump {
    pub fn new(
        context: &mut InitContext,
        id: AirbusElectricPumpId,
        bus_type: ElectricalBusType,
        max_current: ElectricCurrent,
        pump_characteristics: PumpCharacteristics,
    ) -> Self {
        let regulated_speed = pump_characteristics.regulated_speed();
        Self {
            cavitation_id: context.get_identifier(format!("HYD_{}_EPUMP_CAVITATION", id)),
            overheat_id: context.get_identifier(format!("HYD_{}_EPUMP_OVHT", id)),
            pump: Pump::new(pump_characteristics),
            pump_physics: ElectricalPumpPhysics::new(
                context,
                id,
                bus_type,
                max_current,
                regulated_speed,
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

    pub fn speed(&self) -> AngularVelocity {
        self.pump.speed
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
        writer.write(&self.overheat_id, self.is_overheating());
    }
}
impl HeatingElement for ElectricPump {
    fn is_damaged(&self) -> bool {
        self.pump_physics.is_damaged()
    }

    fn is_overheating(&self) -> bool {
        self.pump_physics.is_overheating()
    }
}
impl HeatingPressureSource for ElectricPump {}

pub struct EngineDrivenPump {
    active_id: VariableIdentifier,

    is_active: bool,
    speed: AngularVelocity,
    pump: Pump,

    overheat_failure: Failure,
    heat_state: HeatingProperties,
}
impl EngineDrivenPump {
    const HEATING_TIME_CONSTANT_MEAN_S: f64 = 30.;
    const HEATING_TIME_CONSTANT_STD_S: f64 = 5.;

    const COOLING_TIME_CONSTANT: Duration = Duration::from_secs(60 * 2);
    const DAMAGE_TIME_CONSTANT: Duration = Duration::from_secs(60 * 2);

    const MIN_SPEED_TO_REPORT_HEATING_RPM: f64 = 200.;

    const SPEED_SPOOLDOWN_WHEN_DECLUTCHED_RPM_PER_S: f64 = 800.;

    pub fn new(
        context: &mut InitContext,
        id: AirbusEngineDrivenPumpId,
        pump_characteristics: PumpCharacteristics,
    ) -> Self {
        Self {
            active_id: context.get_identifier(format!("HYD_{}_EDPUMP_ACTIVE", id)),
            is_active: false,
            speed: AngularVelocity::new::<revolution_per_minute>(0.),
            pump: Pump::new(pump_characteristics),
            overheat_failure: Failure::new(FailureType::EnginePumpOverheat(id)),
            heat_state: HeatingProperties::new(
                Duration::from_secs_f64(
                    random_from_normal_distribution(
                        Self::HEATING_TIME_CONSTANT_MEAN_S,
                        Self::HEATING_TIME_CONSTANT_STD_S,
                    )
                    .max(10.),
                ),
                Self::COOLING_TIME_CONSTANT,
                Self::DAMAGE_TIME_CONSTANT,
            ),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        section: &impl SectionPressure,
        reservoir: &Reservoir,
        pump_speed: AngularVelocity,
        controller: &impl PumpController,
    ) {
        self.heat_state.update(
            context,
            self.overheat_failure.is_active()
                && pump_speed.get::<revolution_per_minute>()
                    > Self::MIN_SPEED_TO_REPORT_HEATING_RPM,
        );

        self.speed = if !self.is_damaged() && controller.is_input_shaft_connected() {
            pump_speed
        } else {
            self.speed
                - AngularVelocity::new::<revolution_per_minute>(
                    Self::SPEED_SPOOLDOWN_WHEN_DECLUTCHED_RPM_PER_S,
                )
        };
        self.speed = self.speed.max(AngularVelocity::default());

        self.pump
            .update(context, section, reservoir, self.speed, controller);

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
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.overheat_failure.accept(visitor);
        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.active_id, self.is_active);
    }
}
impl HeatingElement for EngineDrivenPump {
    fn is_damaged(&self) -> bool {
        self.heat_state.is_damaged()
    }

    fn is_overheating(&self) -> bool {
        self.heat_state.is_overheating()
    }
}
impl HeatingPressureSource for EngineDrivenPump {}

struct RatAntiStallPumpController {
    anti_stall_ratio: LowPassFilter<Ratio>,
}
impl RatAntiStallPumpController {
    const LOW_SPEED_CUT_OFF_THRESHOLD_RPM: f64 = 4000.;
    const LOW_SPEED_CUT_OFF_BANDWIDTH_RPM: f64 = 500.;

    const ANTI_STALL_TIME_CONSTANT: Duration = Duration::from_millis(200);

    const MIN_ANTI_STALL_RATIO: f64 = 0.15;

    fn new() -> Self {
        Self {
            anti_stall_ratio: LowPassFilter::new(Self::ANTI_STALL_TIME_CONSTANT),
        }
    }

    fn update(&mut self, context: &UpdateContext, speed: AngularVelocity) {
        let cut_off_ratio = ((speed.get::<revolution_per_minute>()
            - (Self::LOW_SPEED_CUT_OFF_THRESHOLD_RPM - Self::LOW_SPEED_CUT_OFF_BANDWIDTH_RPM))
            / Self::LOW_SPEED_CUT_OFF_BANDWIDTH_RPM)
            .clamp(Self::MIN_ANTI_STALL_RATIO, 1.);

        self.anti_stall_ratio
            .update(context.delta(), Ratio::new::<ratio>(cut_off_ratio));
    }
}
impl PumpController for RatAntiStallPumpController {
    fn should_pressurise(&self) -> bool {
        true
    }

    fn max_displacement_restriction(&self) -> Ratio {
        self.anti_stall_ratio.output()
    }
}
impl Default for RatAntiStallPumpController {
    fn default() -> Self {
        Self::new()
    }
}

pub struct RamAirTurbine {
    stow_position_id: VariableIdentifier,

    deployment_commanded: bool,
    pump: Pump,
    pump_controller: RatAntiStallPumpController,
    wind_turbine: WindTurbine,
    position: f64,
}
impl RamAirTurbine {
    // Speed to go from 0 to 1 stow position per sec. 1 means full deploying in 1s
    const STOWING_SPEED: f64 = 1.;

    pub const RPM_GOVERNOR_BREAKPTS: [f64; 9] = [
        0.0, 1000., 4700.0, 5500.0, 6250.0, 6300.0, 6450.0, 9000.0, 15000.0,
    ];
    pub const PROP_ALPHA_MAP: [f64; 9] = [0., 0., 0., 0., 1., 1., 1., 1., 1.];

    pub const PROPELLER_DIAMETER_M: f64 = 1.003;

    pub const PROPELLER_INERTIA: f64 = 0.10;
    pub const DYNAMIC_FRICTION: f64 = 0.07;
    pub const BEST_EFFICIENCY_TIP_SPEED_RATIO: f64 = 2.;

    pub fn new(context: &mut InitContext, pump_characteristics: PumpCharacteristics) -> Self {
        Self {
            stow_position_id: context.get_identifier("RAT_STOW_POSITION".to_owned()),

            deployment_commanded: false,
            pump: Pump::new(pump_characteristics),
            pump_controller: RatAntiStallPumpController::new(),

            wind_turbine: WindTurbine::new(
                context,
                Length::new::<meter>(Self::PROPELLER_DIAMETER_M / 2.),
                Self::RPM_GOVERNOR_BREAKPTS,
                Self::PROP_ALPHA_MAP,
                Self::DYNAMIC_FRICTION,
                Self::BEST_EFFICIENCY_TIP_SPEED_RATIO,
                Self::PROPELLER_INERTIA,
            ),
            position: 0.,
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        section: &impl SectionPressure,
        reservoir: &Reservoir,
        controller: &impl RamAirTurbineController,
    ) {
        // Once commanded, stays commanded forever
        self.deployment_commanded = controller.should_deploy() || self.deployment_commanded;

        self.pump_controller
            .update(context, self.wind_turbine.speed());

        self.pump.update(
            context,
            section,
            reservoir,
            self.wind_turbine.speed(),
            &self.pump_controller,
        );
    }

    pub fn update_physics(&mut self, context: &UpdateContext, pressure: &impl SectionPressure) {
        let resistant_torque = self.resistant_torque(self.delta_vol_max(), pressure.pressure());
        self.wind_turbine.update(
            context,
            Ratio::new::<ratio>(self.position),
            resistant_torque,
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

    fn resistant_torque(&mut self, displacement: Volume, pressure: Pressure) -> Torque {
        Torque::new::<pound_force_inch>(
            -pressure.get::<psi>() * displacement.get::<cubic_inch>() / (2. * std::f64::consts::PI),
        )
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
impl HeatingElement for RamAirTurbine {}
impl HeatingPressureSource for RamAirTurbine {}

pub struct ManualPump {
    pump: Pump,
    speed: AngularVelocity,
    max_speed: AngularVelocity,
}
impl ManualPump {
    const SPOOL_RATE_RPM_S: f64 = 1000.;

    pub fn new(pump_characteristics: PumpCharacteristics) -> Self {
        let max_speed = pump_characteristics.regulated_speed();
        Self {
            pump: Pump::new(pump_characteristics),
            speed: AngularVelocity::default(),
            max_speed,
        }
    }

    pub fn update<T: PumpController>(
        &mut self,
        context: &UpdateContext,
        section: &impl SectionPressure,
        reservoir: &Reservoir,
        controller: &T,
    ) {
        self.speed =
            AngularVelocity::new::<revolution_per_minute>(if controller.should_pressurise() {
                (self.speed.get::<revolution_per_minute>()
                    + (Self::SPOOL_RATE_RPM_S * context.delta_as_secs_f64()))
                .max(0.)
                .min(self.max_speed.get::<revolution_per_minute>())
            } else {
                (self.speed.get::<revolution_per_minute>()
                    - (Self::SPOOL_RATE_RPM_S * context.delta_as_secs_f64()))
                .max(0.)
                .min(self.max_speed.get::<revolution_per_minute>())
            });

        self.pump
            .update(context, section, reservoir, self.speed, controller);
    }

    pub fn cavitation_efficiency(&self) -> Ratio {
        self.pump.cavitation_efficiency()
    }

    pub fn flow(&self) -> VolumeRate {
        self.pump.flow()
    }

    pub fn speed(&self) -> AngularVelocity {
        self.pump.speed
    }
}
impl PressureSource for ManualPump {
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
impl HeatingElement for ManualPump {}
impl HeatingPressureSource for ManualPump {}

#[derive(PartialEq, Eq, Clone, Copy)]
pub enum HydraulicValveType {
    ClosedWhenOff,
    _OpenedWhenOff,
    Mechanical,
}

pub struct HydraulicValve {
    position: LowPassFilter<Ratio>,
    is_powered: bool,
    powered_by: Option<Vec<ElectricalBusType>>,
    valve_type: HydraulicValveType,

    pressure_input: Pressure,
    pressure_output: Pressure,
}
impl HydraulicValve {
    const POSITION_RESPONSE_TIME_CONSTANT: Duration = Duration::from_millis(150);
    const MIN_POSITION_FOR_ZERO_PRESSURE_RATIO: f64 = 0.02;

    pub fn new(valve_type: HydraulicValveType, powered_by: Option<Vec<ElectricalBusType>>) -> Self {
        Self {
            position: LowPassFilter::<Ratio>::new(Self::POSITION_RESPONSE_TIME_CONSTANT),
            is_powered: false,
            powered_by,
            valve_type,
            pressure_input: Pressure::default(),
            pressure_output: Pressure::default(),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        commanded_open: bool,
        current_pressure_input: Pressure,
    ) {
        let commanded_position = self.actual_target_position_from_valve_type(commanded_open);

        self.position.update(context.delta(), commanded_position);

        self.pressure_input = current_pressure_input;
        self.update_output_pressure();
    }

    fn actual_target_position_from_valve_type(&self, commanded_open: bool) -> Ratio {
        match self.valve_type {
            HydraulicValveType::_OpenedWhenOff => {
                if !commanded_open && self.is_powered {
                    Ratio::new::<ratio>(0.)
                } else {
                    Ratio::new::<ratio>(1.)
                }
            }
            HydraulicValveType::ClosedWhenOff => {
                if commanded_open && self.is_powered {
                    Ratio::new::<ratio>(1.)
                } else {
                    Ratio::new::<ratio>(0.)
                }
            }
            HydraulicValveType::Mechanical => {
                if commanded_open {
                    Ratio::new::<ratio>(1.)
                } else {
                    Ratio::new::<ratio>(0.)
                }
            }
        }
    }

    fn update_output_pressure(&mut self) {
        self.pressure_output =
            if self.position.output().get::<ratio>() > Self::MIN_POSITION_FOR_ZERO_PRESSURE_RATIO {
                self.pressure_input
                    * (self.position.output().sqrt() * 1.4)
                        .min(Ratio::new::<ratio>(1.).max(Ratio::new::<ratio>(0.)))
            } else {
                Pressure::default()
            }
    }

    pub fn pressure_output(&self) -> Pressure {
        self.pressure_output
    }
}
impl SimulationElement for HydraulicValve {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        if let Some(powered_by_element) = &self.powered_by {
            self.is_powered = buses.any_is_powered(powered_by_element);
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::simulation::test::{
        ElementCtorFn, ReadByName, SimulationTestBed, TestBed, WriteByName,
    };
    use crate::simulation::InitContext;
    use ntest::assert_about_eq;

    use uom::si::{f64::*, pressure::psi, ratio::percent, volume::gallon};

    use super::*;

    struct TestFluid {
        is_hot: bool,
    }
    impl TestFluid {
        fn overheat() -> Self {
            Self { is_hot: true }
        }

        fn nominal() -> Self {
            Self { is_hot: false }
        }
    }
    impl HeatingElement for TestFluid {
        fn is_overheating(&self) -> bool {
            self.is_hot
        }
    }

    impl SimulationElement for PriorityValve {}

    #[test]
    fn section_writes_its_state() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            section(context, HydraulicColor::Green, "PUMP", 2)
        }));

        test_bed.run();

        assert!(test_bed.contains_variable_with_name("HYD_GREEN_PUMP_2_SECTION_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("HYD_GREEN_PUMP_2_FIRE_VALVE_OPENED"));
    }

    #[test]
    fn hyd_circuit_writes_its_state() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            hydraulic_circuit(context, HydraulicColor::Green, 2)
        }));

        test_bed.run();

        assert!(test_bed.contains_variable_with_name("HYD_GREEN_SYSTEM_1_SECTION_PRESSURE"));
        assert!(!test_bed.contains_variable_with_name("HYD_GREEN_SYSTEM_1_FIRE_VALVE_OPENED"));

        assert!(test_bed.contains_variable_with_name("HYD_GREEN_PUMP_1_SECTION_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("HYD_GREEN_PUMP_1_FIRE_VALVE_OPENED"));

        assert!(test_bed.contains_variable_with_name("HYD_GREEN_PUMP_2_SECTION_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("HYD_GREEN_PUMP_2_FIRE_VALVE_OPENED"));

        assert!(!test_bed.contains_variable_with_name("HYD_GREEN_PUMP_0_SECTION_PRESSURE"));
        assert!(!test_bed.contains_variable_with_name("HYD_GREEN_PUMP_0_FIRE_VALVE_OPENED"));

        assert!(!test_bed.contains_variable_with_name("HYD_GREEN_PUMP_3_SECTION_PRESSURE"));
        assert!(!test_bed.contains_variable_with_name("HYD_GREEN_PUMP_3_FIRE_VALVE_OPENED"));
    }

    #[test]
    fn reservoir_gives_desired_flow() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            reservoir(
                context,
                HydraulicColor::Green,
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
                HydraulicColor::Green,
                Volume::new::<gallon>(5.),
                Volume::new::<gallon>(5.),
                Volume::new::<gallon>(5.),
            )
        }));

        let volume_taken =
            test_bed.command_element(|e| e.try_take_volume(Volume::new::<gallon>(10.)));

        assert!(volume_taken.get::<gallon>() == 5. - Reservoir::MIN_USABLE_VOLUME_GAL);
    }

    #[test]
    fn leak_measurement_valve_init_with_zero_pressures() {
        let test_bed = SimulationTestBed::from(ElementCtorFn(|_| {
            LeakMeasurementValve::new(ElectricalBusType::DirectCurrentEssential)
        }));

        assert!(test_bed.query_element(|e| e.downstream_pressure == Pressure::new::<psi>(0.)));
        assert!(test_bed.query_element(|e| e.upstream_pressure == Pressure::new::<psi>(0.)));
    }

    #[test]
    fn priority_valve_init_with_zero_pressures() {
        let test_bed = SimulationTestBed::from(ElementCtorFn(|_| {
            PriorityValve::new(Pressure::new::<psi>(1500.), Pressure::new::<psi>(2000.))
        }));

        assert!(test_bed.query_element(|e| e.downstream_pressure() == Pressure::new::<psi>(0.)));
        assert!(test_bed.query_element(|e| e.upstream_pressure == Pressure::new::<psi>(0.)));
    }

    #[test]
    fn priority_valve_opened_with_pressure() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|_| {
            PriorityValve::new(Pressure::new::<psi>(1500.), Pressure::new::<psi>(2000.))
        }));

        test_bed.set_update_after_power_distribution(|valve, context| {
            valve.update(context, Pressure::new::<psi>(3000.))
        });

        test_bed.run_multiple_frames(Duration::from_secs(2));

        assert!(test_bed.query_element(|e| e.downstream_pressure() >= Pressure::new::<psi>(2800.)));
    }

    #[test]
    fn priority_valve_not_fully_opened_with_lower_pressure() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|_| {
            PriorityValve::new(Pressure::new::<psi>(1500.), Pressure::new::<psi>(2000.))
        }));

        test_bed.set_update_after_power_distribution(|valve, context| {
            valve.update(context, Pressure::new::<psi>(1800.))
        });

        test_bed.run_multiple_frames(Duration::from_secs(2));

        assert!(test_bed.query_element(|e| e.downstream_pressure() <= Pressure::new::<psi>(1500.)));
        assert!(test_bed.query_element(|e| e.downstream_pressure() >= Pressure::new::<psi>(500.)));
    }

    #[test]
    fn priority_valve_closed_with_under_threshold_pressure() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|_| {
            PriorityValve::new(Pressure::new::<psi>(1500.), Pressure::new::<psi>(2000.))
        }));

        test_bed.set_update_after_power_distribution(|valve, context| {
            valve.update(context, Pressure::new::<psi>(1450.))
        });

        test_bed.run_multiple_frames(Duration::from_secs(2));

        assert!(test_bed.query_element(|e| e.downstream_pressure() <= Pressure::new::<psi>(50.)));
        assert!(test_bed.query_element(|e| e.downstream_pressure() >= Pressure::new::<psi>(0.)));
    }

    #[test]
    fn reservoir_reports_only_gaugeable_volume() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            reservoir(
                context,
                HydraulicColor::Green,
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
                HydraulicColor::Green,
                Volume::new::<gallon>(5.),
                Volume::new::<gallon>(2.),
                Volume::new::<gallon>(5.),
            )
        }));

        test_bed.set_update_after_power_distribution(|reservoir, context| {
            reservoir.update(context, Pressure::new::<psi>(50.), &TestFluid::nominal())
        });

        test_bed.fail(FailureType::ReservoirLeak(HydraulicColor::Green));
        test_bed.run_multiple_frames(Duration::from_secs(10));

        let volume_after_leak_gallon: f64 = test_bed.read_by_name("HYD_GREEN_RESERVOIR_LEVEL");
        assert!(volume_after_leak_gallon < 4.5);
    }

    #[test]
    fn reservoir_leaking_cant_go_lower_then_0() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            reservoir(
                context,
                HydraulicColor::Green,
                Volume::new::<gallon>(5.),
                Volume::new::<gallon>(2.),
                Volume::new::<gallon>(0.5),
            )
        }));

        test_bed.set_update_after_power_distribution(|reservoir, context| {
            reservoir.update(context, Pressure::new::<psi>(50.), &TestFluid::nominal())
        });

        test_bed.fail(FailureType::ReservoirLeak(HydraulicColor::Green));
        test_bed.run_multiple_frames(Duration::from_secs(10));

        let volume_after_leak_gallon: f64 = test_bed.read_by_name("HYD_GREEN_RESERVOIR_LEVEL");
        assert!(volume_after_leak_gallon == 0.);
    }

    #[test]
    fn reservoir_empty_has_level_switch_reporting_empty() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            reservoir(
                context,
                HydraulicColor::Green,
                Volume::new::<gallon>(5.),
                Volume::new::<gallon>(2.),
                Volume::new::<gallon>(0.5),
            )
        }));

        test_bed.set_update_after_power_distribution(|reservoir, context| {
            reservoir.update(context, Pressure::new::<psi>(50.), &TestFluid::nominal())
        });

        let is_low: bool = test_bed.read_by_name("HYD_GREEN_RESERVOIR_LEVEL_IS_LOW");
        assert!(!is_low);

        test_bed.fail(FailureType::ReservoirLeak(HydraulicColor::Green));
        test_bed.run_multiple_frames(Duration::from_secs(10));

        let is_low: bool = test_bed.read_by_name("HYD_GREEN_RESERVOIR_LEVEL_IS_LOW");
        assert!(is_low);
    }

    #[test]
    fn reservoir_empty_but_inverted_has_level_switch_reporting_ok() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            reservoir(
                context,
                HydraulicColor::Green,
                Volume::new::<gallon>(5.),
                Volume::new::<gallon>(2.),
                Volume::new::<gallon>(0.01),
            )
        }));

        test_bed.set_update_after_power_distribution(|reservoir, context| {
            reservoir.update(context, Pressure::new::<psi>(50.), &TestFluid::nominal())
        });

        test_bed.run_multiple_frames(Duration::from_secs(2));

        let is_low: bool = test_bed.read_by_name("HYD_GREEN_RESERVOIR_LEVEL_IS_LOW");
        assert!(is_low);

        test_bed.write_by_name("PLANE BANK DEGREES", 180.);
        test_bed.run_multiple_frames(Duration::from_secs(2));

        let is_low: bool = test_bed.read_by_name("HYD_GREEN_RESERVOIR_LEVEL_IS_LOW");
        assert!(!is_low);
    }

    #[test]
    fn reservoir_inverted_has_around_20s_fluid_reserve() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            reservoir(
                context,
                HydraulicColor::Yellow,
                Volume::new::<gallon>(5.),
                Volume::new::<gallon>(2.),
                Volume::new::<gallon>(5.),
            )
        }))
        .with_update_after_power_distribution(|el, context| {
            el.update(context, Pressure::new::<psi>(50.), &TestFluid::nominal())
        });

        test_bed.write_by_name("PLANE BANK DEGREES", 180.);

        // 70*100ms = 7s run
        for _ in 0..70 {
            test_bed.run_with_delta(Duration::from_millis(100));
        }
        assert_about_eq!(
            test_bed
                .command_element(|r| r.try_take_volume(Volume::new::<gallon>(1.)).get::<gallon>()),
            1.
        );

        // After 30s more, no more fluid available
        // 300*100ms = 30s run
        for _ in 0..300 {
            test_bed.run_with_delta(Duration::from_millis(100));
        }

        assert_about_eq!(
            test_bed
                .command_element(|r| r.try_take_volume(Volume::new::<gallon>(1.)).get::<gallon>()),
            0.
        );

        // Can reach fluid after plane returning normal flight
        test_bed.write_by_name("PLANE BANK DEGREES", 0.);

        // After 1s
        // 10*100ms = 1s run
        for _ in 0..10 {
            test_bed.run_with_delta(Duration::from_millis(100));
        }

        assert_about_eq!(
            test_bed
                .command_element(|r| r.try_take_volume(Volume::new::<gallon>(1.)).get::<gallon>()),
            1.
        );
    }

    #[test]
    fn reservoir_receiving_heating_fluid_overheats() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            reservoir(
                context,
                HydraulicColor::Green,
                Volume::new::<gallon>(5.),
                Volume::new::<gallon>(2.),
                Volume::new::<gallon>(0.5),
            )
        }));

        test_bed.set_update_after_power_distribution(|reservoir, context| {
            reservoir.update(context, Pressure::new::<psi>(50.), &TestFluid::overheat());

            reservoir.try_take_volume(Volume::new::<gallon>(0.10));

            reservoir.add_return_volume(Volume::new::<gallon>(0.10));
        });

        test_bed.run_multiple_frames(Duration::from_secs_f64(
            Reservoir::HEATING_TIME_CONSTANT_MEAN_S + 4. * Reservoir::HEATING_TIME_CONSTANT_STD_S,
        ));

        let is_overheating: bool = test_bed.read_by_name("HYD_GREEN_RESERVOIR_OVHT");
        assert!(is_overheating);
    }

    #[test]
    fn reservoir_receiving_zero_flow_of_heating_fluid_do_not_overheat() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            reservoir(
                context,
                HydraulicColor::Green,
                Volume::new::<gallon>(5.),
                Volume::new::<gallon>(2.),
                Volume::new::<gallon>(0.5),
            )
        }));

        test_bed.set_update_after_power_distribution(|reservoir, context| {
            reservoir.update(context, Pressure::new::<psi>(50.), &TestFluid::overheat());
        });

        test_bed.run_multiple_frames(Duration::from_secs_f64(
            Reservoir::HEATING_TIME_CONSTANT_MEAN_S + 4. * Reservoir::HEATING_TIME_CONSTANT_STD_S,
        ));

        let is_overheating: bool = test_bed.read_by_name("HYD_GREEN_RESERVOIR_OVHT");
        assert!(!is_overheating);
    }

    fn section(
        context: &mut InitContext,
        loop_id: HydraulicColor,
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
            Some(LeakMeasurementValve::new(
                HydraulicCircuit::DEFAULT_LEAK_MEASUREMENT_VALVE_POWERING_BUS,
            )),
            Some(PriorityValve::new(
                Pressure::new::<psi>(1500.),
                Pressure::new::<psi>(2000.),
            )),
        )
    }

    fn reservoir(
        context: &mut InitContext,
        hyd_loop_id: HydraulicColor,
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
        loop_color: HydraulicColor,
        main_pump_number: usize,
    ) -> HydraulicCircuit {
        let reservoir = reservoir(
            context,
            loop_color,
            Volume::new::<gallon>(5.),
            Volume::new::<gallon>(4.),
            Volume::new::<gallon>(3.),
        );

        let priority_valve =
            PriorityValve::new(Pressure::new::<psi>(1500.), Pressure::new::<psi>(2000.));

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
            false,
            Pressure::new::<psi>(3000.),
            priority_valve,
            Pressure::new::<psi>(1885.),
            Volume::new::<gallon>(0.264),
        )
    }

    fn engine_driven_pump(context: &mut InitContext) -> EngineDrivenPump {
        EngineDrivenPump::new(
            context,
            AirbusEngineDrivenPumpId::Green,
            PumpCharacteristics::a320_edp(),
        )
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
