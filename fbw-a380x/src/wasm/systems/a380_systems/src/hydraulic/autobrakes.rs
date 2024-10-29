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

    const LOW_MODE_DECEL_PROFILE_ACCEL_MS2: [f64; 3] = [4., 0., -2.];
    const L2_MODE_DECEL_PROFILE_ACCEL_MS2: [f64; 3] = [4., 0., -2.5];
    const L3_MODE_DECEL_PROFILE_ACCEL_MS2: [f64; 3] = [4., 0., -3.];
    const HIGH_MODE_DECEL_PROFILE_ACCEL_MS2: [f64; 3] = [4., -2., -3.5];

    const RTO_MODE_DECEL_TARGET_MS2: f64 = -6.;
    const OFF_MODE_DECEL_TARGET_MS2: f64 = 5.;

    const MARGIN_PERCENT_TO_TARGET_TO_SHOW_DECEL_IN_LANDING_MODE: f64 = 80.;
    const MARGIN_PERCENT_TO_TARGET_TO_REMOVE_DECEL_IN_LANDING_MODE: f64 = 70.;
    const TARGET_TO_SHOW_DECEL_IN_RTO_MS2: f64 = -2.7;
    const TARGET_TO_REMOVE_DECEL_IN_RTO_MS2: f64 = -2.;

    const KNOB_SOLENOID_DISARM_DELAY: Duration = Duration::from_millis(1000);

    pub fn new(context: &mut InitContext) -> A380AutobrakeController {
        A380AutobrakeController {
            armed_mode_id: context.get_identifier("AUTOBRAKES_ARMED_MODE".to_owned()),
            decel_light_id: context.get_identifier("AUTOBRAKES_DECEL_LIGHT".to_owned()),
            active_id: context.get_identifier("AUTOBRAKES_ACTIVE".to_owned()),
            rto_mode_armed_id: context.get_identifier("AUTOBRAKES_RTO_ARMED".to_owned()),

            external_deactivation_event_id: context
                .get_identifier("AUTOBRAKE_INSTINCTIVE_DISCONNECT".to_owned()),

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
            selection_knob_should_return_disarm: DelayedTrueLogicGate::new(
                Self::KNOB_SOLENOID_DISARM_DELAY,
            ),

            external_deactivation_event: false,

            placeholder_ground_spoilers_out: false,

            btv_scheduler: BtvDecelScheduler::new(context),

            braking_distance_calculator: BrakingDistanceCalculator::new(context),
            autobrake_runway_overrun_protection: AutobrakeRunwayOverrunProtection::new(context),
        }
    }

    fn spoilers_retracted_during_this_update(&self) -> bool {
        !self.ground_spoilers_are_deployed && self.last_ground_spoilers_are_deployed
    }

    fn rto_mode_deselected_this_update(&self, autobrake_panel: &A380AutobrakePanel) -> bool {
        self.mode == A380AutobrakeMode::RTO && autobrake_panel.rto_pressed()
    }

    pub fn brake_output(&self) -> Ratio {
        if self
            .autobrake_runway_overrun_protection
            .rop_max_braking_requested()
        {
            Ratio::new::<ratio>(1.)
        } else {
            Ratio::new::<ratio>(self.deceleration_governor.output())
        }
    }

    fn determine_mode(&mut self, autobrake_panel: &A380AutobrakePanel) -> A380AutobrakeMode {
        if self.mode != A380AutobrakeMode::RTO
            && autobrake_panel.rto_pressed()
            && !self.should_reject_rto_mode_after_time_in_flight.output()
        {
            A380AutobrakeMode::RTO
        } else if autobrake_panel.selected_mode_has_changed() {
            match autobrake_panel.selected_mode() {
                A380AutobrakeKnobPosition::DISARM => A380AutobrakeMode::DISARM,
                A380AutobrakeKnobPosition::LOW => A380AutobrakeMode::LOW,
                A380AutobrakeKnobPosition::L2 => A380AutobrakeMode::L2,
                A380AutobrakeKnobPosition::L3 => A380AutobrakeMode::L3,
                A380AutobrakeKnobPosition::HIGH => A380AutobrakeMode::HIGH,
                A380AutobrakeKnobPosition::BTV => {
                    self.btv_scheduler.enable();
                    A380AutobrakeMode::BTV
                }
            }
        } else {
            self.mode
        }
    }

    fn should_engage_deceleration_governor(&self, context: &UpdateContext) -> bool {
        self.is_armed()
            && self.ground_spoilers_are_deployed // We wait 5s after deploy, but they need to be deployed even if nose compressed
            && (self.ground_spoilers_are_deployed_since_5s.output()
                || self.nose_gear_was_compressed_once)
            && !self.should_disarm(context)
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

    fn should_disarm(&self, context: &UpdateContext) -> bool {
        // when a simulation is started in flight, some values need to be ignored for a certain time to ensure
        // an unintended disarm is not happening
        (self.deceleration_governor.is_engaged() && self.should_disarm_due_to_pedal_input())
            || (self.deceleration_governor.is_engaged()
                && (self.external_deactivation_event && self.mode != A380AutobrakeMode::RTO))
            || (context.is_sim_ready() && !self.arming_is_allowed_by_bcu)
            || self.spoilers_retracted_during_this_update()
            || self.should_disarm_after_time_in_flight.output()
            || (self.mode == A380AutobrakeMode::RTO
                && self.should_reject_rto_mode_after_time_in_flight.output())
            || (self.mode == A380AutobrakeMode::BTV && !self.btv_scheduler.is_armed())
    }

    fn disarm_actions(&mut self) {
        self.btv_scheduler.disarm();
        self.nose_gear_was_compressed_once = false;
        self.mode = A380AutobrakeMode::DISARM;
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
        self.btv_scheduler.decel().get::<meter_per_second_squared>()
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

        self.braking_distance_calculator.update_braking_estimations(
            context,
            if self.mode == A380AutobrakeMode::BTV {
                self.btv_scheduler.predicted_decel()
            } else if self.mode != A380AutobrakeMode::DISARM {
                context.long_accel()
            } else {
                Acceleration::default()
            },
        );

        let rto_disable = self.rto_mode_deselected_this_update(autobrake_panel);

        self.mode = self.determine_mode(autobrake_panel);

        if rto_disable || self.should_disarm(context) {
            self.disarm_actions();
        }

        if self.mode != A380AutobrakeMode::BTV {
            self.btv_scheduler.disarm()
        }

        self.selection_knob_should_return_disarm.update(
            context,
            (self.mode == A380AutobrakeMode::DISARM || self.mode == A380AutobrakeMode::RTO)
                && !autobrake_panel.is_disarmed_position(),
        );

        // Disarm solenoid only when arming is lost
        self.autobrake_knob
            .disarm(self.selection_knob_should_return_disarm.output());

        self.deceleration_governor
            .engage_when(self.should_engage_deceleration_governor(context));

        self.target = self.calculate_target();
        self.deceleration_governor.update(context, self.target);
        self.update_decelerating_light_info();

        self.placeholder_ground_spoilers_out = placeholder_ground_spoilers_out;

        self.btv_scheduler.update(
            context,
            self.ground_spoilers_are_deployed,
            &self.braking_distance_calculator,
            &self.autobrake_runway_overrun_protection,
        );

        self.autobrake_runway_overrun_protection.update(
            context,
            self.deceleration_governor.is_engaged(),
            &self.braking_distance_calculator,
            lgciu1,
            lgciu2,
        )
    }
}
impl SimulationElement for A380AutobrakeController {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.autobrake_knob.accept(visitor);
        self.braking_distance_calculator.accept(visitor);
        self.btv_scheduler.accept(visitor);
        self.autobrake_runway_overrun_protection.accept(visitor);

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

