// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarDefinition, SimVarValueType, SimVarPublisher } from '@microsoft/msfs-sdk';

export type ResetPanelSimvars = {
  fmcAReset: boolean;
  fmcBReset: boolean;
  fmcCReset: boolean;
};

export class ResetPanelSimvarPublisher extends SimVarPublisher<ResetPanelSimvars> {
  private static simvars = new Map<keyof ResetPanelSimvars, SimVarDefinition>([
    ['fmcAReset', { name: 'L:A32NX_RESET_PANEL_FMC_A', type: SimVarValueType.Bool }],
    ['fmcBReset', { name: 'L:A32NX_RESET_PANEL_FMC_B', type: SimVarValueType.Bool }],
    ['fmcCReset', { name: 'L:A32NX_RESET_PANEL_FMC_C', type: SimVarValueType.Bool }],
  ]);

  public constructor(bus: EventBus) {
    super(ResetPanelSimvarPublisher.simvars, bus);
  }
}
