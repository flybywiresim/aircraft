use uom::si::{
    area::square_meter,
    f64::*,
    force::newton,
    length::meter,
    ratio::ratio,
    velocity::meter_per_second,
    volume::{cubic_meter, gallon},
    volume_rate::gallon_per_second,
};

use super::rigid_body::LinearActuatedRigidBodyOnHingeAxis;

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

/// LinearActuator represents a classical linear actuator with a rod side area and a bore side area
/// It is connected between an anchor point on the plane and a control arm of a rigid body
/// When the actuator moves, it takes fluid on one side and gives back to reservoir the fluid on other side
/// Difference of volume between both side will cause variation of loop reservoir level.
/// It moves between a max absolute and minimum absolute position. The position is finally normalized from 0 to 1 (compressed to extended)
///
/// It can behave it two main ways: its control valves are either closed, and it can't move, or valves are opened and
/// hydraulic power can move it with enough pressure.
///
/// How those two modes are done: when valves are closed, actuator is constrained by a spring damper system,
/// which simulate the fluid compressibility resisting to rigid body movement.
/// When valves are opened, a controller will try to reach the specified target position. Controller works in flow
/// control so only the correct amount of flow is sent to the actuator.
#[derive(PartialEq, Clone, Copy)]
pub struct LinearActuator {
    number_of_actuators: u8,

    position_normalized: Ratio,
    position: Length,
    last_position: Length,

    speed: Velocity,
    force: Force,

    max_absolute_length: Length,
    min_absolute_length: Length,

    total_travel: Length,

    bore_side_area: Area,
    bore_side_volume: Volume,

    rod_side_area: Area,
    rod_side_volume: Volume,

    volume_extension_ratio: Ratio,
    signed_flow: VolumeRate,
    flow_error_prev: VolumeRate,

    max_flow: VolumeRate,
    min_flow: VolumeRate,

    delta_displacement: Length,

    volume_to_actuator_accumulator: Volume,
    volume_to_res_accumulator: Volume,

    mode: LinearActuatorMode,
    is_control_valves_closed: bool,
    closed_valves_reference_position: Ratio,
    opened_valves_target_position: Ratio,

    fluid_compression_spring_constant: f64,
    fluid_compression_damping_constant: f64,
    active_hydraulic_damping_constant: f64,
}
impl LinearActuator {
    const DEFAULT_I_GAIN: f64 = 0.2;
    const DEFAULT_P_GAIN: f64 = 0.05;

    #[allow(clippy::too_many_arguments)]
    pub fn new(
        max_absolute_length: Length,
        min_absolute_length: Length,
        number_of_actuators: u8,
        bore_side_diameter: Length,
        rod_diameter: Length,
        max_flow: VolumeRate,
        fluid_compression_spring_constant: f64,
        fluid_compression_damping_constant: f64,
        active_hydraulic_damping_constant: f64,
    ) -> Self {
        let total_travel = max_absolute_length - min_absolute_length;

        let bore_side_area_single_actuator = Area::new::<square_meter>(
            std::f64::consts::PI * (bore_side_diameter.get::<meter>() / 2.).powi(2),
        );
        let bore_side_volume_single_actuator = bore_side_area_single_actuator * total_travel;

        let rod_area = Area::new::<square_meter>(
            std::f64::consts::PI * (rod_diameter.get::<meter>() / 2.).powi(2),
        );

        let rod_side_area_single_actuator = bore_side_area_single_actuator - rod_area;
        let rod_side_volume_single_actuator = rod_side_area_single_actuator * total_travel;

        let volume_extension_ratio: Ratio =
            bore_side_volume_single_actuator / rod_side_volume_single_actuator;

        let actual_max_flow = number_of_actuators as f64 * max_flow;

        Self {
            number_of_actuators,

            position_normalized: Ratio::new::<ratio>(0.),
            position: min_absolute_length,
            last_position: min_absolute_length,

            speed: Velocity::new::<meter_per_second>(0.),
            force: Force::new::<newton>(0.),

            max_absolute_length,
            min_absolute_length,

            total_travel,

            bore_side_area: bore_side_area_single_actuator * number_of_actuators as f64,
            bore_side_volume: bore_side_volume_single_actuator * number_of_actuators as f64,

            rod_side_area: rod_side_area_single_actuator * number_of_actuators as f64,
            rod_side_volume: rod_side_volume_single_actuator * number_of_actuators as f64,

            volume_extension_ratio,
            signed_flow: VolumeRate::new::<gallon_per_second>(0.),
            flow_error_prev: VolumeRate::new::<gallon_per_second>(0.),

            max_flow: actual_max_flow,

            // For the same displacement speed there is less flow needed in retraction direction because
            // volume of the fluid is divided by the extension ratio
            min_flow: -actual_max_flow / volume_extension_ratio,

            delta_displacement: Length::new::<meter>(0.),

            volume_to_actuator_accumulator: Volume::new::<gallon>(0.),
            volume_to_res_accumulator: Volume::new::<gallon>(0.),

            mode: LinearActuatorMode::ClosedValves,
            is_control_valves_closed: false,
            closed_valves_reference_position: Ratio::new::<ratio>(0.),
            opened_valves_target_position: Ratio::new::<ratio>(0.),

            fluid_compression_spring_constant,
            fluid_compression_damping_constant,
            active_hydraulic_damping_constant,
        }
    }

