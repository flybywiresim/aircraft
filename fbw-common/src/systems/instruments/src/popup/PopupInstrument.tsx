// Copyright (c) 2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, FSComponent, FsInstrument } from '@microsoft/msfs-sdk';
import { PopupComponent } from './popup';

export class PopupInstrument implements FsInstrument {
  public readonly instrument!: BaseInstrument;
  private readonly bus: EventBus;

  constructor() {
    this.bus = new EventBus();

    this.doInit();
  }

  private doInit(): void {
    FSComponent.render(<PopupComponent bus={this.bus} />, document.getElementById('popup_CONTENT'));

    // Remove "instrument didn't load" text
    document.getElementById('popup_CONTENT')?.querySelector(':scope > h1')?.remove();
  }

  /**
   * A callback called when the instrument gets a frame update.
   */
  public Update(): void {}

  public onInteractionEvent(_args: string[]): void {}

  onGameStateChanged(_oldState: GameState, _newState: GameState) {
    // noop
  }

  onFlightStart() {
    // noop
  }

  onSoundEnd(_soundEventId: Name_Z) {
    // noop
  }
}
