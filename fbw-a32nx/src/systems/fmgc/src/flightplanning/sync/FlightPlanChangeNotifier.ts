// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, Subject, Subscription } from '@microsoft/msfs-sdk';
import { FlightPlanEvents } from './FlightPlanEvents';

export class FlightPlanChangeNotifier {
  /** This subject is notified when any flight plan was changed, swapped, deleted. Don't listen to the value itself. */
  public readonly flightPlanChanged = Subject.create(false);

  private readonly subscription: Subscription[] = [];
  private readonly sub = this.bus.getSubscriber<FlightPlanEvents>();

  constructor(private readonly bus: EventBus) {
    this.subscription.push(
      this.sub.on('flightPlanManager.create').handle(() => {
        this.flightPlanChanged.set(true);
        this.flightPlanChanged.notify();
      }),
      this.sub.on('flightPlanManager.delete').handle(() => {
        this.flightPlanChanged.set(true);
        this.flightPlanChanged.notify();
      }),
      this.sub.on('flightPlanManager.deleteAll').handle(() => {
        this.flightPlanChanged.set(true);
        this.flightPlanChanged.notify();
      }),
      this.sub.on('flightPlanManager.swap').handle(() => {
        this.flightPlanChanged.set(true);
        this.flightPlanChanged.notify();
      }),
      this.sub.on('flightPlanManager.copy').handle(() => {
        this.flightPlanChanged.set(true);
        this.flightPlanChanged.notify();
      }),
    );
  }

  destroy(): void {
    this.subscription.forEach((sub) => sub.destroy());
  }
}
