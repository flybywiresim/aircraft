use crate::navigation::adirs::{
    AirDataReferenceBusOutputs, InertialReferenceBusOutputs, IrDiscreteInputs, IrDiscreteOutputs,
    ModeSelectorPosition,
};
use crate::navigation::hw_block3_adiru::adiru::InternalIrDiscreteInputs;
use crate::navigation::hw_block3_adiru::simulator_data::IrSimulatorData;
use crate::navigation::hw_block3_adiru::NormaliseAngleExt;
use crate::shared::logic_nodes::{MonostableTriggerNode, PulseNode};
use crate::shared::low_pass_filter::LowPassFilter;
use crate::{
    shared::arinc429::{Arinc429Word, SignStatus},
    simulation::UpdateContext,
};
use bitflags::bitflags;
use nalgebra::{Rotation2, Vector2};
use std::time::Duration;
use uom::si::acceleration::meter_per_second_squared;
use uom::si::ratio::ratio;
use uom::si::velocity::{foot_per_second, knot};
use uom::si::{angle::degree, angle::radian, f64::*};

#[derive(PartialEq, Debug)]
enum IrOperationMode {
    Off,
    PowerOff,
    Navigation,
    AlignCoarse,
    AlignFine,
    RealignDecision,
    Realign,
    Attitude,
    ErectAttitude,
}

bitflags! {
    #[derive(Default)]
    #[cfg_attr(test, derive(Debug, PartialEq))]
    pub(super) struct IrMaintFlags: u32 {
        const ALIGNMENT_NOT_READY = 0b0000000000000000001;
        const REV_ATT_MODE = 0b0000000000000000010;
        const NAV_MODE = 0b0000000000000000100;
        const VALID_SET_HEADING = 0b0000000000000001000;
        const ATTITUDE_INVALID = 0b0000000000000010000;
        const DC_FAIL = 0b0000000000000100000;
        const ON_DC = 0b0000000000001000000;
        const ADR_FAULT = 0b0000000000010000000;
        const IR_FAULT = 0b0000000000100000000;
        const DC_FAIL_ON_DC = 0b0000000001000000000;
        const ALIGN_FAULT = 0b0000000010000000000;
        const NO_IRS_INITIAL = 0b0000000100000000000;
        const EXCESS_MOTION_ERROR = 0b0000001000000000000;
        const ADR_IR_FAULT = 0b0000010000000000000;
        const EXTREME_LATITUDE = 0b0000100000000000000;
        const ALIGN_7_10_MINUTES = 0b0111000000000000000;
        const ALIGN_6_MINUTES = 0b0110000000000000000;
        const ALIGN_5_MINUTES = 0b0101000000000000000;
        const ALIGN_4_MINUTES = 0b0100000000000000000;
        const ALIGN_3_MINUTES = 0b0011000000000000000;
        const ALIGN_2_MINUTES = 0b0010000000000000000;
        const ALIGN_1_MINUTES = 0b0001000000000000000;
        const COMPUTED_LATITUDE_MISCOMPARE = 0b1000000000000000000;
    }
}

pub struct InertialReferenceRuntime {
    /// If non-Duration::ZERO, the remaining time the runtime needs to initialize itself. Otherwise
    /// the self-check has been completed.
    remaining_startup: Duration,

    on_off_command_pulse_node: PulseNode,
    output_inhibited: bool,

    measurement_inputs: IrSimulatorData,

    // Alignment and Modes
    active_mode: IrOperationMode,
    mode_timer: Duration,

    excess_motion_error: bool,
    excess_motion_realign_pulse: PulseNode,
    excess_motion_inhibit_mtrig: MonostableTriggerNode,
    excess_motion_body_velocity_filter: LowPassFilter<Vector2<f64>>,

    alignment_failed: bool,

    // Selected ADR data
    selected_adr_valid: bool,
    selected_tas: Arinc429Word<Velocity>,
    selected_altitude: Arinc429Word<Length>,

    wind_velocity_filter: LowPassFilter<Vector2<f64>>,

    // Powersupply status
    on_battery_power: bool,
    dc_power_failed: bool,