        self.external_deactivation_event = reader.read(&self.external_deactivation_event_id);

        // Reading current mode in sim to initialize correct mode if sim changes it (from .FLT files for example)
        let readed_mode = reader.read_f64(&self.armed_mode_id);
        if readed_mode >= 0.0 {
            self.mode = readed_mode.into();
        }
    }
}

struct AutobrakeRunwayOverrunProtection {
    distance_to_runway_end_id: VariableIdentifier,
    autobrake_row_rop_word_id: VariableIdentifier,

    thrust_en1_id: VariableIdentifier,
    thrust_en2_id: VariableIdentifier,
    thrust_en3_id: VariableIdentifier,
    thrust_en4_id: VariableIdentifier,

    throttle_percents: [f64; 4],

    distance_to_runway_end: Arinc429Word<Length>,

    is_actively_braking: bool,

    is_any_autobrake_active: bool,

    status_word: Arinc429Word<u32>,
}
impl AutobrakeRunwayOverrunProtection {
    const MIN_ARMING_SPEED_MS2: f64 = 10.28;

    fn new(context: &mut InitContext) -> Self {
        Self {
            distance_to_runway_end_id: context
                .get_identifier("OANS_BTV_REMAINING_DIST_TO_RWY_END".to_owned()),
            autobrake_row_rop_word_id: context.get_identifier("ROW_ROP_WORD_1".to_owned()),

            thrust_en1_id: context.get_identifier("AUTOTHRUST_TLA:1".to_owned()),
            thrust_en2_id: context.get_identifier("AUTOTHRUST_TLA:2".to_owned()),
            thrust_en3_id: context.get_identifier("AUTOTHRUST_TLA:3".to_owned()),
            thrust_en4_id: context.get_identifier("AUTOTHRUST_TLA:4".to_owned()),

            throttle_percents: [0.; 4],

            distance_to_runway_end: Arinc429Word::new(
                Length::default(),
                SignStatus::NoComputedData,
            ),

            is_actively_braking: false,

            is_any_autobrake_active: false,

            status_word: Arinc429Word::new(0, SignStatus::NormalOperation),
        }
    }

