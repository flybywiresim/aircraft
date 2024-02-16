use crate::shared::local_acceleration_at_plane_coordinate;
use crate::shared::low_pass_filter::LowPassFilter;
use crate::shared::update_iterator::MaxStepLoop;

use crate::simulation::{
    InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader, UpdateContext,
    VariableIdentifier,
};

use uom::si::{
    acceleration::meter_per_second_squared,
    angle::radian,
    f64::*,
    force::newton,
    length::meter,
    mass::kilogram,
    ratio::percent,
    ratio::ratio,
    velocity::{knot, meter_per_second},
};

use std::time::Duration;

use nalgebra::{Vector2, Vector3};

enum GearStrutId {
    Nose = 0,
    LeftBody = 1,
    RightBody = 2,
    LeftWing = 3,
    RightWing = 4,
}
struct LandingGearWeightOnWheelsEstimator {
    center_compression_id: VariableIdentifier,

    left_wing_compression_id: VariableIdentifier,
    right_wing_compression_id: VariableIdentifier,

    left_body_compression_id: VariableIdentifier,
    right_body_compression_id: VariableIdentifier,

    center_compression: Ratio,
    left_wing_compression: Ratio,
    right_wing_compression: Ratio,
    left_body_compression: Ratio,
    right_body_compression: Ratio,
}
impl LandingGearWeightOnWheelsEstimator {
    const GEAR_CENTER_COMPRESSION: &'static str = "CONTACT POINT COMPRESSION";
    const GEAR_LEFT_BODY_COMPRESSION: &'static str = "CONTACT POINT COMPRESSION:1";
    const GEAR_RIGHT_BODY_COMPRESSION: &'static str = "CONTACT POINT COMPRESSION:2";
    const GEAR_LEFT_WING_COMPRESSION: &'static str = "CONTACT POINT COMPRESSION:3";
    const GEAR_RIGHT_WING_COMPRESSION: &'static str = "CONTACT POINT COMPRESSION:4";

    // Weight estimation is in the form of weight = X * compression_percent^(Y)
    const NOSE_GEAR_X_COEFF: f64 = 0.005;
    const NOSE_GEAR_Y_POW: f64 = 3.6;

    const WING_GEAR_X_COEFF: f64 = 0.006;
    const WING_GEAR_Y_POW: f64 = 3.85;

    const BODY_GEAR_X_COEFF: f64 = 0.0055;
    const BODY_GEAR_Y_POW: f64 = 3.85;

    fn new(context: &mut InitContext) -> Self {
        Self {
            center_compression_id: context.get_identifier(Self::GEAR_CENTER_COMPRESSION.to_owned()),
            left_wing_compression_id: context
                .get_identifier(Self::GEAR_LEFT_WING_COMPRESSION.to_owned()),
            right_wing_compression_id: context
                .get_identifier(Self::GEAR_RIGHT_WING_COMPRESSION.to_owned()),
            left_body_compression_id: context
                .get_identifier(Self::GEAR_LEFT_BODY_COMPRESSION.to_owned()),
            right_body_compression_id: context
                .get_identifier(Self::GEAR_RIGHT_BODY_COMPRESSION.to_owned()),

            center_compression: Ratio::default(),
            left_wing_compression: Ratio::default(),
            right_wing_compression: Ratio::default(),
            left_body_compression: Ratio::default(),
            right_body_compression: Ratio::default(),
        }
    }

    fn total_weight_on_wheels(&self) -> Mass {
        self.weight_on_wheel(GearStrutId::Nose)
            + self.weight_on_wheel(GearStrutId::LeftWing)
            + self.weight_on_wheel(GearStrutId::RightWing)
            + self.weight_on_wheel(GearStrutId::LeftBody)
            + self.weight_on_wheel(GearStrutId::RightBody)
    }

