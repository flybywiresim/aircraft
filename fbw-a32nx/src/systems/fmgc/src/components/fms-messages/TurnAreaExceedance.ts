// @ts-strict-ignore
// Copyright (c) 2021-2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FMMessage, Trigger } from '@flybywiresim/fbw-sdk';

import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { PILeg } from '@fmgc/guidance/lnav/legs/PI';
import { Navigation } from '@fmgc/navigation/Navigation';
import { FMMessageSelector, FMMessageUpdate } from './FmsMessages';
import { FMMessageTypes } from './FmMessages';

abstract class TurnAreaExceedance implements FMMessageSelector {
  message: FMMessage = FMMessageTypes.TurnAreaExceedance;

  abstract efisSide: 'L' | 'R';

  private trigRising = new Trigger(true);

  private trigFalling = new Trigger(true);

  private guidanceController?: GuidanceController;

  private navigation?: Navigation;

  init(navigation: Navigation, guidanceController: GuidanceController): void {
    this.guidanceController = guidanceController;
    this.navigation = navigation;
  }

  process(deltaTime: number): FMMessageUpdate {
    const gs = this.navigation.groundSpeed;
    const dtg = this.guidanceController.activeLegDtg ?? Infinity;
    const ttg = gs > 10 ? (3600 * dtg) / gs : Infinity;
    const nextLeg = this.guidanceController.activeGeometry?.legs?.get(this.guidanceController.activeLegIndex + 1);

    // if within 1.5 min of PI and it's path goes outside the coded distance limit
    const turnAreaExceeded = ttg <= 90 && nextLeg && nextLeg instanceof PILeg && nextLeg.turnAreaExceeded;

    this.trigRising.input = turnAreaExceeded;
    this.trigRising.update(deltaTime);

    this.trigFalling.input = !turnAreaExceeded;
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

export class TurnAreaExceedanceLeft extends TurnAreaExceedance {
  efisSide: 'L' | 'R' = 'L';
}

export class TurnAreaExceedanceRight extends TurnAreaExceedance {
  efisSide: 'L' | 'R' = 'R';
}
