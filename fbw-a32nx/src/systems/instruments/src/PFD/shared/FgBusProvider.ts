// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Instrument, Publisher } from '@microsoft/msfs-sdk';
import { getDisplayIndex } from 'instruments/src/PFD/PFD';
import { Arinc429Word } from '@flybywiresim/fbw-sdk';
import { PFDSimvars } from './PFDSimvarPublisher';
import { ArincEventBus } from '@flybywiresim/fbw-sdk';

export interface FgBus {
  fdEngaged: boolean;
  pfdSelectedSpeed: Arinc429Word;
  preselMach: Arinc429Word;
  preselSpeed: Arinc429Word;
  rollFdCommand: Arinc429Word;
  pitchFdCommand: Arinc429Word;
  yawFdCommand: Arinc429Word;
  fmgcDiscreteWord5: Arinc429Word;
  fmgc1DiscreteWord4: Arinc429Word;
  fmgc2DiscreteWord4: Arinc429Word;
  fmgcDiscreteWord4: Arinc429Word;
  fmgcFmAltitudeConstraint: Arinc429Word;
  fmgcDiscreteWord3: Arinc429Word;
  fmgcDiscreteWord1: Arinc429Word;
  fmgcDiscreteWord2: Arinc429Word;
  fmgcDiscreteWord7: Arinc429Word;
  fmgcSpeedMarginHigh: Arinc429Word;
  fmgcSpeedMarginLow: Arinc429Word;
}
export class FgBusProvider implements Instrument {
  private fcuEisDiscreteWord2 = new Arinc429Word(0);

  private fmgc1DiscreteWord4 = new Arinc429Word(0);

  private fmgc2DiscreteWord4 = new Arinc429Word(0);

  private fmgc1AtsDiscreteWord = new Arinc429Word(0);

  private fmgc2AtsDiscreteWord = new Arinc429Word(0);

  private fg1ForFlightDirectorSelected = false;

  private fg1Selected = false;

  constructor(private readonly bus: ArincEventBus) {}

