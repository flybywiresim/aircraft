use crate::shared::low_pass_filter::LowPassFilter;
use crate::shared::update_iterator::MaxStepLoop;

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
    mass_density::kilogram_per_cubic_meter,
    ratio::percent,
    ratio::ratio,
    velocity::{knot, meter_per_second},
};

use std::fmt;
use std::time::Duration;

use nalgebra::{Vector2, Vector5};

enum GearStrutId {
    Nose = 0,
    LeftBody = 1,
    RightBody = 2,
    LeftWing = 3,
    RightWing = 4,
}
struct LandingGearCompression {
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
impl LandingGearCompression {
    const GEAR_CENTER_COMPRESSION: &'static str = "CONTACT POINT COMPRESSION";
    const GEAR_LEFT_BODY_COMPRESSION: &'static str = "CONTACT POINT COMPRESSION:1";
    const GEAR_RIGHT_BODY_COMPRESSION: &'static str = "CONTACT POINT COMPRESSION:2";
    const GEAR_LEFT_WING_COMPRESSION: &'static str = "CONTACT POINT COMPRESSION:3";
    const GEAR_RIGHT_WING_COMPRESSION: &'static str = "CONTACT POINT COMPRESSION:4";

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

            center_compression: Ratio::new::<percent>(0.),
            left_wing_compression: Ratio::new::<percent>(0.),
            right_wing_compression: Ratio::new::<percent>(0.),
            left_body_compression: Ratio::new::<percent>(0.),
            right_body_compression: Ratio::new::<percent>(0.),
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
        match wheel_id {
            GearStrutId::Nose => Mass::new::<kilogram>(
                2.22966 * self.center_compression.get::<percent>().powf(2.2953179884),
            ),
            GearStrutId::LeftWing => {
                Mass::new::<kilogram>(5.5 * self.left_wing_compression.get::<percent>().powf(2.6))
            }
            GearStrutId::RightWing => {
                Mass::new::<kilogram>(5.5 * self.right_wing_compression.get::<percent>().powf(2.6))
            }
            GearStrutId::LeftBody => {
                Mass::new::<kilogram>(7.5 * self.left_body_compression.get::<percent>().powf(2.5))
            }
            GearStrutId::RightBody => {
                Mass::new::<kilogram>(7.5 * self.right_body_compression.get::<percent>().powf(2.5))
            }
        }
    }
}
impl SimulationElement for LandingGearCompression {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.center_compression = reader.read(&self.center_compression_id);
        self.left_wing_compression = reader.read(&self.left_body_compression_id);
        self.right_wing_compression = reader.read(&self.right_body_compression_id);
        self.left_body_compression = reader.read(&self.left_wing_compression_id);
        self.right_body_compression = reader.read(&self.right_wing_compression_id);
    }
}

struct A380WingLiftModifier {
    spoiler_left_1_position_id: VariableIdentifier,
    spoiler_left_2_position_id: VariableIdentifier,
    spoiler_left_3_position_id: VariableIdentifier,
    spoiler_left_4_position_id: VariableIdentifier,
    spoiler_left_5_position_id: VariableIdentifier,
    spoiler_left_6_position_id: VariableIdentifier,
    spoiler_left_7_position_id: VariableIdentifier,
    spoiler_left_8_position_id: VariableIdentifier,

    spoiler_right_1_position_id: VariableIdentifier,
    spoiler_right_2_position_id: VariableIdentifier,
    spoiler_right_3_position_id: VariableIdentifier,
    spoiler_right_4_position_id: VariableIdentifier,
    spoiler_right_5_position_id: VariableIdentifier,
    spoiler_right_6_position_id: VariableIdentifier,
    spoiler_right_7_position_id: VariableIdentifier,
    spoiler_right_8_position_id: VariableIdentifier,

    aileron_left_1_position_id: VariableIdentifier,
    aileron_left_2_position_id: VariableIdentifier,
    aileron_left_3_position_id: VariableIdentifier,

    aileron_right_1_position_id: VariableIdentifier,
    aileron_right_2_position_id: VariableIdentifier,
    aileron_right_3_position_id: VariableIdentifier,

    flaps_left_position_id: VariableIdentifier,
    flaps_right_position_id: VariableIdentifier,

    lateral_offset: Ratio,

    spoilers_left_position: [f64; 8],
    spoilers_right_position: [f64; 8],

    ailerons_left_position: [f64; 3],
    ailerons_right_position: [f64; 3],

    left_flaps_position: Ratio,
    right_flaps_position: Ratio,

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

