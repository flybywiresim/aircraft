// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { getDisplayIndex } from 'instruments/src/PFD/PFD';
import { FcuBus } from 'instruments/src/PFD/shared/FcuBusProvider';

import {
  Arinc429ConsumerSubject,
  Arinc429LocalVarConsumerSubject,
  Arinc429Register,
  Arinc429RegisterSubject,
  Arinc429Word,
  Arinc429WordData,
  ArincEventBus,
} from '@flybywiresim/fbw-sdk';
import { ClockEvents, ConsumerSubject, Instrument, MathUtils, Publisher, Subscription } from '@microsoft/msfs-sdk';

import { PFDSimvars } from './PFDSimvarPublisher';
import { LagFilter } from 'instruments/src/PFD/PFDUtils';

export interface Arinc429Values {
  pitchAr: Arinc429WordData;
  rollAr: Arinc429Word;

  /** The "displayed altitude" in feet. It's baro corrected for QFE/QNH modes, otherwise pressure alt. */
  altitudeAr: Arinc429Word;

  magTrack: Arinc429Word;
  magHeading: Arinc429Word;
  speedAr: Arinc429Word;
  machAr: Arinc429Word;
  vs: Arinc429Word;
  gs: Arinc429Word;
  chosenRa: Arinc429Word;
  fpa: Arinc429Word;
  da: Arinc429Word;
  landingElevation: Arinc429Word;
  latAcc: Arinc429Word;
  fcdcDiscreteWord1: Arinc429Word;
  fcdc1DiscreteWord1: Arinc429Word;
  fcdc2DiscreteWord1: Arinc429Word;
  fcdc1DiscreteWord2: Arinc429Word;
  fcdc2DiscreteWord2: Arinc429Word;
  fcdcCaptPitchCommand: Arinc429Word;
  fcdcFoPitchCommand: Arinc429Word;
  fcdcCaptRollCommand: Arinc429Word;
  fcdcFoRollCommand: Arinc429Word;
  facToUse: number;
  vAlphaMax: Arinc429Word;
  vAlphaProt: Arinc429Word;
  vStallWarn: Arinc429Word;
  vMax: Arinc429Word;
  vFeNext: Arinc429Word;
  vCTrend: Arinc429Word;
  vMan: Arinc429Word;
  v4: Arinc429Word;
  v3: Arinc429Word;
  vLs: Arinc429Word;
  estimatedBeta: Arinc429Word;
  betaTarget: Arinc429Word;
  irMaintWord: Arinc429Word;
  trueHeading: Arinc429Word;
  trueTrack: Arinc429Word;
  fmEisDiscreteWord1Raw: number;
  fmEisDiscreteWord2Raw: number;
  fmMdaRaw: number;
  fmDhRaw: number;
  fmTransAltRaw: number;
  fmTransLvlRaw: number;
  ecu1MaintenanceWord6: Arinc429Word;
  ecu2MaintenanceWord6: Arinc429Word;
}
export class ArincValueProvider implements Instrument {
  private readonly sub = this.bus.getSubscriber<ClockEvents & FcuBus & PFDSimvars>();

  private roll = new Arinc429Word(0);

  private pitch = Arinc429Register.empty();

  private magTrack = new Arinc429Word(0);

  private heading = new Arinc429Word(0);

  private speed = new Arinc429Word(0);

  /** Displayed altitude. */
  private readonly altitude = Arinc429RegisterSubject.createEmpty();

  private readonly unfilteredAltitude = Arinc429RegisterSubject.createEmpty();

  private readonly baroCorrectedAltitude = Arinc429LocalVarConsumerSubject.create(this.sub.on('baroCorrectedAltitude'));

  private readonly pressureAltitude = Arinc429LocalVarConsumerSubject.create(this.sub.on('pressureAltitude'));

  private readonly altitudeFilter = new LagFilter(1 / 0.3);
  private lastAltitudeFilterTime = -1;

