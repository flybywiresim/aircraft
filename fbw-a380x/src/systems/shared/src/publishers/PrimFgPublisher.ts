// Copyright (c) 2021-2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarValueType, SimVarPublisher, PublishPacer, SimVarPublisherEntry } from '@microsoft/msfs-sdk';

export type PrimFgBusBaseEvents = {
  // The speed target corresponding to managed or selected speed, in kn.
  prim_pfd_speed_target: number;
  // The short term managed speed, in kn.
  prim_pfd_short_term_managed_speed: number;
  // The preselected mach.
  prim_presel_mach: number;
  // The preselected speed, in kn.
  prim_presel_speed: number;
  // The runway heading, memorized during approach below 400ft, in deg.
  prim_runway_hdg_memo: number;
  // The roll FD command for FD 1, in deg.
  prim_roll_fd_command_1: number;
  // The pitch FD command for FD 1, in deg.
  prim_pitch_fd_command_1: number;
  // The yaw FD command for FD 1, in deg.
  prim_yaw_fd_command_1: number;
  // The roll FD command for FD 2, in deg.
  prim_roll_fd_command_2: number;
  // The pitch FD command for FD 2, in deg.
  prim_pitch_fd_command_2: number;
  // The yaw FD command for FD 2, in deg.
  prim_yaw_fd_command_2: number;
  // The next applicable alt constraint delivered from the PRIM, in ft.
  prim_fm_alt_constraint: number;
  // The high speed margin position, in kn.
  prim_speed_margin_high: number;
  // The low speed margin position, in kn.
  prim_speed_margin_low: number;
  // FG discrete word 1. TODO bit layout
  prim_fg_discrete_word_1: number;
  // FG discrete word 2. TODO bit layout
  prim_fg_discrete_word_2: number;
  // FG discrete word 3. TODO bit layout
  prim_fg_discrete_word_3: number;
  // FG discrete word 4. TODO bit layout
  prim_fg_discrete_word_4: number;
  // FG discrete word 5. TODO bit layout
  prim_fg_discrete_word_5: number;
  // FG discrete word 6. TODO bit layout
  prim_fg_discrete_word_6: number;
  // FG A/THR discrete word. TODO bit layout
  prim_fg_ats_discrete_word: number;
  // FG A/THR FMA discrete word 6. TODO bit layout
  prim_fg_ats_fma_discrete_word: number;
};

type IndexedTopics = keyof PrimFgBusBaseEvents;

type PrimFgIndexedEventType<T extends string> = `${T}_${1 | 2 | 3}`;

type PrimFgBusIndexedEvents = {
  [P in keyof Pick<PrimFgBusBaseEvents, IndexedTopics> as PrimFgIndexedEventType<P>]: PrimFgBusBaseEvents[P];
};

interface PrimFgBusPublisherEvents extends PrimFgBusBaseEvents, PrimFgBusIndexedEvents {}

/**
 * Events for A380X PRIM bus (only for FG part) output bus local vars.
 */
export interface PrimFgBusEvents extends Omit<PrimFgBusBaseEvents, IndexedTopics>, PrimFgBusIndexedEvents {}

/**
 * Publisher for A380X PRIM bus (only for FE part) output local vars.
 */
export class PrimFgBusPublisher extends SimVarPublisher<PrimFgBusPublisherEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<PrimFgBusPublisherEvents>) {
    const simvars = new Map<keyof PrimFgBusPublisherEvents, SimVarPublisherEntry<any>>([
      [
        'prim_pfd_speed_target',
        {
          name: 'L:A32NX_PRIM_#index#_PFD_SELECTED_SPEED',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_pfd_short_term_managed_speed',
        {
          name: 'L:A32NX_PRIM_#index#_PFD_SHORT_TERM_MANAGED_SPEED',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_presel_mach',
        { name: 'L:A32NX_PRIM_#index#_PRESEL_MACH', type: SimVarValueType.Enum, indexed: true, defaultIndex: null },
      ],
      [
        'prim_presel_speed',
        { name: 'L:A32NX_PRIM_#index#_PRESEL_SPEED', type: SimVarValueType.Enum, indexed: true, defaultIndex: null },
      ],
      [
        'prim_runway_hdg_memo',
        { name: 'L:A32NX_PRIM_#index#_RWY_HDG_MEMO', type: SimVarValueType.Enum, indexed: true, defaultIndex: null },
      ],
      [
        'prim_roll_fd_command_1',
        {
          name: 'L:A32NX_PRIM_#index#_ROLL_FD_COMMAND_1',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_pitch_fd_command_1',
        {
          name: 'L:A32NX_PRIM_#index#_PITCH_FD_COMMAND_1',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_yaw_fd_command_1',
        {
          name: 'L:A32NX_PRIM_#index#_YAW_FD_COMMAND_1',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_roll_fd_command_2',
        {
          name: 'L:A32NX_PRIM_#index#_ROLL_FD_COMMAND_2',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_pitch_fd_command_2',
        {
          name: 'L:A32NX_PRIM_#index#_PITCH_FD_COMMAND_2',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_yaw_fd_command_2',
        {
          name: 'L:A32NX_PRIM_#index#_YAW_FD_COMMAND_2',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_fm_alt_constraint',
        {
          name: 'L:A32NX_PRIM_#index#_FM_ALTITUDE_CONSTRAINT',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_speed_margin_high',
        {
          name: 'L:A32NX_PRIM_#index#_SPEED_MARGIN_HIGH',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_speed_margin_low',
        {
          name: 'L:A32NX_PRIM_#index#_SPEED_MARGIN_LOW',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_fg_discrete_word_1',
        {
          name: 'L:A32NX_PRIM_#index#_FG_DISCRETE_WORD_1',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_fg_discrete_word_2',
        {
          name: 'L:A32NX_PRIM_#index#_FG_DISCRETE_WORD_2',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_fg_discrete_word_3',
        {
          name: 'L:A32NX_PRIM_#index#_FG_DISCRETE_WORD_3',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_fg_discrete_word_4',
        {
          name: 'L:A32NX_PRIM_#index#_FG_DISCRETE_WORD_4',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_fg_discrete_word_5',
        {
          name: 'L:A32NX_PRIM_#index#_FG_DISCRETE_WORD_5',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_fg_discrete_word_6',
        {
          name: 'L:A32NX_PRIM_#index#_FG_DISCRETE_WORD_6',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_fg_ats_discrete_word',
        {
          name: 'L:A32NX_PRIM_#index#_FG_ATS_DISCRETE_WORD',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_fg_ats_fma_discrete_word',
        {
          name: 'L:A32NX_PRIM_#index#_FG_ATS_FMA_DISCRETE_WORD',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
    ]);

    super(simvars, bus, pacer);
  }
}