    fn is_row_rop_operative(&self, context: &UpdateContext) -> bool {
        self.distance_to_runway_end.is_normal_operation()
            && context.ground_speed().get::<meter_per_second>() > Self::MIN_ARMING_SPEED_MS2
    }

    fn distance_to_runway_end(&self) -> Length {
        if self.distance_to_runway_end.is_normal_operation() {
            self.distance_to_runway_end.value()
        } else {
            Length::new::<meter>(5000.)
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        is_any_autobrake_active: bool,
        braking_distances: &BrakingDistanceCalculator,
        lgciu1: &impl LgciuInterface,
        lgciu2: &impl LgciuInterface,
    ) {
        self.is_any_autobrake_active = is_any_autobrake_active;

        let is_on_ground = lgciu1.left_and_right_gear_compressed(false)
            || lgciu2.left_and_right_gear_compressed(false);

        let max_braking_prediction = braking_distances.max_braking();

        // Can engage only above min speed
        if self.is_row_rop_operative(context) && self.is_any_autobrake_active {
            if max_braking_prediction >= self.distance_to_runway_end.value() {
                self.is_actively_braking = true;
            }
        } else {
            // Can only disengage if autobrake or distance lost (not from speed)
            // TODO ROP can revert if braking force is sufficient
            if !self.distance_to_runway_end.is_normal_operation() || !self.is_any_autobrake_active {
                self.is_actively_braking = false;
            }
        }

        // IS operative
        self.status_word
            .set_bit(11, self.is_row_rop_operative(context));

        // Is active under autobrake
        self.status_word.set_bit(12, self.is_actively_braking);

        // Is active under manual braking
        self.status_word.set_bit(
            13,
            self.should_show_manual_braking_warning(context, max_braking_prediction, is_on_ground),
        );

        let should_show_in_flight_row = !is_on_ground && self.is_row_rop_operative(context);
        // Too short if wet
        self.status_word.set_bit(
            14,
            should_show_in_flight_row
                && braking_distances.wet_landing() >= self.distance_to_runway_end.value(),
        );

        // Too short for dry
        self.status_word.set_bit(
            15,
            should_show_in_flight_row
                && braking_distances.dry_landing() >= self.distance_to_runway_end.value(),
        );
    }

    fn rop_max_braking_requested(&self) -> bool {
        self.is_actively_braking
    }

    fn should_show_manual_braking_warning(
        &self,
        context: &UpdateContext,
        dry_stopping_prediction: Length,
        is_on_ground: bool,
    ) -> bool {
        let any_engine_not_idle_or_reverse = self.throttle_percents.iter().any(|&x| x > 2.);

        if is_on_ground
            && !any_engine_not_idle_or_reverse
            && !self.is_any_autobrake_active
            && self.is_row_rop_operative(context)
        {
            dry_stopping_prediction >= self.distance_to_runway_end.value()
        } else {
            false
        }
    }
}
impl SimulationElement for AutobrakeRunwayOverrunProtection {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.autobrake_row_rop_word_id, self.status_word);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        let raw_feet_runway_end_arinc: Arinc429Word<f64> =
            reader.read_arinc429(&self.distance_to_runway_end_id);

        self.distance_to_runway_end = Arinc429Word::new(
            Length::new::<meter>(raw_feet_runway_end_arinc.value()),
            raw_feet_runway_end_arinc.ssm(),
        );

        let tla1: f64 = reader.read(&self.thrust_en1_id);
        let tla2: f64 = reader.read(&self.thrust_en2_id);
        let tla3: f64 = reader.read(&self.thrust_en3_id);
        let tla4: f64 = reader.read(&self.thrust_en4_id);
        self.throttle_percents = [tla1, tla2, tla3, tla4];
    }
}

#[derive(PartialEq, Clone, Copy, Debug)]
enum BTVState {
    Disabled,
    Armed,
    RotOptimization,
    Decel,
    EndOfBraking,
}

struct BrakingDistanceCalculator {
    wet_estimated_distance_id: VariableIdentifier,
    dry_estimated_distance_id: VariableIdentifier,
    autobrake_estimated_stop_id: VariableIdentifier,
    predicted_touchdown_speed_id: VariableIdentifier,

    dry_landing_estimated_distance: LowPassFilter<Length>,
    wet_landing_estimated_distance: LowPassFilter<Length>,
    braking_estimated_distance_at_current_decel: LowPassFilter<Length>,
    braking_estimated_distance_at_max_decel: LowPassFilter<Length>,
    predicted_touchdown_speed: Velocity,
}
impl BrakingDistanceCalculator {
    const MAX_DECEL_DRY_MS2: f64 = -2.8;
    const MAX_DECEL_WET_MS2: f64 = -1.8;

