// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import { ConsumerSubject, EventBus, Instrument, MappedSubject, SubscribableMapFunctions } from '@microsoft/msfs-sdk';
import { FcuEvents } from '../Publishers/FcuPublisher';

export class LsManager implements Instrument {
  private readonly sub = this.bus.getSubscriber<FcuEvents>();

  private readonly locActive = ConsumerSubject.create(this.sub.on('fcu_loc_mode_active'), false);

  private readonly apprActive = ConsumerSubject.create(this.sub.on('fcu_approach_mode_active'), false);

  private readonly locOrApprSelected = MappedSubject.create(
    SubscribableMapFunctions.or(),
    this.locActive,
    this.apprActive,
  );

  constructor(private readonly bus: EventBus) {}

  init(): void {
    this.locOrApprSelected.sub((v) => {
      if (v) {
        SimVar.SetSimVarValue('L:A380X_EFIS_L_LS_BUTTON_IS_ON', 'Bool', true);
        SimVar.SetSimVarValue('L:A380X_EFIS_R_LS_BUTTON_IS_ON', 'Bool', true);
      }
    });
  }
  onUpdate(): void {}
}