  /** @inheritdoc */
  public init() {
    const publisher = this.bus.getPublisher<FgBus>();
    const subscriber = this.bus.getSubscriber<PFDSimvars>();

    subscriber.on('fcuEisLeftDiscreteWord2Raw').handle((word) => {
      if (getDisplayIndex() === 1) {
        this.fcuEisDiscreteWord2 = new Arinc429Word(word);
        this.determineFmgcToUseForFlightDirector(publisher);
      }
    });

    subscriber.on('fcuEisRightDiscreteWord2Raw').handle((word) => {
      if (getDisplayIndex() === 2) {
        this.fcuEisDiscreteWord2 = new Arinc429Word(word);
        this.determineFmgcToUseForFlightDirector(publisher);
      }
    });

    subscriber.on('fmgc1PfdSelectedSpeedRaw').handle((word) => {
      if (this.fg1Selected) {
        publisher.pub('pfdSelectedSpeed', new Arinc429Word(word));
      }
    });

    subscriber.on('fmgc2PfdSelectedSpeedRaw').handle((word) => {
      if (!this.fg1Selected) {
        publisher.pub('pfdSelectedSpeed', new Arinc429Word(word));
      }
    });

    subscriber.on('fmgc1PreselMachRaw').handle((word) => {
      if (this.fg1Selected) {
        publisher.pub('preselMach', new Arinc429Word(word));
      }
    });

    subscriber.on('fmgc2PreselMachRaw').handle((word) => {
      if (!this.fg1Selected) {
        publisher.pub('preselMach', new Arinc429Word(word));
      }
    });

    subscriber.on('fmgc1PreselSpeedRaw').handle((word) => {
      if (this.fg1Selected) {
        publisher.pub('preselSpeed', new Arinc429Word(word));
      }
    });

    subscriber.on('fmgc2PreselSpeedRaw').handle((word) => {
      if (!this.fg1Selected) {
        publisher.pub('preselSpeed', new Arinc429Word(word));
      }
    });

    subscriber.on('fmgc1RollFdCommandRaw').handle((word) => {
      if (this.fg1ForFlightDirectorSelected) {
        publisher.pub('rollFdCommand', new Arinc429Word(word));
      }
    });

    subscriber.on('fmgc2RollFdCommandRaw').handle((word) => {
      if (!this.fg1ForFlightDirectorSelected) {
        publisher.pub('rollFdCommand', new Arinc429Word(word));
      }
    });

    subscriber.on('fmgc1PitchFdCommandRaw').handle((word) => {
      if (this.fg1ForFlightDirectorSelected) {
        publisher.pub('pitchFdCommand', new Arinc429Word(word));
      }
    });

    subscriber.on('fmgc2PitchFdCommandRaw').handle((word) => {
      if (!this.fg1ForFlightDirectorSelected) {
        publisher.pub('pitchFdCommand', new Arinc429Word(word));
      }
    });

    subscriber.on('fmgc1YawFdCommandRaw').handle((word) => {
      if (this.fg1ForFlightDirectorSelected) {
        publisher.pub('yawFdCommand', new Arinc429Word(word));
      }
    });

    subscriber.on('fmgc2YawFdCommandRaw').handle((word) => {
      if (!this.fg1ForFlightDirectorSelected) {
        publisher.pub('yawFdCommand', new Arinc429Word(word));
      }
    });

    subscriber.on('fmgc1DiscreteWord5Raw').handle((word) => {
      if (this.fg1Selected) {
        publisher.pub('fmgcDiscreteWord5', new Arinc429Word(word));
      }
    });

    subscriber.on('fmgc2DiscreteWord5Raw').handle((word) => {
      if (!this.fg1Selected) {
        publisher.pub('fmgcDiscreteWord5', new Arinc429Word(word));
      }
    });

    subscriber.on('fmgc1DiscreteWord4Raw').handle((word) => {
      this.fmgc1DiscreteWord4 = new Arinc429Word(word);
      this.determineFmgcToUseForFlightDirector(publisher);
      this.determineFmgcToUse();
      publisher.pub('fmgc1DiscreteWord4', new Arinc429Word(word));
      if (this.fg1Selected) {
        publisher.pub('fmgcDiscreteWord4', this.fmgc1DiscreteWord4);
      }
    });

    subscriber.on('fmgc2DiscreteWord4Raw').handle((word) => {
      this.fmgc2DiscreteWord4 = new Arinc429Word(word);
      this.determineFmgcToUseForFlightDirector(publisher);
      this.determineFmgcToUse();
      publisher.pub('fmgc2DiscreteWord4', new Arinc429Word(word));
      if (!this.fg1Selected) {
        publisher.pub('fmgcDiscreteWord4', this.fmgc2DiscreteWord4);
      }
    });

    subscriber.on('fmgc1FmAltitudeConstraintRaw').handle((word) => {
      if (this.fg1Selected) {
        publisher.pub('fmgcFmAltitudeConstraint', new Arinc429Word(word));
      }
    });

    subscriber.on('fmgc2FmAltitudeConstraintRaw').handle((word) => {
      if (!this.fg1Selected) {
        publisher.pub('fmgcFmAltitudeConstraint', new Arinc429Word(word));
      }
    });

    subscriber.on('fmgc1AtsDiscreteWordRaw').handle((word) => {
      this.fmgc1AtsDiscreteWord = new Arinc429Word(word);
      this.determineFmgcToUse();
    });

    subscriber.on('fmgc2AtsDiscreteWordRaw').handle((word) => {
      this.fmgc2AtsDiscreteWord = new Arinc429Word(word);
      this.determineFmgcToUse();
    });

    subscriber.on('fmgc1DiscreteWord3Raw').handle((word) => {
      if (this.fg1Selected) {
        publisher.pub('fmgcDiscreteWord3', new Arinc429Word(word));
      }
    });

    subscriber.on('fmgc2DiscreteWord3Raw').handle((word) => {
      if (!this.fg1Selected) {
        publisher.pub('fmgcDiscreteWord3', new Arinc429Word(word));
      }
    });

    subscriber.on('fmgc1DiscreteWord1Raw').handle((word) => {
      if (this.fg1Selected) {
        publisher.pub('fmgcDiscreteWord1', new Arinc429Word(word));
      }
    });

    subscriber.on('fmgc2DiscreteWord1Raw').handle((word) => {
      if (!this.fg1Selected) {
        publisher.pub('fmgcDiscreteWord1', new Arinc429Word(word));
      }
    });

    subscriber.on('fmgc1DiscreteWord2Raw').handle((word) => {
      if (this.fg1Selected) {
        publisher.pub('fmgcDiscreteWord2', new Arinc429Word(word));
      }
    });

    subscriber.on('fmgc2DiscreteWord2Raw').handle((word) => {
      if (!this.fg1Selected) {
        publisher.pub('fmgcDiscreteWord2', new Arinc429Word(word));
      }
    });

    subscriber.on('fmgc1DiscreteWord7Raw').handle((word) => {
      if (this.fg1Selected) {
        publisher.pub('fmgcDiscreteWord7', new Arinc429Word(word));
      }
    });

    subscriber.on('fmgc2DiscreteWord7Raw').handle((word) => {
      if (!this.fg1Selected) {
        publisher.pub('fmgcDiscreteWord7', new Arinc429Word(word));
      }
    });

    subscriber.on('fmgc1SpeedMarginHighRaw').handle((word) => {
      if (this.fg1Selected) {
        publisher.pub('fmgcSpeedMarginHigh', new Arinc429Word(word));
      }
    });

    subscriber.on('fmgc2SpeedMarginHighRaw').handle((word) => {
      if (!this.fg1Selected) {
        publisher.pub('fmgcSpeedMarginHigh', new Arinc429Word(word));
      }
    });

    subscriber.on('fmgc1SpeedMarginLowRaw').handle((word) => {
      if (this.fg1Selected) {
        publisher.pub('fmgcSpeedMarginLow', new Arinc429Word(word));
      }
    });

    subscriber.on('fmgc2SpeedMarginLowRaw').handle((word) => {
      if (!this.fg1Selected) {
        publisher.pub('fmgcSpeedMarginLow', new Arinc429Word(word));
      }
    });
  }

