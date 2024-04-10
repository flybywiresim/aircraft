use systems::{
    hydraulic::brake_circuit::{AutobrakeDecelerationGovernor, AutobrakeMode},
    overhead::PressSingleSignalButton,
    shared::{
        arinc429::{Arinc429Word, SignStatus},
        interpolation,
        low_pass_filter::LowPassFilter,
        DelayedPulseTrueLogicGate, DelayedTrueLogicGate, ElectricalBusType, ElectricalBuses,
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
        println!("DISARM SOL {:?}", solenoid_should_disarm);
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
    selection_knob_should_return_disarm: DelayedTrueLogicGate,

    external_disarm_event: bool,

    placeholder_ground_spoilers_out: bool,

    btv_scheduler: BtvDecelScheduler,

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
            selection_knob_should_return_disarm: DelayedTrueLogicGate::new(
                Self::KNOB_SOLENOID_DISARM_DELAY,
            ),

            external_disarm_event: false,

            placeholder_ground_spoilers_out: false,

            btv_scheduler: BtvDecelScheduler::new(context),

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
        } else {
            if autobrake_panel.selected_mode_has_changed() {
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
            || self.should_disarm_after_time_in_flight.output()
            || (self.external_disarm_event && self.mode != A380AutobrakeMode::RTO)
            || (self.mode == A380AutobrakeMode::RTO
                && self.should_reject_rto_mode_after_time_in_flight.output())
            //|| (self.mode == A380AutobrakeMode::DISARM
              //  && autobrake_panel.selected_mode() != A380AutobrakeKnobPosition::DISARM)
          // || (self.mode == A380AutobrakeMode::BTV && !self.btv_scheduler.arming_authorized())
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

        let rto_disable = self.rto_mode_deselected_this_update(autobrake_panel);

        self.mode = self.determine_mode(autobrake_panel);

        if rto_disable || self.should_disarm(context, autobrake_panel) {
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
            .engage_when(self.should_engage_deceleration_governor(context, autobrake_panel));

        self.target = self.calculate_target();
        self.deceleration_governor.update(context, self.target);
        self.update_decelerating_light_info();

        self.placeholder_ground_spoilers_out = placeholder_ground_spoilers_out;

        self.btv_scheduler
            .update(context, self.ground_spoilers_are_deployed);

        self.autobrake_runway_overrun_protection
            .update(self.deceleration_governor.is_engaged())
    }
}
impl SimulationElement for A380AutobrakeController {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.autobrake_knob.accept(visitor);
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

        self.external_disarm_event = reader.read(&self.external_disarm_event_id);

        // Reading current mode in sim to initialize correct mode if sim changes it (from .FLT files for example)
        let readed_mode = reader.read_f64(&self.armed_mode_id);
        if readed_mode >= 0.0 {
            self.mode = readed_mode.into();
        }
    }
}

struct AutobrakeRunwayOverrunProtection {
    distance_to_runway_end_id: VariableIdentifier,
    autobrake_rop_active_id: VariableIdentifier,
    autobrakemanual_rop_active_id: VariableIdentifier,

    ground_speed_id: VariableIdentifier,

    ground_speed: Velocity,

    distance_to_runway_end: Arinc429Word<Length>,

    is_engaged: bool,

    is_any_autobrake_active: bool,
}
impl AutobrakeRunwayOverrunProtection {
    const MAX_DECEL_DRY_MS2: f64 = 3.;

    const MIN_ARMING_SPEED_MS2: f64 = 10.28;

    fn new(context: &mut InitContext) -> Self {
        Self {
            distance_to_runway_end_id: context
                .get_identifier("OANS_BTV_REMAINING_DIST_TO_RWY_END".to_owned()),
            autobrake_rop_active_id: context.get_identifier("AUTOBRAKE_ROP_ACTIVE".to_owned()),
            autobrakemanual_rop_active_id: context
                .get_identifier("MANUAL_BRAKING_ROP_ACTIVE".to_owned()),

            ground_speed_id: context.get_identifier("GPS GROUND SPEED".to_owned()),

            ground_speed: Velocity::default(),

            distance_to_runway_end: Arinc429Word::new(
                Length::default(),
                SignStatus::NoComputedData,
            ),

            is_engaged: false,

            is_any_autobrake_active: false,
        }
    }

    fn update(&mut self, is_any_autobrake_active: bool) {
        self.is_any_autobrake_active = is_any_autobrake_active;
        // println!(
        //     "ROP BRAKING {:.0}  RWEND {:.0} ENGAGED{:?}",
        //     self.distance_to_stop_at_max_braking().get::<meter>(),
        //     self.distance_to_runway_end.value().get::<meter>(),
        //     self.is_engaged
        // );
        // Can engage only above min speed
        if self.distance_to_runway_end.is_normal_operation()
            && self.is_any_autobrake_active
            && self.ground_speed.get::<meter_per_second>() > Self::MIN_ARMING_SPEED_MS2
        {
            if self.distance_to_stop_at_max_braking() >= self.distance_to_runway_end.value() {
                self.is_engaged = true;
            }
        } else {
            // Can only disengage if autobrake or distance lost (not from speed)
            if !self.distance_to_runway_end.is_normal_operation() || !self.is_any_autobrake_active {
                self.is_engaged = false;
            }
        }
    }

    fn rop_max_braking_requested(&self) -> bool {
        self.is_engaged
    }

    fn should_show_manual_braking_warning(&self) -> bool {
        if !self.is_any_autobrake_active
            && self.distance_to_runway_end.is_normal_operation()
            && self.ground_speed.get::<meter_per_second>() > Self::MIN_ARMING_SPEED_MS2
        {
            self.distance_to_stop_at_max_braking() >= self.distance_to_runway_end.value()
        } else {
            false
        }
    }

    fn distance_to_stop_at_max_braking(&self) -> Length {
        let delta_speed_to_decelerate = self.ground_speed;

        Length::new::<meter>(
            delta_speed_to_decelerate.get::<meter_per_second>().powi(2)
                / (2. * Self::MAX_DECEL_DRY_MS2),
        )
    }
}
impl SimulationElement for AutobrakeRunwayOverrunProtection {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.autobrake_rop_active_id, self.is_engaged as u8 as f64);
        writer.write(
            &self.autobrakemanual_rop_active_id,
            self.should_show_manual_braking_warning() as u8 as f64,
        );
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        let raw_feet_runway_end_arinc: Arinc429Word<f64> =
            reader.read_arinc429(&self.distance_to_runway_end_id);

        self.distance_to_runway_end = Arinc429Word::new(
            Length::new::<meter>(raw_feet_runway_end_arinc.value()),
            raw_feet_runway_end_arinc.ssm(),
        );

        self.ground_speed = reader.read(&self.ground_speed_id);
    }
}

