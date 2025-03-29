use crate::{
    apu::ApuGenerator,
    electrical::{ElectricalElement, Potential},
    pneumatic::{EngineModeSelector, EngineState, PneumaticValveSignal},
    simulation::UpdateContext,
};

use arinc429::Arinc429Word;
use nalgebra::Vector3;
use ntest::MaxDifference;
use num_derive::FromPrimitive;
use std::{cell::Ref, fmt::Display, time::Duration};
use uom::si::{
    angle::radian,
    f64::*,
    length::meter,
    mass_rate::kilogram_per_second,
    pressure::{hectopascal, pascal},
    ratio::ratio,
    thermodynamic_temperature::{degree_celsius, kelvin},
    velocity::knot,
    Quantity,
};

pub mod low_pass_filter;
pub mod pid;
pub mod update_iterator;

mod random;
pub use random::*;

pub mod arinc429;
pub mod arinc825;
pub mod can_bus;
pub mod power_supply_relay;

pub trait ReservoirAirPressure {
    fn green_reservoir_pressure(&self) -> Pressure;
    fn blue_reservoir_pressure(&self) -> Pressure;
    fn yellow_reservoir_pressure(&self) -> Pressure;
}

pub trait AuxiliaryPowerUnitElectrical: ControllerSignal<ContactorSignal> + ApuAvailable {
    type Generator: ApuGenerator;
    fn generator(&self, number: usize) -> &Self::Generator;
}

pub trait ApuAvailable {
    fn is_available(&self) -> bool;
}

pub trait EngineFirePushButtons {
    /// Indicates if the fire push button of the given engine is released.
    fn is_released(&self, engine_number: usize) -> bool;
}

pub trait EmergencyElectricalRatPushButton {
    fn is_pressed(&self) -> bool;
}
pub trait EmergencyElectricalState {
    fn is_in_emergency_elec(&self) -> bool;
}

pub trait ApuMaster {
    fn master_sw_is_on(&self) -> bool;
}

pub trait ApuStart {
    fn start_is_on(&self) -> bool;
}

pub trait EmergencyGeneratorControlUnit {
    fn max_allowed_power(&self) -> Power;
    fn motor_speed(&self) -> AngularVelocity;
}

pub trait ControlValveCommand {
    fn valve_position_command(&self) -> Ratio;
}

pub trait EmergencyGeneratorPower {
    fn generated_power(&self) -> Power;
}

pub trait RamAirTurbineController {
    fn should_deploy(&self) -> bool;
}

pub trait AngularSpeedSensor {
    fn speed(&self) -> AngularVelocity;
}

pub trait FeedbackPositionPickoffUnit {
    fn angle(&self) -> Angle;
}

pub trait CargoDoorLocked {
    fn fwd_cargo_door_locked(&self) -> bool;
    fn aft_cargo_door_locked(&self) -> bool;
}

pub trait LgciuWeightOnWheels {
    fn right_gear_compressed(&self, treat_ext_pwr_as_ground: bool) -> bool;
    fn right_gear_extended(&self, treat_ext_pwr_as_ground: bool) -> bool;

    fn left_gear_compressed(&self, treat_ext_pwr_as_ground: bool) -> bool;
    fn left_gear_extended(&self, treat_ext_pwr_as_ground: bool) -> bool;

    fn left_and_right_gear_compressed(&self, treat_ext_pwr_as_ground: bool) -> bool;
    fn left_and_right_gear_extended(&self, treat_ext_pwr_as_ground: bool) -> bool;

    fn nose_gear_compressed(&self, treat_ext_pwr_as_ground: bool) -> bool;
    fn nose_gear_extended(&self, treat_ext_pwr_as_ground: bool) -> bool;
}
pub trait LgciuGearExtension {
    fn all_down_and_locked(&self) -> bool;
    fn all_up_and_locked(&self) -> bool;
    fn main_down_and_locked(&self) -> bool;
    fn main_up_and_locked(&self) -> bool;
    fn nose_down_and_locked(&self) -> bool;
    fn nose_up_and_locked(&self) -> bool;
}

pub trait LgciuDoorPosition {
    fn all_fully_opened(&self) -> bool;
    fn all_closed_and_locked(&self) -> bool;
}

pub trait LgciuGearControl {
    fn should_open_doors(&self) -> bool;
    fn should_extend_gears(&self) -> bool;
    fn control_active(&self) -> bool;
}

pub trait LandingGearHandle {
    fn gear_handle_is_down(&self) -> bool;
    fn gear_handle_baulk_locked(&self) -> bool;
}

pub trait TrimmableHorizontalStabilizer {
    fn trim_angle(&self) -> Angle;
}

pub trait LgciuInterface:
    LgciuWeightOnWheels + LgciuGearExtension + LgciuDoorPosition + LgciuGearControl + LandingGearHandle
{
}

pub trait ReverserPosition {
    fn reverser_position(&self) -> Ratio;
}

#[derive(Copy, Clone, PartialEq, Eq, Debug)]
#[repr(usize)]
pub enum LgciuId {
    Lgciu1 = 0,
    Lgciu2 = 1,
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum ProximityDetectorId {
    UplockGearNose1,
    UplockGearNose2,
    UplockGearLeft1,
    UplockGearLeft2,
    UplockGearRight1,
    UplockGearRight2,
    DownlockGearNose1,
    DownlockGearNose2,
    DownlockGearLeft1,
    DownlockGearLeft2,
    DownlockGearRight1,
    DownlockGearRight2,

    UplockDoorNose1,
    UplockDoorNose2,
    UplockDoorLeft1,
    UplockDoorLeft2,
    UplockDoorRight1,
    UplockDoorRight2,
    DownlockDoorNose1,
    DownlockDoorNose2,
    DownlockDoorLeft1,
    DownlockDoorLeft2,
    DownlockDoorRight1,
    DownlockDoorRight2,
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum GearActuatorId {
    GearNose,
    GearDoorNose,
    GearLeft,
    GearDoorLeft,
    GearRight,
    GearDoorRight,
}

pub trait EngineCorrectedN1 {
    fn corrected_n1(&self) -> Ratio;
}

pub trait EngineCorrectedN2 {
    fn corrected_n2(&self) -> Ratio;
}

pub trait EngineUncorrectedN2 {
    fn uncorrected_n2(&self) -> Ratio;
}

pub trait CabinAltitude {
    fn altitude(&self) -> Length;
}

pub trait CabinSimulation {
    fn cabin_temperature(&self) -> Vec<ThermodynamicTemperature>;
    fn exterior_pressure(&self) -> Pressure {
        Pressure::new::<hectopascal>(1013.25)
    }
    fn cabin_pressure(&self) -> Pressure {
        Pressure::new::<hectopascal>(1013.25)
    }
}

pub trait PneumaticBleed {
    fn apu_bleed_is_on(&self) -> bool;
    fn engine_crossbleed_is_on(&self) -> bool;
}

pub trait EngineStartState {
    fn engine_state(&self, engine_number: usize) -> EngineState;
    fn engine_mode_selector(&self) -> EngineModeSelector;
}

pub trait EngineBleedPushbutton<const N: usize> {
    fn engine_bleed_pushbuttons_are_auto(&self) -> [bool; N];
}

pub trait PackFlowValveState {
    /// Pack flow valve id is 1, 2, 3 or 4
    fn pack_flow_valve_is_open(&self, pack_id: usize) -> bool;
    fn pack_flow_valve_air_flow(&self, pack_id: usize) -> MassRate;
    fn pack_flow_valve_inlet_pressure(&self, pack_id: usize) -> Option<Pressure>;
}

pub trait AdirsMeasurementOutputs {
    fn is_fully_aligned(&self, adiru_number: usize) -> bool;
    fn latitude(&self, adiru_number: usize) -> Arinc429Word<Angle>;
    fn longitude(&self, adiru_number: usize) -> Arinc429Word<Angle>;
    fn heading(&self, adiru_number: usize) -> Arinc429Word<Angle>;
    fn true_heading(&self, adiru_number: usize) -> Arinc429Word<Angle>;
    fn vertical_speed(&self, adiru_number: usize) -> Arinc429Word<Velocity>;
    fn altitude(&self, adiru_number: usize) -> Arinc429Word<Length>;
    fn angle_of_attack(&self, adiru_number: usize) -> Arinc429Word<Angle>;
}

pub trait AdirsDiscreteOutputs {
    fn low_speed_warning_1(&self, adiru_number: usize) -> bool;
    fn low_speed_warning_2(&self, adiru_number: usize) -> bool;
    fn low_speed_warning_3(&self, adiru_number: usize) -> bool;
    fn low_speed_warning_4(&self, adiru_number: usize) -> bool;
}

pub enum GearWheel {
    NOSE = 0,
    LEFT = 1,
    RIGHT = 2,
    WINGLEFT = 3,
    WINGRIGHT = 4,
}

pub trait SectionPressure {
    fn pressure(&self) -> Pressure;
    fn pressure_downstream_leak_valve(&self) -> Pressure;
    fn pressure_downstream_priority_valve(&self) -> Pressure;
    fn is_pressure_switch_pressurised(&self) -> bool;
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum HydraulicColor {
    Green,
    Blue,
    Yellow,
}
impl Display for HydraulicColor {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Green => write!(f, "GREEN"),
            Self::Blue => write!(f, "BLUE"),
            Self::Yellow => write!(f, "YELLOW"),
        }
    }
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum AirbusEngineDrivenPumpId {
    Edp1a,
    Edp1b,
    Edp2a,
    Edp2b,
    Edp3a,
    Edp3b,
    Edp4a,
    Edp4b,
    Green,
    Yellow,
}
impl Display for AirbusEngineDrivenPumpId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AirbusEngineDrivenPumpId::Edp1a => write!(f, "GREEN_1A"),
            AirbusEngineDrivenPumpId::Edp1b => write!(f, "GREEN_1B"),
            AirbusEngineDrivenPumpId::Edp2a => write!(f, "GREEN_2A"),
            AirbusEngineDrivenPumpId::Edp2b => write!(f, "GREEN_2B"),
            AirbusEngineDrivenPumpId::Edp3a => write!(f, "YELLOW_3A"),
            AirbusEngineDrivenPumpId::Edp3b => write!(f, "YELLOW_3B"),
            AirbusEngineDrivenPumpId::Edp4a => write!(f, "YELLOW_4A"),
            AirbusEngineDrivenPumpId::Edp4b => write!(f, "YELLOW_4B"),
            AirbusEngineDrivenPumpId::Green => write!(f, "GREEN"),
            AirbusEngineDrivenPumpId::Yellow => write!(f, "YELLOW"),
        }
    }
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum AirbusElectricPumpId {
    GreenA,
    GreenB,
    YellowA,
    YellowB,
    Green,
    Blue,
    Yellow,
    GreenAux,
}
impl Display for AirbusElectricPumpId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AirbusElectricPumpId::GreenA => write!(f, "GA"),
            AirbusElectricPumpId::YellowA => write!(f, "YA"),
            AirbusElectricPumpId::GreenB => write!(f, "GB"),
            AirbusElectricPumpId::YellowB => write!(f, "YB"),
            AirbusElectricPumpId::Green => write!(f, "GREEN"),
            AirbusElectricPumpId::Blue => write!(f, "BLUE"),
            AirbusElectricPumpId::Yellow => write!(f, "YELLOW"),
            AirbusElectricPumpId::GreenAux => write!(f, "GREEN_AUX"),
        }
    }
}

