use uom::si::{f64::*, pressure::psi, ratio::ratio};

use crate::{
    shared::{random_from_normal_distribution, SectionPressure},
    simulation::{
        InitContext, Read, SimulationElement, SimulatorReader, SimulatorWriter, UpdateContext,
        VariableIdentifier, Write,
    },
};

use super::{
    aerodynamic_model::AerodynamicModel,
    linear_actuator::{
        ElectroHydrostaticPowered, HydraulicAssemblyController, HydraulicLinearActuatorAssembly,
        HydraulicLocking, LinearActuatorMode,
    },
    Actuator,
};

use std::time::Duration;

#[derive(PartialEq, Eq, Clone, Copy)]
pub enum DoorControlState {
    DownLocked = 0,
    NoControl = 1,
    HydControl = 2,
    UpLocked = 3,
}

pub struct HydraulicDoorController {
    requested_position_id: VariableIdentifier,

    control_state: DoorControlState,

    position_requested: Ratio,

    duration_in_no_control: Duration,
    duration_in_hyd_control: Duration,

    time_for_crew_to_activate_hydraulics: Duration,

    should_close_valves: bool,
    control_position_request: Ratio,
    should_unlock: bool,
}
impl HydraulicDoorController {
    // Duration which the hydraulic valves sends a open request when request is closing (this is done on real aircraft so uplock can be easily unlocked without friction)
    const UP_CONTROL_TIME_BEFORE_DOWN_CONTROL: Duration = Duration::from_millis(200);

    // Delay from the ground crew unlocking the door to the time they start requiring up movement in control panel
    pub const DELAY_UNLOCK_TO_HYDRAULIC_CONTROL: Duration = Duration::from_secs(5);
    const STD_DEVIATION_RAND_TIME_TO_HYD_CONTROL: Duration = Duration::from_millis(800);

    pub fn new(context: &mut InitContext, id: &str) -> Self {
        Self {
            requested_position_id: context.get_identifier(format!("{}_DOOR_CARGO_OPEN_REQ", id)),
            control_state: DoorControlState::DownLocked,
            position_requested: Ratio::new::<ratio>(0.),

            duration_in_no_control: Duration::from_secs(0),
            duration_in_hyd_control: Duration::from_secs(0),

            time_for_crew_to_activate_hydraulics: Self::random_hyd_control_time(),

            should_close_valves: true,
            control_position_request: Ratio::new::<ratio>(0.),
            should_unlock: false,
        }
    }

    fn random_hyd_control_time() -> Duration {
        Duration::from_secs_f64(random_from_normal_distribution(
            Self::DELAY_UNLOCK_TO_HYDRAULIC_CONTROL.as_secs_f64(),
            Self::STD_DEVIATION_RAND_TIME_TO_HYD_CONTROL.as_secs_f64(),
        ))
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        door: &CargoDoor,
        current_pressure: &impl SectionPressure,
    ) {
        self.control_state =
            self.determine_control_state_and_lock_action(door, current_pressure.pressure());
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
                if self.duration_in_no_control > self.time_for_crew_to_activate_hydraulics =>
            {
                self.should_unlock = false;
                self.time_for_crew_to_activate_hydraulics = Self::random_hyd_control_time();

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

    pub fn should_pressurise_hydraulics(&self) -> bool {
        (self.control_state == DoorControlState::UpLocked
            && self.position_requested < Ratio::new::<ratio>(1.))
            || self.control_state == DoorControlState::HydControl
    }

    pub fn control_state(&self) -> DoorControlState {
        self.control_state
    }
}
impl HydraulicAssemblyController for HydraulicDoorController {
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
impl SimulationElement for HydraulicDoorController {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.position_requested = Ratio::new::<ratio>(reader.read(&self.requested_position_id));
    }
}
impl HydraulicLocking for HydraulicDoorController {}
impl ElectroHydrostaticPowered for HydraulicDoorController {}

pub struct CargoDoor {
    hydraulic_assembly: HydraulicLinearActuatorAssembly<1>,

    position_id: VariableIdentifier,
    locked_id: VariableIdentifier,
    position: Ratio,

    is_locked: bool,

    aerodynamic_model: AerodynamicModel,
}
impl CargoDoor {
    pub fn new(
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

    pub fn is_locked(&self) -> bool {
        self.is_locked
    }

    pub fn actuator(&mut self) -> &mut impl Actuator {
        self.hydraulic_assembly.actuator(0)
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        cargo_door_controller: &(impl HydraulicAssemblyController
              + HydraulicLocking
              + ElectroHydrostaticPowered),
        current_pressure: &impl SectionPressure,
    ) {
        self.aerodynamic_model
            .update_body(context, self.hydraulic_assembly.body());
        self.hydraulic_assembly.update(
            context,
            std::slice::from_ref(cargo_door_controller),
            [current_pressure.pressure()],
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
