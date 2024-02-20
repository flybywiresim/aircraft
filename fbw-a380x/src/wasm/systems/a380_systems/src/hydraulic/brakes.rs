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

#[derive(PartialEq, Clone, Copy)]
pub enum A380AutobrakeKnobPosition {
    DISARM = 0,
    LOW = 1,
    L1 = 2,
    L2 = 3,
    HIGH = 4,
    BTV = 5,
}
impl From<f64> for A380AutobrakeKnobPosition {
    fn from(value: f64) -> Self {
        match value as u8 {
            0 => A380AutobrakeKnobPosition::DISARM,
            1 => A380AutobrakeKnobPosition::LOW,
            2 => A380AutobrakeKnobPosition::L1,
            3 => A380AutobrakeKnobPosition::L2,
            4 => A380AutobrakeKnobPosition::HIGH,
            5 => A380AutobrakeKnobPosition::BTV,
            _ => A380AutobrakeKnobPosition::DISARM,
        }
    }
}

#[derive(PartialEq, Clone, Copy)]
pub enum A380AutobrakeMode {
    DISARM = 0,
    LOW = 1,
    L1 = 2,
    L2 = 3,
    HIGH = 4,
    BTV = 5,
    RTO = 6,
    ROP = 7,
}
impl From<f64> for A380AutobrakeMode {
    fn from(value: f64) -> Self {
        match value as u8 {
            0 => A380AutobrakeMode::DISARM,
            1 => A380AutobrakeMode::LOW,
            2 => A380AutobrakeMode::L1,
            3 => A380AutobrakeMode::L2,
            4 => A380AutobrakeMode::HIGH,
            5 => A380AutobrakeMode::BTV,
            6 => A380AutobrakeMode::RTO,
            7 => A380AutobrakeMode::ROP,
            _ => A380AutobrakeMode::DISARM,
        }
    }
}

pub struct A380AutobrakePanel {
    selected_mode_id: VariableIdentifier,

    selected_mode: A380AutobrakeKnobPosition,
    rto_button: MomentaryOnPushButton,
}
impl A380AutobrakePanel {
    pub fn new(context: &mut InitContext) -> A380AutobrakePanel {
        A380AutobrakePanel {
            selected_mode_id: context.get_identifier("AUTOBRAKES_SELECTED_MODE".to_owned()),

            selected_mode: A380AutobrakeKnobPosition::DISARM,
            rto_button: MomentaryOnPushButton::new(context, "AUTOBRK_RTO_ARM"),
        }
    }

    pub fn selected_mode(&self) -> A380AutobrakeKnobPosition {
        self.selected_mode
    }

    pub fn rto_selected(&self) -> bool {
        self.rto_button.is_on()
    }
}
impl SimulationElement for A380AutobrakePanel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.rto_button.accept(visitor);

        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        let raw_read: f64 = reader.read(&self.selected_mode_id);
        self.selected_mode = raw_read.into();

        println!("PANEL Reading sel mode: {:1}", raw_read);
    }
}

struct A380AutobrakeKnobSelectorSolenoid {
    disarm_knob_id: VariableIdentifier,

    powered_by: ElectricalBusType,
    is_powered: bool,

    disarm_request: bool,
}
impl A380AutobrakeKnobSelectorSolenoid {
    fn new(context: &mut InitContext, powered_by: ElectricalBusType) -> Self {
        Self {
            disarm_knob_id: context.get_identifier("AUTOBRAKES_DISARM_KNOB_REQ".to_owned()),

            powered_by,
            is_powered: true,

            disarm_request: false,
        }
    }

    fn disarm(&mut self) {
        self.disarm_request = self.is_powered;
    }
}
impl SimulationElement for A380AutobrakeKnobSelectorSolenoid {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.disarm_knob_id, self.disarm_request);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by)
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
    mode: A380AutobrakeMode,

    arming_is_allowed_by_bcu: bool,
    left_brake_pedal_input: Ratio,
    right_brake_pedal_input: Ratio,

    ground_spoilers_are_deployed: bool,
    last_ground_spoilers_are_deployed: bool,

    should_disarm_after_time_in_flight: DelayedPulseTrueLogicGate,
    should_reject_rto_mode_after_time_in_flight: DelayedTrueLogicGate,

    autobrake_knob: A380AutobrakeKnobSelectorSolenoid,

    external_disarm_event: bool,
}
impl A380AutobrakeController {
    const DURATION_OF_FLIGHT_TO_DISARM_AUTOBRAKE_SECS: f64 = 10.;

