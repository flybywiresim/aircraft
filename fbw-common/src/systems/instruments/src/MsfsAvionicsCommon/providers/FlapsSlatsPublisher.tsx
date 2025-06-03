// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import {
  EventBus,
  IndexedEventType,
  PublishPacer,
  SimVarPublisher,
  SimVarPublisherEntry,
  SimVarValueType,
} from '@microsoft/msfs-sdk';

export interface BaseFlapsSlatsEvents {
  slats_flaps_status_raw: number;
  flap_handle_index: number;
}

type FlapsSlatsIndexxedEvents = {
  [P in keyof BaseFlapsSlatsEvents as IndexedEventType<P>]: BaseFlapsSlatsEvents[P];
};

export interface FlapsSlatsEvents extends BaseFlapsSlatsEvents, FlapsSlatsIndexxedEvents {}

export class FlapsSlatsPublisher extends SimVarPublisher<FlapsSlatsEvents> {
  /**
   * Creates a RadioAltimeterPublisher.
   * @param bus The event bus to which to publish.
   * @param pacer An optional pacer to use to control the rate of publishing.
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<FlapsSlatsEvents>) {
    const simvars = new Map<keyof FlapsSlatsEvents, SimVarPublisherEntry<any>>([
      [
        'slats_flaps_status_raw',
        { name: 'L:A32NX_SFCC_#index#_SLAT_FLAP_SYSTEM_STATUS_WORD', type: SimVarValueType.Number, indexed: true },
      ],
      [
        'flap_handle_index',
        { name: 'L:A32NX_FLAPS_#index#_HANDLE_INDEX', type: SimVarValueType.Number, indexed: true },
      ],
    ]);
    super(simvars, bus, pacer);
  }
}
