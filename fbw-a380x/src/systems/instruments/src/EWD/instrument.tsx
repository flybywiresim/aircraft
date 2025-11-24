// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Clock, FSComponent, InstrumentBackplane } from '@microsoft/msfs-sdk';
import { ArincValueProvider } from './shared/ArincValueProvider';
import { EwdSimvarPublisher } from './shared/EwdSimvarPublisher';

import '../index.scss';
import './style.scss';
import { EngineWarningDisplay } from 'instruments/src/EWD/EWD';
import { AdrBusPublisher, ArincEventBus, CpiomDataPublisher, IrBusPublisher } from '@flybywiresim/fbw-sdk';
import { FcdcSimvarPublisher } from 'instruments/src/MsfsAvionicsCommon/providers/FcdcPublisher';

class A380X_EWD extends BaseInstrument {
  private readonly bus = new ArincEventBus();

  private readonly backplane = new InstrumentBackplane();

  private readonly simVarPublisher = new EwdSimvarPublisher(this.bus);

  private readonly cpiomPublisher = new CpiomDataPublisher(this.bus);

  private readonly fcdcPublisher = new FcdcSimvarPublisher(this.bus);

  private readonly arincProvider = new ArincValueProvider(this.bus);

  private readonly adrPublisher = new AdrBusPublisher(this.bus);
  private readonly irPublisher = new IrBusPublisher(this.bus);

  private readonly clock = new Clock(this.bus);

  constructor() {
    super();

    this.backplane.addInstrument('Clock', this.clock);
    this.backplane.addPublisher('SimVars', this.simVarPublisher);
    this.backplane.addPublisher('CPIOM', this.cpiomPublisher);
    this.backplane.addPublisher('FCDC', this.fcdcPublisher);
    this.backplane.addPublisher('ADR', this.adrPublisher);
    this.backplane.addPublisher('IR', this.irPublisher);
  }

  get templateID(): string {
    return 'A380X_EWD';
  }

  public get isInteractive(): boolean {
    return true;
  }

  public connectedCallback(): void {
    super.connectedCallback();

    this.arincProvider.init();
    this.backplane.init();

    FSComponent.render(<EngineWarningDisplay bus={this.bus} />, document.getElementById('EWD_CONTENT'));

    // Remove "instrument didn't load" text
    document.getElementById('EWD_CONTENT')?.querySelector(':scope > h1')?.remove();
  }

  public Update(): void {
    super.Update();

    this.backplane.onUpdate();
  }
}

registerInstrument('a380x-ewd', A380X_EWD);
