use std::cell::Ref;

use uom::si::{electric_potential::volt, f64::*, frequency::hertz};

use super::{
    ElectricalElement, ElectricalElementIdentifier, ElectricalElementIdentifierProvider,
    ElectricalStateWriter, ElectricityTransformer, Potential, PotentialOrigin, ProvideFrequency,
    ProvidePotential,
};
use crate::{
    shared::{ConsumePower, PowerConsumptionReport},
    simulation::{InitContext, NestedElement, SimulationElement, SimulatorWriter, UpdateContext},
};

#[derive(NestedElement)]
pub struct StaticInverter {
    input_identifier: ElectricalElementIdentifier,
    output_identifier: ElectricalElementIdentifier,
    writer: ElectricalStateWriter,
    output_potential: ElectricPotential,
    output_frequency: Frequency,
}
impl StaticInverter {
    pub fn new(context: &mut InitContext) -> StaticInverter {
        StaticInverter {
            input_identifier: context.next_electrical_identifier(),
            output_identifier: context.next_electrical_identifier(),
            writer: ElectricalStateWriter::new(context, "STAT_INV"),
            output_potential: ElectricPotential::new::<volt>(0.),
            output_frequency: Frequency::new::<hertz>(0.),
        }
    }
}
provide_potential!(StaticInverter, (110.0..=120.0));
provide_frequency!(StaticInverter, (390.0..=410.0));
impl ElectricalElement for StaticInverter {
    fn input_identifier(&self) -> ElectricalElementIdentifier {
        self.input_identifier
    }

    fn output_identifier(&self) -> ElectricalElementIdentifier {
        self.output_identifier
    }

    fn is_conductive(&self) -> bool {
        true
    }
}
impl ElectricityTransformer for StaticInverter {
    fn transform(&self, input: Ref<Potential>) -> super::Potential {
        if input.is_powered() {
            Potential::new(PotentialOrigin::StaticInverter, self.output_potential)
        } else {
            Potential::none()
        }
    }
}
impl SimulationElement for StaticInverter {
    fn write(&self, writer: &mut SimulatorWriter) {
        self.writer.write_alternating(self, writer);
    }

    fn consume_power_in_converters<T: ConsumePower>(
        &mut self,
        _: &UpdateContext,
        consumption: &mut T,
    ) {
        let ac_power = consumption.total_consumption_of(PotentialOrigin::StaticInverter);

        // Add the AC consumption to the STAT INVs input (DC) consumption.
        // Currently static inverter inefficiency isn't modelled.
        // It is to be expected that DC consumption should actually be somewhat
        // higher than AC consumption.
        consumption.consume_from_input(self, ac_power);
    }

    fn process_power_consumption_report<T: PowerConsumptionReport>(
        &mut self,
        _: &UpdateContext,
        report: &T,
    ) {
        let has_output = report.is_powered(self);
        self.output_potential = if has_output {
            ElectricPotential::new::<volt>(115.)
        } else {
            ElectricPotential::new::<volt>(0.)
        };

        self.output_frequency = if has_output {
            Frequency::new::<hertz>(400.)
        } else {
            Frequency::new::<hertz>(0.)
        };
    }
}

#[cfg(test)]
mod static_inverter_tests {
    use uom::si::power::watt;

    use super::*;
    use crate::simulation::test::ReadByName;
    use crate::simulation::InitContext;
    use crate::{
        electrical::{
            consumption::PowerConsumer, test::TestElectricitySource, ElectricalBus,
            ElectricalBusType, Electricity,
        },
        simulation::{
            test::{SimulationTestBed, TestBed},
            Aircraft, UpdateContext,
        },
    };

    struct StaticInverterTestBed {
        test_bed: SimulationTestBed<TestAircraft>,
    }
    impl StaticInverterTestBed {
        fn with_powered_static_inverter() -> Self {
            Self {
                test_bed: SimulationTestBed::new(|context| {
                    TestAircraft::new(context).with_powered_static_inverter()
                }),
            }
        }

        fn with_unpowered_static_inverter() -> Self {
            Self {
                test_bed: SimulationTestBed::new(|context| {
                    TestAircraft::new(context).with_unpowered_static_inverter()
                }),
            }
        }

        fn frequency_is_normal(&mut self) -> bool {
            self.read_by_name("ELEC_STAT_INV_FREQUENCY_NORMAL")
        }

        fn potential_is_normal(&mut self) -> bool {
            self.read_by_name("ELEC_STAT_INV_POTENTIAL_NORMAL")
        }