    fn update_before_rigid_body(
        &mut self,
        connected_body: &mut LinearActuatedRigidBodyOnHingeAxis,
        requested_mode: LinearActuatorMode,
        current_pressure: Pressure,
    ) {
        self.update_mode(requested_mode);
        self.update_force(current_pressure);
        connected_body.apply_control_arm_force(self.force);
    }

    fn update_mode(&mut self, requested_mode: LinearActuatorMode) {
        match requested_mode {
            LinearActuatorMode::ClosedValves => self.close_control_valves(),
            LinearActuatorMode::PositionControl => self.open_control_valves_for_position_control(),
            LinearActuatorMode::Damping => self.mode = LinearActuatorMode::Damping,
        }
    }

    fn update_after_rigid_body(
        &mut self,
        connected_body: &LinearActuatedRigidBodyOnHingeAxis,
        context: &UpdateContext,
    ) {
        self.update_speed_position(connected_body, context);

        self.update_fluid_displacements(context);
    }

    fn update_speed_position(
        &mut self,
        connected_body: &LinearActuatedRigidBodyOnHingeAxis,
        context: &UpdateContext,
    ) {
        self.last_position = self.position;
        self.position = connected_body.linear_extension_to_anchor();

        self.position_normalized = (self.position - self.min_absolute_length) / self.total_travel;

        self.delta_displacement = self.position - self.last_position;

        self.speed = self.delta_displacement / context.delta_as_time();
    }

    fn update_fluid_displacements(&mut self, context: &UpdateContext) {
        let mut volume_to_actuator = Volume::new::<cubic_meter>(0.);
        let mut volume_to_reservoir = Volume::new::<cubic_meter>(0.);

        if self.delta_displacement > Length::new::<meter>(0.) {
            volume_to_actuator = self.delta_displacement * self.bore_side_area;
            volume_to_reservoir = volume_to_actuator / self.volume_extension_ratio;
        } else if self.delta_displacement < Length::new::<meter>(0.) {
            volume_to_actuator = -self.delta_displacement * self.rod_side_area;
            volume_to_reservoir = volume_to_actuator * self.volume_extension_ratio;
        }

        self.signed_flow = if self.delta_displacement >= Length::new::<meter>(0.) {
            volume_to_actuator
        } else {
            -volume_to_actuator
        } / context.delta_as_time();

        self.volume_to_actuator_accumulator += volume_to_actuator;
        self.volume_to_res_accumulator += volume_to_reservoir;
    }

    fn update_force(&mut self, current_pressure: Pressure) {
        match self.mode {
            LinearActuatorMode::ClosedValves => {
                let position_error =
                    self.closed_valves_reference_position - self.position_normalized;
                self.force = Force::new::<newton>(
                    position_error.get::<ratio>() * self.fluid_compression_spring_constant
                        - self.speed.get::<meter_per_second>()
                            * self.fluid_compression_damping_constant,
                );
            }
            LinearActuatorMode::Damping => {
                self.force = Force::new::<newton>(
                    -self.speed.get::<meter_per_second>() * self.active_hydraulic_damping_constant,
                );
            }
            LinearActuatorMode::PositionControl => self.compute_control_force(current_pressure),
        }
    }

    fn close_control_valves(&mut self) {
        if self.mode != LinearActuatorMode::ClosedValves {
            self.closed_valves_reference_position = self.position_normalized;
            self.mode = LinearActuatorMode::ClosedValves;
        }
    }

    fn open_control_valves_for_position_control(&mut self) {
        self.mode = LinearActuatorMode::PositionControl;
    }

