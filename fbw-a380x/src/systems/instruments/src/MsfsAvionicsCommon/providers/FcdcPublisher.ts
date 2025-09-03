// Copyright (c) 2021-2023 FlyByWire Simulations
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
  fcdc_discrete_word_4: number;
  fcdc_fg_discrete_word_4: number;
  fcdc_fg_discrete_word_8: number;
};

type IndexedTopics = 'fcdc_discrete_word_4' | 'fcdc_fg_discrete_word_4' | 'fcdc_fg_discrete_word_8';
type FcdcIndexedEvents = {
  [P in keyof Pick<BaseFcdcSimvars, IndexedTopics> as IndexedEventType<P>]: BaseFcdcSimvars[P];
};

export interface FcdcSimvars extends BaseFcdcSimvars, FcdcIndexedEvents {}

export class FcdcSimvarPublisher extends SimVarPublisher<FcdcSimvars> {
  constructor(bus: EventBus, pacer?: PublishPacer<FcdcSimvars>) {
    const simvars: [keyof FcdcSimvars, SimVarPublisherEntry<any>][] = [
      [
        'fcdc_discrete_word_4',
        { name: 'L:A32NX_FCDC_#index#_DISCRETE_WORD_4', type: SimVarValueType.Number, indexed: true },
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
