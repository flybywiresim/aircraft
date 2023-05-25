use crate::{
    shared::{ControllerSignal, ElectricalBusType},
    simulation::{SimulationElement, SimulationElementVisitor},
};

use super::{
    AirConditioningOverheadShared, CabinFansSignal, OperatingChannel, PressurizationOverheadShared,
};

#[derive(Debug)]
enum VcmFault {
    OneChannelFault,
    BothChannelsFault,
}

#[derive(Clone, Copy, Debug)]
pub enum VcmId {
    Fwd,
    Aft,
}

pub trait VcmShared {
    fn hp_cabin_fans_are_enabled(&self) -> bool;
    fn bulk_duct_heater_is_on(&self) -> bool;
    fn bulk_extraction_fan_is_on(&self) -> bool;
    fn bulk_isolation_valves_open_allowed(&self) -> bool;
}

pub struct VentilationControlModule {
    id: VcmId,
    active_channel: OperatingChannel,
    stand_by_channel: OperatingChannel,
    hp_cabin_fans_are_enabled: bool,
    bvcs: BulkVentilationControlSystem,

    fault: Option<VcmFault>,
}

impl VentilationControlModule {
    pub fn new(id: VcmId, powered_by: Vec<ElectricalBusType>) -> Self {
        Self {
            id,
            active_channel: OperatingChannel::new(1, powered_by[0]),
            stand_by_channel: OperatingChannel::new(2, powered_by[1]),
            hp_cabin_fans_are_enabled: false,
            bvcs: BulkVentilationControlSystem::new(),

            fault: None,
        }
    }

    pub fn update(
        &mut self,
        acs_overhead: &impl AirConditioningOverheadShared,
        pressurization_overhead: &impl PressurizationOverheadShared,
    ) {
        self.fault_determination();

        self.hp_cabin_fans_are_enabled = !self.active_channel.has_fault()
            && acs_overhead.cabin_fans_is_on()
            && !pressurization_overhead.ditching_is_on();

        if matches!(self.id, VcmId::Aft) {
            self.bvcs.update(
                self.active_channel.has_fault(),
                acs_overhead,
                pressurization_overhead,
            );
        }
    }

    fn fault_determination(&mut self) {
        self.fault = match self.active_channel.has_fault() {
            true => {
                if self.stand_by_channel.has_fault() {
                    Some(VcmFault::BothChannelsFault)
                } else {
                    self.switch_active_channel();
                    Some(VcmFault::OneChannelFault)
                }
            }
            false => {
                if self.stand_by_channel.has_fault() {
                    Some(VcmFault::OneChannelFault)
                } else {
                    None
                }
            }
        };
    }

    fn switch_active_channel(&mut self) {
        std::mem::swap(&mut self.stand_by_channel, &mut self.active_channel);
    }

    pub fn id(&self) -> VcmId {
        self.id
    }
}

impl VcmShared for VentilationControlModule {
    fn hp_cabin_fans_are_enabled(&self) -> bool {
        self.hp_cabin_fans_are_enabled
    }
    fn bulk_duct_heater_is_on(&self) -> bool {
        self.bvcs.duct_heater_is_on()
    }
    fn bulk_extraction_fan_is_on(&self) -> bool {
        self.bvcs.bulk_extraction_fan_is_on()
    }
    fn bulk_isolation_valves_open_allowed(&self) -> bool {
        self.bvcs.bulk_isolation_valves_open_allowed()
    }
}

impl ControllerSignal<CabinFansSignal> for VentilationControlModule {
    fn signal(&self) -> Option<CabinFansSignal> {
        if self.hp_cabin_fans_are_enabled {
            Some(CabinFansSignal::On(None))
        } else {
            Some(CabinFansSignal::Off)
        }
    }
}

impl SimulationElement for VentilationControlModule {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.active_channel.accept(visitor);
        self.stand_by_channel.accept(visitor);

        visitor.visit(self);
    }
}

struct BulkVentilationControlSystem {
    duct_heater_is_on: bool,
    extraction_fan_is_on: bool,
    isolation_valves_open_allowed: bool,
}

impl BulkVentilationControlSystem {
    fn new() -> Self {
        Self {
            duct_heater_is_on: false,
            isolation_valves_open_allowed: false,
            extraction_fan_is_on: false,
        }
    }

    fn update(
        &mut self,
        active_channel_has_fault: bool,
        acs_overhead: &impl AirConditioningOverheadShared,
        pressurization_overhead: &impl PressurizationOverheadShared,
    ) {
        // TODO: Add failures and smoke detection
        self.isolation_valves_open_allowed = acs_overhead.bulk_isolation_valve_is_on()
            && !pressurization_overhead.ditching_is_on()
            && !active_channel_has_fault;
        self.extraction_fan_is_on =
            self.isolation_valves_open_allowed && !pressurization_overhead.ditching_is_on();
        self.duct_heater_is_on =
            acs_overhead.bulk_cargo_heater_is_on() && self.extraction_fan_is_on;
    }

    fn duct_heater_is_on(&self) -> bool {
        self.duct_heater_is_on
    }
    fn bulk_extraction_fan_is_on(&self) -> bool {
        self.extraction_fan_is_on
    }
    fn bulk_isolation_valves_open_allowed(&self) -> bool {
        self.isolation_valves_open_allowed
    }
}
