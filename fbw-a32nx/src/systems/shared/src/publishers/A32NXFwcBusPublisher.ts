// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, PublishPacer, SimVarPublisher, SimVarPublisherEntry, SimVarValueType } from '@microsoft/msfs-sdk';

interface A32NXFwcBusBaseEvents {
  /**
   * Discrete word with FWC outputs. Raw ARINC word.
   * * Bit | Meaning
   *   --- | ---
   *     24 | STD Altitude Discrepancy
   *     25 | Baro Altitude Discrepancy
   */
  a32nx_fwc_discrete_word_124: number;
  /**
   * Discrete word with FWC outputs. Raw ARINC word.
   * * Bit | Meaning
   *   --- | ---
   *    17 | Stall Warning
   *    28 | On Ground
   */
  a32nx_fwc_discrete_word_126: number;
}

type IndexedTopics = keyof A32NXFwcBusBaseEvents;

type FwcIndexedEventType<T extends string> = `${T}_${1 | 2}`;

type A32NXFwcBusIndexedEvents = {
  [P in keyof Pick<A32NXFwcBusBaseEvents, IndexedTopics> as FwcIndexedEventType<P>]: A32NXFwcBusBaseEvents[P];
};

interface A32NXFwcBusPublisherEvents extends A32NXFwcBusBaseEvents, A32NXFwcBusIndexedEvents {}

/**
 * Events for A32NX FWC output bus local vars.
 */
export interface A32NXFwcBusEvents extends Omit<A32NXFwcBusBaseEvents, IndexedTopics>, A32NXFwcBusIndexedEvents {}

/**
 * Publisher for A32NX FWC output bus local vars.
 */
export class A32NXFwcBusPublisher extends SimVarPublisher<A32NXFwcBusPublisherEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<A32NXFwcBusPublisherEvents>) {
    const simvars = new Map<keyof A32NXFwcBusPublisherEvents, SimVarPublisherEntry<any>>([
      [
        'a32nx_fwc_discrete_word_124',
        {
          name: 'L:A32NX_FWC_#index#_DISCRETE_WORD_124',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'a32nx_fwc_discrete_word_126',
        {
          name: 'L:A32NX_FWC_#index#_DISCRETE_WORD_126',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
    ]);

    super(simvars, bus, pacer);
  }
}