  private readonly fcuDiscrete2 = Arinc429ConsumerSubject.create(this.sub.on('fcuEisDiscreteWord2'));

  private mach = new Arinc429Word(0);

  private vsInert = new Arinc429Word(0);

  private vsBaro = new Arinc429Word(0);

  private groundSpeed = new Arinc429Word(0);

  private ownRadioAltitude = new Arinc429Word(0);

  private oppRadioAltitude = new Arinc429Word(0);

  private fpa = new Arinc429Word(0);

  private da = new Arinc429Word(0);

  private ownLandingElevation = new Arinc429Word(0);

  private oppLandingElevation = new Arinc429Word(0);

  private latAcc = new Arinc429Word(0);

  private fcdc1DiscreteWord1 = new Arinc429Word(0);

  private fcdc2DiscreteWord1 = new Arinc429Word(0);

  private fcdc1DiscreteWord2 = new Arinc429Word(0);

  private fcdc2DiscreteWord2 = new Arinc429Word(0);

  private fcdcToUse = 0;

  private fac1Healthy = false;

  private fac2Healthy = false;

  private fac1VAlphaMax = new Arinc429Word(0);

  private fac2VAlphaMax = new Arinc429Word(0);

  private facToUse = 0;

  private readonly fm1Healthy = ConsumerSubject.create(null, 0);

  private readonly fm2Healthy = ConsumerSubject.create(null, 0);

  private readonly fm1Subs: Subscription[] = [];

  private readonly fm2Subs: Subscription[] = [];

  // each alti source should have a pipe, and only one pipe should be unpaused at a time
  private readonly baroAltitudePipe = this.baroCorrectedAltitude.pipe(this.unfilteredAltitude, true);
  private readonly pressureAltitudePipe = this.pressureAltitude.pipe(this.unfilteredAltitude, true);

  constructor(private readonly bus: ArincEventBus) {}

