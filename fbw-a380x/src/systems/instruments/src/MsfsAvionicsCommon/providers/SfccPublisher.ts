// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, PublishPacer, SimVarPublisher, SimVarPublisherEntry, SimVarValueType } from '@microsoft/msfs-sdk';

type BaseSffcVars = {
  slat_flap_system_status_word: number;
  slat_flap_actual_position_word: number;
  slat_actual_position_word: number;
  flap_actual_position_word: number;
};

type IndexedTopics = keyof BaseSffcVars;

type SfccIndexedEventType<T extends string> = `${T}_${1 | 2}`;

type SfccIndexedEvents = {
  [P in keyof Pick<BaseSffcVars, IndexedTopics> as SfccIndexedEventType<P>]: BaseSffcVars[P];
};

interface SfccSimVars extends BaseSffcVars, SfccIndexedEvents {}

export interface SfccEvents extends Omit<BaseSffcVars, IndexedTopics>, SfccIndexedEvents {}

export class SfccSimVarPublisher extends SimVarPublisher<SfccSimVars> {
  constructor(bus: EventBus, pacer?: PublishPacer<SfccSimVars>) {
    const simvars: [keyof SfccSimVars, SimVarPublisherEntry<any>][] = [
      [
        'slat_flap_system_status_word',
        { name: 'L:A32NX_SFCC_#index#_SLAT_FLAP_SYSTEM_STATUS_WORD', type: SimVarValueType.Enum, indexed: true },
      ],
      [
        'slat_flap_actual_position_word',
        { name: 'L:A32NX_SFCC_#index#_SLAT_FLAP_ACTUAL_POSITION_WORD', type: SimVarValueType.Enum, indexed: true },
      ],
      [
        'slat_actual_position_word',
        { name: 'L:A32NX_SFCC_#index#_SLAT_ACTUAL_POSITION_WORD', type: SimVarValueType.Enum, indexed: true },
      ],
      [
        'flap_actual_position_word',
        { name: 'L:A32NX_SFCC_#index#_FLAP_ACTUAL_POSITION_WORD', type: SimVarValueType.Enum, indexed: true },
      ],
    ];

    super(new Map(simvars), bus, pacer);
  }
}