/// Access to all aircraft surfaces positions
pub trait SurfacesPositions {
    fn left_spoilers_positions(&self) -> &[f64];
    fn right_spoilers_positions(&self) -> &[f64];
    fn left_ailerons_positions(&self) -> &[f64];
    fn right_ailerons_positions(&self) -> &[f64];
    fn left_flaps_position(&self) -> f64;
    fn right_flaps_position(&self) -> f64;
}

/// The common types of electrical buses within Airbus aircraft.
/// These include types such as AC, DC, AC ESS, etc.
#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
pub enum ElectricalBusType {
    AlternatingCurrent(u8),
    AlternatingCurrentEssential,
    AlternatingCurrentEssentialShed,
    AlternatingCurrentStaticInverter,
    AlternatingCurrentGndFltService,
    AlternatingCurrentNamed(&'static str),
    DirectCurrent(u8),
    DirectCurrentEssential,
    DirectCurrentEssentialShed,
    DirectCurrentBattery,
    DirectCurrentHot(u8),
    DirectCurrentGndFltService,
    DirectCurrentNamed(&'static str),

    /// A sub bus is a subsection of a larger bus. An example of
    /// a sub bus is the A320's 202PP, which is a sub bus of DC BUS 2 (2PP).
    ///
    /// Sub buses represent a very small area of the electrical system. To keep things simple,
    /// they shouldn't be used for the vast majority of situations. Thus, prefer using a main
    /// bus over a sub bus. They do however come in handy when handling very specific situations,
    /// such as the APU STARTER MOTOR which is powered by a smaller section of the DC BAT BUS on the A320.
    /// Implementing this without a sub bus leads to additional work and reduces the commonality in
    /// handling the flow of electricity. In such cases, use the sub bus.
    ///
    /// As sub buses represent such a small area, their state is not exported towards
    /// the simulator.
    Sub(&'static str),

    /// A virtual bus is a bus which exists to help to provide a more realistic simulation
    /// but doesn't exist in the real plane.
    /// It's used for example to simulate that a device is powered by multiple powersources.
    Virtual(&'static str),
}
impl Display for ElectricalBusType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ElectricalBusType::AlternatingCurrent(number) => write!(f, "AC_{}", number),
            ElectricalBusType::AlternatingCurrentEssential => write!(f, "AC_ESS"),
            ElectricalBusType::AlternatingCurrentEssentialShed => write!(f, "AC_ESS_SHED"),
            ElectricalBusType::AlternatingCurrentStaticInverter => write!(f, "AC_STAT_INV"),
            ElectricalBusType::AlternatingCurrentGndFltService => write!(f, "AC_GND_FLT_SVC"),
            ElectricalBusType::AlternatingCurrentNamed(name) => write!(f, "{}", name),
            ElectricalBusType::DirectCurrent(number) => write!(f, "DC_{}", number),
            ElectricalBusType::DirectCurrentEssential => write!(f, "DC_ESS"),
            ElectricalBusType::DirectCurrentEssentialShed => write!(f, "DC_ESS_SHED"),
            ElectricalBusType::DirectCurrentBattery => write!(f, "DC_BAT"),
            ElectricalBusType::DirectCurrentHot(number) => write!(f, "DC_HOT_{}", number),
            ElectricalBusType::DirectCurrentGndFltService => write!(f, "DC_GND_FLT_SVC"),
            ElectricalBusType::DirectCurrentNamed(name) => write!(f, "{}", name),
            ElectricalBusType::Sub(name) => write!(f, "SUB_{}", name),
            ElectricalBusType::Virtual(name) => write!(f, "VIRTUAL_{name}"),
        }
    }
}

/// Trait through which elements can query the potential and powered state
/// of electrical buses.
pub trait ElectricalBuses {
    /// Returns the potential which is fed to the given bus type.
    fn potential_of(&self, bus_type: ElectricalBusType) -> Ref<Potential>;

    /// Returns whether the given bus type is powered.
    fn is_powered(&self, bus_type: ElectricalBusType) -> bool;

    /// Returns whether any of the given bus types are powered.
    fn any_is_powered(&self, bus_types: &[ElectricalBusType]) -> bool;
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum PotentialOrigin {
    EngineGenerator(usize),
    ApuGenerator(usize),
    External,
    EmergencyGenerator,
    Battery(usize),
    TransformerRectifier(usize),
    StaticInverter,
}
impl Display for PotentialOrigin {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PotentialOrigin::EngineGenerator(number) => write!(f, "EngineGenerator({})", number),
            PotentialOrigin::ApuGenerator(number) => write!(f, "ApuGenerator({})", number),
            PotentialOrigin::External => write!(f, "ExternalPower"),
            PotentialOrigin::EmergencyGenerator => write!(f, "EmergencyGenerator"),
            PotentialOrigin::Battery(number) => write!(f, "Battery({})", number),
            PotentialOrigin::TransformerRectifier(number) => {
                write!(f, "TransformerRectifier({})", number)
            }
            PotentialOrigin::StaticInverter => write!(f, "StaticInverter"),
        }
    }
}

/// Trait through which elements can query the power consumed throughout the aircraft.
pub trait PowerConsumptionReport {
    /// Returns whether or not the given element is powered.
    fn is_powered(&self, element: &impl ElectricalElement) -> bool;

    /// Returns the total power consumed from the given [PotentialOrigin].
    fn total_consumption_of(&self, potential_origin: PotentialOrigin) -> Power;
}

/// Trait through which elements can consume power from the aircraft's electrical system.
pub trait ConsumePower: PowerConsumptionReport {
    /// Returns the input potential of the given element.
    fn input_of(&self, element: &impl ElectricalElement) -> Ref<Potential>;

    /// Consumes the given amount of power from the potential provided to the element.
    fn consume_from_input(&mut self, element: &impl ElectricalElement, power: Power);

    /// Consumes the given amount of power from the provided electrical bus.
    fn consume_from_bus(&mut self, bus_type: ElectricalBusType, power: Power);
}

pub trait ControllerSignal<S> {
    fn signal(&self) -> Option<S>;
}
#[macro_export]
macro_rules! valve_signal_implementation {
    ($signal_type: ty) => {
        impl PneumaticValveSignal for $signal_type {
            fn new(target_open_amount: Ratio) -> Self {
                Self { target_open_amount }
            }

            fn target_open_amount(&self) -> Ratio {
                self.target_open_amount
            }
        }
    };
}

#[derive(Clone, Copy)]
pub struct ApuBleedAirValveSignal {
    target_open_amount: Ratio,
}

valve_signal_implementation!(ApuBleedAirValveSignal);

pub trait PneumaticValve {
    fn is_open(&self) -> bool;
}

pub enum ContactorSignal {
    Open,
    Close,
}

#[derive(FromPrimitive)]
pub(crate) enum FwcFlightPhase {
    ElecPwr = 1,
    FirstEngineStarted = 2,
    FirstEngineTakeOffPower = 3,
    AtOrAboveEightyKnots = 4,
    LiftOff = 5,
    AtOrAbove1500Feet = 6,
    AtOrBelow800Feet = 7,
    TouchDown = 8,
    AtOrBelowEightyKnots = 9,
    EnginesShutdown = 10,
}

/// The delay logic gate delays the true result of a given expression by the given amount of time.
/// False results are output immediately.
pub struct DelayedTrueLogicGate {
    delay: Duration,
    expression_result: bool,
    true_duration: Duration,
}
impl DelayedTrueLogicGate {
    pub fn new(delay: Duration) -> DelayedTrueLogicGate {
        DelayedTrueLogicGate {
            delay,
            expression_result: false,
            true_duration: Duration::from_millis(0),
        }
    }

    pub fn starting_as(mut self, state: bool) -> Self {
        self.set_output(state);
        self
    }

    fn set_output(&mut self, state: bool) {
        self.expression_result = state;
        if state {
            self.true_duration = self.delay;
        } else {
            self.true_duration = Duration::from_millis(0)
        }
    }

