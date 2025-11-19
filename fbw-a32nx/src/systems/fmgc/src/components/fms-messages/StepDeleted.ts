// Copyright (c) 2021-2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FMMessage } from '@flybywiresim/fbw-sdk';

import { FMMessageSelector, FMMessageUpdate } from './FmsMessages';
import { FMMessageTypes } from './FmMessages';

export class StepDeleted implements FMMessageSelector {
  message: FMMessage = FMMessageTypes.StepDeleted;

  process(_: number): FMMessageUpdate {
    const newState = SimVar.GetSimVarValue('L:A32NX_FM_VNAV_TRIGGER_STEP_DELETED', 'Bool') === 1;

    if (newState) {
      SimVar.SetSimVarValue('L:A32NX_FM_VNAV_TRIGGER_STEP_DELETED', 'boolean', false);

      return FMMessageUpdate.SEND;
    }

    return FMMessageUpdate.NO_ACTION;
  }
}
