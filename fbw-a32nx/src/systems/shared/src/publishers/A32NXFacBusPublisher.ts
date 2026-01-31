// @ts-strict-ignore
// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  EventBus,
  IndexedEventType,
  PublishPacer,
  SimVarPublisher,
  SimVarPublisherEntry,
  SimVarValueType,
} from '@microsoft/msfs-sdk';

interface A32NXFacBusBaseEvents {
  /**
   * FAC Discrete word 3.
   * Raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | Low Energy Warning (SPEED x3)     |
   * | 12  | n/a                               |
   * | 13  | n/a                               |
   * | 14  | n/a                               |
   * | 15  | PITCH PITCH Warning               |
   * |16-29| Spare                             |
   */
  a32nx_fac_discrete_word_3: number;
}

type IndexedTopics = keyof A32NXFacBusBaseEvents;

type A32NXFacBusIndexedEvents = {
  [P in keyof Pick<A32NXFacBusBaseEvents, IndexedTopics> as IndexedEventType<P>]: A32NXFacBusBaseEvents[P];
};

interface A32NXFacBusPublisherEvents extends A32NXFacBusBaseEvents, A32NXFacBusIndexedEvents {}

/**
 * Events for A32NX FAC bus local vars.
 */
export interface A32NXFacBusEvents extends Omit<A32NXFacBusBaseEvents, IndexedTopics>, A32NXFacBusIndexedEvents {}

/**
 * Publisher for A32NX FAC bus local vars.
 */
export class A32NXFacBusPublisher extends SimVarPublisher<A32NXFacBusPublisherEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<A32NXFacBusPublisherEvents>) {
    const simvars = new Map<keyof A32NXFacBusPublisherEvents, SimVarPublisherEntry<any>>([
      [
        'a32nx_fac_discrete_word_3',
        { name: 'L:A32NX_FAC_#index#_DISCRETE_WORD_3', type: SimVarValueType.Enum, indexed: true },
      ],
    ]);

    super(simvars, bus, pacer);
  }
}
