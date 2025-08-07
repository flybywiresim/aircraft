// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarDefinition, SimVarValueType, SimVarPublisher } from '@microsoft/msfs-sdk';

export type CpiomAvailableSimvars = {
  cpiomC1Avail: boolean;
  cpiomC2Avail: boolean;
};

export class CpiomAvailableSimvarPublisher extends SimVarPublisher<CpiomAvailableSimvars> {
  private static simvars = new Map<keyof CpiomAvailableSimvars, SimVarDefinition>([
    ['cpiomC1Avail', { name: 'L:A32NX_CPIOM_C1_AVAIL', type: SimVarValueType.Bool }],
    ['cpiomC2Avail', { name: 'L:A32NX_CPIOM_C2_AVAIL', type: SimVarValueType.Bool }],
  ]);

  public constructor(bus: EventBus) {
    super(CpiomAvailableSimvarPublisher.simvars, bus);
  }
}
