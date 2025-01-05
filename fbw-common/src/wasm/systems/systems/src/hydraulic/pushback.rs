use uom::si::{f64::*, length::meter};

use crate::{
    shared::{
        low_pass_filter::LowPassFilter, steering_angle_from_plane_yaw_rate, DelayedFalseLogicGate,
    },
    simulation::{
        InitContext, Read, SimulationElement, SimulatorReader, UpdateContext, VariableIdentifier,
    },
};
use std::time::Duration;

use super::nose_steering::Pushback;

pub struct PushbackTug {
    state_id: VariableIdentifier,

    steering_angle: LowPassFilter<Angle>,

    // Type of pushback:
    // 0 = Straight
    // 1 = Left
    // 2 = Right
    // 3 = Assumed to be no pushback
    // 4 = might be finishing pushback, to confirm
    state: f64,
    nose_wheel_steering_pin_inserted: DelayedFalseLogicGate,
}
impl PushbackTug {
    pub const DURATION_AFTER_WHICH_NWS_PIN_IS_REMOVED_AFTER_PUSHBACK: Duration =
        Duration::from_secs(15);

    const STATE_NO_PUSHBACK: f64 = 3.;

    const STEERING_ANGLE_FILTER_TIME_CONSTANT: Duration = Duration::from_millis(800);

    pub fn new(context: &mut InitContext) -> Self {
        Self {
            state_id: context.get_identifier("PUSHBACK STATE".to_owned()),

            steering_angle: LowPassFilter::new(Self::STEERING_ANGLE_FILTER_TIME_CONSTANT),

            state: Self::STATE_NO_PUSHBACK,
            nose_wheel_steering_pin_inserted: DelayedFalseLogicGate::new(
                Self::DURATION_AFTER_WHICH_NWS_PIN_IS_REMOVED_AFTER_PUSHBACK,
            ),
        }
    }

    fn update_pushback_angle(&mut self, context: &UpdateContext) {
        if self.is_pushing() {
            let new_angle = if context.local_velocity().to_ms_vector()[2].abs() < 0.05 {
                self.steering_angle.output()
            } else {
                steering_angle_from_plane_yaw_rate(context, Length::new::<meter>(25.))
            };
            self.steering_angle.update(context.delta(), new_angle);
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        self.nose_wheel_steering_pin_inserted
            .update(context, self.is_pushing());

        self.update_pushback_angle(context);
    }

    fn is_pushing(&self) -> bool {
        (self.state - PushbackTug::STATE_NO_PUSHBACK).abs() > f64::EPSILON
    }
}
impl Pushback for PushbackTug {
    fn is_nose_wheel_steering_pin_inserted(&self) -> bool {
        self.nose_wheel_steering_pin_inserted.output()
    }

    fn steering_angle(&self) -> Angle {
        self.steering_angle.output()
    }
}
impl SimulationElement for PushbackTug {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.state = reader.read(&self.state_id);
    }
}
