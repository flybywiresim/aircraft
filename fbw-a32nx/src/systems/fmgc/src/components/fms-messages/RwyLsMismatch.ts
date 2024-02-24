// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FMMessage, FMMessageTypes, Trigger } from '@flybywiresim/fbw-sdk';

import { NavaidTuner } from '@fmgc/navigation/NavaidTuner';
import { FMMessageSelector, FMMessageUpdate } from './FmsMessages';

abstract class RwyLsMismatch implements FMMessageSelector {
  message: FMMessage = FMMessageTypes.RwyLsMismatch;

  abstract efisSide: 'L' | 'R';

  private trigRising = new Trigger(true);

  private trigFalling = new Trigger(true);

  private navaidTuner: NavaidTuner;

  init(baseInstrument: BaseInstrument): void {
    this.navaidTuner = baseInstrument.navigation.getNavaidTuner();
  }

  process(deltaTime: number): FMMessageUpdate {
    const message = this.navaidTuner.getRwyLsMismatchMessage();

    this.trigRising.input = message;
    this.trigRising.update(deltaTime);

    this.trigFalling.input = !message;
    this.trigFalling.update(deltaTime);

    if (this.trigRising.output) {
      return FMMessageUpdate.SEND;
    }

    if (this.trigFalling.output) {
      return FMMessageUpdate.RECALL;
    }

    return FMMessageUpdate.NO_ACTION;
  }
}

export class RwyLsMismatchLeft extends RwyLsMismatch {
  efisSide: 'L' | 'R' = 'L';
}

export class RwyLsMismatchRight extends RwyLsMismatch {
  efisSide: 'L' | 'R' = 'R';
}
