// Copyright (c) 2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarDefinition, SimVarValueType, SimVarPublisher } from '@microsoft/msfs-sdk';

export type PopupSimvars = {
  simDisabled: boolean;
};

export enum PopupVars {
  simDisabled = 'A:SIM DISABLED',
}

export class PopupSimvarPublisher extends SimVarPublisher<PopupSimvars> {
  private static simvars = new Map<keyof PopupSimvars, SimVarDefinition>([
    ['simDisabled', { name: PopupVars.simDisabled, type: SimVarValueType.Bool }],
  ]);

  public constructor(bus: EventBus) {
    super(PopupSimvarPublisher.simvars, bus);
  }
}
