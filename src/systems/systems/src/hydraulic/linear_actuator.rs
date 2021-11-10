use nalgebra::{Rotation3, Unit, Vector3};

use uom::si::{
    angle::radian,
    angular_acceleration::radian_per_second_squared,
    angular_velocity::radian_per_second,
    area::square_meter,
    f64::*,
    force::newton,
    length::meter,
    mass::kilogram,
    ratio::ratio,
    torque::newton_meter,
    velocity::meter_per_second,
    volume::{cubic_meter, gallon},
    volume_rate::{cubic_meter_per_second, gallon_per_second},
};

use crate::simulation::UpdateContext;

use crate::shared::low_pass_filter;

pub trait Actuator {
    fn used_volume(&self) -> Volume;
    fn reservoir_return(&self) -> Volume;
    fn reset_accumulators(&mut self);
}

/// Trait linked to anything moving bounded between a minimum and maximum position.
/// Those bounds implies that it will have a max and min distance from a fixed
/// point in space to the position where we apply forces to it,
/// for example a control arm where an actuator is attached.
pub trait BoundedLinearLength {
    fn min_absolute_length_to_anchor(&self) -> Length;
    fn max_absolute_length_to_anchor(&self) -> Length;
}

#[derive(PartialEq, Clone, Copy)]
pub enum LinearActuatorMode {
    ClosedValves,
    PositionControl,
    ActiveDamping,
}

/// Represents an abstraction of the low level hydraulic actuator control system that would in real life consist of a lot of
/// solenoid control valves, spring loaded valves, and a differential pressure mechanism.
///
/// We don't want to simulate all of those little bits, so the functions of the actuator are split into
/// the following functional modes:
///
/// - [LinearActuatorMode.ClosedValves]: Turns actuator in a high constant spring/damper system simulating a closed actuator
/// only constrained by its own fluid compressibility.
/// - [ActiveDamping.LinearActuatorMode]: Actuator use internal valves to provide a force resisting to its own movements, dampening
/// the piece movements it's connected to.
/// - [LinearActuatorMode.PositionControl]: -> Actuator will try to use hydraulic pressure to move to a requested position, while
/// maintaining flow limitations.
#[derive(PartialEq, Clone, Copy)]
struct CoreHydraulicForce {
    current_mode: LinearActuatorMode,
    closed_valves_reference_position: Ratio,

    active_hydraulic_damping_constant: f64,
    fluid_compression_spring_constant: f64,
    fluid_compression_damping_constant: f64,

    max_flow: VolumeRate,
    min_flow: VolumeRate,
    flow_error_prev: VolumeRate,

    bore_side_area: Area,
    rod_side_area: Area,

    last_control_force: Force,

    force: Force,
}
impl CoreHydraulicForce {
    const DEFAULT_I_GAIN: f64 = 0.2;
    const DEFAULT_P_GAIN: f64 = 0.05;
    const DEFAULT_FORCE_GAIN: f64 = 200000.;
    const OPEN_LOOP_GAIN: f64 = 1.;

    fn new(
        init_position: Ratio,
        active_hydraulic_damping_constant: f64,
        fluid_compression_spring_constant: f64,
        fluid_compression_damping_constant: f64,
        max_flow: VolumeRate,
        min_flow: VolumeRate,
        bore_side_area: Area,
        rod_side_area: Area,
    ) -> Self {
        Self {
            current_mode: LinearActuatorMode::ClosedValves,
            closed_valves_reference_position: init_position,
            active_hydraulic_damping_constant,
            fluid_compression_spring_constant,
            fluid_compression_damping_constant,
            max_flow,
            min_flow,
            flow_error_prev: VolumeRate::new::<gallon_per_second>(0.),
            bore_side_area,
            rod_side_area,
            last_control_force: Force::new::<newton>(0.),
            force: Force::new::<newton>(0.),
        }
    }

    fn update_force(
        &mut self,
        required_position: Ratio,
        requested_mode: LinearActuatorMode,
        position_normalized: Ratio,
        current_pressure: Pressure,
        signed_flow: VolumeRate,
        speed: Velocity,
    ) {
        self.update_actions(requested_mode, position_normalized);

        self.update_force_from_current_mode(
            required_position,
            position_normalized,
            current_pressure,
            signed_flow,
            speed,
        );
    }

    fn update_actions(&mut self, requested_mode: LinearActuatorMode, position_normalized: Ratio) {
        match requested_mode {
            LinearActuatorMode::ClosedValves => {
                self.actions_from_current_to_closed_valves(position_normalized)
            }
            LinearActuatorMode::PositionControl => self.actions_from_current_to_position_control(),
            LinearActuatorMode::ActiveDamping => self.actions_from_current_to_damping(),
        }
    }

    fn actions_from_current_to_closed_valves(&mut self, position_normalized: Ratio) {
        match self.current_mode {
            LinearActuatorMode::ClosedValves => {}
            LinearActuatorMode::PositionControl | LinearActuatorMode::ActiveDamping => {
                self.go_to_close_control_valves(position_normalized);
            }
        }
    }

