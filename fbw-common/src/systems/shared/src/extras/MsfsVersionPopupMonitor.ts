// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, GameStateProvider, Wait } from '@microsoft/msfs-sdk';
import { PopupTransporter } from '../popup/PopupTransporter';
import { PopupUuid } from '../popup/PopupTypes';

export class MsfsVersionPopupMonitor {
  private static readonly INGAME_DELAY = 5_000;
  private static readonly POPUP_TIME = 15_000;

  public constructor(bus: EventBus, acName: string) {
    if (!MsfsVersionPopupMonitor.isMsfs2024()) {
      const transporter = new PopupTransporter(bus, {
        uuid: PopupUuid.MsfsVersion,
        title: 'Wrong MSFS Version',
        message: `This version of the ${acName} is built specifically for MSFS2024. Please install the MSFS2020 version using the FlyByWire installer!`,
        timeout: MsfsVersionPopupMonitor.POPUP_TIME,
      });

      Wait.awaitSubscribable(GameStateProvider.get(), (v) => v === GameState.ingame, true).then(() => {
        Wait.awaitDelay(MsfsVersionPopupMonitor.INGAME_DELAY).then(() => {
          transporter.set(true);
        });
      });
    }
  }

  private static isMsfs2024(): boolean {
    return window.InputBar.MENU_BUTTON_A === 'KEY_MENU_SR_VALID';
  }
}
