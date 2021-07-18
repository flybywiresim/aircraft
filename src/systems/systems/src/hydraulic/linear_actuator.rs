extern crate nalgebra as na;
use na::{Rotation2, Rotation3, Unit, Vector2, Vector3};

use uom::si::{
    acceleration::meter_per_second_squared,
    angle::{degree, radian},
    angular_acceleration::radian_per_second_squared,
    angular_velocity::{degree_per_second, radian_per_second},
    f64::*,
    mass::kilogram,
    volume::{cubic_meter, gallon},
    volume_rate::{cubic_meter_per_second, gallon_per_second},
};

use super::rigid_body::RigidBodyOnHingeAxis;

use crate::simulation::UpdateContext;

pub trait Actuator {
    fn used_volume(&self) -> Volume;
    fn reservoir_return(&self) -> Volume;
    fn reset_accumulators(&mut self);
}
pub struct LinearActuator {
    number_of_actuators: u8,

    position: f64,
    speed: f64,

    max_position: f64,
    min_position: f64,

    total_throw: f64,

    bore_side_diameter: f64,
    bore_side_area: f64,
    bore_side_volume: f64,

    rod_side_diameter: f64,
    rod_side_area: f64,
    rod_side_volume: f64,

    volume_extension_ratio: f64,
    signed_flow: VolumeRate,

    max_flow: VolumeRate,
    min_flow: VolumeRate,

    delta_displacement: f64,
    volume_to_actuator: f64,
    volume_to_reservoir: f64,

    volume_to_actuator_accumulator: Volume,
    volume_to_res_accumulator: Volume,

    is_control_valves_closed: bool,
    fluid_compression_spring_constant: f64,
    fluid_compression_damping_constant: f64,
}
impl LinearActuator {
    pub fn new(
        connected_body: &RigidBodyOnHingeAxis,
        number_of_actuators: u8,
        bore_side_diameter: f64,
        rod_side_diameter: f64,
        max_flow: VolumeRate,
        spring: f64,
        damping: f64,
    ) -> Self {
        let max_pos = connected_body.max_linear_distance_to_anchor();
        let min_pos = connected_body.min_linear_distance_to_anchor();
        let total_throw = max_pos - min_pos;

        let bore_side_area = std::f64::consts::PI * (bore_side_diameter / 2.).powi(2);
        let bore_side_volume = bore_side_area * total_throw * number_of_actuators as f64;

        let rod_side_area = std::f64::consts::PI * (rod_side_diameter / 2.).powi(2);
        let rod_side_volume = rod_side_area * total_throw * number_of_actuators as f64;

        let volume_extension_ratio = bore_side_volume / rod_side_volume;

        Self {
            number_of_actuators,

            position: 0.,
            speed: 0.,

            max_position: max_pos,
            min_position: min_pos,

            total_throw: total_throw,

            bore_side_diameter,
            bore_side_area: bore_side_area,
            bore_side_volume: bore_side_volume,

            rod_side_diameter,
            rod_side_area: rod_side_area,
            rod_side_volume: rod_side_volume,

            volume_extension_ratio: volume_extension_ratio,
            signed_flow: VolumeRate::new::<gallon_per_second>(0.),

            max_flow,
            min_flow: max_flow / volume_extension_ratio,

            delta_displacement: 0.,
            volume_to_actuator: 0.,
            volume_to_reservoir: 0.,

            volume_to_actuator_accumulator: Volume::new::<gallon>(0.),
            volume_to_res_accumulator: Volume::new::<gallon>(0.),

            is_control_valves_closed: true,
            fluid_compression_spring_constant: spring,
            fluid_compression_damping_constant: damping,
        }
    }

    fn update_after_rigid_body(
        &mut self,
        connected_body: &RigidBodyOnHingeAxis,
        context: &UpdateContext,
    ) {
        self.update_speed_position(connected_body, context);

        self.update_fluid_displacements(context);
    }

    fn update_speed_position(
        &mut self,
        connected_body: &RigidBodyOnHingeAxis,
        context: &UpdateContext,
    ) {
        let last_position = self.position;
        let absolute_linear_extension = connected_body.linear_extension_to_anchor();

        self.position = (absolute_linear_extension - self.min_position) / self.total_throw;

        self.delta_displacement = self.position - last_position;

        self.speed = self.delta_displacement / context.delta_as_secs_f64();
    }