#[derive(PartialEq, Clone, Copy, Debug)]
enum BTVState {
    Disabled,
    Armed,
    RotOptimization,
    Decel,
    EndOfBraking,
    OutOfDecelRange,
}

struct BtvDecelScheduler {
    in_flight_btv_stopping_distance_id: VariableIdentifier,
    runway_length_id: VariableIdentifier,
    distance_to_exit_id: VariableIdentifier,
    rot_estimation_id: VariableIdentifier,
    wet_estimated_distance_id: VariableIdentifier,
    dry_estimated_distance_id: VariableIdentifier,
    btv_estimated_stop_id: VariableIdentifier,
    predicted_touchdown_speed_id: VariableIdentifier,

    ground_speed_id: VariableIdentifier,

    runway_length: Arinc429Word<Length>,

    rolling_distance: Length,
    in_flight_btv_stopping_distance: Arinc429Word<Length>,
    oans_distance_to_exit: Arinc429Word<Length>,

    spoilers_active: bool,

    ground_speed: Velocity,

    state: BTVState,

    deceleration_request: Acceleration,
    end_of_decel_acceleration: Acceleration,
    desired_deceleration: Acceleration,

    actual_deceleration: Acceleration,

    final_distance_remaining: Length,

    distance_remaining_at_decel_activation: Length,

