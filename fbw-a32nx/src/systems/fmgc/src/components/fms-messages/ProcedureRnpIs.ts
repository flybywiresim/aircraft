// Copyright (c) 2021-2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FMMessage } from '@flybywiresim/fbw-sdk';

import { FMMessageSelector, FMMessageUpdate } from './FmsMessages';
import { ConsumerSubject, EventBus } from '@microsoft/msfs-sdk';
import { FMMessageTypes } from './FmMessages';
import { RequiredNavigationPerformanceEvents } from '../../events/RequiredNavigationPerformanceEvents';

export class ProcedureRnpIs implements FMMessageSelector {
  public readonly message: FMMessage = { ...FMMessageTypes.ProcedureRnpIs };

  private readonly onProcedureRnpIs = ConsumerSubject.create(
    this.bus.getSubscriber<RequiredNavigationPerformanceEvents>().on('pilot_rnp_greater_than_proc_rnp'),
    undefined,
  );
  private stateChanged = false;
  private procedureRnpIs = false;

  constructor(readonly bus: EventBus) {
    this.onProcedureRnpIs.sub((v) => {
      this.stateChanged = true;
      this.procedureRnpIs = v !== undefined;
      if (v !== undefined) {
        const baseMessage = FMMessageTypes.ProcedureRnpIs.text!;
        this.message.text = baseMessage.replace('XX.XX', v.toFixed(2));
      }
    });
  }

  process(_: number): FMMessageUpdate {
    if (this.stateChanged) {
      this.stateChanged = false;

      return this.procedureRnpIs ? FMMessageUpdate.SEND : FMMessageUpdate.RECALL;
    }

    return FMMessageUpdate.NO_ACTION;
  }
}