    fn weight_on_wheel(&self, wheel_id: GearStrutId) -> Mass {
        let (coeff, compression, exponent) = match wheel_id {
            GearStrutId::Nose => (
                Self::NOSE_GEAR_X_COEFF,
                self.center_compression,
                Self::NOSE_GEAR_Y_POW,
            ),
            GearStrutId::LeftWing => (
                Self::WING_GEAR_X_COEFF,
                self.left_wing_compression,
                Self::WING_GEAR_Y_POW,
            ),
            GearStrutId::RightWing => (
                Self::WING_GEAR_X_COEFF,
                self.right_wing_compression,
                Self::WING_GEAR_Y_POW,
            ),
            GearStrutId::LeftBody => (
                Self::BODY_GEAR_X_COEFF,
                self.left_body_compression,
                Self::BODY_GEAR_Y_POW,
            ),
            GearStrutId::RightBody => (
                Self::BODY_GEAR_X_COEFF,
                self.right_body_compression,
                Self::BODY_GEAR_Y_POW,
            ),
        };

        Mass::new::<kilogram>(coeff * compression.get::<percent>().powf(exponent))
    }
}
impl SimulationElement for LandingGearWeightOnWheelsEstimator {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.center_compression = reader.read(&self.center_compression_id);
        self.left_wing_compression = reader.read(&self.left_wing_compression_id);
        self.right_wing_compression = reader.read(&self.right_wing_compression_id);
        self.left_body_compression = reader.read(&self.left_body_compression_id);
        self.right_body_compression = reader.read(&self.right_body_compression_id);
    }
}

// Computes a global lift force from anything we can use from the sim
pub struct WingLift {
    gear_weight_on_wheels: LandingGearWeightOnWheelsEstimator,

    total_lift: Force,

    ground_weight_ratio: Ratio,

    ground_wow_filtered: LowPassFilter<f64>,
}
impl WingLift {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            gear_weight_on_wheels: LandingGearWeightOnWheelsEstimator::new(context),
            total_lift: Force::default(),
            ground_weight_ratio: Ratio::default(),

            ground_wow_filtered: LowPassFilter::new(Duration::from_millis(650)),
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        let total_weight_on_wheels = self.gear_weight_on_wheels.total_weight_on_wheels();

        let raw_accel_no_grav = context.vert_accel().get::<meter_per_second_squared>();
        let cur_weight_kg = context.total_weight().get::<kilogram>();

        let lift_delta_from_accel_n = raw_accel_no_grav * cur_weight_kg;
        let lift_1g = 9.8 * cur_weight_kg;
        let lift_wow = -9.8 * total_weight_on_wheels.get::<kilogram>();

        self.ground_wow_filtered.update(context.delta(), lift_wow);

        let lift = if total_weight_on_wheels.get::<kilogram>() > 500. {
            (lift_1g + self.ground_wow_filtered.output()).max(0.)
        } else {
            lift_1g + lift_delta_from_accel_n
        };

        self.total_lift = Force::new::<newton>(lift);

        self.ground_weight_ratio = total_weight_on_wheels / context.total_weight();
    }

    pub fn total_plane_lift(&self) -> Force {
        self.total_lift
    }

    // Outputs the fraction of the weight of the plane that is applied on ground.
    //      0-> Plane not on ground  0.5-> half the weight of the plane on ground ...
    pub fn ground_weight_ratio(&self) -> Ratio {
        Ratio::new::<ratio>(self.ground_weight_ratio.get::<ratio>().clamp(0., 1.))
    }

    pub fn total_lift(&self) -> Force {
        self.total_lift
    }
}
impl SimulationElement for WingLift {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.gear_weight_on_wheels.accept(visitor);

        visitor.visit(self);
    }
}

// Map that gives the mass of each wingflex node given the masses of the plane fuel tanks
pub struct WingFuelNodeMapper<const FUEL_TANK_NUMBER: usize, const NODE_NUMBER: usize> {
    fuel_tank_mapping: [usize; FUEL_TANK_NUMBER],
}
impl<const FUEL_TANK_NUMBER: usize, const NODE_NUMBER: usize>
    WingFuelNodeMapper<FUEL_TANK_NUMBER, NODE_NUMBER>
{
    // For each fuel tank, gives the index of the wing node where fuel mass is added
    pub fn new(fuel_tank_mapping: [usize; FUEL_TANK_NUMBER]) -> Self {
        Self { fuel_tank_mapping }
    }

    pub fn fuel_masses(&self, fuel_tanks_masses: [Mass; FUEL_TANK_NUMBER]) -> [Mass; NODE_NUMBER] {
        let mut masses = [Mass::default(); NODE_NUMBER];
        for (idx, fuel) in fuel_tanks_masses.iter().enumerate() {
            masses[self.fuel_tank_mapping[idx]] += *fuel;
        }
        masses
    }
}

