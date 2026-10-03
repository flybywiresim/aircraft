// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  EventBus,
  IndexedEventType,
  PublishPacer,
  SimVarPublisher,
  SimVarPublisherEntry,
  SimVarValueType,
} from '@microsoft/msfs-sdk';

export enum EngineState {
  Off = 0,
  On = 1,
  Starting = 2,
  Restarting = 3,
  Shutting = 4,
}

interface EngineBaseEvents {
  /** Whether the engine master switch is on. */
  fbw_engine_master: boolean;
  /** Whether the FADEC is powered. */
  fbw_engine_fadec_powered: boolean;
  /** The engine state. */
  fbw_engine_state: EngineState;
  /** The thrust lever angle in degrees. */
  fbw_engine_thrust_lever_angle: number;
}

type IndexedTopics = keyof EngineBaseEvents;

type EngineIndexedEvents = {
  [P in keyof Pick<EngineBaseEvents, IndexedTopics> as IndexedEventType<P>]: EngineBaseEvents[P];
};

interface EnginePublisherEvents extends EngineBaseEvents, EngineIndexedEvents {}

/**
 * Events for engine local vars from the legacy "FADEC".
 */
export interface EngineEvents extends Omit<EngineBaseEvents, IndexedTopics>, EngineIndexedEvents {}

/**
 * Publisher for engine local vars.
 */
export class EnginePublisher extends SimVarPublisher<EnginePublisherEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<EnginePublisherEvents>) {
    const simvars = new Map<keyof EnginePublisherEvents, SimVarPublisherEntry<any>>([
      [
        'fbw_engine_master',
        {
          name: 'A:FUELSYSTEM VALVE SWITCH:#index#',
          type: SimVarValueType.Bool,
          indexed: true,
        },
      ],
      [
        'fbw_engine_fadec_powered',
        {
          name: 'L:A32NX_FADEC_POWERED_ENG#index#',
          type: SimVarValueType.Bool,
          indexed: true,
        },
      ],
      [
        'fbw_engine_state',
        {
          name: 'L:A32NX_ENGINE_STATE:#index#',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'fbw_engine_thrust_lever_angle',
        {
          name: 'L:A32NX_AUTOTHRUST_TLA:#index#',
          type: SimVarValueType.Number,
          indexed: true,
        },
      ],
    ]);

    super(simvars, bus, pacer);
  }
}
