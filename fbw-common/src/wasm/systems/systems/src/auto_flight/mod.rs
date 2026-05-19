use crate::{
    shared::arinc429::Arinc429Word,
    simulation::{InitContext, Read, SimulationElement, SimulatorReader, VariableIdentifier},
};

#[derive(Default)]
pub struct FlightControlUnitBusOutputs {
    pub baro_correction_1_hpa: Arinc429Word<f64>,
    pub baro_correction_2_hpa: Arinc429Word<f64>,
}

pub trait FlightControlUnitBusOutput {
    fn bus_outputs(&self) -> &FlightControlUnitBusOutputs;
}

pub struct FlightControlUnitShim {
    bus_outputs: FlightControlUnitBusOutputs,

    baro_correction_1_hpa_id: VariableIdentifier,
    baro_correction_2_hpa_id: VariableIdentifier,
}
impl FlightControlUnitShim {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            bus_outputs: FlightControlUnitBusOutputs::default(),

            baro_correction_1_hpa_id: context.get_identifier("FCU_LEFT_EIS_BARO_HPA".to_owned()),
            baro_correction_2_hpa_id: context.get_identifier("FCU_RIGHT_EIS_BARO_HPA".to_owned()),
        }
    }
}
impl FlightControlUnitBusOutput for FlightControlUnitShim {
    fn bus_outputs(&self) -> &FlightControlUnitBusOutputs {
        &self.bus_outputs
    }
}
impl SimulationElement for FlightControlUnitShim {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.bus_outputs.baro_correction_1_hpa =
            reader.read_arinc429(&self.baro_correction_1_hpa_id);
        self.bus_outputs.baro_correction_2_hpa =
            reader.read_arinc429(&self.baro_correction_2_hpa_id)
    }
}
