use systems::{
    hydraulic::brake_circuit::AutobrakeDecelerationGovernor,
    overhead::PressSingleSignalButton,
    shared::{
        interpolation, DelayedPulseTrueLogicGate, DelayedTrueLogicGate, ElectricalBusType,
        ElectricalBuses, LgciuInterface,
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
    ratio::{percent, ratio},
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

    external_disarm_event_id: VariableIdentifier,

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

    external_disarm_event: bool,

    placeholder_ground_spoilers_out: bool,
}
impl A380AutobrakeController {
    const DURATION_OF_FLIGHT_TO_DISARM_AUTOBRAKE: Duration = Duration::from_secs(10);
    const DURATION_OF_GROUND_SPOILERS_BEFORE_ARMING: Duration = Duration::from_secs(5);

    // Time breakpoint map is shared by all normal modes, and there's a BTV placeholder delaying braking
    const NORMAL_MODE_DECEL_PROFILE_TIME_S: [f64; 3] = [0., 0.1, 2.5];

    // BTV placeholder delays braking 4s
    const BTV_MODE_DECEL_PROFILE_TIME_S: [f64; 4] = [0., 3.99, 4., 6.];

    const LOW_MODE_DECEL_PROFILE_ACCEL_MS2: [f64; 3] = [4., 0., -2.];
    const L2_MODE_DECEL_PROFILE_ACCEL_MS2: [f64; 3] = [4., 0., -2.5];
    const L3_MODE_DECEL_PROFILE_ACCEL_MS2: [f64; 3] = [4., 0., -3.];
    const HIGH_MODE_DECEL_PROFILE_ACCEL_MS2: [f64; 3] = [4., -2., -3.5];
    const BTV_MODE_DECEL_PROFILE_ACCEL_MS2: [f64; 4] = [4., 4., -1., -2.5];

    const RTO_MODE_DECEL_TARGET_MS2: f64 = -6.;
    const OFF_MODE_DECEL_TARGET_MS2: f64 = 5.;

    const MARGIN_PERCENT_TO_TARGET_TO_SHOW_DECEL_IN_LANDING_MODE: f64 = 80.;
    const MARGIN_PERCENT_TO_TARGET_TO_REMOVE_DECEL_IN_LANDING_MODE: f64 = 70.;
    const TARGET_TO_SHOW_DECEL_IN_RTO_MS2: f64 = -2.7;
    const TARGET_TO_REMOVE_DECEL_IN_RTO_MS2: f64 = -2.;

    pub fn new(context: &mut InitContext) -> A380AutobrakeController {
        A380AutobrakeController {
            armed_mode_id: context.get_identifier("AUTOBRAKES_ARMED_MODE".to_owned()),
            decel_light_id: context.get_identifier("AUTOBRAKES_DECEL_LIGHT".to_owned()),
            active_id: context.get_identifier("AUTOBRAKES_ACTIVE".to_owned()),
            rto_mode_armed_id: context.get_identifier("AUTOBRAKES_RTO_ARMED".to_owned()),

            external_disarm_event_id: context.get_identifier("AUTOBRAKE_DISARM".to_owned()),

            deceleration_governor: AutobrakeDecelerationGovernor::new(),
            decelerating_light: false,
            target: Acceleration::new::<meter_per_second_squared>(0.),
            mode: A380AutobrakeMode::DISARM,
            arming_is_allowed_by_bcu: context.is_in_flight(),
            left_brake_pedal_input: Ratio::new::<percent>(0.),
            right_brake_pedal_input: Ratio::new::<percent>(0.),
            ground_spoilers_are_deployed: false,
            last_ground_spoilers_are_deployed: false,
            ground_spoilers_are_deployed_since_5s: DelayedTrueLogicGate::new(
                Self::DURATION_OF_GROUND_SPOILERS_BEFORE_ARMING,
            ),
            nose_gear_was_compressed_once: false,
            should_disarm_after_time_in_flight: DelayedPulseTrueLogicGate::new(
                Self::DURATION_OF_FLIGHT_TO_DISARM_AUTOBRAKE,
            )
            .starting_as(context.is_in_flight(), false),
            should_reject_rto_mode_after_time_in_flight: DelayedTrueLogicGate::new(
                Self::DURATION_OF_FLIGHT_TO_DISARM_AUTOBRAKE,
            )
            .starting_as(context.is_in_flight()),

            // Powered on VDC BUS 2 -> 806GG cb
            autobrake_knob: A380AutobrakeKnobSelectorSolenoid::new(
                context,
                ElectricalBusType::DirectCurrent(2),
            ),

            external_disarm_event: false,

            placeholder_ground_spoilers_out: false,
        }
    }

    fn spoilers_retracted_during_this_update(&self) -> bool {
        !self.ground_spoilers_are_deployed && self.last_ground_spoilers_are_deployed
    }

    fn rto_mode_deselected_this_update(&self, autobrake_panel: &A380AutobrakePanel) -> bool {
        self.mode == A380AutobrakeMode::RTO && autobrake_panel.rto_pressed()
    }

    pub fn brake_output(&self) -> Ratio {
        Ratio::new::<ratio>(self.deceleration_governor.output())
    }

    fn determine_mode(
        &mut self,
        context: &UpdateContext,
        autobrake_panel: &A380AutobrakePanel,
    ) -> A380AutobrakeMode {
        if self.should_disarm(context, autobrake_panel) {
            self.disarm_actions();
            return A380AutobrakeMode::DISARM;
        }

        if self.mode == A380AutobrakeMode::RTO
            || autobrake_panel.rto_pressed()
                && !self.should_reject_rto_mode_after_time_in_flight.output()
        {
            if autobrake_panel.selected_mode() != A380AutobrakeKnobPosition::DISARM {
                self.autobrake_knob.disarm(true);
            }

            A380AutobrakeMode::RTO
        } else {
            self.autobrake_knob.disarm(false);
            if autobrake_panel.selected_mode_has_changed() {
                match autobrake_panel.selected_mode() {
                    A380AutobrakeKnobPosition::DISARM => A380AutobrakeMode::DISARM,
                    A380AutobrakeKnobPosition::LOW => A380AutobrakeMode::LOW,
                    A380AutobrakeKnobPosition::L2 => A380AutobrakeMode::L2,
                    A380AutobrakeKnobPosition::L3 => A380AutobrakeMode::L3,
                    A380AutobrakeKnobPosition::HIGH => A380AutobrakeMode::HIGH,
                    A380AutobrakeKnobPosition::BTV => A380AutobrakeMode::BTV,
                }
            } else {
                self.mode
            }
        }
    }

    fn should_engage_deceleration_governor(
        &self,
        context: &UpdateContext,
        autobrake_panel: &A380AutobrakePanel,
    ) -> bool {
        self.is_armed()
            && self.ground_spoilers_are_deployed // We wait 5s after deploy, but they need to be deployed even if nose compressed
            && (self.ground_spoilers_are_deployed_since_5s.output()
                || self.nose_gear_was_compressed_once)
            && !self.should_disarm(context, autobrake_panel)
    }

    fn is_armed(&self) -> bool {
        self.mode != A380AutobrakeMode::DISARM
    }

    fn is_decelerating(&self) -> bool {
        self.decelerating_light
    }

    /// Handles the hysteresis for decel light depending on normal vs RTO modes
    fn update_decelerating_light_info(&mut self) {
        if !self.deceleration_demanded() {
            self.decelerating_light = false;
            return;
        }

        match self.mode {
            A380AutobrakeMode::DISARM => self.decelerating_light = false,
            A380AutobrakeMode::LOW
            | A380AutobrakeMode::L2
            | A380AutobrakeMode::L3
            | A380AutobrakeMode::HIGH
            | A380AutobrakeMode::BTV => {
                if self
                    .deceleration_governor
                    .is_on_target(Ratio::new::<percent>(
                        Self::MARGIN_PERCENT_TO_TARGET_TO_SHOW_DECEL_IN_LANDING_MODE,
                    ))
                {
                    self.decelerating_light = true;
                } else if !self
                    .deceleration_governor
                    .is_on_target(Ratio::new::<percent>(
                        Self::MARGIN_PERCENT_TO_TARGET_TO_REMOVE_DECEL_IN_LANDING_MODE,
                    ))
                {
                    self.decelerating_light = false;
                }
            }
            A380AutobrakeMode::RTO => {
                if self
                    .deceleration_governor
                    .decelerating_at_or_above_rate(Acceleration::new::<meter_per_second_squared>(
                        Self::TARGET_TO_SHOW_DECEL_IN_RTO_MS2,
                    ))
                {
                    self.decelerating_light = true;
                } else if !self.deceleration_governor.decelerating_at_or_above_rate(
                    Acceleration::new::<meter_per_second_squared>(
                        Self::TARGET_TO_REMOVE_DECEL_IN_RTO_MS2,
                    ),
                ) {
                    self.decelerating_light = false;
                }
            }
        }
    }

    fn deceleration_demanded(&self) -> bool {
        self.deceleration_governor.is_engaged()
            && self.target.get::<meter_per_second_squared>() < 0.
    }

    fn should_disarm_due_to_pedal_input(&self) -> bool {
        // Thresholds from A320, TBC for A380
        match self.mode {
            A380AutobrakeMode::DISARM => false,
            A380AutobrakeMode::LOW
            | A380AutobrakeMode::L2
            | A380AutobrakeMode::L3
            | A380AutobrakeMode::HIGH
            | A380AutobrakeMode::BTV => {
                self.left_brake_pedal_input > Ratio::new::<percent>(53.)
                    || self.right_brake_pedal_input > Ratio::new::<percent>(53.)
                    || (self.left_brake_pedal_input > Ratio::new::<percent>(11.)
                        && self.right_brake_pedal_input > Ratio::new::<percent>(11.))
            }
            A380AutobrakeMode::RTO => {
                self.left_brake_pedal_input > Ratio::new::<percent>(77.)
                    || self.right_brake_pedal_input > Ratio::new::<percent>(77.)
                    || (self.left_brake_pedal_input > Ratio::new::<percent>(53.)
                        && self.right_brake_pedal_input > Ratio::new::<percent>(53.))
            }
        }
    }

    fn should_disarm(&self, context: &UpdateContext, autobrake_panel: &A380AutobrakePanel) -> bool {
        // when a simulation is started in flight, some values need to be ignored for a certain time to ensure
        // an unintended disarm is not happening
        (self.deceleration_governor.is_engaged() && self.should_disarm_due_to_pedal_input())
            || (context.is_sim_ready() && !self.arming_is_allowed_by_bcu)
            || self.spoilers_retracted_during_this_update()
            || self.rto_mode_deselected_this_update(autobrake_panel)
            || self.should_disarm_after_time_in_flight.output()
            || (self.external_disarm_event && self.mode != A380AutobrakeMode::RTO)
            || (self.mode == A380AutobrakeMode::RTO
                && self.should_reject_rto_mode_after_time_in_flight.output())
    }

    fn disarm_actions(&mut self) {
        self.autobrake_knob.disarm(true);
        self.nose_gear_was_compressed_once = false;
    }

    fn calculate_target(&mut self) -> Acceleration {
        Acceleration::new::<meter_per_second_squared>(match self.mode {
            A380AutobrakeMode::DISARM => Self::OFF_MODE_DECEL_TARGET_MS2,
            A380AutobrakeMode::LOW => interpolation(
                &Self::NORMAL_MODE_DECEL_PROFILE_TIME_S,
                &Self::LOW_MODE_DECEL_PROFILE_ACCEL_MS2,
                self.deceleration_governor.time_engaged().as_secs_f64(),
            ),
            A380AutobrakeMode::L2 => interpolation(
                &Self::NORMAL_MODE_DECEL_PROFILE_TIME_S,
                &Self::L2_MODE_DECEL_PROFILE_ACCEL_MS2,
                self.deceleration_governor.time_engaged().as_secs_f64(),
            ),
            A380AutobrakeMode::L3 => interpolation(
                &Self::NORMAL_MODE_DECEL_PROFILE_TIME_S,
                &Self::L3_MODE_DECEL_PROFILE_ACCEL_MS2,
                self.deceleration_governor.time_engaged().as_secs_f64(),
            ),
            A380AutobrakeMode::HIGH => interpolation(
                &Self::NORMAL_MODE_DECEL_PROFILE_TIME_S,
                &Self::HIGH_MODE_DECEL_PROFILE_ACCEL_MS2,
                self.deceleration_governor.time_engaged().as_secs_f64(),
            ),
            A380AutobrakeMode::BTV => self.compute_btv_decel_target_ms2(),
            A380AutobrakeMode::RTO => Self::RTO_MODE_DECEL_TARGET_MS2,
        })
    }

    fn compute_btv_decel_target_ms2(&self) -> f64 {
        // Placeholder BTV deceleration

        interpolation(
            &Self::BTV_MODE_DECEL_PROFILE_TIME_S,
            &Self::BTV_MODE_DECEL_PROFILE_ACCEL_MS2,
            self.deceleration_governor.time_engaged().as_secs_f64(),
        )
    }

    fn update_input_conditions(
        &mut self,
        context: &UpdateContext,
        allow_arming: bool,
        pedal_input_left: Ratio,
        pedal_input_right: Ratio,
        lgciu1: &impl LgciuInterface,
        lgciu2: &impl LgciuInterface,
    ) {
        let in_flight_lgciu1 =
            !lgciu1.right_gear_compressed(false) && !lgciu1.left_gear_compressed(false);
        let in_flight_lgciu2 =
            !lgciu2.right_gear_compressed(false) && !lgciu2.left_gear_compressed(false);

        // Stays true until disarming
        self.nose_gear_was_compressed_once = self.nose_gear_was_compressed_once
            || lgciu1.nose_gear_compressed(false)
            || lgciu2.nose_gear_compressed(false);

        self.ground_spoilers_are_deployed_since_5s
            .update(context, self.ground_spoilers_are_deployed);
        self.should_disarm_after_time_in_flight
            .update(context, in_flight_lgciu1 && in_flight_lgciu2);
        self.should_reject_rto_mode_after_time_in_flight
            .update(context, in_flight_lgciu1 && in_flight_lgciu2);

        self.arming_is_allowed_by_bcu = allow_arming;
        self.left_brake_pedal_input = pedal_input_left;
        self.right_brake_pedal_input = pedal_input_right;
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        autobrake_panel: &A380AutobrakePanel,
        allow_arming: bool,
        pedal_input_left: Ratio,
        pedal_input_right: Ratio,
        lgciu1: &impl LgciuInterface,
        lgciu2: &impl LgciuInterface,
        placeholder_ground_spoilers_out: bool,
    ) {
        self.update_input_conditions(
            context,
            allow_arming,
            pedal_input_left,
            pedal_input_right,
            lgciu1,
            lgciu2,
        );

        self.mode = self.determine_mode(context, autobrake_panel);

        self.deceleration_governor
            .engage_when(self.should_engage_deceleration_governor(context, autobrake_panel));

        self.target = self.calculate_target();
        self.deceleration_governor.update(context, self.target);
        self.update_decelerating_light_info();

        self.placeholder_ground_spoilers_out = placeholder_ground_spoilers_out;
    }
}
impl SimulationElement for A380AutobrakeController {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.autobrake_knob.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.armed_mode_id, self.mode as u8 as f64);
        writer.write(&self.decel_light_id, self.is_decelerating());
        writer.write(&self.active_id, self.deceleration_demanded());
        writer.write(&self.rto_mode_armed_id, self.mode == A380AutobrakeMode::RTO);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.last_ground_spoilers_are_deployed = self.ground_spoilers_are_deployed;
        self.ground_spoilers_are_deployed = self.placeholder_ground_spoilers_out;

        self.external_disarm_event = reader.read(&self.external_disarm_event_id);

        // Reading current mode in sim to initialize correct mode if sim changes it (from .FLT files for example)
        let readed_mode = reader.read_f64(&self.armed_mode_id);
        if readed_mode >= 0.0 {
            self.mode = readed_mode.into();
        }
    }
}
