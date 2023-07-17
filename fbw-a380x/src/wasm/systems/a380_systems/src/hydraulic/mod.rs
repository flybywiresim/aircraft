use nalgebra::Vector3;

use std::time::Duration;
use uom::si::{
    acceleration::meter_per_second_squared,
    angle::degree,
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
    accept_iterable,
    engine::Engine,
    hydraulic::{
        aerodynamic_model::AerodynamicModel,
        brake_circuit::{
            AutobrakeDecelerationGovernor, AutobrakeMode, AutobrakePanel,
            BrakeAccumulatorCharacteristics, BrakeCircuit, BrakeCircuitController,
        },
        cargo_doors::{CargoDoor, HydraulicDoorController},
        flap_slat::FlapSlatAssembly,
        landing_gear::GearSystemController,
        linear_actuator::{
            Actuator, BoundedLinearLength, ElectroHydrostaticActuatorType,
            ElectroHydrostaticBackup, ElectroHydrostaticPowered, HydraulicAssemblyController,
            HydraulicLinearActuatorAssembly, HydraulicLocking, LinearActuatedRigidBodyOnHingeAxis,
            LinearActuator, LinearActuatorCharacteristics, LinearActuatorMode,
        },
        nose_steering::{
            Pushback, SteeringActuator, SteeringAngleLimiter, SteeringController,
            SteeringRatioToAngle,
        },
        pumps::PumpCharacteristics,
        pushback::PushbackTug,
        trimmable_horizontal_stabilizer::{
            TrimmableHorizontalStabilizerActuator, TrimmableHorizontalStabilizerMotorController,
        },
        Accumulator, ElectricPump, EngineDrivenPump, HeatingElement, HydraulicCircuit,
        HydraulicCircuitController, HydraulicPressureSensors, ManualPump, PressureSwitch,
        PressureSwitchType, PriorityValve, PumpController, Reservoir,
    },
    landing_gear::TiltingGear,
    overhead::{AutoOffFaultPushButton, AutoOnFaultPushButton},
    shared::{
        interpolation, random_from_range, update_iterator::MaxStepLoop, AdirsDiscreteOutputs,
        AirbusElectricPumpId, AirbusEngineDrivenPumpId, DelayedFalseLogicGate,
        DelayedPulseTrueLogicGate, DelayedTrueLogicGate, ElectricalBusType, ElectricalBuses,
        EngineFirePushButtons, GearWheel, HydraulicColor, LandingGearHandle, LgciuInterface,
        LgciuWeightOnWheels, ReservoirAirPressure, SectionPressure,
    },
    simulation::{
        InitContext, Read, Reader, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, StartState, UpdateContext, VariableIdentifier, Write,
    },
};

use crate::{
    hydraulic::landing_gear::{GearGravityExtension, HydraulicGearSystem},
    landing_gear::{GearSystemSensors, LandingGearControlInterfaceUnitSet},
};

use std::fmt::Debug;

mod flaps_computer;
use flaps_computer::SlatFlapComplex;
mod engine_pump_disc;
use engine_pump_disc::EnginePumpDisconnectionClutch;
mod landing_gear;

#[cfg(test)]
use systems::hydraulic::PressureSwitchState;

const AC_EHA_BUS: ElectricalBusType = ElectricalBusType::AlternatingCurrentNamed("247XP");

struct A380TiltingGearsFactory {}
impl A380TiltingGearsFactory {
    fn new_a380_body_gear(context: &mut InitContext, is_left: bool) -> TiltingGear {
        let mut x_offset_meters = 2.85569;
        let y_offset_meters = -5.04847;
        let z_offset_meters = -0.235999;

        if is_left {
            x_offset_meters *= -1.;
        }

        TiltingGear::new(
            context,
            Length::new::<meter>(0.280065),
            if is_left { 1 } else { 2 },
            Vector3::new(x_offset_meters, y_offset_meters, z_offset_meters),
            Angle::new::<degree>(9.89),
        )
    }

    fn new_a380_wing_gear(context: &mut InitContext, is_left: bool) -> TiltingGear {
        let mut x_offset_meters = 6.18848;
        let y_offset_meters = -4.86875;
        let z_offset_meters = 2.6551;

        if is_left {
            x_offset_meters *= -1.;
        }

        TiltingGear::new(
            context,
            Length::new::<meter>(0.134608),
            if is_left { 3 } else { 4 },
            Vector3::new(x_offset_meters, y_offset_meters, z_offset_meters),
            Angle::new::<degree>(9.),
        )
    }

    fn new_a380_tilt_assembly(context: &mut InitContext) -> A380TiltingGears {
        let left_body_gear = Self::new_a380_body_gear(context, true);
        let right_body_gear = Self::new_a380_body_gear(context, false);
        let left_wing_gear = Self::new_a380_wing_gear(context, true);
        let right_wing_gear = Self::new_a380_wing_gear(context, false);

        A380TiltingGears::new(
            left_body_gear,
            right_body_gear,
            left_wing_gear,
            right_wing_gear,
        )
    }
}

struct A380HydraulicReservoirFactory {}
impl A380HydraulicReservoirFactory {
    fn new_green_reservoir(context: &mut InitContext) -> Reservoir {
        let reservoir_offset_when_gear_up = if context.start_gear_down() {
            Volume::new::<gallon>(0.)
        } else {
            Volume::new::<gallon>(-1.3)
        };

        Reservoir::new(
            context,
            HydraulicColor::Green,
            Volume::new::<liter>(23.),
            Volume::new::<liter>(18.),
            Volume::new::<gallon>(3.6) + reservoir_offset_when_gear_up,
            vec![PressureSwitch::new(
                Pressure::new::<psi>(25.),
                Pressure::new::<psi>(22.),
                PressureSwitchType::Relative,
            )],
            Volume::new::<liter>(3.),
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

pub struct A380HydraulicCircuitFactory {}
impl A380HydraulicCircuitFactory {
    const MIN_PRESS_EDP_SECTION_LO_HYST: f64 = 2900.0;
    const MIN_PRESS_EDP_SECTION_HI_HYST: f64 = 3700.0;
    const MIN_PRESS_PRESSURISED_LO_HYST: f64 = 2900.0;
    const MIN_PRESS_PRESSURISED_HI_HYST: f64 = 3700.0;
    const HYDRAULIC_TARGET_PRESSURE_PSI: f64 = 5250.;

    // Nitrogen PSI precharge pressure
    const ACCUMULATOR_GAS_PRE_CHARGE_PSI: f64 = 2612.0;
    const ACCUMULATOR_MAX_VOLUME_GALLONS: f64 = 0.5;

    const PRIORITY_VALVE_PRESSURE_CUTOFF_PSI: f64 = 3000.;
    const PRIORITY_VALVE_PRESSURE_OPENED_PSI: f64 = 3800.;

    pub fn new_green_circuit(context: &mut InitContext) -> HydraulicCircuit {
        let reservoir = A380HydraulicReservoirFactory::new_green_reservoir(context);

        HydraulicCircuit::new(
            context,
            HydraulicColor::Green,
            6,
            Ratio::new::<percent>(100.),
            Volume::new::<gallon>(10.),
            reservoir,
            Pressure::new::<psi>(Self::MIN_PRESS_PRESSURISED_LO_HYST),
            Pressure::new::<psi>(Self::MIN_PRESS_PRESSURISED_HI_HYST),
            Pressure::new::<psi>(Self::MIN_PRESS_EDP_SECTION_LO_HYST),
            Pressure::new::<psi>(Self::MIN_PRESS_EDP_SECTION_HI_HYST),
            false,
            false,
            true,
            Pressure::new::<psi>(Self::HYDRAULIC_TARGET_PRESSURE_PSI),
            PriorityValve::new(
                Pressure::new::<psi>(Self::PRIORITY_VALVE_PRESSURE_CUTOFF_PSI),
                Pressure::new::<psi>(Self::PRIORITY_VALVE_PRESSURE_OPENED_PSI),
            ),
            Pressure::new::<psi>(Self::ACCUMULATOR_GAS_PRE_CHARGE_PSI),
            Volume::new::<gallon>(Self::ACCUMULATOR_MAX_VOLUME_GALLONS),
        )
    }

    pub fn new_yellow_circuit(context: &mut InitContext) -> HydraulicCircuit {
        let reservoir = A380HydraulicReservoirFactory::new_yellow_reservoir(context);
        HydraulicCircuit::new(
            context,
            HydraulicColor::Yellow,
            6,
            Ratio::new::<percent>(100.),
            Volume::new::<gallon>(10.),
            reservoir,
            Pressure::new::<psi>(Self::MIN_PRESS_PRESSURISED_LO_HYST),
            Pressure::new::<psi>(Self::MIN_PRESS_PRESSURISED_HI_HYST),
            Pressure::new::<psi>(Self::MIN_PRESS_EDP_SECTION_LO_HYST),
            Pressure::new::<psi>(Self::MIN_PRESS_EDP_SECTION_HI_HYST),
            false,
            false,
            false,
            Pressure::new::<psi>(Self::HYDRAULIC_TARGET_PRESSURE_PSI),
            PriorityValve::new(
                Pressure::new::<psi>(Self::PRIORITY_VALVE_PRESSURE_CUTOFF_PSI),
                Pressure::new::<psi>(Self::PRIORITY_VALVE_PRESSURE_OPENED_PSI),
            ),
            Pressure::new::<psi>(Self::ACCUMULATOR_GAS_PRE_CHARGE_PSI),
            Volume::new::<gallon>(Self::ACCUMULATOR_MAX_VOLUME_GALLONS),
        )
    }
}

struct A380CargoDoorFactory {}
impl A380CargoDoorFactory {
    const FLOW_CONTROL_PROPORTIONAL_GAIN: f64 = 0.05;
    const FLOW_CONTROL_INTEGRAL_GAIN: f64 = 4.;
    const FLOW_CONTROL_FORCE_GAIN: f64 = 200000.;

    const MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING: f64 = 1000000.;
    const MAX_FLOW_PRECISION_PER_ACTUATOR_PERCENT: f64 = 10.;

    fn a380_cargo_door_actuator(
        context: &mut InitContext,
        bounded_linear_length: &impl BoundedLinearLength,
    ) -> LinearActuator {
        let actuator_characteristics = LinearActuatorCharacteristics::new(
            Self::MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING / 3.,
            Self::MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING,
            VolumeRate::new::<gallon_per_second>(0.02),
            Ratio::new::<percent>(Self::MAX_FLOW_PRECISION_PER_ACTUATOR_PERCENT),
        );

        LinearActuator::new(
            context,
            bounded_linear_length,
            1,
            Length::new::<meter>(0.06651697090182), // Real actuator 34.75cm^2
            Length::new::<meter>(0.0509),           // Real actuator retract area  14.55cm^2
            actuator_characteristics.max_flow(),
            600000.,
            15000.,
            500.,
            actuator_characteristics.slow_damping(),
            Duration::from_millis(100),
            [1., 1., 1., 1., 1., 1.],
            [1., 1., 1., 1., 1., 1.],
            [0., 0.2, 0.21, 0.79, 0.8, 1.],
            Self::FLOW_CONTROL_PROPORTIONAL_GAIN,
            Self::FLOW_CONTROL_INTEGRAL_GAIN,
            Self::FLOW_CONTROL_FORCE_GAIN,
            true,
            false,
            None,
            None,
            Pressure::new::<psi>(A380HydraulicCircuitFactory::HYDRAULIC_TARGET_PRESSURE_PSI),
        )
    }

    /// Builds a cargo door body for A380-800
    fn a380_cargo_door_body(is_locked: bool) -> LinearActuatedRigidBodyOnHingeAxis {
        let size = Vector3::new(100. / 1000., 1855. / 1000., 2025. / 1000.);
        let cg_offset = Vector3::new(0., -size[1] / 2., 0.);

        let control_arm = Vector3::new(0., -0.45, 0.);
        let anchor = Vector3::new(-0.7596, -0.4, 0.);
        let axis_direction = Vector3::new(0., 0., 1.);

        LinearActuatedRigidBodyOnHingeAxis::new(
            Mass::new::<kilogram>(250.),
            size,
            cg_offset,
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
    fn a380_cargo_door_assembly(context: &mut InitContext) -> HydraulicLinearActuatorAssembly<1> {
        let cargo_door_body = Self::a380_cargo_door_body(true);
        let cargo_door_actuator = Self::a380_cargo_door_actuator(context, &cargo_door_body);
        HydraulicLinearActuatorAssembly::new([cargo_door_actuator], cargo_door_body)
    }

    fn new_a380_cargo_door(context: &mut InitContext, id: &str) -> CargoDoor {
        let assembly = Self::a380_cargo_door_assembly(context);
        CargoDoor::new(
            context,
            id,
            assembly,
            Self::new_a380_cargo_door_aero_model(),
        )
    }

    fn new_a380_cargo_door_aero_model() -> AerodynamicModel {
        let body = Self::a380_cargo_door_body(false);
        AerodynamicModel::new(
            &body,
            Some(Vector3::new(1., 0., 0.)),
            Some(Vector3::new(0., 0., 1.)),
            Some(Vector3::new(1., 0., 0.)),
            Ratio::new::<ratio>(1.),
        )
    }
}

struct A380AileronFactory {}
impl A380AileronFactory {
    const FLOW_CONTROL_PROPORTIONAL_GAIN: f64 = 5.;
    const FLOW_CONTROL_INTEGRAL_GAIN: f64 = 4.;
    const FLOW_CONTROL_FORCE_GAIN: f64 = 150000.;

    const MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING: f64 = 3500000.;
    const MAX_FLOW_PRECISION_PER_ACTUATOR_PERCENT: f64 = 10.;

    // 427XP - AC ESS
    const MIDDLE_PANEL_EHA_BUS: ElectricalBusType = ElectricalBusType::AlternatingCurrentEssential;
    // 247XP - AC EHA
    const INWARD_PANEL_EHA_BUS: ElectricalBusType = AC_EHA_BUS;

    fn a380_aileron_actuator(
        context: &mut InitContext,
        bounded_linear_length: &impl BoundedLinearLength,
        powered_by: Option<ElectricalBusType>,
    ) -> LinearActuator {
        let actuator_characteristics = LinearActuatorCharacteristics::new(
            Self::MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING / 3.,
            Self::MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING,
            VolumeRate::new::<gallon_per_second>(0.0825),
            Ratio::new::<percent>(Self::MAX_FLOW_PRECISION_PER_ACTUATOR_PERCENT),
        );

        // Aileron actuator real data:
        // Max force of 13500daN @ nominal 350bar. This gives a 0.003857m^2 of piston surface
        // This gives piston diameter of 2 * 0.035m = 0.07 meters
        // We use 0 as rod diameter as this is a symmetrical actuator so same surface each side
        // Max flow at rated max travel speed 81mm/s, this gives 0.003857m^2 * 81mm/s = 0.000312 m^3/s
        // = 0.08254 gal/s
        LinearActuator::new(
            context,
            bounded_linear_length,
            1,
            Length::new::<meter>(0.07),
            Length::new::<meter>(0.),
            actuator_characteristics.max_flow(),
            80000.,
            1500.,
            5000.,
            actuator_characteristics.slow_damping(),
            Duration::from_millis(300),
            [1., 1., 1., 1., 1., 1.],
            [1., 1., 1., 1., 1., 1.],
            [0., 0.2, 0.21, 0.79, 0.8, 1.],
            Self::FLOW_CONTROL_PROPORTIONAL_GAIN,
            Self::FLOW_CONTROL_INTEGRAL_GAIN,
            Self::FLOW_CONTROL_FORCE_GAIN,
            true,
            false,
            None,
            powered_by.map(|bus| {
                ElectroHydrostaticBackup::new(
                    bus,
                    ElectroHydrostaticActuatorType::ElectroHydrostaticActuator,
                )
            }),
            Pressure::new::<psi>(A380HydraulicCircuitFactory::HYDRAULIC_TARGET_PRESSURE_PSI),
        )
    }

    /// Builds an aileron control surface body for A380-800
    fn a380_aileron_body(
        init_drooped_down: bool,
        panel: AileronPanelPosition,
    ) -> LinearActuatedRigidBodyOnHingeAxis {
        let size = match panel {
            AileronPanelPosition::Outward => Vector3::new(4.06, 0.16, 1.4),
            AileronPanelPosition::Middle => Vector3::new(2.9, 0.16, 1.37),
            AileronPanelPosition::Inward => Vector3::new(2.26, 0.16, 1.6),
        };

        let mass = match panel {
            AileronPanelPosition::Outward => Mass::new::<kilogram>(128.),
            AileronPanelPosition::Middle => Mass::new::<kilogram>(118.),
            AileronPanelPosition::Inward => Mass::new::<kilogram>(108.),
        };

        // CG at half the size
        let cg_offset = Vector3::new(0., 0., -0.5 * size[2]);
        let aero_center = Vector3::new(0., 0., -0.4 * size[2]);

        let control_arm = Vector3::new(0., -0.119, 0.);
        let anchor = Vector3::new(0., -0.119, 0.33);

        let init_position = if init_drooped_down {
            Angle::new::<degree>(-20.)
        } else {
            Angle::new::<degree>(0.)
        };

        LinearActuatedRigidBodyOnHingeAxis::new(
            mass,
            size,
            cg_offset,
            aero_center,
            control_arm,
            anchor,
            Angle::new::<degree>(-20.),
            Angle::new::<degree>(50.),
            init_position,
            1.,
            false,
            Vector3::new(1., 0., 0.),
        )
    }

    /// Builds an aileron assembly consisting of the aileron physical rigid body and two hydraulic actuators connected
    /// to it
    fn a380_aileron_assembly(
        context: &mut InitContext,
        init_drooped_down: bool,
        powered_by: Option<ElectricalBusType>,
        panel: AileronPanelPosition,
    ) -> HydraulicLinearActuatorAssembly<2> {
        let aileron_body = Self::a380_aileron_body(init_drooped_down, panel);

        let aileron_actuator_outward = Self::a380_aileron_actuator(context, &aileron_body, None);
        let aileron_actuator_inward =
            Self::a380_aileron_actuator(context, &aileron_body, powered_by);

        HydraulicLinearActuatorAssembly::new(
            [aileron_actuator_outward, aileron_actuator_inward],
            aileron_body,
        )
    }

    fn new_aileron(context: &mut InitContext, id: ActuatorSide) -> AileronAssembly {
        let init_drooped_down = !context.is_in_flight();
        let assembly_outward = Self::a380_aileron_assembly(
            context,
            init_drooped_down,
            None,
            AileronPanelPosition::Outward,
        );
        let assembly_middle = Self::a380_aileron_assembly(
            context,
            init_drooped_down,
            Some(Self::MIDDLE_PANEL_EHA_BUS),
            AileronPanelPosition::Middle,
        );
        let assembly_inward = Self::a380_aileron_assembly(
            context,
            init_drooped_down,
            Some(Self::INWARD_PANEL_EHA_BUS),
            AileronPanelPosition::Inward,
        );
        AileronAssembly::new(
            context,
            id,
            assembly_outward,
            assembly_middle,
            assembly_inward,
            Self::new_a380_aileron_aero_model(AileronPanelPosition::Outward),
            Self::new_a380_aileron_aero_model(AileronPanelPosition::Middle),
            Self::new_a380_aileron_aero_model(AileronPanelPosition::Inward),
        )
    }

    fn new_a380_aileron_aero_model(panel: AileronPanelPosition) -> AerodynamicModel {
        let body = Self::a380_aileron_body(true, panel);

        let area_coeff = match panel {
            AileronPanelPosition::Outward => Ratio::new::<ratio>(0.829),
            AileronPanelPosition::Middle => Ratio::new::<ratio>(0.896),
            AileronPanelPosition::Inward => Ratio::new::<ratio>(0.874),
        };

        // Aerodynamic object has a little rotation from horizontal direction so that at X°
        // of wing AOA the aileron gets some X°+Y° AOA as the overwing pressure sucks the aileron up
        AerodynamicModel::new(
            &body,
            Some(Vector3::new(0., 1., 0.)),
            Some(Vector3::new(0., 0.208, 0.978)),
            Some(Vector3::new(0., 0.978, -0.208)),
            area_coeff,
        )
    }
}

struct A380SpoilerFactory {}
impl A380SpoilerFactory {
    const FLOW_CONTROL_PROPORTIONAL_GAIN: f64 = 0.4;
    const FLOW_CONTROL_INTEGRAL_GAIN: f64 = 0.4;
    const FLOW_CONTROL_FORCE_GAIN: f64 = 50000.;

    const MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING: f64 = 400000.;

    const MAX_FLOW_PRECISION_PER_ACTUATOR_PERCENT: f64 = 20.;

    // 427XP - AC ESS
    const SPOILER_6_EBHA_BUS: ElectricalBusType = ElectricalBusType::AlternatingCurrentEssential;

    fn a380_spoiler_actuator(
        context: &mut InitContext,
        bounded_linear_length: &impl BoundedLinearLength,
        powered_by: Option<ElectricalBusType>,
    ) -> LinearActuator {
        let actuator_characteristics = LinearActuatorCharacteristics::new(
            Self::MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING / 5.,
            Self::MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING,
            VolumeRate::new::<gallon_per_second>(0.23),
            Ratio::new::<percent>(Self::MAX_FLOW_PRECISION_PER_ACTUATOR_PERCENT),
        );

        LinearActuator::new(
            context,
            bounded_linear_length,
            1,
            Length::new::<meter>(0.09),
            Length::new::<meter>(0.05),
            actuator_characteristics.max_flow(),
            80000.,
            1500.,
            5000.,
            actuator_characteristics.slow_damping(),
            Duration::from_millis(300),
            [1., 1., 1., 1., 1., 1.],
            [1., 1., 1., 1., 1., 1.],
            [0., 0.2, 0.21, 0.79, 0.8, 1.],
            Self::FLOW_CONTROL_PROPORTIONAL_GAIN,
            Self::FLOW_CONTROL_INTEGRAL_GAIN,
            Self::FLOW_CONTROL_FORCE_GAIN,
            true,
            true,
            Some((
                AngularVelocity::new::<radian_per_second>(-10000.),
                AngularVelocity::new::<radian_per_second>(0.),
            )),
            powered_by.map(|bus| {
                ElectroHydrostaticBackup::new(
                    bus,
                    ElectroHydrostaticActuatorType::ElectricalBackupHydraulicActuator,
                )
            }),
            Pressure::new::<psi>(A380HydraulicCircuitFactory::HYDRAULIC_TARGET_PRESSURE_PSI),
        )
    }

    /// Builds a spoiler control surface body for A380-800
    fn a380_spoiler_body() -> LinearActuatedRigidBodyOnHingeAxis {
        let size = Vector3::new(1.785, 0.1, 0.685);
        let cg_offset = Vector3::new(0., 0., -0.5 * size[2]);
        let aero_center = Vector3::new(0., 0., -0.33 * size[2]);

        let control_arm = Vector3::new(0., -0.10 * size[2], -0.26 * size[2]);
        let anchor = Vector3::new(0., -0.45 * size[2], 0.26 * size[2]);

        LinearActuatedRigidBodyOnHingeAxis::new(
            Mass::new::<kilogram>(42.),
            size,
            cg_offset,
            aero_center,
            control_arm,
            anchor,
            Angle::new::<degree>(-10.),
            Angle::new::<degree>(50.),
            Angle::new::<degree>(-10.),
            50.,
            false,
            Vector3::new(1., 0., 0.),
        )
    }

    /// Builds a spoiler assembly consisting of the spoiler physical rigid body and one hydraulic actuator
    fn a380_spoiler_assembly(
        context: &mut InitContext,
        powered_by: Option<ElectricalBusType>,
    ) -> HydraulicLinearActuatorAssembly<1> {
        let spoiler_body = Self::a380_spoiler_body();

        let spoiler_actuator = Self::a380_spoiler_actuator(context, &spoiler_body, powered_by);

        HydraulicLinearActuatorAssembly::new([spoiler_actuator], spoiler_body)
    }

    fn new_a380_spoiler_group(context: &mut InitContext, id: ActuatorSide) -> SpoilerGroup {
        let spoiler_1 = Self::new_a380_spoiler_element(context, id, 1, None);
        let spoiler_2 = Self::new_a380_spoiler_element(context, id, 2, None);
        let spoiler_3 = Self::new_a380_spoiler_element(context, id, 3, None);
        let spoiler_4 = Self::new_a380_spoiler_element(context, id, 4, None);
        let spoiler_5 = Self::new_a380_spoiler_element(context, id, 5, None);
        let spoiler_6 =
            Self::new_a380_spoiler_element(context, id, 6, Some(Self::SPOILER_6_EBHA_BUS));
        let spoiler_7 = Self::new_a380_spoiler_element(context, id, 7, None);
        let spoiler_8 = Self::new_a380_spoiler_element(context, id, 8, None);

        SpoilerGroup::new(
            context,
            match id {
                ActuatorSide::Left => "LEFT",
                ActuatorSide::Right => "RIGHT",
            },
            [
                spoiler_1, spoiler_2, spoiler_3, spoiler_4, spoiler_5, spoiler_6, spoiler_7,
                spoiler_8,
            ],
        )
    }

    fn new_a380_spoiler_element(
        context: &mut InitContext,
        id: ActuatorSide,
        id_number: usize,
        powered_by: Option<ElectricalBusType>,
    ) -> SpoilerElement {
        let assembly = Self::a380_spoiler_assembly(context, powered_by);
        SpoilerElement::new(
            context,
            id,
            id_number,
            assembly,
            Self::new_a380_spoiler_aero_model(),
        )
    }

    fn new_a380_spoiler_aero_model() -> AerodynamicModel {
        let body = Self::a380_spoiler_body();

        // Lift vector and normal are rotated 10° to acount for air supposedly following
        // wing profile that is 10° from horizontal
        // It means that with headwind and spoiler retracted (-10°), spoiler generates no lift
        AerodynamicModel::new(
            &body,
            Some(Vector3::new(0., 1., 0.)),
            Some(Vector3::new(0., -0.174, 0.985)),
            Some(Vector3::new(0., 0.985, 0.174)),
            Ratio::new::<ratio>(0.9),
        )
    }
}

struct A380ElevatorFactory {}
impl A380ElevatorFactory {
    const FLOW_CONTROL_PROPORTIONAL_GAIN: f64 = 1.5;
    const FLOW_CONTROL_INTEGRAL_GAIN: f64 = 0.5;
    const FLOW_CONTROL_FORCE_GAIN: f64 = 400000.;

    const MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING: f64 = 15000000.;
    const MAX_FLOW_PRECISION_PER_ACTUATOR_PERCENT: f64 = 5.;

    // 247XP - AC EHA
    const LEFT_OUTWARD_PANEL_EHA_BUS: ElectricalBusType = AC_EHA_BUS;
    // 427XP - AC ESS
    const RIGHT_OUTWARD_PANEL_EHA_BUS: ElectricalBusType =
        ElectricalBusType::AlternatingCurrentEssential;
    // 427XP - AC ESS
    const LEFT_INWARD_PANEL_EHA_BUS: ElectricalBusType =
        ElectricalBusType::AlternatingCurrentEssential;
    // 247XP - AC EHA
    const RIGHT_INWARD_PANEL_EHA_BUS: ElectricalBusType = AC_EHA_BUS;

    fn a380_elevator_actuator(
        context: &mut InitContext,
        bounded_linear_length: &impl BoundedLinearLength,
        powered_by: Option<ElectricalBusType>,
    ) -> LinearActuator {
        let actuator_characteristics = LinearActuatorCharacteristics::new(
            Self::MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING / 5.,
            Self::MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING,
            VolumeRate::new::<gallon_per_second>(0.15),
            Ratio::new::<percent>(Self::MAX_FLOW_PRECISION_PER_ACTUATOR_PERCENT),
        );

        LinearActuator::new(
            context,
            bounded_linear_length,
            1,
            Length::new::<meter>(0.08),
            Length::new::<meter>(0.),
            actuator_characteristics.max_flow(),
            80000.,
            1500.,
            20000.,
            actuator_characteristics.slow_damping(),
            Duration::from_millis(300),
            [1., 1., 1., 1., 1., 1.],
            [1., 1., 1., 1., 1., 1.],
            [0., 0.2, 0.21, 0.79, 0.8, 1.],
            Self::FLOW_CONTROL_PROPORTIONAL_GAIN,
            Self::FLOW_CONTROL_INTEGRAL_GAIN,
            Self::FLOW_CONTROL_FORCE_GAIN,
            true,
            false,
            None,
            powered_by.map(|bus| {
                ElectroHydrostaticBackup::new(
                    bus,
                    ElectroHydrostaticActuatorType::ElectroHydrostaticActuator,
                )
            }),
            Pressure::new::<psi>(A380HydraulicCircuitFactory::HYDRAULIC_TARGET_PRESSURE_PSI),
        )
    }

    /// Builds an aileron control surface body for A380-800
    fn a380_elevator_body(
        init_drooped_down: bool,
        is_outter: bool,
    ) -> LinearActuatedRigidBodyOnHingeAxis {
        let size = if is_outter {
            Vector3::new(9., 0.405, 2.23)
        } else {
            Vector3::new(5., 0.405, 2.49)
        };

        let mass = if is_outter {
            Mass::new::<kilogram>(243.)
        } else {
            Mass::new::<kilogram>(189.)
        };

        let cg_offset = Vector3::new(0., 0., -0.5 * size[2]);
        let aero_center = Vector3::new(0., 0., -0.3 * size[2]);

        let control_arm = Vector3::new(0., -0.154, 0.);
        let anchor = Vector3::new(0., -0.154, 0.41);

        let init_position = if init_drooped_down {
            Angle::new::<degree>(-20.)
        } else {
            Angle::new::<degree>(0.)
        };

        LinearActuatedRigidBodyOnHingeAxis::new(
            mass,
            size,
            cg_offset,
            aero_center,
            control_arm,
            anchor,
            Angle::new::<degree>(-20.),
            Angle::new::<degree>(50.),
            init_position,
            100.,
            false,
            Vector3::new(1., 0., 0.),
        )
    }

    /// Builds an aileron assembly consisting of the aileron physical rigid body and two hydraulic actuators connected
    /// to it
    fn a380_elevator_assembly(
        context: &mut InitContext,
        init_drooped_down: bool,
        powered_by: Option<ElectricalBusType>,
        is_outter: bool,
    ) -> HydraulicLinearActuatorAssembly<2> {
        let elevator_body = Self::a380_elevator_body(init_drooped_down, is_outter);

        let elevator_actuator_outboard =
            Self::a380_elevator_actuator(context, &elevator_body, None);
        let elevator_actuator_inbord =
            Self::a380_elevator_actuator(context, &elevator_body, powered_by);

        HydraulicLinearActuatorAssembly::new(
            [elevator_actuator_outboard, elevator_actuator_inbord],
            elevator_body,
        )
    }

    fn new_elevator(context: &mut InitContext, id: ActuatorSide) -> ElevatorAssembly {
        let init_drooped_down = !context.is_in_flight();

        let assembly_outward = Self::a380_elevator_assembly(
            context,
            init_drooped_down,
            if id == ActuatorSide::Left {
                Some(Self::LEFT_OUTWARD_PANEL_EHA_BUS)
            } else {
                Some(Self::RIGHT_OUTWARD_PANEL_EHA_BUS)
            },
            true,
        );
        let assembly_inward = Self::a380_elevator_assembly(
            context,
            init_drooped_down,
            if id == ActuatorSide::Left {
                Some(Self::LEFT_INWARD_PANEL_EHA_BUS)
            } else {
                Some(Self::RIGHT_INWARD_PANEL_EHA_BUS)
            },
            false,
        );
        ElevatorAssembly::new(
            context,
            id,
            assembly_outward,
            assembly_inward,
            Self::new_a380_elevator_aero_model(true),
            Self::new_a380_elevator_aero_model(false),
        )
    }

    fn new_a380_elevator_aero_model(is_outter: bool) -> AerodynamicModel {
        let body = Self::a380_elevator_body(true, is_outter);

        let area_coeff = if is_outter {
            Ratio::new::<ratio>(0.723)
        } else {
            Ratio::new::<ratio>(0.822)
        };

        AerodynamicModel::new(
            &body,
            Some(Vector3::new(0., 1., 0.)),
            Some(Vector3::new(0., 0., 1.)),
            Some(Vector3::new(0., 1., 0.)),
            area_coeff,
        )
    }
}

struct A380RudderFactory {}
impl A380RudderFactory {
    const FLOW_CONTROL_PROPORTIONAL_GAIN: f64 = 5.;
    const FLOW_CONTROL_INTEGRAL_GAIN: f64 = 3.;
    const FLOW_CONTROL_FORCE_GAIN: f64 = 450000.;

    const MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING: f64 = 1000000.;
    const MAX_FLOW_PRECISION_PER_ACTUATOR_PERCENT: f64 = 10.;

    // 427XP - AC ESS
    const UPPER_AND_LOWER_PANEL_UPPER_EBHA_BUS: ElectricalBusType =
        ElectricalBusType::AlternatingCurrentEssential;
    // 247XP - ACEHA
    const UPPER_PANEL_LOWER_EBHA_BUS: ElectricalBusType = AC_EHA_BUS;
    // 100XP1 - AC 1
    const LOWER_PANEL_LOWER_EBHA_BUS: ElectricalBusType = ElectricalBusType::AlternatingCurrent(1);

    fn a380_rudder_actuator(
        context: &mut InitContext,
        bounded_linear_length: &impl BoundedLinearLength,
        powered_by: ElectricalBusType,
    ) -> LinearActuator {
        let actuator_characteristics = LinearActuatorCharacteristics::new(
            Self::MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING / 4.,
            Self::MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING,
            VolumeRate::new::<gallon_per_second>(0.25),
            Ratio::new::<percent>(Self::MAX_FLOW_PRECISION_PER_ACTUATOR_PERCENT),
        );

        // Rudder actuator real data:
        // Piston surface is 77.18cm^2, this gives a piston diameter of 0.099m.
        // Actuator maximum speed is 236.5 mm/s, this gives a maximum flow rate of
        // 0.001825 m^3/s = 0.4822 gal/s.
        LinearActuator::new(
            context,
            bounded_linear_length,
            1,
            Length::new::<meter>(0.099),
            Length::new::<meter>(0.),
            actuator_characteristics.max_flow(),
            80000.,
            1500.,
            10000.,
            actuator_characteristics.slow_damping(),
            Duration::from_millis(300),
            [1., 1., 1., 1., 1., 1.],
            [1., 1., 1., 1., 1., 1.],
            [0., 0.2, 0.21, 0.79, 0.8, 1.],
            Self::FLOW_CONTROL_PROPORTIONAL_GAIN,
            Self::FLOW_CONTROL_INTEGRAL_GAIN,
            Self::FLOW_CONTROL_FORCE_GAIN,
            true,
            false,
            None,
            Some(ElectroHydrostaticBackup::new(
                powered_by,
                ElectroHydrostaticActuatorType::ElectricalBackupHydraulicActuator,
            )),
            Pressure::new::<psi>(A380HydraulicCircuitFactory::HYDRAULIC_TARGET_PRESSURE_PSI),
        )
    }

    fn a380_rudder_body(
        init_at_center: bool,
        is_upper_body: bool,
    ) -> LinearActuatedRigidBodyOnHingeAxis {
        let size = if is_upper_body {
            Vector3::new(0.5, 9.63, 2.9)
        } else {
            Vector3::new(0.5, 4.72, 3.41)
        };

        let mass = if is_upper_body {
            Mass::new::<kilogram>(357.)
        } else {
            Mass::new::<kilogram>(304.)
        };

        let cg_offset = Vector3::new(0., 0.5 * size[1], -0.5 * size[2]);
        let aero_center = Vector3::new(0., 0.5 * size[1], -0.3 * size[2]);

        let control_arm = Vector3::new(-0.18, 0., 0.);
        let anchor = Vector3::new(-0.18, 0., 0.850);

        let randomized_init_position_angle_degree = if init_at_center {
            0.
        } else {
            random_from_range(-15., 15.)
        };

        LinearActuatedRigidBodyOnHingeAxis::new(
            mass,
            size,
            cg_offset,
            aero_center,
            control_arm,
            anchor,
            Angle::new::<degree>(-30.),
            Angle::new::<degree>(60.),
            Angle::new::<degree>(randomized_init_position_angle_degree),
            100.,
            false,
            Vector3::new(0., 1., 0.),
        )
    }

    /// Builds an aileron assembly consisting of the aileron physical rigid body and two hydraulic actuators connected
    /// to it
    fn a380_rudder_assembly(
        context: &mut InitContext,
        init_at_center: bool,
        is_upper_body: bool,
        upper_powered_by: ElectricalBusType,
        lower_powered_by: ElectricalBusType,
    ) -> HydraulicLinearActuatorAssembly<2> {
        let rudder_body = Self::a380_rudder_body(init_at_center, is_upper_body);

        let rudder_actuator_upper =
            Self::a380_rudder_actuator(context, &rudder_body, upper_powered_by);
        let rudder_actuator_lower =
            Self::a380_rudder_actuator(context, &rudder_body, lower_powered_by);

        HydraulicLinearActuatorAssembly::new(
            [rudder_actuator_upper, rudder_actuator_lower],
            rudder_body,
        )
    }

    fn new_rudder(context: &mut InitContext) -> RudderAssembly {
        let init_at_center = context.start_state() == StartState::Taxi
            || context.start_state() == StartState::Runway
            || context.is_in_flight();

        let upper_assembly = Self::a380_rudder_assembly(
            context,
            init_at_center,
            true,
            Self::UPPER_AND_LOWER_PANEL_UPPER_EBHA_BUS,
            Self::UPPER_PANEL_LOWER_EBHA_BUS,
        );
        let lower_assembly = Self::a380_rudder_assembly(
            context,
            init_at_center,
            false,
            Self::UPPER_AND_LOWER_PANEL_UPPER_EBHA_BUS,
            Self::LOWER_PANEL_LOWER_EBHA_BUS,
        );
        RudderAssembly::new(
            context,
            upper_assembly,
            lower_assembly,
            Self::new_a380_rudder_aero_model(true),
            Self::new_a380_rudder_aero_model(false),
        )
    }

    fn new_a380_rudder_aero_model(is_upper_body: bool) -> AerodynamicModel {
        let body = Self::a380_rudder_body(true, is_upper_body);

        let coeff_area = if is_upper_body {
            Ratio::new::<ratio>(0.725)
        } else {
            Ratio::new::<ratio>(0.915)
        };

        AerodynamicModel::new(
            &body,
            Some(Vector3::new(1., 0., 0.)),
            Some(Vector3::new(0., 0., 1.)),
            Some(Vector3::new(1., 0., 0.)),
            coeff_area,
        )
    }
}

struct A380GearDoorFactory {}
impl A380GearDoorFactory {
    fn a380_nose_gear_door_aerodynamics() -> AerodynamicModel {
        // Faking the single door by only considering right door aerodynamics.
        // Will work with headwind, but will cause strange behaviour with massive crosswind.
        AerodynamicModel::new(
            &Self::a380_nose_gear_door_body(),
            Some(Vector3::new(0., 1., 0.)),
            Some(Vector3::new(0., -0.2, 1.)),
            Some(Vector3::new(0., -1., -0.2)),
            Ratio::new::<ratio>(0.7),
        )
    }

    fn a380_left_gear_door_aerodynamics() -> AerodynamicModel {
        AerodynamicModel::new(
            &Self::a380_left_gear_door_body(),
            Some(Vector3::new(0., 1., 0.)),
            Some(Vector3::new(0., -0.1, 1.)),
            Some(Vector3::new(0., 1., 0.1)),
            Ratio::new::<ratio>(0.7),
        )
    }

    fn a380_right_gear_door_aerodynamics() -> AerodynamicModel {
        AerodynamicModel::new(
            &Self::a380_right_gear_door_body(),
            Some(Vector3::new(0., 1., 0.)),
            Some(Vector3::new(0., -0.1, 1.)),
            Some(Vector3::new(0., 1., 0.1)),
            Ratio::new::<ratio>(0.7),
        )
    }

    fn a380_nose_gear_door_actuator(
        context: &mut InitContext,
        bounded_linear_length: &impl BoundedLinearLength,
    ) -> LinearActuator {
        const FLOW_CONTROL_INTEGRAL_GAIN: f64 = 5.;
        const FLOW_CONTROL_PROPORTIONAL_GAIN: f64 = 0.15;
        const FLOW_CONTROL_FORCE_GAIN: f64 = 200000.;

        const MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING: f64 = 28000.;
        const MAX_FLOW_PRECISION_PER_ACTUATOR_PERCENT: f64 = 3.;

        let actuator_characteristics = LinearActuatorCharacteristics::new(
            MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING * 0.98,
            MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING * 1.02,
            VolumeRate::new::<gallon_per_second>(0.027),
            Ratio::new::<percent>(MAX_FLOW_PRECISION_PER_ACTUATOR_PERCENT),
        );

        LinearActuator::new(
            context,
            bounded_linear_length,
            1,
            Length::new::<meter>(0.0378),
            Length::new::<meter>(0.023),
            actuator_characteristics.max_flow(),
            20000.,
            5000.,
            2000.,
            actuator_characteristics.slow_damping(),
            Duration::from_millis(100),
            [1., 1., 1., 1., 0.5, 0.5],
            [0.5, 0.5, 1., 1., 1., 1.],
            [0., 0.15, 0.16, 0.84, 0.85, 1.],
            FLOW_CONTROL_PROPORTIONAL_GAIN,
            FLOW_CONTROL_INTEGRAL_GAIN,
            FLOW_CONTROL_FORCE_GAIN,
            true,
            false,
            None,
            None,
            Pressure::new::<psi>(A380HydraulicCircuitFactory::HYDRAULIC_TARGET_PRESSURE_PSI),
        )
    }

    fn a380_main_gear_door_actuator(
        context: &mut InitContext,
        bounded_linear_length: &impl BoundedLinearLength,
    ) -> LinearActuator {
        const FLOW_CONTROL_INTEGRAL_GAIN: f64 = 5.;
        const FLOW_CONTROL_PROPORTIONAL_GAIN: f64 = 0.7;
        const FLOW_CONTROL_FORCE_GAIN: f64 = 200000.;

        const MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING: f64 = 30000.;
        const MAX_FLOW_PRECISION_PER_ACTUATOR_PERCENT: f64 = 5.;

        let actuator_characteristics = LinearActuatorCharacteristics::new(
            MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING * 0.98,
            MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING * 1.02,
            VolumeRate::new::<gallon_per_second>(0.09),
            Ratio::new::<percent>(MAX_FLOW_PRECISION_PER_ACTUATOR_PERCENT),
        );

        LinearActuator::new(
            context,
            bounded_linear_length,
            1,
            Length::new::<meter>(0.055),
            Length::new::<meter>(0.03),
            actuator_characteristics.max_flow(),
            200000.,
            2500.,
            2000.,
            actuator_characteristics.slow_damping(),
            Duration::from_millis(100),
            [1., 1., 1., 1., 0.5, 0.5],
            [0.5, 0.5, 1., 1., 1., 1.],
            [0., 0.07, 0.08, 0.9, 0.91, 1.],
            FLOW_CONTROL_PROPORTIONAL_GAIN,
            FLOW_CONTROL_INTEGRAL_GAIN,
            FLOW_CONTROL_FORCE_GAIN,
            true,
            false,
            None,
            None,
            Pressure::new::<psi>(A380HydraulicCircuitFactory::HYDRAULIC_TARGET_PRESSURE_PSI),
        )
    }

    fn a380_left_gear_door_body() -> LinearActuatedRigidBodyOnHingeAxis {
        let size = Vector3::new(-1.73, 0.02, 1.7);
        let cg_offset = Vector3::new(2. / 3. * size[0], 0.1, 0.);

        let control_arm = Vector3::new(-0.76, 0., 0.);
        let anchor = Vector3::new(-0.19, 0.23, 0.);

        LinearActuatedRigidBodyOnHingeAxis::new(
            Mass::new::<kilogram>(50.),
            size,
            cg_offset,
            cg_offset,
            control_arm,
            anchor,
            Angle::new::<degree>(0.),
            Angle::new::<degree>(85.),
            Angle::new::<degree>(0.),
            150.,
            true,
            Vector3::new(0., 0., 1.),
        )
    }

    fn a380_right_gear_door_body() -> LinearActuatedRigidBodyOnHingeAxis {
        let size = Vector3::new(1.73, 0.02, 1.7);
        let cg_offset = Vector3::new(2. / 3. * size[0], 0.1, 0.);

        let control_arm = Vector3::new(0.76, 0., 0.);
        let anchor = Vector3::new(0.19, 0.23, 0.);

        LinearActuatedRigidBodyOnHingeAxis::new(
            Mass::new::<kilogram>(50.),
            size,
            cg_offset,
            cg_offset,
            control_arm,
            anchor,
            Angle::new::<degree>(-85.),
            Angle::new::<degree>(85.),
            Angle::new::<degree>(0.),
            150.,
            true,
            Vector3::new(0., 0., 1.),
        )
    }

    fn a380_nose_gear_door_body() -> LinearActuatedRigidBodyOnHingeAxis {
        let size = Vector3::new(0.4, 0.02, 1.5);
        let cg_offset = Vector3::new(-0.5 * size[0], 0., 0.);

        let control_arm = Vector3::new(-0.1465, 0., 0.);
        let anchor = Vector3::new(-0.1465, 0.40, 0.);

        LinearActuatedRigidBodyOnHingeAxis::new(
            Mass::new::<kilogram>(40.),
            size,
            cg_offset,
            cg_offset,
            control_arm,
            anchor,
            Angle::new::<degree>(0.),
            Angle::new::<degree>(85.),
            Angle::new::<degree>(0.),
            150.,
            true,
            Vector3::new(0., 0., 1.),
        )
    }

    fn a380_gear_door_assembly(
        context: &mut InitContext,
        wheel_id: GearWheel,
    ) -> HydraulicLinearActuatorAssembly<1> {
        let gear_door_body = match wheel_id {
            GearWheel::NOSE => Self::a380_nose_gear_door_body(),
            GearWheel::LEFT => Self::a380_left_gear_door_body(),
            GearWheel::RIGHT => Self::a380_right_gear_door_body(),
        };
        let gear_door_actuator = match wheel_id {
            GearWheel::NOSE => Self::a380_nose_gear_door_actuator(context, &gear_door_body),
            GearWheel::LEFT | GearWheel::RIGHT => {
                Self::a380_main_gear_door_actuator(context, &gear_door_body)
            }
        };

        HydraulicLinearActuatorAssembly::new([gear_door_actuator], gear_door_body)
    }
}

struct A380GearFactory {}
impl A380GearFactory {
    fn a380_nose_gear_aerodynamics() -> AerodynamicModel {
        AerodynamicModel::new(
            &Self::a380_nose_gear_body(true),
            Some(Vector3::new(0., 0., 1.)),
            None,
            None,
            Ratio::new::<ratio>(0.25),
        )
    }

    fn a380_right_gear_aerodynamics() -> AerodynamicModel {
        AerodynamicModel::new(
            &Self::a380_right_gear_body(true),
            Some(Vector3::new(0., 0., 1.)),
            Some(Vector3::new(0.3, 0., 1.)),
            Some(Vector3::new(1., 0., -0.3)),
            Ratio::new::<ratio>(0.7),
        )
    }

    fn a380_left_gear_aerodynamics() -> AerodynamicModel {
        AerodynamicModel::new(
            &Self::a380_left_gear_body(true),
            Some(Vector3::new(0., 0., 1.)),
            Some(Vector3::new(-0.3, 0., 1.)),
            Some(Vector3::new(-1., 0., -0.3)),
            Ratio::new::<ratio>(0.7),
        )
    }

    fn a380_nose_gear_actuator(
        context: &mut InitContext,
        bounded_linear_length: &impl BoundedLinearLength,
    ) -> LinearActuator {
        const FLOW_CONTROL_INTEGRAL_GAIN: f64 = 5.;
        const FLOW_CONTROL_PROPORTIONAL_GAIN: f64 = 0.3;
        const FLOW_CONTROL_FORCE_GAIN: f64 = 250000.;

        const MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING: f64 = 900000.;
        const MAX_FLOW_PRECISION_PER_ACTUATOR_PERCENT: f64 = 3.;

        let actuator_characteristics = LinearActuatorCharacteristics::new(
            MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING * 0.98,
            MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING * 1.02,
            VolumeRate::new::<gallon_per_second>(0.053),
            Ratio::new::<percent>(MAX_FLOW_PRECISION_PER_ACTUATOR_PERCENT),
        );

        LinearActuator::new(
            context,
            bounded_linear_length,
            1,
            Length::new::<meter>(0.0792),
            Length::new::<meter>(0.035),
            actuator_characteristics.max_flow(),
            800000.,
            150000.,
            50000.,
            actuator_characteristics.slow_damping(),
            Duration::from_millis(100),
            [1., 1., 1., 1., 0.5, 0.5],
            [0.5, 0.5, 1., 1., 1., 1.],
            [0., 0.1, 0.11, 0.89, 0.9, 1.],
            FLOW_CONTROL_PROPORTIONAL_GAIN,
            FLOW_CONTROL_INTEGRAL_GAIN,
            FLOW_CONTROL_FORCE_GAIN,
            true,
            false,
            None,
            None,
            Pressure::new::<psi>(A380HydraulicCircuitFactory::HYDRAULIC_TARGET_PRESSURE_PSI),
        )
    }

    fn a380_main_gear_actuator(
        context: &mut InitContext,
        bounded_linear_length: &impl BoundedLinearLength,
    ) -> LinearActuator {
        const FLOW_CONTROL_INTEGRAL_GAIN: f64 = 5.0;
        const FLOW_CONTROL_PROPORTIONAL_GAIN: f64 = 0.3;
        const FLOW_CONTROL_FORCE_GAIN: f64 = 250000.;

        const MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING: f64 = 2500000.;
        const MAX_FLOW_PRECISION_PER_ACTUATOR_PERCENT: f64 = 5.;

        let actuator_characteristics = LinearActuatorCharacteristics::new(
            MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING * 0.98,
            MAX_DAMPING_CONSTANT_FOR_SLOW_DAMPING * 1.02,
            VolumeRate::new::<gallon_per_second>(0.17),
            Ratio::new::<percent>(MAX_FLOW_PRECISION_PER_ACTUATOR_PERCENT),
        );

        LinearActuator::new(
            context,
            bounded_linear_length,
            1,
            Length::new::<meter>(0.145),
            Length::new::<meter>(0.105),
            actuator_characteristics.max_flow(),
            800000.,
            350000.,
            50000.,
            actuator_characteristics.slow_damping(),
            Duration::from_millis(100),
            [1., 1., 1., 1., 0.5, 0.5],
            [0.2, 0.4, 1., 1., 1., 1.],
            [0., 0.13, 0.17, 0.95, 0.96, 1.],
            FLOW_CONTROL_PROPORTIONAL_GAIN,
            FLOW_CONTROL_INTEGRAL_GAIN,
            FLOW_CONTROL_FORCE_GAIN,
            true,
            false,
            None,
            None,
            Pressure::new::<psi>(A380HydraulicCircuitFactory::HYDRAULIC_TARGET_PRESSURE_PSI),
        )
    }

    fn a380_left_gear_body(init_downlocked: bool) -> LinearActuatedRigidBodyOnHingeAxis {
        let size = Vector3::new(0.3, 3.453, 0.3);
        let cg_offset = Vector3::new(0., -3. / 4. * size[1], 0.);

        let control_arm = Vector3::new(0.1815, 0.15, 0.);
        let anchor = Vector3::new(0.26, 0.15, 0.);

        LinearActuatedRigidBodyOnHingeAxis::new(
            Mass::new::<kilogram>(700.),
            size,
            cg_offset,
            cg_offset,
            control_arm,
            anchor,
            Angle::new::<degree>(0.),
            Angle::new::<degree>(80.),
            if init_downlocked {
                Angle::new::<degree>(0.)
            } else {
                Angle::new::<degree>(80.)
            },
            150.,
            true,
            Vector3::new(0., 0., 1.),
        )
    }

    fn a380_right_gear_body(init_downlocked: bool) -> LinearActuatedRigidBodyOnHingeAxis {
        let size = Vector3::new(0.3, 3.453, 0.3);
        let cg_offset = Vector3::new(0., -3. / 4. * size[1], 0.);

        let control_arm = Vector3::new(-0.1815, 0.15, 0.);
        let anchor = Vector3::new(-0.26, 0.15, 0.);

        LinearActuatedRigidBodyOnHingeAxis::new(
            Mass::new::<kilogram>(700.),
            size,
            cg_offset,
            cg_offset,
            control_arm,
            anchor,
            Angle::new::<degree>(-80.),
            Angle::new::<degree>(80.),
            if init_downlocked {
                Angle::new::<degree>(0.)
            } else {
                Angle::new::<degree>(-80.)
            },
            150.,
            true,
            Vector3::new(0., 0., 1.),
        )
    }

    fn a380_nose_gear_body(init_downlocked: bool) -> LinearActuatedRigidBodyOnHingeAxis {
        let size = Vector3::new(0.3, 2.453, 0.3);
        let cg_offset = Vector3::new(0., -2. / 3. * size[1], 0.);

        let control_arm = Vector3::new(0., -0.093, 0.212);
        let anchor = Vector3::new(0., 0.56, 0.);

        LinearActuatedRigidBodyOnHingeAxis::new(
            Mass::new::<kilogram>(300.),
            size,
            cg_offset,
            cg_offset,
            control_arm,
            anchor,
            Angle::new::<degree>(-101.),
            Angle::new::<degree>(92.),
            if init_downlocked {
                Angle::new::<degree>(-9.)
            } else {
                Angle::new::<degree>(-101.)
            },
            150.,
            true,
            Vector3::new(1., 0., 0.),
        )
    }

    fn a380_gear_assembly(
        context: &mut InitContext,
        wheel_id: GearWheel,
        init_downlocked: bool,
    ) -> HydraulicLinearActuatorAssembly<1> {
        let gear_body = match wheel_id {
            GearWheel::NOSE => Self::a380_nose_gear_body(init_downlocked),

            GearWheel::LEFT => Self::a380_left_gear_body(init_downlocked),

            GearWheel::RIGHT => Self::a380_right_gear_body(init_downlocked),
        };

        let gear_actuator = match wheel_id {
            GearWheel::NOSE => Self::a380_nose_gear_actuator(context, &gear_body),

            GearWheel::LEFT | GearWheel::RIGHT => {
                Self::a380_main_gear_actuator(context, &gear_body)
            }
        };

        HydraulicLinearActuatorAssembly::new([gear_actuator], gear_body)
    }
}

struct A380GearSystemFactory {}
impl A380GearSystemFactory {
    fn a380_gear_system(context: &mut InitContext) -> HydraulicGearSystem {
        let init_downlocked = context.start_gear_down();

        let nose_door = A380GearDoorFactory::a380_gear_door_assembly(context, GearWheel::NOSE);
        let left_door = A380GearDoorFactory::a380_gear_door_assembly(context, GearWheel::LEFT);
        let right_door = A380GearDoorFactory::a380_gear_door_assembly(context, GearWheel::RIGHT);

        let nose_gear =
            A380GearFactory::a380_gear_assembly(context, GearWheel::NOSE, init_downlocked);
        let left_gear =
            A380GearFactory::a380_gear_assembly(context, GearWheel::LEFT, init_downlocked);
        let right_gear =
            A380GearFactory::a380_gear_assembly(context, GearWheel::RIGHT, init_downlocked);

        HydraulicGearSystem::new(
            context,
            nose_door,
            left_door,
            right_door,
            nose_gear,
            left_gear,
            right_gear,
            A380GearDoorFactory::a380_left_gear_door_aerodynamics(),
            A380GearDoorFactory::a380_right_gear_door_aerodynamics(),
            A380GearDoorFactory::a380_nose_gear_door_aerodynamics(),
            A380GearFactory::a380_left_gear_aerodynamics(),
            A380GearFactory::a380_right_gear_aerodynamics(),
            A380GearFactory::a380_nose_gear_aerodynamics(),
        )
    }
}

pub(super) struct A380Hydraulic {
    nose_steering: SteeringActuator,

    core_hydraulic_updater: MaxStepLoop,

    brake_steer_computer: A380HydraulicBrakeSteerComputerUnit,

    green_circuit: HydraulicCircuit,
    green_circuit_controller: A380HydraulicCircuitController,
    yellow_circuit: HydraulicCircuit,
    yellow_circuit_controller: A380HydraulicCircuitController,

    engine_driven_pump_1a: EngineDrivenPump,
    engine_driven_pump_1a_controller: A380EngineDrivenPumpController,

    engine_driven_pump_2a: EngineDrivenPump,
    engine_driven_pump_2a_controller: A380EngineDrivenPumpController,

    engine_driven_pump_3a: EngineDrivenPump,
    engine_driven_pump_3a_controller: A380EngineDrivenPumpController,

    engine_driven_pump_4a: EngineDrivenPump,
    engine_driven_pump_4a_controller: A380EngineDrivenPumpController,

    engine_driven_pump_1b: EngineDrivenPump,
    engine_driven_pump_1b_controller: A380EngineDrivenPumpController,

    engine_driven_pump_2b: EngineDrivenPump,
    engine_driven_pump_2b_controller: A380EngineDrivenPumpController,

    engine_driven_pump_3b: EngineDrivenPump,
    engine_driven_pump_3b_controller: A380EngineDrivenPumpController,

    engine_driven_pump_4b: EngineDrivenPump,
    engine_driven_pump_4b_controller: A380EngineDrivenPumpController,

    yellow_electric_pump_a: ElectricPump,
    yellow_electric_pump_a_controller: A380ElectricPumpController,

    yellow_electric_pump_b: ElectricPump,
    yellow_electric_pump_b_controller: A380ElectricPumpController,

    green_electric_pump_a: ElectricPump,
    green_electric_pump_a_controller: A380ElectricPumpController,

    green_electric_pump_b: ElectricPump,
    green_electric_pump_b_controller: A380ElectricPumpController,

    green_auxiliary_pump: ManualPump,
    green_electric_aux_pump_controller: A380AuxiliaryPumpController,

    pushback_tug: PushbackTug,

    braking_circuit_norm: BrakeCircuit,
    braking_circuit_altn: BrakeCircuit,
    braking_force: A380BrakingForce,

    flap_system: FlapSlatAssembly,
    slat_system: FlapSlatAssembly,
    slats_flaps_complex: SlatFlapComplex,

    forward_cargo_door: CargoDoor,
    forward_cargo_door_controller: HydraulicDoorController,
    aft_cargo_door: CargoDoor,
    aft_cargo_door_controller: HydraulicDoorController,

    elevator_system_controller: ElevatorSystemHydraulicController,
    aileron_system_controller: AileronSystemHydraulicController,

    left_aileron: AileronAssembly,
    right_aileron: AileronAssembly,
    left_elevator: ElevatorAssembly,
    right_elevator: ElevatorAssembly,

    rudder_system_controller: RudderSystemHydraulicController,
    rudder: RudderAssembly,

    left_spoilers: SpoilerGroup,
    right_spoilers: SpoilerGroup,

    gear_system_gravity_extension_controller: A380GravityExtension,
    gear_system_hydraulic_controller: A380GearHydraulicController,
    gear_system: HydraulicGearSystem,

    ths_system_controller: TrimmableHorizontalStabilizerSystemHydraulicController,
    ths: TrimmableHorizontalStabilizerActuator,

    epump_auto_logic: A380ElectricPumpAutoLogic,

    tilting_gears: A380TiltingGears,
}
impl A380Hydraulic {
    const FLAP_FPPU_TO_SURFACE_ANGLE_BREAKPTS: [f64; 12] = [
        0., 35.66, 69.32, 89.7, 105.29, 120.22, 145.51, 168.35, 189.87, 210.69, 231.25, 251.97,
    ];
    const FLAP_FPPU_TO_SURFACE_ANGLE_DEGREES: [f64; 12] =
        [0., 0., 2.5, 5., 7.5, 10., 15., 20., 25., 30., 35., 40.];

    const SLAT_FPPU_TO_SURFACE_ANGLE_BREAKPTS: [f64; 12] = [
        0., 66.83, 167.08, 222.27, 272.27, 334.16, 334.16, 334.16, 334.16, 334.16, 334.16, 334.16,
    ];
    const SLAT_FPPU_TO_SURFACE_ANGLE_DEGREES: [f64; 12] =
        [0., 5.4, 13.5, 18., 22., 27., 27., 27., 27., 27., 27., 27.];

    const FORWARD_CARGO_DOOR_ID: &'static str = "FWD";
    const AFT_CARGO_DOOR_ID: &'static str = "AFT";

    const ELECTRIC_PUMP_MAX_CURRENT_AMPERE: f64 = 75.;

    const GREEN_ELEC_PUMP_CONTROL_POWER_BUS: ElectricalBusType =
        ElectricalBusType::DirectCurrent(2);
    const YELLOW_ELEC_PUMP_CONTROL_POWER_BUS: ElectricalBusType =
        ElectricalBusType::DirectCurrent(1);

    const GREEN_A_ELEC_PUMP_SUPPLY_POWER_BUS: ElectricalBusType =
        ElectricalBusType::AlternatingCurrent(1);
    const GREEN_B_ELEC_PUMP_SUPPLY_POWER_BUS: ElectricalBusType =
        ElectricalBusType::AlternatingCurrent(2);
    const YELLOW_A_ELEC_PUMP_SUPPLY_POWER_BUS: ElectricalBusType =
        ElectricalBusType::AlternatingCurrent(3);
    const YELLOW_B_ELEC_PUMP_SUPPLY_POWER_BUS: ElectricalBusType =
        ElectricalBusType::AlternatingCurrent(4);

    const EDP_CONTROL_POWER_BUS1: ElectricalBusType = ElectricalBusType::DirectCurrentEssential;

    const ALTERNATE_BRAKE_ACCUMULATOR_GAS_PRE_CHARGE: f64 = 1000.0; // Nitrogen PSI
                                                                    // Refresh rate of core hydraulic simulation
    const HYDRAULIC_SIM_TIME_STEP: Duration = Duration::from_millis(10);

    pub fn new(context: &mut InitContext) -> A380Hydraulic {
        let brake_accumulator_charac = BrakeAccumulatorCharacteristics::new(
            Volume::new::<gallon>(1.0),
            Pressure::new::<psi>(Self::ALTERNATE_BRAKE_ACCUMULATOR_GAS_PRE_CHARGE),
            Pressure::new::<psi>(A380HydraulicCircuitFactory::HYDRAULIC_TARGET_PRESSURE_PSI),
            Ratio::new::<ratio>(0.01),
        );

        A380Hydraulic {
            nose_steering: SteeringActuator::new(
                context,
                Angle::new::<degree>(75.),
                AngularVelocity::new::<radian_per_second>(0.35),
                Length::new::<meter>(0.075),
                Ratio::new::<ratio>(0.18),
            ),

            core_hydraulic_updater: MaxStepLoop::new(Self::HYDRAULIC_SIM_TIME_STEP),

            brake_steer_computer: A380HydraulicBrakeSteerComputerUnit::new(context),

            green_circuit: A380HydraulicCircuitFactory::new_green_circuit(context),
            green_circuit_controller: A380HydraulicCircuitController::new(HydraulicColor::Green),
            yellow_circuit: A380HydraulicCircuitFactory::new_yellow_circuit(context),
            yellow_circuit_controller: A380HydraulicCircuitController::new(HydraulicColor::Yellow),

            engine_driven_pump_1a: EngineDrivenPump::new(
                context,
                AirbusEngineDrivenPumpId::Edp1a,
                PumpCharacteristics::a380_edp(),
            ),
            engine_driven_pump_1a_controller: A380EngineDrivenPumpController::new(
                context,
                A380EngineDrivenPumpId::Edp1a,
                vec![Self::EDP_CONTROL_POWER_BUS1],
            ),

            engine_driven_pump_2a: EngineDrivenPump::new(
                context,
                AirbusEngineDrivenPumpId::Edp2a,
                PumpCharacteristics::a380_edp(),
            ),
            engine_driven_pump_2a_controller: A380EngineDrivenPumpController::new(
                context,
                A380EngineDrivenPumpId::Edp2a,
                vec![Self::EDP_CONTROL_POWER_BUS1],
            ),

            engine_driven_pump_3a: EngineDrivenPump::new(
                context,
                AirbusEngineDrivenPumpId::Edp3a,
                PumpCharacteristics::a380_edp(),
            ),
            engine_driven_pump_3a_controller: A380EngineDrivenPumpController::new(
                context,
                A380EngineDrivenPumpId::Edp3a,
                vec![Self::EDP_CONTROL_POWER_BUS1],
            ),

            engine_driven_pump_4a: EngineDrivenPump::new(
                context,
                AirbusEngineDrivenPumpId::Edp4a,
                PumpCharacteristics::a380_edp(),
            ),
            engine_driven_pump_4a_controller: A380EngineDrivenPumpController::new(
                context,
                A380EngineDrivenPumpId::Edp4a,
                vec![Self::EDP_CONTROL_POWER_BUS1],
            ),

            engine_driven_pump_1b: EngineDrivenPump::new(
                context,
                AirbusEngineDrivenPumpId::Edp1b,
                PumpCharacteristics::a380_edp(),
            ),
            engine_driven_pump_1b_controller: A380EngineDrivenPumpController::new(
                context,
                A380EngineDrivenPumpId::Edp1b,
                vec![Self::EDP_CONTROL_POWER_BUS1],
            ),

            engine_driven_pump_2b: EngineDrivenPump::new(
                context,
                AirbusEngineDrivenPumpId::Edp2b,
                PumpCharacteristics::a380_edp(),
            ),
            engine_driven_pump_2b_controller: A380EngineDrivenPumpController::new(
                context,
                A380EngineDrivenPumpId::Edp2b,
                vec![Self::EDP_CONTROL_POWER_BUS1],
            ),

            engine_driven_pump_3b: EngineDrivenPump::new(
                context,
                AirbusEngineDrivenPumpId::Edp3b,
                PumpCharacteristics::a380_edp(),
            ),
            engine_driven_pump_3b_controller: A380EngineDrivenPumpController::new(
                context,
                A380EngineDrivenPumpId::Edp3b,
                vec![Self::EDP_CONTROL_POWER_BUS1],
            ),

            engine_driven_pump_4b: EngineDrivenPump::new(
                context,
                AirbusEngineDrivenPumpId::Edp4b,
                PumpCharacteristics::a380_edp(),
            ),
            engine_driven_pump_4b_controller: A380EngineDrivenPumpController::new(
                context,
                A380EngineDrivenPumpId::Edp4b,
                vec![Self::EDP_CONTROL_POWER_BUS1],
            ),

            yellow_electric_pump_a: ElectricPump::new(
                context,
                AirbusElectricPumpId::YellowA,
                Self::YELLOW_A_ELEC_PUMP_SUPPLY_POWER_BUS,
                ElectricCurrent::new::<ampere>(Self::ELECTRIC_PUMP_MAX_CURRENT_AMPERE),
                PumpCharacteristics::a380_electric_pump(),
            ),
            yellow_electric_pump_a_controller: A380ElectricPumpController::new(
                context,
                A380ElectricPumpId::YellowA,
                Self::YELLOW_ELEC_PUMP_CONTROL_POWER_BUS,
            ),

            yellow_electric_pump_b: ElectricPump::new(
                context,
                AirbusElectricPumpId::YellowB,
                Self::YELLOW_B_ELEC_PUMP_SUPPLY_POWER_BUS,
                ElectricCurrent::new::<ampere>(Self::ELECTRIC_PUMP_MAX_CURRENT_AMPERE),
                PumpCharacteristics::a380_electric_pump(),
            ),
            yellow_electric_pump_b_controller: A380ElectricPumpController::new(
                context,
                A380ElectricPumpId::YellowB,
                Self::YELLOW_ELEC_PUMP_CONTROL_POWER_BUS,
            ),

            green_electric_pump_a: ElectricPump::new(
                context,
                AirbusElectricPumpId::GreenA,
                Self::GREEN_A_ELEC_PUMP_SUPPLY_POWER_BUS,
                ElectricCurrent::new::<ampere>(Self::ELECTRIC_PUMP_MAX_CURRENT_AMPERE),
                PumpCharacteristics::a380_electric_pump(),
            ),
            green_electric_pump_a_controller: A380ElectricPumpController::new(
                context,
                A380ElectricPumpId::GreenA,
                Self::GREEN_ELEC_PUMP_CONTROL_POWER_BUS,
            ),

            green_electric_pump_b: ElectricPump::new(
                context,
                AirbusElectricPumpId::GreenB,
                Self::GREEN_B_ELEC_PUMP_SUPPLY_POWER_BUS,
                ElectricCurrent::new::<ampere>(Self::ELECTRIC_PUMP_MAX_CURRENT_AMPERE),
                PumpCharacteristics::a380_electric_pump(),
            ),
            green_electric_pump_b_controller: A380ElectricPumpController::new(
                context,
                A380ElectricPumpId::GreenB,
                Self::GREEN_ELEC_PUMP_CONTROL_POWER_BUS,
            ),

            green_auxiliary_pump: ManualPump::new(PumpCharacteristics::a380_aux_pump()),
            green_electric_aux_pump_controller: A380AuxiliaryPumpController::new(
                A380ElectricPumpId::GreenAuxiliary,
            ),

            pushback_tug: PushbackTug::new(context),

            braking_circuit_norm: BrakeCircuit::new(
                context,
                "NORM",
                HydraulicColor::Green,
                None,
                Volume::new::<gallon>(0.13),
            ),

            // Alternate brakes accumulator in real A320 is 1.5 gal capacity.
            // This is tuned down to 1.0 to match real world accumulator filling time
            // as a faster accumulator response has too much unstability
            braking_circuit_altn: BrakeCircuit::new(
                context,
                "ALTN",
                HydraulicColor::Yellow,
                Some(Accumulator::new_brake_accumulator(brake_accumulator_charac)),
                Volume::new::<gallon>(0.13),
            ),

            braking_force: A380BrakingForce::new(context),

            flap_system: FlapSlatAssembly::new(
                context,
                "FLAPS",
                Volume::new::<cubic_inch>(0.32),
                AngularVelocity::new::<radian_per_second>(0.13),
                Angle::new::<degree>(251.97),
                Ratio::new::<ratio>(140.),
                Ratio::new::<ratio>(16.632),
                Ratio::new::<ratio>(314.98),
                Self::FLAP_FPPU_TO_SURFACE_ANGLE_BREAKPTS,
                Self::FLAP_FPPU_TO_SURFACE_ANGLE_DEGREES,
                Pressure::new::<psi>(A380HydraulicCircuitFactory::HYDRAULIC_TARGET_PRESSURE_PSI),
            ),
            slat_system: FlapSlatAssembly::new(
                context,
                "SLATS",
                Volume::new::<cubic_inch>(0.32),
                AngularVelocity::new::<radian_per_second>(0.13),
                Angle::new::<degree>(334.16),
                Ratio::new::<ratio>(140.),
                Ratio::new::<ratio>(16.632),
                Ratio::new::<ratio>(314.98),
                Self::SLAT_FPPU_TO_SURFACE_ANGLE_BREAKPTS,
                Self::SLAT_FPPU_TO_SURFACE_ANGLE_DEGREES,
                Pressure::new::<psi>(A380HydraulicCircuitFactory::HYDRAULIC_TARGET_PRESSURE_PSI),
            ),
            slats_flaps_complex: SlatFlapComplex::new(context),

            forward_cargo_door: A380CargoDoorFactory::new_a380_cargo_door(
                context,
                Self::FORWARD_CARGO_DOOR_ID,
            ),
            forward_cargo_door_controller: HydraulicDoorController::new(
                context,
                Self::FORWARD_CARGO_DOOR_ID,
            ),

            aft_cargo_door: A380CargoDoorFactory::new_a380_cargo_door(
                context,
                Self::AFT_CARGO_DOOR_ID,
            ),
            aft_cargo_door_controller: HydraulicDoorController::new(
                context,
                Self::AFT_CARGO_DOOR_ID,
            ),

            elevator_system_controller: ElevatorSystemHydraulicController::new(context),
            aileron_system_controller: AileronSystemHydraulicController::new(context),

            left_aileron: A380AileronFactory::new_aileron(context, ActuatorSide::Left),
            right_aileron: A380AileronFactory::new_aileron(context, ActuatorSide::Right),
            left_elevator: A380ElevatorFactory::new_elevator(context, ActuatorSide::Left),
            right_elevator: A380ElevatorFactory::new_elevator(context, ActuatorSide::Right),

            rudder_system_controller: RudderSystemHydraulicController::new(context),
            rudder: A380RudderFactory::new_rudder(context),

            left_spoilers: A380SpoilerFactory::new_a380_spoiler_group(context, ActuatorSide::Left),
            right_spoilers: A380SpoilerFactory::new_a380_spoiler_group(
                context,
                ActuatorSide::Right,
            ),

            gear_system_gravity_extension_controller: A380GravityExtension::new(context),
            gear_system_hydraulic_controller: A380GearHydraulicController::new(),
            gear_system: A380GearSystemFactory::a380_gear_system(context),

            ths_system_controller: TrimmableHorizontalStabilizerSystemHydraulicController::new(
                context,
            ),
            ths: TrimmableHorizontalStabilizerActuator::new(
                context,
                Angle::new::<degree>(-2.),
                Angle::new::<degree>(12.),
                AngularVelocity::new::<revolution_per_minute>(5000.),
                Pressure::new::<psi>(5000.),
                Volume::new::<cubic_inch>(0.4), // This value is just copied from the A320s THS. No idea about the real value
                0.00005,
            ),

            epump_auto_logic: A380ElectricPumpAutoLogic::new(
                Self::GREEN_A_ELEC_PUMP_SUPPLY_POWER_BUS,
                Self::GREEN_B_ELEC_PUMP_SUPPLY_POWER_BUS,
                Self::YELLOW_A_ELEC_PUMP_SUPPLY_POWER_BUS,
                Self::YELLOW_B_ELEC_PUMP_SUPPLY_POWER_BUS,
            ),

            tilting_gears: A380TiltingGearsFactory::new_a380_tilt_assembly(context),
        }
    }

    pub(super) fn update(
        &mut self,
        context: &UpdateContext,
        engines: [&impl Engine; 4],
        overhead_panel: &A380HydraulicOverheadPanel,
        autobrake_panel: &AutobrakePanel,
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        lgcius: &LandingGearControlInterfaceUnitSet,
        reservoir_pneumatics: &impl ReservoirAirPressure,
        adirs: &impl AdirsDiscreteOutputs,
    ) {
        self.core_hydraulic_updater.update(context);

        self.update_with_sim_rate(
            context,
            overhead_panel,
            autobrake_panel,
            lgcius.lgciu1(),
            lgcius.lgciu2(),
            engines[0],
            engines[1],
        );

        for cur_time_step in self.core_hydraulic_updater {
            self.update_physics(&context.with_delta(cur_time_step), lgcius, adirs);

            self.update_core_hydraulics(
                &context.with_delta(cur_time_step),
                engines,
                overhead_panel,
                engine_fire_push_buttons,
                lgcius.lgciu1(),
                lgcius.lgciu2(),
                reservoir_pneumatics,
            );
        }
    }

    fn edp_has_fault(&self, pump_id: A380EngineDrivenPumpId) -> bool {
        match pump_id {
            A380EngineDrivenPumpId::Edp1a => self.engine_driven_pump_1a_controller.has_any_fault(),
            A380EngineDrivenPumpId::Edp2a => self.engine_driven_pump_2a_controller.has_any_fault(),
            A380EngineDrivenPumpId::Edp3a => self.engine_driven_pump_3a_controller.has_any_fault(),
            A380EngineDrivenPumpId::Edp4a => self.engine_driven_pump_4a_controller.has_any_fault(),

            A380EngineDrivenPumpId::Edp1b => self.engine_driven_pump_1b_controller.has_any_fault(),
            A380EngineDrivenPumpId::Edp2b => self.engine_driven_pump_2b_controller.has_any_fault(),
            A380EngineDrivenPumpId::Edp3b => self.engine_driven_pump_3b_controller.has_any_fault(),
            A380EngineDrivenPumpId::Edp4b => self.engine_driven_pump_4b_controller.has_any_fault(),
        }
    }

    fn pump_disc_has_fault(&self, engine_id: usize) -> bool {
        match engine_id {
            1 => {
                self.engine_driven_pump_1a_controller.has_disc_fault()
                    || self.engine_driven_pump_1b_controller.has_disc_fault()
            }
            2 => {
                self.engine_driven_pump_2a_controller.has_disc_fault()
                    || self.engine_driven_pump_2b_controller.has_disc_fault()
            }
            3 => {
                self.engine_driven_pump_3a_controller.has_disc_fault()
                    || self.engine_driven_pump_3b_controller.has_disc_fault()
            }
            4 => {
                self.engine_driven_pump_4a_controller.has_disc_fault()
                    || self.engine_driven_pump_4b_controller.has_disc_fault()
            }
            _ => panic!("Not more than 4 engines!!"),
        }
    }

    fn epump_has_fault(&self, pump_id: A380ElectricPumpId) -> bool {
        match pump_id {
            A380ElectricPumpId::YellowA => self.yellow_electric_pump_a_controller.has_any_fault(),
            A380ElectricPumpId::YellowB => self.yellow_electric_pump_b_controller.has_any_fault(),
            A380ElectricPumpId::GreenA => self.green_electric_pump_a_controller.has_any_fault(),
            A380ElectricPumpId::GreenB => self.green_electric_pump_b_controller.has_any_fault(),

            A380ElectricPumpId::GreenAuxiliary => false, // TODO check the fault behaviour
        }
    }

    pub fn green_reservoir(&self) -> &Reservoir {
        self.green_circuit.reservoir()
    }

    pub fn yellow_reservoir(&self) -> &Reservoir {
        self.yellow_circuit.reservoir()
    }

    pub fn left_elevator_aero_torques(&self) -> (Torque, Torque) {
        self.left_elevator.aerodynamic_torques_outter_inner()
    }

    pub fn right_elevator_aero_torques(&self) -> (Torque, Torque) {
        self.right_elevator.aerodynamic_torques_outter_inner()
    }

    pub fn up_down_rudder_aero_torques(&self) -> (Torque, Torque) {
        self.rudder.aerodynamic_torques_up_down()
    }

    #[cfg(test)]
    fn nose_wheel_steering_pin_is_inserted(&self) -> bool {
        self.pushback_tug.is_nose_wheel_steering_pin_inserted()
    }

    #[cfg(test)]
    fn is_green_pressure_switch_pressurised(&self) -> bool {
        self.green_circuit.system_section_pressure_switch() == PressureSwitchState::Pressurised
    }

    #[cfg(test)]
    fn is_yellow_pressure_switch_pressurised(&self) -> bool {
        self.yellow_circuit.system_section_pressure_switch() == PressureSwitchState::Pressurised
    }

    fn update_physics(
        &mut self,
        context: &UpdateContext,
        lgcius: &LandingGearControlInterfaceUnitSet,
        adirs: &impl AdirsDiscreteOutputs,
    ) {
        self.forward_cargo_door.update(
            context,
            &self.forward_cargo_door_controller,
            self.green_circuit.auxiliary_section(),
        );

        self.aft_cargo_door.update(
            context,
            &self.aft_cargo_door_controller,
            self.green_circuit.auxiliary_section(),
        );

        self.gear_system_hydraulic_controller.update(
            adirs,
            lgcius.lgciu1(),
            lgcius.lgciu2(),
            &self.gear_system_gravity_extension_controller,
        );

        self.ths.update(
            context,
            self.ths_system_controller.controllers(),
            [
                self.green_circuit
                    .system_section()
                    .pressure_downstream_leak_valve(),
                self.yellow_circuit
                    .system_section()
                    .pressure_downstream_leak_valve(),
            ],
        );

        self.left_aileron.update(
            context,
            [
                self.aileron_system_controller
                    .left_controllers(AileronPanelPosition::Outward),
                self.aileron_system_controller
                    .left_controllers(AileronPanelPosition::Middle),
                self.aileron_system_controller
                    .left_controllers(AileronPanelPosition::Inward),
            ],
            [
                self.green_circuit.system_section(),
                self.yellow_circuit.system_section(),
                self.green_circuit.system_section(),
            ],
            [
                self.yellow_circuit.system_section(),
                self.green_circuit.system_section(),
                self.yellow_circuit.system_section(),
            ],
        );

        self.right_aileron.update(
            context,
            [
                self.aileron_system_controller
                    .right_controllers(AileronPanelPosition::Outward),
                self.aileron_system_controller
                    .right_controllers(AileronPanelPosition::Middle),
                self.aileron_system_controller
                    .right_controllers(AileronPanelPosition::Inward),
            ],
            [
                self.green_circuit.system_section(),
                self.yellow_circuit.system_section(),
                self.green_circuit.system_section(),
            ],
            [
                self.yellow_circuit.system_section(),
                self.green_circuit.system_section(),
                self.yellow_circuit.system_section(),
            ],
        );

        self.left_elevator.update(
            context,
            [
                self.elevator_system_controller
                    .left_controllers(ElevatorPanelPosition::Outward),
                self.elevator_system_controller
                    .left_controllers(ElevatorPanelPosition::Inward),
            ],
            [
                self.green_circuit.system_section(),
                self.green_circuit.system_section(),
            ],
            [
                self.green_circuit.system_section(),
                self.green_circuit.system_section(),
            ],
        );

        self.right_elevator.update(
            context,
            [
                self.elevator_system_controller
                    .right_controllers(ElevatorPanelPosition::Outward),
                self.elevator_system_controller
                    .right_controllers(ElevatorPanelPosition::Inward),
            ],
            [
                self.yellow_circuit.system_section(),
                self.yellow_circuit.system_section(),
            ],
            [
                self.yellow_circuit.system_section(),
                self.yellow_circuit.system_section(),
            ],
        );

        self.rudder.update(
            context,
            [
                self.rudder_system_controller
                    .controllers(RudderPanelPosition::Upper),
                self.rudder_system_controller
                    .controllers(RudderPanelPosition::Lower),
            ],
            [
                self.yellow_circuit.system_section(),
                self.green_circuit.system_section(),
            ],
            [
                self.green_circuit.system_section(),
                self.yellow_circuit.system_section(),
            ],
        );

        self.left_spoilers.update(
            context,
            self.green_circuit.system_section(),
            self.yellow_circuit.system_section(),
        );

        self.right_spoilers.update(
            context,
            self.green_circuit.system_section(),
            self.yellow_circuit.system_section(),
        );

        self.gear_system.update(
            context,
            &self.gear_system_hydraulic_controller,
            lgcius.active_lgciu(),
            self.green_circuit.system_section(),
        );
    }

    fn update_with_sim_rate(
        &mut self,
        context: &UpdateContext,
        overhead_panel: &A380HydraulicOverheadPanel,
        autobrake_panel: &AutobrakePanel,
        lgciu1: &impl LgciuInterface,
        lgciu2: &impl LgciuInterface,
        engine1: &impl Engine,
        engine2: &impl Engine,
    ) {
        self.aileron_system_controller.update();

        self.elevator_system_controller.update();

        self.ths_system_controller.update();

        self.rudder_system_controller.update();

        self.tilting_gears.update(context);

        self.nose_steering.update(
            context,
            self.yellow_circuit.system_section(),
            &self.brake_steer_computer,
            &self.pushback_tug,
        );

        // Process brake logic (which circuit brakes) and send brake demands (how much)
        self.brake_steer_computer.update(
            context,
            self.green_circuit.system_section(),
            &self.braking_circuit_altn,
            lgciu1,
            lgciu2,
            autobrake_panel,
            engine1,
            engine2,
        );

        self.pushback_tug.update(context);

        self.braking_force.update_forces(
            context,
            &self.braking_circuit_norm,
            &self.braking_circuit_altn,
            engine1,
            engine2,
            &self.pushback_tug,
        );

        self.slats_flaps_complex
            .update(context, &self.flap_system, &self.slat_system);

        self.flap_system.update(
            context,
            self.slats_flaps_complex.flap_demand(),
            self.slats_flaps_complex.flap_demand(),
            self.green_circuit.system_section(),
            self.yellow_circuit.system_section(),
        );

        self.slat_system.update(
            context,
            self.slats_flaps_complex.slat_demand(),
            self.slats_flaps_complex.slat_demand(),
            self.green_circuit.system_section(),
            self.green_circuit.system_section(),
        );

        self.forward_cargo_door_controller.update(
            context,
            &self.forward_cargo_door,
            self.green_circuit.auxiliary_section(),
        );

        self.aft_cargo_door_controller.update(
            context,
            &self.aft_cargo_door,
            self.green_circuit.auxiliary_section(),
        );

        self.slats_flaps_complex
            .update(context, &self.flap_system, &self.slat_system);

        self.epump_auto_logic.update(
            context,
            &self.forward_cargo_door_controller,
            &self.aft_cargo_door_controller,
            &self.pushback_tug,
            overhead_panel,
        );
    }

    // For each hydraulic loop retrieves volumes from and to each actuator and pass it to the loops
    fn update_actuators_volume(&mut self) {
        self.update_green_actuators_volume();
        self.update_yellow_actuators_volume();
    }

    fn update_green_actuators_volume(&mut self) {
        self.green_circuit
            .update_system_actuator_volumes(&mut self.braking_circuit_norm);

        self.green_circuit
            .update_system_actuator_volumes(self.left_aileron.actuator(
                AileronActuatorPosition::Outward,
                AileronPanelPosition::Outward,
            ));

        // This one is EHA, TODO check if it's connected to green or yellow for filling
        self.green_circuit
            .update_system_actuator_volumes(self.left_aileron.actuator(
                AileronActuatorPosition::Inward,
                AileronPanelPosition::Middle,
            ));

        self.green_circuit
            .update_system_actuator_volumes(self.left_aileron.actuator(
                AileronActuatorPosition::Outward,
                AileronPanelPosition::Inward,
            ));

        self.green_circuit
            .update_system_actuator_volumes(self.right_aileron.actuator(
                AileronActuatorPosition::Outward,
                AileronPanelPosition::Outward,
            ));

        // This one is EHA, TODO check if it's connected to green or yellow for filling
        self.green_circuit
            .update_system_actuator_volumes(self.right_aileron.actuator(
                AileronActuatorPosition::Inward,
                AileronPanelPosition::Middle,
            ));

        self.green_circuit
            .update_system_actuator_volumes(self.right_aileron.actuator(
                AileronActuatorPosition::Outward,
                AileronPanelPosition::Inward,
            ));

        self.green_circuit
            .update_system_actuator_volumes(self.left_elevator.actuator(
                ElevatorActuatorPosition::Outward,
                ElevatorPanelPosition::Outward,
            ));

        // This one is EHA, TODO check if it's connected to green or yellow for filling
        self.green_circuit
            .update_system_actuator_volumes(self.left_elevator.actuator(
                ElevatorActuatorPosition::Inward,
                ElevatorPanelPosition::Outward,
            ));

        self.green_circuit
            .update_system_actuator_volumes(self.left_elevator.actuator(
                ElevatorActuatorPosition::Outward,
                ElevatorPanelPosition::Inward,
            ));

        // This one is EHA, TODO check if it's connected to green or yellow for filling
        self.green_circuit
            .update_system_actuator_volumes(self.left_elevator.actuator(
                ElevatorActuatorPosition::Inward,
                ElevatorPanelPosition::Inward,
            ));

        self.green_circuit
            .update_auxiliary_actuator_volumes(self.forward_cargo_door.actuator());

        self.green_circuit
            .update_auxiliary_actuator_volumes(self.aft_cargo_door.actuator());

        self.green_circuit.update_system_actuator_volumes(
            self.rudder
                .actuator(RudderActuatorPosition::Lower, RudderPanelPosition::Upper),
        );
        self.green_circuit.update_system_actuator_volumes(
            self.rudder
                .actuator(RudderActuatorPosition::Upper, RudderPanelPosition::Lower),
        );

        self.green_circuit
            .update_system_actuator_volumes(self.flap_system.left_motor());
        self.green_circuit
            .update_system_actuator_volumes(self.slat_system.right_motor());

        self.green_circuit
            .update_system_actuator_volumes(self.left_spoilers.actuator(1));
        self.green_circuit
            .update_system_actuator_volumes(self.left_spoilers.actuator(3));
        self.green_circuit
            .update_system_actuator_volumes(self.left_spoilers.actuator(5));
        self.green_circuit
            .update_system_actuator_volumes(self.left_spoilers.actuator(7));

        self.green_circuit
            .update_system_actuator_volumes(self.right_spoilers.actuator(1));
        self.green_circuit
            .update_system_actuator_volumes(self.right_spoilers.actuator(3));
        self.green_circuit
            .update_system_actuator_volumes(self.right_spoilers.actuator(5));
        self.green_circuit
            .update_system_actuator_volumes(self.right_spoilers.actuator(7));

        for actuator in self.gear_system.all_actuators() {
            self.green_circuit.update_system_actuator_volumes(actuator);
        }

        self.green_circuit
            .update_system_actuator_volumes(self.ths.left_motor());
    }

    fn update_yellow_actuators_volume(&mut self) {
        self.yellow_circuit
            .update_system_actuator_volumes(self.left_aileron.actuator(
                AileronActuatorPosition::Inward,
                AileronPanelPosition::Outward,
            ));

        self.yellow_circuit
            .update_system_actuator_volumes(self.left_aileron.actuator(
                AileronActuatorPosition::Outward,
                AileronPanelPosition::Middle,
            ));

        // This one is EHA, TODO check if it's connected to green or yellow for filling
        self.yellow_circuit
            .update_system_actuator_volumes(self.left_aileron.actuator(
                AileronActuatorPosition::Inward,
                AileronPanelPosition::Inward,
            ));

        self.yellow_circuit
            .update_system_actuator_volumes(self.right_aileron.actuator(
                AileronActuatorPosition::Inward,
                AileronPanelPosition::Outward,
            ));

        self.yellow_circuit
            .update_system_actuator_volumes(self.right_aileron.actuator(
                AileronActuatorPosition::Outward,
                AileronPanelPosition::Middle,
            ));

        // This one is EHA, TODO check if it's connected to green or yellow for filling
        self.yellow_circuit
            .update_system_actuator_volumes(self.right_aileron.actuator(
                AileronActuatorPosition::Inward,
                AileronPanelPosition::Inward,
            ));

        self.yellow_circuit
            .update_system_actuator_volumes(&mut self.braking_circuit_altn);

        self.yellow_circuit
            .update_system_actuator_volumes(self.flap_system.right_motor());

        self.yellow_circuit
            .update_system_actuator_volumes(&mut self.nose_steering);

        self.yellow_circuit
            .update_system_actuator_volumes(self.right_elevator.actuator(
                ElevatorActuatorPosition::Outward,
                ElevatorPanelPosition::Outward,
            ));

        // This one is EHA, TODO check if it's connected to green or yellow for filling
        self.yellow_circuit
            .update_system_actuator_volumes(self.right_elevator.actuator(
                ElevatorActuatorPosition::Inward,
                ElevatorPanelPosition::Outward,
            ));

        self.yellow_circuit
            .update_system_actuator_volumes(self.right_elevator.actuator(
                ElevatorActuatorPosition::Outward,
                ElevatorPanelPosition::Inward,
            ));

        // This one is EHA, TODO check if it's connected to green or yellow for filling
        self.yellow_circuit
            .update_system_actuator_volumes(self.right_elevator.actuator(
                ElevatorActuatorPosition::Inward,
                ElevatorPanelPosition::Inward,
            ));

        self.yellow_circuit.update_system_actuator_volumes(
            self.rudder
                .actuator(RudderActuatorPosition::Upper, RudderPanelPosition::Upper),
        );
        self.yellow_circuit.update_system_actuator_volumes(
            self.rudder
                .actuator(RudderActuatorPosition::Lower, RudderPanelPosition::Lower),
        );

        self.yellow_circuit
            .update_system_actuator_volumes(self.left_spoilers.actuator(0));
        self.yellow_circuit
            .update_system_actuator_volumes(self.left_spoilers.actuator(2));
        self.yellow_circuit
            .update_system_actuator_volumes(self.left_spoilers.actuator(4));
        self.yellow_circuit
            .update_system_actuator_volumes(self.left_spoilers.actuator(6));

        self.yellow_circuit
            .update_system_actuator_volumes(self.right_spoilers.actuator(0));
        self.yellow_circuit
            .update_system_actuator_volumes(self.right_spoilers.actuator(2));
        self.yellow_circuit
            .update_system_actuator_volumes(self.right_spoilers.actuator(4));
        self.yellow_circuit
            .update_system_actuator_volumes(self.right_spoilers.actuator(6));

        self.yellow_circuit
            .update_system_actuator_volumes(self.ths.right_motor());
    }

    // All the core hydraulics updates that needs to be done at the slowest fixed step rate
    fn update_core_hydraulics(
        &mut self,
        context: &UpdateContext,
        engines: [&impl Engine; 4],
        overhead_panel: &A380HydraulicOverheadPanel,
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        lgciu1: &impl LgciuInterface,
        lgciu2: &impl LgciuInterface,
        reservoir_pneumatics: &impl ReservoirAirPressure,
    ) {
        // First update what is currently consumed and given back by each actuator
        // Todo: might have to split the actuator volumes by expected number of loops
        self.update_actuators_volume();

        self.engine_driven_pump_1a_controller.update(
            overhead_panel,
            engine_fire_push_buttons,
            engines,
            &self.green_circuit,
            lgciu1,
            self.green_circuit.reservoir(),
        );

        self.engine_driven_pump_1a.update(
            context,
            self.green_circuit
                .pump_section(A380EngineDrivenPumpId::Edp1a.into_pump_section_index()),
            self.green_circuit.reservoir(),
            engines[0].hydraulic_pump_output_speed(),
            &self.engine_driven_pump_1a_controller,
        );

        self.engine_driven_pump_2a_controller.update(
            overhead_panel,
            engine_fire_push_buttons,
            engines,
            &self.green_circuit,
            lgciu2,
            self.green_circuit.reservoir(),
        );

        self.engine_driven_pump_2a.update(
            context,
            self.green_circuit
                .pump_section(A380EngineDrivenPumpId::Edp2a.into_pump_section_index()),
            self.green_circuit.reservoir(),
            engines[1].hydraulic_pump_output_speed(),
            &self.engine_driven_pump_2a_controller,
        );

        self.engine_driven_pump_3a_controller.update(
            overhead_panel,
            engine_fire_push_buttons,
            engines,
            &self.yellow_circuit,
            lgciu1,
            self.yellow_circuit.reservoir(),
        );

        self.engine_driven_pump_3a.update(
            context,
            self.yellow_circuit
                .pump_section(A380EngineDrivenPumpId::Edp3a.into_pump_section_index()),
            self.yellow_circuit.reservoir(),
            engines[2].hydraulic_pump_output_speed(),
            &self.engine_driven_pump_3a_controller,
        );

        self.engine_driven_pump_4a_controller.update(
            overhead_panel,
            engine_fire_push_buttons,
            engines,
            &self.yellow_circuit,
            lgciu2,
            self.yellow_circuit.reservoir(),
        );

        self.engine_driven_pump_4a.update(
            context,
            self.yellow_circuit
                .pump_section(A380EngineDrivenPumpId::Edp4a.into_pump_section_index()),
            self.yellow_circuit.reservoir(),
            engines[3].hydraulic_pump_output_speed(),
            &self.engine_driven_pump_4a_controller,
        );

        self.engine_driven_pump_1b_controller.update(
            overhead_panel,
            engine_fire_push_buttons,
            engines,
            &self.green_circuit,
            lgciu1,
            self.green_circuit.reservoir(),
        );

        self.engine_driven_pump_1b.update(
            context,
            self.green_circuit
                .pump_section(A380EngineDrivenPumpId::Edp1b.into_pump_section_index()),
            self.green_circuit.reservoir(),
            engines[0].hydraulic_pump_output_speed(),
            &self.engine_driven_pump_1b_controller,
        );

        self.engine_driven_pump_2b_controller.update(
            overhead_panel,
            engine_fire_push_buttons,
            engines,
            &self.green_circuit,
            lgciu2,
            self.green_circuit.reservoir(),
        );

        self.engine_driven_pump_2b.update(
            context,
            self.green_circuit
                .pump_section(A380EngineDrivenPumpId::Edp2b.into_pump_section_index()),
            self.green_circuit.reservoir(),
            engines[1].hydraulic_pump_output_speed(),
            &self.engine_driven_pump_2b_controller,
        );

        self.engine_driven_pump_3b_controller.update(
            overhead_panel,
            engine_fire_push_buttons,
            engines,
            &self.yellow_circuit,
            lgciu1,
            self.yellow_circuit.reservoir(),
        );

        self.engine_driven_pump_3b.update(
            context,
            self.yellow_circuit
                .pump_section(A380EngineDrivenPumpId::Edp3b.into_pump_section_index()),
            self.yellow_circuit.reservoir(),
            engines[2].hydraulic_pump_output_speed(),
            &self.engine_driven_pump_3b_controller,
        );

        self.engine_driven_pump_4b_controller.update(
            overhead_panel,
            engine_fire_push_buttons,
            engines,
            &self.yellow_circuit,
            lgciu2,
            self.yellow_circuit.reservoir(),
        );

        self.engine_driven_pump_4b.update(
            context,
            self.yellow_circuit
                .pump_section(A380EngineDrivenPumpId::Edp4b.into_pump_section_index()),
            self.yellow_circuit.reservoir(),
            engines[3].hydraulic_pump_output_speed(),
            &self.engine_driven_pump_4b_controller,
        );

        self.green_electric_pump_a_controller.update(
            overhead_panel,
            &self.green_circuit,
            self.green_circuit.reservoir(),
            engines,
            &self.epump_auto_logic,
        );

        self.green_electric_pump_a.update(
            context,
            self.green_circuit
                .pump_section(A380ElectricPumpId::GreenA.into_pump_section_index()),
            self.green_circuit.reservoir(),
            &self.green_electric_pump_a_controller,
        );
        self.green_electric_pump_b_controller.update(
            overhead_panel,
            &self.green_circuit,
            self.green_circuit.reservoir(),
            engines,
            &self.epump_auto_logic,
        );
        self.green_electric_pump_b.update(
            context,
            self.green_circuit
                .pump_section(A380ElectricPumpId::GreenB.into_pump_section_index()),
            self.green_circuit.reservoir(),
            &self.green_electric_pump_b_controller,
        );

        self.yellow_electric_pump_a_controller.update(
            overhead_panel,
            &self.yellow_circuit,
            self.yellow_circuit.reservoir(),
            engines,
            &self.epump_auto_logic,
        );
        self.yellow_electric_pump_a.update(
            context,
            self.yellow_circuit
                .pump_section(A380ElectricPumpId::YellowA.into_pump_section_index()),
            self.yellow_circuit.reservoir(),
            &self.yellow_electric_pump_a_controller,
        );

        self.yellow_electric_pump_b_controller.update(
            overhead_panel,
            &self.yellow_circuit,
            self.yellow_circuit.reservoir(),
            engines,
            &self.epump_auto_logic,
        );
        self.yellow_electric_pump_b.update(
            context,
            self.yellow_circuit
                .pump_section(A380ElectricPumpId::YellowB.into_pump_section_index()),
            self.yellow_circuit.reservoir(),
            &self.yellow_electric_pump_b_controller,
        );

        self.green_electric_aux_pump_controller
            .update(&self.epump_auto_logic);
        self.green_auxiliary_pump.update(
            context,
            self.green_circuit.auxiliary_section(),
            self.green_circuit.reservoir(),
            &self.green_electric_aux_pump_controller,
        );

        self.green_circuit_controller.update(
            context,
            engine_fire_push_buttons,
            [
                &self.green_electric_pump_a_controller,
                &self.green_electric_pump_b_controller,
            ],
        );

        self.green_circuit.update(
            context,
            &mut [
                &mut self.engine_driven_pump_1a,
                &mut self.engine_driven_pump_1b,
                &mut self.engine_driven_pump_2a,
                &mut self.engine_driven_pump_2b,
                &mut self.green_electric_pump_a,
                &mut self.green_electric_pump_b,
            ],
            None::<&mut ElectricPump>,
            Some(&mut self.green_auxiliary_pump),
            None,
            &self.green_circuit_controller,
            reservoir_pneumatics.green_reservoir_pressure(),
        );

        self.yellow_circuit_controller.update(
            context,
            engine_fire_push_buttons,
            [
                &self.yellow_electric_pump_a_controller,
                &self.yellow_electric_pump_b_controller,
            ],
        );
        self.yellow_circuit.update(
            context,
            &mut [
                &mut self.engine_driven_pump_3a,
                &mut self.engine_driven_pump_3b,
                &mut self.engine_driven_pump_4a,
                &mut self.engine_driven_pump_4b,
                &mut self.yellow_electric_pump_a,
                &mut self.yellow_electric_pump_b,
            ],
            None::<&mut ElectricPump>,
            None::<&mut ElectricPump>,
            None,
            &self.yellow_circuit_controller,
            reservoir_pneumatics.yellow_reservoir_pressure(),
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

    pub fn gear_system(&self) -> &impl GearSystemSensors {
        &self.gear_system
    }
}
impl SimulationElement for A380Hydraulic {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.engine_driven_pump_1a.accept(visitor);
        self.engine_driven_pump_1a_controller.accept(visitor);

        self.engine_driven_pump_2a.accept(visitor);
        self.engine_driven_pump_2a_controller.accept(visitor);

        self.engine_driven_pump_3a.accept(visitor);
        self.engine_driven_pump_3a_controller.accept(visitor);

        self.engine_driven_pump_4a.accept(visitor);
        self.engine_driven_pump_4a_controller.accept(visitor);

        self.engine_driven_pump_1b.accept(visitor);
        self.engine_driven_pump_1b_controller.accept(visitor);

        self.engine_driven_pump_2b.accept(visitor);
        self.engine_driven_pump_2b_controller.accept(visitor);

        self.engine_driven_pump_3b.accept(visitor);
        self.engine_driven_pump_3b_controller.accept(visitor);

        self.engine_driven_pump_4b.accept(visitor);
        self.engine_driven_pump_4b_controller.accept(visitor);

        self.yellow_electric_pump_a.accept(visitor);
        self.yellow_electric_pump_a_controller.accept(visitor);

        self.yellow_electric_pump_b.accept(visitor);
        self.yellow_electric_pump_b_controller.accept(visitor);

        self.green_electric_pump_a.accept(visitor);
        self.green_electric_pump_a_controller.accept(visitor);

        self.green_electric_pump_b.accept(visitor);
        self.green_electric_pump_b_controller.accept(visitor);

        self.epump_auto_logic.accept(visitor);

        self.forward_cargo_door_controller.accept(visitor);
        self.forward_cargo_door.accept(visitor);

        self.aft_cargo_door_controller.accept(visitor);
        self.aft_cargo_door.accept(visitor);

        self.pushback_tug.accept(visitor);

        self.green_circuit.accept(visitor);
        self.yellow_circuit.accept(visitor);

        self.brake_steer_computer.accept(visitor);

        self.braking_circuit_norm.accept(visitor);
        self.braking_circuit_altn.accept(visitor);
        self.braking_force.accept(visitor);

        self.nose_steering.accept(visitor);
        self.slats_flaps_complex.accept(visitor);
        self.flap_system.accept(visitor);
        self.slat_system.accept(visitor);

        self.elevator_system_controller.accept(visitor);
        self.aileron_system_controller.accept(visitor);
        self.rudder_system_controller.accept(visitor);

        self.left_aileron.accept(visitor);
        self.right_aileron.accept(visitor);
        self.left_elevator.accept(visitor);
        self.right_elevator.accept(visitor);
        self.rudder.accept(visitor);

        self.left_spoilers.accept(visitor);
        self.right_spoilers.accept(visitor);

        self.gear_system_gravity_extension_controller
            .accept(visitor);
        self.gear_system.accept(visitor);

        self.ths_system_controller.accept(visitor);
        self.ths.accept(visitor);

        self.tilting_gears.accept(visitor);

        visitor.visit(self);
    }
}

struct A380GearHydraulicController {
    safety_valve_should_open: bool,
    cutoff_valve_should_open: bool,
    vent_valves_should_open: bool,
    doors_uplock_mechanical_release: bool,
    gears_uplock_mechanical_release: bool,
}
impl A380GearHydraulicController {
    fn new() -> Self {
        Self {
            safety_valve_should_open: true,
            cutoff_valve_should_open: true,
            vent_valves_should_open: false,
            doors_uplock_mechanical_release: false,
            gears_uplock_mechanical_release: false,
        }
    }

    fn update(
        &mut self,
        adirs: &impl AdirsDiscreteOutputs,
        lgciu1: &(impl LgciuWeightOnWheels + LandingGearHandle),
        lgciu2: &impl LgciuWeightOnWheels,
        gear_gravity_extension: &impl GearGravityExtension,
    ) {
        self.update_safety_valve(adirs, lgciu1, lgciu2);

        self.update_safety_and_vent_valve(gear_gravity_extension);

        self.update_uplocks(gear_gravity_extension);
    }

    fn update_uplocks(&mut self, gear_gravity_extension: &impl GearGravityExtension) {
        self.doors_uplock_mechanical_release =
            gear_gravity_extension.extension_handle_number_of_turns() >= 2;
        self.gears_uplock_mechanical_release =
            gear_gravity_extension.extension_handle_number_of_turns() >= 3;
    }

    fn update_safety_and_vent_valve(&mut self, gear_gravity_extension: &impl GearGravityExtension) {
        let one_or_more_handle_turns =
            gear_gravity_extension.extension_handle_number_of_turns() >= 1;

        self.cutoff_valve_should_open = !one_or_more_handle_turns;

        self.vent_valves_should_open = one_or_more_handle_turns;
    }

    fn update_safety_valve(
        &mut self,
        adirs: &impl AdirsDiscreteOutputs,
        lgciu1: &(impl LgciuWeightOnWheels + LandingGearHandle),
        lgciu2: &impl LgciuWeightOnWheels,
    ) {
        let speed_condition =
            !adirs.low_speed_warning_4_260kts(1) || !adirs.low_speed_warning_4_260kts(3);

        let on_ground_condition = lgciu1.left_and_right_gear_compressed(true)
            || lgciu2.left_and_right_gear_compressed(true);

        let self_maintained_gear_lever_condition =
            self.safety_valve_should_open || lgciu1.gear_handle_is_down();

        self.safety_valve_should_open =
            (speed_condition || on_ground_condition) && self_maintained_gear_lever_condition;
    }
}
impl GearSystemController for A380GearHydraulicController {
    fn safety_valve_should_open(&self) -> bool {
        self.safety_valve_should_open
    }

    fn shut_off_valve_should_open(&self) -> bool {
        self.cutoff_valve_should_open
    }

    fn vent_valves_should_open(&self) -> bool {
        self.vent_valves_should_open
    }

    fn doors_uplocks_should_mechanically_unlock(&self) -> bool {
        self.doors_uplock_mechanical_release
    }

    fn gears_uplocks_should_mechanically_unlock(&self) -> bool {
        self.gears_uplock_mechanical_release
    }
}

struct A380HydraulicCircuitController {
    circuit_id: HydraulicColor,
    should_open_fire_shutoff_valve: [bool; 2],
    should_open_leak_measurement_valve: bool,
    cargo_door_in_use: DelayedFalseLogicGate,
    routing_epump_sections_to_aux: DelayedTrueLogicGate,
}
impl A380HydraulicCircuitController {
    const DELAY_TO_REOPEN_LEAK_VALVE_AFTER_CARGO_DOOR_USE: Duration = Duration::from_secs(15);
    const DELAY_TO_CLOSE_AUX_SELECTOR_ON_CARGO_DOOR_USE: Duration = Duration::from_millis(450);

    fn new(circuit_id: HydraulicColor) -> Self {
        Self {
            circuit_id,
            should_open_fire_shutoff_valve: [true, true],
            should_open_leak_measurement_valve: true,
            cargo_door_in_use: DelayedFalseLogicGate::new(
                Self::DELAY_TO_REOPEN_LEAK_VALVE_AFTER_CARGO_DOOR_USE,
            ),
            routing_epump_sections_to_aux: DelayedTrueLogicGate::new(
                Self::DELAY_TO_CLOSE_AUX_SELECTOR_ON_CARGO_DOOR_USE,
            ),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        epump_controllers: [&A380ElectricPumpController; 2],
    ) {
        // No cargo doors on yellow side
        if self.circuit_id == HydraulicColor::Green {
            self.cargo_door_in_use.update(
                context,
                epump_controllers[0].should_pressurise_for_cargo_door_operation()
                    || epump_controllers[1].should_pressurise_for_cargo_door_operation(),
            );

            self.routing_epump_sections_to_aux
                .update(context, self.cargo_door_in_use.output());
        }

        match self.circuit_id {
            HydraulicColor::Green => {
                self.should_open_fire_shutoff_valve = [
                    !engine_fire_push_buttons.is_released(1),
                    !engine_fire_push_buttons.is_released(2),
                ];
            }
            HydraulicColor::Yellow => {
                self.should_open_fire_shutoff_valve = [
                    !engine_fire_push_buttons.is_released(3),
                    !engine_fire_push_buttons.is_released(4),
                ];
            }
            HydraulicColor::Blue => panic!("NO BLUE CIRCUIT IN A380"),
        };

        self.update_leak_measurement_valve(context);
    }

    fn update_leak_measurement_valve(&mut self, context: &UpdateContext) {
        let measurement_valve_open_demand_raw = match &mut self.circuit_id {
            HydraulicColor::Green => {
                true
                // TODO
                // overhead_panel.green_leak_measurement_valve_is_on()
                //     && !self.cargo_door_in_use.output()
            }
            HydraulicColor::Yellow => {
                // TODO
                // overhead_panel.yellow_leak_measurement_valve_is_on(),
                true
            }
            HydraulicColor::Blue => false,
        };

        self.should_open_leak_measurement_valve = measurement_valve_open_demand_raw
            || self.plane_state_disables_leak_valve_closing(context);
    }

    fn plane_state_disables_leak_valve_closing(&self, context: &UpdateContext) -> bool {
        context.indicated_airspeed() >= Velocity::new::<knot>(100.)
    }
}
impl HydraulicCircuitController for A380HydraulicCircuitController {
    fn should_open_fire_shutoff_valve(&self, fire_valve_index: usize) -> bool {
        // There is one fire valve per pump section by hydraulic library design, so that's 2 per engine
        // As A380 has only one fire valve per engine, we drive both engine fire valves at once
        if fire_valve_index == 1 || fire_valve_index == 2 {
            self.should_open_fire_shutoff_valve[0]
        } else if fire_valve_index == 3 || fire_valve_index == 4 {
            self.should_open_fire_shutoff_valve[1]
        } else {
            true
        }
    }

    fn should_open_leak_measurement_valve(&self) -> bool {
        self.should_open_leak_measurement_valve
    }

    fn should_route_pump_to_auxiliary(&self, pump_index: usize) -> bool {
        // No auxiliary selection valve in yellow circuit
        if self.circuit_id == HydraulicColor::Yellow {
            return false;
        }

        // If it's an engine section (<4) we can't route to aux. Else it's a pump elec section (>=4) so
        //   we can route it if required to by the boolean
        pump_index >= 4 && self.routing_epump_sections_to_aux.output()
    }
}

use std::fmt::Display;
#[derive(Clone, Copy, PartialEq, Debug)]
enum A380EngineDrivenPumpId {
    Edp1a,
    Edp1b,
    Edp2a,
    Edp2b,
    Edp3a,
    Edp3b,
    Edp4a,
    Edp4b,
}
impl A380EngineDrivenPumpId {
    fn into_engine_num(self) -> usize {
        match self {
            A380EngineDrivenPumpId::Edp1a => 1,
            A380EngineDrivenPumpId::Edp1b => 1,
            A380EngineDrivenPumpId::Edp2a => 2,
            A380EngineDrivenPumpId::Edp2b => 2,
            A380EngineDrivenPumpId::Edp3a => 3,
            A380EngineDrivenPumpId::Edp3b => 3,
            A380EngineDrivenPumpId::Edp4a => 4,
            A380EngineDrivenPumpId::Edp4b => 4,
        }
    }

    fn into_engine_index(self) -> usize {
        self.into_engine_num() - 1
    }

    fn into_pump_section_index(self) -> usize {
        match self {
            A380EngineDrivenPumpId::Edp1a => 0,
            A380EngineDrivenPumpId::Edp1b => 1,
            A380EngineDrivenPumpId::Edp2a => 2,
            A380EngineDrivenPumpId::Edp2b => 3,
            A380EngineDrivenPumpId::Edp3a => 0,
            A380EngineDrivenPumpId::Edp3b => 1,
            A380EngineDrivenPumpId::Edp4a => 2,
            A380EngineDrivenPumpId::Edp4b => 3,
        }
    }
}
impl Display for A380EngineDrivenPumpId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            A380EngineDrivenPumpId::Edp1a => write!(f, "1A"),
            A380EngineDrivenPumpId::Edp1b => write!(f, "1B"),
            A380EngineDrivenPumpId::Edp2a => write!(f, "2A"),
            A380EngineDrivenPumpId::Edp2b => write!(f, "2B"),
            A380EngineDrivenPumpId::Edp3a => write!(f, "3A"),
            A380EngineDrivenPumpId::Edp3b => write!(f, "3B"),
            A380EngineDrivenPumpId::Edp4a => write!(f, "4A"),
            A380EngineDrivenPumpId::Edp4b => write!(f, "4B"),
        }
    }
}

#[derive(Clone, Copy, PartialEq)]
enum A380ElectricPumpId {
    GreenA,
    GreenB,
    YellowA,
    YellowB,
    GreenAuxiliary,
}
impl A380ElectricPumpId {
    fn into_pump_section_index(self) -> usize {
        match self {
            A380ElectricPumpId::GreenA => 4,
            A380ElectricPumpId::YellowA => 4,
            A380ElectricPumpId::GreenB => 5,
            A380ElectricPumpId::YellowB => 5,
            A380ElectricPumpId::GreenAuxiliary => 0,
        }
    }
}
impl Display for A380ElectricPumpId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            A380ElectricPumpId::GreenA => write!(f, "GA"),
            A380ElectricPumpId::YellowA => write!(f, "YA"),
            A380ElectricPumpId::GreenB => write!(f, "GB"),
            A380ElectricPumpId::YellowB => write!(f, "YB"),
            A380ElectricPumpId::GreenAuxiliary => write!(f, "Gaux"),
        }
    }
}

struct A380EngineDrivenPumpController {
    low_press_id: VariableIdentifier,
    disconnected_id: VariableIdentifier,

    is_powered: bool,
    powered_by: Vec<ElectricalBusType>,
    pump_id: A380EngineDrivenPumpId,
    should_pressurise: bool,
    has_pressure_low_fault: bool,
    has_air_pressure_low_fault: bool,
    has_low_level_fault: bool,
    is_pressure_low: bool,
    has_overheat_fault: bool,

    are_pumps_commanded_disconnected: bool,

    disconnection_mechanism: EnginePumpDisconnectionClutch,
}
impl A380EngineDrivenPumpController {
    fn new(
        context: &mut InitContext,
        pump_id: A380EngineDrivenPumpId,
        powered_by: Vec<ElectricalBusType>,
    ) -> Self {
        let engine_num = pump_id.into_engine_num();
        Self {
            low_press_id: context.get_identifier(format!("HYD_EDPUMP_{}_LOW_PRESS", pump_id)),
            disconnected_id: context.get_identifier(format!("HYD_ENG_{}AB_PUMP_DISC", engine_num)),

            is_powered: false,
            powered_by,
            pump_id,
            should_pressurise: true,

            has_pressure_low_fault: false,
            has_air_pressure_low_fault: false,
            has_low_level_fault: false,

            is_pressure_low: true,
            has_overheat_fault: false,

            are_pumps_commanded_disconnected: false,

            disconnection_mechanism: EnginePumpDisconnectionClutch::new(match engine_num {
                1 | 4 => ElectricalBusType::DirectCurrent(2),
                2 | 3 => ElectricalBusType::DirectCurrent(1),
                _ => panic!("Only 4 engines on A380"),
            }),
        }
    }

    fn update_low_pressure(
        &mut self,
        engines: [&impl Engine; 4],
        hydraulic_circuit: &impl HydraulicPressureSensors,
        lgciu: &impl LgciuInterface,
    ) {
        self.is_pressure_low = self.should_pressurise()
            && !hydraulic_circuit
                .pump_section_switch_pressurised(self.pump_id.into_pump_section_index());

        // TODO Fault inhibit copied from A320
        self.has_pressure_low_fault = self.is_pressure_low
            && (!(engines[self.pump_id.into_engine_index()].oil_pressure_is_low()
                && lgciu.right_gear_compressed(false)
                && lgciu.left_gear_compressed(false)));
    }

    fn update_low_air_pressure(
        &mut self,
        reservoir: &Reservoir,
        overhead_panel: &A380HydraulicOverheadPanel,
    ) {
        self.has_air_pressure_low_fault =
            reservoir.is_low_air_pressure() && overhead_panel.edp_push_button_is_auto(self.pump_id);
    }

    fn update_low_level(
        &mut self,
        reservoir: &Reservoir,
        overhead_panel: &A380HydraulicOverheadPanel,
    ) {
        self.has_low_level_fault =
            reservoir.is_low_level() && overhead_panel.edp_push_button_is_auto(self.pump_id);
    }

    fn update(
        &mut self,
        overhead_panel: &A380HydraulicOverheadPanel,
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        engines: [&impl Engine; 4],
        hydraulic_circuit: &impl HydraulicPressureSensors,
        lgciu: &impl LgciuInterface,
        reservoir: &Reservoir,
    ) {
        let mut should_pressurise_if_powered = false;
        if overhead_panel.edp_push_button_is_auto(self.pump_id)
            && !engine_fire_push_buttons.is_released(self.pump_id.into_engine_num())
        {
            should_pressurise_if_powered = true;
        } else if overhead_panel.edp_push_button_is_off(self.pump_id)
            || engine_fire_push_buttons.is_released(self.pump_id.into_engine_num())
        {
            should_pressurise_if_powered = false;
        }

        self.are_pumps_commanded_disconnected = self.are_pumps_commanded_disconnected
            || overhead_panel.engines_edp_disconnected(self.pump_id.into_engine_num());

        self.disconnection_mechanism
            .update(overhead_panel.engines_edp_disconnected(self.pump_id.into_engine_num()));

        // Inverted logic, no power means solenoid valve always leave pump in pressurise mode
        // TODO disconnected pump is just depressurising it as a placeholder for disc mechanism
        self.should_pressurise = (!self.is_powered || should_pressurise_if_powered)
            && !self.are_pumps_commanded_disconnected;

        self.update_low_pressure(engines, hydraulic_circuit, lgciu);

        self.update_low_air_pressure(reservoir, overhead_panel);

        self.update_low_level(reservoir, overhead_panel);

        self.has_overheat_fault = reservoir.is_overheating();
    }

    fn has_any_fault(&self) -> bool {
        self.has_pressure_low_fault || self.has_air_pressure_low_fault || self.has_low_level_fault
    }

    fn has_disc_fault(&self) -> bool {
        // Fault cleared when disconnect is selected according to fcom
        (self.has_low_level_fault || self.has_overheat_fault)
            && !self.are_pumps_commanded_disconnected
    }
}
impl PumpController for A380EngineDrivenPumpController {
    fn should_pressurise(&self) -> bool {
        self.should_pressurise
    }

    fn is_input_shaft_connected(&self) -> bool {
        self.disconnection_mechanism.is_connected()
    }
}
impl SimulationElement for A380EngineDrivenPumpController {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.disconnection_mechanism.accept(visitor);
        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.low_press_id, self.is_pressure_low);
        writer.write(&self.disconnected_id, self.are_pumps_commanded_disconnected);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.any_is_powered(&self.powered_by);
    }
}

struct A380ElectricPumpAutoLogic {
    green_pump_a_selected: bool,
    yellow_pump_a_selected: bool,

    is_required_for_cargo_door_operation: DelayedFalseLogicGate,
    cargo_door_in_operation_previous: bool,

    is_required_for_body_steering_operation: DelayedFalseLogicGate,
    body_steering_in_operation_previous: bool,

    green_a_pump_powered_by: ElectricalBusType,
    green_b_pump_powered_by: ElectricalBusType,
    yellow_a_pump_powered_by: ElectricalBusType,
    yellow_b_pump_powered_by: ElectricalBusType,

    green_a_pump_bus_powered: bool,
    green_b_pump_bus_powered: bool,
    yellow_a_pump_bus_powered: bool,
    yellow_b_pump_bus_powered: bool,
}
impl A380ElectricPumpAutoLogic {
    const DURATION_OF_PUMP_ACTIVATION_AFTER_CARGO_DOOR_OPERATION: Duration =
        Duration::from_secs(20);

    const DURATION_OF_PUMP_ACTIVATION_AFTER_BODY_STEERING_OPERATION: Duration =
        Duration::from_secs(5);
    fn new(
        green_a_pump_powered_by: ElectricalBusType,
        green_b_pump_powered_by: ElectricalBusType,
        yellow_a_pump_powered_by: ElectricalBusType,
        yellow_b_pump_powered_by: ElectricalBusType,
    ) -> Self {
        Self {
            green_pump_a_selected: random_from_range(0., 1.) < 0.5,
            yellow_pump_a_selected: random_from_range(0., 1.) < 0.5,

            is_required_for_cargo_door_operation: DelayedFalseLogicGate::new(
                Self::DURATION_OF_PUMP_ACTIVATION_AFTER_CARGO_DOOR_OPERATION,
            ),
            cargo_door_in_operation_previous: false,

            is_required_for_body_steering_operation: DelayedFalseLogicGate::new(
                Self::DURATION_OF_PUMP_ACTIVATION_AFTER_BODY_STEERING_OPERATION,
            ),
            body_steering_in_operation_previous: false,

            green_a_pump_powered_by,
            green_b_pump_powered_by,
            yellow_a_pump_powered_by,
            yellow_b_pump_powered_by,

            green_a_pump_bus_powered: false,
            green_b_pump_bus_powered: false,
            yellow_a_pump_bus_powered: false,
            yellow_b_pump_bus_powered: false,
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        forward_cargo_door_controller: &HydraulicDoorController,
        aft_cargo_door_controller: &HydraulicDoorController,
        pushback_tug: &PushbackTug,
        overhead: &A380HydraulicOverheadPanel,
    ) {
        self.update_auto_run_logic(
            context,
            forward_cargo_door_controller,
            aft_cargo_door_controller,
            pushback_tug,
        );

        self.select_pump_in_use(overhead);
    }

    fn update_auto_run_logic(
        &mut self,
        context: &UpdateContext,
        forward_cargo_door_controller: &HydraulicDoorController,
        aft_cargo_door_controller: &HydraulicDoorController,
        pushback_tug: &PushbackTug,
    ) {
        self.cargo_door_in_operation_previous = self.is_required_for_cargo_door_operation.output();

        self.is_required_for_cargo_door_operation.update(
            context,
            forward_cargo_door_controller.should_pressurise_hydraulics()
                || aft_cargo_door_controller.should_pressurise_hydraulics(),
        );

        self.body_steering_in_operation_previous =
            self.is_required_for_body_steering_operation.output();

        self.is_required_for_body_steering_operation
            .update(context, pushback_tug.is_nose_wheel_steering_pin_inserted());
    }

    fn select_pump_in_use(&mut self, overhead: &A380HydraulicOverheadPanel) {
        let should_change_pump_for_cargo = !self.cargo_door_in_operation_previous
            && self.is_required_for_cargo_door_operation.output();
        let should_change_pump_for_body_steering = !self.body_steering_in_operation_previous
            && self.is_required_for_body_steering_operation.output();

        if should_change_pump_for_cargo
            && (self.green_pump_a_selected
                && !overhead.epump_button_off_is_off(A380ElectricPumpId::GreenB)
                || !self.green_pump_a_selected
                    && !overhead.epump_button_off_is_off(A380ElectricPumpId::GreenA))
        {
            self.green_pump_a_selected = !self.green_pump_a_selected
        }

        // If a pump selected but no AC to power it and B would have power : get back on B
        if self.green_pump_a_selected
            && !self.green_a_pump_bus_powered
            && self.green_b_pump_bus_powered
        {
            self.green_pump_a_selected = false;
        }
        if self.yellow_pump_a_selected
            && !self.yellow_a_pump_bus_powered
            && self.yellow_b_pump_bus_powered
        {
            self.yellow_pump_a_selected = false;
        }

        if should_change_pump_for_body_steering
            && (self.yellow_pump_a_selected
                && !overhead.epump_button_off_is_off(A380ElectricPumpId::YellowB)
                || !self.yellow_pump_a_selected
                    && !overhead.epump_button_off_is_off(A380ElectricPumpId::YellowA))
        {
            self.yellow_pump_a_selected = !self.yellow_pump_a_selected
        }
    }

    fn should_auto_run_pump(&self, pump_id: A380ElectricPumpId) -> bool {
        let green_operation_required = self.is_required_for_cargo_door_operation.output();
        let yellow_operation_required = self.is_required_for_body_steering_operation.output();
        match pump_id {
            A380ElectricPumpId::GreenA => {
                self.green_a_pump_bus_powered
                    && green_operation_required
                    && self.green_pump_a_selected
            }
            A380ElectricPumpId::GreenB => {
                self.green_b_pump_bus_powered
                    && green_operation_required
                    && !self.green_pump_a_selected
            }
            A380ElectricPumpId::YellowA => {
                self.yellow_a_pump_bus_powered
                    && yellow_operation_required
                    && self.yellow_pump_a_selected
            }
            A380ElectricPumpId::YellowB => {
                self.yellow_b_pump_bus_powered
                    && yellow_operation_required
                    && !self.yellow_pump_a_selected
            }
            A380ElectricPumpId::GreenAuxiliary => {
                // Only allow AUX if no AC. This is actually a manual pump using external electric/pneumatic wrench
                green_operation_required
                    && !self.green_a_pump_bus_powered
                    && !self.green_b_pump_bus_powered
                    && !self.yellow_a_pump_bus_powered
                    && !self.yellow_b_pump_bus_powered
            }
        }
    }
}
impl SimulationElement for A380ElectricPumpAutoLogic {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.green_a_pump_bus_powered = buses.is_powered(self.green_a_pump_powered_by);
        self.green_b_pump_bus_powered = buses.is_powered(self.green_b_pump_powered_by);
        self.yellow_a_pump_bus_powered = buses.is_powered(self.yellow_a_pump_powered_by);
        self.yellow_b_pump_bus_powered = buses.is_powered(self.yellow_b_pump_powered_by);
    }
}

struct A380ElectricPumpController {
    low_press_id: VariableIdentifier,

    pump_id: A380ElectricPumpId,

    is_powered: bool,
    powered_by: ElectricalBusType,

    should_pressurise: bool,
    has_pressure_low_fault: bool,
    has_air_pressure_low_fault: bool,
    has_low_level_fault: bool,
    is_pressure_low: bool,
    should_pressurise_for_cargo_door_operation: bool,
}
impl A380ElectricPumpController {
    fn new(
        context: &mut InitContext,
        pump_id: A380ElectricPumpId,
        powered_by: ElectricalBusType,
    ) -> Self {
        Self {
            low_press_id: context.get_identifier(format!("HYD_{}_EPUMP_LOW_PRESS", pump_id)),

            pump_id,

            is_powered: false,
            powered_by,

            should_pressurise: false,

            has_pressure_low_fault: false,
            has_air_pressure_low_fault: false,
            has_low_level_fault: false,

            is_pressure_low: true,

            should_pressurise_for_cargo_door_operation: false,
        }
    }

    fn update(
        &mut self,
        overhead_panel: &A380HydraulicOverheadPanel,
        hydraulic_circuit: &impl HydraulicPressureSensors,
        reservoir: &Reservoir,
        engines: [&impl Engine; 4],
        auto_logic: &A380ElectricPumpAutoLogic,
    ) {
        self.should_pressurise_for_cargo_door_operation =
            auto_logic.should_auto_run_pump(self.pump_id);

        self.should_pressurise = (overhead_panel.epump_button_on_is_on(self.pump_id)
            || self.should_pressurise_for_cargo_door_operation)
            && !overhead_panel.epump_button_off_is_off(self.pump_id)
            && !self.is_any_engine_running(engines)
            && self.is_powered;

        self.update_low_pressure(hydraulic_circuit);

        self.update_low_air_pressure(reservoir, overhead_panel);

        self.update_low_level(reservoir, overhead_panel);
    }

    // Should be the feedback used to disable elec pumps running when engines are on
    // Place holder logic for now using oil press
    fn is_any_engine_running(&self, engines: [&impl Engine; 4]) -> bool {
        !(engines[0].oil_pressure_is_low()
            && engines[1].oil_pressure_is_low()
            && engines[2].oil_pressure_is_low()
            && engines[3].oil_pressure_is_low())
    }

    fn update_low_pressure(&mut self, hydraulic_circuit: &impl HydraulicPressureSensors) {
        self.is_pressure_low = self.should_pressurise()
            && !hydraulic_circuit
                .pump_section_switch_pressurised(self.pump_id.into_pump_section_index());

        self.has_pressure_low_fault = self.is_pressure_low;
    }

    fn update_low_air_pressure(
        &mut self,
        reservoir: &Reservoir,
        overhead_panel: &A380HydraulicOverheadPanel,
    ) {
        self.has_air_pressure_low_fault = reservoir.is_low_air_pressure()
            && !overhead_panel.epump_button_off_is_off(self.pump_id);
    }

    fn update_low_level(
        &mut self,
        reservoir: &Reservoir,
        overhead_panel: &A380HydraulicOverheadPanel,
    ) {
        self.has_low_level_fault =
            reservoir.is_low_level() && !overhead_panel.epump_button_off_is_off(self.pump_id);
    }

    fn has_any_fault(&self) -> bool {
        self.has_low_level_fault || self.has_air_pressure_low_fault || self.has_pressure_low_fault
    }

    fn should_pressurise_for_cargo_door_operation(&self) -> bool {
        self.should_pressurise_for_cargo_door_operation
    }
}
impl PumpController for A380ElectricPumpController {
    fn should_pressurise(&self) -> bool {
        self.should_pressurise
    }
}
impl SimulationElement for A380ElectricPumpController {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.low_press_id, self.is_pressure_low);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by);
    }
}

struct A380AuxiliaryPumpController {
    pump_id: A380ElectricPumpId,

    should_pressurise: bool,
}
impl A380AuxiliaryPumpController {
    fn new(pump_id: A380ElectricPumpId) -> Self {
        Self {
            pump_id,
            should_pressurise: false,
        }
    }

    fn update(&mut self, auto_logic: &A380ElectricPumpAutoLogic) {
        self.should_pressurise = auto_logic.should_auto_run_pump(self.pump_id)
    }
}
impl PumpController for A380AuxiliaryPumpController {
    fn should_pressurise(&self) -> bool {
        self.should_pressurise
    }
}

struct A380BrakeSystemOutputs {
    left_demand: Ratio,
    right_demand: Ratio,
    pressure_limit: Pressure,
}
impl A380BrakeSystemOutputs {
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
impl BrakeCircuitController for A380BrakeSystemOutputs {
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

struct A380HydraulicBrakeSteerComputerUnit {
    park_brake_lever_pos_id: VariableIdentifier,

    antiskid_brakes_active_id: VariableIdentifier,
    left_brake_pedal_input_id: VariableIdentifier,
    right_brake_pedal_input_id: VariableIdentifier,

    ground_speed_id: VariableIdentifier,

    rudder_pedal_input_id: VariableIdentifier,
    tiller_handle_input_id: VariableIdentifier,
    tiller_pedal_disconnect_id: VariableIdentifier,
    autopilot_nosewheel_demand_id: VariableIdentifier,

    autobrake_controller: A380AutobrakeController,
    parking_brake_demand: bool,

    left_brake_pilot_input: Ratio,
    right_brake_pilot_input: Ratio,

    norm_brake_outputs: A380BrakeSystemOutputs,
    alternate_brake_outputs: A380BrakeSystemOutputs,

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
impl A380HydraulicBrakeSteerComputerUnit {
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

            autobrake_controller: A380AutobrakeController::new(context),

            parking_brake_demand: true,
            left_brake_pilot_input: Ratio::new::<ratio>(0.0),
            right_brake_pilot_input: Ratio::new::<ratio>(0.0),
            norm_brake_outputs: A380BrakeSystemOutputs::new(),
            alternate_brake_outputs: A380BrakeSystemOutputs::new(),
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

    fn update_normal_braking_availability(&mut self, normal_braking_circuit_pressure: Pressure) {
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
        current_pressure: &impl SectionPressure,
        alternate_circuit: &BrakeCircuit,
        lgciu1: &impl LgciuInterface,
        lgciu2: &impl LgciuInterface,
        autobrake_panel: &AutobrakePanel,
        engine1: &impl Engine,
        engine2: &impl Engine,
    ) {
        self.update_steering_demands(lgciu1, engine1, engine2);

        self.update_normal_braking_availability(current_pressure.pressure());
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
            || lgciu1.gear_handle_is_down());

        self.should_disable_auto_brake_when_retracting
            .update(context, is_in_flight_gear_lever_up);

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
        lgciu1: &impl LgciuInterface,
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
impl SimulationElement for A380HydraulicBrakeSteerComputerUnit {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.autobrake_controller.accept(visitor);
        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.parking_brake_demand = reader.read(&self.park_brake_lever_pos_id);

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
impl SteeringController for A380HydraulicBrakeSteerComputerUnit {
    fn requested_position(&self) -> Angle {
        self.final_steering_position_request
    }
}

struct A380BrakingForce {
    brake_left_force_factor_id: VariableIdentifier,
    brake_right_force_factor_id: VariableIdentifier,
    trailing_edge_flaps_left_percent_id: VariableIdentifier,
    trailing_edge_flaps_right_percent_id: VariableIdentifier,

    enabled_chocks_id: VariableIdentifier,
    light_beacon_on_id: VariableIdentifier,

    left_braking_force: f64,
    right_braking_force: f64,

    flap_position: f64,

    is_chocks_enabled: bool,
    is_light_beacon_on: bool,
}
impl A380BrakingForce {
    const REFERENCE_PRESSURE_FOR_MAX_FORCE: f64 = 2538.;

    const FLAPS_BREAKPOINTS: [f64; 3] = [0., 50., 100.];
    const FLAPS_PENALTY_PERCENT: [f64; 3] = [5., 5., 0.];

    pub fn new(context: &mut InitContext) -> Self {
        A380BrakingForce {
            brake_left_force_factor_id: context
                .get_identifier("BRAKE LEFT FORCE FACTOR".to_owned()),
            brake_right_force_factor_id: context
                .get_identifier("BRAKE RIGHT FORCE FACTOR".to_owned()),
            trailing_edge_flaps_left_percent_id: context
                .get_identifier("LEFT_FLAPS_POSITION_PERCENT".to_owned()),
            trailing_edge_flaps_right_percent_id: context
                .get_identifier("RIGHT_FLAPS_POSITION_PERCENT".to_owned()),

            enabled_chocks_id: context.get_identifier("MODEL_WHEELCHOCKS_ENABLED".to_owned()),
            light_beacon_on_id: context.get_identifier("LIGHT BEACON".to_owned()),

            left_braking_force: 0.,
            right_braking_force: 0.,

            flap_position: 0.,

            is_chocks_enabled: false,
            is_light_beacon_on: false,
        }
    }

    pub fn update_forces(
        &mut self,
        context: &UpdateContext,
        norm_brakes: &BrakeCircuit,
        altn_brakes: &BrakeCircuit,
        engine1: &impl Engine,
        engine2: &impl Engine,
        pushback_tug: &PushbackTug,
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

        self.update_chocks_braking(context, engine1, engine2, pushback_tug);
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

    fn update_chocks_braking(
        &mut self,
        context: &UpdateContext,
        engine1: &impl Engine,
        engine2: &impl Engine,
        pushback_tug: &PushbackTug,
    ) {
        let chocks_on_wheels = context.is_on_ground()
            && engine1.corrected_n1().get::<percent>() < 3.5
            && engine2.corrected_n1().get::<percent>() < 3.5
            && !pushback_tug.is_nose_wheel_steering_pin_inserted()
            && !self.is_light_beacon_on;

        if self.is_chocks_enabled && chocks_on_wheels {
            self.left_braking_force = 1.;
            self.right_braking_force = 1.;
        }
    }
}

impl SimulationElement for A380BrakingForce {
    fn write(&self, writer: &mut SimulatorWriter) {
        // BRAKE XXXX FORCE FACTOR is the actual braking force we want the plane to generate in the simulator
        writer.write(&self.brake_left_force_factor_id, self.left_braking_force);
        writer.write(&self.brake_right_force_factor_id, self.right_braking_force);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        let left_flap: f64 = reader.read(&self.trailing_edge_flaps_left_percent_id);
        let right_flap: f64 = reader.read(&self.trailing_edge_flaps_right_percent_id);
        self.flap_position = (left_flap + right_flap) / 2.;

        self.is_chocks_enabled = reader.read(&self.enabled_chocks_id);
        self.is_light_beacon_on = reader.read(&self.light_beacon_on_id);
    }
}

/// Autobrake controller computes the state machine of the autobrake logic, and the deceleration target
/// that we expect for the plane
pub struct A380AutobrakeController {
    armed_mode_id: VariableIdentifier,
    armed_mode_id_set: VariableIdentifier,
    decel_light_id: VariableIdentifier,
    active_id: VariableIdentifier,
    ground_spoilers_out_sec1_id: VariableIdentifier,
    ground_spoilers_out_sec2_id: VariableIdentifier,
    ground_spoilers_out_sec3_id: VariableIdentifier,
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
impl A380AutobrakeController {
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

    fn new(context: &mut InitContext) -> A380AutobrakeController {
        A380AutobrakeController {
            armed_mode_id: context.get_identifier("AUTOBRAKES_ARMED_MODE".to_owned()),
            armed_mode_id_set: context.get_identifier("AUTOBRAKES_ARMED_MODE_SET".to_owned()),
            decel_light_id: context.get_identifier("AUTOBRAKES_DECEL_LIGHT".to_owned()),
            active_id: context.get_identifier("AUTOBRAKES_ACTIVE".to_owned()),
            ground_spoilers_out_sec1_id: context
                .get_identifier("SEC_1_GROUND_SPOILER_OUT".to_owned()),
            ground_spoilers_out_sec2_id: context
                .get_identifier("SEC_2_GROUND_SPOILER_OUT".to_owned()),
            ground_spoilers_out_sec3_id: context
                .get_identifier("SEC_3_GROUND_SPOILER_OUT".to_owned()),
            external_disarm_event_id: context.get_identifier("AUTOBRAKE_DISARM".to_owned()),

            deceleration_governor: AutobrakeDecelerationGovernor::new(),
            target: Acceleration::new::<meter_per_second_squared>(0.),
            mode: AutobrakeMode::NONE,
            arming_is_allowed_by_bcu: context.is_in_flight(),
            left_brake_pedal_input: Ratio::new::<percent>(0.),
            right_brake_pedal_input: Ratio::new::<percent>(0.),
            ground_spoilers_are_deployed: false,
            last_ground_spoilers_are_deployed: false,
            should_disarm_after_time_in_flight: DelayedPulseTrueLogicGate::new(
                Duration::from_secs_f64(Self::DURATION_OF_FLIGHT_TO_DISARM_AUTOBRAKE_SECS),
            )
            .starting_as(context.is_in_flight(), false),
            should_reject_max_mode_after_time_in_flight: DelayedTrueLogicGate::new(
                Duration::from_secs_f64(Self::DURATION_OF_FLIGHT_TO_DISARM_AUTOBRAKE_SECS),
            )
            .starting_as(context.is_in_flight()),
            external_disarm_event: false,
        }
    }

    fn spoilers_retracted_during_this_update(&self) -> bool {
        !self.ground_spoilers_are_deployed && self.last_ground_spoilers_are_deployed
    }

    fn brake_output(&self) -> Ratio {
        Ratio::new::<ratio>(self.deceleration_governor.output())
    }

    fn determine_mode(
        &mut self,
        context: &UpdateContext,
        autobrake_panel: &AutobrakePanel,
    ) -> AutobrakeMode {
        if self.should_disarm(context) {
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

    fn should_engage_deceleration_governor(&self, context: &UpdateContext) -> bool {
        self.is_armed() && self.ground_spoilers_are_deployed && !self.should_disarm(context)
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

    fn should_disarm(&self, context: &UpdateContext) -> bool {
        // when a simulation is started in flight, some values need to be ignored for a certain time to ensure
        // an unintended disarm is not happening
        (self.deceleration_governor.is_engaged() && self.should_disarm_due_to_pedal_input())
            || (context.is_sim_ready() && !self.arming_is_allowed_by_bcu)
            || self.spoilers_retracted_during_this_update()
            || self.should_disarm_after_time_in_flight.output()
            || self.external_disarm_event
            || (self.mode == AutobrakeMode::MAX
                && self.should_reject_max_mode_after_time_in_flight.output())
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
        lgciu1: &impl LgciuInterface,
        lgciu2: &impl LgciuInterface,
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
        lgciu1: &impl LgciuInterface,
        lgciu2: &impl LgciuInterface,
    ) {
        self.update_input_conditions(
            context,
            allow_arming,
            pedal_input_left,
            pedal_input_right,
            lgciu1,
            lgciu2,
        );
        self.mode = self.determine_mode(context, autobrake_panel);

        self.deceleration_governor
            .engage_when(self.should_engage_deceleration_governor(context));

        self.target = self.calculate_target();
        self.deceleration_governor.update(context, self.target);
    }
}
impl SimulationElement for A380AutobrakeController {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.armed_mode_id, self.mode as u8 as f64);
        writer.write(&self.armed_mode_id_set, -1.);
        writer.write(&self.decel_light_id, self.is_decelerating());
        writer.write(&self.active_id, self.deceleration_demanded());
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.last_ground_spoilers_are_deployed = self.ground_spoilers_are_deployed;
        let sec_1_gnd_splrs_out = reader.read(&self.ground_spoilers_out_sec1_id);
        let sec_2_gnd_splrs_out = reader.read(&self.ground_spoilers_out_sec2_id);
        let sec_3_gnd_splrs_out = reader.read(&self.ground_spoilers_out_sec3_id);
        self.ground_spoilers_are_deployed = sec_1_gnd_splrs_out
            && (sec_3_gnd_splrs_out || sec_2_gnd_splrs_out)
            || (sec_2_gnd_splrs_out && sec_3_gnd_splrs_out);
        self.external_disarm_event = reader.read(&self.external_disarm_event_id);

        // Reading current mode in sim to initialize correct mode if sim changes it (from .FLT files for example)
        let readed_mode = reader.read_f64(&self.armed_mode_id_set);
        if readed_mode >= 0.0 {
            self.mode = readed_mode.into();
        }
    }
}

pub(super) struct A380HydraulicOverheadPanel {
    edp1a_push_button: AutoOffFaultPushButton,
    edp2a_push_button: AutoOffFaultPushButton,
    edp3a_push_button: AutoOffFaultPushButton,
    edp4a_push_button: AutoOffFaultPushButton,
    edp1b_push_button: AutoOffFaultPushButton,
    edp2b_push_button: AutoOffFaultPushButton,
    edp3b_push_button: AutoOffFaultPushButton,
    edp4b_push_button: AutoOffFaultPushButton,

    eng1_edp_disconnect: AutoOffFaultPushButton,
    eng2_edp_disconnect: AutoOffFaultPushButton,
    eng3_edp_disconnect: AutoOffFaultPushButton,
    eng4_edp_disconnect: AutoOffFaultPushButton,

    yellow_epump_a_on_push_button: AutoOnFaultPushButton,
    yellow_epump_b_on_push_button: AutoOnFaultPushButton,
    green_epump_a_on_push_button: AutoOnFaultPushButton,
    green_epump_b_on_push_button: AutoOnFaultPushButton,

    yellow_epump_a_off_push_button: AutoOffFaultPushButton,
    yellow_epump_b_off_push_button: AutoOffFaultPushButton,
    green_epump_a_off_push_button: AutoOffFaultPushButton,
    green_epump_b_off_push_button: AutoOffFaultPushButton,

    green_leak_measurement_push_button: AutoOffFaultPushButton,
    yellow_leak_measurement_push_button: AutoOffFaultPushButton,
}
impl A380HydraulicOverheadPanel {
    pub(super) fn new(context: &mut InitContext) -> A380HydraulicOverheadPanel {
        A380HydraulicOverheadPanel {
            edp1a_push_button: AutoOffFaultPushButton::new_auto(context, "HYD_ENG_1A_PUMP"),
            edp2a_push_button: AutoOffFaultPushButton::new_auto(context, "HYD_ENG_2A_PUMP"),
            edp3a_push_button: AutoOffFaultPushButton::new_auto(context, "HYD_ENG_3A_PUMP"),
            edp4a_push_button: AutoOffFaultPushButton::new_auto(context, "HYD_ENG_4A_PUMP"),
            edp1b_push_button: AutoOffFaultPushButton::new_auto(context, "HYD_ENG_1B_PUMP"),
            edp2b_push_button: AutoOffFaultPushButton::new_auto(context, "HYD_ENG_2B_PUMP"),
            edp3b_push_button: AutoOffFaultPushButton::new_auto(context, "HYD_ENG_3B_PUMP"),
            edp4b_push_button: AutoOffFaultPushButton::new_auto(context, "HYD_ENG_4B_PUMP"),

            eng1_edp_disconnect: AutoOffFaultPushButton::new_auto(context, "HYD_ENG_1AB_PUMP_DISC"),
            eng2_edp_disconnect: AutoOffFaultPushButton::new_auto(context, "HYD_ENG_2AB_PUMP_DISC"),
            eng3_edp_disconnect: AutoOffFaultPushButton::new_auto(context, "HYD_ENG_3AB_PUMP_DISC"),
            eng4_edp_disconnect: AutoOffFaultPushButton::new_auto(context, "HYD_ENG_4AB_PUMP_DISC"),

            yellow_epump_a_on_push_button: AutoOnFaultPushButton::new_auto(
                context,
                "HYD_EPUMPYA_ON",
            ),
            yellow_epump_b_on_push_button: AutoOnFaultPushButton::new_auto(
                context,
                "HYD_EPUMPYB_ON",
            ),

            green_epump_a_on_push_button: AutoOnFaultPushButton::new_auto(
                context,
                "HYD_EPUMPGA_ON",
            ),
            green_epump_b_on_push_button: AutoOnFaultPushButton::new_auto(
                context,
                "HYD_EPUMPGB_ON",
            ),

            yellow_epump_a_off_push_button: AutoOffFaultPushButton::new_auto(
                context,
                "HYD_EPUMPYA_OFF",
            ),
            yellow_epump_b_off_push_button: AutoOffFaultPushButton::new_auto(
                context,
                "HYD_EPUMPYB_OFF",
            ),

            green_epump_a_off_push_button: AutoOffFaultPushButton::new_auto(
                context,
                "HYD_EPUMPGA_OFF",
            ),
            green_epump_b_off_push_button: AutoOffFaultPushButton::new_auto(
                context,
                "HYD_EPUMPGB_OFF",
            ),

            green_leak_measurement_push_button: AutoOffFaultPushButton::new_auto(
                context,
                "HYD_LEAK_MEASUREMENT_G",
            ),

            yellow_leak_measurement_push_button: AutoOffFaultPushButton::new_auto(
                context,
                "HYD_LEAK_MEASUREMENT_Y",
            ),
        }
    }

    pub(super) fn update(&mut self, hyd: &A380Hydraulic) {
        self.eng1_edp_disconnect
            .set_fault(hyd.pump_disc_has_fault(1));
        self.eng2_edp_disconnect
            .set_fault(hyd.pump_disc_has_fault(2));
        self.eng3_edp_disconnect
            .set_fault(hyd.pump_disc_has_fault(3));
        self.eng4_edp_disconnect
            .set_fault(hyd.pump_disc_has_fault(4));

        self.edp1a_push_button
            .set_fault(hyd.edp_has_fault(A380EngineDrivenPumpId::Edp1a));
        self.edp2a_push_button
            .set_fault(hyd.edp_has_fault(A380EngineDrivenPumpId::Edp2a));
        self.edp3a_push_button
            .set_fault(hyd.edp_has_fault(A380EngineDrivenPumpId::Edp3a));
        self.edp4a_push_button
            .set_fault(hyd.edp_has_fault(A380EngineDrivenPumpId::Edp4a));

        self.edp1b_push_button
            .set_fault(hyd.edp_has_fault(A380EngineDrivenPumpId::Edp1b));
        self.edp2b_push_button
            .set_fault(hyd.edp_has_fault(A380EngineDrivenPumpId::Edp2b));
        self.edp3b_push_button
            .set_fault(hyd.edp_has_fault(A380EngineDrivenPumpId::Edp3b));
        self.edp4b_push_button
            .set_fault(hyd.edp_has_fault(A380EngineDrivenPumpId::Edp4b));

        self.yellow_epump_a_off_push_button
            .set_fault(hyd.epump_has_fault(A380ElectricPumpId::YellowA));
        self.yellow_epump_b_off_push_button
            .set_fault(hyd.epump_has_fault(A380ElectricPumpId::YellowB));

        self.green_epump_a_off_push_button
            .set_fault(hyd.epump_has_fault(A380ElectricPumpId::GreenA));
        self.green_epump_b_off_push_button
            .set_fault(hyd.epump_has_fault(A380ElectricPumpId::GreenB));

        if self.yellow_epump_a_off_push_button.is_off() {
            self.yellow_epump_a_on_push_button.push_auto()
        }
        if self.yellow_epump_b_off_push_button.is_off() {
            self.yellow_epump_b_on_push_button.push_auto()
        }
        if self.green_epump_a_off_push_button.is_off() {
            self.green_epump_a_on_push_button.push_auto()
        }
        if self.green_epump_b_off_push_button.is_off() {
            self.green_epump_b_on_push_button.push_auto()
        }
    }

    fn engines_edp_disconnected(&self, engine_num: usize) -> bool {
        match engine_num {
            1 => !self.eng1_edp_disconnect.is_auto(),
            2 => !self.eng2_edp_disconnect.is_auto(),
            3 => !self.eng3_edp_disconnect.is_auto(),
            4 => !self.eng4_edp_disconnect.is_auto(),
            _ => panic!("Only 4 engines on A380"),
        }
    }

    fn epump_button_off_is_off(&self, pump_id: A380ElectricPumpId) -> bool {
        match pump_id {
            A380ElectricPumpId::GreenA => self.green_epump_a_off_push_button.is_off(),
            A380ElectricPumpId::GreenB => self.green_epump_b_off_push_button.is_off(),
            A380ElectricPumpId::YellowA => self.yellow_epump_a_off_push_button.is_off(),
            A380ElectricPumpId::YellowB => self.yellow_epump_b_off_push_button.is_off(),
            A380ElectricPumpId::GreenAuxiliary => true,
        }
    }

    fn edp_push_button_is_auto(&self, pump_id: A380EngineDrivenPumpId) -> bool {
        match pump_id {
            A380EngineDrivenPumpId::Edp1a => self.edp1a_push_button.is_auto(),
            A380EngineDrivenPumpId::Edp2a => self.edp2a_push_button.is_auto(),
            A380EngineDrivenPumpId::Edp3a => self.edp3a_push_button.is_auto(),
            A380EngineDrivenPumpId::Edp4a => self.edp4a_push_button.is_auto(),
            A380EngineDrivenPumpId::Edp1b => self.edp1b_push_button.is_auto(),
            A380EngineDrivenPumpId::Edp2b => self.edp2b_push_button.is_auto(),
            A380EngineDrivenPumpId::Edp3b => self.edp3b_push_button.is_auto(),
            A380EngineDrivenPumpId::Edp4b => self.edp4b_push_button.is_auto(),
        }
    }

    fn edp_push_button_is_off(&self, pump_id: A380EngineDrivenPumpId) -> bool {
        match pump_id {
            A380EngineDrivenPumpId::Edp1a => self.edp1a_push_button.is_off(),
            A380EngineDrivenPumpId::Edp2a => self.edp2a_push_button.is_off(),
            A380EngineDrivenPumpId::Edp3a => self.edp3a_push_button.is_off(),
            A380EngineDrivenPumpId::Edp4a => self.edp4a_push_button.is_off(),
            A380EngineDrivenPumpId::Edp1b => self.edp1b_push_button.is_off(),
            A380EngineDrivenPumpId::Edp2b => self.edp2b_push_button.is_off(),
            A380EngineDrivenPumpId::Edp3b => self.edp3b_push_button.is_off(),
            A380EngineDrivenPumpId::Edp4b => self.edp4b_push_button.is_off(),
        }
    }

    fn epump_button_on_is_on(&self, pump_id: A380ElectricPumpId) -> bool {
        match pump_id {
            A380ElectricPumpId::GreenA => self.green_epump_a_on_push_button.is_on(),
            A380ElectricPumpId::GreenB => self.green_epump_b_on_push_button.is_on(),
            A380ElectricPumpId::YellowA => self.yellow_epump_a_on_push_button.is_on(),
            A380ElectricPumpId::YellowB => self.yellow_epump_b_on_push_button.is_on(),
            A380ElectricPumpId::GreenAuxiliary => false,
        }
    }
}
impl SimulationElement for A380HydraulicOverheadPanel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.edp1a_push_button.accept(visitor);
        self.edp2a_push_button.accept(visitor);
        self.edp3a_push_button.accept(visitor);
        self.edp4a_push_button.accept(visitor);

        self.edp1b_push_button.accept(visitor);
        self.edp2b_push_button.accept(visitor);
        self.edp3b_push_button.accept(visitor);
        self.edp4b_push_button.accept(visitor);

        self.eng1_edp_disconnect.accept(visitor);
        self.eng2_edp_disconnect.accept(visitor);
        self.eng3_edp_disconnect.accept(visitor);
        self.eng4_edp_disconnect.accept(visitor);

        self.yellow_epump_a_on_push_button.accept(visitor);
        self.yellow_epump_b_on_push_button.accept(visitor);
        self.green_epump_a_on_push_button.accept(visitor);
        self.green_epump_b_on_push_button.accept(visitor);

        self.yellow_epump_a_off_push_button.accept(visitor);
        self.yellow_epump_b_off_push_button.accept(visitor);
        self.green_epump_a_off_push_button.accept(visitor);
        self.green_epump_b_off_push_button.accept(visitor);

        self.green_leak_measurement_push_button.accept(visitor);
        self.yellow_leak_measurement_push_button.accept(visitor);

        visitor.visit(self);
    }
}

#[derive(Clone, Copy, PartialEq)]
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
impl HydraulicLocking for AileronController {}
impl ElectroHydrostaticPowered for AileronController {
    fn should_activate_electrical_mode(&self) -> bool {
        self.requested_mode() == LinearActuatorMode::PositionControl
    }
}

struct AileronSystemHydraulicController {
    left_inboard_aileron_green_actuator_solenoid_id: VariableIdentifier,
    left_inboard_aileron_eha_actuator_solenoid_id: VariableIdentifier,
    left_midboard_aileron_yellow_actuator_solenoid_id: VariableIdentifier,
    left_midboard_aileron_eha_actuator_solenoid_id: VariableIdentifier,
    left_outboard_aileron_green_actuator_solenoid_id: VariableIdentifier,
    left_outboard_aileron_yellow_actuator_solenoid_id: VariableIdentifier,
    right_inboard_aileron_green_actuator_solenoid_id: VariableIdentifier,
    right_inboard_aileron_eha_actuator_solenoid_id: VariableIdentifier,
    right_midboard_aileron_yellow_actuator_solenoid_id: VariableIdentifier,
    right_midboard_aileron_eha_actuator_solenoid_id: VariableIdentifier,
    right_outboard_aileron_green_actuator_solenoid_id: VariableIdentifier,
    right_outboard_aileron_yellow_actuator_solenoid_id: VariableIdentifier,

    left_inboard_aileron_green_actuator_position_demand_id: VariableIdentifier,
    left_inboard_aileron_eha_actuator_position_demand_id: VariableIdentifier,
    left_midboard_aileron_yellow_actuator_position_demand_id: VariableIdentifier,
    left_midboard_aileron_eha_actuator_position_demand_id: VariableIdentifier,
    left_outboard_aileron_green_actuator_position_demand_id: VariableIdentifier,
    left_outboard_aileron_yellow_actuator_position_demand_id: VariableIdentifier,
    right_inboard_aileron_green_actuator_position_demand_id: VariableIdentifier,
    right_inboard_aileron_eha_actuator_position_demand_id: VariableIdentifier,
    right_midboard_aileron_yellow_actuator_position_demand_id: VariableIdentifier,
    right_midboard_aileron_eha_actuator_position_demand_id: VariableIdentifier,
    right_outboard_aileron_green_actuator_position_demand_id: VariableIdentifier,
    right_outboard_aileron_yellow_actuator_position_demand_id: VariableIdentifier,

    left_inboard_position_requests_from_fbw: [Ratio; 2],
    left_inboard_solenoid_energized_from_fbw: [bool; 2],
    left_midboard_position_requests_from_fbw: [Ratio; 2],
    left_midboard_solenoid_energized_from_fbw: [bool; 2],
    left_outboard_position_requests_from_fbw: [Ratio; 2],
    left_outboard_solenoid_energized_from_fbw: [bool; 2],
    right_inboard_position_requests_from_fbw: [Ratio; 2],
    right_inboard_solenoid_energized_from_fbw: [bool; 2],
    right_midboard_position_requests_from_fbw: [Ratio; 2],
    right_midboard_solenoid_energized_from_fbw: [bool; 2],
    right_outboard_position_requests_from_fbw: [Ratio; 2],
    right_outboard_solenoid_energized_from_fbw: [bool; 2],

    left_aileron_controllers: [[AileronController; 2]; 3],
    right_aileron_controllers: [[AileronController; 2]; 3],
}
impl AileronSystemHydraulicController {
    fn new(context: &mut InitContext) -> Self {
        Self {
            left_inboard_aileron_green_actuator_solenoid_id: context
                .get_identifier("LEFT_INBOARD_AIL_GREEN_SERVO_SOLENOID_ENERGIZED".to_owned()),
            left_inboard_aileron_eha_actuator_solenoid_id: context
                .get_identifier("LEFT_INBOARD_AIL_EHA_SERVO_SOLENOID_ENERGIZED".to_owned()),
            left_midboard_aileron_yellow_actuator_solenoid_id: context
                .get_identifier("LEFT_MIDBOARD_AIL_YELLOW_SERVO_SOLENOID_ENERGIZED".to_owned()),
            left_midboard_aileron_eha_actuator_solenoid_id: context
                .get_identifier("LEFT_MIDBOARD_AIL_EHA_SERVO_SOLENOID_ENERGIZED".to_owned()),
            left_outboard_aileron_green_actuator_solenoid_id: context
                .get_identifier("LEFT_OUTBOARD_AIL_GREEN_SERVO_SOLENOID_ENERGIZED".to_owned()),
            left_outboard_aileron_yellow_actuator_solenoid_id: context
                .get_identifier("LEFT_OUTBOARD_AIL_YELLOW_SERVO_SOLENOID_ENERGIZED".to_owned()),
            right_inboard_aileron_green_actuator_solenoid_id: context
                .get_identifier("RIGHT_INBOARD_AIL_GREEN_SERVO_SOLENOID_ENERGIZED".to_owned()),
            right_inboard_aileron_eha_actuator_solenoid_id: context
                .get_identifier("RIGHT_INBOARD_AIL_EHA_SERVO_SOLENOID_ENERGIZED".to_owned()),
            right_midboard_aileron_yellow_actuator_solenoid_id: context
                .get_identifier("RIGHT_MIDBOARD_AIL_YELLOW_SERVO_SOLENOID_ENERGIZED".to_owned()),
            right_midboard_aileron_eha_actuator_solenoid_id: context
                .get_identifier("RIGHT_MIDBOARD_AIL_EHA_SERVO_SOLENOID_ENERGIZED".to_owned()),
            right_outboard_aileron_green_actuator_solenoid_id: context
                .get_identifier("RIGHT_OUTBOARD_AIL_GREEN_SERVO_SOLENOID_ENERGIZED".to_owned()),
            right_outboard_aileron_yellow_actuator_solenoid_id: context
                .get_identifier("RIGHT_OUTBOARD_AIL_YELLOW_SERVO_SOLENOID_ENERGIZED".to_owned()),

            left_inboard_aileron_green_actuator_position_demand_id: context
                .get_identifier("LEFT_INBOARD_AIL_GREEN_COMMANDED_POSITION".to_owned()),
            left_inboard_aileron_eha_actuator_position_demand_id: context
                .get_identifier("LEFT_INBOARD_AIL_EHA_COMMANDED_POSITION".to_owned()),
            left_midboard_aileron_yellow_actuator_position_demand_id: context
                .get_identifier("LEFT_MIDBOARD_AIL_YELLOW_COMMANDED_POSITION".to_owned()),
            left_midboard_aileron_eha_actuator_position_demand_id: context
                .get_identifier("LEFT_MIDBOARD_AIL_EHA_COMMANDED_POSITION".to_owned()),
            left_outboard_aileron_green_actuator_position_demand_id: context
                .get_identifier("LEFT_OUTBOARD_AIL_GREEN_COMMANDED_POSITION".to_owned()),
            left_outboard_aileron_yellow_actuator_position_demand_id: context
                .get_identifier("LEFT_OUTBOARD_AIL_YELLOW_COMMANDED_POSITION".to_owned()),
            right_inboard_aileron_green_actuator_position_demand_id: context
                .get_identifier("RIGHT_INBOARD_AIL_GREEN_COMMANDED_POSITION".to_owned()),
            right_inboard_aileron_eha_actuator_position_demand_id: context
                .get_identifier("RIGHT_INBOARD_AIL_EHA_COMMANDED_POSITION".to_owned()),
            right_midboard_aileron_yellow_actuator_position_demand_id: context
                .get_identifier("RIGHT_MIDBOARD_AIL_YELLOW_COMMANDED_POSITION".to_owned()),
            right_midboard_aileron_eha_actuator_position_demand_id: context
                .get_identifier("RIGHT_MIDBOARD_AIL_EHA_COMMANDED_POSITION".to_owned()),
            right_outboard_aileron_green_actuator_position_demand_id: context
                .get_identifier("RIGHT_OUTBOARD_AIL_GREEN_COMMANDED_POSITION".to_owned()),
            right_outboard_aileron_yellow_actuator_position_demand_id: context
                .get_identifier("RIGHT_OUTBOARD_AIL_YELLOW_COMMANDED_POSITION".to_owned()),

            left_inboard_position_requests_from_fbw: [Ratio::default(); 2],
            left_inboard_solenoid_energized_from_fbw: [false; 2],
            left_midboard_position_requests_from_fbw: [Ratio::default(); 2],
            left_midboard_solenoid_energized_from_fbw: [false; 2],
            left_outboard_position_requests_from_fbw: [Ratio::default(); 2],
            left_outboard_solenoid_energized_from_fbw: [false; 2],
            right_inboard_position_requests_from_fbw: [Ratio::default(); 2],
            right_inboard_solenoid_energized_from_fbw: [false; 2],
            right_midboard_position_requests_from_fbw: [Ratio::default(); 2],
            right_midboard_solenoid_energized_from_fbw: [false; 2],
            right_outboard_position_requests_from_fbw: [Ratio::default(); 2],
            right_outboard_solenoid_energized_from_fbw: [false; 2],

            // Controllers are in outward->inward order, so for aileron [Blue circuit, Green circuit]
            left_aileron_controllers: [[AileronController::new(), AileronController::new()]; 3],
            right_aileron_controllers: [[AileronController::new(), AileronController::new()]; 3],
        }
    }

    fn left_controllers(
        &self,
        panel: AileronPanelPosition,
    ) -> &[impl HydraulicAssemblyController + HydraulicLocking + ElectroHydrostaticPowered] {
        &self.left_aileron_controllers[panel as usize][..]
    }

    fn right_controllers(
        &self,
        panel: AileronPanelPosition,
    ) -> &[impl HydraulicAssemblyController + HydraulicLocking + ElectroHydrostaticPowered] {
        &self.right_aileron_controllers[panel as usize][..]
    }

    fn update(&mut self) {
        self.update_aileron_controllers_positions();
        self.update_aileron_controllers_modes();
    }

    fn update_aileron_controllers_positions(&mut self) {
        self.left_aileron_controllers[AileronPanelPosition::Outward as usize]
            [AileronActuatorPosition::Outward as usize]
            .set_requested_position(
                self.left_outboard_position_requests_from_fbw
                    [AileronActuatorPosition::Outward as usize],
            );
        self.left_aileron_controllers[AileronPanelPosition::Outward as usize]
            [AileronActuatorPosition::Inward as usize]
            .set_requested_position(
                self.left_outboard_position_requests_from_fbw
                    [AileronActuatorPosition::Inward as usize],
            );

        self.left_aileron_controllers[AileronPanelPosition::Middle as usize]
            [AileronActuatorPosition::Outward as usize]
            .set_requested_position(
                self.left_midboard_position_requests_from_fbw
                    [AileronActuatorPosition::Outward as usize],
            );
        self.left_aileron_controllers[AileronPanelPosition::Middle as usize]
            [AileronActuatorPosition::Inward as usize]
            .set_requested_position(
                self.left_midboard_position_requests_from_fbw
                    [AileronActuatorPosition::Inward as usize],
            );

        self.left_aileron_controllers[AileronPanelPosition::Inward as usize]
            [AileronActuatorPosition::Outward as usize]
            .set_requested_position(
                self.left_inboard_position_requests_from_fbw
                    [AileronActuatorPosition::Outward as usize],
            );
        self.left_aileron_controllers[AileronPanelPosition::Inward as usize]
            [AileronActuatorPosition::Inward as usize]
            .set_requested_position(
                self.left_inboard_position_requests_from_fbw
                    [AileronActuatorPosition::Inward as usize],
            );

        self.right_aileron_controllers[AileronPanelPosition::Outward as usize]
            [AileronActuatorPosition::Outward as usize]
            .set_requested_position(
                self.right_outboard_position_requests_from_fbw
                    [AileronActuatorPosition::Outward as usize],
            );
        self.right_aileron_controllers[AileronPanelPosition::Outward as usize]
            [AileronActuatorPosition::Inward as usize]
            .set_requested_position(
                self.right_outboard_position_requests_from_fbw
                    [AileronActuatorPosition::Inward as usize],
            );

        self.right_aileron_controllers[AileronPanelPosition::Middle as usize]
            [AileronActuatorPosition::Outward as usize]
            .set_requested_position(
                self.right_midboard_position_requests_from_fbw
                    [AileronActuatorPosition::Outward as usize],
            );
        self.right_aileron_controllers[AileronPanelPosition::Middle as usize]
            [AileronActuatorPosition::Inward as usize]
            .set_requested_position(
                self.right_midboard_position_requests_from_fbw
                    [AileronActuatorPosition::Inward as usize],
            );

        self.right_aileron_controllers[AileronPanelPosition::Inward as usize]
            [AileronActuatorPosition::Outward as usize]
            .set_requested_position(
                self.right_inboard_position_requests_from_fbw
                    [AileronActuatorPosition::Outward as usize],
            );
        self.right_aileron_controllers[AileronPanelPosition::Inward as usize]
            [AileronActuatorPosition::Inward as usize]
            .set_requested_position(
                self.right_inboard_position_requests_from_fbw
                    [AileronActuatorPosition::Inward as usize],
            );
    }

    /// Will drive mode from solenoid state
    /// -If energized actuator controls position
    /// -If not energized actuator is slaved in damping
    /// -We differentiate case of all actuators in damping mode where we set a more dampened
    /// mode to reach realistic slow droop speed.
    fn update_aileron_controllers_modes(&mut self) {
        if self
            .left_outboard_solenoid_energized_from_fbw
            .iter()
            .any(|x| *x)
        {
            self.left_aileron_controllers[AileronPanelPosition::Outward as usize]
                [AileronActuatorPosition::Outward as usize]
                .set_mode(Self::aileron_actuator_mode_from_solenoid(
                    self.left_outboard_solenoid_energized_from_fbw
                        [AileronActuatorPosition::Outward as usize],
                ));
            self.left_aileron_controllers[AileronPanelPosition::Outward as usize]
                [AileronActuatorPosition::Inward as usize]
                .set_mode(Self::aileron_actuator_mode_from_solenoid(
                    self.left_outboard_solenoid_energized_from_fbw
                        [AileronActuatorPosition::Inward as usize],
                ));
        } else {
            for controller in
                &mut self.left_aileron_controllers[AileronPanelPosition::Outward as usize]
            {
                controller.set_mode(LinearActuatorMode::ClosedCircuitDamping);
            }
        }

        if self
            .left_midboard_solenoid_energized_from_fbw
            .iter()
            .any(|x| *x)
        {
            self.left_aileron_controllers[AileronPanelPosition::Middle as usize]
                [AileronActuatorPosition::Outward as usize]
                .set_mode(Self::aileron_actuator_mode_from_solenoid(
                    self.left_midboard_solenoid_energized_from_fbw
                        [AileronActuatorPosition::Outward as usize],
                ));
            self.left_aileron_controllers[AileronPanelPosition::Middle as usize]
                [AileronActuatorPosition::Inward as usize]
                .set_mode(Self::aileron_actuator_mode_from_solenoid(
                    self.left_midboard_solenoid_energized_from_fbw
                        [AileronActuatorPosition::Inward as usize],
                ));
        } else {
            for controller in
                &mut self.left_aileron_controllers[AileronPanelPosition::Middle as usize]
            {
                controller.set_mode(LinearActuatorMode::ClosedCircuitDamping);
            }
        }

        if self
            .left_inboard_solenoid_energized_from_fbw
            .iter()
            .any(|x| *x)
        {
            self.left_aileron_controllers[AileronPanelPosition::Inward as usize]
                [AileronActuatorPosition::Outward as usize]
                .set_mode(Self::aileron_actuator_mode_from_solenoid(
                    self.left_inboard_solenoid_energized_from_fbw
                        [AileronActuatorPosition::Outward as usize],
                ));
            self.left_aileron_controllers[AileronPanelPosition::Inward as usize]
                [AileronActuatorPosition::Inward as usize]
                .set_mode(Self::aileron_actuator_mode_from_solenoid(
                    self.left_inboard_solenoid_energized_from_fbw
                        [AileronActuatorPosition::Inward as usize],
                ));
        } else {
            for controller in
                &mut self.left_aileron_controllers[AileronPanelPosition::Inward as usize]
            {
                controller.set_mode(LinearActuatorMode::ClosedCircuitDamping);
            }
        }

        if self
            .right_outboard_solenoid_energized_from_fbw
            .iter()
            .any(|x| *x)
        {
            self.right_aileron_controllers[AileronPanelPosition::Outward as usize]
                [AileronActuatorPosition::Outward as usize]
                .set_mode(Self::aileron_actuator_mode_from_solenoid(
                    self.right_outboard_solenoid_energized_from_fbw
                        [AileronActuatorPosition::Outward as usize],
                ));
            self.right_aileron_controllers[AileronPanelPosition::Outward as usize]
                [AileronActuatorPosition::Inward as usize]
                .set_mode(Self::aileron_actuator_mode_from_solenoid(
                    self.right_outboard_solenoid_energized_from_fbw
                        [AileronActuatorPosition::Inward as usize],
                ));
        } else {
            for controller in
                &mut self.right_aileron_controllers[AileronPanelPosition::Outward as usize]
            {
                controller.set_mode(LinearActuatorMode::ClosedCircuitDamping);
            }
        }

        if self
            .right_midboard_solenoid_energized_from_fbw
            .iter()
            .any(|x| *x)
        {
            self.right_aileron_controllers[AileronPanelPosition::Middle as usize]
                [AileronActuatorPosition::Outward as usize]
                .set_mode(Self::aileron_actuator_mode_from_solenoid(
                    self.right_midboard_solenoid_energized_from_fbw
                        [AileronActuatorPosition::Outward as usize],
                ));
            self.right_aileron_controllers[AileronPanelPosition::Middle as usize]
                [AileronActuatorPosition::Inward as usize]
                .set_mode(Self::aileron_actuator_mode_from_solenoid(
                    self.right_midboard_solenoid_energized_from_fbw
                        [AileronActuatorPosition::Inward as usize],
                ));
        } else {
            for controller in
                &mut self.right_aileron_controllers[AileronPanelPosition::Middle as usize]
            {
                controller.set_mode(LinearActuatorMode::ClosedCircuitDamping);
            }
        }

        if self
            .right_inboard_solenoid_energized_from_fbw
            .iter()
            .any(|x| *x)
        {
            self.right_aileron_controllers[AileronPanelPosition::Inward as usize]
                [AileronActuatorPosition::Outward as usize]
                .set_mode(Self::aileron_actuator_mode_from_solenoid(
                    self.right_inboard_solenoid_energized_from_fbw
                        [AileronActuatorPosition::Outward as usize],
                ));
            self.right_aileron_controllers[AileronPanelPosition::Inward as usize]
                [AileronActuatorPosition::Inward as usize]
                .set_mode(Self::aileron_actuator_mode_from_solenoid(
                    self.right_inboard_solenoid_energized_from_fbw
                        [AileronActuatorPosition::Inward as usize],
                ));
        } else {
            for controller in
                &mut self.right_aileron_controllers[AileronPanelPosition::Inward as usize]
            {
                controller.set_mode(LinearActuatorMode::ClosedCircuitDamping);
            }
        }
    }

    fn aileron_actuator_mode_from_solenoid(solenoid_energized: bool) -> LinearActuatorMode {
        if solenoid_energized {
            LinearActuatorMode::PositionControl
        } else {
            LinearActuatorMode::ActiveDamping
        }
    }

    fn aileron_actuator_position_from_surface_angle(surface_angle: Angle) -> Ratio {
        Ratio::new::<ratio>(surface_angle.get::<degree>() / 50. + 20. / 50.)
    }
}
impl SimulationElement for AileronSystemHydraulicController {
    fn read(&mut self, reader: &mut SimulatorReader) {
        // Note that we reverse left, as positions are just passed through msfs for now
        self.left_inboard_position_requests_from_fbw = [
            Self::aileron_actuator_position_from_surface_angle(-Angle::new::<degree>(
                reader.read(&self.left_inboard_aileron_green_actuator_position_demand_id),
            )),
            Self::aileron_actuator_position_from_surface_angle(-Angle::new::<degree>(
                reader.read(&self.left_inboard_aileron_eha_actuator_position_demand_id),
            )),
        ];
        self.left_inboard_solenoid_energized_from_fbw = [
            reader.read(&self.left_inboard_aileron_green_actuator_solenoid_id),
            reader.read(&self.left_inboard_aileron_eha_actuator_solenoid_id),
        ];

        self.left_midboard_position_requests_from_fbw = [
            Self::aileron_actuator_position_from_surface_angle(-Angle::new::<degree>(
                reader.read(&self.left_midboard_aileron_yellow_actuator_position_demand_id),
            )),
            Self::aileron_actuator_position_from_surface_angle(-Angle::new::<degree>(
                reader.read(&self.left_midboard_aileron_eha_actuator_position_demand_id),
            )),
        ];
        self.left_midboard_solenoid_energized_from_fbw = [
            reader.read(&self.left_midboard_aileron_yellow_actuator_solenoid_id),
            reader.read(&self.left_midboard_aileron_eha_actuator_solenoid_id),
        ];

        self.left_outboard_position_requests_from_fbw = [
            Self::aileron_actuator_position_from_surface_angle(-Angle::new::<degree>(
                reader.read(&self.left_outboard_aileron_green_actuator_position_demand_id),
            )),
            Self::aileron_actuator_position_from_surface_angle(-Angle::new::<degree>(
                reader.read(&self.left_outboard_aileron_yellow_actuator_position_demand_id),
            )),
        ];
        self.left_outboard_solenoid_energized_from_fbw = [
            reader.read(&self.left_outboard_aileron_green_actuator_solenoid_id),
            reader.read(&self.left_outboard_aileron_yellow_actuator_solenoid_id),
        ];

        self.right_inboard_position_requests_from_fbw = [
            Self::aileron_actuator_position_from_surface_angle(-Angle::new::<degree>(
                reader.read(&self.right_inboard_aileron_green_actuator_position_demand_id),
            )),
            Self::aileron_actuator_position_from_surface_angle(-Angle::new::<degree>(
                reader.read(&self.right_inboard_aileron_eha_actuator_position_demand_id),
            )),
        ];
        self.right_inboard_solenoid_energized_from_fbw = [
            reader.read(&self.right_inboard_aileron_green_actuator_solenoid_id),
            reader.read(&self.right_inboard_aileron_eha_actuator_solenoid_id),
        ];

        self.right_midboard_position_requests_from_fbw = [
            Self::aileron_actuator_position_from_surface_angle(-Angle::new::<degree>(
                reader.read(&self.right_midboard_aileron_yellow_actuator_position_demand_id),
            )),
            Self::aileron_actuator_position_from_surface_angle(-Angle::new::<degree>(
                reader.read(&self.right_midboard_aileron_eha_actuator_position_demand_id),
            )),
        ];
        self.right_midboard_solenoid_energized_from_fbw = [
            reader.read(&self.right_midboard_aileron_yellow_actuator_solenoid_id),
            reader.read(&self.right_midboard_aileron_eha_actuator_solenoid_id),
        ];

        self.right_outboard_position_requests_from_fbw = [
            Self::aileron_actuator_position_from_surface_angle(-Angle::new::<degree>(
                reader.read(&self.right_outboard_aileron_green_actuator_position_demand_id),
            )),
            Self::aileron_actuator_position_from_surface_angle(-Angle::new::<degree>(
                reader.read(&self.right_outboard_aileron_yellow_actuator_position_demand_id),
            )),
        ];
        self.right_outboard_solenoid_energized_from_fbw = [
            reader.read(&self.right_outboard_aileron_green_actuator_solenoid_id),
            reader.read(&self.right_outboard_aileron_yellow_actuator_solenoid_id),
        ];
    }
}

struct ElevatorSystemHydraulicController {
    left_inboard_elevator_green_actuator_solenoid_id: VariableIdentifier,
    left_inboard_elevator_eha_actuator_solenoid_id: VariableIdentifier,
    left_outboard_elevator_green_actuator_solenoid_id: VariableIdentifier,
    left_outboard_elevator_eha_actuator_solenoid_id: VariableIdentifier,
    right_inboard_elevator_yellow_actuator_solenoid_id: VariableIdentifier,
    right_inboard_elevator_eha_actuator_solenoid_id: VariableIdentifier,
    right_outboard_elevator_yellow_actuator_solenoid_id: VariableIdentifier,
    right_outboard_elevator_eha_actuator_solenoid_id: VariableIdentifier,

    left_inboard_elevator_green_actuator_position_demand_id: VariableIdentifier,
    left_inboard_elevator_eha_actuator_position_demand_id: VariableIdentifier,
    left_outboard_elevator_green_actuator_position_demand_id: VariableIdentifier,
    left_outboard_elevator_eha_actuator_position_demand_id: VariableIdentifier,
    right_inboard_elevator_yellow_actuator_position_demand_id: VariableIdentifier,
    right_inboard_elevator_eha_actuator_position_demand_id: VariableIdentifier,
    right_outboard_elevator_yellow_actuator_position_demand_id: VariableIdentifier,
    right_outboard_elevator_eha_actuator_position_demand_id: VariableIdentifier,

    left_inboard_position_requests_from_fbw: [Ratio; 2],
    left_inboard_solenoid_energized_from_fbw: [bool; 2],
    left_outboard_position_requests_from_fbw: [Ratio; 2],
    left_outboard_solenoid_energized_from_fbw: [bool; 2],
    right_inboard_position_requests_from_fbw: [Ratio; 2],
    right_inboard_solenoid_energized_from_fbw: [bool; 2],
    right_outboard_position_requests_from_fbw: [Ratio; 2],
    right_outboard_solenoid_energized_from_fbw: [bool; 2],

    left_controllers: [[AileronController; 2]; 2],
    right_controllers: [[AileronController; 2]; 2],
}
impl ElevatorSystemHydraulicController {
    fn new(context: &mut InitContext) -> Self {
        Self {
            left_inboard_elevator_green_actuator_solenoid_id: context
                .get_identifier("LEFT_INBOARD_ELEV_GREEN_SERVO_SOLENOID_ENERGIZED".to_owned()),
            left_inboard_elevator_eha_actuator_solenoid_id: context
                .get_identifier("LEFT_INBOARD_ELEV_EHA_SERVO_SOLENOID_ENERGIZED".to_owned()),
            left_outboard_elevator_green_actuator_solenoid_id: context
                .get_identifier("LEFT_OUTBOARD_ELEV_GREEN_SERVO_SOLENOID_ENERGIZED".to_owned()),
            left_outboard_elevator_eha_actuator_solenoid_id: context
                .get_identifier("LEFT_OUTBOARD_ELEV_EHA_SERVO_SOLENOID_ENERGIZED".to_owned()),
            right_inboard_elevator_yellow_actuator_solenoid_id: context
                .get_identifier("RIGHT_INBOARD_ELEV_YELLOW_SERVO_SOLENOID_ENERGIZED".to_owned()),
            right_inboard_elevator_eha_actuator_solenoid_id: context
                .get_identifier("RIGHT_INBOARD_ELEV_EHA_SERVO_SOLENOID_ENERGIZED".to_owned()),
            right_outboard_elevator_yellow_actuator_solenoid_id: context
                .get_identifier("RIGHT_OUTBOARD_ELEV_YELLOW_SERVO_SOLENOID_ENERGIZED".to_owned()),
            right_outboard_elevator_eha_actuator_solenoid_id: context
                .get_identifier("RIGHT_OUTBOARD_ELEV_EHA_SERVO_SOLENOID_ENERGIZED".to_owned()),

            left_inboard_elevator_green_actuator_position_demand_id: context
                .get_identifier("LEFT_INBOARD_ELEV_GREEN_COMMANDED_POSITION".to_owned()),
            left_inboard_elevator_eha_actuator_position_demand_id: context
                .get_identifier("LEFT_INBOARD_ELEV_EHA_COMMANDED_POSITION".to_owned()),
            left_outboard_elevator_green_actuator_position_demand_id: context
                .get_identifier("LEFT_OUTBOARD_ELEV_GREEN_COMMANDED_POSITION".to_owned()),
            left_outboard_elevator_eha_actuator_position_demand_id: context
                .get_identifier("LEFT_OUTBOARD_ELEV_EHA_COMMANDED_POSITION".to_owned()),
            right_inboard_elevator_yellow_actuator_position_demand_id: context
                .get_identifier("RIGHT_INBOARD_ELEV_YELLOW_COMMANDED_POSITION".to_owned()),
            right_inboard_elevator_eha_actuator_position_demand_id: context
                .get_identifier("RIGHT_INBOARD_ELEV_EHA_COMMANDED_POSITION".to_owned()),
            right_outboard_elevator_yellow_actuator_position_demand_id: context
                .get_identifier("RIGHT_OUTBOARD_ELEV_YELLOW_COMMANDED_POSITION".to_owned()),
            right_outboard_elevator_eha_actuator_position_demand_id: context
                .get_identifier("RIGHT_OUTBOARD_ELEV_EHA_COMMANDED_POSITION".to_owned()),

            left_inboard_position_requests_from_fbw: [Ratio::default(); 2],
            left_inboard_solenoid_energized_from_fbw: [false; 2],
            left_outboard_position_requests_from_fbw: [Ratio::default(); 2],
            left_outboard_solenoid_energized_from_fbw: [false; 2],
            right_inboard_position_requests_from_fbw: [Ratio::default(); 2],
            right_inboard_solenoid_energized_from_fbw: [false; 2],
            right_outboard_position_requests_from_fbw: [Ratio::default(); 2],
            right_outboard_solenoid_energized_from_fbw: [false; 2],

            // Controllers are in outboard->inboard order
            left_controllers: [[AileronController::new(), AileronController::new()]; 2],
            right_controllers: [[AileronController::new(), AileronController::new()]; 2],
        }
    }

    fn left_controllers(
        &self,
        panel: ElevatorPanelPosition,
    ) -> &[impl HydraulicAssemblyController + HydraulicLocking + ElectroHydrostaticPowered] {
        &self.left_controllers[panel as usize][..]
    }

    fn right_controllers(
        &self,
        panel: ElevatorPanelPosition,
    ) -> &[impl HydraulicAssemblyController + HydraulicLocking + ElectroHydrostaticPowered] {
        &self.right_controllers[panel as usize][..]
    }

    fn update(&mut self) {
        self.update_elevator_controllers_positions();
        self.update_elevator_controllers_solenoids();
    }

    fn update_elevator_controllers_positions(&mut self) {
        self.left_controllers[ElevatorPanelPosition::Outward as usize]
            [ElevatorActuatorPosition::Outward as usize]
            .set_requested_position(
                self.left_outboard_position_requests_from_fbw
                    [ElevatorActuatorPosition::Outward as usize],
            );
        self.left_controllers[ElevatorPanelPosition::Outward as usize]
            [ElevatorActuatorPosition::Inward as usize]
            .set_requested_position(
                self.left_outboard_position_requests_from_fbw
                    [ElevatorActuatorPosition::Inward as usize],
            );
        self.left_controllers[ElevatorPanelPosition::Inward as usize]
            [ElevatorActuatorPosition::Outward as usize]
            .set_requested_position(
                self.left_inboard_position_requests_from_fbw
                    [ElevatorActuatorPosition::Outward as usize],
            );
        self.left_controllers[ElevatorPanelPosition::Inward as usize]
            [ElevatorActuatorPosition::Inward as usize]
            .set_requested_position(
                self.left_inboard_position_requests_from_fbw
                    [ElevatorActuatorPosition::Inward as usize],
            );

        self.right_controllers[ElevatorPanelPosition::Outward as usize]
            [ElevatorActuatorPosition::Outward as usize]
            .set_requested_position(
                self.right_outboard_position_requests_from_fbw
                    [ElevatorActuatorPosition::Outward as usize],
            );
        self.right_controllers[ElevatorPanelPosition::Outward as usize]
            [ElevatorActuatorPosition::Inward as usize]
            .set_requested_position(
                self.right_outboard_position_requests_from_fbw
                    [ElevatorActuatorPosition::Inward as usize],
            );
        self.right_controllers[ElevatorPanelPosition::Inward as usize]
            [ElevatorActuatorPosition::Outward as usize]
            .set_requested_position(
                self.right_inboard_position_requests_from_fbw
                    [ElevatorActuatorPosition::Outward as usize],
            );
        self.right_controllers[ElevatorPanelPosition::Inward as usize]
            [ElevatorActuatorPosition::Inward as usize]
            .set_requested_position(
                self.right_inboard_position_requests_from_fbw
                    [ElevatorActuatorPosition::Inward as usize],
            );
    }

    fn update_elevator_controllers_solenoids(&mut self) {
        if self
            .left_outboard_solenoid_energized_from_fbw
            .iter()
            .any(|x| *x)
        {
            self.left_controllers[ElevatorPanelPosition::Outward as usize]
                [ElevatorActuatorPosition::Outward as usize]
                .set_mode(Self::elevator_actuator_mode_from_solenoid(
                    self.left_outboard_solenoid_energized_from_fbw
                        [ElevatorActuatorPosition::Outward as usize],
                ));
            self.left_controllers[ElevatorPanelPosition::Outward as usize]
                [ElevatorActuatorPosition::Inward as usize]
                .set_mode(Self::elevator_actuator_mode_from_solenoid(
                    self.left_outboard_solenoid_energized_from_fbw
                        [AileronActuatorPosition::Inward as usize],
                ));
        } else {
            for controller in &mut self.left_controllers[ElevatorPanelPosition::Outward as usize] {
                controller.set_mode(LinearActuatorMode::ClosedCircuitDamping);
            }
        }
        if self
            .left_inboard_solenoid_energized_from_fbw
            .iter()
            .any(|x| *x)
        {
            self.left_controllers[ElevatorPanelPosition::Inward as usize]
                [ElevatorActuatorPosition::Outward as usize]
                .set_mode(Self::elevator_actuator_mode_from_solenoid(
                    self.left_inboard_solenoid_energized_from_fbw
                        [ElevatorActuatorPosition::Outward as usize],
                ));
            self.left_controllers[ElevatorPanelPosition::Inward as usize]
                [ElevatorActuatorPosition::Inward as usize]
                .set_mode(Self::elevator_actuator_mode_from_solenoid(
                    self.left_inboard_solenoid_energized_from_fbw
                        [AileronActuatorPosition::Inward as usize],
                ));
        } else {
            for controller in &mut self.left_controllers[ElevatorPanelPosition::Inward as usize] {
                controller.set_mode(LinearActuatorMode::ClosedCircuitDamping);
            }
        }

        if self
            .right_outboard_solenoid_energized_from_fbw
            .iter()
            .any(|x| *x)
        {
            self.right_controllers[ElevatorPanelPosition::Outward as usize]
                [ElevatorActuatorPosition::Outward as usize]
                .set_mode(Self::elevator_actuator_mode_from_solenoid(
                    self.right_outboard_solenoid_energized_from_fbw
                        [ElevatorActuatorPosition::Outward as usize],
                ));
            self.right_controllers[ElevatorPanelPosition::Outward as usize]
                [ElevatorActuatorPosition::Inward as usize]
                .set_mode(Self::elevator_actuator_mode_from_solenoid(
                    self.right_outboard_solenoid_energized_from_fbw
                        [AileronActuatorPosition::Inward as usize],
                ));
        } else {
            for controller in &mut self.right_controllers[ElevatorPanelPosition::Outward as usize] {
                controller.set_mode(LinearActuatorMode::ClosedCircuitDamping);
            }
        }
        if self
            .right_inboard_solenoid_energized_from_fbw
            .iter()
            .any(|x| *x)
        {
            self.right_controllers[ElevatorPanelPosition::Inward as usize]
                [ElevatorActuatorPosition::Outward as usize]
                .set_mode(Self::elevator_actuator_mode_from_solenoid(
                    self.right_inboard_solenoid_energized_from_fbw
                        [ElevatorActuatorPosition::Outward as usize],
                ));
            self.right_controllers[ElevatorPanelPosition::Inward as usize]
                [ElevatorActuatorPosition::Inward as usize]
                .set_mode(Self::elevator_actuator_mode_from_solenoid(
                    self.right_inboard_solenoid_energized_from_fbw
                        [AileronActuatorPosition::Inward as usize],
                ));
        } else {
            for controller in &mut self.right_controllers[ElevatorPanelPosition::Inward as usize] {
                controller.set_mode(LinearActuatorMode::ClosedCircuitDamping);
            }
        }
    }

    fn elevator_actuator_mode_from_solenoid(solenoid_energized: bool) -> LinearActuatorMode {
        if solenoid_energized {
            LinearActuatorMode::PositionControl
        } else {
            LinearActuatorMode::ActiveDamping
        }
    }

    fn elevator_actuator_position_from_surface_angle(surface_angle: Angle) -> Ratio {
        Ratio::new::<ratio>(
            (-surface_angle.get::<degree>() / 50. + 20. / 50.)
                .min(1.)
                .max(0.),
        )
    }
}
impl SimulationElement for ElevatorSystemHydraulicController {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.left_inboard_position_requests_from_fbw = [
            Self::elevator_actuator_position_from_surface_angle(Angle::new::<degree>(
                reader.read(&self.left_inboard_elevator_green_actuator_position_demand_id),
            )),
            Self::elevator_actuator_position_from_surface_angle(Angle::new::<degree>(
                reader.read(&self.left_inboard_elevator_eha_actuator_position_demand_id),
            )),
        ];
        self.left_inboard_solenoid_energized_from_fbw = [
            reader.read(&self.left_inboard_elevator_green_actuator_solenoid_id),
            reader.read(&self.left_inboard_elevator_eha_actuator_solenoid_id),
        ];

        self.left_outboard_position_requests_from_fbw = [
            Self::elevator_actuator_position_from_surface_angle(Angle::new::<degree>(
                reader.read(&self.left_outboard_elevator_green_actuator_position_demand_id),
            )),
            Self::elevator_actuator_position_from_surface_angle(Angle::new::<degree>(
                reader.read(&self.left_outboard_elevator_eha_actuator_position_demand_id),
            )),
        ];
        self.left_outboard_solenoid_energized_from_fbw = [
            reader.read(&self.left_outboard_elevator_green_actuator_solenoid_id),
            reader.read(&self.left_outboard_elevator_eha_actuator_solenoid_id),
        ];

        self.right_inboard_position_requests_from_fbw = [
            Self::elevator_actuator_position_from_surface_angle(Angle::new::<degree>(
                reader.read(&self.right_inboard_elevator_yellow_actuator_position_demand_id),
            )),
            Self::elevator_actuator_position_from_surface_angle(Angle::new::<degree>(
                reader.read(&self.right_inboard_elevator_eha_actuator_position_demand_id),
            )),
        ];
        self.right_inboard_solenoid_energized_from_fbw = [
            reader.read(&self.right_inboard_elevator_yellow_actuator_solenoid_id),
            reader.read(&self.right_inboard_elevator_eha_actuator_solenoid_id),
        ];

        self.right_outboard_position_requests_from_fbw = [
            Self::elevator_actuator_position_from_surface_angle(Angle::new::<degree>(
                reader.read(&self.right_outboard_elevator_yellow_actuator_position_demand_id),
            )),
            Self::elevator_actuator_position_from_surface_angle(Angle::new::<degree>(
                reader.read(&self.right_outboard_elevator_eha_actuator_position_demand_id),
            )),
        ];
        self.right_outboard_solenoid_energized_from_fbw = [
            reader.read(&self.right_outboard_elevator_yellow_actuator_solenoid_id),
            reader.read(&self.right_outboard_elevator_eha_actuator_solenoid_id),
        ];
    }
}

#[derive(Clone, Copy, PartialEq)]
struct TrimmableHorizontalStabilizerMotorElectricalController {
    should_motor_activate: bool,
    requested_position: Angle,
}
impl TrimmableHorizontalStabilizerMotorElectricalController {
    fn new() -> Self {
        Self {
            should_motor_activate: false,

            requested_position: Angle::default(),
        }
    }

    fn set_mode(&mut self, should_motor_activate: bool) {
        self.should_motor_activate = should_motor_activate;
    }

    /// Receives a [0;1] position request, 0 is down 1 is up
    fn set_requested_position(&mut self, requested_position: Angle) {
        self.requested_position = requested_position;
    }
}
impl TrimmableHorizontalStabilizerMotorController
    for TrimmableHorizontalStabilizerMotorElectricalController
{
    fn motor_should_activate(&self) -> bool {
        self.should_motor_activate
    }

    fn requested_position(&self) -> Angle {
        self.requested_position
    }
}

struct TrimmableHorizontalStabilizerSystemHydraulicController {
    ths_green_actuator_solenoid_id: VariableIdentifier,
    ths_yellow_actuator_solenoid_id: VariableIdentifier,

    ths_green_actuator_position_demand_id: VariableIdentifier,
    ths_yellow_actuator_position_demand_id: VariableIdentifier,

    position_requests_from_fbw: [Angle; 2],
    solenoid_energized_from_fbw: [bool; 2],

    controllers: [TrimmableHorizontalStabilizerMotorElectricalController; 2],
}
impl TrimmableHorizontalStabilizerSystemHydraulicController {
    fn new(context: &mut InitContext) -> Self {
        Self {
            ths_green_actuator_solenoid_id: context
                .get_identifier("THS_GREEN_SERVO_SOLENOID_ENERGIZED".to_owned()),
            ths_yellow_actuator_solenoid_id: context
                .get_identifier("THS_YELLOW_SERVO_SOLENOID_ENERGIZED".to_owned()),

            ths_green_actuator_position_demand_id: context
                .get_identifier("THS_GREEN_COMMANDED_POSITION".to_owned()),
            ths_yellow_actuator_position_demand_id: context
                .get_identifier("THS_YELLOW_COMMANDED_POSITION".to_owned()),

            position_requests_from_fbw: [Angle::default(); 2],
            solenoid_energized_from_fbw: [false; 2],

            // Controllers are in green->yellow order
            controllers: [
                TrimmableHorizontalStabilizerMotorElectricalController::new(),
                TrimmableHorizontalStabilizerMotorElectricalController::new(),
            ],
        }
    }

    fn controllers(&self) -> &[TrimmableHorizontalStabilizerMotorElectricalController; 2] {
        &self.controllers
    }

    fn update(&mut self) {
        self.update_ths_controllers_positions();
        self.update_ths_controllers_solenoids();
    }

    fn update_ths_controllers_positions(&mut self) {
        self.controllers[TrimmableHorizontalStabilizerMotorPosition::Green as usize]
            .set_requested_position(
                self.position_requests_from_fbw
                    [TrimmableHorizontalStabilizerMotorPosition::Green as usize],
            );
        self.controllers[TrimmableHorizontalStabilizerMotorPosition::Yellow as usize]
            .set_requested_position(
                self.position_requests_from_fbw
                    [TrimmableHorizontalStabilizerMotorPosition::Yellow as usize],
            );
    }

    fn update_ths_controllers_solenoids(&mut self) {
        self.controllers[TrimmableHorizontalStabilizerMotorPosition::Green as usize].set_mode(
            self.solenoid_energized_from_fbw
                [TrimmableHorizontalStabilizerMotorPosition::Green as usize],
        );
        self.controllers[TrimmableHorizontalStabilizerMotorPosition::Yellow as usize].set_mode(
            self.solenoid_energized_from_fbw
                [TrimmableHorizontalStabilizerMotorPosition::Yellow as usize],
        );
    }
}
impl SimulationElement for TrimmableHorizontalStabilizerSystemHydraulicController {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.position_requests_from_fbw = [
            -Angle::new::<degree>(reader.read(&self.ths_green_actuator_position_demand_id)),
            -Angle::new::<degree>(reader.read(&self.ths_yellow_actuator_position_demand_id)),
        ];
        self.solenoid_energized_from_fbw = [
            reader.read(&self.ths_green_actuator_solenoid_id),
            reader.read(&self.ths_yellow_actuator_solenoid_id),
        ];
    }
}

#[derive(Clone, Copy, PartialEq)]
struct RudderController {
    mode: LinearActuatorMode,
    electric_mode_active: bool,
    requested_position: Ratio,
}
impl RudderController {
    fn new() -> Self {
        Self {
            mode: LinearActuatorMode::ClosedCircuitDamping,

            electric_mode_active: false,

            requested_position: Ratio::new::<ratio>(0.),
        }
    }

    fn set_mode(&mut self, mode: LinearActuatorMode, electric_mode_active: bool) {
        self.mode = mode;
        self.electric_mode_active = electric_mode_active;
    }

    /// Receives a [0;1] position request, 0 is down 1 is up
    fn set_requested_position(&mut self, requested_position: Ratio) {
        self.requested_position = requested_position
            .min(Ratio::new::<ratio>(1.))
            .max(Ratio::new::<ratio>(0.));
    }
}
impl HydraulicAssemblyController for RudderController {
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
impl HydraulicLocking for RudderController {}
impl ElectroHydrostaticPowered for RudderController {
    fn should_activate_electrical_mode(&self) -> bool {
        self.electric_mode_active
    }
}

struct RudderSystemHydraulicController {
    upper_rudder_yellow_actuator_hydraulic_solenoid_id: VariableIdentifier,
    upper_rudder_yellow_actuator_electric_solenoid_id: VariableIdentifier,
    upper_rudder_green_actuator_hydraulic_solenoid_id: VariableIdentifier,
    upper_rudder_green_actuator_electric_solenoid_id: VariableIdentifier,
    lower_rudder_yellow_actuator_hydraulic_solenoid_id: VariableIdentifier,
    lower_rudder_yellow_actuator_electric_solenoid_id: VariableIdentifier,
    lower_rudder_green_actuator_hydraulic_solenoid_id: VariableIdentifier,
    lower_rudder_green_actuator_electric_solenoid_id: VariableIdentifier,

    upper_rudder_yellow_actuator_position_demand_id: VariableIdentifier,
    upper_rudder_green_actuator_position_demand_id: VariableIdentifier,
    lower_rudder_yellow_actuator_position_demand_id: VariableIdentifier,
    lower_rudder_green_actuator_position_demand_id: VariableIdentifier,

    upper_position_requests_from_fbw: [Ratio; 2],
    upper_hydraulic_mode_solenoid_energized_from_fbw: [bool; 2],
    upper_electric_mode_solenoid_energized_from_fbw: [bool; 2],
    lower_position_requests_from_fbw: [Ratio; 2],
    lower_hydraulic_mode_solenoid_energized_from_fbw: [bool; 2],
    lower_electric_mode_solenoid_energized_from_fbw: [bool; 2],

    rudder_controllers: [[RudderController; 2]; 2],
}
impl RudderSystemHydraulicController {
    fn new(context: &mut InitContext) -> Self {
        Self {
            upper_rudder_yellow_actuator_hydraulic_solenoid_id: context.get_identifier(
                "UPPER_RUDDER_YELLOW_EBHA_HYDRAULIC_MODE_SOLENOID_ENERGIZED".to_owned(),
            ),
            upper_rudder_yellow_actuator_electric_solenoid_id: context.get_identifier(
                "UPPER_RUDDER_YELLOW_EBHA_ELECTRIC_MODE_SOLENOID_ENERGIZED".to_owned(),
            ),
            upper_rudder_green_actuator_hydraulic_solenoid_id: context.get_identifier(
                "UPPER_RUDDER_GREEN_EBHA_HYDRAULIC_MODE_SOLENOID_ENERGIZED".to_owned(),
            ),
            upper_rudder_green_actuator_electric_solenoid_id: context.get_identifier(
                "UPPER_RUDDER_GREEN_EBHA_ELECTRIC_MODE_SOLENOID_ENERGIZED".to_owned(),
            ),
            lower_rudder_yellow_actuator_hydraulic_solenoid_id: context.get_identifier(
                "LOWER_RUDDER_YELLOW_EBHA_HYDRAULIC_MODE_SOLENOID_ENERGIZED".to_owned(),
            ),
            lower_rudder_yellow_actuator_electric_solenoid_id: context.get_identifier(
                "LOWER_RUDDER_YELLOW_EBHA_ELECTRIC_MODE_SOLENOID_ENERGIZED".to_owned(),
            ),
            lower_rudder_green_actuator_hydraulic_solenoid_id: context.get_identifier(
                "LOWER_RUDDER_GREEN_EBHA_HYDRAULIC_MODE_SOLENOID_ENERGIZED".to_owned(),
            ),
            lower_rudder_green_actuator_electric_solenoid_id: context.get_identifier(
                "LOWER_RUDDER_GREEN_EBHA_ELECTRIC_MODE_SOLENOID_ENERGIZED".to_owned(),
            ),

            upper_rudder_yellow_actuator_position_demand_id: context
                .get_identifier("UPPER_RUDDER_YELLOW_EBHA_COMMANDED_POSITION".to_owned()),
            upper_rudder_green_actuator_position_demand_id: context
                .get_identifier("UPPER_RUDDER_GREEN_EBHA_COMMANDED_POSITION".to_owned()),
            lower_rudder_yellow_actuator_position_demand_id: context
                .get_identifier("LOWER_RUDDER_YELLOW_EBHA_COMMANDED_POSITION".to_owned()),
            lower_rudder_green_actuator_position_demand_id: context
                .get_identifier("LOWER_RUDDER_GREEN_EBHA_COMMANDED_POSITION".to_owned()),

            upper_position_requests_from_fbw: [Ratio::default(); 2],
            upper_hydraulic_mode_solenoid_energized_from_fbw: [false; 2],
            upper_electric_mode_solenoid_energized_from_fbw: [false; 2],
            lower_position_requests_from_fbw: [Ratio::default(); 2],
            lower_hydraulic_mode_solenoid_energized_from_fbw: [false; 2],
            lower_electric_mode_solenoid_energized_from_fbw: [false; 2],

            // Controllers are in Upper -> Lower order
            rudder_controllers: [[RudderController::new(), RudderController::new()]; 2],
        }
    }

    fn controllers(
        &self,
        panel: RudderPanelPosition,
    ) -> &[impl HydraulicAssemblyController + HydraulicLocking + ElectroHydrostaticPowered] {
        &self.rudder_controllers[panel as usize][..]
    }

    fn update(&mut self) {
        self.update_rudder_controllers_positions();
        self.update_rudder_controllers_solenoids();
    }

    fn update_rudder_controllers_positions(&mut self) {
        self.rudder_controllers[RudderPanelPosition::Upper as usize]
            [RudderPanelPosition::Upper as usize]
            .set_requested_position(
                self.upper_position_requests_from_fbw[RudderPanelPosition::Upper as usize],
            );
        self.rudder_controllers[RudderPanelPosition::Upper as usize]
            [RudderPanelPosition::Lower as usize]
            .set_requested_position(
                self.upper_position_requests_from_fbw[RudderPanelPosition::Lower as usize],
            );
        self.rudder_controllers[RudderPanelPosition::Lower as usize]
            [RudderPanelPosition::Upper as usize]
            .set_requested_position(
                self.lower_position_requests_from_fbw[RudderPanelPosition::Upper as usize],
            );
        self.rudder_controllers[RudderPanelPosition::Lower as usize]
            [RudderPanelPosition::Lower as usize]
            .set_requested_position(
                self.lower_position_requests_from_fbw[RudderPanelPosition::Lower as usize],
            );
    }

    fn update_rudder_controllers_solenoids(&mut self) {
        if self
            .upper_hydraulic_mode_solenoid_energized_from_fbw
            .iter()
            .any(|x| *x)
            || self
                .upper_electric_mode_solenoid_energized_from_fbw
                .iter()
                .any(|x| *x)
        {
            self.rudder_controllers[RudderPanelPosition::Upper as usize]
                [RudderActuatorPosition::Upper as usize]
                .set_mode(
                    Self::rudder_actuator_mode_from_solenoid(
                        self.upper_hydraulic_mode_solenoid_energized_from_fbw
                            [RudderActuatorPosition::Upper as usize]
                            || self.upper_electric_mode_solenoid_energized_from_fbw
                                [RudderActuatorPosition::Upper as usize],
                    ),
                    self.upper_electric_mode_solenoid_energized_from_fbw
                        [RudderActuatorPosition::Upper as usize],
                );
            self.rudder_controllers[RudderPanelPosition::Upper as usize]
                [RudderActuatorPosition::Lower as usize]
                .set_mode(
                    Self::rudder_actuator_mode_from_solenoid(
                        self.upper_hydraulic_mode_solenoid_energized_from_fbw
                            [RudderActuatorPosition::Lower as usize]
                            || self.upper_electric_mode_solenoid_energized_from_fbw
                                [RudderActuatorPosition::Lower as usize],
                    ),
                    self.upper_electric_mode_solenoid_energized_from_fbw
                        [RudderActuatorPosition::Lower as usize],
                );
        } else {
            for controller in &mut self.rudder_controllers[RudderPanelPosition::Upper as usize] {
                controller.set_mode(LinearActuatorMode::ClosedCircuitDamping, false);
            }
        }
        if self
            .lower_hydraulic_mode_solenoid_energized_from_fbw
            .iter()
            .any(|x| *x)
            || self
                .lower_electric_mode_solenoid_energized_from_fbw
                .iter()
                .any(|x| *x)
        {
            self.rudder_controllers[RudderPanelPosition::Lower as usize]
                [RudderActuatorPosition::Upper as usize]
                .set_mode(
                    Self::rudder_actuator_mode_from_solenoid(
                        self.lower_hydraulic_mode_solenoid_energized_from_fbw
                            [RudderActuatorPosition::Upper as usize]
                            || self.lower_electric_mode_solenoid_energized_from_fbw
                                [RudderActuatorPosition::Upper as usize],
                    ),
                    self.lower_electric_mode_solenoid_energized_from_fbw
                        [RudderActuatorPosition::Upper as usize],
                );
            self.rudder_controllers[RudderPanelPosition::Lower as usize]
                [RudderActuatorPosition::Lower as usize]
                .set_mode(
                    Self::rudder_actuator_mode_from_solenoid(
                        self.lower_hydraulic_mode_solenoid_energized_from_fbw
                            [RudderActuatorPosition::Lower as usize]
                            || self.lower_electric_mode_solenoid_energized_from_fbw
                                [RudderActuatorPosition::Lower as usize],
                    ),
                    self.lower_electric_mode_solenoid_energized_from_fbw
                        [RudderActuatorPosition::Lower as usize],
                );
        } else {
            for controller in &mut self.rudder_controllers[RudderPanelPosition::Lower as usize] {
                controller.set_mode(LinearActuatorMode::ClosedCircuitDamping, false);
            }
        }
    }

    fn rudder_actuator_mode_from_solenoid(solenoid_energized: bool) -> LinearActuatorMode {
        if solenoid_energized {
            LinearActuatorMode::PositionControl
        } else {
            LinearActuatorMode::ActiveDamping
        }
    }

    fn rudder_actuator_position_from_surface_angle(surface_angle: Angle) -> Ratio {
        Ratio::new::<ratio>(-surface_angle.get::<degree>() / 60. + 0.5)
    }
}
impl SimulationElement for RudderSystemHydraulicController {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.upper_position_requests_from_fbw = [
            Self::rudder_actuator_position_from_surface_angle(Angle::new::<degree>(
                reader.read(&self.upper_rudder_yellow_actuator_position_demand_id),
            )),
            Self::rudder_actuator_position_from_surface_angle(Angle::new::<degree>(
                reader.read(&self.upper_rudder_green_actuator_position_demand_id),
            )),
        ];
        self.upper_hydraulic_mode_solenoid_energized_from_fbw = [
            reader.read(&self.upper_rudder_yellow_actuator_hydraulic_solenoid_id),
            reader.read(&self.upper_rudder_green_actuator_hydraulic_solenoid_id),
        ];
        self.upper_electric_mode_solenoid_energized_from_fbw = [
            reader.read(&self.upper_rudder_yellow_actuator_electric_solenoid_id),
            reader.read(&self.upper_rudder_green_actuator_electric_solenoid_id),
        ];

        self.lower_position_requests_from_fbw = [
            Self::rudder_actuator_position_from_surface_angle(Angle::new::<degree>(
                reader.read(&self.lower_rudder_green_actuator_position_demand_id),
            )),
            Self::rudder_actuator_position_from_surface_angle(Angle::new::<degree>(
                reader.read(&self.lower_rudder_yellow_actuator_position_demand_id),
            )),
        ];
        self.lower_hydraulic_mode_solenoid_energized_from_fbw = [
            reader.read(&self.lower_rudder_green_actuator_hydraulic_solenoid_id),
            reader.read(&self.lower_rudder_yellow_actuator_hydraulic_solenoid_id),
        ];
        self.lower_electric_mode_solenoid_energized_from_fbw = [
            reader.read(&self.lower_rudder_green_actuator_electric_solenoid_id),
            reader.read(&self.lower_rudder_yellow_actuator_electric_solenoid_id),
        ];
    }
}

#[derive(PartialEq, Clone, Copy)]
enum ActuatorSide {
    Left,
    Right,
}

#[derive(PartialEq, Clone, Copy)]
enum AileronActuatorPosition {
    Outward = 0,
    Inward = 1,
}

#[derive(PartialEq, Clone, Copy)]
enum AileronPanelPosition {
    Outward = 0,
    Middle = 1,
    Inward = 2,
}
enum RudderActuatorPosition {
    Upper = 0,
    Lower = 1,
}

enum RudderPanelPosition {
    Upper = 0,
    Lower = 1,
}

enum ElevatorActuatorPosition {
    Outward = 0,
    Inward = 1,
}

enum ElevatorPanelPosition {
    Outward = 0,
    Inward = 1,
}

enum TrimmableHorizontalStabilizerMotorPosition {
    Green = 0,
    Yellow = 1,
}

struct AileronAssembly {
    hydraulic_assemblies: [HydraulicLinearActuatorAssembly<2>; 3],

    position_out_id: VariableIdentifier,
    position_mid_id: VariableIdentifier,
    position_in_id: VariableIdentifier,

    positions: [Ratio; 3],
    aerodynamic_models: [AerodynamicModel; 3],
}
impl AileronAssembly {
    fn new(
        context: &mut InitContext,
        id: ActuatorSide,
        outward_hydraulic_assembly: HydraulicLinearActuatorAssembly<2>,
        middle_hydraulic_assembly: HydraulicLinearActuatorAssembly<2>,
        inward_hydraulic_assembly: HydraulicLinearActuatorAssembly<2>,
        aerodynamic_model_outter: AerodynamicModel,
        aerodynamic_model_middle: AerodynamicModel,
        aerodynamic_model_inner: AerodynamicModel,
    ) -> Self {
        Self {
            hydraulic_assemblies: [
                outward_hydraulic_assembly,
                middle_hydraulic_assembly,
                inward_hydraulic_assembly,
            ],
            position_out_id: match id {
                ActuatorSide::Left => {
                    context.get_identifier("HYD_AIL_LEFT_OUTWARD_DEFLECTION".to_owned())
                }
                ActuatorSide::Right => {
                    context.get_identifier("HYD_AIL_RIGHT_OUTWARD_DEFLECTION".to_owned())
                }
            },
            position_mid_id: match id {
                ActuatorSide::Left => {
                    context.get_identifier("HYD_AIL_LEFT_MIDDLE_DEFLECTION".to_owned())
                }
                ActuatorSide::Right => {
                    context.get_identifier("HYD_AIL_RIGHT_MIDDLE_DEFLECTION".to_owned())
                }
            },
            position_in_id: match id {
                ActuatorSide::Left => {
                    context.get_identifier("HYD_AIL_LEFT_INWARD_DEFLECTION".to_owned())
                }
                ActuatorSide::Right => {
                    context.get_identifier("HYD_AIL_RIGHT_INWARD_DEFLECTION".to_owned())
                }
            },
            positions: [Ratio::new::<ratio>(0.); 3],
            aerodynamic_models: [
                aerodynamic_model_outter,
                aerodynamic_model_middle,
                aerodynamic_model_inner,
            ],
        }
    }

    fn actuator(
        &mut self,
        circuit_position: AileronActuatorPosition,
        panel_position: AileronPanelPosition,
    ) -> &mut impl Actuator {
        self.hydraulic_assemblies[panel_position as usize].actuator(circuit_position as usize)
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        controllers: [&[impl HydraulicAssemblyController + HydraulicLocking + ElectroHydrostaticPowered];
            3],
        current_pressure_outward: [&impl SectionPressure; 3],
        current_pressure_inward: [&impl SectionPressure; 3],
    ) {
        for idx in 0..3 {
            self.aerodynamic_models[idx]
                .update_body(context, self.hydraulic_assemblies[idx].body());
            self.hydraulic_assemblies[idx].update(
                context,
                controllers[idx],
                [
                    current_pressure_outward[idx].pressure_downstream_leak_valve(),
                    current_pressure_inward[idx].pressure_downstream_leak_valve(),
                ],
            );

            self.positions[idx] = self.hydraulic_assemblies[idx].position_normalized();
        }
    }
}
impl SimulationElement for AileronAssembly {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.hydraulic_assemblies, visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.position_out_id, self.positions[0].get::<ratio>());
        writer.write(&self.position_mid_id, self.positions[1].get::<ratio>());
        writer.write(&self.position_in_id, self.positions[2].get::<ratio>());
    }
}

struct ElevatorAssembly {
    hydraulic_assemblies: [HydraulicLinearActuatorAssembly<2>; 2],

    position_out_id: VariableIdentifier,
    position_in_id: VariableIdentifier,

    positions: [Ratio; 2],

    aerodynamic_models: [AerodynamicModel; 2],
}
impl ElevatorAssembly {
    fn new(
        context: &mut InitContext,
        id: ActuatorSide,
        outward_hydraulic_assembly: HydraulicLinearActuatorAssembly<2>,
        inward_hydraulic_assembly: HydraulicLinearActuatorAssembly<2>,
        aerodynamic_model_outter: AerodynamicModel,
        aerodynamic_model_inner: AerodynamicModel,
    ) -> Self {
        Self {
            hydraulic_assemblies: [outward_hydraulic_assembly, inward_hydraulic_assembly],
            position_out_id: match id {
                ActuatorSide::Left => {
                    context.get_identifier("HYD_ELEV_LEFT_OUTWARD_DEFLECTION".to_owned())
                }
                ActuatorSide::Right => {
                    context.get_identifier("HYD_ELEV_RIGHT_OUTWARD_DEFLECTION".to_owned())
                }
            },
            position_in_id: match id {
                ActuatorSide::Left => {
                    context.get_identifier("HYD_ELEV_LEFT_INWARD_DEFLECTION".to_owned())
                }
                ActuatorSide::Right => {
                    context.get_identifier("HYD_ELEV_RIGHT_INWARD_DEFLECTION".to_owned())
                }
            },

            positions: [Ratio::new::<ratio>(0.); 2],
            aerodynamic_models: [aerodynamic_model_outter, aerodynamic_model_inner],
        }
    }

    fn actuator(
        &mut self,
        circuit_position: ElevatorActuatorPosition,
        panel_position: ElevatorPanelPosition,
    ) -> &mut impl Actuator {
        self.hydraulic_assemblies[panel_position as usize].actuator(circuit_position as usize)
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        elevator_controllers: [&[impl HydraulicAssemblyController + HydraulicLocking + ElectroHydrostaticPowered];
            2],
        current_pressure_outward: [&impl SectionPressure; 2],
        current_pressure_inward: [&impl SectionPressure; 2],
    ) {
        for idx in 0..2 {
            self.aerodynamic_models[idx]
                .update_body(context, self.hydraulic_assemblies[idx].body());

            self.hydraulic_assemblies[idx].update(
                context,
                elevator_controllers[idx],
                [
                    current_pressure_outward[idx].pressure_downstream_leak_valve(),
                    current_pressure_inward[idx].pressure_downstream_leak_valve(),
                ],
            );

            self.positions[idx] = self.hydraulic_assemblies[idx].position_normalized();
        }
    }

    // Returns aerodynamic torques for (outter,inner) control surfaces
    fn aerodynamic_torques_outter_inner(&self) -> (Torque, Torque) {
        (
            self.hydraulic_assemblies[0].aerodynamic_torque(),
            self.hydraulic_assemblies[1].aerodynamic_torque(),
        )
    }
}
impl SimulationElement for ElevatorAssembly {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.hydraulic_assemblies, visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.position_out_id,
            self.positions[ElevatorPanelPosition::Outward as usize].get::<ratio>(),
        );
        writer.write(
            &self.position_in_id,
            self.positions[ElevatorPanelPosition::Inward as usize].get::<ratio>(),
        );
    }
}
impl Debug for ElevatorAssembly {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "\nElevator assembly => Outward assembly / {:?} Inward assembly / {:?}",
            self.hydraulic_assemblies[0], self.hydraulic_assemblies[1]
        )
    }
}

struct RudderAssembly {
    hydraulic_assemblies: [HydraulicLinearActuatorAssembly<2>; 2],

    position_upper_id: VariableIdentifier,

    position_lower_id: VariableIdentifier,

    positions: [Ratio; 2],

    aerodynamic_models: [AerodynamicModel; 2],
}
impl RudderAssembly {
    fn new(
        context: &mut InitContext,
        upper_hydraulic_assembly: HydraulicLinearActuatorAssembly<2>,
        lower_hydraulic_assembly: HydraulicLinearActuatorAssembly<2>,
        aerodynamic_model_upper: AerodynamicModel,
        aerodynamic_model_lower: AerodynamicModel,
    ) -> Self {
        Self {
            hydraulic_assemblies: [upper_hydraulic_assembly, lower_hydraulic_assembly],

            position_upper_id: context.get_identifier("HYD_UPPER_RUD_DEFLECTION".to_owned()),

            position_lower_id: context.get_identifier("HYD_LOWER_RUD_DEFLECTION".to_owned()),

            positions: [Ratio::new::<ratio>(0.); 2],

            aerodynamic_models: [aerodynamic_model_upper, aerodynamic_model_lower],
        }
    }

    fn actuator(
        &mut self,
        circuit_position: RudderActuatorPosition,
        panel_position: RudderPanelPosition,
    ) -> &mut impl Actuator {
        self.hydraulic_assemblies[panel_position as usize].actuator(circuit_position as usize)
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        rudder_controllers: [&[impl HydraulicAssemblyController + HydraulicLocking + ElectroHydrostaticPowered];
            2],
        current_pressure_upper: [&impl SectionPressure; 2],
        current_pressure_lower: [&impl SectionPressure; 2],
    ) {
        for idx in 0..2 {
            self.aerodynamic_models[idx]
                .update_body(context, self.hydraulic_assemblies[idx].body());

            self.hydraulic_assemblies[idx].update(
                context,
                rudder_controllers[idx],
                [
                    current_pressure_upper[idx].pressure_downstream_leak_valve(),
                    current_pressure_lower[idx].pressure_downstream_leak_valve(),
                ],
            );

            self.positions[idx] = self.hydraulic_assemblies[idx].position_normalized();
        }
    }

    // Returns aerodynamic torques for (upper,lower) control surfaces
    fn aerodynamic_torques_up_down(&self) -> (Torque, Torque) {
        (
            self.hydraulic_assemblies[0].aerodynamic_torque(),
            self.hydraulic_assemblies[1].aerodynamic_torque(),
        )
    }
}
impl SimulationElement for RudderAssembly {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.hydraulic_assemblies, visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.position_upper_id,
            self.positions[RudderPanelPosition::Upper as usize].get::<ratio>(),
        );
        writer.write(
            &self.position_lower_id,
            self.positions[RudderPanelPosition::Lower as usize].get::<ratio>(),
        );
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
                    context.get_identifier(format!("HYD_SPOILER_{}_LEFT_DEFLECTION", id_num))
                }
                ActuatorSide::Right => {
                    context.get_identifier(format!("HYD_SPOILER_{}_RIGHT_DEFLECTION", id_num))
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
        spoiler_controller: &(impl HydraulicAssemblyController
              + HydraulicLocking
              + ElectroHydrostaticPowered),
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
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.hydraulic_assembly.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.position_id, self.position.get::<ratio>());
    }
}

struct SpoilerGroup {
    spoilers: [SpoilerElement; 8],
    hydraulic_controllers: [SpoilerController; 8],
}
impl SpoilerGroup {
    fn new(context: &mut InitContext, spoiler_side: &str, spoilers: [SpoilerElement; 8]) -> Self {
        Self {
            spoilers,
            hydraulic_controllers: [
                SpoilerController::new(context, spoiler_side, 1),
                SpoilerController::new(context, spoiler_side, 2),
                SpoilerController::new(context, spoiler_side, 3),
                SpoilerController::new(context, spoiler_side, 4),
                SpoilerController::new(context, spoiler_side, 5),
                SpoilerController::new(context, spoiler_side, 6),
                SpoilerController::new(context, spoiler_side, 7),
                SpoilerController::new(context, spoiler_side, 8),
            ],
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        green_section: &impl SectionPressure,
        yellow_section: &impl SectionPressure,
    ) {
        self.spoilers[0].update(
            context,
            &self.hydraulic_controllers[0],
            yellow_section.pressure_downstream_leak_valve(),
        );
        self.spoilers[1].update(
            context,
            &self.hydraulic_controllers[1],
            green_section.pressure_downstream_leak_valve(),
        );
        self.spoilers[2].update(
            context,
            &self.hydraulic_controllers[2],
            yellow_section.pressure_downstream_leak_valve(),
        );
        self.spoilers[3].update(
            context,
            &self.hydraulic_controllers[3],
            green_section.pressure_downstream_leak_valve(),
        );
        self.spoilers[4].update(
            context,
            &self.hydraulic_controllers[4],
            yellow_section.pressure_downstream_leak_valve(),
        );
        self.spoilers[5].update(
            context,
            &self.hydraulic_controllers[5],
            green_section.pressure_downstream_leak_valve(),
        );
        self.spoilers[6].update(
            context,
            &self.hydraulic_controllers[6],
            yellow_section.pressure_downstream_leak_valve(),
        );
        self.spoilers[7].update(
            context,
            &self.hydraulic_controllers[7],
            green_section.pressure_downstream_leak_valve(),
        );
    }

    fn actuator(&mut self, spoiler_idx: usize) -> &mut impl Actuator {
        self.spoilers[spoiler_idx].actuator()
    }
}
impl SimulationElement for SpoilerGroup {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        for controller in &mut self.hydraulic_controllers {
            controller.accept(visitor);
        }

        for spoiler in &mut self.spoilers {
            spoiler.accept(visitor);
        }

        visitor.visit(self);
    }
}

struct SpoilerController {
    position_demand_id: VariableIdentifier,
    electrical_mode_ena_id: Option<VariableIdentifier>,
    requested_position: Ratio,
    elec_backup_active: bool,
}
impl SpoilerController {
    fn new(context: &mut InitContext, spoiler_side: &str, spoiler_id_number: usize) -> Self {
        Self {
            position_demand_id: context.get_identifier(format!(
                "{}_SPOILER_{}_COMMANDED_POSITION",
                spoiler_side, spoiler_id_number
            )),
            electrical_mode_ena_id: if spoiler_id_number == 6 {
                Some(
                    context.get_identifier(format!(
                        "{}_SPOILER_6_EBHA_ELECTRONIC_ENABLE",
                        spoiler_side
                    )),
                )
            } else {
                None
            },

            requested_position: Ratio::new::<ratio>(0.),
            elec_backup_active: false,
        }
    }

    fn spoiler_actuator_position_from_surface_angle(surface_angle: Angle) -> Ratio {
        Ratio::new::<ratio>((surface_angle.get::<degree>() / 50.).min(1.).max(0.))
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
impl SimulationElement for SpoilerController {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.requested_position =
            Self::spoiler_actuator_position_from_surface_angle(Angle::new::<degree>(
                reader.read(&self.position_demand_id),
            ));

        if let Some(elec_mode_id) = self.electrical_mode_ena_id {
            self.elec_backup_active = reader.read(&elec_mode_id);
        };
    }
}
impl HydraulicLocking for SpoilerController {}
impl ElectroHydrostaticPowered for SpoilerController {
    fn should_activate_electrical_mode(&self) -> bool {
        self.elec_backup_active
    }
}

struct A380GravityExtension {
    gear_gravity_extension_handle_position_id: VariableIdentifier,

    handle_angle: Angle,
}
impl A380GravityExtension {
    fn new(context: &mut InitContext) -> Self {
        Self {
            gear_gravity_extension_handle_position_id: context
                .get_identifier("GRAVITYGEAR_ROTATE_PCT".to_owned()),

            handle_angle: Angle::default(),
        }
    }
}
impl GearGravityExtension for A380GravityExtension {
    fn extension_handle_number_of_turns(&self) -> u8 {
        (self.handle_angle.get::<degree>() / 360.).floor() as u8
    }
}
impl SimulationElement for A380GravityExtension {
    fn read(&mut self, reader: &mut SimulatorReader) {
        let handle_percent: f64 = reader.read(&self.gear_gravity_extension_handle_position_id);

        self.handle_angle = Angle::new::<degree>(handle_percent * 3.6)
            .max(Angle::new::<degree>(0.))
            .min(Angle::new::<degree>(360. * 3.));
    }
}

struct A380TiltingGears {
    left_body_gear: TiltingGear,
    right_body_gear: TiltingGear,
    left_wing_gear: TiltingGear,
    right_wing_gear: TiltingGear,
}
impl A380TiltingGears {
    fn new(
        left_body_gear: TiltingGear,
        right_body_gear: TiltingGear,
        left_wing_gear: TiltingGear,
        right_wing_gear: TiltingGear,
    ) -> Self {
        Self {
            left_body_gear,
            right_body_gear,
            left_wing_gear,
            right_wing_gear,
        }
    }

    fn update(&mut self, context: &UpdateContext) {
        self.left_body_gear.update(context);
        self.right_body_gear.update(context);
        self.left_wing_gear.update(context);
        self.right_wing_gear.update(context);
    }
}
impl SimulationElement for A380TiltingGears {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.left_body_gear.accept(visitor);
        self.right_body_gear.accept(visitor);
        self.left_wing_gear.accept(visitor);
        self.right_wing_gear.accept(visitor);

        visitor.visit(self);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    mod a380_hydraulics {
        use super::*;
        use rstest::rstest;
        use systems::{
            electrical::{
                test::TestElectricitySource, ElectricalBus, Electricity, ElectricitySource,
                ExternalPowerSource,
            },
            engine::{trent_engine::TrentEngine, EngineFireOverheadPanel},
            failures::FailureType,
            hydraulic::cargo_doors::{DoorControlState, HydraulicDoorController},
            shared::{EmergencyElectricalState, LgciuId, PotentialOrigin},
            simulation::{
                test::{ReadByName, SimulationTestBed, TestBed, WriteByName},
                Aircraft, InitContext,
            },
        };

        use crate::landing_gear::{GearSystemState, LandingGearControlInterfaceUnitSet};

        use uom::si::{
            angle::{degree, radian},
            electric_potential::volt,
            length::foot,
            ratio::{percent, ratio},
        };

        #[derive(Default)]
        struct A380TestAdirus {
            airspeed: Velocity,
        }
        impl A380TestAdirus {
            fn update(&mut self, context: &UpdateContext) {
                self.airspeed = context.true_airspeed()
            }
        }
        impl AdirsDiscreteOutputs for A380TestAdirus {
            fn low_speed_warning_1_104kts(&self, _: usize) -> bool {
                self.airspeed.get::<knot>() > 104.
            }

            fn low_speed_warning_2_54kts(&self, _: usize) -> bool {
                self.airspeed.get::<knot>() > 54.
            }

            fn low_speed_warning_3_159kts(&self, _: usize) -> bool {
                self.airspeed.get::<knot>() > 159.
            }

            fn low_speed_warning_4_260kts(&self, _: usize) -> bool {
                self.airspeed.get::<knot>() > 260.
            }
        }

        struct A380TestPneumatics {
            pressure: Pressure,
        }
        impl A380TestPneumatics {
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
        impl ReservoirAirPressure for A380TestPneumatics {
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

        struct A380TestElectrical {
            airspeed: Velocity,
            all_ac_lost: bool,
        }
        impl A380TestElectrical {
            pub fn new() -> Self {
                A380TestElectrical {
                    airspeed: Velocity::new::<knot>(100.),
                    all_ac_lost: false,
                }
            }

            fn update(&mut self, context: &UpdateContext) {
                self.airspeed = context.indicated_airspeed();
            }
        }
        impl EmergencyElectricalState for A380TestElectrical {
            fn is_in_emergency_elec(&self) -> bool {
                self.all_ac_lost && self.airspeed >= Velocity::new::<knot>(100.)
            }
        }
        impl SimulationElement for A380TestElectrical {
            fn receive_power(&mut self, buses: &impl ElectricalBuses) {
                self.all_ac_lost = !buses.is_powered(ElectricalBusType::AlternatingCurrent(1))
                    && !buses.is_powered(ElectricalBusType::AlternatingCurrent(2));
            }
        }
        struct A380HydraulicsTestAircraft {
            pneumatics: A380TestPneumatics,
            engine_1: TrentEngine,
            engine_2: TrentEngine,
            engine_3: TrentEngine,
            engine_4: TrentEngine,
            hydraulics: A380Hydraulic,
            overhead: A380HydraulicOverheadPanel,
            autobrake_panel: AutobrakePanel,
            engine_fire_overhead: EngineFireOverheadPanel<4>,

            lgcius: LandingGearControlInterfaceUnitSet,
            adirus: A380TestAdirus,
            electrical: A380TestElectrical,
            ext_pwr: ExternalPowerSource,

            powered_source_ac: TestElectricitySource,
            ac_ground_service_bus: ElectricalBus,
            dc_ground_service_bus: ElectricalBus,
            ac_ess_bus: ElectricalBus,
            ac_1_bus: ElectricalBus,
            ac_2_bus: ElectricalBus,
            ac_3_bus: ElectricalBus,
            ac_4_bus: ElectricalBus,
            ac_eha_bus: ElectricalBus,
            dc_1_bus: ElectricalBus,
            dc_2_bus: ElectricalBus,
            dc_ess_bus: ElectricalBus,
            dc_hot_1_bus: ElectricalBus,
            dc_hot_2_bus: ElectricalBus,

            // Electric buses states to be able to kill them dynamically
            is_ac_ground_service_powered: bool,
            is_dc_ground_service_powered: bool,
            is_ac_ess_powered: bool,
            is_ac_1_powered: bool,
            is_ac_2_powered: bool,
            is_ac_3_powered: bool,
            is_ac_4_powered: bool,
            is_ac_eha_powered: bool,
            is_dc_1_powered: bool,
            is_dc_2_powered: bool,
            is_dc_ess_powered: bool,
            is_dc_hot_1_powered: bool,
            is_dc_hot_2_powered: bool,
        }
        impl A380HydraulicsTestAircraft {
            fn new(context: &mut InitContext) -> Self {
                Self {
                    pneumatics: A380TestPneumatics::new(),
                    engine_1: TrentEngine::new(context, 1),
                    engine_2: TrentEngine::new(context, 2),
                    engine_3: TrentEngine::new(context, 3),
                    engine_4: TrentEngine::new(context, 4),
                    hydraulics: A380Hydraulic::new(context),
                    overhead: A380HydraulicOverheadPanel::new(context),
                    autobrake_panel: AutobrakePanel::new(context),
                    engine_fire_overhead: EngineFireOverheadPanel::new(context),
                    lgcius: LandingGearControlInterfaceUnitSet::new(
                        context,
                        ElectricalBusType::DirectCurrentEssential,
                        ElectricalBusType::DirectCurrentGndFltService,
                    ),
                    adirus: A380TestAdirus::default(),
                    electrical: A380TestElectrical::new(),
                    ext_pwr: ExternalPowerSource::new(context, 1),
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
                    ac_ess_bus: ElectricalBus::new(
                        context,
                        ElectricalBusType::AlternatingCurrentEssential,
                    ),
                    ac_1_bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(1)),
                    ac_2_bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(2)),
                    ac_3_bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(3)),
                    ac_4_bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(4)),
                    ac_eha_bus: ElectricalBus::new(context, AC_EHA_BUS),
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
                    is_ac_ess_powered: true,
                    is_ac_1_powered: true,
                    is_ac_2_powered: true,
                    is_ac_3_powered: true,
                    is_ac_4_powered: true,
                    is_ac_eha_powered: true,
                    is_dc_1_powered: true,
                    is_dc_2_powered: true,
                    is_dc_ess_powered: true,
                    is_dc_hot_1_powered: true,
                    is_dc_hot_2_powered: true,
                }
            }

            fn is_green_edp_commanded_on(&self) -> bool {
                self.hydraulics
                    .engine_driven_pump_1a_controller
                    .should_pressurise()
            }

            fn is_yellow_edp_commanded_on(&self) -> bool {
                self.hydraulics
                    .engine_driven_pump_3a_controller
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

            fn is_yellow_a_epump_controller_pressurising(&self) -> bool {
                self.hydraulics
                    .yellow_electric_pump_a_controller
                    .should_pressurise()
            }

            fn is_yellow_b_epump_controller_pressurising(&self) -> bool {
                self.hydraulics
                    .yellow_electric_pump_b_controller
                    .should_pressurise()
            }

            fn is_green_epump_a_controller_pressurising(&self) -> bool {
                self.hydraulics
                    .green_electric_pump_a_controller
                    .should_pressurise()
            }

            fn is_green_epump_b_controller_pressurising(&self) -> bool {
                self.hydraulics
                    .green_electric_pump_b_controller
                    .should_pressurise()
            }

            fn is_edp1a_green_pump_controller_pressurising(&self) -> bool {
                self.hydraulics
                    .engine_driven_pump_1a_controller
                    .should_pressurise()
            }

            fn is_edp2a_yellow_pump_controller_pressurising(&self) -> bool {
                self.hydraulics
                    .engine_driven_pump_2a_controller
                    .should_pressurise()
            }

            fn is_green_pressure_switch_pressurised(&self) -> bool {
                self.hydraulics.is_green_pressure_switch_pressurised()
            }

            fn is_yellow_pressure_switch_pressurised(&self) -> bool {
                self.hydraulics.is_yellow_pressure_switch_pressurised()
            }

            fn nose_steering_position(&self) -> Angle {
                self.hydraulics.nose_steering.position_feedback()
            }

            fn is_cargo_fwd_door_locked_up(&self) -> bool {
                self.hydraulics
                    .forward_cargo_door_controller
                    .control_state()
                    == DoorControlState::UpLocked
            }

            fn is_cargo_aft_door_locked_up(&self) -> bool {
                self.hydraulics.aft_cargo_door_controller.control_state()
                    == DoorControlState::UpLocked
            }

            fn set_ac_bus_1_is_powered(&mut self, bus_is_alive: bool) {
                self.is_ac_1_powered = bus_is_alive;
            }

            fn set_ac_bus_2_is_powered(&mut self, bus_is_alive: bool) {
                self.is_ac_2_powered = bus_is_alive;
            }

            fn set_ac_bus_3_is_powered(&mut self, bus_is_alive: bool) {
                self.is_ac_3_powered = bus_is_alive;
            }

            fn set_ac_bus_4_is_powered(&mut self, bus_is_alive: bool) {
                self.is_ac_4_powered = bus_is_alive;
            }

            fn _set_dc_ground_service_is_powered(&mut self, bus_is_alive: bool) {
                self.is_dc_ground_service_powered = bus_is_alive;
            }

            fn set_ac_ground_service_is_powered(&mut self, bus_is_alive: bool) {
                self.is_ac_ground_service_powered = bus_is_alive;
            }

            fn set_dc_bus_1_is_powered(&mut self, bus_is_alive: bool) {
                self.is_dc_1_powered = bus_is_alive;
            }

            fn set_dc_bus_2_is_powered(&mut self, bus_is_alive: bool) {
                self.is_dc_2_powered = bus_is_alive;
            }

            fn set_ac_ess_is_powered(&mut self, bus_is_alive: bool) {
                self.is_ac_ess_powered = bus_is_alive;
            }

            fn set_ac_eha_is_powered(&mut self, bus_is_alive: bool) {
                self.is_ac_eha_powered = bus_is_alive;
            }

            fn _set_dc_ess_is_powered(&mut self, bus_is_alive: bool) {
                self.is_dc_ess_powered = bus_is_alive;
            }
        }

        impl Aircraft for A380HydraulicsTestAircraft {
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

                if self.is_ac_3_powered {
                    electricity.flow(&self.powered_source_ac, &self.ac_3_bus);
                }

                if self.is_ac_4_powered {
                    electricity.flow(&self.powered_source_ac, &self.ac_4_bus);
                }

                if self.is_ac_eha_powered {
                    electricity.flow(&self.powered_source_ac, &self.ac_eha_bus);
                }

                if self.is_ac_ground_service_powered {
                    electricity.flow(&self.powered_source_ac, &self.ac_ground_service_bus);
                }

                if self.is_dc_ground_service_powered {
                    electricity.flow(&self.powered_source_ac, &self.dc_ground_service_bus);
                }

                if self.is_ac_ess_powered {
                    electricity.flow(&self.powered_source_ac, &self.ac_ess_bus);
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
                self.electrical.update(context);

                self.adirus.update(context);

                self.lgcius.update(
                    context,
                    &self.hydraulics.gear_system,
                    self.ext_pwr.output_potential().is_powered(),
                );

                self.hydraulics.update(
                    context,
                    [
                        &self.engine_1,
                        &self.engine_2,
                        &self.engine_3,
                        &self.engine_4,
                    ],
                    &self.overhead,
                    &self.autobrake_panel,
                    &self.engine_fire_overhead,
                    &self.lgcius,
                    &self.pneumatics,
                    &self.adirus,
                );

                self.overhead.update(&self.hydraulics);
            }
        }
        impl SimulationElement for A380HydraulicsTestAircraft {
            fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
                self.engine_1.accept(visitor);
                self.engine_2.accept(visitor);
                self.engine_3.accept(visitor);
                self.engine_4.accept(visitor);
                self.lgcius.accept(visitor);
                self.hydraulics.accept(visitor);
                self.autobrake_panel.accept(visitor);
                self.overhead.accept(visitor);
                self.engine_fire_overhead.accept(visitor);
                self.electrical.accept(visitor);
                self.ext_pwr.accept(visitor);

                visitor.visit(self);
            }
        }

        struct A380HydraulicsTestBed {
            test_bed: SimulationTestBed<A380HydraulicsTestAircraft>,
        }
        impl A380HydraulicsTestBed {
            fn new_with_start_state(start_state: StartState) -> Self {
                Self {
                    test_bed: SimulationTestBed::new_with_start_state(
                        start_state,
                        A380HydraulicsTestAircraft::new,
                    ),
                }
            }

            fn run_one_tick(mut self) -> Self {
                self.run_with_delta(A380Hydraulic::HYDRAULIC_SIM_TIME_STEP);
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

            fn is_green_pressure_switch_pressurised(&self) -> bool {
                self.query(|a| a.is_green_pressure_switch_pressurised())
            }

            fn is_yellow_pressure_switch_pressurised(&self) -> bool {
                self.query(|a| a.is_yellow_pressure_switch_pressurised())
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

            fn is_cargo_aft_door_locked_up(&self) -> bool {
                self.query(|a| a.is_cargo_aft_door_locked_up())
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

            fn yellow_pressure(&mut self) -> Pressure {
                self.read_by_name("HYD_YELLOW_SYSTEM_1_SECTION_PRESSURE")
            }

            fn green_pressure_auxiliary(&mut self) -> Pressure {
                self.read_by_name("HYD_GREEN_AUXILIARY_1_SECTION_PRESSURE")
            }

            fn _get_yellow_reservoir_volume(&mut self) -> Volume {
                self.read_by_name("HYD_YELLOW_RESERVOIR_LEVEL")
            }

            fn green_edp_has_fault(&mut self) -> bool {
                self.read_by_name("OVHD_HYD_ENG_1A_PUMP_PB_HAS_FAULT")
            }

            fn yellow_edp_has_fault(&mut self) -> bool {
                self.read_by_name("OVHD_HYD_ENG_3A_PUMP_PB_HAS_FAULT")
            }

            fn is_yellow_epump_a_press_low(&mut self) -> bool {
                self.read_by_name("HYD_YA_EPUMP_LOW_PRESS")
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

            fn autobrake_mode(&mut self) -> AutobrakeMode {
                ReadByName::<A380HydraulicsTestBed, f64>::read_by_name(
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

            fn _get_brake_yellow_accumulator_pressure(&mut self) -> Pressure {
                self.read_by_name("HYD_BRAKE_ALTN_ACC_PRESS")
            }

            fn get_brake_yellow_accumulator_fluid_volume(&self) -> Volume {
                self.query(|a| a.get_yellow_brake_accumulator_fluid_volume())
            }

            fn get_left_aileron_panel_position(&mut self, panel: AileronPanelPosition) -> Ratio {
                match panel {
                    AileronPanelPosition::Outward => {
                        Ratio::new::<ratio>(self.read_by_name("HYD_AIL_LEFT_OUTWARD_DEFLECTION"))
                    }
                    AileronPanelPosition::Middle => {
                        Ratio::new::<ratio>(self.read_by_name("HYD_AIL_LEFT_MIDDLE_DEFLECTION"))
                    }
                    AileronPanelPosition::Inward => {
                        Ratio::new::<ratio>(self.read_by_name("HYD_AIL_LEFT_INWARD_DEFLECTION"))
                    }
                }
            }

            fn get_right_aileron_panel_position(&mut self, panel: AileronPanelPosition) -> Ratio {
                match panel {
                    AileronPanelPosition::Outward => {
                        Ratio::new::<ratio>(self.read_by_name("HYD_AIL_RIGHT_OUTWARD_DEFLECTION"))
                    }
                    AileronPanelPosition::Middle => {
                        Ratio::new::<ratio>(self.read_by_name("HYD_AIL_RIGHT_MIDDLE_DEFLECTION"))
                    }
                    AileronPanelPosition::Inward => {
                        Ratio::new::<ratio>(self.read_by_name("HYD_AIL_RIGHT_INWARD_DEFLECTION"))
                    }
                }
            }

            fn get_left_aileron_mean_position(&mut self) -> Ratio {
                (self.get_left_aileron_panel_position(AileronPanelPosition::Outward)
                    + self.get_left_aileron_panel_position(AileronPanelPosition::Middle)
                    + self.get_left_aileron_panel_position(AileronPanelPosition::Inward))
                    / 3.
            }

            fn get_right_aileron_mean_position(&mut self) -> Ratio {
                (self.get_right_aileron_panel_position(AileronPanelPosition::Outward)
                    + self.get_right_aileron_panel_position(AileronPanelPosition::Middle)
                    + self.get_right_aileron_panel_position(AileronPanelPosition::Inward))
                    / 3.
            }

            fn _get_left_elevator_position(&mut self) -> Ratio {
                Ratio::new::<ratio>(self.read_by_name("HYD_ELEV_LEFT_DEFLECTION"))
            }

            fn _get_mean_right_spoilers_position(&mut self) -> Ratio {
                (Ratio::new::<ratio>(self.read_by_name("HYD_SPOILER_1_RIGHT_DEFLECTION"))
                    + Ratio::new::<ratio>(self.read_by_name("HYD_SPOILER_2_RIGHT_DEFLECTION"))
                    + Ratio::new::<ratio>(self.read_by_name("HYD_SPOILER_3_RIGHT_DEFLECTION"))
                    + Ratio::new::<ratio>(self.read_by_name("HYD_SPOILER_4_RIGHT_DEFLECTION"))
                    + Ratio::new::<ratio>(self.read_by_name("HYD_SPOILER_5_RIGHT_DEFLECTION"))
                    + Ratio::new::<ratio>(self.read_by_name("HYD_SPOILER_6_RIGHT_DEFLECTION"))
                    + Ratio::new::<ratio>(self.read_by_name("HYD_SPOILER_7_RIGHT_DEFLECTION"))
                    + Ratio::new::<ratio>(self.read_by_name("HYD_SPOILER_8_RIGHT_DEFLECTION")))
                    / 8.
            }

            fn get_mean_left_spoilers_position(&mut self) -> Ratio {
                (Ratio::new::<ratio>(self.read_by_name("HYD_SPOILER_1_LEFT_DEFLECTION"))
                    + Ratio::new::<ratio>(self.read_by_name("HYD_SPOILER_2_LEFT_DEFLECTION"))
                    + Ratio::new::<ratio>(self.read_by_name("HYD_SPOILER_3_LEFT_DEFLECTION"))
                    + Ratio::new::<ratio>(self.read_by_name("HYD_SPOILER_4_LEFT_DEFLECTION"))
                    + Ratio::new::<ratio>(self.read_by_name("HYD_SPOILER_5_LEFT_DEFLECTION"))
                    + Ratio::new::<ratio>(self.read_by_name("HYD_SPOILER_6_LEFT_DEFLECTION"))
                    + Ratio::new::<ratio>(self.read_by_name("HYD_SPOILER_7_LEFT_DEFLECTION"))
                    + Ratio::new::<ratio>(self.read_by_name("HYD_SPOILER_8_LEFT_DEFLECTION")))
                    / 8.
            }

            fn get_right_spoiler_position(&mut self, panel_id: usize) -> Ratio {
                Ratio::new::<ratio>(
                    self.read_by_name(
                        format!("HYD_SPOILER_{}_RIGHT_DEFLECTION", panel_id).as_str(),
                    ),
                )
            }

            fn get_left_spoiler_position(&mut self, panel_id: usize) -> Ratio {
                Ratio::new::<ratio>(
                    self.read_by_name(format!("HYD_SPOILER_{}_LEFT_DEFLECTION", panel_id).as_str()),
                )
            }

            fn _get_right_elevator_position(&mut self) -> Ratio {
                Ratio::new::<ratio>(self.read_by_name("HYD_ELEV_RIGHT_DEFLECTION"))
            }

            fn _get_rudder_position(&mut self) -> Ratio {
                Ratio::new::<ratio>(self.read_by_name("HYD_RUD_DEFLECTION"))
            }

            fn get_nose_steering_ratio(&mut self) -> Ratio {
                Ratio::new::<ratio>(self.read_by_name("NOSE_WHEEL_POSITION_RATIO"))
            }

            fn _is_fire_valve_eng1_closed(&mut self) -> bool {
                !ReadByName::<A380HydraulicsTestBed, bool>::read_by_name(
                    self,
                    "HYD_GREEN_PUMP_1_FIRE_VALVE_OPENED",
                ) && !self.query(|a| a.hydraulics.green_circuit.is_fire_shutoff_valve_open(0))
            }

            fn _is_fire_valve_eng2_closed(&mut self) -> bool {
                !ReadByName::<A380HydraulicsTestBed, bool>::read_by_name(
                    self,
                    "HYD_YELLOW_PUMP_1_FIRE_VALVE_OPENED",
                ) && !self.query(|a| a.hydraulics.green_circuit.is_fire_shutoff_valve_open(0))
            }

            fn engines_off(self) -> Self {
                self.stop_eng1().stop_eng2().stop_eng3().stop_eng4()
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

            fn on_the_ground_after_touchdown(mut self) -> Self {
                self.set_indicated_altitude(Length::new::<foot>(0.));
                self.set_on_ground(true);
                self.set_indicated_airspeed(Velocity::new::<knot>(100.));
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

            fn in_flight(mut self) -> Self {
                self.set_on_ground(false);
                self.set_indicated_altitude(Length::new::<foot>(2500.));
                self.set_indicated_airspeed(Velocity::new::<knot>(180.));
                self.start_eng1(Ratio::new::<percent>(80.))
                    .start_eng2(Ratio::new::<percent>(80.))
                    .start_eng3(Ratio::new::<percent>(80.))
                    .start_eng4(Ratio::new::<percent>(80.))
                    .set_gear_lever_up()
                    .set_park_brake(false)
                    .external_power(false)
            }

            fn sim_not_ready(mut self) -> Self {
                self.set_sim_is_ready(false);
                self
            }

            fn sim_ready(mut self) -> Self {
                self.set_sim_is_ready(true);
                self
            }

            fn set_tiller_demand(mut self, steering_ratio: Ratio) -> Self {
                self.write_by_name("TILLER_HANDLE_POSITION", steering_ratio.get::<ratio>());
                self
            }

            fn _set_autopilot_steering_demand(mut self, steering_ratio: Ratio) -> Self {
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

            fn open_aft_cargo_door(mut self) -> Self {
                self.write_by_name("AFT_DOOR_CARGO_OPEN_REQ", 1.);
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

            fn start_eng1(mut self, n2: Ratio) -> Self {
                self.write_by_name("GENERAL ENG STARTER ACTIVE:1", true);
                self.write_by_name("ENGINE_N2:1", n2);
                self.write_by_name("ENGINE_N3:1", n2);

                self
            }

            fn start_eng2(mut self, n2: Ratio) -> Self {
                self.write_by_name("GENERAL ENG STARTER ACTIVE:2", true);
                self.write_by_name("ENGINE_N2:2", n2);
                self.write_by_name("ENGINE_N3:2", n2);

                self
            }

            fn start_eng3(mut self, n2: Ratio) -> Self {
                self.write_by_name("GENERAL ENG STARTER ACTIVE:3", true);
                self.write_by_name("ENGINE_N2:3", n2);
                self.write_by_name("ENGINE_N3:3", n2);

                self
            }

            fn start_eng4(mut self, n2: Ratio) -> Self {
                self.write_by_name("GENERAL ENG STARTER ACTIVE:4", true);
                self.write_by_name("ENGINE_N2:4", n2);
                self.write_by_name("ENGINE_N3:4", n2);

                self
            }

            fn stop_eng1(mut self) -> Self {
                self.write_by_name("GENERAL ENG STARTER ACTIVE:1", false);
                self.write_by_name("ENGINE_N2:1", 0.);
                self.write_by_name("ENGINE_N3:1", 0.);

                self
            }

            fn _stopping_eng1(mut self) -> Self {
                self.write_by_name("GENERAL ENG STARTER ACTIVE:1", false);
                self.write_by_name("ENGINE_N2:1", 25.);
                self.write_by_name("ENGINE_N3:1", 25.);

                self
            }

            fn stop_eng2(mut self) -> Self {
                self.write_by_name("GENERAL ENG STARTER ACTIVE:2", false);
                self.write_by_name("ENGINE_N2:2", 0.);
                self.write_by_name("ENGINE_N3:2", 0.);

                self
            }

            fn _stopping_eng2(mut self) -> Self {
                self.write_by_name("GENERAL ENG STARTER ACTIVE:2", false);
                self.write_by_name("ENGINE_N2:2", 25.);
                self.write_by_name("ENGINE_N3:2", 25.);

                self
            }

            fn stop_eng3(mut self) -> Self {
                self.write_by_name("GENERAL ENG STARTER ACTIVE:3", false);
                self.write_by_name("ENGINE_N2:3", 0.);
                self.write_by_name("ENGINE_N3:3", 0.);

                self
            }

            fn stop_eng4(mut self) -> Self {
                self.write_by_name("GENERAL ENG STARTER ACTIVE:4", false);
                self.write_by_name("ENGINE_N2:4", 0.);
                self.write_by_name("ENGINE_N3:4", 0.);

                self
            }

            fn set_park_brake(mut self, is_set: bool) -> Self {
                self.write_by_name("PARK_BRAKE_LEVER_POS", is_set);
                self
            }

            fn set_gear_lever_up(mut self) -> Self {
                // One tick is needed so lever up can be evaluated
                self.write_by_name("GEAR_LEVER_POSITION_REQUEST", false);
                self = self.run_one_tick();

                self
            }

            fn set_gear_lever_down(mut self) -> Self {
                self.write_by_name("GEAR_LEVER_POSITION_REQUEST", true);

                self
            }

            fn set_anti_skid(mut self, is_set: bool) -> Self {
                self.write_by_name("ANTISKID BRAKES ACTIVE", is_set);
                self
            }

            fn set_yellow_e_pump_a(mut self, is_on: bool) -> Self {
                self.write_by_name("OVHD_HYD_EPUMPYA_ON_PB_IS_AUTO", !is_on);
                self
            }

            fn set_yellow_e_pump_b(mut self, is_on: bool) -> Self {
                self.write_by_name("OVHD_HYD_EPUMPYB_ON_PB_IS_AUTO", !is_on);
                self
            }

            fn set_green_e_pump_a(mut self, is_on: bool) -> Self {
                self.write_by_name("OVHD_HYD_EPUMPGA_ON_PB_IS_AUTO", !is_on);
                self
            }

            fn set_green_e_pump_b(mut self, is_on: bool) -> Self {
                self.write_by_name("OVHD_HYD_EPUMPGB_ON_PB_IS_AUTO", !is_on);
                self
            }

            fn set_green_ed_pump(mut self, is_auto: bool) -> Self {
                self.write_by_name("OVHD_HYD_ENG_1A_PUMP_PB_IS_AUTO", is_auto);
                self
            }

            fn set_yellow_ed_pump(mut self, is_auto: bool) -> Self {
                self.write_by_name("OVHD_HYD_ENG_3A_PUMP_PB_IS_AUTO", is_auto);
                self
            }

            fn set_flaps_handle_position(mut self, pos: u8) -> Self {
                self.write_by_name("FLAPS_HANDLE_INDEX", pos as f64);
                self
            }

            fn set_disconnect_engine_edp(mut self, engine_id: usize) -> Self {
                match engine_id {
                    1 => self.write_by_name("OVHD_HYD_ENG_1AB_PUMP_DISC_PB_IS_AUTO", false),
                    2 => self.write_by_name("OVHD_HYD_ENG_2AB_PUMP_DISC_PB_IS_AUTO", false),
                    3 => self.write_by_name("OVHD_HYD_ENG_3AB_PUMP_DISC_PB_IS_AUTO", false),
                    4 => self.write_by_name("OVHD_HYD_ENG_4AB_PUMP_DISC_PB_IS_AUTO", false),
                    _ => panic!("Only 4 engines buddy!"),
                };

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

            fn get_real_gear_position(&mut self, wheel_id: GearWheel) -> Ratio {
                match wheel_id {
                    GearWheel::NOSE => self.read_by_name("GEAR_CENTER_POSITION"),
                    GearWheel::LEFT => self.read_by_name("GEAR_LEFT_POSITION"),
                    GearWheel::RIGHT => self.read_by_name("GEAR_RIGHT_POSITION"),
                }
            }

            fn get_real_gear_door_position(&mut self, wheel_id: GearWheel) -> Ratio {
                match wheel_id {
                    GearWheel::NOSE => self.read_by_name("GEAR_DOOR_CENTER_POSITION"),
                    GearWheel::LEFT => self.read_by_name("GEAR_DOOR_LEFT_POSITION"),
                    GearWheel::RIGHT => self.read_by_name("GEAR_DOOR_RIGHT_POSITION"),
                }
            }

            fn is_all_gears_really_up(&mut self) -> bool {
                self.get_real_gear_position(GearWheel::NOSE) <= Ratio::new::<ratio>(0.01)
                    && self.get_real_gear_position(GearWheel::LEFT) <= Ratio::new::<ratio>(0.01)
                    && self.get_real_gear_position(GearWheel::RIGHT) <= Ratio::new::<ratio>(0.01)
            }

            fn is_all_gears_really_down(&mut self) -> bool {
                self.get_real_gear_position(GearWheel::NOSE) >= Ratio::new::<ratio>(0.99)
                    && self.get_real_gear_position(GearWheel::LEFT) >= Ratio::new::<ratio>(0.99)
                    && self.get_real_gear_position(GearWheel::RIGHT) >= Ratio::new::<ratio>(0.99)
            }

            fn is_all_doors_really_up(&mut self) -> bool {
                self.get_real_gear_door_position(GearWheel::NOSE) <= Ratio::new::<ratio>(0.01)
                    && self.get_real_gear_door_position(GearWheel::LEFT)
                        <= Ratio::new::<ratio>(0.01)
                    && self.get_real_gear_door_position(GearWheel::RIGHT)
                        <= Ratio::new::<ratio>(0.01)
            }

            fn is_all_doors_really_down(&mut self) -> bool {
                self.get_real_gear_door_position(GearWheel::NOSE) >= Ratio::new::<ratio>(0.9)
                    && self.get_real_gear_door_position(GearWheel::LEFT) >= Ratio::new::<ratio>(0.9)
                    && self.get_real_gear_door_position(GearWheel::RIGHT)
                        >= Ratio::new::<ratio>(0.9)
            }

            fn ac_bus_1_lost(mut self) -> Self {
                self.command(|a| a.set_ac_bus_1_is_powered(false));
                self
            }

            fn ac_bus_2_lost(mut self) -> Self {
                self.command(|a| a.set_ac_bus_2_is_powered(false));
                self
            }

            fn ac_bus_3_lost(mut self) -> Self {
                self.command(|a| a.set_ac_bus_3_is_powered(false));
                self
            }

            fn ac_bus_4_lost(mut self) -> Self {
                self.command(|a| a.set_ac_bus_4_is_powered(false));
                self
            }

            fn _dc_ground_service_lost(mut self) -> Self {
                self.command(|a| a._set_dc_ground_service_is_powered(false));
                self
            }

            fn _dc_ground_service_avail(mut self) -> Self {
                self.command(|a| a._set_dc_ground_service_is_powered(true));
                self
            }

            fn ac_ground_service_lost(mut self) -> Self {
                self.command(|a| a.set_ac_ground_service_is_powered(false));
                self
            }

            fn dc_bus_1_lost(mut self) -> Self {
                self.command(|a| a.set_dc_bus_1_is_powered(false));
                self
            }

            fn dc_bus_2_lost(mut self) -> Self {
                self.command(|a| a.set_dc_bus_2_is_powered(false));
                self
            }

            fn _dc_ess_lost(mut self) -> Self {
                self.command(|a| a._set_dc_ess_is_powered(false));
                self
            }

            fn _dc_ess_active(mut self) -> Self {
                self.command(|a| a._set_dc_ess_is_powered(true));
                self
            }

            fn ac_ess_lost(mut self) -> Self {
                self.command(|a| a.set_ac_ess_is_powered(false));
                self
            }

            fn ac_ess_active(mut self) -> Self {
                self.command(|a| a.set_ac_ess_is_powered(true));
                self
            }

            fn ac_eha_lost(mut self) -> Self {
                self.command(|a| a.set_ac_eha_is_powered(false));
                self
            }

            fn ac_eha_active(mut self) -> Self {
                self.command(|a| a.set_ac_eha_is_powered(true));
                self
            }

            fn set_cold_dark_inputs(self) -> Self {
                self.set_eng1_fire_button(false)
                    .set_eng2_fire_button(false)
                    .set_yellow_e_pump_a(false)
                    .set_green_ed_pump(true)
                    .set_yellow_ed_pump(true)
                    .set_park_brake(true)
                    .set_anti_skid(true)
                    .set_left_brake(Ratio::new::<percent>(0.))
                    .set_right_brake(Ratio::new::<percent>(0.))
                    .set_gear_lever_down()
                    .set_pushback_state(false)
                    .air_press_nominal()
                    .set_elac1_actuators_energized()
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

            fn set_autobrake_disarmed_with_set_variable(mut self) -> Self {
                self.write_by_name("AUTOBRAKES_ARMED_MODE_SET", 0);
                self
            }

            fn set_autobrake_low_with_set_variable(mut self) -> Self {
                self.write_by_name("AUTOBRAKES_ARMED_MODE_SET", 1);
                self
            }

            fn set_autobrake_med_with_set_variable(mut self) -> Self {
                self.write_by_name("AUTOBRAKES_ARMED_MODE_SET", 2);
                self
            }

            fn set_autobrake_max_with_set_variable(mut self) -> Self {
                self.write_by_name("AUTOBRAKES_ARMED_MODE_SET", 3);
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

            fn set_left_spoiler_6_elec_backup_active(mut self) -> Self {
                self.write_by_name("LEFT_SPOILER_6_EBHA_ELECTRONIC_ENABLE", true);
                self
            }

            fn set_right_spoiler_6_elec_backup_active(mut self) -> Self {
                self.write_by_name("RIGHT_SPOILER_6_EBHA_ELECTRONIC_ENABLE", true);
                self
            }

            fn set_deploy_ground_spoilers(mut self) -> Self {
                self.write_by_name("SEC_1_GROUND_SPOILER_OUT", true);
                self.write_by_name("SEC_2_GROUND_SPOILER_OUT", true);
                self.write_by_name("SEC_3_GROUND_SPOILER_OUT", true);
                self
            }

            fn set_retract_ground_spoilers(mut self) -> Self {
                self.write_by_name("SEC_1_GROUND_SPOILER_OUT", false);
                self.write_by_name("SEC_2_GROUND_SPOILER_OUT", false);
                self.write_by_name("SEC_3_GROUND_SPOILER_OUT", false);
                self
            }

            fn set_ailerons_neutral(mut self) -> Self {
                self.write_by_name("LEFT_AIL_BLUE_COMMANDED_POSITION", 0.);
                self.write_by_name("RIGHT_AIL_BLUE_COMMANDED_POSITION", 0.);
                self.write_by_name("LEFT_AIL_GREEN_COMMANDED_POSITION", 0.);
                self.write_by_name("RIGHT_AIL_GREEN_COMMANDED_POSITION", 0.);
                self
            }

            fn base_string_for_aileron_control(
                side: ActuatorSide,
                panel: AileronPanelPosition,
                actuator: AileronActuatorPosition,
            ) -> String {
                let base_string = match panel {
                    AileronPanelPosition::Outward => match actuator {
                        AileronActuatorPosition::Inward => "OUTBOARD_AIL_YELLOW",
                        AileronActuatorPosition::Outward => "OUTBOARD_AIL_GREEN",
                    },

                    AileronPanelPosition::Middle => match actuator {
                        AileronActuatorPosition::Inward => "MIDBOARD_AIL_EHA",
                        AileronActuatorPosition::Outward => "MIDBOARD_AIL_YELLOW",
                    },

                    AileronPanelPosition::Inward => match actuator {
                        AileronActuatorPosition::Inward => "INBOARD_AIL_EHA",
                        AileronActuatorPosition::Outward => "INBOARD_AIL_GREEN",
                    },
                };

                match side {
                    ActuatorSide::Left => format!("LEFT_{}", base_string),
                    ActuatorSide::Right => format!("RIGHT_{}", base_string),
                }
            }

            fn base_string_for_aileron_solenoid(
                side: ActuatorSide,
                panel: AileronPanelPosition,
                actuator: AileronActuatorPosition,
            ) -> String {
                format!(
                    "{}_SERVO_SOLENOID_ENERGIZED",
                    Self::base_string_for_aileron_control(side, panel, actuator)
                )
            }

            fn base_string_for_aileron_position(
                side: ActuatorSide,
                panel: AileronPanelPosition,
                actuator: AileronActuatorPosition,
            ) -> String {
                format!(
                    "{}_COMMANDED_POSITION",
                    Self::base_string_for_aileron_control(side, panel, actuator)
                )
            }

            fn reset_all_aileron_commands_per_side(mut self, side: ActuatorSide) -> Self {
                self.write_by_name(
                    Self::base_string_for_aileron_solenoid(
                        side,
                        AileronPanelPosition::Outward,
                        AileronActuatorPosition::Outward,
                    )
                    .as_str(),
                    0.,
                );
                self.write_by_name(
                    Self::base_string_for_aileron_solenoid(
                        side,
                        AileronPanelPosition::Outward,
                        AileronActuatorPosition::Inward,
                    )
                    .as_str(),
                    0.,
                );
                self.write_by_name(
                    Self::base_string_for_aileron_solenoid(
                        side,
                        AileronPanelPosition::Middle,
                        AileronActuatorPosition::Outward,
                    )
                    .as_str(),
                    0.,
                );
                self.write_by_name(
                    Self::base_string_for_aileron_solenoid(
                        side,
                        AileronPanelPosition::Middle,
                        AileronActuatorPosition::Inward,
                    )
                    .as_str(),
                    0.,
                );
                self.write_by_name(
                    Self::base_string_for_aileron_solenoid(
                        side,
                        AileronPanelPosition::Inward,
                        AileronActuatorPosition::Outward,
                    )
                    .as_str(),
                    0.,
                );
                self.write_by_name(
                    Self::base_string_for_aileron_solenoid(
                        side,
                        AileronPanelPosition::Inward,
                        AileronActuatorPosition::Inward,
                    )
                    .as_str(),
                    0.,
                );

                self
            }

            fn reset_all_aileron_commands(mut self) -> Self {
                self = self.reset_all_aileron_commands_per_side(ActuatorSide::Left);
                self = self.reset_all_aileron_commands_per_side(ActuatorSide::Right);

                self
            }

            fn set_aileron_panel_neutral(
                mut self,
                side: ActuatorSide,
                panel: AileronPanelPosition,
                actuator: AileronActuatorPosition,
            ) -> Self {
                self.write_by_name(
                    Self::base_string_for_aileron_solenoid(side, panel, actuator).as_str(),
                    1.,
                );
                self.write_by_name(
                    Self::base_string_for_aileron_position(side, panel, actuator).as_str(),
                    0.,
                );
                self
            }

            fn set_elevator_neutral(mut self) -> Self {
                self.write_by_name("LEFT_ELEV_BLUE_COMMANDED_POSITION", 0.);
                self.write_by_name("RIGHT_ELEV_BLUE_COMMANDED_POSITION", 0.);
                self.write_by_name("LEFT_ELEV_GREEN_COMMANDED_POSITION", 0.);
                self.write_by_name("RIGHT_ELEV_YELLOW_COMMANDED_POSITION", 0.);
                self
            }

            fn set_ailerons_left_turn(mut self) -> Self {
                self.write_by_name("LEFT_AIL_BLUE_COMMANDED_POSITION", -25.);
                self.write_by_name("RIGHT_AIL_BLUE_COMMANDED_POSITION", -25.);
                self.write_by_name("LEFT_AIL_GREEN_COMMANDED_POSITION", -25.);
                self.write_by_name("RIGHT_AIL_GREEN_COMMANDED_POSITION", -25.);
                self
            }

            fn set_elac1_actuators_energized(mut self) -> Self {
                self.write_by_name("LEFT_AIL_BLUE_SERVO_SOLENOID_ENERGIZED", 1.);
                self.write_by_name("RIGHT_AIL_BLUE_SERVO_SOLENOID_ENERGIZED", 0.);
                self.write_by_name("LEFT_AIL_GREEN_SERVO_SOLENOID_ENERGIZED", 0.);
                self.write_by_name("RIGHT_AIL_GREEN_SERVO_SOLENOID_ENERGIZED", 1.);

                self.write_by_name("LEFT_ELEV_BLUE_SERVO_SOLENOID_ENERGIZED", 0.);
                self.write_by_name("RIGHT_ELEV_BLUE_SERVO_SOLENOID_ENERGIZED", 0.);
                self.write_by_name("LEFT_ELEV_GREEN_SERVO_SOLENOID_ENERGIZED", 1.);
                self.write_by_name("RIGHT_ELEV_YELLOW_SERVO_SOLENOID_ENERGIZED", 1.);
                self
            }

            fn _set_elac_actuators_de_energized(mut self) -> Self {
                self.write_by_name("LEFT_AIL_BLUE_SERVO_SOLENOID_ENERGIZED", 0.);
                self.write_by_name("RIGHT_AIL_BLUE_SERVO_SOLENOID_ENERGIZED", 0.);
                self.write_by_name("LEFT_AIL_GREEN_SERVO_SOLENOID_ENERGIZED", 0.);
                self.write_by_name("RIGHT_AIL_GREEN_SERVO_SOLENOID_ENERGIZED", 0.);

                self.write_by_name("LEFT_ELEV_BLUE_SERVO_SOLENOID_ENERGIZED", 0.);
                self.write_by_name("RIGHT_ELEV_BLUE_SERVO_SOLENOID_ENERGIZED", 0.);
                self.write_by_name("LEFT_ELEV_GREEN_SERVO_SOLENOID_ENERGIZED", 0.);
                self.write_by_name("RIGHT_ELEV_YELLOW_SERVO_SOLENOID_ENERGIZED", 0.);

                self.write_by_name("LEFT_ELEV_BLUE_COMMANDED_POSITION", 0.);
                self.write_by_name("RIGHT_ELEV_BLUE_COMMANDED_POSITION", 0.);
                self.write_by_name("LEFT_ELEV_GREEN_COMMANDED_POSITION", 0.);
                self.write_by_name("RIGHT_ELEV_YELLOW_COMMANDED_POSITION", 0.);
                self
            }

            fn set_left_spoiler_out(mut self, panel_id: usize) -> Self {
                self.write_by_name(
                    format!("LEFT_SPOILER_{}_COMMANDED_POSITION", panel_id).as_str(),
                    50.,
                );
                self
            }

            fn set_right_spoiler_out(mut self, panel_id: usize) -> Self {
                self.write_by_name(
                    format!("RIGHT_SPOILER_{}_COMMANDED_POSITION", panel_id).as_str(),
                    50.,
                );
                self
            }

            fn _set_left_spoiler_in(mut self, panel_id: usize) -> Self {
                self.write_by_name(
                    format!("LEFT_SPOILER_{}_COMMANDED_POSITION", panel_id).as_str(),
                    0.,
                );
                self
            }

            fn _set_right_spoiler_in(mut self, panel_id: usize) -> Self {
                self.write_by_name(
                    format!("RIGHT_SPOILER_{}_COMMANDED_POSITION", panel_id).as_str(),
                    0.,
                );
                self
            }

            fn set_right_spoilers_out(mut self) -> Self {
                self = self.set_right_spoiler_out(1);
                self = self.set_right_spoiler_out(2);
                self = self.set_right_spoiler_out(3);
                self = self.set_right_spoiler_out(4);
                self = self.set_right_spoiler_out(5);
                self = self.set_right_spoiler_out(6);
                self = self.set_right_spoiler_out(7);
                self = self.set_right_spoiler_out(8);
                self
            }

            fn _set_right_spoilers_in(mut self) -> Self {
                self = self._set_right_spoiler_in(1);
                self = self._set_right_spoiler_in(2);
                self = self._set_right_spoiler_in(3);
                self = self._set_right_spoiler_in(4);
                self = self._set_right_spoiler_in(5);
                self = self._set_right_spoiler_in(6);
                self = self._set_right_spoiler_in(7);
                self = self._set_right_spoiler_in(8);
                self
            }

            fn set_left_spoilers_out(mut self) -> Self {
                self = self.set_left_spoiler_out(1);
                self = self.set_left_spoiler_out(2);
                self = self.set_left_spoiler_out(3);
                self = self.set_left_spoiler_out(4);
                self = self.set_left_spoiler_out(5);
                self = self.set_left_spoiler_out(6);
                self = self.set_left_spoiler_out(7);
                self = self.set_left_spoiler_out(8);
                self
            }

            fn _set_left_spoilers_in(mut self) -> Self {
                self = self._set_left_spoiler_in(1);
                self = self._set_left_spoiler_in(2);
                self = self._set_left_spoiler_in(3);
                self = self._set_left_spoiler_in(4);
                self = self._set_left_spoiler_in(5);
                self = self._set_left_spoiler_in(6);
                self = self._set_left_spoiler_in(7);
                self = self._set_left_spoiler_in(8);
                self
            }

            fn set_ailerons_right_turn(mut self) -> Self {
                self.write_by_name("LEFT_AIL_BLUE_COMMANDED_POSITION", 25.);
                self.write_by_name("RIGHT_AIL_BLUE_COMMANDED_POSITION", 25.);
                self.write_by_name("LEFT_AIL_GREEN_COMMANDED_POSITION", 25.);
                self.write_by_name("RIGHT_AIL_GREEN_COMMANDED_POSITION", 25.);
                self
            }

            fn gear_system_state(&self) -> GearSystemState {
                self.query(|a| a.lgcius.active_lgciu().gear_system_state())
            }

            fn _set_elevator_full_up(mut self) -> Self {
                self.write_by_name("LEFT_ELEV_BLUE_COMMANDED_POSITION", -30.);
                self.write_by_name("RIGHT_ELEV_BLUE_COMMANDED_POSITION", -30.);
                self.write_by_name("LEFT_ELEV_GREEN_COMMANDED_POSITION", -30.);
                self.write_by_name("RIGHT_ELEV_YELLOW_COMMANDED_POSITION", -30.);
                self
            }

            fn _set_elevator_full_down(mut self) -> Self {
                self.write_by_name("LEFT_ELEV_BLUE_COMMANDED_POSITION", 17.);
                self.write_by_name("RIGHT_ELEV_BLUE_COMMANDED_POSITION", 17.);
                self.write_by_name("LEFT_ELEV_GREEN_COMMANDED_POSITION", 17.);
                self.write_by_name("RIGHT_ELEV_YELLOW_COMMANDED_POSITION", 17.);
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

            fn turn_emergency_gear_extension_n_turns(mut self, number_of_turns: u8) -> Self {
                self.write_by_name("GRAVITYGEAR_ROTATE_PCT", number_of_turns as f64 * 100.);
                self
            }

            fn stow_emergency_gear_extension(mut self) -> Self {
                self.write_by_name("GRAVITYGEAR_ROTATE_PCT", 0.);
                self
            }
        }
        impl TestBed for A380HydraulicsTestBed {
            type Aircraft = A380HydraulicsTestAircraft;

            fn test_bed(&self) -> &SimulationTestBed<A380HydraulicsTestAircraft> {
                &self.test_bed
            }

            fn test_bed_mut(&mut self) -> &mut SimulationTestBed<A380HydraulicsTestAircraft> {
                &mut self.test_bed
            }
        }

        fn test_bed_on_ground() -> A380HydraulicsTestBed {
            A380HydraulicsTestBed::new_with_start_state(StartState::Apron)
        }

        fn test_bed_in_flight() -> A380HydraulicsTestBed {
            A380HydraulicsTestBed::new_with_start_state(StartState::Cruise)
        }

        fn test_bed_on_ground_with() -> A380HydraulicsTestBed {
            test_bed_on_ground()
        }

        fn test_bed_in_flight_with() -> A380HydraulicsTestBed {
            test_bed_in_flight()
        }

        #[test]
        fn outward_left_aileron_panel_responds_only_with_green_pressure_on_outward_jack() {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .start_eng1(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(5));

            assert!(test_bed.is_green_pressure_switch_pressurised());
            assert!(!test_bed.is_yellow_pressure_switch_pressurised());

            // Inward actuator on yellow hyds: shall not move
            test_bed = test_bed
                .reset_all_aileron_commands()
                .set_aileron_panel_neutral(
                    ActuatorSide::Left,
                    AileronPanelPosition::Outward,
                    AileronActuatorPosition::Inward,
                )
                .run_waiting_for(Duration::from_secs(1));

            assert!(
                test_bed
                    .get_left_aileron_panel_position(AileronPanelPosition::Outward)
                    .get::<ratio>()
                    < 0.1
            );

            test_bed = test_bed
                .reset_all_aileron_commands()
                .set_aileron_panel_neutral(
                    ActuatorSide::Left,
                    AileronPanelPosition::Outward,
                    AileronActuatorPosition::Outward,
                )
                .run_waiting_for(Duration::from_secs(1));

            assert!(
                test_bed
                    .get_left_aileron_panel_position(AileronPanelPosition::Outward,)
                    .get::<ratio>()
                    > 0.35
            );
            assert!(
                test_bed
                    .get_left_aileron_panel_position(AileronPanelPosition::Outward,)
                    .get::<ratio>()
                    < 0.55
            );
        }

        #[test]
        fn outward_right_aileron_panel_responds_only_with_green_pressure_on_outward_jack() {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .start_eng1(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(5));

            assert!(test_bed.is_green_pressure_switch_pressurised());
            assert!(!test_bed.is_yellow_pressure_switch_pressurised());

            // Inward actuator on yellow hyds: shall not move
            test_bed = test_bed
                .reset_all_aileron_commands()
                .set_aileron_panel_neutral(
                    ActuatorSide::Right,
                    AileronPanelPosition::Outward,
                    AileronActuatorPosition::Inward,
                )
                .run_waiting_for(Duration::from_secs(1));

            assert!(
                test_bed
                    .get_right_aileron_panel_position(AileronPanelPosition::Outward)
                    .get::<ratio>()
                    < 0.1
            );

            test_bed = test_bed
                .reset_all_aileron_commands()
                .set_aileron_panel_neutral(
                    ActuatorSide::Right,
                    AileronPanelPosition::Outward,
                    AileronActuatorPosition::Outward,
                )
                .run_waiting_for(Duration::from_secs(1));

            assert!(
                test_bed
                    .get_right_aileron_panel_position(AileronPanelPosition::Outward,)
                    .get::<ratio>()
                    > 0.35
            );
            assert!(
                test_bed
                    .get_right_aileron_panel_position(AileronPanelPosition::Outward,)
                    .get::<ratio>()
                    < 0.55
            );
        }

        #[test]
        fn outward_left_aileron_panel_responds_only_with_yellow_pressure_on_inward_jack() {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .start_eng3(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(5));

            assert!(!test_bed.is_green_pressure_switch_pressurised());
            assert!(test_bed.is_yellow_pressure_switch_pressurised());

            // Outward actuator on green hyds: shall not move
            test_bed = test_bed
                .reset_all_aileron_commands()
                .set_aileron_panel_neutral(
                    ActuatorSide::Left,
                    AileronPanelPosition::Outward,
                    AileronActuatorPosition::Outward,
                )
                .run_waiting_for(Duration::from_secs(1));

            assert!(
                test_bed
                    .get_left_aileron_panel_position(AileronPanelPosition::Outward)
                    .get::<ratio>()
                    < 0.1
            );

            test_bed = test_bed
                .reset_all_aileron_commands()
                .set_aileron_panel_neutral(
                    ActuatorSide::Left,
                    AileronPanelPosition::Outward,
                    AileronActuatorPosition::Inward,
                )
                .run_waiting_for(Duration::from_secs(1));

            assert!(
                test_bed
                    .get_left_aileron_panel_position(AileronPanelPosition::Outward,)
                    .get::<ratio>()
                    > 0.35
            );
            assert!(
                test_bed
                    .get_left_aileron_panel_position(AileronPanelPosition::Outward,)
                    .get::<ratio>()
                    < 0.55
            );
        }

        #[test]
        fn outward_right_aileron_panel_responds_only_with_yellow_pressure_on_inward_jack() {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .start_eng3(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(5));

            assert!(!test_bed.is_green_pressure_switch_pressurised());
            assert!(test_bed.is_yellow_pressure_switch_pressurised());

            // Outward actuator on green hyds: shall not move
            test_bed = test_bed
                .reset_all_aileron_commands()
                .set_aileron_panel_neutral(
                    ActuatorSide::Right,
                    AileronPanelPosition::Outward,
                    AileronActuatorPosition::Outward,
                )
                .run_waiting_for(Duration::from_secs(1));

            assert!(
                test_bed
                    .get_right_aileron_panel_position(AileronPanelPosition::Outward)
                    .get::<ratio>()
                    < 0.1
            );

            test_bed = test_bed
                .reset_all_aileron_commands()
                .set_aileron_panel_neutral(
                    ActuatorSide::Right,
                    AileronPanelPosition::Outward,
                    AileronActuatorPosition::Inward,
                )
                .run_waiting_for(Duration::from_secs(1));

            assert!(
                test_bed
                    .get_right_aileron_panel_position(AileronPanelPosition::Outward,)
                    .get::<ratio>()
                    > 0.35
            );
            assert!(
                test_bed
                    .get_right_aileron_panel_position(AileronPanelPosition::Outward,)
                    .get::<ratio>()
                    < 0.55
            );
        }

        #[test]
        fn middle_right_aileron_panel_responds_only_with_yellow_pressure_on_outward_jack() {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .reset_all_aileron_commands()
                .set_aileron_panel_neutral(
                    ActuatorSide::Right,
                    AileronPanelPosition::Middle,
                    AileronActuatorPosition::Outward,
                )
                .run_waiting_for(Duration::from_secs(1));

            assert!(!test_bed.is_green_pressure_switch_pressurised());
            assert!(!test_bed.is_yellow_pressure_switch_pressurised());

            assert!(
                test_bed
                    .get_right_aileron_panel_position(AileronPanelPosition::Middle)
                    .get::<ratio>()
                    < 0.1
            );

            test_bed = test_bed
                .reset_all_aileron_commands()
                .start_eng3(Ratio::new::<percent>(80.))
                .set_aileron_panel_neutral(
                    ActuatorSide::Right,
                    AileronPanelPosition::Middle,
                    AileronActuatorPosition::Outward,
                )
                .run_waiting_for(Duration::from_secs(5));

            assert!(!test_bed.is_green_pressure_switch_pressurised());
            assert!(test_bed.is_yellow_pressure_switch_pressurised());

            assert!(
                test_bed
                    .get_right_aileron_panel_position(AileronPanelPosition::Middle,)
                    .get::<ratio>()
                    > 0.35
            );
            assert!(
                test_bed
                    .get_right_aileron_panel_position(AileronPanelPosition::Middle,)
                    .get::<ratio>()
                    < 0.55
            );
        }

        #[test]
        fn middle_left_aileron_panel_responds_only_with_yellow_pressure_on_outward_jack() {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .reset_all_aileron_commands()
                .set_aileron_panel_neutral(
                    ActuatorSide::Left,
                    AileronPanelPosition::Middle,
                    AileronActuatorPosition::Outward,
                )
                .run_waiting_for(Duration::from_secs(1));

            assert!(!test_bed.is_green_pressure_switch_pressurised());
            assert!(!test_bed.is_yellow_pressure_switch_pressurised());

            assert!(
                test_bed
                    .get_left_aileron_panel_position(AileronPanelPosition::Middle)
                    .get::<ratio>()
                    < 0.1
            );

            test_bed = test_bed
                .reset_all_aileron_commands()
                .start_eng3(Ratio::new::<percent>(80.))
                .set_aileron_panel_neutral(
                    ActuatorSide::Left,
                    AileronPanelPosition::Middle,
                    AileronActuatorPosition::Outward,
                )
                .run_waiting_for(Duration::from_secs(5));

            assert!(!test_bed.is_green_pressure_switch_pressurised());
            assert!(test_bed.is_yellow_pressure_switch_pressurised());

            assert!(
                test_bed
                    .get_left_aileron_panel_position(AileronPanelPosition::Middle,)
                    .get::<ratio>()
                    > 0.35
            );
            assert!(
                test_bed
                    .get_left_aileron_panel_position(AileronPanelPosition::Middle,)
                    .get::<ratio>()
                    < 0.55
            );
        }

        #[test]
        fn middle_left_aileron_panel_responds_with_no_hyds_on_eha_jack() {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .reset_all_aileron_commands()
                .ac_ess_lost()
                .set_aileron_panel_neutral(
                    ActuatorSide::Left,
                    AileronPanelPosition::Middle,
                    AileronActuatorPosition::Inward,
                )
                .run_waiting_for(Duration::from_secs(1));

            assert!(!test_bed.is_green_pressure_switch_pressurised());
            assert!(!test_bed.is_yellow_pressure_switch_pressurised());

            assert!(
                test_bed
                    .get_left_aileron_panel_position(AileronPanelPosition::Middle)
                    .get::<ratio>()
                    < 0.1
            );

            test_bed = test_bed
                .reset_all_aileron_commands()
                .ac_ess_active()
                .set_aileron_panel_neutral(
                    ActuatorSide::Left,
                    AileronPanelPosition::Middle,
                    AileronActuatorPosition::Inward,
                )
                .run_waiting_for(Duration::from_secs(5));

            assert!(
                test_bed
                    .get_left_aileron_panel_position(AileronPanelPosition::Middle,)
                    .get::<ratio>()
                    > 0.35
            );
            assert!(
                test_bed
                    .get_left_aileron_panel_position(AileronPanelPosition::Middle,)
                    .get::<ratio>()
                    < 0.55
            );
        }

        #[test]
        fn middle_right_aileron_panel_responds_with_no_hyds_on_eha_jack() {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .reset_all_aileron_commands()
                .ac_ess_lost()
                .set_aileron_panel_neutral(
                    ActuatorSide::Right,
                    AileronPanelPosition::Middle,
                    AileronActuatorPosition::Inward,
                )
                .run_waiting_for(Duration::from_secs(1));

            assert!(!test_bed.is_green_pressure_switch_pressurised());
            assert!(!test_bed.is_yellow_pressure_switch_pressurised());

            assert!(
                test_bed
                    .get_right_aileron_panel_position(AileronPanelPosition::Middle)
                    .get::<ratio>()
                    < 0.1
            );

            test_bed = test_bed
                .reset_all_aileron_commands()
                .ac_ess_active()
                .set_aileron_panel_neutral(
                    ActuatorSide::Right,
                    AileronPanelPosition::Middle,
                    AileronActuatorPosition::Inward,
                )
                .run_waiting_for(Duration::from_secs(5));

            assert!(
                test_bed
                    .get_right_aileron_panel_position(AileronPanelPosition::Middle,)
                    .get::<ratio>()
                    > 0.35
            );
            assert!(
                test_bed
                    .get_right_aileron_panel_position(AileronPanelPosition::Middle,)
                    .get::<ratio>()
                    < 0.55
            );
        }

        #[test]
        fn inner_right_aileron_panel_responds_only_with_green_pressure_on_outward_jack() {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .reset_all_aileron_commands()
                .set_aileron_panel_neutral(
                    ActuatorSide::Right,
                    AileronPanelPosition::Inward,
                    AileronActuatorPosition::Outward,
                )
                .run_waiting_for(Duration::from_secs(1));

            assert!(!test_bed.is_green_pressure_switch_pressurised());
            assert!(!test_bed.is_yellow_pressure_switch_pressurised());

            assert!(
                test_bed
                    .get_right_aileron_panel_position(AileronPanelPosition::Inward)
                    .get::<ratio>()
                    < 0.1
            );

            // Outward actuator on green hyds: shall not move
            test_bed = test_bed
                .reset_all_aileron_commands()
                .start_eng1(Ratio::new::<percent>(80.))
                .set_aileron_panel_neutral(
                    ActuatorSide::Right,
                    AileronPanelPosition::Inward,
                    AileronActuatorPosition::Outward,
                )
                .run_waiting_for(Duration::from_secs(5));

            assert!(test_bed.is_green_pressure_switch_pressurised());
            assert!(!test_bed.is_yellow_pressure_switch_pressurised());

            assert!(
                test_bed
                    .get_right_aileron_panel_position(AileronPanelPosition::Inward,)
                    .get::<ratio>()
                    > 0.35
            );
            assert!(
                test_bed
                    .get_right_aileron_panel_position(AileronPanelPosition::Inward,)
                    .get::<ratio>()
                    < 0.55
            );
        }

        #[test]
        fn inner_left_aileron_panel_responds_only_with_green_pressure_on_outward_jack() {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .reset_all_aileron_commands()
                .set_aileron_panel_neutral(
                    ActuatorSide::Left,
                    AileronPanelPosition::Inward,
                    AileronActuatorPosition::Outward,
                )
                .run_waiting_for(Duration::from_secs(1));

            assert!(!test_bed.is_green_pressure_switch_pressurised());
            assert!(!test_bed.is_yellow_pressure_switch_pressurised());

            assert!(
                test_bed
                    .get_left_aileron_panel_position(AileronPanelPosition::Inward)
                    .get::<ratio>()
                    < 0.1
            );

            // Outward actuator on green hyds: shall not move
            test_bed = test_bed
                .reset_all_aileron_commands()
                .start_eng1(Ratio::new::<percent>(80.))
                .set_aileron_panel_neutral(
                    ActuatorSide::Left,
                    AileronPanelPosition::Inward,
                    AileronActuatorPosition::Outward,
                )
                .run_waiting_for(Duration::from_secs(5));

            assert!(test_bed.is_green_pressure_switch_pressurised());
            assert!(!test_bed.is_yellow_pressure_switch_pressurised());

            assert!(
                test_bed
                    .get_left_aileron_panel_position(AileronPanelPosition::Inward,)
                    .get::<ratio>()
                    > 0.35
            );
            assert!(
                test_bed
                    .get_left_aileron_panel_position(AileronPanelPosition::Inward,)
                    .get::<ratio>()
                    < 0.55
            );
        }

        #[test]
        fn inner_left_aileron_panel_responds_with_no_hyds_on_eha_jack() {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .reset_all_aileron_commands()
                .ac_eha_lost()
                .set_aileron_panel_neutral(
                    ActuatorSide::Left,
                    AileronPanelPosition::Inward,
                    AileronActuatorPosition::Inward,
                )
                .run_waiting_for(Duration::from_secs(1));

            assert!(!test_bed.is_green_pressure_switch_pressurised());
            assert!(!test_bed.is_yellow_pressure_switch_pressurised());

            assert!(
                test_bed
                    .get_left_aileron_panel_position(AileronPanelPosition::Inward)
                    .get::<ratio>()
                    < 0.1
            );

            test_bed = test_bed
                .reset_all_aileron_commands()
                .ac_eha_active()
                .set_aileron_panel_neutral(
                    ActuatorSide::Left,
                    AileronPanelPosition::Inward,
                    AileronActuatorPosition::Inward,
                )
                .run_waiting_for(Duration::from_secs(5));

            assert!(
                test_bed
                    .get_left_aileron_panel_position(AileronPanelPosition::Inward,)
                    .get::<ratio>()
                    > 0.35
            );
            assert!(
                test_bed
                    .get_left_aileron_panel_position(AileronPanelPosition::Inward,)
                    .get::<ratio>()
                    < 0.55
            );
        }

        #[test]
        fn inner_right_aileron_panel_responds_with_no_hyds_on_eha_jack() {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .reset_all_aileron_commands()
                .ac_eha_lost()
                .set_aileron_panel_neutral(
                    ActuatorSide::Right,
                    AileronPanelPosition::Inward,
                    AileronActuatorPosition::Inward,
                )
                .run_waiting_for(Duration::from_secs(1));

            assert!(!test_bed.is_green_pressure_switch_pressurised());
            assert!(!test_bed.is_yellow_pressure_switch_pressurised());

            assert!(
                test_bed
                    .get_right_aileron_panel_position(AileronPanelPosition::Inward)
                    .get::<ratio>()
                    < 0.1
            );

            test_bed = test_bed
                .reset_all_aileron_commands()
                .ac_eha_active()
                .set_aileron_panel_neutral(
                    ActuatorSide::Right,
                    AileronPanelPosition::Inward,
                    AileronActuatorPosition::Inward,
                )
                .run_waiting_for(Duration::from_secs(5));

            assert!(
                test_bed
                    .get_right_aileron_panel_position(AileronPanelPosition::Inward,)
                    .get::<ratio>()
                    > 0.35
            );
            assert!(
                test_bed
                    .get_right_aileron_panel_position(AileronPanelPosition::Inward,)
                    .get::<ratio>()
                    < 0.55
            );
        }

        #[rstest]
        #[case(2)]
        #[case(4)]
        #[case(6)]
        #[case(8)]
        fn green_right_spoilers_can_deploy_with_green_press(#[case] spoiler_id: usize) {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .start_eng3(Ratio::new::<percent>(80.))
                .set_right_spoiler_out(spoiler_id)
                .run_waiting_for(Duration::from_secs(5));

            assert!(!test_bed.is_green_pressure_switch_pressurised());
            assert!(test_bed.is_yellow_pressure_switch_pressurised());

            assert!(
                test_bed
                    .get_right_spoiler_position(spoiler_id)
                    .get::<ratio>()
                    < 0.1
            );

            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(5));

            assert!(
                test_bed
                    .get_right_spoiler_position(spoiler_id)
                    .get::<ratio>()
                    > 0.8
            );
        }

        #[rstest]
        #[case(2)]
        #[case(4)]
        #[case(6)]
        #[case(8)]
        fn green_left_spoilers_can_deploy_with_green_press(#[case] spoiler_id: usize) {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .start_eng3(Ratio::new::<percent>(80.))
                .set_left_spoiler_out(spoiler_id)
                .run_waiting_for(Duration::from_secs(5));

            assert!(!test_bed.is_green_pressure_switch_pressurised());
            assert!(test_bed.is_yellow_pressure_switch_pressurised());

            assert!(
                test_bed
                    .get_left_spoiler_position(spoiler_id)
                    .get::<ratio>()
                    < 0.1
            );

            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(5));

            assert!(
                test_bed
                    .get_left_spoiler_position(spoiler_id)
                    .get::<ratio>()
                    > 0.8
            );
        }

        #[rstest]
        #[case(1)]
        #[case(3)]
        #[case(5)]
        #[case(7)]
        fn yellow_right_spoilers_can_deploy_with_green_press(#[case] spoiler_id: usize) {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .start_eng1(Ratio::new::<percent>(80.))
                .set_right_spoiler_out(spoiler_id)
                .run_waiting_for(Duration::from_secs(5));

            assert!(test_bed.is_green_pressure_switch_pressurised());
            assert!(!test_bed.is_yellow_pressure_switch_pressurised());

            assert!(
                test_bed
                    .get_right_spoiler_position(spoiler_id)
                    .get::<ratio>()
                    < 0.1
            );

            test_bed = test_bed
                .start_eng3(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(5));

            assert!(
                test_bed
                    .get_right_spoiler_position(spoiler_id)
                    .get::<ratio>()
                    > 0.8
            );
        }

        #[rstest]
        #[case(1)]
        #[case(3)]
        #[case(5)]
        #[case(7)]
        fn yellow_left_spoilers_can_deploy_with_green_press(#[case] spoiler_id: usize) {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .start_eng1(Ratio::new::<percent>(80.))
                .set_left_spoiler_out(spoiler_id)
                .run_waiting_for(Duration::from_secs(5));

            assert!(test_bed.is_green_pressure_switch_pressurised());
            assert!(!test_bed.is_yellow_pressure_switch_pressurised());

            assert!(
                test_bed
                    .get_left_spoiler_position(spoiler_id)
                    .get::<ratio>()
                    < 0.1
            );

            test_bed = test_bed
                .start_eng3(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(5));

            assert!(
                test_bed
                    .get_left_spoiler_position(spoiler_id)
                    .get::<ratio>()
                    > 0.8
            );
        }

        #[test]
        fn spoilers_6_deploys_in_elec_mode() {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .set_left_spoilers_out()
                .set_right_spoilers_out()
                .run_waiting_for(Duration::from_secs(5));

            assert!(!test_bed.is_green_pressure_switch_pressurised());
            assert!(!test_bed.is_yellow_pressure_switch_pressurised());

            assert!(test_bed._get_mean_right_spoilers_position().get::<ratio>() < 0.01);

            assert!(test_bed.get_mean_left_spoilers_position().get::<ratio>() < 0.01);

            test_bed = test_bed
                .ac_ess_active()
                .set_left_spoiler_6_elec_backup_active()
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.get_left_spoiler_position(6).get::<ratio>() > 0.5);
            assert!(test_bed.get_right_spoiler_position(6).get::<ratio>() < 0.1);

            test_bed = test_bed
                .ac_ess_active()
                .set_right_spoiler_6_elec_backup_active()
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.get_left_spoiler_position(6).get::<ratio>() > 0.5);
            assert!(test_bed.get_right_spoiler_position(6).get::<ratio>() > 0.5);
        }

        #[test]
        fn pressure_state_at_init_one_simulation_step() {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            assert!(!test_bed.is_green_pressure_switch_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(50.));

            assert!(!test_bed.is_yellow_pressure_switch_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(50.));
        }

        #[test]
        fn pressure_state_after_5s() {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_waiting_for(Duration::from_secs(5));

            assert!(!test_bed.is_green_pressure_switch_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(50.));

            assert!(!test_bed.is_yellow_pressure_switch_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(50.));
        }

        #[test]
        fn nose_wheel_pin_detection() {
            let mut test_bed = test_bed_on_ground_with()
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
        fn green_edp_buildup() {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // Starting eng 1
            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(80.))
                .run_one_tick();

            // ALMOST No pressure
            assert!(!test_bed.is_green_pressure_switch_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(1000.));

            assert!(!test_bed.is_yellow_pressure_switch_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(1000.));

            // Waiting for 5s pressure should be at 3000 psi
            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(5));

            assert!(test_bed.is_green_pressure_switch_pressurised());
            assert!(test_bed.green_pressure() > Pressure::new::<psi>(4500.));

            assert!(!test_bed.is_yellow_pressure_switch_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(50.));

            // Stoping engine, pressure should fall in 20s
            test_bed = test_bed
                .stop_eng1()
                .run_waiting_for(Duration::from_secs(20));

            assert!(!test_bed.is_green_pressure_switch_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(1500.));

            assert!(!test_bed.is_yellow_pressure_switch_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(50.));
        }

        #[test]
        fn green_edp_disconnection() {
            let mut test_bed = test_bed_on_ground_with()
                .start_eng1(Ratio::new::<percent>(80.))
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_waiting_for(Duration::from_secs(5));

            assert!(test_bed.is_green_pressure_switch_pressurised());
            assert!(test_bed.green_pressure() > Pressure::new::<psi>(4500.));

            assert!(!test_bed.is_yellow_pressure_switch_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(50.));

            test_bed = test_bed
                .set_disconnect_engine_edp(2)
                .run_waiting_for(Duration::from_secs(5));

            assert!(test_bed.is_green_pressure_switch_pressurised());
            assert!(test_bed.green_pressure() > Pressure::new::<psi>(4500.));

            assert!(!test_bed.is_yellow_pressure_switch_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(50.));

            test_bed = test_bed
                .set_disconnect_engine_edp(1)
                .run_waiting_for(Duration::from_secs(20));

            assert!(!test_bed.is_green_pressure_switch_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(1500.));

            assert!(!test_bed.is_yellow_pressure_switch_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(50.));
        }

        #[test]
        fn yellow_edp_disconnection() {
            let mut test_bed = test_bed_on_ground_with()
                .start_eng3(Ratio::new::<percent>(80.))
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_waiting_for(Duration::from_secs(5));

            assert!(!test_bed.is_green_pressure_switch_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(50.));

            assert!(test_bed.is_yellow_pressure_switch_pressurised());
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(4500.));

            test_bed = test_bed
                .set_disconnect_engine_edp(4)
                .run_waiting_for(Duration::from_secs(5));

            assert!(!test_bed.is_green_pressure_switch_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(50.));

            assert!(test_bed.is_yellow_pressure_switch_pressurised());
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(4500.));

            test_bed = test_bed
                .set_disconnect_engine_edp(3)
                .run_waiting_for(Duration::from_secs(20));

            assert!(!test_bed.is_green_pressure_switch_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(50.));

            assert!(!test_bed.is_yellow_pressure_switch_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(1500.));
        }

        #[test]
        fn green_edp_no_fault_on_ground_eng_off() {
            let mut test_bed = test_bed_on_ground_with()
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
            let mut test_bed = test_bed_on_ground_with()
                .set_cold_dark_inputs()
                .in_flight()
                .engines_off()
                .run_one_tick();

            // EDP should be commanded on even without engine running
            assert!(test_bed.is_green_edp_commanded_on());

            assert!(!test_bed.is_green_pressure_switch_pressurised());
            assert!(!test_bed.is_yellow_pressure_switch_pressurised());
            // EDP should have a fault as we are in flight
            assert!(test_bed.green_edp_has_fault());
        }

        #[test]
        fn green_edp_fault_on_ground_eng_starting() {
            let mut test_bed = test_bed_on_ground_with()
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

            assert!(!test_bed.is_green_pressure_switch_pressurised());
            assert!(test_bed.green_edp_has_fault());

            test_bed = test_bed.run_waiting_for(Duration::from_secs(10));

            // When finally pressurised no fault
            assert!(test_bed.is_green_pressure_switch_pressurised());
            assert!(!test_bed.green_edp_has_fault());
        }

        #[test]
        fn yellow_edp_no_fault_on_ground_eng_off() {
            let mut test_bed = test_bed_on_ground_with()
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
            let mut test_bed = test_bed_on_ground_with()
                .set_cold_dark_inputs()
                .in_flight()
                .engines_off()
                .run_one_tick();

            // EDP should be commanded on even without engine running
            assert!(test_bed.is_yellow_edp_commanded_on());

            assert!(!test_bed.is_green_pressure_switch_pressurised());
            assert!(!test_bed.is_yellow_pressure_switch_pressurised());
            // EDP should have a fault as we are in flight
            assert!(test_bed.yellow_edp_has_fault());
        }

        #[test]
        fn yellow_epump_press_low_at_pump_on() {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // EDP should not be in fault low when cold start
            assert!(!test_bed.is_yellow_epump_a_press_low());

            // Starting epump
            test_bed = test_bed.set_yellow_e_pump_a(true).run_one_tick();

            // Pump commanded on but pressure couldn't rise enough: we are in fault low
            assert!(test_bed.is_yellow_epump_a_press_low());

            // Waiting for 20s pressure should be at 3000 psi
            test_bed = test_bed.run_waiting_for(Duration::from_secs(20));

            // No more fault LOW expected
            assert!(test_bed.is_yellow_pressure_switch_pressurised());
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2500.));
            assert!(!test_bed.is_yellow_epump_a_press_low());

            // Stoping epump, no fault expected
            test_bed = test_bed
                .set_yellow_e_pump_a(true)
                .run_waiting_for(Duration::from_secs(1));
            assert!(!test_bed.is_yellow_epump_a_press_low());
        }

        #[test]
        fn auto_brake_at_gear_retraction() {
            let mut test_bed = test_bed_on_ground_with()
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
                .set_gear_lever_up()
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
        fn brakes_inactive_in_flight() {
            let mut test_bed = test_bed_on_ground_with()
                .set_cold_dark_inputs()
                .in_flight()
                .set_gear_lever_up()
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
            let mut test_bed = test_bed_on_ground_with()
                .set_cold_dark_inputs()
                .in_flight()
                .set_gear_lever_up()
                .run_waiting_for(Duration::from_secs(10));

            // Now full brakes gear down
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(100.))
                .set_right_brake(Ratio::new::<percent>(100.))
                .set_gear_lever_down()
                .run_waiting_for(Duration::from_secs(1));

            // Brakes norm should work normally
            assert!(test_bed.get_brake_left_green_pressure() > Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() > Pressure::new::<psi>(50.));

            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));
        }

        #[test]
        fn brakes_alternate_active_in_flight_gear_down() {
            let mut test_bed = test_bed_on_ground_with()
                .set_cold_dark_inputs()
                .in_flight()
                .set_gear_lever_up()
                .run_waiting_for(Duration::from_secs(10));

            // Now full brakes gear down
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(100.))
                .set_right_brake(Ratio::new::<percent>(100.))
                .set_gear_lever_down()
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
            let mut test_bed = test_bed_on_ground_with()
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
                .set_yellow_e_pump_a(true)
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
            let mut test_bed = test_bed_on_ground_with()
                .set_cold_dark_inputs()
                .in_flight()
                .set_gear_lever_up()
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
        fn autobrakes_arming_according_to_set_variable() {
            let mut test_bed = test_bed_on_ground_with()
                .set_cold_dark_inputs()
                .on_the_ground()
                .set_park_brake(false)
                .start_eng1(Ratio::new::<percent>(100.))
                .start_eng2(Ratio::new::<percent>(100.))
                .run_waiting_for(Duration::from_secs(10));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::NONE);

            // set autobrake to LOW
            test_bed = test_bed
                .set_autobrake_low_with_set_variable()
                .run_waiting_for(Duration::from_secs(1));
            assert!(test_bed.autobrake_mode() == AutobrakeMode::LOW);

            // using the set variable again is still resulting in LOW
            // and not disarming
            test_bed = test_bed
                .set_autobrake_low_with_set_variable()
                .run_waiting_for(Duration::from_secs(1));
            assert!(test_bed.autobrake_mode() == AutobrakeMode::LOW);

            // set autobrake to MED
            test_bed = test_bed
                .set_autobrake_med_with_set_variable()
                .run_waiting_for(Duration::from_secs(1));
            assert!(test_bed.autobrake_mode() == AutobrakeMode::MED);

            // set autobrake to MAX
            test_bed = test_bed
                .set_autobrake_max_with_set_variable()
                .run_waiting_for(Duration::from_secs(1));
            assert!(test_bed.autobrake_mode() == AutobrakeMode::MAX);

            // set autobrake to DISARMED
            test_bed = test_bed
                .set_autobrake_disarmed_with_set_variable()
                .run_waiting_for(Duration::from_secs(1));
            assert!(test_bed.autobrake_mode() == AutobrakeMode::NONE);
        }

        #[test]
        fn autobrakes_does_not_disarm_if_askid_off_but_sim_not_ready() {
            let mut test_bed = test_bed_on_ground_with()
                .set_cold_dark_inputs()
                .in_flight()
                .sim_not_ready()
                .set_gear_lever_up()
                .run_waiting_for(Duration::from_secs(12));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::NONE);

            test_bed = test_bed
                .set_autobrake_med()
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::MED);

            // sim is not ready --> no disarm
            test_bed = test_bed
                .set_anti_skid(false)
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::MED);

            // sim is now ready --> disarm expected
            test_bed = test_bed.sim_ready().run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::NONE);
        }

        #[test]
        fn autobrakes_disarms_if_askid_off() {
            let mut test_bed = test_bed_on_ground_with()
                .set_cold_dark_inputs()
                .in_flight()
                .set_gear_lever_up()
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
            let mut test_bed = test_bed_on_ground_with()
                .set_cold_dark_inputs()
                .in_flight()
                .set_gear_lever_up()
                .run_waiting_for(Duration::from_secs(15));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::NONE);

            test_bed = test_bed
                .set_autobrake_max()
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::NONE);

            // using the set variable should also not work
            test_bed = test_bed
                .set_autobrake_max_with_set_variable()
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::NONE);
        }

        #[test]
        fn autobrakes_taxiing_wont_disarm_when_braking() {
            let mut test_bed = test_bed_on_ground_with()
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
            let mut test_bed = test_bed_on_ground_with()
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
                .set_deploy_ground_spoilers()
                .run_waiting_for(Duration::from_secs(6));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::MAX);
            assert!(test_bed.get_brake_left_green_pressure() > Pressure::new::<psi>(1000.));
            assert!(test_bed.get_brake_right_green_pressure() > Pressure::new::<psi>(1000.));

            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));
        }

        #[test]
        fn autobrakes_disengage_on_spoiler_retract() {
            let mut test_bed = test_bed_on_ground_with()
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
                .set_deploy_ground_spoilers()
                .run_waiting_for(Duration::from_secs(6));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::MAX);

            test_bed = test_bed
                .set_retract_ground_spoilers()
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::NONE);
            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
        }

        #[test]
        // Should disable with one pedal > 61° over max range of 79.4° thus 77%
        fn autobrakes_max_disengage_at_77_on_one_pedal_input() {
            let mut test_bed = test_bed_on_ground_with()
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
                .set_deploy_ground_spoilers()
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
        // Should disable with one pedals > 42° over max range of 79.4° thus 52%
        fn autobrakes_med_disengage_at_52_on_one_pedal_input() {
            let mut test_bed = test_bed_on_ground_with()
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
                .set_deploy_ground_spoilers()
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
        fn autobrakes_max_disarm_after_10s_in_flight() {
            let mut test_bed = test_bed_on_ground_with()
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
        fn autobrakes_does_not_disarm_after_10s_when_started_in_flight() {
            let mut test_bed = test_bed_in_flight_with()
                .set_cold_dark_inputs()
                .in_flight()
                .run_waiting_for(Duration::from_secs(1));

            test_bed = test_bed
                .set_autobrake_med_with_set_variable()
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::MED);

            test_bed = test_bed.in_flight().run_waiting_for(Duration::from_secs(6));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::MED);

            test_bed = test_bed.in_flight().run_waiting_for(Duration::from_secs(6));

            assert!(test_bed.autobrake_mode() == AutobrakeMode::MED);
        }

        #[test]
        fn controller_yellow_epump_is_activated_by_overhead_button() {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            assert!(!test_bed.query(|a| a.is_yellow_a_epump_controller_pressurising()));

            test_bed = test_bed.set_yellow_e_pump_a(true).run_one_tick();

            assert!(test_bed.query(|a| a.is_yellow_a_epump_controller_pressurising()));

            test_bed = test_bed.set_yellow_e_pump_a(false).run_one_tick();

            assert!(!test_bed.query(|a| a.is_yellow_a_epump_controller_pressurising()));
        }

        #[test]
        fn controller_yellow_epumps_unpowered_cant_command_pumps() {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .set_yellow_e_pump_a(true)
                .set_yellow_e_pump_b(true)
                .run_one_tick();

            assert!(test_bed.query(|a| a.is_yellow_a_epump_controller_pressurising()));
            assert!(test_bed.query(|a| a.is_yellow_b_epump_controller_pressurising()));

            test_bed = test_bed.dc_bus_1_lost().run_one_tick();

            assert!(!test_bed.query(|a| a.is_yellow_a_epump_controller_pressurising()));
            assert!(!test_bed.query(|a| a.is_yellow_b_epump_controller_pressurising()));
        }

        #[test]
        fn controller_green_epumps_unpowered_cant_command_pumps() {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .set_green_e_pump_a(true)
                .set_green_e_pump_b(true)
                .run_one_tick();

            assert!(test_bed.query(|a| a.is_green_epump_a_controller_pressurising()));
            assert!(test_bed.query(|a| a.is_green_epump_b_controller_pressurising()));

            test_bed = test_bed.dc_bus_2_lost().run_one_tick();

            assert!(!test_bed.query(|a| a.is_green_epump_a_controller_pressurising()));
            assert!(!test_bed.query(|a| a.is_green_epump_b_controller_pressurising()));
        }

        #[test]
        fn controller_engine_driven_pump1_overhead_button_logic_with_eng_on() {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            assert!(test_bed.query(|a| a.is_edp1a_green_pump_controller_pressurising()));

            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(65.))
                .run_one_tick();
            assert!(test_bed.query(|a| a.is_edp1a_green_pump_controller_pressurising()));

            test_bed = test_bed.set_green_ed_pump(false).run_one_tick();
            assert!(!test_bed.query(|a| a.is_edp1a_green_pump_controller_pressurising()));

            test_bed = test_bed.set_green_ed_pump(true).run_one_tick();
            assert!(test_bed.query(|a| a.is_edp1a_green_pump_controller_pressurising()));
        }

        #[test]
        fn controller_engine_driven_pump1_fire_overhead_released_stops_pump() {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .start_eng1(Ratio::new::<percent>(65.))
                .start_eng2(Ratio::new::<percent>(65.))
                .run_one_tick();

            assert!(test_bed.query(|a| a.is_edp1a_green_pump_controller_pressurising()));

            test_bed = test_bed.set_eng1_fire_button(true).run_one_tick();
            assert!(!test_bed.query(|a| a.is_edp1a_green_pump_controller_pressurising()));
        }

        #[test]
        fn controller_engine_driven_pump2a_fire_overhead_released_stops_pump() {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .start_eng1(Ratio::new::<percent>(65.))
                .start_eng2(Ratio::new::<percent>(65.))
                .run_one_tick();

            assert!(test_bed.query(|a| a.is_edp2a_yellow_pump_controller_pressurising()));

            test_bed = test_bed.set_eng2_fire_button(true).run_one_tick();
            assert!(!test_bed.query(|a| a.is_edp2a_yellow_pump_controller_pressurising()));
        }

        #[test]
        fn yellow_epump_a_unavailable_if_unpowered() {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            test_bed = test_bed
                .set_yellow_e_pump_a(true)
                .run_waiting_for(Duration::from_secs(10));

            // Yellow epump working
            assert!(test_bed.is_yellow_pressure_switch_pressurised());

            test_bed = test_bed
                .ac_bus_4_lost()
                .run_waiting_for(Duration::from_secs(25));

            // Yellow A epump still working as plugged on AC3
            assert!(test_bed.is_yellow_pressure_switch_pressurised());

            test_bed = test_bed
                .ac_bus_3_lost()
                .run_waiting_for(Duration::from_secs(25));

            // Yellow epump has stopped
            assert!(!test_bed.is_yellow_pressure_switch_pressurised());
        }

        #[test]
        fn yellow_epump_b_unavailable_if_unpowered() {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            test_bed = test_bed
                .set_yellow_e_pump_b(true)
                .run_waiting_for(Duration::from_secs(10));

            // Yellow epump working
            assert!(test_bed.is_yellow_pressure_switch_pressurised());

            test_bed = test_bed
                .ac_bus_3_lost()
                .run_waiting_for(Duration::from_secs(25));

            // Yellow B epump still working as plugged on AC4
            assert!(test_bed.is_yellow_pressure_switch_pressurised());

            test_bed = test_bed
                .ac_bus_4_lost()
                .run_waiting_for(Duration::from_secs(25));

            // Yellow epump has stopped
            assert!(!test_bed.is_yellow_pressure_switch_pressurised());
        }

        #[test]
        fn flaps_and_slats_declare_moving() {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_waiting_for(Duration::from_secs(5));

            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(80.))
                .start_eng2(Ratio::new::<percent>(80.))
                .start_eng3(Ratio::new::<percent>(80.))
                .start_eng4(Ratio::new::<percent>(80.))
                .set_flaps_handle_position(4)
                .run_waiting_for(Duration::from_secs(5));

            assert!(test_bed.is_flaps_moving());
        }

        #[test]
        fn no_pressure_no_flap_slats() {
            let mut test_bed = test_bed_on_ground_with()
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
        fn cargo_door_stays_closed_at_init() {
            let mut test_bed = test_bed_on_ground_with()
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
            let mut test_bed = test_bed_on_ground_with()
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
            let mut test_bed = test_bed_on_ground_with()
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
                HydraulicDoorController::DELAY_UNLOCK_TO_HYDRAULIC_CONTROL + Duration::from_secs(5),
            );

            assert!(test_bed.cargo_fwd_door_position() > current_position_unlocked);

            test_bed = test_bed
                .open_fwd_cargo_door()
                .run_waiting_for(Duration::from_secs_f64(30.));

            assert!(test_bed.cargo_fwd_door_position() > 0.85);
        }

        #[test]
        fn fwd_cargo_door_controller_opens_fwd_door_only() {
            let mut test_bed = test_bed_on_ground_with()
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
        fn cargo_door_controller_closes_the_door() {
            let mut test_bed = test_bed_on_ground_with()
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
        fn cargo_door_controller_closes_the_door_after_green_pump_auto_shutdown() {
            let mut test_bed = test_bed_on_ground_with()
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

            assert!(!test_bed.is_green_pressure_switch_pressurised());

            test_bed = test_bed
                .close_fwd_cargo_door()
                .run_waiting_for(Duration::from_secs_f64(40.));

            assert!(test_bed.is_cargo_fwd_door_locked_down());
            assert!(test_bed.cargo_fwd_door_position() <= 0.);
        }

        #[test]
        fn nose_steering_does_not_move_if_yellow_pressure_but_no_engine() {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .set_yellow_e_pump_a(false)
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
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .set_yellow_e_pump_a(false)
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
        fn yellow_epump_has_cavitation_at_low_air_press() {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            test_bed = test_bed
                .air_press_nominal()
                .set_yellow_e_pump_a(true)
                .run_waiting_for(Duration::from_secs_f64(10.));

            assert!(test_bed.yellow_pressure().get::<psi>() > 4500.);

            test_bed = test_bed
                .air_press_low()
                .run_waiting_for(Duration::from_secs_f64(10.));

            assert!(test_bed.yellow_pressure().get::<psi>() < 3500.);
        }

        #[test]
        fn ailerons_are_dropped_down_in_cold_and_dark() {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            assert!(test_bed.get_left_aileron_mean_position().get::<ratio>() < 0.1);
            assert!(test_bed.get_right_aileron_mean_position().get::<ratio>() < 0.1);
        }

        #[test]
        fn ailerons_do_not_respond_in_cold_and_dark() {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            test_bed = test_bed
                .set_ailerons_left_turn()
                .run_waiting_for(Duration::from_secs_f64(2.));

            assert!(test_bed.get_left_aileron_mean_position().get::<ratio>() < 0.1);
            assert!(test_bed.get_right_aileron_mean_position().get::<ratio>() < 0.1);

            test_bed = test_bed
                .set_ailerons_right_turn()
                .run_waiting_for(Duration::from_secs_f64(2.));

            assert!(test_bed.get_left_aileron_mean_position().get::<ratio>() < 0.1);
            assert!(test_bed.get_right_aileron_mean_position().get::<ratio>() < 0.1);
        }

        #[test]
        fn nose_wheel_steers_with_pushback_tug() {
            let mut test_bed = test_bed_on_ground_with()
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
        fn nominal_gear_retraction_extension_cycles_in_flight() {
            let mut test_bed = test_bed_on_ground_with().set_cold_dark_inputs().in_flight();

            assert!(test_bed.gear_system_state() == GearSystemState::AllDownLocked);

            test_bed = test_bed
                .set_gear_lever_up()
                .run_waiting_for(Duration::from_secs_f64(25.));
            assert!(test_bed.gear_system_state() == GearSystemState::AllUpLocked);

            test_bed = test_bed
                .set_gear_lever_down()
                .run_waiting_for(Duration::from_secs_f64(25.));
            assert!(test_bed.gear_system_state() == GearSystemState::AllDownLocked);

            test_bed = test_bed
                .set_gear_lever_up()
                .run_waiting_for(Duration::from_secs_f64(25.));
            assert!(test_bed.gear_system_state() == GearSystemState::AllUpLocked);
        }

        #[test]
        fn emergency_gear_extension_at_2_turns_open_doors() {
            let mut test_bed = test_bed_on_ground_with()
                .set_cold_dark_inputs()
                .on_the_ground()
                .turn_emergency_gear_extension_n_turns(1)
                .run_waiting_for(Duration::from_secs_f64(5.));

            assert!(test_bed.is_all_doors_really_up());

            test_bed = test_bed
                .turn_emergency_gear_extension_n_turns(2)
                .run_waiting_for(Duration::from_secs_f64(25.));

            assert!(test_bed.is_all_doors_really_down());
        }

        #[test]
        fn emergency_gear_extension_at_3_turns_release_gear() {
            let mut test_bed = test_bed_on_ground_with()
                .set_cold_dark_inputs()
                .in_flight()
                .set_gear_lever_up()
                .run_waiting_for(Duration::from_secs_f64(25.));

            assert!(test_bed.is_all_doors_really_up());
            assert!(test_bed.is_all_gears_really_up());

            test_bed = test_bed
                .set_green_ed_pump(false)
                .turn_emergency_gear_extension_n_turns(3)
                .run_waiting_for(Duration::from_secs_f64(35.));

            assert!(test_bed.is_all_doors_really_down());
            assert!(test_bed.is_all_gears_really_down());
        }

        #[test]
        fn complete_gear_cycle_do_not_change_fluid_volume() {
            let mut test_bed = test_bed_on_ground_with()
                .set_cold_dark_inputs()
                .in_flight()
                .set_gear_lever_down()
                .run_waiting_for(Duration::from_secs_f64(5.));

            assert!(test_bed.gear_system_state() == GearSystemState::AllDownLocked);

            let initial_fluid_quantity = test_bed.get_green_reservoir_volume();

            test_bed = test_bed
                .set_gear_lever_up()
                .run_waiting_for(Duration::from_secs_f64(20.));
            assert!(test_bed.gear_system_state() == GearSystemState::AllUpLocked);
            assert!(test_bed.is_all_doors_really_up());

            let uplocked_fluid_quantity = test_bed.get_green_reservoir_volume();

            assert!(initial_fluid_quantity - uplocked_fluid_quantity > Volume::new::<gallon>(1.));
            assert!(initial_fluid_quantity - uplocked_fluid_quantity < Volume::new::<gallon>(2.));

            test_bed = test_bed
                .set_gear_lever_down()
                .run_waiting_for(Duration::from_secs_f64(20.));
            assert!(test_bed.gear_system_state() == GearSystemState::AllDownLocked);
            assert!(test_bed.is_all_doors_really_up());

            let downlocked_fluid_quantity = test_bed.get_green_reservoir_volume();
            assert!(
                (initial_fluid_quantity - downlocked_fluid_quantity).abs()
                    < Volume::new::<gallon>(0.01)
            );
        }

        #[test]
        fn reverting_emergency_extension_do_not_change_fluid_volume() {
            let mut test_bed = test_bed_on_ground_with()
                .set_cold_dark_inputs()
                .in_flight()
                .set_gear_lever_down()
                .run_waiting_for(Duration::from_secs_f64(5.));

            assert!(test_bed.gear_system_state() == GearSystemState::AllDownLocked);

            test_bed = test_bed
                .set_gear_lever_up()
                .run_waiting_for(Duration::from_secs_f64(20.));
            assert!(test_bed.gear_system_state() == GearSystemState::AllUpLocked);
            assert!(test_bed.is_all_doors_really_up());

            let initial_uplocked_fluid_quantity = test_bed.get_green_reservoir_volume();

            test_bed = test_bed
                .set_gear_lever_down()
                .turn_emergency_gear_extension_n_turns(3)
                .run_waiting_for(Duration::from_secs_f64(30.));
            assert!(test_bed.is_all_gears_really_down());
            assert!(test_bed.is_all_doors_really_down());

            test_bed = test_bed
                .stow_emergency_gear_extension()
                .set_gear_lever_up()
                .run_waiting_for(Duration::from_secs_f64(20.));
            assert!(test_bed.is_all_gears_really_up());
            assert!(test_bed.is_all_doors_really_up());

            let final_uplocked_fluid_quantity = test_bed.get_green_reservoir_volume();

            assert!(
                (initial_uplocked_fluid_quantity - final_uplocked_fluid_quantity).abs()
                    < Volume::new::<gallon>(0.01)
            );
        }

        #[test]
        fn gear_init_up_if_spawning_in_air() {
            let test_bed = test_bed_in_flight_with()
                .set_cold_dark_inputs()
                .in_flight()
                .run_one_tick();

            assert!(test_bed.gear_system_state() == GearSystemState::AllUpLocked);
        }

        #[test]
        fn brakes_on_ground_work_after_emergency_extension() {
            let mut test_bed = test_bed_in_flight_with()
                .set_cold_dark_inputs()
                .in_flight()
                .set_gear_lever_up()
                .run_waiting_for(Duration::from_secs_f64(1.));

            assert!(test_bed.gear_system_state() == GearSystemState::AllUpLocked);

            test_bed = test_bed
                .turn_emergency_gear_extension_n_turns(3)
                .run_waiting_for(Duration::from_secs_f64(30.));
            assert!(test_bed.is_all_gears_really_down());
            assert!(test_bed.is_all_doors_really_down());

            test_bed = test_bed
                .on_the_ground_after_touchdown()
                .set_left_brake(Ratio::new::<ratio>(1.))
                .set_right_brake(Ratio::new::<ratio>(1.))
                .run_waiting_for(Duration::from_secs_f64(2.));

            assert!(test_bed.get_brake_left_green_pressure() > Pressure::new::<psi>(500.));
            assert!(test_bed.get_brake_right_green_pressure() > Pressure::new::<psi>(500.));
        }

        #[test]
        fn green_epump_buildup_auxiliary_section_when_cargo_doors() {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // Waiting for 5s pressure should be at 3000 psi
            test_bed = test_bed.open_fwd_cargo_door().run_waiting_for(
                HydraulicDoorController::DELAY_UNLOCK_TO_HYDRAULIC_CONTROL + Duration::from_secs(5),
            );

            test_bed = test_bed
                .open_fwd_cargo_door()
                .run_waiting_for(Duration::from_secs(5));

            assert!(!test_bed.is_green_pressure_switch_pressurised());
            assert!(test_bed.green_pressure() <= Pressure::new::<psi>(1500.));
            assert!(test_bed.green_pressure_auxiliary() > Pressure::new::<psi>(2800.));
        }

        #[test]
        fn yellow_epump_buildup_system_section_when_pushback() {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            test_bed = test_bed
                .set_pushback_state(true)
                .run_waiting_for(Duration::from_secs(5));

            assert!(!test_bed.is_green_pressure_switch_pressurised());
            assert!(test_bed.green_pressure() <= Pressure::new::<psi>(50.));
            assert!(test_bed.green_pressure_auxiliary() <= Pressure::new::<psi>(50.));

            // TODO dunno what to expect from leak measurement valve state there
            //assert!(test_bed.is_yellow_pressure_switch_pressurised());
            assert!(test_bed.yellow_pressure() >= Pressure::new::<psi>(2500.));
        }

        #[test]
        fn gears_do_not_deploy_with_all_lgciu_failed() {
            let mut test_bed = test_bed_in_flight_with()
                .set_cold_dark_inputs()
                .in_flight()
                .set_gear_lever_up()
                .run_waiting_for(Duration::from_secs_f64(1.));

            assert!(test_bed.gear_system_state() == GearSystemState::AllUpLocked);

            test_bed.fail(FailureType::LgciuPowerSupply(LgciuId::Lgciu1));
            test_bed.fail(FailureType::LgciuPowerSupply(LgciuId::Lgciu2));

            test_bed = test_bed.run_waiting_for(Duration::from_secs_f64(5.));
            assert!(test_bed.is_all_gears_really_up());
            assert!(test_bed.is_all_doors_really_up());

            test_bed = test_bed
                .set_gear_lever_down()
                .run_waiting_for(Duration::from_secs_f64(5.));

            assert!(test_bed.is_all_gears_really_up());
            assert!(test_bed.is_all_doors_really_up());
        }

        #[test]
        fn green_auxiliary_pump_can_buildup_auxiliary_section_when_cargo_doors_but_no_ac() {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .ac_bus_1_lost()
                .ac_bus_2_lost()
                .ac_bus_3_lost()
                .ac_bus_4_lost()
                .run_one_tick();

            // Waiting for 5s pressure should not rise due to no pump avail
            test_bed = test_bed.open_fwd_cargo_door().run_waiting_for(
                HydraulicDoorController::DELAY_UNLOCK_TO_HYDRAULIC_CONTROL + Duration::from_secs(5),
            );

            test_bed = test_bed
                .open_fwd_cargo_door()
                .run_waiting_for(Duration::from_secs(160));

            assert!(!test_bed.is_green_pressure_switch_pressurised());
            assert!(test_bed.green_pressure() <= Pressure::new::<psi>(1500.));
            assert!(test_bed.green_pressure_auxiliary() > Pressure::new::<psi>(500.));

            assert!(test_bed.is_cargo_fwd_door_locked_up());
        }

        #[test]
        fn green_epumps_can_buildup_auxiliary_section_when_cargo_doors_and_ac_available() {
            let mut test_bed = test_bed_on_ground_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .ac_ground_service_lost()
                .run_one_tick();

            // Waiting for 5s pressure should not rise due to no pump avail
            test_bed = test_bed
                .open_fwd_cargo_door()
                .open_aft_cargo_door()
                .run_waiting_for(
                    HydraulicDoorController::DELAY_UNLOCK_TO_HYDRAULIC_CONTROL
                        + Duration::from_secs(5),
                );

            test_bed = test_bed
                .open_fwd_cargo_door()
                .run_waiting_for(Duration::from_secs(35));

            assert!(!test_bed.is_green_pressure_switch_pressurised());
            assert!(test_bed.green_pressure() <= Pressure::new::<psi>(1500.));
            assert!(test_bed.green_pressure_auxiliary() > Pressure::new::<psi>(500.));

            assert!(test_bed.is_cargo_fwd_door_locked_up());
            assert!(test_bed.is_cargo_aft_door_locked_up());
        }
    }
}
