use super::{
    ElectricalStateWriter, Potential, PotentialSource, PotentialTarget, ProvideCurrent,
    ProvidePotential,
};
use crate::simulation::{SimulationElement, SimulatorWriter};
use uom::si::{electric_current::ampere, electric_potential::volt, f64::*};

pub struct TransformerRectifier {
    writer: ElectricalStateWriter,
    number: usize,
    input: Potential,
    failed: bool,
}
impl TransformerRectifier {
    pub fn new(number: usize) -> TransformerRectifier {
        TransformerRectifier {
            writer: ElectricalStateWriter::new(&format!("TR_{}", number)),
            number,
            input: Potential::None,
            failed: false,
        }
    }

    pub fn fail(&mut self) {
        self.failed = true;
    }

    pub fn input_potential(&self) -> Potential {
        self.input
    }
}
potential_target!(TransformerRectifier);
impl PotentialSource for TransformerRectifier {
    fn output_potential(&self) -> Potential {
        if self.failed {
            Potential::None
        } else if self.input.is_powered() {
            Potential::TransformerRectifier(self.number)
        } else {
            Potential::None
        }
    }
}
impl ProvideCurrent for TransformerRectifier {
    fn current(&self) -> ElectricCurrent {
        // TODO: Replace with actual values once calculated.
        if self.output_potential().is_powered() {
            ElectricCurrent::new::<ampere>(150.)
        } else {
            ElectricCurrent::new::<ampere>(0.)
        }
    }

    fn current_normal(&self) -> bool {
        // TODO: Replace with actual values once calculated.
        self.output_potential().is_powered()
    }
}
impl ProvidePotential for TransformerRectifier {
    fn potential(&self) -> ElectricPotential {
        // TODO: Replace with actual values once calculated.
        if self.output_potential().is_powered() {
            ElectricPotential::new::<volt>(28.)
        } else {
            ElectricPotential::new::<volt>(0.)
        }
    }

    fn potential_normal(&self) -> bool {
        // TODO: Replace with actual values once calculated.
        self.output_potential().is_powered()
    }
}
impl SimulationElement for TransformerRectifier {
    fn write(&self, writer: &mut SimulatorWriter) {
        self.writer.write_direct(self, writer);
    }
}

#[cfg(test)]
mod transformer_rectifier_tests {
    use crate::simulation::test::TestReaderWriter;

    use super::*;

    struct Powerless {}
    impl PotentialSource for Powerless {
        fn output_potential(&self) -> Potential {
            Potential::None
        }
    }

    struct StubApuGenerator {}
    impl PotentialSource for StubApuGenerator {
        fn output_potential(&self) -> Potential {
            Potential::ApuGenerator(1)
        }
    }

    fn apu_generator() -> StubApuGenerator {
        StubApuGenerator {}
    }

    #[test]
    fn starts_without_output() {
        assert!(transformer_rectifier().is_unpowered());
    }

    #[test]
    fn when_powered_outputs_potential() {
        let mut tr = transformer_rectifier();
        tr.powered_by(&apu_generator());

        assert!(tr.is_powered());
    }

    #[test]
    fn when_powered_but_failed_has_no_output() {
        let mut tr = transformer_rectifier();
        tr.powered_by(&apu_generator());
        tr.fail();

        assert!(tr.is_unpowered());
    }

    #[test]
    fn when_unpowered_has_no_output() {
        let mut tr = transformer_rectifier();
        tr.powered_by(&Powerless {});

        assert!(tr.is_unpowered());
    }

    #[test]
    fn writes_its_state() {
        let transformer_rectifier = transformer_rectifier();
        let mut test_writer = TestReaderWriter::new();
        let mut writer = SimulatorWriter::new(&mut test_writer);

        transformer_rectifier.write(&mut writer);

        assert!(test_writer.len_is(4));
        assert!(test_writer.contains_f64("ELEC_TR_1_CURRENT", 0.));
        assert!(test_writer.contains_bool("ELEC_TR_1_CURRENT_NORMAL", false));
        assert!(test_writer.contains_f64("ELEC_TR_1_POTENTIAL", 0.));
        assert!(test_writer.contains_bool("ELEC_TR_1_POTENTIAL_NORMAL", false));
    }

    fn transformer_rectifier() -> TransformerRectifier {
        TransformerRectifier::new(1)
    }
}
