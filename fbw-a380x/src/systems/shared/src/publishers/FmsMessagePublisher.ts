// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import { SimVarPublisher, EventBus, SimVarValueType } from '@microsoft/msfs-sdk';

export interface FmsMessageVars {
  tdReached: boolean;
  destEfobBelowMin: boolean;
}

export class FmsMessagePublisher extends SimVarPublisher<FmsMessageVars> {
  constructor(bus: EventBus) {
    super(
      new Map([
        ['tdReached', { name: 'L:A32NX_PFD_MSG_TD_REACHED', type: SimVarValueType.Bool }],
        ['destEfobBelowMin', { name: 'L:A380X_FMS_DEST_EFOB_BELOW_MIN', type: SimVarValueType.Bool }],
      ]),
      bus,
    );
  }
}
