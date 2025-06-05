use std::time::Duration;

use systems::{
    air_conditioning::{
        acs_controller::{TrimAirPressureRegulatingValveController, TrimAirValveController},
        AirConditioningOverheadShared, Channel, DuctTemperature, OperatingChannel,
        TrimAirControllers, TrimAirSystem,
    },
    failures::FailureType,
    shared::{ElectricalBusType, EngineStartState, PackFlowValveState, PneumaticBleed},
    simulation::{
        InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
        VariableIdentifier, Write,
    },
};

#[derive(Debug)]
enum TaddFault {
    OneChannelFault,
    BothChannelsFault,
}

pub trait TaddShared {
    fn hot_air_is_enabled(&self, hot_air_id: usize) -> bool;
    fn trim_air_pressure_regulating_valve_is_open(&self, taprv_id: usize) -> bool;
}

pub struct TrimAirDriveDevice<const ZONES: usize, const ENGINES: usize> {
    tadd_channel_1_failure_id: VariableIdentifier,
    tadd_channel_2_failure_id: VariableIdentifier,

    active_channel: OperatingChannel,
    stand_by_channel: OperatingChannel,
    hot_air_is_enabled: [bool; 2],
    hot_air_is_open: [bool; 2],
    taprv_open_disagrees: [bool; 2],
    taprv_open_timer: [Duration; 2],
    taprv_closed_disagrees: [bool; 2],
    taprv_closed_timer: [Duration; 2],
    taprv_controllers: [TrimAirPressureRegulatingValveController; 2],
    trim_air_valve_controllers: [TrimAirValveController; ZONES],

    fault: Option<TaddFault>,
}

impl<const ZONES: usize, const ENGINES: usize> TrimAirDriveDevice<ZONES, ENGINES> {
    const TAPRV_OPEN_COMMAND_DISAGREE_TIMER: f64 = 30.; // seconds
    const TAPRV_CLOSE_COMMAND_DISAGREE_TIMER: f64 = 14.; // seconds
    const TIMER_RESET: f64 = 1.2; // seconds

