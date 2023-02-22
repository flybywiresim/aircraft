use crate::{
    shared::{ElectricalBusType, ElectricalBuses},
    simulation::{
        InitContext, Read, SimulationElement, SimulatorReader, SimulatorWriter, VariableIdentifier,
        Write,
    },
};

pub struct InputOutputModule {
    power_supply: ElectricalBusType,
    is_powered: bool,
    available_id: VariableIdentifier,
    failure_indication_id: VariableIdentifier,
    failure_indication: bool,
}

impl InputOutputModule {
    pub fn new(context: &mut InitContext, name: &str, power_supply: ElectricalBusType) -> Self {
        Self {
            power_supply,
            is_powered: false,
            available_id: context.get_identifier(format!("IOM_{}_AVAIL", name)),
            failure_indication_id: context.get_identifier(format!("IOM_{}_FAILURE", name)),
            failure_indication: false,
        }
    }

    pub fn is_available(&self) -> bool {
        self.is_powered & !self.failure_indication
    }
}

impl SimulationElement for InputOutputModule {
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
