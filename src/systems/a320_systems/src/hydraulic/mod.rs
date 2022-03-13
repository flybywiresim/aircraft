use nalgebra::Vector3;

use std::time::Duration;
use uom::si::{
    acceleration::meter_per_second_squared,
    angle::{degree, radian},
    angular_velocity::{radian_per_second, revolution_per_minute},
    electric_current::ampere,
    f64::*,
    length::meter,
    mass::kilogram,
    pressure::psi,
    ratio::{percent, ratio},
    velocity::knot,
    volume::{cubic_inch, gallon, liter},
    volume_rate::gallon_per_second,
};

use systems::{
    engine::Engine,
    hydraulic::{
        aerodynamic_model::AerodynamicModel,
        brake_circuit::{
            AutobrakeDecelerationGovernor, AutobrakeMode, AutobrakePanel, BrakeCircuit,
            BrakeCircuitController,
        },
        electrical_generator::{GeneratorControlUnit, HydraulicGeneratorMotor},
        flap_slat::FlapSlatAssembly,
        linear_actuator::{
            Actuator, BoundedLinearLength, HydraulicAssemblyController,
            HydraulicLinearActuatorAssembly, LinearActuatedRigidBodyOnHingeAxis, LinearActuator,
            LinearActuatorMode,
        },
        nose_steering::{
            Pushback, SteeringActuator, SteeringAngleLimiter, SteeringController,
            SteeringRatioToAngle,
        },
        ElectricPump, EngineDrivenPump, HydraulicCircuit, HydraulicCircuitController,
        PowerTransferUnit, PowerTransferUnitController, PressureSwitch, PressureSwitchType,
        PumpController, RamAirTurbine, RamAirTurbineController, Reservoir, SectionPressure,
    },
    overhead::{
        AutoOffFaultPushButton, AutoOnFaultPushButton, MomentaryOnPushButton, MomentaryPushButton,
    },
    shared::{
        interpolation,
        low_pass_filter::LowPassFilter,
        random_from_range,
        update_iterator::{FixedStepLoop, MaxStepLoop},
        DelayedFalseLogicGate, DelayedPulseTrueLogicGate, DelayedTrueLogicGate, ElectricalBusType,
        ElectricalBuses, EmergencyElectricalRatPushButton, EmergencyElectricalState,
        EmergencyGeneratorPower, EngineFirePushButtons, HydraulicColor,
        HydraulicGeneratorControlUnit, LgciuSensors, ReservoirAirPressure,
    },
    simulation::{
        InitContext, Read, Reader, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, VariableIdentifier, Write,
    },
};

#[cfg(test)]
use systems::hydraulic::PressureSwitchState;

mod flaps_computer;
use flaps_computer::SlatFlapComplex;

struct A320HydraulicReservoirFactory {}
impl A320HydraulicReservoirFactory {
    fn new_green_reservoir(context: &mut InitContext) -> Reservoir {
        Reservoir::new(
            context,
            HydraulicColor::Green,
            Volume::new::<liter>(23.),
            Volume::new::<liter>(18.),
            Volume::new::<gallon>(3.6),
            vec![PressureSwitch::new(
                Pressure::new::<psi>(25.),
                Pressure::new::<psi>(22.),
                PressureSwitchType::Relative,
            )],
            Volume::new::<liter>(3.),
        )
    }

    fn new_blue_reservoir(context: &mut InitContext) -> Reservoir {
        Reservoir::new(
            context,
            HydraulicColor::Blue,
            Volume::new::<liter>(10.),
            Volume::new::<liter>(8.),
            Volume::new::<gallon>(1.56),
            vec![PressureSwitch::new(
                Pressure::new::<psi>(25.),
                Pressure::new::<psi>(22.),
                PressureSwitchType::Relative,
            )],
            Volume::new::<liter>(2.),
        )
    }

    fn new_yellow_reservoir(context: &mut InitContext) -> Reservoir {
        Reservoir::new(
            context,
            HydraulicColor::Yellow,
            Volume::new::<liter>(20.),
            Volume::new::<liter>(18.),
            Volume::new::<gallon>(3.6),
            vec![PressureSwitch::new(
                Pressure::new::<psi>(25.),
                Pressure::new::<psi>(22.),
                PressureSwitchType::Relative,
            )],
            Volume::new::<liter>(3.),
        )
    }
}

pub struct A320HydraulicCircuitFactory {}
impl A320HydraulicCircuitFactory {
    const MIN_PRESS_EDP_SECTION_LO_HYST: f64 = 1740.0;
    const MIN_PRESS_EDP_SECTION_HI_HYST: f64 = 2200.0;
    const MIN_PRESS_PRESSURISED_LO_HYST: f64 = 1450.0;
    const MIN_PRESS_PRESSURISED_HI_HYST: f64 = 1750.0;

    const GREEN_ENGINE_PUMP_INDEX: usize = 0;
    const YELLOW_ENGINE_PUMP_INDEX: usize = 0;
    const BLUE_ELECTRIC_PUMP_INDEX: usize = 0;

    pub fn new_green_circuit(context: &mut InitContext) -> HydraulicCircuit {
        let reservoir = A320HydraulicReservoirFactory::new_green_reservoir(context);
        HydraulicCircuit::new(
            context,
            HydraulicColor::Green,
            1,
            Ratio::new::<percent>(100.),
            Volume::new::<gallon>(10.),
            reservoir,
            Pressure::new::<psi>(Self::MIN_PRESS_PRESSURISED_LO_HYST),
            Pressure::new::<psi>(Self::MIN_PRESS_PRESSURISED_HI_HYST),
            Pressure::new::<psi>(Self::MIN_PRESS_EDP_SECTION_LO_HYST),
            Pressure::new::<psi>(Self::MIN_PRESS_EDP_SECTION_HI_HYST),
            true,
            false,
        )
    }

    pub fn new_blue_circuit(context: &mut InitContext) -> HydraulicCircuit {
        let reservoir = A320HydraulicReservoirFactory::new_blue_reservoir(context);
        HydraulicCircuit::new(
            context,
            HydraulicColor::Blue,
            1,
            Ratio::new::<percent>(100.),
            Volume::new::<gallon>(8.),
            reservoir,
            Pressure::new::<psi>(Self::MIN_PRESS_PRESSURISED_LO_HYST),
            Pressure::new::<psi>(Self::MIN_PRESS_PRESSURISED_HI_HYST),
            Pressure::new::<psi>(Self::MIN_PRESS_EDP_SECTION_LO_HYST),
            Pressure::new::<psi>(Self::MIN_PRESS_EDP_SECTION_HI_HYST),
            false,
            false,
        )
    }

    pub fn new_yellow_circuit(context: &mut InitContext) -> HydraulicCircuit {
        let reservoir = A320HydraulicReservoirFactory::new_yellow_reservoir(context);
        HydraulicCircuit::new(
            context,
            HydraulicColor::Yellow,
            1,
            Ratio::new::<percent>(100.),
            Volume::new::<gallon>(10.),
            reservoir,
            Pressure::new::<psi>(Self::MIN_PRESS_PRESSURISED_LO_HYST),
            Pressure::new::<psi>(Self::MIN_PRESS_PRESSURISED_HI_HYST),
            Pressure::new::<psi>(Self::MIN_PRESS_EDP_SECTION_LO_HYST),
            Pressure::new::<psi>(Self::MIN_PRESS_EDP_SECTION_HI_HYST),
            false,
            true,
        )
    }
}

struct A320CargoDoorFactory {}
impl A320CargoDoorFactory {
    const FLOW_CONTROL_PROPORTIONAL_GAIN: f64 = 0.05;
    const FLOW_CONTROL_INTEGRAL_GAIN: f64 = 5.;
    const FLOW_CONTROL_FORCE_GAIN: f64 = 200000.;

    fn a320_cargo_door_actuator(
        bounded_linear_length: &impl BoundedLinearLength,
    ) -> LinearActuator {
        LinearActuator::new(
            bounded_linear_length,
            2,
            Length::new::<meter>(0.04422),
            Length::new::<meter>(0.03366),
            VolumeRate::new::<gallon_per_second>(0.01),
            600000.,
            15000.,
            500.,
            1000000.,
            Duration::from_millis(100),
            [1., 1., 1., 1., 1., 1.],
            [0., 0.2, 0.21, 0.79, 0.8, 1.],
            Self::FLOW_CONTROL_PROPORTIONAL_GAIN,
            Self::FLOW_CONTROL_INTEGRAL_GAIN,
            Self::FLOW_CONTROL_FORCE_GAIN,
        )
    }

    /// Builds a cargo door body for A320 Neo
    fn a320_cargo_door_body(is_locked: bool) -> LinearActuatedRigidBodyOnHingeAxis {
        let size = Vector3::new(100. / 1000., 1855. / 1000., 2025. / 1000.);
        let cg_offset = Vector3::new(0., -size[1] / 2., 0.);

        let control_arm = Vector3::new(-0.1597, -0.1614, 0.);
        let anchor = Vector3::new(-0.7596, -0.086, 0.);
        let axis_direction = Vector3::new(0., 0., 1.);
        LinearActuatedRigidBodyOnHingeAxis::new(
            Mass::new::<kilogram>(130.),
            size,
            cg_offset,
            control_arm,
            anchor,
            Angle::new::<degree>(-23.),
            Angle::new::<degree>(136.),
            Angle::new::<degree>(-23.),
            100.,
            is_locked,
            axis_direction,
        )
    }

    /// Builds a cargo door assembly consisting of the door physical rigid body and the hydraulic actuator connected
    /// to it
    fn a320_cargo_door_assembly() -> HydraulicLinearActuatorAssembly<1> {
        let cargo_door_body = Self::a320_cargo_door_body(true);
        let cargo_door_actuator = Self::a320_cargo_door_actuator(&cargo_door_body);
        HydraulicLinearActuatorAssembly::new([cargo_door_actuator], cargo_door_body)
    }

    fn new_a320_cargo_door(context: &mut InitContext, id: &str) -> CargoDoor {
        let assembly = Self::a320_cargo_door_assembly();
        CargoDoor::new(
            context,
            id,
            assembly,
            Self::new_a320_cargo_door_aero_model(),
        )
    }

    fn new_a320_cargo_door_aero_model() -> AerodynamicModel {
        let body = Self::a320_cargo_door_body(false);
        AerodynamicModel::new(
            &body,
            Some(Vector3::new(1., 0., 0.)),
            Some(Vector3::new(0., 0., 1.)),
            Some(Vector3::new(1., 0., 0.)),
            Ratio::new::<ratio>(1.),
        )
    }
}

struct A320AileronFactory {}
impl A320AileronFactory {
    const FLOW_CONTROL_PROPORTIONAL_GAIN: f64 = 0.35;
    const FLOW_CONTROL_INTEGRAL_GAIN: f64 = 5.;
    const FLOW_CONTROL_FORCE_GAIN: f64 = 450000.;

    const MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING: f64 = 800000.;

    fn a320_aileron_actuator(bounded_linear_length: &impl BoundedLinearLength) -> LinearActuator {
        let randomized_damping = random_from_range(
            Self::MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING / 10.,
            Self::MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING,
        );

        // Aileron actuator real data:
        // Max force of 4700DaN @ 3000psi. Max flow 3.302 US gal/min thus 0.055033333 gal/s
        // This gives a 0.00227225 squared meter of piston surface
        // This gives piston diameter of 0.0537878 meters
        // We use 0 as rod diameter as this is a symmetrical actuator so same surface each side
        LinearActuator::new(
            bounded_linear_length,
            1,
            Length::new::<meter>(0.0537878),
            Length::new::<meter>(0.),
            VolumeRate::new::<gallon_per_second>(0.055),
            80000.,
            1500.,
            5000.,
            randomized_damping,
            Duration::from_millis(300),
            [1., 1., 1., 1., 1., 1.],
            [0., 0.2, 0.21, 0.79, 0.8, 1.],
            Self::FLOW_CONTROL_PROPORTIONAL_GAIN,
            Self::FLOW_CONTROL_INTEGRAL_GAIN,
            Self::FLOW_CONTROL_FORCE_GAIN,
        )
    }

    /// Builds an aileron control surface body for A320 Neo
    fn a320_aileron_body() -> LinearActuatedRigidBodyOnHingeAxis {
        let size = Vector3::new(3.325, 0.16, 0.58);
        let cg_offset = Vector3::new(0., 0., -0.5 * size[2]);

        let control_arm = Vector3::new(0., -0.0525, 0.);
        let anchor = Vector3::new(0., -0.0525, 0.33);

        LinearActuatedRigidBodyOnHingeAxis::new(
            Mass::new::<kilogram>(24.65),
            size,
            cg_offset,
            control_arm,
            anchor,
            Angle::new::<degree>(-25.),
            Angle::new::<degree>(50.),
            Angle::new::<degree>(-25.),
            1.,
            false,
            Vector3::new(1., 0., 0.),
        )
    }

    /// Builds an aileron assembly consisting of the aileron physical rigid body and two hydraulic actuators connected
    /// to it
    fn a320_aileron_assembly() -> HydraulicLinearActuatorAssembly<2> {
        let aileron_body = Self::a320_aileron_body();

        let aileron_actuator_outward = Self::a320_aileron_actuator(&aileron_body);
        let aileron_actuator_inward = Self::a320_aileron_actuator(&aileron_body);

        HydraulicLinearActuatorAssembly::new(
            [aileron_actuator_outward, aileron_actuator_inward],
            aileron_body,
        )
    }

    fn new_aileron(context: &mut InitContext, id: ActuatorSide) -> AileronAssembly {
        let assembly = Self::a320_aileron_assembly();
        AileronAssembly::new(context, id, assembly, Self::new_a320_aileron_aero_model())
    }

    fn new_a320_aileron_aero_model() -> AerodynamicModel {
        let body = Self::a320_aileron_body();
        AerodynamicModel::new(
            &body,
            Some(Vector3::new(0., 1., 0.)),
            Some(Vector3::new(0., 0., 1.)),
            Some(Vector3::new(0., 1., 0.)),
            Ratio::new::<ratio>(1.),
        )
    }
}

struct A320SpoilerFactory {}
impl A320SpoilerFactory {
    const FLOW_CONTROL_PROPORTIONAL_GAIN: f64 = 0.15;
    const FLOW_CONTROL_INTEGRAL_GAIN: f64 = 2.;
    const FLOW_CONTROL_FORCE_GAIN: f64 = 450000.;

    const MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING: f64 = 400000.;

    const MAX_FLOW_GAL_P_S: f64 = 0.03;
    const MAX_FLOW_PRECISION_PER_ACTUATOR_PERCENT: f64 = 3.;

    fn a320_spoiler_actuator(bounded_linear_length: &impl BoundedLinearLength) -> LinearActuator {
        let randomized_damping = random_from_range(
            Self::MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING / 5.,
            Self::MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING,
        );

        let random_max_flow_margin =
            Self::MAX_FLOW_GAL_P_S * Self::MAX_FLOW_PRECISION_PER_ACTUATOR_PERCENT / 100.;
        let random_max_flow_gal_per_s = random_from_range(
            Self::MAX_FLOW_GAL_P_S - random_max_flow_margin,
            Self::MAX_FLOW_GAL_P_S + random_max_flow_margin,
        );

        LinearActuator::new(
            bounded_linear_length,
            1,
            Length::new::<meter>(0.03),
            Length::new::<meter>(0.),
            VolumeRate::new::<gallon_per_second>(random_max_flow_gal_per_s),
            80000.,
            1500.,
            5000.,
            randomized_damping,
            Duration::from_millis(300),
            [1., 1., 1., 1., 1., 1.],
            [0., 0.2, 0.21, 0.79, 0.8, 1.],
            Self::FLOW_CONTROL_PROPORTIONAL_GAIN,
            Self::FLOW_CONTROL_INTEGRAL_GAIN,
            Self::FLOW_CONTROL_FORCE_GAIN,
        )
    }

    /// Builds a spoiler control surface body for A320 Neo
    fn a320_spoiler_body() -> LinearActuatedRigidBodyOnHingeAxis {
        let size = Vector3::new(1.785, 0.1, 0.685);
        let cg_offset = Vector3::new(0., 0., -0.5 * size[2]);

        let control_arm = Vector3::new(0., -0.067 * size[2], -0.26 * size[2]);
        let anchor = Vector3::new(0., -0.26 * size[2], 0.26 * size[2]);

        LinearActuatedRigidBodyOnHingeAxis::new(
            Mass::new::<kilogram>(16.),
            size,
            cg_offset,
            control_arm,
            anchor,
            Angle::new::<degree>(-10.),
            Angle::new::<degree>(40.),
            Angle::new::<degree>(-10.),
            50.,
            false,
            Vector3::new(1., 0., 0.),
        )
    }

    /// Builds a spoiler assembly consisting of the spoiler physical rigid body and one hydraulic actuator
    fn a320_spoiler_assembly() -> HydraulicLinearActuatorAssembly<1> {
        let spoiler_body = Self::a320_spoiler_body();

        let spoiler_actuator = Self::a320_spoiler_actuator(&spoiler_body);

        HydraulicLinearActuatorAssembly::new([spoiler_actuator], spoiler_body)
    }

    fn new_a320_spoiler_group(context: &mut InitContext, id: ActuatorSide) -> SpoilerGroup {
        let spoiler_1 = Self::new_a320_spoiler_element(context, id, 1);
        let spoiler_2 = Self::new_a320_spoiler_element(context, id, 2);
        let spoiler_3 = Self::new_a320_spoiler_element(context, id, 3);
        let spoiler_4 = Self::new_a320_spoiler_element(context, id, 4);
        let spoiler_5 = Self::new_a320_spoiler_element(context, id, 5);

        SpoilerGroup::new([spoiler_1, spoiler_2, spoiler_3, spoiler_4, spoiler_5])
    }

    fn new_a320_spoiler_element(
        context: &mut InitContext,
        id: ActuatorSide,
        id_number: usize,
    ) -> SpoilerElement {
        let assembly = Self::a320_spoiler_assembly();
        SpoilerElement::new(
            context,
            id,
            id_number,
            assembly,
            Self::new_a320_spoiler_aero_model(),
        )
    }

    fn new_a320_spoiler_aero_model() -> AerodynamicModel {
        let body = Self::a320_spoiler_body();

        // Lift vector and normal are rotated 10° to acount for air supposedly following
        // wing profile that is 10° from horizontal
        // It means that with headwind and spoiler retracted (-10°), spoiler generates no lift
        AerodynamicModel::new(
            &body,
            Some(Vector3::new(0., 1., 0.)),
            Some(Vector3::new(0., -0.174, 0.985)),
            Some(Vector3::new(0., 0.985, 0.174)),
            Ratio::new::<ratio>(1.),
        )
    }
}

struct A320ElevatorFactory {}
impl A320ElevatorFactory {
    const FLOW_CONTROL_PROPORTIONAL_GAIN: f64 = 1.;
    const FLOW_CONTROL_INTEGRAL_GAIN: f64 = 5.;
    const FLOW_CONTROL_FORCE_GAIN: f64 = 450000.;

    const MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING: f64 = 10000000.;

    fn a320_elevator_actuator(bounded_linear_length: &impl BoundedLinearLength) -> LinearActuator {
        let randomized_damping = random_from_range(
            Self::MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING / 10.,
            Self::MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING,
        );

        LinearActuator::new(
            bounded_linear_length,
            1,
            Length::new::<meter>(0.0407),
            Length::new::<meter>(0.),
            VolumeRate::new::<gallon_per_second>(0.029),
            80000.,
            1500.,
            20000.,
            randomized_damping,
            Duration::from_millis(300),
            [1., 1., 1., 1., 1., 1.],
            [0., 0.2, 0.21, 0.79, 0.8, 1.],
            Self::FLOW_CONTROL_PROPORTIONAL_GAIN,
            Self::FLOW_CONTROL_INTEGRAL_GAIN,
            Self::FLOW_CONTROL_FORCE_GAIN,
        )
    }

    /// Builds an aileron control surface body for A320 Neo
    fn a320_elevator_body() -> LinearActuatedRigidBodyOnHingeAxis {
        let size = Vector3::new(6., 0.405, 1.125);
        let cg_offset = Vector3::new(0., 0., -0.5 * size[2]);

        let control_arm = Vector3::new(0., -0.091, 0.);
        let anchor = Vector3::new(0., -0.091, 0.41);

        LinearActuatedRigidBodyOnHingeAxis::new(
            Mass::new::<kilogram>(58.6),
            size,
            cg_offset,
            control_arm,
            anchor,
            Angle::new::<degree>(-17.),
            Angle::new::<degree>(47.),
            Angle::new::<degree>(-17.),
            100.,
            false,
            Vector3::new(1., 0., 0.),
        )
    }

    /// Builds an aileron assembly consisting of the aileron physical rigid body and two hydraulic actuators connected
    /// to it
    fn a320_elevator_assembly() -> HydraulicLinearActuatorAssembly<2> {
        let elevator_body = Self::a320_elevator_body();

        let elevator_actuator_outboard = Self::a320_elevator_actuator(&elevator_body);
        let elevator_actuator_inbord = Self::a320_elevator_actuator(&elevator_body);

        HydraulicLinearActuatorAssembly::new(
            [elevator_actuator_outboard, elevator_actuator_inbord],
            elevator_body,
        )
    }

    fn new_elevator(context: &mut InitContext, id: ActuatorSide) -> ElevatorAssembly {
        let assembly = Self::a320_elevator_assembly();
        ElevatorAssembly::new(context, id, assembly, Self::new_a320_elevator_aero_model())
    }

    fn new_a320_elevator_aero_model() -> AerodynamicModel {
        let body = Self::a320_elevator_body();
        AerodynamicModel::new(
            &body,
            Some(Vector3::new(0., 1., 0.)),
            Some(Vector3::new(0., 0., 1.)),
            Some(Vector3::new(0., 1., 0.)),
            Ratio::new::<ratio>(0.8),
        )
    }
}

struct A320RudderFactory {}
impl A320RudderFactory {
    const FLOW_CONTROL_PROPORTIONAL_GAIN: f64 = 1.5;
    const FLOW_CONTROL_INTEGRAL_GAIN: f64 = 2.;
    const FLOW_CONTROL_FORCE_GAIN: f64 = 350000.;

    const MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING: f64 = 1000000.;

    fn a320_rudder_actuator(bounded_linear_length: &impl BoundedLinearLength) -> LinearActuator {
        let randomized_damping = random_from_range(
            Self::MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING / 10.,
            Self::MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING,
        );

        LinearActuator::new(
            bounded_linear_length,
            1,
            Length::new::<meter>(0.06),
            Length::new::<meter>(0.),
            VolumeRate::new::<gallon_per_second>(0.0792),
            80000.,
            1500.,
            10000.,
            randomized_damping,
            Duration::from_millis(300),
            [1., 1., 1., 1., 1., 1.],
            [0., 0.2, 0.21, 0.79, 0.8, 1.],
            Self::FLOW_CONTROL_PROPORTIONAL_GAIN,
            Self::FLOW_CONTROL_INTEGRAL_GAIN,
            Self::FLOW_CONTROL_FORCE_GAIN,
        )
    }

    /// Builds an aileron control surface body for A320 Neo
    fn a320_rudder_body() -> LinearActuatedRigidBodyOnHingeAxis {
        let size = Vector3::new(0.42, 6.65, 1.8);
        let cg_offset = Vector3::new(0., 0.5 * size[1], -0.5 * size[2]);

        let control_arm = Vector3::new(-0.144, 0., 0.);
        let anchor = Vector3::new(-0.144, 0., 0.50);

        let randomized_init_position_angle_degree = random_from_range(-15., 15.);

        LinearActuatedRigidBodyOnHingeAxis::new(
            Mass::new::<kilogram>(95.),
            size,
            cg_offset,
            control_arm,
            anchor,
            Angle::new::<degree>(-25.),
            Angle::new::<degree>(50.),
            Angle::new::<degree>(randomized_init_position_angle_degree),
            100.,
            false,
            Vector3::new(0., 1., 0.),
        )
    }

    /// Builds an aileron assembly consisting of the aileron physical rigid body and two hydraulic actuators connected
    /// to it
    fn a320_rudder_assembly() -> HydraulicLinearActuatorAssembly<3> {
        let rudder_body = Self::a320_rudder_body();

        let elevator_actuator_green = Self::a320_rudder_actuator(&rudder_body);
        let elevator_actuator_blue = Self::a320_rudder_actuator(&rudder_body);
        let elevator_actuator_yellow = Self::a320_rudder_actuator(&rudder_body);

        HydraulicLinearActuatorAssembly::new(
            [
                elevator_actuator_green,
                elevator_actuator_blue,
                elevator_actuator_yellow,
            ],
            rudder_body,
        )
    }

    fn new_rudder(context: &mut InitContext) -> RudderAssembly {
        let assembly = Self::a320_rudder_assembly();
        RudderAssembly::new(context, assembly, Self::new_a320_rudder_aero_model())
    }

    fn new_a320_rudder_aero_model() -> AerodynamicModel {
        let body = Self::a320_rudder_body();
        AerodynamicModel::new(
            &body,
            Some(Vector3::new(1., 0., 0.)),
            Some(Vector3::new(0., 0., 1.)),
            Some(Vector3::new(1., 0., 0.)),
            Ratio::new::<ratio>(0.4),
        )
    }
}

pub(super) struct A320Hydraulic {
    hyd_ptu_ecam_memo_id: VariableIdentifier,
    ptu_high_pitch_sound_id: VariableIdentifier,

    nose_steering: SteeringActuator,

    core_hydraulic_updater: FixedStepLoop,
    physics_updater: MaxStepLoop,
    flight_controls_updater: MaxStepLoop,

    brake_steer_computer: A320HydraulicBrakeSteerComputerUnit,

    blue_circuit: HydraulicCircuit,
    blue_circuit_controller: A320HydraulicCircuitController,
    green_circuit: HydraulicCircuit,
    green_circuit_controller: A320HydraulicCircuitController,
    yellow_circuit: HydraulicCircuit,
    yellow_circuit_controller: A320HydraulicCircuitController,

    engine_driven_pump_1: EngineDrivenPump,
    engine_driven_pump_1_controller: A320EngineDrivenPumpController,

    engine_driven_pump_2: EngineDrivenPump,
    engine_driven_pump_2_controller: A320EngineDrivenPumpController,

    blue_electric_pump: ElectricPump,
    blue_electric_pump_controller: A320BlueElectricPumpController,

    yellow_electric_pump: ElectricPump,
    yellow_electric_pump_controller: A320YellowElectricPumpController,

    pushback_tug: PushbackTug,

    ram_air_turbine: RamAirTurbine,
    ram_air_turbine_controller: A320RamAirTurbineController,

    power_transfer_unit: PowerTransferUnit,
    power_transfer_unit_controller: A320PowerTransferUnitController,

    braking_circuit_norm: BrakeCircuit,
    braking_circuit_altn: BrakeCircuit,
    braking_force: A320BrakingForce,

    flap_system: FlapSlatAssembly,
    slat_system: FlapSlatAssembly,
    slats_flaps_complex: SlatFlapComplex,

    gcu: GeneratorControlUnit<9>,
    emergency_gen: HydraulicGeneratorMotor,

    forward_cargo_door: CargoDoor,
    forward_cargo_door_controller: A320DoorController,
    aft_cargo_door: CargoDoor,
    aft_cargo_door_controller: A320DoorController,

    elac_computer: ElacComputer,
    left_aileron: AileronAssembly,
    right_aileron: AileronAssembly,
    left_elevator: ElevatorAssembly,
    right_elevator: ElevatorAssembly,

    fac_computer: FacComputer,
    rudder: RudderAssembly,

    spoiler_computer: SpoilerComputer,
    left_spoilers: SpoilerGroup,
    right_spoilers: SpoilerGroup,
}
impl A320Hydraulic {
    const HIGH_PITCH_PTU_SOUND_DELTA_PRESS_THRESHOLD_PSI: f64 = 2400.;

    const FLAP_FFPU_TO_SURFACE_ANGLE_BREAKPTS: [f64; 12] = [
        0., 65., 115., 120.53, 136., 145.5, 152., 165., 168.3, 179., 231.2, 251.97,
    ];
    const FLAP_FFPU_TO_SURFACE_ANGLE_DEGREES: [f64; 12] = [
        0., 10.318, 18.2561, 19.134, 21.59, 23.098, 24.13, 26.196, 26.72, 28.42, 36.703, 40.,
    ];

    const SLAT_FFPU_TO_SURFACE_ANGLE_BREAKPTS: [f64; 12] = [
        0., 12.5985, 25.197, 37.7955, 50.394, 62.9925, 75.591, 88.1895, 100.788, 113.3865,
        157.48125, 170.07975,
    ];
    const SLAT_FFPU_TO_SURFACE_ANGLE_DEGREES: [f64; 12] =
        [0., 2., 4., 6., 8., 10., 12., 14., 16., 18., 25., 27.];

    const FORWARD_CARGO_DOOR_ID: &'static str = "FWD";
    const AFT_CARGO_DOOR_ID: &'static str = "AFT";

    const ELECTRIC_PUMP_MAX_CURRENT_AMPERE: f64 = 45.;
    const BLUE_ELEC_PUMP_CONTROL_POWER_BUS: ElectricalBusType =
        ElectricalBusType::DirectCurrentEssential;
    const BLUE_ELEC_PUMP_SUPPLY_POWER_BUS: ElectricalBusType =
        ElectricalBusType::AlternatingCurrent(1);

    const YELLOW_ELEC_PUMP_CONTROL_POWER_BUS: ElectricalBusType =
        ElectricalBusType::DirectCurrent(2);
    const YELLOW_ELEC_PUMP_CONTROL_FROM_CARGO_DOOR_OPERATION_POWER_BUS: ElectricalBusType =
        ElectricalBusType::DirectCurrentGndFltService;
    const YELLOW_ELEC_PUMP_SUPPLY_POWER_BUS: ElectricalBusType =
        ElectricalBusType::AlternatingCurrentGndFltService;

    const YELLOW_EDP_CONTROL_POWER_BUS1: ElectricalBusType = ElectricalBusType::DirectCurrent(2);
    const YELLOW_EDP_CONTROL_POWER_BUS2: ElectricalBusType =
        ElectricalBusType::DirectCurrentEssential;
    const GREEN_EDP_CONTROL_POWER_BUS1: ElectricalBusType =
        ElectricalBusType::DirectCurrentEssential;

    const PTU_CONTROL_POWER_BUS: ElectricalBusType = ElectricalBusType::DirectCurrentGndFltService;

    const RAT_CONTROL_SOLENOID1_POWER_BUS: ElectricalBusType =
        ElectricalBusType::DirectCurrentHot(1);
    const RAT_CONTROL_SOLENOID2_POWER_BUS: ElectricalBusType =
        ElectricalBusType::DirectCurrentHot(2);

    // Refresh rate of core hydraulic simulation
    const HYDRAULIC_SIM_TIME_STEP: Duration = Duration::from_millis(33);
    // Refresh rate of max fixed step loop for fast physics
    const HYDRAULIC_SIM_MAX_TIME_STEP_MILLISECONDS: Duration = Duration::from_millis(33);
    // Refresh rate of max fixed step loop for fastest flight controls physics needing super stability
    // and fast reacting time
    const HYDRAULIC_SIM_FLIGHT_CONTROLS_MAX_TIME_STEP_MILLISECONDS: Duration =
        Duration::from_millis(10);

    pub(super) fn new(context: &mut InitContext) -> A320Hydraulic {
        A320Hydraulic {
            hyd_ptu_ecam_memo_id: context.get_identifier("HYD_PTU_ON_ECAM_MEMO".to_owned()),
            ptu_high_pitch_sound_id: context.get_identifier("HYD_PTU_HIGH_PITCH_SOUND".to_owned()),

            nose_steering: SteeringActuator::new(
                context,
                Angle::new::<degree>(75.),
                AngularVelocity::new::<radian_per_second>(0.35),
                Length::new::<meter>(0.075),
                Ratio::new::<ratio>(0.18),
            ),

            core_hydraulic_updater: FixedStepLoop::new(Self::HYDRAULIC_SIM_TIME_STEP),
            physics_updater: MaxStepLoop::new(Self::HYDRAULIC_SIM_MAX_TIME_STEP_MILLISECONDS),
            flight_controls_updater: MaxStepLoop::new(
                Self::HYDRAULIC_SIM_FLIGHT_CONTROLS_MAX_TIME_STEP_MILLISECONDS,
            ),

            brake_steer_computer: A320HydraulicBrakeSteerComputerUnit::new(context),

            blue_circuit: A320HydraulicCircuitFactory::new_blue_circuit(context),
            blue_circuit_controller: A320HydraulicCircuitController::new(None),
            green_circuit: A320HydraulicCircuitFactory::new_green_circuit(context),
            green_circuit_controller: A320HydraulicCircuitController::new(Some(1)),
            yellow_circuit: A320HydraulicCircuitFactory::new_yellow_circuit(context),
            yellow_circuit_controller: A320HydraulicCircuitController::new(Some(2)),

            engine_driven_pump_1: EngineDrivenPump::new(context, "GREEN"),
            engine_driven_pump_1_controller: A320EngineDrivenPumpController::new(
                context,
                1,
                vec![Self::GREEN_EDP_CONTROL_POWER_BUS1],
            ),

            engine_driven_pump_2: EngineDrivenPump::new(context, "YELLOW"),
            engine_driven_pump_2_controller: A320EngineDrivenPumpController::new(
                context,
                2,
                vec![
                    Self::YELLOW_EDP_CONTROL_POWER_BUS1,
                    Self::YELLOW_EDP_CONTROL_POWER_BUS2,
                ],
            ),

            blue_electric_pump: ElectricPump::new(
                context,
                "BLUE",
                Self::BLUE_ELEC_PUMP_SUPPLY_POWER_BUS,
                ElectricCurrent::new::<ampere>(Self::ELECTRIC_PUMP_MAX_CURRENT_AMPERE),
            ),
            blue_electric_pump_controller: A320BlueElectricPumpController::new(
                context,
                Self::BLUE_ELEC_PUMP_CONTROL_POWER_BUS,
            ),

            yellow_electric_pump: ElectricPump::new(
                context,
                "YELLOW",
                Self::YELLOW_ELEC_PUMP_SUPPLY_POWER_BUS,
                ElectricCurrent::new::<ampere>(Self::ELECTRIC_PUMP_MAX_CURRENT_AMPERE),
            ),
            yellow_electric_pump_controller: A320YellowElectricPumpController::new(
                context,
                Self::YELLOW_ELEC_PUMP_CONTROL_POWER_BUS,
                Self::YELLOW_ELEC_PUMP_CONTROL_FROM_CARGO_DOOR_OPERATION_POWER_BUS,
            ),

            pushback_tug: PushbackTug::new(context),

            ram_air_turbine: RamAirTurbine::new(context),
            ram_air_turbine_controller: A320RamAirTurbineController::new(
                Self::RAT_CONTROL_SOLENOID1_POWER_BUS,
                Self::RAT_CONTROL_SOLENOID2_POWER_BUS,
            ),

            power_transfer_unit: PowerTransferUnit::new(context),
            power_transfer_unit_controller: A320PowerTransferUnitController::new(
                context,
                Self::PTU_CONTROL_POWER_BUS,
            ),

            braking_circuit_norm: BrakeCircuit::new(
                context,
                "NORM",
                Volume::new::<gallon>(0.),
                Volume::new::<gallon>(0.),
                Volume::new::<gallon>(0.13),
            ),

            // Alternate brakes accumulator in real A320 is 1.5 gal capacity.
            // This is tuned down to 1.0 to match real world accumulator filling time
            // as a faster accumulator response has too much unstability
            braking_circuit_altn: BrakeCircuit::new(
                context,
                "ALTN",
                Volume::new::<gallon>(1.0),
                Volume::new::<gallon>(0.4),
                Volume::new::<gallon>(0.13),
            ),

            braking_force: A320BrakingForce::new(context),

            flap_system: FlapSlatAssembly::new(
                context,
                "FLAPS",
                Volume::new::<cubic_inch>(0.32),
                AngularVelocity::new::<radian_per_second>(0.13),
                Angle::new::<degree>(251.97),
                Ratio::new::<ratio>(140.),
                Ratio::new::<ratio>(16.632),
                Ratio::new::<ratio>(314.98),
                Self::FLAP_FFPU_TO_SURFACE_ANGLE_BREAKPTS,
                Self::FLAP_FFPU_TO_SURFACE_ANGLE_DEGREES,
            ),
            slat_system: FlapSlatAssembly::new(
                context,
                "SLATS",
                Volume::new::<cubic_inch>(0.32),
                AngularVelocity::new::<radian_per_second>(0.09),
                Angle::new::<degree>(170.07975),
                Ratio::new::<ratio>(140.),
                Ratio::new::<ratio>(16.632),
                Ratio::new::<ratio>(314.98),
                Self::SLAT_FFPU_TO_SURFACE_ANGLE_BREAKPTS,
                Self::SLAT_FFPU_TO_SURFACE_ANGLE_DEGREES,
            ),
            slats_flaps_complex: SlatFlapComplex::new(context),

            gcu: GeneratorControlUnit::new(
                AngularVelocity::new::<revolution_per_minute>(12000.),
                [
                    0., 1000., 6000., 9999., 10000., 12000., 14000., 14001., 30000.,
                ],
                [0., 0., 0., 0., 1000., 6000., 1000., 0., 0.],
            ),

            emergency_gen: HydraulicGeneratorMotor::new(context, Volume::new::<cubic_inch>(0.19)),
            forward_cargo_door: A320CargoDoorFactory::new_a320_cargo_door(
                context,
                Self::FORWARD_CARGO_DOOR_ID,
            ),
            forward_cargo_door_controller: A320DoorController::new(
                context,
                Self::FORWARD_CARGO_DOOR_ID,
            ),

            aft_cargo_door: A320CargoDoorFactory::new_a320_cargo_door(
                context,
                Self::AFT_CARGO_DOOR_ID,
            ),
            aft_cargo_door_controller: A320DoorController::new(context, Self::AFT_CARGO_DOOR_ID),

            elac_computer: ElacComputer::new(context),
            left_aileron: A320AileronFactory::new_aileron(context, ActuatorSide::Left),
            right_aileron: A320AileronFactory::new_aileron(context, ActuatorSide::Right),
            left_elevator: A320ElevatorFactory::new_elevator(context, ActuatorSide::Left),
            right_elevator: A320ElevatorFactory::new_elevator(context, ActuatorSide::Right),

            fac_computer: FacComputer::new(context),
            rudder: A320RudderFactory::new_rudder(context),

            spoiler_computer: SpoilerComputer::new(context),
            left_spoilers: A320SpoilerFactory::new_a320_spoiler_group(context, ActuatorSide::Left),
            right_spoilers: A320SpoilerFactory::new_a320_spoiler_group(
                context,
                ActuatorSide::Right,
            ),
        }
    }