    pub fn update(&mut self, context: &UpdateContext, expression_result: bool) {
        if expression_result {
            self.true_duration += context.delta();
        } else {
            self.true_duration = Duration::from_millis(0);
        }

        self.expression_result = expression_result;
    }

    pub fn output(&self) -> bool {
        self.expression_result && self.delay <= self.true_duration
    }
}

/// The delay pulse logic gate delays the true result of a given expression by the given amount of time.
/// True will be set as output when time delay is over for one update only, then false.
/// False results are output immediately.
pub struct DelayedPulseTrueLogicGate {
    output: bool,
    last_gate_output: bool,
    true_delayed_gate: DelayedTrueLogicGate,
}
impl DelayedPulseTrueLogicGate {
    pub fn new(delay: Duration) -> DelayedPulseTrueLogicGate {
        DelayedPulseTrueLogicGate {
            output: false,
            last_gate_output: false,
            true_delayed_gate: DelayedTrueLogicGate::new(delay),
        }
    }

    pub fn starting_as(mut self, state: bool, output: bool) -> Self {
        self.output = output;
        self.last_gate_output = !output;
        self.true_delayed_gate.set_output(state);
        self
    }

    pub fn update(&mut self, context: &UpdateContext, expression_result: bool) {
        self.true_delayed_gate.update(context, expression_result);

        let gate_out = self.true_delayed_gate.output();

        self.output = gate_out && !self.last_gate_output;
        self.last_gate_output = gate_out;
    }

    pub fn output(&self) -> bool {
        self.output
    }
}

/// The delay logic gate delays the false result of a given expression by the given amount of time.
/// True results are output immediately. Starts with a false result state.
pub struct DelayedFalseLogicGate {
    delay: Duration,
    expression_result: bool,
    false_duration: Duration,
}
impl DelayedFalseLogicGate {
    pub fn new(delay: Duration) -> Self {
        Self {
            delay,
            expression_result: false,
            false_duration: delay,
        }
    }

    pub fn update(&mut self, context: &UpdateContext, expression_result: bool) {
        if !expression_result {
            self.false_duration += context.delta();
        } else {
            self.false_duration = Duration::from_millis(0);
        }

        self.expression_result = expression_result;
    }

    pub fn output(&self) -> bool {
        self.expression_result || self.delay > self.false_duration
    }
}

/// The latched logic gate latches the true result of a given expression.
/// As soon as the output is true it stays true until it is reset.
#[derive(Default)]
pub struct LatchedTrueLogicGate {
    expression_result: bool,
}
impl LatchedTrueLogicGate {
    pub fn update(&mut self, expression_result: bool) {
        self.expression_result = self.expression_result || expression_result;
    }

    pub fn reset(&mut self) {
        self.expression_result = false;
    }

    pub fn output(&self) -> bool {
        self.expression_result
    }
}

/// Given a current and target temperature, takes a coefficient and delta to
/// determine the new temperature after a certain duration has passed.
pub(crate) fn calculate_towards_target_temperature(
    current: ThermodynamicTemperature,
    target: ThermodynamicTemperature,
    coefficient: f64,
    delta: Duration,
) -> ThermodynamicTemperature {
    if current == target {
        current
    } else if current > target {
        ThermodynamicTemperature::new::<degree_celsius>(
            (current.get::<degree_celsius>() - (coefficient * delta.as_secs_f64()))
                .max(target.get::<degree_celsius>()),
        )
    } else {
        ThermodynamicTemperature::new::<degree_celsius>(
            (current.get::<degree_celsius>() + (coefficient * delta.as_secs_f64()))
                .min(target.get::<degree_celsius>()),
        )
    }
}

// Interpolate values_map_y at point value_at_point in breakpoints break_points_x
pub fn interpolation(xs: &[f64], ys: &[f64], intermediate_x: f64) -> f64 {
    debug_assert!(xs.len() == ys.len());
    debug_assert!(xs.len() >= 2);
    debug_assert!(ys.len() >= 2);

    if intermediate_x <= xs[0] {
        *ys.first().unwrap()
    } else if intermediate_x >= xs[xs.len() - 1] {
        *ys.last().unwrap()
    } else {
        let mut idx: usize = 1;

        while idx < xs.len() - 1 {
            if intermediate_x < xs[idx] {
                break;
            }
            idx += 1;
        }

        ys[idx - 1]
            + (intermediate_x - xs[idx - 1]) / (xs[idx] - xs[idx - 1]) * (ys[idx] - ys[idx - 1])
    }
}

/// Converts a given `bool` value into an `f64` representing that boolean value in the simulator.
pub fn from_bool(value: bool) -> f64 {
    if value {
        1.0
    } else {
        0.0
    }
}

pub fn to_bool(value: f64) -> bool {
    (value - 1.).abs() < f64::EPSILON
}

/// Normalise angle degrees value between 0 and 360
pub fn normalise_angle(angle_degrees: f64) -> f64 {
    let raw = angle_degrees % 360.;

    if raw >= 0. {
        raw
    } else {
        raw + 360.
    }
}

/// Returns the height over the ground of any point of the plane considering its current attitude
/// Offset parameter is the position of the point in plane reference with respect to datum reference point
/// X positive from left to right
/// Y positive from down to up
/// Z positive from aft to front
pub fn height_over_ground(
    context: &UpdateContext,
    offset_from_plane_reference: Vector3<f64>,
) -> Length {
    let offset_including_plane_rotation = context.attitude().pitch_rotation_transform()
        * (context.attitude().bank_rotation_transform().inverse() * offset_from_plane_reference);

    Length::new::<meter>(offset_including_plane_rotation[1]) + context.plane_height_over_ground()
}

// Gets the local acceleration at a point away from plane reference point, including rotational effects (tangential/centripetal)
// Warning: It EXLCLUDES PLANE LOCAL CG ACCELERATION. Add to plane acceleration to have total local acceleration at this point
//
// For reference rotational velocity and acceleration from MSFS are:
//      X axis pitch up negative
//      Y axis yaw left negative
//      Z axis roll right negative
//
// Acceleration returned is local to plane reference with
//      X negative left positive right
//      Y negative down positive up
//      Z negative aft positive forward
pub fn local_acceleration_at_plane_coordinate(
    context: &UpdateContext,
    offset_from_plane_reference: Vector3<f64>,
) -> Vector3<f64> {
    // If less than 10cm from center of rotation we don't consider rotational effect
    if offset_from_plane_reference.norm() < 0.01 {
        return Vector3::default();
    }

    let tangential_velocity_of_point =
        offset_from_plane_reference.cross(&-context.rotation_velocity_rad_s());
    let tangential_acceleration_of_point =
        offset_from_plane_reference.cross(&-context.rotation_acceleration_rad_s2());

    let radial_norm_vector = -offset_from_plane_reference.normalize();

    let centripetal_acceleration = radial_norm_vector
        * (tangential_velocity_of_point.norm().powi(2) / offset_from_plane_reference.norm());

    centripetal_acceleration + tangential_acceleration_of_point
}

/// Gives the steering angle for a wheel that would freely caster if plane is rotating on yaw axis
pub fn steering_angle_from_plane_yaw_rate(
    context: &UpdateContext,
    wheel_distance_to_rotation_center: Length,
) -> Angle {
    if context.local_velocity().to_ms_vector()[2].abs() > 0.01 {
        Angle::new::<radian>(
            (wheel_distance_to_rotation_center.get::<meter>()
                * context.rotation_velocity_rad_s()[1]
                / context.local_velocity().to_ms_vector()[2])
                .atan(),
        )
    } else {
        Angle::default()
    }
}

pub struct InternationalStandardAtmosphere;
impl InternationalStandardAtmosphere {
    const TEMPERATURE_LAPSE_RATE: f64 = 0.0065;
    const GAS_CONSTANT_DRY_AIR: f64 = 287.04;
    const GRAVITY_ACCELERATION: f64 = 9.807;
    const GROUND_PRESSURE_PASCAL: f64 = 101325.;
    const GROUND_TEMPERATURE_KELVIN: f64 = 288.15;

    /// The sea level pressure on a standard day
    pub fn ground_pressure() -> Pressure {
        Pressure::new::<pascal>(Self::GROUND_PRESSURE_PASCAL)
    }

    pub fn pressure_at_altitude(altitude: Length) -> Pressure {
        Self::ground_pressure()
            * (1.
                - Self::TEMPERATURE_LAPSE_RATE * altitude.get::<meter>()
                    / Self::GROUND_TEMPERATURE_KELVIN)
                .powf(
                    Self::GRAVITY_ACCELERATION
                        / Self::GAS_CONSTANT_DRY_AIR
                        / Self::TEMPERATURE_LAPSE_RATE,
                )
    }

    pub fn altitude_from_pressure(pressure: Pressure) -> Length {
        Length::new::<meter>(
            Self::GROUND_TEMPERATURE_KELVIN
                / ((pressure.get::<pascal>() / Self::GROUND_PRESSURE_PASCAL).powf(
                    -Self::TEMPERATURE_LAPSE_RATE * Self::GAS_CONSTANT_DRY_AIR
                        / Self::GRAVITY_ACCELERATION,
                ))
                - Self::GROUND_TEMPERATURE_KELVIN,
        ) / (-Self::TEMPERATURE_LAPSE_RATE)
    }

    /// The sea level temperature on a standard day
    pub fn ground_temperature() -> ThermodynamicTemperature {
        ThermodynamicTemperature::new::<kelvin>(Self::GROUND_TEMPERATURE_KELVIN)
    }