        fn static_inverter_is_powered(&self) -> bool {
            self.query_elec(|a, elec| a.static_inverter_is_powered(elec))
        }
    }
    impl TestBed for StaticInverterTestBed {
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
        electricity_source: TestElectricitySource,
        bus: ElectricalBus,
        static_inverter: StaticInverter,
        consumer: PowerConsumer,
        static_inverter_consumption: Power,
    }
    impl TestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                electricity_source: TestElectricitySource::unpowered(
                    context,
                    PotentialOrigin::Battery(1),
                ),
                bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrentEssential),
                consumer: PowerConsumer::from(ElectricalBusType::AlternatingCurrentEssential),
                static_inverter: StaticInverter::new(context),
                static_inverter_consumption: Power::new::<watt>(0.),
            }
        }

        fn with_powered_static_inverter(mut self) -> Self {
            self.electricity_source.power();
            self
        }

        fn with_unpowered_static_inverter(mut self) -> Self {
            self.electricity_source.unpower();
            self
        }

        fn static_inverter_is_powered(&self, electricity: &Electricity) -> bool {
            electricity.is_powered(&self.static_inverter)
        }

        fn power_demand(&mut self, power: Power) {
            self.consumer.demand(power);
        }

        fn static_inverter_consumption(&self) -> Power {
            self.static_inverter_consumption
        }
    }
    impl Aircraft for TestAircraft {
        fn update_before_power_distribution(
            &mut self,
            _: &UpdateContext,
            electricity: &mut Electricity,
        ) {
            electricity.supplied_by(&self.electricity_source);
            electricity.flow(&self.electricity_source, &self.static_inverter);
            electricity.transform_in(&self.static_inverter);
            electricity.flow(&self.static_inverter, &self.bus);
        }
    }
    impl SimulationElement for TestAircraft {
        fn process_power_consumption_report<T: PowerConsumptionReport>(
            &mut self,
            _: &UpdateContext,
            report: &T,
        ) {
            self.static_inverter_consumption =
                report.total_consumption_of(PotentialOrigin::StaticInverter);
        }
    }

    #[test]
    fn when_unpowered_has_no_output() {
        let mut test_bed = StaticInverterTestBed::with_unpowered_static_inverter();

        test_bed.run();

        assert!(!test_bed.static_inverter_is_powered());
    }

    #[test]
    fn when_powered_has_output() {
        let mut test_bed = StaticInverterTestBed::with_powered_static_inverter();

        test_bed.run();

        assert!(test_bed.static_inverter_is_powered());
    }

    #[test]
    fn when_unpowered_frequency_is_not_normal() {
        let mut test_bed = StaticInverterTestBed::with_unpowered_static_inverter();

        test_bed.run();

        assert!(!test_bed.frequency_is_normal());
    }

    #[test]
    fn when_powered_frequency_is_normal() {
        let mut test_bed = StaticInverterTestBed::with_powered_static_inverter();

        test_bed.run();

        assert!(test_bed.frequency_is_normal());
    }

    #[test]
    fn when_unpowered_potential_is_not_normal() {
        let mut test_bed = StaticInverterTestBed::with_unpowered_static_inverter();

        test_bed.run();

        assert!(!test_bed.potential_is_normal());
    }

    #[test]
    fn when_powered_potential_is_normal() {
        let mut test_bed = StaticInverterTestBed::with_powered_static_inverter();

        test_bed.run();

        assert!(test_bed.potential_is_normal());
    }

    #[test]
    fn when_unpowered_has_no_consumption() {
        let mut test_bed = StaticInverterTestBed::with_unpowered_static_inverter();

        test_bed.run();

        assert_eq!(
            test_bed.query(|a| a.static_inverter_consumption()),
            Power::new::<watt>(0.)
        );
    }

    #[test]
    fn when_powered_without_demand_has_no_consumption() {
        let mut test_bed = StaticInverterTestBed::with_powered_static_inverter();

        test_bed.command(|a| a.power_demand(Power::new::<watt>(0.)));
        test_bed.run();

        assert_eq!(
            test_bed.query(|a| a.static_inverter_consumption()),
            Power::new::<watt>(0.)
        );
    }

    #[test]
    fn when_powered_with_demand_has_consumption() {
        let mut test_bed = StaticInverterTestBed::with_powered_static_inverter();

        test_bed.command(|a| a.power_demand(Power::new::<watt>(200.)));
        test_bed.run();

        assert_eq!(
            test_bed.query(|a| a.static_inverter_consumption()),
            Power::new::<watt>(200.)
        );
    }

    #[test]
    fn writes_its_state() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.run();

        assert!(test_bed.contains_variable_with_name("ELEC_STAT_INV_POTENTIAL"));
        assert!(test_bed.contains_variable_with_name("ELEC_STAT_INV_POTENTIAL_NORMAL"));
        assert!(test_bed.contains_variable_with_name("ELEC_STAT_INV_FREQUENCY"));
        assert!(test_bed.contains_variable_with_name("ELEC_STAT_INV_FREQUENCY_NORMAL"));
    }
}
