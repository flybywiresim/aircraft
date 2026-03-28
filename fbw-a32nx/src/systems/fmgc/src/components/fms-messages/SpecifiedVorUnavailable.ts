// @ts-strict-ignore
// Copyright (c) 2021-2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Trigger, FMMessage } from '@flybywiresim/fbw-sdk';

import { NavaidTuner } from '@fmgc/navigation/NavaidTuner';
import { FMMessageSelector, FMMessageUpdate } from './FmsMessages';
import { Navigation } from '@fmgc/navigation/Navigation';
import { FMMessageTypes } from './FmMessages';

abstract class SpecifiedVorUnavailable implements FMMessageSelector {
  message: FMMessage = FMMessageTypes.SpecifiedVorDmeUnavailble;

  abstract efisSide: 'L' | 'R';

  private trigRising = new Trigger(true);

  private trigFalling = new Trigger(true);

  private navaidTuner: NavaidTuner;

  init(navigation: Navigation): void {
    this.navaidTuner = navigation.getNavaidTuner();
  }

  process(deltaTime: number): FMMessageUpdate {
    const message = this.navaidTuner.getSpecifiedVorMessage();

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

export class SpecifiedVorUnavailableLeft extends SpecifiedVorUnavailable {
  efisSide: 'L' | 'R' = 'L';
}

export class SpecifiedVorUnavailableRight extends SpecifiedVorUnavailable {
  efisSide: 'L' | 'R' = 'R';
}
