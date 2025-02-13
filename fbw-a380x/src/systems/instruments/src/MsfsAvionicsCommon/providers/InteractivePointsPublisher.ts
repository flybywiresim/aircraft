// Copyright (c) 2021-2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0
import {
  EventBus,
  IndexedEventType,
  PublishPacer,
  SimVarPublisher,
  SimVarPublisherEntry,
  SimVarValueType,
} from '@microsoft/msfs-sdk';

export interface BaseInteractivePointsEvents {
  /**interactive point open percentage between 0 and 1 */
  interactive_point_open: number;
}

type IndexedTopics = 'interactive_point_open';

type InteractivePointIndexedEvents = {
  [P in keyof Pick<BaseInteractivePointsEvents, IndexedTopics> as IndexedEventType<P>]: BaseInteractivePointsEvents[P];
};

export interface InteractivePointEvents extends BaseInteractivePointsEvents, InteractivePointIndexedEvents {}

export class InteractivePointsPublisher extends SimVarPublisher<InteractivePointEvents> {
  constructor(bus: EventBus, pacer?: PublishPacer<InteractivePointEvents>) {
    const simvars: [keyof InteractivePointEvents, SimVarPublisherEntry<any>][] = [
      [
        'interactive_point_open',
        {
          name: 'INTERACTIVE POINT OPEN:#index',
          type: SimVarValueType.Number,
          indexed: true,
        },
      ],
    ];
    super(simvars, bus, pacer);
  }
}