    extreme_latitude: bool,
}
impl InertialReferenceRuntime {
    // Mode transition durations
    pub(super) const IR_FAULT_FLASH_DURATION: Duration = Duration::from_millis(50);
    pub(super) const COARSE_ALIGN_DURATION: Duration = Duration::from_secs(30);
    pub(super) const COARSE_ALIGN_QUICK_DURATION: Duration = Duration::from_secs(10);
    pub(super) const FINE_ALIGN_MAX_DURATION: Duration = Duration::from_secs(570);
    pub(super) const FINE_ALIGN_QUICK_DURATION: Duration = Duration::from_secs(80);
    pub(super) const HDG_ALIGN_AVAIL_DURATION: Duration = Duration::from_secs(270);
    pub(super) const ERECT_ATT_DURATION: Duration = Duration::from_secs(30);
    pub(super) const REALIGN_DECISION_TIME: Duration = Duration::from_secs(5);
    pub(super) const REALIGN_DURATION: Duration = Duration::from_secs(30);
    pub(super) const POWER_OFF_DURATION: Duration = Duration::from_secs(5);

    // SSM Thresholds
    pub(super) const MINIMUM_TRUE_AIRSPEED_FOR_WIND_DETERMINATION_KNOTS: f64 = 100.;
    pub(super) const MINIMUM_GROUND_SPEED_FOR_TRACK_KNOTS: f64 = 50.;

    // Filter time constants
    const WIND_VELOCITY_TIME_CONSTANT: Duration = Duration::from_millis(100);
    const ALIGNMENT_VELOCITY_TIME_CONSTANT: Duration = Duration::from_millis(500);

    // Alignment thresholds
    const MAX_REALIGN_VELOCITY_KNOT: f64 = 20.;
    const MAX_LATITUDE_FOR_ALIGNMENT: f64 = 82.;

    // Excess Motion fault durations and thresholds
    const EXCESS_MOTION_INHIBIT_TIME: Duration = Duration::from_secs(2);
    const MAX_ALIGNMENT_VELOCITY_FPS: f64 = 0.011;

    pub fn new_running() -> Self {
        Self::new(Duration::ZERO, IrOperationMode::Navigation)
    }

    pub fn new_off(self_check: Duration) -> Self {
        Self::new(self_check, IrOperationMode::Off)
    }

