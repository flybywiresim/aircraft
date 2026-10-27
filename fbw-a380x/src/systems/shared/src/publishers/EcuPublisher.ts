// Copyright (c) 2021-2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarValueType, SimVarPublisher, PublishPacer, SimVarPublisherEntry } from '@microsoft/msfs-sdk';

export type EcuBusBaseEvents = {
  /**
   * ECU Discrete word 3. Raw ARINC Word.
   * Placeholder implementation, copied from A32NX.
   * Bit(s)   | Meaning
   * -------- | --------------------------
   *       15 | REV Thrust limit Active
   *       19 | A/THR Control Active
   *       21 | A FLOOR Mode Active
   *       22 | TOGA Thrust limit Active
   *       23 | FLX Thrust limit Active
   *       24 | MCT Thrust limit Active
   *       25 | CLB Thrust limit Active
   */
  ecu_status_word_3: number;
  /**
   * ECU Discrete word 6. Raw ARINC Word.
   * Placeholder implementation, copied from A32NX.
   * Bit(s)   | Meaning
   * -------- | --------------------------
   *       12 | Memo thrust active
   */
  ecu_maintenance_word_6: number;
};

type IndexedTopics = keyof EcuBusBaseEvents;

type EcuIndexedEventType<T extends string> = `${T}_${1 | 2 | 3 | 4}`;

type EcuBusIndexedEvents = {
  [P in keyof Pick<EcuBusBaseEvents, IndexedTopics> as EcuIndexedEventType<P>]: EcuBusBaseEvents[P];
};

export interface EcuBusEvents extends EcuBusBaseEvents, EcuBusIndexedEvents {}

export class EcuBusPublisher extends SimVarPublisher<EcuBusEvents> {
  constructor(bus: EventBus, pacer?: PublishPacer<EcuBusEvents>) {
    const simvars: [keyof EcuBusEvents, SimVarPublisherEntry<any>][] = [
      [
        'ecu_status_word_3',
        {
          name: 'L:A32NX_ECU_#index#_STATUS_WORD_3',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'ecu_maintenance_word_6',
        {
          name: 'L:A32NX_ECU_#index#_MAINTENANCE_WORD_6',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
    ];

    super(new Map(simvars), bus, pacer);
  }
}
