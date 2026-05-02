// Copyright (c) 2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, FsBaseInstrument, FSComponent, FsInstrument, InstrumentBackplane } from '@microsoft/msfs-sdk';
import { PopupComponent } from '../../../../../../fbw-common/src/systems/instruments/src/popup';
import { PopupSimvarPublisher } from '@flybywiresim/fbw-sdk';

class PopupInstrument implements FsInstrument {
  public readonly instrument!: BaseInstrument;
  private readonly bus: EventBus;

  private readonly backplane = new InstrumentBackplane();

  private readonly simVarPublisher: PopupSimvarPublisher;

  constructor() {
    this.bus = new EventBus();
    this.simVarPublisher = new PopupSimvarPublisher(this.bus);
    this.backplane.addPublisher('PopupSimVars', this.simVarPublisher);

    this.doInit();
  }

  private doInit(): void {
    FSComponent.render(<PopupComponent bus={this.bus} />, document.getElementById('popup_CONTENT'));

    this.backplane.init();

    // Remove "instrument didn't load" text
    document.getElementById('popup_CONTENT')?.querySelector(':scope > h1')?.remove();
  }

  /**
   * A callback called when the instrument gets a frame update.
   */
  public Update(): void {
    this.backplane.onUpdate();
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

class A32NX_POPUP extends FsBaseInstrument<PopupInstrument> {
  constructInstrument(): PopupInstrument {
    return new PopupInstrument();
  }

  get isInteractive(): boolean {
    return true;
  }

  get templateID(): string {
    return 'A32NX_popup';
  }
}

registerInstrument('a32nx-popup', A32NX_POPUP);