    fn new(context: &mut InitContext) -> Self {
        assert!(Vector5::from(Self::NOMINAL_WING_LIFT_SPREAD_RATIOS).sum() == 1.);

        Self {
            spoiler_left_1_position_id: context
                .get_identifier("HYD_SPOILER_1_LEFT_DEFLECTION".to_owned()),
            spoiler_left_2_position_id: context
                .get_identifier("HYD_SPOILER_2_LEFT_DEFLECTION".to_owned()),
            spoiler_left_3_position_id: context
                .get_identifier("HYD_SPOILER_3_LEFT_DEFLECTION".to_owned()),
            spoiler_left_4_position_id: context
                .get_identifier("HYD_SPOILER_4_LEFT_DEFLECTION".to_owned()),
            spoiler_left_5_position_id: context
                .get_identifier("HYD_SPOILER_5_LEFT_DEFLECTION".to_owned()),
            spoiler_left_6_position_id: context
                .get_identifier("HYD_SPOILER_6_LEFT_DEFLECTION".to_owned()),
            spoiler_left_7_position_id: context
                .get_identifier("HYD_SPOILER_7_LEFT_DEFLECTION".to_owned()),
            spoiler_left_8_position_id: context
                .get_identifier("HYD_SPOILER_8_LEFT_DEFLECTION".to_owned()),

            spoiler_right_1_position_id: context
                .get_identifier("HYD_SPOILER_1_RIGHT_DEFLECTION".to_owned()),
            spoiler_right_2_position_id: context
                .get_identifier("HYD_SPOILER_2_RIGHT_DEFLECTION".to_owned()),
            spoiler_right_3_position_id: context
                .get_identifier("HYD_SPOILER_3_RIGHT_DEFLECTION".to_owned()),
            spoiler_right_4_position_id: context
                .get_identifier("HYD_SPOILER_4_RIGHT_DEFLECTION".to_owned()),
            spoiler_right_5_position_id: context
                .get_identifier("HYD_SPOILER_5_RIGHT_DEFLECTION".to_owned()),
            spoiler_right_6_position_id: context
                .get_identifier("HYD_SPOILER_6_RIGHT_DEFLECTION".to_owned()),
            spoiler_right_7_position_id: context
                .get_identifier("HYD_SPOILER_7_RIGHT_DEFLECTION".to_owned()),
            spoiler_right_8_position_id: context
                .get_identifier("HYD_SPOILER_8_RIGHT_DEFLECTION".to_owned()),

            aileron_left_1_position_id: context
                .get_identifier("HYD_AIL_LEFT_INWARD_DEFLECTION".to_owned()),
            aileron_left_2_position_id: context
                .get_identifier("HYD_AIL_LEFT_MIDDLE_DEFLECTION".to_owned()),
            aileron_left_3_position_id: context
                .get_identifier("HYD_AIL_LEFT_OUTWARD_DEFLECTION".to_owned()),

            aileron_right_1_position_id: context
                .get_identifier("HYD_AIL_RIGHT_INWARD_DEFLECTION".to_owned()),
            aileron_right_2_position_id: context
                .get_identifier("HYD_AIL_RIGHT_MIDDLE_DEFLECTION".to_owned()),
            aileron_right_3_position_id: context
                .get_identifier("HYD_AIL_RIGHT_OUTWARD_DEFLECTION".to_owned()),

            flaps_left_position_id: context
                .get_identifier("LEFT_FLAPS_POSITION_PERCENT".to_owned()),
            flaps_right_position_id: context
                .get_identifier("RIGHT_FLAPS_POSITION_PERCENT".to_owned()),
            lateral_offset: Ratio::default(),

            spoilers_left_position: [0.; 8],
            spoilers_right_position: [0.; 8],

            ailerons_left_position: [0.5; 3],
            ailerons_right_position: [0.5; 3],

            left_flaps_position: Ratio::default(),
            right_flaps_position: Ratio::default(),

            left_wing_lift: Force::default(),
            right_wing_lift: Force::default(),

            standard_lift_spread: Vector5::from(Self::NOMINAL_WING_LIFT_SPREAD_RATIOS),
            lift_left_table_newton: Vector5::default(),
            lift_right_table_newton: Vector5::default(),
        }
    }

    fn update(&mut self, total_lift: Force) {
        self.compute_lift_modifiers(total_lift);
    }

    fn compute_lift_modifiers(&mut self, total_lift: Force) {
        let wing_base_left_spoilers =
            (self.spoilers_left_position[0] + self.spoilers_left_position[1]) / 2.;
        let wing_mid_left_spoilers = (self.spoilers_left_position[2]
            + self.spoilers_left_position[3]
            + self.spoilers_left_position[4]
            + self.spoilers_left_position[5]
            + self.spoilers_left_position[6]
            + self.spoilers_left_position[7])
            / 6.;

        let wing_base_right_spoilers =
            (self.spoilers_right_position[0] + self.spoilers_right_position[1]) / 2.;
        let wing_mid_right_spoilers = (self.spoilers_right_position[2]
            + self.spoilers_right_position[3]
            + self.spoilers_right_position[4]
            + self.spoilers_right_position[5]
            + self.spoilers_right_position[6]
            + self.spoilers_right_position[7])
            / 6.;

        let left_ailerons_mid = ((self.ailerons_left_position[0] - 0.5) * 2.
            + (self.ailerons_left_position[1] - 0.5) * 2.)
            / 2.;
        let right_ailerons_mid = ((self.ailerons_right_position[0] - 0.5) * 2.
            + (self.ailerons_right_position[1] - 0.5) * 2.)
            / 2.;

        let left_ailerons_tip = (self.ailerons_left_position[2] - 0.5) * 2.;
        let right_ailerons_tip = (self.ailerons_right_position[2] - 0.5) * 2.;

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

        let left_flap_lift_factor = self.left_flaps_position.get::<ratio>();
        let right_flap_lift_factor = self.right_flaps_position.get::<ratio>();

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

        println!(
            "LEFT/RIGHT WING LIFT SPREAD PERCENT {:.2}_{:.2}_{:.2}_{:.2}/O\\{:.2}_{:.2}_{:.2}_{:.2}",
            left_lift_factor_normalized[4],
            left_lift_factor_normalized[3],
            left_lift_factor_normalized[2],
            left_lift_factor_normalized[1],
            right_lift_factor_normalized[1],
            right_lift_factor_normalized[2],
            right_lift_factor_normalized[3],
            right_lift_factor_normalized[4],
        );
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
impl SimulationElement for A380WingLiftModifier {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.spoilers_left_position = [
            reader.read(&self.spoiler_left_1_position_id),
            reader.read(&self.spoiler_left_2_position_id),
            reader.read(&self.spoiler_left_3_position_id),
            reader.read(&self.spoiler_left_4_position_id),
            reader.read(&self.spoiler_left_5_position_id),
            reader.read(&self.spoiler_left_6_position_id),
            reader.read(&self.spoiler_left_7_position_id),
            reader.read(&self.spoiler_left_8_position_id),
        ];

        self.spoilers_right_position = [
            reader.read(&self.spoiler_right_1_position_id),
            reader.read(&self.spoiler_right_2_position_id),
            reader.read(&self.spoiler_right_3_position_id),
            reader.read(&self.spoiler_right_4_position_id),
            reader.read(&self.spoiler_right_5_position_id),
            reader.read(&self.spoiler_right_6_position_id),
            reader.read(&self.spoiler_right_7_position_id),
            reader.read(&self.spoiler_right_8_position_id),
        ];

        self.ailerons_left_position = [
            reader.read(&self.aileron_left_1_position_id),
            reader.read(&self.aileron_left_2_position_id),
            reader.read(&self.aileron_left_3_position_id),
        ];

        self.ailerons_right_position = [
            reader.read(&self.aileron_right_1_position_id),
            reader.read(&self.aileron_right_2_position_id),
            reader.read(&self.aileron_right_3_position_id),
        ];

        self.left_flaps_position = reader.read(&self.flaps_left_position_id);
        self.right_flaps_position = reader.read(&self.flaps_right_position_id);
    }
}

// Computes a global lift force from anything we can use from the sim
struct WingLift {
    gear_weight_on_wheels: LandingGearCompression,

