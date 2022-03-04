/// <reference types="msfstypes/JS/simvar" />

import { EventBus, PublishPacer, SimVarDefinition, SimVarValueType } from '../data';
import { SimVarPublisher } from './BasePublishers';

/**
 * Events relating to the electrical systems.
 */
export interface ElectricalEvents {
  /** Master battery power is switched on or not. */
  'elec_master_battery': boolean,

  /** The avionics circuit is on or off. */
  'elec_circuit_avionics_on': boolean,

  /** The navcom 1 circuit is on or off. */
  'elec_circuit_navcom1_on': boolean,

  /** The navcom 2 circuit is on of off. */
  'elec_circuit_navcom2_on': boolean,

  /** The navcom 3 circuit is on of off. */
  'elec_circuit_navcom3_on': boolean,

  /** The first avionics power bus. */
  'elec_av1_bus': boolean,

  /** The second avionics power bus. */
  'elec_av2_bus': boolean
}

/**
 * A publisher for electrical information.
 */
export class ElectricalPublisher extends SimVarPublisher<ElectricalEvents> {
  private static simvars = new Map<keyof ElectricalEvents, SimVarDefinition>([
    ['elec_master_battery', { name: 'ELECTRICAL MASTER BATTERY', type: SimVarValueType.Bool }],
    ['elec_circuit_avionics_on', { name: 'CIRCUIT AVIONICS ON', type: SimVarValueType.Bool }],
    ['elec_circuit_navcom1_on', { name: 'CIRCUIT NAVCOM1 ON', type: SimVarValueType.Bool }],
    ['elec_circuit_navcom2_on', { name: 'CIRCUIT NAVCOM2 ON', type: SimVarValueType.Bool }],
    ['elec_circuit_navcom3_on', { name: 'CIRCUIT NAVCOM3 ON', type: SimVarValueType.Bool }]
  ]);

  private av1BusLogic: CompositeLogicXMLElement | undefined;
  private av2BusLogic: CompositeLogicXMLElement | undefined;

  /**
   * Create an ElectricalPublisher
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer: PublishPacer<ElectricalEvents> | undefined = undefined) {
    super(ElectricalPublisher.simvars, bus, pacer);
  }

  /** @inheritdoc */
  public onUpdate(): void {
    super.onUpdate();

    if (this.av1BusLogic && this.subscribed.has('elec_av1_bus')) {
      this.publish('elec_av1_bus', this.av1BusLogic.getValue() !== 0);
    }

    if (this.av2BusLogic && this.subscribed.has('elec_av2_bus')) {
      this.publish('elec_av2_bus', this.av2BusLogic.getValue() !== 0);
    }
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