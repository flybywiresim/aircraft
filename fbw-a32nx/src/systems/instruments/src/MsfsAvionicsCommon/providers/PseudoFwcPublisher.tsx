// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarDefinition, SimVarValueType, SimVarPublisher } from '@microsoft/msfs-sdk';

export type PseudoFwcSimvars = {
  engine1Master: number;
  engine2Master: number;
  engine3Master: number;
  engine4Master: number;
  fmgc1DiscreteWord3: number;
  fmgc2DiscreteWord3: number;
  fmgc1DiscreteWord4: number;
  fmgc2DiscreteWord4: number;
};

export class PseudoFwcSimvarPublisher extends SimVarPublisher<PseudoFwcSimvars> {
  private static simvars = new Map<keyof PseudoFwcSimvars, SimVarDefinition>([
    ['engine1Master', { name: 'A:FUELSYSTEM VALVE SWITCH:1', type: SimVarValueType.Bool }],
    ['engine2Master', { name: 'A:FUELSYSTEM VALVE SWITCH:2', type: SimVarValueType.Bool }],
    ['engine3Master', { name: 'A:FUELSYSTEM VALVE SWITCH:3', type: SimVarValueType.Bool }],
    ['engine4Master', { name: 'A:FUELSYSTEM VALVE SWITCH:4', type: SimVarValueType.Bool }],
    ['fmgc1DiscreteWord3', { name: 'L:A32NX_FMGC_1_DISCRETE_WORD_3', type: SimVarValueType.Number }],
    ['fmgc2DiscreteWord3', { name: 'L:A32NX_FMGC_2_DISCRETE_WORD_3', type: SimVarValueType.Number }],
    ['fmgc1DiscreteWord4', { name: 'L:A32NX_FMGC_1_DISCRETE_WORD_4', type: SimVarValueType.Number }],
    ['fmgc2DiscreteWord4', { name: 'L:A32NX_FMGC_2_DISCRETE_WORD_4', type: SimVarValueType.Number }],
  ]);

  public constructor(bus: EventBus) {
    super(PseudoFwcSimvarPublisher.simvars, bus);
  }
}