    total_lift: Force,
}
impl WingLift {
    fn new(context: &mut InitContext) -> Self {
        Self {
            gear_weight_on_wheels: LandingGearCompression::new(context),
            total_lift: Force::default(),
        }
    }

    fn update(&mut self, context: &UpdateContext) {
        let total_weight_on_wheels = self.gear_weight_on_wheels.total_weight_on_wheels();

        //let accel_y = context.acceleration_plane_reference_unfiltered_ms2_vector()[1];
        let raw_accel_no_grav = context.vert_accel().get::<meter_per_second_squared>();
        let cur_weight_kg = context.total_weight().get::<kilogram>();

        let lift_delta_from_accel_n = raw_accel_no_grav * cur_weight_kg;
        let lift_1g = 9.8 * cur_weight_kg;
        let lift_wow = -9.8 * total_weight_on_wheels.get::<kilogram>();

        let lift = if total_weight_on_wheels.get::<kilogram>() > 500. {
            // Assuming no lift at low wind speed avoids glitches with ground when braking hard for a full stop
            if context.true_airspeed().get::<knot>().abs() < 35. {
                // println!(
                //     "-------GROUNDMODE LOW SPEED/AOA PLANE Weight:{:.1}Tons => lift1G={:.0}tons lift_wow={:.0}tons FINAL{:.0}",
                //     cur_weight_kg / 1000.,
                //     lift_1g /9.8 / 1000.,
                //     lift_wow/9.8 / 1000.,
                //     0.,
                // );
                0.
            } else {
                // println!(
                //     "++++++GROUNDMODE PLANE Weight:{:.1}Tons => lift1G={:.0}tons lift_wow={:.0}tons FINAL{:.0} ",
                //     cur_weight_kg / 1000.,
                //     lift_1g /9.8 / 1000.,
                //     lift_wow/9.8 / 1000.,
                //     ((lift_1g + lift_wow) /9.8 / 1000.).max(0.),

                // );
                //println!("LIFT FROM WOOOOOW MODE");
                (lift_1g + lift_wow).max(0.)
            }
        } else {
            // println!(
            //     "FLIGHTMODE PLANE Weight:{:.1}Tons AccelY {:.2} => lift1G={:.0}tons liftDelta={:.0}tons FINAL{:.0}",
            //     cur_weight_kg / 1000.,
            //     accel_y,
            //     lift_1g /9.8 / 1000.,
            //     lift_delta_from_accel_n/9.8 / 1000.,
            //     (lift_1g + lift_delta_from_accel_n) /9.8 / 1000.
            // );
            // println!("FLIGHT  LIFT MODE");
            lift_1g + lift_delta_from_accel_n
        };

        self.total_lift = Force::new::<newton>(lift);
    }

    fn total_plane_lift(&self) -> Force {
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

enum A380fuelTanks {
    LeftInner,
    LeftFeed2,
    LeftMid,
    LeftFeed1,
    LeftOutter,
    RightInner,
    RightFeed3,
    RightMid,
    RightFeed4,
    RightOutter,
}
impl fmt::Display for A380fuelTanks {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            A380fuelTanks::LeftInner => write!(f, "FUELSYSTEM TANK QUANTITY:4"),
            A380fuelTanks::LeftFeed2 => write!(f, "FUELSYSTEM TANK QUANTITY:5"),
            A380fuelTanks::LeftMid => write!(f, "FUELSYSTEM TANK QUANTITY:3"),
            A380fuelTanks::LeftFeed1 => write!(f, "FUELSYSTEM TANK QUANTITY:2"),
            A380fuelTanks::LeftOutter => write!(f, "FUELSYSTEM TANK QUANTITY:1"),
            A380fuelTanks::RightInner => write!(f, "FUELSYSTEM TANK QUANTITY:7"),
            A380fuelTanks::RightFeed3 => write!(f, "FUELSYSTEM TANK QUANTITY:6"),
            A380fuelTanks::RightMid => write!(f, "FUELSYSTEM TANK QUANTITY:8"),
            A380fuelTanks::RightFeed4 => write!(f, "FUELSYSTEM TANK QUANTITY:9"),
            A380fuelTanks::RightOutter => write!(f, "FUELSYSTEM TANK QUANTITY:10"),
        }
    }
}

struct WingMassA380 {
    left_tank_1_id: VariableIdentifier,
    left_tank_2_id: VariableIdentifier,
    left_tank_3_id: VariableIdentifier,
    left_tank_4_id: VariableIdentifier,
    left_tank_5_id: VariableIdentifier,

