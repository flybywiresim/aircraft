use uom::si::{electric_potential::volt, f64::*, frequency::hertz};

use crate::{
    shared::PowerConsumptionReport,
    simulation::{
        InitContext, NestedElement, Read, SimulationElement, SimulatorReader, SimulatorWriter,
        UpdateContext, VariableIdentifier,
    },
};

use super::{
    ElectricalElement, ElectricalElementIdentifier, ElectricalElementIdentifierProvider,
    ElectricalStateWriter, ElectricitySource, Potential, PotentialOrigin, ProvideFrequency,
    ProvidePotential,
};

#[derive(NestedElement)]
pub struct ExternalPowerSource {
    external_power_available_id: VariableIdentifier,

    identifier: ElectricalElementIdentifier,
    writer: ElectricalStateWriter,
    is_connected: bool,
    output_frequency: Frequency,
    output_potential: ElectricPotential,
}
impl ExternalPowerSource {
    pub fn new(context: &mut InitContext) -> ExternalPowerSource {
        ExternalPowerSource {
            external_power_available_id: context
                .get_identifier("EXTERNAL POWER AVAILABLE:1".to_owned()),
            identifier: context.next_electrical_identifier(),
            writer: ElectricalStateWriter::new(context, "EXT_PWR"),
            is_connected: false,
            output_frequency: Frequency::new::<hertz>(0.),
            output_potential: ElectricPotential::new::<volt>(0.),
        }
    }

    pub fn update(&mut self, _: &UpdateContext) {}

    /// Indicates if the provided electricity's potential and frequency
    /// are within normal parameters. Use this to decide if the
    /// external power contactor should close.
    pub fn output_within_normal_parameters(&self) -> bool {
        self.should_provide_output() && self.potential_normal() && self.frequency_normal()
    }

    fn should_provide_output(&self) -> bool {
        self.is_connected
    }
}
impl ElectricalElement for ExternalPowerSource {
    fn input_identifier(&self) -> super::ElectricalElementIdentifier {
        self.identifier
    }

    fn output_identifier(&self) -> super::ElectricalElementIdentifier {
        self.identifier
    }

    fn is_conductive(&self) -> bool {
        true
    }
}
impl ElectricitySource for ExternalPowerSource {
    fn output_potential(&self) -> Potential {
        if self.should_provide_output() {
            Potential::new(PotentialOrigin::External, self.output_potential)
        } else {
            Potential::none()
        }
    }
}
provide_potential!(ExternalPowerSource, (110.0..=120.0));
provide_frequency!(ExternalPowerSource, (390.0..=410.0));
impl SimulationElement for ExternalPowerSource {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.is_connected = reader.read(&self.external_power_available_id);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        self.writer.write_alternating(self, writer);
    }

    fn process_power_consumption_report<T: PowerConsumptionReport>(
        &mut self,
        _: &UpdateContext,
        _: &T,
    ) {
        self.output_frequency = if self.should_provide_output() {
            Frequency::new::<hertz>(400.)
        } else {
            Frequency::new::<hertz>(0.)
        };

        self.output_potential = if self.should_provide_output() {
            ElectricPotential::new::<volt>(115.)
        } else {
            ElectricPotential::new::<volt>(0.)
        };
    }
}

#[cfg(test)]
mod external_power_source_tests {
    use super::*;
    use crate::simulation::test::{ReadByName, WriteByName};
    use crate::simulation::InitContext;
    use crate::{
        electrical::Electricity,
        simulation::{
            test::{SimulationTestBed, TestBed},
            Aircraft,
        },
    };

    struct ExternalPowerTestBed {
        test_bed: SimulationTestBed<TestAircraft>,
    }
    impl ExternalPowerTestBed {
        fn new() -> Self {
            Self {
                test_bed: SimulationTestBed::new(TestAircraft::new),
            }
        }

        fn with_disconnected_external_power(mut self) -> Self {
            self.disconnect_external_power();
            self
        }

        fn with_connected_external_power(mut self) -> Self {
            self.write_by_name("EXTERNAL POWER AVAILABLE:1", true);
            self
        }

        fn disconnect_external_power(&mut self) {
            self.write_by_name("EXTERNAL POWER AVAILABLE:1", false);
        }

        fn frequency_is_normal(&mut self) -> bool {
            self.read_by_name("ELEC_EXT_PWR_FREQUENCY_NORMAL")
        }

        fn potential_is_normal(&mut self) -> bool {
            self.read_by_name("ELEC_EXT_PWR_POTENTIAL_NORMAL")
        }

        fn ext_pwr_is_powered(&self) -> bool {
            self.query_elec(|a, elec| a.ext_pwr_is_powered(elec))
        }
    }
    impl TestBed for ExternalPowerTestBed {
        type Aircraft = TestAircraft;

        fn test_bed(&self) -> &SimulationTestBed<TestAircraft> {
            &self.test_bed
        }

