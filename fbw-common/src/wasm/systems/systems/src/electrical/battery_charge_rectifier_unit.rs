use std::{cell::Ref, time::Duration};

use uom::si::{electric_current::ampere, electric_potential::volt, f64::*, power::watt};

use super::{
    BatteryPushButtons, ElectricalElement, ElectricalElementIdentifier,
    ElectricalElementIdentifierProvider, ElectricalStateWriter, Electricity,
    ElectricityTransformer, Potential, ProvideCurrent, ProvidePotential,
};
use crate::{
    failures::{Failure, FailureType},
    shared::{ConsumePower, ElectricalBusType, PotentialOrigin, PowerConsumptionReport},
    simulation::{
        InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
    },
};

pub struct BatteryChargeRectifierUnit {
    writer: ElectricalStateWriter,
    input_identifier: ElectricalElementIdentifier,
    output_identifier: ElectricalElementIdentifier,
    output_potential: ElectricPotential,
    output_current: ElectricCurrent,
    number: usize,
    battery_hot_bus: ElectricalBusType,
    failure: Failure,
    battery_soc_20: bool,
    battery_pb_is_auto: bool,
    backup_is_powered: bool,
    contactor_closed: bool,
    ground_service_contactor_closed: bool,
    ground_servicing: bool,
    loss_of_ac_duration: Duration,
    overcurrent_duration: Duration,
    failed_time: Duration,
    state: State,
}
impl BatteryChargeRectifierUnit {
    const INTERNAL_RESISTANCE_OHM: f64 = 0.0135;

    pub fn new(
        context: &mut InitContext,
        number: usize,
        battery_hot_bus: ElectricalBusType,
    ) -> Self {
        Self {
            writer: ElectricalStateWriter::new(context, &format!("TR_{number}")),
            input_identifier: context.next_electrical_identifier(),
            output_identifier: context.next_electrical_identifier(),
            output_potential: ElectricPotential::default(),
            output_current: ElectricCurrent::default(),
            number,
            battery_hot_bus,
            failure: Failure::new(FailureType::TransformerRectifier(number)),
            battery_soc_20: false,
            battery_pb_is_auto: false,
            backup_is_powered: false,
            contactor_closed: false,
            ground_service_contactor_closed: false,
            ground_servicing: false,
            loss_of_ac_duration: Duration::default(),
            overcurrent_duration: Duration::default(),
            failed_time: Duration::default(),
            state: State::new(),
        }
    }

    pub fn update_before_direct_current(
        &mut self,
        context: &UpdateContext,
        electricity: &Electricity,
        battery: &impl ProvidePotential,
        battery_push_buttons: &impl BatteryPushButtons,
        ground_servicing: bool,
    ) {
        self.battery_pb_is_auto = battery_push_buttons.bat_is_auto(self.number);
        let ac_bus_powered = electricity.is_powered(self);

        self.loss_of_ac_duration = if ac_bus_powered || self.ground_servicing && !ground_servicing {
            Duration::default()
        } else {
            self.loss_of_ac_duration + context.delta()
        };
        self.failed_time = if self.is_failed() {
            Duration::default()
        } else {
            self.failed_time + context.delta()
        };
        self.overcurrent_duration = if self.output_current.get::<ampere>() > 300. {
            self.overcurrent_duration + context.delta()
        } else {
            Duration::default()
        };

        self.ground_servicing = ground_servicing;
        self.contactor_closed = !ground_servicing
            && (ac_bus_powered
                || self.contactor_closed && self.loss_of_ac_duration < Duration::from_secs(3));
        self.ground_service_contactor_closed = ground_servicing && ac_bus_powered;

        // The battery contactor opens when the battery SOC < 20%
        self.battery_soc_20 = battery.potential().get::<volt>() < 24.5;
    }

    pub fn update(&mut self, emergency_config: bool) {
        self.state = self.state.update(
            self.battery_pb_is_auto,
            emergency_config,
            self.loss_of_ac_duration,
            self.ground_servicing,
        );
    }

    pub fn should_close_line_contactor(&self) -> bool {
        self.contactor_closed
    }

    pub fn should_close_ground_service_line_contactor(&self) -> bool {
        self.ground_service_contactor_closed
    }

    pub fn should_close_battery_connector(&self) -> bool {
        self.state.should_close_battery_connector()
    }

    pub fn battery_nearly_empty(&self) -> bool {
        self.battery_soc_20
    }