    pub(super) fn update(
        &mut self,
        context: &UpdateContext,
        engine1: &impl Engine,
        engine2: &impl Engine,
        overhead_panel: &A320HydraulicOverheadPanel,
        autobrake_panel: &AutobrakePanel,
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        lgciu1: &impl LgciuSensors,
        lgciu2: &impl LgciuSensors,
        rat_and_emer_gen_man_on: &impl EmergencyElectricalRatPushButton,
        emergency_elec: &(impl EmergencyElectricalState + EmergencyGeneratorPower),
        reservoir_pneumatics: &impl ReservoirAirPressure,
    ) {
        self.core_hydraulic_updater.update(context);
        self.physics_updater.update(context);
        self.flight_controls_updater.update(context);

        for cur_time_step in self.physics_updater {
            self.update_fast_physics(
                &context.with_delta(cur_time_step),
                rat_and_emer_gen_man_on,
                emergency_elec,
                lgciu1,
            );
        }

        self.update_with_sim_rate(
            context,
            overhead_panel,
            autobrake_panel,
            rat_and_emer_gen_man_on,
            emergency_elec,
            lgciu1,
            lgciu2,
            engine1,
            engine2,
        );

        for cur_time_step in self.flight_controls_updater {
            self.update_flight_controls_physics(&context.with_delta(cur_time_step));
        }

        for cur_time_step in self.core_hydraulic_updater {
            self.update_core_hydraulics(
                &context.with_delta(cur_time_step),
                engine1,
                engine2,
                overhead_panel,
                engine_fire_push_buttons,
                lgciu1,
                lgciu2,
                reservoir_pneumatics,
            );
        }
    }

    fn ptu_has_fault(&self) -> bool {
        self.power_transfer_unit_controller
            .has_air_pressure_low_fault()
            || self.power_transfer_unit_controller.has_low_level_fault()
    }

    fn green_edp_has_fault(&self) -> bool {
        self.engine_driven_pump_1_controller
            .has_pressure_low_fault()
            || self
                .engine_driven_pump_1_controller
                .has_air_pressure_low_fault()
            || self.engine_driven_pump_1_controller.has_low_level_fault()
    }

    fn yellow_epump_has_fault(&self) -> bool {
        self.yellow_electric_pump_controller
            .has_pressure_low_fault()
            || self
                .yellow_electric_pump_controller
                .has_air_pressure_low_fault()
            || self.yellow_electric_pump_controller.has_low_level_fault()
    }

    fn yellow_edp_has_fault(&self) -> bool {
        self.engine_driven_pump_2_controller
            .has_pressure_low_fault()
            || self
                .engine_driven_pump_2_controller
                .has_air_pressure_low_fault()
            || self.engine_driven_pump_2_controller.has_low_level_fault()
    }

    fn blue_epump_has_fault(&self) -> bool {
        self.blue_electric_pump_controller.has_pressure_low_fault()
            || self
                .blue_electric_pump_controller
                .has_air_pressure_low_fault()
            || self.blue_electric_pump_controller.has_low_level_fault()
    }

    pub fn green_reservoir(&self) -> &Reservoir {
        self.green_circuit.reservoir()
    }

    pub fn blue_reservoir(&self) -> &Reservoir {
        self.blue_circuit.reservoir()
    }

    pub fn yellow_reservoir(&self) -> &Reservoir {
        self.yellow_circuit.reservoir()
    }

    #[cfg(test)]
    fn should_pressurise_yellow_pump_for_cargo_door_operation(&self) -> bool {
        self.yellow_electric_pump_controller
            .should_pressurise_for_cargo_door_operation()
    }

    #[cfg(test)]
    fn nose_wheel_steering_pin_is_inserted(&self) -> bool {
        self.pushback_tug.is_nose_wheel_steering_pin_inserted()
    }

    #[cfg(test)]
    fn is_blue_pressurised(&self) -> bool {
        self.blue_circuit.system_section_pressure_switch() == PressureSwitchState::Pressurised
    }

    #[cfg(test)]
    fn is_green_pressurised(&self) -> bool {
        self.green_circuit.system_section_pressure_switch() == PressureSwitchState::Pressurised
    }

    #[cfg(test)]
    fn is_yellow_pressurised(&self) -> bool {
        self.yellow_circuit.system_section_pressure_switch() == PressureSwitchState::Pressurised
    }

    fn update_flight_controls_physics(&mut self, context: &UpdateContext) {
        self.left_aileron.update(
            context,
            self.elac_computer.left_controllers(),
            self.blue_circuit.system_pressure(),
            self.green_circuit.system_pressure(),
        );

        self.right_aileron.update(
            context,
            self.elac_computer.right_controllers(),
            self.blue_circuit.system_pressure(),
            self.green_circuit.system_pressure(),
        );

        self.left_elevator.update(
            context,
            self.elac_computer.left_elevator_controllers(),
            self.blue_circuit.system_pressure(),
            self.green_circuit.system_pressure(),
        );

        self.right_elevator.update(
            context,
            self.elac_computer.right_elevator_controllers(),
            self.blue_circuit.system_pressure(),
            self.yellow_circuit.system_pressure(),
        );

        self.rudder.update(
            context,
            self.fac_computer.rudder_controllers(),
            self.green_circuit.system_pressure(),
            self.blue_circuit.system_pressure(),
            self.yellow_circuit.system_pressure(),
        );

        self.left_spoilers.update(
            context,
            self.spoiler_computer.left_controllers(),
            self.green_circuit.system_pressure(),
            self.blue_circuit.system_pressure(),
            self.yellow_circuit.system_pressure(),
        );

        self.right_spoilers.update(
            context,
            self.spoiler_computer.right_controllers(),
            self.green_circuit.system_pressure(),
            self.blue_circuit.system_pressure(),
            self.yellow_circuit.system_pressure(),
        );
    }

    // Updates at the same rate as the sim or at a fixed maximum time step if sim rate is too slow
    fn update_fast_physics(
        &mut self,
        context: &UpdateContext,
        rat_and_emer_gen_man_on: &impl EmergencyElectricalRatPushButton,
        emergency_elec: &(impl EmergencyElectricalState + EmergencyGeneratorPower),
        lgciu1: &impl LgciuSensors,
    ) {
        self.forward_cargo_door.update(
            context,
            &self.forward_cargo_door_controller,
            self.yellow_circuit.system_pressure(),
        );

        self.aft_cargo_door.update(
            context,
            &self.aft_cargo_door_controller,
            self.yellow_circuit.system_pressure(),
        );

        self.ram_air_turbine.update_physics(
            &context.delta(),
            context.indicated_airspeed(),
            self.blue_circuit.system_pressure(),
        );

        self.gcu.update(
            context,
            &self.emergency_gen,
            self.blue_circuit.system_pressure(),
            emergency_elec,
            rat_and_emer_gen_man_on,
            lgciu1,
        );

        self.emergency_gen.update(
            context,
            self.blue_circuit.system_pressure(),
            &self.gcu,
            emergency_elec,
        );
    }

    fn update_with_sim_rate(
        &mut self,
        context: &UpdateContext,
        overhead_panel: &A320HydraulicOverheadPanel,
        autobrake_panel: &AutobrakePanel,
        rat_and_emer_gen_man_on: &impl EmergencyElectricalRatPushButton,
        emergency_elec_state: &impl EmergencyElectricalState,
        lgciu1: &impl LgciuSensors,
        lgciu2: &impl LgciuSensors,
        engine1: &impl Engine,
        engine2: &impl Engine,
    ) {
        self.nose_steering.update(
            context,
            self.yellow_circuit.system_pressure(),
            &self.brake_steer_computer,
            &self.pushback_tug,
        );

        // Process brake logic (which circuit brakes) and send brake demands (how much)
        self.brake_steer_computer.update(
            context,
            &self.green_circuit,
            &self.braking_circuit_altn,
            lgciu1,
            lgciu2,
            autobrake_panel,
            engine1,
            engine2,
        );

        // Updating rat stowed pos on all frames in case it's used for graphics
        self.ram_air_turbine.update_position(&context.delta());

        // Uses external conditions and momentary button: better to check each frame
        self.ram_air_turbine_controller.update(
            overhead_panel,
            rat_and_emer_gen_man_on,
            emergency_elec_state,
        );

        self.pushback_tug.update(context);

        self.braking_force.update_forces(
            context,
            &self.braking_circuit_norm,
            &self.braking_circuit_altn,
        );

        self.slats_flaps_complex
            .update(context, &self.flap_system, &self.slat_system);

        self.flap_system.update(
            context,
            self.slats_flaps_complex.flap_demand(),
            self.slats_flaps_complex.flap_demand(),
            self.green_circuit.system_pressure(),
            self.yellow_circuit.system_pressure(),
        );

        self.slat_system.update(
            context,
            self.slats_flaps_complex.slat_demand(),
            self.slats_flaps_complex.slat_demand(),
            self.blue_circuit.system_pressure(),
            self.green_circuit.system_pressure(),
        );

        self.forward_cargo_door_controller.update(
            context,
            &self.forward_cargo_door,
            self.yellow_circuit.system_pressure(),
        );

        self.aft_cargo_door_controller.update(
            context,
            &self.aft_cargo_door,
            self.yellow_circuit.system_pressure(),
        );

        self.elac_computer.update(
            self.blue_circuit.system_pressure(),
            self.green_circuit.system_pressure(),
            self.yellow_circuit.system_pressure(),
        );

        self.slats_flaps_complex
            .update(context, &self.flap_system, &self.slat_system);

        self.fac_computer.update(
            self.green_circuit.system_pressure(),
            self.blue_circuit.system_pressure(),
            self.yellow_circuit.system_pressure(),
        );
    }

    // For each hydraulic loop retrieves volumes from and to each actuator and pass it to the loops
    fn update_actuators_volume(&mut self) {
        self.update_green_actuators_volume();
        self.update_yellow_actuators_volume();
        self.update_blue_actuators_volume();
    }

    fn update_green_actuators_volume(&mut self) {
        self.green_circuit
            .update_actuator_volumes(&mut self.braking_circuit_norm);

        self.green_circuit
            .update_actuator_volumes(self.left_aileron.actuator(AileronActuatorPosition::Inboard));
        self.green_circuit.update_actuator_volumes(
            self.right_aileron
                .actuator(AileronActuatorPosition::Inboard),
        );

        self.green_circuit.update_actuator_volumes(
            self.left_elevator
                .actuator(ElevatorActuatorPosition::Inboard),
        );

        self.green_circuit
            .update_actuator_volumes(self.rudder.actuator(RudderActuatorPosition::Green));

        self.green_circuit
            .update_actuator_volumes(self.flap_system.left_motor());
        self.green_circuit
            .update_actuator_volumes(self.slat_system.right_motor());

        self.green_circuit
            .update_actuator_volumes(self.left_spoilers.actuator(0));
        self.green_circuit
            .update_actuator_volumes(self.left_spoilers.actuator(4));

        self.green_circuit
            .update_actuator_volumes(self.right_spoilers.actuator(0));
        self.green_circuit
            .update_actuator_volumes(self.right_spoilers.actuator(4));
    }

    fn update_yellow_actuators_volume(&mut self) {
        self.yellow_circuit
            .update_actuator_volumes(&mut self.braking_circuit_altn);

        self.yellow_circuit
            .update_actuator_volumes(self.flap_system.right_motor());

        self.yellow_circuit
            .update_actuator_volumes(self.forward_cargo_door.actuator());

        self.yellow_circuit
            .update_actuator_volumes(self.aft_cargo_door.actuator());

        self.yellow_circuit
            .update_actuator_volumes(&mut self.nose_steering);

        self.yellow_circuit.update_actuator_volumes(
            self.right_elevator
                .actuator(ElevatorActuatorPosition::Inboard),
        );

        self.yellow_circuit
            .update_actuator_volumes(self.rudder.actuator(RudderActuatorPosition::Yellow));

        self.yellow_circuit
            .update_actuator_volumes(self.left_spoilers.actuator(1));
        self.yellow_circuit
            .update_actuator_volumes(self.left_spoilers.actuator(3));

        self.yellow_circuit
            .update_actuator_volumes(self.right_spoilers.actuator(1));
        self.yellow_circuit
            .update_actuator_volumes(self.right_spoilers.actuator(3));
    }

    fn update_blue_actuators_volume(&mut self) {
        self.blue_circuit
            .update_actuator_volumes(self.slat_system.left_motor());
        self.blue_circuit
            .update_actuator_volumes(&mut self.emergency_gen);

        self.blue_circuit.update_actuator_volumes(
            self.left_aileron
                .actuator(AileronActuatorPosition::Outboard),
        );
        self.blue_circuit.update_actuator_volumes(
            self.right_aileron
                .actuator(AileronActuatorPosition::Outboard),
        );

        self.blue_circuit.update_actuator_volumes(
            self.left_elevator
                .actuator(ElevatorActuatorPosition::Outboard),
        );
        self.blue_circuit.update_actuator_volumes(
            self.right_elevator
                .actuator(ElevatorActuatorPosition::Outboard),
        );

        self.blue_circuit
            .update_actuator_volumes(self.rudder.actuator(RudderActuatorPosition::Blue));

        self.blue_circuit
            .update_actuator_volumes(self.left_spoilers.actuator(2));

        self.blue_circuit
            .update_actuator_volumes(self.right_spoilers.actuator(2));
    }

    // All the core hydraulics updates that needs to be done at the slowest fixed step rate
    fn update_core_hydraulics(
        &mut self,
        context: &UpdateContext,
        engine1: &impl Engine,
        engine2: &impl Engine,
        overhead_panel: &A320HydraulicOverheadPanel,
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        lgciu1: &impl LgciuSensors,
        lgciu2: &impl LgciuSensors,
        reservoir_pneumatics: &impl ReservoirAirPressure,
    ) {
        // First update what is currently consumed and given back by each actuator
        // Todo: might have to split the actuator volumes by expected number of loops
        self.update_actuators_volume();

        self.power_transfer_unit_controller.update(
            context,
            overhead_panel,
            &self.forward_cargo_door_controller,
            &self.aft_cargo_door_controller,
            &self.pushback_tug,
            lgciu2,
            self.green_circuit.reservoir(),
            self.yellow_circuit.reservoir(),
        );
        self.power_transfer_unit.update(
            context,
            self.green_circuit.system_section(),
            self.yellow_circuit.system_section(),
            &self.power_transfer_unit_controller,
        );

        self.engine_driven_pump_1_controller.update(
            overhead_panel,
            engine_fire_push_buttons,
            engine1,
            self.green_circuit
                .pump_section(A320HydraulicCircuitFactory::GREEN_ENGINE_PUMP_INDEX),
            lgciu1,
            self.green_circuit.reservoir(),
        );

        self.engine_driven_pump_1.update(
            context,
            self.green_circuit
                .pump_section(A320HydraulicCircuitFactory::GREEN_ENGINE_PUMP_INDEX),
            self.green_circuit.reservoir(),
            engine1.hydraulic_pump_output_speed(),
            &self.engine_driven_pump_1_controller,
        );

        self.engine_driven_pump_2_controller.update(
            overhead_panel,
            engine_fire_push_buttons,
            engine2,
            self.yellow_circuit
                .pump_section(A320HydraulicCircuitFactory::YELLOW_ENGINE_PUMP_INDEX),
            lgciu2,
            self.yellow_circuit.reservoir(),
        );

        self.engine_driven_pump_2.update(
            context,
            self.yellow_circuit
                .pump_section(A320HydraulicCircuitFactory::YELLOW_ENGINE_PUMP_INDEX),
            self.yellow_circuit.reservoir(),
            engine2.hydraulic_pump_output_speed(),
            &self.engine_driven_pump_2_controller,
        );

        self.blue_electric_pump_controller.update(
            overhead_panel,
            self.blue_circuit
                .pump_section(A320HydraulicCircuitFactory::BLUE_ELECTRIC_PUMP_INDEX),
            engine1,
            engine2,
            lgciu1,
            lgciu2,
            self.blue_circuit.reservoir(),
        );
        self.blue_electric_pump.update(
            context,
            self.blue_circuit
                .pump_section(A320HydraulicCircuitFactory::BLUE_ELECTRIC_PUMP_INDEX),
            self.blue_circuit.reservoir(),
            &self.blue_electric_pump_controller,
        );

        self.yellow_electric_pump_controller.update(
            context,
            overhead_panel,
            &self.forward_cargo_door_controller,
            &self.aft_cargo_door_controller,
            self.yellow_circuit.system_section(),
            self.yellow_circuit.reservoir(),
        );
        self.yellow_electric_pump.update(
            context,
            self.yellow_circuit.system_section(),
            self.yellow_circuit.reservoir(),
            &self.yellow_electric_pump_controller,
        );

        self.ram_air_turbine.update(
            context,
            self.blue_circuit.system_section(),
            self.blue_circuit.reservoir(),
            &self.ram_air_turbine_controller,
        );

        self.green_circuit_controller
            .update(engine_fire_push_buttons);
        self.green_circuit.update(
            context,
            &mut vec![&mut self.engine_driven_pump_1],
            None::<&mut ElectricPump>,
            Some(&self.power_transfer_unit),
            &self.green_circuit_controller,
            reservoir_pneumatics.green_reservoir_pressure(),
        );

        self.yellow_circuit_controller
            .update(engine_fire_push_buttons);
        self.yellow_circuit.update(
            context,
            &mut vec![&mut self.engine_driven_pump_2],
            Some(&mut self.yellow_electric_pump),
            Some(&self.power_transfer_unit),
            &self.yellow_circuit_controller,
            reservoir_pneumatics.yellow_reservoir_pressure(),
        );

        self.blue_circuit_controller
            .update(engine_fire_push_buttons);
        self.blue_circuit.update(
            context,
            &mut vec![&mut self.blue_electric_pump],
            Some(&mut self.ram_air_turbine),
            None,
            &self.blue_circuit_controller,
            reservoir_pneumatics.blue_reservoir_pressure(),
        );

        self.braking_circuit_norm.update(
            context,
            self.green_circuit.system_section(),
            self.brake_steer_computer.norm_controller(),
        );
        self.braking_circuit_altn.update(
            context,
            self.yellow_circuit.system_section(),
            self.brake_steer_computer.alternate_controller(),
        );
    }

    // Actual logic of HYD PTU memo computed here until done within FWS
    fn should_show_hyd_ptu_message_on_ecam(&self) -> bool {
        let ptu_valve_ctrol_off = !self.power_transfer_unit_controller.should_enable();
        let green_eng_pump_lo_pr = !self
            .green_circuit
            .pump_section(A320HydraulicCircuitFactory::GREEN_ENGINE_PUMP_INDEX)
            .is_pressure_switch_pressurised();

        let yellow_sys_lo_pr = !self
            .yellow_circuit
            .pump_section(A320HydraulicCircuitFactory::YELLOW_ENGINE_PUMP_INDEX)
            .is_pressure_switch_pressurised();

        let yellow_sys_press_above_1450 =
            self.yellow_circuit.system_pressure() > Pressure::new::<psi>(1450.);

        let green_sys_press_above_1450 =
            self.green_circuit.system_pressure() > Pressure::new::<psi>(1450.);

        let green_sys_lo_pr = !self
            .green_circuit
            .pump_section(A320HydraulicCircuitFactory::GREEN_ENGINE_PUMP_INDEX)
            .is_pressure_switch_pressurised();

        let yellow_eng_pump_lo_pr = !self
            .yellow_circuit
            .pump_section(A320HydraulicCircuitFactory::YELLOW_ENGINE_PUMP_INDEX)
            .is_pressure_switch_pressurised();

        let yellow_elec_pump_on = self.yellow_electric_pump_controller.should_pressurise();

        let yellow_pump_state = yellow_eng_pump_lo_pr && !yellow_elec_pump_on;

        let yellow_press_node = yellow_sys_press_above_1450 || !yellow_sys_lo_pr;
        let green_press_node = green_sys_press_above_1450 || !green_sys_lo_pr;

        let yellow_side_and = green_eng_pump_lo_pr && yellow_press_node && green_press_node;
        let green_side_and = yellow_press_node && green_press_node && yellow_pump_state;

        !ptu_valve_ctrol_off && (yellow_side_and || green_side_and)
    }

    // Function dedicated to sound so it triggers the high pitch PTU sound on specific PTU conditions
    fn is_ptu_running_high_pitch_sound(&self) -> bool {
        let is_ptu_rotating = self.power_transfer_unit.is_active_left_to_right()
            || self.power_transfer_unit.is_active_right_to_left();

        let absolute_delta_pressure =
            (self.green_circuit.system_pressure() - self.yellow_circuit.system_pressure()).abs();

        absolute_delta_pressure
            > Pressure::new::<psi>(Self::HIGH_PITCH_PTU_SOUND_DELTA_PRESS_THRESHOLD_PSI)
            && is_ptu_rotating
    }
}
impl SimulationElement for A320Hydraulic {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.engine_driven_pump_1.accept(visitor);
        self.engine_driven_pump_1_controller.accept(visitor);

        self.engine_driven_pump_2.accept(visitor);
        self.engine_driven_pump_2_controller.accept(visitor);

        self.blue_electric_pump.accept(visitor);
        self.blue_electric_pump_controller.accept(visitor);

        self.yellow_electric_pump.accept(visitor);
        self.yellow_electric_pump_controller.accept(visitor);

        self.forward_cargo_door_controller.accept(visitor);
        self.forward_cargo_door.accept(visitor);

        self.aft_cargo_door_controller.accept(visitor);
        self.aft_cargo_door.accept(visitor);

        self.pushback_tug.accept(visitor);

        self.ram_air_turbine.accept(visitor);
        self.ram_air_turbine_controller.accept(visitor);

        self.power_transfer_unit.accept(visitor);
        self.power_transfer_unit_controller.accept(visitor);

        self.blue_circuit.accept(visitor);
        self.green_circuit.accept(visitor);
        self.yellow_circuit.accept(visitor);

        self.brake_steer_computer.accept(visitor);

        self.braking_circuit_norm.accept(visitor);
        self.braking_circuit_altn.accept(visitor);
        self.braking_force.accept(visitor);

        self.emergency_gen.accept(visitor);
        self.nose_steering.accept(visitor);
        self.slats_flaps_complex.accept(visitor);
        self.flap_system.accept(visitor);
        self.slat_system.accept(visitor);

        self.elac_computer.accept(visitor);
        self.left_aileron.accept(visitor);
        self.right_aileron.accept(visitor);
        self.left_elevator.accept(visitor);
        self.right_elevator.accept(visitor);

        self.fac_computer.accept(visitor);
        self.rudder.accept(visitor);

        self.spoiler_computer.accept(visitor);
        self.left_spoilers.accept(visitor);
        self.right_spoilers.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.hyd_ptu_ecam_memo_id,
            self.should_show_hyd_ptu_message_on_ecam(),
        );

        writer.write(
            &self.ptu_high_pitch_sound_id,
            self.is_ptu_running_high_pitch_sound(),
        );
    }
}
impl HydraulicGeneratorControlUnit for A320Hydraulic {
    fn max_allowed_power(&self) -> Power {
        self.gcu.max_allowed_power()
    }

    fn motor_speed(&self) -> AngularVelocity {
        self.gcu.motor_speed()
    }
}

struct A320HydraulicCircuitController {
    engine_number: Option<usize>,
    should_open_fire_shutoff_valve: bool,
}
impl A320HydraulicCircuitController {
    fn new(engine_number: Option<usize>) -> Self {
        Self {
            engine_number,
            should_open_fire_shutoff_valve: true,
        }
    }

    fn update<T: EngineFirePushButtons>(&mut self, engine_fire_push_buttons: &T) {
        if let Some(eng_number) = self.engine_number {
            self.should_open_fire_shutoff_valve = !engine_fire_push_buttons.is_released(eng_number);
        }
    }
}
impl HydraulicCircuitController for A320HydraulicCircuitController {
    fn should_open_fire_shutoff_valve(&self, _: usize) -> bool {
        // A320 only has one main pump per pump section thus index not useful
        self.should_open_fire_shutoff_valve
    }
}

struct A320EngineDrivenPumpController {
    green_pump_low_press_id: VariableIdentifier,
    yellow_pump_low_press_id: VariableIdentifier,

    is_powered: bool,
    powered_by: Vec<ElectricalBusType>,
    engine_number: usize,
    should_pressurise: bool,
    has_pressure_low_fault: bool,
    has_air_pressure_low_fault: bool,
    has_low_level_fault: bool,
    is_pressure_low: bool,
}
impl A320EngineDrivenPumpController {
    fn new(
        context: &mut InitContext,
        engine_number: usize,
        powered_by: Vec<ElectricalBusType>,
    ) -> Self {
        Self {
            green_pump_low_press_id: context
                .get_identifier("HYD_GREEN_EDPUMP_LOW_PRESS".to_owned()),
            yellow_pump_low_press_id: context
                .get_identifier("HYD_YELLOW_EDPUMP_LOW_PRESS".to_owned()),

            is_powered: false,
            powered_by,
            engine_number,
            should_pressurise: true,

            has_pressure_low_fault: false,
            has_air_pressure_low_fault: false,
            has_low_level_fault: false,

            is_pressure_low: true,
        }
    }

    fn update_low_pressure(
        &mut self,
        engine: &impl Engine,
        section: &impl SectionPressure,
        lgciu: &impl LgciuSensors,
    ) {
        self.is_pressure_low =
            self.should_pressurise() && !section.is_pressure_switch_pressurised();

        // Fault inhibited if on ground AND engine oil pressure is low (11KS1 elec relay)
        self.has_pressure_low_fault = self.is_pressure_low
            && (!engine.oil_pressure_is_low()
                || !(lgciu.right_gear_compressed(false) && lgciu.left_gear_compressed(false)));
    }

    fn update_low_air_pressure(
        &mut self,
        reservoir: &Reservoir,
        overhead_panel: &A320HydraulicOverheadPanel,
    ) {
        self.has_air_pressure_low_fault = reservoir.is_low_air_pressure()
            && overhead_panel.edp_push_button_is_auto(self.engine_number);
    }

    fn update_low_level(
        &mut self,
        reservoir: &Reservoir,
        overhead_panel: &A320HydraulicOverheadPanel,
    ) {
        self.has_low_level_fault =
            reservoir.is_low_level() && overhead_panel.edp_push_button_is_auto(self.engine_number);
    }

    fn update<T: EngineFirePushButtons>(
        &mut self,
        overhead_panel: &A320HydraulicOverheadPanel,
        engine_fire_push_buttons: &T,
        engine: &impl Engine,
        section: &impl SectionPressure,
        lgciu: &impl LgciuSensors,
        reservoir: &Reservoir,
    ) {
        let mut should_pressurise_if_powered = false;
        if overhead_panel.edp_push_button_is_auto(self.engine_number)
            && !engine_fire_push_buttons.is_released(self.engine_number)
        {
            should_pressurise_if_powered = true;
        } else if overhead_panel.edp_push_button_is_off(self.engine_number)
            || engine_fire_push_buttons.is_released(self.engine_number)
        {
            should_pressurise_if_powered = false;
        }

        // Inverted logic, no power means solenoid valve always leave pump in pressurise mode
        self.should_pressurise = !self.is_powered || should_pressurise_if_powered;

        self.update_low_pressure(engine, section, lgciu);

        self.update_low_air_pressure(reservoir, overhead_panel);

        self.update_low_level(reservoir, overhead_panel);
    }

    fn has_pressure_low_fault(&self) -> bool {
        self.has_pressure_low_fault
    }

    fn has_air_pressure_low_fault(&self) -> bool {
        self.has_air_pressure_low_fault
    }

    fn has_low_level_fault(&self) -> bool {
        self.has_low_level_fault
    }
}
impl PumpController for A320EngineDrivenPumpController {
    fn should_pressurise(&self) -> bool {
        self.should_pressurise
    }
}
impl SimulationElement for A320EngineDrivenPumpController {
    fn write(&self, writer: &mut SimulatorWriter) {
        if self.engine_number == 1 {
            writer.write(&self.green_pump_low_press_id, self.is_pressure_low);
        } else if self.engine_number == 2 {
            writer.write(&self.yellow_pump_low_press_id, self.is_pressure_low);
        } else {
            panic!("The A320 only supports two engines.");
        }
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.any_is_powered(&self.powered_by);
    }
}

struct A320BlueElectricPumpController {
    low_press_id: VariableIdentifier,

    is_powered: bool,
    powered_by: ElectricalBusType,
    should_pressurise: bool,
    has_pressure_low_fault: bool,
    has_air_pressure_low_fault: bool,
    has_low_level_fault: bool,
    is_pressure_low: bool,
}
impl A320BlueElectricPumpController {
    fn new(context: &mut InitContext, powered_by: ElectricalBusType) -> Self {
        Self {
            low_press_id: context.get_identifier("HYD_BLUE_EPUMP_LOW_PRESS".to_owned()),

            is_powered: false,
            powered_by,
            should_pressurise: false,

            has_pressure_low_fault: false,
            has_air_pressure_low_fault: false,
            has_low_level_fault: false,

            is_pressure_low: true,
        }
    }

    fn update(
        &mut self,
        overhead_panel: &A320HydraulicOverheadPanel,
        section: &impl SectionPressure,
        engine1: &impl Engine,
        engine2: &impl Engine,
        lgciu1: &impl LgciuSensors,
        lgciu2: &impl LgciuSensors,
        reservoir: &Reservoir,
    ) {
        let mut should_pressurise_if_powered = false;
        if overhead_panel.blue_epump_push_button.is_auto() {
            if !lgciu1.nose_gear_compressed(false)
                || engine1.is_above_minimum_idle()
                || engine2.is_above_minimum_idle()
                || overhead_panel.blue_epump_override_push_button_is_on()
            {
                should_pressurise_if_powered = true;
            } else {
                should_pressurise_if_powered = false;
            }
        } else if overhead_panel.blue_epump_push_button_is_off() {
            should_pressurise_if_powered = false;
        }

        self.should_pressurise = self.is_powered && should_pressurise_if_powered;

        self.update_low_pressure(overhead_panel, section, engine1, engine2, lgciu1, lgciu2);

        self.update_low_air_pressure(reservoir, overhead_panel);

        self.update_low_level(reservoir, overhead_panel);
    }

    fn update_low_pressure(
        &mut self,
        overhead_panel: &A320HydraulicOverheadPanel,
        section: &impl SectionPressure,
        engine1: &impl Engine,
        engine2: &impl Engine,
        lgciu1: &impl LgciuSensors,
        lgciu2: &impl LgciuSensors,
    ) {
        let is_both_engine_low_oil_pressure =
            engine1.oil_pressure_is_low() && engine2.oil_pressure_is_low();

        self.is_pressure_low =
            self.should_pressurise() && !section.is_pressure_switch_pressurised();

        self.has_pressure_low_fault = self.is_pressure_low
            && (!is_both_engine_low_oil_pressure
                || (!(lgciu1.left_gear_compressed(false) && lgciu1.right_gear_compressed(false))
                    || !(lgciu2.left_gear_compressed(false)
                        && lgciu2.right_gear_compressed(false)))
                || overhead_panel.blue_epump_override_push_button_is_on());
    }

    fn update_low_air_pressure(
        &mut self,
        reservoir: &Reservoir,
        overhead_panel: &A320HydraulicOverheadPanel,
    ) {
        self.has_air_pressure_low_fault =
            reservoir.is_low_air_pressure() && !overhead_panel.blue_epump_push_button_is_off();
    }

    fn update_low_level(
        &mut self,
        reservoir: &Reservoir,
        overhead_panel: &A320HydraulicOverheadPanel,
    ) {
        self.has_low_level_fault =
            reservoir.is_low_level() && !overhead_panel.blue_epump_push_button_is_off();
    }

    fn has_pressure_low_fault(&self) -> bool {
        self.has_pressure_low_fault
    }

    fn has_air_pressure_low_fault(&self) -> bool {
        self.has_air_pressure_low_fault
    }

    fn has_low_level_fault(&self) -> bool {
        self.has_low_level_fault
    }
}

impl PumpController for A320BlueElectricPumpController {
    fn should_pressurise(&self) -> bool {
        self.should_pressurise
    }
}

impl SimulationElement for A320BlueElectricPumpController {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.low_press_id, self.is_pressure_low);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by);
    }
}

struct A320YellowElectricPumpController {
    low_press_id: VariableIdentifier,

    is_powered: bool,
    powered_by: ElectricalBusType,
    powered_by_when_cargo_door_operation: ElectricalBusType,
    should_pressurise: bool,
    has_pressure_low_fault: bool,
    has_air_pressure_low_fault: bool,
    has_low_level_fault: bool,
    is_pressure_low: bool,
    should_activate_yellow_pump_for_cargo_door_operation: DelayedFalseLogicGate,
}
impl A320YellowElectricPumpController {
    const DURATION_OF_YELLOW_PUMP_ACTIVATION_AFTER_CARGO_DOOR_OPERATION: Duration =
        Duration::from_secs(20);