    right_tank_1_id: VariableIdentifier,
    right_tank_2_id: VariableIdentifier,
    right_tank_3_id: VariableIdentifier,
    right_tank_4_id: VariableIdentifier,
    right_tank_5_id: VariableIdentifier,

    left_tank_volumes: [Volume; 5],
    right_tank_volumes: [Volume; 5],

    left_fuel_mass: Mass,
    right_fuel_mass: Mass,
}
impl WingMassA380 {
    const FUEL_MASS_DENSITY_KG_M3: f64 = 800.;

    fn new(context: &mut InitContext) -> Self {
        Self {
            left_tank_1_id: context.get_identifier(A380fuelTanks::LeftInner.to_string()),
            left_tank_2_id: context.get_identifier(A380fuelTanks::LeftFeed2.to_string()),
            left_tank_3_id: context.get_identifier(A380fuelTanks::LeftMid.to_string()),
            left_tank_4_id: context.get_identifier(A380fuelTanks::LeftFeed1.to_string()),
            left_tank_5_id: context.get_identifier(A380fuelTanks::LeftOutter.to_string()),

            right_tank_1_id: context.get_identifier(A380fuelTanks::RightInner.to_string()),
            right_tank_2_id: context.get_identifier(A380fuelTanks::RightFeed3.to_string()),
            right_tank_3_id: context.get_identifier(A380fuelTanks::RightMid.to_string()),
            right_tank_4_id: context.get_identifier(A380fuelTanks::RightFeed4.to_string()),
            right_tank_5_id: context.get_identifier(A380fuelTanks::RightOutter.to_string()),

            left_tank_volumes: [Volume::default(); 5],
            right_tank_volumes: [Volume::default(); 5],

            left_fuel_mass: Mass::new::<kilogram>(0.),
            right_fuel_mass: Mass::new::<kilogram>(0.),
        }
    }

    fn left_tanks_masses(&self) -> [Mass; 5] {
        let mut masses = [Mass::default(); 5];

        for (idx, mass) in masses.iter_mut().enumerate() {
            *mass = self.left_tank_volumes[idx]
                * MassDensity::new::<kilogram_per_cubic_meter>(Self::FUEL_MASS_DENSITY_KG_M3);
        }

        masses
    }

    fn right_tanks_masses(&self) -> [Mass; 5] {
        let mut masses = [Mass::default(); 5];

        for (idx, mass) in masses.iter_mut().enumerate() {
            *mass = self.right_tank_volumes[idx]
                * MassDensity::new::<kilogram_per_cubic_meter>(Self::FUEL_MASS_DENSITY_KG_M3);
        }

        masses
    }
}
impl SimulationElement for WingMassA380 {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.left_tank_volumes[0] = reader.read(&self.left_tank_1_id);
        self.left_tank_volumes[1] = reader.read(&self.left_tank_2_id);
        self.left_tank_volumes[2] = reader.read(&self.left_tank_3_id);
        self.left_tank_volumes[3] = reader.read(&self.left_tank_4_id);
        self.left_tank_volumes[4] = reader.read(&self.left_tank_5_id);

        self.right_tank_volumes[0] = reader.read(&self.right_tank_1_id);
        self.right_tank_volumes[1] = reader.read(&self.right_tank_2_id);
        self.right_tank_volumes[2] = reader.read(&self.right_tank_3_id);
        self.right_tank_volumes[3] = reader.read(&self.right_tank_4_id);
        self.right_tank_volumes[4] = reader.read(&self.right_tank_5_id);

        self.left_fuel_mass = MassDensity::new::<kilogram_per_cubic_meter>(800.)
            * (self.left_tank_volumes[0]
                + self.left_tank_volumes[1]
                + self.left_tank_volumes[2]
                + self.left_tank_volumes[3]
                + self.left_tank_volumes[4]);

        self.right_fuel_mass = MassDensity::new::<kilogram_per_cubic_meter>(800.)
            * (self.right_tank_volumes[0]
                + self.right_tank_volumes[1]
                + self.right_tank_volumes[2]
                + self.right_tank_volumes[3]
                + self.right_tank_volumes[4]);

        // println!(
        //     "left tank mass{:.1} right tank mass{:.1}",
        //     self.left_fuel_mass.get::<kilogram>(),
        //     self.right_fuel_mass.get::<kilogram>()
        // );
    }
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
    wing_mass: WingMassA380,

    fuel_mapper: WingFuelNodeMapper<5, WING_FLEX_NODE_NUMBER>,
    animation_mapper: WingAnimationMapper<WING_FLEX_NODE_NUMBER>,

