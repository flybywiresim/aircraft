// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ClockEvents, EventBus, Subject } from '@microsoft/msfs-sdk';

export interface FlasherEvents {
  flash_1hz: boolean;
}

export class Flasher {
  constructor(bus: EventBus) {
    const sub = bus.getSubscriber<ClockEvents>();

    const flash1Hz = Subject.create(false);

    sub
      .on('simTime')
      .atFrequency(2)
      .handle(() => flash1Hz.set(!flash1Hz.get()));

    const pub = bus.getPublisher<FlasherEvents>();

    flash1Hz.sub((v) => pub.pub('flash_1hz', v));
  }
}
