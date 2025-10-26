// Copyright (c) 2021-2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  EventBus,
  SimVarValueType,
  SimVarPublisher,
  IndexedEventType,
  PublishPacer,
  SimVarPublisherEntry,
} from '@microsoft/msfs-sdk';

type BaseFcdcSimvars = {
  fcdc_discrete_word_1: number;
  fcdc_discrete_word_2: number;
  fcdc_discrete_word_3: number;
  fcdc_discrete_word_4: number;
  fcdc_discrete_word_5: number;
  fcdc_fg_discrete_word_4: number;
  fcdc_fg_discrete_word_8: number;
};

type IndexedTopics =
  | 'fcdc_discrete_word_1'
  | 'fcdc_discrete_word_2'
  | 'fcdc_discrete_word_3'
  | 'fcdc_discrete_word_4'
  | 'fcdc_discrete_word_5'
  | 'fcdc_fg_discrete_word_4'
  | 'fcdc_fg_discrete_word_8';
type FcdcIndexedEvents = {
  [P in keyof Pick<BaseFcdcSimvars, IndexedTopics> as IndexedEventType<P>]: BaseFcdcSimvars[P];
};

export interface FcdcSimvars extends BaseFcdcSimvars, FcdcIndexedEvents {}

export class FcdcSimvarPublisher extends SimVarPublisher<FcdcSimvars> {
  constructor(bus: EventBus, pacer?: PublishPacer<FcdcSimvars>) {
    const simvars: [keyof FcdcSimvars, SimVarPublisherEntry<any>][] = [
      [
        'fcdc_discrete_word_1',
        { name: 'L:A32NX_FCDC_#index#_DISCRETE_WORD_1', type: SimVarValueType.Number, indexed: true },
      ],
      [
        'fcdc_discrete_word_2',
        { name: 'L:A32NX_FCDC_#index#_DISCRETE_WORD_2', type: SimVarValueType.Number, indexed: true },
      ],
      [
        'fcdc_discrete_word_3',
        { name: 'L:A32NX_FCDC_#index#_DISCRETE_WORD_3', type: SimVarValueType.Number, indexed: true },
      ],
      [
        'fcdc_discrete_word_4',
        { name: 'L:A32NX_FCDC_#index#_DISCRETE_WORD_4', type: SimVarValueType.Number, indexed: true },
      ],
      [
        'fcdc_discrete_word_5',
        { name: 'L:A32NX_FCDC_#index#_DISCRETE_WORD_5', type: SimVarValueType.Number, indexed: true },
      ],
      [
        'fcdc_fg_discrete_word_4',
        { name: 'L:A32NX_FCDC_#index#_FG_DISCRETE_WORD_4', type: SimVarValueType.Number, indexed: true },
      ],
      [
        'fcdc_fg_discrete_word_8',
        { name: 'L:A32NX_FCDC_#index#_FG_DISCRETE_WORD_8', type: SimVarValueType.Number, indexed: true },
      ],
    ];

    super(new Map(simvars), bus, pacer);
  }
}
