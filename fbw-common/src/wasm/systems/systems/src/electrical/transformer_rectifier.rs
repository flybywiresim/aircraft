use std::cell::Ref;

use uom::si::{electric_current::ampere, electric_potential::volt, f64::*, power::watt};

use super::{
    ElectricalElement, ElectricalElementIdentifier, ElectricalElementIdentifierProvider,
    ElectricalStateWriter, ElectricityTransformer, Potential, PotentialOrigin, ProvideCurrent,
    ProvidePotential,
};
use crate::{
    failures::{Failure, FailureType},
    shared::{ConsumePower, PowerConsumptionReport},
    simulation::{
        InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
    },
};

pub struct TransformerRectifier {
    writer: ElectricalStateWriter,
    number: usize,
    input_identifier: ElectricalElementIdentifier,
    output_identifier: ElectricalElementIdentifier,
    failure: Failure,
    output_potential: ElectricPotential,
    output_current: ElectricCurrent,
}
impl TransformerRectifier {
    // Value determined by output voltage at specific loads
    const INTERNAL_RESISTANCE_OHM: f64 = 0.0135;
    // Potential output without any load
    const IDLE_OUTPUT_VOLTAGE: f64 = 30.2;

    pub fn new(context: &mut InitContext, number: usize) -> TransformerRectifier {
        TransformerRectifier {
            writer: ElectricalStateWriter::new(context, &format!("TR_{}", number)),
            number,
            input_identifier: context.next_electrical_identifier(),
            output_identifier: context.next_electrical_identifier(),
            failure: Failure::new(FailureType::TransformerRectifier(number)),
            output_potential: ElectricPotential::new::<volt>(0.),
            output_current: ElectricCurrent::new::<ampere>(0.),
        }
    }

    pub fn has_failed(&self) -> bool {
        self.failure.is_active()
    }

    fn calc_potential_for_power(power: Power) -> [ElectricPotential; 2] {
        let discriminant = (Self::IDLE_OUTPUT_VOLTAGE * Self::IDLE_OUTPUT_VOLTAGE / 4.
            - Self::INTERNAL_RESISTANCE_OHM * power.get::<watt>())
        .sqrt();
        [discriminant, -discriminant]
            .map(|d| -ElectricPotential::new::<volt>(-Self::IDLE_OUTPUT_VOLTAGE / 2. + d))
    }
}
impl ProvideCurrent for TransformerRectifier {
    fn current(&self) -> ElectricCurrent {
        self.output_current
    }

    fn current_normal(&self) -> bool {
        self.output_current > ElectricCurrent::new::<ampere>(5.)
    }
}
provide_potential!(TransformerRectifier, (25.0..=31.0));
impl ElectricalElement for TransformerRectifier {
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
impl ElectricityTransformer for TransformerRectifier {
    fn transform(&self, input: Ref<Potential>) -> Potential {
        if !self.failure.is_active() && input.is_powered() {
            Potential::new(
                PotentialOrigin::TransformerRectifier(self.number),
                ElectricPotential::new::<volt>(28.),
            )
        } else {
            Potential::none()
        }
    }
}
impl SimulationElement for TransformerRectifier {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.failure.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        self.writer.write_direct(self, writer);
    }

    fn consume_power_in_converters<T: ConsumePower>(
        &mut self,
        _: &UpdateContext,
        consumption: &mut T,
    ) {
        let dc_power =
            consumption.total_consumption_of(PotentialOrigin::TransformerRectifier(self.number));

        let [resistor_potential, dc_potential] = Self::calc_potential_for_power(dc_power);
        let dc_current = dc_power / dc_potential;
        let resistor_power = resistor_potential * dc_current;
        let ac_power = dc_power + resistor_power;

        // Add the DC consumption to the TRs input (AC) consumption.
        consumption.consume_from_input(self, ac_power);
    }

    fn process_power_consumption_report<T: PowerConsumptionReport>(
        &mut self,
        _: &UpdateContext,
        report: &T,
    ) {
        let consumption =
            report.total_consumption_of(PotentialOrigin::TransformerRectifier(self.number));
        self.output_potential = if report.is_powered(self) {
            Self::calc_potential_for_power(consumption)[1]
        } else {
            ElectricPotential::new::<volt>(0.)
        };

        self.output_current = consumption / self.output_potential;
    }
}