    pub fn temperature_at_altitude(altitude: Length) -> ThermodynamicTemperature {
        ThermodynamicTemperature::new::<kelvin>(
            Self::GROUND_TEMPERATURE_KELVIN
                - Self::TEMPERATURE_LAPSE_RATE * altitude.get::<meter>(),
        )
    }
}

/// The ratio of flow velocity past a boundary to the local speed of sound.
#[derive(Clone, Copy, Default, Debug, PartialEq, PartialOrd)]
pub struct MachNumber(pub f64);

impl From<f64> for MachNumber {
    fn from(value: f64) -> Self {
        MachNumber(value)
    }
}

impl From<MachNumber> for f64 {
    fn from(value: MachNumber) -> Self {
        value.0
    }
}

impl MaxDifference for MachNumber {
    fn max_diff(self, other: Self) -> f64 {
        (f64::from(self) - f64::from(other)).abs()
    }
}

impl MachNumber {
    // All formulas from Jet Transport Performance Methods by Boeing (March 2009 revision)

    /// Get the ratio to standard sea level pressure for a given pressure
    fn delta(air_pressure: Pressure) -> Ratio {
        air_pressure / InternationalStandardAtmosphere::ground_pressure()
    }

    /// Get the ratio to standard sea level temperature for a given temperature
    fn theta(temperature: ThermodynamicTemperature) -> Ratio {
        temperature / InternationalStandardAtmosphere::ground_temperature()
    }

    /// Convert the mach number to a calibrated airspeed for a given atmospheric pressure.
    pub fn to_cas(self, air_pressure: Pressure) -> Velocity {
        Velocity::new::<knot>(
            1479.1
                * ((MachNumber::delta(air_pressure).get::<ratio>()
                    * ((0.2 * self.0.powi(2) + 1.).powf(3.5) - 1.)
                    + 1.)
                    .powf(1. / 3.5)
                    - 1.)
                    .sqrt(),
        )
    }

    /// Convert the mach number to an equivalent airspeed for a given atmospheric pressure.
    pub fn to_eas(self, air_pressure: Pressure) -> Velocity {
        Velocity::new::<knot>(
            661.4786 * self.0 * MachNumber::delta(air_pressure).get::<ratio>().sqrt(),
        )
    }

    /// Convert the mach number to a true airspeed for a given temperature.
    pub fn to_tas(self, temperature: ThermodynamicTemperature) -> Velocity {
        Velocity::new::<knot>(
            661.4786 * self.0 * MachNumber::theta(temperature).get::<ratio>().sqrt(),
        )
    }

    /// Convert a calibrated airspeed in a given atmosphere to a mach number
    pub fn from_cas(cas: Velocity, air_pressure: Pressure) -> Self {
        MachNumber(
            (5. * ((((1. + 0.2 * (cas.get::<knot>() / 661.4786).powi(2)).powf(3.5) - 1.)
                / MachNumber::delta(air_pressure).get::<ratio>()
                + 1.)
                .powf(1. / 3.5)
                - 1.))
                .sqrt(),
        )
    }

    /// Convert an equivalent airspeed in a given atmosphere to a mach number
    pub fn from_eas(eas: Velocity, air_pressure: Pressure) -> Self {
        MachNumber(
            eas.get::<knot>() / 661.4786
                * (1. / MachNumber::delta(air_pressure).get::<ratio>()).sqrt(),
        )
    }

    /// Convert a true airspeed in a given atmosphere to a mach number
    pub fn from_tas(tas: Velocity, temperature: ThermodynamicTemperature) -> Self {
        MachNumber(
            tas.get::<knot>() / (661.4786 * MachNumber::theta(temperature).get::<ratio>().sqrt()),
        )
    }
}

pub trait AverageExt: Iterator {
    fn average<M>(self) -> M
    where
        M: Average<Self::Item>,
        Self: Sized,
    {
        M::average(self)
    }
}

impl<I: Iterator> AverageExt for I {}

pub trait Average<A = Self> {
    fn average<I>(iter: I) -> Self
    where
        I: Iterator<Item = A>;
}

impl Average for Pressure {
    fn average<I>(iter: I) -> Self
    where
        I: Iterator<Item = Pressure>,
    {
        let mut sum = 0.0;
        let mut count: usize = 0;

        for v in iter {
            sum += v.get::<hectopascal>();
            count += 1;
        }

        Pressure::new::<hectopascal>(if count > 0 { sum / (count as f64) } else { 0. })
    }
}

impl Average for MassRate {
    fn average<I>(iter: I) -> Self
    where
        I: Iterator<Item = MassRate>,
    {
        let mut sum = 0.0;
        let mut count: usize = 0;

        for v in iter {
            sum += v.get::<kilogram_per_second>();
            count += 1;
        }

        MassRate::new::<kilogram_per_second>(if count > 0 { sum / (count as f64) } else { 0. })
    }
}

impl Average for ThermodynamicTemperature {
    fn average<I>(iter: I) -> Self
    where
        I: Iterator<Item = ThermodynamicTemperature>,
    {
        let mut sum = 0.0;
        let mut count: usize = 0;

        for v in iter {
            sum += v.get::<kelvin>();
            count += 1;
        }

        ThermodynamicTemperature::new::<kelvin>(if count > 0 { sum / (count as f64) } else { 0. })
    }
}

impl Average for Ratio {
    fn average<I>(iter: I) -> Self
    where
        I: Iterator<Item = Ratio>,
    {
        let mut sum = 0.0;
        let mut count: usize = 0;

        for v in iter {
            sum += v.get::<ratio>();
            count += 1;
        }

        Ratio::new::<ratio>(if count > 0 { sum / (count as f64) } else { 0. })
    }
}

impl<'a> Average<&'a Pressure> for Pressure {
    fn average<I>(iter: I) -> Self
    where
        I: Iterator<Item = &'a Pressure>,
    {
        iter.copied().average()
    }
}

impl<'a> Average<&'a MassRate> for MassRate {
    fn average<I>(iter: I) -> Self
    where
        I: Iterator<Item = &'a MassRate>,
    {
        iter.copied().average()
    }
}

impl<'a> Average<&'a ThermodynamicTemperature> for ThermodynamicTemperature {
    fn average<I>(iter: I) -> Self
    where
        I: Iterator<Item = &'a ThermodynamicTemperature>,
    {
        iter.copied().average()
    }
}

impl<'a> Average<&'a Ratio> for Ratio {
    fn average<I>(iter: I) -> Self
    where
        I: Iterator<Item = &'a Ratio>,
    {
        iter.copied().average()
    }
}

pub trait Resolution {
    fn resolution(self, resolution: f64) -> f64;
}

impl Resolution for f64 {
    fn resolution(self, resolution: f64) -> f64 {
        (self / resolution).round() * resolution
    }
}

#[derive(Clone, Copy, Eq, PartialEq)]
pub enum FireDetectionZone {
    Engine(usize),
    Apu,
    Mlg,
}

impl Display for FireDetectionZone {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            FireDetectionZone::Apu => write!(f, "APU"),
            FireDetectionZone::Mlg => write!(f, "MLG"),
            FireDetectionZone::Engine(number) => write!(f, "{}", number),
        }
    }
}

#[derive(Clone, Copy, Eq, PartialEq)]
pub enum FireDetectionLoopID {
    A,
    B,
}

pub trait Clamp {
    /// Restrict a value to a certain interval unless it is NaN.
    ///
    /// Returns `max` if `self` is greater than `max`, and `min` if `self` is
    /// less than `min`. Otherwise this returns `self`.
    ///
    /// Note that this function returns NaN if the initial value was NaN as
    /// well.
    ///
    /// # Panics
    ///
    /// Panics if `min > max`, `min` is NaN, or `max` is NaN.
    fn clamp(self, min: Self, max: Self) -> Self;
}

// TODO: remove when uom implements clamp on floating point quantities
impl<D: uom::si::Dimension + ?Sized, U: uom::si::Units<f64> + ?Sized> Clamp
    for Quantity<D, U, f64>
{
    fn clamp(mut self, min: Self, max: Self) -> Self {
        assert!(
            min <= max,
            "min > max, or either was NaN. min = {min:?}, max = {max:?}"
        );
        if self < min {
            self = min;
        }
        if self > max {
            self = max;
        }
        self
    }
}

#[cfg(test)]
mod delayed_true_logic_gate_tests {
    use super::*;
    use crate::electrical::Electricity;
    use crate::simulation::test::{SimulationTestBed, TestBed};
    use crate::simulation::{Aircraft, SimulationElement};

    struct TestAircraft {
        gate: DelayedTrueLogicGate,
        expression_result: bool,
    }
    impl TestAircraft {
        fn new(gate: DelayedTrueLogicGate) -> Self {
            Self {
                gate,
                expression_result: false,
            }
        }

        fn set_expression(&mut self, value: bool) {
            self.expression_result = value;
        }

        fn gate_output(&self) -> bool {
            self.gate.output()
        }
    }
    impl Aircraft for TestAircraft {
        fn update_before_power_distribution(
            &mut self,
            context: &UpdateContext,
            _: &mut Electricity,
        ) {
            self.gate.update(context, self.expression_result);
        }
    }
    impl SimulationElement for TestAircraft {}

    #[test]
    fn when_the_expression_is_false_returns_false() {
        let mut test_bed = SimulationTestBed::new(|_| {
            TestAircraft::new(DelayedTrueLogicGate::new(Duration::from_millis(100)))
        });

        test_bed.run_with_delta(Duration::from_millis(0));
        test_bed.run();

        assert!(!test_bed.query(|a| a.gate_output()));
    }