    const MIN_DECEL_FOR_STOPPING_ESTIMATION_MS2: f64 = -0.2;
    const MIN_SPEED_FOR_STOPPING_ESTIMATION_MS: f64 = 15.;

    const MAX_STOPPING_DISTANCE_M: f64 = 5000.;

    const ROLLING_TIME_AFTER_TD_BEFORE_BRAKES_S: f64 = 5.;

    // Offset for stop bar so it shows at front of the plane instead of its reference position
    const OFFSET_PLANE_REF_POINT_TO_FRONT_METERS: f64 = 40.;

    const ALTITUDE_THRESHOLD_TO_SWITCH_ESTIMATION_TO_GROUND_SPEED_FT: f64 = 500.;
    const MIN_PREDICTED_TOUCHDOWN_SPEED_KNOT: f64 = 100.;

    fn new(context: &mut InitContext) -> Self {
        Self {
            wet_estimated_distance_id: context
                .get_identifier("OANS_BTV_WET_DISTANCE_ESTIMATED".to_owned()),
            dry_estimated_distance_id: context
                .get_identifier("OANS_BTV_DRY_DISTANCE_ESTIMATED".to_owned()),

            autobrake_estimated_stop_id: context
                .get_identifier("OANS_BTV_STOP_BAR_DISTANCE_ESTIMATED".to_owned()),
            predicted_touchdown_speed_id: context.get_identifier("SPEEDS_VAPP".to_owned()),

            dry_landing_estimated_distance: LowPassFilter::new(Duration::from_millis(800)),
            wet_landing_estimated_distance: LowPassFilter::new(Duration::from_millis(800)),
            braking_estimated_distance_at_current_decel: LowPassFilter::new(Duration::from_millis(
                500,
            )),
            braking_estimated_distance_at_max_decel: LowPassFilter::new(Duration::from_millis(500)),

            predicted_touchdown_speed: Velocity::default(),
        }
    }

    fn update_braking_estimations(&mut self, context: &UpdateContext, deceleration: Acceleration) {
        // TODO use correct input to switch speed used
        let speed_used_for_prediction = if context.plane_height_over_ground().get::<foot>()
            < Self::ALTITUDE_THRESHOLD_TO_SWITCH_ESTIMATION_TO_GROUND_SPEED_FT
        {
            context.ground_speed()
        } else {
            self.predicted_touchdown_speed.max(Velocity::new::<knot>(
                Self::MIN_PREDICTED_TOUCHDOWN_SPEED_KNOT,
            ))
        };

        if context.ground_speed().get::<meter_per_second>()
            > Self::MIN_SPEED_FOR_STOPPING_ESTIMATION_MS
        {
            self.wet_landing_estimated_distance.update(
                context.delta(),
                self.stopping_distance_estimation_for_wet(speed_used_for_prediction),
            );
            self.dry_landing_estimated_distance.update(
                context.delta(),
                self.stopping_distance_estimation_for_dry(speed_used_for_prediction),
            );
        } else {
            self.wet_landing_estimated_distance.reset(Length::default());
            self.dry_landing_estimated_distance.reset(Length::default());
        }

        if context.long_accel().get::<meter_per_second_squared>()
            < Self::MIN_DECEL_FOR_STOPPING_ESTIMATION_MS2
            && context.ground_speed().get::<meter_per_second>()
                > Self::MIN_SPEED_FOR_STOPPING_ESTIMATION_MS
        {
            self.braking_estimated_distance_at_current_decel.update(
                context.delta(),
                self.stopping_distance_estimation_for_decel(context.ground_speed(), deceleration),
            );
            self.braking_estimated_distance_at_max_decel.update(
                context.delta(),
                self.stopping_distance_estimation_for_decel(
                    context.ground_speed(),
                    Acceleration::new::<meter_per_second_squared>(Self::MAX_DECEL_DRY_MS2),
                ),
            );
        } else {
            self.braking_estimated_distance_at_current_decel
                .reset(Length::default());
            self.braking_estimated_distance_at_max_decel
                .reset(Length::default());
        }
    }

    fn stopping_distance_estimation_for_dry(&self, current_speed: Velocity) -> Length {
        self.distance_run_before_autobrake_active(current_speed)
            + self.stopping_distance_estimation_for_decel(
                current_speed,
                Acceleration::new::<meter_per_second_squared>(Self::MAX_DECEL_DRY_MS2),
            )
    }

    fn stopping_distance_estimation_for_wet(&self, current_speed: Velocity) -> Length {
        self.distance_run_before_autobrake_active(current_speed)
            + self.stopping_distance_estimation_for_decel(
                current_speed,
                Acceleration::new::<meter_per_second_squared>(Self::MAX_DECEL_WET_MS2),
            )
    }