#[cfg(test)]
mod transformer_rectifier_tests {
    use uom::si::power::watt;

    use super::*;
    use crate::simulation::test::ReadByName;
    use crate::simulation::InitContext;
    use crate::{
        electrical::{
            consumption::PowerConsumer, test::TestElectricitySource, ElectricalBus,
            ElectricalBusType, Electricity, PotentialOrigin,
        },
        simulation::{
            test::{SimulationTestBed, TestBed},
            Aircraft, SimulationElementVisitor, UpdateContext,
        },
    };

    struct TransformerRectifierTestBed {
        test_bed: SimulationTestBed<TestAircraft>,
    }
    impl TransformerRectifierTestBed {
        fn with_unpowered_transformer_rectifier() -> Self {
            Self {
                test_bed: SimulationTestBed::new(|context| {
                    TestAircraft::new(context).with_unpowered_transformer_rectifier()
                }),
            }
        }

        fn with_powered_transformer_rectifier() -> Self {
            Self {
                test_bed: SimulationTestBed::new(|context| {
                    TestAircraft::new(context).with_powered_transformer_rectifier()
                }),
            }
        }

        fn current_is_normal(&mut self) -> bool {
            self.read_by_name("ELEC_TR_1_CURRENT_NORMAL")
        }

        fn potential_is_normal(&mut self) -> bool {
            self.read_by_name("ELEC_TR_1_POTENTIAL_NORMAL")
        }

        fn current(&mut self) -> ElectricCurrent {
            self.read_by_name("ELEC_TR_1_CURRENT")
        }

        fn potential(&mut self) -> ElectricPotential {
            self.read_by_name("ELEC_TR_1_POTENTIAL")
        }

        fn transformer_rectifier_is_powered(&self) -> bool {
            self.query_elec(|a, elec| a.transformer_rectifier_is_powered(elec))
        }
    }
    impl TestBed for TransformerRectifierTestBed {
        type Aircraft = TestAircraft;

        fn test_bed(&self) -> &SimulationTestBed<TestAircraft> {
            &self.test_bed
        }

        fn test_bed_mut(&mut self) -> &mut SimulationTestBed<TestAircraft> {
            &mut self.test_bed
        }
    }

