use super::{
    ElectricalStateWriter, Potential, PotentialSource, PotentialTarget,
    ProvideFrequency, ProvidePotential,
};
use crate::simulation::{SimulationElement, SimulatorWriter};
use uom::si::{electric_potential::volt, f64::*, frequency::hertz};

pub struct StaticInverter {
    writer: ElectricalStateWriter,
    input: Potential,
}
impl StaticInverter {
    pub fn new() -> StaticInverter {
        StaticInverter {
            writer: ElectricalStateWriter::new("STAT_INV"),
            input: Potential::None,
        }
    }

    pub fn input_potential(&self) -> Potential {
        self.input
    }
}
potential_target!(StaticInverter);
impl PotentialSource for StaticInverter {
    fn output_potential(&self) -> Potential {
        if self.input.is_powered() {
            Potential::StaticInverter
        } else {
            Potential::None
        }
    }
}
impl ProvidePotential for StaticInverter {
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
impl ProvideFrequency for StaticInverter {
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
impl SimulationElement for StaticInverter {
    fn write(&self, writer: &mut SimulatorWriter) {
        self.writer.write_alternating(self, writer);
    }
}
impl Default for StaticInverter {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod static_inverter_tests {
    use crate::simulation::test::TestReaderWriter;

    use super::*;

    struct Powerless {}
    impl PotentialSource for Powerless {
        fn output_potential(&self) -> Potential {
            Potential::None
        }
    }

    struct Powered {}
    impl PotentialSource for Powered {
        fn output_potential(&self) -> Potential {
            Potential::ApuGenerator(1)
        }
    }

    #[test]
    fn starts_without_output() {
        assert!(static_inverter().is_unpowered());
    }

    #[test]
    fn when_powered_has_output() {
        let mut static_inv = static_inverter();
        static_inv.powered_by(&powered());

        assert!(static_inv.is_powered());
    }

    #[test]
    fn when_unpowered_has_no_output() {
        let mut static_inv = static_inverter();
        static_inv.powered_by(&Powerless {});

        assert!(static_inv.is_unpowered());
    }

    #[test]
    fn writes_its_state() {
        let static_inverter = static_inverter();
        let mut test_writer = TestReaderWriter::new();
        let mut writer = SimulatorWriter::new(&mut test_writer);

        static_inverter.write(&mut writer);

        assert!(test_writer.len_is(4));
        assert!(test_writer.contains_f64("ELEC_STAT_INV_POTENTIAL", 0.));
        assert!(test_writer.contains_bool("ELEC_STAT_INV_POTENTIAL_NORMAL", false));
        assert!(test_writer.contains_f64("ELEC_STAT_INV_FREQUENCY", 0.));
        assert!(test_writer.contains_bool("ELEC_STAT_INV_FREQUENCY_NORMAL", false));
    }

    fn static_inverter() -> StaticInverter {
        StaticInverter::new()
    }

    fn powered() -> Powered {
        Powered {}
    }
}