    fn stopping_distance_estimation_for_decel(
        &self,
        current_speed: Velocity,
        deceleration: Acceleration,
    ) -> Length {
        if deceleration.get::<meter_per_second_squared>()
            < Self::MIN_DECEL_FOR_STOPPING_ESTIMATION_MS2
        {
            Length::new::<meter>(
                (current_speed.get::<meter_per_second>().powi(2)
                    / (2. * deceleration.get::<meter_per_second_squared>().abs()))
                .clamp(0., Self::MAX_STOPPING_DISTANCE_M),
            )
        } else {
            Length::new::<meter>(0.)
        }
    }

    fn dry_landing(&self) -> Length {
        self.dry_landing_estimated_distance.output()
    }

    fn max_braking(&self) -> Length {
        self.braking_estimated_distance_at_max_decel.output()
    }

    fn wet_landing(&self) -> Length {
        self.wet_landing_estimated_distance.output()
    }

    fn distance_run_before_autobrake_active(&self, speed_at_touchdown: Velocity) -> Length {
        Length::new::<meter>(
            speed_at_touchdown.get::<meter_per_second>()
                * Self::ROLLING_TIME_AFTER_TD_BEFORE_BRAKES_S,
        )
    }
}
impl SimulationElement for BrakingDistanceCalculator {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.wet_estimated_distance_id,
            self.wet_landing_estimated_distance.output().get::<meter>(),
        );
        writer.write(
            &self.dry_estimated_distance_id,
            self.dry_landing_estimated_distance.output().get::<meter>(),
        );

        writer.write(
            &self.autobrake_estimated_stop_id,
            self.braking_estimated_distance_at_current_decel
                .output()
                .get::<meter>()
                + Self::OFFSET_PLANE_REF_POINT_TO_FRONT_METERS,
        );
    }
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.predicted_touchdown_speed = reader.read(&self.predicted_touchdown_speed_id);
    }
}

struct BtvDecelScheduler {
    in_flight_btv_stopping_distance_id: VariableIdentifier,
    runway_length_id: VariableIdentifier,
    distance_to_exit_id: VariableIdentifier,
    rot_estimation_id: VariableIdentifier,
    turnaround_idle_reverse_estimation_id: VariableIdentifier,
    turnaround_max_reverse_estimation_id: VariableIdentifier,

    runway_length: Arinc429Word<Length>,

    rolling_distance: Length,
    in_flight_btv_stopping_distance: Arinc429Word<Length>,
    oans_distance_to_exit: Arinc429Word<Length>,

    spoilers_active: bool,

    state: BTVState,

    deceleration_request: Acceleration,
    end_of_decel_acceleration: Acceleration,
    desired_deceleration: Acceleration,

    actual_deceleration: Acceleration,

    final_distance_remaining: Length,

    distance_remaining_at_decel_activation: Length,

    dry_prediction: Length,
    wet_prediction: Length,

    distance_to_rwy_end: Length,
}
impl BtvDecelScheduler {
    // Target decel when optimizing runway time before braking
    const ROT_OPTIMIZATION_TARGET_DECEL_M_S_2: f64 = -0.2;

    // Target decel ratio to switch from ROT optimization to braking phase
    const DECEL_RATIO_TO_REACH_TO_START_DECEL: f64 = 0.98;

    const MAX_DECEL_DRY_MS2: f64 = -3.0;
    const MAX_DECEL_WET_MS2: f64 = -2.0;

    const MIN_RUNWAY_LENGTH_M: f64 = 1500.;

    const DISTANCE_OFFSET_TO_RELEASE_BTV_M: f64 = 65.5; // Targeted distance for deceleration computation
    const DISTANCE_TO_RELEASE_BTV_M: f64 = 50.; // Targeted distance to cut off BTV mode

    const TARGET_SPEED_TO_RELEASE_BTV_M_S: f64 = 5.15;
    const SAFETY_RATIO_ON_RELEASE_SPEED: f64 = 0.9; // 0.9 = -10% margin on TARGET_SPEED_TO_RELEASE_BTV_M_S

    const MAX_DECEL_SAFETY_MARGIN_RATIO: f64 = 1.4;
    const MIN_DECEL_SAFETY_MARGIN_RATIO: f64 = 1.15;
    const DECEL_SAFETY_MARGIN_SHAPING_FACTOR: f64 = 0.4;

    const REMAINING_BRAKING_DISTANCE_END_OF_RUNWAY_OFFSET_METERS: f64 = 300.;

