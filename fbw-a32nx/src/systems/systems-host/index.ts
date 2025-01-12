// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  Clock,
  ClockEvents,
  EventBus,
  HEventPublisher,
  InstrumentBackplane,
  StallWarningPublisher,
} from '@microsoft/msfs-sdk';
import { AtsuSystem } from './systems/atsu';
import { PowerSupplyBusses } from './systems/powersupply';
import { PseudoFWC } from 'systems-host/systems/FWC/PseudoFWC';
import { FuelSystemPublisher } from 'instruments/src/MsfsAvionicsCommon/providers/FuelSystemPublisher';
import { A32NXFcuBusPublisher } from '@shared/publishers/A32NXFcuBusPublisher';
import { PseudoFwcSimvarPublisher } from 'instruments/src/MsfsAvionicsCommon/providers/PseudoFwcPublisher';
import { A32NXAdrBusPublisher } from '@shared/publishers/A32NXAdrBusPublisher';
import { A32NXDisplayManagementPublisher } from '@shared/publishers/A32NXDisplayManagementPublisher';
import { A32NXElectricalSystemPublisher } from '@shared/publishers/A32NXElectricalSystemPublisher';

class SystemsHost extends BaseInstrument {
  private readonly bus = new EventBus();

  private readonly backplane = new InstrumentBackplane();

  private readonly clock = new Clock(this.bus);

  private readonly hEventPublisher = new HEventPublisher(this.bus);

  private readonly powerSupply = new PowerSupplyBusses(this.bus);

  private readonly atsu = new AtsuSystem(this.bus);

  private readonly fuelSystemPublisher = new FuelSystemPublisher(this.bus);

  private readonly stallWarningPublisher = new StallWarningPublisher(this.bus, 0.9);

  private readonly a32nxFcuBusPublisher = new A32NXFcuBusPublisher(this.bus);
  private readonly adrBusPublisher = new A32NXAdrBusPublisher(this.bus);
  private readonly dmcBusPublisher = new A32NXDisplayManagementPublisher(this.bus);
  private readonly elecSysPublisher = new A32NXElectricalSystemPublisher(this.bus);
  private readonly fcuBusPublisher = new A32NXFcuBusPublisher(this.bus);

  private readonly pseudoFwcPublisher = new PseudoFwcSimvarPublisher(this.bus);

  private readonly pseudoFwc = new PseudoFWC(this.bus, this);

  /**
   * "mainmenu" = 0
   * "loading" = 1
   * "briefing" = 2
   * "ingame" = 3
   */
  private gameState = 0;

  constructor() {
    super();

    this.backplane.addInstrument('Clock', this.clock);
    this.backplane.addInstrument('AtsuSystem', this.atsu);
    this.backplane.addPublisher('FuelSystem', this.fuelSystemPublisher);
    this.backplane.addPublisher('PowerPublisher', this.powerSupply);
    this.backplane.addPublisher('stallWarning', this.stallWarningPublisher);
    this.backplane.addPublisher('a32nxFcuBusPublisher', this.a32nxFcuBusPublisher);
    this.backplane.addPublisher('AdrBus', this.adrBusPublisher);
    this.backplane.addPublisher('DmcBus', this.dmcBusPublisher);
    this.backplane.addPublisher('ElecSys', this.elecSysPublisher);
    this.backplane.addPublisher('FcuBus', this.fcuBusPublisher);
    this.backplane.addPublisher('PseudoFwcPublisher', this.pseudoFwcPublisher);

    this.pseudoFwc.init();
    let lastUpdateTime: number;
    this.bus
      .getSubscriber<ClockEvents>()
      .on('simTimeHiFreq')
      .atFrequency(50)
      .handle((now) => {
        const dt = lastUpdateTime === undefined ? 0 : now - lastUpdateTime;
        lastUpdateTime = now;

        this.pseudoFwc.update(dt);
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

    // Needed to fetch METARs from the sim
    RegisterViewListener(
      'JS_LISTENER_FACILITY',
      () => {
        console.log('JS_LISTENER_FACILITY registered.');
      },
      true,
    );

    this.backplane.init();
  }

  public Update(): void {
    super.Update();

    if (this.gameState !== 3) {
      const gamestate = this.getGameState();
      if (gamestate === 3) {
        this.hEventPublisher.startPublish();
      }
      this.gameState = gamestate;
    }

    this.backplane.onUpdate();
  }
}

registerInstrument('systems-host', SystemsHost);
