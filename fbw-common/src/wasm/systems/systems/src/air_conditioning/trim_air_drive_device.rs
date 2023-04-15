use crate::{
    shared::{
        ElectricalBusType, ElectricalBuses, EngineBleedPushbutton, EngineCorrectedN1,
        EngineStartState, PackFlowValveState, PneumaticBleed,
    },
    simulation::{SimulationElement, UpdateContext},
};

use super::{
    acs_controller::TrimAirValveController, AirConditioningOverheadShared, DuctTemperature,
    OperatingChannel, OperatingChannelFault, TrimAirControllers,
};

use uom::si::{f64::*, ratio::percent};

enum TaddOperatingChannel {
    TADDChannelOne(OperatingChannelFault),
    TADDChannelTwo(OperatingChannelFault),
}

impl OperatingChannel for TaddOperatingChannel {
    fn has_fault(&self) -> bool {
        matches!(
            self,
            TaddOperatingChannel::TADDChannelOne(OperatingChannelFault::Fault)
                | TaddOperatingChannel::TADDChannelTwo(OperatingChannelFault::Fault)
        )
    }

    fn switch(&mut self) {
        // At the moment switching channels always clears the fault in the second channel
        // TODO: This needs to be improved so we can have dual channel failures
        *self = if matches!(self, TaddOperatingChannel::TADDChannelOne(_)) {
            TaddOperatingChannel::TADDChannelTwo(OperatingChannelFault::NoFault)
        } else {
            TaddOperatingChannel::TADDChannelOne(OperatingChannelFault::NoFault)
        };
    }
}

#[derive(Debug)]
enum TaddFault {
    OneChannelFault,
    BothChannelsFault,
    PowerLoss,
}

pub trait TaddShared {
    fn hot_air_is_enabled(&self, hot_air_id: usize) -> bool;
    fn trim_air_pressure_regulating_valve_is_open(&self, taprv_id: usize) -> bool;
}

pub struct TrimAirDriveDevice<const ZONES: usize, const ENGINES: usize> {
    active_channel: TaddOperatingChannel,
    hot_air_is_enabled: [bool; 2],
    should_open_taprv: [bool; 2],
    trim_air_valve_controllers: [TrimAirValveController; ZONES],

    powered_by: Vec<ElectricalBusType>,
    is_powered: bool,
    fault: Option<TaddFault>,
}

