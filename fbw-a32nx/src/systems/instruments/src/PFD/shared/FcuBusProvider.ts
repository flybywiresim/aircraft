// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { getDisplayIndex } from 'instruments/src/PFD/PFD';
import { Arinc429Word } from '@flybywiresim/fbw-sdk';
import { Instrument } from '@microsoft/msfs-sdk';
import { PFDSimvars } from './PFDSimvarPublisher';
import { ArincEventBus } from '@flybywiresim/fbw-sdk';

export interface FcuBus {
  fcuSelectedHeading: Arinc429Word;
  fcuSelectedAltitude: Arinc429Word;
  fcuSelectedAirspeed: Arinc429Word;
  fcuSelectedVerticalSpeed: Arinc429Word;
  fcuSelectedTrack: Arinc429Word;
  fcuSelectedFpa: Arinc429Word;
  fcuAtsDiscreteWord: Arinc429Word;
  fcuAtsFmaDiscreteWord: Arinc429Word;
  fcuEisDiscreteWord1: Arinc429Word;
  fcuEisDiscreteWord2: Arinc429Word;
  fcuEisBaro: Arinc429Word;
  fcuEisBaroHpa: Arinc429Word;
  fcuDiscreteWord1: Arinc429Word;
  fcuDiscreteWord2: Arinc429Word;
}
/** @deprecated Use the new style publisher in shared/src and Arinc429LocalVarConsumerSubject. This avoids a lot of memory allocations. */
export class FcuBusProvider implements Instrument {
  private fcuEisDiscreteWord2 = new Arinc429Word(0);

  constructor(private readonly bus: ArincEventBus) {}

  /** @inheritdoc */
  public init() {
    const publisher = this.bus.getPublisher<FcuBus>();
    const subscriber = this.bus.getSubscriber<PFDSimvars>();

    subscriber.on('fcuSelectedHeadingRaw').handle((word) => {
      publisher.pub('fcuSelectedHeading', new Arinc429Word(word));
    });

    subscriber.on('fcuSelectedAltitudeRaw').handle((word) => {
      publisher.pub('fcuSelectedAltitude', new Arinc429Word(word));
    });

    subscriber.on('fcuSelectedAirspeedRaw').handle((word) => {
      publisher.pub('fcuSelectedAirspeed', new Arinc429Word(word));
    });

    subscriber.on('fcuSelectedVerticalSpeedRaw').handle((word) => {
      publisher.pub('fcuSelectedVerticalSpeed', new Arinc429Word(word));
    });

    subscriber.on('fcuSelectedTrackRaw').handle((word) => {
      publisher.pub('fcuSelectedTrack', new Arinc429Word(word));
    });

    subscriber.on('fcuSelectedFpaRaw').handle((word) => {
      publisher.pub('fcuSelectedFpa', new Arinc429Word(word));
    });

    subscriber.on('fcuAtsDiscreteWordRaw').handle((word) => {
      publisher.pub('fcuAtsDiscreteWord', new Arinc429Word(word));
    });

    subscriber.on('fcuAtsFmaDiscreteWordRaw').handle((word) => {
      publisher.pub('fcuAtsFmaDiscreteWord', new Arinc429Word(word));
    });

    subscriber.on('fcuEisLeftDiscreteWord1Raw').handle((word) => {
      if (getDisplayIndex() === 1) {
        publisher.pub('fcuEisDiscreteWord1', new Arinc429Word(word));
      }
    });

    subscriber.on('fcuEisLeftDiscreteWord2Raw').handle((word) => {
      if (getDisplayIndex() === 1) {
        this.fcuEisDiscreteWord2 = new Arinc429Word(word);
        publisher.pub('fcuEisDiscreteWord2', this.fcuEisDiscreteWord2);
      }
    });

    subscriber.on('fcuEisLeftBaroRaw').handle((word) => {
      if (getDisplayIndex() === 1) {
        publisher.pub('fcuEisBaro', new Arinc429Word(word));
      }
    });

    subscriber.on('fcuEisLeftBaroHpaRaw').handle((word) => {
      if (getDisplayIndex() === 1) {
        publisher.pub('fcuEisBaroHpa', new Arinc429Word(word));
      }
    });

    subscriber.on('fcuEisRightDiscreteWord1Raw').handle((word) => {
      if (getDisplayIndex() === 2) {
        publisher.pub('fcuEisDiscreteWord1', new Arinc429Word(word));
      }
    });

    subscriber.on('fcuEisRightDiscreteWord2Raw').handle((word) => {
      if (getDisplayIndex() === 2) {
        this.fcuEisDiscreteWord2 = new Arinc429Word(word);
        publisher.pub('fcuEisDiscreteWord2', this.fcuEisDiscreteWord2);
      }
    });

    subscriber.on('fcuEisRightBaroRaw').handle((word) => {
      if (getDisplayIndex() === 2) {
        publisher.pub('fcuEisBaro', new Arinc429Word(word));
      }
    });

    subscriber.on('fcuEisRightBaroHpaRaw').handle((word) => {
      if (getDisplayIndex() === 2) {
        publisher.pub('fcuEisBaroHpa', new Arinc429Word(word));
      }
    });

    subscriber.on('fcuDiscreteWord1Raw').handle((word) => {
      publisher.pub('fcuDiscreteWord1', new Arinc429Word(word));
    });

    subscriber.on('fcuDiscreteWord2Raw').handle((word) => {
      publisher.pub('fcuDiscreteWord2', new Arinc429Word(word));
    });
  }

  /** @inheritdoc */
  onUpdate(): void {}
}
