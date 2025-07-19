// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  ConsumerSubject,
  EventBus,
  Instrument,
  SimVarValueType,
  Subject,
  Subscribable,
  Subscription,
} from '@microsoft/msfs-sdk';
import { FailuresConsumer, FmsData } from '@flybywiresim/fbw-sdk';
import { A380Failure } from '@failures';
import { OisInternalData } from './OisInternalPublisher';
import { OitSimvars } from './OitSimvarPublisher';

type LaptopIndex = 1 | 2;

export class OisLaptop implements Instrument {
  private readonly subscriptions: Subscription[] = [];

  public readonly data = new OisLaptopData();

  private readonly failureKey = this.index === 1 ? A380Failure.CaptainLaptop : A380Failure.FirstOfficerLaptop;

  private readonly powered = Subject.create(false);

  private readonly _isHealthy = Subject.create(false);
  public readonly isHealthy = this._isHealthy as Subscribable<boolean>;
  private readonly isHealthySimVar = `L:A32NX_FLTOPS_LAPTOP_${this.index.toFixed(0)}_IS_HEALTHY`;

  private readonly sub = this.bus.getSubscriber<FmsData & OisInternalData & OitSimvars>();

  private readonly laptopSwitchedOn = ConsumerSubject.create(
    this.sub.on(this.index === 1 ? 'laptopCaptPowered' : 'laptopFoPowered'),
    false,
  );

  private readonly nssMasterOff = ConsumerSubject.create(this.sub.on('nssMasterOff'), false);

  private readonly fltNumberBus = ConsumerSubject.create(this.sub.on('fmsFlightNumber'), null);
  private readonly fromAirportBus = ConsumerSubject.create(this.sub.on('fmsOrigin'), null);
  private readonly toAirportBus = ConsumerSubject.create(this.sub.on('fmsDestination'), null);

  public synchroAvionics() {
    this.data.fltNumber.set(this.fltNumberBus.get());
    this.data.fromAirport.set(this.fromAirportBus.get());
    this.data.toAirport.set(this.toAirportBus.get());

    // Workaround since synced messages in the same VCockpit don't work
    SimVar.SetSimVarValue('L:A32NX_OIS_SYNCHRO_AVIONICS', SimVarValueType.Number, Math.random());
  }

  constructor(
    private readonly bus: EventBus,
    private readonly index: LaptopIndex,
    private readonly failuresConsumer: FailuresConsumer,
  ) {}

  /** @inheritdoc */
  init(): void {
    this.failuresConsumer.register(this.failureKey);

    this.subscriptions.push(
      this.sub.on('synchroAvncs').handle(() => this.synchroAvionics()),
      this._isHealthy.sub((v) => SimVar.SetSimVarValue(this.isHealthySimVar, SimVarValueType.Bool, v)),
    );

    this.subscriptions.push(this.fltNumberBus, this.fromAirportBus, this.toAirportBus);
  }

  /** @inheritdoc */
  onUpdate(): void {
    const failed = this.failuresConsumer.isActive(this.failureKey);

    if (this.index === 1) {
      this.powered.set(
        SimVar.GetSimVarValue('L:A32NX_ELEC_DC_1_BUS_IS_POWERED', SimVarValueType.Bool) && this.laptopSwitchedOn.get(),
      );
    } else {
      this.powered.set(
        (SimVar.GetSimVarValue('L:A32NX_ELEC_DC_2_BUS_IS_POWERED', SimVarValueType.Bool) ||
          SimVar.GetSimVarValue('L:A32NX_ELEC_DC_HOT_2_BUS_IS_POWERED', SimVarValueType.Bool)) &&
          this.laptopSwitchedOn.get(),
      );
    }

    this._isHealthy.set(!failed && this.powered.get() && !this.nssMasterOff.get());
  }

  destroy() {
    for (const s of this.subscriptions) {
      s.destroy();
    }
  }
}

export class OisLaptopData {
  public readonly fltNumber = Subject.create<string | null>(null);
  public readonly fromAirport = Subject.create<string | null>(null);
  public readonly toAirport = Subject.create<string | null>(null);
}
