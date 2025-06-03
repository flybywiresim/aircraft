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
  tla_1: number;
  tla_2: number;
  tla_3: number;
  tla_4: number;
}

type EngineIndexedEvents = {
  [P in keyof BaseEngineEvents as IndexedEventType<P>]: BaseEngineEvents[P];
};

export interface EngineEvents extends BaseEngineEvents, EngineIndexedEvents {}

export class EnginePublisher extends SimVarPublisher<EngineEvents> {
  /**
   * Creates a RadioAltimeterPublisher.
   * @param bus The event bus to which to publish.
   * @param pacer An optional pacer to use to control the rate of publishing.
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<EngineEvents>) {
    const simvars = new Map<keyof EngineEvents, SimVarPublisherEntry<any>>([
      ['tla_1', { name: 'L:A32NX_AUTOTHRUST_#index#_TLA:1', type: SimVarValueType.Number, indexed: true }],
      ['tla_2', { name: 'L:A32NX_AUTOTHRUST_#index#_TLA:2', type: SimVarValueType.Number, indexed: true }],
      ['tla_3', { name: 'L:A32NX_AUTOTHRUST_#index#_TLA:3', type: SimVarValueType.Number, indexed: true }],
      ['tla_4', { name: 'L:A32NX_AUTOTHRUST_#index#_TLA:4', type: SimVarValueType.Number, indexed: true }],
    ]);
    super(simvars, bus, pacer);
  }
}
