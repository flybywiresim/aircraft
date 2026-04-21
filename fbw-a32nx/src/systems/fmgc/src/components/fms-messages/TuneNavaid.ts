// @ts-strict-ignore
// Copyright (c) 2021-2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { NavaidTuner } from '@fmgc/navigation/NavaidTuner';
import { FMMessage, Trigger } from '@flybywiresim/fbw-sdk';
import { FMMessageSelector, FMMessageUpdate } from './FmsMessages';
import { Navigation } from '@fmgc/navigation/Navigation';
import { FMMessageTypes } from './FmMessages';

abstract class TuneNavaid implements FMMessageSelector {
  message: FMMessage = { ...FMMessageTypes.TuneNavaid };

  abstract efisSide: 'L' | 'R';

  private trigRising = new Trigger(true);

  private trigFalling = new Trigger(true);

  private navaidTuner?: NavaidTuner;

  init(navigation: Navigation): void {
    this.navaidTuner = navigation.getNavaidTuner();
  }

  process(deltaTime: number): FMMessageUpdate {
    const message = this.navaidTuner.getTuneNavaidMessage();

    this.trigRising.input = message !== null;
    this.trigRising.update(deltaTime);

    this.trigFalling.input = message === null;
    this.trigFalling.update(deltaTime);

    if (this.trigRising.output) {
      const [freqeuncy, ident] = message;
      const baseMessage = FMMessageTypes.TuneNavaid.text;
      this.message.text = baseMessage.replace('BBB', ident).replace('FFF.FF', freqeuncy.toFixed(2));
      return FMMessageUpdate.SEND;
    }

    if (this.trigFalling.output) {
      return FMMessageUpdate.RECALL;
    }

    return FMMessageUpdate.NO_ACTION;
  }
}

export class TuneNavaidLeft extends TuneNavaid {
  efisSide: 'L' | 'R' = 'L';
}

export class TuneNavaidRight extends TuneNavaid {
  efisSide: 'L' | 'R' = 'R';
}