  /** @inheritdoc */
  public init() {
    const publisher = this.bus.getPublisher<Arinc429Values>();
    const subscriber = this.bus.getSubscriber<FcuBus & PFDSimvars>();

    subscriber.on('pitch').handle((p) => {
      this.pitch.set(p);
      publisher.pub('pitchAr', this.pitch);
    });
    subscriber.on('roll').handle((p) => {
      this.roll = new Arinc429Word(p);
      publisher.pub('rollAr', this.roll);
    });
    subscriber.on('magTrackRaw').handle((gt) => {
      this.magTrack = new Arinc429Word(gt);
      publisher.pub('magTrack', this.magTrack);
    });
    subscriber.on('magHeadingRaw').handle((h) => {
      this.heading = new Arinc429Word(h);
      publisher.pub('magHeading', this.heading);
    });

    subscriber.on('speed').handle((s) => {
      this.speed = new Arinc429Word(s);
      publisher.pub('speedAr', this.speed);
    });

    this.altitude.sub((v) => publisher.pub('altitudeAr', v));

    this.fcuDiscrete2.sub((v) => {
      // default to STD if FCU invalid
      const isStd = v.bitValue(28) || v.isFailureWarning();
      if (isStd) {
        this.baroAltitudePipe.pause();
        this.pressureAltitudePipe.resume(true);
      } else {
        this.pressureAltitudePipe.pause();
        this.baroAltitudePipe.resume(true);
      }
    }, true);

    subscriber.on('mach').handle((m) => {
      this.mach = new Arinc429Word(m);
      publisher.pub('machAr', this.mach);
    });

    subscriber.on('vsInert').handle((ivs) => {
      this.vsInert = new Arinc429Word(ivs);

      if (this.vsInert.isNormalOperation()) {
        publisher.pub('vs', this.vsInert);
      }
    });

    subscriber.on('vsBaro').handle((vsb) => {
      this.vsBaro = new Arinc429Word(vsb);
      if (!this.vsInert.isNormalOperation()) {
        publisher.pub('vs', this.vsBaro);
      }
    });

    subscriber.on('groundSpeed').handle((gs) => {
      this.groundSpeed = new Arinc429Word(gs);
      publisher.pub('gs', this.groundSpeed);
    });

    subscriber.on('radioAltitude1').handle((ra) => {
      if (getDisplayIndex() === 1) {
        this.ownRadioAltitude = new Arinc429Word(ra);
      } else {
        this.oppRadioAltitude = new Arinc429Word(ra);
      }
      this.determineAndPublishChosenRadioAltitude(publisher);
    });

    subscriber.on('radioAltitude2').handle((ra) => {
      if (getDisplayIndex() === 2) {
        this.ownRadioAltitude = new Arinc429Word(ra);
      } else {
        this.oppRadioAltitude = new Arinc429Word(ra);
      }
      this.determineAndPublishChosenRadioAltitude(publisher);
    });

    subscriber.on('fpaRaw').handle((fpa) => {
      this.fpa = new Arinc429Word(fpa);
      publisher.pub('fpa', this.fpa);
    });

    subscriber.on('daRaw').handle((da) => {
      this.da = new Arinc429Word(da);
      publisher.pub('da', this.da);
    });

    subscriber.on('landingElevation1Raw').handle((elevation) => {
      if (getDisplayIndex() === 1) {
        this.ownLandingElevation = new Arinc429Word(elevation);
      } else {
        this.oppLandingElevation = new Arinc429Word(elevation);
      }
      this.determineAndPublishChosenLandingElevation(publisher);
    });

    subscriber.on('landingElevation2Raw').handle((elevation) => {
      if (getDisplayIndex() === 1) {
        this.ownLandingElevation = new Arinc429Word(elevation);
      } else {
        this.oppLandingElevation = new Arinc429Word(elevation);
      }
      this.determineAndPublishChosenLandingElevation(publisher);
    });

    subscriber.on('latAccRaw').handle((latAcc) => {
      this.latAcc = new Arinc429Word(latAcc);
      publisher.pub('latAcc', this.latAcc);
    });

    subscriber.on('fcdc1DiscreteWord1Raw').handle((discreteWord1) => {
      this.fcdc1DiscreteWord1 = new Arinc429Word(discreteWord1);
      this.fcdcToUse = this.determineFcdcToUse();
      publisher.pub('fcdc1DiscreteWord1', this.fcdc1DiscreteWord1);
      if (this.fcdcToUse === 1) {
        publisher.pub('fcdcDiscreteWord1', this.fcdc1DiscreteWord1);
      }
    });

    subscriber.on('fcdc2DiscreteWord1Raw').handle((discreteWord1) => {
      this.fcdc2DiscreteWord1 = new Arinc429Word(discreteWord1);
      this.fcdcToUse = this.determineFcdcToUse();
      publisher.pub('fcdc2DiscreteWord1', this.fcdc2DiscreteWord1);
      if (this.fcdcToUse === 2) {
        publisher.pub('fcdcDiscreteWord1', this.fcdc2DiscreteWord1);
      }
    });

    subscriber.on('fcdc1DiscreteWord2Raw').handle((discreteWord2) => {
      this.fcdc1DiscreteWord2 = new Arinc429Word(discreteWord2);
      publisher.pub('fcdc1DiscreteWord2', this.fcdc1DiscreteWord2);
    });

    subscriber.on('fcdc2DiscreteWord2Raw').handle((discreteWord2) => {
      this.fcdc2DiscreteWord2 = new Arinc429Word(discreteWord2);
      publisher.pub('fcdc2DiscreteWord2', this.fcdc2DiscreteWord2);
    });

    subscriber.on('fcdc1CaptPitchCommandRaw').handle((word) => {
      if (this.fcdcToUse === 1) {
        publisher.pub('fcdcCaptPitchCommand', new Arinc429Word(word));
      }
    });

    subscriber.on('fcdc2CaptPitchCommandRaw').handle((word) => {
      if (this.fcdcToUse === 2) {
        publisher.pub('fcdcCaptPitchCommand', new Arinc429Word(word));
      }
    });

    subscriber.on('fcdc1FoPitchCommandRaw').handle((word) => {
      if (this.fcdcToUse === 1) {
        publisher.pub('fcdcFoPitchCommand', new Arinc429Word(word));
      }
    });

    subscriber.on('fcdc2FoPitchCommandRaw').handle((word) => {
      if (this.fcdcToUse === 2) {
        publisher.pub('fcdcFoPitchCommand', new Arinc429Word(word));
      }
    });

    subscriber.on('fcdc1CaptRollCommandRaw').handle((word) => {
      if (this.fcdcToUse === 1) {
        publisher.pub('fcdcCaptRollCommand', new Arinc429Word(word));
      }
    });

    subscriber.on('fcdc2CaptRollCommandRaw').handle((word) => {
      if (this.fcdcToUse === 2) {
        publisher.pub('fcdcCaptRollCommand', new Arinc429Word(word));
      }
    });

    subscriber.on('fcdc1FoRollCommandRaw').handle((word) => {
      if (this.fcdcToUse === 1) {
        publisher.pub('fcdcFoRollCommand', new Arinc429Word(word));
      }
    });

    subscriber.on('fcdc2FoRollCommandRaw').handle((word) => {
      if (this.fcdcToUse === 2) {
        publisher.pub('fcdcFoRollCommand', new Arinc429Word(word));
      }
    });

    subscriber.on('fac1Healthy').handle((val) => {
      this.fac1Healthy = val;
      this.determineFacToUse(publisher);
    });

    subscriber.on('fac2Healthy').handle((val) => {
      this.fac2Healthy = val;
      this.determineFacToUse(publisher);
    });

    subscriber.on('fac1VAlphaMaxRaw').handle((word) => {
      this.fac1VAlphaMax = new Arinc429Word(word);
      this.determineFacToUse(publisher);
      if (this.facToUse === 1) {
        publisher.pub('vAlphaMax', this.fac1VAlphaMax);
      } else if (this.facToUse === 0) {
        publisher.pub('vAlphaMax', new Arinc429Word(0));
      }
    });

    subscriber.on('fac2VAlphaMaxRaw').handle((word) => {
      this.fac2VAlphaMax = new Arinc429Word(word);
      this.determineFacToUse(publisher);
      if (this.facToUse === 2) {
        publisher.pub('vAlphaMax', this.fac2VAlphaMax);
      }
    });

    subscriber.on('fac1VAlphaProtRaw').handle((word) => {
      if (this.facToUse === 1) {
        publisher.pub('vAlphaProt', new Arinc429Word(word));
      } else if (this.facToUse === 0) {
        publisher.pub('vAlphaProt', new Arinc429Word(0));
      }
    });

    subscriber.on('fac2VAlphaProtRaw').handle((word) => {
      if (this.facToUse === 2) {
        publisher.pub('vAlphaProt', new Arinc429Word(word));
      }
    });

    subscriber.on('fac1VStallWarnRaw').handle((word) => {
      if (this.facToUse === 1) {
        publisher.pub('vStallWarn', new Arinc429Word(word));
      } else if (this.facToUse === 0) {
        publisher.pub('vStallWarn', new Arinc429Word(0));
      }
    });

    subscriber.on('fac2VStallWarnRaw').handle((word) => {
      if (this.facToUse === 2) {
        publisher.pub('vStallWarn', new Arinc429Word(word));
      }
    });

    subscriber.on('fac1VMaxRaw').handle((word) => {
      if (this.facToUse === 1) {
        publisher.pub('vMax', new Arinc429Word(word));
      } else if (this.facToUse === 0) {
        publisher.pub('vMax', new Arinc429Word(0));
      }
    });

    subscriber.on('fac2VMaxRaw').handle((word) => {
      if (this.facToUse === 2) {
        publisher.pub('vMax', new Arinc429Word(word));
      }
    });

    subscriber.on('fac1VFeNextRaw').handle((word) => {
      if (this.facToUse === 1) {
        publisher.pub('vFeNext', new Arinc429Word(word));
      } else if (this.facToUse === 0) {
        publisher.pub('vFeNext', new Arinc429Word(0));
      }
    });

    subscriber.on('fac2VFeNextRaw').handle((word) => {
      if (this.facToUse === 2) {
        publisher.pub('vFeNext', new Arinc429Word(word));
      }
    });

    subscriber.on('fac1VCTrendRaw').handle((word) => {
      if (this.facToUse === 1) {
        publisher.pub('vCTrend', new Arinc429Word(word));
      } else if (this.facToUse === 0) {
        publisher.pub('vCTrend', new Arinc429Word(0));
      }
    });

    subscriber.on('fac2VCTrendRaw').handle((word) => {
      if (this.facToUse === 2) {
        publisher.pub('vCTrend', new Arinc429Word(word));
      }
    });

    subscriber.on('fac1VManRaw').handle((word) => {
      if (this.facToUse === 1) {
        publisher.pub('vMan', new Arinc429Word(word));
      } else if (this.facToUse === 0) {
        publisher.pub('vMan', new Arinc429Word(0));
      }
    });

    subscriber.on('fac2VManRaw').handle((word) => {
      if (this.facToUse === 2) {
        publisher.pub('vMan', new Arinc429Word(word));
      }
    });

    subscriber.on('fac1V4Raw').handle((word) => {
      if (this.facToUse === 1) {
        publisher.pub('v4', new Arinc429Word(word));
      } else if (this.facToUse === 0) {
        publisher.pub('v4', new Arinc429Word(0));
      }
    });

    subscriber.on('fac2V4Raw').handle((word) => {
      if (this.facToUse === 2) {
        publisher.pub('v4', new Arinc429Word(word));
      }
    });

    subscriber.on('fac1V3Raw').handle((word) => {
      if (this.facToUse === 1) {
        publisher.pub('v3', new Arinc429Word(word));
      } else if (this.facToUse === 0) {
        publisher.pub('v3', new Arinc429Word(0));
      }
    });

    subscriber.on('fac2V3Raw').handle((word) => {
      if (this.facToUse === 2) {
        publisher.pub('v3', new Arinc429Word(word));
      }
    });

    subscriber.on('fac1VLsRaw').handle((word) => {
      if (this.facToUse === 1) {
        publisher.pub('vLs', new Arinc429Word(word));
      } else if (this.facToUse === 0) {
        publisher.pub('vLs', new Arinc429Word(0));
      }
    });

    subscriber.on('fac2VLsRaw').handle((word) => {
      if (this.facToUse === 2) {
        publisher.pub('vLs', new Arinc429Word(word));
      }
    });

    subscriber.on('fac1EstimatedBetaRaw').handle((word) => {
      if (this.facToUse === 1) {
        publisher.pub('estimatedBeta', new Arinc429Word(word));
      } else if (this.facToUse === 0) {
        publisher.pub('estimatedBeta', new Arinc429Word(0));
      }
    });

    subscriber.on('fac2EstimatedBetaRaw').handle((word) => {
      if (this.facToUse === 2) {
        publisher.pub('estimatedBeta', new Arinc429Word(word));
      }
    });

    subscriber.on('fac1BetaTargetRaw').handle((word) => {
      if (this.facToUse === 1) {
        publisher.pub('betaTarget', new Arinc429Word(word));
      } else if (this.facToUse === 0) {
        publisher.pub('betaTarget', new Arinc429Word(0));
      }
    });

    subscriber.on('fac2BetaTargetRaw').handle((word) => {
      if (this.facToUse === 2) {
        publisher.pub('betaTarget', new Arinc429Word(word));
      }
    });

    subscriber.on('irMaintWordRaw').handle((word) => {
      publisher.pub('irMaintWord', new Arinc429Word(word));
    });

    subscriber.on('trueHeadingRaw').handle((word) => {
      publisher.pub('trueHeading', new Arinc429Word(word));
    });

    subscriber.on('trueTrackRaw').handle((word) => {
      publisher.pub('trueTrack', new Arinc429Word(word));
    });

    this.fm1Subs.push(
      subscriber.on('fm1EisDiscrete2Raw').handle((raw) => publisher.pub('fmEisDiscreteWord2Raw', raw), true),
    );
    this.fm2Subs.push(
      subscriber.on('fm2EisDiscrete2Raw').handle((raw) => publisher.pub('fmEisDiscreteWord2Raw', raw), true),
    );
    this.fm1Subs.push(subscriber.on('fm1MdaRaw').handle((raw) => publisher.pub('fmMdaRaw', raw), true));
    this.fm2Subs.push(subscriber.on('fm2MdaRaw').handle((raw) => publisher.pub('fmMdaRaw', raw), true));
    this.fm1Subs.push(subscriber.on('fm1DhRaw').handle((raw) => publisher.pub('fmDhRaw', raw), true));
    this.fm2Subs.push(subscriber.on('fm2DhRaw').handle((raw) => publisher.pub('fmDhRaw', raw), true));
    this.fm1Subs.push(subscriber.on('fm1TransAltRaw').handle((raw) => publisher.pub('fmTransAltRaw', raw), true));
    this.fm2Subs.push(subscriber.on('fm2TransAltRaw').handle((raw) => publisher.pub('fmTransAltRaw', raw), true));
    this.fm1Subs.push(subscriber.on('fm1TransLvlRaw').handle((raw) => publisher.pub('fmTransLvlRaw', raw), true));
    this.fm2Subs.push(subscriber.on('fm2TransLvlRaw').handle((raw) => publisher.pub('fmTransLvlRaw', raw), true));

    this.fm1Healthy.setConsumer(subscriber.on('fm1HealthyDiscrete'));
    this.fm2Healthy.setConsumer(subscriber.on('fm2HealthyDiscrete'));
    this.fm1Healthy.sub(this.determineFmToUse.bind(this));
    this.fm2Healthy.sub(this.determineFmToUse.bind(this), true);

    subscriber.on('ecu1MaintenanceWord6Raw').handle((word) => {
      publisher.pub('ecu1MaintenanceWord6', new Arinc429Word(word));
    });

    subscriber.on('ecu2MaintenanceWord6Raw').handle((word) => {
      publisher.pub('ecu2MaintenanceWord6', new Arinc429Word(word));
    });

    // Do the filter at hi freq for accuracy, but we don't want to publish the ARINC word at hi-freq
    // as hi-frequency SVG redraws would be very bad.
    this.sub.on('simTimeHiFreq').handle((time) => {
      const deltaTime = MathUtils.clamp(time - this.lastAltitudeFilterTime, 0, 300);
      this.lastAltitudeFilterTime = time;

      this.altitudeFilter.step(this.unfilteredAltitude.get().value, deltaTime / 1000);
    });
  }

