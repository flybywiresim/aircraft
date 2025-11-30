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
  /** Indicates state of the FCDC. Still mixed with old a32x definition, needs to be adapted to a380x once we have refs. Raw ARINC Word. */
  fcdc_discrete_word_1: number;
  /** Indicates state of the FCDC. Still mixed with old a32x definition, needs to be adapted to a380x once we have refs. Raw ARINC Word. */
  fcdc_discrete_word_2: number;
  /** Indicates state of the FCDC. Still mixed with old a32x definition, needs to be adapted to a380x once we have refs. Raw ARINC Word. */
  fcdc_discrete_word_3: number;
  /** Indicates state of the FCDC. Still mixed with old a32x definition, needs to be adapted to a380x once we have refs. Raw ARINC Word. */
  fcdc_discrete_word_4: number;
  /** Indicates state of the FCDC. Still mixed with old a32x definition, needs to be adapted to a380x once we have refs. Raw ARINC Word. */
  fcdc_discrete_word_5: number;
  /**
   * Indicates state of the PRIM FG. Raw ARINC Word.
   * No references available, so defined our own bit allocation.
   * Bit(s)   | Meaning
   * -------- | --------------------------
   *       20 | LAND 2 INOP
   *       21 | LAND 3 FAIL PASSIVE INOP
   *       22 | LAND 3 FAIL OP INOP
   *       23 | LAND 2 CAPACITY
   *       24 | LAND 3 FAIL PASSIVE CAPACITY
   *       25 | LAND 3 FAIL OP CAPACITY
   */
  fcdc_fg_discrete_word_4: number;
  /**
   * Indicates state of the PRIM FG. Raw ARINC Word.
   * No references available, so defined our own bit allocation.
   * Bit(s)   | Meaning
   * -------- | --------------------------
   *       11 | CAPABILITY DOWNGRADE
   *       12 | FG MODE REVERSION
   *       13 | BTV TRIPLE CLICK
   *       14 | AP 1 INOP
   *       15 | AP 2 INOP
   *       16 | FD 1 INOP
   *       17 | FD 2 INOP
   *       18 | ROLLOUT FAULT
   */
  fcdc_fg_discrete_word_8: number;
  /**
   * Indicates state of landing performance/dist and ROW/ROP/BTV. Raw ARINC Word.
   * No references available, so defined our own bit allocation.
   * Bit(s)   | Meaning
   * -------- | --------------------------
   *       11 | ROW LOST
   *       12 | ROP LOST
   *       13 | BTV LOST
   *       20 | LDG DIST AFFECTED LEADING TO ROW LOST
   *       21 | LDG PERF AFFECTED LEADING TO ROW LOST
   *       22 | LDG DIST AFFECTED LEADING TO BTV LOST
   *       23 | LDG PERF AFFECTED LEADING TO BTV LOST
   *       24 | LDG DIST AFFECTED
   *       25 | LDG PERF AFFECTED
   */
  fcdc_landing_fct_discrete_word: number;
};

type IndexedTopics =
  | 'fcdc_discrete_word_1'
  | 'fcdc_discrete_word_2'
  | 'fcdc_discrete_word_3'
  | 'fcdc_discrete_word_4'
  | 'fcdc_discrete_word_5'
  | 'fcdc_fg_discrete_word_4'
  | 'fcdc_fg_discrete_word_8'
  | 'fcdc_landing_fct_discrete_word';
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
      [
        'fcdc_landing_fct_discrete_word',
        { name: 'L:A32NX_FCDC_#index#_LANDING_FCT_DISCRETE_WORD', type: SimVarValueType.Number, indexed: true },
      ],
    ];

    super(new Map(simvars), bus, pacer);
  }
}