    fn new(self_check: Duration, active_mode: IrOperationMode) -> Self {
        Self {
            remaining_startup: self_check,

            on_off_command_pulse_node: PulseNode::new_rising(),
            output_inhibited: false,

            measurement_inputs: IrSimulatorData::default(),

            active_mode,
            mode_timer: Duration::ZERO,

            excess_motion_error: false,
            excess_motion_realign_pulse: PulseNode::new_rising(),
            excess_motion_inhibit_mtrig: MonostableTriggerNode::new_rising(
                Self::EXCESS_MOTION_INHIBIT_TIME,
            ),
            excess_motion_body_velocity_filter: LowPassFilter::new(
                Self::ALIGNMENT_VELOCITY_TIME_CONSTANT,
            ),

            alignment_failed: false,

            selected_adr_valid: false,
            selected_tas: Default::default(),
            selected_altitude: Default::default(),

            wind_velocity_filter: LowPassFilter::new(Self::WIND_VELOCITY_TIME_CONSTANT),

            on_battery_power: false,
            dc_power_failed: false,

            extreme_latitude: false,
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        discrete_inputs: &IrDiscreteInputs,
        internal_discrete_inputs: &InternalIrDiscreteInputs,
        adr_own: &AirDataReferenceBusOutputs,
        adr_a: &AirDataReferenceBusOutputs,
        adr_b: &AirDataReferenceBusOutputs,
        measurement_inputs: IrSimulatorData,
    ) {
        // First, check if we're still starting up and if so, simulate a wait until all self tests
        // have completed.
        if let Some(new_remaining) = self.remaining_startup.checked_sub(context.delta()) {
            self.remaining_startup = new_remaining;
        } else {
            self.remaining_startup = Duration::ZERO;
        }

        // If there's any startup time remaining, do nothing
        if self.remaining_startup > Duration::ZERO {
            return;
        }

        self.measurement_inputs = measurement_inputs;

        self.on_battery_power = internal_discrete_inputs.on_battery_power;
        self.dc_power_failed = internal_discrete_inputs.dc_fail;

        self.update_off_status(discrete_inputs);

        self.update_alignment_excess_motion_monitor(context, discrete_inputs);

        self.update_state(context, discrete_inputs);

        self.update_adr_selection(discrete_inputs, adr_own, adr_a, adr_b);

        self.update_extreme_latitude_status();

        self.update_wind_velocity(context);
    }

    fn update_off_status(&mut self, discrete_inputs: &IrDiscreteInputs) {
        // If the IR OFF P/B has been pushed, toggle between OFF and ON status. When the power is reset through the
        // mode selector knob, the off status is reset.
        let pulsed_on_off_command = self
            .on_off_command_pulse_node
            .update(discrete_inputs.ir_off_command);
        if pulsed_on_off_command {
            self.output_inhibited = !self.output_inhibited;
        }
        if ModeSelectorPosition::from((
            discrete_inputs.mode_select_m1,
            discrete_inputs.mode_select_m2,
        )) == ModeSelectorPosition::Off
        {
            self.output_inhibited = false;
        }
    }

    fn update_state(&mut self, context: &UpdateContext, discrete_inputs: &IrDiscreteInputs) {
        let mode_selector = ModeSelectorPosition::from((
            discrete_inputs.mode_select_m1,
            discrete_inputs.mode_select_m2,
        ));

        self.mode_timer = self.mode_timer.saturating_sub(context.delta());

        // Compute the alignment durations depending on current fast align status
        let coarse_align_duration = if !discrete_inputs.simulator_fast_align_mode_active {
            Self::COARSE_ALIGN_DURATION
        } else {
            Self::COARSE_ALIGN_QUICK_DURATION
        };

        let fine_align_duration = if discrete_inputs.simulator_fast_align_mode_active {
            Self::FINE_ALIGN_QUICK_DURATION
        } else if self.excess_motion_error {
            Self::FINE_ALIGN_MAX_DURATION
        } else {
            self.total_alignment_duration_from_configuration(
                discrete_inputs.simulator_fast_align_mode_active,
            )
        };

        self.active_mode = match self.active_mode {
            IrOperationMode::Off if mode_selector != ModeSelectorPosition::Off => {
                self.mode_timer = coarse_align_duration;
                IrOperationMode::AlignCoarse
            }
            IrOperationMode::Off => IrOperationMode::Off,

            IrOperationMode::PowerOff if mode_selector != ModeSelectorPosition::Off => {
                self.mode_timer = coarse_align_duration;
                IrOperationMode::AlignCoarse
            }
            IrOperationMode::PowerOff
                if self.mode_timer == Duration::ZERO
                    && mode_selector == ModeSelectorPosition::Off =>
            {
                IrOperationMode::Off
            }
            IrOperationMode::PowerOff => IrOperationMode::PowerOff,

            IrOperationMode::AlignCoarse
            | IrOperationMode::AlignFine
            | IrOperationMode::ErectAttitude
            | IrOperationMode::Attitude
                if mode_selector == ModeSelectorPosition::Off =>
            {
                self.mode_timer = Self::POWER_OFF_DURATION;
                IrOperationMode::PowerOff
            }

            // Excess motion auto-reset
            IrOperationMode::AlignCoarse
            | IrOperationMode::AlignFine
            | IrOperationMode::Realign
                if self.excess_motion_realign_pulse.output() =>
            {
                self.mode_timer = coarse_align_duration;
                IrOperationMode::AlignCoarse
            }

            // Instant align
            IrOperationMode::AlignCoarse
            | IrOperationMode::AlignFine
            | IrOperationMode::Realign
                if discrete_inputs.simulator_instant_align =>
            {
                IrOperationMode::Navigation
            }

            IrOperationMode::AlignCoarse
                if self.mode_timer == Duration::ZERO
                    && mode_selector == ModeSelectorPosition::Navigation =>
            {
                self.mode_timer = fine_align_duration;
                IrOperationMode::AlignFine
            }
            IrOperationMode::AlignCoarse if mode_selector == ModeSelectorPosition::Attitude => {
                self.mode_timer = Self::ERECT_ATT_DURATION;
                IrOperationMode::ErectAttitude
            }
            IrOperationMode::AlignCoarse => IrOperationMode::AlignCoarse,

            IrOperationMode::AlignFine if self.mode_timer == Duration::ZERO && self.can_align() => {
                IrOperationMode::Navigation
            }
            IrOperationMode::AlignFine if mode_selector == ModeSelectorPosition::Attitude => {
                self.mode_timer = Self::ERECT_ATT_DURATION;
                IrOperationMode::ErectAttitude
            }
            IrOperationMode::AlignFine => IrOperationMode::AlignFine,

            IrOperationMode::Navigation if mode_selector == ModeSelectorPosition::Attitude => {
                self.mode_timer = Self::ERECT_ATT_DURATION;
                IrOperationMode::ErectAttitude
            }
            IrOperationMode::Navigation | IrOperationMode::Realign
                if mode_selector == ModeSelectorPosition::Off =>
            {
                self.mode_timer = Self::REALIGN_DECISION_TIME;
                IrOperationMode::RealignDecision
            }
            IrOperationMode::Navigation => IrOperationMode::Navigation,

            IrOperationMode::RealignDecision
                if mode_selector == ModeSelectorPosition::Navigation =>
            {
                if self.measurement_inputs.ground_speed
                    < Velocity::new::<knot>(Self::MAX_REALIGN_VELOCITY_KNOT)
                {
                    self.mode_timer = Self::REALIGN_DURATION;
                    IrOperationMode::Realign
                } else {
                    IrOperationMode::Navigation
                }
            }
            IrOperationMode::RealignDecision if self.mode_timer == Duration::ZERO => {
                self.mode_timer = Self::POWER_OFF_DURATION;
                IrOperationMode::PowerOff
            }
            IrOperationMode::RealignDecision => IrOperationMode::RealignDecision,

            IrOperationMode::Realign if mode_selector == ModeSelectorPosition::Attitude => {
                self.mode_timer = Self::ERECT_ATT_DURATION;
                IrOperationMode::ErectAttitude
            }
            IrOperationMode::Realign if self.mode_timer == Duration::ZERO && self.can_align() => {
                IrOperationMode::Navigation
            }
            IrOperationMode::Realign => IrOperationMode::Realign,

            IrOperationMode::ErectAttitude if self.mode_timer == Duration::ZERO => {
                IrOperationMode::Attitude
            }
            IrOperationMode::ErectAttitude => IrOperationMode::ErectAttitude,

            IrOperationMode::Attitude => IrOperationMode::Attitude,
        }
    }

    fn update_adr_selection(
        &mut self,
        discrete_inputs: &IrDiscreteInputs,
        adr_own: &AirDataReferenceBusOutputs,
        adr_a: &AirDataReferenceBusOutputs,
        adr_b: &AirDataReferenceBusOutputs,
    ) {
        let adr_own_valid = !adr_own.true_airspeed.is_failure_warning()
            && !adr_own.standard_altitude.is_failure_warning();
        let adr_a_valid = !adr_a.true_airspeed.is_failure_warning()
            && !adr_a.standard_altitude.is_failure_warning();
        let adr_b_valid = !adr_a.true_airspeed.is_failure_warning()
            && !adr_a.standard_altitude.is_failure_warning();

        // With AUTO DADS SELECT open, use MANUAL DADS SELECT. If it's open, use ADR input 1, else input 2.
        let selected_adr =
            if !discrete_inputs.auto_dads_select && !discrete_inputs.manual_dads_select {
                self.selected_adr_valid = adr_a_valid;
                adr_a
            } else if !discrete_inputs.auto_dads_select && discrete_inputs.manual_dads_select {
                self.selected_adr_valid = adr_b_valid;
                adr_b
            } else {
                // With AUTO DADS SELECT grounded, automatically select the used ADR based on ADR validity.
                // First, the own ADR is used, then ADR input 1, then input 2.
                // Validity is determined from the used data words, which are TAS (for wind), and pressure alt (for inertial alt/VS).

                if adr_own_valid {
                    self.selected_adr_valid = adr_own_valid;
                    adr_own
                } else if adr_a_valid {
                    self.selected_adr_valid = adr_a_valid;
                    adr_a
                } else {
                    self.selected_adr_valid = adr_b_valid;
                    adr_b
                }
            };

        self.selected_tas = selected_adr.true_airspeed;
        self.selected_altitude = selected_adr.standard_altitude;
    }

    fn update_alignment_excess_motion_monitor(
        &mut self,
        context: &UpdateContext,
        discrete_inputs: &IrDiscreteInputs,
    ) {
        self.excess_motion_inhibit_mtrig.update(
            discrete_inputs.simulator_excess_motion_inhibit,
            context.delta(),
        );

        let body_velocity = Vector2::new(
            context
                .local_velocity()
                .lat_velocity()
                .get::<foot_per_second>(),
            context
                .local_velocity()
                .long_velocity()
                .get::<foot_per_second>(),
        );
        self.excess_motion_body_velocity_filter
            .update(context.delta(), body_velocity);

        let alignment_active = self.active_mode == IrOperationMode::AlignFine
            || self.active_mode == IrOperationMode::AlignCoarse
            || self.active_mode == IrOperationMode::Realign;
        let excess_motion_detected = self.excess_motion_body_velocity_filter.output().max()
            > Self::MAX_ALIGNMENT_VELOCITY_FPS
            && alignment_active
            && !self.excess_motion_inhibit_mtrig.output();

        if excess_motion_detected {
            self.excess_motion_error = true;
        } else if !excess_motion_detected && self.active_mode != IrOperationMode::AlignCoarse {
            self.excess_motion_error = false;
        }

        self.excess_motion_realign_pulse
            .update(self.excess_motion_error);
    }

    fn update_extreme_latitude_status(&mut self) {
        let latitude = self.measurement_inputs.latitude.get::<degree>();
        let longitude = self.measurement_inputs.longitude.get::<degree>();

        let hysteresis_sign = if self.extreme_latitude { 1. } else { -1. };

        self.extreme_latitude = !((-60. + hysteresis_sign * 0.5) <= latitude
            && (latitude <= (73. - hysteresis_sign * 0.5)
                || (latitude <= (82. - hysteresis_sign * 0.5)
                    && (longitude <= (-120. - hysteresis_sign * 2.5)
                        || longitude >= (-90. + hysteresis_sign * 2.5)))))
    }

    //fn update_fault_flash_duration(
    //    &mut self,
    //    context: &UpdateContext,
    //    overhead: &AirDataInertialReferenceSystemOverheadPanel,
    //) {
    //    if self.alignment_starting(overhead.mode_of(self.number)) {
    //        self.ir_fault_flash_duration = Some(Self::IR_FAULT_FLASH_DURATION);
    //    } else if let Some(flash_duration) = self.ir_fault_flash_duration {
    //        let remaining = subtract_delta_from_duration(context, flash_duration);
    //        self.ir_fault_flash_duration = if remaining > Duration::from_secs(0) {
    //            Some(remaining)
    //        } else {
    //            None
    //        };
    //    }
    //}

    fn can_align(&self) -> bool {
        self.measurement_inputs.latitude.abs().get::<degree>() <= Self::MAX_LATITUDE_FOR_ALIGNMENT
    }

    pub fn set_discrete_outputs(&self, discrete_outputs: &mut IrDiscreteOutputs) {
        if !self.is_initialized() {
            return;
        }

        discrete_outputs.ir_off = self.output_inhibited;
        discrete_outputs.ir_fault = false;
        discrete_outputs.battery_operation = self.on_battery_power;
        discrete_outputs.align = self.is_aligning();
    }

    pub fn set_bus_outputs(&self, bus_outputs: &mut InertialReferenceBusOutputs) {
        self.set_discrete_words(bus_outputs);

        self.set_attitude_values(bus_outputs);
        self.set_heading_values(bus_outputs);
        self.set_non_attitude_values(bus_outputs);
        self.set_wind_velocity(bus_outputs);
        self.set_baro_inertial_values(bus_outputs);
    }

    fn set_attitude_values(&self, bus: &mut InertialReferenceBusOutputs) {
        let ssm = if self.active_mode == IrOperationMode::AlignFine
            || self.active_mode == IrOperationMode::Navigation
            || self.active_mode == IrOperationMode::Attitude
        {
            SignStatus::NormalOperation
        } else {
            SignStatus::NoComputedData
        };
        // Calculate the attitudes and body rotation rates.
        // Correct the signs so that they conform to standard aeronautical norms.
        let pitch = -self.measurement_inputs.pitch;
        let roll = -self.measurement_inputs.roll;
        bus.pitch_angle.set(pitch, ssm);
        bus.roll_angle.set(roll, ssm);

        let p = -self.measurement_inputs.body_rotation_rate_z;
        let q = -self.measurement_inputs.body_rotation_rate_x;
        let r = self.measurement_inputs.body_rotation_rate_y;
        bus.body_roll_rate.set(p, ssm);
        bus.body_pitch_rate.set(q, ssm);
        bus.body_yaw_rate.set(r, ssm);

        // Calculate attitude rates, by applying the inverse body coordinate transformation matrix.
        bus.track_angle_rate.set(
            (r * V::from(roll.cos()) + q * V::from(roll.sin())) / V::from(pitch.cos()),
            ssm,
        );
        bus.pitch_att_rate
            .set(q * V::from(roll.cos()) - r * V::from(roll.sin()), ssm);
        bus.roll_att_rate.set(
            p + (q * V::from(roll.sin()) + r * V::from(roll.cos())) * V::from(pitch.tan()),
            ssm,
        );

        // Calculate the body accelerations as measured by the IRS accelerometers.
        // The sim only gives the acceleration vector without gravity, so we have to calculate and add the gravity vector
        // based on Theta and Phi.
        let g = Acceleration::new::<meter_per_second_squared>(9.81);
        bus.body_long_acc.set(
            self.measurement_inputs.body_acceleration_long / g + pitch.sin(),
            ssm,
        );
        bus.body_lat_acc.set(
            self.measurement_inputs.body_acceleration_lat / g - pitch.cos() * roll.sin(),
            ssm,
        );
        bus.body_normal_acc.set(
            self.measurement_inputs.body_acceleration_normal / g + pitch.cos() * roll.cos(),
            ssm,
        );
    }

    fn set_heading_values(&self, bus: &mut InertialReferenceBusOutputs) {
        // TODO BNR labels (that most things use) are actually +/- 180

        // TODO tests for when should be mag or true in mag labels

        // Heading is available after 4.5min in the align fine submode (30s in the coarse align submode not included)

        let heading_available = (self.active_mode == IrOperationMode::AlignFine
            && self
                .total_alignment_duration_from_configuration(false)
                .saturating_sub(self.mode_timer)
                > Self::HDG_ALIGN_AVAIL_DURATION)
            || self.active_mode == IrOperationMode::Navigation;

        let true_heading_ssm = if heading_available {
            SignStatus::NormalOperation
        } else {
            SignStatus::NoComputedData
        };
        bus.true_heading
            .set(self.measurement_inputs.true_heading, true_heading_ssm);

        // TODO in ATT mode NCD until heading initialised on MCDU
        // TODO during ALIGN only available until valid ppos init (for magvar table)
        let magnetic_heading_available = heading_available
            || self.active_mode == IrOperationMode::ErectAttitude
            || self.active_mode == IrOperationMode::Attitude;
        let magnetic_heading_ssm = if magnetic_heading_available {
            SignStatus::NormalOperation
        } else {
            SignStatus::NoComputedData
        };
        bus.magnetic_heading.set(
            if self.has_magnetic_data() {
                self.measurement_inputs.heading
            } else {
                self.measurement_inputs.true_heading
            },
            magnetic_heading_ssm,
        );
    }

    fn update_wind_velocity(&mut self, context: &UpdateContext) {
        let wind_speed_valid = self.active_mode == IrOperationMode::Navigation;

        // The IR does not compute the wind if the TAS is less than 100 knots or NCD
        let true_airspeed_above_minimum_threshold = self.selected_tas.is_normal_operation()
            && self.selected_tas.value()
                >= Velocity::new::<knot>(Self::MINIMUM_TRUE_AIRSPEED_FOR_WIND_DETERMINATION_KNOTS);

        if true_airspeed_above_minimum_threshold && wind_speed_valid {
            // should be label 324 from IR
            let pitch_angle = self.measurement_inputs.pitch;

            // should be hdg label 314 from IR, pitch angle label 324 from IR
            let tas_vector = Vector2::new(
                self.selected_tas.value().get::<knot>()
                    * self.measurement_inputs.true_heading.sin().get::<ratio>(),
                self.selected_tas.value().get::<knot>()
                    * self.measurement_inputs.true_heading.cos().get::<ratio>(),
            ) * pitch_angle.cos().get::<ratio>();

            // should be label 367/366 from IR
            let gs_vector = Vector2::new(
                self.measurement_inputs.ground_speed.get::<knot>()
                    * self.measurement_inputs.true_track.sin().get::<ratio>(),
                self.measurement_inputs.ground_speed.get::<knot>()
                    * self.measurement_inputs.true_track.cos().get::<ratio>(),
            );

            self.wind_velocity_filter
                .update(context.delta(), gs_vector - tas_vector);
        } else {
            self.wind_velocity_filter.reset(Vector2::default());
        }
    }

    fn set_wind_velocity(&self, bus: &mut InertialReferenceBusOutputs) {
        // In ATT mode these labels are not transmitted
        // In Align, NCD prior to NAV

        let wind_speed_valid = self.active_mode == IrOperationMode::Navigation;

        // The IR does not compute the wind if the TAS is less than 100 knots or NCD
        let true_airspeed_above_minimum_threshold = self.selected_tas.is_normal_operation()
            && self.selected_tas.value()
                >= Velocity::new::<knot>(Self::MINIMUM_TRUE_AIRSPEED_FOR_WIND_DETERMINATION_KNOTS);

        let no_transmission = self.active_mode == IrOperationMode::ErectAttitude
            || self.active_mode == IrOperationMode::Attitude;

        let ssm = if no_transmission {
            SignStatus::FailureWarning // TODO should be no transmission
        } else if true_airspeed_above_minimum_threshold && wind_speed_valid {
            SignStatus::NormalOperation
        } else {
            SignStatus::NoComputedData
        };

        // if conditions are valid to calculate wind, we do so, otherwise we send zero
        let (wind_direction, wind_speed) =
            if true_airspeed_above_minimum_threshold && wind_speed_valid {
                let wind_speed = self
                    .wind_velocity_filter
                    .output()
                    .magnitude()
                    .clamp(0., 255.)
                    .round();

                let direction =
                    Rotation2::rotation_between(&self.wind_velocity_filter.output(), &Vector2::y());
                let wind_direction = (Angle::new::<radian>(direction.angle()).normalised()
                    + Angle::HALF_TURN)
                    .normalised()
                    .get::<degree>();
                (wind_direction, wind_speed)
            } else {
                (0., 0.)
            };

        // set all the labels...
        // TODO build out bus implementation for correct period, bnr/bcd encoding and no transmission state
        bus.wind_dir_true_bcd
            .set(Angle::new::<degree>(wind_direction.round()), ssm);

        bus.wind_dir_true.set(
            Angle::new::<degree>(
                (if wind_direction > 180. {
                    wind_direction - 360.
                } else {
                    wind_direction
                } / 0.05)
                    .round()
                    * 0.05,
            ),
            ssm,
        );

        bus.wind_speed_bcd
            .set(Velocity::new::<knot>(wind_speed), ssm);

        bus.wind_speed.set(Velocity::new::<knot>(wind_speed), ssm);
    }

    fn set_non_attitude_values(&self, bus: &mut InertialReferenceBusOutputs) {
        let ssm = if self.active_mode == IrOperationMode::Navigation {
            SignStatus::NormalOperation
        } else {
            SignStatus::NoComputedData
        };

        let ground_speed_above_minimum_threshold = self.measurement_inputs.ground_speed
            >= Velocity::new::<knot>(Self::MINIMUM_GROUND_SPEED_FOR_TRACK_KNOTS);

        let track = if self.has_magnetic_data() {
            self.measurement_inputs.track
        } else {
            self.measurement_inputs.true_track
        };

        let heading = if self.has_magnetic_data() {
            self.measurement_inputs.heading
        } else {
            self.measurement_inputs.true_heading
        };

        bus.magnetic_track.set(
            if ground_speed_above_minimum_threshold {
                track
            } else {
                heading
            },
            ssm,
        );

        if ground_speed_above_minimum_threshold {
            bus.true_track.set(self.measurement_inputs.true_track, ssm);
        } else {
            bus.true_track = bus.true_heading;
        }

        bus.drift_angle.set(
            if ground_speed_above_minimum_threshold {
                let diff = self.measurement_inputs.track - self.measurement_inputs.heading;
                if diff > Angle::new::<degree>(180.) {
                    diff - Angle::new::<degree>(360.)
                } else if diff < Angle::new::<degree>(-180.) {
                    diff + Angle::new::<degree>(360.)
                } else {
                    diff
                }
            } else {
                Angle::new::<degree>(0.)
            },
            ssm,
        );
        bus.flight_path_angle.set(
            if ground_speed_above_minimum_threshold {
                self.measurement_inputs
                    .vertical_speed
                    .atan2(self.measurement_inputs.ground_speed)
            } else {
                Angle::new::<degree>(0.)
            },
            ssm,
        );

        bus.ground_speed
            .set(self.measurement_inputs.ground_speed, ssm);

        bus.ppos_latitude.set(self.measurement_inputs.latitude, ssm);
        bus.ppos_longitude
            .set(self.measurement_inputs.longitude, ssm);
    }

    fn set_baro_inertial_values(&self, bus: &mut InertialReferenceBusOutputs) {
        let baro_inertial_loop_available = self.selected_altitude.is_normal_operation()
            && ((self.active_mode == IrOperationMode::AlignFine
                && self
                    .total_alignment_duration_from_configuration(false)
                    .saturating_sub(self.mode_timer)
                    > Self::HDG_ALIGN_AVAIL_DURATION)
                || self.active_mode == IrOperationMode::Navigation
                || self.active_mode == IrOperationMode::Attitude);

        let ssm = if baro_inertial_loop_available {
            SignStatus::NormalOperation
        } else {
            SignStatus::NoComputedData
        };

        bus.inertial_vertical_speed
            .set(self.measurement_inputs.vertical_speed, ssm);
    }

    fn set_discrete_words(&self, bus_outputs: &mut InertialReferenceBusOutputs) {
        // TODO check status of these during mode transitions (first need to implement mode FSM)
        let mut maint_word: IrMaintFlags = IrMaintFlags::default();

        if self.is_aligning() {
            maint_word |= IrMaintFlags::ALIGNMENT_NOT_READY;
        }

        if self.active_mode == IrOperationMode::Attitude
            || self.active_mode == IrOperationMode::ErectAttitude
        {
            maint_word |= IrMaintFlags::REV_ATT_MODE;
        }

        if self.active_mode == IrOperationMode::Navigation {
            maint_word |= IrMaintFlags::NAV_MODE;
        }

        // TODO request heading setting in att mode if not set

        // TODO attitude invalid fault

        if self.dc_power_failed {
            maint_word |= IrMaintFlags::DC_FAIL;
        }

        if self.on_battery_power {
            maint_word |= IrMaintFlags::ON_DC;
        }

        if !self.selected_adr_valid {
            maint_word |= IrMaintFlags::ADR_FAULT;
        }

        // TODO unimportant nav fault

        // TODO DC fault during DC operation last power up

        if self.alignment_failed {
            maint_word |= IrMaintFlags::ALIGN_FAULT;
        }

        // TODO No IRS initial pos

        if self.excess_motion_error {
            maint_word |= IrMaintFlags::EXCESS_MOTION_ERROR;
        }

        // TODO ADR data not received or parity error

        if self.extreme_latitude {
            maint_word |= IrMaintFlags::EXTREME_LATITUDE;
        }

        maint_word |= match self
            .remaining_align_duration()
            .map(|duration| duration.as_secs())
        {
            Some(1..=60) => IrMaintFlags::ALIGN_1_MINUTES,
            Some(61..=120) => IrMaintFlags::ALIGN_2_MINUTES,
            Some(121..=180) => IrMaintFlags::ALIGN_3_MINUTES,
            Some(181..=240) => IrMaintFlags::ALIGN_4_MINUTES,
            Some(241..=300) => IrMaintFlags::ALIGN_5_MINUTES,
            Some(301..=360) => IrMaintFlags::ALIGN_6_MINUTES,
            Some(361..) => IrMaintFlags::ALIGN_7_10_MINUTES,
            Some(0) | None => IrMaintFlags::default(),
        };

        // TODO sin/cos test discrepancy

        bus_outputs.discrete_word_1.set_value(maint_word.bits());
        bus_outputs
            .discrete_word_1
            .set_ssm(SignStatus::NormalOperation);

        // TODO tests!
    }

    fn total_alignment_duration_from_configuration(&self, fast_align_active: bool) -> Duration {
        if fast_align_active {
            Self::FINE_ALIGN_QUICK_DURATION
        } else {
            Self::realistic_align_time(self.measurement_inputs.latitude)
        }
    }

    pub(super) fn realistic_align_time(latitude: Angle) -> Duration {
        let abs_lat = latitude.get::<degree>().abs();
        Duration::from_secs_f64(if abs_lat > 73. {
            1020.
        } else if abs_lat > 60. {
            600.
        } else {
            (300. / latitude.get::<radian>().cos()).abs()
        })
    }

    fn is_aligning(&self) -> bool {
        self.active_mode == IrOperationMode::AlignCoarse
            || self.active_mode == IrOperationMode::AlignFine
    }

    fn remaining_align_duration(&self) -> Option<Duration> {
        if self.active_mode == IrOperationMode::AlignFine {
            Some(self.mode_timer)
        } else {
            None
        }
    }

    fn has_magnetic_data(&self) -> bool {
        !self.extreme_latitude
    }

    fn is_initialized(&self) -> bool {
        self.remaining_startup == Duration::ZERO
    }

    pub(super) fn is_output_inhibited(&self) -> bool {
        self.output_inhibited
    }
}
