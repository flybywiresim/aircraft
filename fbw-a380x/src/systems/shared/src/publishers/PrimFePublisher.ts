// Copyright (c) 2021-2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarValueType, SimVarPublisher, PublishPacer, SimVarPublisherEntry } from '@microsoft/msfs-sdk';

export type PrimFeBusBaseEvents = {
  // The aerodynamic FPA in deg.
  prim_gamma_a: number;
  // The energy angle in deg.
  prim_gamma_t: number;
  // The speed corresponding to alpha max, in kn.
  prim_v_alpha_lim: number;
  // The speed corresponding to alpha prot, in kn.
  prim_v_alpha_prot: number;
  // The speed corresponding to the stall warning AOA, in kn.
  prim_v_alpha_stall_warn: number;
  // The minimum selectable speed, in kn.
  prim_v_ls: number;
  // The 1g stall speed (Vs1g), in kn.
  prim_v_stall: number;
  // The speed trend, in kn.
  prim_speed_trend: number;
  // The flaps speed, in kn.
  prim_v_3: number;
  // The slats speed, in kn.
  prim_v_4: number;
  // The green dot speed, in kn.
  prim_v_man: number;
  // VMax, in kn.
  prim_v_max: number;
  // VFe of the next flap/slat config, in kn.
  prim_v_fe_next: number;
};

type IndexedTopics = keyof PrimFeBusBaseEvents;

type PrimFeIndexedEventType<T extends string> = `${T}_${1 | 2 | 3}`;

type PrimFeBusIndexedEvents = {
  [P in keyof Pick<PrimFeBusBaseEvents, IndexedTopics> as PrimFeIndexedEventType<P>]: PrimFeBusBaseEvents[P];
};

interface PrimFeBusPublisherEvents extends PrimFeBusBaseEvents, PrimFeBusIndexedEvents {}

/**
 * Events for A380X PRIM bus (only for FE part) output bus local vars.
 */
export interface PrimFeBusEvents extends Omit<PrimFeBusBaseEvents, IndexedTopics>, PrimFeBusIndexedEvents {}

/**
 * Publisher for A380X PRIM bus (only for FE part) output local vars.
 */
export class PrimFeBusPublisher extends SimVarPublisher<PrimFeBusPublisherEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<PrimFeBusPublisherEvents>) {
    const simvars = new Map<keyof PrimFeBusPublisherEvents, SimVarPublisherEntry<any>>([
      [
        'prim_gamma_a',
        { name: 'L:A32NX_PRIM_#index#_GAMMA_A', type: SimVarValueType.Enum, indexed: true, defaultIndex: null },
      ],
      [
        'prim_gamma_t',
        { name: 'L:A32NX_PRIM_#index#_GAMMA_T', type: SimVarValueType.Enum, indexed: true, defaultIndex: null },
      ],
      [
        'prim_v_alpha_lim',
        { name: 'L:A32NX_PRIM_#index#_V_ALPHA_LIM', type: SimVarValueType.Enum, indexed: true, defaultIndex: null },
      ],
      [
        'prim_v_alpha_prot',
        { name: 'L:A32NX_PRIM_#index#_V_ALPHA_PROT', type: SimVarValueType.Enum, indexed: true, defaultIndex: null },
      ],
      [
        'prim_v_alpha_stall_warn',
        { name: 'L:A32NX_PRIM_#index#_V_STALL_WARN', type: SimVarValueType.Enum, indexed: true, defaultIndex: null },
      ],
      [
        'prim_v_ls',
        { name: 'L:A32NX_PRIM_#index#_V_LS', type: SimVarValueType.Enum, indexed: true, defaultIndex: null },
      ],
      [
        'prim_v_stall',
        { name: 'L:A32NX_PRIM_#index#_V_STALL_1G', type: SimVarValueType.Enum, indexed: true, defaultIndex: null },
      ],
      [
        'prim_speed_trend',
        { name: 'L:A32NX_PRIM_#index#_SPEED_TREND', type: SimVarValueType.Enum, indexed: true, defaultIndex: null },
      ],
      ['prim_v_3', { name: 'L:A32NX_PRIM_#index#_V_3', type: SimVarValueType.Enum, indexed: true, defaultIndex: null }],
      ['prim_v_4', { name: 'L:A32NX_PRIM_#index#_V_4', type: SimVarValueType.Enum, indexed: true, defaultIndex: null }],
      [
        'prim_v_man',
        { name: 'L:A32NX_PRIM_#index#_V_MAN', type: SimVarValueType.Enum, indexed: true, defaultIndex: null },
      ],
      [
        'prim_v_max',
        { name: 'L:A32NX_PRIM_#index#_V_MAX', type: SimVarValueType.Enum, indexed: true, defaultIndex: null },
      ],
      [
        'prim_v_fe_next',
        { name: 'L:A32NX_PRIM_#index#_V_FE_NEXT', type: SimVarValueType.Enum, indexed: true, defaultIndex: null },
      ],
    ]);

    super(simvars, bus, pacer);
  }
}
