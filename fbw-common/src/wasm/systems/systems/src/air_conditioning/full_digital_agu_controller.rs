use crate::{
    pneumatic::{EngineModeSelector, EngineState, PneumaticValveSignal},
    shared::{
        pid::PidController, ControllerSignal, ElectricalBusType, ElectricalBuses,
        EngineBleedPushbutton, EngineCorrectedN1, EngineFirePushButtons, EngineStartState,
        PackFlowValveState, PneumaticBleed,
    },
    simulation::{SimulationElement, UpdateContext},
};

use super::{
    acs_controller::Pack, AirConditioningOverheadShared, PackFlow, PackFlowControllers,
    PackFlowValveSignal, PressurizationOverheadShared,
};

use uom::si::{
    f64::*,
    mass_rate::kilogram_per_second,
    ratio::{percent, ratio},
};

// Bool signifies failure - future work this can be different types of failure
#[derive(Clone, Copy)]
enum OperatingChannel {
    FDACChannelOne(bool),
    FDACChannelTwo(bool),
}

enum FdacFault {
    OneChannelFault,
    BothChannelsFault,
    PowerLoss,
}

impl OperatingChannel {
    fn has_fault(&self) -> bool {
        // TODO: Improve
        matches!(self, OperatingChannel::FDACChannelOne(true))
            || matches!(self, OperatingChannel::FDACChannelTwo(true))
    }

    fn switch(self) -> Self {
        if matches!(self, OperatingChannel::FDACChannelOne(_)) {
            OperatingChannel::FDACChannelTwo(false)
        } else {
            OperatingChannel::FDACChannelOne(false)
        }
    }
}

pub struct FullDigitalAGUController<const ENGINES: usize> {
    id: usize, // 1 (LH) or 2 (RH)
    active_channel: OperatingChannel,
    flow_control: FDACFlowControl<ENGINES>,
    // agu_control
    powered_by: Vec<ElectricalBusType>,
    is_powered: bool,
    fault: Option<FdacFault>,
}

impl<const ENGINES: usize> FullDigitalAGUController<ENGINES> {
    pub fn new(fdac_id: usize, powered_by: Vec<ElectricalBusType>) -> Self {
        Self {
            id: fdac_id,
            active_channel: OperatingChannel::FDACChannelOne(false),
            flow_control: FDACFlowControl::new(fdac_id),
            // agu_control
            powered_by,
            is_powered: false,
            fault: None,
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        acs_overhead: &impl AirConditioningOverheadShared,
        any_door_open: bool,
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        engines: [&impl EngineCorrectedN1; ENGINES],
        pack_flow_demand: MassRate,
        pneumatic: &(impl EngineStartState + PackFlowValveState + PneumaticBleed),
        pneumatic_overhead: &impl EngineBleedPushbutton<ENGINES>,
        pressurization_overhead: &impl PressurizationOverheadShared,
    ) {
        self.fault_determination();

        if self.fault.is_none() {
            self.flow_control.update(
                context,
                acs_overhead,
                any_door_open,
                engine_fire_push_buttons,
                engines,
                pack_flow_demand,
                pneumatic,
                pneumatic_overhead,
                pressurization_overhead,
            )
        }
    }

    fn fault_determination(&mut self) {
        self.fault = {
            if !self.is_powered {
                Some(FdacFault::PowerLoss)
            } else if self.active_channel.has_fault() {
                // TODO: At the moment switching channels always clears the fault
                self.active_channel.switch();
                Some(FdacFault::OneChannelFault)
            } else {
                // This is unreachable - implement failures
                Some(FdacFault::BothChannelsFault)
            }
        }
    }

    fn fdac_id(&self) -> usize {
        self.id
    }
}

impl<const ENGINES: usize> PackFlow for FullDigitalAGUController<ENGINES> {
    fn pack_flow(&self) -> MassRate {
        self.flow_control.pack_flow()
    }
}

impl<const ENGINES: usize> PackFlowControllers for FullDigitalAGUController<ENGINES> {
    fn pack_flow_controller(
        &self,
        fcv_id: usize,
    ) -> Box<dyn ControllerSignal<PackFlowValveSignal>> {
        self.flow_control.pack_flow_controller(fcv_id)
    }
}

impl<const ENGINES: usize> SimulationElement for FullDigitalAGUController<ENGINES> {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = self.powered_by.iter().all(|&p| buses.is_powered(p));
    }
}

