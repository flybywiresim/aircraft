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

export enum TransponderState {
  Off = 0,
  Standby = 1,
  Test = 2,
  ModeA = 3,
  ModeC = 4,
  ModeS = 5,
}

interface BaseTransponderEvents {
  /** The transponder code in octal. */
  transponder_code: number;
  /** Whether the ident function is active. */
  transponder_ident: boolean;
  /** The current state of the transponder. */
  transponder_auto: boolean;
}

type IndexedTopics = 'transponder_code' | 'transponder_ident' | 'transponder_auto';

type TransponderIndexedEvents = {
  [P in keyof Pick<BaseTransponderEvents, IndexedTopics> as IndexedEventType<P>]: BaseTransponderEvents[P];
};

export interface TransponderEvents extends BaseTransponderEvents, TransponderIndexedEvents {}

export class TransponderPublisher extends SimVarPublisher<TransponderEvents> {
  /**
   * Create a transponder publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<TransponderEvents>) {
    const simvars = new Map<keyof TransponderEvents, SimVarPublisherEntry<any>>([
      ['transponder_code', { name: `TRANSPONDER CODE:#index#`, type: 'bco16' as SimVarValueType, indexed: true }],
      ['transponder_ident', { name: `TRANSPONDER IDENT:#index#`, type: SimVarValueType.Bool, indexed: true }],
      [
        'transponder_auto',
        {
          name: `TRANSPONDER STATE:#index#`,
          type: SimVarValueType.Enum,
          indexed: true,
          map: (v) => v === TransponderState.ModeA || v === TransponderState.ModeC || v === TransponderState.ModeS,
        },
      ],
    ]);

    super(simvars, bus, pacer);
  }
}