impl<const ZONES: usize, const ENGINES: usize> TrimAirDriveDevice<ZONES, ENGINES> {
    pub fn new(powered_by: Vec<ElectricalBusType>) -> Self {
        Self {
            active_channel: TaddOperatingChannel::TADDChannelOne(OperatingChannelFault::NoFault),
            hot_air_is_enabled: [false; 2],
            should_open_taprv: [false; 2],
            trim_air_valve_controllers: [TrimAirValveController::new(); ZONES],
            powered_by,
            is_powered: false,
            fault: None,
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        acs_overhead: &impl AirConditioningOverheadShared,
        duct_demand_temperature: &impl DuctTemperature,
        duct_temperature: &impl DuctTemperature,
        engines: [&impl EngineCorrectedN1; ENGINES],
        pneumatic: &(impl EngineStartState + PackFlowValveState + PneumaticBleed),
        pneumatic_overhead: &impl EngineBleedPushbutton<ENGINES>,
        should_close_taprv: [bool; 2],
    ) {
        self.fault_determination();

        self.hot_air_is_enabled = [1, 2]
            .iter()
            .map(|id| {
                self.trim_air_pressure_regulating_valve_status_determination(
                    acs_overhead,
                    should_close_taprv[id - 1],
                    *id,
                )
            })
            .collect::<Vec<bool>>()
            .try_into()
            .unwrap_or_else(|v: Vec<bool>| {
                panic!(
                    "Expected a Vec of length {} but it was {}",
                    self.hot_air_is_enabled.len(),
                    v.len()
                )
            });

        self.should_open_taprv = [1, 2]
            .iter()
            .map(|id| {
                self.trim_air_pressure_regulating_valve_is_open_determination(
                    self.hot_air_is_enabled[id - 1],
                    engines,
                    pneumatic,
                    pneumatic_overhead,
                    *id,
                )
            })
            .collect::<Vec<bool>>()
            .try_into()
            .unwrap_or_else(|v: Vec<bool>| {
                panic!(
                    "Expected a Vec of length {} but it was {}",
                    self.should_open_taprv.len(),
                    v.len()
                )
            });

        if !matches!(self.fault, Some(TaddFault::PowerLoss))
            && !matches!(self.fault, Some(TaddFault::BothChannelsFault))
        {
            for (id, tav_controller) in self.trim_air_valve_controllers.iter_mut().enumerate() {
                tav_controller.update(
                    context,
                    self.should_open_taprv.iter().any(|&taprv| taprv),
                    duct_temperature.duct_temperature()[id],
                    duct_demand_temperature.duct_demand_temperature()[id],
                )
            }
        }
    }

    fn fault_determination(&mut self) {
        self.fault = {
            if !self.is_powered {
                Some(TaddFault::PowerLoss)
            } else if self.active_channel.has_fault() {
                self.active_channel.switch();
                if self.active_channel.has_fault() {
                    Some(TaddFault::BothChannelsFault)
                } else {
                    Some(TaddFault::OneChannelFault)
                }
            } else {
                None
            }
        }
    }

    fn trim_air_pressure_regulating_valve_status_determination(
        &self,
        acs_overhead: &impl AirConditioningOverheadShared,
        should_close_taprv: bool,
        hot_air_id: usize,
    ) -> bool {
        acs_overhead.hot_air_pushbutton_is_on(hot_air_id)
            && !matches!(self.fault, Some(TaddFault::PowerLoss))
            && !matches!(self.fault, Some(TaddFault::BothChannelsFault))
            && !should_close_taprv
    }

    fn trim_air_pressure_regulating_valve_is_open_determination(
        &self,
        hot_air_is_enabled: bool,
        engines: [&impl EngineCorrectedN1; ENGINES],
        pneumatic: &(impl PneumaticBleed + EngineStartState),
        pneumatic_overhead: &impl EngineBleedPushbutton<ENGINES>,
        taprv_id: usize,
    ) -> bool {
        let engine_id = if taprv_id == 1 { [0, 1] } else { [2, 3] };
        // The trim air pressure regulating valves opens when there's bleed air
        // Bleed can come from either onboard engine being on, or from any engine if xfeed is on
        ((engine_id.iter().any(|id| {
            engines[*id].corrected_n1() >= Ratio::new::<percent>(15.)
                && pneumatic_overhead.engine_bleed_pushbuttons_are_auto()[*id]
        }) || (engines
            .iter()
            .any(|e| e.corrected_n1() >= Ratio::new::<percent>(15.))
            && pneumatic_overhead
                .engine_bleed_pushbuttons_are_auto()
                .iter()
                .any(|pb| pb == &true)
            && pneumatic.engine_crossbleed_is_on()))
            || pneumatic.apu_bleed_is_on())
            && hot_air_is_enabled
    }

    pub fn trim_air_valve_controllers(&self, zone_id: usize) -> TrimAirValveController {
        self.trim_air_valve_controllers[zone_id]
    }
}

impl<const ZONES: usize, const ENGINES: usize> TaddShared for TrimAirDriveDevice<ZONES, ENGINES> {
    fn hot_air_is_enabled(&self, hot_air_id: usize) -> bool {
        self.hot_air_is_enabled[hot_air_id - 1]
    }
    fn trim_air_pressure_regulating_valve_is_open(&self, taprv_id: usize) -> bool {
        self.should_open_taprv[taprv_id - 1]
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
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = self.powered_by.iter().all(|&p| buses.is_powered(p));
    }
}
