// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { ClockEvents, EventBus, Instrument } from '@microsoft/msfs-sdk';

export interface ExtendedClockEvents {
  monotonicTime: number;
  deltaTime: number;
  oneHertzClock: boolean;
}

export class ExtendedClockEventProvider implements Instrument {
  private prevSimTime = 0;

  private deltaTime = 0;

  private monotonicTime = 0;

  private oneHertzClock = 0;

  constructor(private readonly bus: EventBus) {}

  /** @inheritdoc */
  public init(): void {
    const publisher = this.bus.getPublisher<ExtendedClockEvents>();
    const subscriber = this.bus.getSubscriber<ClockEvents>();

    subscriber.on('simTime').handle((time) => {
      this.deltaTime = time - this.prevSimTime;

      this.monotonicTime += this.deltaTime;

      this.oneHertzClock += this.deltaTime;

      publisher.pub('deltaTime', this.deltaTime);
      publisher.pub('monotonicTime', this.monotonicTime);
      publisher.pub('oneHertzClock', this.oneHertzClock > 500);

      if (this.oneHertzClock > 1000) {
        this.oneHertzClock = 0;
      }
      this.prevSimTime = time;
    });
  }

  /** @inheritdoc */
  public onUpdate(): void {
    // noop
  }
}
