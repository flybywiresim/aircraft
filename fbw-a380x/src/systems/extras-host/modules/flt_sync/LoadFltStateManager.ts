// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus } from '@microsoft/msfs-sdk';
import { MfdSurvEvents } from '../../../instruments/src/MsfsAvionicsCommon/providers/MfdSurvPublisher';
import { TcasMode } from '../../../systems-host/systems/tcas/lib/TcasConstants';

/**
 * This class is used to sync event consumers when starting from a spawn state (Gate/Cold and Dark vs Runway/Approach/Cruise)
 */

enum FltState {
  Hanger = 1,
  Apron = 2,
  Taxi = 3,
  Runway = 4,
  Climb = 5,
  Cruise = 6,
  Approach = 7,
  Final = 8,
}
export class LoadFltStateManager {
  constructor(private readonly bus: EventBus) {
    console.log('LoadFlt: Created');
  }

  public connectedCallback(): void {
    // empty
  }

  public startPublish(): void {
    console.log('LoadFlt: startPublish()');

    switch (SimVar.GetSimVarValue('L:A32NX_START_STATE', 'Enum')) {
      case FltState.Hanger:
      case FltState.Apron:
        break;
      case FltState.Taxi:
      case FltState.Runway:
      case FltState.Climb:
      case FltState.Cruise:
      case FltState.Approach:
      case FltState.Final:
      default:
        this.bus.getPublisher<MfdSurvEvents>().pub('mfd_xpdr_set_auto', true, true);
        this.bus.getPublisher<MfdSurvEvents>().pub('tcas_alert_level', TcasMode.TARA, true);
        break;
    }
  }
}
