// Copyright (c) 2021-2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { RegisteredSimVar } from '@flybywiresim/fbw-sdk';
import { ClockEvents, EventBus, Instrument, SimVarValueType, Subject, Subscribable } from '@microsoft/msfs-sdk';

export interface ExtendedClockEvents {
  /** Time in milliseconds since the start of the sim session, accumulating at simrate. */
  ext_clock_monotonic_time: number;
  /** Time in milliseconds since the previous monotonic clock update. */
  ext_clock_delta_time: number;
  /** Flashes on/off at 1 Hz rate when the system is powered. */
  ext_clock_one_hertz: boolean;
}

export class ExtendedClockEventProvider implements Instrument {
  private prevSimTime?: number;
  private powerOnTime?: number;

  private readonly oneHertzClock = Subject.create(false);
  private readonly monotonicSimTimeVar = RegisteredSimVar.create<number>('E:SIMULATION TIME', SimVarValueType.Number);

  constructor(
    private readonly bus: EventBus,
    private readonly isPowered: Subscribable<boolean>,
  ) {}

  /** @inheritdoc */
  public init(): void {
    const publisher = this.bus.getPublisher<ExtendedClockEvents>();
    const subscriber = this.bus.getSubscriber<ClockEvents>();

    this.isPowered.sub((isPowered) => {
      if (isPowered) {
        this.powerOnTime = this.monotonicSimTimeVar.get() * 1000;
      } else {
        this.powerOnTime = undefined;
      }
    }, true);

    subscriber.on('simTime').handle(() => {
      const monotonicTime = this.monotonicSimTimeVar.get() * 1000;
      const deltaTime = this.prevSimTime !== undefined ? monotonicTime - this.prevSimTime : 0;

      if (this.powerOnTime !== undefined) {
        const poweredOnTime = monotonicTime - this.powerOnTime;
        this.oneHertzClock.set(poweredOnTime % 1000 >= 500);
      } else {
        this.oneHertzClock.set(false);
      }

      publisher.pub('ext_clock_delta_time', deltaTime);
      publisher.pub('ext_clock_monotonic_time', monotonicTime);

      this.prevSimTime = monotonicTime;
    });

    this.oneHertzClock.sub((oneHertzClock) => {
      publisher.pub('ext_clock_one_hertz', oneHertzClock);
    });
  }

  /** @inheritdoc */
  public onUpdate(): void {
    // noop
  }
}
