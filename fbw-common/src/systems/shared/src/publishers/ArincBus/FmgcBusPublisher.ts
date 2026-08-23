// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, PublishPacer, SimVarPublisher, SimVarPublisherEntry, SimVarValueType } from '@microsoft/msfs-sdk';

interface FmgcBusBaseEvents {
  fmgc_healthy: boolean;
  fmgc_athr_engaged: boolean;
  fmgc_fd_engaged: boolean;
  fmgc_ap_engaged: boolean;
}

type IndexedTopics = keyof FmgcBusBaseEvents;

type FmgcIndexedEventType<T extends string> = `${T}_${1 | 2}`;

type FmgcBusIndexedEvents = {
  [P in keyof Pick<FmgcBusBaseEvents, IndexedTopics> as FmgcIndexedEventType<P>]: FmgcBusBaseEvents[P];
};

interface FmgcBusPublisherEvents extends FmgcBusBaseEvents, FmgcBusIndexedEvents {}

/**
 * Events for A32NX FMGC output bus local vars.
 */
export interface FmgcBusEvents extends Omit<FmgcBusBaseEvents, IndexedTopics>, FmgcBusIndexedEvents {}

/**
 * Publisher for A32NX FMGC output bus local vars.
 */
export class FmgcBusPublisher extends SimVarPublisher<FmgcBusPublisherEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<FmgcBusPublisherEvents>) {
    const simvars = new Map<keyof FmgcBusPublisherEvents, SimVarPublisherEntry<any>>([
      [
        'fmgc_healthy',
        {
          name: 'L:A32NX_FMGC_#index#_HEALTHY',
          type: SimVarValueType.Bool,
          indexed: true,
        },
      ],
      [
        'fmgc_athr_engaged',
        {
          name: 'L:A32NX_FMGC_#index#_ATHR_ENGAGED',
          type: SimVarValueType.Bool,
          indexed: true,
        },
      ],
      [
        'fmgc_fd_engaged',
        {
          name: 'L:A32NX_FMGC_#index#_FD_ENGAGED',
          type: SimVarValueType.Bool,
          indexed: true,
        },
      ],
      [
        'fmgc_ap_engaged',
        {
          name: 'L:A32NX_FMGC_#index#_AP_ENGAGED',
          type: SimVarValueType.Bool,
          indexed: true,
        },
      ],
    ]);

    super(simvars, bus, pacer);
  }
}