    fn update_fluid_displacements(&mut self, context: &UpdateContext) {
        if self.delta_displacement > 0. {
            self.volume_to_actuator = self.delta_displacement * self.bore_side_volume;
            self.volume_to_reservoir = self.volume_to_actuator / self.volume_extension_ratio;
        } else if self.delta_displacement < 0. {
            self.volume_to_actuator = -self.delta_displacement * self.rod_side_volume;
            self.volume_to_reservoir = self.volume_to_actuator * self.volume_extension_ratio;
        } else {
            self.volume_to_actuator = 0.;
            self.volume_to_reservoir = 0.;
        }

        self.signed_flow = VolumeRate::new::<cubic_meter_per_second>(
            self.volume_to_actuator * self.delta_displacement.signum()
                / context.delta_as_secs_f64(),
        );

        self.volume_to_actuator_accumulator += Volume::new::<cubic_meter>(self.volume_to_actuator);
        self.volume_to_res_accumulator += Volume::new::<cubic_meter>(self.volume_to_reservoir);
    }
}

impl Actuator for LinearActuator {
    fn used_volume(&self) -> Volume {
        self.volume_to_actuator_accumulator
    }
    fn reservoir_return(&self) -> Volume {
        self.volume_to_res_accumulator
    }
    fn reset_accumulators(&mut self) {
        self.volume_to_res_accumulator = Volume::new::<gallon>(0.);
        self.volume_to_actuator_accumulator = Volume::new::<gallon>(0.);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use std::time::Duration;
    use uom::si::{
        acceleration::meter_per_second_squared,
        angle::{degree, radian},
        length::foot,
        pressure::{pascal, psi},
        thermodynamic_temperature::degree_celsius,
        velocity::knot,
    };

    #[test]
    fn linear_actuator_extension() {
        let size = Vector3::new(100. / 1000., 1855. / 1000., 2025. / 1000.);
        let cg_offset = Vector2::new(0., -size[1] / 2.);

        let control_arm = Vector2::new(-0.1597, -0.1614);
        let anchor = Vector2::new(-0.759, -0.086);

        let mut rigid_body = RigidBodyOnHingeAxis::new(
            Mass::new::<kilogram>(130.),
            size,
            cg_offset,
            control_arm,
            anchor,
            Angle::new::<degree>(-23.),
            Angle::new::<degree>(136.),
            100.,
        );

        let mut actuator = LinearActuator::new(
            &rigid_body,
            1,
            0.04422,
            0.03366,
            VolumeRate::new::<cubic_meter_per_second>(0.008),
            200000.,
            8000.,
        );

        let dt = 0.05;

        let mut time = 0.;
        for _ in 0..100 {
            rigid_body.update(&context(
                Duration::from_secs_f64(dt),
                Angle::new::<degree>(0.),
                Angle::new::<degree>(0.),
            ));
            actuator.update_after_rigid_body(
                &rigid_body,
                &context(
                    Duration::from_secs_f64(dt),
                    Angle::new::<degree>(0.),
                    Angle::new::<degree>(0.),
                ),
            );

            println!(
                "Body pos {:.3}, Actuator pos {:.3}",
                rigid_body.linear_extension_to_anchor(),
                actuator.position
            );
            println!(
                "Delta_displacement{:.3}, To act {} To res {}",
                actuator.delta_displacement,
                actuator.volume_to_actuator,
                actuator.volume_to_reservoir
            );

            time += dt;
        }
    }

    fn context(delta_time: Duration, pitch: Angle, bank: Angle) -> UpdateContext {
        UpdateContext::new(
            delta_time,
            Velocity::new::<knot>(250.),
            Length::new::<foot>(5000.),
            ThermodynamicTemperature::new::<degree_celsius>(25.0),
            true,
            Acceleration::new::<meter_per_second_squared>(0.),
            Acceleration::new::<meter_per_second_squared>(0.),
            Acceleration::new::<meter_per_second_squared>(0.),
            pitch,
            bank,
        )
    }
}
