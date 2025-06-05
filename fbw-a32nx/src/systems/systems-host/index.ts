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
import { Ecp } from './systems/ECP/Ecp';
import { A32NXElectricalSystemPublisher } from '@shared/publishers/A32NXElectricalSystemPublisher';
import { A32NXOverheadDiscretePublisher } from '../shared/src/publishers/A32NXOverheadDiscretePublisher';
import { A32NXEcpBusPublisher } from '../shared/src/publishers/A32NXEcpBusPublisher';
import { FakeDmc } from './systems/ECP/FakeDmc';

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

  private readonly pseudoFwcPublisher = new PseudoFwcSimvarPublisher(this.bus);

  private readonly pseudoFwc = new PseudoFWC(this.bus, this);

  constructor() {
    super();

    this.backplane.addInstrument('Clock', this.clock);
    this.backplane.addInstrument('AtsuSystem', this.atsu);
    this.backplane.addInstrument('Ecp', new Ecp(this.bus));
    this.backplane.addInstrument('FakeDmc', new FakeDmc(this.bus));

    this.backplane.addPublisher('HEvent', this.hEventPublisher);
    this.backplane.addPublisher('FuelSystem', this.fuelSystemPublisher);
    this.backplane.addPublisher('PowerPublisher', this.powerSupply);
    this.backplane.addPublisher('stallWarning', this.stallWarningPublisher);
    this.backplane.addPublisher('a32nxFcuBusPublisher', this.a32nxFcuBusPublisher);
    this.backplane.addPublisher('PseudoFwcPublisher', this.pseudoFwcPublisher);
    this.backplane.addPublisher('A32NXElectricalSystemPublisher', new A32NXElectricalSystemPublisher(this.bus));
    this.backplane.addPublisher('OverheadPublisher', new A32NXOverheadDiscretePublisher(this.bus));
    this.backplane.addPublisher('A32NXEcpBusPublisher', new A32NXEcpBusPublisher(this.bus));

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

    this.backplane.onUpdate();
  }
}

registerInstrument('systems-host', SystemsHost);