    fn actions_from_current_to_position_control(&mut self) {
        match self.current_mode {
            LinearActuatorMode::PositionControl => {}
            LinearActuatorMode::ClosedValves | LinearActuatorMode::ActiveDamping => {
                self.go_to_position_control();
            }
        }
    }

    fn actions_from_current_to_damping(&mut self) {
        match self.current_mode {
            LinearActuatorMode::ActiveDamping => {}
            LinearActuatorMode::ClosedValves | LinearActuatorMode::PositionControl => {
                self.go_to_damping();
            }
        }
    }

    fn go_to_close_control_valves(&mut self, position_normalized: Ratio) {
        self.closed_valves_reference_position = position_normalized;
        self.current_mode = LinearActuatorMode::ClosedValves;
    }

    fn go_to_position_control(&mut self) {
        self.current_mode = LinearActuatorMode::PositionControl;
    }

    fn go_to_damping(&mut self) {
        self.current_mode = LinearActuatorMode::ActiveDamping;
    }

    fn update_force_from_current_mode(
        &mut self,
        required_position: Ratio,
        position_normalized: Ratio,
        current_pressure: Pressure,
        signed_flow: VolumeRate,
        speed: Velocity,
    ) {
        match self.current_mode {
            LinearActuatorMode::ClosedValves => {
                self.force = self.force_closed_valves(position_normalized, speed);
            }
            LinearActuatorMode::ActiveDamping => {
                self.force = self.force_damping(speed);
            }
            LinearActuatorMode::PositionControl => {
                self.force = self.force_position_control(
                    required_position,
                    position_normalized,
                    signed_flow,
                    current_pressure,
                    speed,
                );
            }
        }
    }

    fn force(&self) -> Force {
        self.force
    }

    fn force_damping(&self, speed: Velocity) -> Force {
        Force::new::<newton>(
            -speed.get::<meter_per_second>() * self.active_hydraulic_damping_constant,
        )
    }

    fn force_closed_valves(&self, position_normalized: Ratio, speed: Velocity) -> Force {
        let position_error = self.closed_valves_reference_position - position_normalized;

        Force::new::<newton>(
            position_error.get::<ratio>() * self.fluid_compression_spring_constant
                - speed.get::<meter_per_second>() * self.fluid_compression_damping_constant,
        )
    }

    fn force_position_control(
        &mut self,
        required_position: Ratio,
        position_normalized: Ratio,
        signed_flow: VolumeRate,
        current_pressure: Pressure,
        speed: Velocity,
    ) -> Force {
        let position_error = required_position - position_normalized;

        let mut open_loop_flow_target = VolumeRate::new::<cubic_meter_per_second>(
            position_error.get::<ratio>().powi(3) * Self::OPEN_LOOP_GAIN,
        );

        open_loop_flow_target = open_loop_flow_target.min(self.max_flow).max(self.min_flow);

        let flow_error = open_loop_flow_target.get::<gallon_per_second>()
            - signed_flow.get::<gallon_per_second>();

        let delta_error = flow_error - self.flow_error_prev.get::<gallon_per_second>();
        self.flow_error_prev = VolumeRate::new::<gallon_per_second>(flow_error);

        let p_term = Self::DEFAULT_P_GAIN * delta_error;
        let i_term = Self::DEFAULT_I_GAIN * flow_error;

        let force_gain = Self::DEFAULT_FORCE_GAIN;
        self.last_control_force += Force::new::<newton>((p_term + i_term) * force_gain);

        if self.last_control_force > Force::new::<newton>(0.) {
            if speed > Velocity::new::<meter_per_second>(0.) {
                let max_force = current_pressure * self.bore_side_area;
                self.last_control_force = self.last_control_force.min(max_force);
            }
        } else if self.last_control_force < Force::new::<newton>(0.)
            && speed < Velocity::new::<meter_per_second>(0.)
        {
            let max_force = -1. * current_pressure * self.rod_side_area;
            self.last_control_force = self.last_control_force.max(max_force);
        }

        self.last_control_force
    }
}
/// Represents a classical linear actuator with a rod side area and a bore side area
/// It is connected between an anchor point on the plane and a control arm of a rigid body
/// When the actuator moves, it takes fluid on one side and gives back to reservoir the fluid on other side
/// Difference of volume between both side will cause variation of loop reservoir level.
/// It moves between a max absolute and minimum absolute position. The position is finally normalized from 0 to 1 (compressed to extended)
///
/// It can behave it two main ways: its control valves are either closed, and it can't move, or valves are opened and
/// hydraulic power can move it with enough pressure.
#[derive(PartialEq, Clone, Copy)]
pub struct LinearActuator {
    number_of_actuators: u8,

    position_normalized: Ratio,
    position: Length,
    last_position: Length,

