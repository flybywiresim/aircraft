extern crate nalgebra as na;
use na::{Rotation2, Rotation3, Unit, Vector2, Vector3};

use uom::si::{
    acceleration::meter_per_second_squared,
    angle::{degree, radian},
    angular_acceleration::radian_per_second_squared,
    angular_velocity::{degree_per_second, radian_per_second},
    f64::*,
    mass::kilogram,
    pressure::pascal,
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

#[derive(PartialEq, Clone, Copy)]
pub enum LinearActuatorMode {
    ClosedValves = 0,
    PositionControl = 1,
    Damping = 2,
}
#[derive(PartialEq, Clone, Copy)]
pub struct LinearActuator {
    number_of_actuators: u8,

    position: f64,
    speed: f64,
    force: f64,

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
    flow_error_prev: VolumeRate,

    max_flow: VolumeRate,
    min_flow: VolumeRate,

    delta_displacement: f64,

    volume_to_actuator_accumulator: Volume,
    volume_to_res_accumulator: Volume,

    mode: LinearActuatorMode,
    is_control_valves_closed: bool,
    closed_valves_reference_position: f64,
    opened_valves_target_position: f64,

    fluid_compression_spring_constant: f64,
    fluid_compression_damping_constant: f64,
    active_damping_constant: f64,
}
impl LinearActuator {
    const DEFAULT_I_GAIN: f64 = 0.2;
    const DEFAULT_P_GAIN: f64 = 0.05;

    pub fn new(
        connected_body: &RigidBodyOnHingeAxis,
        number_of_actuators: u8,
        bore_side_diameter: f64,
        rod_side_diameter: f64,
        max_flow: VolumeRate,
        spring: f64,
        damping: f64,
        active_damping: f64,
    ) -> Self {
        let max_pos = connected_body.max_linear_distance_to_anchor();
        let min_pos = connected_body.min_linear_distance_to_anchor();
        let total_throw = max_pos - min_pos;

        let bore_side_area = std::f64::consts::PI * (bore_side_diameter / 2.).powi(2);
        let bore_side_volume = bore_side_area * total_throw * number_of_actuators as f64;

        let rod_side_area = std::f64::consts::PI * (rod_side_diameter / 2.).powi(2);
        let rod_side_volume = rod_side_area * total_throw * number_of_actuators as f64;

        let volume_extension_ratio = bore_side_volume / rod_side_volume;

        let actual_max_flow = number_of_actuators as f64 * max_flow;

        Self {
            number_of_actuators,

            position: 0.,
            speed: 0.,
            force: 0.,

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
            flow_error_prev: VolumeRate::new::<gallon_per_second>(0.),

            max_flow: actual_max_flow,
            min_flow: -actual_max_flow / volume_extension_ratio,

            delta_displacement: 0.,

            volume_to_actuator_accumulator: Volume::new::<gallon>(0.),
            volume_to_res_accumulator: Volume::new::<gallon>(0.),

            mode: LinearActuatorMode::ClosedValves,
            is_control_valves_closed: false,
            closed_valves_reference_position: 0.,
            opened_valves_target_position: 0.,

            fluid_compression_spring_constant: spring,
            fluid_compression_damping_constant: damping,
            active_damping_constant: active_damping,
        }
    }

    fn update(
        &mut self,
        connected_body: &mut RigidBodyOnHingeAxis,
        requested_mode: LinearActuatorMode,
        available_pressure: Pressure,
    ) {
        self.update_mode(requested_mode);
        self.update_force(available_pressure);
        connected_body.apply_control_arm_force(self.force);
    }

    fn update_mode(&mut self, requested_mode: LinearActuatorMode) {
        match requested_mode {
            LinearActuatorMode::ClosedValves => {
                self.close_control_valves();
            }
            LinearActuatorMode::PositionControl => self.open_control_valves_for_position_control(),
            LinearActuatorMode::Damping => self.mode = LinearActuatorMode::Damping,
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
        let mut volume_to_actuator = 0.;
        let mut volume_to_reservoir = 0.;

        if self.delta_displacement > 0. {
            volume_to_actuator = self.delta_displacement * self.bore_side_volume;
            volume_to_reservoir = volume_to_actuator / self.volume_extension_ratio;
        } else if self.delta_displacement < 0. {
            volume_to_actuator = -self.delta_displacement * self.rod_side_volume;
            volume_to_reservoir = volume_to_actuator * self.volume_extension_ratio;
        }

        self.signed_flow = VolumeRate::new::<cubic_meter_per_second>(
            volume_to_actuator * self.delta_displacement.signum() / context.delta_as_secs_f64(),
        );

        self.volume_to_actuator_accumulator += Volume::new::<cubic_meter>(volume_to_actuator);
        self.volume_to_res_accumulator += Volume::new::<cubic_meter>(volume_to_reservoir);
    }

    fn update_force(&mut self, hydraulic_pressure: Pressure) {
        if self.mode == LinearActuatorMode::ClosedValves {
            let position_error = self.closed_valves_reference_position - self.position;
            self.force = position_error * self.fluid_compression_spring_constant
                - self.speed * self.fluid_compression_damping_constant;
        } else if self.mode == LinearActuatorMode::Damping {
            self.force = -self.speed * self.active_damping_constant;
        } else {
            self.compute_control_force(hydraulic_pressure);
        }
    }

    fn close_control_valves(&mut self) {
        if self.mode != LinearActuatorMode::ClosedValves {
            self.closed_valves_reference_position = self.position;
            self.mode = LinearActuatorMode::ClosedValves;
        }
    }

    fn open_control_valves_for_position_control(&mut self) {
        self.mode = LinearActuatorMode::PositionControl;
    }

    fn set_position_target(&mut self, target_position: f64) {
        self.opened_valves_target_position = target_position;
    }

    fn compute_control_force(&mut self, hydraulic_pressure: Pressure) {
        let position_error = self.opened_valves_target_position - self.position;

        let mut open_loop_flow_target = 0.;
        if position_error >= 0.001 {
            open_loop_flow_target = self.max_flow.get::<gallon_per_second>();
        } else if position_error <= -0.001 {
            open_loop_flow_target = self.min_flow.get::<gallon_per_second>();
        }

        let flow_error = open_loop_flow_target - self.signed_flow.get::<gallon_per_second>();

        let delta_error = flow_error - self.flow_error_prev.get::<gallon_per_second>();
        self.flow_error_prev = VolumeRate::new::<gallon_per_second>(flow_error);

        let p_term = Self::DEFAULT_P_GAIN * delta_error;
        let i_term = Self::DEFAULT_I_GAIN * flow_error;

        let force_gain = 200000.;
        self.force += (p_term + i_term) * force_gain;

        if self.force > 0. {
            if position_error > 0. && self.speed <= 0. {
                let max_force = hydraulic_pressure.get::<pascal>() * self.bore_side_area;
                self.force = self.force.min(max_force);
            }
        } else {
            if position_error < 0. && self.speed >= 0. {
                let max_force = -1. * hydraulic_pressure.get::<pascal>() * self.rod_side_area;
                self.force = self.force.max(max_force);
            }
        }

        // println!(
        //     "Flow target {:.3}, Curren Flow {:.3}, Flow error {:.1}, ActuatorForce{:.2}",
        //     open_loop_flow_target,
        //     self.signed_flow.get::<gallon_per_second>(),
        //     flow_error,
        //     self.force,
        // );
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

pub trait HydraulicAssemblyController {
    fn mode_requested(&self) -> LinearActuatorMode;
    fn position_request(&self) -> f64;
    fn should_lock(&self) -> bool;
    fn lock_position_request(&self) -> f64;
}
pub struct HydraulicActuatorAssembly {
    linear_actuator: LinearActuator,
    rigid_body: RigidBodyOnHingeAxis,
}
impl HydraulicActuatorAssembly {
    pub fn new(linear_actuator: LinearActuator, rigid_body: RigidBodyOnHingeAxis) -> Self {
        Self {
            linear_actuator,
            rigid_body,
        }
    }

    pub fn actuator(&mut self) -> &mut impl Actuator {
        &mut self.linear_actuator
    }

    pub fn update(
        &mut self,
        assembly_controller: &impl HydraulicAssemblyController,
        context: &UpdateContext,
        available_pressure: Pressure,
    ) {
        self.linear_actuator
            .set_position_target(assembly_controller.position_request());

        if assembly_controller.should_lock() {
            self.rigid_body
                .lock_at_position_normalized(assembly_controller.lock_position_request())
        } else {
            self.rigid_body.unlock();
        }

        if !self.rigid_body.is_locked() {
            self.linear_actuator.update(
                &mut self.rigid_body,
                assembly_controller.mode_requested(),
                available_pressure,
            );
            self.rigid_body.update(context);
            self.linear_actuator
                .update_after_rigid_body(&self.rigid_body, context);

            println!(
                "Current position {:.3}, dt{:.3}",
                self.position(),
                context.delta_as_secs_f64()
            );
        }
    }

    pub fn is_locked(&self) -> bool {
        self.rigid_body.is_locked()
    }

    pub fn position(&self) -> f64 {
        self.rigid_body.position_normalized()
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
    fn linear_actuator_not_moving_on_locked_rigid_body() {
        let mut rigid_body = cargo_door_body(true);

        let mut actuator = cargo_door_actuator(&rigid_body);

        let dt = 0.05;

        let mut time = 0.;

        let actuator_position_init = actuator.position;

        for _ in 0..5 {
            actuator.update(
                &mut rigid_body,
                LinearActuatorMode::ClosedValves,
                Pressure::new::<psi>(1500.),
            );
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

            assert!(actuator.position == actuator_position_init);
            println!(
                "Body pos {:.3}, Actuator pos {:.3}, Actuator force {:.1}",
                rigid_body.position_normalized(),
                actuator.position,
                actuator.force
            );

            time += dt;
        }
    }

    #[test]
    fn linear_actuator_moving_on_unlocked_rigid_body() {
        let mut rigid_body = cargo_door_body(true);

        let mut actuator = cargo_door_actuator(&rigid_body);

        let dt = 0.05;

        let mut time = 0.;

        let actuator_position_init = actuator.position;

        for _ in 0..100 {
            actuator.update(
                &mut rigid_body,
                LinearActuatorMode::ClosedValves,
                Pressure::new::<psi>(1500.),
            );
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

            if time <= 0.1 {
                assert!(actuator.position == actuator_position_init);
            }

            if time > 0.1 {
                rigid_body.unlock();
            }

            if time > 0.2 {
                assert!(actuator.position > actuator_position_init);
            }

            println!(
                "Body pos {:.3}, Actuator pos {:.3}, Actuator force {:.1}, Time{:.2}",
                rigid_body.position_normalized(),
                actuator.position,
                actuator.force,
                time
            );

            time += dt;
        }
    }

    #[test]
    fn linear_actuator_can_move_rigid_body_up() {
        let mut rigid_body = cargo_door_body(true);

        let mut actuator = cargo_door_actuator(&rigid_body);

        let dt = 0.05;

        let mut time = 0.;

        let actuator_position_init = actuator.position;

        rigid_body.unlock();
        actuator.set_position_target(1.);
        for _ in 0..700 {
            actuator.update(
                &mut rigid_body,
                LinearActuatorMode::PositionControl,
                Pressure::new::<psi>(1500.),
            );
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

            if time > 0.2 {
                assert!(actuator.position > actuator_position_init);
            }

            if time > 25. {
                assert!(actuator.position > 0.9);
            }

            println!(
                "Body pos {:.3}, Actuator pos {:.3}, Actuator force {:.1}, Time{:.2}",
                rigid_body.position_normalized(),
                actuator.position,
                actuator.force,
                time
            );

            time += dt;
        }
    }

    #[test]
    fn linear_actuator_resists_body_drop_when_valves_closed() {
        let mut rigid_body = cargo_door_body(true);

        let mut actuator = cargo_door_actuator(&rigid_body);

        let dt = 0.05;

        let mut time = 0.;

        let actuator_position_init = actuator.position;

        rigid_body.unlock();
        actuator.set_position_target(1.0);
        for _ in 0..700 {
            actuator.update(
                &mut rigid_body,
                LinearActuatorMode::PositionControl,
                Pressure::new::<psi>(1500.),
            );
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

            if time > 0.2 {
                assert!(actuator.position > actuator_position_init);
            }

            if time > 25. && time < 25. + dt {
                assert!(actuator.position > 0.9);
                actuator.close_control_valves();
            }

            if time > 26. {
                assert!(actuator.position > 0.7);
            }

            println!(
                "Body pos {:.3}, Actuator pos {:.3}, Actuator force {:.1}, Time{:.2}",
                rigid_body.position_normalized(),
                actuator.position,
                actuator.force,
                time
            );

            time += dt;
        }
    }

    #[test]
    fn linear_actuator_dampens_body_drop_when_damping_mode() {
        let mut rigid_body = cargo_door_body(true);

        let mut actuator = cargo_door_actuator(&rigid_body);

        let dt = 0.05;

        let mut time = 0.;

        rigid_body.unlock();
        actuator.set_position_target(1.0);
        let mut requested_mode = LinearActuatorMode::PositionControl;
        for _ in 0..700 {
            actuator.update(&mut rigid_body, requested_mode, Pressure::new::<psi>(1500.));
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

            if time > 25. && time < 25. + dt {
                assert!(actuator.position > 0.9);
                requested_mode = LinearActuatorMode::ClosedValves;
            }

            if time > 26. {
                requested_mode = LinearActuatorMode::Damping;
            }

            println!(
                "Body pos {:.3}, Actuator pos {:.3}, Actuator force {:.1}, Time{:.2}",
                rigid_body.position_normalized(),
                actuator.position,
                actuator.force,
                time
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

    fn cargo_door_body(is_locked: bool) -> RigidBodyOnHingeAxis {
        let size = Vector3::new(100. / 1000., 1855. / 1000., 2025. / 1000.);
        let cg_offset = Vector2::new(0., -size[1] / 2.);

        let control_arm = Vector2::new(-0.1597, -0.1614);
        let anchor = Vector2::new(-0.7596, -0.086);

        RigidBodyOnHingeAxis::new(
            Mass::new::<kilogram>(130.),
            size,
            cg_offset,
            control_arm,
            anchor,
            Angle::new::<degree>(-23.),
            Angle::new::<degree>(136.),
            100.,
            is_locked,
        )
    }

    fn cargo_door_actuator(rigid_body: &RigidBodyOnHingeAxis) -> LinearActuator {
        LinearActuator::new(
            &rigid_body,
            2,
            0.04422,
            0.03366,
            VolumeRate::new::<gallon_per_second>(0.008),
            800000.,
            15000.,
            10000.,
        )
    }
}
