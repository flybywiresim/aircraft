use systems::simulation::InitContext;
use systems::{
    electrical::consumption::{FlightPhasePowerConsumer, PowerConsumerFlightPhase},
    shared::ElectricalBusType,
    simulation::{NestedElement, SimulationElement, UpdateContext},
};
use uom::si::{f64::*, power::watt};

/// This type provides an aggregated form of power consumption.
/// We haven't yet implemented all power consumers and thus need something to
/// consume power, as otherwise electrical load is nearly 0.
#[derive(NestedElement)]
pub(super) struct A320PowerConsumption {
    ac_bus_1_consumer: FlightPhasePowerConsumer,
    ac_bus_2_consumer: FlightPhasePowerConsumer,
    ac_ess_bus_consumer: FlightPhasePowerConsumer,
    ac_ess_shed_bus_consumer: FlightPhasePowerConsumer,
    ac_stat_inv_bus_consumer: FlightPhasePowerConsumer,
    ac_gnd_flt_service_consumer: FlightPhasePowerConsumer,
    dc_bus_1_consumer: FlightPhasePowerConsumer,
    dc_bus_2_consumer: FlightPhasePowerConsumer,
    dc_ess_bus_consumer: FlightPhasePowerConsumer,
    dc_ess_shed_bus_consumer: FlightPhasePowerConsumer,
    dc_bat_bus_consumer: FlightPhasePowerConsumer,
    dc_hot_bus_1_consumer: FlightPhasePowerConsumer,
    dc_hot_bus_2_consumer: FlightPhasePowerConsumer,
    dc_gnd_flt_service_consumer: FlightPhasePowerConsumer,
}
impl A320PowerConsumption {
    pub fn new(context: &mut InitContext) -> Self {
        // The watts in this function are all provided by komp.
        Self {
            ac_bus_1_consumer: FlightPhasePowerConsumer::new(
                context,
                ElectricalBusType::AlternatingCurrent(1),
            )
            .demand([
                (
                    PowerConsumerFlightPhase::BeforeStart,
                    Power::new::<watt>(26816.3),
                ),
                (
                    PowerConsumerFlightPhase::AfterStart,
                    Power::new::<watt>(30350.1),
                ),
                (
                    PowerConsumerFlightPhase::Takeoff,
                    Power::new::<watt>(33797.3),
                ),
                (
                    PowerConsumerFlightPhase::Flight,
                    Power::new::<watt>(39032.5),
                ),
                (
                    PowerConsumerFlightPhase::Landing,
                    Power::new::<watt>(30733.3),
                ),
                (
                    PowerConsumerFlightPhase::TaxiIn,
                    Power::new::<watt>(30243.1),
                ),
            ]),
            ac_bus_2_consumer: FlightPhasePowerConsumer::new(
                context,
                ElectricalBusType::AlternatingCurrent(2),
            )
            .demand([
                (
                    PowerConsumerFlightPhase::BeforeStart,
                    Power::new::<watt>(26960.2),
                ),
                (
                    PowerConsumerFlightPhase::AfterStart,
                    Power::new::<watt>(21735.8),
                ),
                (
                    PowerConsumerFlightPhase::Takeoff,
                    Power::new::<watt>(25183.),
                ),
                (
                    PowerConsumerFlightPhase::Flight,
                    Power::new::<watt>(29777.4),
                ),
                (
                    PowerConsumerFlightPhase::Landing,
                    Power::new::<watt>(22119.),
                ),
                (
                    PowerConsumerFlightPhase::TaxiIn,
                    Power::new::<watt>(24475.8),
                ),
            ]),
            ac_ess_bus_consumer: FlightPhasePowerConsumer::new(
                context,
                ElectricalBusType::AlternatingCurrentEssential,
            )
            .demand([
                (
                    PowerConsumerFlightPhase::BeforeStart,
                    Power::new::<watt>(455.7),
                ),
                (
                    PowerConsumerFlightPhase::AfterStart,
                    Power::new::<watt>(715.7),
                ),
                (PowerConsumerFlightPhase::Takeoff, Power::new::<watt>(875.7)),
                (PowerConsumerFlightPhase::Flight, Power::new::<watt>(875.7)),
                (PowerConsumerFlightPhase::Landing, Power::new::<watt>(715.7)),
                (PowerConsumerFlightPhase::TaxiIn, Power::new::<watt>(715.7)),
            ]),
            ac_ess_shed_bus_consumer: FlightPhasePowerConsumer::new(
                context,
                ElectricalBusType::AlternatingCurrentEssentialShed,
            )
            .demand([
                (
                    PowerConsumerFlightPhase::BeforeStart,
                    Power::new::<watt>(560.5),
                ),
                (
                    PowerConsumerFlightPhase::AfterStart,
                    Power::new::<watt>(823.5),
                ),
                (PowerConsumerFlightPhase::Takeoff, Power::new::<watt>(823.5)),
                (PowerConsumerFlightPhase::Flight, Power::new::<watt>(823.5)),
                (PowerConsumerFlightPhase::Landing, Power::new::<watt>(823.5)),
                (PowerConsumerFlightPhase::TaxiIn, Power::new::<watt>(823.5)),
            ]),
            ac_stat_inv_bus_consumer: FlightPhasePowerConsumer::new(
                context,
                ElectricalBusType::AlternatingCurrentStaticInverter,
            )
            .demand([
                (
                    PowerConsumerFlightPhase::BeforeStart,
                    Power::new::<watt>(135.),
                ),
                (
                    PowerConsumerFlightPhase::AfterStart,
                    Power::new::<watt>(135.),
                ),
                (PowerConsumerFlightPhase::Takeoff, Power::new::<watt>(135.)),
                (PowerConsumerFlightPhase::Flight, Power::new::<watt>(135.)),
                (PowerConsumerFlightPhase::Landing, Power::new::<watt>(135.)),
                (PowerConsumerFlightPhase::TaxiIn, Power::new::<watt>(135.)),
            ]),
            ac_gnd_flt_service_consumer: FlightPhasePowerConsumer::new(
                context,
                ElectricalBusType::AlternatingCurrentGndFltService,
            )
            .demand([
                (
                    PowerConsumerFlightPhase::BeforeStart,
                    Power::new::<watt>(4718.),
                ),
                (
                    PowerConsumerFlightPhase::AfterStart,
                    Power::new::<watt>(3663.),
                ),
                (PowerConsumerFlightPhase::Takeoff, Power::new::<watt>(2628.)),
                (PowerConsumerFlightPhase::Flight, Power::new::<watt>(2628.)),
                (PowerConsumerFlightPhase::Landing, Power::new::<watt>(2628.)),
                (PowerConsumerFlightPhase::TaxiIn, Power::new::<watt>(3663.)),
            ]),
            dc_bus_1_consumer: FlightPhasePowerConsumer::new(
                context,
                ElectricalBusType::DirectCurrent(1),
            )
            .demand([
                (
                    PowerConsumerFlightPhase::BeforeStart,
                    Power::new::<watt>(252.),
                ),
                (
                    PowerConsumerFlightPhase::AfterStart,
                    Power::new::<watt>(308.),
                ),
                (PowerConsumerFlightPhase::Takeoff, Power::new::<watt>(364.)),
                (PowerConsumerFlightPhase::Flight, Power::new::<watt>(280.)),
                (PowerConsumerFlightPhase::Landing, Power::new::<watt>(364.)),
                (PowerConsumerFlightPhase::TaxiIn, Power::new::<watt>(336.)),
            ]),
            dc_bus_2_consumer: FlightPhasePowerConsumer::new(
                context,
                ElectricalBusType::DirectCurrent(2),
            )
            .demand([
                (
                    PowerConsumerFlightPhase::BeforeStart,
                    Power::new::<watt>(532.),
                ),
                (
                    PowerConsumerFlightPhase::AfterStart,
                    Power::new::<watt>(448.),
                ),
                (PowerConsumerFlightPhase::Takeoff, Power::new::<watt>(392.)),
                (PowerConsumerFlightPhase::Flight, Power::new::<watt>(392.)),
                (PowerConsumerFlightPhase::Landing, Power::new::<watt>(392.)),
                (PowerConsumerFlightPhase::TaxiIn, Power::new::<watt>(448.)),
            ]),
            dc_ess_bus_consumer: FlightPhasePowerConsumer::new(
                context,
                ElectricalBusType::DirectCurrentEssential,
            )
            .demand([
                (
                    PowerConsumerFlightPhase::BeforeStart,
                    Power::new::<watt>(168.),
                ),
                (
                    PowerConsumerFlightPhase::AfterStart,
                    Power::new::<watt>(140.),
                ),
                (PowerConsumerFlightPhase::Takeoff, Power::new::<watt>(168.)),
                (PowerConsumerFlightPhase::Flight, Power::new::<watt>(140.)),
                (PowerConsumerFlightPhase::Landing, Power::new::<watt>(168.)),
                (PowerConsumerFlightPhase::TaxiIn, Power::new::<watt>(140.)),
            ]),
            dc_ess_shed_bus_consumer: FlightPhasePowerConsumer::new(
                context,
                ElectricalBusType::DirectCurrentEssentialShed,
            )
            .demand([
                (
                    PowerConsumerFlightPhase::BeforeStart,
                    Power::new::<watt>(224.),
                ),
                (
                    PowerConsumerFlightPhase::AfterStart,
                    Power::new::<watt>(168.),
                ),
                (PowerConsumerFlightPhase::Takeoff, Power::new::<watt>(196.)),
                (PowerConsumerFlightPhase::Flight, Power::new::<watt>(196.)),
                (PowerConsumerFlightPhase::Landing, Power::new::<watt>(196.)),
                (PowerConsumerFlightPhase::TaxiIn, Power::new::<watt>(168.)),
            ]),
            dc_bat_bus_consumer: FlightPhasePowerConsumer::new(
                context,
                ElectricalBusType::DirectCurrentBattery,
            )
            .demand([
                (
                    PowerConsumerFlightPhase::BeforeStart,
                    Power::new::<watt>(0.),
                ),
                (
                    PowerConsumerFlightPhase::AfterStart,
                    Power::new::<watt>(28.),
                ),
                (PowerConsumerFlightPhase::Takeoff, Power::new::<watt>(28.)),
                (PowerConsumerFlightPhase::Flight, Power::new::<watt>(28.)),
                (PowerConsumerFlightPhase::Landing, Power::new::<watt>(28.)),
                (PowerConsumerFlightPhase::TaxiIn, Power::new::<watt>(28.)),
            ]),
            dc_hot_bus_1_consumer: FlightPhasePowerConsumer::new(
                context,
                ElectricalBusType::DirectCurrentHot(1),
            )
            .demand([
                (
                    PowerConsumerFlightPhase::BeforeStart,
                    Power::new::<watt>(108.),
                ),
                (
                    PowerConsumerFlightPhase::AfterStart,
                    Power::new::<watt>(11.),
                ),
                (PowerConsumerFlightPhase::Takeoff, Power::new::<watt>(15.3)),
                (PowerConsumerFlightPhase::Flight, Power::new::<watt>(15.3)),
                (PowerConsumerFlightPhase::Landing, Power::new::<watt>(15.3)),
                (PowerConsumerFlightPhase::TaxiIn, Power::new::<watt>(11.)),
            ]),
            dc_hot_bus_2_consumer: FlightPhasePowerConsumer::new(
                context,
                ElectricalBusType::DirectCurrentHot(2),
            )
            .demand([
                (
                    PowerConsumerFlightPhase::BeforeStart,
                    Power::new::<watt>(24.3),
                ),
                (
                    PowerConsumerFlightPhase::AfterStart,
                    Power::new::<watt>(24.3),
                ),
                (PowerConsumerFlightPhase::Takeoff, Power::new::<watt>(24.3)),
                (PowerConsumerFlightPhase::Flight, Power::new::<watt>(24.3)),
                (PowerConsumerFlightPhase::Landing, Power::new::<watt>(24.3)),
                (PowerConsumerFlightPhase::TaxiIn, Power::new::<watt>(24.3)),
            ]),
            dc_gnd_flt_service_consumer: FlightPhasePowerConsumer::new(
                context,
                ElectricalBusType::DirectCurrentGndFltService,
            )
            .demand([
                (
                    PowerConsumerFlightPhase::BeforeStart,
                    Power::new::<watt>(168.),
                ),
                (
                    PowerConsumerFlightPhase::AfterStart,
                    Power::new::<watt>(84.),
                ),
                (PowerConsumerFlightPhase::Takeoff, Power::new::<watt>(84.)),
                (PowerConsumerFlightPhase::Flight, Power::new::<watt>(84.)),
                (PowerConsumerFlightPhase::Landing, Power::new::<watt>(112.)),
                (PowerConsumerFlightPhase::TaxiIn, Power::new::<watt>(84.)),
            ]),
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        self.ac_bus_1_consumer.update(context);
        self.ac_bus_2_consumer.update(context);
        self.ac_ess_bus_consumer.update(context);
        self.ac_ess_shed_bus_consumer.update(context);
        self.ac_stat_inv_bus_consumer.update(context);
        self.ac_gnd_flt_service_consumer.update(context);
        self.dc_bus_1_consumer.update(context);
        self.dc_bus_2_consumer.update(context);
        self.dc_ess_bus_consumer.update(context);
        self.dc_ess_shed_bus_consumer.update(context);
        self.dc_bat_bus_consumer.update(context);
        self.dc_hot_bus_1_consumer.update(context);
        self.dc_hot_bus_2_consumer.update(context);
        self.dc_gnd_flt_service_consumer.update(context);
    }
}
impl SimulationElement for A320PowerConsumption {}
