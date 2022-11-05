use crate::{
    simulation::{SimulationElement, SimulationElementVisitor, UpdateContext, InitContext},
    communications::receiver::Receiver,
};

pub struct AudioControlPanel {
    receivers: [Receiver; 6],
}
impl AudioControlPanel {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            receivers: [
                Receiver::new(context, "ADF", 1),
                Receiver::new(context, "ADF", 2),
                Receiver::new(context, "NAV", 1),
                Receiver::new(context, "NAV", 2),
                Receiver::new(context, "NAV", 3),
                Receiver::new(context, "NAV", 4),
            ],
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
    ) {
        for receiver in self.receivers.iter_mut() {
            receiver.update(context);
        }
    }
}

impl SimulationElement for AudioControlPanel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        for receiver in self.receivers.iter_mut() {
            receiver.accept(visitor);
        }

        visitor.visit(self);
    }
}


#[cfg(test)]
mod audio_tests {
    use super::*;
    use crate::simulation::{
        Aircraft,
        test::{
            ReadByName, SimulationTestBed, TestBed, WriteByName,
        },
    };

    pub struct TestAircraft {
        receivers: [Receiver; 1],
    }
    impl TestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                receivers: [
                    Receiver::new(context, "NAV", 1),
                ],
            }
        }
    }


    impl SimulationElement for TestAircraft {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            accept_iterable!(self.receivers, visitor);

            visitor.visit(self);
        }
    }

    impl Aircraft for TestAircraft {
    }

    struct AudioControlPanelTestBed {
        test_bed: SimulationTestBed<TestAircraft>,
    }
    impl AudioControlPanelTestBed {
        fn new() -> Self {
            let test_bed = AudioControlPanelTestBed {
                test_bed: SimulationTestBed::new(TestAircraft::new),
            };
            test_bed
        }
    }

    impl TestBed for AudioControlPanelTestBed {
        type Aircraft = TestAircraft;

        fn test_bed(&self) -> &SimulationTestBed<TestAircraft> {
            &self.test_bed
        }

        fn test_bed_mut(&mut self) -> &mut SimulationTestBed<TestAircraft> {
            &mut self.test_bed
        }
    }

    fn test_bed() -> AudioControlPanelTestBed {
        AudioControlPanelTestBed::new()
    }

    #[test]
    fn aaaa() {
        let mut receiver = test_bed();
        receiver.run();
    }
}
