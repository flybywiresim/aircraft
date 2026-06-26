// @ts-strict-ignore
// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, FSComponent, InstrumentBackplane } from '@microsoft/msfs-sdk';
import { FCUSimvarPublisher } from './Publishers/FcuSimvarPublisher';
import { FCUComponent } from './FCU';
import { MsfsAircraftSystemPublisher } from '@flybywiresim/fbw-sdk';

// eslint-disable-next-line camelcase
class A380X_FCU extends BaseInstrument {
  private readonly bus = new EventBus();
  private readonly backplane = new InstrumentBackplane();

  private readonly simVarPublisher = new FCUSimvarPublisher(this.bus);
  private readonly msfsAircraftSystemPublisher = new MsfsAircraftSystemPublisher(this.bus);

  constructor() {
    super();

    this.backplane.addPublisher('SimVarPublisher', this.simVarPublisher);
    this.backplane.addPublisher('MsfsAircraftSystem', this.msfsAircraftSystemPublisher);
  }

  get templateID(): string {
    return 'A380X_FCU';
  }

  public connectedCallback(): void {
    super.connectedCallback();

    FSComponent.render(<FCUComponent bus={this.bus} />, document.getElementById('FCU_CONTENT'));

    // Remove "instrument didn't load" text
    document.getElementById('FCU_CONTENT').querySelector(':scope > h1').remove();

    this.backplane.init();
  }

  public Update(): void {
    super.Update();

    this.backplane.onUpdate();
  }
}

registerInstrument('a380x-fcu', A380X_FCU);
