// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { FMMessageTypes } from '@flybywiresim/fbw-sdk';

import { FMMessageSelector, FMMessageUpdate } from './FmsMessages';

export class TooSteepPathAhead implements FMMessageSelector {
  message = FMMessageTypes.TooSteepPathAhead;

  private guidanceController: GuidanceController;

  private lastState = false;

  init(baseInstrument: BaseInstrument): void {
    this.guidanceController = baseInstrument.guidanceController;
  }

  process(_: number): FMMessageUpdate {
    const newState = this.guidanceController.vnavDriver.shouldShowTooSteepPathAhead();

    if (newState !== this.lastState) {
      this.lastState = newState;

      return newState ? FMMessageUpdate.SEND : FMMessageUpdate.RECALL;
    }

    return FMMessageUpdate.NO_ACTION;
  }
}
