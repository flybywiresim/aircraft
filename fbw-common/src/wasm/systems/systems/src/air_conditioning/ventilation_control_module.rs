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

#[derive(Clone, Copy)]
pub enum VcmId {
    Fwd,
    Aft,
}

pub struct VentilationControlModule {
    id: VcmId,
    active_channel: OperatingChannel,
    stand_by_channel: OperatingChannel,
    hp_cabin_fans_are_enabled: bool,

    fault: Option<VcmFault>,
}

impl VentilationControlModule {
    pub fn new(id: VcmId, powered_by: Vec<ElectricalBusType>) -> Self {
        Self {
            id,
            active_channel: OperatingChannel::new(1, powered_by[0]),
            stand_by_channel: OperatingChannel::new(2, powered_by[1]),
            hp_cabin_fans_are_enabled: false,

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

    pub fn hp_cabin_fans_are_enabled(&self) -> bool {
        self.hp_cabin_fans_are_enabled
    }

    pub fn id(&self) -> VcmId {
        self.id
    }
}

impl ControllerSignal<CabinFansSignal> for VentilationControlModule {
    fn signal(&self) -> Option<CabinFansSignal> {
        if self.hp_cabin_fans_are_enabled {
            Some(CabinFansSignal::On)
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