    fn new(context: &mut InitContext) -> Self {
        Self {
            in_flight_btv_stopping_distance_id: context
                .get_identifier("OANS_BTV_REQ_STOPPING_DISTANCE".to_owned()),
            runway_length_id: context.get_identifier("OANS_RWY_LENGTH".to_owned()),
            distance_to_exit_id: context
                .get_identifier("OANS_BTV_REMAINING_DIST_TO_EXIT".to_owned()),
            rot_estimation_id: context.get_identifier("BTV_ROT".to_owned()),
            turnaround_idle_reverse_estimation_id: context
                .get_identifier("BTV_TURNAROUND_IDLE_REVERSE".to_owned()),
            turnaround_max_reverse_estimation_id: context
                .get_identifier("BTV_TURNAROUND_MAX_REVERSE".to_owned()),

            runway_length: Arinc429Word::new(Length::default(), SignStatus::NoComputedData),
            rolling_distance: Length::default(),
            in_flight_btv_stopping_distance: Arinc429Word::new(
                Length::default(),
                SignStatus::NoComputedData,
            ),
            oans_distance_to_exit: Arinc429Word::new(Length::default(), SignStatus::NoComputedData),

            spoilers_active: false,

            state: BTVState::Disabled,

            deceleration_request: Acceleration::default(),
            end_of_decel_acceleration: Acceleration::default(),
            desired_deceleration: Acceleration::new::<meter_per_second_squared>(
                Self::MAX_DECEL_DRY_MS2,
            ),
            actual_deceleration: Acceleration::default(),

            final_distance_remaining: Length::default(),

            distance_remaining_at_decel_activation: Length::default(),

            dry_prediction: Length::default(),
            wet_prediction: Length::default(),

            distance_to_rwy_end: Length::default(),
        }
    }

    fn enable(&mut self) {
        if self.state == BTVState::Disabled && self.arming_authorized() {
            self.state = BTVState::Armed;
        }
    }

    fn disarm(&mut self) {
        self.state = BTVState::Disabled;
        self.deceleration_request = Acceleration::new::<meter_per_second_squared>(5.);
        self.end_of_decel_acceleration = Acceleration::new::<meter_per_second_squared>(5.);
        self.final_distance_remaining = Length::default();
        self.distance_remaining_at_decel_activation = Length::default();
        self.desired_deceleration =
            Acceleration::new::<meter_per_second_squared>(Self::MAX_DECEL_DRY_MS2);
    }

