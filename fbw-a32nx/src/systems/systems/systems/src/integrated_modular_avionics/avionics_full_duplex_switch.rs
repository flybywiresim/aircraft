use crate::{
    shared::{power_supply_relay::PowerSupplyRelay, ElectricalBusType, ElectricalBuses},
    simulation::{
        InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, VariableIdentifier, Write,
    },
};
use std::option::Option;

pub struct AvionicsFullDuplexSwitch {
    single_power_supply: Option<ElectricalBusType>,
    power_supply_relay: Option<PowerSupplyRelay>,
    last_is_powered: bool,
    is_powered: bool,
    failure_indication_id: VariableIdentifier,
    last_failure_indication: bool,
    failure_indication: bool,
    available_id: VariableIdentifier,
    routing_update_required: bool,
}

impl AvionicsFullDuplexSwitch {
    pub fn new_single_power_supply(
        context: &mut InitContext,
        id: u8,
        power_supply: ElectricalBusType,
    ) -> Self {
        Self {
            single_power_supply: Some(power_supply),
            power_supply_relay: None,
            last_is_powered: false,
            is_powered: false,
            failure_indication_id: context.get_identifier(format!("AFDX_SWITCH_{}_FAILURE", id)),
            last_failure_indication: false,
            failure_indication: false,
            available_id: context.get_identifier(format!("AFDX_SWITCH_{}_AVAIL", id)),
            routing_update_required: false,
        }
    }

    pub fn new_dual_power_supply(
        context: &mut InitContext,
        id: u8,
        primary_power_supply: ElectricalBusType,
        secondary_power_supply: ElectricalBusType,
    ) -> Self {
        Self {
            single_power_supply: None,
            power_supply_relay: Some(PowerSupplyRelay::new(
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
        }
    }

    pub fn is_available(&self) -> bool {
        self.is_powered && !self.failure_indication
    }

    pub fn update(&mut self) {
        if self.power_supply_relay.is_some() {
            self.is_powered = self
                .power_supply_relay
                .as_ref()
                .unwrap()
                .output_is_powered();
        }

        // do not recalculate in every step the routing table
        self.routing_update_required = self.last_is_powered != self.is_powered
            || self.last_failure_indication != self.failure_indication;

        self.last_failure_indication = self.failure_indication;
        self.last_is_powered = self.is_powered;
    }
}

impl SimulationElement for AvionicsFullDuplexSwitch {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        if self.power_supply_relay.is_some() {
            self.power_supply_relay.as_mut().unwrap().accept(visitor);
        }
        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        let failure: f64 = reader.read(&self.failure_indication_id);
        self.failure_indication = failure != 0.0;
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        if self.is_available() {
            writer.write(&self.available_id, 1.0);
        } else {
            writer.write(&self.available_id, 0.0);
        }
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        if self.single_power_supply.is_some() {
            self.is_powered = buses.is_powered(self.single_power_supply.unwrap());
        }
    }
}