    speed: Velocity,

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

    delta_displacement: Length,

    volume_to_actuator_accumulator: Volume,
    volume_to_res_accumulator: Volume,

    requested_position: Ratio,

    core_hydraulics: CoreHydraulicForce,
}
impl LinearActuator {
    pub fn new(
        bounded_linear_length: &impl BoundedLinearLength,
        number_of_actuators: u8,
        bore_side_diameter: Length,
        rod_diameter: Length,
        max_flow: VolumeRate,
        fluid_compression_spring_constant: f64,
        fluid_compression_damping_constant: f64,
        active_hydraulic_damping_constant: f64,
    ) -> Self {
        let total_travel = bounded_linear_length.max_absolute_length_to_anchor()
            - bounded_linear_length.min_absolute_length_to_anchor();

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

        // For the same displacement speed there is less flow needed in retraction direction because
        // volume of the fluid is divided by the extension ratio
        let actual_min_flow = -actual_max_flow / volume_extension_ratio;

        let total_bore_side_area = bore_side_area_single_actuator * number_of_actuators as f64;
        let total_bore_side_volume = bore_side_volume_single_actuator * number_of_actuators as f64;

        let total_rod_side_area = rod_side_area_single_actuator * number_of_actuators as f64;
        let total_rod_side_volume = rod_side_volume_single_actuator * number_of_actuators as f64;
        Self {
            number_of_actuators,

            position_normalized: Ratio::new::<ratio>(0.),
            position: bounded_linear_length.min_absolute_length_to_anchor(),
            last_position: bounded_linear_length.min_absolute_length_to_anchor(),

            speed: Velocity::new::<meter_per_second>(0.),

            max_absolute_length: bounded_linear_length.max_absolute_length_to_anchor(),
            min_absolute_length: bounded_linear_length.min_absolute_length_to_anchor(),

            total_travel,

            bore_side_area: total_bore_side_area,
            bore_side_volume: total_bore_side_volume,

            rod_side_area: total_rod_side_area,
            rod_side_volume: total_rod_side_volume,

            volume_extension_ratio,
            signed_flow: VolumeRate::new::<gallon_per_second>(0.),
            flow_error_prev: VolumeRate::new::<gallon_per_second>(0.),

            delta_displacement: Length::new::<meter>(0.),

            volume_to_actuator_accumulator: Volume::new::<gallon>(0.),
            volume_to_res_accumulator: Volume::new::<gallon>(0.),

            requested_position: Ratio::new::<ratio>(0.),

            core_hydraulics: CoreHydraulicForce::new(
                Ratio::new::<ratio>(0.),
                active_hydraulic_damping_constant,
                fluid_compression_spring_constant,
                fluid_compression_damping_constant,
                actual_max_flow,
                actual_min_flow,
                total_bore_side_area,
                total_rod_side_area,
            ),
        }
    }