  /** @inheritdoc */
  onUpdate(): void {}

  private determineFmgcToUseForFlightDirector(publisher: Publisher<FgBus>) {
    const side2 = getDisplayIndex() === 2;

    const fd1Engaged = this.fmgc1DiscreteWord4.bitValueOr(13, false);
    const fd2Engaged = this.fmgc2DiscreteWord4.bitValueOr(13, false);
    const fdOwnSelectedOn = !this.fcuEisDiscreteWord2.bitValueOr(23, false);

    const ownFdEngaged = side2 ? fd2Engaged : fd1Engaged;
    const oppFdEngaged = side2 ? fd1Engaged : fd2Engaged;

    const ownFdEngagedAndOn = ownFdEngaged && fdOwnSelectedOn;
    const oppFdEngagedAndOn = !ownFdEngaged && oppFdEngaged && fdOwnSelectedOn;

    this.fg1ForFlightDirectorSelected =
      (!side2 && !ownFdEngagedAndOn && !oppFdEngagedAndOn) ||
      (!side2 && ownFdEngagedAndOn) ||
      (side2 && oppFdEngagedAndOn);

    publisher.pub('fdEngaged', this.fg1ForFlightDirectorSelected ? fd1Engaged : fd2Engaged);
  }

  private determineFmgcToUse() {
    const side2 = getDisplayIndex() === 2;

    const ap1Engaged = this.fmgc1DiscreteWord4.bitValueOr(12, false);
    const fd1Engaged = this.fmgc1DiscreteWord4.bitValueOr(13, false);
    const ap2Engaged = this.fmgc2DiscreteWord4.bitValueOr(12, false);
    const fd2Engaged = this.fmgc2DiscreteWord4.bitValueOr(13, false);

    const fg1Inop =
      this.fmgc1AtsDiscreteWord.bitValueOr(24, false) ||
      this.fmgc1AtsDiscreteWord.isFailureWarning() ||
      this.fmgc1DiscreteWord4.isFailureWarning();
    const fg2Inop =
      this.fmgc2AtsDiscreteWord.bitValueOr(24, false) ||
      this.fmgc2AtsDiscreteWord.isFailureWarning() ||
      this.fmgc2DiscreteWord4.isFailureWarning();

    const apCondition = !side2 ? ap1Engaged : ap1Engaged && !ap2Engaged;
    const fdCondition = !(ap1Engaged || ap2Engaged) && (!side2 ? fd1Engaged : fd1Engaged && !fd2Engaged);
    const inopCondition = !(ap1Engaged || ap2Engaged) && !(fd1Engaged || fd2Engaged) && (!fg1Inop || fg2Inop);

    this.fg1Selected = apCondition || fdCondition || inopCondition;
  }
}