    // Dynamic decel target map versus time for any mode that needs it
    const LOW_MODE_DECEL_PROFILE_ACCEL_MS2: [f64; 4] = [4., 4., 0., -2.];
    const LOW_MODE_DECEL_PROFILE_TIME_S: [f64; 4] = [0., 1.99, 2., 4.5];

    const L1_MODE_DECEL_PROFILE_ACCEL_MS2: [f64; 4] = [4., 4., 0., -2.5];
    const L1_MODE_DECEL_PROFILE_TIME_S: [f64; 4] = [0., 1.99, 2., 4.5];

    const L2_MODE_DECEL_PROFILE_ACCEL_MS2: [f64; 4] = [4., 4., 0., -3.];
    const L2_MODE_DECEL_PROFILE_TIME_S: [f64; 4] = [0., 1.99, 2., 4.5];

    const HIGH_MODE_DECEL_PROFILE_ACCEL_MS2: [f64; 5] = [4., 4., 0., -2., -3.5];
    const HIGH_MODE_DECEL_PROFILE_TIME_S: [f64; 5] = [0., 1.99, 2., 2.5, 4.];

    const RTO_MODE_DECEL_TARGET_MS2: f64 = -6.;
    const OFF_MODE_DECEL_TARGET_MS2: f64 = 5.;

    const MARGIN_PERCENT_TO_TARGET_TO_SHOW_DECEL_IN_LO_MED: f64 = 80.;
    const TARGET_TO_SHOW_DECEL_IN_MAX_MS2: f64 = -2.7;

