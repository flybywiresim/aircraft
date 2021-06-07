//! Power consumption works as follows:
//! 1. The electrical system determines which electrical buses are powered
//!    by which electric potential origin (generators, external power,
//!    transformer rectifiers, etc).
//! 2. Thereafter, power consumers can ask the electrical system if the buses they receive power
//!    from are powered, and which origin supplies them.
//! 3. A power consumer declares which bus(es) it receives power from in order of priority.
//!    When a power consumer consumes from a bus which has potential, it is considered powered.
//!    Systems can use this information to determine if elements within the system
//!    can perform their work and how much power they consume in doing so.
//! 4. After systems finished their state update. Each power consumer is then asked how much
//!    power they consume from which origin. This is summed to get the total consumption per origin.
//! 5. The consumption of some consumers relates to the power consumption of other consumers.
//!    Specifically this applies to transformer rectifiers and static inverters. Their consumption
//!    is requested after the consumption of all other consumers is known.
//! 6. The total load is passed to the various origins so that they can calculate their
//!    load %, voltage, frequency and current.

use super::{ElectricalBus, ElectricalBusType, Potential, PotentialOrigin, PotentialSource};
use crate::{
    shared::{
        random_number, ConsumePower, ElectricalBuses, FwcFlightPhase, PowerConsumptionReport,
    },
    simulation::{
        Read, SimulationElement, SimulationElementVisitor, SimulatorReader, UpdateContext,
    },
};
use num_traits::FromPrimitive;
use std::{collections::HashMap, time::Duration};
use uom::si::{f64::*, power::watt};

pub(crate) struct ElectricPower {
    supplied_power: SuppliedPower,
    power_consumption: PowerConsumption,
}
impl ElectricPower {
    pub(crate) fn from(supplied_power: SuppliedPower, delta: Duration) -> Self {
        let power_consumption = PowerConsumption::new(delta, &supplied_power);
        Self {
            supplied_power,
            power_consumption,
        }
    }

    pub fn distribute_to(&self, element: &mut impl SimulationElement) {
        let mut visitor = ReceivePowerVisitor::new(&self.supplied_power);
        element.accept(&mut visitor);
    }

    pub fn consume_in(&mut self, element: &mut impl SimulationElement) {
        let mut visitor = ConsumePowerVisitor::new(&mut self.power_consumption);
        element.accept(&mut visitor);

        let mut visitor = ConsumePowerInConvertersVisitor::new(&mut self.power_consumption);
        element.accept(&mut visitor);
    }

    pub fn report_consumption_to(&mut self, element: &mut impl SimulationElement) {
        let mut visitor = ProcessPowerConsumptionReportVisitor::new(&self.power_consumption);
        element.accept(&mut visitor);
    }
}

pub struct SuppliedPower {
    state: HashMap<ElectricalBusType, Potential>,
}
impl SuppliedPower {
    pub fn new() -> SuppliedPower {
        SuppliedPower {
            state: HashMap::new(),
        }
    }

    pub fn add_bus(&mut self, bus: &ElectricalBus) {
        self.add(bus.bus_type(), bus.output());
    }

    pub fn add(&mut self, bus_type: ElectricalBusType, output_potential: Potential) {
        self.state.insert(bus_type, output_potential);
    }

    fn state(&self) -> &HashMap<ElectricalBusType, Potential> {
        &self.state
    }
}
impl ElectricalBuses for SuppliedPower {
    fn potential_of(&self, bus_type: ElectricalBusType) -> Potential {
        match self.state.get(&bus_type) {
            Some(potential) => *potential,
            None => Potential::none(),
        }
    }

    fn is_powered(&self, bus_type: ElectricalBusType) -> bool {
        self.potential_of(bus_type).is_powered()
    }

    fn any_is_powered(&self, bus_types: &[ElectricalBusType]) -> bool {
        bus_types.iter().any(|bus_type| self.is_powered(*bus_type))
    }
}
impl Default for SuppliedPower {
    fn default() -> Self {
        Self::new()
    }
}