  /** @inheritdoc */
  public onUpdate(): void {
    this.altitude.setValueSsm(this.altitudeFilter.previousOutput(), this.unfilteredAltitude.get().ssm);
  }

  private determineAndPublishChosenRadioAltitude(publisher: Publisher<Arinc429Values>) {
    const ownRadioAltitudeHasData =
      !this.ownRadioAltitude.isFailureWarning() && !this.ownRadioAltitude.isNoComputedData();
    const oppRadioAltitudeHasData =
      !this.oppRadioAltitude.isFailureWarning() && !this.oppRadioAltitude.isNoComputedData();
    const chosenRadioAltitude =
      // the own RA has no data and the opposite one has data
      (!ownRadioAltitudeHasData && oppRadioAltitudeHasData) ||
      // the own RA has FW and the opposite has NCD
      (this.ownRadioAltitude.isFailureWarning() && this.oppRadioAltitude.isNoComputedData())
        ? this.oppRadioAltitude
        : this.ownRadioAltitude;

    publisher.pub('chosenRa', chosenRadioAltitude);
  }

  private determineAndPublishChosenLandingElevation(publisher: Publisher<Arinc429Values>) {
    const useOpposite =
      (this.ownLandingElevation.isFailureWarning() || this.ownLandingElevation.isNoComputedData()) &&
      !this.oppLandingElevation.isFailureWarning() &&
      !this.oppLandingElevation.isNoComputedData();

    if (useOpposite) {
      publisher.pub('landingElevation', this.oppLandingElevation);
    } else {
      publisher.pub('landingElevation', this.ownLandingElevation);
    }
  }