    pub fn new(context: &mut InitContext) -> A380AutobrakeController {
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
            mode: A380AutobrakeMode::DISARM,
            arming_is_allowed_by_bcu: context.is_in_flight(),
            left_brake_pedal_input: Ratio::new::<percent>(0.),
            right_brake_pedal_input: Ratio::new::<percent>(0.),
            ground_spoilers_are_deployed: false,
            last_ground_spoilers_are_deployed: false,
            should_disarm_after_time_in_flight: DelayedPulseTrueLogicGate::new(
                Duration::from_secs_f64(Self::DURATION_OF_FLIGHT_TO_DISARM_AUTOBRAKE_SECS),
            )
            .starting_as(context.is_in_flight(), false),
            should_reject_rto_mode_after_time_in_flight: DelayedTrueLogicGate::new(
                Duration::from_secs_f64(Self::DURATION_OF_FLIGHT_TO_DISARM_AUTOBRAKE_SECS),
            )
            .starting_as(context.is_in_flight()),

            // Powered on VDC BUS 2 -> 806GG cb
            autobrake_knob: A380AutobrakeKnobSelectorSolenoid::new(
                context,
                ElectricalBusType::DirectCurrent(2),
            ),

            external_disarm_event: false,
        }
    }

    fn spoilers_retracted_during_this_update(&self) -> bool {
        !self.ground_spoilers_are_deployed && self.last_ground_spoilers_are_deployed
    }

    pub fn brake_output(&self) -> Ratio {
        Ratio::new::<ratio>(self.deceleration_governor.output())
    }

    fn determine_mode(
        &mut self,
        context: &UpdateContext,
        autobrake_panel: &mut A380AutobrakePanel,
    ) -> A380AutobrakeMode {
        if self.should_disarm(context) {
            self.autobrake_knob.disarm();
        }

        if autobrake_panel.rto_selected() {
            A380AutobrakeMode::RTO
        } else {
            match autobrake_panel.selected_mode() {
                A380AutobrakeKnobPosition::DISARM => A380AutobrakeMode::DISARM,
                A380AutobrakeKnobPosition::LOW => A380AutobrakeMode::LOW,
                A380AutobrakeKnobPosition::L1 => A380AutobrakeMode::L1,
                A380AutobrakeKnobPosition::L2 => A380AutobrakeMode::L2,
                A380AutobrakeKnobPosition::HIGH => A380AutobrakeMode::HIGH,
                A380AutobrakeKnobPosition::BTV => A380AutobrakeMode::BTV,
            }
        }
    }

    fn should_engage_deceleration_governor(&self, context: &UpdateContext) -> bool {
        self.is_armed() && self.ground_spoilers_are_deployed && !self.should_disarm(context)
    }

    fn is_armed(&self) -> bool {
        self.mode != A380AutobrakeMode::DISARM
    }

    fn is_decelerating(&self) -> bool {
        match self.mode {
            A380AutobrakeMode::DISARM => false,
            A380AutobrakeMode::LOW | A380AutobrakeMode::L1 | A380AutobrakeMode::L2 => {
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
            A380AutobrakeMode::DISARM => false,
            A380AutobrakeMode::LOW | A380AutobrakeMode::L1 | A380AutobrakeMode::L2 => {
                self.left_brake_pedal_input > Ratio::new::<percent>(53.)
                    || self.right_brake_pedal_input > Ratio::new::<percent>(53.)
                    || (self.left_brake_pedal_input > Ratio::new::<percent>(11.)
                        && self.right_brake_pedal_input > Ratio::new::<percent>(11.))
            }
            A380AutobrakeMode::HIGH => {
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
            || (self.mode == A380AutobrakeMode::RTO
                && self.should_reject_rto_mode_after_time_in_flight.output())
    }

    fn calculate_target(&mut self) -> Acceleration {
        Acceleration::new::<meter_per_second_squared>(match self.mode {
            A380AutobrakeMode::DISARM => Self::OFF_MODE_DECEL_TARGET_MS2,
            A380AutobrakeMode::LOW => interpolation(
                &Self::LOW_MODE_DECEL_PROFILE_TIME_S,
                &Self::LOW_MODE_DECEL_PROFILE_ACCEL_MS2,
                self.deceleration_governor.time_engaged().as_secs_f64(),
            ),
            A380AutobrakeMode::L1 => interpolation(
                &Self::L1_MODE_DECEL_PROFILE_TIME_S,
                &Self::L1_MODE_DECEL_PROFILE_ACCEL_MS2,
                self.deceleration_governor.time_engaged().as_secs_f64(),
            ),
            A380AutobrakeMode::L2 => interpolation(
                &Self::L2_MODE_DECEL_PROFILE_TIME_S,
                &Self::L2_MODE_DECEL_PROFILE_ACCEL_MS2,
                self.deceleration_governor.time_engaged().as_secs_f64(),
            ),
            A380AutobrakeMode::HIGH => interpolation(
                &Self::HIGH_MODE_DECEL_PROFILE_TIME_S,
                &Self::HIGH_MODE_DECEL_PROFILE_ACCEL_MS2,
                self.deceleration_governor.time_engaged().as_secs_f64(),
            ),
            A380AutobrakeMode::BTV => self.compute_btv_decel_target_ms2(),
            A380AutobrakeMode::RTO | A380AutobrakeMode::ROP => Self::RTO_MODE_DECEL_TARGET_MS2,
            _ => Self::OFF_MODE_DECEL_TARGET_MS2,
        })
    }

    fn compute_btv_decel_target_ms2(&self) -> f64 {
        // Placeholder BTV deceleration

        interpolation(
            &Self::L2_MODE_DECEL_PROFILE_TIME_S,
            &Self::L2_MODE_DECEL_PROFILE_ACCEL_MS2,
            self.deceleration_governor.time_engaged().as_secs_f64(),
        )
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
        self.should_reject_rto_mode_after_time_in_flight
            .update(context, in_flight_lgciu1 && in_flight_lgciu2);

        self.arming_is_allowed_by_bcu = allow_arming;
        self.left_brake_pedal_input = pedal_input_left;
        self.right_brake_pedal_input = pedal_input_right;
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        autobrake_panel: &mut A380AutobrakePanel,
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
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.autobrake_knob.accept(visitor);

        visitor.visit(self);
    }

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