/// A generic consumer of power.
pub struct PowerConsumer {
    provided_potential: Potential,
    demand: Power,
    powered_by: Vec<ElectricalBusType>,
}
impl PowerConsumer {
    /// Create a power consumer which consumes power from the given bus type.
    pub fn from(bus_type: ElectricalBusType) -> Self {
        PowerConsumer {
            provided_potential: Default::default(),
            demand: Power::new::<watt>(0.),
            powered_by: vec![bus_type],
        }
    }

    /// Determine if the power consumer has potential powering
    /// it during this simulation tick.
    /// If this function is called before power has been supplied to it
    /// during this tick, the result of this function will be last frame's state.
    #[cfg(test)]
    fn is_powered(&self) -> bool {
        self.provided_potential.is_powered()
    }

    /// Set the amount of power that is demanded by the consumer when powered.
    pub fn demand(&mut self, power: Power) {
        self.demand = power;
    }
}
impl SimulationElement for PowerConsumer {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.provided_potential = self
            .powered_by
            .iter()
            .find_map(|bus_type| {
                let potential = buses.potential_of(*bus_type);
                if potential.is_powered() {
                    Some(potential)
                } else {
                    None
                }
            })
            .unwrap_or_default();
    }

    fn consume_power<T: ConsumePower>(&mut self, consumption: &mut T) {
        consumption.consume(self.provided_potential, self.demand);
    }
}

/// A special type of power consumer which changes its consumption
/// based on the phase of the flight.
pub struct FlightPhasePowerConsumer {
    consumer: PowerConsumer,
    base_demand: [Power; PowerConsumerFlightPhase::TaxiIn as usize + 1],
    current_flight_phase: PowerConsumerFlightPhase,
    update_after: Duration,
}
impl FlightPhasePowerConsumer {
    pub fn from(bus_type: ElectricalBusType) -> Self {
        Self {
            consumer: PowerConsumer::from(bus_type),
            base_demand: Default::default(),
            current_flight_phase: PowerConsumerFlightPhase::BeforeStart,
            update_after: Duration::from_secs(0),
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        if self.update_after <= context.delta() {
            self.update_after = Duration::from_secs_f64(5. + ((random_number() % 26) as f64));
            let base_demand = self.base_demand[self.current_flight_phase as usize].get::<watt>();
            self.consumer.demand(Power::new::<watt>(
                base_demand * ((90. + ((random_number() % 21) as f64)) / 100.),
            ));
        } else {
            self.update_after -= context.delta();
        }
    }

    pub fn demand(
        mut self,
        demand: [(PowerConsumerFlightPhase, Power); PowerConsumerFlightPhase::TaxiIn as usize + 1],
    ) -> Self {
        for (phase, power) in &demand {
            self.base_demand[*phase as usize] = *power;
        }

        self
    }
}
impl SimulationElement for FlightPhasePowerConsumer {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.consumer.accept(visitor);

        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        let flight_phase: Option<FwcFlightPhase> =
            FromPrimitive::from_f64(reader.read("FWC_FLIGHT_PHASE"));
        if let Some(phase) = flight_phase {
            self.current_flight_phase = PowerConsumerFlightPhase::from(phase);
        }
    }
}

#[derive(Copy, Clone)]
pub enum PowerConsumerFlightPhase {
    BeforeStart = 0,
    AfterStart = 1,
    Takeoff = 2,
    Flight = 3,
    Landing = 4,
    TaxiIn = 5,
}
impl From<FwcFlightPhase> for PowerConsumerFlightPhase {
    fn from(phase: FwcFlightPhase) -> Self {
        match phase {
            FwcFlightPhase::ElecPwr => PowerConsumerFlightPhase::BeforeStart,
            FwcFlightPhase::FirstEngineStarted => PowerConsumerFlightPhase::AfterStart,
            FwcFlightPhase::FirstEngineTakeOffPower => PowerConsumerFlightPhase::Takeoff,
            FwcFlightPhase::AtOrAboveEightyKnots => PowerConsumerFlightPhase::Takeoff,
            FwcFlightPhase::LiftOff => PowerConsumerFlightPhase::Takeoff,
            FwcFlightPhase::AtOrAbove1500Feet => PowerConsumerFlightPhase::Flight,
            FwcFlightPhase::AtOrBelow800Feet => PowerConsumerFlightPhase::Landing,
            FwcFlightPhase::TouchDown => PowerConsumerFlightPhase::Landing,
            FwcFlightPhase::AtOrBelowEightyKnots => PowerConsumerFlightPhase::TaxiIn,
            FwcFlightPhase::EnginesShutdown => PowerConsumerFlightPhase::BeforeStart,
        }
    }
}