    struct TestAircraft {
        electricity_source: TestElectricitySource,
        transformer_rectifier: TransformerRectifier,
        bus: ElectricalBus,
        consumer: PowerConsumer,
        transformer_rectifier_consumption: Power,
    }
    impl TestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                electricity_source: TestElectricitySource::unpowered(
                    context,
                    PotentialOrigin::ApuGenerator(1),
                ),
                transformer_rectifier: TransformerRectifier::new(context, 1),
                bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrent(1)),
                consumer: PowerConsumer::from(ElectricalBusType::DirectCurrent(1)),
                transformer_rectifier_consumption: Power::new::<watt>(0.),
            }
        }

        fn with_powered_transformer_rectifier(mut self) -> Self {
            self.electricity_source.power();
            self
        }

        fn with_unpowered_transformer_rectifier(mut self) -> Self {
            self.electricity_source.unpower();
            self
        }

        fn transformer_rectifier_is_powered(&self, electricity: &Electricity) -> bool {
            electricity.is_powered(&self.transformer_rectifier)
        }

        fn power_demand(&mut self, power: Power) {
            self.consumer.demand(power);
        }

        fn transformer_rectifier_consumption(&self) -> Power {
            self.transformer_rectifier_consumption
        }
    }
    impl Aircraft for TestAircraft {
        fn update_before_power_distribution(
            &mut self,
            _: &UpdateContext,
            electricity: &mut Electricity,
        ) {
            electricity.supplied_by(&self.electricity_source);
            electricity.flow(&self.electricity_source, &self.transformer_rectifier);
            electricity.transform_in(&self.transformer_rectifier);
            electricity.flow(&self.transformer_rectifier, &self.bus);
        }
    }
    impl SimulationElement for TestAircraft {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.transformer_rectifier.accept(visitor);
            self.consumer.accept(visitor);

            visitor.visit(self);
        }

        fn process_power_consumption_report<T: PowerConsumptionReport>(
            &mut self,
            _: &UpdateContext,
            report: &T,
        ) {
            self.transformer_rectifier_consumption =
                report.total_consumption_of(PotentialOrigin::TransformerRectifier(1));
        }
    }

    #[test]
    fn when_unpowered_has_no_output() {
        let mut test_bed = TransformerRectifierTestBed::with_unpowered_transformer_rectifier();

        test_bed.run();

        assert!(!test_bed.transformer_rectifier_is_powered());
    }

    #[test]
    fn when_powered_has_output() {
        let mut test_bed = TransformerRectifierTestBed::with_powered_transformer_rectifier();

        test_bed.run();

        assert!(test_bed.transformer_rectifier_is_powered());
    }

    #[test]
    fn when_powered_but_failed_has_no_output() {
        let mut test_bed = TransformerRectifierTestBed::with_powered_transformer_rectifier();
        test_bed.fail(FailureType::TransformerRectifier(1));

        test_bed.run();

        assert!(!test_bed.transformer_rectifier_is_powered());
    }

    #[test]
    fn when_unpowered_current_is_not_normal() {
        let mut test_bed = TransformerRectifierTestBed::with_unpowered_transformer_rectifier();

        test_bed.run();

        assert!(!test_bed.current_is_normal());
    }

    #[test]
    fn when_powered_with_too_little_demand_current_is_not_normal() {
        let mut test_bed = TransformerRectifierTestBed::with_powered_transformer_rectifier();

        test_bed.command(|a| a.power_demand(Power::new::<watt>(5. * 30.)));
        test_bed.run();

        assert!(!test_bed.current_is_normal());
    }

    #[test]
    fn when_powered_with_enough_demand_current_is_normal() {
        let mut test_bed = TransformerRectifierTestBed::with_powered_transformer_rectifier();

        test_bed.command(|a| a.power_demand(Power::new::<watt>((5. * 30.) + 1.)));
        test_bed.run();

        assert!(test_bed.current_is_normal());
    }

    #[test]
    fn when_unpowered_potential_is_not_normal() {
        let mut test_bed = TransformerRectifierTestBed::with_unpowered_transformer_rectifier();

        test_bed.run();

        assert!(!test_bed.potential_is_normal());
    }

    #[test]
    fn when_powered_potential_is_normal() {
        let mut test_bed = TransformerRectifierTestBed::with_powered_transformer_rectifier();

        test_bed.run();

        assert!(test_bed.potential_is_normal());
    }

    #[test]
    fn when_unpowered_has_no_consumption() {
        let mut test_bed = TransformerRectifierTestBed::with_unpowered_transformer_rectifier();

        test_bed.run();

        assert_eq!(
            test_bed.query(|a| a.transformer_rectifier_consumption()),
            Power::new::<watt>(0.)
        );
    }

    #[test]
    fn when_powered_without_demand_has_no_consumption() {
        let mut test_bed = TransformerRectifierTestBed::with_powered_transformer_rectifier();

        test_bed.command(|a| a.power_demand(Power::new::<watt>(0.)));
        test_bed.run();

        assert_eq!(
            test_bed.query(|a| a.transformer_rectifier_consumption()),
            Power::new::<watt>(0.)
        );
    }

    #[test]
    fn when_powered_with_demand_has_consumption() {
        let mut test_bed = TransformerRectifierTestBed::with_powered_transformer_rectifier();

        test_bed.command(|a| a.power_demand(Power::new::<watt>(200.)));
        test_bed.run();

        assert_eq!(
            test_bed.query(|a| a.transformer_rectifier_consumption()),
            Power::new::<watt>(200.)
        );
    }

    #[test]
    fn when_powered_with_demand_current_is_based_on_demand() {
        let mut test_bed = TransformerRectifierTestBed::with_powered_transformer_rectifier();

        let demand = Power::new::<watt>(200.);
        test_bed.command(|a| a.power_demand(demand));
        test_bed.run();

        assert_eq!(test_bed.current(), demand / test_bed.potential());
    }

    #[test]
    fn writes_its_state() {
        let mut test_bed = TransformerRectifierTestBed::with_powered_transformer_rectifier();

        test_bed.run();

        assert!(test_bed.contains_variable_with_name("ELEC_TR_1_CURRENT"));
        assert!(test_bed.contains_variable_with_name("ELEC_TR_1_CURRENT_NORMAL"));
        assert!(test_bed.contains_variable_with_name("ELEC_TR_1_POTENTIAL"));
        assert!(test_bed.contains_variable_with_name("ELEC_TR_1_POTENTIAL_NORMAL"));
    }
}
