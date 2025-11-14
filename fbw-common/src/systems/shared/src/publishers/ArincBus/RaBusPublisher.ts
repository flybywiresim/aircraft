// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, PublishPacer, SimVarPublisher, SimVarPublisherEntry, SimVarValueType } from '@microsoft/msfs-sdk';

interface RaBusBaseEvents {
  /**
   The height over ground (in feet) as measured by the corresponding radio altimeter towards the aft of the aircraft. Raw ARINC Word.
   */
  ra_radio_altitude: number;
}

type IndexedTopics = keyof RaBusBaseEvents;

type RaIndexedEventType<T extends string> = `${T}_${1 | 2 | 3}`;

type RaBusIndexedEvents = {
  [P in keyof Pick<RaBusBaseEvents, IndexedTopics> as RaIndexedEventType<P>]: RaBusBaseEvents[P];
};

interface RaBusPublisherEvents extends RaBusBaseEvents, RaBusIndexedEvents {}

/**
 * Events for A32NX RA output bus local vars.
 */
export interface RaBusEvents extends Omit<RaBusBaseEvents, IndexedTopics>, RaBusIndexedEvents {}

/**
 * Publisher for A32NX RA output bus local vars.
 */
export class RaBusPublisher extends SimVarPublisher<RaBusPublisherEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<RaBusPublisherEvents>) {
    const simvars = new Map<keyof RaBusPublisherEvents, SimVarPublisherEntry<any>>([
      [
        'ra_radio_altitude',
        {
          name: 'L:A32NX_RA_#index#_RADIO_ALTITUDE',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
    ]);

    super(simvars, bus, pacer);
  }
}
