// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, GameStateProvider, Instrument, KeyEventManager, Wait } from '@microsoft/msfs-sdk';

export class LightSync implements Instrument {
  private keyInterceptManager: KeyEventManager;

  private readonly bus: EventBus;

  constructor(bus: EventBus) {
    this.bus = bus;
  }

  public init(): void {
    Promise.all([
      KeyEventManager.getManager(this.bus),
      Wait.awaitSubscribable(GameStateProvider.get(), (state) => state === GameState.ingame, true),
    ]).then(([keyEventManager]) => {
      this.keyInterceptManager = keyEventManager;
      this.initLighting();
    });
  }

  public initLighting(): void {
    console.log('[LightSync] initializing lighting to defaults');

    const autoBrightness = this.getAutoBrightness();

    // DOME
    if (autoBrightness < 50) {
      this.keyInterceptManager.triggerKey('CABIN_LIGHTS_SET', false, 1);
    }
    this.setPotentiometer(7, autoBrightness < 50 ? 20 : 0);
    // MAIN FLOOD
    this.setPotentiometer(83, autoBrightness < 50 ? 20 : 0);
    // FCU INTEG
    this.setPotentiometer(84, autoBrightness < 50 ? 1.5 * autoBrightness : 0);
    // MAIN & PED INTEG
    this.setPotentiometer(85, autoBrightness < 50 ? 1.5 * autoBrightness : 0);
    // OVHD INTEG
    this.setPotentiometer(86, autoBrightness < 50 ? 1.5 * autoBrightness : 0);
    // FCU Displays
    this.setPotentiometer(87, autoBrightness);
    // CAPT PFD DU
    this.setPotentiometer(88, autoBrightness);
    // CAPT ND DU
    this.setPotentiometer(89, autoBrightness);
    // F/O PFD DU
    this.setPotentiometer(90, autoBrightness);
    // F/O ND DU
    this.setPotentiometer(91, autoBrightness);
    // Upper ECAM DU
    this.setPotentiometer(92, autoBrightness);
    // Lower ECAM DU
    this.setPotentiometer(93, autoBrightness);
    // CAPT MCDU
    SimVar.SetSimVarValue('L:A32NX_MCDU_L_BRIGHTNESS', 'number', (8 * autoBrightness) / 100);
    // FO MCDU
    SimVar.SetSimVarValue('L:A32NX_MCDU_R_BRIGHTNESS', 'number', (8 * autoBrightness) / 100);
    // CAPT DCDU
    SimVar.SetSimVarValue('L:A32NX_PANEL_DCDU_L_BRIGHTNESS', 'number', autoBrightness / 100);
    // FO DCDU
    SimVar.SetSimVarValue('L:A32NX_PANEL_DCDU_R_BRIGHTNESS', 'number', autoBrightness / 100);
  }

  public onUpdate(): void {}

  private setPotentiometer(potentiometer: number, brightness: number) {
    if (this.keyInterceptManager) {
      this.keyInterceptManager.triggerKey('LIGHT_POTENTIOMETER_SET', false, potentiometer, brightness);
    }
  }

  private getAutoBrightness(): number {
    /** automatic brightness based on ambient light, [0, 1] scale */
    return Math.max(15, Math.min(85, SimVar.GetSimVarValue('GLASSCOCKPIT AUTOMATIC BRIGHTNESS', 'percent')));
  }
}
