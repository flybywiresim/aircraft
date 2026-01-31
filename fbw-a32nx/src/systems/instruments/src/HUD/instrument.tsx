// @ts-strict-ignore
// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Clock, FSComponent, HEventPublisher, InstrumentBackplane, Subject } from '@microsoft/msfs-sdk';
import { ArincEventBus } from '@flybywiresim/fbw-sdk';
import { FwcPublisher, RopRowOansPublisher } from '@flybywiresim/msfs-avionics-common';

import { FmsDataPublisher } from 'instruments/src/MsfsAvionicsCommon/providers/FmsDataPublisher';
import { DmcPublisher } from 'instruments/src/MsfsAvionicsCommon/providers/DmcPublisher';
import { ExtendedClockEventProvider } from '../MsfsAvionicsCommon/providers/ExtendedClockProvider';
import { FcuBusProvider } from 'instruments/src/HUD/shared/FcuBusProvider';
import { FgBusProvider } from 'instruments/src/HUD/shared/FgBusProvider';
import { getDisplayIndex, HUDComponent } from './HUD';
import { AdirsValueProvider } from '../MsfsAvionicsCommon/AdirsValueProvider';
import { ArincValueProvider } from './shared/ArincValueProvider';
import { HUDSimvarPublisher, HUDSimvars, HUDSymbolsPublisher } from './shared/HUDSimvarPublisher';
import { HudValueProvider } from './shared/HudValueProvider';
import { PseudoDmc } from './PseudoDmc';

import './style.scss';

class A32NX_HUD extends BaseInstrument {
  private readonly bus = new ArincEventBus();

  private readonly backplane = new InstrumentBackplane();

  private readonly simVarPublisher = new HUDSimvarPublisher(this.bus);

  private readonly hEventPublisher = new HEventPublisher(this.bus);

  private readonly arincProvider = new ArincValueProvider(this.bus);

  private readonly fgBusProvider = new FgBusProvider(this.bus);

  private readonly fcuBusProvider = new FcuBusProvider(this.bus);

  private readonly clock = new Clock(this.bus);

  // FIXME fit this into the normal backplane pattern
  private adirsValueProvider: AdirsValueProvider<HUDSimvars>;

  private readonly dmcPublisher = new DmcPublisher(this.bus);

  // FIXME fit this into the normal backplane pattern
  private fmsDataPublisher: FmsDataPublisher;

  private readonly ropRowOansPublisher = new RopRowOansPublisher(this.bus);

  private readonly fwcPublisher = new FwcPublisher(this.bus);

  private readonly pseudoDmc = new PseudoDmc(this.bus, this);

  private readonly extendedClockProvider = new ExtendedClockEventProvider(this.bus, this.pseudoDmc.isAcPowered);

  private readonly symbolPublisher = new HUDSymbolsPublisher(this.bus);

  private readonly hudProvider = new HudValueProvider(this.bus);
  /**
   * "mainmenu" = 0
   * "loading" = 1
   * "briefing" = 2
   * "ingame" = 3
   */
  private gameState = 0;

  constructor() {
    super();

    this.backplane.addPublisher('HudSimvars', this.simVarPublisher);
    this.backplane.addPublisher('HUDSymbolsPublisher', this.symbolPublisher);
    this.backplane.addPublisher('hEvent', this.hEventPublisher);
    this.backplane.addInstrument('arincProvider', this.arincProvider);
    this.backplane.addInstrument('fgBusProvider', this.fgBusProvider);
    this.backplane.addInstrument('fcuBusProvider', this.fcuBusProvider);
    this.backplane.addInstrument('Clock', this.clock);
    this.backplane.addPublisher('Dmc', this.dmcPublisher);
    this.backplane.addPublisher('RopRowOans', this.ropRowOansPublisher);
    this.backplane.addPublisher('Fwc', this.fwcPublisher);
    this.backplane.addInstrument('PseudoDMC', this.pseudoDmc);
    this.backplane.addInstrument('ExtendedClock', this.extendedClockProvider);
    this.backplane.addInstrument('HudProvider', this.hudProvider);
  }

  get templateID(): string {
    return 'A32NX_HUD';
  }

  public getDeltaTime() {
    return this.deltaTime;
  }

  public onInteractionEvent(args: string[]): void {
    this.hEventPublisher.dispatchHEvent(args[0]);
  }

  public connectedCallback(): void {
    super.connectedCallback();

    this.adirsValueProvider = new AdirsValueProvider(
      this.bus,
      this.simVarPublisher,
      getDisplayIndex() === 1 ? 'L' : 'R',
    );

    const stateSubject = Subject.create<'L' | 'R'>(getDisplayIndex() === 1 ? 'L' : 'R');
    this.fmsDataPublisher = new FmsDataPublisher(this.bus, stateSubject);

    this.backplane.init();

    FSComponent.render(<HUDComponent bus={this.bus} instrument={this} />, document.getElementById('HUD_CONTENT'));

    // Remove "instrument didn't load" text
    document.getElementById('HUD_CONTENT').querySelector(':scope > h1').remove();
  }

  /**
   * A callback called when the instrument gets a frame update.
   */
  public Update(): void {
    super.Update();

    this.backplane.onUpdate();

    if (this.gameState !== 3) {
      const gamestate = this.getGameState();
      if (gamestate === 3) {
        this.adirsValueProvider.start();
        this.fmsDataPublisher.startPublish();
      }
      this.gameState = gamestate;
    } else {
      this.fmsDataPublisher.onUpdate();
    }
  }
}

registerInstrument('a32nx-hud', A32NX_HUD);