    fn new(
        context: &mut InitContext,
        powered_by: ElectricalBusType,
        powered_by_when_cargo_door_operation: ElectricalBusType,
    ) -> Self {
        Self {
            low_press_id: context.get_identifier("HYD_YELLOW_EPUMP_LOW_PRESS".to_owned()),

            is_powered: false,
            powered_by,
            powered_by_when_cargo_door_operation,
            should_pressurise: false,

            has_pressure_low_fault: false,
            has_air_pressure_low_fault: false,
            has_low_level_fault: false,

            is_pressure_low: true,
            should_activate_yellow_pump_for_cargo_door_operation: DelayedFalseLogicGate::new(
                Self::DURATION_OF_YELLOW_PUMP_ACTIVATION_AFTER_CARGO_DOOR_OPERATION,
            ),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        overhead_panel: &A320HydraulicOverheadPanel,
        forward_cargo_door_controller: &A320DoorController,
        aft_cargo_door_controller: &A320DoorController,
        section: &impl SectionPressure,
        reservoir: &Reservoir,
    ) {
        self.should_activate_yellow_pump_for_cargo_door_operation
            .update(
                context,
                forward_cargo_door_controller.should_pressurise_hydraulics()
                    || aft_cargo_door_controller.should_pressurise_hydraulics(),
            );

        self.should_pressurise = (overhead_panel.yellow_epump_push_button.is_on()
            || self
                .should_activate_yellow_pump_for_cargo_door_operation
                .output())
            && self.is_powered;

        self.update_low_pressure(section);

        self.update_low_air_pressure(reservoir, overhead_panel);

        self.update_low_level(reservoir, overhead_panel);
    }

    fn update_low_pressure(&mut self, section: &impl SectionPressure) {
        self.is_pressure_low =
            self.should_pressurise() && !section.is_pressure_switch_pressurised();

        self.has_pressure_low_fault = self.is_pressure_low;
    }

    fn update_low_air_pressure(
        &mut self,
        reservoir: &Reservoir,
        overhead_panel: &A320HydraulicOverheadPanel,
    ) {
        self.has_air_pressure_low_fault =
            reservoir.is_low_air_pressure() && !overhead_panel.yellow_epump_push_button_is_auto();
    }

    fn update_low_level(
        &mut self,
        reservoir: &Reservoir,
        overhead_panel: &A320HydraulicOverheadPanel,
    ) {
        self.has_low_level_fault =
            reservoir.is_low_level() && !overhead_panel.yellow_epump_push_button_is_auto();
    }

    fn has_pressure_low_fault(&self) -> bool {
        self.has_pressure_low_fault
    }

    fn has_air_pressure_low_fault(&self) -> bool {
        self.has_air_pressure_low_fault
    }

    fn has_low_level_fault(&self) -> bool {
        self.has_low_level_fault
    }

    #[cfg(test)]
    fn should_pressurise_for_cargo_door_operation(&self) -> bool {
        self.should_activate_yellow_pump_for_cargo_door_operation
            .output()
    }
}
impl PumpController for A320YellowElectricPumpController {
    fn should_pressurise(&self) -> bool {
        self.should_pressurise
    }
}
impl SimulationElement for A320YellowElectricPumpController {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.low_press_id, self.is_pressure_low);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        // Control of the pump is powered by dedicated bus OR manual operation of cargo door through another bus
        self.is_powered = buses.is_powered(self.powered_by)
            || (self
                .should_activate_yellow_pump_for_cargo_door_operation
                .output()
                && buses.is_powered(self.powered_by_when_cargo_door_operation))
    }
}

struct A320PowerTransferUnitController {
    park_brake_lever_pos_id: VariableIdentifier,
    general_eng_1_starter_active_id: VariableIdentifier,
    general_eng_2_starter_active_id: VariableIdentifier,

    is_powered: bool,
    powered_by: ElectricalBusType,
    should_enable: bool,
    should_inhibit_ptu_after_cargo_door_operation: DelayedFalseLogicGate,

    parking_brake_lever_pos: bool,
    eng_1_master_on: bool,
    eng_2_master_on: bool,

    has_air_pressure_low_fault: bool,
    has_low_level_fault: bool,
}
impl A320PowerTransferUnitController {
    const DURATION_OF_PTU_INHIBIT_AFTER_CARGO_DOOR_OPERATION: Duration = Duration::from_secs(40);

    fn new(context: &mut InitContext, powered_by: ElectricalBusType) -> Self {
        Self {
            park_brake_lever_pos_id: context.get_identifier("PARK_BRAKE_LEVER_POS".to_owned()),
            general_eng_1_starter_active_id: context
                .get_identifier("GENERAL ENG STARTER ACTIVE:1".to_owned()),
            general_eng_2_starter_active_id: context
                .get_identifier("GENERAL ENG STARTER ACTIVE:2".to_owned()),

            is_powered: false,
            powered_by,
            should_enable: false,
            should_inhibit_ptu_after_cargo_door_operation: DelayedFalseLogicGate::new(
                Self::DURATION_OF_PTU_INHIBIT_AFTER_CARGO_DOOR_OPERATION,
            ),

            parking_brake_lever_pos: false,
            eng_1_master_on: false,
            eng_2_master_on: false,

            has_air_pressure_low_fault: false,
            has_low_level_fault: false,
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        overhead_panel: &A320HydraulicOverheadPanel,
        forward_cargo_door_controller: &A320DoorController,
        aft_cargo_door_controller: &A320DoorController,
        pushback_tug: &PushbackTug,
        lgciu2: &impl LgciuSensors,
        reservoir_left_side: &Reservoir,
        reservoir_right_side: &Reservoir,
    ) {
        self.should_inhibit_ptu_after_cargo_door_operation.update(
            context,
            forward_cargo_door_controller.should_pressurise_hydraulics()
                || aft_cargo_door_controller.should_pressurise_hydraulics(),
        );

        let ptu_inhibited = self.should_inhibit_ptu_after_cargo_door_operation.output()
            && overhead_panel.yellow_epump_push_button_is_auto();

        let should_enable_if_powered = overhead_panel.ptu_push_button_is_auto()
            && (!lgciu2.nose_gear_compressed(false)
                || self.eng_1_master_on && self.eng_2_master_on
                || !self.eng_1_master_on && !self.eng_2_master_on
                || (!self.parking_brake_lever_pos
                    && !pushback_tug.is_nose_wheel_steering_pin_inserted()))
            && !ptu_inhibited;

        // When there is no power, the PTU is always ON.
        self.should_enable = !self.is_powered || should_enable_if_powered;

        self.update_low_air_pressure(reservoir_left_side, reservoir_right_side, overhead_panel);

        self.update_low_level(reservoir_left_side, reservoir_right_side, overhead_panel);
    }

    fn update_low_air_pressure(
        &mut self,
        reservoir_left_side: &Reservoir,
        reservoir_right_side: &Reservoir,
        overhead_panel: &A320HydraulicOverheadPanel,
    ) {
        self.has_air_pressure_low_fault = (reservoir_left_side.is_low_air_pressure()
            || reservoir_right_side.is_low_air_pressure())
            && overhead_panel.ptu_push_button_is_auto();
    }

    fn update_low_level(
        &mut self,
        reservoir_left_side: &Reservoir,
        reservoir_right_side: &Reservoir,
        overhead_panel: &A320HydraulicOverheadPanel,
    ) {
        self.has_low_level_fault = (reservoir_left_side.is_low_level()
            || reservoir_right_side.is_low_level())
            && overhead_panel.ptu_push_button_is_auto();
    }

    fn has_air_pressure_low_fault(&self) -> bool {
        self.has_air_pressure_low_fault
    }

    fn has_low_level_fault(&self) -> bool {
        self.has_low_level_fault
    }
}
impl PowerTransferUnitController for A320PowerTransferUnitController {
    fn should_enable(&self) -> bool {
        self.should_enable
    }
}
impl SimulationElement for A320PowerTransferUnitController {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.parking_brake_lever_pos = reader.read(&self.park_brake_lever_pos_id);
        self.eng_1_master_on = reader.read(&self.general_eng_1_starter_active_id);
        self.eng_2_master_on = reader.read(&self.general_eng_2_starter_active_id);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by);
    }
}

struct A320RamAirTurbineController {
    is_solenoid_1_powered: bool,
    solenoid_1_bus: ElectricalBusType,

    is_solenoid_2_powered: bool,
    solenoid_2_bus: ElectricalBusType,

    should_deploy: bool,
}
impl A320RamAirTurbineController {
    fn new(solenoid_1_bus: ElectricalBusType, solenoid_2_bus: ElectricalBusType) -> Self {
        Self {
            is_solenoid_1_powered: false,
            solenoid_1_bus,

            is_solenoid_2_powered: false,
            solenoid_2_bus,

            should_deploy: false,
        }
    }

    fn update(
        &mut self,
        overhead_panel: &A320HydraulicOverheadPanel,
        rat_and_emer_gen_man_on: &impl EmergencyElectricalRatPushButton,
        emergency_elec_state: &impl EmergencyElectricalState,
    ) {
        let solenoid_1_should_trigger_deployment_if_powered =
            overhead_panel.rat_man_on_push_button_is_pressed();

        let solenoid_2_should_trigger_deployment_if_powered =
            emergency_elec_state.is_in_emergency_elec() || rat_and_emer_gen_man_on.is_pressed();

        self.should_deploy = (self.is_solenoid_1_powered
            && solenoid_1_should_trigger_deployment_if_powered)
            || (self.is_solenoid_2_powered && solenoid_2_should_trigger_deployment_if_powered);
    }
}
impl RamAirTurbineController for A320RamAirTurbineController {
    fn should_deploy(&self) -> bool {
        self.should_deploy
    }
}
impl SimulationElement for A320RamAirTurbineController {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_solenoid_1_powered = buses.is_powered(self.solenoid_1_bus);
        self.is_solenoid_2_powered = buses.is_powered(self.solenoid_2_bus);
    }
}

struct A320BrakeSystemOutputs {
    left_demand: Ratio,
    right_demand: Ratio,
    pressure_limit: Pressure,
}
impl A320BrakeSystemOutputs {
    fn new() -> Self {
        Self {
            left_demand: Ratio::new::<ratio>(0.),
            right_demand: Ratio::new::<ratio>(0.),
            pressure_limit: Pressure::new::<psi>(3000.),
        }
    }

    fn set_pressure_limit(&mut self, pressure_limit: Pressure) {
        self.pressure_limit = pressure_limit;
    }

    fn set_brake_demands(&mut self, left_demand: Ratio, right_demand: Ratio) {
        self.left_demand = left_demand
            .min(Ratio::new::<ratio>(1.))
            .max(Ratio::new::<ratio>(0.));
        self.right_demand = right_demand
            .min(Ratio::new::<ratio>(1.))
            .max(Ratio::new::<ratio>(0.));
    }

    fn set_no_demands(&mut self) {
        self.left_demand = Ratio::new::<ratio>(0.);
        self.right_demand = Ratio::new::<ratio>(0.);
    }

    fn set_max_demands(&mut self) {
        self.left_demand = Ratio::new::<ratio>(1.);
        self.right_demand = Ratio::new::<ratio>(1.);
    }

    fn left_demand(&self) -> Ratio {
        self.left_demand
    }

    fn right_demand(&self) -> Ratio {
        self.right_demand
    }
}
impl BrakeCircuitController for A320BrakeSystemOutputs {
    fn pressure_limit(&self) -> Pressure {
        self.pressure_limit
    }

    fn left_brake_demand(&self) -> Ratio {
        self.left_demand
    }

    fn right_brake_demand(&self) -> Ratio {
        self.right_demand
    }
}

struct A320HydraulicBrakeSteerComputerUnit {
    park_brake_lever_pos_id: VariableIdentifier,
    gear_handle_position_id: VariableIdentifier,
    antiskid_brakes_active_id: VariableIdentifier,
    left_brake_pedal_input_id: VariableIdentifier,
    right_brake_pedal_input_id: VariableIdentifier,

    ground_speed_id: VariableIdentifier,

    rudder_pedal_input_id: VariableIdentifier,
    tiller_handle_input_id: VariableIdentifier,
    tiller_pedal_disconnect_id: VariableIdentifier,
    autopilot_nosewheel_demand_id: VariableIdentifier,

    autobrake_controller: A320AutobrakeController,
    parking_brake_demand: bool,
    is_gear_lever_down: bool,
    left_brake_pilot_input: Ratio,
    right_brake_pilot_input: Ratio,

    norm_brake_outputs: A320BrakeSystemOutputs,
    alternate_brake_outputs: A320BrakeSystemOutputs,

    normal_brakes_available: bool,
    should_disable_auto_brake_when_retracting: DelayedTrueLogicGate,
    anti_skid_activated: bool,

    tiller_pedal_disconnect: bool,
    tiller_handle_position: Ratio,
    rudder_pedal_position: Ratio,
    autopilot_nosewheel_demand: Ratio,

    pedal_steering_limiter: SteeringAngleLimiter<5>,
    pedal_input_map: SteeringRatioToAngle<6>,
    tiller_steering_limiter: SteeringAngleLimiter<5>,
    tiller_input_map: SteeringRatioToAngle<6>,
    final_steering_position_request: Angle,

    ground_speed: Velocity,
}
impl A320HydraulicBrakeSteerComputerUnit {
    const RUDDER_PEDAL_INPUT_GAIN: f64 = 32.;
    const RUDDER_PEDAL_INPUT_MAP: [f64; 6] = [0., 1., 2., 32., 32., 32.];
    const RUDDER_PEDAL_INPUT_CURVE_MAP: [f64; 6] = [0., 0., 2., 6.4, 6.4, 6.4];
    const MAX_RUDDER_INPUT_INCLUDING_AUTOPILOT_DEGREE: f64 = 6.;

    const SPEED_MAP_FOR_PEDAL_ACTION_KNOT: [f64; 5] = [0., 40., 130., 1500.0, 2800.0];
    const STEERING_ANGLE_FOR_PEDAL_ACTION_DEGREE: [f64; 5] = [1., 1., 0., 0., 0.];

    const TILLER_INPUT_GAIN: f64 = 75.;
    const TILLER_INPUT_MAP: [f64; 6] = [0., 1., 20., 40., 66., 75.];
    const TILLER_INPUT_CURVE_MAP: [f64; 6] = [0., 0., 4., 15., 45., 74.];

    const AUTOPILOT_STEERING_INPUT_GAIN: f64 = 6.;

    const SPEED_MAP_FOR_TILLER_ACTION_KNOT: [f64; 5] = [0., 20., 70., 1500.0, 2800.0];
    const STEERING_ANGLE_FOR_TILLER_ACTION_DEGREE: [f64; 5] = [1., 1., 0., 0., 0.];

    const MAX_STEERING_ANGLE_DEMAND_DEGREES: f64 = 74.;

    // Minimum pressure hysteresis on green until main switched on ALTN brakes
    // Feedback by Cpt. Chaos — 25/04/2021 #pilot-feedback
    const MIN_PRESSURE_BRAKE_ALTN_HYST_LO: f64 = 1305.;
    const MIN_PRESSURE_BRAKE_ALTN_HYST_HI: f64 = 2176.;

    // Min pressure when parking brake enabled. Lower normal braking is allowed to use pilot input as emergency braking
    // Feedback by avteknisyan — 25/04/2021 #pilot-feedback
    const MIN_PRESSURE_PARK_BRAKE_EMERGENCY: f64 = 507.;

    const AUTOBRAKE_GEAR_RETRACTION_DURATION_S: f64 = 3.;

    const PILOT_INPUT_DETECTION_TRESHOLD: f64 = 0.2;

    fn new(context: &mut InitContext) -> Self {
        Self {
            park_brake_lever_pos_id: context.get_identifier("PARK_BRAKE_LEVER_POS".to_owned()),
            gear_handle_position_id: context.get_identifier("GEAR HANDLE POSITION".to_owned()),
            antiskid_brakes_active_id: context.get_identifier("ANTISKID BRAKES ACTIVE".to_owned()),
            left_brake_pedal_input_id: context.get_identifier("LEFT_BRAKE_PEDAL_INPUT".to_owned()),
            right_brake_pedal_input_id: context
                .get_identifier("RIGHT_BRAKE_PEDAL_INPUT".to_owned()),

            ground_speed_id: context.get_identifier("GPS GROUND SPEED".to_owned()),
            rudder_pedal_input_id: context.get_identifier("RUDDER_PEDAL_POSITION_RATIO".to_owned()),
            tiller_handle_input_id: context.get_identifier("TILLER_HANDLE_POSITION".to_owned()),
            tiller_pedal_disconnect_id: context
                .get_identifier("TILLER_PEDAL_DISCONNECT".to_owned()),
            autopilot_nosewheel_demand_id: context
                .get_identifier("AUTOPILOT_NOSEWHEEL_DEMAND".to_owned()),

            autobrake_controller: A320AutobrakeController::new(context),

            // Position of parking brake lever
            parking_brake_demand: true,
            is_gear_lever_down: true,
            left_brake_pilot_input: Ratio::new::<ratio>(0.0),
            right_brake_pilot_input: Ratio::new::<ratio>(0.0),
            norm_brake_outputs: A320BrakeSystemOutputs::new(),
            alternate_brake_outputs: A320BrakeSystemOutputs::new(),
            normal_brakes_available: false,
            should_disable_auto_brake_when_retracting: DelayedTrueLogicGate::new(
                Duration::from_secs_f64(Self::AUTOBRAKE_GEAR_RETRACTION_DURATION_S),
            ),
            anti_skid_activated: true,

            tiller_pedal_disconnect: false,
            tiller_handle_position: Ratio::new::<ratio>(0.),
            rudder_pedal_position: Ratio::new::<ratio>(0.),
            autopilot_nosewheel_demand: Ratio::new::<ratio>(0.),

            pedal_steering_limiter: SteeringAngleLimiter::new(
                Self::SPEED_MAP_FOR_PEDAL_ACTION_KNOT,
                Self::STEERING_ANGLE_FOR_PEDAL_ACTION_DEGREE,
            ),
            pedal_input_map: SteeringRatioToAngle::new(
                Ratio::new::<ratio>(Self::RUDDER_PEDAL_INPUT_GAIN),
                Self::RUDDER_PEDAL_INPUT_MAP,
                Self::RUDDER_PEDAL_INPUT_CURVE_MAP,
            ),
            tiller_steering_limiter: SteeringAngleLimiter::new(
                Self::SPEED_MAP_FOR_TILLER_ACTION_KNOT,
                Self::STEERING_ANGLE_FOR_TILLER_ACTION_DEGREE,
            ),
            tiller_input_map: SteeringRatioToAngle::new(
                Ratio::new::<ratio>(Self::TILLER_INPUT_GAIN),
                Self::TILLER_INPUT_MAP,
                Self::TILLER_INPUT_CURVE_MAP,
            ),
            final_steering_position_request: Angle::new::<degree>(0.),

            ground_speed: Velocity::new::<knot>(0.),
        }
    }

    fn allow_autobrake_arming(&self) -> bool {
        self.anti_skid_activated && self.normal_brakes_available
    }

    fn update_normal_braking_availability(&mut self, normal_braking_circuit_pressure: &Pressure) {
        if normal_braking_circuit_pressure.get::<psi>() > Self::MIN_PRESSURE_BRAKE_ALTN_HYST_HI
            && (self.left_brake_pilot_input.get::<ratio>() < Self::PILOT_INPUT_DETECTION_TRESHOLD
                && self.right_brake_pilot_input.get::<ratio>()
                    < Self::PILOT_INPUT_DETECTION_TRESHOLD)
        {
            self.normal_brakes_available = true;
        } else if normal_braking_circuit_pressure.get::<psi>()
            < Self::MIN_PRESSURE_BRAKE_ALTN_HYST_LO
        {
            self.normal_brakes_available = false;
        }
    }

    fn update_brake_pressure_limitation(&mut self) {
        let yellow_manual_braking_input = self.left_brake_pilot_input
            > self.alternate_brake_outputs.left_demand() + Ratio::new::<ratio>(0.2)
            || self.right_brake_pilot_input
                > self.alternate_brake_outputs.right_demand() + Ratio::new::<ratio>(0.2);

        // Nominal braking from pedals is limited to 2538psi
        self.norm_brake_outputs
            .set_pressure_limit(Pressure::new::<psi>(2538.));

        let alternate_brake_pressure_limit = Pressure::new::<psi>(if self.parking_brake_demand {
            // If no pilot action, standard park brake pressure limit
            if !yellow_manual_braking_input {
                2103.
            } else {
                // Else manual action limited to a higher max nominal pressure
                2538.
            }
        } else if !self.anti_skid_activated {
            1160.
        } else {
            // Else if any manual braking we use standard limit
            2538.
        });

        self.alternate_brake_outputs
            .set_pressure_limit(alternate_brake_pressure_limit);
    }

    /// Updates brakes and nose steering demands
    fn update(
        &mut self,
        context: &UpdateContext,
        green_circuit: &HydraulicCircuit,
        alternate_circuit: &BrakeCircuit,
        lgciu1: &impl LgciuSensors,
        lgciu2: &impl LgciuSensors,
        autobrake_panel: &AutobrakePanel,
        engine1: &impl Engine,
        engine2: &impl Engine,
    ) {
        self.update_steering_demands(lgciu1, engine1, engine2);

        self.update_normal_braking_availability(&green_circuit.system_pressure());
        self.update_brake_pressure_limitation();

        self.autobrake_controller.update(
            context,
            autobrake_panel,
            self.allow_autobrake_arming(),
            self.left_brake_pilot_input,
            self.right_brake_pilot_input,
            lgciu1,
            lgciu2,
        );

        let is_in_flight_gear_lever_up = !(lgciu1.left_and_right_gear_compressed(true)
            || lgciu2.left_and_right_gear_compressed(true)
            || self.is_gear_lever_down);

        self.should_disable_auto_brake_when_retracting.update(
            context,
            !lgciu1.all_down_and_locked() && !self.is_gear_lever_down,
        );

        if is_in_flight_gear_lever_up {
            if self.should_disable_auto_brake_when_retracting.output() {
                self.norm_brake_outputs.set_no_demands();
            } else {
                // Slight brake pressure to stop the spinning wheels (have no pressure data available yet, 0.2 is random one)
                self.norm_brake_outputs
                    .set_brake_demands(Ratio::new::<ratio>(0.2), Ratio::new::<ratio>(0.2));
            }

            self.alternate_brake_outputs.set_no_demands();
        } else {
            let green_used_for_brakes = self.normal_brakes_available
                && self.anti_skid_activated
                && !self.parking_brake_demand;

            if green_used_for_brakes {
                // Final output on normal brakes is max(pilot demand , autobrake demand) to allow pilot override autobrake demand
                self.norm_brake_outputs.set_brake_demands(
                    self.left_brake_pilot_input
                        .max(self.autobrake_controller.brake_output()),
                    self.right_brake_pilot_input
                        .max(self.autobrake_controller.brake_output()),
                );

                self.alternate_brake_outputs.set_no_demands();
            } else {
                self.norm_brake_outputs.set_no_demands();

                if !self.parking_brake_demand {
                    // Normal braking but using alternate circuit
                    self.alternate_brake_outputs.set_brake_demands(
                        self.left_brake_pilot_input,
                        self.right_brake_pilot_input,
                    );
                } else {
                    // Else we just use parking brake
                    self.alternate_brake_outputs.set_max_demands();

                    // Special case: parking brake on but yellow can't provide enough brakes: green are allowed to brake for emergency
                    if alternate_circuit.left_brake_pressure().get::<psi>()
                        < Self::MIN_PRESSURE_PARK_BRAKE_EMERGENCY
                        || alternate_circuit.right_brake_pressure().get::<psi>()
                            < Self::MIN_PRESSURE_PARK_BRAKE_EMERGENCY
                    {
                        self.norm_brake_outputs.set_brake_demands(
                            self.left_brake_pilot_input,
                            self.right_brake_pilot_input,
                        );
                    }
                }
            }
        }
    }

    fn update_steering_demands(
        &mut self,
        lgciu1: &impl LgciuSensors,
        engine1: &impl Engine,
        engine2: &impl Engine,
    ) {
        let steer_angle_from_autopilot = Angle::new::<degree>(
            self.autopilot_nosewheel_demand.get::<ratio>() * Self::AUTOPILOT_STEERING_INPUT_GAIN,
        );

        let steer_angle_from_pedals = if self.tiller_pedal_disconnect {
            Angle::new::<degree>(0.)
        } else {
            self.pedal_input_map
                .angle_demand_from_input_demand(self.rudder_pedal_position)
        };

        // TODO Here ground speed would be probably computed from wheel sensor logic
        let final_steer_rudder_plus_autopilot = self.pedal_steering_limiter.angle_from_speed(
            self.ground_speed,
            (steer_angle_from_pedals + steer_angle_from_autopilot)
                .min(Angle::new::<degree>(
                    Self::MAX_RUDDER_INPUT_INCLUDING_AUTOPILOT_DEGREE,
                ))
                .max(Angle::new::<degree>(
                    -Self::MAX_RUDDER_INPUT_INCLUDING_AUTOPILOT_DEGREE,
                )),
        );

        let steer_angle_from_tiller = self.tiller_steering_limiter.angle_from_speed(
            self.ground_speed,
            self.tiller_input_map
                .angle_demand_from_input_demand(self.tiller_handle_position),
        );

        let is_both_engine_low_oil_pressure =
            engine1.oil_pressure_is_low() && engine2.oil_pressure_is_low();

        self.final_steering_position_request = if !is_both_engine_low_oil_pressure
            && self.anti_skid_activated
            && lgciu1.nose_gear_compressed(false)
        {
            (final_steer_rudder_plus_autopilot + steer_angle_from_tiller)
                .min(Angle::new::<degree>(
                    Self::MAX_STEERING_ANGLE_DEMAND_DEGREES,
                ))
                .max(Angle::new::<degree>(
                    -Self::MAX_STEERING_ANGLE_DEMAND_DEGREES,
                ))
        } else {
            Angle::new::<degree>(0.)
        };
    }

    fn norm_controller(&self) -> &impl BrakeCircuitController {
        &self.norm_brake_outputs
    }

    fn alternate_controller(&self) -> &impl BrakeCircuitController {
        &self.alternate_brake_outputs
    }
}
impl SimulationElement for A320HydraulicBrakeSteerComputerUnit {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.autobrake_controller.accept(visitor);
        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.parking_brake_demand = reader.read(&self.park_brake_lever_pos_id);
        self.is_gear_lever_down = reader.read(&self.gear_handle_position_id);
        self.anti_skid_activated = reader.read(&self.antiskid_brakes_active_id);
        self.left_brake_pilot_input =
            Ratio::new::<percent>(reader.read(&self.left_brake_pedal_input_id));
        self.right_brake_pilot_input =
            Ratio::new::<percent>(reader.read(&self.right_brake_pedal_input_id));

        self.tiller_handle_position =
            Ratio::new::<ratio>(reader.read(&self.tiller_handle_input_id));
        self.rudder_pedal_position = Ratio::new::<ratio>(reader.read(&self.rudder_pedal_input_id));
        self.tiller_pedal_disconnect = reader.read(&self.tiller_pedal_disconnect_id);
        self.ground_speed = reader.read(&self.ground_speed_id);

        self.autopilot_nosewheel_demand =
            Ratio::new::<ratio>(reader.read(&self.autopilot_nosewheel_demand_id));
    }
}
impl SteeringController for A320HydraulicBrakeSteerComputerUnit {
    fn requested_position(&self) -> Angle {
        self.final_steering_position_request
    }
}

struct A320BrakingForce {
    brake_left_force_factor_id: VariableIdentifier,
    brake_right_force_factor_id: VariableIdentifier,
    trailing_edge_flaps_left_percent_id: VariableIdentifier,
    trailing_edge_flaps_right_percent_id: VariableIdentifier,

    left_braking_force: f64,
    right_braking_force: f64,

    flap_position: f64,
}
impl A320BrakingForce {
    const REFERENCE_PRESSURE_FOR_MAX_FORCE: f64 = 2538.;

    const FLAPS_BREAKPOINTS: [f64; 3] = [0., 50., 100.];
    const FLAPS_PENALTY_PERCENT: [f64; 3] = [5., 5., 0.];

    pub fn new(context: &mut InitContext) -> Self {
        A320BrakingForce {
            brake_left_force_factor_id: context
                .get_identifier("BRAKE LEFT FORCE FACTOR".to_owned()),
            brake_right_force_factor_id: context
                .get_identifier("BRAKE RIGHT FORCE FACTOR".to_owned()),
            trailing_edge_flaps_left_percent_id: context
                .get_identifier("LEFT_FLAPS_POSITION_PERCENT".to_owned()),
            trailing_edge_flaps_right_percent_id: context
                .get_identifier("RIGHT_FLAPS_POSITION_PERCENT".to_owned()),

            left_braking_force: 0.,
            right_braking_force: 0.,

            flap_position: 0.,
        }
    }

    pub fn update_forces(
        &mut self,
        context: &UpdateContext,
        norm_brakes: &BrakeCircuit,
        altn_brakes: &BrakeCircuit,
    ) {
        // Base formula for output force is output_force[0:1] = 50 * sqrt(current_pressure) / Max_brake_pressure
        // This formula gives a bit more punch for lower brake pressures (like 1000 psi alternate braking), as linear formula
        // gives really too low brake force for 1000psi

        let left_force_norm = 50. * norm_brakes.left_brake_pressure().get::<psi>().sqrt()
            / Self::REFERENCE_PRESSURE_FOR_MAX_FORCE;
        let left_force_altn = 50. * altn_brakes.left_brake_pressure().get::<psi>().sqrt()
            / Self::REFERENCE_PRESSURE_FOR_MAX_FORCE;
        self.left_braking_force = left_force_norm + left_force_altn;
        self.left_braking_force = self.left_braking_force.max(0.).min(1.);

        let right_force_norm = 50. * norm_brakes.right_brake_pressure().get::<psi>().sqrt()
            / Self::REFERENCE_PRESSURE_FOR_MAX_FORCE;
        let right_force_altn = 50. * altn_brakes.right_brake_pressure().get::<psi>().sqrt()
            / Self::REFERENCE_PRESSURE_FOR_MAX_FORCE;
        self.right_braking_force = right_force_norm + right_force_altn;
        self.right_braking_force = self.right_braking_force.max(0.).min(1.);

        self.correct_with_flaps_state(context);
    }

    fn correct_with_flaps_state(&mut self, context: &UpdateContext) {
        let flap_correction = Ratio::new::<percent>(interpolation(
            &Self::FLAPS_BREAKPOINTS,
            &Self::FLAPS_PENALTY_PERCENT,
            self.flap_position,
        ));

        // Using airspeed with formula 0.1 * sqrt(airspeed) to get a 0 to 1 ratio to use our flap correction
        // This way the less airspeed, the less our correction is used as it is an aerodynamic effect on brakes
        let mut airspeed_corrective_factor =
            0.1 * context.indicated_airspeed().get::<knot>().abs().sqrt();
        airspeed_corrective_factor = airspeed_corrective_factor.min(1.0);

        let final_flaps_correction_with_speed = flap_correction * airspeed_corrective_factor;

        self.left_braking_force = self.left_braking_force
            - (self.left_braking_force * final_flaps_correction_with_speed.get::<ratio>());

        self.right_braking_force = self.right_braking_force
            - (self.right_braking_force * final_flaps_correction_with_speed.get::<ratio>());
    }
}

impl SimulationElement for A320BrakingForce {
    fn write(&self, writer: &mut SimulatorWriter) {
        // BRAKE XXXX FORCE FACTOR is the actual braking force we want the plane to generate in the simulator
        writer.write(&self.brake_left_force_factor_id, self.left_braking_force);
        writer.write(&self.brake_right_force_factor_id, self.right_braking_force);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        let left_flap: f64 = reader.read(&self.trailing_edge_flaps_left_percent_id);
        let right_flap: f64 = reader.read(&self.trailing_edge_flaps_right_percent_id);
        self.flap_position = (left_flap + right_flap) / 2.;
    }
}

#[derive(PartialEq, Clone, Copy)]
enum DoorControlState {
    DownLocked = 0,
    NoControl = 1,
    HydControl = 2,
    UpLocked = 3,
}

struct A320DoorController {
    requested_position_id: VariableIdentifier,

    control_state: DoorControlState,

    position_requested: Ratio,

    duration_in_no_control: Duration,
    duration_in_hyd_control: Duration,

    should_close_valves: bool,
    control_position_request: Ratio,
    should_unlock: bool,
}
impl A320DoorController {
    // Duration which the hydraulic valves sends a open request when request is closing (this is done on real aircraft so uplock can be easily unlocked without friction)
    const UP_CONTROL_TIME_BEFORE_DOWN_CONTROL: Duration = Duration::from_millis(200);

    // Delay from the ground crew unlocking the door to the time they start requiring up movement in control panel
    const DELAY_UNLOCK_TO_HYDRAULIC_CONTROL: Duration = Duration::from_secs(5);

    fn new(context: &mut InitContext, id: &str) -> Self {
        Self {
            requested_position_id: context.get_identifier(format!("{}_DOOR_CARGO_OPEN_REQ", id)),
            control_state: DoorControlState::DownLocked,
            position_requested: Ratio::new::<ratio>(0.),

            duration_in_no_control: Duration::from_secs(0),
            duration_in_hyd_control: Duration::from_secs(0),

            should_close_valves: true,
            control_position_request: Ratio::new::<ratio>(0.),
            should_unlock: false,
        }
    }

    fn update(&mut self, context: &UpdateContext, door: &CargoDoor, current_pressure: Pressure) {
        self.control_state = self.determine_control_state_and_lock_action(door, current_pressure);
        self.update_timers(context);
        self.update_actions_from_state();
    }

    fn update_timers(&mut self, context: &UpdateContext) {
        if self.control_state == DoorControlState::NoControl {
            self.duration_in_no_control += context.delta();
        } else {
            self.duration_in_no_control = Duration::from_secs(0);
        }

        if self.control_state == DoorControlState::HydControl {
            self.duration_in_hyd_control += context.delta();
        } else {
            self.duration_in_hyd_control = Duration::from_secs(0);
        }
    }

    fn update_actions_from_state(&mut self) {
        match self.control_state {
            DoorControlState::DownLocked => {}
            DoorControlState::NoControl => {
                self.should_close_valves = true;
            }
            DoorControlState::HydControl => {
                self.should_close_valves = false;
                self.control_position_request = if self.position_requested > Ratio::new::<ratio>(0.)
                    || self.duration_in_hyd_control < Self::UP_CONTROL_TIME_BEFORE_DOWN_CONTROL
                {
                    Ratio::new::<ratio>(1.0)
                } else {
                    Ratio::new::<ratio>(-0.1)
                }
            }
            DoorControlState::UpLocked => {
                self.should_close_valves = true;
            }
        }
    }

    fn determine_control_state_and_lock_action(
        &mut self,
        door: &CargoDoor,
        current_pressure: Pressure,
    ) -> DoorControlState {
        match self.control_state {
            DoorControlState::DownLocked if self.position_requested > Ratio::new::<ratio>(0.) => {
                self.should_unlock = true;
                DoorControlState::NoControl
            }
            DoorControlState::NoControl
                if self.duration_in_no_control > Self::DELAY_UNLOCK_TO_HYDRAULIC_CONTROL =>
            {
                self.should_unlock = false;
                DoorControlState::HydControl
            }
            DoorControlState::HydControl if door.is_locked() => {
                self.should_unlock = false;
                DoorControlState::DownLocked
            }
            DoorControlState::HydControl
                if door.position() > Ratio::new::<ratio>(0.9)
                    && self.position_requested > Ratio::new::<ratio>(0.5) =>
            {
                self.should_unlock = false;
                DoorControlState::UpLocked
            }
            DoorControlState::UpLocked
                if self.position_requested < Ratio::new::<ratio>(1.)
                    && current_pressure > Pressure::new::<psi>(1000.) =>
            {
                DoorControlState::HydControl
            }
            _ => self.control_state,
        }
    }

    fn should_pressurise_hydraulics(&self) -> bool {
        (self.control_state == DoorControlState::UpLocked
            && self.position_requested < Ratio::new::<ratio>(1.))
            || self.control_state == DoorControlState::HydControl
    }
}
impl HydraulicAssemblyController for A320DoorController {
    fn requested_mode(&self) -> LinearActuatorMode {
        if self.should_close_valves {
            LinearActuatorMode::ClosedValves
        } else {
            LinearActuatorMode::PositionControl
        }
    }