struct PowerConsumption {
    bus_to_potential: HashMap<ElectricalBusType, Potential>,
    consumption_per_origin: HashMap<PotentialOrigin, Power>,
    /// The simulation tick's duration.
    delta: Duration,
}
impl PowerConsumption {
    fn new(delta: Duration, supplied_power: &SuppliedPower) -> Self {
        PowerConsumption {
            bus_to_potential: supplied_power.state().clone(),
            consumption_per_origin: HashMap::new(),
            delta,
        }
    }
}
impl ConsumePower for PowerConsumption {
    fn consume(&mut self, potential: Potential, power: Power) {
        for origin in potential.origins() {
            let y = self.consumption_per_origin.entry(origin).or_default();
            *y += power / potential.count() as f64;
        }
    }

    fn consume_from_bus(&mut self, bus: ElectricalBusType, power: Power) {
        if let Some(potential) = self.bus_to_potential.get(&bus) {
            let potential = *potential;
            self.consume(potential, power);
        }
    }
}
impl PowerConsumptionReport for PowerConsumption {
    fn total_consumption_of(&self, potential_origin: PotentialOrigin) -> Power {
        match self.consumption_per_origin.get(&potential_origin) {
            Some(power) => *power,
            None => Power::new::<watt>(0.),
        }
    }

    fn delta(&self) -> Duration {
        self.delta
    }
}

struct ReceivePowerVisitor<'a> {
    supplied_power: &'a SuppliedPower,
}
impl<'a> ReceivePowerVisitor<'a> {
    pub fn new(supplied_power: &'a SuppliedPower) -> Self {
        ReceivePowerVisitor { supplied_power }
    }
}
impl<'a> SimulationElementVisitor for ReceivePowerVisitor<'a> {
    fn visit<T: SimulationElement>(&mut self, visited: &mut T) {
        visited.receive_power(self.supplied_power);
    }
}

struct ConsumePowerVisitor<'a> {
    consumption: &'a mut PowerConsumption,
}
impl<'a> ConsumePowerVisitor<'a> {
    pub fn new(consumption: &'a mut PowerConsumption) -> Self {
        ConsumePowerVisitor { consumption }
    }
}
impl<'a> SimulationElementVisitor for ConsumePowerVisitor<'a> {
    fn visit<T: SimulationElement>(&mut self, visited: &mut T) {
        visited.consume_power(self.consumption);
    }
}
struct ConsumePowerInConvertersVisitor<'a> {
    consumption: &'a mut PowerConsumption,
}
impl<'a> ConsumePowerInConvertersVisitor<'a> {
    pub fn new(consumption: &'a mut PowerConsumption) -> Self {
        ConsumePowerInConvertersVisitor { consumption }
    }
}
impl<'a> SimulationElementVisitor for ConsumePowerInConvertersVisitor<'a> {
    fn visit<T: SimulationElement>(&mut self, visited: &mut T) {
        visited.consume_power_in_converters(self.consumption);
    }
}

struct ProcessPowerConsumptionReportVisitor<'a> {
    consumption: &'a PowerConsumption,
}
impl<'a> ProcessPowerConsumptionReportVisitor<'a> {
    pub fn new(consumption: &'a PowerConsumption) -> Self {
        ProcessPowerConsumptionReportVisitor { consumption }
    }
}
impl<'a> SimulationElementVisitor for ProcessPowerConsumptionReportVisitor<'a> {
    fn visit<T: SimulationElement>(&mut self, visited: &mut T) {
        visited.process_power_consumption_report(self.consumption);
    }
}