    pub fn is_failed(&self) -> bool {
        self.failure.is_active()
    }

    pub fn is_in_overcurrent_protection(&self) -> bool {
        self.overcurrent_duration >= Duration::from_secs(5)
            || self.output_current.get::<ampere>() > 450.
    }
}
impl ProvideCurrent for BatteryChargeRectifierUnit {
    fn current(&self) -> ElectricCurrent {
        self.output_current
    }

    fn current_normal(&self) -> bool {
        self.output_current > ElectricCurrent::new::<ampere>(5.)
    }
}
provide_potential!(BatteryChargeRectifierUnit, (27.0..=32.0));
impl ElectricalElement for BatteryChargeRectifierUnit {
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
impl ElectricityTransformer for BatteryChargeRectifierUnit {
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
impl SimulationElement for BatteryChargeRectifierUnit {
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
        let current = dc_power.get::<watt>() / 28.;
        let resistor_potential = current * Self::INTERNAL_RESISTANCE_OHM;
        let ac_power = dc_power + Power::new::<watt>(current * resistor_potential);

        // Add the DC consumption to the TRs input (AC) consumption.
        consumption.consume_from_input(self, ac_power);
    }

    fn process_power_consumption_report<T: PowerConsumptionReport>(
        &mut self,
        _: &UpdateContext,
        report: &T,
    ) {
        self.output_potential =
            ElectricPotential::new::<volt>(if report.is_powered(self) { 28. } else { 0. });

        let consumption =
            report.total_consumption_of(PotentialOrigin::TransformerRectifier(self.number));
        self.output_current = consumption / self.output_potential;
    }

    fn receive_power(&mut self, buses: &impl crate::shared::ElectricalBuses) {
        self.backup_is_powered = self.battery_pb_is_auto && buses.is_powered(self.battery_hot_bus);
    }
}

#[derive(Clone, Copy)]
enum State {
    BatOff,
    Open,
    Closed,
}
impl State {
    const OPEN_BAT_LC_AFTER_AC_LOST_DURATION: Duration = Duration::from_secs(5);

    fn new() -> Self {
        Self::Open
    }

    fn update(
        self,
        battery_is_auto: bool,
        emergency_config: bool,
        loss_of_ac_duration: Duration,
        ground_servicing: bool,
    ) -> Self {
        match self {
            Self::BatOff => {
                if battery_is_auto || emergency_config {
                    Self::Open
                } else {
                    Self::BatOff
                }
            }
            Self::Open => {
                if emergency_config || ground_servicing {
                    Self::Open
                } else if !battery_is_auto {
                    Self::BatOff
                } else if loss_of_ac_duration.is_zero() {
                    Self::Closed
                } else {
                    Self::Open
                }
            }
            Self::Closed => {
                if emergency_config
                    || ground_servicing
                    || loss_of_ac_duration >= Self::OPEN_BAT_LC_AFTER_AC_LOST_DURATION
                {
                    Self::Open
                } else if !battery_is_auto {
                    Self::BatOff
                } else {
                    Self::Closed
                }
            }
        }
    }

    fn should_close_battery_connector(&self) -> bool {
        matches!(self, Self::Closed)
    }
}

#[cfg(test)]
mod battery_charger_rectifier_tests {
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
        transformer_rectifier: BatteryChargeRectifierUnit,
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
                transformer_rectifier: BatteryChargeRectifierUnit::new(
                    context,
                    1,
                    ElectricalBusType::DirectCurrentHot(1),
                ),
                bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrent(1)),
                consumer: PowerConsumer::from(ElectricalBusType::DirectCurrent(1)),
                transformer_rectifier_consumption: Power::default(),
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

        test_bed.command(|a| a.power_demand(Power::new::<watt>(5. * 28.)));
        test_bed.run();

        assert!(!test_bed.current_is_normal());
    }

    #[test]
    fn when_powered_with_enough_demand_current_is_normal() {
        let mut test_bed = TransformerRectifierTestBed::with_powered_transformer_rectifier();

        test_bed.command(|a| a.power_demand(Power::new::<watt>((5. * 28.) + 1.)));
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

        test_bed.command(|a| a.power_demand(Power::new::<watt>(200.)));
        test_bed.run();

        assert_eq!(
            test_bed.current(),
            ElectricCurrent::new::<ampere>(200. / 28.)
        );
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