/// Computes the vertical acceleration in plane local Y coordinate of the root of a wing
/// Takes the points coordinates of the root of the wing relative to datum point in the model
pub struct WingRootAcceleration {
    wing_root_position_meters: Vector3<f64>,

    total_wing_root_accel_filtered: LowPassFilter<f64>,
}
impl WingRootAcceleration {
    pub fn new(wing_root_position_meters: Vector3<f64>) -> Self {
        Self {
            wing_root_position_meters,

            total_wing_root_accel_filtered: LowPassFilter::new(Duration::from_millis(1)),
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        let local_wing_root_accel =
            local_acceleration_at_plane_coordinate(context, self.wing_root_position_meters);

        let total_wing_root_accel =
            context.vert_accel().get::<meter_per_second_squared>() + local_wing_root_accel[1];

        self.total_wing_root_accel_filtered
            .update(context.delta(), total_wing_root_accel);
    }

    pub fn acceleration(&self) -> Acceleration {
        Acceleration::new::<meter_per_second_squared>(self.total_wing_root_accel_filtered.output())
    }
}

/// A flexible constraint with elasticity and damping property. Represent the bending flex force between two wing nodes
struct FlexibleConstraint {
    springiness: f64,
    damping: f64,

    negative_springiness_coeff: f64,
    is_linear: bool,

    previous_length: Length,
    damping_force: LowPassFilter<Force>,

    total_force: Force,
}
impl FlexibleConstraint {
    // Damping is low pass filtered which results in improved numerical stability
    const DAMPING_FILTERING_TIME_CONSTANT: Duration = Duration::from_millis(10);

    fn new(
        springiness: f64,
        damping: f64,
        is_linear: bool,
        negative_springiness_coeff: Option<f64>,
    ) -> Self {
        Self {
            springiness,
            damping,
            negative_springiness_coeff: if let Some(coeff) = negative_springiness_coeff {
                coeff
            } else {
                1.
            },
            is_linear,
            previous_length: Length::default(),
            damping_force: LowPassFilter::new(Self::DAMPING_FILTERING_TIME_CONSTANT),
            total_force: Force::default(),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        nodes: &mut [WingSectionNode], //nodes[0] wing root side node nodes[1] wing tip side node
    ) {
        let length = nodes[1].position() - nodes[0].position();

        let spring_force = if length.get::<meter>() < 0. {
            if self.is_linear {
                Force::new::<newton>(
                    length.get::<meter>() * self.springiness * self.negative_springiness_coeff,
                )
            } else {
                -Force::new::<newton>(
                    (-length.get::<meter>()).exp() * self.springiness - self.springiness,
                ) * self.negative_springiness_coeff
            }
        } else if self.is_linear {
            Force::new::<newton>(length.get::<meter>() * self.springiness)
        } else {
            Force::new::<newton>(length.get::<meter>().exp() * self.springiness - self.springiness)
        };

        let speed = (self.previous_length - length) / context.delta_as_time();

        let raw_damping_force =
            Force::new::<newton>(-speed.get::<meter_per_second>() * self.damping);

        self.damping_force
            .update(context.delta(), raw_damping_force);

        self.total_force = spring_force + self.damping_force.output();

        self.previous_length = length;

        // Spring force is computed, we apply it back to left and right nodes: same but opposite force
        nodes[0].apply_force(self.total_force);
        nodes[1].apply_force(-self.total_force);
    }
}

/// A wing node with a empty mass and a fuel mass. Can be connected to another node through a flexible constraint
struct WingSectionNode {
    empty_mass: Mass,
    fuel_mass: Mass,
    speed: Velocity,
    position: Length,
    acceleration: Acceleration,

    external_position_offset: Length,

    sum_of_forces: Force,
}
impl WingSectionNode {
    fn new(empty_mass: Mass) -> Self {
        Self {
            empty_mass,
            fuel_mass: Mass::default(),
            speed: Velocity::default(),
            position: Length::default(),
            acceleration: Acceleration::default(),

            external_position_offset: Length::default(),

            sum_of_forces: Force::default(),
        }
    }

    fn update(&mut self, context: &UpdateContext) {
        self.apply_gravity_force(context);
        self.solve_physics(context);
    }

