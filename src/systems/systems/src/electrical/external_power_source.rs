use crate::simulation::{SimulationElement, SimulatorReader, SimulatorWriter, UpdateContext};
use uom::si::{electric_potential::volt, f64::*, frequency::hertz};

use super::{
    ElectricalStateWriter, Potential, PotentialSource, ProvideFrequency, ProvidePotential,
};

pub struct ExternalPowerSource {
    writer: ElectricalStateWriter,
    pub is_connected: bool,
}
impl ExternalPowerSource {
    pub fn new() -> ExternalPowerSource {
        ExternalPowerSource {
            writer: ElectricalStateWriter::new("EXT_PWR"),
            is_connected: false,
        }
    }

    pub fn update(&mut self, _: &UpdateContext) {}
}
impl PotentialSource for ExternalPowerSource {
    fn output_potential(&self) -> Potential {
        if self.is_connected {
            Potential::External
        } else {
            Potential::None
        }
    }
}
impl ProvidePotential for ExternalPowerSource {
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
impl ProvideFrequency for ExternalPowerSource {
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
impl SimulationElement for ExternalPowerSource {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.is_connected = reader.read_bool("EXTERNAL POWER AVAILABLE:1");
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        self.writer.write_alternating(self, writer);
    }
}
impl Default for ExternalPowerSource {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod external_power_source_tests {
    use crate::simulation::test::TestReaderWriter;

    use super::*;

    #[test]
    fn starts_without_output() {
        assert!(external_power_source().is_unpowered());
    }

    #[test]
    fn when_plugged_in_provides_output() {
        let mut ext_pwr = external_power_source();
        ext_pwr.is_connected = true;

        assert!(ext_pwr.is_powered());
    }

    #[test]
    fn when_not_plugged_in_provides_no_output() {
        let mut ext_pwr = external_power_source();
        ext_pwr.is_connected = false;

        assert!(ext_pwr.is_unpowered());
    }

    #[test]
    fn writes_its_state() {
        let external_power = external_power_source();
        let mut test_writer = TestReaderWriter::new();
        let mut writer = SimulatorWriter::new(&mut test_writer);

        external_power.write(&mut writer);

        assert!(test_writer.len_is(4));
        assert!(test_writer.contains_f64("ELEC_EXT_PWR_POTENTIAL", 0.));
        assert!(test_writer.contains_bool("ELEC_EXT_PWR_POTENTIAL_NORMAL", false));
        assert!(test_writer.contains_f64("ELEC_EXT_PWR_FREQUENCY", 0.));
        assert!(test_writer.contains_bool("ELEC_EXT_PWR_FREQUENCY_NORMAL", false));
    }

    fn external_power_source() -> ExternalPowerSource {
        ExternalPowerSource::new()
    }
}
