use super::{
    ElectricalElement, ElectricalElementIdentifier, ElectricalElementIdentifierProvider,
    ElectricalStateWriter, Potential, PotentialOrigin, PotentialSource, PotentialTarget,
    ProvideFrequency, ProvidePotential,
};
use crate::{
    shared::{ConsumePower, PowerConsumptionReport},
    simulation::{SimulationElement, SimulatorWriter},
};
use uom::si::{electric_potential::volt, f64::*, frequency::hertz};

pub struct StaticInverter {
    identifier: ElectricalElementIdentifier,
    writer: ElectricalStateWriter,
    input_potential: Potential,
    output_potential: ElectricPotential,
    output_frequency: Frequency,
}
impl StaticInverter {
    pub fn new(
        identifier_provider: &mut impl ElectricalElementIdentifierProvider,
    ) -> StaticInverter {
        StaticInverter {
            identifier: identifier_provider.next(),
            writer: ElectricalStateWriter::new("STAT_INV"),
            input_potential: Potential::none(),
            output_potential: ElectricPotential::new::<volt>(0.),
            output_frequency: Frequency::new::<hertz>(0.),
        }
    }

    pub fn input_potential(&self) -> Potential {
        self.input_potential
    }

    fn should_provide_output(&self) -> bool {
        self.input_potential.is_powered()
    }
}
potential_target!(StaticInverter);
impl PotentialSource for StaticInverter {
    fn output(&self) -> Potential {
        if self.should_provide_output() {
            Potential::single(PotentialOrigin::StaticInverter, self.output_potential)
        } else {
            Potential::none()
        }
    }
}
provide_potential!(StaticInverter, (110.0..=120.0));
provide_frequency!(StaticInverter, (390.0..=410.0));
impl ElectricalElement for StaticInverter {
    fn input_identifier(&self) -> ElectricalElementIdentifier {
        self.identifier
    }

    fn output_identifier(&self) -> ElectricalElementIdentifier {
        self.identifier
    }

    fn is_conductive(&self) -> bool {
        true
    }
}
impl SimulationElement for StaticInverter {
    fn write(&self, writer: &mut SimulatorWriter) {
        self.writer.write_alternating(self, writer);
    }

    fn consume_power_in_converters<T: ConsumePower>(&mut self, consumption: &mut T) {
        let ac_power = consumption.total_consumption_of(PotentialOrigin::StaticInverter);

        // Add the AC consumption to the STAT INVs input (DC) consumption.
        // Currently static inverter inefficiency isn't modelled.
        // It is to be expected that DC consumption should actually be somewhat
        // higher than AC consumption.
        consumption.consume(self.input_potential, ac_power);
    }

