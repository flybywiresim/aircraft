use crate::shared::low_pass_filter::LowPassFilter;
use crate::shared::update_iterator::MaxStepLoop;
use crate::shared::{local_acceleration_at_plane_coordinate, SurfacesPositions};

use crate::fuel::FuelPayload;
use crate::simulation::{
    InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
    SimulatorWriter, UpdateContext, VariableIdentifier, Write,
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

use nalgebra::{Vector2, Vector3, Vector5};

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
    const GEAR_CENTER_COMPRESSION: &'static str = "CONTACT POINT COMPRESSION:0";
    const GEAR_LEFT_BODY_COMPRESSION: &'static str = "CONTACT POINT COMPRESSION:1";
    const GEAR_RIGHT_BODY_COMPRESSION: &'static str = "CONTACT POINT COMPRESSION:2";
    const GEAR_LEFT_WING_COMPRESSION: &'static str = "CONTACT POINT COMPRESSION:3";
    const GEAR_RIGHT_WING_COMPRESSION: &'static str = "CONTACT POINT COMPRESSION:4";

    // Weight estimation is in the form of weight = X * compression_percent^(Y)
    const NOSE_GEAR_X_COEFF: f64 = 2.22966;
    const NOSE_GEAR_Y_POW: f64 = 2.2953179884;

    const WING_GEAR_X_COEFF: f64 = 5.5;
    const WING_GEAR_Y_POW: f64 = 2.6;

    const BODY_GEAR_X_COEFF: f64 = 7.5;
    const BODY_GEAR_Y_POW: f64 = 2.5;

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
        self.left_wing_compression = reader.read(&self.left_body_compression_id);
        self.right_wing_compression = reader.read(&self.right_body_compression_id);
        self.left_body_compression = reader.read(&self.left_wing_compression_id);
        self.right_body_compression = reader.read(&self.right_wing_compression_id);
    }
}

struct A380WingLiftModifier {
    lateral_offset: Ratio,

    left_wing_lift: Force,
    right_wing_lift: Force,

    standard_lift_spread: Vector5<f64>,
    lift_left_table_newton: Vector5<f64>,
    lift_right_table_newton: Vector5<f64>,
}
impl A380WingLiftModifier {
    const LATERAL_OFFSET_GAIN: f64 = 0.25;

    // Ratio of the total lift on each wing section.
    // Sum shall be 1.
    const NOMINAL_WING_LIFT_SPREAD_RATIOS: [f64; 5] = [0., 0.42, 0.40, 0.15, 0.03];

    // GAIN to determine how much a surface spoils lift when deployed. 0.3 means a fully deployed surface reduce lift by 30%
    const SPOILER_SURFACES_SPOIL_GAIN: f64 = 0.4;
    const AILERON_SURFACES_SPOIL_GAIN: f64 = 0.2;
    const FLAPS_SURFACES_SPOIL_GAIN: f64 = 0.3;

    fn default() -> Self {
        assert!(Vector5::from(Self::NOMINAL_WING_LIFT_SPREAD_RATIOS).sum() == 1.);

        Self {
            lateral_offset: Ratio::default(),

            left_wing_lift: Force::default(),
            right_wing_lift: Force::default(),

            standard_lift_spread: Vector5::from(Self::NOMINAL_WING_LIFT_SPREAD_RATIOS),
            lift_left_table_newton: Vector5::default(),
            lift_right_table_newton: Vector5::default(),
        }
    }

    fn update(&mut self, total_lift: Force, surfaces_positions: &impl SurfacesPositions) {
        self.compute_lift_modifiers(total_lift, surfaces_positions);
    }

    fn compute_lift_modifiers(
        &mut self,
        total_lift: Force,
        surfaces_positions: &impl SurfacesPositions,
    ) {
        let wing_base_left_spoilers = surfaces_positions.left_spoilers_positions()[0..=1]
            .iter()
            .sum::<f64>()
            / 2.;
        let wing_mid_left_spoilers = surfaces_positions.left_spoilers_positions()[2..=7]
            .iter()
            .sum::<f64>()
            / 6.;

        let wing_base_right_spoilers = surfaces_positions.left_spoilers_positions()[0..=1]
            .iter()
            .sum::<f64>()
            / 2.;
        let wing_mid_right_spoilers = surfaces_positions.left_spoilers_positions()[2..=7]
            .iter()
            .sum::<f64>()
            / 6.;

        // Aileron position is converted from [0 1] to [-1 1] then we take the mean value
        // ((position1 - 0.5) * 2. + (position2 - 0.5) * 2.) / 2. <=> position1+position2 - 1
        let left_ailerons_mid = surfaces_positions.left_ailerons_positions()[0..=1]
            .iter()
            .sum::<f64>()
            - 1.;
        let right_ailerons_mid = surfaces_positions.right_ailerons_positions()[0..=1]
            .iter()
            .sum::<f64>()
            - 1.;

        let left_ailerons_tip = 2. * surfaces_positions.left_ailerons_positions()[2] - 1.;
        let right_ailerons_tip = 2. * surfaces_positions.right_ailerons_positions()[2] - 1.;

        self.lateral_offset = Ratio::new::<ratio>(
            ((wing_base_right_spoilers - wing_base_left_spoilers)
                + (wing_mid_right_spoilers - wing_mid_left_spoilers)
                + (right_ailerons_mid - left_ailerons_mid)
                + (right_ailerons_tip - left_ailerons_tip))
                / 4.,
        );

        self.lateral_offset *= Self::LATERAL_OFFSET_GAIN;

        self.left_wing_lift = 0.5 * (total_lift + self.lateral_offset() * total_lift);
        self.right_wing_lift = total_lift - self.left_wing_lift;

        let left_flap_lift_factor = surfaces_positions.left_flaps_position();
        let right_flap_lift_factor = surfaces_positions.right_flaps_position();

        // Lift factor is 1 - spoil factor. We consider positive position for a surface is spoiling lift
        // Spoiler panel deployed will be 1. Aileron Up will be 1. Aileron down will be -1 thus (1 - -1) = 2 adds lift
        let left_wing_lift_factor = Vector5::from([
            0.,
            (1. - wing_base_left_spoilers) * Self::SPOILER_SURFACES_SPOIL_GAIN
                + left_flap_lift_factor * Self::FLAPS_SURFACES_SPOIL_GAIN,
            (1. - wing_mid_left_spoilers) * Self::SPOILER_SURFACES_SPOIL_GAIN
                + left_flap_lift_factor * Self::FLAPS_SURFACES_SPOIL_GAIN,
            (1. - left_ailerons_mid) * Self::AILERON_SURFACES_SPOIL_GAIN,
            (1. - left_ailerons_tip) * Self::AILERON_SURFACES_SPOIL_GAIN,
        ]);
        let right_wing_lift_factor = Vector5::from([
            0.,
            (1. - wing_base_right_spoilers) * Self::SPOILER_SURFACES_SPOIL_GAIN
                + right_flap_lift_factor * Self::FLAPS_SURFACES_SPOIL_GAIN,
            (1. - wing_mid_right_spoilers) * Self::SPOILER_SURFACES_SPOIL_GAIN
                + right_flap_lift_factor * Self::FLAPS_SURFACES_SPOIL_GAIN,
            (1. - right_ailerons_mid) * Self::AILERON_SURFACES_SPOIL_GAIN,
            (1. - right_ailerons_tip) * Self::AILERON_SURFACES_SPOIL_GAIN,
        ]);

        let raw_left_total_factor = left_wing_lift_factor.component_mul(&self.standard_lift_spread);
        let raw_right_total_factor =
            right_wing_lift_factor.component_mul(&self.standard_lift_spread);

        let left_lift_factor_normalized = raw_left_total_factor / raw_left_total_factor.sum();
        let right_lift_factor_normalized = raw_right_total_factor / raw_right_total_factor.sum();

        self.lift_left_table_newton =
            left_lift_factor_normalized * self.left_wing_lift.get::<newton>();

        self.lift_right_table_newton =
            right_lift_factor_normalized * self.right_wing_lift.get::<newton>();
    }

