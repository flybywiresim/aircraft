// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, PublishPacer, SimVarPublisher, SimVarPublisherEntry, SimVarValueType } from '@microsoft/msfs-sdk';

interface A380XFwcBusBaseEvents {
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
   *    11 | Avionics Test Mode
   */
  a32nx_fwc_discrete_word_125: number;
  /**
   * Discrete word with FWC outputs. Raw ARINC word.
   * * Bit | Meaning
   *   --- | ---
   *    17 | Stall Warning
   *    28 | On Ground
   */
  a32nx_fwc_discrete_word_126: number;
}

type IndexedTopics = keyof A380XFwcBusBaseEvents;

type FwcIndexedEventType<T extends string> = `${T}_${1 | 2}`;

type A380XFwcBusIndexedEvents = {
  [P in keyof Pick<A380XFwcBusBaseEvents, IndexedTopics> as FwcIndexedEventType<P>]: A380XFwcBusBaseEvents[P];
};

interface A380XFwcBusPublisherEvents extends A380XFwcBusBaseEvents, A380XFwcBusIndexedEvents {}

/**
 * Events for A380X FWC output bus local vars.
 */
export interface A380XFwcBusEvents extends Omit<A380XFwcBusBaseEvents, IndexedTopics>, A380XFwcBusIndexedEvents {}

/**
 * Publisher for A380X FWC output bus local vars.
 */
export class A380XFwcBusPublisher extends SimVarPublisher<A380XFwcBusPublisherEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<A380XFwcBusPublisherEvents>) {
    const simvars = new Map<keyof A380XFwcBusPublisherEvents, SimVarPublisherEntry<any>>([
      [
        'a32nx_fwc_discrete_word_124',
        {
          name: 'L:A32NX_FWC_#index#_DISCRETE_WORD_124',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'a32nx_fwc_discrete_word_125',
        {
          name: 'L:A32NX_FWC_#index#_DISCRETE_WORD_125',
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