    #[test]
    fn when_the_expression_is_true_and_delay_hasnt_passed_returns_false() {
        let mut test_bed = SimulationTestBed::new(|_| {
            TestAircraft::new(DelayedTrueLogicGate::new(Duration::from_millis(10_000)))
        });

        test_bed.command(|a| a.set_expression(true));

        test_bed.run_with_delta(Duration::from_millis(0));
        test_bed.run();

        assert!(!test_bed.query(|a| a.gate_output()));
    }

    #[test]
    fn when_the_expression_is_true_and_delay_has_passed_returns_true() {
        let mut test_bed = SimulationTestBed::new(|_| {
            TestAircraft::new(DelayedTrueLogicGate::new(Duration::from_millis(100)))
        });

        test_bed.command(|a| a.set_expression(true));

        test_bed.run_with_delta(Duration::from_millis(0));
        test_bed.run();

        assert!(test_bed.query(|a| a.gate_output()));
    }

    #[test]
    fn when_the_expression_is_true_and_becomes_false_before_delay_has_passed_returns_false_once_delay_passed(
    ) {
        let mut test_bed = SimulationTestBed::new(|_| {
            TestAircraft::new(DelayedTrueLogicGate::new(Duration::from_millis(1_000)))
        });

        test_bed.command(|a| a.set_expression(true));
        test_bed.run_with_delta(Duration::from_millis(0));
        test_bed.run_with_delta(Duration::from_millis(800));

        test_bed.command(|a| a.set_expression(false));
        test_bed.run_with_delta(Duration::from_millis(100));
        test_bed.run_with_delta(Duration::from_millis(200));

        assert!(!test_bed.query(|a| a.gate_output()));
    }

    #[test]
    fn when_the_expression_is_true_and_delay_hasnt_passed_starting_as_true_returns_true() {
        let mut test_bed = SimulationTestBed::new(|_| {
            TestAircraft::new(
                DelayedTrueLogicGate::new(Duration::from_millis(1_000)).starting_as(true),
            )
        });

        test_bed.command(|a| a.set_expression(true));

        test_bed.run_with_delta(Duration::from_millis(0));
        test_bed.run();

        assert!(test_bed.query(|a| a.gate_output()));
    }

    #[test]
    fn when_the_expression_is_true_and_delay_has_passed_starting_as_true_returns_true() {
        let mut test_bed = SimulationTestBed::new(|_| {
            TestAircraft::new(
                DelayedTrueLogicGate::new(Duration::from_millis(1_000)).starting_as(true),
            )
        });

        test_bed.command(|a| a.set_expression(true));

        test_bed.run_with_delta(Duration::from_millis(1_500));
        test_bed.run();

        assert!(test_bed.query(|a| a.gate_output()));
    }

    #[test]
    fn when_the_expression_is_true_and_becomes_false_before_delay_has_passed_returns_false_even_when_starting_as_true(
    ) {
        let mut test_bed = SimulationTestBed::new(|_| {
            TestAircraft::new(
                DelayedTrueLogicGate::new(Duration::from_millis(1_000)).starting_as(true),
            )
        });

        test_bed.command(|a| a.set_expression(true));
        test_bed.run_with_delta(Duration::from_millis(0));
        test_bed.command(|a| a.set_expression(false));
        test_bed.run();

        assert!(!test_bed.query(|a| a.gate_output()));
    }
}

#[cfg(test)]
mod delayed_false_logic_gate_tests {
    use super::*;
    use crate::electrical::Electricity;
    use crate::simulation::test::{SimulationTestBed, TestBed};
    use crate::simulation::{Aircraft, SimulationElement};

    struct TestAircraft {
        gate: DelayedFalseLogicGate,
        expression_result: bool,
    }
    impl TestAircraft {
        fn new(gate: DelayedFalseLogicGate) -> Self {
            Self {
                gate,
                expression_result: false,
            }
        }

        fn set_expression(&mut self, value: bool) {
            self.expression_result = value;
        }

        fn gate_output(&self) -> bool {
            self.gate.output()
        }
    }
    impl Aircraft for TestAircraft {
        fn update_before_power_distribution(
            &mut self,
            context: &UpdateContext,
            _: &mut Electricity,
        ) {
            self.gate.update(context, self.expression_result);
        }
    }
    impl SimulationElement for TestAircraft {}

    #[test]
    fn when_the_expression_is_false_initially_returns_false() {
        let mut test_bed = SimulationTestBed::new(|_| {
            TestAircraft::new(DelayedFalseLogicGate::new(Duration::from_millis(100)))
        });

        test_bed.run();

        assert!(!test_bed.query(|a| a.gate_output()));
    }

    #[test]
    fn when_the_expression_is_true_returns_true() {
        let mut test_bed = SimulationTestBed::new(|_| {
            TestAircraft::new(DelayedFalseLogicGate::new(Duration::from_millis(100)))
        });

        test_bed.command(|a| a.set_expression(true));
        test_bed.run();

        assert!(test_bed.query(|a| a.gate_output()));
    }

    #[test]
    fn when_the_expression_is_false_and_delay_hasnt_passed_returns_true() {
        let mut test_bed = SimulationTestBed::new(|_| {
            TestAircraft::new(DelayedFalseLogicGate::new(Duration::from_millis(10_000)))
        });

        test_bed.command(|a| a.set_expression(true));
        test_bed.run_with_delta(Duration::from_millis(0));

        test_bed.command(|a| a.set_expression(false));
        test_bed.run();

        assert!(test_bed.query(|a| a.gate_output()));
    }

    #[test]
    fn when_the_expression_is_false_and_delay_has_passed_returns_false() {
        let mut test_bed = SimulationTestBed::new(|_| {
            TestAircraft::new(DelayedFalseLogicGate::new(Duration::from_millis(100)))
        });

        test_bed.command(|a| a.set_expression(true));
        test_bed.run_with_delta(Duration::from_millis(0));

        test_bed.command(|a| a.set_expression(false));
        test_bed.run();

        assert!(!test_bed.query(|a| a.gate_output()));
    }

    #[test]
    fn when_the_expression_is_false_and_becomes_true_before_delay_has_passed_returns_true_once_delay_passed(
    ) {
        let mut test_bed = SimulationTestBed::new(|_| {
            TestAircraft::new(DelayedFalseLogicGate::new(Duration::from_millis(1_000)))
        });

        test_bed.command(|a| a.set_expression(false));
        test_bed.run_with_delta(Duration::from_millis(0));
        test_bed.run_with_delta(Duration::from_millis(800));

        test_bed.command(|a| a.set_expression(true));
        test_bed.run_with_delta(Duration::from_millis(100));
        test_bed.run_with_delta(Duration::from_millis(200));

        assert!(test_bed.query(|a| a.gate_output()));
    }
}

#[cfg(test)]
mod delayed_pulse_true_logic_gate_tests {
    use super::*;
    use crate::electrical::Electricity;
    use crate::simulation::test::{SimulationTestBed, TestBed};
    use crate::simulation::{Aircraft, SimulationElement};

    struct TestAircraft {
        gate: DelayedPulseTrueLogicGate,
        expression_result: bool,
    }
    impl TestAircraft {
        fn new(gate: DelayedPulseTrueLogicGate) -> Self {
            Self {
                gate,
                expression_result: false,
            }
        }

        fn set_expression(&mut self, value: bool) {
            self.expression_result = value;
        }

        fn gate_output(&self) -> bool {
            self.gate.output()
        }
    }
    impl Aircraft for TestAircraft {
        fn update_before_power_distribution(
            &mut self,
            context: &UpdateContext,
            _: &mut Electricity,
        ) {
            self.gate.update(context, self.expression_result);
        }
    }
    impl SimulationElement for TestAircraft {}

    #[test]
    fn when_the_expression_is_false_initially_returns_false() {
        let mut test_bed = SimulationTestBed::new(|_| {
            TestAircraft::new(DelayedPulseTrueLogicGate::new(Duration::from_millis(100)))
        });

        test_bed.run();

        assert!(!test_bed.query(|a| a.gate_output()));
    }

    #[test]
    fn when_the_expression_is_true_returns_false_if_less_than_delay() {
        let mut test_bed = SimulationTestBed::new(|_| {
            TestAircraft::new(DelayedPulseTrueLogicGate::new(Duration::from_millis(100)))
        });

        test_bed.command(|a| a.set_expression(true));
        test_bed.run_with_delta(Duration::from_millis(0));

        assert!(!test_bed.query(|a| a.gate_output()));
    }

    #[test]
    fn when_the_expression_is_false_and_delay_hasnt_passed_returns_false() {
        let mut test_bed = SimulationTestBed::new(|_| {
            TestAircraft::new(DelayedPulseTrueLogicGate::new(Duration::from_millis(10000)))
        });

        test_bed.command(|a| a.set_expression(false));
        test_bed.run();

        assert!(!test_bed.query(|a| a.gate_output()));
    }

    #[test]
    fn when_the_expression_is_true_and_becomes_false_before_delay_has_passed_returns_false_once_delay_passed(
    ) {
        let mut test_bed = SimulationTestBed::new(|_| {
            TestAircraft::new(DelayedPulseTrueLogicGate::new(Duration::from_millis(1000)))
        });

        test_bed.command(|a| a.set_expression(true));
        test_bed.run_with_delta(Duration::from_millis(800));

        test_bed.command(|a| a.set_expression(false));
        test_bed.run_with_delta(Duration::from_millis(300));

        assert!(!test_bed.query(|a| a.gate_output()));
    }

