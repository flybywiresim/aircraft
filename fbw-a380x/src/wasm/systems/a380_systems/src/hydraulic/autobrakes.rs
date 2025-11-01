use systems::{
    hydraulic::brake_circuit::AutobrakeDecelerationGovernor,
    overhead::PressSingleSignalButton,
    shared::{
        arinc429::{Arinc429Word, SignStatus},
        interpolation,
        low_pass_filter::LowPassFilter,
        Clamp, DelayedPulseTrueLogicGate, DelayedTrueLogicGate, ElectricalBusType, ElectricalBuses,
        LgciuInterface,
    },
    simulation::{
        InitContext, Read, Reader, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, VariableIdentifier, Write,
    },
};
use std::time::Duration;
use uom::si::{
    acceleration::meter_per_second_squared,
    f64::*,
    length::{foot, meter},
    ratio::{percent, ratio},
    velocity::{knot, meter_per_second},
};
#[derive(PartialEq, Clone, Copy, Debug)]
pub enum A380AutobrakeKnobPosition {
    DISARM = 0,
    BTV = 1,
    LOW = 2,
    L2 = 3,
    L3 = 4,
    HIGH = 5,
}
impl From<f64> for A380AutobrakeKnobPosition {
    fn from(value: f64) -> Self {
        match value as u8 {
            0 => A380AutobrakeKnobPosition::DISARM,
            1 => A380AutobrakeKnobPosition::BTV,
            2 => A380AutobrakeKnobPosition::LOW,
            3 => A380AutobrakeKnobPosition::L2,
            4 => A380AutobrakeKnobPosition::L3,
            5 => A380AutobrakeKnobPosition::HIGH,
            _ => A380AutobrakeKnobPosition::DISARM,
        }
    }
}
#[derive(PartialEq, Clone, Copy, Debug)]
pub enum A380AutobrakeMode {
    DISARM = 0,
    BTV = 1,
    LOW = 2,
    L2 = 3,
    L3 = 4,
    HIGH = 5,
    RTO = 6,
}
impl From<f64> for A380AutobrakeMode {
    fn from(value: f64) -> Self {
        match value as u8 {
            0 => A380AutobrakeMode::DISARM,
            1 => A380AutobrakeMode::BTV,
            2 => A380AutobrakeMode::LOW,
            3 => A380AutobrakeMode::L2,
            4 => A380AutobrakeMode::L3,
            5 => A380AutobrakeMode::HIGH,
            6 => A380AutobrakeMode::RTO,
            _ => A380AutobrakeMode::DISARM,
        }
    }
}
pub struct A380AutobrakePanel {
    selected_mode_id: VariableIdentifier,
    selected_mode: A380AutobrakeKnobPosition,
    rto_button: PressSingleSignalButton,
    mode_has_changed: bool,
}
impl A380AutobrakePanel {
    pub fn new(context: &mut InitContext) -> A380AutobrakePanel {
        A380AutobrakePanel {
            selected_mode_id: context.get_identifier("AUTOBRAKES_SELECTED_MODE".to_owned()),
            selected_mode: A380AutobrakeKnobPosition::DISARM,
            rto_button: PressSingleSignalButton::new(context, "AUTOBRK_RTO_ARM"),
            mode_has_changed: true,
        }
    }
    pub fn selected_mode(&self) -> A380AutobrakeKnobPosition {
        self.selected_mode
    }
    pub fn is_disarmed_position(&self) -> bool {
        self.selected_mode == A380AutobrakeKnobPosition::DISARM
    }
    pub fn selected_mode_has_changed(&self) -> bool {
        self.mode_has_changed
    }
    pub fn rto_pressed(&self) -> bool {
        self.rto_button.is_pressed()
    }
}
impl SimulationElement for A380AutobrakePanel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.rto_button.accept(visitor);
        visitor.visit(self);
    }
    fn read(&mut self, reader: &mut SimulatorReader) {
        let raw_read: f64 = reader.read(&self.selected_mode_id);
        let new_mode: A380AutobrakeKnobPosition = raw_read.into();
        self.mode_has_changed = self.selected_mode != new_mode;
        self.selected_mode = new_mode;
    }
}
struct A380AutobrakeKnobSelectorSolenoid {
    disarm_knob_id: VariableIdentifier,
    powered_by: ElectricalBusType,
    is_powered: bool,
    disarm_request: bool,
}
impl A380AutobrakeKnobSelectorSolenoid {
    fn new(context: &mut InitContext, powered_by: ElectricalBusType) -> Self {
        Self {
            disarm_knob_id: context.get_identifier("AUTOBRAKES_DISARM_KNOB_REQ".to_owned()),
            powered_by,
            is_powered: true,
            disarm_request: false,
        }
    }
    fn disarm(&mut self, solenoid_should_disarm: bool) {
        self.disarm_request = self.is_powered && solenoid_should_disarm;
    }
}
impl SimulationElement for A380AutobrakeKnobSelectorSolenoid {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.disarm_knob_id, self.disarm_request);
    }
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by)
    }
}
/// Autobrake controller computes the state machine of the autobrake logic, and the deceleration target
/// that we expect for the plane
pub struct A380AutobrakeController {
    armed_mode_id: VariableIdentifier,
    decel_light_id: VariableIdentifier,
    active_id: VariableIdentifier,
    rto_mode_armed_id: VariableIdentifier,
    external_deactivation_event_id: VariableIdentifier,
    deceleration_governor: AutobrakeDecelerationGovernor,
    decelerating_light: bool,
    target: Acceleration,
    mode: A380AutobrakeMode,
    arming_is_allowed_by_bcu: bool,
    left_brake_pedal_input: Ratio,
    right_brake_pedal_input: Ratio,
    ground_spoilers_are_deployed: bool,
    last_ground_spoilers_are_deployed: bool,
    ground_spoilers_are_deployed_since_5s: DelayedTrueLogicGate,
    nose_gear_was_compressed_once: bool,
    should_disarm_after_time_in_flight: DelayedPulseTrueLogicGate,
    should_reject_rto_mode_after_time_in_flight: DelayedTrueLogicGate,
    autobrake_knob: A380AutobrakeKnobSelectorSolenoid,
    selection_knob_should_return_disarm: DelayedTrueLogicGate,
    external_deactivation_event: bool,
    placeholder_ground_spoilers_out: bool,
    btv_scheduler: BtvDecelScheduler,
    braking_distance_calculator: BrakingDistanceCalculator,
    autobrake_runway_overrun_protection: AutobrakeRunwayOverrunProtection,
}
impl A380AutobrakeController {
    const DURATION_OF_FLIGHT_TO_DISARM_AUTOBRAKE: Duration = Duration::from_secs(10);
    const DURATION_OF_GROUND_SPOILERS_BEFORE_ARMING: Duration = Duration::from_secs(5);
    // Time breakpoint map is shared by all normal modes, and there's a BTV placeholder delaying braking
    const NORMAL_MODE_DECEL_PROFILE_TIME_S: [f64; 3] = [0., 0.1, 2.5];
    // Calibrated deceleration profiles for non-BTV autobrake modes
    // These values have been tuned to achieve more realistic stopping distances matching A380 performance data
    // The profiles use a 3-point interpolation: [initial_accel, transition, final_decel]
    // - Initial spike (4.0 m/s²) represents transient when brakes engage
    // - Transition point (0.0 m/s²) at 0.1s provides smooth engagement
    // - Final deceleration values reduced from previous calibration to increase stopping distances
    const LOW_MODE_DECEL_PROFILE_ACCEL_MS2: [f64; 3] = [4., 0., -1.5];  // Reduced from -2.0 for gentler braking
    const L2_MODE_DECEL_PROFILE_ACCEL_MS2: [f64; 3] = [4., 0., -1.8];   // Reduced from -2.5 for more realistic distances
    const L3_MODE_DECEL_PROFILE_ACCEL_MS2: [f64; 3] = [4., 0., -2.2];   // Reduced from -3.0 to match A380 characteristics
    const HIGH_MODE_DECEL_PROFILE_ACCEL_MS2: [f64; 3] = [4., -1.5, -2.8]; // Reduced from -2.0/-3.5 for longer stopping distance
    const RTO_MODE_DECEL_TARGET_MS2: f64 = -6.;
    const OFF_MODE_DECEL_TARGET_MS2: f64 = 5.;
    const MARGIN_PERCENT_TO_TARGET_TO_SHOW_DECEL_IN_LANDING_MODE: f64 = 80.;
    const MARGIN_PERCENT_TO_TARGET_TO_REMOVE_DECEL_IN_LANDING_MODE: f64 = 70.;
    const TARGET_TO_SHOW_DECEL_IN_RTO_MS2: f64 = -2.7;
    const TARGET_TO_REMOVE_DECEL_IN_RTO_MS2: f64 = -2.;
    const KNOB_SOLENOID_DISARM_DELAY: Duration = Duration::from_millis(1000);
    pub fn new(context: &mut InitContext) -> A380AutobrakeController {
