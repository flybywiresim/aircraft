// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarDefinition, SimVarPublisher, SimVarValueType, Subject } from '@microsoft/msfs-sdk';
import { Arinc429WordData, Arinc429RegisterSubject } from '@flybywiresim/fbw-sdk';
import { AdirsSimVars } from '../SimVarTypes';

export interface DmcLogicEvents {
  trueRefActive: boolean;
  heading: Arinc429WordData;
  track: Arinc429WordData;
}

export interface DmcDiscreteInputEvents {
  trueRefPushButton: boolean;
}

export type DmcEvents = DmcLogicEvents & DmcDiscreteInputEvents;

export class DmcPublisher extends SimVarPublisher<DmcDiscreteInputEvents> {
  private readonly irMaintWord = Arinc429RegisterSubject.createEmpty();

  private readonly magHeading = Arinc429RegisterSubject.createEmpty();

  private readonly trueHeading = Arinc429RegisterSubject.createEmpty();

  private readonly magTrack = Arinc429RegisterSubject.createEmpty();

  private readonly trueTrack = Arinc429RegisterSubject.createEmpty();

  private readonly trueRefPb = Subject.create(false);

  private readonly trueRefActive = Subject.create(false);

  constructor(private eventBus: EventBus) {
    const simVars = new Map<keyof DmcDiscreteInputEvents, SimVarDefinition>([
      // FIXME, per-side
      ['trueRefPushButton', { name: 'L:A32NX_PUSH_TRUE_REF', type: SimVarValueType.Bool }],
    ]);
    super(simVars, eventBus);
  }

  /** @inheritdoc */
  public startPublish(): void {
    const pub = this.eventBus.getPublisher<DmcLogicEvents>();

    this.trueRefActive.sub((v) => {
      pub.pub('trueRefActive', v);
      this.handleHeading();
    }, true);

    const sub = this.eventBus.getSubscriber<AdirsSimVars & DmcDiscreteInputEvents>();

    this.irMaintWord.sub(this.handleTrueRef.bind(this));
    this.trueRefPb.sub(this.handleTrueRef.bind(this), true);

    this.magHeading.sub(this.handleHeading.bind(this));
    this.magTrack.sub(this.handleHeading.bind(this));
    this.trueHeading.sub(this.handleHeading.bind(this));
    this.trueTrack.sub(this.handleHeading.bind(this));

    sub.on('irMaintWordRaw').handle((v) => this.irMaintWord.setWord(v));
    sub
      .on('trueRefPushButton')
      .whenChanged()
      .handle((v) => this.trueRefPb.set(v));
    sub.on('magHeadingRaw').handle((v) => this.magHeading.setWord(v));
    sub.on('magTrackRaw').handle((v) => this.magTrack.setWord(v));
    sub.on('trueHeadingRaw').handle((v) => this.trueHeading.setWord(v));
    sub.on('trueTrackRaw').handle((v) => this.trueTrack.setWord(v));

    super.startPublish();
  }

  private handleTrueRef(): void {
    // true ref is active when the PB is pressed or the ADIRU is at an extreme latitude
    // and the ADIRU must not be in ATT reversion mode
    const trueRequested = this.irMaintWord.get().bitValueOr(15, false) || this.trueRefPb.get();
    this.trueRefActive.set(trueRequested && !this.irMaintWord.get().bitValueOr(2, false));
  }

  private handleHeading(): void {
    const pub = this.eventBus.getPublisher<DmcLogicEvents>();

    pub.pub('heading', this.trueRefActive.get() ? this.trueHeading.get() : this.magHeading.get());
    pub.pub('track', this.trueRefActive.get() ? this.trueTrack.get() : this.magTrack.get());
  }
}
