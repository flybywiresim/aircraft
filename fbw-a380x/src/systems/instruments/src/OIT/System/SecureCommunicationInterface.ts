// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ClockEvents, ConsumerSubject, EventBus, Instrument, MappedSubject, Subscription } from '@microsoft/msfs-sdk';
import { AdrBusEvents, Arinc429LocalVarConsumerSubject, FmsData, FwcBusEvents } from '@flybywiresim/fbw-sdk';
import { ResetPanelSimvars } from 'instruments/src/MsfsAvionicsCommon/providers/ResetPanelPublisher';
import { OitSimvars } from '../OitSimvarPublisher';

export class SecureCommunicationInterface implements Instrument {
  private readonly subscriptions: Subscription[] = [];

  private readonly fromAircraftSubscriptions: Subscription[] = [];
  private readonly toAircraftSubscriptions: Subscription[] = [];

  private readonly sub = this.bus.getSubscriber<
    ResetPanelSimvars & OitSimvars & FmsData & AdrBusEvents & FwcBusEvents & ClockEvents
  >();

  private readonly nssDataToAvncsOff = ConsumerSubject.create(this.sub.on('nssDataToAvncsOff'), false);

  // Data from avionics
  public readonly zuluTime = ConsumerSubject.create(this.sub.on('simTime'), Date.now());

  public readonly fltNumber = ConsumerSubject.create(this.sub.on('fmsFlightNumber'), null);
  public readonly fltOrigin = ConsumerSubject.create(this.sub.on('fmsOrigin'), null);
  public readonly fltDestination = ConsumerSubject.create(this.sub.on('fmsDestination'), null);

  public readonly parkBrakeSet = ConsumerSubject.create(this.sub.on('parkBrakeSet'), false);

  public readonly airspeed = Arinc429LocalVarConsumerSubject.create(this.sub.on('adr_computed_airspeed_1'));

  public readonly fwcDiscreteWord126 = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a32nx_fwc_discrete_word_126_1'),
  );

  public readonly onGround = this.fwcDiscreteWord126.map((dw) => dw.bitValueOr(28, true));

  public readonly doorsOpen = ConsumerSubject.create(this.sub.on('cabinDoorOpen'), 0);

  private readonly fuelQuantity = ConsumerSubject.create(this.sub.on('fuelTotalQuantity'), 0);
  private readonly fuelWeightPerGallon = ConsumerSubject.create(this.sub.on('fuelWeightPerGallon'), 0);
  /** in kgs */
  public readonly fuelWeight = MappedSubject.create(
    ([qt, weightPerGallon]) => qt * weightPerGallon,
    this.fuelQuantity,
    this.fuelWeightPerGallon,
  );

  constructor(private readonly bus: EventBus) {}

  /** @inheritdoc */
  init(): void {
    this.subscriptions.push(this.nssDataToAvncsOff, this.zuluTime);

    this.fromAircraftSubscriptions.push(
      this.fltNumber,
      this.fltOrigin,
      this.fltDestination,
      this.parkBrakeSet,
      this.airspeed,
      this.fwcDiscreteWord126,
      this.onGround,
      this.doorsOpen,
      this.fuelQuantity,
      this.fuelWeightPerGallon,
      this.fuelWeight,
    );

    this.nssDataToAvncsOff.sub((v) => this.toAircraftSubscriptions.forEach((s) => (v ? s.pause() : s.resume())));
  }

  /** @inheritdoc */
  onUpdate(): void {}

  destroy() {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    for (const s of this.fromAircraftSubscriptions) {
      s.destroy();
    }

    for (const s of this.toAircraftSubscriptions) {
      s.destroy();
    }
  }
}