    dry_estimated_distance: LowPassFilter<Length>,
    wet_estimated_distance: LowPassFilter<Length>,
    actual_estimated_distance: LowPassFilter<Length>,
    predicted_touchdown_speed: Velocity,
}
impl BtvDecelScheduler {
    const MAX_DECEL_DRY_MS2: f64 = -3.0;
    const MAX_DECEL_WET_MS2: f64 = -1.95;

    const MIN_DECEL_FOR_STOPPING_ESTIMATION_MS2: f64 = -0.25;
    const MIN_SPEED_FOR_STOPPING_ESTIMATION_MS: f64 = 15.;
    const MAX_STOPPING_DISTANCE_M: f64 = 5000.;

    const MIN_RUNWAY_LENGTH_M: f64 = 1500.;

    const DISTANCE_OFFSET_TO_RELEASE_BTV_M: f64 = 65.5;
    const TARGET_SPEED_TO_RELEASE_BTV_M_S: f64 = 5.15;

    fn new(context: &mut InitContext) -> Self {
        Self {
            in_flight_btv_stopping_distance_id: context
                .get_identifier("OANS_BTV_REQ_STOPPING_DISTANCE".to_owned()),
            runway_length_id: context.get_identifier("OANS_RWY_LENGTH".to_owned()),
            distance_to_exit_id: context
                .get_identifier("OANS_BTV_REMAINING_DIST_TO_EXIT".to_owned()),
            rot_estimation_id: context.get_identifier("BTV_ROT".to_owned()),
            wet_estimated_distance_id: context
                .get_identifier("OANS_BTV_WET_DISTANCE_ESTIMATED".to_owned()),
            dry_estimated_distance_id: context
                .get_identifier("OANS_BTV_DRY_DISTANCE_ESTIMATED".to_owned()),

            btv_estimated_stop_id: context
                .get_identifier("OANS_BTV_STOP_BAR_DISTANCE_ESTIMATED".to_owned()),

            predicted_touchdown_speed_id: context.get_identifier("SPEEDS_VAPP".to_owned()),

            ground_speed_id: context.get_identifier("GPS GROUND SPEED".to_owned()),

            runway_length: Arinc429Word::new(Length::default(), SignStatus::NoComputedData),
            rolling_distance: Length::default(),
            in_flight_btv_stopping_distance: Arinc429Word::new(
                Length::default(),
                SignStatus::NoComputedData,
            ),
            oans_distance_to_exit: Arinc429Word::new(Length::default(), SignStatus::NoComputedData),

            spoilers_active: false,
            ground_speed: Velocity::default(),

            state: BTVState::Disabled,

            deceleration_request: Acceleration::default(),
            end_of_decel_acceleration: Acceleration::default(),
            desired_deceleration: Acceleration::new::<meter_per_second_squared>(
                Self::MAX_DECEL_DRY_MS2,
            ),
            actual_deceleration: Acceleration::default(),

            final_distance_remaining: Length::default(),

            distance_remaining_at_decel_activation: Length::default(),

            dry_estimated_distance: LowPassFilter::new(Duration::from_millis(1200)),
            wet_estimated_distance: LowPassFilter::new(Duration::from_millis(1200)),
            actual_estimated_distance: LowPassFilter::new(Duration::from_millis(700)),

            predicted_touchdown_speed: Velocity::default(),
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
            BTVState::Decel | BTVState::OutOfDecelRange => self.deceleration_request,
            BTVState::EndOfBraking => self.end_of_decel_acceleration,
            BTVState::RotOptimization => self.accel_during_rot_opti(),
            _ => Acceleration::new::<meter_per_second_squared>(5.),
        }
    }

