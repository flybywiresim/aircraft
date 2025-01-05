// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus } from '@microsoft/msfs-sdk';
import { Arinc429Word } from '@flybywiresim/fbw-sdk';
import { EwdSimvars } from './EwdSimvarPublisher';

export interface Arinc429Values {
  sat: Arinc429Word;
  slatsFlapsStatus: Arinc429Word;
  slatsPosition: Arinc429Word;
  flapsPosition: Arinc429Word;
}
export class ArincValueProvider {
  private sat = new Arinc429Word(0);

  private slatsFlapsStatus = new Arinc429Word(0);

  private slatsPosition = new Arinc429Word(0);

  private flapsPosition = new Arinc429Word(0);

  constructor(private readonly bus: EventBus) {}

  public init() {
    const publisher = this.bus.getPublisher<Arinc429Values>();
    const subscriber = this.bus.getSubscriber<EwdSimvars>();

    subscriber.on('satRaw').handle((p) => {
      this.sat = new Arinc429Word(p);
      publisher.pub('sat', this.sat);
    });

    subscriber.on('slatsFlapsStatusRaw').handle((w) => {
      this.slatsFlapsStatus = new Arinc429Word(w);
      publisher.pub('slatsFlapsStatus', this.slatsFlapsStatus);
    });

    subscriber.on('slatsPositionRaw').handle((w) => {
      this.slatsPosition = new Arinc429Word(w);
      publisher.pub('slatsPosition', this.slatsPosition);
    });

    subscriber.on('flapsPositionRaw').handle((w) => {
      this.flapsPosition = new Arinc429Word(w);
      publisher.pub('flapsPosition', this.flapsPosition);
    });
  }
}