    fn lateral_offset(&self) -> Ratio {
        self.lateral_offset
    }

    fn per_node_lift_left_wing_newton(&self) -> Vector5<f64> {
        self.lift_left_table_newton
    }

    fn per_node_lift_right_wing_newton(&self) -> Vector5<f64> {
        self.lift_right_table_newton
    }
}

// Computes a global lift force from anything we can use from the sim
struct WingLift {
    gear_weight_on_wheels: LandingGearWeightOnWheelsEstimator,

    total_lift: Force,

    ground_weight_ratio: Ratio,
}
impl WingLift {
    fn new(context: &mut InitContext) -> Self {
        Self {
            gear_weight_on_wheels: LandingGearWeightOnWheelsEstimator::new(context),
            total_lift: Force::default(),
            ground_weight_ratio: Ratio::default(),
        }
    }

    fn update(&mut self, context: &UpdateContext) {
        let total_weight_on_wheels = self.gear_weight_on_wheels.total_weight_on_wheels();

        let raw_accel_no_grav = context.vert_accel().get::<meter_per_second_squared>();
        let cur_weight_kg = context.total_weight().get::<kilogram>();

        let lift_delta_from_accel_n = raw_accel_no_grav * cur_weight_kg;
        let lift_1g = 9.8 * cur_weight_kg;
        let lift_wow = -9.8 * total_weight_on_wheels.get::<kilogram>();

        let lift = if total_weight_on_wheels.get::<kilogram>() > 500. {
            // Assuming no lift at low wind speed avoids glitches with ground when braking hard for a full stop
            if context.true_airspeed().get::<knot>().abs() < 20. {
                0.
            } else {
                (lift_1g + lift_wow).max(0.)
            }
        } else {
            lift_1g + lift_delta_from_accel_n
        };

        self.total_lift = Force::new::<newton>(lift);

        self.ground_weight_ratio = total_weight_on_wheels / context.total_weight();
    }

    fn total_plane_lift(&self) -> Force {
        self.total_lift
    }

    // Outputs the fraction of the weight of the plane that is applied on ground.
    //      0-> Plane not on ground  0.5-> half the weight of the plane on ground ...
    fn ground_weight_ratio(&self) -> Ratio {
        Ratio::new::<ratio>(self.ground_weight_ratio.get::<ratio>().clamp(0., 1.))
    }
}
impl SimulationElement for WingLift {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.gear_weight_on_wheels.accept(visitor);

        visitor.visit(self);
    }
}

// Map that gives the mass of each wingflex node given the masses of the plane fuel tanks
struct WingFuelNodeMapper<const FUEL_TANK_NUMBER: usize, const NODE_NUMBER: usize> {
    fuel_tank_mapping: [usize; FUEL_TANK_NUMBER],
}
impl<const FUEL_TANK_NUMBER: usize, const NODE_NUMBER: usize>
    WingFuelNodeMapper<FUEL_TANK_NUMBER, NODE_NUMBER>
{
    // For each fuel tank, gives the index of the wing node where fuel mass is added
    fn new(fuel_tank_mapping: [usize; FUEL_TANK_NUMBER]) -> Self {
        Self { fuel_tank_mapping }
    }

    fn fuel_masses(&self, fuel_tanks_masses: [Mass; FUEL_TANK_NUMBER]) -> [Mass; NODE_NUMBER] {
        let mut masses = [Mass::default(); NODE_NUMBER];
        for (idx, fuel) in fuel_tanks_masses.iter().enumerate() {
            masses[self.fuel_tank_mapping[idx]] += *fuel;
        }
        masses
    }
}

enum A380FuelTankType {
    LeftOuter,
    FeedOne,
    LeftMid,
    LeftInner,
    FeedTwo,
    FeedThree,
    RightInner,
    RightMid,
    FeedFour,
    RightOuter,
    _Trim,
}

const WING_FLEX_NODE_NUMBER: usize = 5;
const WING_FLEX_LINK_NUMBER: usize = WING_FLEX_NODE_NUMBER - 1;
const FUEL_TANKS_NUMBER: usize = 5;

pub struct WingFlexA380 {
    left_flex_inboard_id: VariableIdentifier,
    left_flex_inboard_mid_id: VariableIdentifier,
    left_flex_outboard_mid_id: VariableIdentifier,
    left_flex_outboard_id: VariableIdentifier,

    right_flex_inboard_id: VariableIdentifier,
    right_flex_inboard_mid_id: VariableIdentifier,
    right_flex_outboard_mid_id: VariableIdentifier,
    right_flex_outboard_id: VariableIdentifier,

    wing_lift: WingLift,
    wing_lift_dynamic: A380WingLiftModifier,

    left_wing_fuel_mass: [Mass; FUEL_TANKS_NUMBER],
    right_wing_fuel_mass: [Mass; FUEL_TANKS_NUMBER],

    fuel_mapper: WingFuelNodeMapper<FUEL_TANKS_NUMBER, WING_FLEX_NODE_NUMBER>,
    animation_mapper: WingAnimationMapper<WING_FLEX_NODE_NUMBER>,

    flex_physics: [FlexPhysicsNG<WING_FLEX_NODE_NUMBER, WING_FLEX_LINK_NUMBER>; 2],

