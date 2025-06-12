// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, PublishPacer, SimVarPublisher, SimVarPublisherEntry, SimVarValueType } from '@microsoft/msfs-sdk';

interface A32NXFmBusBaseEvents {
  /**
   * FMS flight number part 1. Raw ARINC word with ISO5 encoding.
   */
  a32nx_fm_flight_number_1: number;
  /**
   * FMS flight number part 2. Raw ARINC word with ISO5 encoding.
   */
  a32nx_fm_flight_number_2: number;
  /**
   * FMS flight number part 3. Raw ARINC word with ISO5 encoding.
   */
  a32nx_fm_flight_number_3: number;
  /**
   * FMS flight number part 4. Raw ARINC word with ISO5 encoding.
   */
  a32nx_fm_flight_number_4: number;
}

type IndexedTopics = keyof A32NXFmBusBaseEvents;

type FmIndexedEventType<T extends string> = `${T}_${1 | 2}`;

type A32NXFmBusIndexedEvents = {
  [P in keyof Pick<A32NXFmBusBaseEvents, IndexedTopics> as FmIndexedEventType<P>]: A32NXFmBusBaseEvents[P];
};

interface A32NXFmBusPublisherEvents extends A32NXFmBusBaseEvents, A32NXFmBusIndexedEvents {}

/**
 * Events for A32NX FMGC output bus local vars.
 */
export interface A32NXFmBusEvents extends Omit<A32NXFmBusBaseEvents, IndexedTopics>, A32NXFmBusIndexedEvents {}

/**
 * Publisher for A32NX FMGC output bus local vars.
 */
export class A32NXFmBusPublisher extends SimVarPublisher<A32NXFmBusPublisherEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<A32NXFmBusPublisherEvents>) {
    const simvars = new Map<keyof A32NXFmBusPublisherEvents, SimVarPublisherEntry<any>>([
      [
        'a32nx_fm_flight_number_1',
        {
          name: 'L:A32NX_FM#index#_FLIGHT_NUMBER_1',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'a32nx_fm_flight_number_2',
        {
          name: 'L:A32NX_FM#index#_FLIGHT_NUMBER_2',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'a32nx_fm_flight_number_3',
        {
          name: 'L:A32NX_FM#index#_FLIGHT_NUMBER_3',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'a32nx_fm_flight_number_4',
        {
          name: 'L:A32NX_FM#index#_FLIGHT_NUMBER_4',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
    ]);

    super(simvars, bus, pacer);
  }
}
