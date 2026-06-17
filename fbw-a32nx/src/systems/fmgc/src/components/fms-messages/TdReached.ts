// Copyright (c) 2021-2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FMMessage } from '@flybywiresim/fbw-sdk';

import { FMMessageSelector, FMMessageUpdate } from './FmsMessages';
import { FMMessageTypes } from './FmMessages';

export class TdReached implements FMMessageSelector {
  message: FMMessage = FMMessageTypes.TdReached;

  private lastState = false;

  process(_: number): FMMessageUpdate {
    const newState = SimVar.GetSimVarValue('L:A32NX_PFD_MSG_TD_REACHED', 'Bool') === 1;

    if (newState !== this.lastState) {
      this.lastState = newState;

      return newState ? FMMessageUpdate.SEND : FMMessageUpdate.RECALL;
    }

    return FMMessageUpdate.NO_ACTION;
  }
}