    flex_physics: [FlexPhysicsNG<WING_FLEX_NODE_NUMBER, WING_FLEX_LINK_NUMBER>; 2],
}
impl WingFlexA380 {
    const FLEX_COEFFICIENTS: [f64; WING_FLEX_LINK_NUMBER] =
        [22000000., 7000000., 3500000., 600000.];
    const DAMPING_COEFFICIENTS: [f64; WING_FLEX_LINK_NUMBER] = [800000., 300000., 120000., 9000.];

    const EMPTY_MASS_KG: [f64; WING_FLEX_NODE_NUMBER] = [0., 25000., 20000., 5000., 400.];

    const FUEL_MAPPING: [usize; FUEL_TANKS_NUMBER] = [1, 1, 2, 2, 3];

    const WING_NODES_X_COORDINATES: [f64; WING_FLEX_NODE_NUMBER] = [0., 11.5, 22.05, 29., 36.85];

    pub fn new(context: &mut InitContext) -> Self {
        let empty_mass = [
            Mass::new::<kilogram>(Self::EMPTY_MASS_KG[0]),
            Mass::new::<kilogram>(Self::EMPTY_MASS_KG[1]),
            Mass::new::<kilogram>(Self::EMPTY_MASS_KG[2]),
            Mass::new::<kilogram>(Self::EMPTY_MASS_KG[3]),
            Mass::new::<kilogram>(Self::EMPTY_MASS_KG[4]),
        ];

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
            wing_lift_dynamic: A380WingLiftModifier::new(context),
            wing_mass: WingMassA380::new(context),

            fuel_mapper: WingFuelNodeMapper::new(Self::FUEL_MAPPING),
            animation_mapper: WingAnimationMapper::new(Self::WING_NODES_X_COORDINATES),

            flex_physics: [
                FlexPhysicsNG::new(
                    context,
                    empty_mass,
                    Self::FLEX_COEFFICIENTS,
                    Self::DAMPING_COEFFICIENTS,
                ),
                FlexPhysicsNG::new(
                    context,
                    empty_mass,
                    Self::FLEX_COEFFICIENTS,
                    Self::DAMPING_COEFFICIENTS,
                ),
            ],
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        self.wing_lift.update(context);
        self.wing_lift_dynamic
            .update(self.wing_lift.total_plane_lift());

        //let standard_lift_spread = Vector5::new(0., 0.42, 0.31, 0.22, 0.05);

        // let lift_left_table_newton =
        //     standard_lift_spread * self.wing_lift_dynamic.left_wing_lift.get::<newton>();

        // let lift_right_table_newton =
        //     standard_lift_spread * self.wing_lift_dynamic.right_wing_lift.get::<newton>();

        // println!(
        //     "LIFT SPREAD {:.0}/{:.0}/{:.0}/{:.0}/{:.0}  {:.0}\\{:.0}\\{:.0}\\{:.0}\\{:.0}",
        //     lift_left_table_newton.a,
        //     lift_left_table_newton.w,
        //     lift_left_table_newton.z,
        //     lift_left_table_newton.y,
        //     lift_left_table_newton.x,
        //     lift_right_table_newton.x,
        //     lift_right_table_newton.y,
        //     lift_right_table_newton.z,
        //     lift_right_table_newton.w,
        //     lift_right_table_newton.a
        // );

        self.flex_physics[0].update(
            context,
            self.wing_lift_dynamic
                .per_node_lift_left_wing_newton()
                .as_slice(),
            self.fuel_mapper
                .fuel_masses(self.wing_mass.left_tanks_masses()),
            true,
        );

        self.flex_physics[1].update(
            context,
            self.wing_lift_dynamic
                .per_node_lift_right_wing_newton()
                .as_slice(),
            self.fuel_mapper
                .fuel_masses(self.wing_mass.right_tanks_masses()),
            false,
        );

        // println!(
        //     "WING HEIGHTS {:.2}_{:.2}_{:.2}_{:.2}_{:.2}/O\\{:.2}_{:.2}_{:.2}_{:.2}_{:.2}",
        //     self.flex_physics[0].nodes[4].position().get::<meter>(),
        //     self.flex_physics[0].nodes[3].position().get::<meter>(),
        //     self.flex_physics[0].nodes[2].position().get::<meter>(),
        //     self.flex_physics[0].nodes[1].position().get::<meter>(),
        //     self.flex_physics[0].nodes[0].position().get::<meter>(),
        //     self.flex_physics[1].nodes[0].position().get::<meter>(),
        //     self.flex_physics[1].nodes[1].position().get::<meter>(),
        //     self.flex_physics[1].nodes[2].position().get::<meter>(),
        //     self.flex_physics[1].nodes[3].position().get::<meter>(),
        //     self.flex_physics[1].nodes[4].position().get::<meter>(),
        // );
    }
}
impl SimulationElement for WingFlexA380 {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.wing_lift.accept(visitor);
        self.wing_lift_dynamic.accept(visitor);
        self.wing_mass.accept(visitor);

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