    fn update_before_rigid_body(
        &mut self,
        connected_body: &mut LinearActuatedRigidBodyOnHingeAxis,
        requested_mode: LinearActuatorMode,
        current_pressure: Pressure,
    ) {
        self.core_hydraulics.update_force(
            self.requested_position,
            requested_mode,
            self.position_normalized,
            current_pressure,
            self.signed_flow,
            self.speed,
        );
        connected_body.apply_control_arm_force(self.core_hydraulics.force());
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

    fn set_position_target(&mut self, target_position: Ratio) {
        self.requested_position = target_position;
    }

    fn position_normalized(&self) -> Ratio {
        self.position_normalized
    }

    #[cfg(test)]
    fn force(&self) -> Force {
        self.core_hydraulics.force()
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
    fn requested_mode(&self) -> LinearActuatorMode;
    fn requested_position(&self) -> Ratio;
    fn should_lock(&self) -> bool;
    fn requested_lock_position(&self) -> Ratio;
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
        context: &UpdateContext,
        assembly_controller: &impl HydraulicAssemblyController,
        current_pressure: Pressure,
    ) {
        self.linear_actuator
            .set_position_target(assembly_controller.requested_position());

        self.update_lock_mechanism(assembly_controller);

        if !self.rigid_body.is_locked() {
            self.linear_actuator.update_before_rigid_body(
                &mut self.rigid_body,
                assembly_controller.requested_mode(),
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
                .lock_at_position_normalized(assembly_controller.requested_lock_position())
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

    pub fn actuator_position_normalized(&self) -> Ratio {
        self.linear_actuator.position_normalized()
    }
}

/// Represent any physical object able to rotate on a hinge axis.
/// It can be a gear, elevator, cargo door, etc. Only one rotation degree of freedom is handled.
/// An linear actuator or multiple linear actuators can apply forces to its control arm.
///
/// Coordinates are as follows:
/// on x (left->right looking at the plane from the back)
/// on y (down->up)
/// on z (aft->fwd)
///
/// All coordinate references are from the hinge axis. So (0,0,0) is the hinge rotation axis center.
#[derive(PartialEq, Clone, Copy)]
pub struct LinearActuatedRigidBodyOnHingeAxis {
    total_travel: Angle,
    min_angle: Angle,
    max_angle: Angle,

    // size in meters
    size: Vector3<f64>,

    center_of_gravity_offset: Vector3<f64>,
    center_of_gravity_actual: Vector3<f64>,

    control_arm: Vector3<f64>,
    control_arm_actual: Vector3<f64>,
    actuator_extension_gives_positive_angle: bool,

    anchor_point: Vector3<f64>,

    position: Angle,
    speed: AngularVelocity,
    acceleration: AngularAcceleration,
    sum_of_torques: Torque,

    position_normalized: Ratio,
    position_normalized_prev: Ratio,

    mass: Mass,
    inertia_at_hinge: f64,

    natural_damping_constant: f64,

    lock_position_request: Ratio,
    is_lock_requested: bool,
    is_locked: bool,

    axis_direction: Vector3<f64>,
}
impl LinearActuatedRigidBodyOnHingeAxis {
    // Rebound energy when hiting min or max position. 0.3 means the body rebounds at 30% of the speed it hit the min/max position
    const DEFAULT_MAX_MIN_POSITION_REBOUND_FACTOR: f64 = 0.3;

    pub fn new(
        mass: Mass,
        size: Vector3<f64>,
        center_of_gravity_offset: Vector3<f64>,
        control_arm: Vector3<f64>,
        anchor_point: Vector3<f64>,
        min_angle: Angle,
        total_travel: Angle,
        natural_damping_constant: f64,
        locked: bool,
        axis_direction: Vector3<f64>,
    ) -> Self {
        // The inertia about a given axis is the sum of squares of the size of the rectangle, minus
        // the size along the axis dimension
        let relevant_inertia = size.norm_squared();
        let relevant_inertia = relevant_inertia - (size.dot(&axis_direction)).powf(2.);
        let inertia_at_cog = (1. / 12.) * mass.get::<kilogram>() * relevant_inertia;
        // Parallel axis theorem to get inertia at hinge axis from inertia at CoG
        let inertia_at_hinge =
            inertia_at_cog + mass.get::<kilogram>() * center_of_gravity_offset.norm_squared();

        let mut new_body = Self {
            total_travel,
            min_angle,
            max_angle: min_angle + total_travel,
            size,
            center_of_gravity_offset,
            center_of_gravity_actual: center_of_gravity_offset,
            control_arm,
            control_arm_actual: control_arm,
            actuator_extension_gives_positive_angle: false,
            anchor_point,
            position: min_angle,
            speed: AngularVelocity::new::<radian_per_second>(0.),
            acceleration: AngularAcceleration::new::<radian_per_second_squared>(0.),
            sum_of_torques: Torque::new::<newton_meter>(0.),
            position_normalized: Ratio::new::<ratio>(0.),
            position_normalized_prev: Ratio::new::<ratio>(0.),
            mass,
            inertia_at_hinge,
            natural_damping_constant,
            lock_position_request: Ratio::new::<ratio>(0.),
            is_lock_requested: locked,
            is_locked: locked,
            axis_direction,
        };
        // Make sure the new object has coherent structure by updating internal roations and positions once
        new_body.actuator_extension_gives_positive_angle =
            Self::initialize_actuator_force_direction(new_body);
        new_body.update_all_rotations();
        new_body.update_position_normalized();
        new_body
    }

    pub fn apply_control_arm_force(&mut self, actuator_local_force: Force) {
        // Actuator local force convention is positive in extension / negative in compression. We reverse direction depending on
        // rigid body configuration so we get an absolute force in the rigid body frame of reference
        let mut absolute_actuator_force = actuator_local_force;
        if !self.actuator_extension_gives_positive_angle() {
            absolute_actuator_force = -actuator_local_force;
        }

        // Computing the normalized vector on which force is applied. This is the vector from anchor point of actuator to where
        // it is connected to the rigid body
        let force_support_vector = self.anchor_point - self.control_arm_actual;
        let force_support_vector_normalized = force_support_vector / force_support_vector.norm();

        // Final torque is control arm position relative to hinge, cross product with
        // magnitude of the force applied on the force support vector
        let torque = self
            .control_arm
            .cross(&(absolute_actuator_force.get::<newton>() * force_support_vector_normalized));

        let torque_value = Torque::new::<newton_meter>(self.axis_direction.dot(&torque));

        self.sum_of_torques += torque_value;
    }

    pub fn linear_extension_to_anchor(&self) -> Length {
        Length::new::<meter>((self.anchor_point - self.control_arm_actual).norm())
    }

    /// Indicates correct direction of the rigid body when an actuator would be extending or compressing.
    /// If compressing actuator would give a rising rigid body angle, sets TRUE
    /// If extending actuator would give a lowering rigid body angle, sets FALSE
    fn initialize_actuator_force_direction(rigid_body: LinearActuatedRigidBodyOnHingeAxis) -> bool {
        rigid_body.max_absolute_length_to_anchor() < rigid_body.min_absolute_length_to_anchor()
    }

    // If compressing actuator would give a rising rigid body angle, returns TRUE
    // If extending actuator would give a lowering rigid body angle, returns FALSE
    pub fn actuator_extension_gives_positive_angle(&self) -> bool {
        self.actuator_extension_gives_positive_angle
    }

    fn lock_requested_position_in_absolute_reference(&self) -> Angle {
        self.lock_position_request.get::<ratio>() * self.total_travel + self.min_angle
    }

    pub fn position_normalized(&self) -> Ratio {
        self.position_normalized
    }

    fn update_position_normalized(&mut self) {
        self.position_normalized_prev = self.position_normalized;

        self.position_normalized = (self.position - self.min_angle) / self.total_travel;
    }

    // Rotates the static coordinates of the body according to its current angle to get the actual coordinates
    fn update_all_rotations(&mut self) {
        let rotation_transform = Rotation3::from_axis_angle(
            &Unit::new_normalize(self.axis_direction),
            self.position.get::<radian>(),
        );
        self.control_arm_actual = rotation_transform * self.control_arm;
        self.center_of_gravity_actual = rotation_transform * self.center_of_gravity_offset;
    }

    // Computes local acceleration including world gravity and plane acceleration
    // Note that this does not compute acceleration due to angular velocity of the plane
    fn local_acceleration_and_gravity(&self, context: &UpdateContext) -> Torque {
        let plane_acceleration_plane_reference = context.acceleration().to_ms2_vector();

        let pitch_rotation = context.attitude().pitch_rotation_transform();

        let bank_rotation = context.attitude().bank_rotation_transform();

        let gravity_acceleration_world_reference = Vector3::new(0., -9.8, 0.);

        // Total acceleration in plane reference is the gravity in world reference rotated to plane reference. To this we substract
        // the local plane reference to get final local acceleration (if plane falling at 1G final local accel is 1G of gravity - 1G local accel = 0G)
        let total_acceleration_plane_reference = (pitch_rotation
            * (bank_rotation * gravity_acceleration_world_reference))
            - plane_acceleration_plane_reference;

        // We add a 0 component to make the 2D CG position a 3D vector so we can compute a cross product easily

        // Force = m * G
        let resultant_force_plane_reference =
            total_acceleration_plane_reference * self.mass.get::<kilogram>();

        // The Moment generated by acceleration force is the CoG offset from hinge position cross product with the acceleration force
        let gravity_moment_vector = self
            .center_of_gravity_actual
            .cross(&resultant_force_plane_reference);

        // We work with only one degree of freedom so final result holds in the hinge rotation component only
        Torque::new::<newton_meter>(gravity_moment_vector.dot(&self.axis_direction))
    }

    // A global damping factor that simulates hinge friction and local air resistance
    fn natural_damping(&self) -> Torque {
        Torque::new::<newton_meter>(
            -self.speed.get::<radian_per_second>() * self.natural_damping_constant,
        )
    }

    pub fn update(&mut self, context: &UpdateContext) {
        if !self.is_locked {
            self.sum_of_torques +=
                self.natural_damping() + self.local_acceleration_and_gravity(context);

            self.acceleration = AngularAcceleration::new::<radian_per_second_squared>(
                self.sum_of_torques.get::<newton_meter>() / self.inertia_at_hinge,
            );

            self.speed += AngularVelocity::new::<radian_per_second>(
                self.acceleration.get::<radian_per_second_squared>() * context.delta_as_secs_f64(),
            );

            self.position += Angle::new::<radian>(
                self.speed.get::<radian_per_second>() * context.delta_as_secs_f64(),
            );

            // We check if lock is requested and if we crossed the lock position since last update
            if self.is_lock_requested {
                if self.position_normalized >= self.lock_position_request
                    && self.position_normalized_prev <= self.lock_position_request
                    || self.position_normalized <= self.lock_position_request
                        && self.position_normalized_prev >= self.lock_position_request
                {
                    self.is_locked = true;
                    self.position = self.lock_requested_position_in_absolute_reference();
                    self.speed = AngularVelocity::new::<radian_per_second>(0.);
                }
            } else if self.position >= self.max_angle {
                self.position = self.max_angle;
                self.speed = -self.speed * Self::DEFAULT_MAX_MIN_POSITION_REBOUND_FACTOR;
            } else if self.position <= self.min_angle {
                self.position = self.min_angle;
                self.speed = -self.speed * Self::DEFAULT_MAX_MIN_POSITION_REBOUND_FACTOR;
            }

            self.update_position_normalized();
            self.update_all_rotations();
        }

        self.sum_of_torques = Torque::new::<newton_meter>(0.);
    }

    pub fn unlock(&mut self) {
        self.is_locked = false;
        self.is_lock_requested = false;
    }

    pub fn lock_at_position_normalized(&mut self, position_normalized: Ratio) {
        self.is_lock_requested = true;
        self.lock_position_request = position_normalized;
    }

    pub fn is_locked(&self) -> bool {
        self.is_locked
    }

    fn absolute_length_to_anchor_at_angle(&self, position: Angle) -> Length {
        let rotation = Rotation3::from_axis_angle(
            &Unit::new_normalize(self.axis_direction),
            position.get::<radian>(),
        );
        let control_arm_position = rotation * self.control_arm;

        Length::new::<meter>((self.anchor_point - control_arm_position).norm())
    }
}
impl BoundedLinearLength for LinearActuatedRigidBodyOnHingeAxis {
    fn min_absolute_length_to_anchor(&self) -> Length {
        self.absolute_length_to_anchor_at_angle(self.min_angle)
    }

    fn max_absolute_length_to_anchor(&self) -> Length {
        self.absolute_length_to_anchor_at_angle(self.max_angle)
    }
}
#[cfg(test)]
mod tests {
    use nalgebra::Vector3;

    use super::*;

    use crate::hydraulic::update_iterator::MaxFixedStepLoop;
    use crate::simulation::test::{SimulationTestBed, TestBed, WriteByName};
    use crate::simulation::{Aircraft, SimulationElement};
    use std::time::Duration;
    use uom::si::{angle::degree, mass::kilogram, pressure::psi};

    struct TestHydraulicAssemblyController {
        mode: LinearActuatorMode,
        requested_position: Ratio,
        lock_request: bool,
        lock_position: Ratio,
    }
    impl TestHydraulicAssemblyController {
        fn new() -> Self {
            Self {
                mode: LinearActuatorMode::ClosedValves,
                requested_position: Ratio::new::<ratio>(0.),
                lock_request: true,
                lock_position: Ratio::new::<ratio>(0.),
            }
        }

        fn set_mode(&mut self, mode: LinearActuatorMode) {
            self.mode = mode;
        }

        fn set_lock(&mut self, lock_position: Ratio) {
            self.lock_request = true;
            self.lock_position = lock_position;
        }

        fn set_unlock(&mut self) {
            self.lock_request = false;
        }

        fn set_position_target(&mut self, requested_position: Ratio) {
            self.requested_position = requested_position;
        }
    }
    impl HydraulicAssemblyController for TestHydraulicAssemblyController {
        fn requested_mode(&self) -> LinearActuatorMode {
            self.mode
        }

        fn requested_position(&self) -> Ratio {
            self.requested_position
        }

        fn should_lock(&self) -> bool {
            self.lock_request
        }

        fn requested_lock_position(&self) -> Ratio {
            self.lock_position
        }
    }

    struct TestAircraft {
        loop_updater: MaxFixedStepLoop,

        actuator_assembly: HydraulicLinearActuatorAssembly,

        controller: TestHydraulicAssemblyController,

        pressure: Pressure,
    }
    impl TestAircraft {
        fn new(actuator: LinearActuator, body: LinearActuatedRigidBodyOnHingeAxis) -> Self {
            Self {
                loop_updater: MaxFixedStepLoop::new(Duration::from_millis(33)),

                actuator_assembly: HydraulicLinearActuatorAssembly::new(actuator, body),

                controller: TestHydraulicAssemblyController::new(),

                pressure: Pressure::new::<psi>(0.),
            }
        }

        fn set_pressure(&mut self, pressure: Pressure) {
            self.pressure = pressure;
        }

        fn command_damping_mode(&mut self) {
            self.controller.set_mode(LinearActuatorMode::ActiveDamping);
        }

        fn command_closed_valve_mode(&mut self) {
            self.controller.set_mode(LinearActuatorMode::ClosedValves);
        }

        fn command_position_control(&mut self, position: Ratio) {
            self.controller
                .set_mode(LinearActuatorMode::PositionControl);
            self.controller.set_position_target(position);
        }

        fn command_lock(&mut self, lock_position: Ratio) {
            self.controller.set_lock(lock_position);
        }

        fn command_unlock(&mut self) {
            self.controller.set_unlock();
        }

        fn body_position(&self) -> Ratio {
            self.actuator_assembly.position_normalized()
        }

        fn actuator_position(&self) -> Ratio {
            self.actuator_assembly.actuator_position_normalized()
        }

        fn is_locked(&self) -> bool {
            self.actuator_assembly.is_locked()
        }

        fn update_actuator_physics(&mut self, context: &UpdateContext) {
            self.actuator_assembly
                .update(context, &self.controller, self.pressure);

            println!(
                "Body pos {:.3}, Actuator pos {:.3}, Actuator force {:.1}",
                self.actuator_assembly
                    .rigid_body
                    .position_normalized()
                    .get::<ratio>(),
                self.actuator_assembly
                    .linear_actuator
                    .position_normalized
                    .get::<ratio>(),
                self.actuator_assembly
                    .linear_actuator
                    .force()
                    .get::<newton>(),
            );
        }
    }
    impl Aircraft for TestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.loop_updater.update(context);

            for cur_time_step in self.loop_updater {
                self.update_actuator_physics(&context.with_delta(cur_time_step));
            }
        }
    }
    impl SimulationElement for TestAircraft {}

    #[test]
    fn linear_actuator_not_moving_on_locked_rigid_body() {
        let rigid_body = cargo_door_body(true);
        let actuator = cargo_door_actuator(&rigid_body);

        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new(actuator, rigid_body));

        let actuator_position_init = test_bed.query(|a| a.body_position());

        test_bed.run_with_delta(Duration::from_secs(1));

        assert!(test_bed.query(|a| a.body_position()) == actuator_position_init);
    }

    #[test]
    fn linear_actuator_moving_on_unlocked_rigid_body() {
        let rigid_body = cargo_door_body(true);
        let actuator = cargo_door_actuator(&rigid_body);

        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new(actuator, rigid_body));

        let actuator_position_init = test_bed.query(|a| a.body_position());

        test_bed.run_with_delta(Duration::from_secs(1));

        assert!(test_bed.query(|a| a.body_position()) == actuator_position_init);

        test_bed.command(|a| a.command_unlock());
        test_bed.run_with_delta(Duration::from_secs(1));

        assert!(test_bed.query(|a| a.body_position()) > actuator_position_init);
    }

