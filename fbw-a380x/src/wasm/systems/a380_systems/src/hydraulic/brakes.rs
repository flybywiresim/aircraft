use systems::{
    accept_iterable,
    engine::Engine,
    hydraulic::{
        aerodynamic_model::AerodynamicModel,
        brake_circuit::{
            AutobrakeDecelerationGovernor, AutobrakeMode, AutobrakePanel,
            BrakeAccumulatorCharacteristics, BrakeCircuit, BrakeCircuitController,
        },
        bypass_pin::BypassPin,
        cargo_doors::{CargoDoor, HydraulicDoorController},
        flap_slat::FlapSlatAssembly,
        landing_gear::{GearGravityExtension, GearSystemController, HydraulicGearSystem},
        linear_actuator::{
            Actuator, BoundedLinearLength, ElectroHydrostaticActuatorType,
            ElectroHydrostaticBackup, ElectroHydrostaticPowered, HydraulicAssemblyController,
            HydraulicLinearActuatorAssembly, HydraulicLocking, LinearActuatedRigidBodyOnHingeAxis,
            LinearActuator, LinearActuatorCharacteristics, LinearActuatorMode,
        },
        nose_steering::{
            SteeringActuator, SteeringAngleLimiter, SteeringController, SteeringRatioToAngle,
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
    landing_gear::{GearSystemSensors, LandingGearControlInterfaceUnitSet, TiltingGear},
    overhead::{AutoOffFaultPushButton, AutoOnFaultPushButton, MomentaryOnPushButton},
    shared::{
        interpolation, random_from_range, update_iterator::MaxStepLoop, AdirsDiscreteOutputs,
        AirbusElectricPumpId, AirbusEngineDrivenPumpId, CargoDoorLocked, DelayedFalseLogicGate,
        DelayedPulseTrueLogicGate, DelayedTrueLogicGate, ElectricalBusType, ElectricalBuses,
        EngineFirePushButtons, GearWheel, HydraulicColor, LandingGearHandle, LgciuInterface,
        LgciuWeightOnWheels, ReservoirAirPressure, SectionPressure, SurfacesPositions,
    },
    simulation::{
        InitContext, Read, Reader, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, StartState, UpdateContext, VariableIdentifier, Write,
    },
};

#[derive(PartialEq)]
pub enum A380AutobrakePosition {
    DISARM = 0,
    LOW = 1,
    L1 = 2,
    L2 = 3,
    HIGH = 4,
    BTV = 5,
}
impl From<f64> for A380AutobrakePosition {
    fn from(value: f64) -> Self {
        match value as u8 {
            0 => A380AutobrakePosition::DISARM,
            1 => A380AutobrakePosition::LOW,
            2 => A380AutobrakePosition::L1,
            3 => A380AutobrakePosition::L2,
            4 => A380AutobrakePosition::HIGH,
            5 => A380AutobrakePosition::BTV,
            _ => A380AutobrakePosition::DISARM,
        }
    }
}

pub struct A380AutobrakePanel {
    selected_mode_id: VariableIdentifier,
    disarm_knob_id: VariableIdentifier,

    selected_mode: A380AutobrakePosition,
    rto_button: MomentaryOnPushButton,

    request_disarm_knob: bool,
}
impl A380AutobrakePanel {
    pub fn new(context: &mut InitContext) -> A380AutobrakePanel {
        A380AutobrakePanel {
            selected_mode_id: context.get_identifier("AUTOBRAKES_SELECTED_MODE".to_owned()),
            disarm_knob_id: context.get_identifier("AUTOBRAKES_DISARM_KNOB_REQ".to_owned()),

            selected_mode: A380AutobrakePosition::DISARM,

            rto_button: MomentaryOnPushButton::new(context, "AUTOBRK_RTO_ARM"),

            request_disarm_knob: false,
        }
    }

    pub fn disarm_knob(&self) {
        self.request_disarm_knob = self.selected_mode != A380AutobrakePosition::DISARM;
    }

    pub fn selected_mode(&self) -> A380AutobrakePosition {
        self.selected_mode
    }
}
impl SimulationElement for A380AutobrakePanel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.rto_button.accept(visitor);

        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.selected_mode = reader.read(&self.selected_mode_id).into();
    }
}