    fn requested_position(&self) -> Ratio {
        self.control_position_request
    }

    fn should_lock(&self) -> bool {
        !self.should_unlock
    }

    fn requested_lock_position(&self) -> Ratio {
        Ratio::new::<ratio>(0.)
    }
}
impl SimulationElement for A320DoorController {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.position_requested = Ratio::new::<ratio>(reader.read(&self.requested_position_id));
    }
}

struct CargoDoor {
    hydraulic_assembly: HydraulicLinearActuatorAssembly<1>,

    position_id: VariableIdentifier,
    locked_id: VariableIdentifier,
    position: Ratio,

    is_locked: bool,

    aerodynamic_model: AerodynamicModel,
}
impl CargoDoor {
    fn new(
        context: &mut InitContext,
        id: &str,
        hydraulic_assembly: HydraulicLinearActuatorAssembly<1>,
        aerodynamic_model: AerodynamicModel,
    ) -> Self {
        Self {
            hydraulic_assembly,
            position_id: context.get_identifier(format!("{}_DOOR_CARGO_POSITION", id)),
            locked_id: context.get_identifier(format!("{}_DOOR_CARGO_LOCKED", id)),

            position: Ratio::new::<ratio>(0.),

            is_locked: true,

            aerodynamic_model,
        }
    }

    fn position(&self) -> Ratio {
        self.position
    }

    fn is_locked(&self) -> bool {
        self.is_locked
    }

    fn actuator(&mut self) -> &mut impl Actuator {
        self.hydraulic_assembly.actuator(0)
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        cargo_door_controller: &impl HydraulicAssemblyController,
        current_pressure: Pressure,
    ) {
        self.aerodynamic_model
            .update_body(context, self.hydraulic_assembly.body());
        self.hydraulic_assembly.update(
            context,
            std::slice::from_ref(cargo_door_controller),
            [current_pressure],
        );

        self.position = self.hydraulic_assembly.position_normalized();
        self.is_locked = self.hydraulic_assembly.is_locked();
    }
}
impl SimulationElement for CargoDoor {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.position_id, self.position());
        writer.write(&self.locked_id, self.is_locked());
    }
}

struct PushbackTug {
    nw_strg_disc_memo_id: VariableIdentifier,
    state_id: VariableIdentifier,
    steer_angle_id: VariableIdentifier,

    steering_angle_raw: Angle,
    steering_angle: LowPassFilter<Angle>,

    // Type of pushback:
    // 0 = Straight
    // 1 = Left
    // 2 = Right
    // 3 = Assumed to be no pushback
    // 4 = might be finishing pushback, to confirm
    state: f64,
    nose_wheel_steering_pin_inserted: DelayedFalseLogicGate,
}
impl PushbackTug {
    const DURATION_AFTER_WHICH_NWS_PIN_IS_REMOVED_AFTER_PUSHBACK: Duration =
        Duration::from_secs(15);

    const STATE_NO_PUSHBACK: f64 = 3.;

    const STEERING_ANGLE_FILTER_TIME_CONSTANT: Duration = Duration::from_millis(1500);

    fn new(context: &mut InitContext) -> Self {
        Self {
            nw_strg_disc_memo_id: context.get_identifier("HYD_NW_STRG_DISC_ECAM_MEMO".to_owned()),
            state_id: context.get_identifier("PUSHBACK STATE".to_owned()),
            steer_angle_id: context.get_identifier("PUSHBACK ANGLE".to_owned()),

            steering_angle_raw: Angle::default(),
            steering_angle: LowPassFilter::new(Self::STEERING_ANGLE_FILTER_TIME_CONSTANT),

            state: Self::STATE_NO_PUSHBACK,
            nose_wheel_steering_pin_inserted: DelayedFalseLogicGate::new(
                Self::DURATION_AFTER_WHICH_NWS_PIN_IS_REMOVED_AFTER_PUSHBACK,
            ),
        }
    }

    fn update(&mut self, context: &UpdateContext) {
        self.nose_wheel_steering_pin_inserted
            .update(context, self.is_pushing());

        if self.is_pushing() {
            self.steering_angle
                .update(context.delta(), self.steering_angle_raw);
        } else {
            self.steering_angle.reset(Angle::default());
        }
    }

    fn is_pushing(&self) -> bool {
        (self.state - PushbackTug::STATE_NO_PUSHBACK).abs() > f64::EPSILON
    }
}
impl Pushback for PushbackTug {
    fn is_nose_wheel_steering_pin_inserted(&self) -> bool {
        self.nose_wheel_steering_pin_inserted.output()
    }

    fn steering_angle(&self) -> Angle {
        self.steering_angle.output()
    }
}
impl SimulationElement for PushbackTug {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.state = reader.read(&self.state_id);

        self.steering_angle_raw = Angle::new::<radian>(reader.read(&self.steer_angle_id));
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.nw_strg_disc_memo_id,
            self.is_nose_wheel_steering_pin_inserted(),
        );
    }
}

/// Autobrake controller computes the state machine of the autobrake logic, and the deceleration target
/// that we expect for the plane
pub struct A320AutobrakeController {
    armed_mode_id: VariableIdentifier,
    decel_light_id: VariableIdentifier,
    spoilers_ground_spoilers_active_id: VariableIdentifier,
    external_disarm_event_id: VariableIdentifier,

    deceleration_governor: AutobrakeDecelerationGovernor,

    target: Acceleration,
    mode: AutobrakeMode,

    arming_is_allowed_by_bcu: bool,
    left_brake_pedal_input: Ratio,
    right_brake_pedal_input: Ratio,

    ground_spoilers_are_deployed: bool,
    last_ground_spoilers_are_deployed: bool,

    should_disarm_after_time_in_flight: DelayedPulseTrueLogicGate,
    should_reject_max_mode_after_time_in_flight: DelayedTrueLogicGate,

    external_disarm_event: bool,
}
impl A320AutobrakeController {
    const DURATION_OF_FLIGHT_TO_DISARM_AUTOBRAKE_SECS: f64 = 10.;

    // Dynamic decel target map versus time for any mode that needs it
    const LOW_MODE_DECEL_PROFILE_ACCEL_MS2: [f64; 4] = [4., 4., 0., -2.];
    const LOW_MODE_DECEL_PROFILE_TIME_S: [f64; 4] = [0., 1.99, 2., 4.5];

    const MED_MODE_DECEL_PROFILE_ACCEL_MS2: [f64; 5] = [4., 4., 0., -2., -3.];
    const MED_MODE_DECEL_PROFILE_TIME_S: [f64; 5] = [0., 1.99, 2., 2.5, 4.];

    const MAX_MODE_DECEL_TARGET_MS2: f64 = -6.;
    const OFF_MODE_DECEL_TARGET_MS2: f64 = 5.;

    const MARGIN_PERCENT_TO_TARGET_TO_SHOW_DECEL_IN_LO_MED: f64 = 80.;
    const TARGET_TO_SHOW_DECEL_IN_MAX_MS2: f64 = -2.7;

    fn new(context: &mut InitContext) -> A320AutobrakeController {
        A320AutobrakeController {
            armed_mode_id: context.get_identifier("AUTOBRAKES_ARMED_MODE".to_owned()),
            decel_light_id: context.get_identifier("AUTOBRAKES_DECEL_LIGHT".to_owned()),
            spoilers_ground_spoilers_active_id: context
                .get_identifier("SPOILERS_GROUND_SPOILERS_ACTIVE".to_owned()),
            external_disarm_event_id: context.get_identifier("AUTOBRAKE_DISARM".to_owned()),

            deceleration_governor: AutobrakeDecelerationGovernor::new(),
            target: Acceleration::new::<meter_per_second_squared>(0.),
            mode: AutobrakeMode::NONE,
            arming_is_allowed_by_bcu: false,
            left_brake_pedal_input: Ratio::new::<percent>(0.),
            right_brake_pedal_input: Ratio::new::<percent>(0.),
            ground_spoilers_are_deployed: false,
            last_ground_spoilers_are_deployed: false,
            should_disarm_after_time_in_flight: DelayedPulseTrueLogicGate::new(
                Duration::from_secs_f64(Self::DURATION_OF_FLIGHT_TO_DISARM_AUTOBRAKE_SECS),
            ),
            should_reject_max_mode_after_time_in_flight: DelayedTrueLogicGate::new(
                Duration::from_secs_f64(Self::DURATION_OF_FLIGHT_TO_DISARM_AUTOBRAKE_SECS),
            ),
            external_disarm_event: false,
        }
    }

    fn spoilers_retracted_during_this_update(&self) -> bool {
        !self.ground_spoilers_are_deployed && self.last_ground_spoilers_are_deployed
    }

    fn brake_output(&self) -> Ratio {
        Ratio::new::<ratio>(self.deceleration_governor.output())
    }

    fn determine_mode(&mut self, autobrake_panel: &AutobrakePanel) -> AutobrakeMode {
        if self.should_disarm() {
            AutobrakeMode::NONE
        } else {
            match autobrake_panel.pressed_mode() {
                Some(mode) if self.mode == mode => AutobrakeMode::NONE,
                Some(mode)
                    if mode != AutobrakeMode::MAX
                        || !self.should_reject_max_mode_after_time_in_flight.output() =>
                {
                    mode
                }
                Some(_) | None => self.mode,
            }
        }
    }

    fn should_engage_deceleration_governor(&self) -> bool {
        self.is_armed() && self.ground_spoilers_are_deployed && !self.should_disarm()
    }

    fn is_armed(&self) -> bool {
        self.mode != AutobrakeMode::NONE
    }

    fn is_decelerating(&self) -> bool {
        match self.mode {
            AutobrakeMode::NONE => false,
            AutobrakeMode::LOW | AutobrakeMode::MED => {
                self.deceleration_demanded()
                    && self
                        .deceleration_governor
                        .is_on_target(Ratio::new::<percent>(
                            Self::MARGIN_PERCENT_TO_TARGET_TO_SHOW_DECEL_IN_LO_MED,
                        ))
            }
            _ => {
                self.deceleration_demanded()
                    && self.deceleration_governor.decelerating_at_or_above_rate(
                        Acceleration::new::<meter_per_second_squared>(
                            Self::TARGET_TO_SHOW_DECEL_IN_MAX_MS2,
                        ),
                    )
            }
        }
    }

    fn deceleration_demanded(&self) -> bool {
        self.deceleration_governor.is_engaged()
            && self.target.get::<meter_per_second_squared>() < 0.
    }

    fn should_disarm_due_to_pedal_input(&self) -> bool {
        match self.mode {
            AutobrakeMode::NONE => false,
            AutobrakeMode::LOW | AutobrakeMode::MED => {
                self.left_brake_pedal_input > Ratio::new::<percent>(53.)
                    || self.right_brake_pedal_input > Ratio::new::<percent>(53.)
                    || (self.left_brake_pedal_input > Ratio::new::<percent>(11.)
                        && self.right_brake_pedal_input > Ratio::new::<percent>(11.))
            }
            AutobrakeMode::MAX => {
                self.left_brake_pedal_input > Ratio::new::<percent>(77.)
                    || self.right_brake_pedal_input > Ratio::new::<percent>(77.)
                    || (self.left_brake_pedal_input > Ratio::new::<percent>(53.)
                        && self.right_brake_pedal_input > Ratio::new::<percent>(53.))
            }
            _ => false,
        }
    }

    fn should_disarm(&self) -> bool {
        (self.deceleration_governor.is_engaged() && self.should_disarm_due_to_pedal_input())
            || !self.arming_is_allowed_by_bcu
            || self.spoilers_retracted_during_this_update()
            || self.should_disarm_after_time_in_flight.output()
            || self.external_disarm_event
    }

    fn calculate_target(&mut self) -> Acceleration {
        Acceleration::new::<meter_per_second_squared>(match self.mode {
            AutobrakeMode::NONE => Self::OFF_MODE_DECEL_TARGET_MS2,
            AutobrakeMode::LOW => interpolation(
                &Self::LOW_MODE_DECEL_PROFILE_TIME_S,
                &Self::LOW_MODE_DECEL_PROFILE_ACCEL_MS2,
                self.deceleration_governor.time_engaged().as_secs_f64(),
            ),
            AutobrakeMode::MED => interpolation(
                &Self::MED_MODE_DECEL_PROFILE_TIME_S,
                &Self::MED_MODE_DECEL_PROFILE_ACCEL_MS2,
                self.deceleration_governor.time_engaged().as_secs_f64(),
            ),
            AutobrakeMode::MAX => Self::MAX_MODE_DECEL_TARGET_MS2,
            _ => Self::OFF_MODE_DECEL_TARGET_MS2,
        })
    }

    fn update_input_conditions(
        &mut self,
        context: &UpdateContext,
        allow_arming: bool,
        pedal_input_left: Ratio,
        pedal_input_right: Ratio,
        lgciu1: &impl LgciuSensors,
        lgciu2: &impl LgciuSensors,
    ) {
        let in_flight_lgciu1 =
            !lgciu1.right_gear_compressed(false) && !lgciu1.left_gear_compressed(false);
        let in_flight_lgciu2 =
            !lgciu2.right_gear_compressed(false) && !lgciu2.left_gear_compressed(false);

        self.should_disarm_after_time_in_flight
            .update(context, in_flight_lgciu1 && in_flight_lgciu2);
        self.should_reject_max_mode_after_time_in_flight
            .update(context, in_flight_lgciu1 && in_flight_lgciu2);

        self.arming_is_allowed_by_bcu = allow_arming;
        self.left_brake_pedal_input = pedal_input_left;
        self.right_brake_pedal_input = pedal_input_right;
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        autobrake_panel: &AutobrakePanel,
        allow_arming: bool,
        pedal_input_left: Ratio,
        pedal_input_right: Ratio,
        lgciu1: &impl LgciuSensors,
        lgciu2: &impl LgciuSensors,
    ) {
        self.update_input_conditions(
            context,
            allow_arming,
            pedal_input_left,
            pedal_input_right,
            lgciu1,
            lgciu2,
        );
        self.mode = self.determine_mode(autobrake_panel);

        self.deceleration_governor
            .engage_when(self.should_engage_deceleration_governor());

        self.target = self.calculate_target();
        self.deceleration_governor.update(context, self.target);
    }
}
impl SimulationElement for A320AutobrakeController {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.armed_mode_id, self.mode as u8 as f64);
        writer.write(&self.decel_light_id, self.is_decelerating());
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.last_ground_spoilers_are_deployed = self.ground_spoilers_are_deployed;
        self.ground_spoilers_are_deployed = reader.read(&self.spoilers_ground_spoilers_active_id);
        self.external_disarm_event = reader.read(&self.external_disarm_event_id);

        // Reading current mode in sim to initialize correct mode if sim changes it (from .FLT files for example)
        self.mode = reader.read_f64(&self.armed_mode_id).into();
    }
}

pub(super) struct A320HydraulicOverheadPanel {
    edp1_push_button: AutoOffFaultPushButton,
    edp2_push_button: AutoOffFaultPushButton,
    blue_epump_push_button: AutoOffFaultPushButton,
    ptu_push_button: AutoOffFaultPushButton,
    rat_push_button: MomentaryPushButton,
    yellow_epump_push_button: AutoOnFaultPushButton,
    blue_epump_override_push_button: MomentaryOnPushButton,
}
impl A320HydraulicOverheadPanel {
    pub(super) fn new(context: &mut InitContext) -> A320HydraulicOverheadPanel {
        A320HydraulicOverheadPanel {
            edp1_push_button: AutoOffFaultPushButton::new_auto(context, "HYD_ENG_1_PUMP"),
            edp2_push_button: AutoOffFaultPushButton::new_auto(context, "HYD_ENG_2_PUMP"),
            blue_epump_push_button: AutoOffFaultPushButton::new_auto(context, "HYD_EPUMPB"),
            ptu_push_button: AutoOffFaultPushButton::new_auto(context, "HYD_PTU"),
            rat_push_button: MomentaryPushButton::new(context, "HYD_RAT_MAN_ON"),
            yellow_epump_push_button: AutoOnFaultPushButton::new_auto(context, "HYD_EPUMPY"),
            blue_epump_override_push_button: MomentaryOnPushButton::new(context, "HYD_EPUMPY_OVRD"),
        }
    }

    fn update_blue_override_state(&mut self) {
        if self.blue_epump_push_button.is_off() {
            self.blue_epump_override_push_button.turn_off();
        }
    }

    pub(super) fn update(&mut self, hyd: &A320Hydraulic) {
        self.edp1_push_button.set_fault(hyd.green_edp_has_fault());
        self.edp2_push_button.set_fault(hyd.yellow_edp_has_fault());
        self.blue_epump_push_button
            .set_fault(hyd.blue_epump_has_fault());
        self.yellow_epump_push_button
            .set_fault(hyd.yellow_epump_has_fault());
        self.ptu_push_button.set_fault(hyd.ptu_has_fault());

        self.update_blue_override_state();
    }

    fn yellow_epump_push_button_is_auto(&self) -> bool {
        self.yellow_epump_push_button.is_auto()
    }

    fn ptu_push_button_is_auto(&self) -> bool {
        self.ptu_push_button.is_auto()
    }

    fn edp_push_button_is_auto(&self, number: usize) -> bool {
        match number {
            1 => self.edp1_push_button.is_auto(),
            2 => self.edp2_push_button.is_auto(),
            _ => panic!("The A320 only supports two engines."),
        }
    }

    fn edp_push_button_is_off(&self, number: usize) -> bool {
        match number {
            1 => self.edp1_push_button.is_off(),
            2 => self.edp2_push_button.is_off(),
            _ => panic!("The A320 only supports two engines."),
        }
    }

    fn blue_epump_override_push_button_is_on(&self) -> bool {
        self.blue_epump_override_push_button.is_on()
    }

    fn blue_epump_push_button_is_off(&self) -> bool {
        self.blue_epump_push_button.is_off()
    }

    fn rat_man_on_push_button_is_pressed(&self) -> bool {
        self.rat_push_button.is_pressed()
    }
}
impl SimulationElement for A320HydraulicOverheadPanel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.edp1_push_button.accept(visitor);
        self.edp2_push_button.accept(visitor);
        self.blue_epump_push_button.accept(visitor);
        self.ptu_push_button.accept(visitor);
        self.rat_push_button.accept(visitor);
        self.yellow_epump_push_button.accept(visitor);
        self.blue_epump_override_push_button.accept(visitor);

        visitor.visit(self);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        if !buses.is_powered(A320Hydraulic::BLUE_ELEC_PUMP_CONTROL_POWER_BUS)
            || !buses.is_powered(A320Hydraulic::BLUE_ELEC_PUMP_SUPPLY_POWER_BUS)
        {
            self.blue_epump_override_push_button.turn_off();
        }
    }
}

struct AileronController {
    mode: LinearActuatorMode,
    requested_position: Ratio,
}
impl AileronController {
    fn new() -> Self {
        Self {
            mode: LinearActuatorMode::ClosedCircuitDamping,

            requested_position: Ratio::new::<ratio>(0.),
        }
    }

    fn set_mode(&mut self, mode: LinearActuatorMode) {
        self.mode = mode;
    }

    /// Receives a [0;1] position request, 0 is down 1 is up
    fn set_requested_position(&mut self, requested_position: Ratio) {
        self.requested_position = requested_position
            .min(Ratio::new::<ratio>(1.))
            .max(Ratio::new::<ratio>(0.));
    }
}
impl HydraulicAssemblyController for AileronController {
    fn requested_mode(&self) -> LinearActuatorMode {
        self.mode
    }

    fn requested_position(&self) -> Ratio {
        self.requested_position
    }

    fn should_lock(&self) -> bool {
        false
    }

    fn requested_lock_position(&self) -> Ratio {
        Ratio::default()
    }
}

enum AileronHydConfiguration {
    GB,
    G,
    B,
    NoHyd,
}
impl AileronHydConfiguration {
    fn from_hyd_state(
        green_circuit_available: bool,
        blue_circuit_available: bool,
    ) -> AileronHydConfiguration {
        if green_circuit_available && blue_circuit_available {
            AileronHydConfiguration::GB
        } else if green_circuit_available {
            AileronHydConfiguration::G
        } else if blue_circuit_available {
            AileronHydConfiguration::B
        } else {
            AileronHydConfiguration::NoHyd
        }
    }
}

enum RightElevatorHydConfiguration {
    YB,
    Y,
    B,
    NoHyd,
}
impl RightElevatorHydConfiguration {
    fn from_hyd_state(
        blue_circuit_available: bool,
        yellow_circuit_available: bool,
    ) -> RightElevatorHydConfiguration {
        if yellow_circuit_available && blue_circuit_available {
            RightElevatorHydConfiguration::YB
        } else if yellow_circuit_available {
            RightElevatorHydConfiguration::Y
        } else if blue_circuit_available {
            RightElevatorHydConfiguration::B
        } else {
            RightElevatorHydConfiguration::NoHyd
        }
    }
}
enum LeftElevatorHydConfiguration {
    GB,
    G,
    B,
    NoHyd,
}
impl LeftElevatorHydConfiguration {
    fn from_hyd_state(
        green_circuit_available: bool,
        blue_circuit_available: bool,
    ) -> LeftElevatorHydConfiguration {
        if green_circuit_available && blue_circuit_available {
            LeftElevatorHydConfiguration::GB
        } else if green_circuit_available {
            LeftElevatorHydConfiguration::G
        } else if blue_circuit_available {
            LeftElevatorHydConfiguration::B
        } else {
            LeftElevatorHydConfiguration::NoHyd
        }
    }
}

/// Implements a placeholder elac computer logic commanding correct hydraulic modes depending
/// on pressure state.
/// TODO: Receive each actuator mode and commands directly from a FBW Elac implementation
struct ElacComputer {
    left_aileron_requested_position_id: VariableIdentifier,
    right_aileron_requested_position_id: VariableIdentifier,
    elevator_requested_position_id: VariableIdentifier,

    left_aileron_requested_position: Ratio,
    right_aileron_requested_position: Ratio,
    elevator_requested_position: Ratio,

    left_aileron_controllers: [AileronController; 2],
    right_aileron_controllers: [AileronController; 2],

    left_elevator_controllers: [AileronController; 2],
    right_elevator_controllers: [AileronController; 2],

    green_circuit_available: bool,
    blue_circuit_available: bool,
    yellow_circuit_available: bool,

    is_powered: bool,
}
impl ElacComputer {
    const PRESSURE_AVAILABLE_HIGH_HYSTERESIS_PSI: f64 = 1450.;
    const PRESSURE_AVAILABLE_LOW_HYSTERESIS_PSI: f64 = 800.;

    //TODO hot busses are in reality sub busses 703pp and 704pp
    const ALL_POWER_BUSES: [ElectricalBusType; 4] = [
        ElectricalBusType::DirectCurrentEssential,
        ElectricalBusType::DirectCurrent(2),
        ElectricalBusType::DirectCurrentHot(1),
        ElectricalBusType::DirectCurrentHot(2),
    ];

    fn new(context: &mut InitContext) -> Self {
        Self {
            left_aileron_requested_position_id: context
                .get_identifier("HYD_AILERON_LEFT_DEMAND".to_owned()),
            right_aileron_requested_position_id: context
                .get_identifier("HYD_AILERON_RIGHT_DEMAND".to_owned()),
            elevator_requested_position_id: context
                .get_identifier("HYD_ELEVATOR_DEMAND".to_owned()),

            left_aileron_requested_position: Ratio::default(),
            right_aileron_requested_position: Ratio::default(),
            elevator_requested_position: Ratio::default(),

            // Controllers are in outward->inward order, so for aileron [Blue circuit, Green circuit]
            left_aileron_controllers: [AileronController::new(), AileronController::new()],
            right_aileron_controllers: [AileronController::new(), AileronController::new()],

            // Controllers are in outboard->inboard order
            left_elevator_controllers: [AileronController::new(), AileronController::new()],
            right_elevator_controllers: [AileronController::new(), AileronController::new()],

            green_circuit_available: false,
            blue_circuit_available: false,
            yellow_circuit_available: false,

            is_powered: false,
        }
    }

    fn update_aileron_requested_position(&mut self) {
        for controller in &mut self.left_aileron_controllers {
            controller.set_requested_position(self.left_aileron_requested_position);
        }

        for controller in &mut self.right_aileron_controllers {
            controller.set_requested_position(self.right_aileron_requested_position);
        }
    }

    fn update_elevator_requested_position(&mut self) {
        for controller in &mut self.left_elevator_controllers {
            controller.set_requested_position(self.elevator_requested_position);
        }

        for controller in &mut self.right_elevator_controllers {
            controller.set_requested_position(self.elevator_requested_position);
        }
    }

    fn set_aileron_no_position_control(&mut self) {
        for controller in &mut self.left_aileron_controllers {
            controller.set_mode(LinearActuatorMode::ClosedCircuitDamping);
        }

        for controller in &mut self.right_aileron_controllers {
            controller.set_mode(LinearActuatorMode::ClosedCircuitDamping);
        }
    }

    fn set_elevator_no_position_control(&mut self) {
        for controller in &mut self.left_elevator_controllers {
            controller.set_mode(LinearActuatorMode::ClosedCircuitDamping);
        }

        for controller in &mut self.right_elevator_controllers {
            controller.set_mode(LinearActuatorMode::ClosedCircuitDamping);
        }
    }

    fn set_left_aileron_position_control(
        &mut self,
        hydraulic_configuration: AileronHydConfiguration,
    ) {
        match hydraulic_configuration {
            AileronHydConfiguration::GB | AileronHydConfiguration::B => {
                self.left_aileron_controllers[AileronActuatorPosition::Outboard as usize]
                    .set_mode(LinearActuatorMode::PositionControl);
                self.left_aileron_controllers[AileronActuatorPosition::Inboard as usize]
                    .set_mode(LinearActuatorMode::ActiveDamping);
            }

            AileronHydConfiguration::G => {
                self.left_aileron_controllers[AileronActuatorPosition::Outboard as usize]
                    .set_mode(LinearActuatorMode::ActiveDamping);
                self.left_aileron_controllers[AileronActuatorPosition::Inboard as usize]
                    .set_mode(LinearActuatorMode::PositionControl);
            }
            AileronHydConfiguration::NoHyd => {
                self.left_aileron_controllers[AileronActuatorPosition::Outboard as usize]
                    .set_mode(LinearActuatorMode::ClosedCircuitDamping);
                self.left_aileron_controllers[AileronActuatorPosition::Inboard as usize]
                    .set_mode(LinearActuatorMode::ClosedCircuitDamping);
            }
        }
    }

    fn set_right_aileron_position_control(
        &mut self,
        hydraulic_configuration: AileronHydConfiguration,
    ) {
        match hydraulic_configuration {
            AileronHydConfiguration::GB | AileronHydConfiguration::G => {
                self.right_aileron_controllers[AileronActuatorPosition::Outboard as usize]
                    .set_mode(LinearActuatorMode::ActiveDamping);
                self.right_aileron_controllers[AileronActuatorPosition::Inboard as usize]
                    .set_mode(LinearActuatorMode::PositionControl);
            }

            AileronHydConfiguration::B => {
                self.right_aileron_controllers[AileronActuatorPosition::Outboard as usize]
                    .set_mode(LinearActuatorMode::PositionControl);
                self.right_aileron_controllers[AileronActuatorPosition::Inboard as usize]
                    .set_mode(LinearActuatorMode::ActiveDamping);
            }
            _ => {
                self.right_aileron_controllers[AileronActuatorPosition::Outboard as usize]
                    .set_mode(LinearActuatorMode::ClosedCircuitDamping);
                self.right_aileron_controllers[AileronActuatorPosition::Inboard as usize]
                    .set_mode(LinearActuatorMode::ClosedCircuitDamping);
            }
        }
    }

    fn set_left_elevator_position_control(
        &mut self,
        hydraulic_configuration: LeftElevatorHydConfiguration,
    ) {
        match hydraulic_configuration {
            LeftElevatorHydConfiguration::GB => {
                if self.elevator_requested_position > Ratio::new::<ratio>(0.8) {
                    self.left_elevator_controllers[LeftElevatorActuatorCircuit::Blue as usize]
                        .set_mode(LinearActuatorMode::PositionControl);
                } else {
                    self.left_elevator_controllers[LeftElevatorActuatorCircuit::Blue as usize]
                        .set_mode(LinearActuatorMode::ActiveDamping);
                }
                self.left_elevator_controllers[LeftElevatorActuatorCircuit::Green as usize]
                    .set_mode(LinearActuatorMode::PositionControl);
            }
            LeftElevatorHydConfiguration::G => {
                self.left_elevator_controllers[LeftElevatorActuatorCircuit::Blue as usize]
                    .set_mode(LinearActuatorMode::ActiveDamping);
                self.left_elevator_controllers[LeftElevatorActuatorCircuit::Green as usize]
                    .set_mode(LinearActuatorMode::PositionControl);
            }
            LeftElevatorHydConfiguration::B => {
                self.left_elevator_controllers[LeftElevatorActuatorCircuit::Blue as usize]
                    .set_mode(LinearActuatorMode::PositionControl);
                self.left_elevator_controllers[LeftElevatorActuatorCircuit::Green as usize]
                    .set_mode(LinearActuatorMode::ActiveDamping);
            }
            LeftElevatorHydConfiguration::NoHyd => {
                self.left_elevator_controllers[LeftElevatorActuatorCircuit::Blue as usize]
                    .set_mode(LinearActuatorMode::ClosedCircuitDamping);
                self.left_elevator_controllers[LeftElevatorActuatorCircuit::Green as usize]
                    .set_mode(LinearActuatorMode::ClosedCircuitDamping);
            }
        }
    }

    fn set_right_elevator_position_control(
        &mut self,
        hydraulic_configuration: RightElevatorHydConfiguration,
    ) {
        match hydraulic_configuration {
            RightElevatorHydConfiguration::YB => {
                if self.elevator_requested_position > Ratio::new::<ratio>(0.8) {
                    self.right_elevator_controllers[RightElevatorActuatorCircuit::Blue as usize]
                        .set_mode(LinearActuatorMode::PositionControl);
                } else {
                    self.right_elevator_controllers[RightElevatorActuatorCircuit::Blue as usize]
                        .set_mode(LinearActuatorMode::ActiveDamping);
                }
                self.right_elevator_controllers[RightElevatorActuatorCircuit::Yellow as usize]
                    .set_mode(LinearActuatorMode::PositionControl);
            }
            RightElevatorHydConfiguration::Y => {
                self.right_elevator_controllers[RightElevatorActuatorCircuit::Blue as usize]
                    .set_mode(LinearActuatorMode::ActiveDamping);
                self.right_elevator_controllers[RightElevatorActuatorCircuit::Yellow as usize]
                    .set_mode(LinearActuatorMode::PositionControl);
            }
            RightElevatorHydConfiguration::B => {
                self.right_elevator_controllers[RightElevatorActuatorCircuit::Blue as usize]
                    .set_mode(LinearActuatorMode::PositionControl);
                self.right_elevator_controllers[RightElevatorActuatorCircuit::Yellow as usize]
                    .set_mode(LinearActuatorMode::ActiveDamping);
            }
            RightElevatorHydConfiguration::NoHyd => {
                self.right_elevator_controllers[RightElevatorActuatorCircuit::Blue as usize]
                    .set_mode(LinearActuatorMode::ClosedCircuitDamping);
                self.right_elevator_controllers[RightElevatorActuatorCircuit::Yellow as usize]
                    .set_mode(LinearActuatorMode::ClosedCircuitDamping);
            }
        }
    }

    fn update_elevator(&mut self) {
        if self.is_powered {
            self.set_left_elevator_position_control(LeftElevatorHydConfiguration::from_hyd_state(
                self.green_circuit_available,
                self.blue_circuit_available,
            ));

            self.set_right_elevator_position_control(
                RightElevatorHydConfiguration::from_hyd_state(
                    self.blue_circuit_available,
                    self.yellow_circuit_available,
                ),
            );
        } else {
            self.set_elevator_no_position_control();
        }
    }

    fn update_aileron(&mut self) {
        if self.is_powered {
            self.set_right_aileron_position_control(AileronHydConfiguration::from_hyd_state(
                self.green_circuit_available,
                self.blue_circuit_available,
            ));
            self.set_left_aileron_position_control(AileronHydConfiguration::from_hyd_state(
                self.green_circuit_available,
                self.blue_circuit_available,
            ));
        } else {
            self.set_aileron_no_position_control();
        }
    }

    fn circuit_is_available(pressure: Pressure, current_availability: bool) -> bool {
        if pressure.get::<psi>() > Self::PRESSURE_AVAILABLE_HIGH_HYSTERESIS_PSI {
            true
        } else if pressure.get::<psi>() < Self::PRESSURE_AVAILABLE_LOW_HYSTERESIS_PSI {
            false
        } else {
            current_availability
        }
    }

    fn update(
        &mut self,
        blue_pressure: Pressure,
        green_pressure: Pressure,
        yellow_pressure: Pressure,
    ) {
        self.update_aileron_requested_position();
        self.update_elevator_requested_position();

        self.blue_circuit_available =
            Self::circuit_is_available(blue_pressure, self.blue_circuit_available);
        self.green_circuit_available =
            Self::circuit_is_available(green_pressure, self.green_circuit_available);
        self.yellow_circuit_available =
            Self::circuit_is_available(yellow_pressure, self.yellow_circuit_available);

        self.update_aileron();

        self.update_elevator();
    }

    fn left_elevator_controllers(&self) -> &[impl HydraulicAssemblyController] {
        &self.left_elevator_controllers[..]
    }

    fn right_elevator_controllers(&self) -> &[impl HydraulicAssemblyController] {
        &self.right_elevator_controllers[..]
    }

    fn left_controllers(&self) -> &[impl HydraulicAssemblyController] {
        &self.left_aileron_controllers[..]
    }

    fn right_controllers(&self) -> &[impl HydraulicAssemblyController] {
        &self.right_aileron_controllers[..]
    }
}
impl SimulationElement for ElacComputer {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.left_aileron_requested_position =
            Ratio::new::<ratio>(reader.read(&self.left_aileron_requested_position_id));
        self.right_aileron_requested_position =
            Ratio::new::<ratio>(reader.read(&self.right_aileron_requested_position_id));

        self.elevator_requested_position =
            Ratio::new::<ratio>(reader.read(&self.elevator_requested_position_id));
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.any_is_powered(&Self::ALL_POWER_BUSES);
    }
}

/// Implements a placeholder fac computer logic commanding correct hydraulic modes depending
/// on pressure state.
/// TODO: Receive each actuator mode and commands directly from a FBW fac implementation
struct FacComputer {
    requested_rudder_position_id: VariableIdentifier,

    rudder_position_requested: Ratio,

    rudder_controllers: [AileronController; 3],

    is_powered: bool,
}
impl FacComputer {
    //TODO hot busses of FAC to check
    const ALL_POWER_BUSES: [ElectricalBusType; 4] = [
        ElectricalBusType::DirectCurrentEssential,
        ElectricalBusType::DirectCurrent(2),
        ElectricalBusType::DirectCurrentHot(1),
        ElectricalBusType::DirectCurrentHot(2),
    ];

    fn new(context: &mut InitContext) -> Self {
        Self {
            requested_rudder_position_id: context.get_identifier("HYD_RUDDER_DEMAND".to_owned()),

            rudder_position_requested: Ratio::default(),

            // Controllers are in [ Green circuit, Blue circuit, Yellow circuit] order
            rudder_controllers: [
                AileronController::new(),
                AileronController::new(),
                AileronController::new(),
            ],

            is_powered: false,
        }
    }

    fn update_rudder_requested_position(&mut self) {
        for controller in &mut self.rudder_controllers {
            controller.set_requested_position(self.rudder_position_requested);
        }
    }

    fn set_rudder_no_position_control(&mut self) {
        for controller in &mut self.rudder_controllers {
            controller.set_mode(LinearActuatorMode::ClosedCircuitDamping);
        }
    }

