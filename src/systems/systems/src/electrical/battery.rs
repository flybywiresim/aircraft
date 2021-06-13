use super::{
    ElectricalElement, ElectricalElementIdentifier, ElectricalElementIdentifierProvider,
    ElectricalStateWriter, ElectricitySource, NewPotential, PotentialOrigin, ProvideCurrent,
    ProvidePotential,
};
use crate::{
    shared::{ConsumePower, PowerConsumptionReport},
    simulation::{SimulationElement, SimulatorWriter},
};
use uom::si::{
    electric_charge::ampere_hour, electric_current::ampere, electric_potential::volt,
    electrical_resistance::ohm, f64::*, time::second,
};

pub struct Battery {
    number: usize,
    identifier: ElectricalElementIdentifier,
    writer: ElectricalStateWriter,
    charge: ElectricCharge,
    input_potential: ElectricPotential,
    output_potential: ElectricPotential,
    current: ElectricCurrent,
}
impl Battery {
    const RATED_CAPACITY_AMPERE_HOURS: f64 = 23.;

    pub fn full(
        number: usize,
        identifier_provider: &mut impl ElectricalElementIdentifierProvider,
    ) -> Battery {
        Battery::new(
            number,
            ElectricCharge::new::<ampere_hour>(Battery::RATED_CAPACITY_AMPERE_HOURS),
            identifier_provider,
        )
    }

    pub fn half(
        number: usize,
        identifier_provider: &mut impl ElectricalElementIdentifierProvider,
    ) -> Battery {
        Battery::new(
            number,
            ElectricCharge::new::<ampere_hour>(Battery::RATED_CAPACITY_AMPERE_HOURS / 2.),
            identifier_provider,
        )
    }

    pub fn empty(
        number: usize,
        identifier_provider: &mut impl ElectricalElementIdentifierProvider,
    ) -> Battery {
        Battery::new(
            number,
            ElectricCharge::new::<ampere_hour>(0.),
            identifier_provider,
        )
    }

    pub fn new(
        number: usize,
        charge: ElectricCharge,
        identifier_provider: &mut impl ElectricalElementIdentifierProvider,
    ) -> Self {
        Self {
            number,
            identifier: identifier_provider.next(),
            writer: ElectricalStateWriter::new(&format!("BAT_{}", number)),
            charge,
            input_potential: ElectricPotential::new::<volt>(0.),
            output_potential: Battery::calculate_output_potential_for_charge(charge),
            current: ElectricCurrent::new::<ampere>(0.),
        }
    }

    pub fn needs_charging(&self) -> bool {
        self.charge <= ElectricCharge::new::<ampere_hour>(Battery::RATED_CAPACITY_AMPERE_HOURS - 3.)
    }

    fn is_powered_by_other_potential(&self) -> bool {
        self.input_potential > self.output_potential
    }

    #[cfg(test)]
    fn charge(&self) -> ElectricCharge {
        self.charge
    }

    #[cfg(test)]
    pub(crate) fn set_full_charge(&mut self) {
        self.charge = ElectricCharge::new::<ampere_hour>(Battery::RATED_CAPACITY_AMPERE_HOURS);
        self.output_potential = Battery::calculate_output_potential_for_charge(self.charge);
    }

    #[cfg(test)]
    pub(crate) fn set_nearly_empty_battery_charge(&mut self) {
        self.charge = ElectricCharge::new::<ampere_hour>(1.);
        self.output_potential = Battery::calculate_output_potential_for_charge(self.charge);
    }

    fn calculate_output_potential_for_charge(charge: ElectricCharge) -> ElectricPotential {
        // There are four distinct charges, being:
        // 1. No charge, giving no potential.
        // 2. Low charge, rapidly decreasing from 26.578V.
        // 3. Regular charge, linear from 26.578V to 27.33V.
        // 4. High charge, rapidly increasing from 27.33V to 28.958V.
        // Refer to Battery.md for details.
        let charge = charge.get::<ampere_hour>();
        ElectricPotential::new::<volt>(if charge <= 0. {
            0.
        } else if charge <= 3.488 {
            (13.95303731988 * charge) - 2. * charge.powi(2)
        } else if charge < 22.449 {
            23.85 + 0.14 * charge
        } else {
            8483298.
                + (-2373273.312763873 * charge)
                + (276476.10619333945 * charge.powi(2))
                + (-17167.409762003314 * charge.powi(3))
                + (599.2597390001015 * charge.powi(4))
                + (-11.149802489333474 * charge.powi(5))
                + (0.08638809969727154 * charge.powi(6))
        })
    }

