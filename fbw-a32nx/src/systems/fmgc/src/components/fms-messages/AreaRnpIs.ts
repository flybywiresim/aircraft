// Copyright (c) 2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FMMessage } from '@flybywiresim/fbw-sdk';

import { FMMessageSelector, FMMessageUpdate } from './FmsMessages';
import { ConsumerSubject, EventBus } from '@microsoft/msfs-sdk';
import { FMMessageTypes } from './FmMessages';
import { RequiredNavigationPerformanceEvents } from '../../events/RequiredNavigationPerformanceEvents';

export class AreaRnpIs implements FMMessageSelector {
  public readonly message: FMMessage = { ...FMMessageTypes.AreaRnpIs };

  private readonly pilotRnpGreaterThanArea = ConsumerSubject.create(
    this.bus.getSubscriber<RequiredNavigationPerformanceEvents>().on('pilot_rnp_greater_than_area_rnp'),
    undefined,
  );
  private stateChanged = false;
  private areaRnpIs = false;

  constructor(readonly bus: EventBus) {
    this.pilotRnpGreaterThanArea.sub((v) => {
      this.stateChanged = true;
      this.areaRnpIs = v !== undefined;
      if (v !== undefined) {
        const baseMessage = FMMessageTypes.AreaRnpIs.text!;
        this.message.text = baseMessage.replace('XX.XX', v.toFixed(2));
      }
    });
  }

  process(_: number): FMMessageUpdate {
    if (this.stateChanged) {
      this.stateChanged = false;
      return this.areaRnpIs ? FMMessageUpdate.SEND : FMMessageUpdate.RECALL;
    }

    return FMMessageUpdate.NO_ACTION;
  }
}