  private determineFcdcToUse() {
    if (getDisplayIndex() === 1) {
      if (
        (this.fcdc1DiscreteWord1.isFailureWarning() && !this.fcdc2DiscreteWord1.isFailureWarning()) ||
        (!this.fcdc1DiscreteWord1.bitValueOr(24, false) && this.fcdc2DiscreteWord1.bitValueOr(24, false))
      ) {
        return 2;
      }
      return 1;
    }
    if (
      !(
        (!this.fcdc1DiscreteWord1.isFailureWarning() && this.fcdc2DiscreteWord1.isFailureWarning()) ||
        (this.fcdc1DiscreteWord1.bitValueOr(24, false) && !this.fcdc2DiscreteWord1.bitValueOr(24, false))
      )
    ) {
      return 2;
    }
    return 1;
  }

  // Determine which FAC bus to use for FE function. If FAC HEALTHY discrete is low or any word is coded FW,
  // declare FAC as invalid. For simplicty reasons, only check SSM of words that use the same data, so all failure cases are
  // handled while minimizing the words that have to be checked.
  // Left PFD uses FAC 1 when both are valid, the right PFD uses FAC 2. In case of invalidity, switchover is performed.
  // If no FAC is valid, set facToUse to 0. This causes the SPD LIM flag to be displayed.
  private determineFacToUse(publisher: Publisher<Arinc429Values>) {
    const fac1Valid = this.fac1Healthy && !this.fac1VAlphaMax.isFailureWarning();
    const fac2Valid = this.fac2Healthy && !this.fac2VAlphaMax.isFailureWarning();
    if (getDisplayIndex() === 1 && fac1Valid) {
      this.facToUse = 1;
    } else if (getDisplayIndex() === 2 && fac2Valid) {
      this.facToUse = 2;
    } else if (fac1Valid) {
      this.facToUse = 1;
    } else if (fac2Valid) {
      this.facToUse = 2;
    } else {
      this.facToUse = 0;
    }

    publisher.pub('facToUse', this.facToUse);
  }

  private determineFmToUse(): void {
    const onSideIndex = MathUtils.clamp(getDisplayIndex(), 1, 2);

    const onlyFm1Healthy = this.fm1Healthy.get() && !this.fm2Healthy.get();
    const onlyFm2Healthy = this.fm2Healthy.get() && !this.fm1Healthy.get();

    if ((onSideIndex === 1 && !onlyFm2Healthy) || onlyFm1Healthy) {
      this.fm2Subs.forEach((sub) => sub.pause());
      this.fm1Subs.forEach((sub) => sub.resume(true));
    } else if ((onSideIndex === 2 && !onlyFm1Healthy) || onlyFm2Healthy) {
      this.fm1Subs.forEach((sub) => sub.pause());
      this.fm2Subs.forEach((sub) => sub.resume(true));
    }
  }
}
