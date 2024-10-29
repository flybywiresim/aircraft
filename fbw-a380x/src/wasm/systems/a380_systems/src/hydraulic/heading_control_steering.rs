use systems::{
    shared::{low_pass_filter::LowPassFilter, pid::PidController, AdirsMeasurementOutputs},
    simulation::UpdateContext,
};

use std::time::Duration;
use uom::si::{angle::degree, f64::*, velocity::knot};

#[derive(Debug)]
enum HCFState {
    CaptureHeading,
    Tracking,
    Disabled,
}

pub(crate) struct HeadingControlFunction {
    state: HCFState,

    tracked_heading: Option<Angle>,
    new_heading: Option<Angle>,
    previous_heading: Option<Angle>,

    yaw_rate: LowPassFilter<f64>,
    oloop_gain: f64,

    steering_controller: PidController,

    steering_output: LowPassFilter<Angle>,
}
impl HeadingControlFunction {
    const MAX_SPEED_KNOT: f64 = 50.;
    const MAX_ALLOWED_ANGLE_BETWEEN_FRAMES_DEGREES: f64 = 5.;

    const MAX_YAW_RATE_ALLOWING_TRACKING_ENTRY_DEGREE_PER_S: f64 = 0.1;

    pub fn default() -> Self {
        Self {
            state: HCFState::Disabled,

            tracked_heading: None,
            new_heading: None,
            previous_heading: None,

            yaw_rate: LowPassFilter::new(Duration::from_millis(200)),
            oloop_gain: 6.,

            steering_controller: PidController::new(4., 0.3, 3., -3., 3., 0., 1.),
            steering_output: LowPassFilter::new(Duration::from_millis(30)),
        }
    }

    fn update_state(
        &mut self,
        context: &UpdateContext,
        nose_steering_feedback: Angle,
        is_any_steering_input: bool,
    ) {
        match self.state {
            HCFState::Disabled => {
                if self.hcf_available(context) && !self.should_reset(context) {
                    self.state = HCFState::CaptureHeading;
                }
            }
            HCFState::CaptureHeading => {
                if self.should_reset(context) || !self.hcf_available(context) {
                    self.state = HCFState::Disabled;
                    self.tracked_heading = None;
                    self.new_heading = None;
                } else if self.yaw_rate.output().abs()
                    < Self::MAX_YAW_RATE_ALLOWING_TRACKING_ENTRY_DEGREE_PER_S
                    && !is_any_steering_input
                {
                    self.state = HCFState::Tracking;
                }
            }
            HCFState::Tracking => {
                if self.should_reset(context) || !self.hcf_available(context) {
                    self.state = HCFState::Disabled;
                    self.tracked_heading = None;
                    self.new_heading = None;
                } else if nose_steering_feedback.get::<degree>().abs() > 3.5
                    || is_any_steering_input
                {
                    self.state = HCFState::CaptureHeading
                }
            }
        }
    }

    fn states_actions(
        &mut self,
        context: &UpdateContext,
        nose_steering_feedback: Angle,
        is_any_steering_input: bool,
    ) {
        match self.state {
            HCFState::Disabled => self.reset(),
            HCFState::CaptureHeading => {
                self.tracked_heading = self.new_heading;

                // If no input, and steering close to center openloop mode tries to stop yaw rate
                let steering_output_raw = if !is_any_steering_input
                    && nose_steering_feedback.get::<degree>().abs() < 3.5
                {
                    Angle::new::<degree>(
                        (-self.oloop_gain
                            * self.yaw_rate.output().abs().powf(1.4)
                            * self.yaw_rate.output().signum())
                        .clamp(-3., 3.),
                    )
                } else {
                    Angle::default()
                };
                self.steering_output
                    .update(context.delta(), steering_output_raw);
                self.steering_controller
                    .reset_with_output(self.steering_output.output().get::<degree>());
            }
            HCFState::Tracking => {
                self.steering_controller.change_setpoint(
                    self.normalize_angle(self.tracked_heading.unwrap().get::<degree>()),
                );
                self.steering_output.update(
                    context.delta(),
                    Angle::new::<degree>(self.steering_controller.next_control_output(
                        self.normalize_angle(self.new_heading.unwrap().get::<degree>()),
                        Some(context.delta()),
                    )),
                );
            }
        }
    }

    fn hcf_available(&self, context: &UpdateContext) -> bool {
        context.ground_speed().get::<knot>() < Self::MAX_SPEED_KNOT
    }

    fn should_reset(&self, context: &UpdateContext) -> bool {
        !self.heading_refresh_is_valid()
            || context.is_sim_initialiazing()
            || !context.is_sim_ready()
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        adir_in_use: usize,
        adirs: &impl AdirsMeasurementOutputs,
        is_any_steering_input: bool,
        nose_steering_feedback: Angle,
    ) {
        self.previous_heading = self.new_heading;
        self.new_heading = adirs.true_heading(adir_in_use).normal_value();

        if self.heading_refresh_is_valid() {
            let new = self.normalize_angle(self.new_heading.unwrap_or_default().get::<degree>());
            let prev =
                self.normalize_angle(self.previous_heading.unwrap_or_default().get::<degree>());
            self.yaw_rate
                .update(context.delta(), (new - prev) / context.delta_as_secs_f64());
        }

        self.update_state(context, nose_steering_feedback, is_any_steering_input);

        self.states_actions(context, nose_steering_feedback, is_any_steering_input);
    }

    fn heading_refresh_is_valid(&self) -> bool {
        if self.new_heading.is_none() || self.previous_heading.is_none() {
            false
        } else {
            let new_angle_degree = self.new_heading.unwrap().get::<degree>();

            let angle_diff = (self.normalize_angle(new_angle_degree)
                - self.normalize_angle(self.previous_heading.unwrap().get::<degree>()))
            .abs();

            angle_diff < Self::MAX_ALLOWED_ANGLE_BETWEEN_FRAMES_DEGREES
        }
    }

    pub fn steering_output(&self) -> Angle {
        self.steering_output.output()
    }

    fn reset(&mut self) {
        self.steering_output.reset(Angle::default());
        self.steering_controller.reset_with_output(0.);
    }

    // Normallize all angles in degrees in the -180;180 range
    fn normalize_angle(&self, angle: f64) -> f64 {
        let mut normalized = (angle + 180.0) % 360.0;
        if normalized < 0.0 {
            normalized += 360.0;
        }
        normalized - 180.0
    }
}
