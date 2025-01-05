// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarDefinition, SimVarValueType, SimVarPublisher } from '@microsoft/msfs-sdk';

export type PseudoFwcSimvars = {
  engine1Master: number;
  engine2Master: number;
  engine3Master: number;
  engine4Master: number;
};

export class PseudoFwcSimvarPublisher extends SimVarPublisher<PseudoFwcSimvars> {
  private static simvars = new Map<keyof PseudoFwcSimvars, SimVarDefinition>([
    ['engine1Master', { name: 'A:FUELSYSTEM VALVE SWITCH:1', type: SimVarValueType.Bool }],
    ['engine2Master', { name: 'A:FUELSYSTEM VALVE SWITCH:2', type: SimVarValueType.Bool }],
    ['engine3Master', { name: 'A:FUELSYSTEM VALVE SWITCH:3', type: SimVarValueType.Bool }],
    ['engine4Master', { name: 'A:FUELSYSTEM VALVE SWITCH:4', type: SimVarValueType.Bool }],
  ]);

  public constructor(bus: EventBus) {
    super(PseudoFwcSimvarPublisher.simvars, bus);
  }
}