        println!(
            "LEFT WING ANIM ANGLES FROM FRONT {:.2}_{:.2}_{:.2}_{:.2}",
            bones_angles_left[1].get::<uom::si::angle::degree>(),
            bones_angles_left[2].get::<uom::si::angle::degree>(),
            bones_angles_left[3].get::<uom::si::angle::degree>(),
            bones_angles_left[4].get::<uom::si::angle::degree>(),
        );
    }
}

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
        nodes: &mut [WingSectionNode], // node1: &WingSectionNode,
                                       // node2: &WingSectionNode,
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
        } else {
            if self.is_linear {
                Force::new::<newton>(length.get::<meter>() * self.springiness)
            } else {
                Force::new::<newton>(
                    length.get::<meter>().exp() * self.springiness - self.springiness,
                )
            }
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

struct WingSectionNode {
    empty_mass: Mass,
    fuel_mass: Mass,
    speed: Velocity,
    position: Length,

    sum_of_forces: Force,
}
impl WingSectionNode {
    fn new(empty_mass: Mass) -> Self {
        Self {
            empty_mass,
            fuel_mass: Mass::default(),
            speed: Velocity::default(),
            position: Length::default(),
            sum_of_forces: Force::default(),
        }
    }

    fn update(&mut self, context: &UpdateContext) {
        self.apply_gravity_force(context);
        self.solve_physics(context);
    }

    fn apply_gravity_force(&mut self, context: &UpdateContext) {
        self.sum_of_forces += Force::new::<newton>(
            context.acceleration_plane_reference_unfiltered_ms2_vector()[1]
                * self.total_mass().get::<kilogram>(),
        );
    }

    fn solve_physics(&mut self, context: &UpdateContext) {
        if self.empty_mass.get::<kilogram>() > 0. {
            let acceleration = self.sum_of_forces / self.total_mass();

            self.speed += acceleration * context.delta_as_time();

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

    fn position(&self) -> Length {
        self.position
    }

    fn set_fuel_mass(&mut self, fuel_mass: Mass) {
        self.fuel_mass = fuel_mass;
    }
}

struct FlexPhysicsNG<const NODE_NUMBER: usize, const LINK_NUMBER: usize> {
    updater_max_step: MaxStepLoop,
    dev_updater_max_step: MaxStepLoop,

    nodes: [WingSectionNode; NODE_NUMBER],
    flex_constraints: [FlexibleConstraint; LINK_NUMBER],

    // DEV
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
}
impl<const NODE_NUMBER: usize, const LINK_NUMBER: usize> FlexPhysicsNG<NODE_NUMBER, LINK_NUMBER> {
    const MIN_PHYSICS_SOLVER_TIME_STEP: Duration = Duration::from_millis(10);

    fn new(
        context: &mut InitContext,
        empty_mass: [Mass; NODE_NUMBER],
        springness: [f64; LINK_NUMBER],
        damping: [f64; LINK_NUMBER],
    ) -> Self {
        let mut nodes_array = vec![];

        for mass in empty_mass.iter().take(NODE_NUMBER) {
            nodes_array.push(WingSectionNode::new(*mass));
        }

        let mut links_array = vec![];
        for idx in 0..LINK_NUMBER {
            links_array.push(FlexibleConstraint::new(
                springness[idx],
                damping[idx],
                false,
                Some(1.4),
            ));
        }

        Self {
            updater_max_step: MaxStepLoop::new(Self::MIN_PHYSICS_SOLVER_TIME_STEP),
            dev_updater_max_step: MaxStepLoop::new(Duration::from_millis(5)),

            nodes: nodes_array
                .try_into()
                .unwrap_or_else(|v: Vec<WingSectionNode>| {
                    panic!(
                        "Expected a Vec of length {} but it was {}",
                        NODE_NUMBER,
                        v.len()
                    )
                }),
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
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        lift_forces: &[f64],
        fuel_masses: [Mass; NODE_NUMBER],
        is_left: bool,
    ) {
        self.updater_max_step.update(context);
        self.dev_updater_max_step.update(context);

        for cur_time_step in if is_left {
            &mut self.dev_updater_max_step
        } else {
            &mut self.updater_max_step
        } {
            for idx in 0..LINK_NUMBER {
                self.nodes[idx].set_fuel_mass(fuel_masses[idx]);
                self.nodes[idx].apply_force(Force::new::<newton>(lift_forces[idx]));
                self.nodes[idx].update(&context.with_delta(cur_time_step));
                self.flex_constraints[idx].update(
                    &context.with_delta(cur_time_step),
                    &mut self.nodes[idx..=idx + 1],
                );
            }
            self.nodes[NODE_NUMBER - 1].set_fuel_mass(fuel_masses[NODE_NUMBER - 1]);
            self.nodes[NODE_NUMBER - 1]
                .apply_force(Force::new::<newton>(lift_forces[NODE_NUMBER - 1]));
            self.nodes[NODE_NUMBER - 1].update(&context.with_delta(cur_time_step));
        }
    }

    fn nodes_height_meters(&self) -> [f64; NODE_NUMBER] {
        let mut all_heights_meters = [0.; NODE_NUMBER];

        for (idx, height) in all_heights_meters
            .iter_mut()
            .enumerate()
            .take(NODE_NUMBER)
            .skip(1)
        {
            *height = self.nodes[idx].position().get::<meter>();
        }
        all_heights_meters
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

        // println!(
        //     "ANGLES {:.5}/{:.5}/{:.5}/{:.5}/{:.5}",
        //     animation_angles[0].get::<degree>(),
        //     animation_angles[1].get::<degree>(),
        //     animation_angles[2].get::<degree>(),
        //     animation_angles[3].get::<degree>(),
        //     animation_angles[4].get::<degree>()
        // );
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

    use uom::si::volume::liter;
    use uom::si::{angle::degree, length::meter, velocity::knot};

    use ntest::assert_about_eq;

    struct WingFlexTestAircraft {
        wing_flex: WingFlexA380,
    }
    impl WingFlexTestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                wing_flex: WingFlexA380::new(context),
            }
        }
    }
    impl Aircraft for WingFlexTestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.wing_flex.update(context);

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

        // fn rotate_body(&mut self, angle: Angle) {
        //     self.command(|a| a.rotate_body(angle));
        // }

        // fn trim_body(&mut self, angle: Angle) {
        //     self.command(|a| a.trim_body(angle));
        // }

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
            self.write_by_name(
                A380fuelTanks::LeftInner.to_string().as_str(),
                Volume::new::<liter>(40000.),
            );
            self.write_by_name(
                A380fuelTanks::LeftFeed2.to_string().as_str(),
                Volume::new::<liter>(25000.),
            );
            self.write_by_name(
                A380fuelTanks::LeftMid.to_string().as_str(),
                Volume::new::<liter>(35000.),
            );
            self.write_by_name(
                A380fuelTanks::LeftFeed1.to_string().as_str(),
                Volume::new::<liter>(25000.),
            );
            self.write_by_name(
                A380fuelTanks::LeftOutter.to_string().as_str(),
                Volume::new::<liter>(9000.),
            );

            self.write_by_name(
                A380fuelTanks::RightInner.to_string().as_str(),
                Volume::new::<liter>(40000.),
            );
            self.write_by_name(
                A380fuelTanks::RightFeed3.to_string().as_str(),
                Volume::new::<liter>(25000.),
            );
            self.write_by_name(
                A380fuelTanks::RightMid.to_string().as_str(),
                Volume::new::<liter>(35000.),
            );
            self.write_by_name(
                A380fuelTanks::RightFeed4.to_string().as_str(),
                Volume::new::<liter>(25000.),
            );
            self.write_by_name(
                A380fuelTanks::RightOutter.to_string().as_str(),
                Volume::new::<liter>(9000.),
            );

            self.write_by_name(
                "TOTAL WEIGHT",
                Mass::new::<kilogram>(Self::NOMINAL_WEIGHT_KG + 215000.),
            );

            self
        }

        fn rotate_for_takeoff(mut self) -> Self {
            self.write_by_name("TOTAL WEIGHT", Mass::new::<kilogram>(400000.));
            self.write_by_name("AIRSPEED TRUE", Velocity::new::<knot>(150.));

            self.write_by_name("CONTACT POINT COMPRESSION:1", 30.);
            self.write_by_name("CONTACT POINT COMPRESSION:2", 30.);

            self.write_by_name("LEFT_FLAPS_POSITION_PERCENT", 50.);
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
            self.write_by_name("HYD_AIL_LEFT_INWARD_DEFLECTION", 0.8);
            self.write_by_name("HYD_AIL_LEFT_MIDDLE_DEFLECTION", 0.8);
            self.write_by_name("HYD_AIL_LEFT_OUTWARD_DEFLECTION", 0.8);

            self.write_by_name("HYD_AIL_RIGHT_INWARD_DEFLECTION", 0.2);
            self.write_by_name("HYD_AIL_RIGHT_MIDDLE_DEFLECTION", 0.2);
            self.write_by_name("HYD_AIL_RIGHT_OUTWARD_DEFLECTION", 0.2);

            self
        }

        fn right_turn_ailerons(mut self) -> Self {
            self.write_by_name("HYD_AIL_LEFT_INWARD_DEFLECTION", 0.2);
            self.write_by_name("HYD_AIL_LEFT_MIDDLE_DEFLECTION", 0.2);
            self.write_by_name("HYD_AIL_LEFT_OUTWARD_DEFLECTION", 0.2);

            self.write_by_name("HYD_AIL_RIGHT_INWARD_DEFLECTION", 0.8);
            self.write_by_name("HYD_AIL_RIGHT_MIDDLE_DEFLECTION", 0.8);
            self.write_by_name("HYD_AIL_RIGHT_OUTWARD_DEFLECTION", 0.8);

            self
        }

        fn neutral_ailerons(mut self) -> Self {
            self.write_by_name("HYD_AIL_LEFT_INWARD_DEFLECTION", 0.5);
            self.write_by_name("HYD_AIL_LEFT_MIDDLE_DEFLECTION", 0.5);
            self.write_by_name("HYD_AIL_LEFT_OUTWARD_DEFLECTION", 0.5);

            self.write_by_name("HYD_AIL_RIGHT_INWARD_DEFLECTION", 0.5);
            self.write_by_name("HYD_AIL_RIGHT_MIDDLE_DEFLECTION", 0.5);
            self.write_by_name("HYD_AIL_RIGHT_OUTWARD_DEFLECTION", 0.5);

            self
        }

        fn spoilers_retracted(mut self) -> Self {
            self.write_by_name("HYD_SPOILER_1_RIGHT_DEFLECTION", 0.);
            self.write_by_name("HYD_SPOILER_2_RIGHT_DEFLECTION", 0.);
            self.write_by_name("HYD_SPOILER_3_RIGHT_DEFLECTION", 0.);
            self.write_by_name("HYD_SPOILER_4_RIGHT_DEFLECTION", 0.);
            self.write_by_name("HYD_SPOILER_5_RIGHT_DEFLECTION", 0.);
            self.write_by_name("HYD_SPOILER_6_RIGHT_DEFLECTION", 0.);
            self.write_by_name("HYD_SPOILER_7_RIGHT_DEFLECTION", 0.);
            self.write_by_name("HYD_SPOILER_8_RIGHT_DEFLECTION", 0.);

            self.write_by_name("HYD_SPOILER_1_LEFT_DEFLECTION", 0.);
            self.write_by_name("HYD_SPOILER_2_LEFT_DEFLECTION", 0.);
            self.write_by_name("HYD_SPOILER_3_LEFT_DEFLECTION", 0.);
            self.write_by_name("HYD_SPOILER_4_LEFT_DEFLECTION", 0.);
            self.write_by_name("HYD_SPOILER_5_LEFT_DEFLECTION", 0.);
            self.write_by_name("HYD_SPOILER_6_LEFT_DEFLECTION", 0.);
            self.write_by_name("HYD_SPOILER_7_LEFT_DEFLECTION", 0.);
            self.write_by_name("HYD_SPOILER_8_LEFT_DEFLECTION", 0.);

            self
        }

        fn spoilers_left_turn(mut self) -> Self {
            self.write_by_name("HYD_SPOILER_1_RIGHT_DEFLECTION", 0.);
            self.write_by_name("HYD_SPOILER_2_RIGHT_DEFLECTION", 0.);
            self.write_by_name("HYD_SPOILER_3_RIGHT_DEFLECTION", 0.);
            self.write_by_name("HYD_SPOILER_4_RIGHT_DEFLECTION", 0.);
            self.write_by_name("HYD_SPOILER_5_RIGHT_DEFLECTION", 0.);
            self.write_by_name("HYD_SPOILER_6_RIGHT_DEFLECTION", 0.);
            self.write_by_name("HYD_SPOILER_7_RIGHT_DEFLECTION", 0.);
            self.write_by_name("HYD_SPOILER_8_RIGHT_DEFLECTION", 0.);

            self.write_by_name("HYD_SPOILER_1_LEFT_DEFLECTION", 0.);
            self.write_by_name("HYD_SPOILER_2_LEFT_DEFLECTION", 0.);
            self.write_by_name("HYD_SPOILER_3_LEFT_DEFLECTION", 0.);
            self.write_by_name("HYD_SPOILER_4_LEFT_DEFLECTION", 0.5);
            self.write_by_name("HYD_SPOILER_5_LEFT_DEFLECTION", 0.5);
            self.write_by_name("HYD_SPOILER_6_LEFT_DEFLECTION", 0.5);
            self.write_by_name("HYD_SPOILER_7_LEFT_DEFLECTION", 0.5);
            self.write_by_name("HYD_SPOILER_8_LEFT_DEFLECTION", 0.5);

            self
        }

        fn spoilers_right_turn(mut self) -> Self {
            self.write_by_name("HYD_SPOILER_1_RIGHT_DEFLECTION", 0.);
            self.write_by_name("HYD_SPOILER_2_RIGHT_DEFLECTION", 0.);
            self.write_by_name("HYD_SPOILER_3_RIGHT_DEFLECTION", 0.);
            self.write_by_name("HYD_SPOILER_4_RIGHT_DEFLECTION", 0.5);
            self.write_by_name("HYD_SPOILER_5_RIGHT_DEFLECTION", 0.5);
            self.write_by_name("HYD_SPOILER_6_RIGHT_DEFLECTION", 0.5);
            self.write_by_name("HYD_SPOILER_7_RIGHT_DEFLECTION", 0.5);
            self.write_by_name("HYD_SPOILER_8_RIGHT_DEFLECTION", 0.5);

            self.write_by_name("HYD_SPOILER_1_LEFT_DEFLECTION", 0.);
            self.write_by_name("HYD_SPOILER_2_LEFT_DEFLECTION", 0.);
            self.write_by_name("HYD_SPOILER_3_LEFT_DEFLECTION", 0.);
            self.write_by_name("HYD_SPOILER_4_LEFT_DEFLECTION", 0.);
            self.write_by_name("HYD_SPOILER_5_LEFT_DEFLECTION", 0.);
            self.write_by_name("HYD_SPOILER_6_LEFT_DEFLECTION", 0.);
            self.write_by_name("HYD_SPOILER_7_LEFT_DEFLECTION", 0.);
            self.write_by_name("HYD_SPOILER_8_LEFT_DEFLECTION", 0.);

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
    fn init() {
        let mut test_bed = SimulationTestBed::new(WingFlexTestAircraft::new);

        test_bed.set_true_airspeed(Velocity::new::<knot>(340.));

        test_bed.run_with_delta(Duration::from_secs(1));
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

        test_bed.write_by_name(A380fuelTanks::LeftInner.to_string().as_str(), 1000.);

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

        test_bed.write_by_name(A380fuelTanks::LeftFeed2.to_string().as_str(), 1000.);
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

        test_bed.write_by_name(A380fuelTanks::LeftMid.to_string().as_str(), 1000.);

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

        test_bed.write_by_name(A380fuelTanks::LeftFeed1.to_string().as_str(), 1000.);
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

        test_bed.write_by_name(A380fuelTanks::LeftOutter.to_string().as_str(), 1000.);

        test_bed.run_with_delta(Duration::from_secs(1));

        node0_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[0].fuel_mass);
        node1_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[1].fuel_mass);
        node2_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[2].fuel_mass);
        node3_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[3].fuel_mass);
        node4_mass = test_bed.query(|a| a.wing_flex.flex_physics[0].nodes[4].fuel_mass);

        println!(
            "FUELMASSES after fueling left outter: {:.0}/{:.0}/{:.0}/{:.0}/{:.0}",
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
