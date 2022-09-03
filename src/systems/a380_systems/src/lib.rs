mod test;

use systems::electrical::Electricity;
use systems::failures::FailureType;
use systems::shared::{ConsumePower, ElectricalBuses, PowerConsumptionReport};
use systems::simulation::{Aircraft, InitContext, SimulationElement, SimulationElementVisitor, SimulatorReader, SimulatorWriter, UpdateContext};
use test::A380TestModule;

pub struct A380 {
    test_module: A380TestModule,
}

impl A380 {
    pub fn new(context: &mut InitContext) -> A380 {
        A380 {
            test_module: A380TestModule::new(context)
        }
    }
}

impl Aircraft for A380 {
    fn update_before_power_distribution(&mut self, _context: &UpdateContext, _electricity: &mut Electricity) {
        println!("update");
    }
}

impl SimulationElement for A380 {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) where Self: Sized {
        self.test_module.accept(visitor);

        visitor.visit(self);
    }
}