    fn gravity_on_plane_y_axis(context: &UpdateContext) -> Acceleration {
        let pitch_rotation = context.attitude().pitch_rotation_transform();

        let bank_rotation = context.attitude().bank_rotation_transform();

        let gravity_acceleration_world_reference = Vector3::new(0., -9.8, 0.);

        // Total acceleration in plane reference is the gravity in world reference rotated to plane reference.
        let local_gravity_plane_reference =
            pitch_rotation * (bank_rotation * gravity_acceleration_world_reference);

        Acceleration::new::<meter_per_second_squared>(local_gravity_plane_reference[1])
    }

    fn apply_gravity_force(&mut self, context: &UpdateContext) {
        self.sum_of_forces += Force::new::<newton>(
            Self::gravity_on_plane_y_axis(context).get::<meter_per_second_squared>()
                * self.total_mass().get::<kilogram>(),
        );
    }

    fn solve_physics(&mut self, context: &UpdateContext) {
        if self.empty_mass.get::<kilogram>() > 0. {
            self.acceleration = self.sum_of_forces / self.total_mass();

            self.speed += self.acceleration * context.delta_as_time();

            self.position += self.speed * context.delta_as_time();
        }

        self.sum_of_forces = Force::default();
    }

    fn total_mass(&self) -> Mass {
        self.empty_mass + self.fuel_mass
    }

    fn apply_force(&mut self, force: Force) {
        self.sum_of_forces += force;
    }

    fn apply_external_offet(&mut self, offset: Length) {
        self.external_position_offset = offset;
    }

    fn position(&self) -> Length {
        self.position + self.external_position_offset
    }

    fn acceleration(&self) -> Acceleration {
        self.acceleration
    }

    fn set_fuel_mass(&mut self, fuel_mass: Mass) {
        self.fuel_mass = fuel_mass;
    }

    fn fuel_mass(&self) -> Mass {
        self.fuel_mass
    }
}

pub struct FlexPhysicsNG<const NODE_NUMBER: usize, const LINK_NUMBER: usize> {
    updater_max_step: MaxStepLoop,

    nodes: [WingSectionNode; NODE_NUMBER],
    flex_constraints: [FlexibleConstraint; LINK_NUMBER],

    // DEV simvars to adjust parameters ingame
    wing_dev_spring_1_id: VariableIdentifier,
    wing_dev_spring_2_id: VariableIdentifier,
    wing_dev_spring_3_id: VariableIdentifier,
    wing_dev_spring_4_id: VariableIdentifier,

    wing_dev_damping_1_id: VariableIdentifier,
    wing_dev_damping_2_id: VariableIdentifier,
    wing_dev_damping_3_id: VariableIdentifier,
    wing_dev_damping_4_id: VariableIdentifier,

    neg_flex_coeff_id: VariableIdentifier,
    exponent_flex_id: VariableIdentifier,

    external_accelerations_filtered: LowPassFilter<Acceleration>,
}
impl<const NODE_NUMBER: usize, const LINK_NUMBER: usize> FlexPhysicsNG<NODE_NUMBER, LINK_NUMBER> {
    const MIN_PHYSICS_SOLVER_TIME_STEP: Duration = Duration::from_millis(5);

    // Limits max impulse wing can receive from the plane as MSFS could send huge impulses when craching the plane
    const MAX_G_FORCE_IMPACT_APPLIED_ON_WING_ROOT_BY_PLANE_M_S2: f64 = 150.;

    // Plane accelerations are comunicated to the wing by artificially move the root node proportionaly to acceleration using this gain
    // More gain will cause wing being more sensitive to plane Y accelerations
    // Negative because if plane suddenly goes up, it locally throws wing down in wing frame of reference
    const PLANE_ACCEL_TO_WING_ROOT_OFFSET_GAIN: f64 = -0.006;

