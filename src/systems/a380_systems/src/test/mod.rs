use systems::failures::FailureType;
use systems::shared::{ConsumePower, ElectricalBuses, PowerConsumptionReport};
use systems::simulation::{InitContext, SimulationElement, SimulationElementVisitor, SimulatorReader, SimulatorWriter, UpdateContext, VariableIdentifier, Writer};

pub(super) struct A380TestModule {
    test_id: VariableIdentifier
}
impl A380TestModule {
    pub fn new(context: &mut InitContext) -> A380TestModule {
        A380TestModule {
            test_id: context.get_identifier("TEST_MODULE_RUNNING".to_owned())
        }
    }
}

impl SimulationElement for A380TestModule {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write_f64(&self.test_id, 0.);
    }
}