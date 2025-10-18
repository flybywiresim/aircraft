// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, PublishPacer, SimVarPublisher, SimVarPublisherEntry, SimVarValueType } from '@microsoft/msfs-sdk';

interface LgciuBusBaseEvents {
  /**
   * Discrete Data word 1 of the LGCIU bus output. Raw ARINC Word.
   */
  lgciu_discrete_word_1: number;
  /**
   * Discrete Data word 2 of the LGCIU bus output. Raw ARINC Word.
   */
  lgciu_discrete_word_2: number;
  /**
   * Discrete Data word 3 of the LGCIU bus output. Raw ARINC Word.
   */
  lgciu_discrete_word_3: number;
  /**
   * Discrete Data word 4 of the LGCIU bus output. Raw ARINC Word.
   */
  lgciu_discrete_word_4: number;
  lgciu_nose_gear_compressed: boolean;
  lgciu_left_gear_compressed: boolean;
  lgciu_right_gear_compressed: boolean;
  lgciu_nose_gear_downlocked: boolean;
  lgciu_left_gear_downlocked: boolean;
  lgciu_right_gear_downlocked: boolean;
  lgciu_nose_gear_unlocked: boolean;
  lgciu_left_gear_unlocked: boolean;
  lgciu_right_gear_unlocked: boolean;
}

type IndexedTopics = keyof LgciuBusBaseEvents;

type RaIndexedEventType<T extends string> = `${T}_${1 | 2}`;

type LgciuBusIndexedEvents = {
  [P in keyof Pick<LgciuBusBaseEvents, IndexedTopics> as RaIndexedEventType<P>]: LgciuBusBaseEvents[P];
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
      [
        'lgciu_nose_gear_compressed',
        {
          name: 'L:A32NX_LGCIU_#index#_NOSE_GEAR_COMPRESSED',
          type: SimVarValueType.Bool,
          indexed: true,
        },
      ],
      [
        'lgciu_left_gear_compressed',
        {
          name: 'L:A32NX_LGCIU_#index#_LEFT_GEAR_COMPRESSED',
          type: SimVarValueType.Bool,
          indexed: true,
        },
      ],
      [
        'lgciu_right_gear_compressed',
        {
          name: 'L:A32NX_LGCIU_#index#_RIGHT_GEAR_COMPRESSED',
          type: SimVarValueType.Bool,
          indexed: true,
        },
      ],
      [
        'lgciu_nose_gear_downlocked',
        {
          name: 'L:A32NX_LGCIU_#index#_NOSE_GEAR_DOWNLOCKED',
          type: SimVarValueType.Bool,
          indexed: true,
        },
      ],
      [
        'lgciu_left_gear_downlocked',
        {
          name: 'L:A32NX_LGCIU_#index#_LEFT_GEAR_DOWNLOCKED',
          type: SimVarValueType.Bool,
          indexed: true,
        },
      ],
      [
        'lgciu_right_gear_downlocked',
        {
          name: 'L:A32NX_LGCIU_#index#_RIGHT_GEAR_DOWNLOCKED',
          type: SimVarValueType.Bool,
          indexed: true,
        },
      ],
      [
        'lgciu_nose_gear_unlocked',
        {
          name: 'L:A32NX_LGCIU_#index#_NOSE_GEAR_UNLOCKED',
          type: SimVarValueType.Bool,
          indexed: true,
        },
      ],
      [
        'lgciu_left_gear_unlocked',
        {
          name: 'L:A32NX_LGCIU_#index#_LEFT_GEAR_UNLOCKED',
          type: SimVarValueType.Bool,
          indexed: true,
        },
      ],
      [
        'lgciu_right_gear_unlocked',
        {
          name: 'L:A32NX_LGCIU_#index#_RIGHT_GEAR_UNLOCKED',
          type: SimVarValueType.Bool,
          indexed: true,
        },
      ],
    ]);

    super(simvars, bus, pacer);
  }
}
