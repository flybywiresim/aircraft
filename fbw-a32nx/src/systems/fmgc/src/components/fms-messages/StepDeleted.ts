// Copyright (c) 2021-2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FMMessage } from '@flybywiresim/fbw-sdk';

import { FMMessageSelector, FMMessageUpdate } from './FmsMessages';
import { FMMessageTypes } from './FmMessages';
import { EventBus } from '@microsoft/msfs-sdk';
import { FlightPlanEvents } from '../../flightplanning/sync/FlightPlanEvents';
import { FlightPlanIndex } from '../../flightplanning/FlightPlanManager';

export class StepDeleted implements FMMessageSelector {
  message: FMMessage = FMMessageTypes.StepDeleted;

  private shouldTriggerMessage = false;

  constructor(private readonly bus: EventBus) {
    const sub = this.bus.getSubscriber<FlightPlanEvents>();

    sub.on('flightPlan.autoDeleteCruiseStep').handle(({ planIndex }) => {
      if (planIndex === FlightPlanIndex.Active) {
        this.shouldTriggerMessage = true;
      }
    });
  }

  process(_: number): FMMessageUpdate {
    if (this.shouldTriggerMessage) {
      this.shouldTriggerMessage = false;

      return FMMessageUpdate.SEND;
    }

    return FMMessageUpdate.NO_ACTION;
  }
}