    fn update(&mut self, context: &UpdateContext, spoilers_active: bool) {
        self.spoilers_active = spoilers_active;
        self.actual_deceleration = context.long_accel();

        self.integrate_distance(context);

        self.compute_decel(context);

        self.state = self.update_state();

        self.update_braking_estimations(context);

        // println!("AB STATE {:?}", self.state);
    }

    fn update_braking_estimations(&mut self, context: &UpdateContext) {
        // TODO use correct inpuit to switch speed used
        let speed_used_for_prediction = if context.plane_height_over_ground().get::<foot>() < 500. {
            self.ground_speed
        } else {
            self.predicted_touchdown_speed
                .max(Velocity::new::<knot>(100.))
        };

        if self.ground_speed.get::<meter_per_second>() > Self::TARGET_SPEED_TO_RELEASE_BTV_M_S {
            self.wet_estimated_distance.update(
                context.delta(),
                self.stopping_distance_estimation_for_wet(speed_used_for_prediction),
            );
            self.dry_estimated_distance.update(
                context.delta(),
                self.stopping_distance_estimation_for_dry(speed_used_for_prediction),
            );
        } else {
            self.wet_estimated_distance.reset(Length::default());
            self.dry_estimated_distance.reset(Length::default());
        }

        if self.actual_deceleration.get::<meter_per_second_squared>()
            < Self::MIN_DECEL_FOR_STOPPING_ESTIMATION_MS2
            && self.ground_speed.get::<meter_per_second>()
                > Self::MIN_SPEED_FOR_STOPPING_ESTIMATION_MS
        {
            self.actual_estimated_distance.update(
                context.delta(),
                self.estimated_stopping_position_at_current_decel_or_btv(),
            );
        } else {
            self.actual_estimated_distance.reset(Length::default())
        }

        // println!(
        //     "CUR ACC {:.2}, WETd {:.0} DRYd {:.0}  BTVd {:.0}",
        //     self.actual_deceleration.get::<meter_per_second_squared>(),
        //     self.wet_estimated_distance.output().get::<meter>(),
        //     self.dry_estimated_distance.output().get::<meter>(),
        //     self.actual_estimated_distance.output().get::<meter>(),
        // );
    }

    fn braking_distance_remaining(&self) -> Length {
        let distance_remaining_raw = if self.is_oans_fallback_mode() {
            self.in_flight_btv_stopping_distance.value() - self.rolling_distance
        } else {
            self.oans_distance_to_exit.value()
        };

        let distance_from_btv_exit = Length::new::<meter>(Self::DISTANCE_OFFSET_TO_RELEASE_BTV_M);

        (distance_remaining_raw - distance_from_btv_exit).max(Length::default())
    }

    fn compute_decel(&mut self, context: &UpdateContext) {
        match self.state {
            BTVState::RotOptimization
            | BTVState::Decel
            | BTVState::EndOfBraking
            | BTVState::OutOfDecelRange => {
                let speed_at_btv_release =
                    Velocity::new::<meter_per_second>(Self::TARGET_SPEED_TO_RELEASE_BTV_M_S) * 0.9; // 10% safety margin on release speed

                self.final_distance_remaining = self.braking_distance_remaining();

                let delta_speed_to_achieve = self.ground_speed - speed_at_btv_release;

                let target_deceleration_raw =
                    -delta_speed_to_achieve.get::<meter_per_second>().powi(2)
                        / (2. * self.final_distance_remaining.get::<meter>());

                let target_deceleration_safety_corrected =
                    target_deceleration_raw * self.safety_margin();

                self.deceleration_request = Acceleration::new::<meter_per_second_squared>(
                    target_deceleration_safety_corrected
                        .max(self.desired_deceleration.get::<meter_per_second_squared>())
                        .min(5.),
                );

                // println!(
                //     "Distance remaining {:.0} DECELERATION REQUEST {:.2}",
                //     self.final_distance_remaining.get::<meter>(),
                //     self.deceleration_request.get::<meter_per_second_squared>()
                // );
            }
            _ => {
                self.deceleration_request = Acceleration::new::<meter_per_second_squared>(5.);
            }
        }
    }

