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

interface AdiruBusBaseEvents {
  /** Raw Arinc 429 word. */
  a32nx_adiru_true_track: number;
}

type IndexedTopics = 'a32nx_adiru_true_track';

type AdiruBusIndexedEvents = {
  [P in keyof Pick<AdiruBusBaseEvents, IndexedTopics> as IndexedEventType<P>]: AdiruBusBaseEvents[P];
};

interface AdiruBusPublisherEvents extends AdiruBusBaseEvents, AdiruBusIndexedEvents {}

/**
 * This class provides ADIRU data for all ADIRUs via indexed events (without the need for switchable sources).
 * Some components require non-switched data as input.
 * Extend as needed.
 */
export interface AdiruBusEvents extends Omit<AdiruBusBaseEvents, IndexedTopics>, AdiruBusIndexedEvents {}

/**
 * Publisher for local vars.
 */
export class AdiruBusPublisher extends SimVarPublisher<AdiruBusPublisherEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<AdiruBusPublisherEvents>) {
    const simvars = new Map<keyof AdiruBusPublisherEvents, SimVarPublisherEntry<any>>([
      [
        'a32nx_adiru_true_track',
        { name: 'L:A32NX_ADIRS_IR_#index#_TRUE_TRACK', type: SimVarValueType.Number, indexed: true },
      ],
    ]);

    super(simvars, bus, pacer);
  }
}