    #[test]
    fn when_the_expression_is_true_and_stays_true_until_delay_has_passed_returns_true_on_one_update_only(
    ) {
        let mut test_bed = SimulationTestBed::new(|_| {
            TestAircraft::new(DelayedPulseTrueLogicGate::new(Duration::from_millis(1000)))
        });

        test_bed.command(|a| a.set_expression(true));
        test_bed.run_with_delta(Duration::from_millis(1200));

        assert!(test_bed.query(|a| a.gate_output()));

        test_bed.run_with_delta(Duration::from_millis(100));

        assert!(!test_bed.query(|a| a.gate_output()));

        test_bed.run_with_delta(Duration::from_millis(1200));

        assert!(!test_bed.query(|a| a.gate_output()));
    }

    #[test]
    fn when_the_expression_is_true_and_starting_as_true_false_returns_false() {
        let mut test_bed = SimulationTestBed::new(|_| {
            TestAircraft::new(
                DelayedPulseTrueLogicGate::new(Duration::from_millis(1_000))
                    .starting_as(true, false),
            )
        });

        test_bed.command(|a| a.set_expression(true));

        test_bed.run_with_delta(Duration::from_millis(0));
        assert!(!test_bed.query(|a| a.gate_output()));

        test_bed.run_with_delta(Duration::from_millis(500));
        assert!(!test_bed.query(|a| a.gate_output()));

        test_bed.run_with_delta(Duration::from_millis(1_200));
        assert!(!test_bed.query(|a| a.gate_output()));
    }

    #[test]
    fn when_the_expression_is_true_and_starting_as_true_true_returns_true_on_one_update_only() {
        let mut test_bed = SimulationTestBed::new(|_| {
            TestAircraft::new(
                DelayedPulseTrueLogicGate::new(Duration::from_millis(1_000))
                    .starting_as(true, true),
            )
        });

        test_bed.command(|a| a.set_expression(true));

        test_bed.run_with_delta(Duration::from_millis(0));
        assert!(test_bed.query(|a| a.gate_output()));

        test_bed.run_with_delta(Duration::from_millis(500));
        assert!(!test_bed.query(|a| a.gate_output()));

        test_bed.run_with_delta(Duration::from_millis(1_200));
        assert!(!test_bed.query(|a| a.gate_output()));
    }
}

#[cfg(test)]
mod interpolation_tests {
    use super::*;

    const XS1: [f64; 10] = [
        -100.0, -10.0, 10.0, 240.0, 320.0, 435.3, 678.9, 890.3, 10005.0, 203493.7,
    ];

    const YS1: [f64; 10] = [
        -200.0, 10.0, 40.0, -553.0, 238.4, 30423.3, 23000.2, 32000.4, 43200.2, 34.2,
    ];

    #[test]
    fn interpolation_before_first_element_test() {
        // We expect to get first element of YS1
        assert!((interpolation(&XS1, &YS1, -500.0) - YS1[0]).abs() < f64::EPSILON);
    }

    #[test]
    fn interpolation_after_last_element_test() {
        // We expect to get last element of YS1
        assert!(
            (interpolation(&XS1, &YS1, 100000000.0) - *YS1.last().unwrap()).abs() < f64::EPSILON
        );
    }

    #[test]
    fn interpolation_first_element_test() {
        // Giving first element of X tab we expect first of Y tab
        assert!(
            (interpolation(&XS1, &YS1, *XS1.first().unwrap()) - *YS1.first().unwrap()).abs()
                < f64::EPSILON
        );
    }

    #[test]
    fn interpolation_last_element_test() {
        // Giving last element of X tab we expect last of Y tab
        assert!(
            (interpolation(&XS1, &YS1, *XS1.last().unwrap()) - *YS1.last().unwrap()).abs()
                < f64::EPSILON
        );
    }

    #[test]
    fn interpolation_middle_element_test() {
        let res = interpolation(&XS1, &YS1, 358.0);
        assert!((res - 10186.589).abs() < 0.001);
    }

    #[test]
    fn interpolation_last_segment_element_test() {
        let res = interpolation(&XS1, &YS1, 22200.0);
        assert!((res - 40479.579).abs() < 0.001);
    }

    #[test]
    fn interpolation_first_segment_element_test() {
        let res = interpolation(&XS1, &YS1, -50.0);
        assert!((res - (-83.3333)).abs() < 0.001);
    }
}

#[cfg(test)]
mod calculate_towards_target_temperature_tests {
    use super::*;
    use ntest::assert_about_eq;

    #[test]
    fn when_current_equals_target_returns_current() {
        let temperature = ThermodynamicTemperature::new::<degree_celsius>(10.);
        let result = calculate_towards_target_temperature(
            temperature,
            temperature,
            1.,
            Duration::from_secs(1),
        );

        assert_eq!(result, temperature);
    }

    #[test]
    fn when_current_less_than_target_moves_towards_target() {
        let result = calculate_towards_target_temperature(
            ThermodynamicTemperature::new::<degree_celsius>(10.),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
            1.,
            Duration::from_secs(1),
        );

        assert_about_eq!(result.get::<degree_celsius>(), 11.);
    }

    #[test]
    fn when_current_slightly_less_than_target_does_not_overshoot_target() {
        let result = calculate_towards_target_temperature(
            ThermodynamicTemperature::new::<degree_celsius>(14.9),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
            1.,
            Duration::from_secs(1),
        );

        assert_about_eq!(result.get::<degree_celsius>(), 15.);
    }

    #[test]
    fn when_current_more_than_target_moves_towards_target() {
        let result = calculate_towards_target_temperature(
            ThermodynamicTemperature::new::<degree_celsius>(15.),
            ThermodynamicTemperature::new::<degree_celsius>(10.),
            1.,
            Duration::from_secs(1),
        );

        assert_about_eq!(result.get::<degree_celsius>(), 14.);
    }

    #[test]
    fn when_current_slightly_more_than_target_does_not_undershoot_target() {
        let result = calculate_towards_target_temperature(
            ThermodynamicTemperature::new::<degree_celsius>(10.1),
            ThermodynamicTemperature::new::<degree_celsius>(10.),
            1.,
            Duration::from_secs(1),
        );

        assert_about_eq!(result.get::<degree_celsius>(), 10.);
    }
}

#[cfg(test)]
mod electrical_bus_type_tests {
    use super::ElectricalBusType;

    #[test]
    fn get_name_returns_name() {
        assert_eq!(ElectricalBusType::AlternatingCurrent(2).to_string(), "AC_2");
        assert_eq!(
            ElectricalBusType::AlternatingCurrentEssential.to_string(),
            "AC_ESS"
        );
        assert_eq!(
            ElectricalBusType::AlternatingCurrentEssentialShed.to_string(),
            "AC_ESS_SHED"
        );
        assert_eq!(
            ElectricalBusType::AlternatingCurrentStaticInverter.to_string(),
            "AC_STAT_INV"
        );
        assert_eq!(ElectricalBusType::DirectCurrent(2).to_string(), "DC_2");
        assert_eq!(
            ElectricalBusType::DirectCurrentEssential.to_string(),
            "DC_ESS"
        );
        assert_eq!(
            ElectricalBusType::DirectCurrentEssentialShed.to_string(),
            "DC_ESS_SHED"
        );
        assert_eq!(
            ElectricalBusType::DirectCurrentBattery.to_string(),
            "DC_BAT"
        );
        assert_eq!(
            ElectricalBusType::DirectCurrentHot(2).to_string(),
            "DC_HOT_2"
        );
    }
}

#[cfg(test)]
mod average_tests {
    use super::*;

    #[test]
    fn average_returns_average() {
        let iterator = [
            Pressure::new::<hectopascal>(100.),
            Pressure::new::<hectopascal>(200.),
            Pressure::new::<hectopascal>(300.),
        ];

        let average: Pressure = iterator.iter().average();
        assert_eq!(average, Pressure::new::<hectopascal>(200.));
    }
}

#[cfg(test)]
mod height_over_ground {
    use super::*;

    use crate::simulation::{
        test::{ElementCtorFn, SimulationTestBed, WriteByName},
        SimulationElement,
    };
    use uom::si::angle::degree;

    use ntest::assert_about_eq;

    #[derive(Default)]
    struct DummyObject {}
    impl DummyObject {}
    impl SimulationElement for DummyObject {}

