// Copyright (c) 2021-2023, 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { FmgcComponent } from './FmgcComponent';
import { GameStateProvider, Wait } from '@microsoft/msfs-sdk';

export class ReadySignal implements FmgcComponent {
  init(): void {
    Wait.awaitSubscribable(GameStateProvider.get(), (state) => state === GameState.ingame, true).then(() => {
      // set ready signal that JS code is initialized and flight is actually started
      // -> user pressed 'READY TO FLY' button
      SimVar.SetSimVarValue('L:A32NX_IS_READY', 'number', 1);
    });
  }

  update(_deltaTime: number): void {
    // noop
  }
}
