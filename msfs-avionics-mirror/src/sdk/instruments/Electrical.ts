/// <reference types="msfstypes/JS/simvar" />

import { EventBus, EventBusMetaEvents, IndexedEventType, PublishPacer, SimVarDefinition, SimVarValueType } from '../data';
import { SimVarPublisher } from './BasePublishers';

/**
 * Events relating to the electrical systems.
 */
export interface ElectricalEvents {
  /** Master battery power is switched on or not. */
  'elec_master_battery': boolean,

  /** The avionics circuit is on or off. */
  [elec_circuit_avionics_on: IndexedEventType<'elec_circuit_avionics_on'>]: boolean,

  /** The navcom 1 circuit is on or off. */
  'elec_circuit_navcom1_on': boolean,

  /** The navcom 2 circuit is on of off. */
  'elec_circuit_navcom2_on': boolean,

  /** The navcom 3 circuit is on of off. */
  'elec_circuit_navcom3_on': boolean,

  /** The first avionics power bus. */
  'elec_av1_bus': boolean,

  /** The second avionics power bus. */
  'elec_av2_bus': boolean,

  /** A voltage value for the main elec bus */
  'elec_bus_main_v': number,

  /** A current value for the main elec bus */
  'elec_bus_main_a': number,

  /** A voltage value for the avionics bus */
  'elec_bus_avionics_v': number,

  /** A current value for the avinoics bus */
  'elec_bus_avionics_a': number,

  /** A voltage value for the generator/alternator 1 bus */
  'elec_bus_genalt_1_v': number,

  /** A voltage value for the generator/alternator 2 bus */
  'elec_bus_genalt_2_v': number,

  /** A current value for the generator/alternator 1 bus */
  'elec_bus_genalt_1_a': number,

  /** A current value for the generator/alternator 2 bus */
  'elec_bus_genalt_2_a': number,

  /** A voltage value for the battery */
  'elec_bat_v': number;

  /** A current value for the battery */
  'elec_bat_a': number;
}

/**
 * A publisher for electrical information.
 */
export class ElectricalPublisher extends SimVarPublisher<ElectricalEvents> {
  private static simvars = new Map<keyof ElectricalEvents, SimVarDefinition>([
    ['elec_master_battery', { name: 'ELECTRICAL MASTER BATTERY', type: SimVarValueType.Bool }],
    ['elec_circuit_avionics_on_1', { name: 'CIRCUIT AVIONICS ON:1', type: SimVarValueType.Bool }],
    ['elec_circuit_avionics_on_2', { name: 'CIRCUIT AVIONICS ON:2', type: SimVarValueType.Bool }],
    ['elec_circuit_navcom1_on', { name: 'CIRCUIT NAVCOM1 ON', type: SimVarValueType.Bool }],
    ['elec_circuit_navcom2_on', { name: 'CIRCUIT NAVCOM2 ON', type: SimVarValueType.Bool }],
    ['elec_circuit_navcom3_on', { name: 'CIRCUIT NAVCOM3 ON', type: SimVarValueType.Bool }],
    ['elec_bus_main_v', { name: 'ELECTRICAL MAIN BUS VOLTAGE', type: SimVarValueType.Volts }],
    ['elec_bus_main_a', { name: 'ELECTRICAL MAIN BUS AMPS', type: SimVarValueType.Amps }],
    ['elec_bus_avionics_v', { name: 'ELECTRICAL AVIONICS BUS VOLTAGE', type: SimVarValueType.Volts }],
    ['elec_bus_avionics_a', { name: 'ELECTRICAL AVIONICS BUS AMPS', type: SimVarValueType.Amps }],
    ['elec_bus_genalt_1_v', { name: 'ELECTRICAL GENALT BUS VOLTAGE:1', type: SimVarValueType.Volts }],
    ['elec_bus_genalt_2_v', { name: 'ELECTRICAL GENALT BUS VOLTAGE:2', type: SimVarValueType.Volts }],
    ['elec_bus_genalt_1_a', { name: 'ELECTRICAL GENALT BUS AMPS:1', type: SimVarValueType.Amps }],
    ['elec_bus_genalt_2_a', { name: 'ELECTRICAL GENALT BUS AMPS:2', type: SimVarValueType.Amps }],
    ['elec_bat_a', { name: 'ELECTRICAL BATTERY LOAD', type: SimVarValueType.Amps }],
    ['elec_bat_v', { name: 'ELECTRICAL BATTERY VOLTAGE', type: SimVarValueType.Volts }]
  ]);

  private flightStarted = false;
  private av1BusLogic: CompositeLogicXMLElement | undefined;
  private av2BusLogic: CompositeLogicXMLElement | undefined;

  private avBusList: (keyof ElectricalEvents)[] = ['elec_av1_bus', 'elec_av2_bus'];

  /**
   * Create an ElectricalPublisher
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer: PublishPacer<ElectricalEvents> | undefined = undefined) {
    super(ElectricalPublisher.simvars, bus, pacer);
    for (const topic of this.avBusList) {
      if (bus.getTopicSubscriberCount(topic)) {
        this.subscribed.add(topic);
      }
    }

    bus.getSubscriber<EventBusMetaEvents>().on('event_bus_topic_first_sub').handle(
      (event: string) => {
        if (this.avBusList.includes(event as keyof ElectricalEvents)) {
          this.subscribed.add(event as keyof ElectricalEvents);
        }
      }
    );
  }

  /** @inheritdoc */
  public onUpdate(): void {
    if (this.flightStarted) {
      super.onUpdate();

      if (this.av1BusLogic && this.subscribed.has('elec_av1_bus')) {
        this.publish('elec_av1_bus', this.av1BusLogic.getValue() !== 0);
      }

      if (this.av2BusLogic && this.subscribed.has('elec_av2_bus')) {
        this.publish('elec_av2_bus', this.av2BusLogic.getValue() !== 0);
      }
    }
  }

  /**
   * Called when the flight has started and electrical data is valid.
   * @param started True if the flight has started
   */
  public setFlightStarted(started: boolean): void {
    this.flightStarted = started;
  }

  /**
   * Sets the logic element to use for the avionics 1 bus.
   * @param logicElement The logic element to use.
   */
  public setAv1Bus(logicElement: CompositeLogicXMLElement): void {
    this.av1BusLogic = logicElement;
  }

  /**
   * Sets the logic element to use for the avionics 2 bus.
   * @param logicElement The logic element to use.
   */
  public setAv2Bus(logicElement: CompositeLogicXMLElement): void {
    this.av2BusLogic = logicElement;
  }
}