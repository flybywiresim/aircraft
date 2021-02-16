use super::{
    ElectricalStateWriter, Potential, PotentialSource, ProvideFrequency,
    ProvidePotential,
};
use crate::simulation::{SimulationElement, SimulatorWriter};
use uom::si::{electric_potential::volt, f64::*, frequency::hertz};

pub struct EmergencyGenerator {
    writer: ElectricalStateWriter,
    running: bool,
    is_blue_pressurised: bool,
}
impl EmergencyGenerator {
    pub fn new() -> EmergencyGenerator {
        EmergencyGenerator {
            writer: ElectricalStateWriter::new("EMER_GEN"),
            running: false,
            is_blue_pressurised: false,
        }
    }

    pub fn update(&mut self, is_blue_pressurised: bool) {
        // TODO: The emergency generator is driven by the blue hydraulic circuit. Still to be implemented.
        self.is_blue_pressurised = is_blue_pressurised;
    }

    pub fn attempt_start(&mut self) {
        self.running = true;
    }

    pub fn is_running(&self) -> bool {
        self.is_blue_pressurised && self.running
    }
}
impl PotentialSource for EmergencyGenerator {
    fn output_potential(&self) -> Potential {
        if self.is_running() {
            Potential::EmergencyGenerator
        } else {
            Potential::None
        }
    }
}
impl ProvideFrequency for EmergencyGenerator {
    fn frequency(&self) -> Frequency {
        // TODO: Replace with actual values once calculated.
        if self.output_potential().is_powered() {
            Frequency::new::<hertz>(400.)
        } else {
            Frequency::new::<hertz>(0.)
        }
    }

    fn frequency_normal(&self) -> bool {
        // TODO: Replace with actual values once calculated.
        self.output_potential().is_powered()
    }
}
impl ProvidePotential for EmergencyGenerator {
    fn potential(&self) -> ElectricPotential {
        // TODO: Replace with actual values once calculated.
        if self.output_potential().is_powered() {
            ElectricPotential::new::<volt>(115.)
        } else {
            ElectricPotential::new::<volt>(0.)
        }
    }

    fn potential_normal(&self) -> bool {
        // TODO: Replace with actual values once calculated.
        self.output_potential().is_powered()
    }
}
impl SimulationElement for EmergencyGenerator {
    fn write(&self, writer: &mut SimulatorWriter) {
        self.writer.write_alternating(self, writer);
    }
}
impl Default for EmergencyGenerator {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod emergency_generator_tests {
    use crate::simulation::test::TestReaderWriter;

    use super::*;

    #[test]
    fn starts_without_output() {
        assert!(emergency_generator().is_unpowered());
    }

    #[test]
    fn when_started_provides_output() {
        let mut emer_gen = emergency_generator();
        emer_gen.attempt_start();
        emer_gen.update(true);

        assert!(emer_gen.is_powered());
    }

    #[test]
    fn when_started_without_hydraulic_pressure_is_unpowered() {
        let mut emer_gen = emergency_generator();
        emer_gen.attempt_start();
        emer_gen.update(false);

        assert!(emer_gen.is_unpowered());
    }

    #[test]
    fn writes_its_state() {
        let bus = emergency_generator();
        let mut test_writer = TestReaderWriter::new();
        let mut writer = SimulatorWriter::new(&mut test_writer);

        bus.write(&mut writer);

        assert!(test_writer.len_is(4));
        assert!(test_writer.contains_f64("ELEC_EMER_GEN_POTENTIAL", 0.));
        assert!(test_writer.contains_bool("ELEC_EMER_GEN_POTENTIAL_NORMAL", false));
        assert!(test_writer.contains_f64("ELEC_EMER_GEN_FREQUENCY", 0.));
        assert!(test_writer.contains_bool("ELEC_EMER_GEN_FREQUENCY_NORMAL", false));
    }

    fn emergency_generator() -> EmergencyGenerator {
        EmergencyGenerator::new()
    }
}
