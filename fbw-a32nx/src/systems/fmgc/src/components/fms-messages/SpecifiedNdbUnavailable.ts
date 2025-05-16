// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { NavaidTuner } from '@fmgc/navigation/NavaidTuner';
import { Trigger, FMMessage, FMMessageTypes } from '@flybywiresim/fbw-sdk';
import { FMMessageSelector, FMMessageUpdate } from './FmsMessages';
import { Navigation } from '@fmgc/navigation/Navigation';

abstract class SpecifiedNdbUnavailable implements FMMessageSelector {
  message: FMMessage = FMMessageTypes.SpecifiedNdbUnavailble;

  abstract efisSide: 'L' | 'R';

  private trigRising = new Trigger(true);

  private trigFalling = new Trigger(true);

  private navaidTuner?: NavaidTuner;

  init(navigation: Navigation): void {
    this.navaidTuner = navigation.getNavaidTuner();
  }

  process(deltaTime: number): FMMessageUpdate {
    const message = this.navaidTuner.getSpecifiedNdbMessage();

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

export class SpecifiedNdbUnavailableLeft extends SpecifiedNdbUnavailable {
  efisSide: 'L' | 'R' = 'L';
}

export class SpecifiedNdbUnavailableRight extends SpecifiedNdbUnavailable {
  efisSide: 'L' | 'R' = 'R';
}