    fn calculate_charging_current(
        input: ElectricPotential,
        output: ElectricPotential,
    ) -> ElectricCurrent {
        // Internal resistance = 0.011 ohm. However that would make current go through the roof.
        // Thus we add some fake wire resistance here too. If needed, later one can
        // add resistance of wires between buses to calculate correct values.
        let resistance = ElectricalResistance::new::<ohm>(0.15);
        ((input - output) / resistance)
            .min(ElectricCurrent::new::<ampere>(10.))
            .max(ElectricCurrent::new::<ampere>(0.))
    }
}
impl ProvideCurrent for Battery {
    fn current(&self) -> ElectricCurrent {
        self.current
    }

    fn current_normal(&self) -> bool {
        (ElectricCurrent::new::<ampere>(-5.0)..=ElectricCurrent::new::<ampere>(f64::MAX))
            .contains(&self.current)
    }
}
impl ProvidePotential for Battery {
    fn potential(&self) -> ElectricPotential {
        self.output_potential.max(self.input_potential)
    }

    fn potential_normal(&self) -> bool {
        (ElectricPotential::new::<volt>(25.0)..=ElectricPotential::new::<volt>(31.0))
            .contains(&ProvidePotential::potential(self))
    }
}
impl ElectricalElement for Battery {
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
impl ElectricitySource for Battery {
    fn output_potential(&self) -> NewPotential {
        if self.output_potential > ElectricPotential::new::<volt>(0.) {
            NewPotential::new(PotentialOrigin::Battery(self.number), self.output_potential)
        } else {
            NewPotential::none()
        }
    }
}
impl SimulationElement for Battery {
    fn write(&self, writer: &mut SimulatorWriter) {
        self.writer.write_direct(self, writer);
    }

    fn consume_power<T: ConsumePower>(&mut self, consumption: &mut T) {
        self.input_potential = consumption.input_of(self).raw();

        if self.is_powered_by_other_potential() {
            self.current =
                Battery::calculate_charging_current(self.input_potential, self.output_potential);

            let power = self.input_potential * self.current;
            consumption.consume_from_input(self, power);

            let time = Time::new::<second>(consumption.delta().as_secs_f64());
            self.charge += ((self.input_potential * self.current) * time) / self.input_potential;
        }
    }

