// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { ClockEvents, EventBus, Instrument, Subject } from '@microsoft/msfs-sdk';

export interface ExtendedClockEvents {
  monotonicTime: number;
  deltaTime: number;
  oneHertzClock: boolean;
}

export class ExtendedClockEventProvider implements Instrument {
  private prevSimTime = 0;

  private deltaTime = 0;

  private monotonicTime = 0;

  private oneHertzClockTime = 0;

  private readonly oneHertzClock = Subject.create(false);

  constructor(private readonly bus: EventBus) {}

  /** @inheritdoc */
  public init(): void {
    const publisher = this.bus.getPublisher<ExtendedClockEvents>();
    const subscriber = this.bus.getSubscriber<ClockEvents>();

    subscriber.on('simTime').handle((time) => {
      this.deltaTime = time - this.prevSimTime;

      this.monotonicTime += this.deltaTime;

      this.oneHertzClockTime += this.deltaTime;

      this.oneHertzClock.set(this.oneHertzClockTime > 500);

      publisher.pub('deltaTime', this.deltaTime);
      publisher.pub('monotonicTime', this.monotonicTime);

      if (this.oneHertzClockTime > 1000) {
        this.oneHertzClockTime = 0;
      }
      this.prevSimTime = time;
    });

    this.oneHertzClock.sub((oneHertzClock) => {
      publisher.pub('oneHertzClock', oneHertzClock);
    });
  }

  /** @inheritdoc */
  public onUpdate(): void {
    // noop
  }
}
