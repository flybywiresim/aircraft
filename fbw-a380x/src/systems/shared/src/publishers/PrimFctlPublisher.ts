// Copyright (c) 2021-2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarValueType, SimVarPublisher, PublishPacer, SimVarPublisherEntry } from '@microsoft/msfs-sdk';

export type PrimFctlBusBaseEvents = {
  /**
   * Discrete status word carrying information about the F/CTL law status.
   * Bit(s)   | Meaning
   * -------- | --------------------------
   *       11 | Pitch law capability of this PRIM
   *       -  |
   *       13 |
   *       14 | Lateral law capability of this PRIM
   *       15 |
   *       16 | The active pitch law of the system
   *       -  |
   *       18 |
   *       19 | The active lateral law of the system
   *       20 |
   *       21 | If this PRIM is selected as the master PRIM
   */
  prim_fctl_law_status_word: number;
  /**
   * Discrete status word carrying general information about the F/CTL system.
   * Bit(s)   | Meaning
   * -------- | --------------------------
   *       11 | THS Automatic Mode Active
   *       12 |
   *       -  | Spare
   *       16 |
   *       17 | Left Sidestick disabled (due to priority)
   *       18 | Right Sidestick disabled (due to priority)
   *       19 | Left Sidestick priority locked
   *       20 | Right Sidestick priority locked
   *       21 |
   *       -  | Spare
   *       26 |
   *       27 | Speed Brake lever extended
   *       20 | Ground Spoilers armed
   *       21 | Ground Spoilers out
   */
  prim_discrete_status_word_1: number;
  /**
   * Commanded deflection angle for the speed brakes, in degrees.
   */
  prim_speed_brake_command: number;
  /**
   * Commanded deflection angle for the ground spoilers, in degrees.
   */
  prim_ground_spoiler_command: number;
};

type IndexedTopics = keyof PrimFctlBusBaseEvents;

type PrimFctlIndexedEventType<T extends string> = `${T}_${1 | 2 | 3}`;

type PrimFctlBusIndexedEvents = {
  [P in keyof Pick<PrimFctlBusBaseEvents, IndexedTopics> as PrimFctlIndexedEventType<P>]: PrimFctlBusBaseEvents[P];
};

interface PrimFctlBusPublisherEvents extends PrimFctlBusBaseEvents, PrimFctlBusIndexedEvents {}

/**
 * Events for A380X PRIM bus (only for F/CTL part) output bus local vars.
 */
export interface PrimFctlBusEvents extends Omit<PrimFctlBusBaseEvents, IndexedTopics>, PrimFctlBusIndexedEvents {}

/**
 * Publisher for A380X PRIM bus (only for F/CTL part) output local vars.
 */
export class PrimFctlBusPublisher extends SimVarPublisher<PrimFctlBusPublisherEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<PrimFctlBusPublisherEvents>) {
    const simvars = new Map<keyof PrimFctlBusPublisherEvents, SimVarPublisherEntry<any>>([
      [
        'prim_fctl_law_status_word',
        {
          name: 'L:A32NX_PRIM_#index#_FCTL_LAW_STATUS_WORD',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_discrete_status_word_1',
        {
          name: 'L:A32NX_PRIM_#index#_DISCRETE_STATUS_WORD_1',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_speed_brake_command',
        {
          name: 'L:A32NX_PRIM_#index#_SPD_BRK_COMMAND',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_ground_spoiler_command',
        {
          name: 'L:A32NX_PRIM_#index#_GND_SPLR_COMMAND',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
    ]);

    super(simvars, bus, pacer);
  }
}
