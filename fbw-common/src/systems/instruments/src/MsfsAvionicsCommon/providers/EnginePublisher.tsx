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

export interface BaseEngineEvents {
  tla: number;
}

type EngineIndexedEvents = {
  [P in keyof BaseEngineEvents as IndexedEventType<P>]: BaseEngineEvents[P];
};

export interface EngineEvents extends BaseEngineEvents, EngineIndexedEvents {}

export class EnginePublisher extends SimVarPublisher<EngineEvents> {
  /**
   * Creates a EnginePublisher.
   * @param bus The event bus to which to publish.
   * @param pacer An optional pacer to use to control the rate of publishing.
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<EngineEvents>) {
    const simvars = new Map<keyof EngineEvents, SimVarPublisherEntry<any>>([
      ['tla', { name: 'L:A32NX_AUTOTHRUST_TLA:#index#', type: SimVarValueType.Number, indexed: true }],
    ]);
    super(simvars, bus, pacer);
  }
}
