// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Clock, EventBus, FSComponent, InstrumentBackplane } from '@microsoft/msfs-sdk';
import { FuelSystemPublisher } from 'instruments/src/MsfsAvionicsCommon/providers/FuelSystemPublisher';
import { ArincValueProvider } from './shared/ArincValueProvider';
import { EwdSimvarPublisher } from './shared/EwdSimvarPublisher';
import { PseudoFWC } from './PseudoFWC';

import './style.scss';
import { EngineWarningDisplay } from 'instruments/src/EWDv2/EWD';
import { ArincEventBus } from '@flybywiresim/fbw-sdk';

class A32NX_EWD extends BaseInstrument {
  private readonly bus = new ArincEventBus();

  private readonly backplane = new InstrumentBackplane();

  private readonly simVarPublisher = new EwdSimvarPublisher(this.bus);

  private readonly arincProvider = new ArincValueProvider(this.bus);

  private readonly clock = new Clock(this.bus);

  private readonly pseudoFwc = new PseudoFWC(this.bus, this);

  constructor() {
    super();

    this.backplane.addInstrument('Clock', this.clock);
    this.backplane.addPublisher('SimVars', this.simVarPublisher);
    // this.backplane.addPublisher('FuelSystem', this.fuelSystemPublisher);
    this.backplane.addInstrument('Fwc', this.pseudoFwc);
  }

  get templateID(): string {
    return 'A380X_EWDv2';
  }

  public connectedCallback(): void {
    super.connectedCallback();

    this.arincProvider.init();
    this.backplane.init();

    FSComponent.render(<EngineWarningDisplay bus={this.bus} />, document.getElementById('EWDv2_CONTENT'));

    // Remove "instrument didn't load" text
    document.getElementById('EWDv2_CONTENT').querySelector(':scope > h1').remove();
  }

  public Update(): void {
    super.Update();

    this.backplane.onUpdate();
  }
}

registerInstrument('a380x-ewd', A32NX_EWD);
