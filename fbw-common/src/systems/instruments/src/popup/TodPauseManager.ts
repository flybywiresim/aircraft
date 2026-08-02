// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, Publisher, Subscribable } from '@microsoft/msfs-sdk';
import { PopupControlEvents } from '../../../shared/src/popup/PopupControlEvents';
import { PopupDefinition, PopupUuid } from '../../../shared/src/popup/PopupTypes';

export class TodPauseManager {
  private readonly listener: ViewListener.ViewListener;

  private readonly publisher: Publisher<PopupControlEvents>;

  private readonly isTodPauseVisible: Subscribable<boolean>;

  public constructor(bus: EventBus, currentPopup: Subscribable<PopupDefinition | undefined>) {
    this.publisher = bus.getPublisher();

    this.listener = RegisterViewListener('JS_LISTENER_TOOLBAR_PANELS', this.onListenerReady.bind(this));

    this.isTodPauseVisible = currentPopup.map((v) => v?.uuid === PopupUuid.TodPause);
  }

  private onListenerReady(): void {
    // OR USE A:SIM DISABLED but that will not make the toolbar work
    // OR Use the regular K:PAUSE_SET event and only intercept the key
    this.listener.on('SetActivePauseEnabled', (isPaused: boolean) => {
      if (!isPaused && this.isTodPauseVisible.get()) {
        this.hideTodPause();
      }
    });

    this.isTodPauseVisible.sub((isVisible) => {
      if (isVisible) {
        window.document.addEventListener('keydown', this.handleKeyDown);
        Coherent.call('TOOLBAR_SET_ACTIVE_PAUSE', true);
      } else {
        window.document.removeEventListener('keydown', this.handleKeyDown);
        Coherent.call('TOOLBAR_SET_ACTIVE_PAUSE', false);
      }
    });
  }

  private hideTodPause(): void {
    this.publisher.pub('popup_dequeue_popup', PopupUuid.TodPause);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.keyCode === KeyCode.KEY_P && this.isTodPauseVisible.get()) {
      this.hideTodPause();
    }
  };
}
