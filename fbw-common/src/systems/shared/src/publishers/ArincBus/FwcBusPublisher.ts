// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, PublishPacer, SimVarPublisher, SimVarPublisherEntry, SimVarValueType } from '@microsoft/msfs-sdk';

interface FwcBusBaseEvents {
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

type IndexedTopics = keyof FwcBusBaseEvents;

type FwcIndexedEventType<T extends string> = `${T}_${1 | 2}`;

type FwcBusIndexedEvents = {
  [P in keyof Pick<FwcBusBaseEvents, IndexedTopics> as FwcIndexedEventType<P>]: FwcBusBaseEvents[P];
};

interface FwcBusPublisherEvents extends FwcBusBaseEvents, FwcBusIndexedEvents {}

/**
 * Events for  FWC output bus local vars.
 */
export interface FwcBusEvents extends Omit<FwcBusBaseEvents, IndexedTopics>, FwcBusIndexedEvents {}

/**
 * Publisher for  FWC output bus local vars.
 */
export class FwcBusPublisher extends SimVarPublisher<FwcBusPublisherEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<FwcBusPublisherEvents>) {
    const simvars = new Map<keyof FwcBusPublisherEvents, SimVarPublisherEntry<any>>([
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