    left_right_wing_root_position: [WingRootAcceleration; 2],
}
impl WingFlexA380 {
    const FLEX_COEFFICIENTS: [f64; WING_FLEX_LINK_NUMBER] =
        [20000000., 8000000., 5000000., 500000.];
    const DAMPING_COEFFICIENTS: [f64; WING_FLEX_LINK_NUMBER] = [800000., 400000., 150000., 6000.];

    const EMPTY_MASS_KG: [f64; WING_FLEX_NODE_NUMBER] = [0., 25000., 20000., 5000., 400.];

    const FUEL_MAPPING: [usize; FUEL_TANKS_NUMBER] = [1, 1, 2, 2, 3];

    const WING_NODES_X_COORDINATES: [f64; WING_FLEX_NODE_NUMBER] = [0., 11.5, 22.05, 29., 36.85];

    pub fn new(context: &mut InitContext) -> Self {
        let empty_mass = Self::EMPTY_MASS_KG.map(Mass::new::<kilogram>);

        Self {
            left_flex_inboard_id: context.get_identifier("WING_FLEX_LEFT_INBOARD".to_owned()),
            left_flex_inboard_mid_id: context
                .get_identifier("WING_FLEX_LEFT_INBOARD_MID".to_owned()),
            left_flex_outboard_mid_id: context
                .get_identifier("WING_FLEX_LEFT_OUTBOARD_MID".to_owned()),
            left_flex_outboard_id: context.get_identifier("WING_FLEX_LEFT_OUTBOARD".to_owned()),

            right_flex_inboard_id: context.get_identifier("WING_FLEX_RIGHT_INBOARD".to_owned()),
            right_flex_inboard_mid_id: context
                .get_identifier("WING_FLEX_RIGHT_INBOARD_MID".to_owned()),
            right_flex_outboard_mid_id: context
                .get_identifier("WING_FLEX_RIGHT_OUTBOARD_MID".to_owned()),
            right_flex_outboard_id: context.get_identifier("WING_FLEX_RIGHT_OUTBOARD".to_owned()),

            wing_lift: WingLift::new(context),
            wing_lift_dynamic: A380WingLiftModifier::default(),

            left_wing_fuel_mass: [Mass::default(); FUEL_TANKS_NUMBER],
            right_wing_fuel_mass: [Mass::default(); FUEL_TANKS_NUMBER],

            fuel_mapper: WingFuelNodeMapper::new(Self::FUEL_MAPPING),
            animation_mapper: WingAnimationMapper::new(Self::WING_NODES_X_COORDINATES),

            flex_physics: [1, 2].map(|_| {
                FlexPhysicsNG::new(
                    context,
                    empty_mass,
                    Self::FLEX_COEFFICIENTS,
                    Self::DAMPING_COEFFICIENTS,
                )
            }),

            left_right_wing_root_position: [-1., 1.]
                .map(|xneg| WingRootAcceleration::new(Vector3::new(xneg * 3.33668, -0.273, 6.903))),
        }
    }

    fn update_fuel_masses(&mut self, fuel_mass: &impl FuelPayload) {
        self.left_wing_fuel_mass = [
            fuel_mass.tank_mass(A380FuelTankType::LeftInner as usize),
            fuel_mass.tank_mass(A380FuelTankType::FeedTwo as usize),
            fuel_mass.tank_mass(A380FuelTankType::LeftMid as usize),
            fuel_mass.tank_mass(A380FuelTankType::FeedOne as usize),
            fuel_mass.tank_mass(A380FuelTankType::LeftOuter as usize),
        ];
        self.right_wing_fuel_mass = [
            fuel_mass.tank_mass(A380FuelTankType::RightInner as usize),
            fuel_mass.tank_mass(A380FuelTankType::FeedThree as usize),
            fuel_mass.tank_mass(A380FuelTankType::RightMid as usize),
            fuel_mass.tank_mass(A380FuelTankType::FeedFour as usize),
            fuel_mass.tank_mass(A380FuelTankType::RightOuter as usize),
        ];
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        surface_vibration_acceleration: Acceleration,
        surfaces_positions: &impl SurfacesPositions,
        fuel_mass: &impl FuelPayload,
    ) {
        self.wing_lift.update(context);
        self.wing_lift_dynamic
            .update(self.wing_lift.total_plane_lift(), surfaces_positions);

        self.left_right_wing_root_position[0].update(context);
        self.left_right_wing_root_position[1].update(context);

        self.update_fuel_masses(fuel_mass);

        self.flex_physics[0].update(
            context,
            self.wing_lift_dynamic
                .per_node_lift_left_wing_newton()
                .as_slice(),
            self.fuel_mapper.fuel_masses(self.left_wing_fuel_mass),
            surface_vibration_acceleration + self.left_right_wing_root_position[0].acceleration(),
        );

        self.flex_physics[1].update(
            context,
            self.wing_lift_dynamic
                .per_node_lift_right_wing_newton()
                .as_slice(),
            self.fuel_mapper.fuel_masses(self.right_wing_fuel_mass),
            surface_vibration_acceleration + self.left_right_wing_root_position[1].acceleration(),
        );
    }

    pub fn ground_weight_ratio(&self) -> Ratio {
        self.wing_lift.ground_weight_ratio()
    }

    // Accelerations (vertical) of engines pylons from eng1 to eng4
    pub fn accelerations_at_engines_pylons(&self) -> [Acceleration; 4] {
        [(0, 2), (0, 1), (1, 1), (1, 2)].map(|(phys_idx, node_idx)| {
            self.flex_physics[phys_idx].acceleration_at_node_idx(node_idx)
        })
    }
}
impl SimulationElement for WingFlexA380 {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.wing_lift.accept(visitor);

        // Calling only left wing as this is only used for dev purpose : live tuning of flex properties
        self.flex_physics[0].accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        let bones_angles_left = self
            .animation_mapper
            .animation_angles(self.flex_physics[0].nodes_height_meters());

        writer.write(&self.left_flex_inboard_id, bones_angles_left[1]);
        writer.write(&self.left_flex_inboard_mid_id, bones_angles_left[2]);
        writer.write(&self.left_flex_outboard_mid_id, bones_angles_left[3]);
        writer.write(&self.left_flex_outboard_id, bones_angles_left[4]);

        let bones_angles_right = self
            .animation_mapper
            .animation_angles(self.flex_physics[1].nodes_height_meters());

        writer.write(&self.right_flex_inboard_id, bones_angles_right[1]);
        writer.write(&self.right_flex_inboard_mid_id, bones_angles_right[2]);
        writer.write(&self.right_flex_outboard_mid_id, bones_angles_right[3]);
        writer.write(&self.right_flex_outboard_id, bones_angles_right[4]);
    }
}

