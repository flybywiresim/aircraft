pub mod elevator_flex;
pub mod engine_wobble;
pub mod wing_flex;

use crate::shared::low_pass_filter::LowPassFilter;
use crate::simulation::{SurfaceTypeMsfs, UpdateContext};

use crate::shared::{random_from_normal_distribution, random_from_range};

use uom::si::{
    acceleration::meter_per_second_squared,
    f64::*,
    velocity::{knot, meter_per_second},
};

use std::time::Duration;

struct BumpGenerator {
    bump_accel: Acceleration,

    seconds_per_bump: Duration,

    mean_bump: f64,
    std_bump: f64,
}
impl BumpGenerator {
    fn new(seconds_per_bump: Duration, mean_bump: f64, std_bump: f64) -> Self {
        Self {
            bump_accel: Acceleration::default(),
            seconds_per_bump,

            mean_bump,
            std_bump,
        }
    }

    fn update(&mut self, context: &UpdateContext) {
        let bump_encountered = random_from_range(0., 1.)
            < context.delta_as_secs_f64() / self.seconds_per_bump.as_secs_f64();

        if bump_encountered {
            self.bump_accel = Acceleration::new::<meter_per_second_squared>(
                random_from_normal_distribution(self.mean_bump, self.std_bump),
            );

            if random_from_range(0., 1.) < 0.5 {
                self.bump_accel = -self.bump_accel;
            }
        } else {
            self.bump_accel = Acceleration::default();
        }
    }
}

fn to_surface_vibration_coeff(surface: SurfaceTypeMsfs) -> f64 {
    match surface {
        SurfaceTypeMsfs::Concrete => 1.,
        SurfaceTypeMsfs::Grass => 10.,
        SurfaceTypeMsfs::Dirt => 10.,
        SurfaceTypeMsfs::GrassBumpy => 15.,
        SurfaceTypeMsfs::Bituminus => 2.,
        SurfaceTypeMsfs::Tarmac => 1.2,
        SurfaceTypeMsfs::Asphalt => 1.,
        SurfaceTypeMsfs::Macadam => 1.5,
        _ => 3.,
    }
}

pub struct SurfaceVibrationGenerator {
    bumps: Vec<BumpGenerator>,

    final_bump_accel: Acceleration,

    final_bump_accel_filtered: LowPassFilter<Acceleration>,
}
impl SurfaceVibrationGenerator {
    pub fn default_generator() -> Self {
        let big_holes = BumpGenerator::new(Duration::from_secs(25), 2., 0.4);
        let small_holes = BumpGenerator::new(Duration::from_secs(5), 1.1, 0.1);
        let vibrations = BumpGenerator::new(Duration::from_millis(20), 0.2, 0.05);

        let all_bumps = vec![vibrations, small_holes, big_holes];

        Self {
            bumps: all_bumps,
            final_bump_accel: Acceleration::default(),

            final_bump_accel_filtered: LowPassFilter::new(Duration::from_millis(30)),
        }
    }

    pub fn update(&mut self, context: &UpdateContext, weight_on_wheels_ratio: Ratio) {
        self.final_bump_accel = Acceleration::default();

        let local_velocity =
            Velocity::new::<meter_per_second>(context.local_velocity().to_ms_vector()[2]);

        let velocity_coeff = if local_velocity.get::<knot>() < 2. {
            0.
        } else {
            0.1 * local_velocity.get::<knot>().abs().sqrt()
        };

        for bump in &mut self.bumps {
            bump.update(context);
            self.final_bump_accel += bump.bump_accel
                * weight_on_wheels_ratio
                * to_surface_vibration_coeff(context.surface_type())
                * velocity_coeff;
        }

        self.final_bump_accel_filtered
            .update(context.delta(), self.final_bump_accel);
    }

    pub fn surface_vibration_acceleration(&self) -> Acceleration {
        self.final_bump_accel_filtered.output()
    }
}