/// Each FDAC controls two FCV, FDAC 1 controls the left side (engine 1 & 2)
/// and FDAC 2 controls the right side (engine 3 & 4)
struct FDACFlowControl<const ENGINES: usize> {
    fdac_id: usize, // 1 or 2
    flow_control_valves_controller: [PackFlowController<ENGINES>; 2],
    fcv_open_allowed: bool,
    should_open_fcv: [bool; 2],
}

impl<const ENGINES: usize> FDACFlowControl<ENGINES> {
    fn new(fdac_id: usize) -> Self {
        let flow_control_valves_controller: [PackFlowController<ENGINES>; 2] = [1, 2]
            .iter()
            .map(|id| PackFlowController::new(id + ((fdac_id == 2) as usize * 2)))
            .collect::<Vec<PackFlowController<ENGINES>>>()
            .try_into()
            .unwrap_or_else(|v: Vec<PackFlowController<ENGINES>>| {
                panic!("Expected a Vec of length {} but it was {}", 2, v.len())
            });
        Self {
            fdac_id,
            flow_control_valves_controller,
            fcv_open_allowed: false,
            should_open_fcv: [false; 2],
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        acs_overhead: &impl AirConditioningOverheadShared,
        any_door_open: bool,
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        engines: [&impl EngineCorrectedN1; ENGINES],
        pack_flow_demand: MassRate,
        pneumatic: &(impl EngineStartState + PackFlowValveState + PneumaticBleed),
        pneumatic_overhead: &impl EngineBleedPushbutton<ENGINES>,
        pressurization_overhead: &impl PressurizationOverheadShared,
    ) {
        self.fcv_open_allowed = self.fcv_open_allowed_determination(
            acs_overhead,
            any_door_open,
            engine_fire_push_buttons,
            pressurization_overhead,
            pneumatic,
        );

        let fcv_id: [usize; 2] = [1, 2]
            .iter_mut()
            .map(|i| *i + ((self.fdac_id == 2) as usize * 2))
            .collect::<Vec<usize>>()
            .try_into()
            .unwrap_or_else(|v: Vec<usize>| {
                panic!("Expected a Vec of length {} but it was {}", 2, v.len())
            });
        self.should_open_fcv = fcv_id
            .iter()
            .map(|id| {
                self.fcv_open_allowed
                    && self.can_move_fcv(engines, *id, pneumatic, pneumatic_overhead)
            })
            .collect::<Vec<bool>>()
            .try_into()
            .unwrap_or_else(|v: Vec<bool>| {
                panic!(
                    "Expected a Vec of length {} but it was {}",
                    self.should_open_fcv.len(),
                    v.len()
                )
            });

        self.flow_control_valves_controller
            .iter_mut()
            .zip(self.should_open_fcv)
            .for_each(|(controller, should_open_fcv)| {
                controller.update(context, should_open_fcv, pack_flow_demand, pneumatic)
            });
    }

    fn fcv_open_allowed_determination(
        &mut self,
        acs_overhead: &impl AirConditioningOverheadShared,
        any_door_open: bool,
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        pressurization_overhead: &impl PressurizationOverheadShared,
        pneumatic: &(impl PneumaticBleed + EngineStartState),
    ) -> bool {
        match Pack::from(self.fdac_id) {
            Pack(1) => {
                acs_overhead.pack_pushbuttons_state()[0]
                    && !(pneumatic.left_engine_state() == EngineState::Starting)
                    && (!(pneumatic.right_engine_state() == EngineState::Starting)
                        || !pneumatic.engine_crossbleed_is_on())
                    && (pneumatic.engine_mode_selector() != EngineModeSelector::Ignition
                        || (pneumatic.left_engine_state() != EngineState::Off
                            && pneumatic.left_engine_state() != EngineState::Shutting))
                    && !(engine_fire_push_buttons.is_released(1)
                        || engine_fire_push_buttons.is_released(2))
                    && !pressurization_overhead.ditching_is_on()
                    && !(any_door_open
                        && (pneumatic.left_engine_state() != EngineState::Off
                            || pneumatic.right_engine_state() != EngineState::Off))
                // && ! pack 1 overheat
                // && mixer unit burst
            }
            Pack(2) => {
                acs_overhead.pack_pushbuttons_state()[1]
                    && !(pneumatic.right_engine_state() == EngineState::Starting)
                    && (!(pneumatic.left_engine_state() == EngineState::Starting)
                        || !pneumatic.engine_crossbleed_is_on())
                    && (pneumatic.engine_mode_selector() != EngineModeSelector::Ignition
                        || (pneumatic.right_engine_state() != EngineState::Off
                            && pneumatic.right_engine_state() != EngineState::Shutting))
                    && !(engine_fire_push_buttons.is_released(3)
                        || engine_fire_push_buttons.is_released(4))
                    && !pressurization_overhead.ditching_is_on()
                    && !(any_door_open
                        && (pneumatic.left_engine_state() != EngineState::Off
                            || pneumatic.right_engine_state() != EngineState::Off))
                // && ! pack 2 overheat
                // && mixer unit burst
            }
            _ => panic!("Pack ID number out of bounds."),
        }
    }

    fn can_move_fcv(
        &self,
        engines: [&impl EngineCorrectedN1; ENGINES],
        fcv_id: usize,
        pneumatic: &(impl PneumaticBleed + EngineStartState),
        pneumatic_overhead: &impl EngineBleedPushbutton<ENGINES>,
    ) -> bool {
        ((engines[fcv_id - 1].corrected_n1() >= Ratio::new::<percent>(15.)
            && pneumatic_overhead.engine_bleed_pushbuttons_are_auto()[fcv_id - 1])
            || (engines
                .iter()
                .any(|e| e.corrected_n1() >= Ratio::new::<percent>(15.))
                && pneumatic_overhead
                    .engine_bleed_pushbuttons_are_auto()
                    .iter()
                    .any(|pb| pb == &true)
                && pneumatic.engine_crossbleed_is_on()))
            || pneumatic.apu_bleed_is_on()
    }

    fn fcv_status_determination(&self, pneumatic: &impl PackFlowValveState) -> bool {
        // FIXME: This needs to look at each individual valve
        // Pneumatic trait needs fixing
        (pneumatic.pack_flow_valve_is_open(self.fdac_id)) != self.fcv_open_allowed
    }
}

impl<const ENGINES: usize> PackFlow for FDACFlowControl<ENGINES> {
    fn pack_flow(&self) -> MassRate {
        self.flow_control_valves_controller[0].pack_flow()
            + self.flow_control_valves_controller[1].pack_flow()
    }
}

impl<const ENGINES: usize> PackFlowControllers for FDACFlowControl<ENGINES> {
    fn pack_flow_controller(
        &self,
        fcv_id: usize,
    ) -> Box<dyn ControllerSignal<PackFlowValveSignal>> {
        Box::new(
            self.flow_control_valves_controller[fcv_id - 1 - ((self.fdac_id == 2) as usize * 2)],
        )
    }
}

#[derive(Copy, Clone)]
pub struct PackFlowController<const ENGINES: usize> {
    fcv_id: usize, // 1, 2, 3, 4
    should_open_fcv: bool,
    pack_flow: MassRate,
    pid: PidController,
}

impl<const ENGINES: usize> PackFlowController<ENGINES> {
    fn new(id: usize) -> Self {
        Self {
            fcv_id: id,
            should_open_fcv: false,
            pack_flow: MassRate::default(),
            pid: PidController::new(0.01, 0.1, 0., 0., 1., 0., 1.),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        should_open_fcv: bool,
        pack_flow_demand: MassRate,
        pneumatic: &impl PackFlowValveState,
    ) {
        self.should_open_fcv = should_open_fcv;
        self.pack_flow = pneumatic.pack_flow_valve_air_flow(self.fcv_id);

        self.pid
            .change_setpoint(pack_flow_demand.get::<kilogram_per_second>() / ENGINES as f64);
        self.pid.next_control_output(
            self.pack_flow.get::<kilogram_per_second>(),
            Some(context.delta()),
        );
    }
}

impl<const ENGINES: usize> PackFlow for PackFlowController<ENGINES> {
    fn pack_flow(&self) -> MassRate {
        self.pack_flow
    }
}

impl<const ENGINES: usize> ControllerSignal<PackFlowValveSignal> for PackFlowController<ENGINES> {
    fn signal(&self) -> Option<PackFlowValveSignal> {
        let target_open = Ratio::new::<ratio>(if self.should_open_fcv {
            self.pid.output()
        } else {
            0.
        });
        Some(PackFlowValveSignal::new(target_open))
    }
}
