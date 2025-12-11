// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ConsumerSubject, EventBus } from '@microsoft/msfs-sdk';
import { FmsData } from '../shared/src/publishers/FmsPublisher';

export class OansFmsDataStore {
  constructor(private bus: EventBus) {
    const sub = this.bus.getSubscriber<FmsData>();
    this.origin.setConsumer(sub.on('fmsOrigin'));
    this.destination.setConsumer(sub.on('fmsDestination'));
    this.alternate.setConsumer(sub.on('fmsAlternate'));
    this.departureRunway.setConsumer(sub.on('fmsDepartureRunway'));
    this.landingRunway.setConsumer(sub.on('fmsLandingRunway'));
  }

  public readonly origin = ConsumerSubject.create<string | null>(null, null);

  public readonly destination = ConsumerSubject.create<string | null>(null, null);

  public readonly alternate = ConsumerSubject.create<string | null>(null, null);

  public readonly departureRunway = ConsumerSubject.create<string | null>(null, null);

  public readonly landingRunway = ConsumerSubject.create<string | null>(null, null);
}