    fn set_position_target(&mut self, target_position: Ratio) {
        self.opened_valves_target_position = target_position;
    }

    fn compute_control_force(&mut self, current_pressure: Pressure) {
        let position_error = self.opened_valves_target_position - self.position_normalized;

        let mut open_loop_flow_target = 0.;
        if position_error >= Ratio::new::<ratio>(0.001) {
            open_loop_flow_target = self.max_flow.get::<gallon_per_second>();
        } else if position_error <= Ratio::new::<ratio>(-0.001) {
            open_loop_flow_target = self.min_flow.get::<gallon_per_second>();
        }

        let flow_error = open_loop_flow_target - self.signed_flow.get::<gallon_per_second>();

        let delta_error = flow_error - self.flow_error_prev.get::<gallon_per_second>();
        self.flow_error_prev = VolumeRate::new::<gallon_per_second>(flow_error);

        let p_term = Self::DEFAULT_P_GAIN * delta_error;
        let i_term = Self::DEFAULT_I_GAIN * flow_error;

        let force_gain = 200000.;
        self.force += Force::new::<newton>((p_term + i_term) * force_gain);

        if self.force > Force::new::<newton>(0.) {
            if position_error > Ratio::new::<ratio>(0.)
                && self.speed <= Velocity::new::<meter_per_second>(0.)
            {
                let max_force = current_pressure * self.bore_side_area;
                self.force = self.force.min(max_force);
            }
        } else if position_error < Ratio::new::<ratio>(0.)
            && self.speed >= Velocity::new::<meter_per_second>(0.)
        {
            let max_force = -1. * current_pressure * self.rod_side_area;
            self.force = self.force.max(max_force);
        }
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
    fn position_request(&self) -> Ratio;
    fn should_lock(&self) -> bool;
    fn lock_position_request(&self) -> Ratio;
}

pub struct HydraulicLinearActuatorAssembly {
    linear_actuator: LinearActuator,
    rigid_body: LinearActuatedRigidBodyOnHingeAxis,
}
impl HydraulicLinearActuatorAssembly {
    pub fn new(
        linear_actuator: LinearActuator,
        rigid_body: LinearActuatedRigidBodyOnHingeAxis,
    ) -> Self {
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
        current_pressure: Pressure,
    ) {
        self.linear_actuator
            .set_position_target(assembly_controller.position_request());

        self.update_lock_mechanism(assembly_controller);

        if !self.rigid_body.is_locked() {
            self.linear_actuator.update_before_rigid_body(
                &mut self.rigid_body,
                assembly_controller.mode_requested(),
                current_pressure,
            );
            self.rigid_body.update(context);
            self.linear_actuator
                .update_after_rigid_body(&self.rigid_body, context);
        }
    }

    fn update_lock_mechanism(&mut self, assembly_controller: &impl HydraulicAssemblyController) {
        if assembly_controller.should_lock() {
            self.rigid_body
                .lock_at_position_normalized(assembly_controller.lock_position_request())
        } else {
            self.rigid_body.unlock();
        }
    }

    pub fn is_locked(&self) -> bool {
        self.rigid_body.is_locked()
    }

    pub fn position_normalized(&self) -> Ratio {
        self.rigid_body.position_normalized()
    }
}

#[cfg(test)]
mod tests {
    use nalgebra::Vector3;

    use super::*;

    use std::time::Duration;
    use uom::si::{
        acceleration::meter_per_second_squared, angle::degree, length::foot, mass::kilogram,
        pressure::psi, thermodynamic_temperature::degree_celsius, velocity::knot,
    };

    use crate::hydraulic::rigid_body::BoundedLinearLength;