#[cfg(test)]
mod tests {
    use uom::si::electric_potential::volt;

    use super::*;
    use crate::electrical::{Potential, PotentialSource};

    struct ApuStub {
        consumed_power: Power,
    }
    impl ApuStub {
        fn new() -> Self {
            ApuStub {
                consumed_power: Power::new::<watt>(0.),
            }
        }
    }
    impl PotentialSource for ApuStub {
        fn output(&self) -> Potential {
            Potential::single(
                PotentialOrigin::ApuGenerator(1),
                ElectricPotential::new::<volt>(115.),
            )
        }
    }
    impl SimulationElement for ApuStub {
        fn process_power_consumption_report<T: PowerConsumptionReport>(&mut self, report: &T) {
            self.consumed_power = report.total_consumption_of(PotentialOrigin::ApuGenerator(1));
        }
    }

    #[cfg(test)]
    mod supplied_power_tests {
        use super::*;
        use crate::electrical::{Electricity, PotentialTarget};

        fn powered_bus(bus_type: ElectricalBusType) -> ElectricalBus {
            let mut bus = unpowered_bus(bus_type);
            bus.powered_by(&ApuStub::new());

            bus
        }

        fn unpowered_bus(bus_type: ElectricalBusType) -> ElectricalBus {
            let mut electricity = Electricity::new();
            ElectricalBus::new(bus_type, &mut electricity)
        }

        #[test]
        fn is_powered_returns_false_when_bus_not_found() {
            let supplied_power = SuppliedPower::new();
            assert!(!supplied_power.is_powered(ElectricalBusType::AlternatingCurrent(1)))
        }

        #[test]
        fn is_powered_returns_true_when_bus_is_powered() {
            let mut supplied_power = SuppliedPower::new();
            supplied_power.add_bus(&powered_bus(ElectricalBusType::AlternatingCurrent(1)));

            assert!(supplied_power.is_powered(ElectricalBusType::AlternatingCurrent(1)))
        }

        #[test]
        fn is_powered_returns_false_when_bus_unpowered() {
            let mut supplied_power = SuppliedPower::new();
            supplied_power.add_bus(&unpowered_bus(ElectricalBusType::AlternatingCurrent(1)));

            assert!(!supplied_power.is_powered(ElectricalBusType::AlternatingCurrent(1)))
        }
    }

    #[cfg(test)]
    mod power_consumer_tests {
        use super::*;
        use crate::electrical::{Electricity, PotentialTarget};

        fn powered_bus(bus_type: ElectricalBusType) -> ElectricalBus {
            let mut electricity = Electricity::new();
            let mut bus = ElectricalBus::new(bus_type, &mut electricity);
            bus.powered_by(&ApuStub::new());

            bus
        }

        fn powered_consumer() -> PowerConsumer {
            let mut consumer = PowerConsumer::from(ElectricalBusType::AlternatingCurrent(1));
            let mut supplied_power = SuppliedPower::new();
            supplied_power.add_bus(&powered_bus(ElectricalBusType::AlternatingCurrent(1)));
            consumer.receive_power(&supplied_power);

            consumer
        }

        #[test]
        fn is_powered_returns_false_when_not_powered() {
            let consumer = PowerConsumer::from(ElectricalBusType::AlternatingCurrent(1));
            assert!(!consumer.is_powered());
        }

        #[test]
        fn is_powered_returns_false_when_powered_by_bus_which_is_not_powered() {
            let mut supplied_power = SuppliedPower::new();
            supplied_power.add_bus(&powered_bus(ElectricalBusType::AlternatingCurrent(2)));

            let mut consumer = PowerConsumer::from(ElectricalBusType::AlternatingCurrent(1));
            consumer.receive_power(&supplied_power);

            assert!(!consumer.is_powered());
        }