/// Computes the vertical acceleration in plane local Y coordinate of the root of a wing
/// Takes the points coordinates of the root of the wing relative to datum point in the model
struct WingRootAcceleration {
    wing_root_position_meters: Vector3<f64>,

    total_wing_root_accel_filtered: LowPassFilter<f64>,
}
impl WingRootAcceleration {
    fn new(wing_root_position_meters: Vector3<f64>) -> Self {
        Self {
            wing_root_position_meters,

            total_wing_root_accel_filtered: LowPassFilter::new(Duration::from_millis(1)),
        }
    }

    fn update(&mut self, context: &UpdateContext) {
        let local_wing_root_accel =
            local_acceleration_at_plane_coordinate(context, self.wing_root_position_meters);

        let total_wing_root_accel =
            context.vert_accel().get::<meter_per_second_squared>() + local_wing_root_accel[1];

        self.total_wing_root_accel_filtered
            .update(context.delta(), total_wing_root_accel);
    }

    fn acceleration(&self) -> Acceleration {
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
}

struct FlexPhysicsNG<const NODE_NUMBER: usize, const LINK_NUMBER: usize> {
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

    fn new(
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

    fn update(
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

    fn nodes_height_meters(&self) -> [f64; NODE_NUMBER] {
        let mut all_heights_meters = [0.; NODE_NUMBER];

        for (height, node) in all_heights_meters[1..].iter_mut().zip(&self.nodes[1..]) {
            *height = node.position().get::<meter>();
        }
        all_heights_meters
    }

    fn acceleration_at_node_idx(&self, node_idx: usize) -> Acceleration {
        assert!(node_idx < NODE_NUMBER);

        self.nodes[node_idx].acceleration()
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
struct WingAnimationMapper<const NODE_NUMBER: usize> {
    x_positions: [f64; NODE_NUMBER],
}
impl<const NODE_NUMBER: usize> WingAnimationMapper<NODE_NUMBER> {
    fn new(x_positions: [f64; NODE_NUMBER]) -> Self {
        Self { x_positions }
    }

    fn animation_angles(&self, wing_node_heights: [f64; NODE_NUMBER]) -> [Angle; NODE_NUMBER] {
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

#[cfg(test)]
mod tests {
    use super::*;

    use crate::simulation::test::{ElementCtorFn, WriteByName};
    use crate::simulation::test::{SimulationTestBed, TestBed};
    use crate::simulation::{Aircraft, SimulationElement, SimulationElementVisitor};
    use std::time::Duration;

    use uom::si::{angle::degree, length::meter, velocity::knot};

    use ntest::assert_about_eq;

    struct TestSurfacesPositions {
        left_ailerons: [f64; 3],
        right_ailerons: [f64; 3],
        left_spoilers: [f64; 8],
        right_spoilers: [f64; 8],
        left_flaps: f64,
        right_flaps: f64,
    }
    impl TestSurfacesPositions {
        fn default() -> Self {
            Self {
                left_ailerons: [0.5; 3],
                right_ailerons: [0.5; 3],
                left_spoilers: [0.; 8],
                right_spoilers: [0.; 8],
                left_flaps: 0.,
                right_flaps: 0.,
            }
        }
    }
    impl SurfacesPositions for TestSurfacesPositions {
        fn left_ailerons_positions(&self) -> &[f64] {
            &self.left_ailerons
        }

        fn right_ailerons_positions(&self) -> &[f64] {
            &self.right_ailerons
        }

        fn left_spoilers_positions(&self) -> &[f64] {
            &self.left_spoilers
        }

        fn right_spoilers_positions(&self) -> &[f64] {
            &self.right_spoilers
        }

        fn left_flaps_position(&self) -> f64 {
            self.left_flaps
        }

        fn right_flaps_position(&self) -> f64 {
            self.right_flaps
        }
    }

    struct TestFuelPayload {
        fuel_mass: [Mass; 11],
    }
    impl TestFuelPayload {
        fn default() -> Self {
            Self {
                fuel_mass: [Mass::default(); 11],
            }
        }

        fn set_fuel(&mut self, tank_id: A380FuelTankType, mass: Mass) {
            self.fuel_mass[tank_id as usize] = mass;
        }
    }
    impl FuelPayload for TestFuelPayload {
        fn fore_aft_center_of_gravity(&self) -> f64 {
            0.
        }

        fn total_load(&self) -> Mass {
            Mass::default()
        }

        fn tank_mass(&self, t: usize) -> Mass {
            self.fuel_mass[t]
        }
    }

    struct WingFlexTestAircraft {
        wing_flex: WingFlexA380,
        surfaces_position: TestSurfacesPositions,
        fuel_payload: TestFuelPayload,
    }
    impl WingFlexTestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                wing_flex: WingFlexA380::new(context),
                surfaces_position: TestSurfacesPositions::default(),
                fuel_payload: TestFuelPayload::default(),
            }
        }

        fn set_left_flaps(&mut self, position: f64) {
            self.surfaces_position.left_flaps = position;
        }

        fn set_right_flaps(&mut self, position: f64) {
            self.surfaces_position.right_flaps = position;
        }

        fn set_left_spoilers(&mut self, positions: [f64; 8]) {
            self.surfaces_position.left_spoilers = positions;
        }

        fn set_right_spoilers(&mut self, positions: [f64; 8]) {
            self.surfaces_position.right_spoilers = positions;
        }

        fn set_left_ailerons(&mut self, positions: [f64; 3]) {
            self.surfaces_position.left_ailerons = positions;
        }

        fn set_right_ailerons(&mut self, positions: [f64; 3]) {
            self.surfaces_position.right_ailerons = positions;
        }

        fn set_fuel(&mut self, tank_id: A380FuelTankType, mass: Mass) {
            self.fuel_payload.set_fuel(tank_id, mass);
        }
    }
    impl Aircraft for WingFlexTestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.wing_flex.update(
                context,
                Acceleration::default(),
                &self.surfaces_position,
                &self.fuel_payload,
            );

            println!(
                "WING HEIGHTS L/O\\R => {:.2}_{:.2}_{:.2}_{:.2}_{:.2}/O\\{:.2}_{:.2}_{:.2}_{:.2}_{:.2}",
                self.wing_flex.flex_physics[0].nodes[4]
                    .position()
                    .get::<meter>(),
                self.wing_flex.flex_physics[0].nodes[3]
                    .position()
                    .get::<meter>(),
                self.wing_flex.flex_physics[0].nodes[2]
                    .position()
                    .get::<meter>(),
                self.wing_flex.flex_physics[0].nodes[1]
                    .position()
                    .get::<meter>(),
                self.wing_flex.flex_physics[0].nodes[0]
                    .position()
                    .get::<meter>(),
                self.wing_flex.flex_physics[1].nodes[0]
                    .position()
                    .get::<meter>(),
                self.wing_flex.flex_physics[1].nodes[1]
                    .position()
                    .get::<meter>(),
                self.wing_flex.flex_physics[1].nodes[2]
                    .position()
                    .get::<meter>(),
                self.wing_flex.flex_physics[1].nodes[3]
                    .position()
                    .get::<meter>(),
                self.wing_flex.flex_physics[1].nodes[4]
                    .position()
                    .get::<meter>(),
            );
        }
    }
    impl SimulationElement for WingFlexTestAircraft {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.wing_flex.accept(visitor);

            visitor.visit(self);
        }
    }