    fn decel(&self) -> Acceleration {
        match self.state {
            BTVState::Decel => self.deceleration_request,
            BTVState::EndOfBraking => self.end_of_decel_acceleration,
            BTVState::RotOptimization => self.accel_during_rot_opti(),
            BTVState::Disabled | BTVState::Armed => {
                Acceleration::new::<meter_per_second_squared>(5.)
            }
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        spoilers_active: bool,
        braking_distance: &BrakingDistanceCalculator,
        rop: &AutobrakeRunwayOverrunProtection,
    ) {
        self.distance_to_rwy_end = rop.distance_to_runway_end();

        self.wet_prediction = braking_distance.wet_landing();
        self.dry_prediction = braking_distance.dry_landing();

        self.spoilers_active = spoilers_active;
        self.actual_deceleration = context.long_accel();

        self.integrate_distance(context);

        self.compute_decel(context);

        self.state = self.update_state(context);
    }

    fn braking_distance_remaining(&self) -> Length {
        let distance_remaining_raw = if self.is_oans_fallback_mode() {
            self.in_flight_btv_stopping_distance.value() - self.rolling_distance
        } else {
            self.oans_distance_to_exit.value()
        };

        // Distance to runway end minus a margin from FCOM reference (cannot be negative)
        let distance_to_runway_end_minus_margin = (self.distance_to_rwy_end
            - Length::new::<meter>(Self::REMAINING_BRAKING_DISTANCE_END_OF_RUNWAY_OFFSET_METERS))
        .max(Length::default());

        // BTV remaining distance is raw distance minus a small offset before exit
        //      Max distance is clamped to end of rwy minus margin as BTV will never target a further end of decel point
        (distance_remaining_raw - Length::new::<meter>(Self::DISTANCE_OFFSET_TO_RELEASE_BTV_M))
            .clamp(Length::default(), distance_to_runway_end_minus_margin)
    }

    fn compute_decel(&mut self, context: &UpdateContext) {
        match self.state {
            BTVState::RotOptimization | BTVState::Decel | BTVState::EndOfBraking => {
                let speed_at_btv_release =
                    Velocity::new::<meter_per_second>(Self::TARGET_SPEED_TO_RELEASE_BTV_M_S)
                        * Self::SAFETY_RATIO_ON_RELEASE_SPEED;

                self.final_distance_remaining = self.braking_distance_remaining();

                let delta_speed_to_achieve = context.ground_speed() - speed_at_btv_release;

                let target_deceleration_raw =
                    -delta_speed_to_achieve.get::<meter_per_second>().powi(2)
                        / (2. * self.final_distance_remaining.get::<meter>());

                let target_deceleration_safety_corrected =
                    target_deceleration_raw * self.safety_margin();

                self.deceleration_request = Acceleration::new::<meter_per_second_squared>(
                    target_deceleration_safety_corrected.clamp(
                        self.desired_deceleration.get::<meter_per_second_squared>(),
                        5.,
                    ),
                );
            }
            BTVState::Armed | BTVState::Disabled => {
                self.deceleration_request = Acceleration::new::<meter_per_second_squared>(5.);
            }
        }
    }

    fn arming_authorized(&self) -> bool {
        self.runway_length.is_normal_operation()
            && self.runway_length.value().get::<meter>() >= Self::MIN_RUNWAY_LENGTH_M
            && self.in_flight_btv_stopping_distance.is_normal_operation()
            && self.runway_length.value().get::<meter>() > self.dry_prediction.get::<meter>()
    }

    fn accel_to_reach_to_decelerate(&self) -> Acceleration {
        self.desired_deceleration * Self::DECEL_RATIO_TO_REACH_TO_START_DECEL
    }

    fn accel_during_rot_opti(&self) -> Acceleration {
        Acceleration::new::<meter_per_second_squared>(Self::ROT_OPTIMIZATION_TARGET_DECEL_M_S_2)
    }

    // Safety margin gives a dynamic ratio on targeted decel based on remaining distance
    fn safety_margin(&self) -> f64 {
        match self.state {
            BTVState::Decel | BTVState::EndOfBraking => {
                let ratio_of_decel_distance =
                    self.braking_distance_remaining() / self.distance_remaining_at_decel_activation;

                (1. + (ratio_of_decel_distance.get::<ratio>().sqrt()
                    * Self::DECEL_SAFETY_MARGIN_SHAPING_FACTOR))
                    .clamp(
                        Self::MIN_DECEL_SAFETY_MARGIN_RATIO,
                        Self::MAX_DECEL_SAFETY_MARGIN_RATIO,
                    )
            }

            BTVState::Disabled | BTVState::Armed | BTVState::RotOptimization => {
                Self::MAX_DECEL_SAFETY_MARGIN_RATIO
            }
        }
    }

    fn update_state(&mut self, context: &UpdateContext) -> BTVState {
        match self.state {
            BTVState::Armed => {
                if self.spoilers_active {
                    self.update_desired_btv_deceleration();
                    BTVState::RotOptimization
                } else if !self.arming_authorized() {
                    BTVState::Disabled
                } else {
                    self.state
                }
            }
            BTVState::RotOptimization => {
                let accel_min = self.accel_to_reach_to_decelerate();

                if self.deceleration_request < accel_min {
                    self.distance_remaining_at_decel_activation = self.braking_distance_remaining();
                    self.end_of_decel_acceleration = self.deceleration_request;
                    BTVState::Decel
                } else {
                    self.state
                }
            }
            BTVState::Decel => {
                if self.final_distance_remaining.get::<meter>() < Self::DISTANCE_TO_RELEASE_BTV_M
                    || context.ground_speed().get::<meter_per_second>()
                        <= Self::TARGET_SPEED_TO_RELEASE_BTV_M_S
                {
                    self.end_of_decel_acceleration = self.deceleration_request;
                    BTVState::EndOfBraking
                } else {
                    BTVState::Decel
                }
            }
            BTVState::EndOfBraking => {
                if context.ground_speed().get::<meter_per_second>()
                    <= Self::TARGET_SPEED_TO_RELEASE_BTV_M_S
                {
                    self.disarm();
                    BTVState::Disabled
                } else {
                    BTVState::EndOfBraking
                }
            }
            BTVState::Disabled => self.state,
        }
    }

    fn integrate_distance(&mut self, context: &UpdateContext) {
        match self.state {
            BTVState::RotOptimization | BTVState::Decel | BTVState::EndOfBraking => {
                let distance_this_tick = context.ground_speed() * context.delta_as_time();
                self.rolling_distance += distance_this_tick;
            }

            BTVState::Disabled | BTVState::Armed => self.rolling_distance = Length::default(),
        }
    }

    fn is_oans_fallback_mode(&self) -> bool {
        !self.oans_distance_to_exit.is_normal_operation()
    }

    fn is_armed(&self) -> bool {
        self.state != BTVState::Disabled
    }

    fn rot_estimation_for_distance(&self) -> Arinc429Word<u64> {
        let distance_valid = self.in_flight_btv_stopping_distance.is_normal_operation();

        if distance_valid {
            let distance = self.in_flight_btv_stopping_distance.value();

            // Magic statistical function: basic regression on a landing attempts database
            let rot_duration =
                Duration::from_secs_f64((distance.get::<meter>() * 0.0335).clamp(30., 200.));
            Arinc429Word::new(rot_duration.as_secs(), SignStatus::NormalOperation)
        } else {
            Arinc429Word::new(0, SignStatus::NoComputedData)
        }
    }

    fn turnaround_estimation_from_time_on_runway(
        &self,
        rot_seconds: f64,
    ) -> [Arinc429Word<u64>; 2] {
        let distance_valid = self.in_flight_btv_stopping_distance.is_normal_operation();

        if distance_valid && rot_seconds > 0. {
            let is_max_braking = self.braking_distance_remaining() < self.wet_prediction;

            // Magic statistical function for max turnaound. Idle is max+15%. 10% penalty if max braking is used
            let mut max_reverse_duration_minutes =
                (0.00495 * rot_seconds.powi(2) - 1.2244 * rot_seconds + 204.).clamp(10., 500.);

            if is_max_braking {
                max_reverse_duration_minutes *= 1.1;
            }

            let idle_reverse_duration_minutes =
                (max_reverse_duration_minutes * 1.15).clamp(10., 500.);

            [
                Arinc429Word::new(
                    max_reverse_duration_minutes as u64,
                    SignStatus::NormalOperation,
                ),
                Arinc429Word::new(
                    idle_reverse_duration_minutes as u64,
                    SignStatus::NormalOperation,
                ),
            ]
        } else {
            [
                Arinc429Word::new(0, SignStatus::NoComputedData),
                Arinc429Word::new(0, SignStatus::NoComputedData),
            ]
        }
    }

    fn predicted_decel(&self) -> Acceleration {
        match self.state {
            BTVState::Disabled | BTVState::Armed => Acceleration::default(),
            BTVState::RotOptimization => self.deceleration_request,
            BTVState::Decel | BTVState::EndOfBraking => self.actual_deceleration,
        }
    }

    fn update_desired_btv_deceleration(&mut self) {
        self.desired_deceleration = if self.braking_distance_remaining() < self.wet_prediction {
            Acceleration::new::<meter_per_second_squared>(Self::MAX_DECEL_DRY_MS2)
        } else {
            Acceleration::new::<meter_per_second_squared>(Self::MAX_DECEL_WET_MS2)
        };
    }
}
impl SimulationElement for BtvDecelScheduler {
    fn write(&self, writer: &mut SimulatorWriter) {
        let rot_arinc = self.rot_estimation_for_distance();
        let turnaround_time_estimated_in_minutes =
            self.turnaround_estimation_from_time_on_runway(rot_arinc.value() as f64);

        writer.write_arinc429(&self.rot_estimation_id, rot_arinc.value(), rot_arinc.ssm());

        writer.write_arinc429(
            &self.turnaround_idle_reverse_estimation_id,
            turnaround_time_estimated_in_minutes[1].value(),
            turnaround_time_estimated_in_minutes[1].ssm(),
        );
        writer.write_arinc429(
            &self.turnaround_max_reverse_estimation_id,
            turnaround_time_estimated_in_minutes[0].value(),
            turnaround_time_estimated_in_minutes[0].ssm(),
        );
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        let raw_in_flight_btv_stopping_distance_arinc: Arinc429Word<f64> =
            reader.read_arinc429(&self.in_flight_btv_stopping_distance_id);

        self.in_flight_btv_stopping_distance = Arinc429Word::new(
            Length::new::<meter>(raw_in_flight_btv_stopping_distance_arinc.value()),
            raw_in_flight_btv_stopping_distance_arinc.ssm(),
        );

        let raw_feet_runway_length_arinc: Arinc429Word<f64> =
            reader.read_arinc429(&self.runway_length_id);

        self.runway_length = Arinc429Word::new(
            Length::new::<meter>(raw_feet_runway_length_arinc.value()),
            raw_feet_runway_length_arinc.ssm(),
        );

        let raw_feet_exit_length_arinc: Arinc429Word<f64> =
            reader.read_arinc429(&self.distance_to_exit_id);

        self.oans_distance_to_exit = Arinc429Word::new(
            Length::new::<meter>(raw_feet_exit_length_arinc.value()),
            raw_feet_exit_length_arinc.ssm(),
        );
    }
}

#[cfg(test)]
mod braking_distance_tests {
    use systems::simulation::test::{TestBed, WriteByName};

    use super::*;
    use crate::systems::simulation::test::{ElementCtorFn, SimulationTestBed};

    #[test]
    fn landing_140_knot_dry_line() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(BrakingDistanceCalculator::new))
            .with_update_after_power_distribution(|e, context| {
                e.update_braking_estimations(context, Acceleration::default())
            });

        test_bed.set_on_ground(true);
        test_bed.write_by_name("GPS GROUND SPEED", 140.);
        test_bed.run_multiple_frames(Duration::from_secs(5));

        assert!(
            test_bed.query_element(|e| e.dry_landing().get::<meter>() > 1200.
                && test_bed.query_element(|e| e.dry_landing().get::<meter>() < 1500.))
        );
    }

    #[test]
    fn landing_140_knot_wet_line() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(BrakingDistanceCalculator::new))
            .with_update_after_power_distribution(|e, context| {
                e.update_braking_estimations(context, Acceleration::default())
            });

        test_bed.write_by_name("GPS GROUND SPEED", 140.);
        test_bed.run_multiple_frames(Duration::from_secs(5));

        assert!(
            test_bed.query_element(|e| e.wet_landing().get::<meter>() > 1700.
                && test_bed.query_element(|e| e.wet_landing().get::<meter>() < 2300.))
        );
    }
}
