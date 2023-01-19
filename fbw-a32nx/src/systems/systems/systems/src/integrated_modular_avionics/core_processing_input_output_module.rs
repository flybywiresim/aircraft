use crate::{
    shared::{ElectricalBusType, ElectricalBuses},
    simulation::{
        InitContext, Read, SimulationElement, SimulatorReader, SimulatorWriter, VariableIdentifier,
        Write,
    },
};

pub struct CoreProcessingInputOutputModule {
    power_supply: ElectricalBusType,
    last_is_powered: bool,
    is_powered: bool,
    available_id: VariableIdentifier,
    failure_indication_id: VariableIdentifier,
    last_failure_indication: bool,
    failure_indication: bool,
    routing_update_required: bool,
}

impl CoreProcessingInputOutputModule {
    pub fn new(context: &mut InitContext, name: &str, power_supply: ElectricalBusType) -> Self {
        Self {
            power_supply,
            last_is_powered: false,
            is_powered: false,
            available_id: context.get_identifier(format!("CPIOM_{}_AVAIL", name)),
            failure_indication_id: context.get_identifier(format!("CPIOM_{}_FAILURE", name)),
            last_failure_indication: false,
            failure_indication: false,
            routing_update_required: false,
        }
    }

    pub fn update(&mut self) {
        // do not recalculate in every step the routing table
        self.routing_update_required = self.last_is_powered != self.is_powered
            || self.last_failure_indication != self.failure_indication;

        self.last_failure_indication = self.failure_indication;
        self.last_is_powered = self.is_powered;
    }

    pub fn is_available(&self) -> bool {
        self.is_powered & !self.failure_indication
    }

    pub fn routing_update_required(&self) -> bool {
        self.routing_update_required
    }
}

impl SimulationElement for CoreProcessingInputOutputModule {
    fn read(&mut self, reader: &mut SimulatorReader) {
        let failure_value: f64 = reader.read(&self.failure_indication_id);
        self.failure_indication = failure_value != 0.0;
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        if self.is_available() {
            writer.write(&self.available_id, 1.0);
        } else {
            writer.write(&self.available_id, 0.0);
        }
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.power_supply);
    }
}