    pub fn new(
        context: &mut InitContext,
        empty_mass: [Mass; NODE_NUMBER],
        springness: [f64; LINK_NUMBER],
        damping: [f64; LINK_NUMBER],
    ) -> Self {
        let nodes_array = empty_mass.map(WingSectionNode::new);

        let links_array = springness
            .iter()
            .zip(damping)
            .map(|(springness, damping)| {
                FlexibleConstraint::new(*springness, damping, false, Some(1.4))
            })
            .collect::<Vec<_>>();
        Self {
            updater_max_step: MaxStepLoop::new(Self::MIN_PHYSICS_SOLVER_TIME_STEP),

            nodes: nodes_array,
            flex_constraints: links_array.try_into().unwrap_or_else(
                |v: Vec<FlexibleConstraint>| {
                    panic!(
                        "Expected a Vec of length {} but it was {}",
                        LINK_NUMBER,
                        v.len()
                    )
                },
            ),

            wing_dev_spring_1_id: context.get_identifier("WING_FLEX_DEV_SPRING_1".to_owned()),
            wing_dev_spring_2_id: context.get_identifier("WING_FLEX_DEV_SPRING_2".to_owned()),
            wing_dev_spring_3_id: context.get_identifier("WING_FLEX_DEV_SPRING_3".to_owned()),
            wing_dev_spring_4_id: context.get_identifier("WING_FLEX_DEV_SPRING_4".to_owned()),

            wing_dev_damping_1_id: context.get_identifier("WING_FLEX_DEV_DAMPING_1".to_owned()),
            wing_dev_damping_2_id: context.get_identifier("WING_FLEX_DEV_DAMPING_2".to_owned()),
            wing_dev_damping_3_id: context.get_identifier("WING_FLEX_DEV_DAMPING_3".to_owned()),
            wing_dev_damping_4_id: context.get_identifier("WING_FLEX_DEV_DAMPING_4".to_owned()),
            neg_flex_coeff_id: context.get_identifier("WING_FLEX_DEV_NEG_STIFF_COEFF".to_owned()),
            exponent_flex_id: context.get_identifier("WING_FLEX_DEV_STIFF_EXPO_ENA".to_owned()),

            external_accelerations_filtered: LowPassFilter::new(Duration::from_millis(50)),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        lift_forces: &[f64],
        fuel_masses: [Mass; NODE_NUMBER],
        external_acceleration_from_plane_body: Acceleration,
    ) {
        self.updater_max_step.update(context);

        for cur_time_step in &mut self.updater_max_step {
            self.external_accelerations_filtered
                .update(context.delta(), external_acceleration_from_plane_body);

            // Here we artificially move up or down wing root point so that plane movement is communicated to the rest of the wing
            //      through the flex constraints
            self.nodes[0].apply_external_offet(
                Self::PLANE_ACCEL_TO_WING_ROOT_OFFSET_GAIN
                    * Length::new::<meter>(
                        self.external_accelerations_filtered
                            .output()
                            .get::<meter_per_second_squared>()
                            .clamp(
                                -Self::MAX_G_FORCE_IMPACT_APPLIED_ON_WING_ROOT_BY_PLANE_M_S2,
                                Self::MAX_G_FORCE_IMPACT_APPLIED_ON_WING_ROOT_BY_PLANE_M_S2,
                            ),
                    ),
            );

            // Solving flex physics of n-1 first nodes (N nodes  N-1 Links)
            for idx in 0..LINK_NUMBER {
                self.nodes[idx].set_fuel_mass(fuel_masses[idx]);

                self.nodes[idx].apply_force(Force::new::<newton>(lift_forces[idx]));

                self.nodes[idx].update(&context.with_delta(cur_time_step));

                self.flex_constraints[idx].update(
                    &context.with_delta(cur_time_step),
                    &mut self.nodes[idx..=idx + 1],
                );
            }

            // Don't forget last node to solve as for loop solves only up to n-1 node
            self.nodes[NODE_NUMBER - 1].set_fuel_mass(fuel_masses[NODE_NUMBER - 1]);
            self.nodes[NODE_NUMBER - 1]
                .apply_force(Force::new::<newton>(lift_forces[NODE_NUMBER - 1]));
            self.nodes[NODE_NUMBER - 1].update(&context.with_delta(cur_time_step));
        }
    }

    pub fn nodes_height_meters(&self) -> [f64; NODE_NUMBER] {
        let mut all_heights_meters = [0.; NODE_NUMBER];

        for (height, node) in all_heights_meters[1..].iter_mut().zip(&self.nodes[1..]) {
            *height = node.position().get::<meter>();
        }
        all_heights_meters
    }

    pub fn acceleration_at_node_idx(&self, node_idx: usize) -> Acceleration {
        assert!(node_idx < NODE_NUMBER);

        self.nodes[node_idx].acceleration()
    }

    pub fn node_fuel_mass(&self, node_id: usize) -> Mass {
        self.nodes[node_id].fuel_mass()
    }
}
impl SimulationElement for FlexPhysicsNG<5, 4> {
    fn read(&mut self, reader: &mut SimulatorReader) {
        let node1_spring = reader.read(&self.wing_dev_spring_1_id);
        if node1_spring > 0. {
            self.flex_constraints[0].springiness = node1_spring;
        }

        let node2_spring = reader.read(&self.wing_dev_spring_2_id);
        if node2_spring > 0. {
            self.flex_constraints[1].springiness = node2_spring;
        }

        let node3_spring = reader.read(&self.wing_dev_spring_3_id);
        if node3_spring > 0. {
            self.flex_constraints[2].springiness = node3_spring;
        }

        let node4_spring = reader.read(&self.wing_dev_spring_4_id);
        if node4_spring > 0. {
            self.flex_constraints[3].springiness = node4_spring;
        }

        let node1_damp = reader.read(&self.wing_dev_damping_1_id);
        if node1_damp > 0. {
            self.flex_constraints[0].damping = node1_damp;
        }

        let node2_damp = reader.read(&self.wing_dev_damping_2_id);
        if node2_damp > 0. {
            self.flex_constraints[1].damping = node2_damp;
        }

        let node3_damp = reader.read(&self.wing_dev_damping_3_id);
        if node3_damp > 0. {
            self.flex_constraints[2].damping = node3_damp;
        }

        let node4_damp = reader.read(&self.wing_dev_damping_4_id);
        if node4_damp > 0. {
            self.flex_constraints[3].damping = node4_damp;
        }

        let neg_coeff = reader.read(&self.neg_flex_coeff_id);
        if neg_coeff > 0. {
            self.flex_constraints[0].negative_springiness_coeff = neg_coeff;
            self.flex_constraints[1].negative_springiness_coeff = neg_coeff;
            self.flex_constraints[2].negative_springiness_coeff = neg_coeff;
            self.flex_constraints[3].negative_springiness_coeff = neg_coeff;
        } else {
            self.flex_constraints[0].negative_springiness_coeff = 1.;
            self.flex_constraints[1].negative_springiness_coeff = 1.;
            self.flex_constraints[2].negative_springiness_coeff = 1.;
            self.flex_constraints[3].negative_springiness_coeff = 1.;
        }

        let is_expo: f64 = reader.read(&self.exponent_flex_id);
        if is_expo > 0.1 {
            self.flex_constraints[0].is_linear = false;
            self.flex_constraints[1].is_linear = false;
            self.flex_constraints[2].is_linear = false;
            self.flex_constraints[3].is_linear = false;
        } else {
            self.flex_constraints[0].is_linear = true;
            self.flex_constraints[1].is_linear = true;
            self.flex_constraints[2].is_linear = true;
            self.flex_constraints[3].is_linear = true;
        }
    }
}

// Takes height of each node and returns the angles between last nodes from wing root to tip
//      This is used because animation bones are parent/child from root to tip
pub struct WingAnimationMapper<const NODE_NUMBER: usize> {
    x_positions: [f64; NODE_NUMBER],
}
impl<const NODE_NUMBER: usize> WingAnimationMapper<NODE_NUMBER> {
    pub fn new(x_positions: [f64; NODE_NUMBER]) -> Self {
        Self { x_positions }
    }

