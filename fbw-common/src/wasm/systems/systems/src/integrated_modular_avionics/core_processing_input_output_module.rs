use super::{
    avionics_full_duplex_switch::AvionicsFullDuplexSwitch,
    AvionicsDataCommunicationNetworkEndpoint, AvionicsDataCommunicationNetworkMessage,
    AvionicsDataCommunicationNetworkMessageIdentifier,
};
use crate::{
    shared::{ElectricalBusType, ElectricalBuses},
    simulation::{
        InitContext, Read, SimulationElement, SimulatorReader, SimulatorWriter, VariableIdentifier,
        Write,
    },
};
use std::{cell::RefCell, fmt::Display, rc::Rc};

#[derive(Clone, Copy, PartialEq, Eq, Hash)]
pub enum CpiomId {
    B1,
    B2,
    B3,
    B4,
}

impl Display for CpiomId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CpiomId::B1 => write!(f, "B1"),
            CpiomId::B2 => write!(f, "B2"),
            CpiomId::B3 => write!(f, "B3"),
            CpiomId::B4 => write!(f, "B4"),
        }
    }
}

pub struct CoreProcessingInputOutputModule<MessageData: Clone + Eq + PartialEq> {
    power_supply: ElectricalBusType,
    is_powered: bool,
    available_id: VariableIdentifier,
    failure_indication_id: VariableIdentifier,
    failure_indication: bool,
    connected_switches: Vec<Rc<RefCell<AvionicsFullDuplexSwitch<MessageData>>>>,
}

impl<MessageData: Clone + Eq + PartialEq> CoreProcessingInputOutputModule<MessageData> {
    pub fn new(
        context: &mut InitContext,
        name: &str,
        power_supply: ElectricalBusType,
        connected_switches: Vec<Rc<RefCell<AvionicsFullDuplexSwitch<MessageData>>>>,
    ) -> Self {
        Self {
            power_supply,
            is_powered: false,
            available_id: context.get_identifier(format!("CPIOM_{}_AVAIL", name)),
            failure_indication_id: context.get_identifier(format!("CPIOM_{}_FAILURE", name)),
            failure_indication: false,
            connected_switches,
        }
    }

    pub fn is_available(&self) -> bool {
        self.is_powered & !self.failure_indication
    }
}

impl<MessageData: Clone + Eq + PartialEq> AvionicsDataCommunicationNetworkEndpoint
    for CoreProcessingInputOutputModule<MessageData>
{
    type MessageData = MessageData;

    fn recv_value(
        &self,
        id: &AvionicsDataCommunicationNetworkMessageIdentifier,
    ) -> Option<AvionicsDataCommunicationNetworkMessage<Self::MessageData>> {
        // TODO: check if there is a newer message on the other networks
        self.connected_switches
            .iter()
            .find_map(|switch| switch.borrow().recv_value(id))
    }

    fn recv_value_and_then<
        F: FnOnce(&AvionicsDataCommunicationNetworkMessage<Self::MessageData>),
    >(
        &self,
        id: &AvionicsDataCommunicationNetworkMessageIdentifier,
        mut f: F,
    ) -> Option<F> {
        for switch in &self.connected_switches {
            match switch.borrow().recv_value_and_then(id, f) {
                None => return None,
                Some(new_f) => f = new_f,
            }
        }
        Some(f)
    }

    fn send_value(
        &self,
        id: &AvionicsDataCommunicationNetworkMessageIdentifier,
        value: AvionicsDataCommunicationNetworkMessage<Self::MessageData>,
    ) {
        for switch in &self.connected_switches {
            switch.borrow_mut().send_value(id, value.clone());
        }
    }
}

impl<MessageData: Clone + Eq + PartialEq> SimulationElement
    for CoreProcessingInputOutputModule<MessageData>
{
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.failure_indication = reader.read(&self.failure_indication_id);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.available_id, self.is_available());
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.power_supply);
    }
}