    fn set_rudder_position_control(
        &mut self,
        green_circuit_available: bool,
        blue_circuit_available: bool,
        yellow_circuit_available: bool,
    ) {
        if green_circuit_available {
            self.rudder_controllers[RudderActuatorPosition::Green as usize]
                .set_mode(LinearActuatorMode::PositionControl);
        } else {
            self.rudder_controllers[RudderActuatorPosition::Green as usize]
                .set_mode(LinearActuatorMode::ActiveDamping);
        }

        if blue_circuit_available {
            self.rudder_controllers[RudderActuatorPosition::Blue as usize]
                .set_mode(LinearActuatorMode::PositionControl);
        } else {
            self.rudder_controllers[RudderActuatorPosition::Blue as usize]
                .set_mode(LinearActuatorMode::ActiveDamping);
        }

        if yellow_circuit_available {
            self.rudder_controllers[RudderActuatorPosition::Yellow as usize]
                .set_mode(LinearActuatorMode::PositionControl);
        } else {
            self.rudder_controllers[RudderActuatorPosition::Yellow as usize]
                .set_mode(LinearActuatorMode::ActiveDamping);
        }
    }

    fn update_rudder(
        &mut self,
        green_circuit_available: bool,
        blue_circuit_available: bool,
        yellow_circuit_available: bool,
    ) {
        let no_hydraulics =
            !green_circuit_available && !blue_circuit_available && !yellow_circuit_available;

        if self.is_powered && !no_hydraulics {
            self.set_rudder_position_control(
                green_circuit_available,
                blue_circuit_available,
                yellow_circuit_available,
            );
        } else {
            self.set_rudder_no_position_control();
        }
    }

    fn update(
        &mut self,
        green_pressure: Pressure,
        blue_pressure: Pressure,
        yellow_pressure: Pressure,
    ) {
        self.update_rudder_requested_position();

        let blue_circuit_available = blue_pressure.get::<psi>() > 1500.;
        let green_circuit_available = green_pressure.get::<psi>() > 1500.;
        let yellow_circuit_available = yellow_pressure.get::<psi>() > 1500.;

        self.update_rudder(
            green_circuit_available,
            blue_circuit_available,
            yellow_circuit_available,
        );
    }

    fn rudder_controllers(&self) -> &[impl HydraulicAssemblyController] {
        &self.rudder_controllers[..]
    }
}
impl SimulationElement for FacComputer {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.rudder_position_requested =
            Ratio::new::<ratio>(reader.read(&self.requested_rudder_position_id));
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.any_is_powered(&Self::ALL_POWER_BUSES);
    }
}

#[derive(PartialEq, Clone, Copy)]
enum ActuatorSide {
    Left,
    Right,
}

#[derive(PartialEq, Clone, Copy)]
enum AileronActuatorPosition {
    Outboard = 0,
    Inboard = 1,
}

#[derive(PartialEq, Clone, Copy)]
enum ElevatorActuatorPosition {
    Outboard = 0,
    Inboard = 1,
}

enum RudderActuatorPosition {
    Green = 0,
    Blue = 1,
    Yellow = 2,
}

enum LeftElevatorActuatorCircuit {
    Blue = 0,
    Green = 1,
}

enum RightElevatorActuatorCircuit {
    Blue = 0,
    Yellow = 1,
}

struct AileronAssembly {
    hydraulic_assembly: HydraulicLinearActuatorAssembly<2>,

    position_id: VariableIdentifier,

    position: Ratio,

    aerodynamic_model: AerodynamicModel,
}
impl AileronAssembly {
    fn new(
        context: &mut InitContext,
        id: ActuatorSide,
        hydraulic_assembly: HydraulicLinearActuatorAssembly<2>,
        aerodynamic_model: AerodynamicModel,
    ) -> Self {
        Self {
            hydraulic_assembly,
            position_id: match id {
                ActuatorSide::Left => context.get_identifier("HYD_AIL_LEFT_DEFLECTION".to_owned()),
                ActuatorSide::Right => {
                    context.get_identifier("HYD_AIL_RIGHT_DEFLECTION".to_owned())
                }
            },
            position: Ratio::new::<ratio>(0.),
            aerodynamic_model,
        }
    }

    fn actuator(&mut self, circuit_position: AileronActuatorPosition) -> &mut impl Actuator {
        self.hydraulic_assembly.actuator(circuit_position as usize)
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        aileron_controllers: &[impl HydraulicAssemblyController],
        current_pressure_outboard: Pressure,
        current_pressure_inboard: Pressure,
    ) {
        self.aerodynamic_model
            .update_body(context, self.hydraulic_assembly.body());
        self.hydraulic_assembly.update(
            context,
            aileron_controllers,
            [current_pressure_outboard, current_pressure_inboard],
        );

        self.position = self.hydraulic_assembly.position_normalized();
    }
}
impl SimulationElement for AileronAssembly {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.position_id, self.position.get::<ratio>());
    }
}

struct ElevatorAssembly {
    hydraulic_assembly: HydraulicLinearActuatorAssembly<2>,

    position_id: VariableIdentifier,

    position: Ratio,

    aerodynamic_model: AerodynamicModel,
}
impl ElevatorAssembly {
    fn new(
        context: &mut InitContext,
        id: ActuatorSide,
        hydraulic_assembly: HydraulicLinearActuatorAssembly<2>,
        aerodynamic_model: AerodynamicModel,
    ) -> Self {
        Self {
            hydraulic_assembly,
            position_id: match id {
                ActuatorSide::Left => context.get_identifier("HYD_ELEV_LEFT_DEFLECTION".to_owned()),
                ActuatorSide::Right => {
                    context.get_identifier("HYD_ELEV_RIGHT_DEFLECTION".to_owned())
                }
            },
            position: Ratio::new::<ratio>(0.),
            aerodynamic_model,
        }
    }

    fn actuator(&mut self, circuit_position: ElevatorActuatorPosition) -> &mut impl Actuator {
        self.hydraulic_assembly.actuator(circuit_position as usize)
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        aileron_controllers: &[impl HydraulicAssemblyController],
        current_pressure_outboard: Pressure,
        current_pressure_inboard: Pressure,
    ) {
        self.aerodynamic_model
            .update_body(context, self.hydraulic_assembly.body());
        self.hydraulic_assembly.update(
            context,
            aileron_controllers,
            [current_pressure_outboard, current_pressure_inboard],
        );

        self.position = self.hydraulic_assembly.position_normalized();
    }
}
impl SimulationElement for ElevatorAssembly {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.position_id, self.position.get::<ratio>());
    }
}

struct RudderAssembly {
    hydraulic_assembly: HydraulicLinearActuatorAssembly<3>,
    name_id: VariableIdentifier,

    position: Ratio,

    aerodynamic_model: AerodynamicModel,
}
impl RudderAssembly {
    fn new(
        context: &mut InitContext,
        hydraulic_assembly: HydraulicLinearActuatorAssembly<3>,
        aerodynamic_model: AerodynamicModel,
    ) -> Self {
        Self {
            hydraulic_assembly,

            name_id: context.get_identifier("HYD_RUD_DEFLECTION".to_owned()),

            position: Ratio::new::<ratio>(0.5),

            aerodynamic_model,
        }
    }

    fn actuator(&mut self, circuit_position: RudderActuatorPosition) -> &mut impl Actuator {
        self.hydraulic_assembly.actuator(circuit_position as usize)
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        rudder_controllers: &[impl HydraulicAssemblyController],
        current_pressure_green: Pressure,
        current_pressure_blue: Pressure,
        current_pressure_yellow: Pressure,
    ) {
        self.aerodynamic_model
            .update_body(context, self.hydraulic_assembly.body());

        self.hydraulic_assembly.update(
            context,
            rudder_controllers,
            [
                current_pressure_green,
                current_pressure_blue,
                current_pressure_yellow,
            ],
        );

        self.position = self.hydraulic_assembly.position_normalized();
    }
}
impl SimulationElement for RudderAssembly {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.name_id, self.position.get::<ratio>());
    }
}

struct SpoilerElement {
    hydraulic_assembly: HydraulicLinearActuatorAssembly<1>,

    position_id: VariableIdentifier,

    position: Ratio,

    aerodynamic_model: AerodynamicModel,
}
impl SpoilerElement {
    fn new(
        context: &mut InitContext,
        id: ActuatorSide,
        id_num: usize,
        hydraulic_assembly: HydraulicLinearActuatorAssembly<1>,
        aerodynamic_model: AerodynamicModel,
    ) -> Self {
        Self {
            hydraulic_assembly,
            position_id: match id {
                ActuatorSide::Left => {
                    context.get_identifier(format!("HYD_SPOIL_{}_LEFT_DEFLECTION", id_num))
                }
                ActuatorSide::Right => {
                    context.get_identifier(format!("HYD_SPOIL_{}_RIGHT_DEFLECTION", id_num))
                }
            },
            position: Ratio::new::<ratio>(0.),
            aerodynamic_model,
        }
    }

    fn actuator(&mut self) -> &mut impl Actuator {
        self.hydraulic_assembly.actuator(0)
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        spoiler_controller: &impl HydraulicAssemblyController,
        current_pressure: Pressure,
    ) {
        self.aerodynamic_model
            .update_body(context, self.hydraulic_assembly.body());
        self.hydraulic_assembly.update(
            context,
            std::slice::from_ref(spoiler_controller),
            [current_pressure],
        );

        self.position = self.hydraulic_assembly.position_normalized();
    }
}
impl SimulationElement for SpoilerElement {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.position_id, self.position.get::<ratio>());
    }
}

struct SpoilerGroup {
    spoilers: [SpoilerElement; 5],
}
impl SpoilerGroup {
    fn new(spoilers: [SpoilerElement; 5]) -> Self {
        Self { spoilers }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        spoiler_controllers: &[impl HydraulicAssemblyController],
        green_pressure: Pressure,
        blue_pressure: Pressure,
        yellow_pressure: Pressure,
    ) {
        self.spoilers[0].update(context, &spoiler_controllers[0], green_pressure);
        self.spoilers[1].update(context, &spoiler_controllers[1], yellow_pressure);
        self.spoilers[2].update(context, &spoiler_controllers[2], blue_pressure);
        self.spoilers[3].update(context, &spoiler_controllers[3], yellow_pressure);
        self.spoilers[4].update(context, &spoiler_controllers[4], green_pressure);

        // println!(
        //     "ACTUATORS {:.2} {:.2} {:.2} {:.2} {:.2}",
        //     self.spoilers[0].position.get::<ratio>(),
        //     self.spoilers[1].position.get::<ratio>(),
        //     self.spoilers[2].position.get::<ratio>(),
        //     self.spoilers[3].position.get::<ratio>(),
        //     self.spoilers[4].position.get::<ratio>(),
        // );
    }

    fn actuator(&mut self, spoiler_id: usize) -> &mut impl Actuator {
        self.spoilers[spoiler_id].actuator()
    }
}
impl SimulationElement for SpoilerGroup {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        for spoiler in &mut self.spoilers {
            spoiler.accept(visitor);
        }

        visitor.visit(self);
    }
}

#[derive(PartialEq, Clone, Copy)]
struct SpoilerController {
    mode: LinearActuatorMode,
    requested_position: Ratio,
}
impl SpoilerController {
    fn new() -> Self {
        Self {
            mode: LinearActuatorMode::PositionControl,

            requested_position: Ratio::new::<ratio>(0.),
        }
    }

    /// Receives a [0;1] position request, 0 is down 1 is up
    fn set_requested_position(&mut self, requested_position: Ratio) {
        self.requested_position = requested_position
            .min(Ratio::new::<ratio>(1.))
            .max(Ratio::new::<ratio>(0.));
    }
}
impl HydraulicAssemblyController for SpoilerController {
    fn requested_mode(&self) -> LinearActuatorMode {
        LinearActuatorMode::PositionControl
    }

    fn requested_position(&self) -> Ratio {
        self.requested_position
    }

    fn should_lock(&self) -> bool {
        false
    }

    fn requested_lock_position(&self) -> Ratio {
        Ratio::default()
    }
}

struct SpoilerComputer {
    requested_position_left_1_id: VariableIdentifier,
    requested_position_left_2_id: VariableIdentifier,
    requested_position_left_3_id: VariableIdentifier,
    requested_position_left_4_id: VariableIdentifier,
    requested_position_left_5_id: VariableIdentifier,

    requested_position_right_1_id: VariableIdentifier,
    requested_position_right_2_id: VariableIdentifier,
    requested_position_right_3_id: VariableIdentifier,
    requested_position_right_4_id: VariableIdentifier,
    requested_position_right_5_id: VariableIdentifier,

    spoilers_ground_spoilers_active_id: VariableIdentifier,

    left_positions_requested: [Ratio; 5],
    right_positions_requested: [Ratio; 5],

    left_controllers: [SpoilerController; 5],
    right_controllers: [SpoilerController; 5],

    ground_spoilers_are_deployed: bool,
}
impl SpoilerComputer {
    fn new(context: &mut InitContext) -> Self {
        Self {
            requested_position_left_1_id: context
                .get_identifier("HYD_SPOILER_1_LEFT_DEMAND".to_owned()),
            requested_position_left_2_id: context
                .get_identifier("HYD_SPOILER_2_LEFT_DEMAND".to_owned()),
            requested_position_left_3_id: context
                .get_identifier("HYD_SPOILER_3_LEFT_DEMAND".to_owned()),
            requested_position_left_4_id: context
                .get_identifier("HYD_SPOILER_4_LEFT_DEMAND".to_owned()),
            requested_position_left_5_id: context
                .get_identifier("HYD_SPOILER_5_LEFT_DEMAND".to_owned()),

            requested_position_right_1_id: context
                .get_identifier("HYD_SPOILER_1_RIGHT_DEMAND".to_owned()),
            requested_position_right_2_id: context
                .get_identifier("HYD_SPOILER_2_RIGHT_DEMAND".to_owned()),
            requested_position_right_3_id: context
                .get_identifier("HYD_SPOILER_3_RIGHT_DEMAND".to_owned()),
            requested_position_right_4_id: context
                .get_identifier("HYD_SPOILER_4_RIGHT_DEMAND".to_owned()),
            requested_position_right_5_id: context
                .get_identifier("HYD_SPOILER_5_RIGHT_DEMAND".to_owned()),

            spoilers_ground_spoilers_active_id: context
                .get_identifier("SPOILERS_GROUND_SPOILERS_ACTIVE".to_owned()),

            left_positions_requested: [Ratio::default(); 5],
            right_positions_requested: [Ratio::default(); 5],

            // Controllers are in inward->outward order
            left_controllers: [SpoilerController::new(); 5],
            right_controllers: [SpoilerController::new(); 5],

            ground_spoilers_are_deployed: false,
        }
    }

    fn update_spoilers_requested_position(&mut self) {
        for (idx, controller) in &mut self.left_controllers.iter_mut().enumerate() {
            controller.set_requested_position(self.left_positions_requested[idx]);
        }

        for (idx, controller) in &mut self.right_controllers.iter_mut().enumerate() {
            controller.set_requested_position(self.right_positions_requested[idx]);
        }

        // Placeholder logic only allowing inward panel if ground spoiler is used
        if !self.ground_spoilers_are_deployed {
            self.left_controllers[0].set_requested_position(Ratio::new::<ratio>(0.));
            self.right_controllers[0].set_requested_position(Ratio::new::<ratio>(0.));
        }
    }

    fn left_controllers(&self) -> &[impl HydraulicAssemblyController] {
        &self.left_controllers[..]
    }

    fn right_controllers(&self) -> &[impl HydraulicAssemblyController] {
        &self.right_controllers[..]
    }
}
impl SimulationElement for SpoilerComputer {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.left_positions_requested = [
            Ratio::new::<ratio>(reader.read(&self.requested_position_left_1_id)),
            Ratio::new::<ratio>(reader.read(&self.requested_position_left_2_id)),
            Ratio::new::<ratio>(reader.read(&self.requested_position_left_3_id)),
            Ratio::new::<ratio>(reader.read(&self.requested_position_left_4_id)),
            Ratio::new::<ratio>(reader.read(&self.requested_position_left_5_id)),
        ];
        self.right_positions_requested = [
            Ratio::new::<ratio>(reader.read(&self.requested_position_right_1_id)),
            Ratio::new::<ratio>(reader.read(&self.requested_position_right_2_id)),
            Ratio::new::<ratio>(reader.read(&self.requested_position_right_3_id)),
            Ratio::new::<ratio>(reader.read(&self.requested_position_right_4_id)),
            Ratio::new::<ratio>(reader.read(&self.requested_position_right_5_id)),
        ];

        self.ground_spoilers_are_deployed = reader.read(&self.spoilers_ground_spoilers_active_id);

        self.update_spoilers_requested_position();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    mod a320_hydraulics {
        use super::*;
        use systems::{
            electrical::{
                test::TestElectricitySource, ElectricalBus, Electricity, ElectricitySource,
                ExternalPowerSource,
            },
            engine::{leap_engine::LeapEngine, EngineFireOverheadPanel},
            hydraulic::electrical_generator::TestGenerator,
            landing_gear::{LandingGear, LandingGearControlInterfaceUnit},
            shared::{EmergencyElectricalState, HydraulicGeneratorControlUnit, PotentialOrigin},
            simulation::{
                test::{ReadByName, SimulationTestBed, TestBed, WriteByName},
                Aircraft, InitContext,
            },
        };

        use uom::si::{
            angle::degree,
            electric_potential::volt,
            length::foot,
            ratio::{percent, ratio},
            volume::liter,
        };

        struct A320TestEmergencyElectricalOverheadPanel {
            rat_and_emer_gen_man_on: MomentaryPushButton,
        }

        impl A320TestEmergencyElectricalOverheadPanel {
            pub fn new(context: &mut InitContext) -> Self {
                A320TestEmergencyElectricalOverheadPanel {
                    rat_and_emer_gen_man_on: MomentaryPushButton::new(
                        context,
                        "EMER_ELEC_RAT_AND_EMER_GEN",
                    ),
                }
            }
        }
        impl SimulationElement for A320TestEmergencyElectricalOverheadPanel {
            fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
                self.rat_and_emer_gen_man_on.accept(visitor);

                visitor.visit(self);
            }
        }
        impl EmergencyElectricalRatPushButton for A320TestEmergencyElectricalOverheadPanel {
            fn is_pressed(&self) -> bool {
                self.rat_and_emer_gen_man_on.is_pressed()
            }
        }

        struct A320TestPneumatics {
            pressure: Pressure,
        }
        impl A320TestPneumatics {
            pub fn new() -> Self {
                Self {
                    pressure: Pressure::new::<psi>(50.),
                }
            }

            fn set_nominal_air_pressure(&mut self) {
                self.pressure = Pressure::new::<psi>(50.);
            }

            fn set_low_air_pressure(&mut self) {
                self.pressure = Pressure::new::<psi>(1.);
            }
        }
        impl ReservoirAirPressure for A320TestPneumatics {
            fn green_reservoir_pressure(&self) -> Pressure {
                self.pressure
            }

            fn blue_reservoir_pressure(&self) -> Pressure {
                self.pressure
            }

            fn yellow_reservoir_pressure(&self) -> Pressure {
                self.pressure
            }
        }

        struct A320TestElectrical {
            airspeed: Velocity,
            all_ac_lost: bool,
            emergency_generator: TestGenerator,
        }
        impl A320TestElectrical {
            pub fn new() -> Self {
                A320TestElectrical {
                    airspeed: Velocity::new::<knot>(100.),
                    all_ac_lost: false,
                    emergency_generator: TestGenerator::default(),
                }
            }

            fn update(
                &mut self,
                gcu: &impl HydraulicGeneratorControlUnit,
                context: &UpdateContext,
            ) {
                self.airspeed = context.indicated_airspeed();
                self.emergency_generator.update(gcu);
            }
        }
        impl EmergencyElectricalState for A320TestElectrical {
            fn is_in_emergency_elec(&self) -> bool {
                self.all_ac_lost && self.airspeed >= Velocity::new::<knot>(100.)
            }
        }
        impl EmergencyGeneratorPower for A320TestElectrical {
            fn generated_power(&self) -> Power {
                self.emergency_generator.generated_power()
            }
        }
        impl SimulationElement for A320TestElectrical {
            fn receive_power(&mut self, buses: &impl ElectricalBuses) {
                self.all_ac_lost = !buses.is_powered(ElectricalBusType::AlternatingCurrent(1))
                    && !buses.is_powered(ElectricalBusType::AlternatingCurrent(2));
            }
        }
        struct A320HydraulicsTestAircraft {
            pneumatics: A320TestPneumatics,
            engine_1: LeapEngine,
            engine_2: LeapEngine,
            hydraulics: A320Hydraulic,
            overhead: A320HydraulicOverheadPanel,
            autobrake_panel: AutobrakePanel,
            emergency_electrical_overhead: A320TestEmergencyElectricalOverheadPanel,
            engine_fire_overhead: EngineFireOverheadPanel,
            landing_gear: LandingGear,
            lgciu1: LandingGearControlInterfaceUnit,
            lgciu2: LandingGearControlInterfaceUnit,
            electrical: A320TestElectrical,
            ext_pwr: ExternalPowerSource,

            powered_source_ac: TestElectricitySource,
            ac_ground_service_bus: ElectricalBus,
            dc_ground_service_bus: ElectricalBus,
            ac_1_bus: ElectricalBus,
            ac_2_bus: ElectricalBus,
            dc_1_bus: ElectricalBus,
            dc_2_bus: ElectricalBus,
            dc_ess_bus: ElectricalBus,
            dc_hot_1_bus: ElectricalBus,
            dc_hot_2_bus: ElectricalBus,

