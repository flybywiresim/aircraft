// @ts-strict-ignore
// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { AdcPublisher, Clock, EventBus, FSComponent, InstrumentBackplane, Subject } from '@microsoft/msfs-sdk';
import { FuelSystemPublisher } from 'instruments/src/MsfsAvionicsCommon/providers/FuelSystemPublisher';
import { ArincValueProvider } from './shared/ArincValueProvider';
import { A32NXSfccBusPublisher } from '@shared/publishers/A32NXSfccBusPublisher';
import { EwdComponent } from './EWD';
import { EwdSimvarPublisher } from './shared/EwdSimvarPublisher';

import './style.scss';
import { ExtendedClockEventProvider } from 'instruments/src/MsfsAvionicsCommon/providers/ExtendedClockProvider';

class A32NX_EWD extends BaseInstrument {
  private readonly bus = new EventBus();

  private readonly backplane = new InstrumentBackplane();

  private readonly simVarPublisher = new EwdSimvarPublisher(this.bus);

  private readonly arincProvider = new ArincValueProvider(this.bus);

  private readonly clock = new Clock(this.bus);

  private readonly fuelSystemPublisher = new FuelSystemPublisher(this.bus);

  private readonly adcPublisher = new AdcPublisher(this.bus);

  private readonly sfccBusPublisher = new A32NXSfccBusPublisher(this.bus);

  constructor() {
    super();

    this.backplane.addInstrument('Clock', this.clock);
    // FIXME hook up DMC power state some day
    this.backplane.addInstrument('ExtClock', new ExtendedClockEventProvider(this.bus, Subject.create(true)));
    this.backplane.addPublisher('SimVars', this.simVarPublisher);
    this.backplane.addPublisher('FuelSystem', this.fuelSystemPublisher);
    this.backplane.addPublisher('adc', this.adcPublisher);

    this.backplane.addPublisher('SfccBus', this.sfccBusPublisher);
  }

  get templateID(): string {
    return 'A32NX_EWD';
  }

  public connectedCallback(): void {
    super.connectedCallback();

    this.arincProvider.init();
    this.backplane.init();

    FSComponent.render(<EwdComponent bus={this.bus} instrument={this} />, document.getElementById('EWD_CONTENT'));

    // Remove "instrument didn't load" text
    document.getElementById('EWD_CONTENT').querySelector(':scope > h1').remove();
  }

  public Update(): void {
    super.Update();

    this.backplane.onUpdate();
  }
}

registerInstrument('a32nx-ewd', A32NX_EWD);
