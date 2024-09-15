use systems::{
    navigation::adirs,
    shared::{arinc429, pid::PidController, AdirsMeasurementOutputs},
    simulation::UpdateContext,
};

use arinc429::Arinc429Word;
use nalgebra::Vector3;
use ntest::MaxDifference;
use std::{cell::Ref, fmt::Display, time::Duration};
use uom::si::{
    angle::degree,
    f64::*,
    length::meter,
    mass_rate::kilogram_per_second,
    pressure::{hectopascal, pascal},
    ratio::ratio,
    thermodynamic_temperature::{degree_celsius, kelvin},
    velocity::knot,
    Quantity,
};

pub(crate) struct HeadingControlFunction {
    tracked_heading: Option<Angle>,

    steering_controller: PidController,

    steering_output: Angle,
}
impl HeadingControlFunction {
    const MAX_SPEED_KNOT: f64 = 50.;

    pub fn default() -> Self {
        Self {
            tracked_heading: None,

            steering_controller: PidController::new(0.08, 0.6, 0., -3., 3., 0., 0.),
            steering_output: Angle::default(),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        adir_in_use: usize,
        adirs: &impl AdirsMeasurementOutputs,
        ground_speed: Velocity,
        is_steering_input: bool,
    ) {
        let new_heading = adirs.true_heading(adir_in_use).normal_value();

        if self.is_active(ground_speed) && new_heading.is_some() {
            if is_steering_input {
                self.tracked_heading = new_heading;
                self.steering_controller.reset_with_output(0.);
            } else {
                // Make sure if tracked was never updated we capture current heading
                if self.tracked_heading.is_none() {
                    self.tracked_heading = new_heading;
                }

                self.steering_controller.change_setpoint(
                    self.normalize_angle(self.tracked_heading.unwrap().get::<degree>()),
                );
                self.steering_output =
                    Angle::new::<degree>(self.steering_controller.next_control_output(
                        self.normalize_angle(new_heading.unwrap().get::<degree>()),
                        Some(context.delta()),
                    ));
            }

            println!(
                "HCF tracked {:.1}, current {:.1}, steering output{:.2}",
                self.tracked_heading.unwrap().get::<degree>(),
                new_heading.unwrap().get::<degree>(),
                self.steering_output().get::<degree>()
            );
        } else {
            self.reset();
        }
    }

    fn is_active(&self, ground_speed: Velocity) -> bool {
        ground_speed.get::<knot>() < Self::MAX_SPEED_KNOT
    }

    pub fn steering_output(&self) -> Angle {
        self.steering_output
    }

    fn reset(&mut self) {
        self.tracked_heading = None;
    }

    fn normalize_angle(&self, angle: f64) -> f64 {
        let mut normalized = (angle + 180.0) % 360.0;
        if normalized < 0.0 {
            normalized += 360.0;
        }
        normalized - 180.0
    }
}
