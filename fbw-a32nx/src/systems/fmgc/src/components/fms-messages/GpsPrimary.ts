// Copyright (c) 2021-2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FMMessage } from '@flybywiresim/fbw-sdk';

import { FMMessageSelector, FMMessageUpdate } from './FmsMessages';
import { ConsumerSubject, EventBus } from '@microsoft/msfs-sdk';
import { NavigationEvents } from '../../navigation/Navigation';
import { FMMessageTypes } from './FmMessages';

export class GpsPrimary implements FMMessageSelector {
  public readonly message: FMMessage = FMMessageTypes.GpsPrimary;

  private readonly onGpsPrimary = ConsumerSubject.create(null, false);
  private stateChanged = false;

  constructor(readonly bus: EventBus) {
    this.onGpsPrimary.sub(() => (this.stateChanged = true));
    this.onGpsPrimary.setConsumer(bus.getSubscriber<NavigationEvents>().on('fms_nav_gps_primary'));
  }

  process(_: number): FMMessageUpdate {
    if (this.stateChanged) {
      this.stateChanged = false;

      return this.onGpsPrimary.get() ? FMMessageUpdate.SEND : FMMessageUpdate.RECALL;
    }

    return FMMessageUpdate.NO_ACTION;
  }
}