    fn arming_authorized(&self) -> bool {
        self.runway_length.is_normal_operation()
            && self.runway_length.value().get::<meter>() >= Self::MIN_RUNWAY_LENGTH_M
            && self.in_flight_btv_stopping_distance.is_normal_operation()
            && self.runway_length.value().get::<meter>()
                > self.dry_estimated_distance.output().get::<meter>()
    }

    fn accel_to_reach_to_decelerate(&self) -> Acceleration {
        let percent_of_max = 0.98;
        self.desired_deceleration * percent_of_max
    }

    fn accel_during_rot_opti(&self) -> Acceleration {
        // let percent_of_max = 0.1;
        // self.desired_deceleration * percent_of_max
        Acceleration::new::<meter_per_second_squared>(-0.2)
    }

    fn safety_margin(&self) -> f64 {
        match self.state {
            BTVState::Decel | BTVState::EndOfBraking | BTVState::OutOfDecelRange => {
                let ratio_of_decel_distance =
                    self.braking_distance_remaining() / self.distance_remaining_at_decel_activation;

                (1. + (ratio_of_decel_distance.get::<ratio>().sqrt() * 0.4))
                    .max(1.15)
                    .min(1.4)
            }

            BTVState::Disabled | BTVState::Armed | BTVState::RotOptimization => 1.4,
        }
    }

    fn update_state(&mut self) -> BTVState {
        match self.state {
            BTVState::Armed => {
                if self.spoilers_active {
                    self.update_desired_btv_deceleration();
                    // println!(
                    //     "DESIRED DECEL SELECTED: {:.2}",
                    //     self.desired_deceleration.get::<meter_per_second_squared>()
                    // );
                    BTVState::RotOptimization
                } else {
                    if !self.arming_authorized() {
                        BTVState::Disabled
                    } else {
                        self.state
                    }
                }
            }
            BTVState::RotOptimization => {
                let accel_min = self.accel_to_reach_to_decelerate();

                // println!(
                //     "OPTI!!!! DECELERATION REQUEST {:.2} Waiting for {:.2}",
                //     self.deceleration_request.get::<meter_per_second_squared>(),
                //     accel_min.get::<meter_per_second_squared>()
                // );

                if self.deceleration_request < accel_min {
                    self.distance_remaining_at_decel_activation = self.braking_distance_remaining();
                    self.end_of_decel_acceleration = self.deceleration_request;
                    BTVState::Decel
                } else {
                    self.state
                }
            }
            BTVState::Decel => {
                if self.final_distance_remaining.get::<meter>() < 50.
                    || self.ground_speed.get::<meter_per_second>()
                        <= Self::TARGET_SPEED_TO_RELEASE_BTV_M_S
                {
                    self.end_of_decel_acceleration = self.deceleration_request;
                    BTVState::EndOfBraking
                } else {
                    BTVState::Decel
                }
            }
            BTVState::EndOfBraking => {
                if self.ground_speed.get::<meter_per_second>()
                    <= Self::TARGET_SPEED_TO_RELEASE_BTV_M_S
                {
                    self.disarm();
                    BTVState::Disabled
                } else {
                    // self.end_of_decel_acceleration = self
                    //     .end_of_decel_acceleration
                    //     .max(self.deceleration_request);
                    BTVState::EndOfBraking
                }
            }

            _ => self.state,
        }
    }

