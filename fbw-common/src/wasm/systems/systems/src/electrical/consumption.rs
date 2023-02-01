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

use super::ElectricalBusType;
use crate::simulation::{InitContext, VariableIdentifier};
use crate::{
    shared::{random_number, ConsumePower, ElectricalBuses, FwcFlightPhase},
    simulation::{
        Read, SimulationElement, SimulationElementVisitor, SimulatorReader, UpdateContext,
    },
};
use num_traits::FromPrimitive;
use std::time::Duration;
use uom::si::{f64::*, power::watt};

/// A generic consumer of power.
pub struct PowerConsumer {
    is_powered: bool,
    demand: Power,
    powered_by_bus: ElectricalBusType,
}
impl PowerConsumer {
    /// Create a power consumer which consumes power from the given bus type.
    pub fn from(bus_type: ElectricalBusType) -> Self {
        PowerConsumer {
            is_powered: Default::default(),
            demand: Power::new::<watt>(0.),
            powered_by_bus: bus_type,
        }
    }

    /// Set the amount of power that is demanded by the consumer when powered.
    pub fn demand(&mut self, power: Power) {
        self.demand = power;
    }
}
impl SimulationElement for PowerConsumer {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by_bus);
    }

    fn consume_power<T: ConsumePower>(&mut self, _: &UpdateContext, consumption: &mut T) {
        consumption.consume_from_bus(self.powered_by_bus, self.demand);
    }
}

/// A special type of power consumer which changes its consumption
/// based on the phase of the flight.
pub struct FlightPhasePowerConsumer {
    fwc_flight_phase_id: VariableIdentifier,

    consumer: PowerConsumer,
    base_demand: [Power; PowerConsumerFlightPhase::TaxiIn as usize + 1],
    current_flight_phase: PowerConsumerFlightPhase,
    update_after: Duration,
}
impl FlightPhasePowerConsumer {
    pub fn new(context: &mut InitContext, bus_type: ElectricalBusType) -> Self {
        Self {
            fwc_flight_phase_id: context.get_identifier("FWC_FLIGHT_PHASE".to_owned()),

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
            FromPrimitive::from_f64(reader.read(&self.fwc_flight_phase_id));
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::shared::{PotentialOrigin, PowerConsumptionReport};

    #[cfg(test)]
    mod flight_phase_power_consumer_tests {
        use crate::{
            electrical::{test::TestElectricitySource, ElectricalBus},
            simulation::{
                test::{SimulationTestBed, TestBed},
                Aircraft,
            },
        };

        use super::*;
        use crate::simulation::test::WriteByName;
        use crate::simulation::InitContext;

        struct FlightPhasePowerConsumerTestAircraft {
            electricity_source: TestElectricitySource,
            apu_generator_consumption: Option<Power>,
            consumer: FlightPhasePowerConsumer,
            bus_with_demand: ElectricalBus,
        }
        impl FlightPhasePowerConsumerTestAircraft {
            fn new(
                consumer: FlightPhasePowerConsumer,
                bus_with_demand: ElectricalBusType,
                context: &mut InitContext,
            ) -> Self {
                Self {
                    electricity_source: TestElectricitySource::unpowered(
                        context,
                        PotentialOrigin::ApuGenerator(1),
                    ),
                    apu_generator_consumption: None,
                    consumer,
                    bus_with_demand: ElectricalBus::new(context, bus_with_demand),
                }
            }

            fn power(&mut self) {
                self.electricity_source.power()
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
        }
        impl Aircraft for FlightPhasePowerConsumerTestAircraft {
            fn update_before_power_distribution(
                &mut self,
                _: &UpdateContext,
                electricity: &mut crate::electrical::Electricity,
            ) {
                electricity.supplied_by(&self.electricity_source);
                electricity.flow(&self.electricity_source, &self.bus_with_demand);
            }

            fn update_after_power_distribution(&mut self, context: &UpdateContext) {
                self.consumer.update(context);
            }
        }
        impl SimulationElement for FlightPhasePowerConsumerTestAircraft {
            fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
                self.consumer.accept(visitor);

                visitor.visit(self);
            }

            fn process_power_consumption_report<T: PowerConsumptionReport>(
                &mut self,
                _: &UpdateContext,
                report: &T,
            ) {
                self.apu_generator_consumption =
                    Some(report.total_consumption_of(PotentialOrigin::ApuGenerator(1)));
            }
        }

        fn apply_flight_phase(
            test_bed: &mut SimulationTestBed<FlightPhasePowerConsumerTestAircraft>,
            phase: FwcFlightPhase,
        ) {
            test_bed.write_by_name("FWC_FLIGHT_PHASE", phase as i32 as f64);
        }

        #[test]
        fn when_flight_phase_doesnt_have_demand_usage_is_zero() {
            let mut test_bed = SimulationTestBed::new(|context| {
                FlightPhasePowerConsumerTestAircraft::new(
                    FlightPhasePowerConsumer::new(
                        context,
                        ElectricalBusType::AlternatingCurrent(1),
                    )
                    .demand([
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
                    ElectricalBusType::AlternatingCurrent(1),
                    context,
                )
            });

            test_bed.command(|a| a.power());

            apply_flight_phase(&mut test_bed, FwcFlightPhase::FirstEngineStarted);

            test_bed.run();

            assert!(test_bed.query(|a| a.consumption_equals(Power::new::<watt>(0.))));
        }

        #[test]
        fn when_flight_phase_does_have_demand_usage_is_close_to_demand() {
            let input = Power::new::<watt>(20000.);
            let mut test_bed = SimulationTestBed::new(|context| {
                FlightPhasePowerConsumerTestAircraft::new(
                    FlightPhasePowerConsumer::new(
                        context,
                        ElectricalBusType::AlternatingCurrent(1),
                    )
                    .demand([
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
                    ElectricalBusType::AlternatingCurrent(1),
                    context,
                )
            });

            test_bed.command(|a| a.power());

            apply_flight_phase(&mut test_bed, FwcFlightPhase::AtOrAbove1500Feet);

            test_bed.run();

            assert!(test_bed.query(|a| a.consumption_within_range(input * 0.9, input * 1.1)));
        }

        #[test]
        fn when_flight_phase_does_have_demand_but_consumer_unpowered_usage_is_zero() {
            let mut test_bed = SimulationTestBed::new(|context| {
                FlightPhasePowerConsumerTestAircraft::new(
                    FlightPhasePowerConsumer::new(
                        context,
                        ElectricalBusType::AlternatingCurrent(1),
                    )
                    .demand([
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
                    ElectricalBusType::AlternatingCurrent(1),
                    context,
                )
            });

            apply_flight_phase(&mut test_bed, FwcFlightPhase::FirstEngineStarted);

            test_bed.run();

            assert!(test_bed.query(|a| a.consumption_equals(Power::new::<watt>(0.))));
        }
    }
}