    pub fn new(context: &mut InitContext, powered_by: [ElectricalBusType; 2]) -> Self {
        Self {
            tadd_channel_1_failure_id: context
                .get_identifier("COND_TADD_CHANNEL_1_FAILURE".to_owned()),
            tadd_channel_2_failure_id: context
                .get_identifier("COND_TADD_CHANNEL_2_FAILURE".to_owned()),

            active_channel: OperatingChannel::new(
                1,
                Some(FailureType::Tadd(Channel::ChannelOne)),
                &[powered_by[0]],
            ),
            stand_by_channel: OperatingChannel::new(
                2,
                Some(FailureType::Tadd(Channel::ChannelTwo)),
                &[powered_by[1]],
            ),
            hot_air_is_enabled: [false; 2],
            hot_air_is_open: [false; 2],
            taprv_open_disagrees: [false; 2],
            taprv_open_timer: [Duration::ZERO; 2],
            taprv_closed_disagrees: [false; 2],
            taprv_closed_timer: [Duration::ZERO; 2],
            taprv_controllers: [TrimAirPressureRegulatingValveController::new(); 2],
            trim_air_valve_controllers: [TrimAirValveController::new(); ZONES],

            fault: None,
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        acs_overhead: &impl AirConditioningOverheadShared,
        duct_demand_temperature: &impl DuctTemperature,
        duct_temperature: &impl DuctTemperature,
        pneumatic: &(impl EngineStartState + PackFlowValveState + PneumaticBleed),
        should_close_taprv: [bool; 2],
        trim_air_system: &TrimAirSystem<ZONES, ENGINES>,
    ) {
        self.fault_determination();

        self.hot_air_is_enabled = [1, 2].map(|id| {
            self.trim_air_pressure_regulating_valve_status_determination(
                acs_overhead,
                should_close_taprv[id - 1],
                id,
                pneumatic,
            )
        });

        self.taprv_controllers
            .iter_mut()
            .enumerate()
            .for_each(|(id, controller)| controller.update(self.hot_air_is_enabled[id]));

        self.hot_air_is_open =
            [1, 2].map(|id| trim_air_system.trim_air_pressure_regulating_valve_is_open(id));

        self.taprv_open_disagrees =
            [1, 2].map(|hot_air_id| self.taprv_open_command_disagree_monitor(context, hot_air_id));
        self.taprv_closed_disagrees = [1, 2]
            .map(|hot_air_id| self.taprv_closed_command_disagree_monitor(context, hot_air_id));

        if !matches!(self.fault, Some(TaddFault::BothChannelsFault))
            && !self.active_channel.has_fault()
        {
            for (id, tav_controller) in self.trim_air_valve_controllers.iter_mut().enumerate() {
                tav_controller.update(
                    context,
                    self.hot_air_is_open.iter().any(|&hot_air| hot_air),
                    duct_temperature.duct_temperature()[id],
                    duct_demand_temperature.duct_demand_temperature()[id],
                )
            }
        }
    }

    fn fault_determination(&mut self) {
        self.active_channel.update_fault();
        self.stand_by_channel.update_fault();

        self.fault = match (
            self.active_channel.has_fault(),
            self.stand_by_channel.has_fault(),
        ) {
            (true, true) => Some(TaddFault::BothChannelsFault),
            (false, false) => None,
            (ac, _) => {
                if ac {
                    self.switch_active_channel();
                }
                Some(TaddFault::OneChannelFault)
            }
        };
    }

    fn switch_active_channel(&mut self) {
        std::mem::swap(&mut self.stand_by_channel, &mut self.active_channel);
    }

    fn trim_air_pressure_regulating_valve_status_determination(
        &self,
        acs_overhead: &impl AirConditioningOverheadShared,
        should_close_taprv: bool,
        hot_air_id: usize,
        pneumatic: &impl PackFlowValveState,
    ) -> bool {
        acs_overhead.hot_air_pushbutton_is_on(hot_air_id)
            && !self.active_channel.has_fault()
            && (pneumatic.pack_flow_valve_is_open(1) || pneumatic.pack_flow_valve_is_open(2))
            && !should_close_taprv
        // && !self.duct_overheat_monitor()
        // && !any_tav_has_fault
    }

    fn taprv_open_command_disagree_monitor(
        &mut self,
        context: &UpdateContext,
        hot_air_id: usize,
    ) -> bool {
        let index = hot_air_id - 1;
        if !self.hot_air_is_enabled[index] {
            false
        } else if !self.hot_air_is_open[index] && !self.taprv_open_disagrees[index] {
            if self.taprv_open_timer[index]
                > Duration::from_secs_f64(Self::TAPRV_OPEN_COMMAND_DISAGREE_TIMER)
            {
                self.taprv_open_timer[index] = Duration::default();
                true
            } else {
                self.taprv_open_timer[index] += context.delta();
                false
            }
        } else if self.hot_air_is_open[index] && self.taprv_open_disagrees[index] {
            if self.taprv_open_timer[index] > Duration::from_secs_f64(Self::TIMER_RESET) {
                self.taprv_open_timer[index] = Duration::default();
                false
            } else {
                self.taprv_open_timer[index] += context.delta();
                true
            }
        } else {
            self.taprv_open_disagrees[index]
        }
    }

    fn taprv_closed_command_disagree_monitor(
        &mut self,
        context: &UpdateContext,
        hot_air_id: usize,
    ) -> bool {
        let index = hot_air_id - 1;
        if self.hot_air_is_enabled[index] {
            false
        } else if self.hot_air_is_open[index] && !self.taprv_closed_disagrees[index] {
            if self.taprv_closed_timer[index]
                > Duration::from_secs_f64(Self::TAPRV_CLOSE_COMMAND_DISAGREE_TIMER)
            {
                self.taprv_closed_timer[index] = Duration::default();
                true
            } else {
                self.taprv_closed_timer[index] += context.delta();
                false
            }
        } else if !self.hot_air_is_open[index] && self.taprv_closed_disagrees[index] {
            if self.taprv_closed_timer[index] > Duration::from_secs_f64(Self::TIMER_RESET) {
                self.taprv_closed_timer[index] = Duration::default();
                false
            } else {
                self.taprv_closed_timer[index] += context.delta();
                true
            }
        } else {
            self.taprv_closed_disagrees[index]
        }
    }

    pub fn taprv_disagree_status_monitor(&self, hot_air_id: usize) -> bool {
        self.taprv_open_disagrees[hot_air_id - 1] || self.taprv_closed_disagrees[hot_air_id - 1]
    }

    pub fn taprv_controller(&self) -> [TrimAirPressureRegulatingValveController; 2] {
        self.taprv_controllers
    }
}

impl<const ZONES: usize, const ENGINES: usize> TaddShared for TrimAirDriveDevice<ZONES, ENGINES> {
    fn hot_air_is_enabled(&self, hot_air_id: usize) -> bool {
        self.hot_air_is_enabled[hot_air_id - 1]
    }
    fn trim_air_pressure_regulating_valve_is_open(&self, taprv_id: usize) -> bool {
        self.hot_air_is_open[taprv_id - 1]
    }
}

impl<const ZONES: usize, const ENGINES: usize> TrimAirControllers
    for TrimAirDriveDevice<ZONES, ENGINES>
{
    fn trim_air_valve_controllers(&self, zone_id: usize) -> TrimAirValveController {
        self.trim_air_valve_controllers[zone_id]
    }
}

impl<const ZONES: usize, const ENGINES: usize> SimulationElement
    for TrimAirDriveDevice<ZONES, ENGINES>
{
    fn write(&self, writer: &mut SimulatorWriter) {
        let (channel_1_failure, channel_2_failure) = match self.fault {
            None => (false, false),
            Some(TaddFault::OneChannelFault) => (
                self.stand_by_channel.id() == Channel::ChannelOne,
                self.stand_by_channel.id() == Channel::ChannelTwo,
            ),
            Some(TaddFault::BothChannelsFault) => (true, true),
        };
        writer.write(&self.tadd_channel_1_failure_id, channel_1_failure);
        writer.write(&self.tadd_channel_2_failure_id, channel_2_failure);
    }

    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.active_channel.accept(visitor);
        self.stand_by_channel.accept(visitor);

        visitor.visit(self);
    }
}
