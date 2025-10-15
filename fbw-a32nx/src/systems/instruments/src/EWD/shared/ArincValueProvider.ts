// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Publisher } from '@microsoft/msfs-sdk';
import { Arinc429Word, Arinc429WordData, Arinc429RegisterSubject, ArincEventBus } from '@flybywiresim/fbw-sdk';
import { EwdSimvars } from './EwdSimvarPublisher';

export interface Arinc429Values {
  sat: Arinc429Word;
  slatsFlapsStatus: Arinc429WordData;
  slatsPosition: Arinc429WordData;
  flapsPosition: Arinc429WordData;
  sfccToUse: number;
}
export class ArincValueProvider {
  private sat = new Arinc429Word(0);

  private sfcc1SlatsFlapsStatus = Arinc429RegisterSubject.createEmpty();

  private sfcc2SlatsFlapsStatus = Arinc429RegisterSubject.createEmpty();

  private slatsFlapsStatus = Arinc429RegisterSubject.createEmpty();

  private slatsPosition = Arinc429RegisterSubject.createEmpty();

  private flapsPosition = Arinc429RegisterSubject.createEmpty();

  private sfccToUse = 0;

  constructor(private readonly bus: ArincEventBus) {}

  public init() {
    const publisher = this.bus.getPublisher<Arinc429Values>();
    const subscriber = this.bus.getSubscriber<EwdSimvars>();

    subscriber.on('satRaw').handle((p) => {
      this.sat = new Arinc429Word(p);
      publisher.pub('sat', this.sat);
    });

    subscriber.on('sfcc1SlatsFlapsStatusRaw').handle((w) => {
      this.slatsFlapsStatus.setWord(w);
      this.sfcc1SlatsFlapsStatus.setWord(w);
      this.determineSfccToUse(publisher);
      if (this.sfccToUse === 1) {
        publisher.pub('slatsFlapsStatus', this.slatsFlapsStatus.get());
      } else if (this.sfccToUse === 0) {
        publisher.pub('slatsFlapsStatus', new Arinc429Word(0));
      }
    });

    subscriber.on('sfcc1SlatsPositionRaw').handle((w) => {
      this.slatsPosition.setWord(w);
      if (this.sfccToUse === 1) {
        publisher.pub('slatsPosition', this.slatsPosition.get());
      }
    });

    subscriber.on('sfcc1FlapsPositionRaw').handle((w) => {
      this.flapsPosition.setWord(w);
      if (this.sfccToUse === 1) {
        publisher.pub('flapsPosition', this.flapsPosition.get());
      }
    });

    subscriber.on('sfcc2SlatsFlapsStatusRaw').handle((w) => {
      this.slatsFlapsStatus.setWord(w);
      this.sfcc2SlatsFlapsStatus.setWord(w);
      this.determineSfccToUse(publisher);
      if (this.sfccToUse === 2) {
        publisher.pub('slatsFlapsStatus', this.slatsFlapsStatus.get());
      } else if (this.sfccToUse === 0) {
        publisher.pub('slatsFlapsStatus', new Arinc429Word(0));
      }
    });

    subscriber.on('sfcc2SlatsPositionRaw').handle((w) => {
      this.slatsPosition.setWord(w);
      if (this.sfccToUse === 2) {
        publisher.pub('slatsPosition', this.slatsPosition.get());
      }
    });

    subscriber.on('sfcc2FlapsPositionRaw').handle((w) => {
      this.flapsPosition.setWord(w);
      if (this.sfccToUse === 2) {
        publisher.pub('flapsPosition', this.flapsPosition.get());
      }
    });
  }

  private determineSfccToUse(publisher: Publisher<Arinc429Values>) {
    const sfcc1Valid = !this.sfcc1SlatsFlapsStatus.get().isFailureWarning();
    const sfcc2Valid = !this.sfcc2SlatsFlapsStatus.get().isFailureWarning();
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