    impl SimulationElement for WingAnimationMapper<5> {}

    struct WingFlexTestBed {
        test_bed: SimulationTestBed<WingFlexTestAircraft>,
    }
    impl WingFlexTestBed {
        const NOMINAL_WEIGHT_KG: f64 = 400000.;

        fn new() -> Self {
            Self {
                test_bed: SimulationTestBed::new(WingFlexTestAircraft::new),
            }
        }

        fn left_wing_lift_per_node(&self) -> Vector5<f64> {
            self.query(|a| {
                a.wing_flex
                    .wing_lift_dynamic
                    .per_node_lift_left_wing_newton()
            })
        }

        fn right_wing_lift_per_node(&self) -> Vector5<f64> {
            self.query(|a| {
                a.wing_flex
                    .wing_lift_dynamic
                    .per_node_lift_right_wing_newton()
            })
        }

        fn current_total_lift(&self) -> Force {
            self.query(|a| a.wing_flex.wing_lift.total_lift)
        }

        fn current_left_wing_lift(&self) -> Force {
            self.query(|a| a.wing_flex.wing_lift_dynamic.left_wing_lift)
        }

        fn current_right_wing_lift(&self) -> Force {
            self.query(|a| a.wing_flex.wing_lift_dynamic.right_wing_lift)
        }

        fn with_nominal_weight(mut self) -> Self {
            self.write_by_name(
                "TOTAL WEIGHT",
                Mass::new::<kilogram>(Self::NOMINAL_WEIGHT_KG),
            );
            self
        }

        fn with_max_fuel(mut self) -> Self {
            self.command(|a| {
                a.set_fuel(A380FuelTankType::LeftInner, Mass::new::<kilogram>(32000.))
            });
            self.command(|a| a.set_fuel(A380FuelTankType::FeedTwo, Mass::new::<kilogram>(20000.)));
            self.command(|a| a.set_fuel(A380FuelTankType::LeftMid, Mass::new::<kilogram>(28000.)));
            self.command(|a| a.set_fuel(A380FuelTankType::FeedOne, Mass::new::<kilogram>(20000.)));
            self.command(|a| a.set_fuel(A380FuelTankType::LeftOuter, Mass::new::<kilogram>(7200.)));

            self.command(|a| {
                a.set_fuel(A380FuelTankType::RightInner, Mass::new::<kilogram>(32000.))
            });
            self.command(|a| {
                a.set_fuel(A380FuelTankType::FeedThree, Mass::new::<kilogram>(20000.))
            });
            self.command(|a| a.set_fuel(A380FuelTankType::RightMid, Mass::new::<kilogram>(28000.)));
            self.command(|a| a.set_fuel(A380FuelTankType::FeedFour, Mass::new::<kilogram>(20000.)));
            self.command(|a| {
                a.set_fuel(A380FuelTankType::RightOuter, Mass::new::<kilogram>(7200.))
            });

            self
        }

        fn rotate_for_takeoff(mut self) -> Self {
            self.write_by_name("TOTAL WEIGHT", Mass::new::<kilogram>(400000.));
            self.write_by_name("AIRSPEED TRUE", Velocity::new::<knot>(150.));

            self.write_by_name("CONTACT POINT COMPRESSION:1", 30.);
            self.write_by_name("CONTACT POINT COMPRESSION:2", 30.);

            self.command(|a| a.set_left_flaps(0.5));
            self.command(|a| a.set_right_flaps(0.5));
            self
        }

        fn in_1g_flight(mut self) -> Self {
            self = self.neutral_ailerons();
            self = self.spoilers_retracted();
            self.write_by_name("TOTAL WEIGHT", Mass::new::<kilogram>(400000.));
            self.write_by_name("AIRSPEED TRUE", Velocity::new::<knot>(200.));
            self.write_by_name("CONTACT POINT COMPRESSION:1", 0.);
            self.write_by_name("CONTACT POINT COMPRESSION:2", 0.);
            self.write_by_name("CONTACT POINT COMPRESSION:3", 0.);
            self.write_by_name("CONTACT POINT COMPRESSION:4", 0.);
            self.write_by_name("CONTACT POINT COMPRESSION:5", 0.);

            self
        }

        fn steady_on_ground(mut self) -> Self {
            self.write_by_name("TOTAL WEIGHT", Mass::new::<kilogram>(400000.));
            self.write_by_name("CONTACT POINT COMPRESSION:1", 70.);
            self.write_by_name("CONTACT POINT COMPRESSION:2", 70.);
            self.write_by_name("CONTACT POINT COMPRESSION:3", 70.);
            self.write_by_name("CONTACT POINT COMPRESSION:4", 70.);
            self.write_by_name("CONTACT POINT COMPRESSION:5", 70.);

            self
        }

        fn left_turn_ailerons(mut self) -> Self {
            self.command(|a| a.set_right_ailerons([0.2, 0.2, 0.2]));
            self.command(|a| a.set_left_ailerons([0.8, 0.8, 0.8]));

            self
        }

        fn right_turn_ailerons(mut self) -> Self {
            self.command(|a| a.set_left_ailerons([0.2, 0.2, 0.2]));
            self.command(|a| a.set_right_ailerons([0.8, 0.8, 0.8]));

            self
        }

        fn neutral_ailerons(mut self) -> Self {
            self.command(|a| a.set_left_ailerons([0.5, 0.5, 0.5]));
            self.command(|a| a.set_right_ailerons([0.5, 0.5, 0.5]));

            self
        }

        fn spoilers_retracted(mut self) -> Self {
            self.command(|a| a.set_left_spoilers([0., 0., 0., 0., 0., 0., 0., 0.]));
            self.command(|a| a.set_right_spoilers([0., 0., 0., 0., 0., 0., 0., 0.]));

            self
        }

        fn spoilers_left_turn(mut self) -> Self {
            self.command(|a| a.set_left_spoilers([0., 0., 0., 0.5, 0.5, 0.5, 0.5, 0.5]));
            self.command(|a| a.set_right_spoilers([0., 0., 0., 0., 0., 0., 0., 0.]));

            self
        }

