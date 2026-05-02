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

export interface TodPauseOverlayState {
  visible: boolean;
  title: string;
  message: string;
}

/** Controls visibility and content of the EFB pause-at-TOD overlay. */
export interface TodPauseOverlayControlEvents {
  tod_pause_overlay: TodPauseOverlayState;
}