        #[test]
        fn is_powered_returns_true_when_powered_by_bus_which_is_powered() {
            let mut supplied_power = SuppliedPower::new();
            supplied_power.add_bus(&powered_bus(ElectricalBusType::AlternatingCurrent(2)));
            supplied_power.add_bus(&powered_bus(ElectricalBusType::AlternatingCurrent(1)));

            let mut consumption = PowerConsumer::from(ElectricalBusType::AlternatingCurrent(1));
            consumption.receive_power(&supplied_power);

            assert!(consumption.is_powered());
        }

        #[test]
        fn consume_power_adds_power_consumption_when_powered() {
            let mut consumption =
                PowerConsumption::new(Duration::from_secs(1), &SuppliedPower::new());
            let mut consumer = powered_consumer();
            let expected = Power::new::<watt>(100.);

            consumer.demand(expected);
            consumer.consume_power(&mut consumption);

            assert_eq!(
                consumption.total_consumption_of(PotentialOrigin::ApuGenerator(1)),
                expected
            );
        }

        #[test]
        fn consume_power_does_not_add_power_consumption_when_unpowered() {
            let mut consumption =
                PowerConsumption::new(Duration::from_secs(1), &SuppliedPower::new());
            let mut consumer = PowerConsumer::from(ElectricalBusType::AlternatingCurrent(1));

            consumer.demand(Power::new::<watt>(100.));
            consumer.consume_power(&mut consumption);

            assert_eq!(
                consumption.total_consumption_of(PotentialOrigin::ApuGenerator(1)),
                Power::new::<watt>(0.)
            );
        }
    }

    #[cfg(test)]
    mod flight_phase_power_consumer_tests {
        use crate::{
            electrical::{Electricity, PotentialTarget},
            simulation::{test::SimulationTestBed, Aircraft},
        };

        use super::*;

        struct FlightPhasePowerConsumerTestAircraft {
            apu_generator_consumption: Option<Power>,
            consumer: FlightPhasePowerConsumer,
            powered: bool,
        }
        impl FlightPhasePowerConsumerTestAircraft {
            fn new(consumer: FlightPhasePowerConsumer, powered: bool) -> Self {
                Self {
                    apu_generator_consumption: None,
                    consumer,
                    powered,
                }
            }

            fn consumption_equals(&self, expected: Power) -> bool {
                match self.apu_generator_consumption {
                    Some(consumption) => consumption == expected,
                    None => false,
                }
            }

            fn consumption_within_range(&self, min: Power, max: Power) -> bool {
                match self.apu_generator_consumption {
                    Some(consumption) => min <= consumption && consumption <= max,
                    None => false,
                }
            }

            fn powered_bus(bus_type: ElectricalBusType) -> ElectricalBus {
                let mut electricity = Electricity::new();
                let mut bus = ElectricalBus::new(bus_type, &mut electricity);
                bus.powered_by(&ApuStub::new());

                bus
            }
        }
        impl Aircraft for FlightPhasePowerConsumerTestAircraft {
            fn update_after_power_distribution(&mut self, context: &UpdateContext) {
                self.consumer.update(context);
            }

            fn get_supplied_power(&mut self) -> SuppliedPower {
                let mut supplied_power = SuppliedPower::new();

                if self.powered {
                    supplied_power.add_bus(&FlightPhasePowerConsumerTestAircraft::powered_bus(
                        ElectricalBusType::AlternatingCurrent(1),
                    ));
                }

                supplied_power
            }
        }
        impl SimulationElement for FlightPhasePowerConsumerTestAircraft {
            fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
                self.consumer.accept(visitor);

                visitor.visit(self);
            }

            fn process_power_consumption_report<T: PowerConsumptionReport>(&mut self, report: &T) {
                self.apu_generator_consumption =
                    Some(report.total_consumption_of(PotentialOrigin::ApuGenerator(1)));
            }
        }

        fn apply_flight_phase(test_bed: &mut SimulationTestBed, phase: FwcFlightPhase) {
            test_bed.write_f64("FWC_FLIGHT_PHASE", phase as i32 as f64);
        }

