// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  EventBus,
  IndexedEventType,
  SimVarPublisher,
  SimVarPublisherEntry,
  SimVarValueType,
} from '@microsoft/msfs-sdk';

/**
 * Transmitted from CPIOMs
 */
export interface BaseCpiomData {
  cpiom_a_failed: boolean;
  cpiom_b_failed: boolean;
  cpiom_c_failed: boolean;
  cpiom_d_failed: boolean;
  cpiom_e_failed: boolean;
  cpiom_f_failed: boolean;
  cpiom_g_failed: boolean;
}

type IndexedTopics =
  | 'cpiom_a_failed'
  | 'cpiom_b_failed'
  | 'cpiom_c_failed'
  | 'cpiom_d_failed'
  | 'cpiom_e_failed'
  | 'cpiom_f_failed'
  | 'cpiom_g_failed';
type CpiomIndexedEvents = {
  [P in keyof Pick<BaseCpiomData, IndexedTopics> as IndexedEventType<P>]: BaseCpiomData[P];
};

export interface CpiomData extends BaseCpiomData, CpiomIndexedEvents {}

/** A publisher to poll and publish nav/com simvars. */
export class CpiomDataPublisher extends SimVarPublisher<CpiomData> {
  private static simvars = new Map<keyof CpiomData, SimVarPublisherEntry<any>>([
    ['cpiom_a_failed', { name: 'L:A32NX_CPIOM_A#index#_FAILURE', type: SimVarValueType.Number, indexed: [1, 2] }],
    ['cpiom_b_failed', { name: 'L:A32NX_CPIOM_B#index#_FAILURE', type: SimVarValueType.Number, indexed: [1, 2] }],
    ['cpiom_c_failed', { name: 'L:A32NX_CPIOM_C#index#_FAILURE', type: SimVarValueType.Number, indexed: [1, 2] }],
    ['cpiom_d_failed', { name: 'L:A32NX_CPIOM_D#index#_FAILURE', type: SimVarValueType.Number, indexed: [1, 2] }],
    ['cpiom_e_failed', { name: 'L:A32NX_CPIOM_E#index#_FAILURE', type: SimVarValueType.Number, indexed: [1, 2] }],
    ['cpiom_f_failed', { name: 'L:A32NX_CPIOM_F#index#_FAILURE', type: SimVarValueType.Number, indexed: [1, 2] }],
    ['cpiom_g_failed', { name: 'L:A32NX_CPIOM_G#index#_FAILURE', type: SimVarValueType.Number, indexed: [1, 2] }],
  ]);

  public constructor(bus: EventBus) {
    super(CpiomDataPublisher.simvars, bus);
  }
}
