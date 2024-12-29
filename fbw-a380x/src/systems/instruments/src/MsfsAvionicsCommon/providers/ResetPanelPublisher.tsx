// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarDefinition, SimVarValueType, SimVarPublisher } from '@microsoft/msfs-sdk';

export type ResetPanelSimvars = {
  fws1Reset: boolean;
  fws2Reset: boolean;
};

export class ResetPanelSimvarPublisher extends SimVarPublisher<ResetPanelSimvars> {
  private static simvars = new Map<keyof ResetPanelSimvars, SimVarDefinition>([
    ['fws1Reset', { name: 'L:A32NX_RESET_PANEL_FWS1', type: SimVarValueType.Bool }],
    ['fws2Reset', { name: 'L:A32NX_RESET_PANEL_FWS2', type: SimVarValueType.Bool }],
  ]);

  public constructor(bus: EventBus) {
    super(ResetPanelSimvarPublisher.simvars, bus);
  }
}
