// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, HEventPublisher, KeyEventManager, Wait, GameStateProvider } from '@microsoft/msfs-sdk';
import { AtsuSystem } from './systems/atsu';
import { PowerSupplyBusses } from './systems/powersupply';

class SystemsHost extends BaseInstrument {
  private readonly bus: EventBus;

  private readonly hEventPublisher: HEventPublisher;

  private readonly powerSupply: PowerSupplyBusses;

  private readonly atsu: AtsuSystem;

  private keyInterceptManager: KeyEventManager;

  /**
   * "mainmenu" = 0
   * "loading" = 1
   * "briefing" = 2
   * "ingame" = 3
   */
  private gameState = 0;

  constructor() {
    super();

    this.bus = new EventBus();
    this.hEventPublisher = new HEventPublisher(this.bus);
    this.powerSupply = new PowerSupplyBusses(this.bus);
    this.atsu = new AtsuSystem(this.bus);
    Promise.all([
      KeyEventManager.getManager(this.bus),
      Wait.awaitSubscribable(GameStateProvider.get(), (state) => state === GameState.ingame, true),
    ]).then(([keyEventManager]) => {
      this.keyInterceptManager = keyEventManager;
      this.initLighting();
    });
  }

  get templateID(): string {
    return 'A32NX_SYSTEMSHOST';
  }

  public getDeltaTime() {
    return this.deltaTime;
  }

  public onInteractionEvent(args: string[]): void {
    this.hEventPublisher.dispatchHEvent(args[0]);
  }

  public connectedCallback(): void {
    super.connectedCallback();

    this.powerSupply.connectedCallback();
    this.atsu.connectedCallback();

    // Needed to fetch METARs from the sim
    RegisterViewListener(
      'JS_LISTENER_FACILITY',
      () => {
        console.log('JS_LISTENER_FACILITY registered.');
      },
      true,
    );
  }

  public Update(): void {
    super.Update();

    if (this.gameState !== 3) {
      const gamestate = this.getGameState();
      if (gamestate === 3) {
        this.hEventPublisher.startPublish();
        this.powerSupply.startPublish();
        this.atsu.startPublish();
      }
      this.gameState = gamestate;
    }

    this.powerSupply.update();
    this.atsu.update();
  }

  private initLighting() {
    /** automatic brightness based on ambient light, [0, 1] scale */
    const autoBrightness = Math.max(
      15,
      Math.min(85, SimVar.GetSimVarValue('GLASSCOCKPIT AUTOMATIC BRIGHTNESS', 'percent')),
    );

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

  private setPotentiometer(potentiometer, brightness) {
    this.keyInterceptManager.triggerKey('LIGHT_POTENTIOMETER_SET', false, potentiometer, brightness);
  }
}

registerInstrument('systems-host', SystemsHost);