    fn integrate_distance(&mut self, context: &UpdateContext) {
        match self.state {
            BTVState::RotOptimization
            | BTVState::Decel
            | BTVState::EndOfBraking
            | BTVState::OutOfDecelRange => {
                let distance_this_tick = self.ground_speed * context.delta_as_time();
                self.rolling_distance = self.rolling_distance + distance_this_tick;
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

            let rot_duration =
                Duration::from_secs_f64((distance.get::<meter>() * 0.0335).min(200.).max(30.));
            Arinc429Word::new(rot_duration.as_secs(), SignStatus::NormalOperation)
        } else {
            Arinc429Word::new(0, SignStatus::NoComputedData)
        }
    }

    fn stopping_distance_estimation_for_dry(&self, current_speed: Velocity) -> Length {
        self.stopping_distance_estimation_for_decel(
            current_speed,
            Acceleration::new::<meter_per_second_squared>(Self::MAX_DECEL_DRY_MS2),
        )
    }

    fn stopping_distance_estimation_for_wet(&self, current_speed: Velocity) -> Length {
        self.stopping_distance_estimation_for_decel(
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
                .max(0.)
                .min(Self::MAX_STOPPING_DISTANCE_M),
            )
        } else {
            Length::new::<meter>(0.)
        }
    }

    fn estimated_stopping_position_at_current_decel_or_btv(&self) -> Length {
        match self.state {
            BTVState::Disabled | BTVState::Armed => {
                println!("BTV DISABLE 0 STOP");
                Length::default()
            }
            BTVState::RotOptimization => {
                // let min_distance_to_stop_at_selected_decel = self
                //     .stopping_distance_estimation_for_decel(
                //         self.ground_speed,
                //         self.desired_deceleration,
                //     );
                // // If waiting to reach sufficient decel, it means we'll stop at exit as planned
                // self.braking_distance_remaining()
                //     .max(min_distance_to_stop_at_selected_decel)

                println!(
                    "BTV ROT {:.0} STOP",
                    self.stopping_distance_estimation_for_decel(
                        self.ground_speed,
                        self.deceleration_request,
                    )
                    .get::<meter>()
                );
                self.stopping_distance_estimation_for_decel(
                    self.ground_speed,
                    self.deceleration_request,
                )
            }
            BTVState::Decel | BTVState::EndOfBraking | BTVState::OutOfDecelRange => self
                .stopping_distance_estimation_for_decel(
                    self.ground_speed,
                    self.actual_deceleration,
                ),
        }
    }

    fn update_desired_btv_deceleration(&mut self) {
        // println!("update_desired_btv_deceleration : braking remaining {:.0} vs braking dist for wet {:.0}",
        //     self.braking_distance_remaining().get::<meter>(),
        //     self.stopping_distance_estimation_for_wet(self.ground_speed).get::<meter>() + 200.,
        // );

        //200m added to acount for time to engage decel after touchdown
        self.desired_deceleration = if self.braking_distance_remaining()
            < self.stopping_distance_estimation_for_wet(self.ground_speed)
                + Length::new::<meter>(200.)
        {
            Acceleration::new::<meter_per_second_squared>(Self::MAX_DECEL_DRY_MS2)
        } else {
            Acceleration::new::<meter_per_second_squared>(Self::MAX_DECEL_WET_MS2)
        };
    }
}
impl SimulationElement for BtvDecelScheduler {
    fn write(&self, writer: &mut SimulatorWriter) {
        let rot_arinc = self.rot_estimation_for_distance();

        writer.write_arinc429(&self.rot_estimation_id, rot_arinc.value(), rot_arinc.ssm());

        writer.write(
            &self.wet_estimated_distance_id,
            self.wet_estimated_distance.output().get::<meter>(),
        );
        writer.write(
            &self.dry_estimated_distance_id,
            self.dry_estimated_distance.output().get::<meter>(),
        );

        writer.write(
            &self.btv_estimated_stop_id,
            self.actual_estimated_distance.output().get::<meter>(),
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

        self.ground_speed = reader.read(&self.ground_speed_id);

        self.predicted_touchdown_speed = reader.read(&self.predicted_touchdown_speed_id);
    }
}
