// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FMMessage, FMMessageTypes } from '@flybywiresim/fbw-sdk';

import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { FMMessageSelector, FMMessageUpdate } from './FmsMessages';
import { Navigation } from '../../navigation/Navigation';

export class NoNavIntercept implements FMMessageSelector {
  message: FMMessage = FMMessageTypes.NoNavIntercept;

  private guidanceController: GuidanceController;

  private lastState = false;

  init(_navigation: Navigation, guidanceController: GuidanceController): void {
    this.guidanceController = guidanceController;
  }

  process(_: number): FMMessageUpdate {
    const newState = this.guidanceController.shouldShowNoNavInterceptMessage();

    if (newState !== this.lastState) {
      this.lastState = newState;

      return newState ? FMMessageUpdate.SEND : FMMessageUpdate.RECALL;
    }

    return FMMessageUpdate.NO_ACTION;
  }
}
