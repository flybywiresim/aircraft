// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus } from '@microsoft/msfs-sdk';
import { Arinc429Register } from '@flybywiresim/fbw-sdk';
import { EwdSimvars } from './EwdSimvarPublisher';

export interface Arinc429Values {
  sat: Arinc429Register;
  slatsFlapsStatus: Arinc429Register;
  slatsPosition: Arinc429Register;
  flapsPosition: Arinc429Register;
}
export class ArincValueProvider {
  private sat = Arinc429Register.empty();

  constructor(private readonly bus: EventBus) {}

  public init() {
    const publisher = this.bus.getPublisher<Arinc429Values>();
    const subscriber = this.bus.getSubscriber<EwdSimvars>();

    subscriber.on('satRaw').handle((p) => {
      this.sat.set(p);
      publisher.pub('sat', this.sat);
    });
  }
}
