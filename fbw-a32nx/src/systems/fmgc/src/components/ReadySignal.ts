// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { UpdateThrottler } from '@flybywiresim/fbw-sdk';
import { FlightPlanService } from '@fmgc/flightplanning/FlightPlanService';
import { FmgcComponent } from './FmgcComponent';

export class ReadySignal implements FmgcComponent {
  private baseInstrument: BaseInstrument = null;

  private updateThrottler = new UpdateThrottler(1000);

  init(baseInstrument: BaseInstrument, _flightPlanService: FlightPlanService): void {
    this.baseInstrument = baseInstrument;
  }

  update(deltaTime: number): void {
    if (
      this.updateThrottler.canUpdate(deltaTime) !== -1 &&
      this.baseInstrument.getGameState() === GameState.ingame &&
      SimVar.GetSimVarValue('L:A32NX_IS_READY', 'number') !== 1
    ) {
      // set ready signal that JS code is initialized and flight is actually started
      // -> user pressed 'READY TO FLY' button
      SimVar.SetSimVarValue('L:A32NX_IS_READY', 'number', 1);
    }
  }
}
