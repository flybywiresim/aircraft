// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import { EventBus, Instrument } from '@microsoft/msfs-sdk';
import { FcuEvents } from '../Publishers/FcuPublisher';

export class LsManager implements Instrument {
  private readonly sub = this.bus.getSubscriber<FcuEvents>();

  constructor(private readonly bus: EventBus) {}

  init(): void {
    this.sub.on('fcu_appr_mode_active').handle((v) => {
      if (v) {
        SimVar.SetSimVarValue('L:A380X_EFIS_L_LS_BUTTON_IS_ON', 'Bool', true);
        SimVar.SetSimVarValue('L:A380X_EFIS_R_LS_BUTTON_IS_ON', 'Bool', true);
      }
    });
  }
  onUpdate(): void {}
}
