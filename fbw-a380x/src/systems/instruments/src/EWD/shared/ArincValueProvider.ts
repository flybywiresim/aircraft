// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus } from '@microsoft/msfs-sdk';
import { Arinc429Register, Arinc429Word } from '@flybywiresim/fbw-sdk';
import { EwdSimvars } from './EwdSimvarPublisher';

export interface Arinc429Values {
  sat: Arinc429Register;
  slatsFlapsStatus: Arinc429Register;
  slatsPosition: Arinc429Register;
  flapsPosition: Arinc429Register;
  cpiomB1AgsDiscrete: Arinc429Word;
  cpiomB2AgsDiscrete: Arinc429Word;
  cpiomB3AgsDiscrete: Arinc429Word;
  cpiomB4AgsDiscrete: Arinc429Word;
  cpiomBAgsDiscrete: Arinc429Word;
}
export class ArincValueProvider {
  private sat = Arinc429Register.empty();

  private cpiomB1AgsDiscrete = new Arinc429Word(0);

  private cpiomB2AgsDiscrete = new Arinc429Word(0);

  private cpiomB3AgsDiscrete = new Arinc429Word(0);

  private cpiomB4AgsDiscrete = new Arinc429Word(0);

  private cpiomBToUse = 1;

  constructor(private readonly bus: EventBus) {}

  public init() {
    const publisher = this.bus.getPublisher<Arinc429Values>();
    const subscriber = this.bus.getSubscriber<EwdSimvars>();
    this.cpiomBToUse = this.determineCpiomBToUse();

    subscriber.on('satRaw').handle((p) => {
      this.sat.set(p);
      publisher.pub('sat', this.sat);
    });

    subscriber.on('cpiomB1AgsDiscreteRaw').handle((discreteWord) => {
      this.cpiomB1AgsDiscrete = new Arinc429Word(discreteWord);
      publisher.pub('cpiomB1AgsDiscrete', this.cpiomB1AgsDiscrete);
      if (this.cpiomBToUse === 1) {
        publisher.pub('cpiomBAgsDiscrete', this.cpiomB1AgsDiscrete);
      }
    });

    subscriber.on('cpiomB2AgsDiscreteRaw').handle((discreteWord) => {
      this.cpiomB2AgsDiscrete = new Arinc429Word(discreteWord);
      publisher.pub('cpiomB2AgsDiscrete', this.cpiomB2AgsDiscrete);
      if (this.cpiomBToUse === 2) {
        publisher.pub('cpiomBAgsDiscrete', this.cpiomB2AgsDiscrete);
      }
    });

    subscriber.on('cpiomB3AgsDiscreteRaw').handle((discreteWord) => {
      this.cpiomB3AgsDiscrete = new Arinc429Word(discreteWord);
      publisher.pub('cpiomB3AgsDiscrete', this.cpiomB3AgsDiscrete);
      if (this.cpiomBToUse === 3) {
        publisher.pub('cpiomBAgsDiscrete', this.cpiomB3AgsDiscrete);
      }
    });

    subscriber.on('cpiomB4AgsDiscreteRaw').handle((discreteWord) => {
      this.cpiomB4AgsDiscrete = new Arinc429Word(discreteWord);
      publisher.pub('cpiomB4AgsDiscrete', this.cpiomB4AgsDiscrete);
      if (this.cpiomBToUse === 4) {
        publisher.pub('cpiomBAgsDiscrete', this.cpiomB4AgsDiscrete);
      }
    });
  }

  private determineCpiomBToUse() {
    if (!this.cpiomB1AgsDiscrete.isFailureWarning()) {
      return 1;
    } else if (!this.cpiomB2AgsDiscrete.isFailureWarning()) {
      return 2;
    } else if (!this.cpiomB3AgsDiscrete.isFailureWarning()) {
      return 3;
    } else {
      return 4;
    }
  }
}