            // Electric buses states to be able to kill them dynamically
            is_ac_ground_service_powered: bool,
            is_dc_ground_service_powered: bool,
            is_ac_1_powered: bool,
            is_ac_2_powered: bool,
            is_dc_1_powered: bool,
            is_dc_2_powered: bool,
            is_dc_ess_powered: bool,
            is_dc_hot_1_powered: bool,
            is_dc_hot_2_powered: bool,
        }
        impl A320HydraulicsTestAircraft {
            fn new(context: &mut InitContext) -> Self {
                Self {
                    pneumatics: A320TestPneumatics::new(),
                    engine_1: LeapEngine::new(context, 1),
                    engine_2: LeapEngine::new(context, 2),
                    hydraulics: A320Hydraulic::new(context),
                    overhead: A320HydraulicOverheadPanel::new(context),
                    autobrake_panel: AutobrakePanel::new(context),
                    emergency_electrical_overhead: A320TestEmergencyElectricalOverheadPanel::new(
                        context,
                    ),
                    engine_fire_overhead: EngineFireOverheadPanel::new(context),
                    landing_gear: LandingGear::new(context),
                    lgciu1: LandingGearControlInterfaceUnit::new(
                        context,
                        1,
                        ElectricalBusType::DirectCurrentEssential,
                    ),
                    lgciu2: LandingGearControlInterfaceUnit::new(
                        context,
                        2,
                        ElectricalBusType::DirectCurrent(2),
                    ),
                    electrical: A320TestElectrical::new(),
                    ext_pwr: ExternalPowerSource::new(context),
                    powered_source_ac: TestElectricitySource::powered(
                        context,
                        PotentialOrigin::EngineGenerator(1),
                    ),
                    ac_ground_service_bus: ElectricalBus::new(
                        context,
                        ElectricalBusType::AlternatingCurrentGndFltService,
                    ),
                    dc_ground_service_bus: ElectricalBus::new(
                        context,
                        ElectricalBusType::DirectCurrentGndFltService,
                    ),
                    ac_1_bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(1)),
                    ac_2_bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(2)),
                    dc_1_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrent(1)),
                    dc_2_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrent(2)),
                    dc_ess_bus: ElectricalBus::new(
                        context,
                        ElectricalBusType::DirectCurrentEssential,
                    ),
                    dc_hot_1_bus: ElectricalBus::new(
                        context,
                        ElectricalBusType::DirectCurrentHot(1),
                    ),
                    dc_hot_2_bus: ElectricalBus::new(
                        context,
                        ElectricalBusType::DirectCurrentHot(2),
                    ),
                    is_ac_ground_service_powered: true,
                    is_dc_ground_service_powered: true,
                    is_ac_1_powered: true,
                    is_ac_2_powered: true,
                    is_dc_1_powered: true,
                    is_dc_2_powered: true,
                    is_dc_ess_powered: true,
                    is_dc_hot_1_powered: true,
                    is_dc_hot_2_powered: true,
                }
            }

            fn is_rat_commanded_to_deploy(&self) -> bool {
                self.hydraulics.ram_air_turbine_controller.should_deploy()
            }

            fn is_emergency_gen_at_nominal_speed(&self) -> bool {
                self.hydraulics.gcu.is_at_nominal_speed()
            }

            fn is_green_edp_commanded_on(&self) -> bool {
                self.hydraulics
                    .engine_driven_pump_1_controller
                    .should_pressurise()
            }

            fn is_yellow_edp_commanded_on(&self) -> bool {
                self.hydraulics
                    .engine_driven_pump_2_controller
                    .should_pressurise()
            }

            fn get_yellow_brake_accumulator_fluid_volume(&self) -> Volume {
                self.hydraulics
                    .braking_circuit_altn
                    .accumulator_fluid_volume()
            }

            fn is_nws_pin_inserted(&self) -> bool {
                self.hydraulics.nose_wheel_steering_pin_is_inserted()
            }

            fn is_cargo_powering_yellow_epump(&self) -> bool {
                self.hydraulics
                    .should_pressurise_yellow_pump_for_cargo_door_operation()
            }

            fn is_yellow_epump_controller_pressurising(&self) -> bool {
                self.hydraulics
                    .yellow_electric_pump_controller
                    .should_pressurise()
            }

            fn is_blue_epump_controller_pressurising(&self) -> bool {
                self.hydraulics
                    .blue_electric_pump_controller
                    .should_pressurise()
            }

            fn is_edp1_green_pump_controller_pressurising(&self) -> bool {
                self.hydraulics
                    .engine_driven_pump_1_controller
                    .should_pressurise()
            }

            fn is_edp2_yellow_pump_controller_pressurising(&self) -> bool {
                self.hydraulics
                    .engine_driven_pump_2_controller
                    .should_pressurise()
            }

            fn is_ptu_controller_activating_ptu(&self) -> bool {
                self.hydraulics
                    .power_transfer_unit_controller
                    .should_enable()
            }

            fn is_ptu_enabled(&self) -> bool {
                self.hydraulics.power_transfer_unit.is_enabled()
            }

            fn is_blue_pressurised(&self) -> bool {
                self.hydraulics.is_blue_pressurised()
            }

            fn is_green_pressurised(&self) -> bool {
                self.hydraulics.is_green_pressurised()
            }

            fn is_yellow_pressurised(&self) -> bool {
                self.hydraulics.is_yellow_pressurised()
            }

            fn nose_steering_position(&self) -> Angle {
                self.hydraulics.nose_steering.position_feedback()
            }

            fn is_cargo_fwd_door_locked_up(&self) -> bool {
                self.hydraulics.forward_cargo_door_controller.control_state
                    == DoorControlState::UpLocked
            }

            fn set_ac_bus_1_is_powered(&mut self, bus_is_alive: bool) {
                self.is_ac_1_powered = bus_is_alive;
            }

            fn set_ac_bus_2_is_powered(&mut self, bus_is_alive: bool) {
                self.is_ac_2_powered = bus_is_alive;
            }

            fn set_dc_ground_service_is_powered(&mut self, bus_is_alive: bool) {
                self.is_dc_ground_service_powered = bus_is_alive;
            }

            fn set_ac_ground_service_is_powered(&mut self, bus_is_alive: bool) {
                self.is_ac_ground_service_powered = bus_is_alive;
            }

            fn set_dc_bus_2_is_powered(&mut self, bus_is_alive: bool) {
                self.is_dc_2_powered = bus_is_alive;
            }
            fn set_dc_ess_is_powered(&mut self, bus_is_alive: bool) {
                self.is_dc_ess_powered = bus_is_alive;
            }
        }

        impl Aircraft for A320HydraulicsTestAircraft {
            fn update_before_power_distribution(
                &mut self,
                _: &UpdateContext,
                electricity: &mut Electricity,
            ) {
                self.powered_source_ac
                    .power_with_potential(ElectricPotential::new::<volt>(115.));
                electricity.supplied_by(&self.powered_source_ac);

                if self.is_ac_1_powered {
                    electricity.flow(&self.powered_source_ac, &self.ac_1_bus);
                }

                if self.is_ac_2_powered {
                    electricity.flow(&self.powered_source_ac, &self.ac_2_bus);
                }

                if self.is_ac_ground_service_powered {
                    electricity.flow(&self.powered_source_ac, &self.ac_ground_service_bus);
                }

                if self.is_dc_ground_service_powered {
                    electricity.flow(&self.powered_source_ac, &self.dc_ground_service_bus);
                }

                if self.is_dc_1_powered {
                    electricity.flow(&self.powered_source_ac, &self.dc_1_bus);
                }

                if self.is_dc_2_powered {
                    electricity.flow(&self.powered_source_ac, &self.dc_2_bus);
                }

                if self.is_dc_ess_powered {
                    electricity.flow(&self.powered_source_ac, &self.dc_ess_bus);
                }

                if self.is_dc_hot_1_powered {
                    electricity.flow(&self.powered_source_ac, &self.dc_hot_1_bus);
                }

                if self.is_dc_hot_2_powered {
                    electricity.flow(&self.powered_source_ac, &self.dc_hot_2_bus);
                }
            }

            fn update_after_power_distribution(&mut self, context: &UpdateContext) {
                self.electrical.update(&self.hydraulics.gcu, context);

                self.lgciu1.update(
                    &self.landing_gear,
                    self.ext_pwr.output_potential().is_powered(),
                );
                self.lgciu2.update(
                    &self.landing_gear,
                    self.ext_pwr.output_potential().is_powered(),
                );

                self.hydraulics.update(
                    context,
                    &self.engine_1,
                    &self.engine_2,
                    &self.overhead,
                    &self.autobrake_panel,
                    &self.engine_fire_overhead,
                    &self.lgciu1,
                    &self.lgciu2,
                    &self.emergency_electrical_overhead,
                    &self.electrical,
                    &self.pneumatics,
                );

                self.overhead.update(&self.hydraulics);
            }
        }
        impl SimulationElement for A320HydraulicsTestAircraft {
            fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
                self.engine_1.accept(visitor);
                self.engine_2.accept(visitor);
                self.landing_gear.accept(visitor);
                self.lgciu1.accept(visitor);
                self.lgciu2.accept(visitor);
                self.hydraulics.accept(visitor);
                self.autobrake_panel.accept(visitor);
                self.overhead.accept(visitor);
                self.engine_fire_overhead.accept(visitor);
                self.emergency_electrical_overhead.accept(visitor);
                self.electrical.accept(visitor);
                self.ext_pwr.accept(visitor);

                visitor.visit(self);
            }
        }

        struct A320HydraulicsTestBed {
            test_bed: SimulationTestBed<A320HydraulicsTestAircraft>,
        }
        impl A320HydraulicsTestBed {
            fn new() -> Self {
                Self {
                    test_bed: SimulationTestBed::new(A320HydraulicsTestAircraft::new),
                }
            }

            fn run_one_tick(mut self) -> Self {
                self.run_with_delta(A320Hydraulic::HYDRAULIC_SIM_TIME_STEP);
                self
            }

            fn run_waiting_for(mut self, delta: Duration) -> Self {
                self.test_bed.run_multiple_frames(delta);
                self
            }

            fn is_green_edp_commanded_on(&self) -> bool {
                self.query(|a| a.is_green_edp_commanded_on())
            }

            fn is_yellow_edp_commanded_on(&self) -> bool {
                self.query(|a| a.is_yellow_edp_commanded_on())
            }

            fn is_ptu_enabled(&self) -> bool {
                self.query(|a| a.is_ptu_enabled())
            }

            fn is_blue_pressurised(&self) -> bool {
                self.query(|a| a.is_blue_pressurised())
            }

            fn is_green_pressurised(&self) -> bool {
                self.query(|a| a.is_green_pressurised())
            }

            fn is_yellow_pressurised(&self) -> bool {
                self.query(|a| a.is_yellow_pressurised())
            }

            fn is_flaps_moving(&mut self) -> bool {
                self.read_by_name("IS_FLAPS_MOVING")
            }

            fn is_slats_moving(&mut self) -> bool {
                self.read_by_name("IS_SLATS_MOVING")
            }

            fn nose_steering_position(&self) -> Angle {
                self.query(|a| a.nose_steering_position())
            }

            fn is_cargo_fwd_door_locked_down(&mut self) -> bool {
                self.read_by_name("FWD_DOOR_CARGO_LOCKED")
            }

            fn is_cargo_fwd_door_locked_up(&self) -> bool {
                self.query(|a| a.is_cargo_fwd_door_locked_up())
            }

            fn cargo_fwd_door_position(&mut self) -> f64 {
                self.read_by_name("FWD_DOOR_CARGO_POSITION")
            }

            fn cargo_aft_door_position(&mut self) -> f64 {
                self.read_by_name("AFT_DOOR_CARGO_POSITION")
            }

            fn green_pressure(&mut self) -> Pressure {
                self.read_by_name("HYD_GREEN_SYSTEM_1_SECTION_PRESSURE")
            }

            fn blue_pressure(&mut self) -> Pressure {
                self.read_by_name("HYD_BLUE_SYSTEM_1_SECTION_PRESSURE")
            }

            fn yellow_pressure(&mut self) -> Pressure {
                self.read_by_name("HYD_YELLOW_SYSTEM_1_SECTION_PRESSURE")
            }

            fn get_yellow_reservoir_volume(&mut self) -> Volume {
                self.read_by_name("HYD_YELLOW_RESERVOIR_LEVEL")
            }

            fn is_green_edp_press_low(&mut self) -> bool {
                self.read_by_name("HYD_GREEN_EDPUMP_LOW_PRESS")
            }

            fn green_edp_has_fault(&mut self) -> bool {
                self.read_by_name("OVHD_HYD_ENG_1_PUMP_PB_HAS_FAULT")
            }

            fn yellow_edp_has_fault(&mut self) -> bool {
                self.read_by_name("OVHD_HYD_ENG_2_PUMP_PB_HAS_FAULT")
            }

            fn is_yellow_edp_press_low(&mut self) -> bool {
                self.read_by_name("HYD_YELLOW_EDPUMP_LOW_PRESS")
            }

            fn is_yellow_epump_press_low(&mut self) -> bool {
                self.read_by_name("HYD_YELLOW_EPUMP_LOW_PRESS")
            }

            fn is_blue_epump_press_low(&mut self) -> bool {
                self.read_by_name("HYD_BLUE_EPUMP_LOW_PRESS")
            }

            fn blue_epump_has_fault(&mut self) -> bool {
                self.read_by_name("OVHD_HYD_EPUMPB_PB_HAS_FAULT")
            }

            fn yellow_epump_has_fault(&mut self) -> bool {
                self.read_by_name("OVHD_HYD_EPUMPY_PB_HAS_FAULT")
            }

            fn ptu_has_fault(&mut self) -> bool {
                self.read_by_name("OVHD_HYD_PTU_PB_HAS_FAULT")
            }

            fn blue_epump_override_is_on(&mut self) -> bool {
                self.read_by_name("OVHD_HYD_EPUMPY_OVRD_IS_ON")
            }

            fn get_brake_left_yellow_pressure(&mut self) -> Pressure {
                self.read_by_name("HYD_BRAKE_ALTN_LEFT_PRESS")
            }

            fn get_brake_right_yellow_pressure(&mut self) -> Pressure {
                self.read_by_name("HYD_BRAKE_ALTN_RIGHT_PRESS")
            }

            fn get_green_reservoir_volume(&mut self) -> Volume {
                self.read_by_name("HYD_GREEN_RESERVOIR_LEVEL")
            }

            fn get_blue_reservoir_volume(&mut self) -> Volume {
                self.read_by_name("HYD_BLUE_RESERVOIR_LEVEL")
            }

            fn autobrake_mode(&mut self) -> AutobrakeMode {
                ReadByName::<A320HydraulicsTestBed, f64>::read_by_name(
                    self,
                    "AUTOBRAKES_ARMED_MODE",
                )
                .into()
            }

            fn get_brake_left_green_pressure(&mut self) -> Pressure {
                self.read_by_name("HYD_BRAKE_NORM_LEFT_PRESS")
            }

            fn get_brake_right_green_pressure(&mut self) -> Pressure {
                self.read_by_name("HYD_BRAKE_NORM_RIGHT_PRESS")
            }

            fn get_brake_yellow_accumulator_pressure(&mut self) -> Pressure {
                self.read_by_name("HYD_BRAKE_ALTN_ACC_PRESS")
            }

            fn get_brake_yellow_accumulator_fluid_volume(&self) -> Volume {
                self.query(|a| a.get_yellow_brake_accumulator_fluid_volume())
            }

            fn get_rat_position(&mut self) -> f64 {
                self.read_by_name("HYD_RAT_STOW_POSITION")
            }

            fn get_rat_rpm(&mut self) -> f64 {
                self.read_by_name("A32NX_HYD_RAT_RPM")
            }

            fn get_left_aileron_position(&mut self) -> Ratio {
                Ratio::new::<ratio>(self.read_by_name("HYD_AIL_LEFT_DEFLECTION"))
            }

            fn get_right_aileron_position(&mut self) -> Ratio {
                Ratio::new::<ratio>(self.read_by_name("HYD_AIL_RIGHT_DEFLECTION"))
            }

            fn get_left_elevator_position(&mut self) -> Ratio {
                Ratio::new::<ratio>(self.read_by_name("HYD_ELEV_LEFT_DEFLECTION"))
            }

            fn get_right_elevator_position(&mut self) -> Ratio {
                Ratio::new::<ratio>(self.read_by_name("HYD_ELEV_RIGHT_DEFLECTION"))
            }

            fn get_nose_steering_ratio(&mut self) -> Ratio {
                Ratio::new::<ratio>(self.read_by_name("NOSE_WHEEL_POSITION_RATIO"))
            }

            fn rat_deploy_commanded(&self) -> bool {
                self.query(|a| a.is_rat_commanded_to_deploy())
            }

            fn is_emergency_gen_at_nominal_speed(&self) -> bool {
                self.query(|a| a.is_emergency_gen_at_nominal_speed())
            }

            fn is_fire_valve_eng1_closed(&mut self) -> bool {
                !ReadByName::<A320HydraulicsTestBed, bool>::read_by_name(
                    self,
                    "HYD_GREEN_PUMP_1_FIRE_VALVE_OPENED",
                ) && !self.query(|a| {
                    a.hydraulics.green_circuit.is_fire_shutoff_valve_open(
                        A320HydraulicCircuitFactory::GREEN_ENGINE_PUMP_INDEX,
                    )
                })
            }

            fn is_fire_valve_eng2_closed(&mut self) -> bool {
                !ReadByName::<A320HydraulicsTestBed, bool>::read_by_name(
                    self,
                    "HYD_YELLOW_PUMP_1_FIRE_VALVE_OPENED",
                ) && !self.query(|a| {
                    a.hydraulics.green_circuit.is_fire_shutoff_valve_open(
                        A320HydraulicCircuitFactory::YELLOW_ENGINE_PUMP_INDEX,
                    )
                })
            }

            fn engines_off(self) -> Self {
                self.stop_eng1().stop_eng2()
            }

            fn external_power(mut self, is_connected: bool) -> Self {
                self.write_by_name("EXTERNAL POWER AVAILABLE:1", is_connected);

                if is_connected {
                    self = self.on_the_ground();
                }
                self
            }

            fn on_the_ground(mut self) -> Self {
                self.set_indicated_altitude(Length::new::<foot>(0.));
                self.set_on_ground(true);
                self.set_indicated_airspeed(Velocity::new::<knot>(5.));
                self
            }

            fn air_press_low(mut self) -> Self {
                self.command(|a| a.pneumatics.set_low_air_pressure());
                self
            }

            fn air_press_nominal(mut self) -> Self {
                self.command(|a| a.pneumatics.set_nominal_air_pressure());
                self
            }

            fn rotates_on_runway(mut self) -> Self {
                self.set_indicated_altitude(Length::new::<foot>(0.));
                self.set_on_ground(false);
                self.set_indicated_airspeed(Velocity::new::<knot>(135.));
                self.write_by_name(
                    LandingGear::GEAR_CENTER_COMPRESSION,
                    Ratio::new::<ratio>(0.5),
                );
                self.write_by_name(LandingGear::GEAR_LEFT_COMPRESSION, Ratio::new::<ratio>(0.8));
                self.write_by_name(
                    LandingGear::GEAR_RIGHT_COMPRESSION,
                    Ratio::new::<ratio>(0.8),
                );
                self
            }

            fn in_flight(mut self) -> Self {
                self.set_on_ground(false);
                self.set_indicated_altitude(Length::new::<foot>(2500.));
                self.set_indicated_airspeed(Velocity::new::<knot>(180.));
                self.start_eng1(Ratio::new::<percent>(80.))
                    .start_eng2(Ratio::new::<percent>(80.))
                    .set_gear_up()
                    .set_park_brake(false)
                    .external_power(false)
            }

            fn set_tiller_demand(mut self, steering_ratio: Ratio) -> Self {
                self.write_by_name("TILLER_HANDLE_POSITION", steering_ratio.get::<ratio>());
                self
            }

            fn set_autopilot_steering_demand(mut self, steering_ratio: Ratio) -> Self {
                self.write_by_name("AUTOPILOT_NOSEWHEEL_DEMAND", steering_ratio.get::<ratio>());
                self
            }

            fn set_eng1_fire_button(mut self, is_active: bool) -> Self {
                self.write_by_name("FIRE_BUTTON_ENG1", is_active);
                self
            }

            fn set_eng2_fire_button(mut self, is_active: bool) -> Self {
                self.write_by_name("FIRE_BUTTON_ENG2", is_active);
                self
            }

            fn open_fwd_cargo_door(mut self) -> Self {
                self.write_by_name("FWD_DOOR_CARGO_OPEN_REQ", 1.);
                self
            }

            fn close_fwd_cargo_door(mut self) -> Self {
                self.write_by_name("FWD_DOOR_CARGO_OPEN_REQ", 0.);
                self
            }

            fn set_pushback_state(mut self, is_pushed_back: bool) -> Self {
                if is_pushed_back {
                    self.write_by_name("PUSHBACK STATE", 0.);
                } else {
                    self.write_by_name("PUSHBACK STATE", 3.);
                }
                self
            }

            fn set_pushback_angle(mut self, angle: Angle) -> Self {
                self.write_by_name("PUSHBACK ANGLE", angle.get::<radian>());
                self
            }

            fn is_nw_disc_memo_shown(&mut self) -> bool {
                self.read_by_name("HYD_NW_STRG_DISC_ECAM_MEMO")
            }

            fn is_ptu_running_high_pitch_sound(&mut self) -> bool {
                self.read_by_name("HYD_PTU_HIGH_PITCH_SOUND")
            }

            fn start_eng1(mut self, n2: Ratio) -> Self {
                self.write_by_name("GENERAL ENG STARTER ACTIVE:1", true);
                self.write_by_name("ENGINE_N2:1", n2);

                self
            }

            fn start_eng2(mut self, n2: Ratio) -> Self {
                self.write_by_name("GENERAL ENG STARTER ACTIVE:2", true);
                self.write_by_name("ENGINE_N2:2", n2);

                self
            }

            fn stop_eng1(mut self) -> Self {
                self.write_by_name("GENERAL ENG STARTER ACTIVE:1", false);
                self.write_by_name("ENGINE_N2:1", 0.);

                self
            }

            fn stopping_eng1(mut self) -> Self {
                self.write_by_name("GENERAL ENG STARTER ACTIVE:1", false);
                self.write_by_name("ENGINE_N2:1", 25.);

                self
            }

            fn stop_eng2(mut self) -> Self {
                self.write_by_name("GENERAL ENG STARTER ACTIVE:2", false);
                self.write_by_name("ENGINE_N2:2", 0.);

                self
            }

            fn stopping_eng2(mut self) -> Self {
                self.write_by_name("GENERAL ENG STARTER ACTIVE:2", false);
                self.write_by_name("ENGINE_N2:2", 25.);

                self
            }

            fn set_park_brake(mut self, is_set: bool) -> Self {
                self.write_by_name("PARK_BRAKE_LEVER_POS", is_set);
                self
            }

            fn set_gear_up(mut self) -> Self {
                self.write_by_name("GEAR CENTER POSITION", 0.);
                self.write_by_name("GEAR LEFT POSITION", 0.);
                self.write_by_name("GEAR RIGHT POSITION", 0.);
                self.write_by_name("GEAR HANDLE POSITION", false);

                self
            }

            fn set_gear_down(mut self) -> Self {
                self.write_by_name("GEAR CENTER POSITION", 100.);
                self.write_by_name("GEAR LEFT POSITION", 100.);
                self.write_by_name("GEAR RIGHT POSITION", 100.);
                self.write_by_name("GEAR HANDLE POSITION", true);

                self
            }

            fn set_anti_skid(mut self, is_set: bool) -> Self {
                self.write_by_name("ANTISKID BRAKES ACTIVE", is_set);
                self
            }

            fn set_yellow_e_pump(mut self, is_auto: bool) -> Self {
                self.write_by_name("OVHD_HYD_EPUMPY_PB_IS_AUTO", is_auto);
                self
            }

            fn set_blue_e_pump(mut self, is_auto: bool) -> Self {
                self.write_by_name("OVHD_HYD_EPUMPB_PB_IS_AUTO", is_auto);
                self
            }

            fn set_blue_e_pump_ovrd_pressed(mut self, is_pressed: bool) -> Self {
                self.write_by_name("OVHD_HYD_EPUMPY_OVRD_IS_PRESSED", is_pressed);
                self
            }

            fn set_green_ed_pump(mut self, is_auto: bool) -> Self {
                self.write_by_name("OVHD_HYD_ENG_1_PUMP_PB_IS_AUTO", is_auto);
                self
            }

            fn set_yellow_ed_pump(mut self, is_auto: bool) -> Self {
                self.write_by_name("OVHD_HYD_ENG_2_PUMP_PB_IS_AUTO", is_auto);
                self
            }

            fn set_ptu_state(mut self, is_auto: bool) -> Self {
                self.write_by_name("OVHD_HYD_PTU_PB_IS_AUTO", is_auto);
                self
            }

            fn set_flaps_handle_position(mut self, pos: u8) -> Self {
                self.write_by_name("FLAPS_HANDLE_INDEX", pos as f64);
                self
            }

            fn get_flaps_left_position_percent(&mut self) -> f64 {
                self.read_by_name("LEFT_FLAPS_POSITION_PERCENT")
            }

            fn get_flaps_right_position_percent(&mut self) -> f64 {
                self.read_by_name("RIGHT_FLAPS_POSITION_PERCENT")
            }

            fn get_slats_left_position_percent(&mut self) -> f64 {
                self.read_by_name("LEFT_SLATS_POSITION_PERCENT")
            }

            fn get_slats_right_position_percent(&mut self) -> f64 {
                self.read_by_name("RIGHT_SLATS_POSITION_PERCENT")
            }

            fn ac_bus_1_lost(mut self) -> Self {
                self.command(|a| a.set_ac_bus_1_is_powered(false));
                self
            }

            fn ac_bus_2_lost(mut self) -> Self {
                self.command(|a| a.set_ac_bus_2_is_powered(false));
                self
            }

            fn dc_ground_service_lost(mut self) -> Self {
                self.command(|a| a.set_dc_ground_service_is_powered(false));
                self
            }
            fn dc_ground_service_avail(mut self) -> Self {
                self.command(|a| a.set_dc_ground_service_is_powered(true));
                self
            }

            fn ac_ground_service_lost(mut self) -> Self {
                self.command(|a| a.set_ac_ground_service_is_powered(false));
                self
            }

            fn dc_bus_2_lost(mut self) -> Self {
                self.command(|a| a.set_dc_bus_2_is_powered(false));
                self
            }

            fn dc_ess_lost(mut self) -> Self {
                self.command(|a| a.set_dc_ess_is_powered(false));
                self
            }

            fn dc_ess_active(mut self) -> Self {
                self.command(|a| a.set_dc_ess_is_powered(true));
                self
            }

            fn set_cold_dark_inputs(self) -> Self {
                self.set_eng1_fire_button(false)
                    .set_eng2_fire_button(false)
                    .set_blue_e_pump(true)
                    .set_yellow_e_pump(true)
                    .set_green_ed_pump(true)
                    .set_yellow_ed_pump(true)
                    .set_ptu_state(true)
                    .set_park_brake(true)
                    .set_anti_skid(true)
                    .set_left_brake(Ratio::new::<percent>(0.))
                    .set_right_brake(Ratio::new::<percent>(0.))
                    .set_gear_down()
                    .set_pushback_state(false)
                    .air_press_nominal()
                    .set_ailerons_neutral()
                    .set_elevator_neutral()
            }

            fn set_left_brake(mut self, position: Ratio) -> Self {
                self.write_by_name("LEFT_BRAKE_PEDAL_INPUT", position);
                self
            }

            fn set_right_brake(mut self, position: Ratio) -> Self {
                self.write_by_name("RIGHT_BRAKE_PEDAL_INPUT", position);
                self
            }

            fn set_autobrake_low(mut self) -> Self {
                self.write_by_name("OVHD_AUTOBRK_LOW_ON_IS_PRESSED", true);
                self = self.run_one_tick();
                self.write_by_name("OVHD_AUTOBRK_LOW_ON_IS_PRESSED", false);
                self
            }

            fn set_autobrake_med(mut self) -> Self {
                self.write_by_name("OVHD_AUTOBRK_MED_ON_IS_PRESSED", true);
                self = self.run_one_tick();
                self.write_by_name("OVHD_AUTOBRK_MED_ON_IS_PRESSED", false);
                self
            }

            fn set_autobrake_max(mut self) -> Self {
                self.write_by_name("OVHD_AUTOBRK_MAX_ON_IS_PRESSED", true);
                self = self.run_one_tick();
                self.write_by_name("OVHD_AUTOBRK_MAX_ON_IS_PRESSED", false);
                self
            }

            fn set_deploy_spoilers(mut self) -> Self {
                self.write_by_name("SPOILERS_GROUND_SPOILERS_ACTIVE", true);
                self
            }

            fn set_retract_spoilers(mut self) -> Self {
                self.write_by_name("SPOILERS_GROUND_SPOILERS_ACTIVE", false);
                self
            }

            fn set_ailerons_neutral(mut self) -> Self {
                self.write_by_name("HYD_AILERON_LEFT_DEMAND", 0.5);
                self.write_by_name("HYD_AILERON_RIGHT_DEMAND", 0.5);
                self
            }

            fn set_elevator_neutral(mut self) -> Self {
                self.write_by_name("HYD_ELEVATOR_DEMAND", 0.5);
                self
            }

            fn set_ailerons_left_turn(mut self) -> Self {
                self.write_by_name("HYD_AILERON_LEFT_DEMAND", 1.);
                self.write_by_name("HYD_AILERON_RIGHT_DEMAND", 0.);
                self
            }

            fn set_ailerons_right_turn(mut self) -> Self {
                self.write_by_name("HYD_AILERON_LEFT_DEMAND", 0.);
                self.write_by_name("HYD_AILERON_RIGHT_DEMAND", 1.);
                self
            }

            fn empty_brake_accumulator_using_park_brake(mut self) -> Self {
                self = self
                    .set_park_brake(true)
                    .run_waiting_for(Duration::from_secs(1));

                let mut number_of_loops = 0;
                while self
                    .get_brake_yellow_accumulator_fluid_volume()
                    .get::<gallon>()
                    > 0.001
                {
                    self = self
                        .set_park_brake(false)
                        .run_waiting_for(Duration::from_secs(1))
                        .set_park_brake(true)
                        .run_waiting_for(Duration::from_secs(1));
                    number_of_loops += 1;
                    assert!(number_of_loops < 20);
                }

                self = self
                    .set_park_brake(false)
                    .run_waiting_for(Duration::from_secs(1))
                    .set_park_brake(true)
                    .run_waiting_for(Duration::from_secs(1));

                self
            }

            fn empty_brake_accumulator_using_pedal_brake(mut self) -> Self {
                let mut number_of_loops = 0;
                while self
                    .get_brake_yellow_accumulator_fluid_volume()
                    .get::<gallon>()
                    > 0.001
                {
                    self = self
                        .set_left_brake(Ratio::new::<percent>(100.))
                        .set_right_brake(Ratio::new::<percent>(100.))
                        .run_waiting_for(Duration::from_secs(1))
                        .set_left_brake(Ratio::new::<percent>(0.))
                        .set_right_brake(Ratio::new::<percent>(0.))
                        .run_waiting_for(Duration::from_secs(1));
                    number_of_loops += 1;
                    assert!(number_of_loops < 50);
                }

                self = self
                    .set_left_brake(Ratio::new::<percent>(100.))
                    .set_right_brake(Ratio::new::<percent>(100.))
                    .run_waiting_for(Duration::from_secs(1))
                    .set_left_brake(Ratio::new::<percent>(0.))
                    .set_right_brake(Ratio::new::<percent>(0.))
                    .run_waiting_for(Duration::from_secs(1));

                self
            }

            fn press_blue_epump_override_button_once(self) -> Self {
                self.set_blue_e_pump_ovrd_pressed(true)
                    .run_one_tick()
                    .set_blue_e_pump_ovrd_pressed(false)
                    .run_one_tick()
            }
        }
        impl TestBed for A320HydraulicsTestBed {
            type Aircraft = A320HydraulicsTestAircraft;

            fn test_bed(&self) -> &SimulationTestBed<A320HydraulicsTestAircraft> {
                &self.test_bed
            }

            fn test_bed_mut(&mut self) -> &mut SimulationTestBed<A320HydraulicsTestAircraft> {
                &mut self.test_bed
            }
        }

        fn test_bed() -> A320HydraulicsTestBed {
            A320HydraulicsTestBed::new()
        }

        fn test_bed_with() -> A320HydraulicsTestBed {
            test_bed()
        }

        #[test]
        fn pressure_state_at_init_one_simulation_step() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            assert!(test_bed.is_ptu_enabled());

            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(50.));
            assert!(!test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() < Pressure::new::<psi>(50.));
            assert!(!test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(50.));
        }

        #[test]
        fn pressure_state_after_5s() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_waiting_for(Duration::from_secs(5));

            assert!(test_bed.is_ptu_enabled());

            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(50.));
            assert!(!test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() < Pressure::new::<psi>(50.));
            assert!(!test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(50.));
        }

        #[test]
        fn ptu_inhibited_by_overhead_off_push_button() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // Enabled on cold start
            assert!(test_bed.is_ptu_enabled());

            // Ptu push button disables PTU accordingly
            test_bed = test_bed.set_ptu_state(false).run_one_tick();
            assert!(!test_bed.is_ptu_enabled());
            test_bed = test_bed.set_ptu_state(true).run_one_tick();
            assert!(test_bed.is_ptu_enabled());
        }

        #[test]
        fn ptu_inhibited_on_ground_when_only_one_engine_on_and_park_brake_on() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .start_eng2(Ratio::new::<percent>(80.))
                .run_one_tick();

            assert!(!test_bed.is_ptu_enabled());

            test_bed = test_bed.set_park_brake(false).run_one_tick();
            assert!(test_bed.is_ptu_enabled());

            test_bed = test_bed.set_park_brake(true).run_one_tick();
            assert!(!test_bed.is_ptu_enabled());
        }

        #[test]
        fn ptu_inhibited_on_ground_is_activated_when_center_gear_in_air() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .start_eng2(Ratio::new::<percent>(80.))
                .run_one_tick();

            assert!(!test_bed.is_ptu_enabled());

            test_bed = test_bed.rotates_on_runway().run_one_tick();
            assert!(test_bed.is_ptu_enabled());
        }

        #[test]
        fn ptu_unpowered_cant_inhibit() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // Enabled on cold start
            assert!(test_bed.is_ptu_enabled());

            // Ptu push button disables PTU accordingly
            test_bed = test_bed.set_ptu_state(false).run_one_tick();
            assert!(!test_bed.is_ptu_enabled());

            // No power on closing valve : ptu become active
            test_bed = test_bed.dc_ground_service_lost().run_one_tick();
            assert!(test_bed.is_ptu_enabled());

            test_bed = test_bed.dc_ground_service_avail().run_one_tick();
            assert!(!test_bed.is_ptu_enabled());
        }

        #[test]
        fn ptu_cargo_operation_inhibit() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // Enabled on cold start
            assert!(test_bed.is_ptu_enabled());

            // Ptu disabled from cargo operation
            test_bed = test_bed.open_fwd_cargo_door().run_waiting_for(
                Duration::from_secs(1) + A320DoorController::DELAY_UNLOCK_TO_HYDRAULIC_CONTROL,
            );

            assert!(!test_bed.is_ptu_enabled());
            test_bed = test_bed.run_waiting_for(
                Duration::from_secs(25) + A320PowerTransferUnitController::DURATION_OF_PTU_INHIBIT_AFTER_CARGO_DOOR_OPERATION,
            ); // Should re enabled after 40s
            assert!(test_bed.is_ptu_enabled());
        }

        #[test]
        fn nose_wheel_pin_detection() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            assert!(!test_bed.query(|a| a.is_nws_pin_inserted()));
            assert!(!test_bed.is_nw_disc_memo_shown());

            test_bed = test_bed.set_pushback_state(true).run_one_tick();
            assert!(test_bed.query(|a| a.is_nws_pin_inserted()));
            assert!(test_bed.is_nw_disc_memo_shown());

            test_bed = test_bed
                .set_pushback_state(false)
                .run_waiting_for(Duration::from_secs(1));
            assert!(test_bed.query(|a| a.is_nws_pin_inserted()));
            assert!(test_bed.is_nw_disc_memo_shown());

            test_bed = test_bed.set_pushback_state(false).run_waiting_for(
                PushbackTug::DURATION_AFTER_WHICH_NWS_PIN_IS_REMOVED_AFTER_PUSHBACK,
            );

            assert!(!test_bed.query(|a| a.is_nws_pin_inserted()));
            assert!(!test_bed.is_nw_disc_memo_shown());
        }

        #[test]
        fn cargo_door_yellow_epump_powering() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            assert!(!test_bed.query(|a| a.is_cargo_powering_yellow_epump()));

            // Need to wait for operator to first unlock, then activate hydraulic control
            test_bed = test_bed.open_fwd_cargo_door().run_waiting_for(
                Duration::from_secs(1) + A320DoorController::DELAY_UNLOCK_TO_HYDRAULIC_CONTROL,
            );
            assert!(test_bed.query(|a| a.is_cargo_powering_yellow_epump()));

            // Wait for the door to fully open
            test_bed = test_bed.run_waiting_for(Duration::from_secs(25));
            assert!(test_bed.is_cargo_fwd_door_locked_up());

            test_bed = test_bed.run_waiting_for(
                A320YellowElectricPumpController::DURATION_OF_YELLOW_PUMP_ACTIVATION_AFTER_CARGO_DOOR_OPERATION,
            );

            assert!(!test_bed.query(|a| a.is_cargo_powering_yellow_epump()));
        }

        #[test]
        fn ptu_pressurise_green_from_yellow_epump() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // Enabled on cold start
            assert!(test_bed.is_ptu_enabled());

            // Yellow epump ON / Waiting 25s
            test_bed = test_bed
                .set_yellow_e_pump(false)
                .run_waiting_for(Duration::from_secs(55));

            assert!(test_bed.is_ptu_enabled());

            // Now we should have pressure in yellow and green
            assert!(test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() > Pressure::new::<psi>(2000.));
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(3100.));

            assert!(!test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.blue_pressure() > Pressure::new::<psi>(-50.));

            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2000.));
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(3100.));

            // Ptu push button disables PTU / green press should fall
            test_bed = test_bed
                .set_ptu_state(false)
                .run_waiting_for(Duration::from_secs(20));
            assert!(!test_bed.is_ptu_enabled());

            // Now we should have pressure in yellow only
            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(500.));
            assert!(!test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2000.));
        }

        #[test]
        fn ptu_pressurise_green_from_yellow_epump_and_edp2() {
            let mut test_bed = test_bed_with()
                .set_cold_dark_inputs()
                .on_the_ground()
                .start_eng2(Ratio::new::<percent>(100.))
                .set_park_brake(false)
                .set_yellow_e_pump(false)
                .set_yellow_ed_pump(true) // Else Ptu inhibited by parking brake
                .run_waiting_for(Duration::from_secs(25));

            assert!(test_bed.is_ptu_enabled());

            // Now we should have pressure in yellow and green
            assert!(test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() > Pressure::new::<psi>(2000.));
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(3100.));

            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2000.));
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(3100.));
        }

        #[test]
        fn green_edp_buildup() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // Starting eng 1
            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(80.))
                .run_one_tick();

            // ALMOST No pressure
            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(1000.));

            // Blue is auto run from engine master switches logic
            assert!(!test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() < Pressure::new::<psi>(1000.));
            assert!(!test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(1000.));

            // Waiting for 5s pressure should be at 3000 psi
            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(5));

            assert!(test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() > Pressure::new::<psi>(2900.));
            assert!(test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() > Pressure::new::<psi>(2500.));
            assert!(!test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(50.));

            // Stoping engine, pressure should fall in 20s
            test_bed = test_bed
                .stop_eng1()
                .run_waiting_for(Duration::from_secs(20));

            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(500.));
            assert!(!test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() < Pressure::new::<psi>(200.));
            assert!(!test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(50.));
        }

        #[test]
        fn green_edp_no_fault_on_ground_eng_off() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_waiting_for(Duration::from_millis(500));

            // EDP should be commanded on even without engine running
            assert!(test_bed.is_green_edp_commanded_on());
            // EDP should have no fault
            assert!(!test_bed.green_edp_has_fault());
        }

        #[test]
        fn green_edp_fault_not_on_ground_eng_off() {
            let mut test_bed = test_bed_with()
                .set_cold_dark_inputs()
                .in_flight()
                .engines_off()
                .run_one_tick();

            // EDP should be commanded on even without engine running
            assert!(test_bed.is_green_edp_commanded_on());

            assert!(!test_bed.is_green_pressurised());
            assert!(!test_bed.is_yellow_pressurised());
            // EDP should have a fault as we are in flight
            assert!(test_bed.green_edp_has_fault());
        }

        #[test]
        fn green_edp_fault_on_ground_eng_starting() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_waiting_for(Duration::from_millis(500));

            // EDP should be commanded on even without engine running
            assert!(test_bed.is_green_edp_commanded_on());
            // EDP should have no fault
            assert!(!test_bed.green_edp_has_fault());

            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(3.))
                .run_one_tick();

            assert!(!test_bed.green_edp_has_fault());

            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(80.))
                .run_one_tick();

            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.green_edp_has_fault());

            test_bed = test_bed.run_waiting_for(Duration::from_secs(10));

            // When finally pressurised no fault
            assert!(test_bed.is_green_pressurised());
            assert!(!test_bed.green_edp_has_fault());
        }

        #[test]
        fn yellow_edp_no_fault_on_ground_eng_off() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_waiting_for(Duration::from_millis(500));

            // EDP should be commanded on even without engine running
            assert!(test_bed.is_yellow_edp_commanded_on());
            // EDP should have no fault
            assert!(!test_bed.yellow_edp_has_fault());
        }

        #[test]
        fn yellow_edp_fault_not_on_ground_eng_off() {
            let mut test_bed = test_bed_with()
                .set_cold_dark_inputs()
                .in_flight()
                .engines_off()
                .run_one_tick();

            // EDP should be commanded on even without engine running
            assert!(test_bed.is_yellow_edp_commanded_on());

            assert!(!test_bed.is_green_pressurised());
            assert!(!test_bed.is_yellow_pressurised());
            // EDP should have a fault as we are in flight
            assert!(test_bed.yellow_edp_has_fault());
        }

        #[test]
        fn yellow_edp_fault_on_ground_eng_starting() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_waiting_for(Duration::from_millis(500));

            // EDP should be commanded on even without engine running
            assert!(test_bed.is_yellow_edp_commanded_on());
            // EDP should have no fault
            assert!(!test_bed.yellow_edp_has_fault());

            test_bed = test_bed
                .start_eng2(Ratio::new::<percent>(3.))
                .run_one_tick();

            assert!(!test_bed.yellow_edp_has_fault());

            test_bed = test_bed
                .start_eng2(Ratio::new::<percent>(80.))
                .run_one_tick();

            assert!(!test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_edp_has_fault());

            test_bed = test_bed.run_waiting_for(Duration::from_secs(10));

            // When finally pressurised no fault
            assert!(test_bed.is_yellow_pressurised());
            assert!(!test_bed.yellow_edp_has_fault());
        }

        #[test]
        fn blue_epump_no_fault_on_ground_eng_starting() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_waiting_for(Duration::from_millis(500));

            // Blue epump should have no fault
            assert!(!test_bed.blue_epump_has_fault());

            test_bed = test_bed
                .start_eng2(Ratio::new::<percent>(3.))
                .run_one_tick();

            assert!(!test_bed.blue_epump_has_fault());

            test_bed = test_bed
                .start_eng2(Ratio::new::<percent>(80.))
                .run_one_tick();

            assert!(!test_bed.is_blue_pressurised());
            assert!(test_bed.blue_epump_has_fault());

            test_bed = test_bed.run_waiting_for(Duration::from_secs(10));

            // When finally pressurised no fault
            assert!(test_bed.is_blue_pressurised());
            assert!(!test_bed.blue_epump_has_fault());
        }

        #[test]
        fn blue_epump_fault_on_ground_using_override() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_waiting_for(Duration::from_millis(500));

            // Blue epump should have no fault
            assert!(!test_bed.blue_epump_has_fault());

            test_bed = test_bed.press_blue_epump_override_button_once();
            assert!(test_bed.blue_epump_override_is_on());

            // As we use override, this bypasses eng off fault inhibit so we have a fault
            assert!(test_bed.blue_epump_has_fault());

            test_bed = test_bed.run_waiting_for(Duration::from_secs(10));

            // When finally pressurised no fault
            assert!(test_bed.is_blue_pressurised());
            assert!(!test_bed.blue_epump_has_fault());
        }

        #[test]
        fn green_edp_press_low_engine_off_to_on() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_waiting_for(Duration::from_millis(500));

            // EDP should be commanded on even without engine running
            assert!(test_bed.is_green_edp_commanded_on());

            // EDP should be LOW pressure state
            assert!(test_bed.is_green_edp_press_low());

            // Starting eng 1 N2 is low at start
            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(3.))
                .run_one_tick();

            // Engine commanded on but pressure couldn't rise enough: we are in fault low
            assert!(test_bed.is_green_edp_press_low());

            // Waiting for 5s pressure should be at 3000 psi
            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(25));

            // No more fault LOW expected
            assert!(test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() > Pressure::new::<psi>(2900.));
            assert!(!test_bed.is_green_edp_press_low());

            // Stoping pump, no fault expected
            test_bed = test_bed
                .set_green_ed_pump(false)
                .run_waiting_for(Duration::from_secs(1));
            assert!(!test_bed.is_green_edp_press_low());
        }

        #[test]
        fn green_edp_press_low_engine_on_to_off() {
            let mut test_bed = test_bed_with()
                .on_the_ground()
                .set_cold_dark_inputs()
                .start_eng1(Ratio::new::<percent>(75.))
                .run_waiting_for(Duration::from_secs(5));

            // EDP should be commanded on even without engine running
            assert!(test_bed.is_green_edp_commanded_on());
            assert!(test_bed.is_green_pressurised());
            // EDP should not be in fault low when engine running and pressure is ok
            assert!(!test_bed.is_green_edp_press_low());

            // Stoping eng 1 with N2 still turning
            test_bed = test_bed.stopping_eng1().run_one_tick();

            // Edp should still be in pressurized mode but as engine just stopped no fault
            assert!(test_bed.is_green_edp_commanded_on());
            assert!(!test_bed.is_green_edp_press_low());

            // Waiting for 25s pressure should drop and still no fault
            test_bed = test_bed
                .stop_eng1()
                .run_waiting_for(Duration::from_secs(25));

            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(500.));
            assert!(test_bed.is_green_edp_press_low());
        }

        #[test]
        fn yellow_edp_press_low_engine_on_to_off() {
            let mut test_bed = test_bed_with()
                .on_the_ground()
                .set_cold_dark_inputs()
                .start_eng2(Ratio::new::<percent>(75.))
                .run_waiting_for(Duration::from_secs(5));

            // EDP should be commanded on even without engine running
            assert!(test_bed.is_yellow_edp_commanded_on());
            assert!(test_bed.is_yellow_pressurised());
            // EDP should not be in fault low when engine running and pressure is ok
            assert!(!test_bed.is_yellow_edp_press_low());

            // Stoping eng 2 with N2 still turning
            test_bed = test_bed.stopping_eng2().run_one_tick();

            // Edp should still be in pressurized mode but as engine just stopped no fault
            assert!(test_bed.is_yellow_edp_commanded_on());
            assert!(!test_bed.is_yellow_edp_press_low());

            // Waiting for 25s pressure should drop and still no fault
            test_bed = test_bed
                .stop_eng2()
                .run_waiting_for(Duration::from_secs(25));

            assert!(!test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(500.));
            assert!(test_bed.is_yellow_edp_press_low());
        }

        #[test]
        fn yellow_edp_press_low_engine_off_to_on() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // EDP should be commanded on even without engine running
            assert!(test_bed.is_yellow_edp_commanded_on());

            // EDP should be LOW pressure state
            assert!(test_bed.is_yellow_edp_press_low());

            // Starting eng 2 N2 is low at start
            test_bed = test_bed
                .start_eng2(Ratio::new::<percent>(3.))
                .run_one_tick();

            // Engine commanded on but pressure couldn't rise enough: we are in fault low
            assert!(test_bed.is_yellow_edp_press_low());

            // Waiting for 5s pressure should be at 3000 psi
            test_bed = test_bed
                .start_eng2(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(5));

            // No more fault LOW expected
            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2900.));
            assert!(!test_bed.is_yellow_edp_press_low());

            // Stoping pump, no fault expected
            test_bed = test_bed
                .set_yellow_ed_pump(false)
                .run_waiting_for(Duration::from_secs(1));
            assert!(!test_bed.is_yellow_edp_press_low());
        }

        #[test]
        fn yellow_edp_press_low_engine_off_to_on_with_e_pump() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .set_ptu_state(false)
                .set_yellow_e_pump(false)
                .run_one_tick();

            // EDP should be commanded on even without engine running
            assert!(test_bed.is_yellow_edp_commanded_on());

            // EDP should be LOW pressure state
            assert!(test_bed.is_yellow_edp_press_low());

            // Waiting for 20s pressure should be at 3000 psi
            test_bed = test_bed.run_waiting_for(Duration::from_secs(20));

            // Yellow pressurised but edp still off, we expect fault LOW press
            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2900.));
            assert!(test_bed.is_yellow_edp_press_low());

            // Starting eng 2 N2 is low at start
            test_bed = test_bed
                .start_eng2(Ratio::new::<percent>(3.))
                .run_one_tick();

            // Engine commanded on but pressure couldn't rise enough: we are in fault low
            assert!(test_bed.is_yellow_edp_press_low());

            // Waiting for 5s pressure should be at 3000 psi in EDP section
            test_bed = test_bed
                .start_eng2(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(5));

            // No more fault LOW expected
            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2900.));
            assert!(!test_bed.is_yellow_edp_press_low());
        }

        #[test]
        fn green_edp_press_low_engine_off_to_on_with_ptu() {
            let mut test_bed = test_bed_with()
                .on_the_ground()
                .set_cold_dark_inputs()
                .set_park_brake(false)
                .start_eng2(Ratio::new::<percent>(80.))
                .run_one_tick();

            // EDP should be LOW pressure state
            assert!(test_bed.is_green_edp_press_low());

            // Waiting for 20s pressure should be at 2300+ psi thanks to ptu
            test_bed = test_bed.run_waiting_for(Duration::from_secs(20));

            // Yellow pressurised by engine2, green presurised from ptu we expect fault LOW press on EDP1
            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2800.));
            assert!(test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() > Pressure::new::<psi>(2300.));
            assert!(test_bed.is_green_edp_press_low());

            // Starting eng 1 N2 is low at start
            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(3.))
                .run_one_tick();

            // Engine commanded on but pressure couldn't rise enough: we are in fault low
            assert!(test_bed.is_green_edp_press_low());

            // Waiting for 5s pressure should be at 3000 psi in EDP section
            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(5));

            // No more fault LOW expected
            assert!(test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() > Pressure::new::<psi>(2900.));
            assert!(!test_bed.is_green_edp_press_low());
        }

        #[test]
        fn yellow_epump_press_low_at_pump_on() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // EDP should not be in fault low when cold start
            assert!(!test_bed.is_yellow_epump_press_low());

            // Starting epump
            test_bed = test_bed.set_yellow_e_pump(false).run_one_tick();

            // Pump commanded on but pressure couldn't rise enough: we are in fault low
            assert!(test_bed.is_yellow_epump_press_low());

            // Waiting for 20s pressure should be at 3000 psi
            test_bed = test_bed.run_waiting_for(Duration::from_secs(20));

            // No more fault LOW expected
            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2500.));
            assert!(!test_bed.is_yellow_epump_press_low());

            // Stoping epump, no fault expected
            test_bed = test_bed
                .set_yellow_e_pump(true)
                .run_waiting_for(Duration::from_secs(1));
            assert!(!test_bed.is_yellow_epump_press_low());
        }

        #[test]
        fn blue_epump_press_low_at_pump_on() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // EDP should not be in fault low when cold start
            assert!(!test_bed.is_blue_epump_press_low());

            // Starting epump
            test_bed = test_bed.press_blue_epump_override_button_once();
            assert!(test_bed.blue_epump_override_is_on());

            // Pump commanded on but pressure couldn't rise enough: we are in fault low
            assert!(test_bed.is_blue_epump_press_low());

            // Waiting for 10s pressure should be at 3000 psi
            test_bed = test_bed.run_waiting_for(Duration::from_secs(10));

            // No more fault LOW expected
            assert!(test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() > Pressure::new::<psi>(2900.));
            assert!(!test_bed.is_blue_epump_press_low());

            // Stoping epump, no fault expected
            test_bed = test_bed.press_blue_epump_override_button_once();
            assert!(!test_bed.blue_epump_override_is_on());

            test_bed = test_bed.run_waiting_for(Duration::from_secs(1));
            assert!(!test_bed.is_blue_epump_press_low());
        }

        #[test]
        fn blue_epump_override_switches_to_off_when_losing_relay_power_and_stays_off() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // Starting epump
            test_bed = test_bed
                .press_blue_epump_override_button_once()
                .run_waiting_for(Duration::from_secs(10));
            assert!(test_bed.blue_epump_override_is_on());
            assert!(test_bed.is_blue_pressurised());

            // Killing the bus corresponding to the latching relay of blue pump override push button
            // It should set the override state back to off without touching the push button
            test_bed = test_bed.dc_ess_lost().run_one_tick();
            assert!(!test_bed.blue_epump_override_is_on());

            // Stays off even powered back
            test_bed = test_bed.dc_ess_active().run_one_tick();
            assert!(!test_bed.blue_epump_override_is_on());

            test_bed = test_bed.run_waiting_for(Duration::from_secs(10));
            assert!(!test_bed.is_blue_pressurised());
        }

        #[test]
        fn blue_epump_override_switches_to_off_when_pump_forced_off_on_hyd_panel() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // Starting epump
            test_bed = test_bed
                .press_blue_epump_override_button_once()
                .run_waiting_for(Duration::from_secs(10));
            assert!(test_bed.blue_epump_override_is_on());
            assert!(test_bed.is_blue_pressurised());

            test_bed = test_bed.set_blue_e_pump(false).run_one_tick();
            assert!(!test_bed.blue_epump_override_is_on());
        }

        #[test]
        fn edp_deactivation() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .set_ptu_state(false)
                .run_one_tick();

            // Starting eng 1 and eng 2
            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(80.))
                .start_eng2(Ratio::new::<percent>(80.))
                .run_one_tick();

            // ALMOST No pressure
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(1000.));
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(1000.));

            // Waiting for 5s pressure should be at 3000 psi
            test_bed = test_bed.run_waiting_for(Duration::from_secs(5));

            assert!(test_bed.green_pressure() > Pressure::new::<psi>(2900.));
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2900.));

            // Stoping edp1, pressure should fall in 20s
            test_bed = test_bed
                .set_green_ed_pump(false)
                .run_waiting_for(Duration::from_secs(20));

            assert!(test_bed.green_pressure() < Pressure::new::<psi>(500.));
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2900.));

            // Stoping edp2, pressure should fall in 20s
            test_bed = test_bed
                .set_yellow_ed_pump(false)
                .run_waiting_for(Duration::from_secs(20));

            assert!(test_bed.green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(500.));
        }

        #[test]
        fn yellow_edp_buildup() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // Starting eng 1
            test_bed = test_bed
                .start_eng2(Ratio::new::<percent>(80.))
                .run_one_tick();
            // ALMOST No pressure
            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(50.));
            assert!(!test_bed.is_blue_pressurised());

            // Blue is auto run
            assert!(test_bed.blue_pressure() < Pressure::new::<psi>(1000.));
            assert!(!test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(1000.));

            // Waiting for 5s pressure should be at 3000 psi
            test_bed = test_bed
                .start_eng2(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(5));

            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() > Pressure::new::<psi>(2500.));
            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2800.));

            // Stoping engine, pressure should fall in 20s
            test_bed = test_bed
                .stop_eng2()
                .run_waiting_for(Duration::from_secs(20));

            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(50.));
            assert!(!test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() < Pressure::new::<psi>(200.));
            assert!(!test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(500.));
        }

        #[test]
        fn when_yellow_edp_solenoid_main_power_bus_unavailable_backup_bus_keeps_pump_in_unpressurised_state(
        ) {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            test_bed = test_bed
                .start_eng2(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(15));

            assert!(test_bed.is_yellow_pressurised());

            // Stoping EDP manually
            test_bed = test_bed
                .set_yellow_ed_pump(false)
                .run_waiting_for(Duration::from_secs(15));

            assert!(!test_bed.is_yellow_pressurised());

            test_bed = test_bed
                .dc_bus_2_lost()
                .run_waiting_for(Duration::from_secs(15));

            // Yellow solenoid has backup power from DC ESS BUS
            assert!(!test_bed.is_yellow_pressurised());
        }

        #[test]
        fn when_yellow_edp_solenoid_both_bus_unpowered_yellow_hydraulic_system_is_pressurised() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            test_bed = test_bed
                .start_eng2(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(15));

            assert!(test_bed.is_yellow_pressurised());

            // Stoping EDP manually
            test_bed = test_bed
                .set_yellow_ed_pump(false)
                .run_waiting_for(Duration::from_secs(15));

            assert!(!test_bed.is_yellow_pressurised());

            test_bed = test_bed
                .dc_ess_lost()
                .dc_bus_2_lost()
                .run_waiting_for(Duration::from_secs(15));

            // Now solenoid defaults to pressurised without power
            assert!(test_bed.is_yellow_pressurised());
        }

        #[test]
        fn when_green_edp_solenoid_unpowered_yellow_hydraulic_system_is_pressurised() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(15));

            assert!(test_bed.is_green_pressurised());

            // Stoping EDP manually
            test_bed = test_bed
                .set_green_ed_pump(false)
                .run_waiting_for(Duration::from_secs(15));

            assert!(!test_bed.is_green_pressurised());

            test_bed = test_bed
                .dc_ess_lost()
                .run_waiting_for(Duration::from_secs(15));

            // Now solenoid defaults to pressurised
            assert!(test_bed.is_green_pressurised());
        }

        #[test]
        #[ignore]
        // Checks numerical stability of reservoir level: level should remain after multiple pressure cycles
        fn yellow_circuit_reservoir_coherency() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .set_ptu_state(false)
                // Park brake off to not use fluid in brakes
                .set_park_brake(false)
                .run_one_tick();

            // Starting epump wait for pressure rise to make sure system is primed including brake accumulator
            test_bed = test_bed
                .set_yellow_e_pump(false)
                .run_waiting_for(Duration::from_secs(20));
            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(3500.));
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2500.));

            // Shutdown and wait for pressure stabilisation
            test_bed = test_bed
                .set_yellow_e_pump(true)
                .run_waiting_for(Duration::from_secs(50));
            assert!(!test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(-50.));

            let reservoir_level_after_priming = test_bed.get_yellow_reservoir_volume();

            let total_fluid_res_plus_accumulator_before_loops = reservoir_level_after_priming
                + test_bed.get_brake_yellow_accumulator_fluid_volume();

            // Now doing cycles of pressurisation on EDP and ePump
            for _ in 1..6 {
                test_bed = test_bed
                    .start_eng2(Ratio::new::<percent>(80.))
                    .run_waiting_for(Duration::from_secs(50));

                assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(3100.));
                assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2500.));

                let mut current_res_level = test_bed.get_yellow_reservoir_volume();
                assert!(current_res_level < reservoir_level_after_priming);

                test_bed = test_bed
                    .stop_eng2()
                    .run_waiting_for(Duration::from_secs(50));
                assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(50.));
                assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(-50.));

                test_bed = test_bed
                    .set_yellow_e_pump(false)
                    .run_waiting_for(Duration::from_secs(50));

                assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(3500.));
                assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2500.));

                current_res_level = test_bed.get_yellow_reservoir_volume();
                assert!(current_res_level < reservoir_level_after_priming);

                test_bed = test_bed
                    .set_yellow_e_pump(true)
                    .run_waiting_for(Duration::from_secs(50));
                assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(50.));
                assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(-50.));
            }
            let total_fluid_res_plus_accumulator_after_loops = test_bed
                .get_yellow_reservoir_volume()
                + test_bed.get_brake_yellow_accumulator_fluid_volume();

            let total_fluid_difference = total_fluid_res_plus_accumulator_before_loops
                - total_fluid_res_plus_accumulator_after_loops;

            // Make sure no more deviation than 0.001 gallon is lost after full pressure and unpressurized states
            assert!(total_fluid_difference.get::<gallon>().abs() < 0.001);
        }

        #[test]
        #[ignore]
        // Checks numerical stability of reservoir level: level should remain after multiple pressure cycles
        fn green_circuit_reservoir_coherency() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .set_ptu_state(false)
                .run_one_tick();

            // Starting EDP wait for pressure rise to make sure system is primed
            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(20));
            assert!(test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(3500.));
            assert!(test_bed.green_pressure() > Pressure::new::<psi>(2500.));

            // Shutdown and wait for pressure stabilisation
            test_bed = test_bed
                .stop_eng1()
                .run_waiting_for(Duration::from_secs(50));
            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.green_pressure() > Pressure::new::<psi>(-50.));

            let reservoir_level_after_priming = test_bed.get_green_reservoir_volume();

            // Now doing cycles of pressurisation on EDP
            for _ in 1..6 {
                test_bed = test_bed
                    .start_eng1(Ratio::new::<percent>(80.))
                    .run_waiting_for(Duration::from_secs(50));

                assert!(test_bed.green_pressure() < Pressure::new::<psi>(3500.));
                assert!(test_bed.green_pressure() > Pressure::new::<psi>(2500.));

                let current_res_level = test_bed.get_green_reservoir_volume();
                assert!(current_res_level < reservoir_level_after_priming);

                test_bed = test_bed
                    .stop_eng1()
                    .run_waiting_for(Duration::from_secs(50));
                assert!(test_bed.green_pressure() < Pressure::new::<psi>(50.));
                assert!(test_bed.green_pressure() > Pressure::new::<psi>(-50.));
            }

            let total_fluid_difference =
                reservoir_level_after_priming - test_bed.get_green_reservoir_volume();

            // Make sure no more deviation than 0.001 gallon is lost after full pressure and unpressurized states
            assert!(total_fluid_difference.get::<gallon>().abs() < 0.001);
        }

        #[test]
        #[ignore]
        // Checks numerical stability of reservoir level: level should remain after multiple pressure cycles
        fn blue_circuit_reservoir_coherency() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // Starting blue_epump wait for pressure rise to make sure system is primed
            test_bed = test_bed.press_blue_epump_override_button_once();
            assert!(test_bed.blue_epump_override_is_on());

            test_bed = test_bed.run_waiting_for(Duration::from_secs(20));
            assert!(test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() < Pressure::new::<psi>(3500.));
            assert!(test_bed.blue_pressure() > Pressure::new::<psi>(2500.));

            // Shutdown and wait for pressure stabilisation
            test_bed = test_bed.press_blue_epump_override_button_once();
            assert!(!test_bed.blue_epump_override_is_on());

            test_bed = test_bed.run_waiting_for(Duration::from_secs(50));

            assert!(!test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.blue_pressure() > Pressure::new::<psi>(-50.));

            let reservoir_level_after_priming = test_bed.get_blue_reservoir_volume();

            // Now doing cycles of pressurisation on epump relying on auto run of epump when eng is on
            for _ in 1..6 {
                test_bed = test_bed
                    .start_eng1(Ratio::new::<percent>(80.))
                    .run_waiting_for(Duration::from_secs(50));

                assert!(test_bed.blue_pressure() < Pressure::new::<psi>(3500.));
                assert!(test_bed.blue_pressure() > Pressure::new::<psi>(2500.));

                let current_res_level = test_bed.get_blue_reservoir_volume();
                assert!(current_res_level < reservoir_level_after_priming);

                test_bed = test_bed
                    .stop_eng1()
                    .run_waiting_for(Duration::from_secs(50));
                assert!(test_bed.blue_pressure() < Pressure::new::<psi>(50.));
                assert!(test_bed.blue_pressure() > Pressure::new::<psi>(-50.));

                // Now engine 2 is used
                test_bed = test_bed
                    .start_eng2(Ratio::new::<percent>(80.))
                    .run_waiting_for(Duration::from_secs(50));

                assert!(test_bed.blue_pressure() < Pressure::new::<psi>(3500.));
                assert!(test_bed.blue_pressure() > Pressure::new::<psi>(2500.));

                let current_res_level = test_bed.get_blue_reservoir_volume();
                assert!(current_res_level < reservoir_level_after_priming);

                test_bed = test_bed
                    .stop_eng2()
                    .run_waiting_for(Duration::from_secs(50));
                assert!(test_bed.blue_pressure() < Pressure::new::<psi>(50.));
                assert!(test_bed.blue_pressure() > Pressure::new::<psi>(-50.));
            }

            let total_fluid_difference =
                reservoir_level_after_priming - test_bed.get_blue_reservoir_volume();

            // Make sure no more deviation than 0.001 gallon is lost after full pressure and unpressurized states
            assert!(total_fluid_difference.get::<gallon>().abs() < 0.001);
        }

        #[test]
        fn yellow_green_edp_firevalve() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // PTU would mess up the test
            test_bed = test_bed.set_ptu_state(false).run_one_tick();
            assert!(!test_bed.is_ptu_enabled());

            assert!(!test_bed.is_fire_valve_eng1_closed());
            assert!(!test_bed.is_fire_valve_eng2_closed());

            // Starting eng 1
            test_bed = test_bed
                .start_eng2(Ratio::new::<percent>(80.))
                .start_eng1(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(5));

            // Waiting for 5s pressure should be at 3000 psi
            assert!(test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() > Pressure::new::<psi>(2900.));
            assert!(test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() > Pressure::new::<psi>(2500.));
            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2800.));

            assert!(!test_bed.is_fire_valve_eng1_closed());
            assert!(!test_bed.is_fire_valve_eng2_closed());

            // Green shutoff valve
            test_bed = test_bed
                .set_eng1_fire_button(true)
                .run_waiting_for(Duration::from_secs(20));

            assert!(test_bed.is_fire_valve_eng1_closed());
            assert!(!test_bed.is_fire_valve_eng2_closed());

            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(500.));
            assert!(test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() > Pressure::new::<psi>(2500.));
            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2900.));

            // Yellow shutoff valve
            test_bed = test_bed
                .set_eng2_fire_button(true)
                .run_waiting_for(Duration::from_secs(20));

            assert!(test_bed.is_fire_valve_eng1_closed());
            assert!(test_bed.is_fire_valve_eng2_closed());

            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(500.));
            assert!(test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() > Pressure::new::<psi>(2500.));
            assert!(!test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(500.));
        }

        #[test]
        fn yellow_brake_accumulator() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // Getting accumulator pressure on cold start
            let mut accumulator_pressure = test_bed.get_brake_yellow_accumulator_pressure();

            // No brakes on green, no more pressure than in accumulator on yellow
            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
            assert!(
                test_bed.get_brake_left_yellow_pressure()
                    < accumulator_pressure + Pressure::new::<psi>(50.)
            );
            assert!(
                test_bed.get_brake_right_yellow_pressure()
                    < accumulator_pressure + Pressure::new::<psi>(50.)
            );

            // No brakes even if we brake on green, no more than accumulator pressure on yellow
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(100.))
                .set_right_brake(Ratio::new::<percent>(100.))
                .run_waiting_for(Duration::from_secs(5));

            accumulator_pressure = test_bed.get_brake_yellow_accumulator_pressure();

            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
            assert!(
                test_bed.get_brake_left_yellow_pressure()
                    < accumulator_pressure + Pressure::new::<psi>(50.)
            );
            assert!(
                test_bed.get_brake_right_yellow_pressure()
                    < accumulator_pressure + Pressure::new::<psi>(50.)
            );
            assert!(
                test_bed.get_brake_yellow_accumulator_pressure()
                    < accumulator_pressure + Pressure::new::<psi>(50.)
            );

            // Park brake off, loading accumulator, we expect no brake pressure but accumulator loaded
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(0.))
                .set_right_brake(Ratio::new::<percent>(0.))
                .set_park_brake(false)
                .set_yellow_e_pump(false)
                .run_waiting_for(Duration::from_secs(30));

            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2500.));
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(3500.));

            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));

            assert!(test_bed.get_brake_yellow_accumulator_pressure() > Pressure::new::<psi>(2500.));

            // Park brake on, loaded accumulator, we expect brakes on yellow side only
            test_bed = test_bed
                .set_park_brake(true)
                .run_waiting_for(Duration::from_secs(3));

            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_left_yellow_pressure() > Pressure::new::<psi>(2000.));
            assert!(test_bed.get_brake_right_yellow_pressure() > Pressure::new::<psi>(2000.));

            assert!(test_bed.get_brake_yellow_accumulator_pressure() > Pressure::new::<psi>(2500.));
        }

        #[test]
        fn norm_brake_vs_altn_brake() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // Getting accumulator pressure on cold start
            let accumulator_pressure = test_bed.get_brake_yellow_accumulator_pressure();

            // No brakes
            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
            assert!(
                test_bed.get_brake_left_yellow_pressure()
                    < accumulator_pressure + Pressure::new::<psi>(50.)
            );
            assert!(
                test_bed.get_brake_right_yellow_pressure()
                    < accumulator_pressure + Pressure::new::<psi>(50.)
            );

            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(100.))
                .start_eng2(Ratio::new::<percent>(100.))
                .set_park_brake(false)
                .run_waiting_for(Duration::from_secs(5));

            assert!(test_bed.is_green_pressurised());
            assert!(test_bed.is_yellow_pressurised());
            // No brakes if we don't brake
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(0.))
                .set_right_brake(Ratio::new::<percent>(0.))
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));

            // Braking cause green braking system to rise
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(100.))
                .set_right_brake(Ratio::new::<percent>(100.))
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.get_brake_left_green_pressure() > Pressure::new::<psi>(2000.));
            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(3500.));
            assert!(test_bed.get_brake_right_green_pressure() > Pressure::new::<psi>(2000.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(3500.));
            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));

            // Disabling Askid causes alternate braking to work and release green brakes
            test_bed = test_bed
                .set_anti_skid(false)
                .run_waiting_for(Duration::from_secs(2));

            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_left_yellow_pressure() > Pressure::new::<psi>(950.));
            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(3500.));
            assert!(test_bed.get_brake_right_yellow_pressure() > Pressure::new::<psi>(950.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(3500.));
        }

        #[test]
        fn no_brake_inversion() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(100.))
                .start_eng2(Ratio::new::<percent>(100.))
                .set_park_brake(false)
                .run_waiting_for(Duration::from_secs(5));

            assert!(test_bed.is_green_pressurised());
            assert!(test_bed.is_yellow_pressurised());
            // Braking left
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(100.))
                .set_right_brake(Ratio::new::<percent>(0.))
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.get_brake_left_green_pressure() > Pressure::new::<psi>(2000.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));

            // Braking right
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(0.))
                .set_right_brake(Ratio::new::<percent>(100.))
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() > Pressure::new::<psi>(2000.));
            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));

            // Disabling Askid causes alternate braking to work and release green brakes
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(0.))
                .set_right_brake(Ratio::new::<percent>(100.))
                .set_anti_skid(false)
                .run_waiting_for(Duration::from_secs(2));

            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() > Pressure::new::<psi>(950.));

            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(100.))
                .set_right_brake(Ratio::new::<percent>(0.))
                .run_waiting_for(Duration::from_secs(2));

            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_left_yellow_pressure() > Pressure::new::<psi>(950.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));
        }

        #[test]
        fn auto_brake_at_gear_retraction() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(100.))
                .start_eng2(Ratio::new::<percent>(100.))
                .set_park_brake(false)
                .run_waiting_for(Duration::from_secs(15));

            // No brake inputs
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(0.))
                .set_right_brake(Ratio::new::<percent>(0.))
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));

            // Positive climb, gear up
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(0.))
                .set_right_brake(Ratio::new::<percent>(0.))
                .in_flight()
                .set_gear_up()
                .run_waiting_for(Duration::from_secs(1));

            // Check auto brake is active
            assert!(test_bed.get_brake_left_green_pressure() > Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() > Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(1500.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(1500.));

            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));

            // Check no more autobrakes after 3s
            test_bed = test_bed.run_waiting_for(Duration::from_secs(3));

            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));

            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));
        }

        #[test]
        fn alternate_brake_accumulator_is_emptying_while_braking() {
            let mut test_bed = test_bed_with()
                .on_the_ground()
                .set_cold_dark_inputs()
                .start_eng1(Ratio::new::<percent>(100.))
                .start_eng2(Ratio::new::<percent>(100.))
                .set_park_brake(false)
                .run_waiting_for(Duration::from_secs(15));

            // Check we got yellow pressure and brake accumulator loaded
            assert!(test_bed.yellow_pressure() >= Pressure::new::<psi>(2500.));
            assert!(
                test_bed.get_brake_yellow_accumulator_pressure() >= Pressure::new::<psi>(2500.)
            );

            // Disabling green and yellow side so accumulator stop being able to reload
            test_bed = test_bed
                .set_ptu_state(false)
                .set_yellow_ed_pump(false)
                .set_green_ed_pump(false)
                .set_yellow_e_pump(true)
                .run_waiting_for(Duration::from_secs(30));

            assert!(test_bed.yellow_pressure() <= Pressure::new::<psi>(100.));
            assert!(test_bed.green_pressure() <= Pressure::new::<psi>(100.));
            assert!(
                test_bed.get_brake_yellow_accumulator_pressure() >= Pressure::new::<psi>(2500.)
            );

            // Now using brakes and check accumulator gets empty
            test_bed = test_bed
                .empty_brake_accumulator_using_pedal_brake()
                .run_waiting_for(Duration::from_secs(1));

            assert!(
                test_bed.get_brake_yellow_accumulator_pressure() <= Pressure::new::<psi>(1000.)
            );
            assert!(
                test_bed.get_brake_yellow_accumulator_fluid_volume() <= Volume::new::<gallon>(0.01)
            );
        }

        #[test]
        fn brakes_inactive_in_flight() {
            let mut test_bed = test_bed_with()
                .set_cold_dark_inputs()
                .in_flight()
                .set_gear_up()
                .run_waiting_for(Duration::from_secs(10));

            // No brake inputs
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(0.))
                .set_right_brake(Ratio::new::<percent>(0.))
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));

            // Now full brakes
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(100.))
                .set_right_brake(Ratio::new::<percent>(100.))
                .run_waiting_for(Duration::from_secs(1));

            // Check no action on brakes
            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));

            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));
        }

        #[test]
        fn brakes_norm_active_in_flight_gear_down() {
            let mut test_bed = test_bed_with()
                .set_cold_dark_inputs()
                .in_flight()
                .set_gear_up()
                .run_waiting_for(Duration::from_secs(10));

            // Now full brakes gear down
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(100.))
                .set_right_brake(Ratio::new::<percent>(100.))
                .set_gear_down()
                .run_waiting_for(Duration::from_secs(1));

            // Brakes norm should work normally
            assert!(test_bed.get_brake_left_green_pressure() > Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() > Pressure::new::<psi>(50.));

            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));
        }

        #[test]
        fn brakes_alternate_active_in_flight_gear_down() {
            let mut test_bed = test_bed_with()
                .set_cold_dark_inputs()
                .in_flight()
                .set_gear_up()
                .run_waiting_for(Duration::from_secs(10));

            // Now full brakes gear down
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(100.))
                .set_right_brake(Ratio::new::<percent>(100.))
                .set_gear_down()
                .set_anti_skid(false)
                .run_waiting_for(Duration::from_secs(1));

            // Brakes norm should work normally
            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));

            assert!(test_bed.get_brake_left_yellow_pressure() > Pressure::new::<psi>(900.));
            assert!(test_bed.get_brake_right_yellow_pressure() > Pressure::new::<psi>(900.));
        }

        #[test]
        // Testing that green for brakes is only available if park brake is on while altn pressure is at too low level
        fn brake_logic_green_backup_emergency() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // Setting on ground with yellow side hydraulics off
            // This should prevent yellow accumulator to fill
            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(100.))
                .start_eng2(Ratio::new::<percent>(100.))
                .set_park_brake(true)
                .set_ptu_state(false)
                .set_yellow_e_pump(true)
                .set_yellow_ed_pump(false)
                .run_waiting_for(Duration::from_secs(15));

            // Braking but park is on: no output on green brakes expected
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(100.))
                .set_right_brake(Ratio::new::<percent>(100.))
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_left_yellow_pressure() > Pressure::new::<psi>(500.));
            assert!(test_bed.get_brake_right_yellow_pressure() > Pressure::new::<psi>(500.));

            // With no more fluid in yellow accumulator, green should work as emergency
            test_bed = test_bed
                .empty_brake_accumulator_using_park_brake()
                .set_left_brake(Ratio::new::<percent>(100.))
                .set_right_brake(Ratio::new::<percent>(100.))
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.get_brake_left_green_pressure() > Pressure::new::<psi>(1000.));
            assert!(test_bed.get_brake_right_green_pressure() > Pressure::new::<psi>(1000.));
            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));
        }

        #[test]
        fn autobrakes_arms_in_flight_lo_or_med() {
            let mut test_bed = test_bed_with()
                .set_cold_dark_inputs()
                .in_flight()
                .set_gear_up()
                .run_waiting_for(Duration::from_secs(12));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::NONE);

            test_bed = test_bed
                .set_autobrake_low()
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::LOW);

            test_bed = test_bed
                .set_autobrake_med()
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::MED);
        }

        #[test]
        fn autobrakes_disarms_if_green_pressure_low() {
            let mut test_bed = test_bed_with()
                .set_cold_dark_inputs()
                .in_flight()
                .set_gear_up()
                .run_waiting_for(Duration::from_secs(12));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::NONE);

            test_bed = test_bed
                .set_autobrake_low()
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::LOW);

            test_bed = test_bed
                .set_ptu_state(false)
                .stop_eng1()
                .run_waiting_for(Duration::from_secs(20));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::NONE);
        }

        #[test]
        fn autobrakes_disarms_if_askid_off() {
            let mut test_bed = test_bed_with()
                .set_cold_dark_inputs()
                .in_flight()
                .set_gear_up()
                .run_waiting_for(Duration::from_secs(12));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::NONE);

            test_bed = test_bed
                .set_autobrake_med()
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::MED);

            test_bed = test_bed
                .set_anti_skid(false)
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::NONE);
        }

        #[test]
        fn autobrakes_max_wont_arm_in_flight() {
            let mut test_bed = test_bed_with()
                .set_cold_dark_inputs()
                .in_flight()
                .set_gear_up()
                .run_waiting_for(Duration::from_secs(15));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::NONE);

            test_bed = test_bed
                .set_autobrake_max()
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::NONE);
        }

        #[test]
        fn autobrakes_taxiing_wont_disarm_when_braking() {
            let mut test_bed = test_bed_with()
                .set_cold_dark_inputs()
                .on_the_ground()
                .start_eng1(Ratio::new::<percent>(60.))
                .start_eng2(Ratio::new::<percent>(60.))
                .run_waiting_for(Duration::from_secs(10));

            test_bed = test_bed
                .set_autobrake_max()
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::MAX);

            test_bed = test_bed
                .set_right_brake(Ratio::new::<percent>(100.))
                .set_left_brake(Ratio::new::<percent>(100.))
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::MAX);
        }

        #[test]
        fn autobrakes_activates_on_ground_on_spoiler_deploy() {
            let mut test_bed = test_bed_with()
                .set_cold_dark_inputs()
                .on_the_ground()
                .set_park_brake(false)
                .start_eng1(Ratio::new::<percent>(100.))
                .start_eng2(Ratio::new::<percent>(100.))
                .run_waiting_for(Duration::from_secs(10));

            test_bed = test_bed
                .set_autobrake_max()
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::MAX);

            test_bed = test_bed
                .set_deploy_spoilers()
                .run_waiting_for(Duration::from_secs(6));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::MAX);
            assert!(test_bed.get_brake_left_green_pressure() > Pressure::new::<psi>(1000.));
            assert!(test_bed.get_brake_right_green_pressure() > Pressure::new::<psi>(1000.));

            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));
        }

        #[test]
        fn autobrakes_disengage_on_spoiler_retract() {
            let mut test_bed = test_bed_with()
                .set_cold_dark_inputs()
                .on_the_ground()
                .set_park_brake(false)
                .start_eng1(Ratio::new::<percent>(100.))
                .start_eng2(Ratio::new::<percent>(100.))
                .run_waiting_for(Duration::from_secs(10));

            test_bed = test_bed
                .set_autobrake_max()
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::MAX);

            test_bed = test_bed
                .set_deploy_spoilers()
                .run_waiting_for(Duration::from_secs(6));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::MAX);

            test_bed = test_bed
                .set_retract_spoilers()
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::NONE);
            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
        }

        #[test]
        // Should disable with one pedal > 61° over max range of 79.4° thus 77%
        fn autobrakes_max_disengage_at_77_on_one_pedal_input() {
            let mut test_bed = test_bed_with()
                .set_cold_dark_inputs()
                .on_the_ground()
                .set_park_brake(false)
                .start_eng1(Ratio::new::<percent>(100.))
                .start_eng2(Ratio::new::<percent>(100.))
                .run_waiting_for(Duration::from_secs(10));

            test_bed = test_bed
                .set_autobrake_max()
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::MAX);

            test_bed = test_bed
                .set_deploy_spoilers()
                .run_waiting_for(Duration::from_secs(6));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::MAX);
            assert!(test_bed.get_brake_left_green_pressure() > Pressure::new::<psi>(1000.));
            assert!(test_bed.get_brake_right_green_pressure() > Pressure::new::<psi>(1000.));

            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(70.))
                .run_waiting_for(Duration::from_secs(1))
                .set_left_brake(Ratio::new::<percent>(0.))
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::MAX);
            assert!(test_bed.get_brake_left_green_pressure() > Pressure::new::<psi>(1000.));
            assert!(test_bed.get_brake_right_green_pressure() > Pressure::new::<psi>(1000.));

            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(78.))
                .run_waiting_for(Duration::from_secs(1))
                .set_left_brake(Ratio::new::<percent>(0.))
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::NONE);
            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
        }

        #[test]
        fn autobrakes_max_disengage_at_52_on_both_pedal_input() {
            let mut test_bed = test_bed_with()
                .set_cold_dark_inputs()
                .on_the_ground()
                .set_park_brake(false)
                .start_eng1(Ratio::new::<percent>(100.))
                .start_eng2(Ratio::new::<percent>(100.))
                .run_waiting_for(Duration::from_secs(10));

            test_bed = test_bed
                .set_autobrake_max()
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::MAX);

            test_bed = test_bed
                .set_deploy_spoilers()
                .run_waiting_for(Duration::from_secs(6));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::MAX);
            assert!(test_bed.get_brake_left_green_pressure() > Pressure::new::<psi>(1000.));
            assert!(test_bed.get_brake_right_green_pressure() > Pressure::new::<psi>(1000.));

            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(55.))
                .run_waiting_for(Duration::from_secs(1))
                .set_left_brake(Ratio::new::<percent>(0.))
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::MAX);
            assert!(test_bed.get_brake_left_green_pressure() > Pressure::new::<psi>(1000.));
            assert!(test_bed.get_brake_right_green_pressure() > Pressure::new::<psi>(1000.));

            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(55.))
                .set_right_brake(Ratio::new::<percent>(55.))
                .run_waiting_for(Duration::from_secs(1))
                .set_left_brake(Ratio::new::<percent>(0.))
                .set_right_brake(Ratio::new::<percent>(0.))
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::NONE);
            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
        }

        #[test]
        // Should disable with one pedals > 42° over max range of 79.4° thus 52%
        fn autobrakes_med_disengage_at_52_on_one_pedal_input() {
            let mut test_bed = test_bed_with()
                .set_cold_dark_inputs()
                .on_the_ground()
                .set_park_brake(false)
                .start_eng1(Ratio::new::<percent>(100.))
                .start_eng2(Ratio::new::<percent>(100.))
                .run_waiting_for(Duration::from_secs(10));

            test_bed = test_bed
                .set_autobrake_med()
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::MED);

            test_bed = test_bed
                .set_deploy_spoilers()
                .run_waiting_for(Duration::from_secs(6));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::MED);
            assert!(test_bed.get_brake_left_green_pressure() > Pressure::new::<psi>(1000.));
            assert!(test_bed.get_brake_right_green_pressure() > Pressure::new::<psi>(1000.));

            test_bed = test_bed
                .set_right_brake(Ratio::new::<percent>(50.))
                .run_waiting_for(Duration::from_secs(1))
                .set_right_brake(Ratio::new::<percent>(0.))
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::MED);
            assert!(test_bed.get_brake_left_green_pressure() > Pressure::new::<psi>(1000.));
            assert!(test_bed.get_brake_right_green_pressure() > Pressure::new::<psi>(1000.));

            test_bed = test_bed
                .set_right_brake(Ratio::new::<percent>(55.))
                .run_waiting_for(Duration::from_secs(1))
                .set_right_brake(Ratio::new::<percent>(0.))
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::NONE);
            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
        }

        #[test]
        fn autobrakes_med_disengage_at_11_on_both_pedal_input() {
            let mut test_bed = test_bed_with()
                .set_cold_dark_inputs()
                .on_the_ground()
                .set_park_brake(false)
                .start_eng1(Ratio::new::<percent>(100.))
                .start_eng2(Ratio::new::<percent>(100.))
                .run_waiting_for(Duration::from_secs(10));

            test_bed = test_bed
                .set_autobrake_med()
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::MED);

            test_bed = test_bed
                .set_deploy_spoilers()
                .run_waiting_for(Duration::from_secs(6));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::MED);
            assert!(test_bed.get_brake_left_green_pressure() > Pressure::new::<psi>(1000.));
            assert!(test_bed.get_brake_right_green_pressure() > Pressure::new::<psi>(1000.));

            test_bed = test_bed
                .set_right_brake(Ratio::new::<percent>(15.))
                .run_waiting_for(Duration::from_secs(1))
                .set_right_brake(Ratio::new::<percent>(0.))
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::MED);
            assert!(test_bed.get_brake_left_green_pressure() > Pressure::new::<psi>(1000.));
            assert!(test_bed.get_brake_right_green_pressure() > Pressure::new::<psi>(1000.));

            test_bed = test_bed
                .set_right_brake(Ratio::new::<percent>(15.))
                .set_left_brake(Ratio::new::<percent>(15.))
                .run_waiting_for(Duration::from_secs(1))
                .set_right_brake(Ratio::new::<percent>(0.))
                .set_left_brake(Ratio::new::<percent>(0.))
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::NONE);
            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
        }

        #[test]
        fn autobrakes_max_disarm_after_10s_in_flight() {
            let mut test_bed = test_bed_with()
                .set_cold_dark_inputs()
                .on_the_ground()
                .set_park_brake(false)
                .start_eng1(Ratio::new::<percent>(100.))
                .start_eng2(Ratio::new::<percent>(100.))
                .run_waiting_for(Duration::from_secs(10));

            test_bed = test_bed
                .set_autobrake_max()
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::MAX);

            test_bed = test_bed.in_flight().run_waiting_for(Duration::from_secs(6));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::MAX);

            test_bed = test_bed.in_flight().run_waiting_for(Duration::from_secs(6));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::NONE);
        }

        #[test]
        fn controller_blue_epump_activates_when_no_weight_on_center_wheel() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            assert!(!test_bed.query(|a| a.is_blue_epump_controller_pressurising()));

            test_bed = test_bed.rotates_on_runway().run_one_tick();

            assert!(test_bed.query(|a| a.is_blue_epump_controller_pressurising()));
        }

        #[test]
        fn controller_blue_epump_split_engine_states() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            assert!(!test_bed.query(|a| a.is_blue_epump_controller_pressurising()));

            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(65.))
                .run_one_tick();

            assert!(test_bed.query(|a| a.is_blue_epump_controller_pressurising()));

            test_bed = test_bed
                .start_eng2(Ratio::new::<percent>(65.))
                .stop_eng1()
                .run_one_tick();

            assert!(test_bed.query(|a| a.is_blue_epump_controller_pressurising()));
        }

        #[test]
        fn controller_blue_epump_on_off_engines() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .start_eng1(Ratio::new::<percent>(65.))
                .start_eng2(Ratio::new::<percent>(65.))
                .run_one_tick();

            assert!(test_bed.query(|a| a.is_blue_epump_controller_pressurising()));

            test_bed = test_bed.stop_eng1().stop_eng2().run_one_tick();

            assert!(!test_bed.query(|a| a.is_blue_epump_controller_pressurising()));
        }

        #[test]
        fn controller_blue_epump_override() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .press_blue_epump_override_button_once()
                .run_one_tick();

            assert!(test_bed.query(|a| a.is_blue_epump_controller_pressurising()));

            test_bed = test_bed
                .press_blue_epump_override_button_once()
                .run_one_tick();

            assert!(!test_bed.query(|a| a.is_blue_epump_controller_pressurising()));
        }

        #[test]
        fn controller_blue_epump_override_without_power_shall_not_run_blue_pump() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .start_eng1(Ratio::new::<percent>(65.))
                .run_one_tick();

            assert!(test_bed.query(|a| a.is_blue_epump_controller_pressurising()));

            test_bed = test_bed.dc_ess_lost().run_one_tick();

            assert!(!test_bed.query(|a| a.is_blue_epump_controller_pressurising()));
        }

        #[test]
        fn controller_yellow_epump_is_activated_by_overhead_button() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            assert!(!test_bed.query(|a| a.is_yellow_epump_controller_pressurising()));

            test_bed = test_bed.set_yellow_e_pump(false).run_one_tick();

            assert!(test_bed.query(|a| a.is_yellow_epump_controller_pressurising()));

            test_bed = test_bed.set_yellow_e_pump(true).run_one_tick();

            assert!(!test_bed.query(|a| a.is_yellow_epump_controller_pressurising()));
        }

        #[test]
        fn controller_yellow_epump_unpowered_cant_command_pump() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .set_yellow_e_pump(false)
                .run_one_tick();

            assert!(test_bed.query(|a| a.is_yellow_epump_controller_pressurising()));

            test_bed = test_bed.dc_bus_2_lost().run_one_tick();

            assert!(!test_bed.query(|a| a.is_yellow_epump_controller_pressurising()));
        }

        #[test]
        fn controller_yellow_epump_can_operate_from_cargo_door_without_main_control_power_bus() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            assert!(!test_bed.query(|a| a.is_cargo_powering_yellow_epump()));

            test_bed = test_bed
                .dc_ground_service_lost()
                .open_fwd_cargo_door()
                .run_waiting_for(
                    Duration::from_secs(1) + A320DoorController::DELAY_UNLOCK_TO_HYDRAULIC_CONTROL,
                );

            assert!(test_bed.query(|a| a.is_cargo_powering_yellow_epump()));
        }

        #[test]
        fn controller_engine_driven_pump1_overhead_button_logic_with_eng_on() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            assert!(test_bed.query(|a| a.is_edp1_green_pump_controller_pressurising()));

            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(65.))
                .run_one_tick();
            assert!(test_bed.query(|a| a.is_edp1_green_pump_controller_pressurising()));

            test_bed = test_bed.set_green_ed_pump(false).run_one_tick();
            assert!(!test_bed.query(|a| a.is_edp1_green_pump_controller_pressurising()));

            test_bed = test_bed.set_green_ed_pump(true).run_one_tick();
            assert!(test_bed.query(|a| a.is_edp1_green_pump_controller_pressurising()));
        }

        #[test]
        fn controller_engine_driven_pump1_fire_overhead_released_stops_pump() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .start_eng1(Ratio::new::<percent>(65.))
                .start_eng2(Ratio::new::<percent>(65.))
                .run_one_tick();

            assert!(test_bed.query(|a| a.is_edp1_green_pump_controller_pressurising()));

            test_bed = test_bed.set_eng1_fire_button(true).run_one_tick();
            assert!(!test_bed.query(|a| a.is_edp1_green_pump_controller_pressurising()));
        }

        #[test]
        fn controller_engine_driven_pump2_overhead_button_logic_with_eng_on() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            assert!(test_bed.query(|a| a.is_edp2_yellow_pump_controller_pressurising()));

            test_bed = test_bed
                .start_eng2(Ratio::new::<percent>(65.))
                .run_one_tick();
            assert!(test_bed.query(|a| a.is_edp2_yellow_pump_controller_pressurising()));

            test_bed = test_bed.set_yellow_ed_pump(false).run_one_tick();
            assert!(!test_bed.query(|a| a.is_edp2_yellow_pump_controller_pressurising()));

            test_bed = test_bed.set_yellow_ed_pump(true).run_one_tick();
            assert!(test_bed.query(|a| a.is_edp2_yellow_pump_controller_pressurising()));
        }

        #[test]
        fn controller_engine_driven_pump2_fire_overhead_released_stops_pump() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .start_eng1(Ratio::new::<percent>(65.))
                .start_eng2(Ratio::new::<percent>(65.))
                .run_one_tick();

            assert!(test_bed.query(|a| a.is_edp2_yellow_pump_controller_pressurising()));

            test_bed = test_bed.set_eng2_fire_button(true).run_one_tick();
            assert!(!test_bed.query(|a| a.is_edp2_yellow_pump_controller_pressurising()));
        }

        #[test]
        fn controller_ptu_on_off_with_overhead_pushbutton() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            assert!(test_bed.query(|a| a.is_ptu_controller_activating_ptu()));

            test_bed = test_bed.set_ptu_state(false).run_one_tick();

            assert!(!test_bed.query(|a| a.is_ptu_controller_activating_ptu()));

            test_bed = test_bed.set_ptu_state(true).run_one_tick();

            assert!(test_bed.query(|a| a.is_ptu_controller_activating_ptu()));
        }

        #[test]
        fn controller_ptu_off_when_cargo_door_is_moved() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            assert!(test_bed.query(|a| a.is_ptu_controller_activating_ptu()));

            test_bed = test_bed.open_fwd_cargo_door().run_waiting_for(
                Duration::from_secs(1) + A320DoorController::DELAY_UNLOCK_TO_HYDRAULIC_CONTROL,
            );

            assert!(!test_bed.query(|a| a.is_ptu_controller_activating_ptu()));

            // Ptu should reactivate after door fully opened + 40s
            test_bed = test_bed.run_waiting_for(Duration::from_secs(25) + Duration::from_secs(41));

            assert!(test_bed.query(|a| a.is_ptu_controller_activating_ptu()));
        }

        #[test]
        fn controller_ptu_disabled_when_tug_attached() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            assert!(test_bed.query(|a| a.is_ptu_controller_activating_ptu()));

            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(65.))
                .set_park_brake(false)
                .run_one_tick();

            assert!(test_bed.query(|a| a.is_ptu_controller_activating_ptu()));

            test_bed = test_bed.set_pushback_state(true).run_one_tick();

            assert!(!test_bed.query(|a| a.is_ptu_controller_activating_ptu()));

            // Ptu should reactivate after 15ish seconds
            test_bed = test_bed
                .set_pushback_state(false)
                .run_waiting_for(Duration::from_secs(16));

            assert!(test_bed.query(|a| a.is_ptu_controller_activating_ptu()));
        }

        #[test]
        fn rat_does_not_deploy_on_ground_at_eng_off() {
            let mut test_bed = test_bed_with()
                .set_cold_dark_inputs()
                .on_the_ground()
                .start_eng1(Ratio::new::<percent>(80.))
                .start_eng2(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(10));

            assert!(test_bed.is_blue_pressurised());
            assert!(test_bed.get_rat_position() <= 0.);
            assert!(test_bed.get_rat_rpm() <= 1.);

            test_bed = test_bed
                .ac_bus_1_lost()
                .ac_bus_2_lost()
                .run_waiting_for(Duration::from_secs(2));

            // RAT has not deployed
            assert!(test_bed.get_rat_position() <= 0.);
            assert!(test_bed.get_rat_rpm() <= 1.);
        }

        #[test]
        fn rat_deploys_on_both_ac_lost() {
            let mut test_bed = test_bed_with()
                .set_cold_dark_inputs()
                .in_flight()
                .start_eng1(Ratio::new::<percent>(80.))
                .start_eng2(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(10));

            assert!(!test_bed.rat_deploy_commanded());

            test_bed = test_bed
                .ac_bus_1_lost()
                .run_waiting_for(Duration::from_secs(2));

            assert!(!test_bed.rat_deploy_commanded());

            // Now all AC off should deploy RAT in flight
            test_bed = test_bed
                .ac_bus_1_lost()
                .ac_bus_2_lost()
                .run_waiting_for(Duration::from_secs(2));

            assert!(test_bed.rat_deploy_commanded());
        }

        #[test]
        fn blue_epump_unavailable_if_unpowered() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            test_bed = test_bed
                .start_eng2(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(10));

            // Blue epump working
            assert!(test_bed.is_blue_pressurised());

            test_bed = test_bed
                .ac_bus_2_lost()
                .run_waiting_for(Duration::from_secs(25));

            // Blue epump still working as it's not plugged on AC2
            assert!(test_bed.is_blue_pressurised());

            test_bed = test_bed
                .ac_bus_1_lost()
                .run_waiting_for(Duration::from_secs(25));

            // Blue epump has stopped
            assert!(!test_bed.is_blue_pressurised());
        }

        #[test]
        fn yellow_epump_unavailable_if_unpowered() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            test_bed = test_bed
                .set_yellow_e_pump(false)
                .run_waiting_for(Duration::from_secs(10));

            // Yellow epump working
            assert!(test_bed.is_yellow_pressurised());

            test_bed = test_bed
                .ac_bus_2_lost()
                .ac_bus_1_lost()
                .run_waiting_for(Duration::from_secs(25));

            // Yellow epump still working as not plugged on AC2 or AC1
            assert!(test_bed.is_yellow_pressurised());

            test_bed = test_bed
                .ac_ground_service_lost()
                .run_waiting_for(Duration::from_secs(25));

            // Yellow epump has stopped
            assert!(!test_bed.is_yellow_pressurised());
        }

        #[test]
        fn flaps_and_slats_declare_moving() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            test_bed = test_bed
                .set_yellow_e_pump(false)
                .set_ptu_state(false)
                .set_flaps_handle_position(4)
                .run_waiting_for(Duration::from_secs(5));

            // Only yellow press so only flaps can move
            assert!(test_bed.is_flaps_moving());
            assert!(!test_bed.is_slats_moving());

            // Now slats can move through ptu
            test_bed = test_bed
                .set_ptu_state(true)
                .run_waiting_for(Duration::from_secs(5));

            assert!(test_bed.is_flaps_moving());
            assert!(test_bed.is_slats_moving());
        }

        #[test]
        fn yellow_epump_can_deploy_flaps_and_slats() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            test_bed = test_bed
                .set_yellow_e_pump(false)
                .run_waiting_for(Duration::from_secs(10));

            // Yellow epump working
            assert!(test_bed.is_yellow_pressurised());

            test_bed = test_bed
                .set_flaps_handle_position(4)
                .run_waiting_for(Duration::from_secs(80));

            assert!(test_bed.get_flaps_left_position_percent() > 99.);
            assert!(test_bed.get_flaps_right_position_percent() > 99.);
            assert!(test_bed.get_slats_left_position_percent() > 99.);
            assert!(test_bed.get_slats_right_position_percent() > 99.);
        }

        #[test]
        fn yellow_epump_no_ptu_can_deploy_flaps_less_33s() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .set_ptu_state(false)
                .run_one_tick();

            test_bed = test_bed
                .set_yellow_e_pump(false)
                .run_waiting_for(Duration::from_secs(20));

            assert!(test_bed.is_yellow_pressurised());

            test_bed = test_bed
                .set_flaps_handle_position(4)
                .run_waiting_for(Duration::from_secs(32));

            assert!(test_bed.get_flaps_left_position_percent() > 99.);
            assert!(test_bed.get_flaps_right_position_percent() > 99.);
            assert!(test_bed.get_slats_left_position_percent() < 1.);
            assert!(test_bed.get_slats_right_position_percent() < 1.);
        }

        #[test]
        fn blue_epump_can_deploy_slats_in_less_35_s_and_no_flaps() {
            let mut test_bed = test_bed_with()
                .on_the_ground()
                .set_cold_dark_inputs()
                .set_blue_e_pump_ovrd_pressed(true)
                .run_waiting_for(Duration::from_secs(5));

            // Blue epump is on
            assert!(test_bed.is_blue_pressurised());

            test_bed = test_bed
                .set_flaps_handle_position(4)
                .run_waiting_for(Duration::from_secs(35));

            assert!(test_bed.get_flaps_left_position_percent() <= 1.);
            assert!(test_bed.get_flaps_right_position_percent() <= 1.);
            assert!(test_bed.get_slats_left_position_percent() > 99.);
            assert!(test_bed.get_slats_right_position_percent() > 99.);
        }

        #[test]
        fn blue_epump_cannot_deploy_slats_in_less_28_s_and_no_flaps() {
            let mut test_bed = test_bed_with()
                .on_the_ground()
                .set_cold_dark_inputs()
                .set_blue_e_pump_ovrd_pressed(true)
                .run_waiting_for(Duration::from_secs(5));

            // Blue epump is on
            assert!(test_bed.is_blue_pressurised());

            test_bed = test_bed
                .set_flaps_handle_position(4)
                .run_waiting_for(Duration::from_secs(28));

            assert!(test_bed.get_flaps_left_position_percent() <= 1.);
            assert!(test_bed.get_flaps_right_position_percent() <= 1.);
            assert!(test_bed.get_slats_left_position_percent() < 99.);
            assert!(test_bed.get_slats_right_position_percent() < 99.);
        }

        #[test]
        fn yellow_plus_blue_epumps_can_deploy_flaps_and_slats() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            test_bed = test_bed
                .set_yellow_e_pump(false)
                .set_blue_e_pump_ovrd_pressed(true)
                .run_waiting_for(Duration::from_secs(15));

            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.is_blue_pressurised());

            test_bed = test_bed
                .set_flaps_handle_position(4)
                .run_waiting_for(Duration::from_secs(45));

            assert!(test_bed.get_flaps_left_position_percent() > 99.);
            assert!(test_bed.get_flaps_right_position_percent() > 99.);
            assert!(test_bed.get_slats_left_position_percent() > 99.);
            assert!(test_bed.get_slats_right_position_percent() > 99.);
        }

        #[test]
        fn no_pressure_no_flap_slats() {
            let mut test_bed = test_bed_with()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_waiting_for(Duration::from_secs(5));

            test_bed = test_bed
                .set_flaps_handle_position(4)
                .run_waiting_for(Duration::from_secs(10));

            assert!(test_bed.get_flaps_left_position_percent() <= 1.);
            assert!(test_bed.get_flaps_right_position_percent() <= 1.);
            assert!(test_bed.get_slats_left_position_percent() <= 1.);
            assert!(test_bed.get_slats_right_position_percent() <= 1.);

            assert!(!test_bed.is_slats_moving());
            assert!(!test_bed.is_flaps_moving());
        }

        #[test]
        fn emergency_gen_is_started_on_both_ac_lost_in_flight() {
            let mut test_bed = test_bed_with()
                .set_cold_dark_inputs()
                .in_flight()
                .start_eng1(Ratio::new::<percent>(80.))
                .start_eng2(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(10));

            assert!(!test_bed.is_emergency_gen_at_nominal_speed());

            test_bed = test_bed
                .ac_bus_1_lost()
                .run_waiting_for(Duration::from_secs(2));

            assert!(!test_bed.is_emergency_gen_at_nominal_speed());

            // Now all AC off should deploy RAT in flight
            test_bed = test_bed
                .ac_bus_1_lost()
                .ac_bus_2_lost()
                .run_waiting_for(Duration::from_secs(8));

            assert!(test_bed.is_emergency_gen_at_nominal_speed());
        }

        #[test]
        fn cargo_door_stays_closed_at_init() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            assert!(test_bed.is_cargo_fwd_door_locked_down());
            assert!(test_bed.cargo_fwd_door_position() == 0.);

            test_bed = test_bed.run_waiting_for(Duration::from_secs_f64(15.));

            assert!(test_bed.is_cargo_fwd_door_locked_down());
            assert!(test_bed.cargo_fwd_door_position() == 0.);
        }

        #[test]
        fn cargo_door_unlocks_when_commanded() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            assert!(test_bed.is_cargo_fwd_door_locked_down());
            assert!(test_bed.cargo_fwd_door_position() == 0.);

            test_bed = test_bed.run_waiting_for(Duration::from_secs_f64(1.));

            assert!(test_bed.is_cargo_fwd_door_locked_down());
            assert!(test_bed.cargo_fwd_door_position() == 0.);

            test_bed = test_bed
                .open_fwd_cargo_door()
                .run_waiting_for(Duration::from_secs_f64(1.));

            assert!(!test_bed.is_cargo_fwd_door_locked_down());
            assert!(test_bed.cargo_fwd_door_position() >= 0.);
        }

        #[test]
        fn cargo_door_controller_opens_the_door() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            assert!(test_bed.is_cargo_fwd_door_locked_down());
            assert!(test_bed.cargo_fwd_door_position() == 0.);

            test_bed = test_bed
                .open_fwd_cargo_door()
                .run_waiting_for(Duration::from_secs_f64(1.));

            assert!(!test_bed.is_cargo_fwd_door_locked_down());

            let current_position_unlocked = test_bed.cargo_fwd_door_position();

            test_bed = test_bed.open_fwd_cargo_door().run_waiting_for(
                A320DoorController::DELAY_UNLOCK_TO_HYDRAULIC_CONTROL + Duration::from_secs(1),
            );

            assert!(test_bed.cargo_fwd_door_position() > current_position_unlocked);

            test_bed = test_bed
                .open_fwd_cargo_door()
                .run_waiting_for(Duration::from_secs_f64(30.));

            assert!(test_bed.cargo_fwd_door_position() > 0.85);
        }

        #[test]
        fn fwd_cargo_door_controller_opens_fwd_door_only() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            assert!(test_bed.is_cargo_fwd_door_locked_down());
            assert!(test_bed.cargo_fwd_door_position() == 0.);
            assert!(test_bed.cargo_aft_door_position() == 0.);

            test_bed = test_bed
                .open_fwd_cargo_door()
                .run_waiting_for(Duration::from_secs_f64(30.));

            assert!(test_bed.cargo_fwd_door_position() > 0.85);
            assert!(test_bed.cargo_aft_door_position() == 0.);
        }

        #[test]
        fn cargo_door_opened_uses_correct_reservoir_amount() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .set_yellow_e_pump(false)
                .set_ptu_state(false)
                .run_waiting_for(Duration::from_secs_f64(20.));

            assert!(test_bed.is_cargo_fwd_door_locked_down());
            assert!(test_bed.is_yellow_pressurised());

            let pressurised_yellow_level_door_closed = test_bed.get_yellow_reservoir_volume();

            test_bed = test_bed
                .open_fwd_cargo_door()
                .run_waiting_for(Duration::from_secs_f64(40.));

            assert!(!test_bed.is_cargo_fwd_door_locked_down());
            assert!(test_bed.cargo_fwd_door_position() > 0.85);

            let pressurised_yellow_level_door_opened = test_bed.get_yellow_reservoir_volume();

            let volume_used_liter = (pressurised_yellow_level_door_closed
                - pressurised_yellow_level_door_opened)
                .get::<liter>();

            // For one cargo door we expect losing between 0.6 to 0.8 liter of fluid into the two actuators
            assert!((0.6..=0.8).contains(&volume_used_liter));
        }

        #[test]
        fn cargo_door_controller_closes_the_door() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            test_bed = test_bed
                .open_fwd_cargo_door()
                .run_waiting_for(Duration::from_secs_f64(30.));

            assert!(!test_bed.is_cargo_fwd_door_locked_down());
            assert!(test_bed.cargo_fwd_door_position() > 0.85);

            test_bed = test_bed
                .close_fwd_cargo_door()
                .run_waiting_for(Duration::from_secs_f64(60.));

            assert!(test_bed.is_cargo_fwd_door_locked_down());
            assert!(test_bed.cargo_fwd_door_position() <= 0.);
        }

        #[test]
        fn cargo_door_controller_closes_the_door_after_yellow_pump_auto_shutdown() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            test_bed = test_bed
                .open_fwd_cargo_door()
                .run_waiting_for(Duration::from_secs_f64(30.));

            assert!(!test_bed.is_cargo_fwd_door_locked_down());
            assert!(test_bed.cargo_fwd_door_position() > 0.85);

            test_bed = test_bed.run_waiting_for(Duration::from_secs_f64(30.));

            assert!(!test_bed.is_yellow_pressurised());

            test_bed = test_bed
                .close_fwd_cargo_door()
                .run_waiting_for(Duration::from_secs_f64(30.));

            assert!(test_bed.is_cargo_fwd_door_locked_down());
            assert!(test_bed.cargo_fwd_door_position() <= 0.);
        }

        #[test]
        fn nose_steering_responds_to_tiller_demand_if_yellow_pressure_and_engines() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .set_yellow_e_pump(false)
                .start_eng1(Ratio::new::<percent>(80.))
                .start_eng2(Ratio::new::<percent>(80.))
                .run_one_tick();

            test_bed = test_bed
                .set_tiller_demand(Ratio::new::<ratio>(1.))
                .run_waiting_for(Duration::from_secs_f64(5.));

            assert!(test_bed.nose_steering_position().get::<degree>() >= 73.9);
            assert!(test_bed.nose_steering_position().get::<degree>() <= 74.1);

            test_bed = test_bed
                .set_tiller_demand(Ratio::new::<ratio>(-1.))
                .run_waiting_for(Duration::from_secs_f64(10.));

            assert!(test_bed.nose_steering_position().get::<degree>() <= -73.9);
            assert!(test_bed.nose_steering_position().get::<degree>() >= -74.1);
        }

        #[test]
        fn nose_steering_does_not_move_if_yellow_pressure_but_no_engine() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .set_yellow_e_pump(false)
                .run_one_tick();

            test_bed = test_bed
                .set_tiller_demand(Ratio::new::<ratio>(1.))
                .run_waiting_for(Duration::from_secs_f64(5.));

            assert!(test_bed.nose_steering_position().get::<degree>() <= 0.1);
            assert!(test_bed.nose_steering_position().get::<degree>() >= -0.1);

            test_bed = test_bed
                .set_tiller_demand(Ratio::new::<ratio>(-1.))
                .run_waiting_for(Duration::from_secs_f64(10.));

            assert!(test_bed.nose_steering_position().get::<degree>() <= 0.1);
            assert!(test_bed.nose_steering_position().get::<degree>() >= -0.1);
        }

        #[test]
        fn nose_steering_does_not_move_when_a_skid_off() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .set_yellow_e_pump(false)
                .start_eng1(Ratio::new::<percent>(80.))
                .start_eng2(Ratio::new::<percent>(80.))
                .set_anti_skid(false)
                .run_one_tick();

            test_bed = test_bed
                .set_tiller_demand(Ratio::new::<ratio>(1.))
                .run_waiting_for(Duration::from_secs_f64(5.));

            assert!(test_bed.nose_steering_position().get::<degree>() >= -0.1);
            assert!(test_bed.nose_steering_position().get::<degree>() <= 0.1);
        }

        #[test]
        fn nose_steering_centers_itself_when_a_skid_off() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .set_yellow_e_pump(false)
                .start_eng1(Ratio::new::<percent>(80.))
                .start_eng2(Ratio::new::<percent>(80.))
                .set_anti_skid(true)
                .run_one_tick();

            test_bed = test_bed
                .set_tiller_demand(Ratio::new::<ratio>(1.))
                .run_waiting_for(Duration::from_secs_f64(5.));

            assert!(test_bed.nose_steering_position().get::<degree>() >= 70.);

            test_bed = test_bed
                .set_tiller_demand(Ratio::new::<ratio>(1.))
                .set_anti_skid(false)
                .run_waiting_for(Duration::from_secs_f64(5.));

            assert!(test_bed.nose_steering_position().get::<degree>() <= 0.1);
            assert!(test_bed.nose_steering_position().get::<degree>() >= -0.1);
        }

        #[test]
        fn nose_steering_responds_to_autopilot_demand() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .start_eng1(Ratio::new::<percent>(80.))
                .start_eng2(Ratio::new::<percent>(80.))
                .run_one_tick();

            test_bed = test_bed
                .set_autopilot_steering_demand(Ratio::new::<ratio>(1.5))
                .run_waiting_for(Duration::from_secs_f64(2.));

            assert!(test_bed.nose_steering_position().get::<degree>() >= 5.9);
            assert!(test_bed.nose_steering_position().get::<degree>() <= 6.1);

            test_bed = test_bed
                .set_autopilot_steering_demand(Ratio::new::<ratio>(-1.8))
                .run_waiting_for(Duration::from_secs_f64(4.));

            assert!(test_bed.nose_steering_position().get::<degree>() <= -5.9);
            assert!(test_bed.nose_steering_position().get::<degree>() >= -6.1);
        }

        #[test]
        fn ptu_pressurise_green_from_yellow_edp() {
            let mut test_bed = test_bed_with()
                .set_cold_dark_inputs()
                .on_the_ground()
                .start_eng2(Ratio::new::<percent>(60.))
                .set_park_brake(false)
                .set_ptu_state(false)
                .run_waiting_for(Duration::from_secs(25));

            assert!(!test_bed.is_ptu_enabled());

            test_bed = test_bed
                .set_ptu_state(true)
                .run_waiting_for(Duration::from_secs(10));

            // Now we should have pressure in yellow and green
            assert!(test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() > Pressure::new::<psi>(2000.));
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(3100.));

            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2000.));
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(3100.));
        }

        #[test]
        fn ptu_pressurise_yellow_from_green_edp() {
            let mut test_bed = test_bed_with()
                .set_cold_dark_inputs()
                .on_the_ground()
                .start_eng1(Ratio::new::<percent>(60.))
                .set_park_brake(false)
                .set_ptu_state(false)
                .run_waiting_for(Duration::from_secs(25));

            assert!(!test_bed.is_ptu_enabled());

            test_bed = test_bed
                .set_ptu_state(true)
                .run_waiting_for(Duration::from_secs(25));

            // Now we should have pressure in yellow and green
            assert!(test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() > Pressure::new::<psi>(2000.));
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(3100.));

            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2000.));
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(3100.));
        }

        #[test]
        fn yellow_epump_has_cavitation_at_low_air_press() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .set_ptu_state(false)
                .run_one_tick();

            test_bed = test_bed
                .air_press_nominal()
                .set_yellow_e_pump(false)
                .run_waiting_for(Duration::from_secs_f64(10.));

            assert!(test_bed.yellow_pressure().get::<psi>() > 2900.);

            test_bed = test_bed
                .air_press_low()
                .run_waiting_for(Duration::from_secs_f64(10.));

            assert!(test_bed.yellow_pressure().get::<psi>() < 2000.);
        }

        #[test]
        fn low_air_press_fault_causes_ptu_fault() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .start_eng1(Ratio::new::<percent>(80.))
                .start_eng2(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_millis(500));

            assert!(!test_bed.ptu_has_fault());
            assert!(!test_bed.green_edp_has_fault());
            assert!(!test_bed.yellow_edp_has_fault());

            test_bed = test_bed
                .air_press_low()
                .run_waiting_for(Duration::from_secs_f64(10.));

            assert!(test_bed.green_edp_has_fault());
            assert!(test_bed.yellow_edp_has_fault());
            assert!(test_bed.ptu_has_fault());
        }

        #[test]
        fn low_air_press_fault_causes_yellow_blue_epump_fault() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .start_eng1(Ratio::new::<percent>(80.))
                .start_eng2(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_millis(5000));

            assert!(!test_bed.blue_epump_has_fault());
            assert!(!test_bed.yellow_epump_has_fault());

            test_bed = test_bed
                .air_press_low()
                .run_waiting_for(Duration::from_secs_f64(10.));

            // Blue pump is on but yellow is off: only blue fault expected
            assert!(test_bed.blue_epump_has_fault());
            assert!(!test_bed.yellow_epump_has_fault());

            test_bed = test_bed
                .set_yellow_e_pump(false)
                .run_waiting_for(Duration::from_secs_f64(10.));

            assert!(test_bed.yellow_epump_has_fault());
        }

        #[test]
        fn ailerons_are_dropped_down_in_cold_and_dark() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            assert!(test_bed.get_left_aileron_position().get::<ratio>() < 0.1);
            assert!(test_bed.get_right_aileron_position().get::<ratio>() < 0.1);
        }

        #[test]
        fn ailerons_do_not_respond_in_cold_and_dark() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            test_bed = test_bed
                .set_ailerons_left_turn()
                .run_waiting_for(Duration::from_secs_f64(2.));

            assert!(test_bed.get_left_aileron_position().get::<ratio>() < 0.1);
            assert!(test_bed.get_right_aileron_position().get::<ratio>() < 0.1);

            test_bed = test_bed
                .set_ailerons_right_turn()
                .run_waiting_for(Duration::from_secs_f64(2.));

            assert!(test_bed.get_left_aileron_position().get::<ratio>() < 0.1);
            assert!(test_bed.get_right_aileron_position().get::<ratio>() < 0.1);
        }

        #[test]
        fn ailerons_do_not_respond_if_only_yellow_pressure() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .set_ptu_state(false)
                .set_yellow_e_pump(false)
                .run_one_tick();

            test_bed = test_bed
                .set_ailerons_left_turn()
                .run_waiting_for(Duration::from_secs_f64(5.));

            assert!(test_bed.is_yellow_pressurised());
            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.get_left_aileron_position().get::<ratio>() < 0.1);
            assert!(test_bed.get_right_aileron_position().get::<ratio>() < 0.1);
        }

        #[test]
        fn ailerons_respond_if_green_pressure() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .set_ptu_state(true)
                .set_yellow_e_pump(false)
                .run_one_tick();

            test_bed = test_bed
                .set_ailerons_left_turn()
                .run_waiting_for(Duration::from_secs_f64(5.));

            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.is_green_pressurised());
            assert!(test_bed.get_left_aileron_position().get::<ratio>() > 0.9);
            assert!(test_bed.get_right_aileron_position().get::<ratio>() < 0.1);

            test_bed = test_bed
                .set_ailerons_right_turn()
                .run_waiting_for(Duration::from_secs_f64(5.));

            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.is_green_pressurised());
            assert!(test_bed.get_left_aileron_position().get::<ratio>() < 0.1);
            assert!(test_bed.get_right_aileron_position().get::<ratio>() > 0.9);
        }

        #[test]
        fn ailerons_droop_down_after_pressure_is_off() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .set_ptu_state(true)
                .set_yellow_e_pump(false)
                .run_one_tick();

            test_bed = test_bed.run_waiting_for(Duration::from_secs_f64(5.));

            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.is_green_pressurised());
            assert!(test_bed.get_left_aileron_position().get::<ratio>() > 0.4);
            assert!(test_bed.get_right_aileron_position().get::<ratio>() > 0.4);

            test_bed = test_bed
                .set_ptu_state(false)
                .set_yellow_e_pump(true)
                .run_waiting_for(Duration::from_secs_f64(60.));

            assert!(!test_bed.is_yellow_pressurised());
            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.get_left_aileron_position().get::<ratio>() < 0.1);
            assert!(test_bed.get_right_aileron_position().get::<ratio>() < 0.1);
        }

        #[test]
        fn elevators_droop_down_after_pressure_is_off() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .set_ptu_state(true)
                .set_yellow_e_pump(false)
                .run_one_tick();

            test_bed = test_bed.run_waiting_for(Duration::from_secs_f64(5.));

            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.is_green_pressurised());
            assert!(test_bed.get_left_elevator_position().get::<ratio>() > 0.4);
            assert!(test_bed.get_right_elevator_position().get::<ratio>() > 0.4);

            test_bed = test_bed
                .set_ptu_state(false)
                .set_yellow_e_pump(true)
                .run_waiting_for(Duration::from_secs_f64(75.));

            assert!(!test_bed.is_yellow_pressurised());
            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.get_left_elevator_position().get::<ratio>() < 0.35);
            assert!(test_bed.get_right_elevator_position().get::<ratio>() < 0.35);
        }

        #[test]
        fn nose_wheel_steers_with_pushback_tug() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            test_bed = test_bed
                .set_pushback_state(true)
                .set_pushback_angle(Angle::new::<degree>(80.))
                .run_waiting_for(Duration::from_secs_f64(0.5));

            // Do not turn instantly in 0.5s
            assert!(
                test_bed.get_nose_steering_ratio() > Ratio::new::<ratio>(0.)
                    && test_bed.get_nose_steering_ratio() < Ratio::new::<ratio>(0.5)
            );

            test_bed = test_bed.run_waiting_for(Duration::from_secs_f64(5.));

            // Has turned fully after 5s
            assert!(test_bed.get_nose_steering_ratio() > Ratio::new::<ratio>(0.9));

            // Going left
            test_bed = test_bed
                .set_pushback_state(true)
                .set_pushback_angle(Angle::new::<degree>(-80.))
                .run_waiting_for(Duration::from_secs_f64(0.5));

            assert!(test_bed.get_nose_steering_ratio() > Ratio::new::<ratio>(0.2));

            test_bed = test_bed.run_waiting_for(Duration::from_secs_f64(5.));

            // Has turned fully left after 5s
            assert!(test_bed.get_nose_steering_ratio() < Ratio::new::<ratio>(-0.9));
        }

        #[test]
        fn high_pitch_ptu_simvar_on_ptu_first_start() {
            let mut test_bed = test_bed_with()
                .set_cold_dark_inputs()
                .on_the_ground()
                .start_eng2(Ratio::new::<percent>(60.))
                .run_waiting_for(Duration::from_secs(10));

            assert!(!test_bed.is_ptu_enabled());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(100.));
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2900.));

            test_bed = test_bed.set_park_brake(false).run_one_tick();

            assert!(test_bed.is_ptu_enabled());
            assert!(test_bed.is_ptu_running_high_pitch_sound());
        }
    }
}
