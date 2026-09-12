// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Clock, EventBus, FSComponent, FsInstrument } from '@microsoft/msfs-sdk';
import { Popup } from './Popup';
import { PopupManager } from './PopupManager';
import { TodPauseManager } from './TodPauseManager';

export class PopupFsInstrument implements FsInstrument {
  private readonly bus = new EventBus();

  private readonly popupManager = new PopupManager(this.bus);

  private readonly todPauseManager = new TodPauseManager(this.bus, this.popupManager.visiblePopup);

  private readonly clock = new Clock(this.bus);

  constructor(public readonly instrument: BaseInstrument) {
    this.doInit();
  }

  private doInit(): void {
    // Remove "instrument didn't load" text
    this.instrument.innerHTML = '';

    FSComponent.render(
      <Popup
        currentPopup={this.popupManager.visiblePopup}
        timeRemaining={this.popupManager.visiblePopupTimeRemaining}
      />,
      this.instrument,
    );

    this.clock.init();
  }

  /**
   * A callback called when the instrument gets a frame update.
   */
  public Update(): void {
    this.clock.onUpdate();
  }

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