    #[test]
    fn linear_actuator_not_moving_on_locked_rigid_body() {
        let mut rigid_body = cargo_door_body(true);

        let mut actuator = cargo_door_actuator(&rigid_body);

        let dt = 0.05;

        let actuator_position_init = actuator.position_normalized;

        for _ in 0..5 {
            actuator.update_before_rigid_body(
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

            assert!(actuator.position_normalized == actuator_position_init);
            println!(
                "Body pos {:.3}, Actuator pos {:.3}, Actuator force {:.1}",
                rigid_body.position_normalized().get::<ratio>(),
                actuator.position_normalized.get::<ratio>(),
                actuator.force.get::<newton>()
            );
        }
    }

    #[test]
    fn linear_actuator_moving_on_unlocked_rigid_body() {
        let mut rigid_body = cargo_door_body(true);

        let mut actuator = cargo_door_actuator(&rigid_body);

        let dt = 0.05;

        let mut time = 0.;

        let actuator_position_init = actuator.position_normalized;

        for _ in 0..100 {
            actuator.update_before_rigid_body(
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
                assert!(actuator.position_normalized == actuator_position_init);
            }

            if time > 0.1 {
                rigid_body.unlock();
            }

            if time > 0.2 {
                assert!(actuator.position_normalized > actuator_position_init);
            }

            println!(
                "Body pos {:.3}, Actuator pos {:.3}, Actuator force {:.1}, Time{:.2}",
                rigid_body.position_normalized().get::<ratio>(),
                actuator.position_normalized.get::<ratio>(),
                actuator.force.get::<newton>(),
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

        let actuator_position_init = actuator.position_normalized;

        rigid_body.unlock();
        actuator.set_position_target(Ratio::new::<ratio>(1.));
        for _ in 0..700 {
            actuator.update_before_rigid_body(
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
                assert!(actuator.position_normalized > actuator_position_init);
            }

            if time > 25. {
                assert!(actuator.position_normalized > Ratio::new::<ratio>(0.9));
            }

            println!(
                "Body pos {:.3}, Actuator pos {:.3}, Actuator force {:.1}, Time{:.2}",
                rigid_body.position_normalized().get::<ratio>(),
                actuator.position_normalized.get::<ratio>(),
                actuator.force.get::<newton>(),
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

        let actuator_position_init = actuator.position_normalized;

        rigid_body.unlock();
        actuator.set_position_target(Ratio::new::<ratio>(1.0));
        let mut control_mode = LinearActuatorMode::PositionControl;

        for _ in 0..700 {
            actuator.update_before_rigid_body(
                &mut rigid_body,
                control_mode,
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
                assert!(actuator.position_normalized > actuator_position_init);
            }

            if time > 25. && time < 25. + dt {
                assert!(actuator.position_normalized > Ratio::new::<ratio>(0.9));
                control_mode = LinearActuatorMode::ClosedValves;
            }

            if time > 26. {
                assert!(actuator.position_normalized > Ratio::new::<ratio>(0.7));
            }

            println!(
                "Body pos {:.3}, Actuator pos {:.3}, Actuator force {:.1}, Time{:.2}",
                rigid_body.position_normalized().get::<ratio>(),
                actuator.position_normalized.get::<ratio>(),
                actuator.force.get::<newton>(),
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
        actuator.set_position_target(Ratio::new::<ratio>(1.0));
        let mut requested_mode = LinearActuatorMode::PositionControl;
        for _ in 0..700 {
            actuator.update_before_rigid_body(
                &mut rigid_body,
                requested_mode,
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

            if time > 25. && time < 25. + dt {
                assert!(actuator.position_normalized > Ratio::new::<ratio>(0.9));
                requested_mode = LinearActuatorMode::ClosedValves;
            }

            if time > 26. {
                requested_mode = LinearActuatorMode::Damping;
            }

            println!(
                "Body pos {:.3}, Actuator pos {:.3}, Actuator force {:.1}, Time{:.2}",
                rigid_body.position_normalized().get::<ratio>(),
                actuator.position_normalized.get::<ratio>(),
                actuator.force.get::<newton>(),
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

    fn cargo_door_body(is_locked: bool) -> LinearActuatedRigidBodyOnHingeAxis {
        let size = Vector3::new(100. / 1000., 1855. / 1000., 2025. / 1000.);
        let cg_offset = Vector3::new(0., -size[1] / 2., 0.);

        let control_arm = Vector3::new(-0.1597, -0.1614, 0.);
        let anchor = Vector3::new(-0.7596, -0.086, 0.);

        LinearActuatedRigidBodyOnHingeAxis::new(
            Mass::new::<kilogram>(130.),
            size,
            cg_offset,
            control_arm,
            anchor,
            Angle::new::<degree>(-23.),
            Angle::new::<degree>(136.),
            100.,
            is_locked,
            Vector3::new(0., 0., 1.),
        )
    }

    fn cargo_door_actuator(rigid_body: &impl BoundedLinearLength) -> LinearActuator {
        LinearActuator::new(
            rigid_body.max_absolute_length_to_anchor(),
            rigid_body.min_absolute_length_to_anchor(),
            2,
            Length::new::<meter>(0.04422),
            Length::new::<meter>(0.03366),
            VolumeRate::new::<gallon_per_second>(0.008),
            800000.,
            15000.,
            10000.,
        )
    }
}
