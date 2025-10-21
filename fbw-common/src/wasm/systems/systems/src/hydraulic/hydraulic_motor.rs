use super::linear_actuator::Actuator;
use crate::{shared::low_pass_filter::LowPassFilter, simulation::UpdateContext};

use uom::si::{
    angular_velocity::revolution_per_minute,
    f64::*,
    pressure::psi,
    torque::pound_force_inch,
    volume::{cubic_inch, gallon},
    volume_rate::{gallon_per_minute, gallon_per_second},
};

use std::time::Duration;
use uom::si::time::second;

/// Simple hydraulic motor directly driven with a speed.
/// Speed is smoothly rising or lowering to simulate transients states
/// Flow is updated from current motor speed
pub struct FlapSlatHydraulicMotor {
    speed: LowPassFilter<AngularVelocity>,
    displacement: Volume,
    current_flow: VolumeRate,

    total_volume_to_actuator: Volume,
    total_volume_returned_to_reservoir: Volume,
}
impl FlapSlatHydraulicMotor {
    // Simulates rpm transients.
    const LOW_PASS_RPM_TRANSIENT_TIME_CONSTANT: Duration = Duration::from_millis(300);

    const MIN_MOTOR_RPM: f64 = 20.;

    // Corrective factor to adjust final flow consumption to tune the model
    const FLOW_CORRECTION_FACTOR: f64 = 0.6;

    pub fn new(displacement: Volume) -> Self {
        Self {
            speed: LowPassFilter::<AngularVelocity>::new(
                Self::LOW_PASS_RPM_TRANSIENT_TIME_CONSTANT,
            ),
            displacement,
            current_flow: VolumeRate::new::<gallon_per_second>(0.),
            total_volume_to_actuator: Volume::new::<gallon>(0.),
            total_volume_returned_to_reservoir: Volume::new::<gallon>(0.),
        }
    }

    pub fn update_speed(&mut self, context: &UpdateContext, speed: AngularVelocity) {
        // Low pass filter to simulate motors spool up and down. Will ease pressure impact on transients
        if !context.aircraft_preset_quick_mode() {
            self.speed.update(context.delta(), speed);
        } else {
            // This is for the Aircraft Presets to expedite the setting of a preset.
            self.speed.update(Duration::from_secs(2), speed);
        }

        // Forcing 0 speed at low speed to avoid endless spool down due to low pass filter
        if self.speed.output().get::<revolution_per_minute>() < Self::MIN_MOTOR_RPM
            && self.speed.output().get::<revolution_per_minute>() > -Self::MIN_MOTOR_RPM
        {
            self.speed.reset(AngularVelocity::default());
        }
    }

    pub fn update_flow(&mut self, context: &UpdateContext) {
        self.current_flow = VolumeRate::new::<gallon_per_minute>(
            Self::FLOW_CORRECTION_FACTOR
                * self.speed().get::<revolution_per_minute>().abs()
                * self.displacement.get::<cubic_inch>()
                / 231.,
        );

        if !context.aircraft_preset_quick_mode() {
            self.total_volume_to_actuator += self.current_flow * context.delta_as_time();
            self.total_volume_returned_to_reservoir += self.current_flow * context.delta_as_time();
        } else {
            // This is for the Aircraft Presets to expedite the setting of a preset.
            self.total_volume_to_actuator += self.current_flow * Time::new::<second>(2.);
            self.total_volume_returned_to_reservoir += self.current_flow * Time::new::<second>(2.);
        }
    }

    pub fn torque(&self, pressure: Pressure) -> Torque {
        Torque::new::<pound_force_inch>(
            pressure.get::<psi>() * self.displacement.get::<cubic_inch>()
                / (2. * std::f64::consts::PI),
        )
    }

    pub fn reset_accumulators(&mut self) {
        self.total_volume_to_actuator = Volume::new::<gallon>(0.);
        self.total_volume_returned_to_reservoir = Volume::new::<gallon>(0.);
    }

    pub fn speed(&self) -> AngularVelocity {
        self.speed.output()
    }

    #[cfg(test)]
    pub fn flow(&self) -> VolumeRate {
        self.current_flow
    }
}
impl Actuator for FlapSlatHydraulicMotor {
    fn used_volume(&self) -> Volume {
        self.total_volume_to_actuator
    }
    fn reservoir_return(&self) -> Volume {
        self.total_volume_returned_to_reservoir
    }
    fn reset_volumes(&mut self) {
        self.total_volume_returned_to_reservoir = Volume::new::<gallon>(0.);
        self.total_volume_to_actuator = Volume::new::<gallon>(0.);
    }
}
