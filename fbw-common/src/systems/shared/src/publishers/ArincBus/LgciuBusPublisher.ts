// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, PublishPacer, SimVarPublisher, SimVarPublisherEntry, SimVarValueType } from '@microsoft/msfs-sdk';

interface LgciuBusBaseEvents {
  /**
   * Discrete Data word 1 of the LGCIU bus output. Raw ARINC Word.
   *  | Bit |                                  Description                                 |
      |:---:|:----------------------------------------------------------------------------:|
      | 11  | LH gear not locked up and not selected down                                  |
      | 12  | RH gear not locked up and not selected down                                  |
      | 13  | Nose gear not locked up and not selected down                                |
      | 14  | LH gear not locked down and selected down                                    |
      | 15  | RH gear not locked down and selected down                                    |
      | 16  | Nose gear not locked down and selected down                                  |
      | 17  | LH gear door not uplocked                                                    |
      | 18  | RH gear door not uplocked                                                    |
      | 19  | Nose gear door not uplocked                                                  |
      | 20  | LH gear uplock locked and gear locked down                                   |
      | 21  | RH gear uplock locked and gear locked down                                   |
      | 22  | Nose gear uplock locked and gear locked down                                 |
      | 23  | LH gear downlocked                                                           |
      | 24  | RH gear downlocked                                                           |
      | 25  | Nose gear downlocked                                                         |
      | 26  | LH gear shock absorber not extended (Treat GND PWR connected as on ground)   |
      | 27  | RH gear shock absorber not extended (Treat GND PWR connected as on ground)   |
      | 28  | Nose gear shock absorber not extended (Treat GND PWR connected as on ground) |
      | 29  | Gear selected down (Lever Position)                                          |
   */
  lgciu_discrete_word_1: number;
  /**
   * Discrete Data word 2 of the LGCIU bus output. Raw ARINC Word.
   *  | Bit |                                     Description                                     |
      |:---:|:-----------------------------------------------------------------------------------:|
      | 11  | LH & RH gear shock absorber compressed (Don't treat GND PWR connected as on ground) |
      | 12  | Nose gear shock absorber compressed (Don't treat GND PWR connected as on ground)    |
      | 13  | LH gear shock absorber compressed (Don't treat GND PWR connected as on ground)      |
      | 14  | RH gear shock absorber compressed (Don't treat GND PWR connected as on ground)      |
      | 15  | LH & RH gear downlocked                                                             |
      | 29  | Control fault                                                                       |
   */
  lgciu_discrete_word_2: number;
  /**
   * Discrete Data word 3 of the LGCIU bus output. Raw ARINC Word.
   *  | Bit |            Description            |
      |:---:|:---------------------------------:|
      | 11  | LH gear not locked up             |
      | 12  | RH gear not locked up             |
      | 13  | Nose gear not locked up           |
      | 14  | Gear selected up (Lever Position) |
      | 25  | LH gear door fully open           |
      | 26  | RH gear door fully open           |
      | 27  | LH Nose gear door fully open      |
      | 28  | RH Nose gear door fully open      |
   */
  lgciu_discrete_word_3: number;
  /**
   * Discrete Data word 4 of the LGCIU bus output. Raw ARINC Word.
   *  | Bit |             Description             |
      |:---:|:-----------------------------------:|
      | 21  | LH flap attachment failure detected |
      | 22  | LH flap attachment sensor valid     |
      | 25  | RH flap attachment failure detected |
      | 26  | RH flap attachment sensor valid     |
      | 29  | SYS fault                           |
   */
  lgciu_discrete_word_4: number;
}

type IndexedTopics = keyof LgciuBusBaseEvents;

type LgciuIndexedEventType<T extends string> = `${T}_${1 | 2}`;

type LgciuBusIndexedEvents = {
  [P in keyof Pick<LgciuBusBaseEvents, IndexedTopics> as LgciuIndexedEventType<P>]: LgciuBusBaseEvents[P];
};

interface LgciuBusPublisherEvents extends LgciuBusBaseEvents, LgciuBusIndexedEvents {}

/**
 * Events for A32NX LGCIU output bus local vars.
 */
export interface LgciuBusEvents extends Omit<LgciuBusBaseEvents, IndexedTopics>, LgciuBusIndexedEvents {}

/**
 * Publisher for A32NX LGCIU output bus local vars.
 */
export class LgciuBusPublisher extends SimVarPublisher<LgciuBusPublisherEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<LgciuBusPublisherEvents>) {
    const simvars = new Map<keyof LgciuBusPublisherEvents, SimVarPublisherEntry<any>>([
      [
        'lgciu_discrete_word_1',
        {
          name: 'L:A32NX_LGCIU_#index#_DISCRETE_WORD_1',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'lgciu_discrete_word_2',
        {
          name: 'L:A32NX_LGCIU_#index#_DISCRETE_WORD_2',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'lgciu_discrete_word_3',
        {
          name: 'L:A32NX_LGCIU_#index#_DISCRETE_WORD_3',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'lgciu_discrete_word_4',
        {
          name: 'L:A32NX_LGCIU_#index#_DISCRETE_WORD_4',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
    ]);

    super(simvars, bus, pacer);
  }
}
