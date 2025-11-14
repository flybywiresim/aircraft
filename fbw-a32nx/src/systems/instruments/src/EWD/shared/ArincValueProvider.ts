// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Arinc429Word } from '@flybywiresim/fbw-sdk';
import { EwdSimvars } from './EwdSimvarPublisher';
import { EventBus } from '@microsoft/msfs-sdk';

export interface Arinc429Values {
  sat: Arinc429Word;
}
export class ArincValueProvider {
  private sat = new Arinc429Word(0);

  constructor(private readonly bus: EventBus) {}

  public init() {
    const publisher = this.bus.getPublisher<Arinc429Values>();
    const subscriber = this.bus.getSubscriber<EwdSimvars>();

    subscriber.on('satRaw').handle((p) => {
      this.sat = new Arinc429Word(p);
      publisher.pub('sat', this.sat);
    });
  }
}
