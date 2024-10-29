// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus } from '@microsoft/msfs-sdk';
import { Arinc429Register, Arinc429RegisterSubject, Arinc429WordData } from '@flybywiresim/fbw-sdk';
import { EwdSimvars } from './EwdSimvarPublisher';

export interface Arinc429Values {
  sat: Arinc429Register;
  slatsFlapsStatus: Arinc429Register;
  slatsPosition: Arinc429Register;
  flapsPosition: Arinc429Register;
  cpiomBAgsDiscrete: Arinc429WordData;
}
export class ArincValueProvider {
  private sat = Arinc429Register.empty();

  private cpiomB1AgsDiscrete = Arinc429RegisterSubject.createEmpty();

  private cpiomB2AgsDiscrete = Arinc429RegisterSubject.createEmpty();

  private cpiomB3AgsDiscrete = Arinc429RegisterSubject.createEmpty();

  private cpiomB4AgsDiscrete = Arinc429RegisterSubject.createEmpty();

  private cpiomBToUse = 1;

  constructor(private readonly bus: EventBus) {}

  public init() {
    const publisher = this.bus.getPublisher<Arinc429Values>();
    const subscriber = this.bus.getSubscriber<EwdSimvars>();

    subscriber.on('satRaw').handle((p) => {
      this.sat.set(p);
      publisher.pub('sat', this.sat);
    });

    subscriber.on('cpiomB1AgsDiscreteRaw').handle((discreteWord) => {
      this.cpiomB1AgsDiscrete.setWord(discreteWord);
      this.cpiomBToUse = this.determineCpiomBToUse();
      if (this.cpiomBToUse === 1) {
        publisher.pub('cpiomBAgsDiscrete', this.cpiomB1AgsDiscrete.get());
      }
    });

    subscriber.on('cpiomB2AgsDiscreteRaw').handle((discreteWord) => {
      this.cpiomB2AgsDiscrete.setWord(discreteWord);
      this.cpiomBToUse = this.determineCpiomBToUse();
      if (this.cpiomBToUse === 2) {
        publisher.pub('cpiomBAgsDiscrete', this.cpiomB2AgsDiscrete.get());
      }
    });

    subscriber.on('cpiomB2AgsDiscreteRaw').handle((discreteWord) => {
      this.cpiomB3AgsDiscrete.setWord(discreteWord);
      this.cpiomBToUse = this.determineCpiomBToUse();
      if (this.cpiomBToUse === 3) {
        publisher.pub('cpiomBAgsDiscrete', this.cpiomB3AgsDiscrete.get());
      }
    });

    subscriber.on('cpiomB3AgsDiscreteRaw').handle((discreteWord) => {
      this.cpiomB4AgsDiscrete.setWord(discreteWord);
      this.cpiomBToUse = this.determineCpiomBToUse();
      if (this.cpiomBToUse === 4) {
        publisher.pub('cpiomBAgsDiscrete', this.cpiomB4AgsDiscrete.get());
      }
    });
  }

  private determineCpiomBToUse() {
    if (!this.cpiomB1AgsDiscrete.get().isFailureWarning()) {
      return 1;
    } else if (!this.cpiomB2AgsDiscrete.get().isFailureWarning()) {
      return 2;
    } else if (!this.cpiomB3AgsDiscrete.get().isFailureWarning()) {
      return 3;
    } else {
      return 4;
    }
  }
}