    fn process_power_consumption_report<T: PowerConsumptionReport>(&mut self, _: &T) {
        self.output_potential = if self.should_provide_output() {
            ElectricPotential::new::<volt>(115.)
        } else {
            ElectricPotential::new::<volt>(0.)
        };

        self.output_frequency = if self.should_provide_output() {
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
    use crate::{
        electrical::{
            consumption::{PowerConsumer, SuppliedPower},
            ElectricalBusType, Electricity,
        },
        simulation::{test::SimulationTestBed, Aircraft, SimulationElementVisitor},
    };

    struct Powerless {}
    impl PotentialSource for Powerless {
        fn output(&self) -> Potential {
            Potential::none()
        }
    }

    struct Powered {}
    impl PotentialSource for Powered {
        fn output(&self) -> Potential {
            Potential::single(
                PotentialOrigin::Battery(1),
                ElectricPotential::new::<volt>(28.),
            )
        }
    }

    struct StaticInverterTestBed {
        test_bed: SimulationTestBed,
    }
    impl StaticInverterTestBed {
        fn new() -> Self {
            Self {
                test_bed: SimulationTestBed::new(),
            }
        }

        fn run_aircraft(&mut self, aircraft: &mut impl Aircraft) {
            self.test_bed.run_aircraft(aircraft);
        }

        fn frequency_is_normal(&mut self) -> bool {
            self.test_bed.read_bool("ELEC_STAT_INV_FREQUENCY_NORMAL")
        }

        fn potential_is_normal(&mut self) -> bool {
            self.test_bed.read_bool("ELEC_STAT_INV_POTENTIAL_NORMAL")
        }
    }

    struct TestAircraft {
        static_inverter: StaticInverter,
        consumer: PowerConsumer,
        static_inverter_consumption: Power,
    }
    impl TestAircraft {
        fn new() -> Self {
            let mut electricity = Electricity::new();
            Self {
                static_inverter: StaticInverter::new(&mut electricity),
                consumer: PowerConsumer::from(ElectricalBusType::AlternatingCurrentEssential),
                static_inverter_consumption: Power::new::<watt>(0.),
            }
        }

        fn with_powered_static_inverter(mut self) -> Self {
            self.static_inverter.powered_by(&Powered {});
            self
        }

        fn with_unpowered_static_inverter(mut self) -> Self {
            self.static_inverter.powered_by(&Powerless {});
            self
        }

        fn static_inverter_is_powered(&self) -> bool {
            self.static_inverter.is_powered()
        }

        fn power_demand(&mut self, power: Power) {
            self.consumer.demand(power);
        }

        fn static_inverter_consumption(&self) -> Power {
            self.static_inverter_consumption
        }
    }
    impl Aircraft for TestAircraft {
        fn get_supplied_power(&mut self) -> SuppliedPower {
            let mut supplied_power = SuppliedPower::new();
            if self.static_inverter.is_powered() {
                supplied_power.add(
                    ElectricalBusType::AlternatingCurrentEssential,
                    Potential::single(
                        PotentialOrigin::StaticInverter,
                        ElectricPotential::new::<volt>(115.),
                    ),
                );
            }

            supplied_power
        }
    }
    impl SimulationElement for TestAircraft {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.static_inverter.accept(visitor);
            self.consumer.accept(visitor);

            visitor.visit(self);
        }

        fn process_power_consumption_report<T: PowerConsumptionReport>(&mut self, report: &T) {
            self.static_inverter_consumption =
                report.total_consumption_of(PotentialOrigin::StaticInverter);
        }
    }

    #[test]
    fn when_unpowered_has_no_output() {
        let mut aircraft = TestAircraft::new().with_unpowered_static_inverter();
        let mut test_bed = StaticInverterTestBed::new();

        test_bed.run_aircraft(&mut aircraft);

        assert!(!aircraft.static_inverter_is_powered());
    }

    #[test]
    fn when_powered_has_output() {
        let mut aircraft = TestAircraft::new().with_powered_static_inverter();
        let mut test_bed = StaticInverterTestBed::new();

        test_bed.run_aircraft(&mut aircraft);

        assert!(aircraft.static_inverter_is_powered());
    }

    #[test]
    fn when_unpowered_frequency_is_not_normal() {
        let mut aircraft = TestAircraft::new().with_unpowered_static_inverter();
        let mut test_bed = StaticInverterTestBed::new();

        test_bed.run_aircraft(&mut aircraft);

        assert!(!test_bed.frequency_is_normal());
    }

    #[test]
    fn when_powered_frequency_is_normal() {
        let mut aircraft = TestAircraft::new().with_powered_static_inverter();
        let mut test_bed = StaticInverterTestBed::new();

        test_bed.run_aircraft(&mut aircraft);

        assert!(test_bed.frequency_is_normal());
    }

    #[test]
    fn when_unpowered_potential_is_not_normal() {
        let mut aircraft = TestAircraft::new().with_unpowered_static_inverter();
        let mut test_bed = StaticInverterTestBed::new();

        test_bed.run_aircraft(&mut aircraft);

        assert!(!test_bed.potential_is_normal());
    }

    #[test]
    fn when_powered_potential_is_normal() {
        let mut aircraft = TestAircraft::new().with_powered_static_inverter();
        let mut test_bed = StaticInverterTestBed::new();

        test_bed.run_aircraft(&mut aircraft);

        assert!(test_bed.potential_is_normal());
    }

    #[test]
    fn when_unpowered_has_no_consumption() {
        let mut aircraft = TestAircraft::new().with_unpowered_static_inverter();
        let mut test_bed = StaticInverterTestBed::new();

        test_bed.run_aircraft(&mut aircraft);

        assert_eq!(
            aircraft.static_inverter_consumption(),
            Power::new::<watt>(0.)
        );
    }

    #[test]
    fn when_powered_without_demand_has_no_consumption() {
        let mut aircraft = TestAircraft::new().with_powered_static_inverter();
        let mut test_bed = StaticInverterTestBed::new();

        aircraft.power_demand(Power::new::<watt>(0.));
        test_bed.run_aircraft(&mut aircraft);

        assert_eq!(
            aircraft.static_inverter_consumption(),
            Power::new::<watt>(0.)
        );
    }

    #[test]
    fn when_powered_with_demand_has_consumption() {
        let mut aircraft = TestAircraft::new().with_powered_static_inverter();
        let mut test_bed = StaticInverterTestBed::new();

        aircraft.power_demand(Power::new::<watt>(200.));
        test_bed.run_aircraft(&mut aircraft);

        assert_eq!(
            aircraft.static_inverter_consumption(),
            Power::new::<watt>(200.)
        );
    }

    #[test]
    fn writes_its_state() {
        let mut aircraft = TestAircraft::new();
        let mut test_bed = SimulationTestBed::new();

        test_bed.run_aircraft(&mut aircraft);

        assert!(test_bed.contains_key("ELEC_STAT_INV_POTENTIAL"));
        assert!(test_bed.contains_key("ELEC_STAT_INV_POTENTIAL_NORMAL"));
        assert!(test_bed.contains_key("ELEC_STAT_INV_FREQUENCY"));
        assert!(test_bed.contains_key("ELEC_STAT_INV_FREQUENCY_NORMAL"));
    }
}