        #[test]
        fn when_flight_phase_doesnt_have_demand_usage_is_zero() {
            let mut aircraft = FlightPhasePowerConsumerTestAircraft::new(
                FlightPhasePowerConsumer::from(ElectricalBusType::AlternatingCurrent(1)).demand([
                    (
                        PowerConsumerFlightPhase::BeforeStart,
                        Power::new::<watt>(0.),
                    ),
                    (PowerConsumerFlightPhase::AfterStart, Power::new::<watt>(0.)),
                    (PowerConsumerFlightPhase::Takeoff, Power::new::<watt>(0.)),
                    (PowerConsumerFlightPhase::Flight, Power::new::<watt>(0.)),
                    (PowerConsumerFlightPhase::Landing, Power::new::<watt>(0.)),
                    (PowerConsumerFlightPhase::TaxiIn, Power::new::<watt>(0.)),
                ]),
                true,
            );

            let mut test_bed = SimulationTestBed::new();
            apply_flight_phase(&mut test_bed, FwcFlightPhase::FirstEngineStarted);

            test_bed.run_aircraft(&mut aircraft);

            assert!(aircraft.consumption_equals(Power::new::<watt>(0.)));
        }

        #[test]
        fn when_flight_phase_does_have_demand_usage_is_close_to_demand() {
            let input = Power::new::<watt>(20000.);
            let mut aircraft = FlightPhasePowerConsumerTestAircraft::new(
                FlightPhasePowerConsumer::from(ElectricalBusType::AlternatingCurrent(1)).demand([
                    (
                        PowerConsumerFlightPhase::BeforeStart,
                        Power::new::<watt>(0.),
                    ),
                    (PowerConsumerFlightPhase::AfterStart, Power::new::<watt>(0.)),
                    (PowerConsumerFlightPhase::Takeoff, Power::new::<watt>(0.)),
                    (PowerConsumerFlightPhase::Flight, input),
                    (PowerConsumerFlightPhase::Landing, Power::new::<watt>(0.)),
                    (PowerConsumerFlightPhase::TaxiIn, Power::new::<watt>(0.)),
                ]),
                true,
            );

            let mut test_bed = SimulationTestBed::new();
            apply_flight_phase(&mut test_bed, FwcFlightPhase::AtOrAbove1500Feet);

            test_bed.run_aircraft(&mut aircraft);

            assert!(aircraft.consumption_within_range(input * 0.9, input * 1.1));
        }