    #[test]
    fn at_zero_altitude_zero_reference_default_attitude() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|_| DummyObject::default()))
            .with_update_after_power_distribution(|_, context| {
                assert!(height_over_ground(context, Vector3::new(0., 0., 0.)).get::<meter>() == 0.);
                assert!(
                    height_over_ground(context, Vector3::new(0., 10., 0.)).get::<meter>() == 10.
                );
                assert!(
                    height_over_ground(context, Vector3::new(0., -10., 0.)).get::<meter>() == -10.
                );

                assert!(
                    height_over_ground(context, Vector3::new(-10., 0., 0.)).get::<meter>() == 0.
                );
                assert!(
                    height_over_ground(context, Vector3::new(10., -10., 0.)).get::<meter>() == -10.
                );

                assert!(
                    height_over_ground(context, Vector3::new(-10., 0., 10.)).get::<meter>() == 0.
                );
                assert!(
                    height_over_ground(context, Vector3::new(10., -10., -10.)).get::<meter>()
                        == -10.
                );
            });

        test_bed.run_with_delta(Duration::from_secs(0));
    }

    #[test]
    fn at_10_altitude_with_default_attitude() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|_| DummyObject::default()))
            .with_update_after_power_distribution(|_, context| {
                assert_about_eq!(
                    height_over_ground(context, Vector3::new(0., 0., 0.)).get::<meter>(),
                    10.
                );
                assert_about_eq!(
                    height_over_ground(context, Vector3::new(0., 10., 0.)).get::<meter>(),
                    20.
                );
                assert_about_eq!(
                    height_over_ground(context, Vector3::new(0., -10., 0.)).get::<meter>(),
                    0.
                );
            });

        test_bed.write_by_name("PLANE ALT ABOVE GROUND", Length::new::<meter>(10.));

        test_bed.run_with_delta(Duration::from_secs(0));
    }

    #[test]
    fn at_10_altitude_with_45_right_bank_attitude() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|_| DummyObject::default()))
            .with_update_after_power_distribution(|_, context| {
                assert_about_eq!(
                    height_over_ground(context, Vector3::new(0., 0., 0.)).get::<meter>(),
                    10.
                );
                assert!(height_over_ground(context, Vector3::new(5., 0., 0.)).get::<meter>() < 8.);
                assert!(
                    height_over_ground(context, Vector3::new(-5., 0., 0.)).get::<meter>() > 12.
                );
                assert_about_eq!(
                    height_over_ground(context, Vector3::new(0., 0., -10.)).get::<meter>(),
                    10.
                );
                assert_about_eq!(
                    height_over_ground(context, Vector3::new(0., 0., 10.)).get::<meter>(),
                    10.
                );
                assert!(height_over_ground(context, Vector3::new(0., 5., 0.)).get::<meter>() < 15.);
            });

        // MSFS bank right is negative angle
        test_bed.write_by_name("PLANE BANK DEGREES", Angle::new::<degree>(-45.));
        test_bed.write_by_name("PLANE ALT ABOVE GROUND", Length::new::<meter>(10.));

        test_bed.run_with_delta(Duration::from_secs(0));
    }

    #[test]
    fn at_10_altitude_with_45_left_bank_attitude() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|_| DummyObject::default()))
            .with_update_after_power_distribution(|_, context| {
                assert_about_eq!(
                    height_over_ground(context, Vector3::new(0., 0., 0.)).get::<meter>(),
                    10.
                );
                assert!(height_over_ground(context, Vector3::new(5., 0., 0.)).get::<meter>() > 12.);
                assert!(height_over_ground(context, Vector3::new(-5., 0., 0.)).get::<meter>() < 8.);
                assert_about_eq!(
                    height_over_ground(context, Vector3::new(0., 0., -10.)).get::<meter>(),
                    10.
                );
                assert_about_eq!(
                    height_over_ground(context, Vector3::new(0., 0., 10.)).get::<meter>(),
                    10.
                );
                assert!(height_over_ground(context, Vector3::new(0., 5., 0.)).get::<meter>() < 15.);
            });

        // MSFS bank right is negative angle
        test_bed.write_by_name("PLANE BANK DEGREES", Angle::new::<degree>(45.));
        test_bed.write_by_name("PLANE ALT ABOVE GROUND", Length::new::<meter>(10.));

        test_bed.run_with_delta(Duration::from_secs(0));
    }

    #[test]
    fn at_10_altitude_with_45_up_pitch_attitude() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|_| DummyObject::default()))
            .with_update_after_power_distribution(|_, context| {
                assert_about_eq!(
                    height_over_ground(context, Vector3::new(0., 0., 0.)).get::<meter>(),
                    10.
                );
                assert_about_eq!(
                    height_over_ground(context, Vector3::new(5., 0., 0.)).get::<meter>(),
                    10.
                );
                assert_about_eq!(
                    height_over_ground(context, Vector3::new(-5., 0., 0.)).get::<meter>(),
                    10.
                );
                assert!(
                    height_over_ground(context, Vector3::new(0., 0., -10.)).get::<meter>() < 8.
                );
                assert!(
                    height_over_ground(context, Vector3::new(0., 0., 10.)).get::<meter>() > 12.
                );
                assert!(height_over_ground(context, Vector3::new(0., 5., 0.)).get::<meter>() < 15.);
            });

        // MSFS bank right is negative angle
        test_bed.write_by_name("PLANE PITCH DEGREES", Angle::new::<degree>(-45.));
        test_bed.write_by_name("PLANE ALT ABOVE GROUND", Length::new::<meter>(10.));

        test_bed.run_with_delta(Duration::from_secs(0));
    }

    #[test]
    fn at_10_altitude_with_45_down_pitch_attitude() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|_| DummyObject::default()))
            .with_update_after_power_distribution(|_, context| {
                assert_about_eq!(
                    height_over_ground(context, Vector3::new(0., 0., 0.)).get::<meter>(),
                    10.
                );
                assert_about_eq!(
                    height_over_ground(context, Vector3::new(5., 0., 0.)).get::<meter>(),
                    10.
                );
                assert_about_eq!(
                    height_over_ground(context, Vector3::new(-5., 0., 0.)).get::<meter>(),
                    10.
                );
                assert!(
                    height_over_ground(context, Vector3::new(0., 0., -10.)).get::<meter>() > 12.
                );
                assert!(height_over_ground(context, Vector3::new(0., 0., 10.)).get::<meter>() < 8.);
                assert!(height_over_ground(context, Vector3::new(0., 5., 0.)).get::<meter>() < 15.);
            });

        // MSFS bank right is negative angle
        test_bed.write_by_name("PLANE PITCH DEGREES", Angle::new::<degree>(45.));
        test_bed.write_by_name("PLANE ALT ABOVE GROUND", Length::new::<meter>(10.));

        test_bed.run_with_delta(Duration::from_secs(0));
    }
}

#[cfg(test)]
mod local_acceleration_at_plane_coordinate {
    use uom::si::angular_velocity::{degree_per_second, radian_per_second};

    use super::*;

    use crate::simulation::{
        test::{ElementCtorFn, SimulationTestBed, WriteByName},
        SimulationElement,
    };

    #[derive(Default)]
    struct RotatingObject {
        local_accel: Vector3<f64>,
        rotating_point_position: Vector3<f64>,
    }
    impl RotatingObject {
        fn default() -> Self {
            Self {
                local_accel: Vector3::default(),
                rotating_point_position: Vector3::default(),
            }
        }

        fn update(&mut self, context: &UpdateContext) {
            self.local_accel =
                local_acceleration_at_plane_coordinate(context, self.rotating_point_position);
        }

        fn set_point_position(&mut self, rotating_point_position: Vector3<f64>) {
            self.rotating_point_position = rotating_point_position;
        }
    }
    impl SimulationElement for RotatingObject {}

    #[test]
    fn pilot_cabin_acceleration_pitch_rotations() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|_| RotatingObject::default()))
            .with_update_after_power_distribution(|e, context| {
                e.update(context);
            });

        // Assuming pilot cabin is 1m forward for simplicity
        let cabin_position = Vector3::new(0., 0., 1.);
        test_bed.command_element(|e| e.set_point_position(cabin_position));

        test_bed.run_with_delta(Duration::from_secs(0));
        assert!(test_bed.query_element(|e| e.local_accel == Vector3::default()));

        // Pitch up accel
        test_bed.write_by_name("ROTATION VELOCITY BODY X", 0.);
        test_bed.write_by_name("ROTATION ACCELERATION BODY X", -1.);

        test_bed.run_with_delta(Duration::from_secs(0));
        assert!(test_bed.query_element(|e| e.local_accel == Vector3::new(0., 1., 0.)));

        // Pitch up accel with velocity adds centripetal force
        test_bed.write_by_name(
            "ROTATION VELOCITY BODY X",
            AngularVelocity::new::<radian_per_second>(-1.).get::<degree_per_second>(),
        );
        test_bed.write_by_name("ROTATION ACCELERATION BODY X", -1.);

        test_bed.run_with_delta(Duration::from_secs(0));
        assert!(test_bed.query_element(|e| e.local_accel == Vector3::new(0., 1., -1.)));
    }

    #[test]
    fn pilot_cabin_acceleration_yaw_rotations() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|_| RotatingObject::default()))
            .with_update_after_power_distribution(|e, context| {
                e.update(context);
            });

        // Assuming pilot cabin is 1m forward for simplicity
        let cabin_position = Vector3::new(0., 0., 1.);
        test_bed.command_element(|e| e.set_point_position(cabin_position));

        test_bed.run_with_delta(Duration::from_secs(0));
        assert!(test_bed.query_element(|e| e.local_accel == Vector3::default()));

        // Yaw right accel
        test_bed.write_by_name("ROTATION VELOCITY BODY Y", 0.);
        test_bed.write_by_name("ROTATION ACCELERATION BODY Y", 1.);

        test_bed.run_with_delta(Duration::from_secs(0));
        assert!(test_bed.query_element(|e| e.local_accel == Vector3::new(1., 0., 0.)));

        // Yaw right accel with velocity adds centripetal force
        test_bed.write_by_name(
            "ROTATION VELOCITY BODY Y",
            AngularVelocity::new::<radian_per_second>(1.).get::<degree_per_second>(),
        );
        test_bed.write_by_name("ROTATION ACCELERATION BODY Y", 1.);

        test_bed.run_with_delta(Duration::from_secs(0));
        assert!(test_bed.query_element(|e| e.local_accel == Vector3::new(1., 0., -1.)));

        // Yaw left accel
        test_bed.write_by_name("ROTATION VELOCITY BODY Y", 0.);
        test_bed.write_by_name("ROTATION ACCELERATION BODY Y", -1.);

        test_bed.run_with_delta(Duration::from_secs(0));
        assert!(test_bed.query_element(|e| e.local_accel == Vector3::new(-1., 0., 0.)));

        // Yaw left accel with velocity adds centripetal force
        test_bed.write_by_name(
            "ROTATION VELOCITY BODY Y",
            AngularVelocity::new::<radian_per_second>(-1.).get::<degree_per_second>(),
        );
        test_bed.write_by_name("ROTATION ACCELERATION BODY Y", -1.);

        test_bed.run_with_delta(Duration::from_secs(0));
        assert!(test_bed.query_element(|e| e.local_accel == Vector3::new(-1., 0., -1.)));
    }

    #[test]
    fn pilot_cabin_acceleration_roll_rotations() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|_| RotatingObject::default()))
            .with_update_after_power_distribution(|e, context| {
                e.update(context);
            });

        // Assuming pilot cabin is 1m forward for simplicity
        let cabin_position = Vector3::new(0., 0., 1.);
        test_bed.command_element(|e| e.set_point_position(cabin_position));

        test_bed.run_with_delta(Duration::from_secs(0));
        assert!(test_bed.query_element(|e| e.local_accel == Vector3::default()));

        // roll right accel -> Aligned on roll axis we expect no effect
        test_bed.write_by_name("ROTATION VELOCITY BODY Z", 0.);
        test_bed.write_by_name("ROTATION ACCELERATION BODY Z", -1.);

        test_bed.run_with_delta(Duration::from_secs(0));
        assert!(test_bed.query_element(|e| e.local_accel == Vector3::default()));

        // roll right accel with velocity -> Aligned on roll axis we expect no effect
        test_bed.write_by_name(
            "ROTATION VELOCITY BODY Z",
            AngularVelocity::new::<radian_per_second>(-1.).get::<degree_per_second>(),
        );
        test_bed.write_by_name("ROTATION ACCELERATION BODY Z", -1.);

        test_bed.run_with_delta(Duration::from_secs(0));
        assert!(test_bed.query_element(|e| e.local_accel == Vector3::default()));
    }

    #[test]
    fn right_wing_acceleration_roll_rotations() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|_| RotatingObject::default()))
            .with_update_after_power_distribution(|e, context| {
                e.update(context);
            });

        // Assuming right wing is 1m right for simplicity
        let right_wing_position = Vector3::new(1., 0., 0.);
        test_bed.command_element(|e| e.set_point_position(right_wing_position));

        test_bed.run_with_delta(Duration::from_secs(0));
        assert!(test_bed.query_element(|e| e.local_accel == Vector3::default()));

        // roll right accel -> expect down accel
        test_bed.write_by_name("ROTATION VELOCITY BODY Z", 0.);
        test_bed.write_by_name("ROTATION ACCELERATION BODY Z", -1.);

        test_bed.run_with_delta(Duration::from_secs(0));
        assert!(test_bed.query_element(|e| e.local_accel == Vector3::new(0., -1., 0.)));

        // roll right accel with velocity -> Down Force plus centripetal left
        test_bed.write_by_name(
            "ROTATION VELOCITY BODY Z",
            AngularVelocity::new::<radian_per_second>(-1.).get::<degree_per_second>(),
        );
        test_bed.write_by_name("ROTATION ACCELERATION BODY Z", -1.);

        test_bed.run_with_delta(Duration::from_secs(0));
        assert!(test_bed.query_element(|e| e.local_accel == Vector3::new(-1., -1., 0.)));
    }
}

