// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ClockEvents, EventBus, GameStateProvider, Instrument, KeyEventManager, Wait } from '@microsoft/msfs-sdk';

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
      this.bus
        .getSubscriber<ClockEvents>()
        .on('realTime')
        .onlyAfter(1500)
        .handle((_now) => {
          this.updateLighting();
        });
    });
  }

  public initLighting(): void {
    console.log('[LightSync] initializing lighting to defaults');

    const autoBrightness = this.getAutoBrightness();

    // OVHD Reading Lights
    this.setPotentiometer(96, 0); // Capt
    this.setPotentiometer(97, 0); // F/O

    // Glareshield
    this.setPotentiometer(84, autoBrightness < 50 ? 1.5 * autoBrightness : 0); // Int Lt
    this.setPotentiometer(87, autoBrightness); // Lcd Brt
    this.setPotentiometer(10, 0); // table Cpt
    this.setPotentiometer(11, 0); // table F/O

    // Instruments Cpt
    this.setPotentiometer(88, autoBrightness); // PFD
    this.setPotentiometer(89, autoBrightness); // ND
    this.setPotentiometer(94, autoBrightness / 2); // wxRadar
    this.setPotentiometer(98, autoBrightness); // MFD
    this.setPotentiometer(8, autoBrightness < 50 ? 20 : 0); // console light

    // Instruments F/O
    this.setPotentiometer(90, autoBrightness); // PFD
    this.setPotentiometer(91, autoBrightness); // ND
    this.setPotentiometer(95, autoBrightness / 2); // wxRadar
    this.setPotentiometer(99, autoBrightness); // MFD
    this.setPotentiometer(9, autoBrightness < 50 ? 20 : 0); // console light

    // Pedestal
    this.setPotentiometer(80, autoBrightness); // rmpCptLightLevel
    this.setPotentiometer(81, autoBrightness); // rmpFoLightLevel
    this.setPotentiometer(82, autoBrightness); // rmpOvhdLightLevel
    this.setPotentiometer(92, autoBrightness); // ecamUpperLightLevel
    this.setPotentiometer(93, autoBrightness); // ecamLowerLightLevel
    this.setPotentiometer(76, autoBrightness); // pedFloodLightLevel
    this.setPotentiometer(83, autoBrightness); // mainPnlFloodLightLevel
    this.setPotentiometer(85, autoBrightness); // integralLightLevel
  }

  public onUpdate(): void {}

  public updateLighting(): void {
    /** automatic brightness based on ambient light, [0, 1] scale */
    const autoBrightness = Math.max(
      15,
      Math.min(85, SimVar.GetSimVarValue('GLASSCOCKPIT AUTOMATIC BRIGHTNESS', 'percent')),
    );
    SimVar.SetSimVarValue('L:A32NX_CABIN_AUTOBRIGHTNESS', 'number', autoBrightness);

    // Follow EFB Setting for Cabin Auto Brightness
    if (SimVar.GetSimVarValue('L:A32NX_CABIN_USING_AUTOBRIGHTNESS', 'bool')) {
      // AT GATE
      // DAY: AUTO
      // NIGHT/DUSK/DAWN: HIGH

      // TAKEOFF
      // DAY: AUTO
      // NIGHT/DUSK/DAWN: DIM

      // IN CLIMB PHASE
      // DAY: AUTO
      // NIGHT/DUSK/DAWN: MEDIUM

      // IN CRZ PHASE
      // DAY: AUTO
      // DAWN/DUSK: AUTO
      // NIGHT: DIM

      // IN DESCENT PHASE
      // DAY: AUTO
      // NIGHT/DUSK/DAWN: MEDIUM

      // LANDING
      // DAY: AUTO
      // NIGHT/DUSK/DAWN: DIM

      // AT GATE
      // DAY: AUTO
      // NIGHT/DUSK/DAWN: HIGH

      this.setPotentiometer(7, autoBrightness);
      // console.log('autoBrightness', autoBrightness);
    } else {
      const manualBrightness = SimVar.GetSimVarValue('L:A32NX_CABIN_MANUAL_BRIGHTNESS', 'number');
      this.setPotentiometer(7, manualBrightness);
      // console.log('manualBrightness', manualBrightness);
    }
  }

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
