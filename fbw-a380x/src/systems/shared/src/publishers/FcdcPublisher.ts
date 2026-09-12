// Copyright (c) 2021-2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarValueType, SimVarPublisher, PublishPacer, SimVarPublisherEntry } from '@microsoft/msfs-sdk';

export type FcdcBusBaseEvents = {
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
   * FCDC FG Discrete word 1. Raw ARINC Word.
   * No references available, so defined our own bit allocation.
   * Bit(s)   | Meaning
   * -------- | --------------------------
   *       11 | AP 1 Engaged
   *       12 | AP 2 Engaged
   *       13 | FD Engaged
   *       14 | A/THR Engaged
   *       15 | A/THR Active
   *       16 | Spare
   *       17 | LAND Mode Armed
   *       18 | LAND Mode Active
   *       19 | GA Active
   *       20 | BTV Active
   *       21 |
   *       -  | Spare
   *       23 |
   *       24 | Land 2 Capacity
   *       25 | Land 3 Fail Passive Capacity
   *       26 | Land 3 Fail Op. Capacity
   *       27 | F-APP Capacity
   *       28 | F-APP+RAW Capacity
   *       29 | RAW ONLY Capacity
   */
  fcdc_fg_discrete_word_1: number;
  /**
   * FCDC FG Discrete word 2. Raw ARINC Word.
   * No references available, so defined our own bit allocation.
   * Bit(s)   | Meaning
   * -------- | --------------------------
   *       11 | AP 1 Inop.
   *       12 | AP 2 Inop.
   *       13 | FD 1 Inop.
   *       14 | FD 2 Inop.
   *       15 | A/THR Inop.
   *       16 | A/THR failed on engine 1
   *       17 | A/THR failed on engine 2
   *       18 | A/THR failed on engine 3
   *       19 | A/THR failed on engine 4
   *       20 |
   *       -  | Spare
   *       23 |
   *       24 | Land 2 Inop.
   *       25 | Land 3 Fail Passive Inop.
   *       26 | Land 3 Fail Op. Inop.
   *       27 | F-APP Inop.
   *       28 | F-APP+RAW Inop.
   *       29 | RAW ONLY Inop.
   */
  fcdc_fg_discrete_word_2: number;
  /**
   * FCDC FG Discrete word 3. Raw ARINC Word.
   * No references available, so defined our own bit allocation.
   * Bit(s)   | Meaning
   * -------- | --------------------------
   *       11 | Low energy Warning
   *       12 | PITCH PITCH Warning
   *       13 | BANK BANK Warning
   *       14 | Reactive Windshear Warning
   *       15 | Reactive Windshear Fault
   *       16 | Triple Click demand
   *       17 | Triple Click demand (BTV)
   */
  fcdc_fg_discrete_word_3: number;
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

type IndexedTopics = keyof FcdcBusBaseEvents;

type FcdcIndexedEventType<T extends string> = `${T}_${1 | 2}`;

type FcdcBusIndexedEvents = {
  [P in keyof Pick<FcdcBusBaseEvents, IndexedTopics> as FcdcIndexedEventType<P>]: FcdcBusBaseEvents[P];
};

export interface FcdcBusEvents extends FcdcBusBaseEvents, FcdcBusIndexedEvents {}

export class FcdcBusPublisher extends SimVarPublisher<FcdcBusEvents> {
  constructor(bus: EventBus, pacer?: PublishPacer<FcdcBusEvents>) {
    const simvars: [keyof FcdcBusEvents, SimVarPublisherEntry<any>][] = [
      [
        'fcdc_discrete_word_1',
        {
          name: 'L:A32NX_FCDC_#index#_DISCRETE_WORD_1',
          type: SimVarValueType.Number,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'fcdc_discrete_word_2',
        {
          name: 'L:A32NX_FCDC_#index#_DISCRETE_WORD_2',
          type: SimVarValueType.Number,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'fcdc_discrete_word_3',
        {
          name: 'L:A32NX_FCDC_#index#_DISCRETE_WORD_3',
          type: SimVarValueType.Number,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'fcdc_discrete_word_4',
        {
          name: 'L:A32NX_FCDC_#index#_DISCRETE_WORD_4',
          type: SimVarValueType.Number,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'fcdc_discrete_word_5',
        {
          name: 'L:A32NX_FCDC_#index#_DISCRETE_WORD_5',
          type: SimVarValueType.Number,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'fcdc_fg_discrete_word_1',
        {
          name: 'L:A32NX_FCDC_#index#_FG_DISCRETE_WORD_1',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'fcdc_fg_discrete_word_2',
        {
          name: 'L:A32NX_FCDC_#index#_FG_DISCRETE_WORD_2',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'fcdc_fg_discrete_word_3',
        {
          name: 'L:A32NX_FCDC_#index#_FG_DISCRETE_WORD_3',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'fcdc_landing_fct_discrete_word',
        {
          name: 'L:A32NX_FCDC_#index#_LANDING_FCT_DISCRETE_WORD',
          type: SimVarValueType.Number,
          indexed: true,
          defaultIndex: null,
        },
      ],
    ];

    super(new Map(simvars), bus, pacer);
  }
}