#[cfg(test)]
mod mach_number_tests {
    use ntest::assert_about_eq;
    use uom::si::{
        length::foot,
        quantities::{Length, Velocity},
        velocity::knot,
    };

    use crate::shared::{InternationalStandardAtmosphere, MachNumber};

    // All of the test values are obtained from
    // - https://aerotoolbox.com/airspeed-conversions/
    // - https://aerotoolbox.com/atmcalc/

    #[test]
    fn cas_to_mach_conversions() {
        let mach0 = MachNumber(0.);
        let mach05 = MachNumber(0.5);
        let sea_level_pressure = InternationalStandardAtmosphere::ground_pressure();
        let fl350_pressure =
            InternationalStandardAtmosphere::pressure_at_altitude(Length::new::<foot>(35_000.));

        assert_about_eq!(mach0.to_cas(sea_level_pressure).get::<knot>(), 0.);
        assert_about_eq!(
            mach05.to_cas(sea_level_pressure).get::<knot>(),
            330.735,
            0.1
        );

        assert_about_eq!(mach0.to_cas(fl350_pressure).get::<knot>(), 0.);
        assert_about_eq!(mach05.to_cas(fl350_pressure).get::<knot>(), 164.225, 0.1);
    }

    #[test]
    fn eas_to_mach_conversions() {
        let mach0 = MachNumber(0.);
        let mach05 = MachNumber(0.5);
        let sea_level_pressure = InternationalStandardAtmosphere::ground_pressure();
        let fl350_pressure =
            InternationalStandardAtmosphere::pressure_at_altitude(Length::new::<foot>(35_000.));

        assert_about_eq!(mach0.to_eas(sea_level_pressure).get::<knot>(), 0.);
        assert_about_eq!(
            mach05.to_eas(sea_level_pressure).get::<knot>(),
            330.739,
            0.1
        );

        assert_about_eq!(mach0.to_eas(fl350_pressure).get::<knot>(), 0.);
        assert_about_eq!(mach05.to_eas(fl350_pressure).get::<knot>(), 160.436, 0.1);
    }

    #[test]
    fn tas_to_mach_conversions() {
        let mach0 = MachNumber(0.);
        let mach05 = MachNumber(0.5);
        let sea_level_temperature = InternationalStandardAtmosphere::ground_temperature();
        let fl350_temperature =
            InternationalStandardAtmosphere::temperature_at_altitude(Length::new::<foot>(35_000.));

        assert_about_eq!(mach0.to_tas(sea_level_temperature).get::<knot>(), 0.);
        assert_about_eq!(
            mach05.to_tas(sea_level_temperature).get::<knot>(),
            330.739,
            0.1
        );

        assert_about_eq!(mach0.to_tas(fl350_temperature).get::<knot>(), 0.);
        assert_about_eq!(mach05.to_tas(fl350_temperature).get::<knot>(), 288.209, 0.1);
    }

    #[test]
    fn mach_to_cas_conversions() {
        let mach0_cas = Velocity::new::<knot>(0.);
        let mach05_cas_sea_level = Velocity::new::<knot>(330.735);
        let mach05_cas_fl350 = Velocity::new::<knot>(164.225);
        let sea_level_pressure = InternationalStandardAtmosphere::ground_pressure();
        let fl350_pressure =
            InternationalStandardAtmosphere::pressure_at_altitude(Length::new::<foot>(35_000.));

        assert_about_eq!(
            MachNumber::from_cas(mach0_cas, sea_level_pressure),
            MachNumber(0.)
        );
        assert_about_eq!(
            MachNumber::from_cas(mach05_cas_sea_level, sea_level_pressure),
            MachNumber(0.5),
            0.001
        );

        assert_about_eq!(
            MachNumber::from_cas(mach0_cas, fl350_pressure),
            MachNumber(0.)
        );
        assert_about_eq!(
            MachNumber::from_cas(mach05_cas_fl350, fl350_pressure),
            MachNumber(0.5),
            0.001
        );
    }

    #[test]
    fn mach_to_eas_conversions() {
        let mach0_eas = Velocity::new::<knot>(0.);
        let mach05_eas_sea_level = Velocity::new::<knot>(330.739);
        let mach05_eas_fl350 = Velocity::new::<knot>(160.436);
        let sea_level_pressure = InternationalStandardAtmosphere::ground_pressure();
        let fl350_pressure =
            InternationalStandardAtmosphere::pressure_at_altitude(Length::new::<foot>(35_000.));

        assert_about_eq!(
            MachNumber::from_eas(mach0_eas, sea_level_pressure),
            MachNumber(0.)
        );
        assert_about_eq!(
            MachNumber::from_eas(mach05_eas_sea_level, sea_level_pressure),
            MachNumber(0.5),
            0.001
        );

        assert_about_eq!(
            MachNumber::from_eas(mach0_eas, fl350_pressure),
            MachNumber(0.)
        );
        assert_about_eq!(
            MachNumber::from_eas(mach05_eas_fl350, fl350_pressure),
            MachNumber(0.5),
            0.001
        );
    }

    #[test]
    fn mach_to_tas_conversions() {
        let mach0_tas = Velocity::new::<knot>(0.);
        let mach05_tas_sea_level = Velocity::new::<knot>(330.739);
        let mach05_tas_fl350 = Velocity::new::<knot>(288.209);
        let sea_level_temperature = InternationalStandardAtmosphere::ground_temperature();
        let fl350_temperature =
            InternationalStandardAtmosphere::temperature_at_altitude(Length::new::<foot>(35_000.));

        assert_about_eq!(
            MachNumber::from_tas(mach0_tas, sea_level_temperature),
            MachNumber(0.)
        );
        assert_about_eq!(
            MachNumber::from_tas(mach05_tas_sea_level, sea_level_temperature),
            MachNumber(0.5),
            0.001
        );

        assert_about_eq!(
            MachNumber::from_tas(mach0_tas, fl350_temperature),
            MachNumber(0.)
        );
        assert_about_eq!(
            MachNumber::from_tas(mach05_tas_fl350, fl350_temperature),
            MachNumber(0.5),
            0.001
        );
    }
}

#[cfg(test)]
mod resolution_tests {
    use super::*;

    #[test]
    fn positive_values_are_returned_to_correct_resolution() {
        let value: f64 = 22.;
        let value_after_resolution = value.resolution(5.);

        assert_eq!(value_after_resolution, 20.);
    }

    #[test]
    fn negative_values_are_returned_to_correct_resolution() {
        let value: f64 = -22.;
        let value_after_resolution = value.resolution(5.);

        assert_eq!(value_after_resolution, -20.);
    }

    #[test]
    fn bigger_resolution_than_twice_value_returns_zero() {
        let value: f64 = 22.;
        let value_after_resolution = value.resolution(50.);

        assert_eq!(value_after_resolution, 0.);
    }
}