        fn test_bed_mut(&mut self) -> &mut SimulationTestBed<TestAircraft> {
            &mut self.test_bed
        }
    }

    #[derive(NestedElement)]
    struct TestAircraft {
        ext_pwr: ExternalPowerSource,
        ext_pwr_output_within_normal_parameters_before_processing_power_consumption_report: bool,
    }
    impl TestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                ext_pwr: ExternalPowerSource::new(context),
                ext_pwr_output_within_normal_parameters_before_processing_power_consumption_report: false,
            }
        }

        fn ext_pwr_is_powered(&self, electricity: &Electricity) -> bool {
            electricity.is_powered(&self.ext_pwr)
        }

        fn ext_pwr_output_within_normal_parameters_after_processing_power_consumption_report(
            &self,
        ) -> bool {
            self.ext_pwr.output_within_normal_parameters()
        }

        fn ext_pwr_output_within_normal_parameters_before_processing_power_consumption_report(
            &self,
        ) -> bool {
            self.ext_pwr_output_within_normal_parameters_before_processing_power_consumption_report
        }
    }
    impl Aircraft for TestAircraft {
        fn update_before_power_distribution(
            &mut self,
            _context: &UpdateContext,
            electricity: &mut Electricity,
        ) {
            electricity.supplied_by(&self.ext_pwr);
            self.ext_pwr_output_within_normal_parameters_before_processing_power_consumption_report = self.ext_pwr.output_within_normal_parameters();
        }
    }
    impl SimulationElement for TestAircraft {}

    #[test]
    fn when_disconnected_provides_no_output() {
        let mut test_bed = ExternalPowerTestBed::new().with_disconnected_external_power();

        test_bed.run();

        assert!(!test_bed.ext_pwr_is_powered());
    }

    #[test]
    fn when_connected_provides_output() {
        let mut test_bed = ExternalPowerTestBed::new().with_connected_external_power();

        test_bed.run();

        assert!(test_bed.ext_pwr_is_powered());
    }

    #[test]
    fn when_disconnected_frequency_not_normal() {
        let mut test_bed = ExternalPowerTestBed::new().with_disconnected_external_power();

        test_bed.run();

        assert!(!test_bed.frequency_is_normal());
    }

    #[test]
    fn when_connected_frequency_normal() {
        let mut test_bed = ExternalPowerTestBed::new().with_connected_external_power();

        test_bed.run();

        assert!(test_bed.frequency_is_normal());
    }

    #[test]
    fn when_disconnected_potential_not_normal() {
        let mut test_bed = ExternalPowerTestBed::new().with_disconnected_external_power();

        test_bed.run();

        assert!(!test_bed.potential_is_normal());
    }

    #[test]
    fn when_connected_potential_normal() {
        let mut test_bed = ExternalPowerTestBed::new().with_connected_external_power();

        test_bed.run();

        assert!(test_bed.potential_is_normal());
    }

    #[test]
    fn output_not_within_normal_parameters_when_disconnected() {
        let mut test_bed = ExternalPowerTestBed::new().with_disconnected_external_power();

        test_bed.run();

        assert!(!test_bed.query(|a| a
            .ext_pwr_output_within_normal_parameters_after_processing_power_consumption_report()));
    }

    #[test]
    fn output_within_normal_parameters_when_connected() {
        let mut test_bed = ExternalPowerTestBed::new().with_connected_external_power();

        test_bed.run();

        assert!(test_bed.query(|a| a
            .ext_pwr_output_within_normal_parameters_after_processing_power_consumption_report()));
    }

    #[test]
    fn output_within_normal_parameters_adapts_to_no_longer_supplying_ext_pwr_instantaneously() {
        // The frequency and potential of the external power source are only known at the end of a tick,
        // due to them being directly related to the power consumption (large changes can cause
        // spikes and dips). However, the decision if EXT PWR source can supply power is made much
        // earlier in the tick. This is especially of great consequence when EXT PWR source no longer
        // supplies potential but the previous tick's frequency and potential are still normal.
        // With this test we ensure that an EXT PWR source which is no longer supplying power is
        // immediately noticed.
        let mut test_bed = ExternalPowerTestBed::new().with_connected_external_power();
        test_bed.run();

        test_bed.disconnect_external_power();
        test_bed.run();

        assert!(!test_bed.query(|a| a
            .ext_pwr_output_within_normal_parameters_before_processing_power_consumption_report()));
    }

    #[test]
    fn writes_its_state() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.run();

        assert!(test_bed.contains_variable_with_name("ELEC_EXT_PWR_POTENTIAL"));
        assert!(test_bed.contains_variable_with_name("ELEC_EXT_PWR_POTENTIAL_NORMAL"));
        assert!(test_bed.contains_variable_with_name("ELEC_EXT_PWR_FREQUENCY"));
        assert!(test_bed.contains_variable_with_name("ELEC_EXT_PWR_FREQUENCY_NORMAL"));
    }
}