        #[test]
        fn when_flight_phase_does_have_demand_but_consumer_unpowered_usage_is_zero() {
            let mut aircraft = FlightPhasePowerConsumerTestAircraft::new(
                FlightPhasePowerConsumer::from(ElectricalBusType::AlternatingCurrent(1)).demand([
                    (
                        PowerConsumerFlightPhase::BeforeStart,
                        Power::new::<watt>(20000.),
                    ),
                    (
                        PowerConsumerFlightPhase::AfterStart,
                        Power::new::<watt>(20000.),
                    ),
                    (
                        PowerConsumerFlightPhase::Takeoff,
                        Power::new::<watt>(20000.),
                    ),
                    (PowerConsumerFlightPhase::Flight, Power::new::<watt>(20000.)),
                    (
                        PowerConsumerFlightPhase::Landing,
                        Power::new::<watt>(20000.),
                    ),
                    (PowerConsumerFlightPhase::TaxiIn, Power::new::<watt>(20000.)),
                ]),
                false,
            );

            let mut test_bed = SimulationTestBed::new();
            apply_flight_phase(&mut test_bed, FwcFlightPhase::FirstEngineStarted);

            test_bed.run_aircraft(&mut aircraft);

            assert!(aircraft.consumption_equals(Power::new::<watt>(0.)));
        }
    }

    #[cfg(test)]
    mod power_consumption_tests {
        use super::*;

        fn power_consumption() -> PowerConsumption {
            PowerConsumption::new(Duration::from_secs(1), &SuppliedPower::new())
        }

        #[test]
        fn total_consumption_of_returns_zero_when_no_consumption() {
            let consumption = power_consumption();
            let expected = Power::new::<watt>(0.);

            assert_eq!(
                consumption.total_consumption_of(PotentialOrigin::ApuGenerator(1)),
                expected
            );
        }

        #[test]
        fn total_consumption_of_returns_the_consumption_of_the_requested_potential() {
            let mut consumption = power_consumption();
            let expected = Power::new::<watt>(600.);

            consumption.consume(
                Potential::single(
                    PotentialOrigin::ApuGenerator(1),
                    ElectricPotential::new::<volt>(115.),
                ),
                expected,
            );

            consumption.consume(
                Potential::single(
                    PotentialOrigin::EngineGenerator(1),
                    ElectricPotential::new::<volt>(115.),
                ),
                Power::new::<watt>(400.),
            );

            assert_eq!(
                consumption.total_consumption_of(PotentialOrigin::ApuGenerator(1)),
                expected
            );
        }

        #[test]
        fn total_consumption_of_returns_the_sum_of_consumption_of_the_requested_potential() {
            let mut consumption = power_consumption();
            let expected = Power::new::<watt>(1100.);

            consumption.consume(
                Potential::single(
                    PotentialOrigin::ApuGenerator(1),
                    ElectricPotential::new::<volt>(115.),
                ),
                Power::new::<watt>(400.),
            );

            consumption.consume(
                Potential::single(
                    PotentialOrigin::ApuGenerator(1),
                    ElectricPotential::new::<volt>(115.),
                ),
                Power::new::<watt>(700.),
            );

            assert_eq!(
                consumption.total_consumption_of(PotentialOrigin::ApuGenerator(1)),
                expected
            );
        }

        #[test]
        fn consumption_is_equally_divided_between_all_potential_origins() {
            let mut consumption = power_consumption();

            consumption.consume(
                Potential::single(
                    PotentialOrigin::Battery(1),
                    ElectricPotential::new::<volt>(28.),
                )
                .merge(&Potential::single(
                    PotentialOrigin::Battery(2),
                    ElectricPotential::new::<volt>(28.),
                )),
                Power::new::<watt>(400.),
            );

            assert_eq!(
                consumption.total_consumption_of(PotentialOrigin::Battery(1)),
                Power::new::<watt>(200.)
            );

            assert_eq!(
                consumption.total_consumption_of(PotentialOrigin::Battery(2)),
                Power::new::<watt>(200.)
            );
        }

        #[test]
        fn consume_from_bus_consumes_from_the_correct_potential_origin() {
            let battery = Potential::single(
                PotentialOrigin::Battery(1),
                ElectricPotential::new::<volt>(28.),
            );
            let mut supplied_power = SuppliedPower::new();
            supplied_power.add(ElectricalBusType::DirectCurrentBattery, battery);

            let mut consumption = PowerConsumption::new(Duration::from_secs(1), &supplied_power);

            consumption.consume_from_bus(
                ElectricalBusType::DirectCurrentBattery,
                Power::new::<watt>(400.),
            );

            assert_eq!(
                consumption.total_consumption_of(PotentialOrigin::Battery(1)),
                Power::new::<watt>(400.)
            );
        }

        #[test]
        fn consume_from_bus_doesnt_consume_when_bus_not_available() {
            let battery = Potential::single(
                PotentialOrigin::Battery(1),
                ElectricPotential::new::<volt>(28.),
            );
            let mut supplied_power = SuppliedPower::new();
            supplied_power.add(ElectricalBusType::DirectCurrentBattery, battery);

            let mut consumption = PowerConsumption::new(Duration::from_secs(1), &supplied_power);

            consumption.consume_from_bus(
                ElectricalBusType::DirectCurrent(1),
                Power::new::<watt>(400.),
            );

            assert_eq!(
                consumption.total_consumption_of(PotentialOrigin::Battery(1)),
                Power::new::<watt>(0.)
            );
        }
    }
}
