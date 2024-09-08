use super::{
    AvionicsDataCommunicationNetworkEndpoint, AvionicsDataCommunicationNetworkMessage,
    AvionicsDataCommunicationNetworkMessageIdentifier,
};
use crate::{
    shared::{power_supply_relay::PowerSupplyRelay, ElectricalBusType, ElectricalBuses},
    simulation::{
        InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, VariableIdentifier, Write,
    },
};
use fxhash::FxHashMap;
use std::{cell::RefCell, rc::Rc};

enum PowerSupply {
    Single(ElectricalBusType),
    Relay(PowerSupplyRelay),
}

pub struct AvionicsFullDuplexSwitch<MessageData: Clone + Eq + PartialEq> {
    power_supply: PowerSupply,
    last_is_powered: bool,
    is_powered: bool,
    failure_indication_id: VariableIdentifier,
    last_failure_indication: bool,
    failure_indication: bool,
    available_id: VariableIdentifier,
    routing_update_required: bool,
    adcn_messages: Rc<
        RefCell<
            FxHashMap<
                AvionicsDataCommunicationNetworkMessageIdentifier,
                AvionicsDataCommunicationNetworkMessage<MessageData>,
            >,
        >,
    >,
}

impl<MessageData: Clone + Eq + PartialEq> AvionicsFullDuplexSwitch<MessageData> {
    pub fn new_single_power_supply(
        context: &mut InitContext,
        id: u8,
        power_supply: ElectricalBusType,
    ) -> Self {
        Self {
            power_supply: PowerSupply::Single(power_supply),
            last_is_powered: false,
            is_powered: false,
            failure_indication_id: context.get_identifier(format!("AFDX_SWITCH_{}_FAILURE", id)),
            last_failure_indication: false,
            failure_indication: false,
            available_id: context.get_identifier(format!("AFDX_SWITCH_{}_AVAIL", id)),
            routing_update_required: false,
            adcn_messages: Rc::new(FxHashMap::default().into()),
        }
    }

    pub fn new_dual_power_supply(
        context: &mut InitContext,
        id: u8,
        primary_power_supply: ElectricalBusType,
        secondary_power_supply: ElectricalBusType,
    ) -> Self {
        Self {
            power_supply: PowerSupply::Relay(PowerSupplyRelay::new(
                primary_power_supply,
                secondary_power_supply,
            )),
            last_is_powered: false,
            is_powered: false,
            failure_indication_id: context.get_identifier(format!("AFDX_SWITCH_{}_FAILURE", id)),
            last_failure_indication: false,
            failure_indication: false,
            available_id: context.get_identifier(format!("AFDX_SWITCH_{}_AVAIL", id)),
            routing_update_required: false,
            adcn_messages: Rc::new(FxHashMap::default().into()),
        }
    }

    pub fn is_available(&self) -> bool {
        self.is_powered && !self.failure_indication
    }

    pub fn update(&mut self) {
        if let PowerSupply::Relay(ref power_supply_relay) = self.power_supply {
            self.is_powered = power_supply_relay.output_is_powered();
        }

        // do not recalculate in every step the routing table
        self.routing_update_required = self.last_is_powered != self.is_powered
            || self.last_failure_indication != self.failure_indication;

        self.last_failure_indication = self.failure_indication;
        self.last_is_powered = self.is_powered;
    }

    pub fn routing_update_required(&self) -> bool {
        self.routing_update_required
    }

    pub fn get_adcn_messages(
        &self,
    ) -> Rc<
        RefCell<
            FxHashMap<
                AvionicsDataCommunicationNetworkMessageIdentifier,
                AvionicsDataCommunicationNetworkMessage<MessageData>,
            >,
        >,
    > {
        self.adcn_messages.clone()
    }

    pub fn set_adcn_messages(
        &mut self,
        adcn_messages: Rc<
            RefCell<
                FxHashMap<
                    AvionicsDataCommunicationNetworkMessageIdentifier,
                    AvionicsDataCommunicationNetworkMessage<MessageData>,
                >,
            >,
        >,
    ) {
        self.adcn_messages = adcn_messages;
    }
}
impl<MessageData: Clone + Eq + PartialEq> AvionicsDataCommunicationNetworkEndpoint
    for AvionicsFullDuplexSwitch<MessageData>
{
    type MessageData = MessageData;

    fn recv_value(
        &self,
        id: &AvionicsDataCommunicationNetworkMessageIdentifier,
    ) -> Option<AvionicsDataCommunicationNetworkMessage<Self::MessageData>> {
        self.adcn_messages.borrow().get(id).cloned()
    }

    fn recv_value_and_then<
        F: FnOnce(&AvionicsDataCommunicationNetworkMessage<Self::MessageData>),
    >(
        &self,
        id: &AvionicsDataCommunicationNetworkMessageIdentifier,
        f: F,
    ) -> Option<F> {
        if let Some(value) = self.adcn_messages.borrow().get(id) {
            f(value);
            None
        } else {
            Some(f)
        }
    }

    fn send_value(
        &self,
        id: &AvionicsDataCommunicationNetworkMessageIdentifier,
        value: AvionicsDataCommunicationNetworkMessage<Self::MessageData>,
    ) {
        self.adcn_messages.borrow_mut().insert(*id, value);
    }
}
impl<MessageData: Clone + Eq + PartialEq> SimulationElement
    for AvionicsFullDuplexSwitch<MessageData>
{
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        if let PowerSupply::Relay(ref mut power_supply_relay) = self.power_supply {
            power_supply_relay.accept(visitor);
        }
        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.failure_indication = reader.read(&self.failure_indication_id);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.available_id, self.is_available());
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        if let PowerSupply::Single(power_supply) = self.power_supply {
            self.is_powered = buses.is_powered(power_supply);
        }
    }
}
