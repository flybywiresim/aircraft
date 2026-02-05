// Copyright (c) 2021-2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FMMessage, ConfirmationNode, Trigger } from '@flybywiresim/fbw-sdk';

import { FMMessageSelector, FMMessageUpdate } from './FmsMessages';
import { ConsumerSubject, EventBus } from '@microsoft/msfs-sdk';
import { NavigationEvents } from '../../navigation/Navigation';
import { FMMessageTypes } from './FmMessages';

/**
 * Since this happens when the simvar goes to zero, we need to use some CONF nodes to make sure we do not count the initial
 * first-frame value, as the ADIRS module might not have run yet.
 */
export class GpsPrimaryLost implements FMMessageSelector {
  public readonly message: FMMessage = FMMessageTypes.GpsPrimaryLost;

  private readonly onGpsPrimary = ConsumerSubject.create(null, false);

  private confLost = new ConfirmationNode(1_000);

  private trigLost = new Trigger(true);

  private confRegained = new ConfirmationNode(1_000);

  private trigRegained = new Trigger(true);

  constructor(readonly bus: EventBus) {
    this.onGpsPrimary.setConsumer(bus.getSubscriber<NavigationEvents>().on('fms_nav_gps_primary'));
  }

  process(deltaTime: number): FMMessageUpdate {
    const lostNow = !this.onGpsPrimary.get();

    this.confLost.input = lostNow;
    this.confLost.update(deltaTime);
    this.trigLost.input = this.confLost.output;
    this.trigLost.update(deltaTime);

    this.confRegained.input = !lostNow;
    this.confRegained.update(deltaTime);
    this.trigRegained.input = this.confRegained.output;
    this.trigRegained.update(deltaTime);

    if (this.trigLost.output) {
      return FMMessageUpdate.SEND;
    }

    if (this.trigRegained.output) {
      return FMMessageUpdate.RECALL;
    }

    return FMMessageUpdate.NO_ACTION;
  }
}