        fn spoilers_right_turn(mut self) -> Self {
            self.command(|a| a.set_right_spoilers([0., 0., 0., 0.5, 0.5, 0.5, 0.5, 0.5]));
            self.command(|a| a.set_left_spoilers([0., 0., 0., 0., 0., 0., 0., 0.]));

            self
        }

        fn run_waiting_for(mut self, delta: Duration) -> Self {
            self.test_bed.run_multiple_frames(delta);
            self
        }
    }
    impl TestBed for WingFlexTestBed {
        type Aircraft = WingFlexTestAircraft;

        fn test_bed(&self) -> &SimulationTestBed<WingFlexTestAircraft> {
            &self.test_bed
        }

        fn test_bed_mut(&mut self) -> &mut SimulationTestBed<WingFlexTestAircraft> {
            &mut self.test_bed
        }
    }

    #[test]
    fn fuel_mapping_tanks_1_2_left_wing() {
        let mut test_bed = SimulationTestBed::new(WingFlexTestAircraft::new);

        test_bed.run_with_delta(Duration::from_secs(1));

        let mut node0_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[0].fuel_mass);
        let mut node1_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[1].fuel_mass);
        let mut node2_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[2].fuel_mass);
        let mut node3_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[3].fuel_mass);
        let mut node4_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[4].fuel_mass);

        println!(
            "FUELMASSES empty: {:.0}/{:.0}/{:.0}/{:.0}/{:.0}",
            node0_mass.get::<kilogram>(),
            node1_mass.get::<kilogram>(),
            node2_mass.get::<kilogram>(),
            node3_mass.get::<kilogram>(),
            node4_mass.get::<kilogram>(),
        );

        assert!(
            node0_mass.get::<kilogram>()
                + node1_mass.get::<kilogram>()
                + node2_mass.get::<kilogram>()
                + node3_mass.get::<kilogram>()
                + node4_mass.get::<kilogram>()
                <= 0.1
        );

        test_bed.command(|a| a.set_fuel(A380FuelTankType::LeftInner, Mass::new::<kilogram>(3000.)));

        test_bed.run_with_delta(Duration::from_secs(1));

        node0_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[0].fuel_mass);
        node1_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[1].fuel_mass);
        node2_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[2].fuel_mass);
        node3_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[3].fuel_mass);
        node4_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[4].fuel_mass);

        println!(
            "FUELMASSES after fueling inner: {:.0}/{:.0}/{:.0}/{:.0}/{:.0}",
            node0_mass.get::<kilogram>(),
            node1_mass.get::<kilogram>(),
            node2_mass.get::<kilogram>(),
            node3_mass.get::<kilogram>(),
            node4_mass.get::<kilogram>(),
        );

        assert!(
            node0_mass.get::<kilogram>()
                + node2_mass.get::<kilogram>()
                + node3_mass.get::<kilogram>()
                + node4_mass.get::<kilogram>()
                <= 0.1
        );
        assert!(node1_mass.get::<kilogram>() >= 3000. && node1_mass.get::<kilogram>() <= 3100.);

        test_bed.command(|a| a.set_fuel(A380FuelTankType::FeedTwo, Mass::new::<kilogram>(3000.)));

        test_bed.run_with_delta(Duration::from_secs(1));

        node0_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[0].fuel_mass);
        node1_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[1].fuel_mass);
        node2_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[2].fuel_mass);
        node3_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[3].fuel_mass);
        node4_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[4].fuel_mass);

        //Second tank should map to same node

        println!(
            "FUELMASSES after fueling feed 2: {:.0}/{:.0}/{:.0}/{:.0}/{:.0}",
            node0_mass.get::<kilogram>(),
            node1_mass.get::<kilogram>(),
            node2_mass.get::<kilogram>(),
            node3_mass.get::<kilogram>(),
            node4_mass.get::<kilogram>(),
        );

        assert!(
            node0_mass.get::<kilogram>()
                + node2_mass.get::<kilogram>()
                + node3_mass.get::<kilogram>()
                + node4_mass.get::<kilogram>()
                <= 0.1
        );
        assert!(node1_mass.get::<kilogram>() >= 6000. && node1_mass.get::<kilogram>() <= 6200.);
    }

    #[test]
    fn fuel_mapping_tanks_3_4_left_wing() {
        let mut test_bed = SimulationTestBed::new(WingFlexTestAircraft::new);

        test_bed.run_with_delta(Duration::from_secs(1));

        let mut node0_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[0].fuel_mass);
        let mut node1_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[1].fuel_mass);
        let mut node2_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[2].fuel_mass);
        let mut node3_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[3].fuel_mass);
        let mut node4_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[4].fuel_mass);

        println!(
            "FUELMASSES empty: {:.0}/{:.0}/{:.0}/{:.0}/{:.0}",
            node0_mass.get::<kilogram>(),
            node1_mass.get::<kilogram>(),
            node2_mass.get::<kilogram>(),
            node3_mass.get::<kilogram>(),
            node4_mass.get::<kilogram>(),
        );

        assert!(
            node0_mass.get::<kilogram>()
                + node1_mass.get::<kilogram>()
                + node2_mass.get::<kilogram>()
                + node3_mass.get::<kilogram>()
                + node4_mass.get::<kilogram>()
                <= 0.1
        );

        test_bed.command(|a| a.set_fuel(A380FuelTankType::LeftMid, Mass::new::<kilogram>(3000.)));

        test_bed.run_with_delta(Duration::from_secs(1));

        node0_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[0].fuel_mass);
        node1_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[1].fuel_mass);
        node2_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[2].fuel_mass);
        node3_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[3].fuel_mass);
        node4_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[4].fuel_mass);

        println!(
            "FUELMASSES after fueling left mid: {:.0}/{:.0}/{:.0}/{:.0}/{:.0}",
            node0_mass.get::<kilogram>(),
            node1_mass.get::<kilogram>(),
            node2_mass.get::<kilogram>(),
            node3_mass.get::<kilogram>(),
            node4_mass.get::<kilogram>(),
        );

        assert!(
            node0_mass.get::<kilogram>()
                + node1_mass.get::<kilogram>()
                + node3_mass.get::<kilogram>()
                + node4_mass.get::<kilogram>()
                <= 0.1
        );
        assert!(node2_mass.get::<kilogram>() >= 3000. && node2_mass.get::<kilogram>() <= 3100.);

        test_bed.command(|a| a.set_fuel(A380FuelTankType::FeedOne, Mass::new::<kilogram>(3000.)));

        test_bed.run_with_delta(Duration::from_secs(1));

        node0_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[0].fuel_mass);
        node1_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[1].fuel_mass);
        node2_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[2].fuel_mass);
        node3_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[3].fuel_mass);
        node4_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[4].fuel_mass);

        //Second tank should map to same node

        println!(
            "FUELMASSES after fueling left feed 1: {:.0}/{:.0}/{:.0}/{:.0}/{:.0}",
            node0_mass.get::<kilogram>(),
            node1_mass.get::<kilogram>(),
            node2_mass.get::<kilogram>(),
            node3_mass.get::<kilogram>(),
            node4_mass.get::<kilogram>(),
        );

        assert!(
            node0_mass.get::<kilogram>()
                + node1_mass.get::<kilogram>()
                + node3_mass.get::<kilogram>()
                + node4_mass.get::<kilogram>()
                <= 0.1
        );
        assert!(node2_mass.get::<kilogram>() >= 6000. && node1_mass.get::<kilogram>() <= 6200.);
    }

    #[test]
    fn fuel_mapping_tanks_5_left_wing() {
        let mut test_bed = SimulationTestBed::new(WingFlexTestAircraft::new);

        test_bed.run_with_delta(Duration::from_secs(1));

        let mut node0_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[0].fuel_mass);
        let mut node1_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[1].fuel_mass);
        let mut node2_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[2].fuel_mass);
        let mut node3_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[3].fuel_mass);
        let mut node4_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[4].fuel_mass);

        println!(
            "FUELMASSES empty: {:.0}/{:.0}/{:.0}/{:.0}/{:.0}",
            node0_mass.get::<kilogram>(),
            node1_mass.get::<kilogram>(),
            node2_mass.get::<kilogram>(),
            node3_mass.get::<kilogram>(),
            node4_mass.get::<kilogram>(),
        );

        assert!(
            node0_mass.get::<kilogram>()
                + node1_mass.get::<kilogram>()
                + node2_mass.get::<kilogram>()
                + node3_mass.get::<kilogram>()
                + node4_mass.get::<kilogram>()
                <= 0.1
        );

        test_bed.command(|a| a.set_fuel(A380FuelTankType::LeftOuter, Mass::new::<kilogram>(3000.)));

        test_bed.run_with_delta(Duration::from_secs(1));

        node0_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[0].fuel_mass);
        node1_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[1].fuel_mass);
        node2_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[2].fuel_mass);
        node3_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[3].fuel_mass);
        node4_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[4].fuel_mass);

        println!(
            "FUELMASSES after fueling left outer: {:.0}/{:.0}/{:.0}/{:.0}/{:.0}",
            node0_mass.get::<kilogram>(),
            node1_mass.get::<kilogram>(),
            node2_mass.get::<kilogram>(),
            node3_mass.get::<kilogram>(),
            node4_mass.get::<kilogram>(),
        );

        assert!(
            node0_mass.get::<kilogram>()
                + node1_mass.get::<kilogram>()
                + node2_mass.get::<kilogram>()
                + node4_mass.get::<kilogram>()
                <= 0.1
        );
        assert!(node3_mass.get::<kilogram>() >= 3000. && node2_mass.get::<kilogram>() <= 3100.);
    }

    #[test]
    fn animation_angles_with_0_heights_gives_zero_angles() {
        let test_bed = SimulationTestBed::from(ElementCtorFn(|_| {
            WingAnimationMapper::<5>::new([0., 1., 2., 3., 4.])
        }));

        let anim_angles = test_bed.query_element(|e| e.animation_angles([0.0, 0.0, 0.0, 0., 0.]));

        assert!(anim_angles[0] == Angle::default());
        assert!(anim_angles[1] == Angle::default());
        assert!(anim_angles[2] == Angle::default());
        assert!(anim_angles[3] == Angle::default());
        assert!(anim_angles[4] == Angle::default());
    }

    #[test]
    fn animation_angles_with_last_node_moved_1_up_gives_correct_angles() {
        let test_bed = SimulationTestBed::from(ElementCtorFn(|_| {
            WingAnimationMapper::<5>::new([0., 1., 2., 3., 4.])
        }));

        let anim_angles = test_bed.query_element(|e| e.animation_angles([0.0, 0.0, 0.0, 0., 1.]));

        assert!(anim_angles[0] == Angle::default());
        assert!(anim_angles[1] == Angle::default());
        assert!(anim_angles[2] == Angle::default());
        assert!(anim_angles[3] == Angle::default());
        assert!(anim_angles[4].get::<degree>() >= 44. && anim_angles[4].get::<degree>() <= 46.);
    }

    #[test]
    fn animation_angles_with_last_node_moved_1_down_gives_correct_angles() {
        let test_bed = SimulationTestBed::from(ElementCtorFn(|_| {
            WingAnimationMapper::<5>::new([0., 1., 2., 3., 4.])
        }));

        let anim_angles = test_bed.query_element(|e| e.animation_angles([0.0, 0.0, 0.0, 0., -1.]));

        assert!(anim_angles[0] == Angle::default());
        assert!(anim_angles[1] == Angle::default());
        assert!(anim_angles[2] == Angle::default());
        assert!(anim_angles[3] == Angle::default());
        assert!(anim_angles[4].get::<degree>() >= -46. && anim_angles[4].get::<degree>() <= -44.);
    }

    #[test]
    fn animation_angles_with_first_node_moved_1_up_gives_correct_angles() {
        let test_bed = SimulationTestBed::from(ElementCtorFn(|_| {
            WingAnimationMapper::<5>::new([0., 1., 2., 3., 4.])
        }));

        let anim_angles = test_bed.query_element(|e| e.animation_angles([0., 1., 1., 1., 1.]));

        assert_about_eq!(
            anim_angles[0].get::<degree>(),
            Angle::default().get::<degree>(),
            1.0e-3
        );
        assert!(anim_angles[1].get::<degree>() >= 44. && anim_angles[0].get::<degree>() <= 46.);
        assert_about_eq!(
            anim_angles[2].get::<degree>(),
            Angle::default().get::<degree>(),
            1.0e-3
        );
        assert_about_eq!(
            anim_angles[3].get::<degree>(),
            Angle::default().get::<degree>(),
            1.0e-3
        );
        assert_about_eq!(
            anim_angles[4].get::<degree>(),
            Angle::default().get::<degree>(),
            1.0e-3
        );
    }

    #[test]
    fn animation_angles_with_first_node_moved_1_down_gives_correct_angles() {
        let test_bed = SimulationTestBed::from(ElementCtorFn(|_| {
            WingAnimationMapper::<5>::new([0., 1., 2., 3., 4.])
        }));

        let anim_angles = test_bed.query_element(|e| e.animation_angles([0., -1., -1., -1., -1.]));

        assert!(anim_angles[0] == Angle::default());
        assert!(anim_angles[1].get::<degree>() <= -44. && anim_angles[1].get::<degree>() >= -46.);
        assert_about_eq!(
            anim_angles[2].get::<degree>(),
            Angle::default().get::<degree>(),
            1.0e-3
        );
        assert_about_eq!(
            anim_angles[3].get::<degree>(),
            Angle::default().get::<degree>(),
            1.0e-3
        );
        assert_about_eq!(
            anim_angles[4].get::<degree>(),
            Angle::default().get::<degree>(),
            1.0e-3
        );
    }

    #[test]
    fn steady_on_ground() {
        let mut test_bed = WingFlexTestBed::new()
            .with_nominal_weight()
            .steady_on_ground();

        test_bed = test_bed.run_waiting_for(Duration::from_secs(3));

        assert!(test_bed.current_total_lift().get::<newton>() / 9.8 < 1000.);
        assert!(test_bed.current_total_lift().get::<newton>() / 9.8 > -1000.);
    }

    #[test]
    fn steady_on_ground_full_fuel() {
        let mut test_bed = WingFlexTestBed::new()
            .with_nominal_weight()
            .with_max_fuel()
            .steady_on_ground();

        test_bed = test_bed.run_waiting_for(Duration::from_secs(3));

        assert!(test_bed.current_total_lift().get::<newton>() / 9.8 < 1000.);
        assert!(test_bed.current_total_lift().get::<newton>() / 9.8 > -1000.);
    }

    #[test]
    fn with_some_lift_on_ground_rotation() {
        let mut test_bed = WingFlexTestBed::new()
            .with_nominal_weight()
            .rotate_for_takeoff();

        test_bed = test_bed.run_waiting_for(Duration::from_secs(1));

        assert!(
            test_bed.current_total_lift().get::<newton>() / 9.8
                < WingFlexTestBed::NOMINAL_WEIGHT_KG
        );
        assert!(
            test_bed.current_total_lift().get::<newton>() / 9.8
                > WingFlexTestBed::NOMINAL_WEIGHT_KG * 0.5
        );
    }

    #[test]
    fn in_straight_flight_has_plane_lift_equal_to_weight() {
        let mut test_bed = WingFlexTestBed::new().with_nominal_weight().in_1g_flight();

        test_bed = test_bed.run_waiting_for(Duration::from_secs(1));

        assert!(
            test_bed.current_total_lift().get::<newton>() / 9.8
                < WingFlexTestBed::NOMINAL_WEIGHT_KG * 1.1
        );
        assert!(
            test_bed.current_total_lift().get::<newton>() / 9.8
                > WingFlexTestBed::NOMINAL_WEIGHT_KG * 0.9
        );
    }

    #[test]
    fn in_straight_flight_at_max_fuel_has_plane_lift_equal_to_weight() {
        let mut test_bed = WingFlexTestBed::new().with_max_fuel().in_1g_flight();

        test_bed = test_bed.run_waiting_for(Duration::from_secs(1));

        assert!(
            test_bed.current_total_lift().get::<newton>() / 9.8
                < WingFlexTestBed::NOMINAL_WEIGHT_KG * 1.1
        );
        assert!(
            test_bed.current_total_lift().get::<newton>() / 9.8
                > WingFlexTestBed::NOMINAL_WEIGHT_KG * 0.9
        );
    }

    #[test]
    fn in_left_turn_flight_has_more_right_lift() {
        let mut test_bed = WingFlexTestBed::new()
            .with_nominal_weight()
            .in_1g_flight()
            .left_turn_ailerons()
            .spoilers_left_turn();

        test_bed = test_bed.run_waiting_for(Duration::from_secs(1));

        assert!(
            test_bed.current_left_wing_lift().get::<newton>()
                < test_bed.current_right_wing_lift().get::<newton>()
        );
    }

    #[test]
    fn in_right_turn_flight_has_more_left_lift() {
        let mut test_bed = WingFlexTestBed::new()
            .with_nominal_weight()
            .in_1g_flight()
            .right_turn_ailerons()
            .spoilers_right_turn();

        test_bed = test_bed.run_waiting_for(Duration::from_secs(1));

        assert!(
            test_bed.current_left_wing_lift().get::<newton>()
                > test_bed.current_right_wing_lift().get::<newton>()
        );
    }

    #[test]
    fn in_straight_flight_all_left_lifts_all_right_lifts_equals_total_lift() {
        let mut test_bed = WingFlexTestBed::new().with_nominal_weight().in_1g_flight();

        test_bed = test_bed.run_waiting_for(Duration::from_secs(1));

        // One percent precision check on total lift value
        assert!(
            test_bed.left_wing_lift_per_node().sum() + test_bed.right_wing_lift_per_node().sum()
                <= test_bed.current_total_lift().get::<newton>() * 1.01
        );

        assert!(
            test_bed.left_wing_lift_per_node().sum() + test_bed.right_wing_lift_per_node().sum()
                >= test_bed.current_total_lift().get::<newton>() * 0.99
        );
    }

    #[test]
    fn in_right_turn_all_left_lifts_all_right_lifts_equals_total_lift() {
        let mut test_bed = WingFlexTestBed::new()
            .with_nominal_weight()
            .in_1g_flight()
            .right_turn_ailerons()
            .spoilers_right_turn();

        test_bed = test_bed.run_waiting_for(Duration::from_secs(1));

        // One percent precision check on total lift value
        assert!(
            test_bed.left_wing_lift_per_node().sum() + test_bed.right_wing_lift_per_node().sum()
                <= test_bed.current_total_lift().get::<newton>() * 1.01
        );

        assert!(
            test_bed.left_wing_lift_per_node().sum() + test_bed.right_wing_lift_per_node().sum()
                >= test_bed.current_total_lift().get::<newton>() * 0.99
        );
    }

    #[test]
    fn in_left_turn_all_left_lifts_all_right_lifts_equals_total_lift() {
        let mut test_bed = WingFlexTestBed::new()
            .with_nominal_weight()
            .in_1g_flight()
            .left_turn_ailerons()
            .spoilers_left_turn();

        test_bed = test_bed.run_waiting_for(Duration::from_secs(1));

        // One percent precision check on total lift value
        assert!(
            test_bed.left_wing_lift_per_node().sum() + test_bed.right_wing_lift_per_node().sum()
                <= test_bed.current_total_lift().get::<newton>() * 1.01
        );

        assert!(
            test_bed.left_wing_lift_per_node().sum() + test_bed.right_wing_lift_per_node().sum()
                >= test_bed.current_total_lift().get::<newton>() * 0.99
        );
    }
}