    fn process_power_consumption_report<T: PowerConsumptionReport>(&mut self, report: &T) {
        if !self.is_powered_by_other_potential() {
            let consumption = report.total_consumption_of(PotentialOrigin::Battery(self.number));

            self.current = if self.output_potential > ElectricPotential::new::<volt>(0.) {
                -(consumption / self.output_potential)
            } else {
                ElectricCurrent::new::<ampere>(0.)
            };

            if self.output_potential > ElectricPotential::new::<volt>(0.) {
                let time = Time::new::<second>(report.delta().as_secs_f64());
                self.charge -= ((consumption * time) / self.output_potential).min(self.charge);
            }
        }

        self.output_potential = Battery::calculate_output_potential_for_charge(self.charge);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[cfg(test)]
    mod battery_tests {
        use super::*;
        use crate::{
            electrical::{
                consumption::PowerConsumer, test::TestElectricitySource, Contactor, ElectricalBus,
                ElectricalBusType, Electricity,
            },
            simulation::{
                test::SimulationTestBed, Aircraft, SimulationElementVisitor, UpdateContext,
            },
        };
        use std::time::Duration;
        use uom::si::power::watt;

        struct BatteryTestBed {
            test_bed: SimulationTestBed,
        }
        impl BatteryTestBed {
            fn new() -> Self {
                Self::new_with_delta(Duration::from_secs(1))
            }

            fn new_with_delta(delta: Duration) -> Self {
                Self {
                    test_bed: SimulationTestBed::new_with_delta(delta),
                }
            }

            fn run_aircraft(&mut self, aircraft: &mut impl Aircraft) {
                self.test_bed.run_aircraft(aircraft);
            }

            fn current_is_normal(&mut self, number: usize) -> bool {
                self.test_bed
                    .read_bool(&format!("ELEC_BAT_{}_CURRENT_NORMAL", number))
            }

            fn current(&mut self, number: usize) -> ElectricCurrent {
                ElectricCurrent::new::<ampere>(
                    self.test_bed
                        .read_f64(&format!("ELEC_BAT_{}_CURRENT", number)),
                )
            }

            fn potential_is_normal(&mut self, number: usize) -> bool {
                self.test_bed
                    .read_bool(&format!("ELEC_BAT_{}_POTENTIAL_NORMAL", number))
            }

            fn potential(&mut self, number: usize) -> ElectricPotential {
                ElectricPotential::new::<volt>(
                    self.test_bed
                        .read_f64(&format!("ELEC_BAT_{}_POTENTIAL", number)),
                )
            }

            fn electricity(&mut self) -> &mut Electricity {
                self.test_bed.electricity_mut()
            }
        }

        struct TestAircraft {
            electricity_source: TestElectricitySource,
            bat_bus: ElectricalBus,
            battery_1: Battery,
            battery_1_contactor: Contactor,
            battery_2: Battery,
            battery_2_contactor: Contactor,
            consumer: PowerConsumer,
            battery_consumption: Power,
        }
        impl TestAircraft {
            fn new(battery_1: Battery, battery_2: Battery, electricity: &mut Electricity) -> Self {
                let mut aircraft = Self {
                    electricity_source: TestElectricitySource::unpowered(
                        PotentialOrigin::TransformerRectifier(1),
                        electricity,
                    ),
                    battery_1,
                    battery_2,
                    bat_bus: ElectricalBus::new(
                        ElectricalBusType::DirectCurrentBattery,
                        electricity,
                    ),
                    battery_1_contactor: Contactor::new("BAT1", electricity),
                    battery_2_contactor: Contactor::new("BAT2", electricity),
                    consumer: PowerConsumer::from(ElectricalBusType::DirectCurrentBattery),
                    battery_consumption: Power::new::<watt>(0.),
                };

                aircraft.battery_1_contactor.close_when(true);

                aircraft
            }

            fn with_full_batteries(electricity: &mut Electricity) -> Self {
                Self::new(
                    Battery::full(1, electricity),
                    Battery::full(2, electricity),
                    electricity,
                )
            }

            fn with_half_charged_batteries(electricity: &mut Electricity) -> Self {
                Self::new(
                    Battery::half(1, electricity),
                    Battery::half(2, electricity),
                    electricity,
                )
            }

            fn with_nearly_empty_batteries(electricity: &mut Electricity) -> Self {
                Self::new(
                    Battery::new(1, ElectricCharge::new::<ampere_hour>(0.001), electricity),
                    Battery::new(2, ElectricCharge::new::<ampere_hour>(0.001), electricity),
                    electricity,
                )
            }

            fn with_nearly_empty_dissimilarly_charged_batteries(
                electricity: &mut Electricity,
            ) -> Self {
                Self::new(
                    Battery::new(1, ElectricCharge::new::<ampere_hour>(0.002), electricity),
                    Battery::new(2, ElectricCharge::new::<ampere_hour>(0.001), electricity),
                    electricity,
                )
            }

            fn with_empty_batteries(electricity: &mut Electricity) -> Self {
                Self::new(
                    Battery::empty(1, electricity),
                    Battery::empty(2, electricity),
                    electricity,
                )
            }

            fn with_full_and_empty_battery(electricity: &mut Electricity) -> Self {
                Self::new(
                    Battery::full(1, electricity),
                    Battery::empty(2, electricity),
                    electricity,
                )
            }

            fn supply_input_potential(&mut self, potential: ElectricPotential) {
                self.electricity_source.set_potential(potential);
            }

            fn close_battery_2_contactor(&mut self) {
                self.battery_2_contactor.close_when(true);
            }

            fn power_demand(&mut self, power: Power) {
                self.consumer.demand(power);
            }

            fn battery_1_charge(&self) -> ElectricCharge {
                self.battery_1.charge()
            }

            fn battery_2_charge(&self) -> ElectricCharge {
                self.battery_2.charge()
            }

            fn bat_bus_is_powered(&self, electricity: &Electricity) -> bool {
                electricity.is_powered(&self.bat_bus)
            }
        }
        impl Aircraft for TestAircraft {
            fn update_before_power_distribution(
                &mut self,
                _: &UpdateContext,
                electricity: &mut Electricity,
            ) {
                electricity.supplied_by(&self.battery_1);
                electricity.supplied_by(&self.battery_2);
                electricity.flow(&self.battery_1, &self.battery_1_contactor);
                electricity.flow(&self.battery_2, &self.battery_2_contactor);

                electricity.supplied_by(&self.electricity_source);
                electricity.flow(&self.electricity_source, &self.bat_bus);
                electricity.flow(&self.battery_1_contactor, &self.bat_bus);
                electricity.flow(&self.battery_2_contactor, &self.bat_bus);
            }
        }
        impl SimulationElement for TestAircraft {
            fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
                self.bat_bus.accept(visitor);
                self.battery_1.accept(visitor);
                self.battery_1_contactor.accept(visitor);
                self.battery_2.accept(visitor);
                self.battery_2_contactor.accept(visitor);
                self.consumer.accept(visitor);

                visitor.visit(self);
            }

            fn process_power_consumption_report<T: PowerConsumptionReport>(&mut self, report: &T) {
                self.battery_consumption = report.total_consumption_of(PotentialOrigin::Battery(1));
            }
        }

        #[test]
        fn when_full_has_potential() {
            let mut test_bed = BatteryTestBed::new();
            let mut aircraft = TestAircraft::with_full_batteries(test_bed.electricity());

            test_bed.run_aircraft(&mut aircraft);

            assert!(test_bed.potential(1) > ElectricPotential::new::<volt>(0.));
        }

        #[test]
        fn when_full_potential_is_normal() {
            let mut test_bed = BatteryTestBed::new();
            let mut aircraft = TestAircraft::with_full_batteries(test_bed.electricity());

            test_bed.run_aircraft(&mut aircraft);

            assert!(test_bed.potential_is_normal(1));
        }

        #[test]
        fn when_empty_has_no_potential() {
            let mut test_bed = BatteryTestBed::new();
            let mut aircraft = TestAircraft::with_empty_batteries(test_bed.electricity());

            test_bed.run_aircraft(&mut aircraft);

            assert_eq!(test_bed.potential(1), ElectricPotential::new::<volt>(0.));
        }

        #[test]
        fn when_empty_potential_is_abnormal() {
            let mut test_bed = BatteryTestBed::new();
            let mut aircraft = TestAircraft::with_empty_batteries(test_bed.electricity());

            test_bed.run_aircraft(&mut aircraft);

            assert!(!test_bed.potential_is_normal(1));
        }

        #[test]
        fn when_input_potential_is_greater_than_output_potential_returns_input_potential_for_ecam_and_overhead_indication(
        ) {
            let mut test_bed = BatteryTestBed::new();
            let mut aircraft = TestAircraft::with_half_charged_batteries(test_bed.electricity());

            test_bed.run_aircraft(&mut aircraft);

            let input_potential = ElectricPotential::new::<volt>(28.);
            assert!(test_bed.potential(1) < input_potential,
                "This test assumes the battery's potential is lower than the given input potential.");

            aircraft.supply_input_potential(input_potential);
            test_bed.run_aircraft(&mut aircraft);

            assert_eq!(test_bed.potential(1), input_potential);
        }

        #[test]
        fn when_input_potential_is_less_than_output_potential_returns_output_potential_for_ecam_and_overhead_indication(
        ) {
            let mut test_bed = BatteryTestBed::new();
            let mut aircraft = TestAircraft::with_full_batteries(test_bed.electricity());

            test_bed.run_aircraft(&mut aircraft);

            let input_potential = ElectricPotential::new::<volt>(26.);
            assert!(input_potential < test_bed.potential(1),
                "This test assumes the battery's potential is higher than the given input potential.");

            aircraft.supply_input_potential(input_potential);
            test_bed.run_aircraft(&mut aircraft);

            assert!(input_potential < test_bed.potential(1));
        }

        #[test]
        fn when_charging_current_is_normal() {
            let mut test_bed = BatteryTestBed::new();
            let mut aircraft = TestAircraft::with_empty_batteries(test_bed.electricity());

            aircraft.supply_input_potential(ElectricPotential::new::<volt>(28.));
            test_bed.run_aircraft(&mut aircraft);

            assert!(test_bed.current_is_normal(1));
        }

        #[test]
        fn when_charging_battery_current_is_charge_current() {
            let mut test_bed = BatteryTestBed::new();
            let mut aircraft = TestAircraft::with_half_charged_batteries(test_bed.electricity());

            aircraft.supply_input_potential(ElectricPotential::new::<volt>(28.));
            test_bed.run_aircraft(&mut aircraft);

            assert!(test_bed.current(1) > ElectricCurrent::new::<ampere>(0.));
        }

        #[test]
        fn when_discharging_slowly_current_is_normal() {
            let mut test_bed = BatteryTestBed::new();
            let mut aircraft = TestAircraft::with_full_batteries(test_bed.electricity());

            aircraft.power_demand(Power::new::<watt>(40.));
            test_bed.run_aircraft(&mut aircraft);

            assert!(test_bed.current_is_normal(1));
        }

        #[test]
        fn when_discharging_quickly_current_is_abnormal() {
            let mut test_bed = BatteryTestBed::new();
            let mut aircraft = TestAircraft::with_full_batteries(test_bed.electricity());

            aircraft.power_demand(Power::new::<watt>(500.));
            test_bed.run_aircraft(&mut aircraft);

            assert!(!test_bed.current_is_normal(1));
        }

        #[test]
        fn when_discharging_battery_current_is_discharge_current() {
            let mut test_bed = BatteryTestBed::new();
            let mut aircraft = TestAircraft::with_full_batteries(test_bed.electricity());

            aircraft.power_demand(Power::new::<watt>(100.));
            test_bed.run_aircraft(&mut aircraft);

            assert!(test_bed.current(1) < ElectricCurrent::new::<ampere>(0.))
        }

        #[test]
        fn when_discharging_loses_charge() {
            let mut test_bed = BatteryTestBed::new_with_delta(Duration::from_secs(60));
            let mut aircraft = TestAircraft::with_full_batteries(test_bed.electricity());

            let charge_prior_to_run = aircraft.battery_1_charge();

            aircraft.power_demand(Power::new::<watt>(28. * 5.));
            test_bed.run_aircraft(&mut aircraft);

            assert!(aircraft.battery_1_charge() < charge_prior_to_run);
        }

        #[test]
        fn when_charging_gains_charge() {
            let mut test_bed = BatteryTestBed::new_with_delta(Duration::from_secs(60));
            let mut aircraft = TestAircraft::with_empty_batteries(test_bed.electricity());

            let charge_prior_to_run = aircraft.battery_1_charge();

            aircraft.supply_input_potential(ElectricPotential::new::<volt>(28.));
            test_bed.run_aircraft(&mut aircraft);

            assert!(aircraft.battery_1_charge() > charge_prior_to_run);
        }

        #[test]
        fn can_charge_beyond_rated_capacity() {
            let mut test_bed = BatteryTestBed::new_with_delta(Duration::from_secs(1_000));
            let mut aircraft = TestAircraft::with_full_batteries(test_bed.electricity());

            let charge_prior_to_run = aircraft.battery_1_charge();

            aircraft.supply_input_potential(ElectricPotential::new::<volt>(28.));
            test_bed.run_aircraft(&mut aircraft);

            assert!(aircraft.battery_1_charge() > charge_prior_to_run);
        }

        #[test]
        fn does_not_charge_when_input_potential_lower_than_battery_potential() {
            let mut test_bed = BatteryTestBed::new_with_delta(Duration::from_secs(1_000));
            let mut aircraft = TestAircraft::with_half_charged_batteries(test_bed.electricity());

            let charge_prior_to_run = aircraft.battery_1_charge();

            aircraft.supply_input_potential(ElectricPotential::new::<volt>(10.));
            test_bed.run_aircraft(&mut aircraft);

            assert_eq!(aircraft.battery_1_charge(), charge_prior_to_run);
        }

        #[test]
        fn when_neither_charging_nor_discharging_charge_remains_equal() {
            let mut test_bed = BatteryTestBed::new_with_delta(Duration::from_secs(1_000));
            let mut aircraft = TestAircraft::with_half_charged_batteries(test_bed.electricity());

            let charge_prior_to_run = aircraft.battery_1_charge();

            test_bed.run_aircraft(&mut aircraft);

            assert_eq!(aircraft.battery_1_charge(), charge_prior_to_run);
        }

        #[test]
        fn when_neither_charging_nor_discharging_current_is_zero() {
            let mut test_bed = BatteryTestBed::new_with_delta(Duration::from_secs(1_000));
            let mut aircraft = TestAircraft::with_half_charged_batteries(test_bed.electricity());

            test_bed.run_aircraft(&mut aircraft);

            assert_eq!(test_bed.current(1), ElectricCurrent::new::<ampere>(0.));
        }

        #[test]
        fn cannot_discharge_below_zero() {
            let mut test_bed = BatteryTestBed::new_with_delta(Duration::from_secs(50));
            let mut aircraft = TestAircraft::with_nearly_empty_batteries(test_bed.electricity());

            aircraft.power_demand(Power::new::<watt>(5000.));
            test_bed.run_aircraft(&mut aircraft);

            assert_eq!(
                aircraft.battery_1_charge(),
                ElectricCharge::new::<ampere_hour>(0.)
            );
        }

        #[test]
        fn dissimilar_charged_batteries_in_parallel_deplete() {
            let mut test_bed = BatteryTestBed::new_with_delta(Duration::from_secs(1));
            let mut aircraft = TestAircraft::with_nearly_empty_dissimilarly_charged_batteries(
                test_bed.electricity(),
            );

            aircraft.power_demand(Power::new::<watt>(10.));
            aircraft.close_battery_2_contactor();

            for _ in 0..15 {
                test_bed.run_aircraft(&mut aircraft);
            }

            assert!(aircraft.battery_1_charge() < ElectricCharge::new::<ampere_hour>(0.000000001));
            assert!(aircraft.battery_2_charge() < ElectricCharge::new::<ampere_hour>(0.000000001));
            assert!(!aircraft.bat_bus_is_powered(test_bed.electricity()));
        }

        #[test]
        fn batteries_charge_each_other_until_relatively_equal_charge() {
            let mut test_bed = BatteryTestBed::new_with_delta(Duration::from_secs(120));
            let mut aircraft = TestAircraft::with_full_and_empty_battery(test_bed.electricity());

            let original_charge = aircraft.battery_1_charge();

            aircraft.close_battery_2_contactor();

            for _ in 0..100 {
                test_bed.run_aircraft(&mut aircraft);
            }

            // For now we assume the batteries are perfect at charging and discharging without any power loss.
            assert!(
                (aircraft.battery_1_charge() - aircraft.battery_2_charge()).abs()
                    < ElectricCharge::new::<ampere_hour>(0.1)
            );
            assert!(
                (aircraft.battery_1_charge() + aircraft.battery_2_charge() - original_charge).abs()
                    < ElectricCharge::new::<ampere_hour>(0.001)
            );
        }
    }
}