    pub fn animation_angles(&self, wing_node_heights: [f64; NODE_NUMBER]) -> [Angle; NODE_NUMBER] {
        let mut animation_angles = [Angle::default(); NODE_NUMBER];

        let mut previous_node_coord = Vector2::new(1., 0.);

        for idx in 1..NODE_NUMBER {
            let cur_node_coord = Vector2::new(
                self.x_positions[idx] - self.x_positions[idx - 1],
                wing_node_heights[idx],
            );
            let dot_prod = previous_node_coord
                .normalize()
                .dot(&cur_node_coord.normalize());

            animation_angles[idx] =
                if Self::is_positive_angle(&previous_node_coord, &cur_node_coord) {
                    Angle::new::<radian>(dot_prod.acos())
                } else {
                    -Angle::new::<radian>(dot_prod.acos())
                };

            previous_node_coord = cur_node_coord;
        }

        animation_angles
    }

    fn is_positive_angle(v1: &Vector2<f64>, v2: &Vector2<f64>) -> bool {
        Self::cross(v1, v2) >= 0.
    }

    fn cross(v1: &Vector2<f64>, v2: &Vector2<f64>) -> f64 {
        (v1[0] * v2[1]) - (v1[1] * v2[0])
    }
}
impl SimulationElement for WingAnimationMapper<5> {}
