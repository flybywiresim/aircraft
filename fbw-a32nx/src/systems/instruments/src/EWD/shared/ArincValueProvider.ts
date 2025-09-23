// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, Publisher } from '@microsoft/msfs-sdk';
import { Arinc429Word } from '@flybywiresim/fbw-sdk';
import { EwdSimvars } from './EwdSimvarPublisher';

export interface Arinc429Values {
  sat: Arinc429Word;
  slatsFlapsStatus: Arinc429Word;
  slatsPosition: Arinc429Word;
  flapsPosition: Arinc429Word;
  sfccToUse: number;
}
export class ArincValueProvider {
  private sat = new Arinc429Word(0);

  private sfcc1SlatsFlapsStatus = new Arinc429Word(0);

  private sfcc2SlatsFlapsStatus = new Arinc429Word(0);

  private slatsFlapsStatus = new Arinc429Word(0);

  private slatsPosition = new Arinc429Word(0);

  private flapsPosition = new Arinc429Word(0);

  private sfccToUse = 0;

  constructor(private readonly bus: EventBus) {}

  public init() {
    const publisher = this.bus.getPublisher<Arinc429Values>();
    const subscriber = this.bus.getSubscriber<EwdSimvars>();

    subscriber.on('satRaw').handle((p) => {
      this.sat = new Arinc429Word(p);
      publisher.pub('sat', this.sat);
    });

    subscriber.on('sfcc1SlatsFlapsStatusRaw').handle((w) => {
      this.slatsFlapsStatus = new Arinc429Word(w);
      this.sfcc1SlatsFlapsStatus = new Arinc429Word(w);
      this.determineSfccToUse(publisher);
      if (this.sfccToUse === 1) {
        publisher.pub('slatsFlapsStatus', this.slatsFlapsStatus);
      } else if (this.sfccToUse === 0) {
        publisher.pub('slatsFlapsStatus', new Arinc429Word(0));
      }
    });

    subscriber.on('sfcc1SlatsPositionRaw').handle((w) => {
      this.slatsPosition = new Arinc429Word(w);
      if (this.sfccToUse === 1) {
        publisher.pub('slatsPosition', this.slatsPosition);
      } else if (this.sfccToUse === 0) {
        publisher.pub('slatsPosition', new Arinc429Word(0));
      }
    });

    subscriber.on('sfcc1FlapsPositionRaw').handle((w) => {
      this.flapsPosition = new Arinc429Word(w);
      if (this.sfccToUse === 1) {
        publisher.pub('flapsPosition', this.flapsPosition);
      } else if (this.sfccToUse === 0) {
        publisher.pub('flapsPosition', new Arinc429Word(0));
      }
    });

    subscriber.on('sfcc2SlatsFlapsStatusRaw').handle((w) => {
      this.slatsFlapsStatus = new Arinc429Word(w);
      this.sfcc2SlatsFlapsStatus = new Arinc429Word(w);
      this.determineSfccToUse(publisher);
      if (this.sfccToUse === 2) {
        publisher.pub('slatsFlapsStatus', this.slatsFlapsStatus);
      } else if (this.sfccToUse === 0) {
        publisher.pub('slatsFlapsStatus', new Arinc429Word(0));
      }
    });

    subscriber.on('sfcc2SlatsPositionRaw').handle((w) => {
      this.slatsPosition = new Arinc429Word(w);
      if (this.sfccToUse === 2) {
        publisher.pub('slatsPosition', this.slatsPosition);
      } else if (this.sfccToUse === 0) {
        publisher.pub('slatsPosition', new Arinc429Word(0));
      }
    });

    subscriber.on('sfcc2FlapsPositionRaw').handle((w) => {
      this.flapsPosition = new Arinc429Word(w);
      if (this.sfccToUse === 2) {
        publisher.pub('flapsPosition', this.flapsPosition);
      } else if (this.sfccToUse === 0) {
        publisher.pub('flapsPosition', new Arinc429Word(0));
      }
    });
  }

  private determineSfccToUse(publisher: Publisher<Arinc429Values>) {
    const sfcc1Valid = !this.sfcc1SlatsFlapsStatus.isFailureWarning();
    const sfcc2Valid = !this.sfcc2SlatsFlapsStatus.isFailureWarning();
    if (sfcc1Valid) {
      this.sfccToUse = 1;
    } else if (sfcc2Valid) {
      this.sfccToUse = 2;
    } else {
      this.sfccToUse = 0;
    }

    publisher.pub('sfccToUse', this.sfccToUse);
  }
}