    #[test]
    fn linear_actuator_can_move_rigid_body_up() {
        let rigid_body = cargo_door_body(true);
        let actuator = cargo_door_actuator(&rigid_body);

        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new(actuator, rigid_body));

        let actuator_position_init = test_bed.query(|a| a.body_position());

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.1)));

        test_bed.command(|a| a.set_pressure(Pressure::new::<psi>(3000.)));

        test_bed.run_with_delta(Duration::from_secs(1));

        assert!(test_bed.query(|a| a.body_position()) > actuator_position_init);

        test_bed.run_with_delta(Duration::from_secs(25));

        assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.9));
    }

    #[test]
    fn linear_actuator_resists_body_drop_when_valves_closed() {
        let rigid_body = cargo_door_body(true);
        let actuator = cargo_door_actuator(&rigid_body);

        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new(actuator, rigid_body));

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.)));

        test_bed.command(|a| a.set_pressure(Pressure::new::<psi>(3000.)));

        test_bed.run_with_delta(Duration::from_secs(25));

        assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.9));

        test_bed.command(|a| a.command_closed_valve_mode());

        test_bed.run_with_delta(Duration::from_secs(25));

        assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.7));
    }

    #[test]
    fn linear_actuator_dampens_body_drop_when_damping_mode() {
        let rigid_body = cargo_door_body(true);
        let actuator = cargo_door_actuator(&rigid_body);

        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new(actuator, rigid_body));

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.)));

        test_bed.command(|a| a.set_pressure(Pressure::new::<psi>(3000.)));

        test_bed.run_with_delta(Duration::from_secs(25));

        assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.9));

        test_bed.command(|a| a.command_damping_mode());

        test_bed.run_with_delta(Duration::from_secs(5));

        assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.5));
    }

    #[test]
    fn linear_actuator_without_hyd_pressure_cant_move_body_up() {
        let rigid_body = cargo_door_body(true);
        let actuator = cargo_door_actuator(&rigid_body);

        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new(actuator, rigid_body));

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.)));

        test_bed.command(|a| a.set_pressure(Pressure::new::<psi>(0.)));

        test_bed.run_with_delta(Duration::from_secs(25));

        assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.3));
    }

    #[test]
    fn linear_actuator_losing_hyd_pressure_half_way_cant_move_body_up() {
        let rigid_body = cargo_door_body(true);
        let actuator = cargo_door_actuator(&rigid_body);

        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new(actuator, rigid_body));

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(1.)));

        test_bed.command(|a| a.set_pressure(Pressure::new::<psi>(3000.)));

        test_bed.run_with_delta(Duration::from_secs(10));

        let actuator_position_at_10s = test_bed.query(|a| a.body_position());

        test_bed.command(|a| a.set_pressure(Pressure::new::<psi>(0.)));
        test_bed.run_with_delta(Duration::from_secs(25));

        assert!(
            test_bed.query(|a| a.body_position())
                <= actuator_position_at_10s + Ratio::new::<ratio>(0.05)
        );
    }

    #[test]
    fn body_gravity_movement_if_unlocked() {
        let rigid_body = cargo_door_body(false);
        let actuator = cargo_door_actuator(&rigid_body);

        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new(actuator, rigid_body));

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.command_damping_mode());

        test_bed.write_by_name(UpdateContext::PLANE_BANK_KEY, -45.);

        test_bed.run_with_delta(Duration::from_secs(25));

        // At 45 degrees bank angle we expect door around mid position
        assert!(test_bed.query(|a| a.body_position()) > Ratio::new::<ratio>(0.4));
        assert!(test_bed.query(|a| a.body_position()) < Ratio::new::<ratio>(0.6));
    }

    #[test]
    fn start_moving_once_unlocked() {
        let rigid_body = cargo_door_body(true);
        let actuator = cargo_door_actuator(&rigid_body);

        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new(actuator, rigid_body));

        test_bed.write_by_name(UpdateContext::PLANE_BANK_KEY, -45.);

        let actuator_position_at_init = test_bed.query(|a| a.body_position());
        test_bed.run_with_delta(Duration::from_secs(5));

        assert!(test_bed.query(|a| a.body_position()) == actuator_position_at_init);

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.command_damping_mode());

        test_bed.run_with_delta(Duration::from_secs(5));

        assert!(test_bed.query(|a| a.body_position()) > actuator_position_at_init);
    }

    #[test]
    fn locks_at_required_position() {
        let rigid_body = cargo_door_body(true);
        let actuator = cargo_door_actuator(&rigid_body);

        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new(actuator, rigid_body));

        test_bed.write_by_name(UpdateContext::PLANE_BANK_KEY, -45.);

        let actuator_position_at_init = test_bed.query(|a| a.body_position());
        test_bed.run_with_delta(Duration::from_secs(5));

        assert!(test_bed.query(|a| a.body_position()) == actuator_position_at_init);

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.command_damping_mode());

        test_bed.run_with_delta(Duration::from_secs_f64(0.1));

        assert!(test_bed.query(|a| a.body_position()) > actuator_position_at_init);

        test_bed.command(|a| a.command_lock(Ratio::new::<ratio>(0.3)));

        test_bed.run_with_delta(Duration::from_secs(20));

        assert!(test_bed.query(|a| a.is_locked()));
        assert!(test_bed.query(|a| a.body_position()) == Ratio::new::<ratio>(0.3));
    }

    #[test]
    fn linear_actuator_can_control_position() {
        let rigid_body = cargo_door_body(true);
        let actuator = cargo_door_actuator(&rigid_body);

        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new(actuator, rigid_body));

        test_bed.command(|a| a.command_unlock());
        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(0.7)));

        test_bed.command(|a| a.set_pressure(Pressure::new::<psi>(3000.)));

        test_bed.run_with_delta(Duration::from_secs(20));

        assert!(test_bed.query(|a| a.actuator_position()) > Ratio::new::<ratio>(0.68));
        assert!(test_bed.query(|a| a.actuator_position()) < Ratio::new::<ratio>(0.72));

        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(0.2)));
        test_bed.run_with_delta(Duration::from_secs(20));

        assert!(test_bed.query(|a| a.actuator_position()) > Ratio::new::<ratio>(0.18));
        assert!(test_bed.query(|a| a.actuator_position()) < Ratio::new::<ratio>(0.22));
    }

    fn cargo_door_actuator(bounded_linear_length: &impl BoundedLinearLength) -> LinearActuator {
        LinearActuator::new(
            bounded_linear_length,
            2,
            Length::new::<meter>(0.04422),
            Length::new::<meter>(0.03366),
            VolumeRate::new::<gallon_per_second>(0.008),
            800000.,
            15000.,
            10000.,
        )
    }

    fn cargo_door_body(is_locked: bool) -> LinearActuatedRigidBodyOnHingeAxis {
        let size = Vector3::new(100. / 1000., 1855. / 1000., 2025. / 1000.);
        let cg_offset = Vector3::new(0., -size[1] / 2., 0.);

        let control_arm = Vector3::new(-0.1597, -0.1614, 0.);
        let anchor = Vector3::new(-0.759, -0.086, 0.);

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

    fn main_gear_door_actuator(bounded_linear_length: &impl BoundedLinearLength) -> LinearActuator {
        LinearActuator::new(
            bounded_linear_length,
            1,
            Length::new::<meter>(0.014),
            Length::new::<meter>(0.0112),
            VolumeRate::new::<gallon_per_second>(0.004),
            20000.,
            5000.,
            2000.,
        )
    }

    fn main_gear_door_right_body(is_locked: bool) -> LinearActuatedRigidBodyOnHingeAxis {
        let size = Vector3::new(1.73, 0.03, 1.7);
        let cg_offset = Vector3::new(2. / 3. * size[1], 0.2, 0.);

        let control_arm = Vector3::new(0.5, 0., 0.);
        let anchor = Vector3::new(0.2, 0.2, 0.);

        LinearActuatedRigidBodyOnHingeAxis::new(
            Mass::new::<kilogram>(40.),
            size,
            cg_offset,
            control_arm,
            anchor,
            Angle::new::<degree>(90.),
            Angle::new::<degree>(85.),
            100.,
            is_locked,
            Vector3::new(0., 0., 1.),
        )
    }
}
