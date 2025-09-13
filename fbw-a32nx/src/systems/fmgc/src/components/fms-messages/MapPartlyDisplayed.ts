// Copyright (c) 2021-2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FMMessage, Trigger } from '@flybywiresim/fbw-sdk';

import { FMMessageSelector, FMMessageUpdate } from './FmsMessages';
import { FMMessageTypes } from './FmMessages';

abstract class MapPartlyDisplayed implements FMMessageSelector {
  message: FMMessage = FMMessageTypes.MapPartlyDisplayed;

  abstract efisSide: 'L' | 'R';

  private trigRising = new Trigger(true);

  private trigFalling = new Trigger(true);

  process(deltaTime: number): FMMessageUpdate {
    const partlyDisplayed = SimVar.GetSimVarValue(`L:A32NX_EFIS_${this.efisSide}_MAP_PARTLY_DISPLAYED`, 'boolean');

    this.trigRising.input = partlyDisplayed === 1;
    this.trigRising.update(deltaTime);

    this.trigFalling.input = partlyDisplayed === 0;
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

export class MapPartlyDisplayedLeft extends MapPartlyDisplayed {
  efisSide: 'L' | 'R' = 'L';
}

export class MapPartlyDisplayedRight extends MapPartlyDisplayed {
  efisSide: 'L' | 'R' = 'R';
}
